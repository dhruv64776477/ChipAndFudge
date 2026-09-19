# The Chip & Fudge - Production QR Ticket Management System

Production-ready QR-based ticket management system for **“The Chip & Fudge”** dessert stall built with Next.js (App Router), TypeScript, Mongoose, WebAuthn Passkeys, and atomic MongoDB operations.

---

## Architecture & Security Highlights

1. **Token Security & Privacy**:
   - Customer tickets use 32-byte cryptographically secure random tokens (`crypto.randomBytes(32).toString('hex')`).
   - The database **only stores a SHA-256 hash** (`qrTokenHash`). The raw token is NEVER stored in the database.
   - Public customer endpoint `/api/tickets/[token]` exposes ONLY safe display information (`ticketId`, `name`, `status`, `createdAt`, `closedAt`). Never exposes hashes, credentials, or internal IDs.

2. **Atomic State Transitions**:
   - Status transitions strictly follow `OPEN` → `CLOSED`.
   - Ticket closing uses an atomic `findOneAndUpdate({ qrTokenHash, status: 'OPEN' })`.
   - Concurrent scans cannot double-close. Once `CLOSED`, there is no API to reopen a ticket.

3. **Single Master Admin Device**:
   - Only ONE master device can be registered via WebAuthn/Passkeys (Windows Hello, Touch ID, Face ID, or security key).
   - Server-side enforcement in `AdminDevice` model rejects any second registration attempts with `403 Forbidden`.
   - Admin sessions use encrypted, HTTP-only, secure cookies (`cf_admin_session`) with `sameSite: lax`.
   - Server middleware intercepts and protects all `/admin/*` and `/api/admin/*` routes.

4. **Network & Local Testing**:
   - `allowedDevOrigins: ['10.27.35.164', 'localhost']` configured in `next.config.ts`.
   - Browser WebAuthn requires a secure context (HTTPS or `localhost`). When testing from a mobile phone or secondary device over local Wi-Fi (`http://10.27.35.164:3000`), the setup and login pages provide a dedicated **Local Network Mode** so you can test stall operations seamlessly without needing SSL certificates!

---

## Directory Structure

```text
the-chip-and-fudge/
├── app/
│   ├── (public)/
│   │   └── t/
│   │       └── [token]/
│   │           └── page.tsx           # Mobile-first customer ticket page
│   ├── admin/
│   │   ├── page.tsx                   # Stall admin dashboard
│   │   ├── scanner/
│   │   │   └── page.tsx               # Camera QR scanner (Section 15 flow)
│   │   ├── tickets/
│   │   │   ├── page.tsx               # All tickets history
│   │   │   └── new/
│   │   │       └── page.tsx           # POS ticket creation with Name & Mobile
│   │   ├── setup/
│   │   │   └── page.tsx               # Master passkey device enrolment
│   │   └── login/
│   │       └── page.tsx               # Biometric passkey login
│   └── api/
│       ├── tickets/
│       │   └── [token]/
│       │       └── route.ts           # Public customer lookup (SHA-256 query)
│       └── admin/
│           ├── auth/
│           │   ├── register/          # WebAuthn enrolment endpoints
│           │   ├── login/             # WebAuthn assertion endpoints
│           │   ├── session/           # Session check
│           │   └── logout/            # Session clear
│           └── tickets/
│               ├── route.ts           # List tickets & POS creation
│               └── [token]/
│                   ├── route.ts       # Admin inspection (name + mobile)
│                   └── close/
│                       └── route.ts   # Atomic OPEN -> CLOSED close
├── components/
│   ├── ticket/
│   │   ├── TicketCard.tsx
│   │   ├── TicketStatus.tsx
│   │   └── TicketQRCode.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── TicketScanner.tsx
│       └── TicketResult.tsx
├── lib/
│   ├── mongodb.ts
│   ├── auth/                          # Session, admin validator, WebAuthn
│   ├── tickets/                       # Token generation & TicketService
│   ├── security/                      # SHA-256 hashing & sliding window rate limiter
│   └── validation/                    # Zod ticket schema
├── models/
│   ├── Ticket.ts                      # name, mobNo, ticketId, qrTokenHash, status
│   ├── AdminDevice.ts                 # deviceId, webauthnCredentialId, counter
│   └── AuditLog.ts                    # TICKET_CREATED, TICKET_CLOSED, ADMIN_LOGIN
├── middleware.ts                      # Route protection for admin panel
└── .env.local
```

---

## Setup & Running Locally

1. **Environment Configuration**:
   Create or edit `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chip_and_fudge
   WEBAUTHN_RP_NAME=The Chip & Fudge
   WEBAUTHN_RP_ID=localhost
   WEBAUTHN_ORIGIN=http://localhost:3000
   SESSION_SECRET=chip_and_fudge_ultra_secure_session_secret_2026_dev_key_32bytes_min
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://10.27.35.164:3000` over your Wi-Fi).

3. **Master Device Setup**:
   - Navigate to `/admin/setup`.
   - On `http://localhost:3000`, click **Register Biometric Passkey** to enroll via Windows Hello, Touch ID, or security key.
   - If accessing from a phone or other device over your local Wi-Fi IP (`http://10.27.35.164:3000`), click **Authorize Master Device (Local Network Mode)** to bypass the browser's plain-HTTP restriction.

4. **Issue Tickets**:
   - Visit `/admin/tickets/new`. Enter customer Name (`Dhruv`), Mobile (`9876543210`), and select the brownie bowl.
   - Click **Create Ticket** to generate the unique QR slip and copy/print the customer tracking link.

5. **Customer Live View**:
   - Open `/t/<token>`. You will see the live ASCII-inspired dessert card showing `🟢 OPEN` with auto-polling.

6. **Fulfill & Close with Camera**:
   - Go to `/admin/scanner`.
   - Align the QR code in the viewfinder.
   - The scanner shows **Ticket Found** with customer name, mobile, and status `OPEN`.
   - Click **[ CLOSE TICKET ]**. The order atomically transitions to `🔴 CLOSED` with a celebration chime.
   - The customer's mobile page automatically updates to `🔴 CLOSED` with celebration confetti!

---

## Security Test Matrix

- **Test 1 (Unauthenticated Close Call)**:
  `POST /api/admin/tickets/<token>/close` without a valid admin cookie returns `401 Unauthorized`.
- **Test 2 (Frontend Tampering)**:
  Direct HTTP requests without the server-side HTTP-only session cookie are rejected.
- **Test 3 (Prevent Ticket Reopening)**:
  No update or reopen endpoint exists. Only `OPEN` → `CLOSED` is supported.
- **Test 4 (Double-Close Prevention)**:
  Atomic `findOneAndUpdate({ qrTokenHash, status: 'OPEN' })` guarantees that only the first scan closes the ticket. A second scan returns `409 Conflict: Ticket is already CLOSED`.
- **Test 5 (Brute Force Protection)**:
  Tokens are 256-bit random hex strings. Unrecognized tokens return `404 Not Found`. Rate limiting blocks spamming.
- **Test 6 (Second Admin Registration)**:
  Once an admin device is active, calling `/api/admin/auth/register/*` returns `403 Forbidden: Registration rejected. Only one active master admin device is permitted.`
