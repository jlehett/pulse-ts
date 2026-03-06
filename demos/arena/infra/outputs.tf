output "websocket_api_endpoint" {
  description = "WebSocket API endpoint URL for the signaling server"
  value       = aws_apigatewayv2_stage.signaling.invoke_url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for lobby state"
  value       = aws_dynamodb_table.lobbies.name
}

output "kvs_channel_arn" {
  description = "Kinesis Video Streams channel ARN for TURN relay"
  value       = local.kvs_channel_arn
}
