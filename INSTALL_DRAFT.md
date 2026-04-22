# Install & run (draft)

## Prereqs
- Node.js + npm installed
- MongoDB running (or a MongoDB URI you can connect to)

## Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

## Configure environment

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` with your values (MongoDB URI + JWT secret).

## Run in development (two terminals)

Terminal 1 (backend):

```bash
cd server && npm run dev
```

Terminal 2 (frontend):

```bash
cd client && npm run dev -- --port 3000
```

Notes:
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5001`

