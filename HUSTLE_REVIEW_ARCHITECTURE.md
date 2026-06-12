# Hustle Review Architecture

## Overview
The Review System enforces quality, transparency, and trust within the unified gig marketplace. It provides structured feedback after verified gigs are successfully completed.

## Core Flow
1. **Verification**: A review can only be submitted if the database contains a `completed` booking record matching the `bookingId`, `reviewerId` (Client), and `revieweeId` (Provider). This prevents fake or unverified reviews.
2. **Submit** (`POST /review`): Client rates their experience out of 5, provides detailed category scores (Quality, Communication, Timeliness, Professionalism), attaches an optional written description, and includes optional media URLs.
   - The system checks for existing reviews to prevent duplicates.
   - Calculates the overall score if not provided directly, though ideally driven by user selection.
3. **Aggregation Updates**: Upon review creation or modification, the `review_summaries` materialized records are recalculated asynchronously or via database triggers to ensure profile pages remain highly performant.
4. **Display** (`GET /provider/:id/reviews`): The frontend fetches a paginated list of reviews seamlessly merged with media and category breakdowns, along with the pre-calculated summary.

## Endpoints
- `POST /review` - Create a review. Requires a verified booking.
- `PUT /review` - Update an existing review (e.g., text, categories).
- `GET /provider/:id/reviews` - Returns aggregated summary stats along with a paginated list of recent reviews.

## Technical Components
- **`ReviewController`**: Exposes the REST API.
- **`ReviewService`**: Handles domain logic, ensures booking completion verification, prevents duplicate reviews, handles updating the aggregated scores.
- **Media**: Media uploads are handled asynchronously to a bucket, with URLs stored inside `review_media` against the primary review UUID.
- **Categories**: The schema uses `review_category_ratings` to normalize categories instead of hardcoding columns on the main table, allowing future additions (e.g., "Creativity" or "Hygiene" depending on service type).
