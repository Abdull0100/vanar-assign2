import nodemailer from 'nodemailer';

async function testGmailConnection() {
  console.log('🔍 Testing Gmail SMTP Connection...');
  
  // Check environment variables
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || '465';
  const smtpUser = process.env.SMTP_USER || 'shirmeenaamir112@gmail.com';
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  
  console.log('📧 SMTP_HOST:', smtpHost);
  console.log('📧 SMTP_PORT:', smtpPort);
  console.log('📧 SMTP_USER:', smtpUser);
  console.log('📧 SMTP_SECURE:', smtpSecure);
  console.log('📧 SMTP_PASS:', smtpPass ? '***SET***' : '***NOT SET***');
  
  if (!smtpPass || smtpPass === 'eoev hkbd kcxf htyc') {
    console.log('❌ ERROR: SMTP_PASS not set or still using placeholder');
    console.log('💡 Please update your .env file with a real Gmail App Password');
    console.log('💡 Go to: https://myaccount.google.com/apppasswords');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    console.log('🔍 Testing connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    
    // Test sending a simple email
    console.log('📧 Testing email send...');
    const info = await transporter.sendMail({
      from: `"Test" <${smtpUser}>`,
      to: smtpUser, // Send to yourself
      subject: 'Gmail SMTP Test - OTP System',
      text: 'This is a test email to verify Gmail SMTP is working for your OTP system.',
      html: `
        <h1>Gmail SMTP Test</h1>
        <p>This is a test email to verify Gmail SMTP is working for your OTP system.</p>
        <p>If you receive this email, your Gmail setup is working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Check your Gmail inbox for the test email');
    console.log('📧 Email sent to:', smtpUser);
    
  } catch (error) {
    console.log('❌ Gmail SMTP connection failed:');
    console.log('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('💡 This is an authentication error. Please check:');
      console.log('   1. 2-Step Verification is enabled: https://myaccount.google.com/security');
      console.log('   2. App Password is correct: https://myaccount.google.com/apppasswords');
      console.log('   3. Email address is correct');
      console.log('   4. App Password is 16 characters (no spaces)');
    }
  }
}

testGmailConnection();
