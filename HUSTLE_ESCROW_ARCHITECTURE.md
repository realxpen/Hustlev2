# Hustle Escrow Architecture

## Overview
The Escrow Service acts as the trust layer between Clients and Providers. It ensures that funds are secured for a booking and only released when conditions are met, protecting both parties. The Escrow Service builds on top of the Wallet Service's double-entry accounting ledger to maintain absolute financial integrity.

## Core Flow
1. **Fund** (`POST /escrow/fund`): Client pays for a booking. Funds are deducted from their primary wallet balance and moved to an escrow balance. The ledger debits `USER_WALLET` and credits `USER_ESCROW`.
2. **Booking Active**: The booking proceeds while funds are secured.
3. **Work Delivered / Approval**: The provider delivers the work and the client approves.
4. **Release** (`POST /escrow/release`): Funds are unlocked from the Client's escrow and transferred to the Provider's primary balance. The ledger debits `USER_ESCROW` (client) and credits `USER_WALLET` (provider).

## Edge Flows
- **Refund** (`POST /escrow/refund`): If the booking is cancelled or rejected before delivery, funds are returned to the Client. The ledger debits `USER_ESCROW` and credits `USER_WALLET` (client).
- **Dispute** (`POST /escrow/dispute`): If the Client is dissatisfied, they initiate a dispute. Funds remain locked in `USER_ESCROW` (frozen) and cannot be released or refunded until an admin resolves the dispute.

## Technical Components
- **`EscrowController`**: Exposes the REST API endpoints (`/fund`, `/release`, `/refund`, `/dispute`).
- **`EscrowService`**: Contains the business logic for escrow state transitions and coordinates with the Wallet Service.
- **`WalletService` / `WalletRepository`**: Manages the underlying balances, transactions, and immutable double-entry ledger.

## Data Integrity (ACID)
- All escrow movements are backed by the **Wallet Ledger**, enforcing that Debits must always equal Credits.
- The state of escrowed funds is accurately tracked via the `escrowBalance` field on the Wallet entity, avoiding double spending while funds are held.
