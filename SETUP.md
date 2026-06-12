# THTWAAT Lead Generation System — Setup Guide

Complete setup for WhatsApp + Website lead capture with OpenAI scoring and Google Sheets storage.

---

## 1. Prerequisites

- Node.js 18+
- Meta Developer account (WhatsApp Cloud API)
- OpenAI API key
- Google Cloud service account with Sheets API enabled
- A Google Sheet with a tab named **`Leads`**

---

## 2. Excel Storage Setup (Default)

Leads are saved to a real **`.xlsx` Excel file** that you can open in Microsoft Excel.

### Local / Railway / Docker

Default file path:

```env
STORAGE_PROVIDER=excel
EXCEL_FILE_PATH=./data/leads.xlsx
```

The file is created automatically on first lead.

### Vercel (Production)

Vercel serverless needs cloud storage for Excel files:

1. Open your Vercel project → **Storage** → **Create Database/Store** → **Blob**
2. Connect Blob store to `thtwaat-leed-funnel`
3. Vercel auto-adds `BLOB_READ_WRITE_TOKEN`
4. Keep:
   ```env
   STORAGE_PROVIDER=excel
   ```

Leads save to `thtwaat-leads.xlsx` in Blob. Download anytime from admin dashboard.

### Optional: Google Sheets too

```env
STORAGE_PROVIDER=both
GOOGLE_SHEET_ID=...
GOOGLE_SERVICE_ACCOUNT={...}
```

---

## 3. Google Sheets Setup (Optional)

1. Create a new Google Sheet.
2. Rename the first tab to **`Leads`**.
3. Leave row 1 empty — the API auto-creates headers:
   - Name | Phone | Email | Message | Source | Timestamp | Lead Score | AI Summary
4. Copy the Sheet ID from the URL:
   - `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`
5. In Google Cloud Console:
   - Enable **Google Sheets API**
   - Create a **Service Account**
   - Download JSON key
   - Share the Google Sheet with the service account email (`...@....iam.gserviceaccount.com`) as **Editor**

---

## 3. WhatsApp Cloud API Setup

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create an app → add **WhatsApp** product.
3. Copy:
   - **Temporary / Permanent Access Token** → `WHATSAPP_TOKEN`
   - **Phone Number ID** → `WHATSAPP_PHONE_ID`
4. Set webhook URL after deployment:
   - `https://YOUR_DOMAIN/webhook/whatsapp`
5. Set verify token (must match `.env`):
   - `WHATSAPP_VERIFY_TOKEN=thtwaat_verify_token`
6. Subscribe to webhook field: **`messages`**

### Lead source mapping

| Source | How it is detected |
|--------|--------------------|
| Website | `POST /lead/create` with `source: "Website"` |
| WhatsApp Channel | Referral metadata from click-to-WhatsApp ads |
| WhatsApp Community | Forwarded message context |
| Direct WhatsApp Chat | Default for normal inbound WhatsApp messages |

---

## 3b. DeepSeek API Setup (Recommended)

1. Go to [platform.deepseek.com](https://platform.deepseek.com/api_keys)
2. Create an API key (e.g. "ai automation")
3. Copy the key (`sk-...`)
4. Add to Vercel / `.env`:
   ```env
   DEEPSEEK_API_KEY=sk-your-key-here
   DEEPSEEK_MODEL=deepseek-chat
   ```
5. Redeploy. Check `/health` — response should show `"aiProvider": "deepseek"`

---

## 4. Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes* | DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com)) |
| `DEEPSEEK_MODEL` | No | Default `deepseek-chat` |
| `OPENAI_API_KEY` | Yes* | Optional fallback if DeepSeek not set |
| `WHATSAPP_TOKEN` | For WhatsApp replies | Meta WhatsApp token |
| `WHATSAPP_PHONE_ID` | For WhatsApp replies | Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Yes (webhook) | Custom verify string |
| `GOOGLE_SHEET_ID` | Yes | Google Sheet ID |
| `GOOGLE_SERVICE_ACCOUNT` | Yes | Full service account JSON (single line) |
| `ADMIN_API_KEY` | Yes | Secret for admin dashboard + GET /leads |
| `PORT` | No | Default `3000` |
| `CORS_ORIGIN` | No | Default `*` |

*Set **either** `DEEPSEEK_API_KEY` **or** `OPENAI_API_KEY`. DeepSeek is recommended.

**Tip for Vercel/Railway:** paste `GOOGLE_SERVICE_ACCOUNT` as one-line JSON. Escape newlines in `private_key` as `\n`.

---

## 5. Local Development

```bash
# Install dependencies
npm install
npm install --prefix backend

# Configure env
cp .env.example .env

# Start API server
npm run dev
```

Test endpoints:

```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/lead/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"9876543210","email":"test@example.com","message":"Need a Flutter app","source":"Website"}'

curl http://localhost:3000/leads -H "x-api-key: YOUR_ADMIN_API_KEY"
```

Serve static site separately (optional):

```bash
npx serve .
```

Admin dashboard: `http://localhost:3000/pages/admin.html` (with static server) or your deployed URL.

---

## 6. Deploy to Vercel

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables in **Project Settings → Environment Variables**.
4. Deploy.

API routes (via rewrites):

- `GET /health`
- `POST /lead/create`
- `GET /leads`
- `GET|POST /webhook/whatsapp`

After deploy, set WhatsApp webhook to:

`https://YOUR_VERCEL_DOMAIN/webhook/whatsapp`

---

## 7. Deploy to Railway

1. Connect GitHub repo in Railway.
2. Railway reads `railway.toml` automatically.
3. Add environment variables in Railway dashboard.
4. Deploy and copy public URL for WhatsApp webhook.

---

## 8. Deploy with Docker

```bash
docker compose up --build
```

API runs at `http://localhost:3000`.

---

## 9. Admin Dashboard

Open:

`/pages/admin.html`

Enter `ADMIN_API_KEY` → **Load Data**

Shows:

- Total Leads
- New Leads Today
- Lead Sources chart
- Lead Categories chart
- Recent leads table

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| `SHEETS_NOT_CONFIGURED` | Set `GOOGLE_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT` |
| Webhook verify fails | Match `WHATSAPP_VERIFY_TOKEN` in Meta + `.env` |
| Sheet append fails | Share sheet with service account email |
| OpenAI errors | Check API key/billing; fallback scoring still works |
| Admin 401 | Use correct `x-api-key` header |

---

## 11. Push to GitHub (your repo)

```bash
git init
git add .
git commit -m "Add THTWAAT lead generation system"
git branch -M main
git remote add origin https://github.com/Aamenkhan/thtwaat-leed-faneal.git
git push -u origin main
```

Then connect the repo in Vercel for auto-deploy on every push.
