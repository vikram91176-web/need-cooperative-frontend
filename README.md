# NEED

A cooperative-owned digital marketplace that connects customers with verified
local service providers — electricians, plumbers, cleaners, carpenters and more.

The idea behind it: on a normal service app, a private company owns the platform
and takes a large cut of every job. On NEED the workers are members of the
cooperative that owns the platform, the commission is small, and a slice of each
job is saved into the worker's own welfare wallet.

> **This is a student project prototype** built for a college demonstration.
> The payment flow is fully simulated. Invoices, welfare splits and wallet
> balances are real database records, but no real money moves and no bank or UPI
> provider is connected.

---

## Table of contents

1. [Features](#features)
2. [Technology used](#technology-used)
3. [Project structure](#project-structure)
4. [Installation](#installation)
5. [How to run the backend](#how-to-run-the-backend)
6. [How to run the frontend](#how-to-run-the-frontend)
7. [Database setup](#database-setup)
8. [Demo accounts](#demo-accounts)
9. [API endpoints](#api-endpoints)
10. [AI features](#ai-features)
11. [Build progress](#build-progress)
12. [Troubleshooting](#troubleshooting)
13. [Future scope](#future-scope)

---

## Features

**For customers**

- Browse 20 services across Home, Appliance and Other categories
- Search verified workers and filter by service, city, rating or experience
- Book a worker for a chosen date and time, with an option to mark it urgent
- Or let the system pick — it assigns the top-rated available verified partner
- Simulated UPI / card / cash payment that produces an itemised invoice
- Add a tip at checkout, which goes to the worker in full — no cut is taken from it

**For workers**

- Register as a worker, then wait for the cooperative to verify the account
- Accept or decline every job request — a job is assigned, never forced
- Go online or offline, so no job arrives while they are unavailable
- Track earnings, completed jobs and the running rating
- A welfare wallet that grows with every job, set aside for insurance and emergencies

**For the cooperative federation (admin)**

- Approve or reject worker verification requests
- Monitor bookings, payments and welfare contributions across the platform

**Shared**

- Verification badges in three states: verified, pending, rejected

**Not built yet**, and listed here so nothing in this README oversells the demo:

- Customer ratings and reviews (Step 9)
- Support tickets and disputes (Step 12)
- The rule-based chatbot (Step 13) and demand forecasting (Step 14)
- Hindi translation (Step 15)
- **Document upload.** A worker registers with typed details only; there is no
  file upload anywhere in the app. The `identity_proof` column exists and the
  seeded workers carry a placeholder filename, but a real registration leaves it
  empty. The admin verifies based on the typed skills and experience.
- **Real distance.** Workers store a latitude and longitude and a service radius,
  but nothing calculates the gap between two points. Search shows the worker's
  area as text, like "Sector 62, Noida". No screen shows "2.4 km away".

See [Build progress](#build-progress) for where each numbered step sits.

---

## Technology used

| Layer | Choice | Why this one |
|---|---|---|
| Frontend | React 18 + JavaScript | Component-based, and JavaScript keeps the setup simple |
| Build tool | Vite | Starts in under a second and reloads instantly on save |
| Styling | Tailwind CSS 3 | Styles live next to the markup, so nothing is hard to find |
| Routing | React Router 6 | Gives real URLs like `/login` without a page reload |
| HTTP | Axios | One configured instance instead of `fetch` boilerplate everywhere |
| Icons | Lucide React | Clean icon set, imported one icon at a time |
| Backend | Python Flask | Small enough to read end to end in one sitting |
| Database | SQLite via SQLAlchemy | A single file, no server to install |
| Passwords | Werkzeug password hashing | Ships with Flask; passwords are never stored as text |

Deliberately **not** used: Docker, Kubernetes, microservices, Redis, Celery,
JWT refresh-token rotation. None of them would make the demo work better, and
each one is something extra to explain and something extra to break.

---

## Project structure

```
need/
├── backend/
│   ├── app.py              # Creates and starts the Flask app
│   ├── auth.py             # Register, login, session check, logout
│   ├── models.py           # All 10 database tables in one readable file
│   ├── routes.py           # The API endpoints
│   ├── seed.py             # Fills the database with demo data
│   ├── requirements.txt    # Python packages to install
│   ├── .env.example        # Template for your own .env
│   └── instance/
│       └── database.db     # Created automatically — not in git
│
├── frontend/
│   ├── index.html          # The single HTML page React attaches to
│   ├── package.json        # JavaScript packages to install
│   ├── vite.config.js      # Dev server settings
│   ├── tailwind.config.js  # Colours, fonts and shadows — the design system
│   ├── postcss.config.js   # Wires Tailwind into the build
│   ├── .env.example        # Template for your own .env
│   └── src/
│       ├── main.jsx        # Where React starts
│       ├── App.jsx         # The map of URLs to pages
│       ├── index.css       # Tailwind imports + reusable .btn / .card classes
│       ├── components/     # Pieces reused across pages
│       ├── context/
│       │   └── AuthContext.jsx  # Who is logged in, shared with every page
│       ├── pages/          # One file per screen
│       └── services/
│           └── api.js      # Every backend call lives here
│
├── setup-windows.bat       # One-time setup, Windows only
├── start-demo.bat          # Starts both halves at once
├── run-backend.bat         # Starts Flask only (start-demo.bat calls this)
├── run-frontend.bat        # Starts Vite only (start-demo.bat calls this)
├── .gitignore
└── README.md
```

Three rules worth knowing before you edit anything:

- **All backend calls go through `src/services/api.js`.** If the backend address
  changes, that is the only file to edit.
- **All colours and fonts come from `tailwind.config.js`.** Use `text-brand-600`,
  not `text-[#0E6E62]`, so a colour change happens in one place.
- **The money split lives in the constants at the top of `routes.py`** —
  `WELFARE_RATE`, `WORKER_SHARE`, `WALLET_LIQUID_SHARE`, `WALLET_INSURANCE_SHARE`
  and `EMERGENCY_FEE`. Every backend calculation reads them, including `seed.py`,
  so the commission is defined once on the server.

  **The React side has its own copies, and that is a known weak spot.** The price
  preview in `PaymentModal.jsx` multiplies by `0.90` and `0.10` directly, and
  `BookingModal.jsx` types the ₹100 urgent fee as a literal. They agree with the
  server today, so the numbers on screen are correct — but if you change the
  commission in `routes.py`, the customer's preview would keep quoting the old
  split while the invoice shows the new one. Change both, or move the frontend
  copies into one shared file first. The percentage labels in the UI text
  ("10% Welfare", "90% Pay") are typed by hand in the same way.

---

## Installation

You need **Python 3.9 or newer** and **Node.js 18 or newer**. Check with:

```bash
python --version
node --version
```

### Windows shortcut

If you are on Windows, you can skip the manual commands entirely:

1. Double-click **`setup-windows.bat`** — once, ever. It creates the virtual
   environment, installs both sets of packages, makes the `.env` file and seeds
   the database.
2. Double-click **`start-demo.bat`** — every time you want to run the app. It
   opens two windows (backend and frontend) and the browser follows.

`run-backend.bat` and `run-frontend.bat` start one half each, if you prefer.
The manual steps below do exactly the same thing, and are worth reading once so
you can explain what the batch files are doing.

### Manual installation

From the `need` folder:

**1. Backend packages**

```bash
cd backend
python -m venv venv
```

Activate the virtual environment — the command differs by system:

```bash
# Windows (PowerShell or CMD)
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

You will see `(venv)` appear at the start of your prompt. Now install:

```bash
pip install -r requirements.txt
```

**2. Backend environment file**

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

This step is optional for the demo — `app.py` falls back to safe development
defaults if `.env` is missing — but do it anyway, it is the habit that keeps
secrets out of git.

**3. Frontend packages**

Open a **second terminal** (leave the first one for the backend):

```bash
cd frontend
npm install
```

---

## How to run the backend

```bash
cd backend
python app.py
```

Expected output:

```
 * Running on http://127.0.0.1:5000
```

Check it is alive by opening <http://localhost:5000/api/health> in a browser.
You should see:

```json
{ "service": "need-backend", "status": "ok" }
```

Leave this terminal running. Closing it stops the API and the frontend will
show a red "cannot reach the backend" banner.

---

## How to run the frontend

In the second terminal:

```bash
cd frontend
npm run dev
```

Expected output:

```
  VITE v5.4.8  ready in 420 ms
  ➜  Local: http://localhost:5173/
```

The browser opens automatically. **Both terminals must be running at the same
time** — the backend on port 5000, the frontend on port 5173.

---

## Database setup

You do not have to create any tables by hand. `app.py` creates them on startup
if they do not exist.

To fill the database with demo data — 20 services, 20 workers, 5 customers and
one admin:

```bash
cd backend
python seed.py
```

> **Careful:** `seed.py` deletes everything and starts fresh. Run it when you
> want a clean demo, not after you have entered data you want to keep.

Seeding matters because the landing page counts real database rows for its
statistics. Without seeding, the page honestly shows zeros.

The whole database is the single file `backend/instance/database.db`. To reset
completely, delete that file and run `python seed.py` again.

> **`instance/` is not a typo.** Flask keeps SQLite files in an `instance` folder
> beside your code, and `app.py` spells out the absolute path so the server opens
> the same file no matter which folder you started it from. Earlier this was
> ambiguous, and launching from the wrong folder silently created a *second*,
> empty database — which looks exactly like losing all your data.

---

## Demo accounts

Every demo account uses the same password so nothing has to be memorised
mid-presentation.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@need.in` | `admin123` |
| Customer | `ananya@example.com` | `demo123` |
| Worker | `rahul@example.com` | `demo123` |

All 20 demo workers and 5 demo customers use `demo123`.

The seeded workers cover all three verification states on purpose, so the badges
and the admin approval screen have real data to show:

- **17 verified** — appear in search and can be booked
- **2 pending** — Farhan Ali (Barber), Geeta Rani (Gardener)
- **1 rejected** — Mohit Saini (Car Washing)

**Because of that, three services cannot be booked on a freshly seeded database:
Barber, Gardener and Car Washing.** That is deliberate, not a bug — a job is only
created once a verified partner exists to do it, otherwise the customer would sit
looking at "Auto-assigning…" forever. It also makes a good thing to show live:
log in as admin, verify Farhan Ali, and Barber becomes bookable in front of the
audience.

The other 17 services each have a verified partner ready to take a job.

---

## API endpoints

Everything is prefixed with `/api`. All 23 endpoints that exist today. (There is
also a plain `GET /` that just prints a hello message if you open the backend URL
directly — handy for checking the server is up.)

**Open to anyone** — you can paste these into a browser and see the raw JSON.

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/health` | `{status: "ok"}` — use this first when debugging |
| GET | `/api/services` | A flat list of all 20 active services |
| GET | `/api/services/categories` | The same services grouped into three categories |
| GET | `/api/stats` | Live counts of workers, services, customers and welfare total |
| GET | `/api/workers` | Worker search, with `?service=`, `?city=`, `?sort=` filters |
| GET | `/api/services/<id>/workers` | Verified workers who do one particular service |

**Accounts**

| Method | Endpoint | Returns |
|---|---|---|
| POST | `/api/auth/register` | Creates the account and logs it in straight away |
| POST | `/api/auth/login` | Checks the password and starts the session |
| GET | `/api/auth/me` | Who is logged in, or 401 if nobody is |
| POST | `/api/auth/logout` | Clears the session |

**Customer** — needs a logged-in customer

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/customer/dashboard` | Profile, stats, bookings and services in one request |
| POST | `/api/bookings` | Creates a booking; picks a verified partner if none was chosen |
| POST | `/api/bookings/<id>/cancel` | Cancels a booking that has not started yet |
| POST | `/api/payments/checkout` | The simulated payment; writes the payment and invoice |

**Worker** — needs a logged-in worker

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/worker/dashboard` | Profile, wallet, stats and assigned jobs |
| POST | `/api/worker/availability` | Goes online or offline |
| POST | `/api/bookings/<id>/worker-action` | `accept`, `decline`, `start` or `complete` |

**Admin** — needs a logged-in admin

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/admin/dashboard` | Every worker, booking, payment and welfare figure |
| POST | `/api/admin/workers/<id>/verify` | Approves or rejects a verification application |
| POST | `/api/admin/tickets/<id>/status` | Moves a support ticket along |

**Shared, with a permission check** — the customer on the booking, the worker
assigned to it, or an admin

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/bookings/<id>` | One booking in full |
| GET | `/api/bookings/<id>/payment` | Whether it is paid, and the invoice ID if so |
| GET | `/api/payments/invoices/<invoice_id>` | The itemised receipt, including the welfare split |

Two things to notice, because they are the questions most likely to be asked:

- **Every permission check happens on the server.** The React app hides buttons it
  should not show, but hiding a button is a courtesy, not security — the endpoint
  refuses the request either way.
- **`/api/bookings/<id>/worker-action` is the accounting event.** Marking a job
  `complete` is the moment the worker is credited their 90% and the 10% welfare
  contribution is recorded. Checkout only records what the customer paid and
  hands the tip over, and it refuses any booking that is not already complete.

---

## AI features

Two intentionally simple AI features are planned, both written in plain Python
with no model files, no training step and no external API key:

- **Support chatbot** — matches keywords in the user's question against a set of
  rules and replies with the right answer, escalating to a support ticket when
  it has no match.
- **Demand forecasting** — reads past bookings from the database and reports
  which services and time slots are busiest, so workers can see where demand is.

Both arrive in later steps and will live in `backend/ai.py`. That file does not
exist yet — nothing in the current code imports it.

---

## Build progress

The project is being built one step at a time, and each step is tested before
the next one starts.

- [x] **Step 1 — Project setup, landing page, navigation**
- [x] **Step 2 — Registration and login**
- [x] **Step 3 — Customer dashboard**
- [x] **Step 4 — Worker dashboard**
- [x] **Step 5 — Admin dashboard**
- [x] **Step 6 — Service catalogue and worker search**
- [x] **Step 7 — Booking flow**
- [x] **Step 8 — Simulated payment and invoice**
- [ ] **Step 9 — Ratings and tips** ← you are here (tips done, ratings not)
- [x] **Step 10 — Welfare wallet**
- [x] **Step 11 — Worker verification** *(built early, out of order)*
- [ ] Step 12 — Help and support
- [ ] Step 13 — AI chatbot
- [ ] Step 14 — AI demand forecasting
- [ ] Step 15 — Multilingual support
- [ ] Step 16 — Integration testing
- [ ] Step 17 — Final polish

Step 11 came early because worker verification is what makes the rest honest —
without it, "verified partner" was just a green badge with nothing behind it. Now
the admin's decision actually controls who can be booked, who can accept a job,
and who can go online.

Two parts of ticked steps are worth naming honestly:

- **Step 9** is half done. The **tip** works — a customer can add one at checkout
  and it reaches the worker's earnings in full. **Ratings do not exist yet**: the
  `Review` table is in `models.py` but no endpoint writes to it, and the star
  ratings you see on worker cards are seeded numbers, not real reviews.
- **Step 10** works for saving but not for spending. Every completed job puts 10%
  into the worker's welfare wallet, split 70% withdrawable and 30% insurance
  reserve, and both the worker and the admin can see the running totals. There is
  no withdrawal or claim request yet — money goes in, nothing comes out.

`backend/ai.py` (Steps 13 and 14) does not exist yet, and nothing imports it.

---

## Troubleshooting

**Red banner: "Cannot reach the backend on port 5000"**
The Flask terminal is not running. Start it: `cd backend`, then `python app.py`.

**All the numbers on the home page are 0**
The database is empty. Run `cd backend`, then `python seed.py`.

**"No verified partner is available for Barber at the moment"**
Working as intended. Barber, Gardener and Car Washing have no verified partner in
the seed data. Log in as admin, verify that trade's partner, and the service
becomes bookable — see [Demo accounts](#demo-accounts).

**"Your account is not verified, so you cannot work on bookings yet"**
You are logged in as a pending or rejected worker (Farhan, Geeta or Mohit). Log in
as admin and verify them first, or use a verified worker like `rahul@example.com`.

**A booking is stuck showing "Auto-assigning…"**
It was created before the verified-partner check existed. Run `python seed.py`
for a clean database; new bookings always have a partner attached from the start.

**`ModuleNotFoundError: No module named 'flask'`**
The virtual environment is not active — look for `(venv)` in your prompt.
Activate it, then `pip install -r requirements.txt`.

**`'python' is not recognized`**
Try `python3` instead, or reinstall Python with "Add to PATH" ticked.

**Windows PowerShell: "running scripts is disabled on this system"**
PowerShell blocks the `activate` script by default. Either use **Command Prompt**
instead of PowerShell, or allow scripts for this one window:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Windows PowerShell: "The token '&&' is not a valid statement separator"**
Old PowerShell does not understand `&&`. Run the two commands on separate lines,
or use `;` between them. Command Prompt handles `&&` fine.

**Port 5000 already in use (common on macOS — AirPlay uses it)**
Change the port at the bottom of `app.py` to 5001, then set
`VITE_API_URL=http://localhost:5001/api` in `frontend/.env`.

**Port 5173 already in use**
Vite will offer the next free port. Use whatever URL it prints.

**The page loads but has no styling**
Stop the dev server and run `npm install` again, then `npm run dev`.

**Blank white page**
Open the browser console with F12 and read the first red error — it names the
file and line.

---

## Future scope

Things a real deployment would need, listed honestly as *not built*:

- A real payment gateway (Razorpay or UPI) instead of the simulated flow
- SMS and email notifications for booking updates
- PostgreSQL instead of SQLite, for many users at once
- Real GPS distance instead of the stored service radius
- A mobile app, since most workers are phone-first
- Document verification with OCR rather than manual admin review
- Insurance integration so the welfare wallet buys an actual policy
- Cooperative voting, so members can vote on the commission rate
- A trained recommendation model rather than rule-based matching
