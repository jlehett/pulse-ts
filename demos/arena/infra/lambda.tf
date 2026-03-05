# -----------------------------------------------------------------------------
# Lambda function for the WebSocket signaling server
# -----------------------------------------------------------------------------

data "archive_file" "signaling_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.build/signaling-lambda.zip"
}

resource "aws_lambda_function" "signaling" {
  function_name    = "${var.project_name}-signaling-${var.environment}"
  role             = aws_iam_role.lambda_signaling.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  filename         = data.archive_file.signaling_lambda.output_path
  source_code_hash = data.archive_file.signaling_lambda.output_base64sha256

  environment {
    variables = {
      LOBBIES_TABLE     = aws_dynamodb_table.lobbies.name
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
      WEBSOCKET_API_ID  = aws_apigatewayv2_api.signaling.id
      STAGE_NAME        = aws_apigatewayv2_stage.signaling.name
    }
  }
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signaling.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.signaling.execution_arn}/*/*"
}
