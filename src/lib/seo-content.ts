// Search-driven page copy, kept in code so it ships with the template.
//
// Built from Google Search Console data (7–24 Oct 2026): each entry targets
// queries a page already ranks for but under-uses, or fixes a snippet that
// gets impressions without clicks. Anything not listed here falls back to
// the admin-panel content exactly as before.
//
// Inline links use a tiny markdown subset: [anchor text](/path).
//
// NOTE: an `intro` here REPLACES the admin-panel category description on the
// page (and in the JSON-LD). Edit it here, not in the admin panel, for the
// categories that set one.

export type SeoSection = {
  heading: string
  paragraphs: string[]
}

export type CategorySeo = {
  /** Full <title>, used as-is (no " | Sabta Trading" suffix appended). Keep it ≤ 60 chars. */
  title?: string
  /** Meta description, 140–155 chars. */
  description?: string
  /** On-page H1 (the range name stays unchanged in nav, breadcrumbs and cards). */
  h1?: string
  /** Replaces the admin-panel description under the H1. */
  intro?: string
  /** Extra paragraph shown under the intro (may contain links). */
  introExtra?: string
  /** Sub-line under "Product Types In This Range"; {count} is replaced with the number of products. */
  productsLead?: string
  /** Sections rendered after the product grid, before the buying guides. */
  sections?: SeoSection[]
  /** Anchor text used when other pages (blog "Ranges mentioned") link to this range. */
  linkLabel?: string
}

export type ProductSeo = {
  title?: string
  description?: string
  h1?: string
  sections?: SeoSection[]
}

export type StaticPageSeo = { title: string; description: string }

export const categorySeo: Record<string, CategorySeo> = {
  "hose-clips-clamps": {
    title: "Hose Clamps & Hose Clips in Dubai | SS304, SS316 & Zinc",
    description:
      "Hose clamps and hose clips in zinc-plated, SS304 and marine-grade SS316, sizes 3/8″ to 12″. In stock at Baniyas Square, Dubai. WhatsApp for a bulk quote.",
    h1: "Hose Clamps & Hose Clips",
    intro:
      "Hose clamps and hose clips in zinc-plated, 304 and marine-grade 316 stainless steel, sized 3/8″–12″ (9.5mm–318mm), for general purpose, industrial and off-shore, salt-water applications. Need one hose clamp size in bulk? Send the size, grade and quantity for a quote.",
    productsLead:
      "{count} product types, grades and standards as stocked, from zinc-plated clips to stainless steel clamps in 304 and 316. Confirm current availability with our sales team.",
    linkLabel: "Hose Clamps & Hose Clips",
    sections: [
      {
        heading: "SS Hose Clips & Clamps (304 and 316)",
        paragraphs: [
          "Most of this range comes in stainless as well as zinc. The SS hose clip is stocked in 304 for industrial lines and in 316 for marine and off-shore use; ask for an SS hose clamp by band width and diameter range.",
          "Beyond hose clips, the stainless line-up includes the [SS hanging clamp](/products/hose-clips-clamps/stainless-steel-rubber-hanging-clamp) (rubber-lined, for suspending pipe and cable), [single-ear clamps](/products/hose-clips-clamps/single-ear-clamp) and the [stainless P clip](/products/hose-clips-clamps/stainless-steel-p-clip), the usual SS clip for fixing tube and cable to a surface. One SS clamp order can cover a whole job.",
        ],
      },
      {
        heading: "Grating Clamps: HDG and Stainless",
        paragraphs: [
          "Sabta Trading is a grating clamp supplier in the UAE for both main types: [hot-dip galvanized (HDG) grating clamps](/products/hose-clips-clamps/hdg-grating-clamp) for steel walkways, platforms and stair treads, and [SS grating clamps](/products/hose-clips-clamps/ss-grating-clamp) in 304 and marine-grade 316 for off-shore decks, coastal plants and other salt-exposed sites.",
          "Grating clamps fix the grating panel to the supporting steel without welding, so panels can be lifted later for access. Send your grating bar size, support flange thickness and quantity, and we'll confirm the matching clamp.",
        ],
      },
      {
        heading: "Your Clamp Supplier in Dubai Since 1994",
        paragraphs: [
          "Sabta Trading has been a clamp supplier in Dubai since 1994, with hose clips, P clips and ear, saddle, beam, muffler and grating clamps held as ready stock at our Baniyas Square shop (Shop 39, Mohd Mattar Bldg, behind Dream Land Centre).",
          "Trade buyers across the UAE order by phone, WhatsApp or email: send the clamp type, size, grade (GI, 304 or 316) and quantity, and our sales team replies with pricing and availability. Collect from the shop or ask us to arrange delivery. If a size isn't on the shelf, our supplier network can source it.",
          "Call [+971 4 2210506](tel:+97142210506) or [send an enquiry](/contact) for a clamp quote.",
        ],
      },
    ],
  },

  "lifting-marine-hardware": {
    title: "Lifting & Marine Hardware Dubai: G80 Chain & Shackles",
    description:
      "Hot-dip galvanized shackles, G80 clevis hooks, master links, load binders and G80 chain for lifting and marine work, stocked in Dubai. Get a quote.",
    introExtra:
      "For snap hooks, turnbuckles, pad eyes and other rigging fittings in 304/316 stainless, see our [Rigging Hardware range](/categories/rigging-hardware).",
    productsLead:
      "{count} product types, grades and standards as stocked. Need cargo strapping products in the UAE? Ratchet and lever load binders, the cargo latch kit and G80 chain handle chain lashing, while steel strapping and buckles are in our [Banding & Buckle Systems](/categories/banding-systems) range.",
    sections: [
      {
        heading: "Marine Lifting Equipment in the UAE",
        paragraphs: [
          "This range covers the fittings that marine lifting equipment in the UAE depends on: hot-dip galvanized D and bow shackles, G80 clevis and self-locking hooks, master links, connecting links and G80 chain for building chain slings, plus ratchet and lever load binders for deck lashing.",
          "Galvanized finishes stand up to humidity and salt spray on quaysides, vessels and off-shore sites. For overhead lifting, use G80 alloy fittings rather than G70 transport chain; our [G70 vs G80 guide](/blog/g70-vs-g80-lifting-chain) explains the difference. Tell us the working load limit, size and quantity you need and we'll confirm what's in stock.",
          "Building lifting frames or spreader beams? Whether you're a lifting frames supplier in the UAE or fabricate frames in-house, we stock the hardware that goes on them: bow and D shackles, master links, G80 hooks and connecting links in galvanized and alloy finishes.",
          "Need fastening tools to go with the hardware? Rivet guns, threading taps, dies and tap wrenches are in our [Grease Fittings & Workshop Hardware](/categories/misc-hardware) range.",
        ],
      },
    ],
  },

  "rigging-hardware": {
    sections: [
      {
        heading: "Rigging Hardware Supplier in Dubai",
        paragraphs: [
          "Among the rigging hardware trading companies in Dubai, Sabta Trading has held ready stock at Baniyas Square since 1994, so most items can be collected from the shop or delivered across the UAE.",
          "For contractors comparing industrial rigging equipment suppliers in Dubai, we stock shackles, turnbuckles, wire rope and fittings in GI, 304 and 316, with quotes by phone, WhatsApp or the [enquiry form](/contact). For G80 chain, master links and load binders, see [Lifting & Marine Hardware](/categories/lifting-marine-hardware).",
        ],
      },
    ],
  },

  washers: {
    title: "Steel & Stainless Washers in Dubai | Flat, Spring, Nordlock",
    description:
      "Steel washers in 8.8, GI and HDG plus 304/316 stainless: flat, spring, serrated, Nordlock and contact washers stocked in Dubai. Request a quote today.",
    h1: "Steel & Stainless Washers",
    linkLabel: "Steel & Stainless Washers",
    sections: [
      {
        heading: "Steel Washers: Which Grade to Choose",
        paragraphs: [
          "Our steel washers come in three main finishes. Grade 8.8 flat and spring washers suit high-tensile bolted joints indoors; GI and HDG washers handle weather on structural and outdoor work; 304 and 316 stainless washers are for food, chemical and marine environments where rust isn't acceptable.",
          "Match the washer to the bolt (an 8.8 washer under an 8.8 bolt, a 316 washer with 316 stainless) so the joint doesn't corrode where the metals meet. Where vibration could loosen the nut, use Nordlock (NFE25201) or contact (NFE25511) washers. Our [bolt grades guide](/blog/bolt-grades-explained-8-8-vs-10-9-vs-12-9) covers choosing the bolt itself.",
        ],
      },
    ],
  },

  "misc-hardware": {
    title: "Grease Fittings & Workshop Hardware Dubai | Sabta",
    description:
      "Grease nipples and adaptors, threading taps and dies, O-ring cord, rivets and rivet guns: 30 workshop hardware types in stock in Dubai. Request a quote.",
    intro:
      "Grease fittings in Dubai: grease nipples, button-head adaptors and caps, plus threading taps, dies and rivet tools, O-rings and S.R.C rivets. These are the workshop consumables that round out a fastener order.",
  },

  nuts: {
    title: "Nuts in Dubai: Hex, Lock, Flange & Cage Nuts | Sabta",
    description:
      "Hex, lock, flange, cap, cage and weld nuts in 8.8, GI, 304 and 316 stainless: 24 nut types stocked by Sabta Trading in Dubai. Request a quote today.",
  },
}

export const productSeo: Record<string, ProductSeo> = {
  "bolts-screws/hex-bolt-din931-933": {
    title: "Hex Bolt DIN 931 / DIN 933 (8.8, 10.9, 12.9, SS) Dubai",
    description:
      "DIN 931 part-thread and DIN 933 full-thread hex bolts in grade 8.8, 10.9, 12.9 and 304/316 stainless, stocked in Dubai. Send size and qty for a quote.",
    h1: "Hex Bolt - DIN 931 / DIN 933",
    sections: [
      {
        heading: "DIN 931 vs DIN 933: Which Hex Bolt Do You Need?",
        paragraphs: [
          "DIN 931 hex bolts have a partial thread with a plain shank under the head, which carries shear load better where the bolt passes through the joint. DIN 933 hex bolts are threaded right up to the head, for clamping thin parts or where the nut position varies.",
          "Both are stocked in grade 8.8, 10.9 and 12.9 steel and in 304/316 stainless, with zinc-plated and hot-dip galvanized options. To order, send the standard, diameter, length, grade, finish and quantity, for example \"M16 x 100, 8.8, HDG, 200 pcs\". Not sure which grade? See [bolt grades explained](/blog/bolt-grades-explained-8-8-vs-10-9-vs-12-9) and our guide to [DIN, ISO and ANSI standards](/blog/din-iso-ansi-fastener-standards-explained).",
        ],
      },
    ],
  },
  "clips-pins/circlip-external-din471": {
    title: "Circlip External DIN 471 (MS & 304) in Dubai | Sabta",
    description:
      "DIN 471 external circlips in MS and 304 stainless for retaining bearings, gears and pins on a shaft. Stocked by Sabta Trading in Dubai. Request a quote.",
    sections: [
      {
        heading: "What Is a DIN 471 External Circlip?",
        paragraphs: [
          "A DIN 471 external circlip (sometimes asked for as a circlip pin or shaft circlip) snaps into a groove machined on a shaft and stops bearings, gears, pulleys and pins from sliding along it. It is fitted and removed with circlip pliers.",
          "For a ring that sits inside a bore or housing instead, use our [internal circlips for bores (DIN 472)](/products/clips-pins/circlip-internal-din472).",
        ],
      },
    ],
  },
}

export const staticPageSeo = {
  about: {
    title: "About Sabta Trading: Dubai Fastener Distributor Since 1994",
    description:
      "Sabta Trading Co. LLC has supplied fasteners and marine rigging hardware from Dubai since 1994. 16,000+ items in stock for marine, oilfield and industry.",
  },
  contact: {
    title: "Contact Sabta Trading | Baniyas Square Shop, Dubai",
    description:
      "Visit Sabta Trading at Shop 39, Mohd Mattar Bldg, Baniyas Square, Dubai, or call +971 4 2210506. WhatsApp or email for a fastener or rigging quote.",
  },
  faq: {
    title: "FAQ: Stock, Grades & Quotes | Sabta Trading Dubai",
    description:
      "Answers on 304/316 stainless stock, sourcing parts not on the shelf, collection from our Baniyas Square shop, delivery and quotes from Sabta Trading.",
  },
} satisfies Record<string, StaticPageSeo>
