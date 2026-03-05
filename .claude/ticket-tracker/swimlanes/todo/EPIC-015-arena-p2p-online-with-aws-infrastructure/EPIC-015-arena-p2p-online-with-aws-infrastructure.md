---
id: EPIC-015
title: Arena P2P online with AWS infrastructure
status: todo
created: 2026-03-04
updated: 2026-03-04
---

## Description

Overhaul the arena demo's online play to use WebRTC peer-to-peer connections
instead of WebSocket-based networking. AWS Lambda handles signaling (lobby
management + WebRTC handshake relay), S3 + CloudFront hosts the frontend
statically. Players choose a username, can host or browse/join lobbies, and
play over a direct P2P DataChannel connection.

## Goal

Anyone on the internet can access the arena demo and play against others without
requiring the host to run a dedicated game server. Infrastructure costs stay
near zero (Lambda free tier + minimal S3/CloudFront). All infrastructure is
defined in Terraform with no secrets committed to the repo.

## Notes

- **2026-03-04**: Epic created. Replaces the current WebSocket server approach with P2P + Lambda signaling.
