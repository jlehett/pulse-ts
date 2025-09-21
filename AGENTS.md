# Monorepo Root

## Goals

- **Automated tests for everything** with meaningful coverage.
- **Layered architecture:** top is human-readable intent; bottom is implementation details.
- **Clean design patterns** to keep code maintainable and understandable.
- **Rich JSDoc** everywhere, with examples.
- **Focused directory structure:** group similar things; avoid sprawl.

## Architecture

We use a **layered architecture**. Each package should make the top layer read like plain English, and push complexity downward.

### Layers (from top to bottom)

- **L1 - Orchestration (Use Cases / Flows)**
  _Purpose:_ Compose domain actions to achieve user-intent. No infrastructure code. _Examples:_ `registerUser()`, `planTrip()`
- **L2 - Domain (Entities / Services / Policies)**
  _Purpose:_ Business rules and invariants. Pure, side-effect-free where possible. _Examples:_ `User`, `Cart`, `PriceCalculator`
- **L3 - Integration (Ports & Adapters)**
  _Purpose:_ Implement interfaces to external systems (DB, HTTP, queues). Hide vendors. _Examples:_ `UserRepository`, `PaymentGateway`, `VectorStore`