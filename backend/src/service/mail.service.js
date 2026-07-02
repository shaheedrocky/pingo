import { transporter } from "../config/mail.js";

export const sendOTPToEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.APP_GMAIL,
    to: email,
    subject: "Pingo Verification Code",
    html: `
        <h2>Pingo</h2>

        <p>Your verification code is</p>

        <h1>${otp}</h1>

        <p>This code expires in 5 minutes.</p>
      `,
  });
};
