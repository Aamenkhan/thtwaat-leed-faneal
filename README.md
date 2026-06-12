# THTWAAT Lead Generation System

Production-ready lead capture platform for **THTWAAT** — ingests leads from your website and WhatsApp, analyzes them with AI, scores them, and stores everything in Google Sheets.

**Live frontend:** https://thtwaat-leed-funnel.vercel.app

---

## Features

- **Multi-channel capture:** Website, WhatsApp Channel, WhatsApp Community, Direct WhatsApp Chat
- **AI lead analysis:** DeepSeek (or OpenAI) categorization, scoring (0–100), and summary
- **Google Sheets CRM:** Every lead stored with standardized columns
- **WhatsApp auto-reply:** Instant acknowledgement after inbound WhatsApp messages
- **Admin dashboard:** Total leads, today's leads, source/category breakdown
- **Production API:** Validation, rate limiting, structured errors, health checks
- **Deploy anywhere:** Vercel, Railway, Docker

---

## Architecture

```text
Website Form ──POST /lead/create──┐
WhatsApp Cloud API ──POST /webhook/whatsapp──┤
                                             ├──► Express API ──► OpenAI ──► Google Sheets
Admin Dashboard ──GET /leads─────────────────┘
```

---

## Folder Structure

```text
thtwaat-leed-funnel/
├── api/
│   └── index.js                 # Vercel serverless entry
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js               # Express app
│       ├── server.js            # Node server (Railway/Docker)
│       ├── config/env.js
│       ├── constants/sources.js
│       ├── middleware/          # Auth, validation, errors
│       ├── routes/              # health, leads, webhook
│       ├── services/            # AI, Sheets, WhatsApp, Lead
│       └── utils/
├── pages/
│   └── admin.html               # Admin dashboard
├── js/
│   ├── leads-api.js             # Website → API client
│   └── app.js
├── index.html                   # Marketing + lead forms
├── vercel.json                  # Vercel static + API rewrites
├── railway.toml                 # Railway config
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── SETUP.md                     # Detailed setup guide
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Service health check |
| POST | `/lead/create` | No | Create lead from website |
| GET | `/leads` | `x-api-key` | List leads + dashboard stats |
| GET | `/webhook/whatsapp` | Meta verify token | Webhook verification |
| POST | `/webhook/whatsapp` | Meta | Incoming WhatsApp messages |

### POST /lead/create

```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "message": "Need a delivery app for Bhopal",
  "source": "Website"
}
```

### GET /leads response

```json
{
  "success": true,
  "data": {
    "totalLeads": 42,
    "newLeadsToday": 3,
    "sources": { "Website": 20, "Direct WhatsApp Chat": 15 },
    "categories": { "Mobile App": 18, "Website": 8 },
    "leads": []
  }
}
```

---

## Google Sheets Columns

| Column | Description |
|--------|-------------|
| Name | Lead name |
| Phone | Normalized phone |
| Email | Email (optional for WhatsApp) |
| Message | Original message |
| Source | Website / WhatsApp Channel / etc. |
| Timestamp | ISO timestamp |
| Lead Score | AI score 0–100 |
| AI Summary | `[Category: X] summary text` |

---

## Quick Start

```bash
npm install
npm install --prefix backend
cp .env.example .env
# Fill .env with your keys
npm run dev
```

Full instructions: **[SETUP.md](./SETUP.md)**

---

## Deployment

### Vercel (recommended for static + API)

```bash
vercel --prod
```

Set all env vars in Vercel dashboard. WhatsApp webhook:

`https://YOUR_DOMAIN/webhook/whatsapp`

### Railway

Connect repo → add env vars → deploy (uses `railway.toml`).

### Docker

```bash
docker compose up --build
```

---

## Environment Variables

```env
DEEPSEEK_API_KEY=          # recommended — from platform.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
OPENAI_API_KEY=            # optional fallback
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=thtwaat_verify_token
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT=
ADMIN_API_KEY=
PORT=3000
CORS_ORIGIN=*
```

---

## Admin Dashboard

`/pages/admin.html` — enter `ADMIN_API_KEY` to view live stats and recent leads.

---

## Security Notes

- Protect `GET /leads` with a strong `ADMIN_API_KEY`
- Never commit `.env` or service account JSON
- Rotate WhatsApp and OpenAI keys periodically
- Restrict Google Sheet access to the service account only

---

## License

Proprietary — THTWAAT Technology Solutions
