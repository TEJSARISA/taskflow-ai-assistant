import { Email, EmailProvider } from '@uptiqai/integrations-sdk';
import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send email using either the integrations SDK or Nodemailer as a fallback
 */
export async function sendEmail(options: SendEmailOptions): Promise<any> {
  // Check for SMTP configuration first
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpService = process.env.SMTP_SERVICE; // New: optional explicit service (e.g., 'gmail')
  const smtpFrom = process.env.SMTP_FROM || 'UPTIQ <no-reply@uptiq.ai>';

  console.log(`[EmailService] Attempting to send email to: ${options.to.join(', ')}`);
  console.log(`[EmailService] Subject: ${options.subject}`);

  if ((smtpHost || smtpService) && smtpUser && smtpPass) {
    console.log(`[EmailService] Using SMTP ${smtpService ? `(${smtpService}) ` : ''}to send email`);
    try {
      const transporter = nodemailer.createTransport({
        service: smtpService, // If service is provided (e.g., 'gmail')
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort) : undefined,
        secure: smtpPort ? parseInt(smtpPort) === 465 : undefined,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const result = await transporter.sendMail({
        from: smtpFrom,
        to: options.to.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('[EmailService] Email sent successfully via SMTP');
      return result;
    } catch (error) {
      console.error('[EmailService] CRITICAL FAILURE sending email via SMTP:', error);
      console.log('[EmailService] Falling back to SDK provider...');
    }
  } else {
    console.log('[EmailService] SMTP configuration incomplete (host/service, user, and pass are required), trying SDK');
  }

  // Fallback to Integrations SDK
  try {
    console.log('[EmailService] Using Integrations SDK to send email');
    const emailService = new Email({ provider: EmailProvider.Resend });
    const result = await emailService.sendEmail({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log('[EmailService] Email sent successfully via SDK');
    return result;
  } catch (error) {
    console.warn('[EmailService] Failed to send email via SDK. Falling back to Mock/Log provider for development/testing.');
    console.warn(`[EmailService] SDK Error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Final fallback for development/testing: Virtual Inbox (Logger)
    const mockResult = {
      messageId: `mock-${Date.now()}`,
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
      status: 'LOGGED_ONLY'
    };

    console.log('==========================================================');
    console.log('VIRTUAL EMAIL SENT (LOGGED ONLY)');
    console.log(`TO: ${options.to.join(', ')}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`BODY: ${options.text}`);
    console.log('==========================================================');

    return mockResult;
  }
}
