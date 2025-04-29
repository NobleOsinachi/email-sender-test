// server-compatible.js - Works with older Node.js versions
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(require('helmet')()); // Set security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*', // In production, set this to your specific domain
  methods: ['POST']
}));

// Simple rate limiting implementation for older Node versions
const ipRequestCounts = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

function simpleRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Initialize or cleanup old data
  if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].timestamp > WINDOW_MS) {
    ipRequestCounts[ip] = {
      count: 0,
      timestamp: now
    };
  }
  
  // Increment request count
  ipRequestCounts[ip].count += 1;
  
  // Check if over limit
  if (ipRequestCounts[ip].count > MAX_REQUESTS) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many form submissions, please try again later.' 
    });
  }
  
  next();
}

app.use('/submit-form', simpleRateLimiter);

// Parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'chukwukerenoble98@gmail.com',
    pass: process.env.EMAIL_PASS || 'spxuzulyfbfylqcc' // Use app password for Gmail
  }
});


// GET endpoint for /submit-form - redirects to your website
app.get('/submit-form', (req, res) => {
    res.redirect('https://nobleosinachi.github.io/video-editor');
  });

  
// Form submission endpoint
app.post('/submit-form', async (req, res) => {
  try {
    // Validate required fields
    const { name, email, project, message } = req.body;
    
    if (!name || !email || !project || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'chukwukerenoble98@gmail.com',
      to: process.env.RECIPIENT_EMAIL || 'chukwukerenoble98@gmail.com',
      subject: `New Contact Form Submission: ${project}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Project Type:</strong> ${project}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      // Auto-reply to sender
      replyTo: email
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Send confirmation email to the user
    const confirmationEmail = {
      from: process.env.EMAIL_USER || 'chukwukerenoble98@gmail.com',
      to: email,
      subject: 'Thank you for your inquiry',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hello ${name},</p>
        <p>We've received your inquiry about ${project} and will get back to you as soon as possible.</p>
        <p>Here's a copy of your message:</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>Your Name</p>
      `
    };
    
    await transporter.sendMail(confirmationEmail);
    
    // Success response
    return res.status(200).json({ 
      success: true, 
      message: 'Form submitted successfully! We will contact you soon.' 
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    
    // Error response
    return res.status(500).json({ 
      success: false, 
      message: 'Something went wrong. Please try again later.' 
    });
  }
});

// Serve static files (if needed)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});