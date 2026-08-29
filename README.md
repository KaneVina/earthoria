# Earthoria

Earthoria is a full-stack **digital platform for children's reading and learning**, built around a bookstore core and extended with digital reading, augmented reality, educational mini-games, gamified rewards, and a parent-controlled Kid Mode. Rather than being a plain online shop, Earthoria is best described as a *children's content and engagement platform*: commerce is the entry point, but the product is really about giving children a safe, interactive space to read, play, and learn, while giving parents visibility and control over that experience.

| | |
|---|---|
| **Repository** | `KaneVina/earthoria` |
| **Owner / Maintainer** | Nguyen Phuc Khang (Kane) |
| **Phone** | 0849324423 |
| **Email** | wtskane@gmail.com |
| **Live Frontend** | https://earthoria.vercel.app / https://earthoria.id.vn |
| **Live API** | https://api.earthoria.id.vn/api/v1 |

---

## Table of Contents

1. [Overview](#overview)
2. [Platform Philosophy](#platform-philosophy)
3. [Key Features](#key-features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Architecture](#architecture)
7. [Data Model](#data-model)
8. [API Overview](#api-overview)
9. [User Roles](#user-roles)
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

Earthoria lets customers browse and purchase physical and digital children's books, unlock companion ebooks and educational mini-games tied to a book via AR codes, and track rewards through a loyalty program. Parents can create supervised child profiles (Kid Mode), protected by a separate PIN, that restrict which books and games a child can access and log their reading/play activity. The platform also includes a full admin back office for catalog, order, user, coupon, review, and support-ticket management, plus an AI chat assistant for book recommendations.

The project is deployed as a production-style system: the frontend is hosted on Vercel, the backend connects to a managed PostgreSQL database on Supabase, and payments integrate with real Vietnamese payment providers (VNPay, Momo, and bank transfer via QR/SePay webhook).

## Platform Philosophy

Earthoria is designed around three connected layers rather than a single storefront:

1. **Commerce layer** — customers discover, purchase, and manage physical/digital books, much like a conventional e-commerce site.
2. **Content & engagement layer** — every book can be extended with an ebook version, an AR experience, and an educational mini-game, turning a static purchase into an ongoing interactive activity. A gamified "garden" system rewards children for continued engagement.
3. **Family safety layer** — Kid Mode isolates the child's experience behind a parent-owned PIN, restricts which content a child can reach, and gives parents dashboards and activity logs, so the platform can be used directly by children rather than only by the purchasing adult.

This combination — commerce + interactive content + parental control — is what distinguishes Earthoria from a typical online bookstore.

---

## Key Features

### Storefront (Customer-facing)
- Product catalog with search, multi-criteria filtering (category, feature tags, rating), sorting, and pagination
- Product detail pages with reviews, review voting, and wishlist
- Shopping cart and multi-step checkout
- Multiple payment methods: VNPay, Momo, bank transfer QR (SePay webhook)
- Order history, order cancellation, and delivery confirmation
- Address book management
- Coupon/discount code validation at checkout
- Loyalty tiers and points profile
- Support ticket submission
- AI-powered chat assistant for book recommendations

### Digital & Interactive Content
- Ebook reader accessible via unique book links
- Educational mini-games tied to specific books, with per-book leaderboards
- AR (Augmented Reality) codes that unlock 3D/interactive book content
- "Garden" gamification system that rewards reading/play activity for children

### Kid Mode (Parental Controls)
- Parent-managed child profiles, independent of the main account login
- Parent PIN system (set, verify, change, and recover via OTP) to gate access to parental settings
- Per-child book visibility controls and settings
- Profile locking/unlocking, soft delete, and permanent deletion (PIN + name confirmation required)
- Tokenized "kid access" links that let a child use the platform without a full login
- Per-child activity logging and dashboards for parents

### Admin / Back Office
- Dashboard with system and business metrics
- Product (book) management: create, edit, delete, variants, images, AI-assisted content drafting
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
- Server/system status check

### Authentication & Account
- Email/password registration with OTP verification
- Google OAuth login
- JWT-based authentication with refresh tokens
- Forgot password / reset password via OTP
- Profile management and password changes

---

## Tech Stack

### Backend
| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM / Database | Prisma 6, PostgreSQL (Supabase) |
| Authentication | JSON Web Tokens (jsonwebtoken), Passport.js (Google OAuth 2.0), bcrypt |
| Security | Helmet, CORS, express-rate-limit (with Redis-backed store via ioredis / rate-limit-redis) |
| File Uploads | Multer, Cloudinary |
| Email | Nodemailer, Resend |
| Payments | Stripe SDK, custom VNPay / Momo / Bank QR (SePay) integrations |
| Logging | Winston, Morgan |
| Utilities | Hashids (obfuscated IDs), Slugify |

### Frontend
| Category | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Data Fetching | TanStack React Query, Axios |
| Routing | React Router 7 |
| 3D / AR | Three.js, @react-three/fiber, @react-three/drei |
| Charts | Recharts, ECharts |
| Forms & Validation | React Hook Form, Zod |
| Animation | Framer Motion, GSAP, Lenis |
| Maps | Leaflet, React-Leaflet |
| Other | jsPDF, html2canvas, XLSX (Excel export), QRCode.react, Swiper |

### Infrastructure & Tooling
- Database hosting: Supabase (PostgreSQL, pooled connection via PgBouncer)
- Frontend hosting: Vercel
- Media storage/CDN: Cloudinary
- Cache / rate-limit store: Redis
- Linting: ESLint (client)

---

## Project Structure

```
earthoria/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level views
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client functions
│   │   ├── store/              # Zustand state stores
│   │   ├── games/              # Mini-game implementations
│   │   └── utils/              # Frontend utilities
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
└── server/                     # Express backend
    ├── src/
    │   ├── routes/              # Express route definitions (one file per domain)
    │   ├── controllers/         # Request handlers / business logic
    │   ├── services/            # Domain services (e.g. AI chat, payments)
    │   ├── middlewares/         # Auth, rate limiting, uploads, maintenance guard
    │   ├── config/               # DB, Passport, and other configuration
    │   ├── scripts/              # One-off / maintenance scripts
    │   └── app.js                 # Express app configuration
    ├── prisma/
    │   ├── schema.prisma          # Database schema (38 models)
    │   ├── migrations/
    │   └── seed.js
    └── package.json
```

---

## Architecture

The backend follows a layered MVC-style architecture:

```
Client (React SPA)
      │
      ▼
Express App (app.js)
  ├─ Global middleware: Helmet, CORS, rate limiting, cookie parsing, Passport
  ├─ Maintenance guard
      │
      ▼
Routes (/api/v1/*)
      │
      ▼
Middlewares (protect / optionalAuth / adminOnly / staffOrAdmin)
      │
      ▼
Controllers (request validation, orchestration, response shaping)
      │
      ▼
Services / Prisma Client
      │
      ▼
PostgreSQL (Supabase)
```

Key architectural points:
- All API routes are versioned under `/api/v1`.
- Authorization is layered: `protect` (verifies JWT and loads the user) is applied at the router level for admin routes, with `adminOnly` or `staffOrAdmin` applied per sub-route group for finer-grained access control.
- Public, customer, and admin concerns are separated into distinct route/controller files per domain (e.g. `bookRoutes` vs. `adminController` product endpoints).
- Sensitive endpoints (login, OTP requests, PIN operations) have dedicated rate limiters in addition to the global rate limiter.
- Payment providers each expose dedicated IPN/webhook and verification endpoints, decoupled from the core order flow.

---

## Data Model

The Prisma schema defines 38 models, grouped by domain:

- **Identity & Access:** `User`, `PendingUser`, `UserCodeSeq`, `RefreshToken`
- **Catalog:** `Book`, `BookVariant`, `Category`, `Tag`, `BookTag`, `Author`, `BookAuthor`, `ProductCodeSeq`
- **Commerce:** `Cart`, `CartItem`, `Order`, `OrderItem`, `PaymentTransaction`, `PaymentIdempotency`, `Coupon`, `Address`
- **Inventory:** `InventoryImport`, `InventoryImportItem`
- **Engagement:** `Review`, `ReviewVote`, `Wishlist`
- **Digital Content:** `Ebook`, `Game`, `GameResult`, `ArCode`
- **Kid Mode:** `ChildProfile`, `ChildBookAccess`, `ChildActivityLog`, `ChildAuditLog`, `ChildGarden`, `ChildTree`
- **Support & Ops:** `Ticket`, `TicketReply`, `SiteSetting`

---

## API Overview

The API exposes roughly 150 endpoints across 23 functional modules, all under the `/api/v1` prefix. Major route groups include:

| Base Path | Domain |
|---|---|
| `/auth` | Registration, login, OAuth, password/OTP flows |
| `/books` | Public catalog browsing, search, filtering, reviews, wishlist |
| `/categories` | Public category listing |
| `/cart` | Shopping cart management |
| `/orders` | Checkout, order history, cancellation |
| `/addresses` | Customer address book |
| `/children` | Parent-managed child profiles |
| `/parent-pin` | Parental PIN setup, verification, and recovery |
| `/kid-access` | Tokenized, login-free access for children |
| `/tickets` | Customer support ticket submission |
| `/payments` | VNPay / Momo / Bank QR IPN, webhook, and verification |
| `/coupons` | Coupon validation |
| `/loyalty` | Membership tiers and points |
| `/ai` | AI chat assistant |
| `/ar` | AR code lookup and redemption |
| `/games` | Public game play and leaderboards |
| `/ebook-reader` | Ebook reading access |
| `/admin/*` | Full back-office API (products, categories, orders, users, coupons, AR codes, ebooks, games, reviews, tickets, emails, settings, inventory, dashboard) |

Most admin list endpoints support a consistent pattern of `search`, one or more domain-specific `filter` parameters, `sort`/`orderBy`, and `page`/`limit` pagination.

---

## User Roles

Earthoria defines three primary roles, enforced through backend authorization middleware (`protect`, `adminOnly`, `staffOrAdmin`):

| Role | Description | Typical Access |
|---|---|---|
| **Customer** | A registered adult account that can shop, manage orders/addresses, and create child profiles | Storefront, cart, checkout, orders, loyalty, tickets, child profile management |
| **Child (Kid Mode)** | A profile created and restricted by a parent/customer account, accessed via PIN or a tokenized kid-access link rather than a normal login | Reading, games, AR content, and the garden/rewards system, scoped to what the parent has allowed |
| **Staff** | An internal account with elevated access to support and content-management areas of the admin back office | Tickets, reviews, ebooks, games (subset of `/admin`) |
| **Admin** | Full administrative access | Full `/admin` back office: catalog, orders, users, coupons, AR codes, settings, dashboard, email, inventory |

---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- A PostgreSQL database (e.g. a Supabase project)
- Redis instance (for rate limiting)
- Accounts/API keys for the third-party services you intend to use (Cloudinary, Google OAuth, email provider, payment gateways) as applicable

### Backend Setup

```bash
cd server
npm install
cp .env.example .env       # fill in real values — see Environment Variables below
npx prisma generate
npx prisma migrate dev
npm run dev                 # starts the API with nodemon
```

The API will be available at `http://localhost:5000/api/v1` by default.

### Frontend Setup

```bash
cd client
npm install
# create a .env file with at least VITE_API_URL pointing to your backend
npm run dev
```

The frontend will be available at `http://localhost:5173` by default.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string (used at runtime) |
| `DIRECT_URL` | Direct PostgreSQL connection string (used for migrations) |
| `PORT` | API server port |
| `NODE_ENV` | Environment mode (`development` / `production`) |
| `JWT_ACCESS_SECRET`, `JWT_EXPIRES_IN` | JWT signing configuration |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media storage |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_NAME`, `EMAIL_LOGO_URL` | Transactional email (SMTP) |
| `RESEND_API_KEY` | Resend email provider |
| `STRIPE_SECRET_KEY` | Stripe payments (if enabled) |
| `HASH_SALT` | Salt used for Hashids ID obfuscation |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth login |
| `CLIENT_URL` | Frontend base URL (used for redirects/CORS) |
| `VNPAY_HASH_SECRET`, `VNPAY_URL` | VNPay payment integration |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT` | Momo payment integration |
| `BANKQR_BANK_CODE`, `BANKQR_ACCOUNT_NO`, `BANKQR_ACCOUNT_NAME` | Bank transfer QR generation |
| `SEPAY_WEBHOOK_API_KEY` | SePay webhook authentication |
| `SERVER_URL` | Public backend URL (used for callbacks) |
| `UPTIMEROBOT_API_KEY`, `UPTIMEROBOT_MONITOR_ID` | Uptime monitoring integration |

### Client (`client/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |
| `VITE_GROQ_KEY`, `VITE_GROQ_URL`, `VITE_GROQ_MODEL` | Groq LLM API for AI chat features |
| `VITE_FB_PAGE_ID`, `VITE_FB_TOKEN` | Facebook Page integration |
| `VITE_UMAMI_URL`, `VITE_UMAMI_SITE_ID`, `VITE_UMAMI_USER`, `VITE_UMAMI_PASS` | Umami analytics |
| `VITE_UPTIMEROBOT_API_KEY`, `VITE_UPTIMEROBOT_MONITOR_ID` | Uptime monitoring dashboard |

> **Important:** Never commit real credentials to version control. Both `server/.env` and `client/.env` should be excluded via `.gitignore`, and only placeholder values should exist in any committed `.env.example` file.

---

## Available Scripts

### Server
| Command | Description |
|---|---|
| `npm run dev` | Start the API in development mode with nodemon |
| `npm start` | Start the API in production mode |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate the Prisma client |

### Client
| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

The reference deployment for Earthoria uses the following setup, which can be used as a template for new environments:

| Component | Provider | Notes |
|---|---|---|
| Frontend (React/Vite build) | Vercel | Configured via `client/vercel.json`; connects to the production API URL |
| Backend (Express API) | Node hosting behind a reverse proxy | `app.set('trust proxy', 1)` is enabled for correct client IP resolution behind Render/Cloudflare-style proxies |
| Database | Supabase (managed PostgreSQL) | Uses a pooled connection (`DATABASE_URL`, via PgBouncer) for the app and a direct connection (`DIRECT_URL`) for migrations |
| Media storage | Cloudinary | Product images, ebook assets, game assets |
| Cache / Rate limiting | Redis | Backs `express-rate-limit` via `rate-limit-redis` for multi-instance consistency |
| Email delivery | SMTP (Nodemailer) and/or Resend | Used for OTP, transactional, and manual admin emails |
| Uptime monitoring | UptimeRobot | Status surfaced both to the admin dashboard and the public status widget |
| Analytics | Umami | Self-hosted, privacy-friendly analytics for the storefront |

A typical deployment flow: push to the main branch → frontend auto-builds and deploys on Vercel → backend is redeployed on its host → `prisma migrate deploy` is run against the production database before the new backend version starts serving traffic.

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

Since the project does not yet have an automated test suite or CI pipeline (see [Roadmap](#roadmap)), please manually verify affected flows (especially authentication, checkout, and payment callbacks) before submitting a pull request.

---

## License

No open-source license has been published for this repository at this time. All rights are reserved by the project owner unless a license file is added. Please contact the maintainer before reusing, redistributing, or building derivative works from this codebase.

---

## Contact

For questions, collaboration inquiries, or issue reports related to Earthoria, please reach out to the project owner:

| | |
|---|---|
| **Name** | Nguyen Phuc Khang |
| **Phone** | 0849324423 |
| **Email** | wtskane@gmail.com |
| **GitHub** | [KaneVina](https://github.com/KaneVina) |
