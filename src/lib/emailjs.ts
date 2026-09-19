// EmailJS helper for the Sabta Trading contact form.
//
// Sends two emails per enquiry through the EmailJS REST API (no extra npm package):
//   1. "Contact Us"  -> notification to Sabta (ali@sabtadxb.com), Reply-To = customer
//   2. "Auto-Reply"  -> confirmation to the customer
//
// Service / template IDs are public identifiers, so they default to this project's
// values. Only the Public Key has to be supplied via .env.local:
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...   (EmailJS dashboard > Account > General)

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send"

const config = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_ricnmyc",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
  contactTemplateId: process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID || "template_2x8i87g",
  autoReplyTemplateId: process.env.NEXT_PUBLIC_EMAILJS_AUTOREPLY_TEMPLATE_ID || "template_5jpyu1q",
}

/** False until NEXT_PUBLIC_EMAILJS_PUBLIC_KEY is set; the form then falls back to mailto. */
export const isEmailJsConfigured = Boolean(config.publicKey)

export type Enquiry = {
  subject: string
  name: string
  email: string
  phone: string
  company: string
  category: string
  message: string
}

async function sendTemplate(templateId: string, templateParams: Record<string, string>) {
  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: templateId,
      user_id: config.publicKey,
      template_params: templateParams,
    }),
  })
  if (!res.ok) {
    throw new Error(`EmailJS ${res.status}: ${await res.text()}`)
  }
}

const orDash = (value: string) => value.trim() || "—"

export async function sendEnquiryEmails(enquiry: Enquiry) {
  const sentAt = `${new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    dateStyle: "medium",
    timeStyle: "short",
  })} (Dubai time)`

  // 1. Notification to Sabta. If this fails the whole submission counts as failed.
  await sendTemplate(config.contactTemplateId, {
    subject: enquiry.subject,
    from_name: enquiry.name.trim(),
    from_email: enquiry.email.trim(),
    reply_to: enquiry.email.trim(),
    phone: orDash(enquiry.phone),
    company: orDash(enquiry.company),
    category: orDash(enquiry.category),
    message: enquiry.message.trim(),
    sent_at: sentAt,
  })

  // 2. Confirmation to the customer. Best effort: the enquiry itself already reached Sabta.
  try {
    await sendTemplate(config.autoReplyTemplateId, {
      from_name: enquiry.name.trim(),
      from_email: enquiry.email.trim(),
      subject: enquiry.subject,
      message: enquiry.message.trim(),
    })
  } catch (err) {
    console.warn("Auto-reply email failed", err)
  }
}
