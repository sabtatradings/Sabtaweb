import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, FileText } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CategoryIcon } from "@/components/category-icon"
import { ProductCard } from "@/components/product-card"
import { ProductDetailActions } from "@/components/product-detail-actions"
import { ScrollReveal } from "@/components/scroll-reveal"
import { CtaBanner } from "@/components/home/cta-banner"
import { catalogPdfPath } from "@/lib/site-data"
import { getCategoryWithItems, getProduct, getProducts, getSiteConfig } from "@/lib/db"

export const revalidate = 30

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ category: p.categorySlug, slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category: categorySlug, slug } = await params
  const [product, siteConfig] = await Promise.all([
    getProduct(categorySlug, slug),
    getSiteConfig(),
  ])
  if (!product) return {}
  return {
    title: product.name,
    description: `${product.description} Stocked by ${siteConfig.name}, Dubai UAE.`,
    alternates: { canonical: `/products/${categorySlug}/${product.slug}` },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: categorySlug, slug } = await params
  const [category, siteConfig] = await Promise.all([getCategoryWithItems(categorySlug), getSiteConfig()])
  if (!category) notFound()

  const product = category.items.find((p) => p.slug === slug)
  if (!product) notFound()

  const usageData = getProductUsageData(categorySlug, product.name)

  const gallery = product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : []

  // No `offers`/price block: Sabta is a request-a-quote distributor with no
  // listed prices, and Google's Product rich-result guidelines require a
  // real price on any `offers` entry — inventing one would be inaccurate.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(gallery.length > 0 ? { image: gallery.map((src) => `${siteConfig.url}${src}`) } : {}),
    category: category.name,
    ...(product.grade || product.standard
      ? { additionalProperty: [product.grade, product.standard].filter(Boolean).map((value) => ({ "@type": "PropertyValue", name: "Grade/Standard", value })) }
      : {}),
    brand: { "@type": "Organization", name: siteConfig.name },
  }

  const specRows = [
    product.grade ? { label: "Grade", value: product.grade } : null,
    product.standard ? { label: "Standard", value: product.standard } : null,
    { label: "Range", value: category.name },
    { label: "Availability", value: "In stock, Dubai UAE, confirm quantity with sales" },
  ].filter(Boolean) as { label: string; value: string }[]

  const related = category.items.filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-14 lg:px-12">
        <Breadcrumbs
          crumbs={[
            { label: "Products", href: "/products" },
            { label: category.name, href: `/categories/${category.slug}` },
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ScrollReveal>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
              {gallery.length > 0 ? (
                <Image
                  src={gallery[0]}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  quality={95}
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: category.color }}>
                  <CategoryIcon icon={category.icon} className="size-12" />
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {gallery.slice(1).map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
                    <Image src={src} alt={product.name} fill sizes="120px" className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="flex h-full flex-col">
              <Link
                href={`/categories/${category.slug}`}
                className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: category.color }}
              >
                <CategoryIcon icon={category.icon} className="size-3.5" />
                {category.name}
              </Link>

              <h1 className="mt-4 text-balance text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {product.name}
              </h1>

              {(product.grade || product.standard) && (
                <p className="mt-3 text-sm font-semibold text-accent">
                  {product.grade}
                  {product.grade && product.standard && " · "}
                  {product.standard}
                </p>
              )}

              <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">{product.description}</p>

              <div className="mt-8 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "bg-secondary/40" : ""}>
                        <td className="w-40 border-b border-border px-4 py-3 font-bold text-foreground last:border-b-0">{row.label}</td>
                        <td className="border-b border-border px-4 py-3 text-muted-foreground last:border-b-0">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Usage & Key Applications */}
              <div className="mt-8 border-t border-border pt-8 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Usage & Applications</h3>
                  <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
                    {usageData.usage.map((use, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Key Features</h3>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    {usageData.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5 leading-relaxed">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-[10px]" aria-hidden="true">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Industries Served</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {usageData.industries.map((ind) => (
                      <span key={ind} className="rounded-lg bg-accent-light px-3 py-1 text-xs font-semibold text-accent border border-accent/10">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <ProductDetailActions
                product={{
                  id: product.id,
                  name: product.name,
                  categorySlug: category.slug,
                  categoryName: category.name,
                  grade: product.grade,
                  standard: product.standard,
                  image: product.image,
                }}
              />

              <a
                href={catalogPdfPath}
                download="Sabta-Trading-Product-Catalog-2026.pdf"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
              >
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                Download Full Catalog (PDF)
              </a>
            </div>
          </ScrollReveal>
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t border-border pt-12 md:mt-20">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">More From {category.name}</h2>
              <Link href={`/categories/${category.slug}`} className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                View All
                <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} item={item} color={category.color} icon={category.icon} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CtaBanner />
    </>
  )
}

function getProductUsageData(categorySlug: string, productName: string) {
  const name = productName.toLowerCase()
  
  // 1. Shackle
  if (name.includes("shackle")) {
    return {
      usage: [
        "Connecting lifting slings, chains, or wire ropes to structural loads or anchors.",
        "Marine towing, mooring, and anchoring connections on vessels and docks.",
        "Heavy construction rigging and industrial hoisting applications.",
        "Temporary or permanent load securing for heavy machinery and logistics."
      ],
      industries: ["Marine & Offshore", "Heavy Construction", "Industrial Lifting", "Cargo & Logistics"],
      features: [
        "Forged high-tensile steel construction for reliability",
        "Zinc-plated or hot-dip galvanized for corrosion defense",
        "Clear working load limit (WLL) markings (where applicable)"
      ]
    }
  }

  // 2. Wire Rope / Cable
  if (name.includes("wire rope") || name.includes("cable") || name.includes("strand")) {
    return {
      usage: [
        "Lifting slings, crane hoisting lines, and winch line operations.",
        "Structural guy wires, mast support systems, and architectural balustrades.",
        "Suspension bridges, cable-stayed structures, and zip-line installations.",
        "Securing marine rigging, sails, and boat lift assemblies."
      ],
      industries: ["Maritime & Rigging", "Construction & Structural", "Mining & Forestry", "Material Handling"],
      features: [
        "High tensile strength with flexible multi-wire construction",
        "Excellent fatigue resistance under repetitive bending",
        "Available in 304/316 Stainless for maximum rust prevention"
      ]
    }
  }

  // 3. Turnbuckle / Rigging Screw
  if (name.includes("turnbuckle") || name.includes("rigging screw")) {
    return {
      usage: [
        "Tensioning and adjusting the length of wire ropes, cables, and tie rods.",
        "Securing sailboat standing rigging, masts, and stays.",
        "Tensioning structural tie-backs, bridge spans, and guy wires.",
        "Securing heavy cargo, timber structures, and transport containers."
      ],
      industries: ["Marine Rigging & Sailing", "Structural Engineering", "Cargo Securing & Lashing", "Construction"],
      features: [
        "Threaded body allows fine-tuned tension adjustments",
        "Available with Hook, Eye, or Jaw end configurations",
        "High load capacities matching rigging safety factors"
      ]
    }
  }

  // 4. Hook (Snap Hook, Clevis Hook, etc.)
  if (name.includes("hook")) {
    return {
      usage: [
        "Quick-connect linking for safety chains, wire ropes, and lifting accessories.",
        "Overhead lifting, towing assemblies, and load binding connections.",
        "Marine mooring lines, snap hooks for sails, and safety harnesses.",
        "Industrial fall protection systems and climbing gear."
      ],
      industries: ["Industrial Lifting & Towing", "Maritime Operations", "Personal Safety & Climbing", "Material Handling"],
      features: [
        "Spring-loaded gates or safety latches to prevent accidental release",
        "Forged alloy construction for extreme breaking strength",
        "Smooth, snag-free hook noses for easy attachment"
      ]
    }
  }

  // 5. Pulley / Block / Sheave
  if (name.includes("pulley") || name.includes("block") || name.includes("sheave")) {
    return {
      usage: [
        "Changing the direction of wire ropes or synthetic lines under load.",
        "Creating block-and-tackle mechanical advantage systems for lifting.",
        "Marine sailboat halyards, sheets, and control line systems.",
        "Winch cable routing and towing line deflection."
      ],
      industries: ["Sailing & Maritime", "Material Handling", "Recovery & Towing", "Industrial Lifting"],
      features: [
        "Low-friction bearings or bushings for smooth wire tracking",
        "Rugged cheek plates to protect lines from fraying",
        "Swivel heads to prevent line twisting during hoisting"
      ]
    }
  }

  // 6. Eye Bolt / Eye Nut / Pad Eye
  if (name.includes("eye bolt") || name.includes("eye nut") || name.includes("pad eye") || name.includes("ring bolt")) {
    return {
      usage: [
        "Creating secure anchoring points on machinery, walls, or decks for lifting.",
        "Rigging attachment points for shackles, hooks, and tensioning devices.",
        "Marine deck hardware for securing fenders, halyards, and tie-downs.",
        "Suspending piping, cable trays, and lighting fixtures from ceilings."
      ],
      industries: ["Machinery Manufacturing", "Maritime Deck Fitout", "Industrial Rigging", "HVAC & Electrical Installation"],
      features: [
        "Threaded or weldable base for solid anchor connection",
        "Closed loop design to prevent accidental rope slip-off",
        "Tested for vertical and angular lifting configurations"
      ]
    }
  }

  // 7. Hose Clips & Clamps (Category Default if no specific match)
  if (categorySlug === "hose-clips-clamps") {
    return {
      usage: [
        "Securing flexible hose lines onto nipples, fittings, and pipes to prevent fluid and gas leakage under pressure.",
        "Ideal for automotive engine cooling, radiator lines, air conditioning ducts, and fuel systems.",
        "Widely used in agriculture irrigation systems, industrial water pipelines, and pneumatic machinery.",
        "Marine grades (316 stainless) are built for bilge pumps, marine fuel systems, and engine room plumbing in harsh salt-water environments."
      ],
      industries: ["Automotive & Garage Services", "Chemical & Industrial Processing", "Marine & Offshore Vessels", "Agriculture & Irrigation"],
      features: [
        "High clamping force with even band distribution",
        "Rolled band edges to prevent damage to flexible hoses",
        "Corrosion-resistant grades available (304 and 316 Marine Grade)"
      ]
    }
  }

  // 8. Banding Systems
  if (categorySlug === "banding-systems") {
    return {
      usage: [
        "Strapping and securing heavy-duty industrial hoses, pipe insulation, and cable bundles.",
        "Mounting signs, traffic lights, camera enclosures, and telecommunications brackets to street poles.",
        "Bundling structural steel, wood, and cargo containers for transport and shipping.",
        "Used with manual tensioning tools and buckle/clips for custom-length heavy-duty strapping."
      ],
      industries: ["Telecommunications & Power Utilities", "Shipping & Marine Logistics", "Heavy Manufacturing", "Municipal Signage & Safety"],
      features: [
        "Unrestricted bundling diameter - cut to custom length",
        "High tensile strength for critical fastening loads",
        "Excellent resistance to weather and UV exposure"
      ]
    }
  }

  // 9. Rigging Hardware (General)
  if (categorySlug === "rigging-hardware") {
    return {
      usage: [
        "Connecting wire ropes, chains, and lifting slings to loads for hoisting, winching, and securing.",
        "Marine vessel rigging, yacht sailing lines, and architectural wire rope balustrades/railings.",
        "Securing cargo on trucks, flatbeds, ship decks, and container vehicles.",
        "Static load suspension, theatrical stage rigging, and tensioning structures."
      ],
      industries: ["Maritime & Sailing", "Construction & Structural Rigging", "Transportation & Cargo Logistics", "Entertainment & Stage Setup"],
      features: [
        "Forged materials for high load capacity",
        "Pin lock designs for secure, accidental-release proof assembly",
        "High corrosion resistance in harsh maritime conditions"
      ]
    }
  }

  // 10. Lifting & Marine Hardware (General)
  if (categorySlug === "lifting-marine-hardware") {
    return {
      usage: [
        "Heavy-duty lifting operations utilizing cranes, gantry systems, and chain slings.",
        "Anchor connections, mooring setups, and commercial vessel towing systems.",
        "Load binding and tie-down tensioning for flatbed transport and heavy equipment shipping.",
        "Industrial construction sites, material handling, and steel fabrication yards."
      ],
      industries: ["Heavy Construction", "Marine Navigation & Port Operations", "Steel & Iron Mills", "Transport & Shipping Utilities"],
      features: [
        "Certified load ratings and high fatigue resistance",
        "Hot-dip galvanized (HDG) coating for extreme atmospheric protection",
        "High-tensile Grade 70 / Grade 80 alloy construction"
      ]
    }
  }

  // 11. Clips & Pins (General)
  if (categorySlug === "clips-pins") {
    return {
      usage: [
        "Retaining bearings, gears, pulleys, and shafts axially inside mechanical assemblies.",
        "Quick-release linkage systems, locking shafts in agricultural implements and construction machinery.",
        "Securing joint pins, hinge assemblies, and pivot points on mechanical brackets.",
        "Automotive chassis assemblies, brake linkages, and general workshop machine repair."
      ],
      industries: ["Machinery Manufacturing", "Automotive & Fleet Maintenance", "Agriculture & Farm Machinery", "Aerospace & Precision Tooling"],
      features: [
        "High spring-tension and dimensional stability",
        "Precise compliance with DIN/ISO machinery standards",
        "Simple installation and removal using standard pliers"
      ]
    }
  }

  // 12. Bolts & Screws (General)
  if (categorySlug === "bolts-screws") {
    return {
      usage: [
        "Joining structural steel beams, plates, and concrete anchoring assemblies in buildings and bridges.",
        "Assembling internal combustion engines, pumps, transmissions, and heavy automotive parts.",
        "Flange bolting for high-pressure industrial pipelines, valves, and pressure vessels.",
        "General construction fixings, machine foundations, and heavy mechanical framing."
      ],
      industries: ["Building & Infrastructure Construction", "Oil, Gas & Petrochemical Plants", "Automotive & Heavy Truck Manufacturing", "Power Generation Plants"],
      features: [
        "High tensile strengths available (Grade 8.8, 10.9, 12.9)",
        "Thread accuracy matching high-tolerance engineering standards",
        "Corrosion-resistant coating options including Zinc Plating and Hot-Dip Galvanized"
      ]
    }
  }

  // 13. Nuts (General)
  if (categorySlug === "nuts") {
    return {
      usage: [
        "Mating with bolts, studs, and threaded rods to secure mechanical joints.",
        "Vibration-resistant assemblies using nylon insert lock nuts or locking washers to prevent backing off.",
        "High-strength structural connections in machinery, automotive setups, and civil engineering.",
        "Plumbing flanges, electrical ducting support hangers, and general-purpose assemblies."
      ],
      industries: ["Industrial Equipment Assembly", "Auto Repair & Chassis Shops", "Structural Steel Fabricators", "Electrical & Pipeline Contracting"],
      features: [
        "Perfect thread matching with standard bolts",
        "Locking features available (Nyloc, Dome, Flange designs)",
        "Durable finish to withstand torque during assembly"
      ]
    }
  }

  // 14. Washers (General)
  if (categorySlug === "washers") {
    return {
      usage: [
        "Distributing the clamping load of threaded fasteners over a larger surface area to prevent material surface damage.",
        "Providing spacing, leveling, and thickness compensation under bolt heads or nuts.",
        "Spring washers are used to maintain tension and resist loosening under high-vibration conditions.",
        "Preventing galvanic corrosion between dissimilar metal assemblies by serving as a barrier."
      ],
      industries: ["General Machine Shops", "Construction & Structural Carpentry", "Vibration-Heavy Equipment", "HVAC & Plumbing Assemblies"],
      features: [
        "Even load distribution to protect working surfaces",
        "Vibration absorption and joint compression retention",
        "Accurate inner and outer diameter tolerances"
      ]
    }
  }

  // Default Fallback
  return {
    usage: [
      "Used in mechanical and structural assemblies to secure connections under load.",
      "Industrial engineering installations and facility maintenance projects.",
      "Ideal for demanding workshop assembly and repair operations.",
      "General machinery components for reliable long-term operations."
    ],
    industries: ["General Manufacturing", "Heavy Industry", "Engineering Workshops", "Maintenance & Repair Services"],
    features: [
      "Manufactured using certified steel/stainless alloys",
      "High reliability for commercial and industrial setups",
      "Tested dimensions ensuring exact compatibility"
    ]
  }
}
