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

      // Strip /demos/arena prefix
      uri = uri.replace(/^\/demos\/arena/, '');

      // Default to index.html for directory requests
      if (uri === '' || uri === '/') {
        uri = '/index.html';
      }

      request.uri = uri;
      return request;
    }
  EOF
}
