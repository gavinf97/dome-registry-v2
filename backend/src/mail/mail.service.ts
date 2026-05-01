import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(MailService.name);
  private readonly templates = new Map<string, handlebars.TemplateDelegate>();

  constructor(private readonly config: ConfigService) {
    this.from = `"DOME Registry" <${config.get('SMTP_FROM', 'noreply@dome-registry.org')}>`;
    this.frontendUrl = config.get('FRONTEND_URL', 'https://dome-registry.org');
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

  private getTemplate(name: string): handlebars.TemplateDelegate {
    if (!this.templates.has(name)) {
      const tplPath = path.join(__dirname, 'templates', `${name}.hbs`);
      const src = fs.readFileSync(tplPath, 'utf-8');
      this.templates.set(name, handlebars.compile(src));
    }
    return this.templates.get(name)!;
  }

  private async send(to: string, subject: string, templateName: string, context: Record<string, unknown>): Promise<void> {
    try {
      const tpl = this.getTemplate(templateName);
      const html = tpl({ ...context, frontendUrl: this.frontendUrl });
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send '${templateName}' mail to ${to}: ${(err as Error).message}`);
    }
  }

  async sendSubmissionConfirmation(email: string, entryUuid: string, entryTitle?: string): Promise<void> {
    if (!email) return;
    await this.send(email, '[DOME Registry] Submission received', 'submission-confirmation', {
      entryUuid,
      entryTitle: entryTitle || entryUuid,
      entryUrl: `${this.frontendUrl}/registry/${entryUuid}`,
    });
  }

  async sendStatusChanged(email: string, entryUuid: string, newStatus: string, entryTitle?: string): Promise<void> {
    if (!email) return;
    await this.send(email, `[DOME Registry] Entry status: ${newStatus}`, 'status-changed', {
      entryUuid,
      entryTitle: entryTitle || entryUuid,
      newStatus,
      entryUrl: `${this.frontendUrl}/registry/${entryUuid}`,
    });
  }

  async sendJournalOwnerAssigned(email: string, journalName: string): Promise<void> {
    if (!email) return;
    await this.send(email, `[DOME Registry] Journal owner assignment: ${journalName}`, 'journal-owner-assigned', {
      journalName,
      dashboardUrl: `${this.frontendUrl}/admin`,
    });
  }

  async sendAdminNotification(
    recipients: string[],
    submitterName: string,
    entryUuid: string,
    entryTitle: string,
    journalId?: string,
  ): Promise<void> {
    const context = {
      submitterName,
      entryTitle: entryTitle || entryUuid,
      entryUrl: `${this.frontendUrl}/registry/${entryUuid}`,
      adminUrl: `${this.frontendUrl}/admin`,
      journalId: journalId || null,
    };
    await Promise.all(
      recipients
        .filter(r => !!r)
        .map(r =>
          this.send(r, `[DOME Registry] New submission: ${entryTitle || entryUuid}`, 'admin-notification', context),
        ),
    );
  }

  async sendNotificationToSubmitter(
    email: string,
    entryUuid: string,
    entryTitle: string,
    message: string,
  ): Promise<void> {
    if (!email) return;
    await this.send(email, '[DOME Registry] Message from the registry team', 'notification-to-submitter', {
      entryTitle: entryTitle || entryUuid,
      entryUrl: `${this.frontendUrl}/registry/${entryUuid}`,
      message,
    });
  }
}

