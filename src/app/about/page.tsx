import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Boxes, CalendarDays, ChevronRight, Layers, Users } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AnimatedCounter } from "@/components/animated-counter"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltImage } from "@/components/ui/tilt-image"
import { CtaBanner } from "@/components/home/cta-banner"
import { Industries } from "@/components/home/industries"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig, getContactInfo, getCategories, getIndustries } from "@/lib/db"
import { buildMetadata } from "@/lib/seo"
import { graph, orgId, webPageNode } from "@/lib/structured-data"

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return buildMetadata(siteConfig, {
    title: `About ${siteConfig.shortName}: Dubai Fastener Distributor Since ${siteConfig.founded}`,
    description: `${siteConfig.name} was founded in Dubai in ${siteConfig.founded} by Saifuddin Ismail and stocks ${siteConfig.itemsInStock} fastener and marine rigging items.`,
    path: "/about",
    absoluteTitle: true,
  })
}

export default async function AboutPage() {
  const [siteConfig, contactInfo, categories, industries] = await Promise.all([
    getSiteConfig(),
    getContactInfo(),
    getCategories(),
    getIndustries(),
  ])

  const years = new Date().getFullYear() - siteConfig.founded

  const stats = [
    { icon: Boxes, value: 16000, suffix: "+", label: "Items In Stock" },
    { icon: CalendarDays, value: years, suffix: "+", label: "Years Trading" },
    { icon: Layers, value: categories.length, suffix: "", label: "Product Ranges" },
    { icon: Users, value: contactInfo.contacts.length + 1, suffix: "", label: "Direct Sales Contacts" },
  ]

  const aboutJsonLd = graph([
    webPageNode(siteConfig, {
      path: "/about",
      name: `About ${siteConfig.name}`,
      description: siteConfig.description,
      type: "AboutPage",
      image: "/team/saifuddin-ismail.jpg",
      speakable: ["h1", "[data-speakable]"],
      extra: { mainEntity: { "@id": orgId(siteConfig) } },
    }),
  ])

  const facts: { label: string; value: string }[] = [
    { label: "Company", value: `${siteConfig.name} (${siteConfig.nameAr})` },
    { label: "Founded", value: `${siteConfig.founded}, Dubai, United Arab Emirates` },
    { label: "Founder", value: "Saifuddin Ismail, Founder & Chairman" },
    { label: "What we do", value: "Distributor of fasteners and marine rigging hardware" },
    { label: "Stock", value: `${siteConfig.itemsInStock} items across ${categories.length} product ranges` },
    { label: "Materials & grades", value: "Zinc-plated and GI, 304 and 316 marine-grade stainless steel, 8.8 / 10.9 / 12.9 bolts, G70 and G80 lifting chain" },
    { label: "Industries served", value: industries.map((i) => i.name).join(", ") },
    { label: "Location", value: `${contactInfo.address}, ${contactInfo.city}` },
    { label: "Phone", value: contactInfo.phone },
  ]

  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12">
          <p className="eyebrow !text-accent">About Sabta Trading</p>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            A Fastener &amp; Marine Rigging Hardware Distributor Since {siteConfig.founded}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-20 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "About" }]} />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal className="group">
            <TiltImage>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-white shadow-sm flex items-center justify-center">
                <Image
                  src={siteConfig.companyProfileImage || "/brand/logo.png"}
                  alt={`${siteConfig.name} Company Profile`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8 sm:p-12 transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </TiltImage>
          </ScrollReveal>
          <div>
            <ScrollReveal delay={100}>
              <h2 className="text-balance text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">Company Profile</h2>
            </ScrollReveal>
            <div className="mt-6 flex max-w-prose flex-col gap-5 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              <ScrollReveal delay={230}>
                <p>
                  {siteConfig.name} has supplied fasteners and marine rigging hardware from Dubai since{" "}
                  {siteConfig.founded} &mdash; serving the Automotive, Manufacturing, Marine and Oilfield industries with
                  the same commitment to quality and service that built our name.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={360}>
                <p>
                  {siteConfig.itemsInStock} items in ready stock at competitive pricing, updated regularly to meet
                  demand, backed by a trusted supplier network for anything we don&rsquo;t hold on the shelf.
                </p>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={480}>
              <Link
                href="/contact"
                className="group relative mt-8 inline-flex h-13 items-center overflow-hidden rounded-lg btn-primary px-8 text-sm"
              >
                <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">Get In Touch</span>
                <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
            </ScrollReveal>
          </div>
        </div>

        <section aria-labelledby="at-a-glance" className="mt-20 md:mt-28">
          <h2 id="at-a-glance" className="text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
            {siteConfig.shortName} at a glance
          </h2>
          <dl data-speakable className="mt-6 grid overflow-hidden rounded-2xl border border-border md:grid-cols-2">
            {facts.map((f, i) => (
              <div key={f.label} className={`flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:gap-4 ${i % 2 === 0 ? "bg-secondary/40" : ""}`}>
                <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-foreground">{f.label}</dt>
                <dd className="text-sm text-muted-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-20 grid grid-cols-2 gap-5 md:mt-28 md:gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 90} className="h-full">
              <div className="card-premium flex h-full flex-col items-center justify-center gap-3 p-5 text-center sm:p-8 md:p-10">
                <stat.icon className="size-7 text-accent" aria-hidden="true" />
                <p className="text-2xl font-extrabold text-primary sm:text-3xl md:text-4xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={1800} />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-20 md:mt-28">
          <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
            <ScrollReveal className="group lg:col-span-2">
              <TiltImage className="mx-auto w-full max-w-sm">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border shadow-sm">
                  <Image
                    src="/team/saifuddin-ismail.jpg"
                    alt="Saifuddin Ismail, Founder and Chairman of Sabta Trading Co. LLC"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              </TiltImage>
            </ScrollReveal>
            <div className="lg:col-span-3">
              <ScrollReveal delay={150}>
                <p className="eyebrow !text-accent">Our Founder</p>
                <h2 className="mt-3 text-2xl font-extrabold uppercase tracking-tight text-foreground md:text-3xl">
                  Saifuddin Ismail
                </h2>
                <p className="mt-1 text-sm font-semibold text-accent">
                  Founder &amp; Chairman | Sabta Trading Co. LLC
                </p>
              </ScrollReveal>
              <div className="mt-6 flex max-w-prose flex-col gap-5 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
                <ScrollReveal delay={280}>
                  <p>
                    Established in Dubai in {siteConfig.founded}, {siteConfig.name} was founded by Mr. Saifuddin
                    Ismail, an accomplished entrepreneur with over 38 years of experience in trading, procurement,
                    distribution, and business development.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={410}>
                  <p>
                    Through decades of leadership, he has built the company on a foundation of integrity,
                    reliability, quality service, and long-term relationships. His strategic direction and
                    extensive industry experience have helped develop {siteConfig.shortName} into a respected
                    supplier of industrial fasteners, marine hardware, stainless steel products, lifting
                    accessories, and industrial supplies.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={540}>
                  <p>
                    From building strong international supplier networks to developing lasting customer
                    relationships, Mr. Ismail&rsquo;s leadership has been central to the company&rsquo;s growth and
                    stability.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={670}>
                  <p>
                    Today, his principles remain deeply embedded in the way {siteConfig.shortName} conducts
                    business &mdash; earning trust, delivering value, and building relationships that last.
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 md:mt-28">
          <div className="card-premium grid gap-8 p-8 sm:p-10 md:grid-cols-2 md:p-12">
            <div>
              <p className="eyebrow">Leadership</p>
              <h2 className="mt-3 text-2xl font-extrabold uppercase tracking-tight text-foreground">{contactInfo.managingDirector.name}</h2>
              <p className="mt-1 text-sm font-semibold text-accent">{contactInfo.managingDirector.role}</p>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Sabta Trading&rsquo;s sales team is reachable directly, no call centre, no waiting.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.contacts.map((c) => (
                <div key={c.name} className="rounded-xl border border-border bg-secondary p-5">
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <a href={c.phoneHref} className="mt-2 block text-sm text-muted-foreground hover:text-accent">
                    {c.phone}
                  </a>
                  <a href={`mailto:${c.email}`} className="mt-1 block text-sm text-muted-foreground hover:text-accent">
                    {c.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Industries />
      <CtaBanner />
    </>
  )
}
