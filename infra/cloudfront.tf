# -----------------------------------------------------------------------------
# Shared CloudFront distribution with path-based routing
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name} (${var.environment})"
  price_class         = "PriceClass_100"
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  # --- Origins ---

  # Landing page / default
  origin {
    domain_name              = aws_s3_bucket.landing.bucket_regional_domain_name
    origin_id                = "s3-landing"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # Arena demo
  origin {
    domain_name              = aws_s3_bucket.arena.bucket_regional_domain_name
    origin_id                = "s3-arena"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # --- Cache behaviors ---

  # Arena demo: exact /demos/arena (no trailing slash)
  ordered_cache_behavior {
    path_pattern           = "/demos/arena"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-arena"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.arena_rewrite.arn
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Arena demo: /demos/arena/*
  ordered_cache_behavior {
    path_pattern           = "/demos/arena/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-arena"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.arena_rewrite.arn
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Default: landing page
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-landing"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # NOTE: Do NOT add custom_error_response here. In a multi-origin setup,
  # response_page_path always serves from the DEFAULT origin (landing),
  # which poisons arena requests with the landing page. SPA fallback is
  # handled per-origin via CloudFront Functions instead.

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
