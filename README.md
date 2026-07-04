# The Black Library

A gothic repository of flippable manuscripts. Scribes claim a codename, bind tomes or write parchments, and share them with the world via a permanent link.

---

## Stack

- **Node.js + Express** — backend API
- **sql.js** — single-file SQLite database, persisted to disk (no native build needed)
- **StPageFlip** — realistic page-flip reader with true text pagination
- **Railway** — recommended hosting (free tier works)

---

## ⚠️ Persistence (IMPORTANT)

The database is a single file at `DATA_DIR/archive.db` (default `./data`). In production this
directory **must be a mounted persistent volume**, or all data (scribes, tomes, reports) is wiped
on every redeploy.

On Railway, the `railway.toml` `[[volumes]]` block does **not** auto-create a volume. Attach one
explicitly (once):

```bash
railway volume add --mount-path /app/data
```

Confirm with `railway volume list` — it should show `Status: Ready` attached to the service.

---

## Seeding the Library

There is no auto-seed on boot. Curated lore is seeded via a reusable script, owned by a "curator"
scribe so the official tomes have an in-world keeper:

```bash
BASE_URL=https://your-app.up.railway.app \
CURATOR_NAME='House Mournstar' \
CURATOR_PASS='your-secret' \
node scripts/seed.mjs
```

The script is idempotent (skips any work whose title already exists). Content lives in
`scripts/seed.mjs`; the Draugomyr journal is kept in `scripts/seed-data.json`.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env and set SESSION_SECRET to something random

# 3. Start (with auto-restart on file changes)
npm run dev

# App is at http://localhost:3000
```

---

## Deploy to Railway (Recommended — Free Tier)

Railway gives you a public HTTPS URL, handles the Dockerfile build, and the `railway.toml` volume config keeps your SQLite database persistent across deploys.

### One-time setup

1. **Create a Railway account** at https://railway.app (free)

2. **Install Railway CLI**
   ```bash
   # Mac/Linux
   curl -fsSL https://railway.app/install.sh | sh

   # Or via npm
   npm install -g @railway/cli
   ```

3. **Login**
   ```bash
   railway login
   ```

### First deploy

```bash
# Inside the black-archive folder:

# Initialize git (if you haven't)
git init
git add .
git commit -m "Initial commit — The Black Archive"

# Create a new Railway project
railway init

# Set your session secret (do this BEFORE deploying)
railway variables set SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Deploy
railway up
```

Railway will:
- Build using the Dockerfile
- Mount a persistent volume at `/app/data` for the SQLite database
- Give you a public URL like `https://the-black-archive-production.up.railway.app`

### Subsequent deploys

```bash
git add .
git commit -m "your changes"
railway up
```

Or connect your GitHub repo to Railway for automatic deploys on push.

---

## Deploy to a VPS (DigitalOcean, Linode, Hetzner, etc.)

```bash
# On your server (Ubuntu 22.04)

# 1. Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# 2. Clone / copy your files
git clone <your-repo> /opt/black-archive
cd /opt/black-archive
npm install --production

# 3. Create .env
cp .env.example .env
nano .env  # set SESSION_SECRET

# 4. Run with PM2 (keeps it alive)
npm install -g pm2
pm2 start server.js --name black-archive
pm2 save
pm2 startup

# 5. Nginx reverse proxy (optional but recommended)
# Point your domain to the server, then:
sudo apt install nginx certbot python3-certbot-nginx
# Create /etc/nginx/sites-available/black-archive:
# server {
#   server_name yourdomain.com;
#   location / { proxy_pass http://localhost:3000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade'; proxy_set_header Host $host; }
# }
# sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | **Yes** | Long random string for signing session cookies |
| `PORT` | No | Port to listen on (default: 3000, Railway sets automatically) |
| `DATA_DIR` | No | Directory to store `archive.db` (default: `./data`) |

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Claim a codename |
| POST | `/api/auth/login` | — | Sign in |
| POST | `/api/auth/logout` | Session | Sign out |
| GET | `/api/auth/me` | — | Current session |
| GET | `/api/library` | — | All works (public) |
| GET | `/api/library/mine` | Session | Your works |
| GET | `/api/works/:id` | — | Single work with entries |
| POST | `/api/works` | Session | Create a work |
| PUT | `/api/works/:id` | Session | Update (owner only) |
| DELETE | `/api/works/:id` | Session | Delete (owner only) |

---

## Data Model

```
scribes      — codename + bcrypt passphrase
works        — title, type (book|parchment), author, subtitle, meta JSON
entries      — ordered text blocks belonging to a work
```

All linked by UUID primary keys. SQLite WAL mode enabled for concurrent reads.

---

## Sharing

Every work gets a permanent URL: `https://your-domain.com/?work=<uuid>`

The Share button in the reader copies this to clipboard. Anyone with the link can read; only the owner can edit or delete.
