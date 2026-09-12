#!/usr/bin/env bash
# Push the site to S3 and clear the CloudFront edge.
#
#   BUCKET=vibencode-site DISTRIBUTION=E123ABC456DEF ./deploy/deploy.sh
#
# Add --dryrun as an argument to see what would move without moving it.
set -euo pipefail

: "${BUCKET:?set BUCKET, e.g. BUCKET=vibencode-site}"
: "${DISTRIBUTION:?set DISTRIBUTION, e.g. DISTRIBUTION=E123ABC456DEF}"
DRY=("$@")

cd "$(dirname "$0")/.."

# Repo furniture that is not the website.
EXCLUDE=(
  --exclude ".git/*"
  --exclude ".claude/*"
  --exclude "deploy/*"
  --exclude "README.md"
  --exclude ".gitignore"
  --exclude ".nojekyll"
)

# ---- 1. assets ------------------------------------------------------------
# Every stylesheet, script and image is requested with a ?v= token in the URL,
# so a given URL's bytes never change and a year is safe. The token is what
# expires them, not the clock - which only works if the CloudFront cache
# policy keeps query strings in the cache key. See README.
echo "-> assets"
aws s3 sync . "s3://$BUCKET" "${EXCLUDE[@]}" \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable" \
  "${DRY[@]}"

# ---- 2. html, sitemap, robots --------------------------------------------
# Revalidated on every request: these have no token, and a stale one points at
# the wrong asset version. --delete runs on this pass, where nothing is
# filtered out, so it prunes what has left the repo rather than what an
# earlier --exclude happened to hide.
echo "-> pages"
aws s3 sync . "s3://$BUCKET" "${EXCLUDE[@]}" \
  --cache-control "public, max-age=0, must-revalidate" \
  --delete \
  "${DRY[@]}"

# ---- 3. the one type the CLI guesses wrong -------------------------------
# aws-cli has no mapping for .webmanifest and uploads it as
# binary/octet-stream, which browsers refuse to parse as a manifest.
if [ ${#DRY[@]} -eq 0 ]; then
  echo "-> site.webmanifest content type"
  aws s3 cp site.webmanifest "s3://$BUCKET/site.webmanifest" \
    --content-type "application/manifest+json" \
    --cache-control "public, max-age=0, must-revalidate"

  # ---- 4. edge ------------------------------------------------------------
  # One path, so one invalidation against the monthly free allowance. The ?v=
  # tokens already handle the browser; this handles the edge, which has no way
  # to know an HTML file it is holding was replaced.
  echo "-> invalidating"
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION" --paths "/*" \
    --query 'Invalidation.Id' --output text
fi

echo "done"
