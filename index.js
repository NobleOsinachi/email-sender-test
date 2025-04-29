const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');

const app = express();
const PORT = 3000;

// Security middleware
app.use(helmet()); 
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Simple rate limiting implementation
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
      message: 'Too many requests, please try again later.' 
    });
  }
  
  next();
}

// Parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email transporter setup with hardcoded credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'chukwukerenoble98@gmail.com',
    pass: 'spxuzulyfbfylqcc'
  }
});

// Simple email endpoint
app.get('/send-email', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mailOptions = {
    from: 'chukwukerenoble98@gmail.com',
    to: 'nobleosinachi98@gmail.com',
    subject: 'Hello from Nodemailer',
    text: 'Today\'s date is ' + new Date()
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log('Error sending email: ' + error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(250).send('Email sent successfully');
    }
  });
});

// GET endpoint for /submit-form - redirects to your website
app.get('/submit-form', (req, res) => {
  res.redirect('https://nobleosinachi.github.io/video-editor');
});

// Form submission endpoint with rate limiting
app.post('/submit-form', simpleRateLimiter, async (req, res) => {
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
      from: 'chukwukerenoble98@gmail.com',
      to: 'nobleosinachi98@gmail.com',
      subject: `New Contact Form Submission: ${project}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Project Type:</strong> ${project}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Send confirmation email to the user
    const confirmationEmail = {
      from: 'chukwukerenoble98@gmail.com',
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
  console.log(`Server is running on port ${PORT}`);
});
