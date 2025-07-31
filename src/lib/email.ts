import resend from './resend';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailArgs) => {
  try {
    const data = await resend.emails.send({
      from: `Name ${ process.env.RESEND_FROM_EMAIL  || '<onboarding@resend.dev>'}`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};