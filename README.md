# Earthoria

Earthoria is a full-stack platform for children's reading and learning, built around an e-commerce bookstore core and extended with a digital ebook reader, augmented-reality (AR) book content, educational mini-games, a gamified "garden" reward system, and a parent-controlled Kid Mode. Commerce is the entry point, but the underlying product is a safe, interactive space where children can read and play under parental supervision, while parents and administrators retain full visibility and control.

|                   |                                                               |
| ----------------- | ------------------------------------------------------------- |
| **Repository**    | [`KaneVina/earthoria`](https://github.com/KaneVina/earthoria) |
| **Maintainer**    | Nguyen Phuc Khang (Kane)                                      |
| **Email**         | wtskane@gmail.com                                             |
| **Live Frontend** | https://earthoria.vercel.app · https://earthoria.id.vn        |
| **Live API**      | https://api.earthoria.id.vn/api/v1                            |

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concept](#core-concept)
3. [Feature Set](#feature-set)
4. [Tech Stack](#tech-stack)
5. [Repository Layout](#repository-layout)
6. [Architecture](#architecture)
7. [Data Model](#data-model)
8. [API Surface](#api-surface)
9. [Roles & Access Control](#roles--access-control)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Available Scripts](#available-scripts)
13. [Deployment](#deployment)
14. [Security Notes](#security-notes)
15. [Roadmap](#roadmap)
16. [Contributing](#contributing)
17. [License](#license)
18. [Contact](#contact)

---

## Overview

Earthoria lets customers browse and buy physical and digital children's books, unlock companion ebooks and educational mini-games attached to a book through AR codes, and collect points through a loyalty program. Parents can create supervised child profiles ("Kid Mode") protected by a separate PIN, restrict which books and games a child is allowed to open, and review activity logs of what the child has read or played. On the operational side, a full admin back office covers catalog, orders, users, coupons, reviews, and support tickets, alongside an AI chat assistant that helps customers find books.

The system is built and deployed in a production-style setup: the client is hosted on Vercel, the API connects to a managed PostgreSQL database on Supabase, media is served through Cloudinary, and checkout integrates with real Vietnamese payment rails — VNPay, MoMo, and bank transfer via a QR/SePay webhook — alongside Stripe support.

## Core Concept

Earthoria is structured around three layers that build on top of each other rather than a single storefront:

1. **Commerce layer** — customers discover, purchase, and manage physical or digital books, similar to a conventional online bookstore.
2. **Content & engagement layer** — a purchased book can be extended with an ebook edition, an AR experience, and an educational mini-game, turning a one-time purchase into an ongoing activity. A gamified "garden" system rewards children for continued reading and play.
3. **Family safety layer** — Kid Mode puts the child's experience behind a parent-owned PIN, limits which content a child can reach, and gives parents dashboards and activity logs, so the platform can be handed directly to a child rather than only used by the purchasing adult.

The combination of commerce, interactive content, and parental control is what separates Earthoria from a typical bookstore template.

---

## Feature Set

### Storefront (customer-facing)

- Catalog browsing with search, multi-criteria filtering (category, tags, rating), sorting, and pagination
- Product detail pages with reviews, review voting, and wishlist
- Shopping cart and multi-step checkout
- Multiple payment methods: VNPay, MoMo, bank transfer QR (SePay webhook), Stripe
- Order history, cancellation, and delivery confirmation
- Address book management
- Coupon/discount code validation at checkout
- Loyalty tiers and points tracking
- Support ticket submission
- AI-powered chat assistant for book recommendations (Groq-backed)

### Digital & interactive content

- Ebook reader accessible through unique per-book links
- Educational mini-games tied to specific books, with per-book leaderboards
- AR codes that unlock 3D/interactive content for a physical book
- "Garden" gamification system that rewards a child's reading/play activity

### Kid Mode (parental controls)

- Parent-managed child profiles, separate from the main account login
- Parent PIN system — set, verify, change, and recover via OTP — gating access to parental settings
- Per-child book visibility and access controls
- Profile locking/unlocking, soft delete, and permanent deletion (requires PIN and name confirmation)
- Tokenized "kid access" links so a child can use the platform without a full login
- Per-child activity logging and parent-facing dashboards

### Admin / back office

- Dashboard with system and business metrics
- Book management: create, edit, delete, variants, images, AI-assisted content drafting
- Category management
- Ebook and game management, including access control and leaderboards
- AR code management, including per-product access settings
- Order management and status updates
- User management: search, filter by role/status, bulk enable/disable, CSV export, role changes
- Coupon management
- Review moderation: reply, show/hide
- Support ticket management: assignment, status, replies
- Manual email sending with history and preview
- Inventory import records
- Site-wide settings management
- Server/system status page

### Authentication & account

- Email/password registration with OTP verification
- Google OAuth login
- JWT-based authentication with refresh tokens
- Forgot password / reset password via OTP
- Profile management and password changes

---

## Tech Stack

### Backend

| Category            | Technology                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| Runtime             | Node.js                                                                        |
| Framework           | Express 5                                                                      |
| ORM / Database      | Prisma 6, PostgreSQL (hosted on Supabase)                                      |
| Authentication      | JSON Web Tokens, Passport.js (Google OAuth 2.0), bcrypt / bcryptjs             |
| Security middleware | Helmet, CORS, express-rate-limit (Redis-backed via ioredis / rate-limit-redis) |
| File uploads        | Multer, Cloudinary                                                             |
| Email               | Nodemailer, Resend                                                             |
| Payments            | Stripe SDK, custom VNPay / MoMo / Bank QR (SePay) integrations                 |
| Observability       | Sentry, Winston, Morgan                                                        |
| AI                  | Groq LLM API (chat completions)                                                |
| Utilities           | Hashids (ID obfuscation), Slugify                                              |

### Frontend

| Category           | Technology                                                      |
| ------------------ | --------------------------------------------------------------- |
| Framework          | React 19                                                        |
| Build tool         | Vite                                                            |
| Styling            | Tailwind CSS 4                                                  |
| State management   | Zustand                                                         |
| Data fetching      | TanStack React Query, Axios                                     |
| Routing            | React Router 7                                                  |
| 3D / AR            | Three.js, @react-three/fiber, @react-three/drei                 |
| Charts             | Recharts, ECharts                                               |
| Forms & validation | React Hook Form, Zod                                            |
| Animation          | Framer Motion, GSAP, Lenis                                      |
| Maps               | Leaflet, React-Leaflet                                          |
| Other              | jsPDF, html2canvas, SheetJS (XLSX export), QRCode.react, Swiper |

### Infrastructure

- **Database:** Supabase-managed PostgreSQL (pooled connection via PgBouncer for the app, direct connection for migrations)
- **Frontend hosting:** Vercel
- **Media/CDN:** Cloudinary
- **Cache & rate-limit store:** Redis
- **Error tracking:** Sentry (client and server)

---

## Repository Layout

```
earthoria/
├── client/                       # React frontend (Vite)
│   ├── src/
│   │   ├── components/           # Reusable UI building blocks (incl. 3D, kid, parent, admin)
│   │   ├── pages/                # Route-level views (storefront, admin, kid, legal, auth)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API client functions
│   │   ├── store/                # Zustand state stores
│   │   ├── games/                # Mini-game engine, editors, and players
│   │   └── utils/                # Frontend utilities
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
└── server/                       # Express backend
    ├── src/
    │   ├── routes/                # One Express router file per domain
    │   ├── controllers/           # Request handlers / business logic
    │   ├── services/              # Domain services (AI chat, email, payments, tokens, ...)
    │   ├── middlewares/           # Auth, rate limiting, uploads, maintenance guard
    │   ├── config/                 # DB, Passport, Cloudinary, logger, Sentry configuration
    │   ├── scripts/                 # One-off / maintenance scripts (AR codes, sitemap, seeding)
    │   └── app.js                    # Express app wiring
    ├── prisma/
    │   ├── schema.prisma              # Database schema (39 models)
    │   ├── migrations/
    │   └── seed.js
    └── package.json
```

---

## Architecture

The backend follows a layered, MVC-style request pipeline:

```
Client (React SPA)
      │
      ▼
Express App (app.js)
  ├─ Sentry initialization (earliest possible, catches errors from all later middleware)
  ├─ Helmet, CORS, global rate limiting, JSON/urlencoded body parsing, cookies, Passport
  ├─ Maintenance guard (blocks traffic during planned maintenance, with allow-listed paths)
      │
      ▼
Routes  (/api/v1/*, one router per domain)
      │
      ▼
Middlewares  (protect / optionalAuth / adminOnly / staffOrAdmin, endpoint-specific rate limiters)
      │
      ▼
Controllers  (request handling, orchestration, response shaping)
      │
      ▼
Services / Prisma Client
      │
      ▼
PostgreSQL (Supabase)
```

Key points:

- All API routes are versioned under `/api/v1`.
- Authorization is layered: `protect` verifies the JWT and loads the user, while `adminOnly` / `staffOrAdmin` are applied per sub-route group for finer-grained access control within `/admin`.
- Public, customer, and admin concerns live in separate route/controller files per domain (e.g. `bookRoutes.js` for the public catalog vs. the book-management endpoints inside `adminController.js`).
- Sensitive endpoints (login, OTP requests, PIN operations) have dedicated rate limiters layered on top of the global limiter.
- Each payment provider exposes its own IPN/webhook and verification endpoints, decoupled from the core order-creation flow.
- Sentry is wired in before all other middleware and again as an Express error handler, so both request-time and unhandled errors are captured.

---

## Data Model

The Prisma schema (`server/prisma/schema.prisma`) defines the following models, grouped by domain:

- **Identity & access:** `User`, `PendingUser`, `UserCodeSeq`, `RefreshToken`
- **Catalog:** `Book`, `BookVariant`, `Category`, `Tag`, `BookTag`, `Author`, `BookAuthor`, `ProductCodeSeq`
- **Commerce:** `Cart`, `CartItem`, `Order`, `OrderItem`, `PaymentTransaction`, `PaymentIdempotency`, `Coupon`, `Address`
- **Inventory:** `InventoryImport`, `InventoryImportItem`
- **Engagement:** `Review`, `ReviewVote`, `Wishlist`
- **Digital content:** `Ebook`, `Game`, `GameResult`, `ArCode`
- **Kid Mode:** `ChildProfile`, `ChildBookRequest`, `ChildBookAccess`, `ChildActivityLog`, `ChildAuditLog`, `ChildGarden`, `ChildTree`
- **Content/CMS & support:** `NewsPost`, `NewsFile`, `Ticket`, `TicketReply`, `SiteSetting`

The database runs on PostgreSQL, accessed through Prisma with a pooled connection (`DATABASE_URL`) for normal queries and a direct connection (`DIRECT_URL`) for migrations.

---

## API Surface

All endpoints are mounted under `/api/v1`. Major route groups:

| Base path       | Domain                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/auth`         | Registration, login, Google OAuth, password/OTP flows                                                                                                        |
| `/books`        | Public catalog browsing, search, filtering, reviews, wishlist                                                                                                |
| `/categories`   | Public category listing                                                                                                                                      |
| `/cart`         | Shopping cart management                                                                                                                                     |
| `/orders`       | Checkout, order history, cancellation                                                                                                                        |
| `/addresses`    | Customer address book                                                                                                                                        |
| `/children`     | Parent-managed child profiles                                                                                                                                |
| `/parent-pin`   | Parental PIN setup, verification, recovery                                                                                                                   |
| `/kid-access`   | Tokenized, login-free access for children                                                                                                                    |
| `/tickets`      | Customer support ticket submission                                                                                                                           |
| `/payments`     | VNPay / MoMo / Bank QR IPN, webhook, and verification                                                                                                        |
| `/coupons`      | Coupon validation                                                                                                                                            |
| `/loyalty`      | Membership tiers and points                                                                                                                                  |
| `/ai`           | AI chat assistant                                                                                                                                            |
| `/news`         | Blog/news content                                                                                                                                            |
| `/ar`           | AR code lookup and redemption                                                                                                                                |
| `/games`        | Public game play and leaderboards                                                                                                                            |
| `/ebook-reader` | Ebook reading access                                                                                                                                         |
| `/status`       | Public system status                                                                                                                                         |
| `/admin/*`      | Full back-office API — products, categories, orders, users, coupons, AR codes, ebooks, games, reviews, tickets, news, emails, settings, inventory, dashboard |

A generic health check is also exposed at `GET /api/health` outside the versioned prefix. Most admin list endpoints follow a consistent `search` + domain-specific `filter` + `sort`/`orderBy` + `page`/`limit` pagination pattern.

---

## Roles & Access Control

| Role                 | Description                                                                                                                   | Typical access                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Customer**         | Registered adult account that can shop, manage orders/addresses, and create child profiles                                    | Storefront, cart, checkout, orders, loyalty, tickets, child profile management                                |
| **Child (Kid Mode)** | Profile created and restricted by a parent account, reached via PIN or a tokenized kid-access link rather than a normal login | Reading, games, AR content, and the garden/rewards system, scoped to what the parent allows                   |
| **Staff**            | Internal account with elevated access to support and content-management areas                                                 | Tickets, reviews, ebooks, games (a subset of `/admin`)                                                        |
| **Admin**            | Full administrative access                                                                                                    | Entire `/admin` back office: catalog, orders, users, coupons, AR codes, settings, dashboard, email, inventory |

Enforcement happens through backend middleware (`protect`, `adminOnly`, `staffOrAdmin`) rather than being left to the client.

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- A PostgreSQL database (e.g. a Supabase project)
- A Redis instance (for rate limiting)
- API keys/accounts for any third-party services you intend to exercise locally (Cloudinary, Google OAuth, an email provider, payment gateways, Groq)

### Backend setup

```bash
cd server
npm install
cp .env.example .env       # fill in real values — see Environment Variables below
npx prisma generate
npx prisma migrate dev
npm run dev                 # starts the API with nodemon
```

The API is available at `http://localhost:5000/api/v1` by default.

### Frontend setup

```bash
cd client
npm install
# create a .env file with at least VITE_API_URL pointing at your backend
npm run dev
```

The frontend is available at `http://localhost:5173` by default.

> Before running either side against a real database, read the [Security Notes](#security-notes) section below — the repository's git history contains real, since-exposed credentials that must never be reused.

---

## Environment Variables

### Server (`server/.env`)

| Variable                                                                                    | Purpose                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                                                                              | Pooled PostgreSQL connection string (used at runtime)     |
| `DIRECT_URL`                                                                                | Direct PostgreSQL connection string (used for migrations) |
| `PORT`                                                                                      | API server port                                           |
| `NODE_ENV`                                                                                  | Environment mode (`development` / `production`)           |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                                                              | JWT signing configuration                                 |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`                      | Media storage                                             |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_NAME`, `EMAIL_LOGO_URL` | Transactional email (SMTP)                                |
| `RESEND_API_KEY`                                                                            | Resend email provider                                     |
| `STRIPE_SECRET_KEY`                                                                         | Stripe payments                                           |
| `HASH_SALT`                                                                                 | Salt used for Hashids ID obfuscation                      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`                           | Google OAuth login                                        |
| `CLIENT_URL`                                                                                | Frontend base URL (used for redirects/CORS)               |
| `VNPAY_HASH_SECRET`, `VNPAY_URL`                                                            | VNPay payment integration                                 |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT`                  | MoMo payment integration                                  |
| `BANKQR_BANK_CODE`, `BANKQR_ACCOUNT_NO`, `BANKQR_ACCOUNT_NAME`                              | Bank transfer QR generation                               |
| `SEPAY_WEBHOOK_API_KEY`                                                                     | SePay webhook authentication                              |
| `SERVER_URL`                                                                                | Public backend URL (used for callbacks)                   |
| `GROQ_API_KEY`, `GROQ_URL`, `GROQ_MODEL`                                                    | Groq LLM API for the AI chat assistant                    |
| `UPTIMEROBOT_API_KEY`, `UPTIMEROBOT_MONITOR_ID`                                             | Uptime monitoring integration                             |

### Client (`client/.env`)

| Variable                                                                     | Purpose                     |
| ---------------------------------------------------------------------------- | --------------------------- |
| `VITE_API_URL`                                                               | Base URL of the backend API |
| `VITE_FB_PAGE_ID`, `VITE_FB_TOKEN`                                           | Facebook Page integration   |
| `VITE_UMAMI_URL`, `VITE_UMAMI_SITE_ID`, `VITE_UMAMI_USER`, `VITE_UMAMI_PASS` | Umami analytics             |
| `VITE_UPTIMEROBOT_API_KEY`, `VITE_UPTIMEROBOT_MONITOR_ID`                    | Uptime monitoring dashboard |

> **Never commit real credentials.** Both `server/.env` and `client/.env` must be excluded via `.gitignore`, and only placeholder values should ever exist in a committed `.env.example`. See [Security Notes](#security-notes) — this repository's history is a concrete example of what happens when that rule is broken.

---

## Available Scripts

### Server

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `npm run dev`              | Start the API in development mode with nodemon |
| `npm start`                | Start the API in production mode               |
| `npm run db:migrate`       | Run Prisma migrations (`prisma migrate dev`)   |
| `npm run db:studio`        | Open Prisma Studio                             |
| `npm run db:generate`      | Regenerate the Prisma client                   |
| `npm run sitemap:generate` | Generate the public sitemap                    |

### Client

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Build the production bundle          |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

---

## Deployment

The reference deployment uses the following setup, which can serve as a template for new environments:

| Component                   | Provider                            | Notes                                                                                                                         |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Frontend (React/Vite build) | Vercel                              | Configured via `client/vercel.json`; also rewrites requests from known crawler/bot user agents to a prerender service for SEO |
| Backend (Express API)       | Node hosting behind a reverse proxy | `app.set('trust proxy', 1)` is enabled for correct client IP resolution behind Render/Cloudflare-style proxies                |
| Database                    | Supabase (managed PostgreSQL)       | Pooled connection (`DATABASE_URL`, via PgBouncer) for the app, direct connection (`DIRECT_URL`) for migrations                |
| Media storage               | Cloudinary                          | Product images, ebook assets, game assets                                                                                     |
| Cache / rate limiting       | Redis                               | Backs `express-rate-limit` via `rate-limit-redis` for consistency across multiple instances                                   |
| Email delivery              | Nodemailer (SMTP) and/or Resend     | Used for OTP, transactional, and manual admin emails                                                                          |
| Error tracking              | Sentry                              | Both frontend (`@sentry/react`) and backend (`@sentry/node`)                                                                  |
| Uptime monitoring           | UptimeRobot                         | Surfaced on both the admin dashboard and the public status page                                                               |

A typical release flow: push to the main branch → the frontend auto-builds and deploys on Vercel → the backend is redeployed on its host → `prisma migrate deploy` runs against the production database before the new backend version starts serving traffic.

---

## Security Notes

This section documents known security considerations for anyone deploying or extending Earthoria:

- **Secrets in version control:** Historical commits include real API keys and connection strings in `.env`/`.env.example` files. Before any public or production use, all exposed credentials must be rotated and purged from git history, and `.env` files must be gitignored at the repository root.
- **Input validation:** `express-validator` is a listed dependency but is not currently used; request validation is handled ad hoc inside controllers. Centralizing validation (e.g. with `express-validator` or `zod`) is recommended.
- **Error responses:** The global error handler currently returns `err.message` directly to the client, which can leak internal implementation details in some cases.
- **Testing:** There is currently no automated test suite (unit, integration, or end-to-end) and no CI pipeline.

---

## Roadmap

Suggested next steps to move the project toward production-grade maturity:

1. Rotate and purge all leaked credentials; enforce `.gitignore` at the repository root.
2. Introduce automated tests for critical flows (authentication, checkout, payments).
3. Add a CI pipeline (lint, build, test) on pull requests.
4. Centralize request validation and structured logging (Winston is already a dependency but underused).
5. Split large controllers (e.g. the admin product/order/user logic) into smaller, domain-focused modules.
6. Add an audit log for administrative actions (who changed/deleted what, and when).
7. Add API documentation (OpenAPI/Swagger) given the size of the API surface.
8. Consider two-factor authentication for admin/staff accounts.
9. Add real-time notifications (WebSocket/SSE) for new orders and support tickets in the admin dashboard.
10. Extend export/reporting tools (orders, revenue, inventory) beyond the current user-list CSV export.
11. Add device/session management so customers and admins can view and revoke active sessions.

---

## Contributing

Earthoria is currently maintained as a single-owner project. If you would like to propose a change:

1. Open an issue describing the bug, feature request, or improvement.
2. Fork the repository and create a feature branch (`feature/your-feature-name`).
3. Keep changes scoped and follow the existing project structure (routes → controllers → services).
4. Run `npm run lint` on the client before submitting changes to the frontend.
5. Open a pull request with a clear description of what changed and why.

Since the project does not yet have an automated test suite or CI pipeline (see [Roadmap](https://github.com/KaneVina/earthoria#roadmap)), please manually verify affected flows (especially authentication, checkout, and payment callbacks) before submitting a pull request.

---

## License

No open-source license has been published for this repository at this time. All rights are reserved by the project owner unless a license file is added. Please contact the maintainer before reusing, redistributing, or building derivative works from this codebase.

---

## Contact

For questions, collaboration inquiries, or issue reports related to Earthoria, please reach out to the project owner:

|            |                                         |
| ---------- | --------------------------------------- |
| **Name**   | Nguyen Phuc Khang                       |
| **Email**  | wtskane@gmail.com                       |
| **GitHub** | [KaneVina](https://github.com/KaneVina) |
