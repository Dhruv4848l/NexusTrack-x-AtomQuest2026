const nodemailer = require('nodemailer');

/**
 * Sends an email using Gmail and Nodemailer.
 * Uses GMAIL_USER and GMAIL_PASS (16-digit App Password) from environment variables.
 */
const sendEmail = async ({ to, subject, html }) => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS; // The 16-digit app password

  console.log(`\n📧 [EMAIL DISPATCH] Recipient: ${to} | Subject: ${subject}`);

  if (!user || !pass) {
    console.log('==================================================');
    console.log('📬 [EMAIL MOCK - GMAIL CREDENTIALS MISSING] Would send to:', to);
    console.log('Subject:', subject);
    console.log('Body preview:', html.replace(/<[^>]*>/g, ' ').substring(0, 300) + '...');
    console.log('==================================================\n');
    return { success: true, mocked: true };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"NexusTrack" <${user}>`,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL SENT] Message ID: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error) {
    console.error(`❌ [EMAIL ERROR]: ${error.message}`);
    throw error;
  }
};

/**
 * Sends a notification to a user.
 * Routes to personal_email if set, falls back to company email.
 */
const sendNotification = async (user, subject, html) => {
  const recipient = user.personal_email || user.email;
  console.log(`📨 [NOTIFY] Sending to ${recipient} (personal: ${user.personal_email || 'not set'}, work: ${user.email})`);
  try {
    await sendEmail({ to: recipient, subject, html });
  } catch (err) {
    console.error(`[Notification Service] Failed to notify user ${user._id} (${recipient}): ${err.message}`);
  }
};

module.exports = {
  sendEmail,
  sendNotification,
};
