const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const helmet = require("helmet");

const app = express();
const PORT = 3000;

// Security middleware
app.use(helmet()); 
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
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
      message: "Too many requests, please try again later." 
    });
  }
  
  next();
}

// Parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email transporter setup with hardcoded credentials
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "chukwukerenoble98@gmail.com",
    pass: "spxuzulyfbfylqcc"
  }
});


app.get("/", (req, res) => {
  res.send("Hello World");
});

// Simple email endpoint
app.get("/test", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const mailOptions = {
    from: "chukwukerenoble98@gmail.com",
    to: "nobleosinachi98@gmail.com",
    subject: "Hello from Nodemailer",
    text: "Today\"s date is " + new Date()
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error sending email: " + error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(250).send("Email sent successfully");
    }
  });
});

// GET endpoint for /submit-form - redirects to your website
app.get("/submit-form", (req, res) => {
  res.redirect("https://nobleosinachi.github.io/video-editor");
});

// Form submission endpoint with rate limiting
app.post("/submit-form", simpleRateLimiter, async (req, res) => {
  try {
    const { name, email, project, message } = req.body;

    if (!name || !email || !project || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email address" 
      });
    }



    
    // --- Read and personalize email_template.html ---
    const notificationEmailPath = path.join(__dirname, "email_notification_template.html");
    let notificationEmail = fs.readFileSync(notificationEmailPath, "utf8");

    // Replace placeholders in template
    notificationEmail = notificationEmail
      .replace(/\$name/g, name)
      .replace(/\$email/g, email)
      .replace(/\$project/g, project)
      .replace(/\$message/g, message.replace(/\n/g, "<br>"));



    // --- Send email to Noble ---
    const mailOptions = {
      from: "chukwukerenoble98@gmail.com",
      to: "nobleosinachi98@gmail.com",
      subject: `New Contact Form Submission: ${project}`,
      html:notificationEmail,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);

    // --- Read and personalize email_template.html ---
    const templatePath = path.join(__dirname, "email_template.html");
    let template = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders in template
    template = template
      .replace(/\$name/g, name)
      .replace(/\$email/g, email)
      .replace(/\$project/g, project)
      .replace(/\$message/g, message.replace(/\n/g, "<br>"));

    // --- Send confirmation email to user ---
    const confirmationEmail = {
      from: "chukwukerenoble98@gmail.com",
      to: email,
      subject: "Thank you for your inquiry",
      html: template
    };

    await transporter.sendMail(confirmationEmail);

    return res.status(200).json({ 
      success: true, 
      message: "Form submitted successfully! We will contact you soon." 
    });

  } catch (error) {
    console.error("Form submission error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong. Please try again later." 
    });
  }
});






// Serve static files (if needed)
app.use(express.static("public"));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


