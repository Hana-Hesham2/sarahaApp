import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your.email@gmail.com",
    pass: "the_app_password_from_google",
  },
});


export const sendOTPEmail = async ({ to, otp }) => {
  console.log(`OTP for ${to} is: ${otp}`); 
};

//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent:", info.response);
//   } catch (err) {
//     console.error("Error sending email:", err);
//     throw err;
//   }
// };