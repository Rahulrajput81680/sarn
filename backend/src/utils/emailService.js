const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null
  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  return _transporter
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter()
  if (!t) {
    console.log(`[Email] Not configured — skipping email to ${to}: "${subject}"`)
    return
  }
  try {
    await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'SARN Connect'}" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    })
    console.log(`[Email] Sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message)
  }
}

/* ─── HTML email templates ──────────────────────────────── */

function layout(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:#16a34a;padding:24px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
  .body{padding:28px 32px;color:#374151;font-size:14px;line-height:1.6}
  .btn{display:inline-block;margin:16px 0;padding:12px 28px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px}
  .footer{padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center;border-top:1px solid #e5e7eb}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
  .green{background:#dcfce7;color:#16a34a} .red{background:#fee2e2;color:#dc2626} .amber{background:#fef3c7;color:#d97706}
</style></head><body>
  <div class="wrap">
    <div class="header"><h1>SARN Connect</h1></div>
    <div class="body"><h2 style="margin-top:0;color:#111827">${title}</h2>${body}</div>
    <div class="footer">SARN Connect · WhatsApp Business Platform · <a href="https://sarnconnect.in" style="color:#16a34a">sarnconnect.in</a></div>
  </div>
</body></html>`
}

function passwordResetEmail(name, resetUrl) {
  return layout('Reset your password', `
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="color:#6b7280;font-size:12px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  `)
}

function welcomeEmail(name) {
  return layout('Welcome to SARN Connect!', `
    <p>Hi ${name},</p>
    <p>Your account has been created. Complete your onboarding to connect your WhatsApp Business number and start messaging your customers.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
  `)
}

function templateApprovedEmail(templateName, businessName) {
  return layout('Template Approved ✓', `
    <p>Hi ${businessName},</p>
    <p>Your WhatsApp message template has been approved by Meta and is ready to use.</p>
    <p><strong>Template:</strong> <code>${templateName}</code> &nbsp;<span class="badge green">APPROVED</span></p>
    <p>You can now use this template in Bulk Messaging campaigns and new conversations.</p>
    <a href="${process.env.FRONTEND_URL}/templates" class="btn">View Templates</a>
  `)
}

function templateRejectedEmail(templateName, businessName, reason) {
  return layout('Template Rejected', `
    <p>Hi ${businessName},</p>
    <p>Your WhatsApp message template was reviewed and rejected by Meta.</p>
    <p><strong>Template:</strong> <code>${templateName}</code> &nbsp;<span class="badge red">REJECTED</span></p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please review Meta's template guidelines, make the necessary changes, and resubmit.</p>
    <a href="${process.env.FRONTEND_URL}/templates" class="btn">Edit Template</a>
  `)
}

function accountSuspendedEmail(name, businessName) {
  return layout('Account Suspended', `
    <p>Hi ${name},</p>
    <p>Your SARN Connect account for <strong>${businessName}</strong> has been suspended.</p>
    <p>You will not be able to access the platform or send messages until your account is reactivated.</p>
    <p>If you believe this is a mistake, please contact our support team at <a href="mailto:support@sarnconnect.in">support@sarnconnect.in</a>.</p>
  `)
}

function accountReactivatedEmail(name, businessName) {
  return layout('Account Reactivated ✓', `
    <p>Hi ${name},</p>
    <p>Good news! Your SARN Connect account for <strong>${businessName}</strong> has been reactivated.</p>
    <p>You can now log in and resume using all platform features.</p>
    <a href="${process.env.FRONTEND_URL}/login" class="btn">Log In Now</a>
  `)
}

function newTemplateSubmittedEmail(templateName, businessName) {
  return layout('New Template Pending Review', `
    <p>A client has submitted a new WhatsApp template for your review.</p>
    <p><strong>Business:</strong> ${businessName}</p>
    <p><strong>Template:</strong> <code>${templateName}</code> &nbsp;<span class="badge amber">PENDING</span></p>
    <p>Review and approve or reject it from the admin panel.</p>
    <a href="${process.env.FRONTEND_URL}/admin/meta/templates" class="btn">Review Template</a>
  `)
}

function planUpgradeEmail(name, planName, amount) {
  return layout('Plan Upgraded Successfully ✓', `
    <p>Hi ${name},</p>
    <p>Your SARN Connect plan has been upgraded successfully.</p>
    <p><strong>New Plan:</strong> <span class="badge green">${planName}</span></p>
    <p><strong>Amount Paid:</strong> ₹${amount}</p>
    <p>Your new message limits and features are now active.</p>
    <a href="${process.env.FRONTEND_URL}/billing" class="btn">View Billing</a>
  `)
}

module.exports = {
  sendEmail,
  passwordResetEmail,
  welcomeEmail,
  templateApprovedEmail,
  templateRejectedEmail,
  accountSuspendedEmail,
  accountReactivatedEmail,
  newTemplateSubmittedEmail,
  planUpgradeEmail,
}
