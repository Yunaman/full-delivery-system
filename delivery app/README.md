# Driver Dashboard (Next.js)

Premium MVP for a food delivery driver system optimized for Addis Ababa, Ethiopia.

## Quickstart

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo login

- Phone: any Ethiopian number format (e.g. `09XXXXXXXX`, `9XXXXXXXX`, `+2519XXXXXXXX`)
- OTP: `123456`

## Optional env vars

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` – enables Google Maps on `/map`
- `NEXT_PUBLIC_SOCKET_URL` – connects to a real Socket.io server; otherwise uses the mock stream

## Scripts

- `npm run dev` – local dev
- `npm run build` – production build
- `npm run start` – run production build
- `npm run typecheck` – TypeScript check
- `npm run lint` – ESLint

