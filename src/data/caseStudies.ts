export type CaseStudySlug =
  | "fi-el-sekka"
  | "tride"
  | "active-platform"
  | "malahi"
  | "yusr-academy";

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
  "yusr-academy",
];

export const CASE_STUDIES: Record<CaseStudySlug, CaseStudyDetail> = {
  "fi-el-sekka": {
    slug: "fi-el-sekka",
    number: "01",
    title: "FI EL SEKKA",
    domain: "INTERCITY MOBILITY & QR TICKETING",
    subtitle:
      "Replacing chaotic cash-and-queue intercity shuttle boarding in Egypt with guaranteed seat booking, digital wallet balance, and zero-tap QR validation.",
    role: "Lead Product Designer (End-to-End UX/UI & Flutter UI Partner)",
    timeline: "Product Launch · 2025",
    platform: "iOS & Android (Flutter)",
    market: "Egypt (Intercity Commuters)",
    status: "Live on Apple App Store",
    accentColor: "#D7E140",
    stageBg: "#1E2019",
    cardBg: "#1A1A1A",
    summary: {
      problemBrief:
        "Daily intercity commuters faced unverified departures, cash friction, and uncertain seat availability at physical stops.",
      roleScope:
        "Owned commuter UX architecture, booking & QR boarding flow, wallet visibility, captain trust cards, and mobile UI handoff.",
      keyOutcome:
        "Shipped live consumer & driver booking experience on the Apple App Store uniting wallet balance, route summary, and instant QR pass.",
      deliverables:
        "User Flows · Edge-State Mapping · High-Fidelity Mobile System · Flutter Production QA",
    },
    context:
      "Fi El Sekka serves daily commuters and university students traveling regional Egyptian corridors (such as Bilbeis to El-Salam). Unlike occasional ride-hailing trips, riders travel under tight morning schedules at crowded transit hubs where speed, fare clarity, and certainty about the vehicle and driver determine retention.",
    problem: {
      headline:
        "How might a rushed commuter confirm a seat, verify the captain, and board in seconds at a noisy station?",
      body: "Traditional shuttle stations force riders to negotiate fares in cash, guess whether a seat is still open, and walk through parked vans trying to identify the right vehicle. Even early digital booking concepts fail if the active ticket is buried two or three taps deep when the rider reaches the van door.",
      painPoints: [
        "High boarding anxiety at crowded hubs when commuters cannot quickly verify vehicle details and captain identity.",
        "Buried digital tickets cause queues at the door when riders fumble through tabs under glare or weak cellular signal.",
        "Split mental models between wallet balance, trip price, departure time, and route stops create hesitation before booking.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Commuters save morning wait uncertainty, verify the captain and vehicle ahead of arrival, and keep exact ticket cost and seat number visible at a glance.",
      businessStakes:
        "Faster per-passenger boarding cuts station dwell time for captains, encourages repeat wallet top-ups, and lowers cash-handling disputes for operations.",
    },
    constraints: [
      "Arabic RTL-first typography paired cleanly with Latin numbers, currency (EGP), and ticket codes.",
      "High-contrast readability outdoors under harsh daylight at transit hubs.",
      "Active ride state must remain effortless for first-time digital commuters, not just tech-savvy users.",
      "Two-sided operational coordination between passenger app and captain verification workflow.",
    ],
    explorations: [
      {
        label: "Option A — Deep Seat-Map Wizard",
        approach:
          "Multi-step flow with an interactive 14-seat van schematic and hidden ticket tab after checkout.",
        verdict: "Rejected",
        rationale:
          "Added 3 extra taps per daily commute and slowed repeat riders down without improving actual boarding speed on standard shuttle vans.",
      },
      {
        label: "Option B — Bottom-Nav Ticket Drawer",
        approach:
          "Standard e-commerce dashboard where active trips live strictly inside a secondary 'My Trips' tab.",
        verdict: "Rejected",
        rationale:
          "Failed the station-door stress test: riders standing in line had to navigate away from home while checking route stops and captain info.",
      },
      {
        label: "Option C — Home-First Active Boarding Card + QR",
        approach:
          "Surface the next upcoming trip directly on Home with expandable QR pass, seat number, departure time, route corridor, and captain verification card.",
        verdict: "Chosen",
        rationale:
          "Balanced zero-tap boarding readiness with full trip context—wallet balance sits at top left, active QR sits one thumb reach away, and vehicle verification stays anchored below.",
      },
    ],
    designDecisions: [
      {
        title: "Dark High-Contrast Boarding Card on Warm Neutral Canvas",
        rationale:
          "Separates the active ticket from surrounding route and captain cards so commuters immediately spot departure time, date, fare, and the QR toggle icon.",
      },
      {
        title: "Persistent Wallet Pill & Centered Primary Booking CTA",
        rationale:
          "Surfaces available EGP balance in the header without cluttering the ticket body, while anchoring the elevated lime '+' booking trigger in the bottom bar.",
      },
      {
        title: "Dedicated Captain & Vehicle Identity Strip",
        rationale:
          "Displays captain rating, verified badge, and exact van model/roof spec right below the route corridor to eliminate station guesswork before boarding.",
      },
    ],
    systemsAndHandoff: {
      headline: "Designing directly for Flutter constraints and real-device ergonomics",
      body: "Because I understand Flutter widget trees and layout behavior, component spacing, dynamic Arabic/English text wrapping, and QR state transitions were specified with production implementation in mind from day one.",
      highlights: [
        "Unified spacing scale and reusable card primitives across Home, Upcoming Trip, Route Corridor, and Captain cards.",
        "Explicit Arabic RTL alignment rules for mixed numeric strings (currency, time, seat counts, ticket IDs).",
        "Direct visual QA against live iOS builds prior to App Store submission.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Shipped live on the Apple App Store as Fi El Sekka for Egyptian intercity riders alongside a companion captain flow.",
        "Unified digital wallet top-up visibility, instant QR seat boarding pass, and captain verification into a single home surface.",
      ],
      nextMetricsToTrack: [
        "Median time from app open to QR scan completion at station boarding.",
        "Repeat weekly commuter retention after first wallet-funded trip vs cash trips.",
        "Support ticket reduction around wrong-vehicle or missed-pickup incidents.",
      ],
    },
    media: {
      layout: "mobile",
      bgImage: "/images/projects/fielsekka-bg.webp",
      mobileScreens: [
        "/images/projects/fielsekka-1.webp",
        "/images/projects/fielsekka-2.webp",
        "/images/projects/fielsekka-3.webp",
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
    domain: "SCHOOL MOBILITY & PARENT TRUST",
    subtitle:
      "Structuring a calm, high-trust school commute booking flow for parents managing multiple children, flexible car or seat plans, and verified routes.",
    role: "UI/UX & Product Designer at Corevine",
    timeline: "Product Delivery · Corevine",
    platform: "iOS & Android",
    market: "Egypt (West Cairo / School Corridors)",
    status: "Live on App Store & Google Play",
    accentColor: "#FFA81D",
    stageBg: "#182128",
    cardBg: "#122535",
    summary: {
      problemBrief:
        "Parents arranging daily school rides had to juggle informal carpools or fragmented driver chats without structured multi-child plans.",
      roleScope:
        "Designed onboarding clarity, plan-type selection (full car vs seat), multi-child booking configuration, and pickup/school location pairing.",
      keyOutcome:
        "Launched across both Apple App Store and Google Play through Corevine, enabling parents to configure recurring school commutes digitally.",
      deliverables:
        "Onboarding Architecture · Subscription Booking Flow · Multi-Child Configuration · Mobile UI System",
    },
    context:
      "Tride is a specialized school transportation app built at Corevine for parents in areas like October and Sheikh Zayed. Unlike on-demand ride-hailing where price and convenience dominate, school mobility is an emotional, high-stakes trust decision made for an entire semester.",
    problem: {
      headline:
        "How do you turn a complex multi-child, multi-stop recurring transport setup into a clear 60-second booking flow?",
      body: "Parents may book a dedicated private car or individual shared seats, attach one or several children, and map exact home pickup coordinates to specific school drop-offs. Cramming subscription pricing, driver vetting, child profiles, and route picking onto one screen overwhelms busy parents.",
      painPoints: [
        "Confusion between booking an entire private car versus individual shared seats for siblings.",
        "Friction entering home pickup locations and matching verified partner schools accurately.",
        "Trust hesitation during onboarding before a parent commits a child's daily schedule to a platform.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Parents get predictable, transparent setup for one or multiple kids without WhatsApp back-and-forth or vague route commitments.",
      businessStakes:
        "Clear upfront plan & child configuration directly determines checkout completion and gives fleet operations clean routing inputs from day one.",
    },
    constraints: [
      "Dual-platform mobile conventions for iOS and Android under Corevine engineering timelines.",
      "Support both 1-child families and multi-child households cleanly without cluttering the form.",
      "High visual reassurance (warm amber brand language + clean whitespace) appropriate for family safety.",
      "Bilingual address/location handling (Google Maps pickup pins paired with school selection).",
    ],
    explorations: [
      {
        label: "Option A — Single-Screen Long Form",
        approach:
          "Place ride type, child details, payment plan, and map pickers inside one continuous scrolling form.",
        verdict: "Rejected",
        rationale:
          "Felt heavy on mobile viewports and caused drop-off anxiety before parents even locked their pickup and school corridor.",
      },
      {
        label: "Option B — Map-First Ride Hailing Clone",
        approach:
          "Open straight into a live Uber-style map asking for immediate pickup and drop-off pins.",
        verdict: "Rejected",
        rationale:
          "Mismatched parent mental models—parents first decide whether they want a private car or shared seats and which children are riding before picking map coordinates.",
      },
      {
        label: "Option C — Progressive Configuration Flow",
        approach:
          "Lead with trust-centered onboarding, then step cleanly through Ride Type (Car vs Seat) -> Child Slots -> Home & School Locations -> Review.",
        verdict: "Chosen",
        rationale:
          "Matched how parents naturally explain their needs ('I need a seat/car for my two kids from home to X school') while keeping each decision lightweight.",
      },
    ],
    designDecisions: [
      {
        title: "Binary Visual Cards for Private Car vs Shared Seat",
        rationale:
          "Large iconographic toggle cards prevent mis-taps and immediately clarify the core pricing/privacy model before any personal data is requested.",
      },
      {
        title: "Modular Child Profile Slots Right Under Ride Type",
        rationale:
          "Allows parents to add one or multiple children in context before entering routes, eliminating duplicate forms for siblings going to the same school.",
      },
      {
        title: "Dedicated Parent Pin + Verified School Selector Pairing",
        rationale:
          "Separates flexible residential map pinning from curated school dropdowns so operations receive accurate, standardized destination anchors.",
      },
    ],
    systemsAndHandoff: {
      headline: "Cross-platform mobile components shipped with Corevine engineers",
      body: "Designed reusable selection cards, form pickers, and consistent button states in Figma, partnering closely with Corevine's mobile developers to verify keyboard handling, safe-area padding, and store build fidelity.",
      highlights: [
        "Unified component states (default, selected amber highlight, disabled, error validation) across onboarding and booking.",
        "Clean visual hierarchy balancing warm brand amber (#FFA81D) strictly for primary actions and active states.",
        "Iterative polish reviews prior to dual App Store & Google Play release.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Successfully launched Tride on both Apple App Store and Google Play via Corevine.",
        "Delivered a complete parent booking journey supporting both private car and shared seat plans.",
      ],
      nextMetricsToTrack: [
        "Booking step-by-step funnel drop-off from Ride Type selection to final confirmation.",
        "Ratio of multi-child bookings completed in a single session vs support-assisted signups.",
        "Parent satisfaction and first-week pickup punctuality ratings.",
      ],
    },
    media: {
      layout: "mobile",
      bgImage: "/images/projects/tride-bg.webp",
      mobileScreens: [
        "/images/projects/tride-1.webp",
        "/images/projects/tride-3.webp",
        "/images/projects/tride-2.webp",
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
    domain: "INFLUENCER CAMPAIGNS · KSA WEB PLATFORM",
    subtitle:
      "Reframing a Saudi creator-matching platform around audience relevance over vanity reach—guiding brands straight from skepticism to campaign launch.",
    role: "Lead Product Designer (UX Strategy & Web Experience)",
    timeline: "Web Platform Launch · KSA",
    platform: "Responsive Web Platform",
    market: "Saudi Arabia (Brands & Creators)",
    status: "Live Production Website",
    accentColor: "#89288f",
    stageBg: "#1a092b",
    cardBg: "#ffffff",
    summary: {
      problemBrief:
        "Saudi brands waste marketing budgets picking the most famous influencers rather than creators who actually match their audience and budget.",
      roleScope:
        "Defined positioning hierarchy, dual-audience navigation (Brands vs Creators), objection-handling storytelling, and conversion architecture.",
      keyOutcome:
        "Shipped a live Arabic-first web platform on activksa.com/brands aligning creator relevance with fast brand campaign onboarding.",
      deliverables:
        "Information Architecture · Arabic UX Copy Hierarchy · Conversion Landing System · Interactive Video Walkthrough",
    },
    context:
      "Active connects Saudi brands with vetted content creators across niche verticals. In the KSA market, influencer fatigue and inflated mega-celebrity fees made marketing teams skeptical of traditional creator agencies. The web product needed to win trust in seconds and separate Brand entry from Creator onboarding cleanly.",
    problem: {
      headline:
        "How do you convert skeptical Saudi marketing leads while separating Brand campaign flows from Creator sign-ups?",
      body: "Two distinct personas land on the same URL: Brand managers evaluating campaign ROI, and Creators looking to join the network. Generic SaaS templates fail to address the core cultural objection—why 'most relevant' beats 'most famous'—leaving visitors bouncing before starting a campaign.",
      painPoints: [
        "Dual-persona collision: Creators and Brand buyers competing for the same hero CTA.",
        "Low trust in generic influencer directories without clear proof of audience relevance and budget fit.",
        "Arabic marketing copy often suffers from robotic translation rather than persuasive local Saudi phrasing.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Brand managers immediately understand the value proposition in native Saudi Arabic and see a frictionless path to launch without wading through creator sign-up noise.",
      businessStakes:
        "Cleaner top-of-funnel qualification improves lead quality for campaign teams and reduces misrouted creator inquiries.",
    },
    constraints: [
      "Saudi Arabic (RTL) copywriting and visual balance—every section had to feel native to KSA brand teams.",
      "Serve both Brands (primary conversion) and Creators (secondary entry) in one header without cognitive overload.",
      "High-velocity web performance while incorporating interactive motion and campaign previews.",
    ],
    explorations: [
      {
        label: "Option A — Split 50/50 Brand vs Creator Hero",
        approach:
          "Equal dual columns asking visitors 'Are you a Brand or a Creator?' before showing any value.",
        verdict: "Rejected",
        rationale:
          "Forced every high-intent brand buyer through an extra routing gate instead of immediately proving why Active solves their campaign ROI problem.",
      },
      {
        label: "Option B — Public Creator Marketplace Grid Above the Fold",
        approach:
          "Display searchable creator cards immediately on the landing hero.",
        verdict: "Rejected",
        rationale:
          "Encouraged window-shopping on follower counts—directly contradicting Active's core message of curated relevance over popularity.",
      },
      {
        label: "Option C — Editorial Objection-Breaking Hero + Secondary Creator Pill",
        approach:
          "Lead the hero with the crossed-out contrast ('Your campaign needs the Most Relevant, not the Most Famous'), primary Brand CTA, and a clear outlined 'Creator? Register here' pill in the nav.",
        verdict: "Chosen",
        rationale:
          "Tackled the #1 buyer objection in the first 3 seconds while cleanly routing creators via a distinct secondary pill.",
      },
    ],
    designDecisions: [
      {
        title: "Strikethrough Contrast Headline ('الأشهر' -> 'الأنسب')",
        rationale:
          "Visually anchors Active's core thesis in under two seconds, reframing how brand managers judge creator fit.",
      },
      {
        title: "Asymmetric Nav Hierarchy (Solid Brand Login vs Outlined Creator Entry)",
        rationale:
          "Prevents persona confusion in the floating glass navbar while preserving instant access for incoming influencers.",
      },
      {
        title: "Contextual Comparison Module Right Below the Fold",
        rationale:
          "Uses dismissible floating preview cards ('Why choose the most famous..!') to turn skepticism into product curiosity.",
      },
    ],
    systemsAndHandoff: {
      headline: "Arabic RTL web design system built for responsive clarity",
      body: "Structured reusable pill navigation, soft brand-violet radial depth, and responsive RTL grid tokens so sections scale cleanly across desktop and mobile without breaking Arabic typographic rhythm.",
      highlights: [
        "Unified RTL layout grid, rounded CTA hierarchy, and glass pill navbar states.",
        "Interactive motion walkthrough captured to validate pacing before deployment.",
        "Live production QA on activksa.com/brands across desktop and mobile viewports.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Launched live in production for the Saudi market at activksa.com/brands.",
        "Established clear dual-persona routing and objection-first messaging across the platform entry experience.",
      ],
      nextMetricsToTrack: [
        "Primary Brand CTA click-through rate vs Creator nav pill engagement.",
        "Scroll depth through the relevance comparison and social-proof sections.",
        "Lead-to-brief completion rate inside the brand campaign onboarding flow.",
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
    domain: "ENTERTAINMENT & MULTI-BRAND TICKETING · KSA",
    subtitle:
      "Unifying four distinct Saudi entertainment destinations—Wanoos, Doos Karting, Garage, and Remote—into one cohesive discovery and ticketing web flagship.",
    role: "Product & Web Experience Designer",
    timeline: "Live Web Launch · KSA",
    platform: "Responsive Interactive Web (AR / EN)",
    market: "Saudi Arabia (Family & Youth Entertainment)",
    status: "Live Production Website",
    accentColor: "#059969",
    stageBg: "#081018",
    cardBg: "#0b0d12",
    summary: {
      problemBrief:
        "Four sub-brands with wildly different audiences (kids parks vs karting vs arcade venues) needed one unified portal without losing individual identity.",
      roleScope:
        "Architected multi-brand navigation, bilingual AR/EN framing, persistent ticket access, and interactive destination switching.",
      keyOutcome:
        "Shipped live bilingual entertainment hub on malahi.com connecting visitors from brand discovery straight into ticket selection.",
      deliverables:
        "Multi-Brand Architecture · Bilingual Navigation · Destination Rail Pattern · Interactive Web Tour",
    },
    context:
      "Malahi operates diverse entertainment venues across Saudi Arabia—spanning family play (Wanoos), high-speed racing (Doos Karting), gaming (Garage), and immersive experiences (Remote). Visitors often know one venue by name without realizing all four belong to one ecosystem, or struggle to reach tickets quickly from brand storytelling pages.",
    problem: {
      headline:
        "How do you showcase four energetic sub-brands in one flagship without overwhelming families or burying ticket booking?",
      body: "Multi-brand entertainment portals typically fall into two traps: either a sterile corporate directory with zero excitement, or chaotic visual noise where visitors cannot switch between destinations or locate ticket booking.",
      painPoints: [
        "Visitors landing on the parent brand did not immediately grasp the distinct vibe of each venue.",
        "Language switching (Arabic/English) and theme/accessibility controls often break immersive hero layouts.",
        "Ticket CTA gets lost when rich 3D/character artwork dominates the viewport.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Families and youth groups explore all four experiences effortlessly in Arabic or English and jump straight to choosing their outing.",
      businessStakes:
        "Cross-pollinates traffic across Malahi's four venues under one parent brand and reduces friction to the ticketing funnel.",
    },
    constraints: [
      "Full bilingual parity (Arabic RTL primary + English) without breaking spatial overlays.",
      "High-contrast typography and persistent booking action over rich, full-bleed 3D character art.",
      "Instant sub-brand recognition via a compact switcher that stays visible on both desktop and mobile.",
    ],
    explorations: [
      {
        label: "Option A — 4-Column Static Split Grid",
        approach:
          "Divide the initial screen into four vertical strips, one for each sub-brand.",
        verdict: "Rejected",
        rationale:
          "Cramped typography on Arabic viewports, weakened emotional storytelling, and left mobile screens stacking awkwardly.",
      },
      {
        label: "Option B — Corporate Carousel Behind Hamburger Menu",
        approach:
          "Hide sub-brands inside a dropdown menu and keep only a generic parent hero.",
        verdict: "Rejected",
        rationale:
          "Concealed the four destinations—killing cross-discovery between Wanoos, Doos Karting, Garage, and Remote.",
      },
      {
        label: "Option C — Immersive Parent Stage + Persistent Left Brand Rail",
        approach:
          "Lead with one unified flagship hero ('Keep Smiling') paired with a vertical sub-brand dock rail, persistent top-left ticket pill, and single-click 'Choose your fun' CTA.",
        verdict: "Chosen",
        rationale:
          "Maintains emotional brand impact while giving returning visitors one-click access to tickets and direct brand switching.",
      },
    ],
    designDecisions: [
      {
        title: "Vertical Sub-Brand Dock Rail",
        rationale:
          "Displays circular destination badges cleanly on the edge so visitors see all sister venues at a glance without cluttering the center stage.",
      },
      {
        title: "Persistent Top Utility Bar (Menu · Language · Theme · Tickets)",
        rationale:
          "Keeps AR/EN switching and green direct-ticketing icon locked in one predictable corner across every viewport.",
      },
      {
        title: "Dual-Color Arabic Typography & Smile Curve Anchor",
        rationale:
          "Ties the parent tagline ('خلّيك مبتسم') directly into the primary emerald CTA button below, guiding eye flow vertically.",
      },
    ],
    systemsAndHandoff: {
      headline: "Bilingual interactive layout tokens & motion choreography",
      body: "Defined clear contrast overlays, directional RTL/LTR mirroring rules for the navigation rail and utility cluster, and smooth destination transitions aligned with production web constraints.",
      highlights: [
        "Mirrored RTL/LTR utility placement tested across Arabic and English views.",
        "Accessible contrast scrims preserving CTA legibility over bright illustrations.",
        "Production walkthrough verification prior to live release on malahi.com.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Shipped live at malahi.com/ar unifying Wanoos, Doos Karting, Garage, and Remote in one destination hub.",
        "Delivered bilingual AR/EN navigation alongside persistent ticket entry across desktop and mobile.",
      ],
      nextMetricsToTrack: [
        "Cross-brand click-through rates from the vertical sub-brand switcher rail.",
        "Conversion rate from the primary hero CTA into destination ticket checkout.",
        "Bounce rate difference between Arabic RTL and English sessions.",
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
  "yusr-academy": {
    slug: "yusr-academy",
    number: "05",
    title: "YUSR ACADEMY",
    domain: "EDTECH & UX MENTORSHIP PLATFORM",
    subtitle:
      "Positioning an Arabic UI/UX academy around real product thinking and AI-assisted execution—replacing vague course hype with transparent process proof.",
    role: "Product Designer & Curriculum Mentor",
    timeline: "Platform & Mentorship · 2025–2026",
    platform: "Web Platform & Interactive Curriculum",
    market: "MENA (Aspiring & Mid-Level Arab Designers)",
    status: "Live Production Platform",
    accentColor: "#52B285",
    stageBg: "#060F0F",
    cardBg: "#0A1919",
    summary: {
      problemBrief:
        "Arab UI/UX learners distrust theory-heavy bootcamps that graduate students with pretty Dribbble shots instead of hireable case studies.",
      roleScope:
        "Designed the flagship web positioning, interactive UX-process preview widget, dual action hierarchy, and hands-on Vibe Coding mentorship track.",
      keyOutcome:
        "Live platform at yusr-academy.com pairing structured design practice with direct mentorship and production prototyping guidance.",
      deliverables:
        "Product Positioning · Interactive Process Widget · RTL Conversion Flow · Vibe Coding Curriculum",
    },
    context:
      "Yusr Academy trains Arabic-speaking product and UI/UX designers to compete for real product roles. Having mentored students directly inside Yusr on translating Figma designs into working web/mobile builds, I understood the #1 skepticism learners bring: 'Will this actually teach me how product teams think and ship, or just Figma tools?'",
    problem: {
      headline:
        "How do you prove practical product-team rigor right on the landing hero before a prospective learner leaves?",
      body: "Most Arabic EdTech landing pages rely on generic stock imagery and vague promises ('Become a UI/UX Expert in X weeks'). Learners burned by screen-copying courses need immediate, tangible proof that the curriculum prioritizes problem-solving, research, and real engineering handoff.",
      painPoints: [
        "Learners struggle to distinguish between surface-level UI decoration courses and real Product Design education.",
        "Prospective students want to inspect mentors and curriculum mechanics before creating an account.",
        "Traditional static hero mockups fail to demonstrate interactive product craft.",
      ],
    },
    whyItMattered: {
      userImpact:
        "Students immediately see the end-to-end UX process, transparent outcomes, and direct access to practitioner mentors before enrolling.",
      businessStakes:
        "Higher trust above the fold increases qualified cohort sign-ups and lowers pre-enrollment uncertainty handled by support.",
    },
    constraints: [
      "Balance dark editorial credibility with warm, approachable Arabic mentorship copy.",
      "Surface complex curriculum pillars (Research, IA, Design Systems, Usability Testing, Prototyping) without turning the hero into a dense syllabus.",
      "Give skeptical learners a risk-free secondary path ('Meet the Mentors') alongside primary enrollment.",
    ],
    explorations: [
      {
        label: "Option A — Instructor Portrait Hero + Discount Banner",
        approach:
          "Classic course-sales landing page anchored on promotional pricing and countdown urgency.",
        verdict: "Rejected",
        rationale:
          "Positioned Yusr like a mass-market discount course rather than a credible product design studio and mentorship community.",
      },
      {
        label: "Option B — Long Syllabus Accordion Above the Fold",
        approach:
          "List every lecture module immediately in the top viewport.",
        verdict: "Rejected",
        rationale:
          "Overwhelmed first-time visitors before establishing why Yusr's case-study approach matters.",
      },
      {
        label: "Option C — Live Interactive Process Widget + Dual Proof Hero",
        approach:
          "Pair crisp Arabic outcome bullets on the right with a Figma-inspired interactive UX Process card on the left and a scrolling skill marquee anchored below.",
        verdict: "Chosen",
        rationale:
          "Shows—rather than just tells—how Yusr teaches real product design thinking from Discover to Test.",
      },
    ],
    designDecisions: [
      {
        title: "Interactive 'ux-process.fig' Preview Card in the Hero",
        rationale:
          "Speaks directly to designers' native mental model—highlighting Discover, Define, Ideate, Model, and Test inside a live Figma-styled window.",
      },
      {
        title: "Value-First Checklist Over Hype Claims",
        rationale:
          "Calls out exact differentiators (portfolios that show thinking, not just pretty shots; real hiring partner pathways; practitioner mentors).",
      },
      {
        title: "Dual CTA Split ('Start Your Journey' + 'Meet the Mentors')",
        rationale:
          "Respects hesitant visitors who validate instructor credibility before committing to cohort enrollment.",
      },
    ],
    systemsAndHandoff: {
      headline: "Bridging Design Thinking and Vibe Coding in Practice",
      body: "Beyond designing the web showcase, I mentor designers inside Yusr Academy on converting Figma components into live prototypes using AI-assisted coding workflows—proving how engineering literacy elevates product designers.",
      highlights: [
        "Unified dark emerald token system (#060F0F canvas, #52B285 primary action, crisp RTL type scale).",
        "Modular skill marquee surfacing core disciplines without hero clutter.",
        "Live mentoring integration bridging Figma systems to shippable prototypes.",
      ],
    },
    outcomeAndNextSteps: {
      shippedReality: [
        "Launched live at yusr-academy.com as Yusr Academy's Arabic UX education flagship.",
        "Actively mentoring learners inside the platform on practical UX flows and AI-assisted Vibe Coding prototyping.",
      ],
      nextMetricsToTrack: [
        "Conversion split between 'Start Your Journey' and 'Meet the Mentors' hero clicks.",
        "Portfolio quality progression of learners completing real-problem case studies vs UI-only tracks.",
        "Enrollment completion rates from landing visit to program registration.",
      ],
    },
    media: {
      layout: "desktop",
      bgImage: "/images/projects/yusr-academy-bg.webp",
      posterSrc: "/images/projects/yusr-academy-poster.webp",
      videoSrc: "/videos/projects/yusr-academy-tour.mp4",
    },
    liveLinks: [
      {
        type: "web",
        label: "Live Website",
        href: "https://www.yusr-academy.com/",
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
