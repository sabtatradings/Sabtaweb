import type { Metadata } from "next"
import { ChevronRight, ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContactForm } from "@/components/contact-form"
import { ScrollReveal } from "@/components/scroll-reveal"
import { getSiteConfig, getContactInfo } from "@/lib/db"

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return {
    title: "Contact Us",
    description: `Contact ${siteConfig.name} in Dubai, UAE: call, WhatsApp or email our sales team for a fastener or marine rigging hardware quote.`,
    alternates: { canonical: "/contact" },
  }
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; product?: string }>
}) {
  const { category = "", product = "" } = await searchParams
  const [siteConfig, contactInfo] = await Promise.all([
    getSiteConfig(),
    getContactInfo(),
  ])

  return (
    <>
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12">
          <p className="eyebrow !text-accent">Get In Touch</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Contact Sabta Trading
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-primary-foreground/70 md:text-base">
            Speak directly to our sales team by phone, WhatsApp or email, or send an enquiry below.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-20 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "Contact" }]} />

        <div className="mt-12 grid gap-12 lg:grid-cols-5 lg:gap-16">
          <ScrollReveal className="lg:col-span-3">
            <div>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">Send an Enquiry</h2>
              <p className="mb-8 mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Fill in the details below and our sales team will get back to you shortly. You will also receive a
                confirmation by email.
              </p>
              <ContactForm initialCategory={category} initialProduct={product} />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150} className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-secondary p-8">
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">Contact Details</h2>
              <ul className="mt-6 flex flex-col gap-6">
                <li className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <Phone className="size-4 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Office</p>
                    <a href={contactInfo.phoneHref} className="block text-sm font-semibold text-foreground hover:text-accent">
                      {contactInfo.phone}
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">Fax: {contactInfo.fax}</p>
                  </div>
                </li>
                {contactInfo.contacts.map((c) => (
                  <li key={c.name} className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <Phone className="size-4 text-accent" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.name}</p>
                      <a href={c.phoneHref} className="block text-sm font-semibold text-foreground hover:text-accent">
                        {c.phone}
                      </a>
                      <a href={`mailto:${c.email}`} className="block text-sm text-muted-foreground hover:text-accent">
                        {c.email}
                      </a>
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <Mail className="size-4 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                    <a href={`mailto:${contactInfo.primaryEmail}`} className="block text-sm font-semibold text-foreground hover:text-accent">
                      {contactInfo.primaryEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <MapPin className="size-4 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</p>
                    <a
                      href={contactInfo.mapsPlaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      <span>
                        {contactInfo.address}, {contactInfo.city}
                      </span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">{contactInfo.poBox}</p>
                  </div>
                </li>
              </ul>
              <a
                href={contactInfo.primaryWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mt-8 inline-flex h-12 w-full items-center overflow-hidden rounded-xl bg-[#25D366] text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#25D366]/20"
              >
                <span className="mx-auto mr-8 flex items-center gap-2 transition-opacity duration-500 group-hover:opacity-0">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </span>
                <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </a>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="size-4 text-accent" aria-hidden="true" />
                Find Us on the Map
              </div>
              <a
                href={contactInfo.mapsPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center overflow-hidden rounded-lg btn-primary py-2 pl-4 pr-2 text-xs font-bold shadow-sm"
              >
                <span className="mr-6 transition-opacity duration-500 group-hover:opacity-0">Open in Maps</span>
                <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </span>
              </a>
            </div>
            <iframe
              title="Sabta Trading Co. LLC location"
              src={contactInfo.mapsEmbedSrc}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[250px] w-full border-0 sm:h-[350px] md:h-[450px]"
            />
            <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
              {siteConfig.name}, {contactInfo.address}, {contactInfo.city}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </>
  )
}

