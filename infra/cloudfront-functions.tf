# -----------------------------------------------------------------------------
# CloudFront Functions for path rewriting
# -----------------------------------------------------------------------------

# Strip the /demos/arena prefix so S3 receives the correct key.
# Request for /demos/arena/assets/foo.js → S3 key: assets/foo.js
# Request for /demos/arena/ → S3 key: index.html
resource "aws_cloudfront_function" "arena_rewrite" {
  name    = "${var.project_name}-arena-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true

  code = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      // Rewrite bare directory requests to index.html.
      // Files are stored in S3 under the demos/arena/ prefix so
      // no path stripping is needed — only the directory fallback.
      if (uri === '/demos/arena' || uri === '/demos/arena/') {
        uri = '/demos/arena/index.html';
      }

      request.uri = uri;
      return request;
    }
  EOF
}
