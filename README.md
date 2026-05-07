# Campus Motion — Admin Panel

React + Vite admin workspace for Campus Motion.

## Setup

```bash
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev
```

## Project Structure

```
src/
├── api/                    # API layer — one file per resource
│   ├── client.js           # fetch wrapper (JWT, error handling)
│   ├── auth.js
│   ├── news.js
│   ├── events.js
│   ├── admin.js
│   ├── locations.js
│   └── index.js            # barrel export
│
├── hooks/
│   ├── useAsync.js         # generic async state manager
│   └── useTheme.js         # dark/light mode toggle
│
├── components/
│   ├── ui/                 # pure presentational atoms
│   │   ├── Icons.jsx
│   │   ├── Badge.jsx
│   │   ├── Alert.jsx
│   │   ├── Spinner.jsx
│   │   └── ConfirmDialog.jsx
│   ├── layout/             # shell, topbar, sidebar
│   │   ├── AppShell.jsx
│   │   ├── Topbar.jsx
│   │   └── Sidebar.jsx
│   ├── news/               # news-specific components
│   │   ├── NewsForm.jsx
│   │   └── NewsList.jsx
│   └── events/             # event-specific components
│       ├── EventForm.jsx
│       └── EventsTable.jsx
│
├── pages/                  # one file per route/section
│   ├── Login.jsx
│   ├── DashboardShell.jsx
│   ├── NewsPage.jsx
│   ├── EventsPage.jsx
│   ├── UsersPage.jsx
│   ├── LocationsPage.jsx
│   └── AuditPage.jsx
│
└── styles/                 # global CSS split by concern
    ├── tokens.css           # design tokens (colors, spacing, type)
    ├── base.css             # reset + html/body defaults
    ├── components.css       # shared UI (btn, card, badge, form…)
    └── layout.css           # app shell, topbar, sidebar, main
```

## API endpoints used

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /users/me` |
| News | `GET /news/admin`, `POST /news`, `PUT /news/:id`, `DELETE /news/:id` |
| Events | `GET /events`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id` |
| Users | `GET /admin/users`, `PATCH /admin/users/:id/role`, `DELETE /admin/users/:id` |
| Locations | `GET /locations`, `POST /locations` |
| Audit | `GET /admin/audit` |
