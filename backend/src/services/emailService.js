// Email service — in development, prints OTP to the terminal.
// To send real emails later, add an SMTP provider (SendGrid, Resend, Mailgun)
// and implement the sendEmail function below.

function printOtpToConsole(email, code, purpose) {
  const line = '━'.repeat(60);
  console.log('');
  console.log(line);
  console.log(`📧  OTP for ${purpose.toUpperCase()}`);
  console.log(line);
  console.log(`   To:      ${email}`);
  console.log(`   Code:    ${code}`);
  console.log(`   Expires: 5 minutes`);
  console.log(line);
  console.log('');
}

async function sendOtpEmail(email, code, purpose) {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_API_KEY) {
    // TODO: implement real email sending here
    // Example with Resend:
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: email,
    //   subject: 'Your verification code',
    //   html: `<p>Your code is <strong>${code}</strong></p>`
    // });
    console.log(`[EMAIL] Would send OTP ${code} to ${email}`);
  } else {
    printOtpToConsole(email, code, purpose);
  }
}

module.exports = { sendOtpEmail };