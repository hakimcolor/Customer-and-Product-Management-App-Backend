import nodemailer from 'nodemailer';
import config from '../config/config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"${config.companyName}" <${config.smtp.user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    return false;
  }
};
