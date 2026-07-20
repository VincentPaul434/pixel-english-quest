# Pixel English Quest — Frontend

The React and TypeScript frontend for Pixel English Quest, a responsive pixel-art English learning dashboard.

## Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and proxies `/api` to `http://localhost:3001`.

## Connect a deployed API

Copy `.env.example` to `.env` and set:

```env
VITE_API_URL=https://your-api.example.com
```

Leave `VITE_API_URL` empty when using the local Vite proxy.

## Commands

```bash
npm run check
npm run build
```
