# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for FoodFreaky.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: FoodFreaky
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: FoodFreaky Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
7. Copy the **Client ID** (you'll need this)

## Step 2: Install Backend Dependencies

Run in the backend directory:
```bash
cd backend
npm install google-auth-library
```

## Step 3: Configure Environment Variables

### Backend (.env)
Add to your `backend/.env` file:
```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### Frontend (.env)
Add to your `frontend/.env` file:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Important:** The Client ID should be the same for both backend and frontend.

## Step 4: Verify Setup

1. Make sure the Google Identity Services script is loaded in `frontend/public/index.html` (already added)
2. Restart both backend and frontend servers
3. Navigate to the login page
4. You should see a "Sign in with Google" button

## How It Works

1. User clicks "Sign in with Google" button
2. Google's One Tap or sign-in popup appears
3. User selects their Google account
4. Google returns an ID token
5. Frontend sends the ID token to `/api/auth/google`
6. Backend verifies the token with Google
7. Backend creates or finds the user account
8. Backend returns a JWT token for the user
9. User is logged in

## Features

- **Automatic Account Creation**: New users are automatically created when signing in with Google
- **Account Linking**: If a user already has an account with the same email, their Google account is linked
- **Auto-Verification**: Google OAuth users are automatically verified (no OTP needed)
- **Contact Number**: Google OAuth users get a placeholder contact number that they should update in their profile

## Troubleshooting

### Button Not Showing
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Make sure the Google Identity Services script is loaded
- Check browser console for errors

### "Invalid Google token" Error
- Verify `GOOGLE_CLIENT_ID` in backend `.env` matches the frontend
- Make sure the Client ID is correct (no extra spaces or characters)
- Check that the authorized origins include your domain

### CORS Errors
- Add your frontend URL to authorized JavaScript origins in Google Cloud Console
- Make sure the URL matches exactly (including http/https and port)

### Token Verification Fails
- Ensure `google-auth-library` is installed in backend
- Check that the Client ID in backend `.env` is correct
- Verify the token hasn't expired (they expire quickly)

## Security Notes

- Never commit `.env` files to version control
- Use different Client IDs for development and production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Testing

1. Use a test Google account
2. Sign in with Google
3. Verify the user is created in the database
4. Check that the user can access protected routes
5. Test account linking by creating an account with email/password first, then signing in with Google using the same email
