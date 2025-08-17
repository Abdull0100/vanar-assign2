# University Email Setup for l215653@lhr.nu.edu.pk

## Option 1: Use Gmail for Sending (Recommended)

Since university emails often have restrictions, it's easier to use Gmail to send emails:

### Step 1: Set up Gmail
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password (Google Account → Security → App passwords)
4. Copy the 16-character password

### Step 2: Add to .env file
Add these lines to your `.env` file:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Step 3: Test
1. Restart your development server
2. Go to `/login` → "Forgot password?"
3. Enter: l215653@lhr.nu.edu.pk
4. Check if you receive the email

## Option 2: Use University Email (Advanced)

If you want to use your university email to send emails, you'll need:

### Step 1: Contact University IT
Ask your university IT department for:
- SMTP server address
- SMTP port
- Whether SSL/TLS is required
- Any special authentication requirements

### Step 2: Add to .env file
```env
EMAIL_USER=l215653@lhr.nu.edu.pk
EMAIL_PASS=your-university-password
EMAIL_HOST=smtp.lhr.nu.edu.pk  # Ask IT for correct server
EMAIL_PORT=587  # Ask IT for correct port
EMAIL_SECURE=false  # Ask IT if SSL is required
```

## Option 3: Development Mode (Current - Easiest)

If you just want to test the functionality:

### Step 1: Test Password Reset
1. Go to `http://localhost:5173/login`
2. Click "Forgot password?"
3. Enter: l215653@lhr.nu.edu.pk
4. Click "Send Reset Link"
5. **Check your terminal/console** for logs like:

```
📧 [DEV] Password reset email would be sent:
   To: l215653@lhr.nu.edu.pk
   Subject: Reset your password
   Reset URL: http://localhost:5173/reset/[token]
```

### Step 2: Use the URL
Copy the URL from your terminal and paste it in your browser to reset your password.

## Option 4: Use a Free Email Service

### Gmail (Free):
- Most reliable for development
- Easy to set up with app passwords

### Outlook/Hotmail (Free):
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Yahoo (Free):
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Testing Steps

1. **Add email credentials to .env file**
2. **Restart your development server**
3. **Test password reset:**
   - Go to `/login` → "Forgot password?"
   - Enter: l215653@lhr.nu.edu.pk
   - Check if you receive email
4. **Test signup:**
   - Go to `/signup`
   - Create account with: l215653@lhr.nu.edu.pk
   - Check if you receive verification email

## Troubleshooting

### If emails still don't work:
1. Check your `.env` file has correct credentials
2. Make sure you restarted the development server
3. Check console for error messages
4. Try using Gmail instead of university email
5. Check your spam folder

### Common Issues:
- **"Authentication failed"** → Wrong password or need app password
- **"Connection timeout"** → Wrong SMTP server or port
- **"No emails received"** → Check spam folder or try Gmail
