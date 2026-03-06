# -----------------------------------------------------------------------------
# Kinesis Video Streams signaling channel for TURN relay credentials
#
# Terraform does not have a native resource for KVS signaling channels.
# We use a helper script to get-or-create the channel on each apply.
# -----------------------------------------------------------------------------

locals {
  kvs_channel_name = "${var.project_name}-turn-${var.environment}"
}

data "external" "kvs_channel" {
  program = ["bash", "${path.module}/scripts/get-or-create-kvs-channel.sh"]

  query = {
    channel_name = local.kvs_channel_name
    region       = var.aws_region
  }
}

locals {
  kvs_channel_arn = data.external.kvs_channel.result.arn
}
