# Fraud Detection System Architecture

## Overview
The Fraud Detection System is a multi-layered defense mechanism designed to identify and neutralize malicious behavior on the Hustle platform. It works in tandem with the Trust Engine, focusing specifically on adversarial threats such as fake reviews, account farms, and booking fraud.

## 1. Monitoring Layers
- **Behavioral Analysis**: Monitoring for "review rings" (users reciprocally reviewing each other) and "review velocity" (anomalous bursts of feedback).
- **Identity & Sybil Defense**: Detection of "account farms" using device fingerprinting, IP collision analysis, and credit card association.
- **Booking & Escrow Monitoring**: Identifying "escrow abuse" patterns, such as immediate releases followed by withdrawals, or high cancellation rates on high-value jobs.
- **Content Moderation**: Real-time scanning of service descriptions and messages for "spam content", phishing links, or off-platform payment requests.

## 2. Risk Calculation Pipeline
1. **Signal Ingestion**: Real-time event streams (logins, bookings, reviews) populate the `fraud_signals` repository.
2. **Heuristic Evaluation**: Automated rulesets assign weights to signals based on severity (e.g., IP collision with a banned account is "Critical").
3. **Internal Risk Score**: A confidential, cumulative risk score is maintained in the `risk_scores` table.
4. **Relationship Clustering**: Analyzing the graph of user interactions to find "cliques" of fraudulent actors.

## 3. Enforcement Actions
The system automatically triggers one of the following based on the Risk Tier:
- **Flagging**: The account is flagged for manual review by the Safety Team. No visible change to the user.
- **Visibility Reduction**: The user's services are de-prioritized in search results (Shadow Ban).
- **Manual Review Queue**: High-risk milestones (like first withdrawal) are held pending human confirmation.
- **Immediate Suspension**: Critical risk levels (e.g., confirmed credit card fraud) trigger an immediate, platform-wide account lock via `moderation_actions`.

## 4. Integration with Trust Engine
The Fraud System acts as a "Negative Multiplier" for the Trust Engine. While the Trust Engine builds score through positive performance, the Fraud System can instantaneously zero out or freeze a Trust Label if high-confidence malicious signals are detected.
