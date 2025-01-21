require('dotenv').config();

const express = require('express')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

const app = express()
const PORT = 3000

//Middleware
app.use(bodyParser.json())

// In memory storage for OTP
const otpStore = {}

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 587, // Use 465 for SSL or 587 for TLS
    // secure: false, // Set to true for SSL (port 465)
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS_CODE,
    },
    // tls: {
    //     rejectUnauthorized: false, // Allow self-signed certificates (use for testing only)
    // },
    connectionTimeout: 10000,
    // debug: true, // Enable debug messages
    // logger: true, // Log information to console
})

// To verify transporter
// transporter.verify((error, success) => {
//     if (error) {
//         console.error('Error verifying transporter:', error);
//     } else {
//         console.log('Transporter verified successfully:', success);
//     }
// });


// Send OTP
function generateOTP() {
    return crypto.randomInt(100000,999999).toString();
}

// Send OTP
app.post('/send-otp', async(req,res)=>{
    const { email } = req.body;
    if(!email) {
        res.status(400).send({message:'Email is required'})
    }
    const otp = generateOTP();
    otpStore[email] = {otp, expiresAt: Date.now() + 5 * 60 * 1000 }

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Test OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes`
    }
    try{
        await transporter.sendMail(mailOptions);
        res.status(200).send({message: 'OTP SEND Successfully'})
    }
    catch(error){
        res.status(500).send({message: 'Failed to send OTP', Error: error})
    }
})

// Validate OTP
app.post('/validate-otp', async(req,res)=>{
    const { email, otp } = req.body

    if(!email || !otp) {
        return res.status(400).send({message:" Email and OTP is required!!"})
    }

    const record = otpStore[email]

    if(!record){
        res.status(400).send({message : "Invalid Email or OTP !"})
    }
    if(record.expiresAt<Date.now()){
        delete otpStore[email]
        return res.status(400).send({message:"Expired OTP!"})
    }
    if(record.otp !== otp){
        return res.status(400).send({message:"Incorrect OTP!"})
    }

    delete otpStore[email]
    return res.status(200).send({message: "OTP Verification Successful!"})
})

app.listen(PORT, ()=>{
    console.log("Server is running on port : ", PORT)
})
