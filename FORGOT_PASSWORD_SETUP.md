# Forgot Password Feature Setup Guide

The forgot password functionality has been implemented and is now ready to use. Here's what you need to know to get it working:

## Overview

The forgot password feature includes:
1. **Forgot Password Page** (`/forgot-password`) — Users enter their email to request a reset link
2. **Reset Password Page** (`/reset-password`) — Users click the email link and set a new password
3. **Email Verification** — Supabase sends password reset emails with a secure token

## Architecture

- **Login Page:** "Forgot Password?" link now navigates to `/forgot-password`
- **ForgotPassword Component:** Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- **ResetPassword Component:** Calls `supabase.auth.updateUser({ password })` after user verifies token
- **Email Delivery:** Handled by Supabase (uses default template or custom template)

## Supabase Configuration Required

### 1. Email Settings (Authentication → Email Templates)

You need to configure the password reset email template in your Supabase project:

1. Go to **Project Settings → Email Templates**
2. Find the **"Confirm email change"** or **"Reset password"** template
3. Make sure the reset link URL points to your app's reset page

**Default Supabase template includes a link like:**
```
{{ .ConfirmationURL }}
```

This URL will be `https://yourapp.com/reset-password#access_token=...&type=recovery`

### 2. Configure Redirect URLs

1. Go to **Project Settings → Authentication → URL Configuration**
2. Add your application's reset password redirect URL:
   - For **local development:** `http://localhost:5173/reset-password`
   - For **production:** `https://yourdomain.com/reset-password`

### 3. Enable Email Provider (if not using Supabase email)

If you have a custom SMTP provider (SendGrid, Mailgun, etc.):
1. Go to **Project Settings → Email**
2. Configure your SMTP settings

If you're using the default Supabase email service, no additional setup is needed, but there may be sending limits.

## Environment Variables

Ensure your `.env.local` in the `frontend/` directory contains:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

These are already required for login to work, so no new variables are needed.

## Testing the Feature

### Local Testing

1. Start your dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login`
3. Click "Forgot Password?"
4. Enter any email and click "Send Reset Link"
5. In **Supabase Dashboard → Authentication → Users**, find the test user and check the email verification details
6. The email would normally be sent to that email address. For testing, you can:
   - Check the test email in your inbox
   - Use Supabase's "Send test email" feature if available

### Production Testing

Once deployed to Vercel:
1. The forgot password email will be sent to the user's actual email address
2. Users click the link in the email to be redirected to `/reset-password`
3. The page automatically verifies the token from the email
4. User sets a new password and is logged in
5. Browser redirects to login after 3 seconds

## How It Works (Technical Details)

### Password Reset Flow

1. **User requests reset:**
   ```javascript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`
   })
   ```
   → Supabase sends an email with a recovery link

2. **User clicks email link:**
   → Browser navigates to `/reset-password` with a hash containing recovery token
   → URL looks like: `https://yourapp.com/reset-password#access_token=...&type=recovery`

3. **ResetPassword component verifies:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   ```
   → Checks if there's a valid recovery session

4. **User enters new password:**
   ```javascript
   await supabase.auth.updateUser({ password: newPassword })
   ```
   → Updates password in auth.users table
   → Logs in the user automatically

## Error Handling

- **Invalid/expired tokens:** Redirects to error page with option to request new reset link
- **Password validation:** Minimum 8 characters, must match confirmation
- **Email not found:** Supabase returns error (for security, it doesn't reveal if email exists)

## Security Considerations

✅ **Token-based:** Only valid recovery tokens can reset passwords  
✅ **Time-limited:** Tokens expire after 24 hours (Supabase default)  
✅ **One-time use:** Tokens are invalidated after use  
✅ **Email verified:** User must have access to the registered email  
✅ **HTTPS required:** Links won't work over HTTP in production

## Troubleshooting

### Email not sending

1. Check Supabase project **Authentication → Providers → Email** is enabled
2. Verify email templates are configured
3. Check Supabase logs for email delivery errors
4. Test with a valid email address (not placeholder emails)
5. If using default Supabase email, may have rate limits

### Token not recognized

1. Ensure URL configuration includes your reset-password page
2. Check that the email link includes the `#access_token` hash
3. Verify token hasn't expired (24-hour default)
4. Try requesting a new reset link

### "Reset link expired" error

1. Email links are valid for 24 hours
2. User can request a new link by going to `/forgot-password` again
3. Already-used tokens cannot be reused

## Files Changed

- ✅ `frontend/src/pages/Login.jsx` — Updated "Forgot Password?" link
- ✅ `frontend/src/pages/ForgotPassword.jsx` — New page for requesting reset
- ✅ `frontend/src/pages/ResetPassword.jsx` — New page for setting new password  
- ✅ `frontend/src/App.jsx` — Added routes for both new pages

## Next Steps

1. Update Supabase email template (optional, but recommended for branding)
2. Test locally with a real email address
3. Deploy to Vercel
4. Test in production with the actual email flow
5. Monitor user feedback for any issues
