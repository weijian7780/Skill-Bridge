import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendInterviewInvitation(studentEmail, jobTitle, companyName, scheduleData) {
  const { scheduled_at, duration_minutes, location, meeting_link } = scheduleData;
  
  const msg = {
    to: studentEmail,
    from: 'notifications@skillbridge.test', // This would be a verified sender in production
    subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
    text: `
Hello!

You have been invited to an interview for the position of ${jobTitle} at ${companyName}.

Date & Time: ${new Date(scheduled_at).toLocaleString()}
Duration: ${duration_minutes} minutes
Location: ${location || "TBD"}
Meeting Link: ${meeting_link || "N/A"}

Please prepare accordingly. Best of luck!
- The SkillBridge Team
    `,
    html: `
      <h2>Interview Invitation</h2>
      <p>Hello!</p>
      <p>You have been invited to an interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
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

  if (!SENDGRID_API_KEY) {
    console.log("====================================");
    console.log("📧 MOCK EMAIL SENT (No SendGrid API Key provided):");
    console.log(msg.subject);
    console.log(msg.text);
    console.log("====================================");
    return;
  }

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${studentEmail}`);
  } catch (error) {
    console.error("Failed to send email via SendGrid:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}
