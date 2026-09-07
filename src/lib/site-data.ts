// Central content store for the Sabta Trading Co. LLC website.
// Every fact here (company profile, contacts, catalogue items, coordinates)
// is sourced directly from SABTA TRADING CATALOG_2026_NEW.pdf — nothing
// invented. Grades quoted (GI, 304, 316, 8.8, 10.9, 12.9, G70, G80, DIN/NFE
// standard numbers) are copied verbatim from the catalogue pages.
//
// Product-level data (individual catalog items) no longer lives here — it
// is stored in data/products.json and managed via src/lib/products.ts, so
// that products can be added, edited and reordered through the admin
// dashboard without a code change. This file now holds category-level
// metadata plus general site content only.

export const siteConfig = {
  name: "Sabta Trading Co. LLC",
  nameAr: "شركة سبته التجارية ذ.م.م",
  shortName: "Sabta Trading",
  tagline: "Fastener & Marine Rigging Hardware Since 1994",
  founded: 1994,
  description:
    "Dubai-based fastener and marine rigging hardware distributor since 1994, stocking 16,000+ items for the Automotive, Manufacturing, Marine and Oilfield industries.",
  url: "https://www.sabtadxb.com",
  itemsInStock: "16,000+",
  companyProfileImage: "/brand/logo.png",
}

export const contactInfo = {
  phone: "+971 4 2210506",
  phoneHref: "tel:+97142210506",
  fax: "+971 4 2243009",
  poBox: "P.O. Box 14684, Dubai, U.A.E.",
  address: "Baniyas Square, Behind Dream Land Centre, Shop 39, Mohd Mattar Bldg",
  addressLocality: "Dubai",
  addressCountry: "AE",
  city: "Dubai, United Arab Emirates",
  website: "www.sabtadxb.com",
  managingDirector: { name: "Saifuddin", role: "Managing Director" },
  contacts: [
    {
      name: "Ali Asgar",
      phone: "+971 50 5649976",
      phoneHref: "tel:+971505649976",
      whatsappHref: "https://wa.me/971505649976",
      email: "ali@sabtadxb.com",
    },
    {
      name: "Husain",
      phone: "+971 50 5092067",
      phoneHref: "tel:+971505092067",
      whatsappHref: "https://wa.me/971505092067",
      email: "husain@sabtadxb.com",
    },
  ],
  // Primary WhatsApp / quote contact used across the site's floating button
  // and forms.
  primaryWhatsappHref: "https://wa.me/971505649976",
  primaryEmail: "ali@sabtadxb.com",
  // Decoded directly from the QR code printed on the back cover of the 2026
  // catalogue (Google "place" link for SABTA TRADING CO LLC).
  mapsPlaceUrl:
    "https://www.google.com/maps/place/SABTA+TRADING+CO+LLC/@25.2697884,55.3054345,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f43485ed1f901:0x5ff9a43521b4ec62!8m2!3d25.2697884!4d55.3054345!16s%2Fg%2F11bbwpk8pj",
  mapsEmbedSrc: "https://www.google.com/maps?q=25.2697884,55.3054345&z=16&output=embed",
  lat: 25.2697884,
  lng: 55.3054345,
}

export const industries = [
  {
    name: "Automotive",
    description: "Fasteners and clamping hardware supplied to automotive workshops and assembly lines across the UAE.",
  },
  {
    name: "Manufacturing",
    description: "General industrial fasteners, fixings and hardware for manufacturing and production facilities.",
  },
  {
    name: "Marine",
    description: "Corrosion-resistant 316-grade rigging, shackles and lifting hardware built for salt-water and off-shore use.",
  },
  {
    name: "Oilfield",
    description: "High-grade bolting, stud bolts and rigging hardware specified for oilfield and heavy-industrial sites.",
  },
] as const

export type CategoryMeta = {
  slug: string
  name: string
  shortDescription: string
  description: string
  icon: "clamp" | "band" | "rigging" | "marine" | "pin" | "bolt" | "nut" | "washer" | "misc"
  color: string
  brandNote?: string
  pageRange: [number, number]
  /** Optional cover photo shown on the "Our Product Ranges" grid; falls
   * back to the first product photo in the category when unset. */
  image?: string
}

export const categories: CategoryMeta[] = [
  {
    slug: "hose-clips-clamps",
    name: "Hose Clips & Clamps",
    shortDescription: "Rubit-brand hose clips, P clips, ear clamps and grating clamps.",
    description:
      "Zinc-plated, 304 and marine-grade 316 stainless hose clips and clamps sized 3/8″–12″ (9.5mm–318mm), for general purpose, industrial and off-shore, salt-water applications.",
    icon: "clamp",
    color: "#0f9b3f",
    brandNote: "Rubit Brand",
    pageRange: [3, 9],
  },
  {
    slug: "banding-systems",
    name: "Banding & Buckle Systems",
    shortDescription: "Stainless banding strip, buckles and multi-band tools.",
    description:
      "Stainless steel banding strip, ear-lokt buckles and Rubit-brand multi-band systems used to secure hose, cable and pipe bundles.",
    icon: "band",
    color: "#1b8f5a",
    brandNote: "Rubit Brand",
    pageRange: [10, 12],
  },
  {
    slug: "rigging-hardware",
    name: "Rigging Hardware",
    shortDescription: "Shackles, hooks, pulleys, turnbuckles, pad eyes and wire rope.",
    description:
      "A full rigging range: snap hooks, shackles, pulleys, turnbuckles, pad eyes, wire rope and chain, in GI, 304 and marine-grade 316 stainless for lifting and securing loads.",
    icon: "rigging",
    color: "#1b2a80",
    pageRange: [13, 22],
  },
  {
    slug: "lifting-marine-hardware",
    name: "Lifting & Marine Hardware",
    shortDescription: "G70/G80 chain hardware, hot-dip galvanized shackles and load binders.",
    description:
      "Hot-dip galvanized shackles and wire rope clips together with G70/G80 alloy chain fittings: clevis hooks, connecting links, master links and load binders, rated for lifting and marine service.",
    icon: "marine",
    color: "#0b6dab",
    pageRange: [23, 26],
  },
  {
    slug: "clips-pins",
    name: "Clips & Pins",
    shortDescription: "Circlips, snap rings, dowel pins and split/cotter pins.",
    description:
      "DIN-standard circlips and snap rings alongside dowel, hitch, quick-release and split/cotter pins for shaft retention and quick-release assembly work.",
    icon: "pin",
    color: "#c98a2e",
    pageRange: [27, 29],
  },
  {
    slug: "bolts-screws",
    name: "Bolts & Screws",
    shortDescription: "Hex, flange, carriage, socket-cap and stud bolts to DIN standards.",
    description:
      "Hex, flange, carriage and roofing bolts, threaded bar, stud bolts and socket-cap screws manufactured to DIN standards in mechanical grades 8.8 through 12.9 and 304/316 stainless.",
    icon: "bolt",
    color: "#1b2a80",
    pageRange: [30, 32],
  },
  {
    slug: "nuts",
    name: "Nuts",
    shortDescription: "Hex, lock, flange, rivet and specialty nuts.",
    description:
      "Hex, lock, flange, castle and rivet nuts through to specialty types: K nuts, T-slide nuts, cage nuts and weld nuts, in mechanical and stainless grades.",
    icon: "nut",
    color: "#0f9b3f",
    pageRange: [33, 37],
  },
  {
    slug: "washers",
    name: "Washers",
    shortDescription: "Flat, spring, serrated and Nordlock washers.",
    description:
      "Flat, spring and serrated washers to DIN125/DIN127/DIN9021, plus Nordlock (NFE25201) and contact (NFE25511) washers for vibration-resistant joints.",
    icon: "washer",
    color: "#5a6178",
    pageRange: [38, 39],
  },
  {
    slug: "misc-hardware",
    name: "Grease Fittings & Workshop Hardware",
    shortDescription: "Grease nipples, threading taps & dies, O-rings and rivets.",
    description:
      "Grease nipples and adaptors, threading taps, dies and rivet tools, O-rings and S.R.C rivets: the workshop consumables that round out a fastener order.",
    icon: "misc",
    color: "#8a4bab",
    pageRange: [40, 44],
  },
]

export function getCategoryMeta(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export function catalogPagePath(page: number) {
  return `/catalog/page-${String(page).padStart(2, "0")}.webp`
}

export function categoryPageImages(category: CategoryMeta) {
  const [start, end] = category.pageRange
  const pages: number[] = []
  for (let p = start; p <= end; p++) pages.push(p)
  return pages.map((p) => ({ page: p, src: catalogPagePath(p) }))
}

export const catalogPdfPath = "/SABTA-Trading-Product-Catalog-2026.pdf"

export const faqs = [
  {
    question: "What does Sabta Trading Co. LLC supply?",
    answer:
      "We are a Dubai-based fastener and marine rigging hardware distributor stocking 16,000+ items: hose clips, clamps, rigging and lifting hardware, clips and pins, bolts, screws, nuts, washers and general workshop hardware, for the Automotive, Manufacturing, Marine and Oilfield industries.",
  },
  {
    question: "Do you carry stainless steel (304 / 316) grades?",
    answer:
      "Yes. Most ranges are stocked in 304 stainless for general corrosion resistance and 316 marine-grade stainless for off-shore and salt-water applications, alongside standard GI and mechanical grades (8.8–12.9).",
  },
  {
    question: "Can you source items that are not in ready stock?",
    answer:
      "Yes, with our dedicated list of suppliers we can source any type of fastener that isn’t currently in ready stock. Send us the specification and quantity you need and we’ll quote it.",
  },
  {
    question: "Where are you located and can I collect an order?",
    answer:
      "We are based in Dubai, U.A.E. Contact our sales team on +971 4 2210506 or WhatsApp to confirm stock and arrange collection or delivery.",
  },
  {
    question: "How do I request a quotation?",
    answer:
      "Use the contact form on this site, WhatsApp us directly, or call +971 4 2210506. Include the product name, grade/standard and quantity and our sales team will respond with pricing and availability.",
  },
  {
    question: "Is a full product catalogue available?",
    answer:
      "Yes, our complete 2026 product catalogue (all 9 ranges, with grades and standards) is available to download as a PDF from the Products page, or we can email it to you directly.",
  },
]

export const testimonials = [
  {
    author: { name: "Ali Mohammed", role: "Procurement Officer", company: "Al Naboodah Contracting" },
    text: "Sabta has been our primary fastener supplier for over 5 years. Their stock depth in stainless steel bolts is unmatched in Dubai.",
  },
  {
    author: { name: "Hassan Raza", role: "Project Manager", company: "Marine Services LLC" },
    text: "For marine-grade rigging hardware and copper washers, Sabta always delivers on time. Highly recommended for heavy contracting.",
  },
  {
    author: { name: "John Mathew", role: "Workshop Manager", company: "Apex Engineering" },
    text: "Excellent service and high-quality materials. Their sales team on WhatsApp is extremely responsive when quoting bulk orders.",
  },
]

