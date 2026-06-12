# Hustler Application System Architecture

## Overview
The Hustler Application Service handles the workflow for standard Clients applying to earn the "Hustler" status. It manages data intake, verification steps, and reviewer responses, allowing users to amend their applications if more information is requested.

## Core Flow
1. **Apply (`POST /hustler/apply`)**: User submits their application, which includes basic info, skills, and portfolio data. Changes status to `pending`.
2. **Review Workflow**: Submissions join an admin queue (or automated Trust Engine check).
   - If acceptable: Status becomes `approved`. The Profile Service is notified to grant `is_hustler` permissions.
   - If missing context: Status becomes `more_info`. The user is notified on what needs fixing.
   - If unacceptable: Status becomes `rejected`.
3. **Fetch Status (`GET /hustler/application`)**: The frontend checks this endpoint on startup or when the user navigates to the application hub to show the correct UI (e.g., waiting room, approval success, or a request for more details).
4. **Amend Application (`POST /hustler/application/update`)**: If the status is `more_info`, the user can update their submitted data and push it back to `pending` review.

## Endpoints
- `POST /hustler/apply` - Submit a new application.
- `GET /hustler/application` - Fetch the current application status and submitted payloads.
- `POST /hustler/application/update` - Amend application details if requested by the reviewer.

## Supported Statuses
- `pending`: Awaiting admin/trust engine review.
- `approved`: Review completely successful. Feature flags unlocked.
- `rejected`: Application denied.
- `more_info`: Application paused; user intervention required to fix fields.
