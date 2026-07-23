# 🌙 Lumina Dreams

> **AI-powered cosmic dream journal.** Record your dreams, receive deep psychological and symbolic AI interpretations, generate dream imagery and short videos, and uncover the hidden patterns of your subconscious mind.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dream Journal** | Log dreams with title, date, full text, mood tags, and lucid flag |
| **AI Interpretation** | AI interprets each dream using psychology, mythology, and cultural context |
| **Image Generation** | xAI image generation creates a vivid visual from each dream |
| **Video Generation** | xAI video generation renders a short motion visualization |
| **Pattern Analysis** | After 5 dreams, AI surfaces recurring themes and symbols |
| **Mind-state Diagnosis** | Gentle, actionable mental/emotional state insights |
| **Insights Dashboard** | Charts, word clouds, and theme timelines |
| **Full Library** | Search, filter, and browse your entire dream history |

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components, TypeScript)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix primitives
- **Animations:** Framer Motion
- **Database / Auth / Storage:** Supabase (PostgreSQL, RLS, Auth, Storage)
- **AI:** xAI text, image, and video generation APIs
- **Fonts:** Inter (UI) + Playfair Display (dream titles and insights)
- **Icons:** lucide-react
- **Validation:** Zod
- **Date handling:** date-fns

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.11
- npm >= 10
- A Supabase account (free tier works)
- An xAI API key at https://console.x.ai

### 1 — Clone & install

```bash
git clone <your-repo-url> lumina-dreams
cd lumina-dreams
npm install
```

### 2 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 for local dev |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page — "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page — "service_role" key (server-only) |
| `XAI_API_KEY` | https://console.x.ai > API Keys |

### 3 — Create the Supabase project

1. Go to https://app.supabase.com > New project
2. Note your Project URL and anon key (add to .env.local)
3. Enable Auth (Email + Magic Link), Storage, and verify RLS is on by default

Full database schema and RLS policies are provided in Phase 2 of the build guide.

### 4 — Run development server

```bash
npm run dev
```

Open http://localhost:3000 to see the cosmic landing page.

### 5 — Verify before deploy

```bash
npm run verify
```

This runs linting, TypeScript checks, and a production build so deployment issues surface before shipping.

### 5b — Run automated tests

```bash
npm run test
```

For local development, use watch mode:

```bash
npm run test:watch
```

To generate a coverage report:

```bash
npm run test:coverage
```

### 6 — Deploy

- Set `NEXT_PUBLIC_APP_URL` to your production domain.
- Add the same environment variables in your hosting provider.
- Deploy on Vercel or any Node-compatible platform that supports Next.js App Router.
- Confirm auth callbacks, media generation, and protected routes in production after the first deploy.

---

## 📁 Project Structure

```
lumina-dreams/
├── app/
│   ├── globals.css         # Tailwind v4 + cosmic design tokens
│   ├── layout.tsx          # Root layout (fonts, ThemeProvider)
│   └── page.tsx            # Public landing page
├── components/
│   ├── providers/          # ThemeProvider (next-themes)
│   ├── starfield/          # Canvas starfield animation
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Reusable React hooks
├── lib/
│   ├── constants.ts        # App-wide constants and config
│   └── utils.ts            # cn() and shared utilities
├── types/
│   └── index.ts            # Shared TypeScript interfaces
├── .env.example            # Reference env template
├── .env.local              # Real secrets — DO NOT COMMIT
└── next.config.ts
```

---

## 🎨 Design System

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| cosmic-deep | #1a0f2e | Deepest background |
| cosmic-midnight | #0f172a | Near-black navy |
| cosmic-gold | #d4af77 | Warm accent, headings |
| cosmic-teal | #67e8f9 | Luminous cyan accent |
| cosmic-purple | #c084fc | Primary / interactive |
| cosmic-nebula | #7c3aed | Deep violet |

### Typography

- UI body / navigation — Inter (sans-serif)
- Dream titles / key insights — Playfair Display (serif, italic)

### Custom Utility Classes

| Class | Effect |
|---|---|
| .text-gradient-gold | Animated shimmer gold gradient text |
| .text-gradient-cosmic | Purple to teal shimmer gradient text |
| .glass-card | Glassmorphism surface |
| .glass-card-hover | Hover lift effect |
| .glow-purple / .glow-teal / .glow-gold | Coloured box-shadow glow |
| .font-script | Playfair Display italic |
| .divider-cosmic | Gradient horizontal rule |

---

## 🔒 Security Notes

- SUPABASE_SERVICE_ROLE_KEY bypasses RLS — only used server-side, never client-side.
- All user-facing data is protected by Supabase Row Level Security (Phase 2).
- Environment secrets are never hard-coded.

---

## 📦 Build Phases

1. ✅ Phase 1 — Project init, design system, cosmic UI shell
2. Phase 2 — Supabase schema and database setup
3. Phase 3 — Authentication (email + magic link)
4. Phase 4 — Full layout (sidebar, header, dashboard shell)
5. Phase 5 — Dream logging and CRUD
6. Phase 6 — AI dream interpretation
7. Phase 7 — AI image and video generation
8. Phase 8 — Dashboard home with recent dreams
9. Phase 9 — Insights and pattern analysis
10. Phase 10 — Library, search, settings and polish
11. Phase 11 — Testing, deployment and final review

---

## 📄 License

MIT

---

## ✅ Phase 11 Release Ops

For deployment parity checks, smoke tests, and final sign-off:

- `docs/phase-11-release-checklist.md`
