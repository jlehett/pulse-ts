# -----------------------------------------------------------------------------
# DynamoDB table for lobby state (signaling server)
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "lobbies" {
  name         = "${var.project_name}-lobbies-${var.environment}"
  billing_mode = "PAY_PER_REQUEST" # On-demand — no cost at zero traffic

  hash_key = "lobbyId"

  attribute {
    name = "lobbyId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}

# Table for WebSocket connection tracking
resource "aws_dynamodb_table" "connections" {
  name         = "${var.project_name}-connections-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}
