"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronRight, Send, ShoppingBag } from "lucide-react"
import { useQuote } from "@/context/quote-context"
import { useSiteData } from "@/context/site-data-context"
import { isEmailJsConfigured, sendEnquiryEmails } from "@/lib/emailjs"

export function ContactForm({ initialCategory = "", initialProduct = "" }: { initialCategory?: string; initialProduct?: string }) {
  const { categories, contactInfo } = useSiteData()
  const searchParams = useSearchParams()
  const isBasketQuote = searchParams.get("quote") === "basket"
  const { items, getFormattedQuoteText } = useQuote()

  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [category, setCategory] = useState(initialCategory)
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("") // honeypot: hidden from people, bots fill it
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback" | "error">("idle")

  useEffect(() => {
    if (isBasketQuote && items.length > 0) {
      setMessage(getFormattedQuoteText())
    } else if (initialProduct) {
      setMessage(`Please send me a quote for: ${initialProduct}\n\nQuantity needed: `)
    }
    // Only run this once, when the page first loads with these params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "sending") return

    // Honeypot filled in: pretend it worked, send nothing.
    if (website) {
      setStatus("sent")
      return
    }

    const subject = isBasketQuote && items.length > 0
      ? `Bulk Quote Request (${items.length} items)`
      : `Quote Request${category ? ` - ${category}` : ""}`

    // EmailJS public key not set yet: keep the old behaviour (open the visitor's email app).
    if (!isEmailJsConfigured) {
      const bodyLines = [
        `Name: ${name}`,
        company && `Company: ${company}`,
        email && `Email: ${email}`,
        phone && `Phone: ${phone}`,
        category && `Product range: ${category}`,
        "",
        message,
      ].filter(Boolean)

      const mailto = `mailto:${contactInfo.primaryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`
      window.location.href = mailto
      setStatus("fallback")
      return
    }

    setStatus("sending")
    try {
      await sendEnquiryEmails({ subject, name, email, phone, company, category, message })
      setStatus("sent")
      setName("")
      setCompany("")
      setEmail("")
      setPhone("")
      setCategory("")
      setMessage("")
    } catch (err) {
      console.error("Enquiry email failed", err)
      setStatus("error")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {isBasketQuote && items.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-light p-4 text-xs font-semibold text-foreground">
          <ShoppingBag className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-bold text-accent">Quote Cart</p>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} from your quote cart, details below
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Full Name *
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Company
          </label>
          <input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Company name"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="+971 ..."
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="category" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Product Range
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">Select a range (optional)</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          What do you need? *
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Product, grade, standard and quantity you need a quote for"
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="group relative inline-flex h-13 w-full items-center overflow-hidden rounded-lg btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-10"
      >
        <span className="mx-auto mr-8 flex items-center gap-2 transition-opacity duration-500 group-hover:opacity-0">
          <Send className="size-4 shrink-0" aria-hidden="true" />
          {status === "sending" ? "Sending…" : "Send Enquiry"}
        </span>
        <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      </button>

      {status === "sent" && (
        <p role="status" className="text-sm font-medium text-accent">
          Thank you, your enquiry has been sent. A confirmation is on its way to your inbox and our team will be in touch shortly.
        </p>
      )}

      {status === "fallback" && (
        <p className="text-sm font-medium text-accent">
          Opening your email app with this enquiry pre-filled. If it doesn&rsquo;t open, email us directly at{" "}
          <a href={`mailto:${contactInfo.primaryEmail}`} className="underline">
            {contactInfo.primaryEmail}
          </a>
          .
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          Sorry, we couldn&rsquo;t send your enquiry just now. Please email us at{" "}
          <a href={`mailto:${contactInfo.primaryEmail}`} className="underline">
            {contactInfo.primaryEmail}
          </a>{" "}
          or message us on{" "}
          <a href={contactInfo.primaryWhatsappHref} className="underline">
            WhatsApp
          </a>
          .
        </p>
      )}
    </form>
  )
}
