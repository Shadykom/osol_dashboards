import { supabaseBanking } from '@/lib/supabase';

class EmailService {
  constructor() {
    // Email configuration
    this.emailConfig = {
      apiEndpoint: import.meta.env.VITE_EMAIL_API_ENDPOINT || '/api/send-email',
      fromEmail: 'reports@osol-banking.com',
      fromName: 'OSOL Banking Reports'
    };
  }

  /**
   * Send report via email
   */
  async sendReport(reportData) {
    const {
      recipientEmail,
      recipientName,
      reportTitle,
      reportType,
      attachments,
      ccEmails = [],
      bccEmails = [],
      scheduleTime = null
    } = reportData;

    try {
      // Prepare email content
      const emailContent = this.generateEmailContent(reportTitle, reportType, recipientName);
      
      // Prepare attachments
      const formattedAttachments = await this.prepareAttachments(attachments);

      // Create email payload
      const emailPayload = {
        from: {
          email: this.emailConfig.fromEmail,
          name: this.emailConfig.fromName
        },
        to: [{
          email: recipientEmail,
          name: recipientName || recipientEmail
        }],
        cc: ccEmails.map(email => ({ email })),
        bcc: bccEmails.map(email => ({ email })),
        subject: `${reportTitle} - ${new Date().toLocaleDateString()}`,
        html: emailContent.html,
        text: emailContent.text,
        attachments: formattedAttachments,
        scheduledTime: scheduleTime
      };

      // Log email activity
      await this.logEmailActivity({
        recipient: recipientEmail,
        reportType,
        reportTitle,
        status: 'pending',
        scheduledTime: scheduleTime
      });

      // Send email (using mock implementation for now)
      const result = await this.sendEmailViaMockAPI(emailPayload);

      // Update log with result
      await this.updateEmailLog(result.id, {
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date().toISOString(),
        error: result.error
      });

      return {
        success: result.success,
        messageId: result.id,
        error: result.error
      };

    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate email content
   */
  generateEmailContent(reportTitle, reportType, recipientName) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .report-info {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .report-info h3 {
            margin-top: 0;
            color: #0066cc;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OSOL Banking System</h1>
          <p>Automated Report Delivery</p>
        </div>
        
        <div class="content">
          <h2>Dear ${recipientName || 'Valued Customer'},</h2>
          
          <p>Please find attached your requested report: <strong>${reportTitle}</strong></p>
          
          <div class="report-info">
            <h3>Report Details</h3>
            <p><strong>Report Type:</strong> ${this.formatReportType(reportType)}</p>
            <p><strong>Generated Date:</strong> ${currentDate}</p>
            <p><strong>Format:</strong> PDF and Excel</p>
          </div>
          
          <p>This report contains the latest data from our banking system. The attached files include:</p>
          <ul>
            <li>PDF version for easy viewing and printing</li>
            <li>Excel version for detailed analysis and data manipulation</li>
          </ul>
          
          <p>If you have any questions about this report or need additional information, please don't hesitate to contact our support team.</p>
          
          <a href="https://osol-banking.com/reports" class="button">View Reports Online</a>
        </div>
        
        <div class="footer">
          <p>This is an automated email from OSOL Banking System.</p>
          <p>© ${new Date().getFullYear()} OSOL Banking. All rights reserved.</p>
          <p>
            <a href="https://osol-banking.com/privacy">Privacy Policy</a> | 
            <a href="https://osol-banking.com/unsubscribe">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Dear ${recipientName || 'Valued Customer'},

Please find attached your requested report: ${reportTitle}

Report Details:
- Report Type: ${this.formatReportType(reportType)}
- Generated Date: ${currentDate}
- Format: PDF and Excel

This report contains the latest data from our banking system. The attached files include:
- PDF version for easy viewing and printing
- Excel version for detailed analysis and data manipulation

If you have any questions about this report or need additional information, please don't hesitate to contact our support team.

Best regards,
OSOL Banking System

This is an automated email from OSOL Banking System.
© ${new Date().getFullYear()} OSOL Banking. All rights reserved.
    `;

    return { html, text };
  }

  /**
   * Format report type for display
   */
  formatReportType(reportType) {
    const typeMap = {
      'income_statement': 'Income Statement',
      'balance_sheet': 'Balance Sheet',
      'cash_flow': 'Cash Flow Statement',
      'profit_loss': 'Profit & Loss Statement',
      'budget_variance': 'Budget Variance Analysis',
      'credit_risk': 'Credit Risk Assessment',
      'operational_risk': 'Operational Risk Report',
      'market_risk': 'Market Risk Analysis',
      'liquidity_risk': 'Liquidity Risk Report',
      'npl_analysis': 'NPL Analysis Report',
      'customer_acquisition': 'Customer Acquisition Report',
      'customer_segmentation': 'Customer Segmentation Analysis',
      'customer_satisfaction': 'Customer Satisfaction Report',
      'dormant_accounts': 'Dormant Accounts Report',
      'kyc_compliance': 'KYC Compliance Status'
    };

    return typeMap[reportType] || reportType;
  }

  /**
   * Prepare attachments for email
   */
  async prepareAttachments(attachments) {
    const formattedAttachments = [];

    for (const attachment of attachments) {
      const { filename, content, type } = attachment;
      
      // Convert blob to base64
      const base64Content = await this.blobToBase64(content);
      
      formattedAttachments.push({
        filename: filename,
        content: base64Content,
        type: type,
        disposition: 'attachment'
      });
    }

    return formattedAttachments;
  }

  /**
   * Convert blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Send email via configured service
   */
  async sendEmailViaMockAPI(payload) {
    const emailService = import.meta.env.VITE_EMAIL_SERVICE || 'mock';
    
    console.log(`Attempting to send email via ${emailService} service...`);
    
    try {
      switch (emailService) {
        case 'sendgrid':
          return await this.sendViaSendGrid(payload);
        case 'resend':
          return await this.sendViaResend(payload);
        case 'smtp':
          return await this.sendViaSMTP(payload);
        case 'vercel':
          return await this.sendViaVercelEmail(payload);
        case 'mock':
        default:
          return await this.sendViaMock(payload);
      }
    } catch (error) {
      console.error(`Error sending email via ${emailService}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mock implementation (current default)
   */
  async sendViaMock(payload) {
    console.log('⚠️ Using MOCK email service - emails will not be delivered!');
    console.log('Email details:', {
      to: payload.to,
      subject: payload.subject,
      attachments: payload.attachments.length
    });

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      id: `mock_${Date.now()}`,
      message: 'Email sent successfully (MOCK - not actually sent)'
    };
  }

  /**
   * SendGrid implementation
   */
  async sendViaSendGrid(payload) {
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set VITE_SENDGRID_API_KEY in your .env file');
    }

    const sgPayload = {
      personalizations: [{
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc
      }],
      from: payload.from,
      subject: payload.subject,
      content: [
        { type: 'text/plain', value: payload.text },
        { type: 'text/html', value: payload.html }
      ],
      attachments: payload.attachments.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type,
        disposition: att.disposition
      }))
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sgPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return {
      success: true,
      id: response.headers.get('x-message-id'),
      message: 'Email sent successfully via SendGrid'
    };
  }

  /**
   * Resend implementation
   */
  async sendViaResend(payload) {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('Resend API key not configured. Please set VITE_RESEND_API_KEY in your .env file');
    }

    const resendPayload = {
      from: `${payload.from.name} <${payload.from.email}>`,
      to: payload.to.map(t => t.email),
      cc: payload.cc?.map(c => c.email),
      bcc: payload.bcc?.map(b => b.email),
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      attachments: payload.attachments.map(att => ({
        filename: att.filename,
        content: att.content
      }))
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Resend error: ${result.message || 'Unknown error'}`);
    }

    return {
      success: true,
      id: result.id,
      message: 'Email sent successfully via Resend'
    };
  }

  /**
   * SMTP implementation (requires server-side endpoint)
   */
  async sendViaSMTP(payload) {
    // SMTP requires server-side implementation
    // This would call your backend API endpoint
    const endpoint = import.meta.env.VITE_EMAIL_API_ENDPOINT || '/api/send-email';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        service: 'smtp'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`SMTP error: ${result.error || 'Failed to send email'}`);
    }

    return {
      success: true,
      id: result.messageId,
      message: 'Email sent successfully via SMTP'
    };
  }

  /**
   * Vercel Email implementation
   */
  async sendViaVercelEmail(payload) {
    // Vercel Email API endpoint
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Vercel Email error: ${result.error || 'Failed to send email'}`);
    }

    return {
      success: true,
      id: result.id,
      message: 'Email sent successfully via Vercel Email'
    };
  }

  /**
   * Log email activity
   */
  async logEmailActivity(activity) {
    try {
      const { data, error } = await supabaseBanking
        .from('email_logs')
        .insert({
          recipient: activity.recipient,
          report_type: activity.reportType,
          report_title: activity.reportTitle,
          status: activity.status,
          scheduled_time: activity.scheduledTime,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging email activity:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in logEmailActivity:', error);
      // Don't throw - logging failure shouldn't prevent email sending
    }
  }

  /**
   * Update email log
   */
  async updateEmailLog(messageId, updates) {
    try {
      const { data, error } = await supabaseBanking
        .from('email_logs')
        .update(updates)
        .eq('message_id', messageId);

      if (error) {
        console.error('Error updating email log:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in updateEmailLog:', error);
      // Don't throw - logging failure shouldn't prevent operation
    }
  }

  /**
   * Schedule report email
   */
  async scheduleReportEmail(scheduleData) {
    const {
      reportType,
      reportTitle,
      recipients,
      frequency, // daily, weekly, monthly
      scheduleTime,
      dayOfWeek, // for weekly
      dayOfMonth, // for monthly
      enabled = true
    } = scheduleData;

    try {
      // Calculate next run time based on frequency
      const nextRun = this.calculateNextRunTime(frequency, scheduleTime, dayOfWeek, dayOfMonth);
      
      // Map frequency to database format
      const frequencyMap = {
        'daily': 'DAILY',
        'weekly': 'WEEKLY',
        'monthly': 'MONTHLY'
      };
      
      // Save schedule to database
      const { data, error } = await supabaseBanking
        .from('report_schedules')
        .insert({
          report_name: reportTitle,
          report_type: reportType,
          schedule_frequency: frequencyMap[frequency] || 'DAILY',
          schedule_time: scheduleTime,
          schedule_day: dayOfWeek,
          schedule_date: dayOfMonth,
          recipients: recipients,
          report_format: 'PDF',
          enabled: enabled,
          next_run_date: nextRun,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        scheduleId: data.schedule_id || data.id,
        message: 'Report schedule created successfully'
      };
    } catch (error) {
      console.error('Error scheduling report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate next run time for scheduled report
   */
  calculateNextRunTime(frequency, scheduleTime, dayOfWeek, dayOfMonth) {
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    let nextRun = new Date();
    
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        const targetDay = parseInt(dayOfWeek);
        const currentDay = now.getDay();
        let daysToAdd = targetDay - currentDay;
        
        if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
          daysToAdd += 7;
        }
        
        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;
        
      case 'monthly':
        const targetDate = parseInt(dayOfMonth);
        nextRun.setDate(targetDate);
        
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun.toISOString();
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports() {
    try {
      const { data, error } = await supabaseBanking
        .from('report_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data for UI
      const schedules = data.map(schedule => ({
        id: schedule.schedule_id || schedule.id,
        reportName: schedule.report_name,
        reportType: schedule.report_type,
        frequency: schedule.schedule_frequency ? schedule.schedule_frequency.toLowerCase() : 'daily',
        recipients: schedule.recipients || [],
        lastRun: schedule.last_run_date ? new Date(schedule.last_run_date).toLocaleString() : 'Never',
        nextRun: schedule.next_run_date ? new Date(schedule.next_run_date).toLocaleString() : 'Not scheduled',
        status: schedule.enabled ? 'active' : 'paused',
        enabled: schedule.enabled,
        scheduleTime: schedule.schedule_time,
        dayOfWeek: schedule.schedule_day,
        dayOfMonth: schedule.schedule_date
      }));

      return {
        success: true,
        schedules: schedules
      };
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return {
        success: false,
        error: error.message,
        schedules: []
      };
    }
  }

  /**
   * Cancel scheduled report
   */
  async cancelScheduledReport(scheduleId) {
    try {
      const { data, error } = await supabaseBanking
        .from('report_schedules')
        .update({ enabled: false })
        .or(`schedule_id.eq.${scheduleId},id.eq.${scheduleId}`);

      if (error) throw error;

      return {
        success: true,
        message: 'Schedule cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling scheduled report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(recipientEmail) {
    const testReportData = {
      recipientEmail,
      recipientName: 'Test User',
      reportTitle: 'Test Report - Email Service Verification',
      reportType: 'test_report',
      attachments: [{
        filename: 'test_report.pdf',
        content: new Blob(['Test PDF Content'], { type: 'application/pdf' }),
        type: 'application/pdf'
      }]
    };

    return await this.sendReport(testReportData);
  }
}

export default new EmailService();