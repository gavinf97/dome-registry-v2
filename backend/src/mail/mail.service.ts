import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.from = `"DOME Registry" <${config.get('SMTP_FROM', 'noreply@dome-registry.org')}>`;
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'localhost'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      // Log and continue — email failures should not break request flow
      this.logger.error(`Failed to send mail to ${to}: ${(err as Error).message}`);
    }
  }

  async sendSubmissionConfirmation(orcid: string, entryUuid: string): Promise<void> {
    // orcid is used as identifier; email delivery requires a lookup elsewhere if needed
    this.logger.debug(`Submission confirmation for entry ${entryUuid} (owner: ${orcid})`);
  }

  async sendStatusChanged(email: string, entryUuid: string, newStatus: string): Promise<void> {
    await this.send(
      email,
      `[DOME Registry] Your entry status changed to ${newStatus}`,
      `<p>Your method entry <strong>${entryUuid}</strong> has been updated to <strong>${newStatus}</strong>.</p>
       <p>Visit <a href="${process.env.FRONTEND_URL}/registry/${entryUuid}">DOME Registry</a> to view it.</p>`,
    );
  }

  async sendJournalOwnerAssigned(email: string, journalName: string): Promise<void> {
    await this.send(
      email,
      `[DOME Registry] You have been assigned as journal owner for ${journalName}`,
      `<p>You have been assigned as a journal owner for <strong>${journalName}</strong> in DOME Registry.</p>
       <p>You can now review entries submitted to this journal from your dashboard.</p>`,
    );
  }
}
