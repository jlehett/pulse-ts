# -----------------------------------------------------------------------------
# IAM role and policies for the signaling Lambda
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_signaling" {
  name = "${var.project_name}-signaling-lambda-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

# CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_signaling.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB access for lobby + connection tables
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_signaling.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.lobbies.arn,
          aws_dynamodb_table.connections.arn
        ]
      }
    ]
  })
}

# API Gateway management API (for sending messages back to WebSocket clients)
resource "aws_iam_role_policy" "lambda_apigw_manage" {
  name = "apigw-manage-connections"
  role = aws_iam_role.lambda_signaling.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "execute-api:ManageConnections"
        Resource = "${aws_apigatewayv2_api.signaling.execution_arn}/${var.environment}/POST/@connections/*"
      }
    ]
  })
}
