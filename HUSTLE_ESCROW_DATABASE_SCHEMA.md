# Escrow Database Schema

This schema manages the state and lifecycle of funds held in escrow, including tracking events and managing disputes, building on the core Wallet schema.

```sql
-- 1. Escrow Accounts (Tied to a specific booking/contract)
-- While wallets hold aggregate escrow_balance, this table tracks the specific escrow state per job.
CREATE TABLE escrow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL, -- References the service booking
    client_wallet_id UUID NOT NULL, -- The wallet that funded the escrow
    provider_wallet_id UUID NOT NULL, -- The destination wallet for the funds
    
    amount DECIMAL(24, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    
    status VARCHAR(50) NOT NULL DEFAULT 'awaiting_payment', 
    -- 'awaiting_payment', 'funded', 'released', 'refunded', 'disputed'
    
    release_condition VARCHAR(100) DEFAULT 'client_approval', -- 'client_approval', 'milestone_completion', 'time_based'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_escrow_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_escrow_accounts_booking_id ON escrow_accounts(booking_id);
CREATE INDEX idx_escrow_accounts_client_wallet ON escrow_accounts(client_wallet_id);
CREATE INDEX idx_escrow_accounts_provider_wallet ON escrow_accounts(provider_wallet_id);
CREATE INDEX idx_escrow_accounts_status ON escrow_accounts(status);


-- 2. Escrow Transactions (Link between Escrow and core Wallet Ledger)
CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE RESTRICT,
    wallet_transaction_id UUID NOT NULL, -- References wallet_transactions(id)
    
    type VARCHAR(50) NOT NULL, -- 'fund', 'release', 'refund'
    amount DECIMAL(24, 8) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_transactions_escrow_account ON escrow_transactions(escrow_account_id);
CREATE INDEX idx_escrow_transactions_wallet_tx ON escrow_transactions(wallet_transaction_id);


-- 3. Escrow Events (Audit trail for state changes and actions)
CREATE TABLE escrow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
    
    actor_id UUID NOT NULL, -- The user (client, provider, or admin) who triggered the event
    actor_type VARCHAR(50) NOT NULL, -- 'client', 'provider', 'system', 'admin'
    
    event_type VARCHAR(50) NOT NULL, 
    -- 'created', 'funded', 'release_requested', 'released', 'refund_requested', 'refunded', 'dispute_opened', 'dispute_resolved'
    
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    notes TEXT, -- Optional context or reason
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_events_escrow_account ON escrow_events(escrow_account_id);
CREATE INDEX idx_escrow_events_event_type ON escrow_events(event_type);


-- 4. Escrow Disputes
CREATE TABLE escrow_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE RESTRICT,
    
    initiator_id UUID NOT NULL, -- User who opened the dispute
    reason_code VARCHAR(50) NOT NULL, -- 'non_delivery', 'quality_issue', 'unresponsive', 'other'
    description TEXT NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved_release', 'resolved_refund', 'resolved_split'
    
    resolution_details TEXT,
    resolved_by UUID, -- Admin ID who resolved it
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- In case of a split resolution
    release_amount DECIMAL(24, 8),
    refund_amount DECIMAL(24, 8),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_disputes_escrow_account ON escrow_disputes(escrow_account_id);
CREATE INDEX idx_escrow_disputes_status ON escrow_disputes(status);
```

### Relationships and Enforcement
- **`escrow_accounts` to `wallets`**: Maps the specific booking's held funds between the `client_wallet_id` and the potential destination `provider_wallet_id`.
- **`escrow_transactions` to `wallet_transactions`**: Every movement of funds in or out of escrow must correlate to an immutable entry in the core Wallet double-entry ledger. This table bridges the two.
- **`escrow_events`**: Provides a strict, undeletable audit log of every state transition that occurs on an `escrow_account`.
- **`escrow_disputes`**: Maps an active conflict to an `escrow_account`. A trigger or application logic should enforce that an `escrow_account` cannot transition out of `disputed` status until its related `escrow_disputes` row is marked as resolved.
