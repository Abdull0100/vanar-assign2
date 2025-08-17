# Email Setup Guide

## Option 1: Use Gmail (Recommended for testing)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to Google Account → Security → App passwords
2. Generate a new app password for "Mail"
3. Copy the 16-character password

### Step 3: Add to .env file
Add these lines to your `.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Update email utility
The email utility is already configured for Gmail, so no changes needed.

## Option 2: Use Other Email Providers

### For Outlook/Hotmail:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### For Yahoo:
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## Option 3: Use Development Mode (Current)

If you want to keep using development mode (emails logged to console):

1. **Check your terminal/console** when you:
   - Sign up for a new account
   - Request password reset
   - Request email verification

2. **Look for logs like:**
   ```
   📧 [DEV] Verification email would be sent:
      To: your-email@example.com
      Subject: Verify your email address
      Verification URL: http://localhost:5173/verify/[token]
   ```

3. **Copy the URL from the console** and paste it in your browser

## Testing Email Functionality

### Test Password Reset:
1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check console for reset URL
5. Click the URL to reset password

### Test Email Verification:
1. Go to `/signup`
2. Create a new account
3. Check console for verification URL
4. Click the URL to verify email

## Troubleshooting

### If emails aren't working:
1. Check your `.env` file has correct credentials
2. Make sure you're using app passwords (not regular passwords)
3. Check console for error messages
4. Verify your email provider allows SMTP access

### For Gmail specifically:
- Use App Passwords, not your regular password
- Make sure 2FA is enabled
- Check that "Less secure app access" is disabled (use app passwords instead)
