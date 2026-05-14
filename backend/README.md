# Hustle Backend Foundation

This service now contains the backend foundation for:

- authentication
- users and profiles
- feed and posts
- likes, comments, reposts, and saves
- collections
- Cloudinary-ready media uploads
- Socket.IO event readiness

## Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT authentication
- Cloudinary upload integration
- Socket.IO readiness

## Quick Start

1. Copy `.env.example` to `.env`
2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Run the first migration after PostgreSQL is available:

```bash
npm run prisma:migrate -- --name init
```

5. Start the backend:

```bash
npm run dev
```

## Key APIs

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users and Profile

- `GET /api/users/me`
- `GET /api/users/:id`
- `GET /api/profile/me`
- `PATCH /api/profile/me`

### Feed and Posts

- `GET /api/feed?mode=latest|recommended&limit=15&cursor=...`
- `POST /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts/:id/like`
- `DELETE /api/posts/:id/like`
- `POST /api/posts/:id/comment`
- `GET /api/posts/:id/comments`
- `POST /api/comments/:id/reply`
- `POST /api/posts/:id/repost`
- `DELETE /api/posts/:id/repost`
- `POST /api/posts/:id/save`
- `DELETE /api/posts/:id/save`

### Collections

- `POST /api/collections`
- `GET /api/collections`
- `GET /api/collections/:id/posts`

## Feed Design Notes

- Feed pagination is cursor-based, not offset-based.
- `mode=latest` sorts by `createdAt DESC`.
- `mode=recommended` sorts by `rankingScore DESC, createdAt DESC`.
- Posts cache `likeCount`, `commentCount`, `repostCount`, `saveCount`, and `rankingScore` for feed-read performance.
- Media files are never stored in the database. Only Cloudinary or external URLs plus metadata are stored.

## Example Feed Response

```json
{
  "success": true,
  "message": "Feed fetched successfully.",
  "data": [
    {
      "id": "cm123post",
      "type": "video",
      "caption": "Behind the scenes of a client rebrand sprint",
      "hashtags": ["branding", "design", "hustle"],
      "visibility": "public",
      "allowComments": true,
      "audio": {
        "title": "Night Grind",
        "artist": "Hustle Audio",
        "url": "https://example.com/audio/night-grind"
      },
      "creator": {
        "id": "cm123user",
        "username": "marcusdesign",
        "profilePhoto": "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
        "bio": "Product designer and growth strategist.",
        "role": "hustler"
      },
      "media": [
        {
          "id": "cm123media",
          "type": "video",
          "url": "https://res.cloudinary.com/demo/video/upload/v1/post.mp4",
          "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v1/post-thumb.jpg",
          "mimeType": "video/mp4",
          "format": "mp4",
          "resourceType": "video",
          "width": 1080,
          "height": 1920,
          "durationSeconds": 23.4,
          "bytes": 5820034,
          "altText": null,
          "sortOrder": 0
        }
      ],
      "counts": {
        "likes": 120,
        "comments": 18,
        "reposts": 9,
        "saves": 33
      },
      "attachedCommerce": {
        "type": "service",
        "entityId": "svc_rapid_brand_audit",
        "title": "Rapid Brand Audit",
        "subtitle": "48-hour strategy review",
        "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v1/service-cover.jpg",
        "priceMinor": 50000,
        "currency": "NGN",
        "metadata": {
          "category": "branding"
        }
      },
      "viewerState": {
        "hasLiked": true,
        "hasSaved": false,
        "hasReposted": false,
        "savedCollectionIds": []
      },
      "isRepost": false,
      "originalPost": null,
      "rankingScore": 238.5,
      "createdAt": "2026-05-14T02:10:00.000Z",
      "updatedAt": "2026-05-14T02:10:00.000Z"
    }
  ],
  "meta": {
    "mode": "recommended",
    "availableModes": ["latest", "recommended"],
    "nextCursor": "eyJtb2RlIjoicmVjb21tZW5kZWQiLCJpZCI6ImNtMTIzcG9zdCIsInJhbmtpbmdTY29yZSI6MjM4LjUsImNyZWF0ZWRBdCI6IjIwMjYtMDUtMTRUMDI6MTA6MDAuMDAwWiJ9",
    "hasMore": true
  }
}
```

## Folder Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── modules/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
└── package.json
```
