const express = require('express');
const app = express();
// require("./openBrowser.js");


app.get('/send-email', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // res.send("send-mail");

    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
        {
            console.log('Error sending email: ' + error);
            res.status(500).send('Error sending email');
        } else
        {
            console.log('Email sent: ' + info.response);
            res.status(250).send('Email sent successfully');
        }
    });




});

// Other code...

app.listen(3000, function () {
    console.log('Server is running on port 3000');
});






const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'chukwukerenoble98@gmail.com',
        pass: 'wlofafnargtufsft'
    }
});
const mailOptions = {
    from: 'chukwukerenoble98@gmail.com',
    to: 'catherinecatherineben@gmail.com',
    subject: 'Hello from Nodemailer',
    text: 'Today\'s date is ' + new Date()
};

