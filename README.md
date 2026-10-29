# 🌿 SIBAQ NARIYAL SWALATH TRACKER
### *A Modern, Animated, Relaxing Islamic Digital Garden & 33-Count Dhikr Tracker*

Built for **151 Sibaq Candidates** reciting the daily Islamic dhikr of **Nariyal Swalath (الصلاة النارية / التفريجية) 33 times**.

---

## 🌟 Highlights & Core Features

1. **Sage & Cream × Samsung One UI Animated Atmosphere**:
   - **Minimalist Palette**: Warm cream (`#FAF9F6`), Soft sage (`#A3B18A`), Forest green (`#344E41`), Pale lime (`#E9EDC9`), White (`#FFFFFF`), and Muted surface (`#F0F1E9`).
   - **Seamless Flowing Ambient Gradient**: Continuous 22-second gradient flow shifting between warm cream and muted sage.
   - **5 Oversized Organic Gradient Orbs**: Diffused with 100px–130px blur radii moving continuously across non-repeating 14–24s loops with varying speeds and subtle scaling.
   - **Sparse, Understated Floating Dots**: 14 translucent dots with gentle horizontal and vertical drift (never distracting).
   - **Scroll-Responsive Parallax**: Smooth, restrained depth on scroll without scrolljacking or layout shift.
   - **Samsung One UI Frosted Glass Cards**: Squircle rounded corners (`28px–32px`), `backdrop-filter: blur(24px) saturate(160%)`, fine translucent borders, and clean white content surfaces.
   - **Hero Section Entrance**: Soft sage and pale lime gradient glows with gentle 700ms fade-and-rise animations and staggered reveals.

2. **Accurate & Satisfying 33-Count Calculator**:
   - Prominent numerical display (`X / 33`).
   - Circular SVG Progress Ring with smooth transitions (0%, 33%, 66%, 100%).
   - Tactile count button with micro-burst sparkles, atomic database persistence, and rapid click debouncing.
   - Undo feature with confirmation modal.
   - Strict 33 cap — impossible to exceed 33.

3. **Recitation Pace & Time Estimator**:
   - Automatically tracks intervals between confirmed recitations.
   - Averages the last 5 valid recitation durations (filtering out breaks/pauses > 5 mins).
   - Dynamically calculates estimated remaining time to complete 33 recitations.
   - Animated text-fill highlight that sweeps across the Arabic words in cadence with recitation.

4. **😢 The Giant Crying Emoji for Incomplete Tasks**:
   - Intentionally oversized (150–200px desktop, 110–160px mobile).
   - Subtle floating/breathing animation in its own dedicated card.
   - Dynamic real-time message: *"Today's task is still waiting for you 🌱 — You've completed X of 33 recitations (Y remaining). Continue whenever you're ready."*
   - Vanishes immediately upon reaching 33/33 and is replaced by the celebratory completion experience!

5. **✨ Signature Feature: Relaxation Emoji Fireworks**:
   - Triggered via the **`✨ Release Some Calm`** button or on 33/33 completion.
   - Launches **100–180 small emoji particles** (`🌿 🍃 🌸 🌼 ✨ ⭐ 🦋 ☁️ 🫧 💚 🌱 🌷 💫`) in 3 staggered waves.
   - High-performance HTML5 Canvas physics engine: upward trajectories, gentle rotation, air resistance, and automatic memory cleanup.
   - `pointer-events: none` — never blocks clicks or screen readers.

6. **🌿 Peaceful Pause Corner**:
   - **Breathing Visual**: Slowly expanding and contracting glowing emerald orb with Start/Stop controls.
   - **20-20-20 Eye-Rest Reminder**: Gentle visual rest prompt.
   - **Full Quiet Pause Mode**: Quiet resting screen that preserves current progress intact.
   - **Ambient Meditative Sound**: Self-contained Web Audio API harmonic drone generator (default OFF, with volume slider).

7. **🎉 Completion Celebration**:
   - Full emerald ring with gold checkmark.
   - Multi-wave emoji fireworks burst.
   - Congratulatory Islamic blessing modal (*"Jazākallāhu khair! 🌿 Alhamdulillah, today's Nariyal Swalath task is complete. 33 / 33 — Completed"*).

8. **🛡️ Convenor Administrative Dashboard (`/admin`)**:
   - Live metrics: Total Candidates (151), Completed Today, In Progress, Not Started, Incomplete, Overall Completion Rate (%).
   - Asia/Kolkata date selector to view historical daily performance.
   - Search by admission number (`SBQ-...`) or candidate name.
   - Filter by status (All, Completed, In Progress, Not Started, Incomplete).
   - Candidate actions: View 30-day task history, Reset password, Toggle account active/disabled.
   - **CSV Import (151 Candidates)**: Batch import with validation, duplicate detection, and sample CSV download.
   - **CSV Export**: Filtered export of daily records.
   - **Administrative Audit Logs**: Full tamper-evident audit history of logins, completions, password changes, and CSV imports.

---

## 🛠️ Technical Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom emerald color system and custom typography
- **Motion**: Framer Motion + HTML5 Canvas Particle Engine
- **Icons**: Lucide React
- **Validation**: Zod
- **Authentication**: Secure HTTP-only JWT session cookies, bcryptjs password hashing, rate limiting, and server-side role verification
- **Database Engine**: Persistent LibSQL/SQLite database (`data/sibaq.db`) with full Supabase PostgreSQL migration compatibility (`supabase/migrations/001_initial_schema.sql`)
- **Timezone**: `Asia/Kolkata` (IST, UTC+5:30)

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
cd sibaq-nariyal-swalath
npm install
```

### 2. Initialize / Seed Database

Pre-populates the admin account and all **151 Sibaq candidates** (`SBQ-1001` through `SBQ-1151`) with authentic names and demo task states:

```bash
npm run seed
```

### 3. Run Automated Tests

Verifies counting logic, 33 cap, undo behavior, timing calculations, bcrypt hashing, JWT verification, and rate limiting:

```bash
npm test
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Start

```bash
npm run build
npm start
```

---

## 🔐 Credentials for Evaluation

### Admin Convenor
- **Admission No**: `admin`
- **Password**: `Admin@Sibaq2026!`
- **Access**: Full Convenor Dashboard at `/admin`

### Sibaq Candidates (151 Accounts Available)
- **Admission Nos**: `SBQ-1001` to `SBQ-1151` (e.g. `SBQ-1001`, `SBQ-1002`, `SBQ-1050`, etc.)
- **Password**: `Sibaq@Candidate2026!`
- **Access**: Candidate Dhikr Garden at `/`

*(Quick demo buttons are also provided directly on the login page for instant one-click testing!)*

---

## ☁️ Supabase Cloud Deployment (Optional)

If deploying to Supabase PostgreSQL cloud:

1. Create a project on [supabase.com](https://supabase.com).
2. Go to the SQL Editor in Supabase and run `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/seed.sql` to populate initial site settings and admin profile.
4. Set the following environment variables in `.env.local` or your hosting provider (e.g. Vercel):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=your-32-char-secure-jwt-secret
   DEFAULT_TIMEZONE=Asia/Kolkata
   ```

---

## ♿ Accessibility & Performance

- **Reduced Motion**: Automatically honors `prefers-reduced-motion` and includes an explicit toggle in User Settings (Full, Reduced, Off).
- **High Performance Particles**: Canvas-based emoji fireworks ensure 60 FPS without DOM thrashing or memory leaks. All particles are marked `pointer-events: none`.
- **Audio Autoplay Safety**: All ambient sound starts in a muted/stopped state and requires explicit candidate interaction.
- **Single-Hand Mobile Usability**: Big 80px touch count button placed in the comfortable bottom-middle thumb zone for mobile recitation.
