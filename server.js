import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const WAITLIST_FILE = process.env.WAITLIST_FILE || path.join(DATA_DIR, 'waitlist.json');

// Initialize waitlist file if not exists
if (!fs.existsSync(WAITLIST_FILE)) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function getSubscribers() {
  try {
    if (!fs.existsSync(WAITLIST_FILE)) {
      fs.writeFileSync(WAITLIST_FILE, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(WAITLIST_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading waitlist file:', err.message);
    return [];
  }
}

function saveSubscribers(list) {
  // Atomic write to prevent file corruption on concurrent requests
  const tempFile = `${WAITLIST_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tempFile, WAITLIST_FILE);
}

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.spacemail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false', // true for 465
  auth: {
    user: process.env.SMTP_USER || 'updates@pogx.net',
    pass: process.env.SMTP_PASS || 'PogXonTop005$',
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter on boot
transporter.verify().then(() => {
  console.log('✅ SMTP connection verified with Spacemail (updates@pogx.net)');
}).catch((err) => {
  console.warn('⚠️ SMTP verification warning:', err.message);
});

async function sendWelcomeEmail(toEmail, position, referralCode) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"PogX" <updates@pogx.net>',
    to: toEmail,
    subject: `You're in. PogX Waitlist Spot #${position}`,
    text: `Welcome to PogX!\n\nYou're confirmed for early access at spot #${position}.\n\nPogX is where top content creators compete head-to-head with community stakes.\n\nYour referral link: https://pogx.net/?ref=${referralCode}\n\nWe'll notify you as soon as Creator Cohort 01 opens.\n\n— The PogX Team\nNo spam. Early access updates only.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PogX Waitlist Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#090a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f1f5f9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#090a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#11131b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="left" style="padding-bottom:28px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:8px;font-weight:900;color:#ffffff;font-size:16px;">X</span>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <span style="font-size:20px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;">Pog<span style="color:#a78bfa;">X</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Badge -->
          <tr>
            <td style="padding-bottom:16px;">
              <span style="display:inline-block;padding:6px 14px;background-color:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:999px;color:#c4b5fd;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Early Access Reserved</span>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;line-height:1.25;">
                You're in. Your spot is <span style="color:#a78bfa;">#${position}</span>.
              </h1>
            </td>
          </tr>

          <!-- Paragraph -->
          <tr>
            <td style="padding-bottom:24px;font-size:15px;line-height:1.6;color:#94a3b8;">
              Thank you for joining the PogX waitlist. PogX is the premier competitive arena for content creators to challenge rivals head-to-head, battle in live showdowns, and climb the creator leaderboards.
            </td>
          </tr>

          <!-- Spot Card -->
          <tr>
            <td style="padding-bottom:28px;">
              <div style="background-color:#171924;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:6px;">Your Queue Position</div>
                <div style="font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">#${position}</div>
                <div style="margin-top:8px;font-size:13px;color:#a78bfa;">Creator Cohort 01</div>
              </div>
            </td>
          </tr>

          <!-- Referral Section -->
          <tr>
            <td style="padding-bottom:28px;">
              <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:8px;">Invite other creators to move up:</div>
              <div style="background-color:#090a0f;border:1px dashed rgba(139,92,246,0.4);border-radius:8px;padding:12px 14px;font-size:13px;color:#c4b5fd;word-break:break-all;font-family:monospace;">
                https://pogx.net/?ref=${referralCode}
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                You received this because you entered your email on <a href="https://pogx.net" style="color:#a78bfa;text-decoration:none;">pogx.net</a>.<br>
                No spam. Early access updates only.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Confirmation email sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`⚠️ Email sending failed for ${toEmail}:`, err.message);
    return false;
  }
}

// MIME types lookup
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // API: GET /api/waitlist-count
  if (req.method === 'GET' && pathname === '/api/waitlist-count') {
    const list = getSubscribers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: list.length }));
    return;
  }

  // API: POST /api/waitlist
  if (req.method === 'POST' && pathname === '/api/waitlist') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const email = (data.email || '').trim().toLowerCase();

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please enter a valid email address.' }));
          return;
        }

        const list = getSubscribers();
        const existing = list.find(item => item.email === email);

        if (existing) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            alreadyRegistered: true,
            position: existing.position,
            referralCode: existing.referralCode,
            total: list.length
          }));
          return;
        }

        const clientIp = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
        const userAgent = req.headers['user-agent'] || '';

        const position = list.length + 1;
        const referralCode = 'POG' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const newRecord = {
          email,
          position,
          referralCode,
          refSource: data.ref || null,
          ip: clientIp,
          userAgent,
          createdAt: new Date().toISOString()
        };

        list.push(newRecord);
        saveSubscribers(list);

        // Async trigger welcome email
        sendWelcomeEmail(email, position, referralCode).catch(e => console.error(e));

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          position,
          referralCode,
          total: list.length
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error processing waitlist request.' }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PogX Waitlist server running at http://0.0.0.0:${PORT}`);
});
