# -----------------------------------------------------------------------------
# Kinesis Video Streams signaling channel for TURN relay credentials
# -----------------------------------------------------------------------------

resource "aws_kinesis_video_stream" "turn" {
  name                    = "${var.project_name}-turn-${var.environment}"
  data_retention_in_hours = 0
  media_type              = "video/h264"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
