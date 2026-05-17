const https = require('https');

/**
 * Sends an email using the Resend API.
 * Uses native Node.js 'https' module to avoid adding external dependencies.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('\n==================================================');
    console.log('📬 [EMAIL MOCK SERVICE - NO API KEY SET]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log('HTML Body preview:');
    console.log(html.replace(/<[^>]*>/g, ' ').substring(0, 200) + '...');
    console.log('==================================================\n');
    return { success: true, mocked: true };
  }

  // Resend free tier allows sending to any email, but the 'from' address
  // MUST be 'onboarding@resend.dev' unless a custom domain is verified.
  const payload = JSON.stringify({
    from: 'AtomQuest <onboarding@resend.dev>',
    reply_to: 'dhruvmajiever1920@gmail.com',
    to: [to],
    subject: subject,
    html: html,
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`📬 [EMAIL SUCCESS] Sent "${subject}" to ${to} (Resend ID: ${JSON.parse(data).id})`);
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          console.error(`❌ [EMAIL ERROR] Failed to send email to ${to}: ${data}`);
          reject(new Error(`Resend API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [EMAIL CONNECTION ERROR] resend API failed: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Sends a notification. If the user has a personal_email configured,
 * it routes there; otherwise it falls back to their company email.
 *
 * @param {Object} user - User document from MongoDB
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
const sendNotification = async (user, subject, html) => {
  const recipient = user.personal_email || user.email;
  try {
    await sendEmail({ to: recipient, subject, html });
  } catch (err) {
    console.error(`[Notification Service] Failed to notify user ${user._id}: ${err.message}`);
  }
};

module.exports = {
  sendEmail,
  sendNotification,
};
