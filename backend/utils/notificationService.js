const https = require('https');

/**
 * Sends an email using the Resend API.
 * NOTE: Resend's free tier with onboarding@resend.dev only delivers to the
 * account-owner email (RESEND_OWNER_EMAIL env var). We send there and include
 * the real intended recipient in the email so it can be forwarded / demoed.
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  // The email address registered with Resend (account owner)
  const ownerEmail = process.env.RESEND_OWNER_EMAIL || 'dhruvmajiever1920@gmail.com';

  console.log(`\n📧 [EMAIL DISPATCH] Intended recipient: ${to} | Subject: ${subject}`);

  if (!apiKey) {
    console.log('==================================================');
    console.log('📬 [EMAIL MOCK - NO API KEY] Would send to:', to);
    console.log('Subject:', subject);
    console.log('Body preview:', html.replace(/<[^>]*>/g, ' ').substring(0, 300) + '...');
    console.log('==================================================\n');
    return { success: true, mocked: true };
  }

  // Prepend a banner to the HTML so the owner knows who the real recipient is
  const wrappedHtml = `
    <div style="background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-family:Arial,sans-serif;">
      <strong>📬 Demo Notification</strong> — This email was intended for: <strong>${to}</strong><br/>
      <small style="color:#856404;">(Resend free-tier delivers to account owner only. In production with a verified domain, this goes directly to ${to}.)</small>
    </div>
    ${html}
  `;

  const payload = JSON.stringify({
    from: 'NexusTrack <onboarding@resend.dev>',
    reply_to: ownerEmail,
    to: [ownerEmail],   // Resend free-tier restriction: must be account owner
    subject: `[For: ${to}] ${subject}`,
    html: wrappedHtml,
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ [EMAIL SENT] Delivered to ${ownerEmail} on behalf of ${to} (ID: ${JSON.parse(data).id})`);
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          console.error(`❌ [EMAIL ERROR] Status ${res.statusCode}: ${data}`);
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', (err) => {
      console.error(`❌ [EMAIL CONNECTION ERROR]: ${err.message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
};

/**
 * Sends a notification to a user.
 * Routes to personal_email if set, falls back to company email.
 * Due to Resend free-tier, actual delivery goes to the account owner
 * but the email clearly shows the intended recipient.
 *
 * @param {Object} user - User document from MongoDB
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
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
