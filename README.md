# test-commerce

ElectroTech — a full-stack e-commerce store with an admin panel and a Speako AI shopping-assistant integration.

## Structure

- `Ecom/backend` — Express + Prisma (PostgreSQL) API. Product/order/admin management plus an isolated Speako integration surface at `/api/speako`.
- `Ecom/frontend` — React + Vite storefront and admin dashboard.

## Setup

### Backend
```bash
cd Ecom/backend
npm install
cp .env.example .env   # then fill in real values
npx prisma generate
npx prisma migrate dev
npm run dev            # http://localhost:5000
```

### Frontend
```bash
cd Ecom/frontend
npm install
npm run dev            # http://localhost:5173
```

## Notes
- Copy `Ecom/backend/.env.example` to `Ecom/backend/.env` and set your own secrets. **Never commit `.env`.**
- The Speako widget is configured in `Ecom/frontend/index.html`. Its `apiUrl` must be a public URL for the hosted Speako backend to reach it.
