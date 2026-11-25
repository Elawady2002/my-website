export type CaseStudySlug =
  | "fi-el-sekka"
  | "tride"
  | "active-platform"
  | "malahi";

export interface CaseStudyExploration {
  label: string;
  approach: string;
  verdict: "Rejected" | "Chosen";
  rationale: string;
}

export interface CaseStudyDecision {
  title: string;
  rationale: string;
}

export interface CaseStudyLiveLink {
  type: "appStore" | "googlePlay" | "web";
  label: string;
  href: string;
}

export interface CaseStudyDetail {
  slug: CaseStudySlug;
  number: string;
  title: string;
  domain: string;
  subtitle: string;
  role: string;
  timeline: string;
  platform: string;
  market: string;
  status: string;
  accentColor: string;
  stageBg: string;
  cardBg: string;
  summary: {
    problemBrief: string;
    roleScope: string;
    keyOutcome: string;
    deliverables: string;
  };
  context: string;
  problem: {
    headline: string;
    body: string;
    painPoints: readonly string[];
  };
  whyItMattered: {
    userImpact: string;
    businessStakes: string;
  };
  constraints: readonly string[];
  explorations: readonly CaseStudyExploration[];
  designDecisions: readonly CaseStudyDecision[];
  systemsAndHandoff: {
    headline: string;
    body: string;
    highlights: readonly string[];
  };
  outcomeAndNextSteps: {
    shippedReality: readonly string[];
    nextMetricsToTrack: readonly string[];
  };
  media: {
    layout: "mobile" | "desktop";
    bgImage: string;
    mobileScreens?: readonly string[];
    posterSrc?: string;
    videoSrc?: string;
  };
  liveLinks: readonly CaseStudyLiveLink[];
}

export const CASE_STUDY_SLUGS: readonly CaseStudySlug[] = [
  "fi-el-sekka",
  "tride",
  "active-platform",
  "malahi",
];

export const CASE_STUDIES: Record<CaseStudySlug, CaseStudyDetail> = {
  "fi-el-sekka": {
    slug: "fi-el-sekka",
    number: "01",
    title: "FI EL SEKKA",
    domain: "VOICE-FIRST AI MOBILITY & AGGREGATOR",
    subtitle:
      "Reimagining Egyptian intercity mass commuting through 6 months of field research, a strategic pivot away from station bureaucracy, and Egyptian-Arabic Voice & Chat AI matching.",
    role: "Founder & Lead Product Designer (0→1 · UX/UI & Flutter)",
    timeline: "0→1 Product Build · Live on App Store",
    platform: "iOS & Flutter",
    market: "Egypt (Mass Commuters & Bus Routes)",
    status: "Live on Apple App Store",
    accentColor: "#D7E140",
    stageBg: "#1E2019",
    cardBg: "#1A1A1A",
    summary: {
      problemBrief:
        "Peak-hour bottlenecks at Egyptian transit hubs leave students risking missed exams and workers arriving late while fragmented bus companies force manual phone-by-phone searches.",
      roleScope:
        "Owned ~90% end-to-end: 6 months field research, Creativa pitch validation, business-model pivot, brand identity, AI voice/chat UX, Flutter build & App Store launch.",
      keyOutcome:
        "Pivoted into an 'inDrive for mass commuting' + intercity bus API aggregator (5–10% commission model) shipped live on the Apple App Store.",
      deliverables:
        "Field Research · Business Pivot · Voice & Chat AI UX · QR Boarding Pass · Flutter Production App",
    },
    context:
      "Premium ride-hailing apps target private commuters—leaving everyday Egyptian students and workers stranded in peak-hour queues at regional hubs like El-Salam and Bilbeis. Over 6 months on the ground, I interviewed 20+ drivers and station supervisors plus 50+ daily commuters, followed by a 4-day Creativa (ITIDA/TIEC) validation and pitch sprint that reshaped the entire product.",
    problem: {
      headline:
        "Why did V1 hub digitization fail on the ground—and how do we fix daily rush-hour uncertainty without station politics?",
      body: "My initial V1 concept aimed to integrate directly inside official government transit hubs (المواقف) and station offices. Field interviews revealed hard institutional and operational friction that made station-owned adoption impossible to scale. Meanwhile, intercity travelers also struggled calling operators like Go Bus, Blue Bus, and Otobeesy one by one just to check open seats.",
      painPoints: [
        "Students miss exams and workers miss shifts due to unpredictable rush-hour queues and unscheduled departures.",
        "Independent shuttle drivers lose hours waiting idle at hubs or departing half-empty because next-day rider demand isn't visible ahead of time.",
        "Passengers booking intercity buses bounce across fragmented operators with no unified seat & schedule visibility.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Everyday commuters declare tomorrow's trip naturally in Egyptian Arabic via voice or text, verify their driver ahead of time, or book unified intercity operator seats in one place.",
      businessStakes:
        "Bypassing station bureaucracy created a scalable dual revenue model: direct automated supply-demand matching for independent drivers ('inDrive for mass transit') plus a 5–10% commission on partner bus API bookings.",
    },
    constraints: [
      "Blocked from direct integration inside government-run transit hubs—requiring a driver-first & API-aggregator pivot.",
      "Everyday commuters and independent drivers need minimal cognitive load rather than dense 8-dropdown booking forms.",
      "Egyptian Arabic dialect & voice input handling paired with mixed RTL/Latin strings (currency, time, ticket codes).",
      "Offline-resilient QR pass and vehicle verification for low-signal transit pickup zones.",
    ],
    explorations: [
      {
        label: "Option A — Official Transit Hub Digitization (V1)",
        approach:
          "Partner directly with physical hub offices and station supervisors to digitize departure queues.",
        verdict: "Rejected",
        rationale:
          "6 months of interviews across El-Salam and Bilbeis hubs proved institutional and regulatory friction blocked scalable adoption on the ground.",
      },
      {
        label: "Option B — Traditional Multi-Step Bus Search Form",
        approach:
          "Require commuters and drivers to navigate 6–8 nested dropdowns for city, hub, exact date, time window, operator, and seat count.",
        verdict: "Rejected",
        rationale:
          "Added heavy form fatigue for rushed students and drivers managing schedules between trips.",
      },
      {
        label: "Option C — Egyptian-Arabic Voice & Chat AI + Structured QR Pass (V2)",
        approach:
          "Let riders and drivers state availability/demand naturally in Arabic (via Live Voice Orb or Chat), auto-match supply & demand alongside partner bus APIs, and lock results into a structured QR pass.",
        verdict: "Chosen",
        rationale:
          "Matched natural Egyptian speech ('محتاج رحلة بكرة من السلام لبلبيس'), eliminated deep menus, and unified independent drivers with Go Bus / Blue Bus / Otobeesy APIs.",
      },
    ],
    designDecisions: [
      {
        title: "Calm AI Prompt Home ('إزاي أقدر أساعدك النهارده') + Persistent Wallet",
        rationale:
          "Replaces noisy transport dashboards with one clear conversational entry point while keeping digital EGP wallet balance visible at the top.",
      },
      {
        title: "Live Egyptian-Arabic Voice AI Orb Mode",
        rationale:
          "Supports hands-free voice requests and real-time transcript confirmation so commuters walking or drivers between trips immediately verify route, captain, car, and fare.",
      },
      {
        title: "Graceful Recovery & Structured QR Boarding Receipt",
        rationale:
          "Handles empty schedules clearly without dead ends, while transitioning confirmed matches into a scannable QR ticket with copyable ticket ID, captain details, and vehicle spec.",
      },
      {
        title: "V2 Generative Card Roadmap & 1-Tap Repeat Commute",
        rationale:
          "V1 validated conversational intent with plain-text match replies; V2 upgrades in-thread results into interactive 1-tap 'Select & Pay' cards plus repeat-route shortcuts.",
      },
    ],
    systemsAndHandoff: {
      headline: "90% End-to-End Execution: Brand Geometry to Flutter Production",
      body: "From sketching the path-shaped 'ف' logo and design system tokens to writing ~90% of the Flutter application and shipping to the Apple App Store, owning design and production code let me test real Arabic voice ergonomics on physical devices every single day.",
      highlights: [
        "Unified warm neutral canvas (#FAF8F0), dark high-contrast ticket cards, and lime voice accents across all flows.",
        "Explicit Arabic RTL alignment rules for mixed numeric strings (EGP wallet balances, dates, ticket references).",
        "End-to-end Flutter implementation, real-device testing, and App Store release management.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Shipped live on the Apple App Store (Fi El Sekka) with working Egyptian-Arabic Voice AI, chat booking, wallet visibility, and QR boarding pass.",
        "Grounded in 70+ real field conversations across El-Salam & Bilbeis hubs and refined through a 4-day Creativa (ITIDA/TIEC) pitch validation sprint.",
      ],
      nextMetricsToTrack: [
        "Automated rider-to-driver match fill rate (%) on peak morning corridors.",
        "Voice AI vs. text chat booking completion ratio across daily commuters.",
        "Partner bus API booking volume and 5–10% commission conversion rate.",
      ],
    },
    media: {
      layout: "mobile",
      bgImage: "/images/projects/fielsekka-bg.webp",
      mobileScreens: [
        "/images/projects/fielsekka-3.webp",
        "/images/projects/fielsekka-1.webp",
        "/images/projects/fielsekka-2.webp",
      ],
    },
    liveLinks: [
      {
        type: "appStore",
        label: "App Store",
        href: "https://apps.apple.com/eg/app/fi-el-sekka/id6813012849",
      },
    ],
  },
  tride: {
    slug: "tride",
    number: "02",
    title: "TRIDE",
    domain: "TWO-SIDED SCHOOL MOBILITY · COREVINE",
    subtitle:
      "Designing a two-sided Parent & Driver mobile platform where busy families book shared seats or pool 4–5 neighborhood and sibling children into a dedicated daily school car.",
    role: "Product & UI/UX Designer (Corevine Squad)",
    timeline: "Dual-Store Delivery · Corevine",
    platform: "iOS & Android (Parent + Driver Apps)",
    market: "Egypt (West Cairo / School Corridors)",
    status: "Live on App Store & Google Play",
    accentColor: "#FFA81D",
    stageBg: "#182128",
    cardBg: "#122535",
    summary: {
      problemBrief:
        "Working parents lacked a safe, structured way to arrange door-to-door school commutes or split a dedicated car among siblings and neighbors.",
      roleScope:
        "Owned UX architecture and UI design for both Parent and Driver apps at Corevine—collaborating directly 1:1 with the Founder (a Bosta Product Manager) and mobile engineers.",
      keyOutcome:
        "Launched live across both Apple App Store and Google Play with active family adoption; built ongoing product partnership with the PM founder.",
      deliverables:
        "PM Discovery Alignment · Two-Sided App Flows · Group Carpool UX · Dual-Store UI Handoff",
    },
    context:
      "Built inside Corevine, Tride was founded by an experienced Product Manager from Bosta who explicitly asked to collaborate 1:1 with the Product Designer shaping the product. Unlike standard ride-hailing, Tride connects Parents and vetted Drivers across two synchronized apps to handle daily doorstep-to-school routines—letting parents either book a single seat or pool 4–5 kids (their own children, relatives, or neighbors) into a shared private car.",
    problem: {
      headline:
        "How do you turn multi-child, multi-household school carpooling into a calm, trustworthy mobile booking flow?",
      body: "Parents short on morning time face a costly gap: hiring a solo private driver is expensive, while informal WhatsApp carpools break down around pickup times, seat counts, and driver accountability. Putting carpool grouping, seat capacity, doorstep pins, and school matching into one intuitive flow—while aligning cleanly with the Driver app—was the central UX challenge.",
      painPoints: [
        "Confusion between booking an individual shared seat vs. reserving a full 4–5 seat private car for a family or neighborhood group.",
        "Friction coordinating multiple children (siblings, cousins, or neighbor kids) going to the same school under one booking.",
        "High emotional stakes around child safety requiring reassuring visual clarity before parents commit a semester schedule.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Busy parents gain reliable daily doorstep pickup and afternoon return while splitting private-car costs cleanly with relatives or neighbors.",
      businessStakes:
        "Structured 4–5 child group bookings give fleet operations full-vehicle utilization and clean routing inputs directly inside the Driver app.",
    },
    constraints: [
      "Two synchronized applications (Parent App & Driver App) built for iOS and Android parity inside a software-house delivery schedule.",
      "Must support solo-child families and 4–5 child neighbor/relative groups without intimidating single-child parents.",
      "High trust visual language balancing warm reassurance with clean mobile readability.",
      "Design-and-handoff role: engineering team owned production implementation while design owned flows, UI clarity, and client iterations.",
    ],
    explorations: [
      {
        label: "Option A — Instant Map-First Taxi Flow (Uber-style)",
        approach:
          "Drop parents straight into a live street map asking for immediate pickup and drop-off pins.",
        verdict: "Rejected",
        rationale:
          "Mismatched parent mental models—families first decide between renting a private car vs. booking a seat and which kids are riding together before picking locations.",
      },
      {
        label: "Option B — Single-Child Rigid Booking Form",
        approach:
          "Treat each child as an isolated passenger requiring separate checkouts.",
        verdict: "Rejected",
        rationale:
          "Broke the core family and neighborhood carpooling model where one parent coordinates 4–5 seats together.",
      },
      {
        label: "Option C — Capacity-Based Progressive Flow (Plan -> Group Slots -> Route Anchors)",
        approach:
          "Start with trust-led onboarding, then step cleanly through Ride Type (Book Car vs Book Seat), modular 5-slot group addition, and paired Home Pin + School selection.",
        verdict: "Chosen",
        rationale:
          "Mirrored how parents actually organize school runs ('we need a car for our 4 kids from home to X school') while supplying clean routing inputs to the Driver app.",
      },
    ],
    designDecisions: [
      {
        title: "Visual Binary Cards for 'Book Car' vs 'Book Seat'",
        rationale:
          "Large iconographic cards immediately separate private full-car rentals (4–5 seats) from single shared seat bookings on tap one.",
      },
      {
        title: "5-Seat Modular Child Slots for Siblings & Neighbors",
        rationale:
          "Visually communicates carpool capacity in context so parents can attach their own children alongside relatives' or neighbors' kids in one unified group.",
      },
      {
        title: "Paired Doorstep Pin & Verified School Selector",
        rationale:
          "Combines precise residential pickup coordinates with standardized partner school entries so drivers receive clean morning and afternoon route lists.",
      },
    ],
    systemsAndHandoff: {
      headline: "Direct 1:1 PM alignment and cross-platform Figma handoff",
      body: "Working directly alongside a Bosta Product Manager let us align business edge cases early—before engineering began—ensuring Parent inputs mapped cleanly to Driver-side pickup cards, reusable form controls, and consistent amber CTA states across iOS and Android.",
      highlights: [
        "Reusable Figma card, slot, and picker patterns maintained across Parent & Driver journeys.",
        "Iterated directly with the PM founder and Corevine engineers across client feedback rounds.",
        "Delivered dual-platform production specs shipped cleanly to Apple App Store and Google Play.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Shipped live on both Apple App Store and Google Play through Corevine with active parent usage in Egypt.",
        "Built lasting product trust with the founder/PM—who continues collaborating for product feedback on subsequent ventures (post-launch internal analytics stayed with the client).",
      ],
      nextMetricsToTrack: [
        "Completion split between full-car group bookings (4–5 kids) and single-seat bookings.",
        "Drop-off diagnostics between child group setup and school route selection.",
        "Semester renewal rate and daily morning/afternoon on-time pickup reliability.",
      ],
    },
    media: {
      layout: "mobile",
      bgImage: "/images/projects/tride-bg.webp",
      mobileScreens: [
        "/images/projects/tride-2.webp",
        "/images/projects/tride-1.webp",
        "/images/projects/tride-3.webp",
      ],
    },
    liveLinks: [
      {
        type: "appStore",
        label: "App Store",
        href: "https://apps.apple.com/eg/app/tride-egypt/id6749056619",
      },
      {
        type: "googlePlay",
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.corevine.trideuser&pcampaignid=web_share",
      },
    ],
  },
  "active-platform": {
    slug: "active-platform",
    number: "03",
    title: "ACTIVE",
    domain: "B2B CREATOR MARKETPLACE & ANALYTICS · KSA",
    subtitle:
      "Migrating an established Saudi brand-and-influencer network out of chaotic WhatsApp groups into a unified Web, Brand Dashboard, and Flutter marketplace powered by audience fraud analytics and MyFatoorah payments.",
    role: "Product Designer & Flutter Contributor",
    timeline: "Multi-Surface Production · KSA",
    platform: "Web · Brand Dashboard · Flutter Mobile App",
    market: "Saudi Arabia (Brands & Creators)",
    status: "Live Production Platform",
    accentColor: "#89288f",
    stageBg: "#1a092b",
    cardBg: "#ffffff",
    summary: {
      problemBrief:
        "A Saudi operator with a large active roster of brands and influencers ran every campaign through messy WhatsApp groups—with zero follower-authenticity data or automated payouts.",
      roleScope:
        "Shaped UX/UI improvements and shipped continuous product features across the Flutter mobile app, Web portal, and Brand Dashboard.",
      keyOutcome:
        "Live in Saudi Arabia from Day 1 with real brands and creators transacting through third-party fake-follower analytics, campaign bidding, and MyFatoorah checkout.",
      deliverables:
        "Multi-Surface UX · Analytics Data Display · MyFatoorah Payment Flow · Flutter Feature Delivery",
    },
    context:
      "Active began with a Saudi founder who already had strong real-world deal flow—hundreds of brands and influencers working together—but every brief, negotiation, and deliverable lived inside scattered WhatsApp chats. We transformed that manual operation into a full multi-surface digital ecosystem spanning a Public Web Flagship, a Brand Analytics Dashboard, and a Flutter Mobile App.",
    problem: {
      headline:
        "How do you replace messy WhatsApp deal-making with transparent, fraud-checked creator hiring and GCC checkout?",
      body: "Scaling beyond manual agency chats exposed three bottlenecks: brands couldn't tell if an influencer's followers were real or fake, creators had no structured storefront for their services, and collecting payments manually slowed down campaign launches.",
      painPoints: [
        "WhatsApp-group operations collapsed as concurrent brand campaigns and creator applications scaled.",
        "Brands lacked trustworthy audience insights (real vs. fake followers, customer demographics) and paid on guesswork.",
        "No standardized service pricing, application tracking, post-campaign brand ratings, or GCC online checkout.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Brands vet creators in seconds using verified audience authenticity and past brand feedback, while creators manage service packages and apply to live briefs directly from mobile.",
      businessStakes:
        "Integrating MyFatoorah automated GCC payments, eliminated manual coordination overhead, and unlocked scalable campaign volume from Day 1 of launch.",
    },
    constraints: [
      "Must convert existing non-technical WhatsApp clients smoothly on Day 1 without steep onboarding friction.",
      "Distill dense third-party social analytics APIs (fake followers, audience segments, demographics) into clear hiring signals.",
      "Seamless Saudi Arabic RTL experience across Web, Dashboard, and Flutter mobile builds.",
      "Reliable GCC payment compatibility through MyFatoorah (Mada, Apple Pay, cards).",
    ],
    explorations: [
      {
        label: "Option A — Simple Landing Form + Manual WhatsApp Ops",
        approach:
          "Capture brand leads on a marketing site while account managers continue vetting and matching creators via WhatsApp.",
        verdict: "Rejected",
        rationale:
          "Left the core operational bottleneck untouched and couldn't scale fake-follower verification or payments.",
      },
      {
        label: "Option B — Vanity Follower-Count Marketplace",
        approach:
          "Rank creators publicly by total follower count like generic influencer directories.",
        verdict: "Rejected",
        rationale:
          "Contradicted Active's core value proposition and exposed Saudi brands to inflated, low-ROI accounts.",
      },
      {
        label: "Option C — Analytics-First Marketplace + MyFatoorah Loop",
        approach:
          "Integrate third-party audience & fake-follower analytics directly inside Brand profiles, let creators list services & bid via Flutter, and close payments via MyFatoorah.",
        verdict: "Chosen",
        rationale:
          "Solved trust (verified real audiences + brand feedback), velocity (mobile bidding), and monetization (MyFatoorah) in one connected loop.",
      },
    ],
    designDecisions: [
      {
        title: "Objection-Breaking Web Hero ('حملتك تحتاج الأنسب مش الأشهر')",
        rationale:
          "Addresses Saudi marketers' #1 skepticism immediately on the web landing page while routing Creators through a distinct outlined nav entry.",
      },
      {
        title: "Decision-Ready Creator Analytics Cards",
        rationale:
          "Surfaces third-party API metrics cleanly—fake vs. real follower integrity, audience demographics, and verified brand feedback—without overwhelming marketers.",
      },
      {
        title: "Structured Service Storefront & Campaign Bidding in Flutter",
        rationale:
          "Gives influencers a clean mobile workspace to publish service rates, apply to relevant brand briefs, and track feedback loops.",
      },
      {
        title: "Integrated MyFatoorah Payment & Brand Review Loop",
        rationale:
          "Standardizes GCC checkout while feeding post-campaign brand ratings straight back into creator credibility scores.",
      },
    ],
    systemsAndHandoff: {
      headline: "Rapid cross-surface iteration across Web, Dashboard & Flutter",
      body: "Contributing directly across UX improvements, Web/Dashboard layouts, and Flutter feature implementation meant client feedback and live market needs translated into shipped features rapidly—without traditional design-to-dev translation loss.",
      highlights: [
        "Unified Saudi Arabic RTL typography and status patterns across Web, Dashboard, and Flutter.",
        "Structured API data hierarchy turning third-party follower diagnostics into clear visual cards.",
        "Continuous post-launch feature shipping driven by active Saudi brands and creators.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Running live in production in Saudi Arabia across Web (`activksa.com/brands`), Brand Dashboard, and Flutter mobile app.",
        "Active brands and creators migrated off manual WhatsApp groups and transacted from Day 1 of launch, supported by continuous feature releases.",
      ],
      nextMetricsToTrack: [
        "Time-to-hire from brand campaign brief creation to creator match approval.",
        "Campaign conversion lift when brands inspect fake-follower authenticity vs. unverified profiles.",
        "Repeat brand campaign rate and MyFatoorah checkout completion rate.",
      ],
    },
    media: {
      layout: "desktop",
      bgImage: "/images/projects/active-bg.webp",
      posterSrc: "/images/projects/active-poster.webp",
      videoSrc: "/videos/projects/active-tour.mp4",
    },
    liveLinks: [
      {
        type: "web",
        label: "Live Website",
        href: "https://activksa.com/brands/",
      },
    ],
  },
  malahi: {
    slug: "malahi",
    number: "04",
    title: "MALAHI",
    domain: "ENTERPRISE 3D WEB & TICKETING · KSA",
    subtitle:
      "Rebuilding a broken legacy site for one of Saudi Arabia’s largest entertainment groups—balancing age-segmented brand discovery (Lamby, Wanoos, Fazz, Doos), 3D motion, and fast online ticket checkout.",
    role: "Product & UX/UI Designer (Agency Squad · New Capital)",
    timeline: "Enterprise Web Relaunch · KSA",
    platform: "Responsive Interactive Web (AR / EN)",
    market: "Saudi Arabia (Family & Youth Entertainment)",
    status: "Live Production Website & Ticketing",
    accentColor: "#059969",
    stageBg: "#081018",
    cardBg: "#0b0d12",
    summary: {
      problemBrief:
        "One of Saudi Arabia's biggest entertainment operators had a broken legacy site unable to organize its sprawling age-segmented destinations or support smooth online booking.",
      roleScope:
        "Owned UX architecture, UI design, AI Vibe-Coding motion prototypes, and iterative back-and-forth engineering collaboration on 3D/video loading performance.",
      keyOutcome:
        "Shipped a fast, interactive flagship portal at malahi.com showcasing every sub-brand clearly while powering live online bookings and payments across KSA.",
      deliverables:
        "Multi-Brand IA · Age-Segmented UX · AI Vibe-Coded Prototypes · Media Performance Optimization",
    },
    context:
      "Created inside a design agency in Egypt's New Administrative Capital for Malahi—one of Saudi Arabia's largest entertainment companies. The existing legacy site was visually broken and failed to explain a wide portfolio spanning distinct age groups: infants & crawlers (Lamby), kids arcade parks (Wanoos), active jumping attractions (Fazz), karting & racing (Doos / Garage), and mall relaxation massage-chair services for parents.",
    problem: {
      headline:
        "How do you deliver jaw-dropping 3D storytelling for 5+ age-segmented venues without crushing load speed or burying ticket payments?",
      body: "Agency stakeholders demanded rich 3D depth, playful character presence, and video storytelling—yet unoptimized 3D/video sites stall on mobile networks and frustrate families trying to check venue details and buy tickets quickly.",
      painPoints: [
        "Broken legacy layout failed to communicate the breadth of Malahi's venues or explain what each program actually offers.",
        "Parents didn't immediately see which destination fit toddlers (Lamby) vs. older kids (Wanoos/Fazz) vs. racing youth (Doos/Garage) vs. parent mall massage zones.",
        "Heavy 3D and video assets risked sluggish loading states that hurt real booking conversion.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Saudi families immediately understand which destination fits each family member's age, explore each venue interactively, and book tickets in just a few clicks.",
      businessStakes:
        "Protected Malahi's position as a premier Saudi entertainment brand while driving cross-venue discovery directly into paid online ticket checkout.",
    },
    constraints: [
      "Strict visual craft & 3D animation expectations set by an agency environment prioritizing polish and spatial balance.",
      "Clear Information Architecture across multiple distinct sub-brands targeted at completely different age brackets.",
      "High-volume video and 3D assets must load cleanly and stay responsive so booking flows never lag.",
      "Full Arabic RTL flagship parity paired with seamless English switching and persistent online payment entry.",
    ],
    explorations: [
      {
        label: "Option A — Flat Static Corporate Directory",
        approach:
          "Strip away 3D and video into plain editorial cards to maximize raw page speed.",
        verdict: "Rejected",
        rationale:
          "Eliminated the emotional magic and brand stature expected from Saudi Arabia's leading entertainment destination.",
      },
      {
        label: "Option B — Heavy Uncompressed 3D & Video Wall",
        approach:
          "Load high-bitrate video backgrounds and heavy interactive layers upfront across every section.",
        verdict: "Rejected",
        rationale:
          "Caused heavy loading bottlenecks that degraded user experience and risked dropping mobile ticket buyers.",
      },
      {
        label: "Option C — Age-Mapped Interactive Stage + Vibe-Coded Motion + Tuned Performance",
        approach:
          "Unite all venues inside a clean 3D hero stage with a persistent sub-brand dock rail, validate interactions via AI Vibe-Coding prototypes, and tune video/media delivery directly with engineers.",
        verdict: "Chosen",
        rationale:
          "Delivered memorable 3D craft alongside clear program explanations, persistent ticket booking, and snappy real-world loading.",
      },
    ],
    designDecisions: [
      {
        title: "Age-Segmented Sub-Brand Architecture & Persistent Dock Rail",
        rationale:
          "Maps Lamby (toddlers), Wanoos (kids arcade), Fazz (active jumping), Doos/Garage (karting & racing), and parent relaxation offerings clearly so visitors switch venues effortlessly.",
      },
      {
        title: "Persistent Top Utility & Ticket Action Cluster",
        rationale:
          "Locks menu, AR/EN toggle, theme switch, and the green direct-ticketing button in one reachable corner throughout exploration.",
      },
      {
        title: "Interactive Program Explainers Before Booking",
        rationale:
          "Dedicated interactive sections show what each destination includes so families choose confidently before entering checkout.",
      },
    ],
    systemsAndHandoff: {
      headline: "AI Vibe-Coding Prototypes & Engineering Performance Partnership",
      body: "Instead of tossing static Figma frames over the wall, I built working interactive prototypes using AI Vibe Coding to demonstrate exact motion timing and spatial feel—then worked iteratively back-and-forth with front-end developers to optimize video compression, asset loading, and smooth frame pacing.",
      highlights: [
        "Built functional AI Vibe-Coded motion prototypes to align stakeholders and engineers before final build.",
        "Direct back-and-forth optimization with front-end developers on heavy video & 3D loading performance.",
        "Responsive bilingual Arabic RTL / English layout polish across desktop and mobile.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Shipped live at malahi.com as a major enterprise portal serving one of Saudi Arabia's largest entertainment operators.",
        "Actively handles high visitor traffic, interactive brand exploration, online ticket bookings, and live payments.",
      ],
      nextMetricsToTrack: [
        "Mobile Largest Contentful Paint (LCP) & media load latency vs. bounce rate.",
        "Sub-brand dock rail click distribution across Lamby, Wanoos, Fazz, and Doos.",
        "Funnel conversion from brand exploration screens into completed online ticket payments.",
      ],
    },
    media: {
      layout: "desktop",
      bgImage: "/images/projects/malahi-bg.webp",
      posterSrc: "/images/projects/malahi-poster.webp",
      videoSrc: "/videos/projects/malahi-tour.mp4",
    },
    liveLinks: [
      {
        type: "web",
        label: "Live Website",
        href: "https://malahi.com/ar",
      },
    ],
  },
};

export function getCaseStudyBySlug(slug: string): CaseStudyDetail | null {
  if ((CASE_STUDY_SLUGS as readonly string[]).includes(slug)) {
    return CASE_STUDIES[slug as CaseStudySlug];
  }
  return null;
}

export function getNextCaseStudy(slug: CaseStudySlug): CaseStudyDetail {
  const idx = CASE_STUDY_SLUGS.indexOf(slug);
  const nextSlug = CASE_STUDY_SLUGS[(idx + 1) % CASE_STUDY_SLUGS.length];
  return CASE_STUDIES[nextSlug];
}
