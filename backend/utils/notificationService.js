const https = require('https');
const { EmailClient } = require("@azure/communication-email");

/**
 * Sends an email using Azure Communication Services or Resend API.
 * Falls back to mock if no credentials are provided.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  const azureConnectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Try Azure Communication Services first
  if (azureConnectionString) {
    const client = new EmailClient(azureConnectionString);
    const emailMessage = {
      senderAddress: process.env.AZURE_SENDER_ADDRESS || "DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net",
      content: { subject, html },
      recipients: { to: [{ address: to }] },
      replyTo: [{ address: "dhruvmajiever1920@gmail.com", displayName: "Dhruv Maji" }]
    };
    try {
      const poller = await client.beginSend(emailMessage);
      const result = await poller.pollUntilDone();
      console.log(`📬 [EMAIL SUCCESS] Sent "${subject}" to ${to} via Azure (Op ID: ${result.id})`);
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ [EMAIL ERROR] Azure failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // 2. Fallback to Resend API
  if (resendApiKey) {
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
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`📬 [EMAIL SUCCESS] Sent "${subject}" to ${to} via Resend (Resend ID: ${JSON.parse(data).id})`);
            resolve({ success: true, data: JSON.parse(data) });
          } else {
            console.error(`❌ [EMAIL ERROR] Failed to send email to ${to} via Resend: ${data}`);
            reject(new Error(`Resend API returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error(`❌ [EMAIL CONNECTION ERROR] Resend API failed: ${err.message}`);
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }

  // 3. Fallback to Mock
  console.log('\n==================================================');
  console.log('📬 [EMAIL MOCK SERVICE - NO API CREDENTIALS SET]');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--------------------------------------------------');
  console.log('HTML Body preview:');
  console.log(html.replace(/<[^>]*>/g, ' ').substring(0, 200) + '...');
  console.log('==================================================\n');
  return { success: true, mocked: true };
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
