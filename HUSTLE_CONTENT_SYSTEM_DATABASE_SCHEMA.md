# Hustle Content System Database Schema Documentation

This document specifies the professional, transaction-resilient PostgreSQL relational database schema for the **Hustle Content System**. Designed to support high-throughput, TikTok-style multimedia feeds, this schema enables rapid geographic user routing, complex trade skill searches, and automated algorithmic recommendation pipelines with cached engagement aggregation.

---

## 1. Schema Diagram & Relationships

```
           +-------------------------+
           |      public.profiles    |
           +-------------------------+
                       | (1:N)
                       +----------------------------+
                       |                            |
                       v                            v
           +-------------------------+  +-------------------------+
           |      public.content     |  |   public.draft_content  |
           +-------------------------+  +-------------------------+
                       | (N:1)                      | (N:1)
                       v                            v
                       v                             |    | code      (VARCHAR)|
           +-------------------------+               +-------------------------+
           |   public.content_media  |
           +-------------------------+               +-------------------------+
           | PK | id          (UUID) |               |      public.skills      |
           | FK | content_id  (UUID) |               +-------------------------+
           |    | media_url   (TEXT) |                           | (1:N)
           +-------------------------+                           v
                       |                             +-------------------------+
                       +---------------------------->|  public.content_skills  |
                       | (1:N)                       +-------------------------+
                       v                             | PK | id          (UUID) |
           +-------------------------+               | FK | content_id  (UUID) |
           | public.content_hashtags |               | FK | skill_id    (UUID) |
           +-------------------------+               +-------------------------+
           | PK | id          (UUID) |
           | FK | content_id  (UUID) |               +-------------------------+
           | FK | hashtag_id  (UUID) |<--------------|     public.hashtags     |
           +-------------------------+ (N:1)         +-------------------------+
                       |                             | PK | id          (UUID) |
                       v                             |    | tag       (VARCHAR)|
           +-------------------------+               +-------------------------+
           | content_engagement_log  |
           +-------------------------+
           | PK | id          (UUID) |
           | FK | content_id  (UUID) |
           +-------------------------+
```

### Architectural Highlights:
1. **Normalized Support Structures**:
   - Spoken formatting categories are isolated inside `public.content_types`, preventing repetitive text overhead.
   - Multimedia attachments support `1:N` arrays mapping to a parent post, enabling carousel listings and multi-part before-and-after case files via `public.content_media`.
2. **Associative Many-to-Many Mappings**:
   - Core trade tags map content to the existing shared profile ledger `public.skills` using the associative bridge `public.content_skills`.
   - Structural hashtags are maintained in `public.hashtags` and bound to content via the mapping bridge `public.content_hashtags`.

---

## 2. SQL Schema DDL & Columns Definition

The physical database layout has been deployed as a database migration in:
`supabase/migrations/20260609040000_hustle_content_schema.sql`

Let's review the column roles:

### `public.content`
Central orchestrator row containing descriptions, metadata flags, and scoring parameters.

| Column Name | Type | Key | Default | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `uuid_generate_v4()` | Globally unique content identifier. |
| `creator_id` | `UUID` | **FK** | *None* | References the posting creator's `public.profiles(id)`. |
| `content_type_id` | `UUID` | **FK** | *None* | References `public.content_types(id)`. Restricts layout presets. |
| `title` | `VARCHAR(150)`| | `NULL` | Short, punchy display header. |
| `description` | `TEXT` | | *None* | Descriptive summary describing the trade work. |
| `location` | `VARCHAR(100)`| | `NULL` | Human-facing geographical name (e.g. Covent Garden, London). |
| `latitude` | `DOUBLE PRECISION`| | `NULL` | Precise GPS coordinates for localized radius matches. |
| `longitude`| `DOUBLE PRECISION`| | `NULL` | Precise GPS coordinates for localized radius matches. |
| `visibility`| `VARCHAR(20)`| | `'public'` | Constraints visibility domains: `'public'`, `'clients'`, or `'private'`. |
| `views_count` | `INT` | | `0` | Aggregated views counter. |
| `likes_count` | `INT` | | `0` | Aggregated likes counter. |
| `shares_count` | `INT` | | `0` | Aggregated shares counter. |
| `saves_count` | `INT` | | `0` | Aggregated bookmarks/saves counter. |
| `engagement_score` | `NUMERIC` | | `1.0` | Algorithmic composite score to prioritize feeds. |
| `search_vector` | `TSVECTOR`| | `NULL` | Pre-parsed full-text token stream for instant matching. |

### `public.draft_content`
Auto-saves an incomplete portfolio setup with its state, so a user can recover unfinished posts and edit them later without losing media processed earlier in the form flow.

| Column Name | Type | Key | Default | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `uuid_generate_v4()` | Globally unique draft identifier. |
| `creator_id` | `UUID` | **FK** | *None* | References the posting creator's `public.profiles(id)`. |
| `step_reached` | `VARCHAR(50)`| | `'upload'` | Tracks progress: upload, select_skill, fill_details, summary. |
| `media_ids` | `TEXT[]` | | `NULL` | Array of strings mapped to processed media (before publish). |
| `content_type_id` | `UUID` | **FK** | `NULL` | Target Layout preset choice, mapped from types table. |
| `skill` | `VARCHAR(100)`| | `NULL` | Selected (or auto-detected) trade mapping text. |
| `title` | `VARCHAR(150)`| | `NULL` | Title if populated. |
| `description` | `TEXT` | | `NULL` | Draft text describing the job. |
| `price` | `NUMERIC(10,2)`| | `NULL` | Configured service fee or estimation. |
| `location` | `VARCHAR` | | `NULL` | Geofence area or user location name text. |
| `latitude`/`longitude` | `DOUBLE PRECISION` | | `NULL` | Precise GPS coordinates mapped when drafting. |


### `public.content_comments`
Enables deep engagement loops allowing consumers to leave feedback, ask questions, and reply to existing comments forming nested trees.

| Column Name | Type | Key | Default | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `uuid_generate_v4()` | Globally unique comment identifier. |
| `content_id` | `UUID` | **FK** | *None* | Parent target media post. |
| `parent_id` | `UUID` | **FK** | `NULL` | Nullable. Self-reference mapping nested reply hierarchies. |
| `author_id` | `UUID` | **FK** | *None* | Profile ID of the commenter. |
| `text` | `TEXT` | | *None* | Text payload. |
| `likes_count` | `INT` | | `0` | Social proof weighting. |
| `replies_count`| `INT` | | `0` | Branch tracking indicator. |

### `public.content_reports`
Provides automated moderation and spam safety queues allowing consumers to flag inappropiate interactions or explicit materials.

| Column Name | Type | Key | Default | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `uuid_generate_v4()` | Globally unique report identifier. |
| `content_id` | `UUID` | **FK** | *None* | Target mapped post. |
| `reporter_id` | `UUID` | **FK** | *None* | Profile who threw the red-flag. |
| `reason` | `VARCHAR(100)`| | *None* | Broad category taxonomy (e.g. spam, copyright, offensive). |
| `status` | `VARCHAR(30)`| | `'pending'` | Moderator pipeline tracker (pending, reviewed). |

---

## 3. Dedicated Engines Support Realization

### A. Recommendation Engine (Algorithmic Routing)
Rather than executing expensive joint-counts at the query time of millions of items, the system utilizes an event-driven denormalized scoring loop:
1. **Dynamic Event Weights**:
   When consumers trigger micro-actions, an event is logged in `public.content_engagement_log` (e.g., `view_complete`, `share`, `bookmark`).
2. **Weighted Counter Synthesis**:
   A reactive schema trigger (`trg_recalculate_rec_weights`) automatically tallies absolute scores using tailored weights:
   $$\text{Engagement Score} = (\text{Views} \times 1.0) + (\text{Likes} \times 3.0) + (\text{Saves} \times 5.0) + (\text{Shares} \times 8.0)$$
3. **Compound Key Optimization**:
   The database can serve highly targeted personalized feeds using a high-performance compound index:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_content_recommendation_score 
   ON public.content (content_type_id, engagement_score DESC) 
   WHERE visibility = 'public';
   ```

### B. Search Engine (Geographic, Skill, and Text Matching)
Fast discovery forms the backbone of lead conversion. The database addresses search across three dimensions:
1. **Full-Text Natural Language (FTS)**:
   A GIN index is coupled with an automatic `TSVECTOR` synchronization trigger (`trg_sync_content_fts`). Title, description, and locations are tokenized upon insertion:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_content_search_vector_gin 
   ON public.content USING gin(search_vector);
   ```
2. **Radial Location Filtering**:
   GPS math is optimized via a filtered, low-overhead geospatial index:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_content_geospatial 
   ON public.content (latitude, longitude) WHERE visibility = 'public';
   ```
3. **Tag-Matcher Lookup Acceleration**:
   Many-to-many associations are highly sensitive to index layouts. High-speed, conflict-free indices are implemented on both bridges:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_content_skills_lookup ON public.content_skills(content_id, skill_id);
   CREATE INDEX IF NOT EXISTS idx_content_hashtags_lookup ON public.content_hashtags(content_id, hashtag_id);
   ```

### C. Analytics Engine (Retention & Conversion clickstream)
To feed dashboard performance widgets (view trends, loop counts, swipe retention), the `public.content_engagement_log` table offers granular event tracking:
- Records specific consumer actions (`view_start`, `view_complete`, `view_loop_count`, `like`, `share`, `bookmark`, `save`, `not_interested`, `follow_creator`, `hire_creator`, `report`).
- Stores detailed metric dimensions such as **dwell duration**, enabling retention curve analysis and funnel completion math for professional creators.
