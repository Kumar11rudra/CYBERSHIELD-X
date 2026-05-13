/**
 * Gmail SMTP fix — use Google App Password, NOT your Gmail password.
 * Generate at: https://myaccount.google.com/apppasswords
 *
 * .env:
 *   EMAIL_USER=yourname@gmail.com
 *   EMAIL_PASS=abcd efgh ijkl mnop   (16-char App Password, spaces OK)
 *   EMAIL_FROM=CyberShield X <yourname@gmail.com>
 *   NODE_ENV=production   (set this to actually send emails; omit for dev)
 */

const nodemailer = require('nodemailer');

let _transporter = null;

const isEmailDeliveryConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const isEmailPreviewModeEnabled = () => process.env.EMAIL_PREVIEW_MODE === 'true';

const getTransporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''), // strip spaces
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  return _transporter;
};

const IS_DEV = process.env.NODE_ENV !== 'production';

const buildHtml = (username, scan) => {
  const colors = { dangerous: '#ff2244', medium: '#ff8c00', low: '#ffdd00', safe: '#00ff88' };
  const color = colors[scan.riskLevel] || '#ff2244';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Courier New',monospace;color:#e0e6ff;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
<tr><td style="background:#0d1117;padding:24px 28px;border-bottom:2px solid ${color};">
  <h1 style="margin:0;color:${color};font-size:20px;letter-spacing:2px;">⚠ CYBERSHIELD X — THREAT ALERT</h1>
</td></tr>
<tr><td style="padding:24px 28px;">
  <p style="color:#8892b0;">Hello <strong style="color:#e0e6ff;">${username}</strong>, a high-risk target was detected:</p>
  <div style="background:#0d1117;border:1px solid #1e2d4a;border-left:4px solid ${color};padding:20px;border-radius:4px;">
    <table width="100%">
      <tr><td style="color:#8892b0;font-size:12px;padding:4px 0;">Target</td>
          <td style="color:#e0e6ff;text-align:right;font-size:12px;word-break:break-all;">${scan.target}</td></tr>
      <tr><td style="color:#8892b0;font-size:12px;padding:4px 0;">Type</td>
          <td style="color:#e0e6ff;text-align:right;font-size:12px;">${(scan.targetType || '').toUpperCase()}</td></tr>
      <tr><td style="color:#8892b0;font-size:12px;padding:4px 0;">Score</td>
          <td style="color:${color};text-align:right;font-size:24px;font-weight:bold;">${scan.threatScore}/100</td></tr>
      <tr><td style="color:#8892b0;font-size:12px;padding:4px 0;">Risk</td>
          <td style="text-align:right;"><span style="background:${color}22;color:${color};border:1px solid ${color}55;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:bold;">${(scan.riskLevel || '').toUpperCase()}</span></td></tr>
    </table>
  </div>
  <p style="color:#ff2244;font-weight:bold;margin-top:16px;">⚡ Do not visit or interact with this target.</p>
</td></tr>
<tr><td style="background:#0d1117;padding:14px 28px;text-align:center;border-top:1px solid #1e2d4a;color:#4a5568;font-size:11px;">
  CyberShield X — Automated Threat Intelligence Alert
</td></tr>
</table></td></tr></table></body></html>`;
};

const sendThreatAlert = async ({ to, username, scan }) => {
  const subject = `🚨 [CyberShield X] Threat Detected — ${scan.threatScore}/100 (${(scan.riskLevel || '').toUpperCase()})`;

  if (IS_DEV) {
    console.log('\n📧 [DEV] Email skipped — would send to:', to);
    console.log('   Subject:', subject);
    console.log('   Target:', scan.target, '| Score:', scan.threatScore, '\n');
    return { sent: false, reason: 'dev-mode' };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[emailAlerts] EMAIL_USER/EMAIL_PASS not configured.');
    return { sent: false, reason: 'not-configured' };
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: buildHtml(username, scan),
    });
    console.log('[emailAlerts] Sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[emailAlerts] Failed:', err.message);
    if (err.message.includes('535')) {
      console.error('[emailAlerts] HINT: Use a Google App Password, not your Gmail password.');
      console.error('  → https://myaccount.google.com/apppasswords');
    }
    return { sent: false, reason: err.message };
  }
};

const sendVerificationCode = async ({ to, code, expiresInMinutes = 10, verifyLink = '' }) => {
  if (!isEmailDeliveryConfigured()) {
    const error = new Error('Email configuration missing in .env (EMAIL_USER/EMAIL_PASS required).');
    error.status = 503;
    throw error;
  }

  const linkSection = verifyLink ? `
    <div style="margin:16px 0;text-align:center;">
      <p style="color:#8892b0;font-size:12px;margin-bottom:12px;">Or click the button below to verify instantly:</p>
      <a href="${verifyLink}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:linear-gradient(135deg,#00ff88,#00d4ff);color:#0a0e1a;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;text-transform:uppercase;">✓ VERIFY EMAIL</a>
      <p style="color:#4a5568;font-size:10px;margin-top:8px;word-break:break-all;">${verifyLink}</p>
    </div>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0e1a;color:#e0e6ff;padding:40px;">
<div style="max-width:600px;margin:0 auto;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
  <div style="background:#0d1117;padding:24px;border-bottom:2px solid #00d4ff;">
    <h1 style="margin:0;color:#00d4ff;font-size:20px;letter-spacing:2px;">CYBERSHIELD X — EMAIL VERIFICATION</h1>
  </div>
  <div style="padding:24px;">
    <p style="color:#8892b0;">Use this one-time code to verify your email:</p>
    <div style="margin:24px 0;padding:18px;border:1px solid #1e2d4a;background:#0d1117;border-radius:6px;text-align:center;">
      <div style="font-size:32px;letter-spacing:8px;color:#00ff88;font-weight:bold;">${code}</div>
    </div>
    ${linkSection}
    <p style="color:#8892b0;">This code expires in ${expiresInMinutes} minutes.</p>
    <p style="color:#4a5568;font-size:11px;margin-top:16px;">If you did not request this, please ignore this email.</p>
  </div>
</div></body></html>`;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
      to,
      subject: `CyberShield X verification code: ${code}`,
      html,
    });
    return { delivered: true, mode: 'email' };
  } catch (err) {
    console.error('[FINAL EMAIL ERROR]', err.message);
    throw new Error('Email delivery failed. Check SMTP credentials or network.');
  }
};

const sendPasswordResetLink = async ({ to, username, resetUrl, expiresInMinutes = 30 }) => {
  if (IS_DEV || isEmailPreviewModeEnabled()) {
    console.log(`\n📧 [DEV] Password reset skipped — would send to: ${to}`);
    console.log(`   Reset URL: ${resetUrl} (expires in ${expiresInMinutes} min)\n`);
    return { delivered: false, mode: 'preview' };
  }

  if (!isEmailDeliveryConfigured()) {
    const error = new Error('Email delivery is not configured. Update EMAIL_USER and EMAIL_PASS.');
    error.status = 503;
    throw error;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0e1a;color:#e0e6ff;padding:40px;">
<div style="max-width:600px;margin:0 auto;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
  <div style="background:#0d1117;padding:24px;border-bottom:2px solid #00d4ff;">
    <h1 style="margin:0;color:#00d4ff;font-size:20px;letter-spacing:2px;">CYBERSHIELD X — PASSWORD RESET</h1>
  </div>
  <div style="padding:24px;">
    <p style="color:#8892b0;">Hello <strong style="color:#e0e6ff;">${username}</strong>,</p>
    <p style="color:#8892b0;">Use the button below to reset your password.</p>
    <div style="margin:24px 0;padding:18px;border:1px solid #1e2d4a;background:#0d1117;border-radius:6px;text-align:center;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:#00d4ff;color:#081018;text-decoration:none;font-weight:bold;letter-spacing:1px;">Reset Password</a>
    </div>
    <p style="color:#8892b0;">This link expires in ${expiresInMinutes} minutes.</p>
    <p style="color:#4a5568;font-size:12px;word-break:break-all;margin-top:16px;">Fallback link: ${resetUrl}</p>
  </div>
</div></body></html>`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
    to,
    subject: 'CyberShield X password reset request',
    html,
  });

  return { delivered: true, mode: 'email' };
};const sendPasswordResetOtp = async ({ to, username, otp, expiresInMinutes = 30 }) => {
  const isPreviewMode = isEmailPreviewModeEnabled() || (!isEmailDeliveryConfigured() && IS_DEV);
  if (isPreviewMode) {
    console.log(`\n📧 [DEV] Password reset OTP skipped — would send to: ${to}`);
    console.log(`   OTP: ${otp} (expires in ${expiresInMinutes} min)\n`);
    return { delivered: false, mode: 'preview' };
  }

  if (!isEmailDeliveryConfigured()) {
    const error = new Error('Email delivery is not configured. Update EMAIL_USER and EMAIL_PASS.');
    error.status = 503;
    throw error;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0e1a;color:#e0e6ff;padding:40px;">
<div style="max-width:600px;margin:0 auto;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
  <div style="background:#0d1117;padding:24px;border-bottom:2px solid #ffdd00;">
    <h1 style="margin:0;color:#ffdd00;font-size:20px;letter-spacing:2px;">CYBERSHIELD X — PASSWORD RESET</h1>
  </div>
  <div style="padding:24px;">
    <p style="color:#8892b0;">Hello <strong style="color:#e0e6ff;">${username}</strong>,</p>
    <p style="color:#8892b0;">Use this one-time code to reset your password:</p>
    <div style="margin:24px 0;padding:18px;border:1px solid #1e2d4a;background:#0d1117;border-radius:6px;text-align:center;">
      <div style="font-size:32px;letter-spacing:8px;color:#ffdd00;font-weight:bold;">${otp}</div>
    </div>
    <p style="color:#8892b0;">This code expires in ${expiresInMinutes} minutes.</p>
  </div>
</div></body></html>`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
    to,
    subject: `CyberShield X reset code: ${otp}`,
    html,
  });

  return { delivered: true, mode: 'email' };
};

const verifySmtpConfig = async () => {
  if (IS_DEV) return console.log('[emailAlerts] Dev mode — SMTP check skipped.');
  try {
    await getTransporter().verify();
    console.log('[emailAlerts] ✅ SMTP OK');
  } catch (e) {
    console.warn('[emailAlerts] ⚠ SMTP failed:', e.message);
  }
};

const sendWelcomeEmail = async ({ to, username, fullName, age, gender, country, email }) => {
  const isPreviewMode = isEmailPreviewModeEnabled() || (!isEmailDeliveryConfigured() && IS_DEV);
  if (isPreviewMode) {
    console.log(`\n📧 [DEV] Welcome email skipped — would send to: ${to}\n`);
    return { delivered: false, mode: 'preview' };
  }

  if (!isEmailDeliveryConfigured()) return { delivered: false, reason: 'not-configured' };

  const createdAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0e1a;color:#e0e6ff;padding:40px;">
<div style="max-width:600px;margin:0 auto;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
  <div style="background:#0d1117;padding:24px;border-bottom:2px solid #00ff88;">
    <h1 style="margin:0;color:#00ff88;font-size:20px;letter-spacing:2px;">✓ WELCOME TO CYBERSHIELD X</h1>
  </div>
  <div style="padding:24px;">
    <p style="color:#8892b0;">Welcome aboard <strong style="color:#e0e6ff;">${username}</strong>,</p>
    <p style="color:#8892b0;">Your account has been successfully created. You now have access to advanced threat detection tools and the CyberShield X Nexus.</p>
    
    <div style="margin:24px 0;padding:20px;border:1px solid #1e2d4a;background:#0d1117;border-radius:6px;">
      <h3 style="color:#00d4ff;font-size:14px;letter-spacing:2px;margin:0 0 16px 0;border-bottom:1px solid #1e2d4a;padding-bottom:8px;">YOUR ACCOUNT DETAILS</h3>
      <table width="100%" style="border-collapse:collapse;">
        <tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Username</td>
            <td style="color:#00ff88;text-align:right;font-size:12px;padding:6px 0;font-weight:bold;">${username}</td></tr>
        <tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Email</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${email || to}</td></tr>
        ${fullName ? `<tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Full Name</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${fullName}</td></tr>` : ''}
        ${age ? `<tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Age</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${age}</td></tr>` : ''}
        ${gender ? `<tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Gender</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${gender}</td></tr>` : ''}
        ${country ? `<tr><td style="color:#8892b0;font-size:12px;padding:6px 0;border-bottom:1px solid #1e2d4a22;">Country</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${country}</td></tr>` : ''}
        <tr><td style="color:#8892b0;font-size:12px;padding:6px 0;">Registered On</td>
            <td style="color:#e0e6ff;text-align:right;font-size:12px;padding:6px 0;">${createdAt}</td></tr>
      </table>
    </div>

    <div style="margin:24px 0;padding:18px;border:1px solid #1e2d4a;background:#0d1117;border-radius:6px;text-align:center;">
      <p style="color:#00ff88;font-weight:bold;margin:0;">SYSTEM ARMED AND READY</p>
    </div>
    <p style="color:#ffdd00;font-size:11px;margin-top:12px;">⚠ Save this email for your records. Keep your credentials safe and never share them.</p>
    <p style="color:#4a5568;font-size:11px;margin-top:16px;">This is an automated system message from CyberShield X.</p>
  </div>
</div></body></html>`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
    to,
    subject: '✓ Welcome to CyberShield X — Your Account Details',
    html,
  });

  return { delivered: true, mode: 'email' };
};

const sendPasswordChangeNotification = async ({ to, username }) => {
  const isPreviewMode = isEmailPreviewModeEnabled() || (!isEmailDeliveryConfigured() && IS_DEV);
  if (isPreviewMode) {
    console.log(`\n📧 [DEV] Password change notice skipped — would send to: ${to}\n`);
    return { delivered: false, mode: 'preview' };
  }

  if (!isEmailDeliveryConfigured()) return { delivered: false, reason: 'not-configured' };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Courier New',monospace;background:#0a0e1a;color:#e0e6ff;padding:40px;">
<div style="max-width:600px;margin:0 auto;border:1px solid #1e2d4a;border-radius:8px;overflow:hidden;">
  <div style="background:#0d1117;padding:24px;border-bottom:2px solid #00d4ff;">
    <h1 style="margin:0;color:#00d4ff;font-size:20px;letter-spacing:2px;">SECURITY ALERT: PASSWORD CHANGED</h1>
  </div>
  <div style="padding:24px;">
    <p style="color:#8892b0;">Hello <strong style="color:#e0e6ff;">${username}</strong>,</p>
    <p style="color:#8892b0;">Your CyberShield X account password was recently changed.</p>
    <p style="color:#ffdd00;">If you did not make this change, please contact support immediately or initiate a password reset to secure your account.</p>
    <p style="color:#4a5568;font-size:12px;margin-top:24px;">This is an automated security alert.</p>
  </div>
</div></body></html>`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `CyberShield X <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Security Alert: Password Changed',
    html,
  });

  return { delivered: true, mode: 'email' };
};

module.exports = {
  isEmailDeliveryConfigured,
  isEmailPreviewModeEnabled,
  sendThreatAlert,
  verifySmtpConfig,
  sendVerificationCode,
  sendPasswordResetLink,
  sendPasswordResetOtp,
  sendWelcomeEmail,
  sendPasswordChangeNotification,
  sendSignupOtpEmail: async ({ to, otp }) => {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'CyberShield X <noreply@cybershieldx.com>',
      to,
      subject: `🔐 ${otp} is your CyberShield X verification code`,
      html: `
        <div style="background:#0a0e1a; color:#e0e6ff; padding:40px; font-family:monospace;">
          <h2 style="color:#00ff88; letter-spacing:2px;">CYBERSHIELD X</h2>
          <p>Your verification code for creating a new account is:</p>
          <div style="background:#0d1117; padding:20px; border:1px solid #1e2d4a; border-left:4px solid #00ff88; font-size:32px; letter-spacing:8px; text-align:center; color:#00ff88; margin:20px 0;">
            ${otp}
          </div>
          <p style="color:#8892b0; font-size:12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };
    if (process.env.EMAIL_PREVIEW_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [EMAIL PREVIEW] To: ${to} | Code: ${otp}\n`);
      if (process.env.EMAIL_PREVIEW_MODE !== 'true') return { delivered: true, mode: 'console' };
    }
    await transporter.sendMail(mailOptions);
    return { delivered: true, mode: 'email' };
  }
};
