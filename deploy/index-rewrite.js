/* CloudFront Function, viewer request.
 * ---------------------------------------------------------------------------
 * Twenty-four pages on this site live at /<name>/index.html and are linked as
 * /<name>/. An S3 website endpoint resolves that itself; an S3 REST origin
 * behind OAC - which is the setup worth having, because the bucket stays
 * private - does not. Without this function every page except the root
 * answers 403.
 *
 * Two jobs:
 *   /            and /about/   ->  serve the directory's index document
 *   /about                     ->  301 to /about/
 *
 * The redirect rather than a second silent rewrite is deliberate: every page
 * carries a canonical ending in a slash, so the slashless form should say so
 * with a status code instead of quietly serving the same bytes at a second
 * URL.
 *
 * Written against cloudfront-js-2.0 but using only string operations the 1.0
 * runtime also has, so it behaves the same on either.
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.charAt(uri.length - 1) === '/') {
    request.uri = uri + 'index.html';
    return request;
  }

  /* A dot in the last segment means a file was asked for by name - style.css,
     logo.png - and those are left exactly as they came in. */
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: uri + '/' + queryString(request.querystring) } }
    };
  }

  return request;
}

/* A redirect drops the query string unless it is rebuilt by hand. Nothing on
   this site puts parameters on a page URL any more, but a campaign tag or a
   utm_ on an inbound link would be lost silently, which is the worst way to
   lose one. */
function queryString(querystring) {
  var out = '';
  for (var key in querystring) {
    var param = querystring[key];
    if (param.multiValue) {
      for (var i = 0; i < param.multiValue.length; i++) {
        out += (out ? '&' : '') + key + '=' + param.multiValue[i].value;
      }
    } else {
      out += (out ? '&' : '') + key + (param.value ? '=' + param.value : '');
    }
  }
  return out ? '?' + out : '';
}
