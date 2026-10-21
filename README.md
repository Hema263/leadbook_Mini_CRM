# Leadbook: Mini CRM for client leads

A small CRM for agencies, freelancers and startups. Contact-form submissions from a website arrive as leads. An admin signs in, moves each lead from **new → contacted → converted**, and keeps follow-up notes and dates.

## Features
- Public endpoint that stores website contact-form submissions (demo form at `/contact.html`)
- Secure admin login (JWT, bcrypt-hashed password, login rate limiting)
- Lead list showing name, email, source, status, follow-up date and received date
- One-click status updates, follow-up dates, timestamped notes per lead
- Search (name / email / source), status filter, pagination
- Dashboard: total leads, counts per status, conversion rate, overdue follow-ups
- Add leads manually (phone calls, referrals) and delete leads

## Tech stack
React (Vite) · Node.js · Express · MongoDB (Mongoose) · JWT

## Setup
Requirements: Node.js 18+ and MongoDB (local install or a free MongoDB Atlas connection string).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # edit JWT_SECRET, MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed              # creates the admin account + sample leads
npm run dev               # API on http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # app on http://localhost:5173
```

Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.
Try the contact form at http://localhost:5000/contact.html. Submissions appear in the dashboard.

## API
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Get an admin token |
| POST | `/api/leads/public` | public | Contact form submission |
| GET | `/api/leads?search=&status=&page=` | admin | List leads |
| GET | `/api/leads/stats` | admin | Dashboard numbers |
| POST | `/api/leads` | admin | Add a lead manually |
| PATCH | `/api/leads/:id` | admin | Update status / follow-up date |
| POST | `/api/leads/:id/notes` | admin | Add a note |
| DELETE | `/api/leads/:id` | admin | Delete a lead |

## Connecting your own website
Send `POST https://your-api/api/leads/public` with JSON `{ name, email, phone, message, source }`. `server/public/contact.html` is a working example.

## Deploying
Set the same environment variables on your host. Run `npm run build` in `client/` and serve `client/dist` from any static host, with `/api` proxied to the server.
