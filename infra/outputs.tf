output "domain_name" {
  description = "Project domain name"
  value       = var.domain_name
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.main.id
}

output "nameservers" {
  description = "Route 53 nameservers — set these in your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

output "arena_s3_bucket" {
  description = "S3 bucket name for the arena demo"
  value       = aws_s3_bucket.arena.id
}

output "landing_s3_bucket" {
  description = "S3 bucket name for the landing page"
  value       = aws_s3_bucket.landing.id
}
