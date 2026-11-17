export interface InfoRowItem {
  label: string;
  value: string;
}

export interface WorkProjectItem {
  id: string;
  title: string;
  category: string;
  stageBg: string;
  stageAccent: string;
  cardBg: string;
  cardAccent: string;
  badge: string;
  headline: string;
  subcopy: string;
  layout: "desktop" | "mobile" | "split";
  imageSrc?: string;
  posterSrc?: string;
  videoSrc?: string;
}

export const siteConfig = {
  domain: "ABDULLAHELAWADY.STUDIO",
  edition: "PORTFOLIO 2026",
  greeting: "HI THERE",
  tagline:
    "I craft digital products and mobile apps, sharper, faster, unforgettable.",
  heroLine1: "ABDULLAHELAWADY",
  heroLine2: ".STUDIO",
  portraitSrc: "/images/abdullah-portrait.png",
  portraitAlt: "Abdullah Elawady — Studio portrait",
  navLinks: [
    { label: "INFO", href: "#info" },
    { label: "ABOUT", href: "#about" },
    { label: "WORK", href: "#work" },
    { label: "CONTACT", href: "#contact" },
  ],
  pillNavLinks: [
    { id: "home", label: "Home", href: "#header" },
    { id: "about", label: "About", href: "#info" },
    { id: "work", label: "Work", href: "#work" },
    { id: "connect", label: "Connect", href: "#contact" },
  ],
  infoSection: {
    label: "ABOUT",
    timezoneCity: "CAI",
    timezoneIana: "Africa/Cairo",
    rows: [
      {
        label: "SERVICES",
        value: "UI/UX, Product Design & Flutter Development",
      },
      {
        label: "EXPERIENCE",
        value: "5+ years",
      },
      {
        label: "TIMEZONE",
        value: "LIVE_CLOCK",
      },
      {
        label: "AVAILABILITY",
        value: "Taking on projects from Q4",
      },
      {
        label: "PRODUCTS SHIPPED",
        value: "40+ mobile & web apps",
      },
    ] as InfoRowItem[],
    ctaLabel: "VIEW WORK",
    ctaHref: "#work",
  },
  aboutSection: {
    waveHeading:
      "I BUILD PRODUCTS THAT TURN HEADS — MOBILE, WEB AND BEYOND",
    eyebrow: "BECAUSE",
    paragraphs: [
      "I’m an independent UI/UX designer, product designer and Flutter engineer. I bring product strategy, interface craft and native-grade mobile development together to ship digital experiences that stand out and stay effortless across every screen.",
      "From early user flows and design systems in Figma to production 60fps iOS, Android and web builds—I lead the full product journey from zero to launch.",
    ],
    closingLine: "One vision. Pixel-level craft. Products that work as one.",
  },
  workSection: {
    eyebrow: "WHAT YOU’RE HERE FOR (I GUESS)",
    heading: "WORK",
    projects: [
      {
        id: "yusr-academy",
        title: "YUSR ACADEMY",
        category: "WEBSITE",
        stageBg: "#060F0F",
        stageAccent: "#52B285",
        cardBg: "#0A1919",
        cardAccent: "#A7F3B8",
        badge: "ARABIC UX ACADEMY · LIVE WEBSITE",
        headline: "MASTER HUMAN\nEXPERIENCE",
        subcopy:
          "Arabic-first UI/UX design academy and design studio uniting practical projects, career coaching, and Vibe Coding.",
        layout: "desktop",
        imageSrc: "/images/projects/yusr-academy-bg.png",
        posterSrc: "/images/projects/yusr-academy-poster.png",
        videoSrc: "/videos/projects/yusr-academy-tour.mp4",
      },
      {
        id: "active-platform",
        title: "ACTIVE",
        category: "PRODUCT DESIGN / WEB PLATFORM",
        stageBg: "#1a092b",
        stageAccent: "#89288f",
        cardBg: "#ffffff",
        cardAccent: "#89288f",
        badge: "BRAND CAMPAIGNS PLATFORM · LIVE WEBSITE",
        headline: "CONNECTING BRANDS\nWITH CREATORS",
        subcopy:
          "End-to-end campaign discovery and creator matching web platform crafted for clarity and conversion.",
        layout: "desktop",
        imageSrc: "/images/projects/active-bg.png",
        posterSrc: "/images/projects/active-poster.png",
        videoSrc: "/videos/projects/active-tour.mp4",
      },
      {
        id: "kinetic-os",
        title: "KINETIC OS",
        category: "DESIGN SYSTEM / WEB",
        stageBg: "#c4b5fd",
        stageAccent: "#7c3aed",
        cardBg: "#14131a",
        cardAccent: "#a78bfa",
        badge: "DESIGN TOKENS · 140+ COMPONENTS",
        headline: "MODULAR\nPRODUCT OS",
        subcopy:
          "Unified multi-platform workspace uniting Figma variables, Dart theme tokens, and responsive desktop workflows.",
        layout: "desktop",
      },
      {
        id: "vebri-studio",
        title: "VEBRI STUDIO",
        category: "IDENTITY / PRODUCT DESIGN",
        stageBg: "#23262d",
        stageAccent: "#facc15",
        cardBg: "#1e1d22",
        cardAccent: "#facc15",
        badge: "CLIENT PLATFORM · WEB",
        headline: "PRECISION\nBUILT TO SCALE",
        subcopy:
          "Complete brand architecture and interactive web experience designed to elevate technical engineering teams.",
        layout: "split",
      },
      {
        id: "nomad-ai",
        title: "NOMAD AI",
        category: "MOBILE UX / FLUTTER",
        stageBg: "#1b3635",
        stageAccent: "#5eead4",
        cardBg: "#0f171a",
        cardAccent: "#2dd4bf",
        badge: "AI TRAVEL COMPANION · FLUTTER",
        headline: "SMARTER\nCITY ROUTES",
        subcopy:
          "Context-aware itinerary assistant with real-time map clustering, offline caching, and tactile card gestures.",
        layout: "mobile",
      },
      {
        id: "solaris-ev",
        title: "SOLARIS EV",
        category: "DASHBOARD UI / HMI",
        stageBg: "#162d44",
        stageAccent: "#38bdf8",
        cardBg: "#09111a",
        cardAccent: "#38bdf8",
        badge: "VEHICLE TELEMETRY · UI/UX",
        headline: "NEXT-GEN\nCABIN CONTROL",
        subcopy:
          "High-contrast cockpit dashboard displaying range diagnostics, route charging stops, and climate controls at a glance.",
        layout: "desktop",
      },
      {
        id: "atelier-mono",
        title: "ATELIER MONO",
        category: "E-COMMERCE / MOBILE APP",
        stageBg: "#d6cfc2",
        stageAccent: "#18181b",
        cardBg: "#f5f1ea",
        cardAccent: "#f34213",
        badge: "LUXURY RETAIL · FLUTTER",
        headline: "CURATED\nEVERYDAY OBJECTS",
        subcopy:
          "Editorial commerce app combining minimal product storytelling, AR sizing previews, and Apple Pay one-tap checkout.",
        layout: "mobile",
      },
    ] as WorkProjectItem[],
  },
  contactSection: {
    phoneLabel: "PHONE",
    phoneValue: "+20 100 000 0000",
    phoneHref: "tel:+201000000000",
    mailLabel: "MAIL",
    mailValue: "HELLO@ABDULLAHELAWADY.STUDIO",
    mailHref: "mailto:hello@abdullahelawady.studio",
    socials: [
      {
        label: "LINKEDIN",
        handle: "@ABDULLAHELAWADY",
        href: "https://linkedin.com",
      },
      {
        label: "INSTAGRAM",
        handle: "@ABDULLAHELAWADY.STUDIO",
        href: "https://instagram.com",
      },
    ],
    marqueePrimary: "ABDULLAHELAWADY",
    marqueeAccent: ".STUDIO",
  },
} as const;
