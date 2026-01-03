# My Path Finder 🎓

> A mobile-first career guidance questionnaire app for South African learners. Submissions are sent to a guardian for LLM analysis.

![Mobile-first](https://img.shields.io/badge/Mobile-First-blue) ![isiZulu + English](https://img.shields.io/badge/Language-isiZulu%20%7C%20English-green) ![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7)

## Overview

My Path Finder ("Umtholampilo Wami" in isiZulu) is a guided questionnaire that collects learner responses about their education situation, interests, and constraints. **The app does not show recommendations to the learner** — instead, responses are submitted to a guardian (at `brainstein@protonmail.com`) for professional analysis.

### Key Features

- 📱 **Mobile-first design** - Works on low-end Android, 320px+ width
- 🌍 **Bilingual** - isiZulu (default) and simplified English (Grade 6-7 level)
- 💾 **Autosave** - Progress saves to localStorage, resume anytime
- ✉️ **Server-confirmed submission** - Reliable delivery with retry/queue
- 🔒 **Privacy-first** - No server-side storage of answers, consent required

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
cd /home/epistemophile/Development/Career_Guide-V2
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

### Production Build

```bash
npm run build
npm run preview  # Test the production build
```

Deploy the `dist/` folder to Netlify (or similar static hosting).

---

## Submission Flow

### How It Works

1. Learner completes all questionnaire questions
2. Consent screen appears: "I agree to send my answers to the guardian for review"
3. Upon consent, a canonical JSON payload is generated with a unique `submission_id`
4. Payload is POSTed to `/.netlify/functions/submit`
5. Serverless function emails the payload to `brainstein@protonmail.com` via Resend API
6. On success: confirmation screen shown
7. On failure: payload queued in localStorage for retry

### Retry & Idempotency

- Failed submissions are queued locally with their `submission_id`
- Retry button attempts resubmission
- `submission_id` ensures no duplicate emails (idempotent)
- Queued submissions persist across browser sessions

### Payload Schema

See [`examples/submission.sample.json`](examples/submission.sample.json) for the full structure.

```json
{
  "submission_id": "uuid-v4",
  "created_at": "ISO-8601 timestamp",
  "questionnaire_version": "1.0.0",
  "language_used": "en|zu",
  "answers": { "question_id": "value" },
  "free_text_fields": { "question_id": "text" },
  "derived_fields": {
    "attendance_band": "high|medium|low",
    "practical_preference_band": "high|medium|low",
    "constraint_flags": ["transport", "financial", ...]
  },
  "metadata": {
    "completion_duration_seconds": 420,
    "device_locale": "en-ZA"
  }
}
```

---

## Environment Setup

### Local Development

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Netlify Deployment

Set these environment variables in Netlify's dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | ✅ | API key from [resend.com](https://resend.com) |
| `RECIPIENT_EMAIL` | ❌ | Override recipient (default: `brainstein@protonmail.com`) |
| `FROM_EMAIL` | ❌ | Sender email (default: `onboarding@resend.dev`) |

> ⚠️ **Never commit API keys to the repo!**

### Getting a Resend API Key

1. Sign up at [resend.com](https://resend.com) (free tier available)
2. Create an API key
3. Add it to Netlify environment variables as `RESEND_API_KEY`

---

## Configuration

All questionnaire content is in versioned config files. **No code changes needed to tune questions.**

| File | Purpose |
|------|---------|
| `config/questionnaire.v1.json` | Questions, options, branching logic |
| `config/scoring.v1.json` | Scoring thresholds (used for derived_fields) |
| `config/locales/en.json` | English translations |
| `config/locales/zu.json` | isiZulu translations |

---

## How Autosave Works

```
User answers question
       ↓
State updated in React
       ↓
useEffect triggers save
       ↓
Full state saved to localStorage
Key: "career_guide_v1_progress"
       ↓
On page reload, resume prompt shown
```

---

## File Structure

```
/Career_Guide-V2/
├── config/
│   ├── locales/
│   │   ├── en.json           # English translations
│   │   └── zu.json           # isiZulu translations
│   ├── questionnaire.v1.json # Questions + branching
│   └── scoring.v1.json       # Scoring (for derived_fields)
├── examples/
│   └── submission.sample.json # Example payload
├── netlify/
│   └── functions/
│       └── submit.js         # Serverless email function
├── src/
│   ├── components/           # React components
│   ├── engine/               # Branching, scoring logic
│   ├── hooks/                # useAutosave, useI18n
│   ├── utils/                # Submission utilities
│   ├── App.jsx               # Main app
│   └── index.css             # Styles
├── .env.example
├── package.json
└── README.md
```

---

## Privacy & Consent

- ✅ No login required
- ✅ Answers stored only in localStorage (client-side)
- ✅ Consent notice at start
- ✅ Submission consent required before sending
- ✅ Minimal PII (name optional)
- ✅ No precise location collected

---

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Android Chrome 90+
- iOS Safari 14+

Designed for low-end Android devices with limited data.

---

## Patch Notes (V2 → Submission-Only)

### What Changed

| Component | Change |
|-----------|--------|
| `ReportScreen.jsx` | Removed from use (learner never sees recommendations) |
| `App.jsx` | Replaced report flow with submission confirmation flow |
| `SubmissionConfirmationScreen.jsx` | **NEW** - Shows submission status only |
| `SubmissionConsentCheckbox.jsx` | **NEW** - Consent before submission |
| `submissionUtils.js` | **NEW** - Payload generation, queue/retry logic |
| `netlify/functions/submit.js` | **NEW** - Serverless email via Resend |
| `EmailModal.jsx` | Removed from use |
| Locale files | Added `submission` section |
| `.env.example` | Updated with Resend configuration |

### What Was Preserved

- ✅ Multi-step guided UX
- ✅ Progress indicator
- ✅ Resume flow (autosave)
- ✅ Mobile-first design
- ✅ isiZulu default + language toggle
- ✅ Questionnaire structure and branching
- ✅ Config-driven question definitions

### Acceptance Criteria Met

1. ✅ Learner never sees recommendations, route suggestions, or action plans
2. ✅ Canonical payload generated with stable question IDs
3. ✅ Server-confirmed submission via Netlify function
4. ✅ Queue on failure + retry without duplicates
5. ✅ Consent required before submission
6. ✅ Autosave/resume still works

---

## License

MIT License - Free to use and modify.

---

## Credits

Built with:
- React + Vite
- Tailwind CSS
- Resend (email API)

Research sources: DHET, TVET Colleges SA, NSFAS, SETA portals
