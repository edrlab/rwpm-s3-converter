# rwpm-s3-converter

Input : 
- bearer token in Authorization header 
- Query param: 
  - url: manifest s3 object url
  - id: project identifier

Fn: HTTPS google cloud function

Output : 
- RWPM manifest json (application/json) with mp3 url presigned (direct download)

## URL

https://us-central1-edrlab-1.cloudfunctions.net/manifest

## CELA

`curl -H "Authorization: Bearer <TOKEN>" --request GET ttps://us-central1-edrlab-1.cloudfunctions.net/manifest?id=<CELA_ID>&URL=<S3_MANIFEST_URL>`

#### ENV

- CELA_CLIENT_ID : cela id (query param)
- CELA_ACCESS_URL : authentication test url
- CELA_ACCESS_KEY_ID : s3
- CELA_SECRET_ACCESS_KEY_ID : s3
- CELA_REGIONS : s3

## quickstart

- `npm install`
- `npm compile`
- `npm start`


## CI CD

https://console.cloud.google.com/cloud-build/builds?project=edrlab-1

see `cloudbuild.yaml`