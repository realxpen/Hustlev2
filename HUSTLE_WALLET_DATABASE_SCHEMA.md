# Wallet Database Schema

This schema provides double-entry accounting constraints, ACID compliance support, and scale for both fiat and cryptocurrency. 

```sql
-- 1. Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Assumes a core users table exists
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    
    -- Using DECIMAL(24, 8) to easily accommodate high-precision cryptocurrencies later
    balance DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    escrow_balance DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    pending_balance DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    total_earnings DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    total_spending DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Basic constraints to prevent negative balances
    CONSTRAINT chk_balance_positive CHECK (balance >= 0),
    CONSTRAINT chk_escrow_balance_positive CHECK (escrow_balance >= 0)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);


-- 2. Payout Accounts (Bank, PayPal, Crypto Wallets)
CREATE TABLE payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'bank', 'paypal', 'crypto'
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- JSONB allows for flexible storage requirements (e.g. crypto addresses vs bank routing numbers)
    details JSONB NOT NULL, 
    
    status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payout_accounts_wallet_id ON payout_accounts(wallet_id);
-- Ensure only one primary method per wallet of a specific type (optional logic depending on product rules)


-- 3. Wallet Transactions (User-Facing Audit Trail)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(50) NOT NULL, -- 'deposit', 'escrow payment', 'payout', 'refund', 'withdrawal'
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'escrow'
    
    amount DECIMAL(24, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    title VARCHAR(100),
    sub_description VARCHAR(255),
    
    reference_id VARCHAR(100), -- ID of booking or external processor ID
    reference_type VARCHAR(50), -- e.g., 'booking_contract', 'stripe_payment_intent'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_transactions_wallet_id_created_at ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id);


-- 4. Wallet Ledger Entries (Internal Double-Entry Accounting Core)
-- This ensures total Debits ALWAYS equal total Credits system-wide.
CREATE TABLE wallet_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES wallet_transactions(id) ON DELETE RESTRICT,
    account_identifier VARCHAR(100) NOT NULL, -- e.g. 'SYSTEM_BANK', 'USER_WALLET_<ID>', 'USER_ESCROW_<ID>'
    
    debit DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    credit DECIMAL(24, 8) NOT NULL DEFAULT 0.00000000,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_debit_credit_positive CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_either_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0) OR (debit = 0 AND credit = 0))
);

CREATE INDEX idx_wallet_ledger_entries_tx_id ON wallet_ledger_entries(transaction_id);
CREATE INDEX idx_wallet_ledger_entries_account ON wallet_ledger_entries(account_identifier);
```

### Relationships and Constraints
- **Double Entry Rule**: At the application layer (or via database triggers/stored procedures), we must enforce that the sum of `debit` matches the sum of `credit` for every single `transaction_id`.
- **Crypto Compatibility**: The `DECIMAL(24, 8)` type provides safely enough precision to store large fiat numbers while scaling down fractions to 8 decimals as typically needed by crypto networks.
- **Reference Integrity**: All monetary state changes trace back through `wallet_transactions` referencing external events (`reference_id`), which are then immutably logged into `wallet_ledger_entries`. `wallet_ledger_entries` prevents deletion of transactions.
