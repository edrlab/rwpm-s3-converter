import {HttpRequest} from '@aws-sdk/protocol-http';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {parseUrl} from '@aws-sdk/url-parser';
import {formatUrl} from '@aws-sdk/util-format-url';
import {ok} from 'assert';
import {Response} from 'node-fetch';
import validator from 'validator';
import {EXPIRE_IN_NUMBER} from './credentials';
import {urlPathResolve} from './resolveUrl';

type fetcher = (url: string) => Promise<Response>;

interface ILink {
  href: string;
}

export interface IWebpub {
  readingOrder: ILink[];
  resources?: ILink[];
  toc?: ILink[];
}

export class Service {
  private fetcher: fetcher | undefined;
  private signer: S3RequestPresigner | undefined;

  constructor(fetcher?: fetcher, signer?: S3RequestPresigner) {
    this.fetcher = fetcher;
    this.signer = signer;
  }

  public setup(fetcher: fetcher, signer: S3RequestPresigner) {
    if (!this.fetcher) {
      this.fetcher = fetcher;
    }
    if (!this.signer) {
      this.signer = signer;
    }
  }

  private async presign(s3url: string) {
    if (!validator.isURL(s3url)) {
      throw new Error('url not valid');
    }
    ok(this.signer);

    const s3ObjectUrl = parseUrl(s3url);
    // Create a GET request from S3 url.
    const request = await this.signer.presign(new HttpRequest(s3ObjectUrl), {
      expiresIn: EXPIRE_IN_NUMBER,
    });
    const url = formatUrl(request);
    console.log('PRESIGNED URL: ', url);

    return url;
  }

  private async fetchWepub(webpubUrl: string) {
    if (!validator.isURL(webpubUrl)) {
      throw new Error('url not valid');
    }
    ok(this.fetcher);

    const data = await this.fetcher(webpubUrl);

    if (!data.ok) {
      throw new Error('Cannot fetch webpuburl (' + data.status + ')');
    }
    const json = await data.json();
    return json;
  }

  private parseWebpub(webpub: any, base: string): IWebpub {
    if (!webpub || typeof webpub !== 'object') {
      throw new Error('not a valid json format');
    }

    const {readingOrder} = webpub;
    if (!Array.isArray(readingOrder)) {
      throw new Error('no readingOrder');
    }

    const resolveUrl = (v: ILink) => {
      if (!v?.href) {
        throw new Error('url undefined');
      }
      v.href = urlPathResolve(base, v.href);
    };
    (readingOrder as ILink[]).forEach(resolveUrl);
    const resources = webpub.resources;
    if (Array.isArray(resources)) {
      (resources as ILink[]).forEach(resolveUrl);
    } else {
      (webpub as IWebpub).resources = undefined;
    }
    const toc = webpub.toc;
    if (Array.isArray(toc)) {
      (toc as ILink[]).forEach(resolveUrl);
    } else {
      (webpub as IWebpub).resources = undefined;
    }

    return webpub;
  }

  private findMp3LinksFromManifest(webpub: IWebpub): ILink[] {
    const {readingOrder, toc, resources} = webpub;
    const links = [...readingOrder, ...(toc || []), ...(resources || [])];
    return links;
  }

  private checksMp3LinksFromManifest(links: ILink[]) {
    for (const v of links) {
      if (!validator.isURL(v?.href)) {
        throw new Error('not a valid s3 url');
      }
    }
  }

  private extractOriginAndPathnameFromUrl(url: string): string {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  }

  private collectUrl(links: ILink[]): Set<string> {
    const s = new Set<string>();
    for (const v of links) {
      s.add(this.extractOriginAndPathnameFromUrl(v.href));
    }

    return s;
  }

  private presignedMp3Url(setUrls: Set<string>): Map<string, Promise<string>> {
    const map = new Map<string, Promise<string>>();
    for (const url of setUrls) {
      // test if valid s3 url
      if (!validator.isURL(url)) {
        throw new Error('not a valid s3 url');
      }

      map.set(url, this.presign(url));
    }
    return map;
  }

  private mergeUrl(urlFromStr: string, urlToStr: string): string {
    const from = new URL(urlFromStr);
    const to = new URL(urlToStr);

    from.protocol = to.protocol;
    from.host = to.host;
    from.hostname = to.hostname;
    from.pathname = to.pathname;
    from.search = to.search;

    return from.toString();
  }

  private mapSignUrl(link: ILink, mapUrl: Map<string, string>): ILink {
    const url = this.extractOriginAndPathnameFromUrl(link.href);
    const sign = mapUrl.get(url);
    if (!sign) {
      throw new Error('no presigned url');
    }
    link.href = this.mergeUrl(link.href, sign);
    return link;
  }

  private replaceUrl(webpub: IWebpub, mapUrl: Map<string, string>): IWebpub {
    webpub.readingOrder = webpub.readingOrder.map(link =>
      this.mapSignUrl(link, mapUrl)
    );
    webpub.toc = Array.isArray(webpub.toc)
      ? webpub.toc.map(link => this.mapSignUrl(link, mapUrl))
      : undefined;
    webpub.resources = Array.isArray(webpub.resources)
      ? webpub.resources.map(link => this.mapSignUrl(link, mapUrl))
      : undefined;

    return webpub;
  }

  public async start(s3url: string): Promise<IWebpub> {
    const s3SignedUrl = await this.presign(s3url);
    const webpubRawJson = await this.fetchWepub(s3SignedUrl);

    // parse webpub
    const webpub = this.parseWebpub(webpubRawJson, s3url);

    const mp3Links = this.findMp3LinksFromManifest(webpub);
    this.checksMp3LinksFromManifest(mp3Links);
    const urlsSet = this.collectUrl(mp3Links);
    const presignedMp3UrlsMapPromises = this.presignedMp3Url(urlsSet);

    const promises = Array.from(presignedMp3UrlsMapPromises).map(([, v]) => v);
    const signedUrlArray = await Promise.all(promises);
    const keys = Array.from(presignedMp3UrlsMapPromises).map(([k]) => k);
    const mapArrayIterable = keys.map<[string, string]>((k, i) => [
      k,
      signedUrlArray[i],
    ]);

    const mapUrls = new Map<string, string>(mapArrayIterable);
    const newWebpub = this.replaceUrl(webpub, mapUrls);

    return newWebpub;
  }
}
