import axios from 'axios';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import schedule from 'node-schedule';
import fs from 'fs';
import 'dotenv/config';

import { Commit } from './dto/commit.dto';
import { CommitDiff } from './dto/commit-diff.dto';
import { NotificationItem } from './dto/notification.dto';

// URL and file path of the repository being monitored
const gitlabUrl = process.env.GITLAB_URL;
const filePath = process.env.FILE_PATH;
const repository = process.env.REPOSITORY || '';
const privateToken = process.env.PRIVATE_TOKEN;

// Webhook URL of the enterprise WeChat robot
const webhookUrl = 'YOUR_WEBHOOK_URL';

// Send enterprise WeChat message
async function sendNotification(message: string): Promise<void> {
  try {
    const response = await axios.post(webhookUrl, {
      msgtype: 'text',
      text: {
        content: message,
      },
    });

    if (response.status === 200 && response.data.errcode === 0) {
      console.log('Notification sent successfully!');
    } else {
      console.error('Failed to send notification:', response.data);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.PORT),
  secure: Boolean(process.env.SECURE),
  auth: {
    user: process.env.AUTH_USER,
    pass: process.env.AUTH_PASS,
  },
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Send email notification
async function sendEmailNotification(subject: string,
  message: string,
): Promise<void> {
  const mailOptions = {
    from: process.env.AUTH_USER,
    to: process.env.RECIPIENTS,
    subject: subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email notification sent successfully!');
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

// Check file changes and send notifications
async function checkFileChanges(): Promise<void> {
  try {
    const since = await readSinceTime();
    const response = await axios.get(
      `${gitlabUrl}/api/v4/projects/${encodeURIComponent(
        repository,
      )}/repository/commits`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
        params: {
          path: filePath,
          all: true,
          since,
          page: 1,
          per_page: 100,
          // ref_name: 'xxxxx',
        },
      },
    );
    // If the file has changed, send a notification
    if (response.status !== 200) {
      console.log('Failed to check file changes');
    }

    const notifications: NotificationItem[] = [];

    const commits = response.data as Commit[];
    for (const commit of commits) {
      const commitDiffs = await getCommitDiff(commit.id);
      const content = await getDiffContent(commitDiffs);
      if (content) {
        console.log(content);
        notifications.push({
          author_name: commit.author_name,
          title: commit.title,
          committed_date: commit.committed_date,
          diff_content: content,
        });
      }
    }
    if (notifications.length) {
      const html = await formatNotificationToHtml(notifications);
      console.log('=========== HTML ===============');
      console.log(html);
      await sendEmailNotification('GIT File Change Notification', html);
    } else {
      console.log(new Date().toISOString(), 'No file changes');
    }

    await writeNowToSinceTime();
  } catch (error) {
    console.error('Failed to check file changes:', error);
  }
}

async function getCommitDiff(sha: string): Promise<CommitDiff[]> {
  const response = await axios.get(
    `${gitlabUrl}/api/v4/projects/${encodeURIComponent(
      repository,
    )}/repository/commits/${sha}/diff`,
    {
      headers: {
        'PRIVATE-TOKEN': privateToken,
      },
    },
  );

  if (response.status === 200) {
    const commitsDiff = response.data as CommitDiff[];
    return commitsDiff;
  }
  throw new Error('Failed to get commit diff.');
}

async function getDiffContent(commitDiffs: CommitDiff[]): Promise<string> {
  let content = '';
  for (const commitDiff of commitDiffs) {
    if (commitDiff.new_path === filePath) {
      content = commitDiff.diff;
      break;
    }
  }
  return content;
}

async function formatNotificationToHtml(
  notificationItems: NotificationItem[],
): Promise<string> {
  const htmlTemplate = `
    <html>
      <body>
        <h2>File Change Notification</h2>
        <% for (let i = 0; i < notificationItems.length; i++) { %>
          <p>
            <strong>Author:</strong> <%= notificationItems[i].author_name %><br>
            <strong>Title:</strong> <%= notificationItems[i].title %><br>
            <strong>Committed Date:</strong> <%= notificationItems[i].committed_date %><br>
          </p>
          <pre><code><%= notificationItems[i].diff_content %></code></pre>
          <% if (i !== notificationItems.length - 1) { %>
            <hr>
          <% } %>
        <% } %>
      </body>
    </html>
  `;
  const html = await ejs.render(htmlTemplate, { notificationItems });
  return html;
}

async function readSinceTime(): Promise<string> {
  const sinceTimeFilePath = 'since_time.data';
  try {
    const sinceTime = await fs.readFileSync(sinceTimeFilePath, 'utf-8');
    return sinceTime;
  } catch (error) {
    const sinceTime = process.env.SINCE || new Date().toISOString();
    await fs.writeFileSync(sinceTimeFilePath, sinceTime);
    return sinceTime;
  }
}

async function writeNowToSinceTime() {
  const sinceTimeFilePath = 'since_time.data';
  const sinceTime = new Date().toISOString();
  await fs.writeFileSync(sinceTimeFilePath, sinceTime);
}

// Main function
async function main(): Promise<void> {
  const job = schedule.scheduleJob('*/5 * * * *', async () => {
    checkFileChanges();
  });

  job.invoke();
}

// Start the program
main();
