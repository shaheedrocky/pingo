import nodeMailer from 'nodemailer';

export const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.APP_GMAIL,
        pass: process.env.APP_PASSWORD
    }
})