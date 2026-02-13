# 🐛 Debug Google OAuth "origin_mismatch" Error

## Step-by-Step Debugging

### Step 1: Find the EXACT Origin Being Used

1. **Open your website** in the browser: `https://foodfreaky.in`
2. **Open Developer Console** (Press F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Type this command and press Enter:**
   ```javascript
   console.log('Origin:', window.location.origin);
   console.log('Full URL:', window.location.href);
   ```
5. **Copy the exact origin** that appears (e.g., `https://foodfreaky.in` or `https://www.foodfreaky.in`)

### Step 2: Check Browser Network Tab

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Try Google Sign-In again**
4. **Look for failed requests** (they'll be red)
5. **Click on the failed request**
6. **Check the "Request URL"** - this shows what origin Google is seeing

### Step 3: Verify Google Cloud Console Configuration

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. **Check "Authorized JavaScript origins"** - verify these EXACT URLs are there:
   ```
   https://foodfreaky.in
   https://www.foodfreaky.in
   http://localhost:3000
   ```
5. **Check "Authorized redirect URIs"** - should be the same (without paths):
   ```
   https://foodfreaky.in
   https://www.foodfreaky.in
   http://localhost:3000
   ```

### Step 4: Common Issues to Check

#### Issue 1: Cloudflare/CDN Proxy
If you're using Cloudflare, the origin might be different. Check:
- Is your site behind Cloudflare?
- Does Cloudflare change the origin?
- Try accessing directly (bypass Cloudflare) if possible

#### Issue 2: www vs non-www
- If you access `https://www.foodfreaky.in`, make sure `https://www.foodfreaky.in` is in Google Console
- If you access `https://foodfreaky.in`, make sure `https://foodfreaky.in` is in Google Console
- **Add BOTH** to be safe

#### Issue 3: Changes Not Propagated
- Google changes can take **1-10 minutes** to propagate
- **Wait at least 5 minutes** after saving
- Try in **incognito/private mode** (clears cache)
- Try a **different browser**

#### Issue 4: Wrong Client ID
- Verify the Client ID in your frontend `.env` matches the one in Google Cloud Console
- Check: `REACT_APP_GOOGLE_CLIENT_ID` in `frontend/.env`

### Step 5: Test with Browser Console

Add this to your browser console on `https://foodfreaky.in`:

```javascript
// Check what Google sees
console.log('Current Origin:', window.location.origin);
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID || 'NOT SET');

// Try to see Google's error details
window.addEventListener('error', (e) => {
    if (e.message.includes('origin') || e.message.includes('OAuth')) {
        console.error('OAuth Error:', e);
    }
});
```

### Step 6: Verify Environment Variable

1. **Check your frontend `.env` file:**
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

2. **Verify it's loaded:**
   - Open browser console on your site
   - Type: `process.env.REACT_APP_GOOGLE_CLIENT_ID`
   - Should show your Client ID (not undefined)

3. **If undefined:**
   - Restart your frontend server
   - Rebuild if in production: `npm run build`

## 🔍 Quick Diagnostic Checklist

Run through these:

- [ ] What exact URL are you accessing? (check browser address bar)
- [ ] What origin does `window.location.origin` show in console?
- [ ] Is that EXACT origin in Google Cloud Console?
- [ ] Did you wait 5+ minutes after saving in Google Console?
- [ ] Did you try in incognito/private mode?
- [ ] Is `REACT_APP_GOOGLE_CLIENT_ID` set in frontend `.env`?
- [ ] Does the Client ID in `.env` match Google Cloud Console?
- [ ] Are you behind Cloudflare? (might need to add Cloudflare origin)
- [ ] Did you rebuild frontend after changing `.env`?

## 🎯 Most Common Fixes

### Fix 1: Add Both www and non-www
```
https://foodfreaky.in
https://www.foodfreaky.in
```

### Fix 2: Wait Longer
- Google changes can take up to 10 minutes
- Wait, then try in incognito mode

### Fix 3: Clear Everything
- Clear browser cache completely
- Use incognito/private mode
- Try different browser

### Fix 4: Rebuild Frontend
If you changed `.env`:
```bash
cd frontend
npm run build
# Redeploy
```

## 📞 Still Not Working?

Share these details:
1. Exact URL you're accessing (from browser address bar)
2. What `window.location.origin` shows in console
3. Screenshot of Google Cloud Console "Authorized JavaScript origins"
4. Any errors from browser console (Network tab)

---

**Last Updated:** $(date)
