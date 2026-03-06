#!/usr/bin/env bash
# Terraform external data source: get-or-create a KVS signaling channel.
# Reads JSON from stdin: { "channel_name": "...", "region": "..." }
# Outputs JSON to stdout: { "arn": "..." }
set -euo pipefail

INPUT=$(cat)
CHANNEL_NAME=$(echo "$INPUT" | grep -o '"channel_name":"[^"]*"' | cut -d'"' -f4)
REGION=$(echo "$INPUT" | grep -o '"region":"[^"]*"' | cut -d'"' -f4)

# Try to describe the existing channel
ARN=$(aws kinesisvideo describe-signaling-channel \
  --channel-name "$CHANNEL_NAME" \
  --region "$REGION" \
  --query "ChannelInfo.ChannelARN" \
  --output text 2>/dev/null || echo "")

# Create if it doesn't exist
if [ -z "$ARN" ] || [ "$ARN" = "None" ]; then
  ARN=$(aws kinesisvideo create-signaling-channel \
    --channel-name "$CHANNEL_NAME" \
    --region "$REGION" \
    --query "ChannelARN" \
    --output text)
fi

echo "{\"arn\": \"$ARN\"}"
