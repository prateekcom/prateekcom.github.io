# Deploying to S3 + CloudFront

`./deploy.sh` handles the files. Everything below is distribution config that
cannot live in the repo, and two of them will break the site silently if they
are wrong.

## Origin

S3 **REST** endpoint with Origin Access Control, not the website endpoint.
The bucket stays private and is reachable only through CloudFront. That is
what makes `deploy/index-rewrite.js` necessary — see below.

- Default root object: `index.html`
- Compress objects automatically: **on**

## The two that fail quietly

**1. Query strings must be in the cache key.** Every stylesheet, script and
image on this site is requested with a `?v=` token, and that token is the
only thing that expires them — they are served `immutable` for a year.
CloudFront's default `CachingOptimized` policy **strips query strings from the
cache key**, so `?v=A` and `?v=B` would be the same cached object and a deploy
would change nothing for anybody holding the old one. Use a cache policy with
query strings set to **all** (or allow-list `v`).

**2. The index rewrite.** Twenty-four pages live at `/<name>/index.html` and
are linked as `/<name>/`. A REST origin does not resolve that, so without the
function every page except the root answers 403. Publish
`deploy/index-rewrite.js` as a CloudFront Function and associate it with
**viewer request** on the default behaviour. It also 301s `/about` to
`/about/`, which is the form every canonical on the site uses.

## Error pages

Both, with the status code preserved — a 404 served as 200 is a soft 404 and
Google will index it.

| HTTP error code | Response page | Response code |
|---|---|---|
| 403 | `/404.html` | 404 |
| 404 | `/404.html` | 404 |

403 is in there because a REST origin returns 403, not 404, for an object that
is not in the bucket.

## Certificate

ACM, and it must be issued in **us-east-1** whatever region the bucket is in —
CloudFront reads certificates from there and nowhere else. Validate by DNS.

## DNS

The domain is registered at Hostinger, whose zone editor supports A, AAAA,
CNAME, MX, TXT, NS, SRV and CAA — and no ALIAS, ANAME or CNAME flattening.
CloudFront has no fixed IPs and DNS forbids a CNAME at the apex, so
`vibencode.com` **cannot** be pointed at CloudFront from Hostinger's DNS.

Keep the registration at Hostinger and move the nameservers to Route 53, which
has ALIAS at the apex. Order:

1. Create the hosted zone in Route 53 and copy the existing records into it.
2. Change the nameservers in hPanel to the four Route 53 gives you.
3. Request the ACM certificate in us-east-1; add its validation records.
4. Build bucket, distribution, function, error pages.
5. Point an A/ALIAS record for the apex at the distribution.

## After cutover

- Delete `.nojekyll`. It exists only for GitHub Pages, which would otherwise
  let Jekyll skip `work/_template/` for starting with an underscore. Harmless
  on S3, but it is not part of the site.
- `og:image` on all 24 pages is absolute to `https://vibencode.com/...`. Those
  URLs 404 today because the domain still answers from Hostinger; they start
  working the moment the apex points at CloudFront, with no change to the
  markup.
