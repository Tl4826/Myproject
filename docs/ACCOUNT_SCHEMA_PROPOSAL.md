# Proposed schema extension (Task 3a)

Existing four-table schema was verified on 26 Nov; this is an additive **staging proposal**, not a statement about current Neon production. No real records have been migrated. It stores minimal profile preferences, scheduling metadata and saved report date ranges/counts. Existing device-only health/profile values are deliberately not uploaded. Any expansion or sync requires separate privacy review, authenticated ownership checks and explicit opt-in; no raw photos or credentials.

```mermaid
erDiagram
    SOCIAL_USERS ||--o| EMAIL_CREDENTIALS : authenticates
    SOCIAL_USERS ||--o{ SOCIAL_SESSIONS : has
    SOCIAL_USERS ||--o{ USER_DIARY_ENTRIES : owns
    SOCIAL_USERS ||--o| USER_PROFILES : has
    SOCIAL_USERS ||--o{ USER_PLANS : owns
    SOCIAL_USERS ||--o{ USER_SAVED_REPORTS : owns
    USER_PROFILES {
      uuid user_id PK,FK
      text display_name
      text locale
      text timezone
      timestamptz updated_at
    }
    USER_PLANS {
      uuid id PK
      uuid user_id FK
      text title
      date start_on
      date end_on
      timestamptz created_at
    }
    USER_SAVED_REPORTS {
      uuid id PK
      uuid user_id FK
      date period_start
      date period_end
      integer days_recorded
      timestamptz created_at
    }
```

Migration: [002_account_metadata.sql](../database/migrations/002_account_metadata.sql). CI uses a disposable PostgreSQL service and synthetic records, re-applies migration for idempotency and tests uniqueness, foreign keys, report bounds and cascade. RLS enabled, no public policies; app must continue to check authenticated owner on every query. Owner role can bypass RLS; SQL owner filters alone do not prove endpoint security. API and UI integration, migration to Neon, independent live schema metadata verification and legacy MySQL cleanup remain outstanding. Do not apply to production before these are addressed.
