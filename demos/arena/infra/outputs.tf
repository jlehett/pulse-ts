output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name for the frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for cache invalidation on deploy)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "websocket_api_endpoint" {
  description = "WebSocket API endpoint URL for the signaling server"
  value       = aws_apigatewayv2_stage.signaling.invoke_url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for lobby state"
  value       = aws_dynamodb_table.lobbies.name
}
