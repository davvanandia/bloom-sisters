const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('🔧 Testing SMTP Configuration...\n');
  
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  
  console.log('📋 Configuration:');
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.auth.user}`);
  console.log(`Password: ${config.auth.pass ? '***' + config.auth.pass.slice(-3) : 'Not set'}\n`);
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔌 Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Test" <${config.auth.user}>`,
      to: config.auth.user, // Kirim ke diri sendiri
      subject: 'SMTP Test - Bloom Sisters',
      text: 'This is a test email from Bloom Sisters backend.',
      html: `
        <h1 style="color: #ec4899;">SMTP Test Successful! 🎉</h1>
        <p>This email confirms that your SMTP configuration is working correctly.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Host: ${config.host}</li>
          <li>Port: ${config.port}</li>
          <li>User: ${config.auth.user}</li>
        </ul>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
    
    console.log(`✅ Test email sent successfully!`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`👤 From: ${info.envelope.from}`);
    console.log(`👥 To: ${info.envelope.to}`);
    
  } catch (error) {
    console.error('❌ SMTP Test Failed:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('1. Email username and password are correct');
      console.error('2. For Gmail: Enable "Less secure app access" or use App Password');
      console.error('3. For Office 365: Check if SMTP is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection failed. Please check:');
      console.error('1. SMTP host and port are correct');
      console.error('2. Firewall allows outgoing connections on port', config.port);
      console.error('3. Network connectivity');
    }
  }
}

testSMTP();