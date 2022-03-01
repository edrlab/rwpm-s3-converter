import {HttpRequest} from '@aws-sdk/protocol-http';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {parseUrl} from '@aws-sdk/url-parser';
import {formatUrl} from '@aws-sdk/util-format-url';
import {ok} from 'assert';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {
  IReadingLink,
  IWebPubView,
} from 'opds-fetcher-parser/build/src/interface/webpub';
import validator from 'validator';

export class Service {
  private fetcher: OpdsFetcher | undefined;
  private signer: S3RequestPresigner | undefined;

  constructor(fetcher?: OpdsFetcher, signer?: S3RequestPresigner) {
    this.fetcher = fetcher;
    this.signer = signer;
  }

  public setup(fetcher: OpdsFetcher, signer: S3RequestPresigner) {
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
    const request = await this.signer.presign(new HttpRequest(s3ObjectUrl));
    const url = formatUrl(request);
    console.log('PRESIGNED URL: ', url);

    return url;
  }

  private async fetchWepub(webpubUrl: string) {
    if (!validator.isURL(webpubUrl)) {
      throw new Error('url not valid');
    }
    ok(this.fetcher);

    const data = await this.fetcher.webpubRequest(webpubUrl);
    return data;
  }

  private findMp3LinksFromManifest(webpub: IWebPubView): IReadingLink[] {
    const readingOrders = Array.isArray(webpub.readingOrders)
      ? webpub.readingOrders
      : [];
    const toc = Array.isArray(webpub.toc) ? webpub.toc : [];
    const links = [...readingOrders, ...toc];
    return links;
  }

  private checksMp3LinksFromManifest(links: IReadingLink[]) {
    for (const v of links) {
      if (!validator.isURL(v?.url)) {
        throw new Error('not a valid s3 url');
      }
    }
  }

  private extractOriginAndPathnameFromUrl(url: string): string {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  }

  private collectUrl(links: IReadingLink[]): Set<string> {
    const s = new Set<string>();
    for (const v of links) {
      s.add(this.extractOriginAndPathnameFromUrl(v.url));
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

  private mapSignUrl(
    link: IReadingLink,
    mapUrl: Map<string, string>
  ): IReadingLink {
    const url = this.extractOriginAndPathnameFromUrl(link.url);
    const sign = mapUrl.get(url);
    if (!sign) {
      throw new Error('no presigned url');
    }
    link.url = this.mergeUrl(link.url, sign);
    return link;
  }

  private replaceUrl(
    webpub: IWebPubView,
    mapUrl: Map<string, string>
  ): IWebPubView {
    webpub.readingOrders = webpub.readingOrders.map(link =>
      this.mapSignUrl(link, mapUrl)
    );
    webpub.toc = Array.isArray(webpub.toc)
      ? webpub.toc.map(link => this.mapSignUrl(link, mapUrl))
      : undefined;

    return webpub;
  }

  public async start(s3url: string): Promise<IWebPubView> {
    const s3SignedUrl = await this.presign(s3url);
    const webpub = await this.fetchWepub(s3SignedUrl);
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
