# ☁️ Cloudflare Deployment Guide - FoodFreaky

This guide covers the specific configuration needed when deploying behind Cloudflare.

---

## ⚠️ Important: Cloudflare and Rate Limiting

When deploying behind Cloudflare, your backend will see **Cloudflare's IP addresses** instead of the real client IPs. This can break IP-based rate limiting if not configured correctly.

### The Problem:
- Without proper configuration, all requests appear to come from Cloudflare's IPs
- Rate limiting will treat all users as the same IP
- Legitimate users might get rate-limited incorrectly

### The Solution:
✅ **Already Configured!** The application has been updated to:
1. Trust the Cloudflare proxy
2. Read real client IPs from Cloudflare headers (`CF-Connecting-IP`)
3. Use real client IPs for rate limiting

---

## 🔧 Configuration

### Backend Configuration

The backend is already configured to work with Cloudflare:

1. **Trust Proxy** - Enabled in production:
   ```javascript
   // backend/index.js
   if (process.env.NODE_ENV === 'production' || process.env.BEHIND_PROXY === 'true') {
       app.set('trust proxy', 1); // Trust first proxy (Cloudflare)
   }
   ```

2. **Real IP Detection** - Custom function reads Cloudflare headers:
   ```javascript
   // backend/middleware/rateLimiter.js
   const getClientIp = (req) => {
       // Cloudflare sends the real client IP in CF-Connecting-IP header
       if (req.headers['cf-connecting-ip']) {
           return req.headers['cf-connecting-ip'];
       }
       // Fallback to X-Forwarded-For or req.ip
       // ...
   };
   ```

3. **Rate Limiters** - All use real client IPs:
   - General API limiter
   - Auth IP limiter
   - Order limiter
   - Coupon limiter

---

## 🚀 Deployment Steps

### 1. Environment Variables

Add to your backend `.env` file:
```env
NODE_ENV=production
BEHIND_PROXY=true  # Optional: explicitly enable proxy trust
```

### 2. Cloudflare Settings

#### DNS Configuration:
- Point your domain to your backend server IP
- Enable **Proxy** (orange cloud) in Cloudflare DNS

#### SSL/TLS Settings:
- Set SSL/TLS encryption mode to **Full** or **Full (strict)**
- This ensures HTTPS between Cloudflare and your backend

#### Network Settings:
- **Web Application Firewall (WAF)**: Optional but recommended
- **Rate Limiting**: You can use Cloudflare's rate limiting as an additional layer, but our app-level rate limiting will still work correctly

### 3. Verify Real IP Detection

After deployment, test that real IPs are being detected:

```bash
# Check logs - you should see real client IPs, not Cloudflare IPs
# The rate limiter will log the IPs it's using
```

You can also add a test endpoint to verify:
```javascript
// Test endpoint (remove after verification)
app.get('/test-ip', (req, res) => {
    res.json({
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'req.ip': req.ip,
        'real-ip': getClientIp(req) // From rate limiter
    });
});
```

---

## ✅ Rate Limiting Behavior Behind Cloudflare

### How It Works:

1. **User makes request** → Cloudflare receives it
2. **Cloudflare forwards** → Adds `CF-Connecting-IP` header with real client IP
3. **Backend receives** → Reads real IP from header
4. **Rate limiter** → Uses real IP for rate limiting

### Rate Limiting Strategy:

The application uses a **hybrid approach** that works well behind Cloudflare:

1. **IP-based limits** (HIGH limits):
   - General API: 5000 requests/15min per IP
   - Auth: 1000 attempts/15min per IP
   - These are just DDoS protection, not strict security

2. **User-based limits** (STRICT limits):
   - Auth: 5 failed attempts/15min per email
   - OTP: 3 requests/hour per email/phone
   - Password reset: 3 requests/hour per email
   - These provide the real security and work regardless of IP

### Why This Works:

- **IP-based limits** use real client IPs (from Cloudflare headers)
- **User-based limits** don't depend on IP at all (use email/phone/user ID)
- Even if IP detection fails, user-based limits still protect the system

---

## 🔍 Troubleshooting

### Issue: Rate limiting not working correctly

**Symptoms:**
- All users getting rate-limited together
- Rate limits too strict or too lenient

**Solutions:**
1. Verify `trust proxy` is enabled:
   ```javascript
   // Check backend/index.js
   app.set('trust proxy', 1);
   ```

2. Check Cloudflare headers are being sent:
   ```bash
   # Add logging to see headers
   console.log('CF-Connecting-IP:', req.headers['cf-connecting-ip']);
   ```

3. Verify environment variable:
   ```env
   NODE_ENV=production
   # OR
   BEHIND_PROXY=true
   ```

### Issue: Still seeing Cloudflare IPs in logs

**Solution:**
- Ensure `CF-Connecting-IP` header is being read
- Check that `trust proxy` is enabled
- Verify Cloudflare proxy is enabled (orange cloud in DNS)

### Issue: Rate limiting too aggressive

**Solution:**
- The limits are intentionally high for shared networks
- If needed, adjust limits in `backend/middleware/rateLimiter.js`
- Consider using Cloudflare's rate limiting as an additional layer

---

## 📊 Monitoring

### What to Monitor:

1. **Rate Limit Hits**: Check if legitimate users are being rate-limited
2. **IP Detection**: Verify real IPs are being logged (not Cloudflare IPs)
3. **Error Rates**: Monitor for 429 (Too Many Requests) errors

### Cloudflare Analytics:

- Use Cloudflare dashboard to monitor:
  - Request rates
  - Geographic distribution
  - Attack patterns
  - WAF blocks

---

## 🎯 Best Practices

1. **Use Cloudflare WAF**: Additional security layer
2. **Monitor Rate Limits**: Adjust if needed based on traffic patterns
3. **User-based Limits**: These are your primary security (not IP-based)
4. **Test Thoroughly**: Verify rate limiting works correctly after deployment
5. **Log Real IPs**: Helps with debugging and security analysis

---

## ✅ Verification Checklist

Before going live:

- [ ] `NODE_ENV=production` set in backend
- [ ] `BEHIND_PROXY=true` set (optional but recommended)
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] SSL/TLS mode set to Full or Full (strict)
- [ ] Test endpoint shows real client IPs
- [ ] Rate limiting works correctly (test with multiple IPs)
- [ ] User-based rate limiting works (test with same IP, different emails)
- [ ] Logs show real client IPs (not Cloudflare IPs)

---

## 📝 Summary

✅ **Rate limiting will NOT break** when deployed behind Cloudflare because:

1. ✅ Trust proxy is configured
2. ✅ Real client IPs are read from `CF-Connecting-IP` header
3. ✅ All rate limiters use the real client IP
4. ✅ User-based limits provide additional security (IP-independent)

The application is **fully compatible** with Cloudflare deployment! 🚀

---

**Last Updated:** $(date)  
**Status:** ✅ Cloudflare Compatible
