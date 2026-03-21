# Learnova — Directory structure

Single source of truth for `frontend/src/` layout (Phase 0). Paths are relative to `frontend/`.

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── fonts/
│   │   └── images/
│   ├── components/
│   │   ├── ui/                 # shadcn-style primitives
│   │   ├── common/
│   │   ├── admin/
│   │   │   ├── courses/
│   │   │   ├── lessons/
│   │   │   ├── quiz/
│   │   │   ├── attendees/
│   │   │   └── reporting/
│   │   └── learner/
│   │       ├── LessonPlayer/
│   │       ├── quiz/
│   │       └── reviews/
│   ├── pages/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── learner/
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── router/
│   ├── lib/                    # e.g. cn() helper (shadcn)
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
```

Backend layout lives under `backend/app/` (routers, services, models, schemas, core, middleware, utils).
