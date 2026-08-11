# Hustle Academy: Learning Service Architecture

The **Learning Service** forms the educational pillar of the platform. It provides structured trade curriculum pathways (Beginner → Intermediate → Advanced), logs progress, increases user trust credentials (XP points), and dynamically recommends subsequent lessons based on missing skills or exploratory paths.

---

## 1. System Topology & Layers

The service conforms to a clean, decoupled MVC multi-layer architecture, matching our core framework:

```
[Client Applet (UI: LearningHub)]
               │
               ▼ (HTTPS REST Protocols)
    [Express Routing Layer] (server/routes/learningRoutes.ts)
               │
               ▼
   [Controller / Validator] (server/controllers/learningController.ts)
               │
               ▼
    [Business Service Layer] (server/services/learningService.ts)
               │
               ▼
[Repository Storage Layer] (server/repositories/learningRepository.ts)
         ┌─────┴─────┐
         ▼           ▼
  [Pre-Seeded Paths] [User Progress Store]
```

### Component Roles

1. **Type Definitions (`/server/types/learning.ts`)**: Defines compile-safe TypeScript contracts for Skill Paths, Lessons, Progress Logs, and Recommendations.
2. **Repository Layer (`/server/repositories/learningRepository.ts`)**: Serves as the database interface. Restores persistent lesson/path metadata and maps transactional user completions.
3. **Business Service Layer (`/server/services/learningService.ts`)**: Implements strict course completion rules, calculates XP, and executes the adaptive recommendation heuristic.
4. **Controllers (`/server/controllers/learningController.ts`)**: Deserializes queries and parameter inputs, extracts active web session tokens, and maps logical service outputs to JSON.

---

## 2. API Endpoint Specifications

The following API routes are mounted under `/learning` and `/api/learning`:

### A. Track Progress
* **Route**: `POST /learning/progress`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload**:
  ```json
  {
    "lessonId": "barber-2"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Lesson progress updated successfully",
    "data": {
      "progress": {
        "id": "prog-user123-barber-2",
        "user_id": "user123",
        "lesson_id": "barber-2",
        "completed": true,
        "completed_at": "2026-06-11T13:20:00.000Z"
      },
      "xpEarned": 150,
      "newlyCompletedPath": false
    }
  }
  ```

### B. Retrieve Skill Paths
* **Route**: `GET /learning/paths`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 4,
    "paths": [
      {
        "id": "path-barbering",
        "title": "Master Barbering & Styling",
        "category": "Grooming",
        "description": "Learn advanced skin fades, texturizing...",
        "xp_total": 450,
        "featured_img": "https://images.unsplash.com/...",
        "lessons": [
          {
            "id": "barber-1",
            "skill_path_id": "path-barbering",
            "level": "beginner",
            "title": "Blade Posture & Safety Mechanics",
            "duration": "8 mins",
            "xp_reward": 100
          }
        ],
        "metrics": {
          "pathId": "path-barbering",
          "pathTitle": "Master Barbering & Styling",
          "totalLessons": 3,
          "completedLessons": 1,
          "progressPercentage": 33
        }
      }
    ]
  }
  ```

### C. Personal Recommendations
* **Route**: `GET /learning/recommendations`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 2,
    "recommendations": [
      {
        "lesson": {
          "id": "barber-2",
          "skill_path_id": "path-barbering",
          "level": "intermediate",
          "title": "Foil Shaver & Comb Blend Transitions",
          "duration": "15 mins",
          "xp_reward": 150
        },
        "reason": "Step up: Try intermediate concepts in \"Master Barbering & Styling\"",
        "difficultyScale": "amber"
      }
    ]
  }
  ```

### D. Subscription Management
* **Route**: `POST /learning/paths/:pathId/follow` | `POST /learning/paths/:pathId/unfollow`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Successfully subscribed to study pathway",
    "followed": ["path-barbering", "path-ux"]
  }
  ```

---

## 3. High-Fidelity Pre-Seeded Skill Streams

The service seeds and supports four highly precise pathways with structured progressive level constraints:
1. **Master Barbering & Styling (`path-barbering`)**: Includes skin ergonomics, blade posture mechanics, blended zero lines, and slide slicing texturing.
2. **Drywall & Interior Framing (`path-drywall`)**: Includes ceiling staging layouts, joint tape embedding, knife feathering, and Level 5 skim coating.
3. **Freelance UI/UX Designing (`path-ux`)**: Includes consistent 8px-grid visual rhythms, WCAG high-contrast charcoal styling, and entry timing easing curves.
4. **TikTok Organic Growth & Sales (`path-marketing`)**: Includes 3-second hook pattern disruptions, booking friction optimization, and zip-code audience segmentation.

---

## 4. Adaptive Recommendation Engine Heuristics

The service runs a three-tier heuristic algorithm to compute student schedules:

1. **Sequential Core Progression (Rule 1 & 2)**: For any path the user explicitly follows, the service tracks lesson completeness. Recommendations will prioritize unfinished lessons in strict order of complexity:  
   $$\text{Beginner} \longrightarrow \text{Intermediate} \longrightarrow \text{Advanced}$$
   *Students are prevented from jumping to masterclass lessons without finishing introductory tutorials.*
2. **Exploratory Cross-Disciplinary Branching (Rule 3)**: If a user has completed the introductory stages of active paths, the engine dynamically surfaces the **Beginner** module of unselected courses to encourage horizontal skill diversification.
3. **Automatic Course Registration**: If a user completes any standalone lesson via the tutorial feed, the service automatically enrolls them in that path, tracking overall completion metrics in the active dashboard.
