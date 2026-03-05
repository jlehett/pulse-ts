# -----------------------------------------------------------------------------
# API Gateway WebSocket API for signaling
# -----------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "signaling" {
  name                       = "${var.project_name}-signaling-${var.environment}"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_stage" "signaling" {
  api_id      = aws_apigatewayv2_api.signaling.id
  name        = var.environment
  auto_deploy = true
}

# Lambda integration (all routes use the same Lambda)
resource "aws_apigatewayv2_integration" "signaling" {
  api_id             = aws_apigatewayv2_api.signaling.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.signaling.invoke_arn
  integration_method = "POST"
}

# $connect route
resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.signaling.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.signaling.id}"
}

# $disconnect route
resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.signaling.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.signaling.id}"
}

# $default route (handles all other messages)
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.signaling.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.signaling.id}"
}
