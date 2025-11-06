# 🆓 Using Free ngrok (One Tunnel Only)

Since free ngrok only allows **one tunnel**, here are the best solutions:

## Solution 1: Use ngrok for Frontend Only + Proxy Backend (Recommended) ✅

### Setup
1. **Start Backend** (runs on localhost:5001)
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (runs on localhost:3000)
   ```bash
   cd frontend
   npm start
   ```

3. **Add Proxy to Frontend** - Edit `frontend/package.json`:
   ```json
   {
     "proxy": "http://localhost:5001"
   }
   ```

4. **Update Frontend API Calls** - Change all API calls to use relative paths:
   - Instead of: `${process.env.REACT_APP_API_URL}/api/...`
   - Use: `/api/...`

5. **Start ngrok for Frontend Only**:
   ```bash
   ngrok http 3000
   ```

6. **Access from Phone**: Use the ngrok URL (e.g., `https://abc123.ngrok-free.app`)

**How it works**: Frontend proxy automatically forwards `/api/*` requests to `localhost:5001`, so everything goes through one tunnel!

---

## Solution 2: Use Cloudflare Tunnel (cloudflared) - FREE, Multiple Tunnels ✅

Cloudflare Tunnel is completely free and allows multiple tunnels!

### Install cloudflared
```bash
brew install cloudflared
```

### Start Both Tunnels
```bash
# Terminal 1: Frontend tunnel
cloudflared tunnel --url http://localhost:3000

# Terminal 2: Backend tunnel  
cloudflared tunnel --url http://localhost:5001
```

You'll get two URLs like:
- Frontend: `https://abc123.trycloudflare.com`
- Backend: `https://xyz456.trycloudflare.com`

### Update Configuration
```bash
# frontend/.env
REACT_APP_API_URL=https://xyz456.trycloudflare.com/api
```

Add frontend URL to backend CORS:
```javascript
const allowedOrigins = [
    'https://abc123.trycloudflare.com',
    // ...
];
```

---

## Solution 3: Use localtunnel - FREE, Multiple Tunnels ✅

localtunnel is open source and free!

### Install
```bash
npm install -g localtunnel
```

### Start Both Tunnels
```bash
# Terminal 1: Frontend
lt --port 3000 --subdomain foodfreaky-frontend

# Terminal 2: Backend
lt --port 5001 --subdomain foodfreaky-backend
```

You'll get:
- Frontend: `https://foodfreaky-frontend.loca.lt`
- Backend: `https://foodfreaky-backend.loca.lt`

### Update Configuration
Same as cloudflared - update frontend .env and backend CORS.

---

## Solution 4: Use ngrok + Reverse Proxy (Advanced)

Use ngrok for frontend, and set up a reverse proxy to route backend through frontend.

---

## 🎯 Easiest Solution: Use Cloudflare Tunnel

It's free, allows multiple tunnels, and works great!

```bash
# Install
brew install cloudflared

# Start frontend tunnel
cloudflared tunnel --url http://localhost:3000

# Start backend tunnel (in new terminal)
cloudflared tunnel --url http://localhost:5001
```

That's it! Two free tunnels! 🎉

