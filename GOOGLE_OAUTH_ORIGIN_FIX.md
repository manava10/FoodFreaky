# 🔧 Fix Google OAuth "origin_mismatch" Error

## ❌ Error Message
```
Error 400: origin_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
```

## 🔍 What This Means

The **JavaScript origin** (the URL where your frontend is running) is not registered in Google Cloud Console. Google only allows OAuth requests from registered origins for security.

## ✅ How to Fix

### Step 1: Identify Your Frontend URL

**For Local Development:**
- Your frontend is running at: `http://localhost:3000`

**For Production:**
- Your frontend is deployed at: `https://foodfreaky.in` or `https://www.foodfreaky.in` (or your actual domain)

### Step 2: Add Origin to Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID (the one you're using)
   - Click on it to edit

3. **Add Authorized JavaScript Origins**
   - Scroll to **Authorized JavaScript origins**
   - Click **+ ADD URI**
   - Add your frontend URL(s):

   **For Development:**
   ```
   http://localhost:3000
   ```

   **For Production:**
   ```
   https://foodfreaky.in
   https://www.foodfreaky.in
   ```
   
   **Important Notes:**
   - ✅ Include the protocol (`http://` or `https://`)
   - ✅ Include the port number if using one (`:3000`)
   - ❌ Do NOT include a trailing slash (`/`)
   - ❌ Do NOT include paths (`/login`, `/dashboard`, etc.)
   - ✅ Use exact match (case-sensitive for domain)

4. **Add Authorized Redirect URIs** (if needed)
   - Scroll to **Authorized redirect URIs**
   - Add the same URLs:
   ```
   http://localhost:3000
   https://foodfreaky.in
   https://www.foodfreaky.in
   ```

5. **Save Changes**
   - Click **SAVE** at the bottom
   - Wait 1-5 minutes for changes to propagate

### Step 3: Verify Your Frontend URL

**Check what URL your frontend is actually running on:**

1. **Open your frontend in the browser**
2. **Look at the address bar** - that's your origin
3. **Make sure that EXACT URL is in Google Cloud Console**

**Common Mistakes:**
- ❌ Adding `http://localhost` instead of `http://localhost:3000`
- ❌ Adding `https://foodfreaky.in/` (with trailing slash)
- ❌ Adding backend URL instead of frontend URL
- ❌ Forgetting to add `www` version: `https://www.foodfreaky.in`

### Step 4: Test Again

1. **Wait 1-5 minutes** after saving (Google needs time to update)
2. **Clear your browser cache** (or use incognito mode)
3. **Try Google Sign-In again**

## 📋 Quick Checklist

- [ ] Identified the exact frontend URL (check browser address bar)
- [ ] Added frontend URL to "Authorized JavaScript origins" in Google Cloud Console
- [ ] Added frontend URL to "Authorized redirect URIs" (if required)
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-5 minutes for changes to propagate
- [ ] Cleared browser cache or used incognito mode
- [ ] Tested Google Sign-In again

## 🎯 Common Scenarios

### Scenario 1: Local Development
**Frontend URL:** `http://localhost:3000`

**Add to Google Cloud Console:**
```
http://localhost:3000
```

### Scenario 2: Production (foodfreaky.in)
**Frontend URL:** `https://foodfreaky.in`

**Add to Google Cloud Console:**
```
https://foodfreaky.in
https://www.foodfreaky.in  (if you use www version)
```

### Scenario 3: Using ngrok/Cloudflare Tunnel
**Frontend URL:** `https://abc123.ngrok.io` or `https://xyz.trycloudflare.com`

**Add to Google Cloud Console:**
```
https://abc123.ngrok.io
```
⚠️ **Note:** Free ngrok URLs change each time you restart. You'll need to update Google Cloud Console each time.

### Scenario 4: Netlify/Vercel Deployment
**Frontend URL:** `https://your-app.netlify.app` or `https://your-app.vercel.app`

**Add to Google Cloud Console:**
```
https://your-app.netlify.app
```

## 🔍 How to Find Your Exact Origin

1. **Open your frontend in browser**
2. **Open Developer Tools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Type:** `window.location.origin`
5. **Press Enter** - This shows your exact origin
6. **Copy that exact value** and add it to Google Cloud Console

## ⚠️ Important Notes

1. **Changes take time**: Google updates can take 1-5 minutes to propagate
2. **Exact match required**: The URL must match exactly (including protocol, port, no trailing slash)
3. **Multiple origins**: You can add multiple origins (dev, staging, production)
4. **HTTPS required for production**: Production origins must use `https://`
5. **Backend URL is NOT needed**: Only add the frontend URL, not the backend API URL

## 🆘 Still Not Working?

1. **Double-check the exact URL** in your browser address bar
2. **Verify it's added correctly** in Google Cloud Console (no typos)
3. **Wait longer** (up to 10 minutes in some cases)
4. **Clear browser cache completely** or use incognito/private mode
5. **Check browser console** for any other errors
6. **Verify Client ID** matches in both frontend `.env` and Google Cloud Console

## 📞 Need Help?

If you're still having issues:
1. Check the exact error message in browser console
2. Verify the origin you're trying to use
3. Make sure you're editing the correct OAuth Client ID in Google Cloud Console

---

**Last Updated:** $(date)  
**Status:** ✅ Fix Guide
