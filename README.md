# Personal PA Pro ✦

Your private luxury executive assistant app.

## Setup

1. Upload all files to GitHub
2. Connect repo to Vercel — it auto-detects Vite/React
3. Deploy

## Adding your PA photo

1. Upload your photo to the `/public` folder in GitHub (e.g. `eleanor.jpg`)
2. In `App.jsx`, find this line near the top:
   ```js
   const PA_PHOTO = null;
   ```
3. Change it to:
   ```js
   const PA_PHOTO = "/eleanor.jpg";
   ```
4. Push to GitHub — Vercel redeploys automatically

## File structure

```
/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── App.jsx
└── public/
    └── (drop your PA photo here)
```

## Note
Move `App.jsx` and `main.jsx` into a `/src` folder before deploying.
