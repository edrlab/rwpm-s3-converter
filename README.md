# rwpm-s3-converter

Input : 
- bearer token in Authorization header 
- Query param: 
  - url: manifest s3 object url
  - id: project identifier

Fn: HTTPS google cloud function

Output : 
- RWPM manifest json (application/json) with mp3 url presigned (direct download)

