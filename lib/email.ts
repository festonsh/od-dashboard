import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const defaultFrom = process.env.RESEND_FROM || 'onboarding@resend.dev'

function getResend() {
  if (!resendApiKey) return null
  return new Resend(resendApiKey)
}

/**
 * Send an email via Resend. No-op if RESEND_API_KEY is not set (no error).
 */
export async function sendEmail(options: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from: defaultFrom,
      to: options.to,
      subject: options.subject,
      html: options.html ?? options.text.replace(/\n/g, '<br>')
    })
  } catch {
    // Don't fail the request if email fails
  }
}

export async function sendAssignmentNotification(options: {
  to: string
  employeeName: string
  projectName: string
  date: string
  startTime?: string | null
  endTime?: string | null
  workType?: string | null
  meetingPoint?: string | null
  notes?: string | null
}): Promise<void> {
  const { to, employeeName, projectName, date, startTime, endTime, workType, meetingPoint, notes } = options
  const timeStr = [startTime, endTime].filter(Boolean).length ? ` ${startTime ?? ''} – ${endTime ?? ''}`.trim() : ''
  const lines = [
    `Hi ${employeeName},`,
    '',
    `You have been assigned to **${projectName}** on ${date}.${timeStr ? ` Time: ${timeStr}` : ''}`,
    ...(workType ? [`Work type: ${workType}`] : []),
    ...(meetingPoint ? [`Meeting point: ${meetingPoint}`] : []),
    ...(notes ? [`Notes: ${notes}`] : []),
    '',
    'View your schedule: My schedule in A & M Electric Scheduler.'
  ]
  const text = lines.join('\n')
  await sendEmail({
    to,
    subject: `Assignment: ${projectName} on ${date}`,
    text,
    html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  })
}

export async function sendBulkAssignmentNotification(options: {
  to: string
  employeeName: string
  projectName: string
  startDate: string
  endDate: string
  startTime?: string | null
  endTime?: string | null
  workType?: string | null
  meetingPoint?: string | null
  notes?: string | null
}): Promise<void> {
  const { to, employeeName, projectName, startDate, endDate, startTime, endTime, workType, meetingPoint, notes } = options
  const timeStr = [startTime, endTime].filter(Boolean).length ? ` ${startTime ?? ''} – ${endTime ?? ''}`.trim() : ''
  const lines = [
    `Hi ${employeeName},`,
    '',
    `You have been assigned to **${projectName}** from ${startDate} to ${endDate}.${timeStr ? ` Time: ${timeStr}` : ''}`,
    ...(workType ? [`Work type: ${workType}`] : []),
    ...(meetingPoint ? [`Meeting point: ${meetingPoint}`] : []),
    ...(notes ? [`Notes: ${notes}`] : []),
    '',
    'View your schedule: My schedule in A & M Electric Scheduler.'
  ]
  const text = lines.join('\n')
  await sendEmail({
    to,
    subject: `Assignments: ${projectName} (${startDate} – ${endDate})`,
    text,
    html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  })
}
