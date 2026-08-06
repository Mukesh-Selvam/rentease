# Deploy & Production MongoDB Configuration

This document explains how to configure your MongoDB connection string (`MONGODB_URI`) for production (for example, on Vercel) and how to test the server locally.

1) Preferred production environment variable

- Set a single environment variable named `MONGODB_URI` with your full connection string. Example Atlas URI:

  mongodb+srv://selvamsrmk_db_user:YOUR_URL_ENCODED_PASSWORD@rentease.u00gff2.mongodb.net/rentease?retryWrites=true&w=majority

- If your password contains special characters, URL-encode it (see https://www.mongodb.com/docs/atlas/troubleshoot-connection/#special-characters-in-connection-string-password).

2) Vercel (or other host) — how to set the variable

- Go to your Vercel project dashboard -> Settings -> Environment Variables.
- Add `MONGODB_URI` as the key and paste the full connection string as the value.
- Choose the Environment: `Production` (and `Preview` if you want the same value there).
- Save and redeploy the project.

3) Local testing (Windows PowerShell)

PowerShell (temporary only for this session):

```powershell
$env:MONGODB_URI='mongodb+srv://selvamsrmk_db_user:YOUR_URL_ENCODED_PASSWORD@rentease.u00gff2.mongodb.net/rentease?retryWrites=true&w=majority'
node server.js
```

CMD (temporary):

```bat
set MONGODB_URI=mongodb+srv://selvamsrmk_db_user:YOUR_URL_ENCODED_PASSWORD@rentease.u00gff2.mongodb.net/rentease?retryWrites=true&w=majority
node server.js
```

If port 5000 is in use, override `PORT` before starting. PowerShell example:

```powershell
$env:PORT=5001; node server.js
```

4) Notes

- The repository already uses `mongoose` in `server/server.js`. We removed the earlier `server/db.js` (native `MongoClient`) to avoid duplication — the app uses mongoose models across the codebase.
- If you need a native `MongoClient` for special operations, add a small helper that reuses the same connection or export the mongoose connection.
- After updating environment variables in Vercel, trigger a redeploy so the running instance picks up the new `MONGODB_URI`.

If you'd like, I can add a short GitHub Actions workflow or a Vercel deployment checklist next. Which would you prefer?
