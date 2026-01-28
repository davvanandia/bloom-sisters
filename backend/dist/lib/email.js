"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetConfirmation = exports.sendPasswordResetEmail = exports.sendEmail = exports.verifySMTPConnection = void 0;
// Tambahkan import type
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const createTransporter = () => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASSWORD || '',
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    return transporter;
};
// Verifikasi koneksi SMTP
const verifySMTPConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        return true;
    }
    catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return false;
    }
};
exports.verifySMTPConnection = verifySMTPConnection;
// Fungsi untuk mengirim email
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Bloom Sisters" <noreply@bloomsisters.com>',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${options.to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('❌ Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};
exports.sendEmail = sendEmail;
// Template email untuk reset password
const sendPasswordResetEmail = async (email, username, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Bloom Sisters</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #ec4899, #f472b6);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px;
        }
        .code-box {
          background-color: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
        }
        .code {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #ec4899;
          font-family: monospace;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #ec4899, #f472b6);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 10px 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌸 Bloom Sisters</div>
          <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          
          <p>We received a request to reset your password. Use the verification code below to reset your password:</p>
          
          <div class="code-box">
            <div class="code">${resetToken}</div>
            <p style="color: #64748b; margin-top: 10px;">This code will expire in 1 hour</p>
          </div>
          
          <p>Or click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.
          </div>
          
          <p>Best regards,<br>The Bloom Sisters Team</p>
        </div>
        
        <div class="footer">
          <p>© 2024 Bloom Sisters. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
          <p>Need help? Contact us at support@bloomsisters.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
    const textContent = `
    PASSWORD RESET REQUEST - BLOOM SISTERS
    
    Hello ${username},
    
    We received a request to reset your password. Use the verification code below:
    
    Verification Code: ${resetToken}
    This code will expire in 1 hour.
    
    Or use this link: ${resetUrl}
    
    If you didn't request this password reset, please ignore this email.
    
    Best regards,
    The Bloom Sisters Team
    
    © 2024 Bloom Sisters. All rights reserved.
  `;
    return await (0, exports.sendEmail)({
        to: email,
        subject: 'Password Reset Request - Bloom Sisters',
        html: htmlContent,
        text: textContent,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// Template email untuk konfirmasi password berhasil direset
const sendPasswordResetConfirmation = async (email, username) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: auto; padding: 20px; }
        .header { background: #ec4899; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background: #ec4899; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Successful</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Thank you,<br>The Bloom Sisters Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return await (0, exports.sendEmail)({
        to: email,
        subject: 'Password Reset Successful - Bloom Sisters',
        html: htmlContent,
    });
};
exports.sendPasswordResetConfirmation = sendPasswordResetConfirmation;
