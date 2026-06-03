import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// Must be a SendGrid-verified sender (Single Sender Verification works without a domain).
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notifications@skillbridge.test';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Shared sender: sends via SendGrid when configured, otherwise logs a mock email.
async function deliverEmail(msg) {
  const message = { ...msg, from: FROM_EMAIL };
  if (!SENDGRID_API_KEY) {
    console.log("====================================");
    console.log("📧 MOCK EMAIL SENT (No SendGrid API Key provided):");
    console.log(`To: ${message.to}`);
    console.log(message.subject);
    console.log(message.text);
    console.log("====================================");
    return;
  }
  try {
    await sgMail.send(message);
    console.log(`Email sent successfully to ${message.to}`);
  } catch (error) {
    console.error("Failed to send email via SendGrid:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}

export async function sendApplicationRejectedEmail(studentEmail, jobTitle, companyName) {
  await deliverEmail({
    to: studentEmail,
    subject: `Update on your application: ${jobTitle} at ${companyName}`,
    text: `Hello,

Thank you for applying for the position of ${jobTitle} at ${companyName} through SkillBridge.

After careful consideration, the employer has decided not to move forward with your application at this time. We know this is disappointing, but please don't be discouraged — keep building your skills and applying.

We wish you all the best in your career journey.
- The SkillBridge Team`,
    html: `
      <h2>Application Update</h2>
      <p>Hello,</p>
      <p>Thank you for applying for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> through SkillBridge.</p>
      <p>After careful consideration, the employer has decided not to move forward with your application at this time. We know this is disappointing, but please don't be discouraged — keep building your skills and applying.</p>
      <p>We wish you all the best in your career journey.</p>
      <p>- The SkillBridge Team</p>
    `,
  });
}

export async function sendInterviewInvitation(studentEmail, jobTitle, companyName, scheduleData, { rescheduled = false } = {}) {
  const { scheduled_at, duration_minutes, location, meeting_link } = scheduleData;
  const heading = rescheduled ? "Interview Rescheduled" : "Interview Invitation";
  const intro = rescheduled
    ? `Your interview for the position of ${jobTitle} at ${companyName} has been rescheduled. Please note the updated details below.`
    : `You have been invited to an interview for the position of ${jobTitle} at ${companyName}.`;

  const msg = {
    to: studentEmail,
    subject: `${heading}: ${jobTitle} at ${companyName}`,
    text: `
Hello!

${intro}

Date & Time: ${new Date(scheduled_at).toLocaleString()}
Duration: ${duration_minutes} minutes
Location: ${location || "TBD"}
Meeting Link: ${meeting_link || "N/A"}

Please prepare accordingly. Best of luck!
- The SkillBridge Team
    `,
    html: `
      <h2>${heading}</h2>
      <p>Hello!</p>
      <p>${intro}</p>
      <ul>
        <li><strong>Date & Time:</strong> ${new Date(scheduled_at).toLocaleString()}</li>
        <li><strong>Duration:</strong> ${duration_minutes} minutes</li>
        <li><strong>Location:</strong> ${location || "TBD"}</li>
        <li><strong>Meeting Link:</strong> ${meeting_link ? `<a href="${meeting_link}">${meeting_link}</a>` : "N/A"}</li>
      </ul>
      <p>Please prepare accordingly. Best of luck!</p>
      <p>- The SkillBridge Team</p>
    `,
  };

  await deliverEmail(msg);
}
