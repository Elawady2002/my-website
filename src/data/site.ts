export interface InfoRowItem {
  label: string;
  value: string;
}

export type WorkProjectLinkType =
  | "appStore"
  | "googlePlay"
  | "web"
  | "figma"
  | "video";

export interface WorkProjectLink {
  type: WorkProjectLinkType;
  href: string;
  label?: string;
}

export interface WorkProjectItem {
  id: string;
  title: string;
  category: string;
  role?: string;
  domain?: string;
  outcomeTag?: string;
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
  mobileScreens?: readonly string[];
  links?: readonly WorkProjectLink[];
}

export interface ExperienceRoleItem {
  id: string;
  number: string;
  role: string;
  company: string;
  scope: string;
  location: string;
  summary: string;
  highlights: readonly string[];
}

export interface RecognitionItem {
  id: string;
  title: string;
  issuer: string;
  subtitle: string;
}

/**
 * Credential entry displayed on the dedicated `/certificates` archive page.
 */
export type CertificateFrameFormat = "landscape" | "landscape-4x3" | "portrait";

export interface CertificateSeriesLevel {
  id: string;
  label: string;
  level: string;
  issuedDate: string;
  details: string;
  imageSrc: string;
  title?: string;
  description?: string;
  frameFormat?: CertificateFrameFormat;
  verifyUrl?: string;
}

export interface CertificateItem {
  id: string;
  number: string;
  title: string;
  issuer: string;
  issuedDate: string;
  details: string;
  description: string;
  accentColor: string;
  frameFormat?: CertificateFrameFormat;
  imageSrc?: string;
  verifyUrl?: string;
  programUrl: string;
  programLabel: string;
  featured?: boolean;
  series?: readonly CertificateSeriesLevel[];
}

export const siteConfig = {
  domain: "ABDULLAH ELAWADY",
  edition: "PRODUCT DESIGN · 2026",
  greeting: "SENIOR PRODUCT DESIGNER",
  tagline:
    "I design end-to-end mobile & web products—turning complex user problems into clear, shippable experiences.",
  heroLine1: "ABDULLAH",
  heroLine2: "ELAWADY",
  portraitSrc: "/images/abdullah-portrait.webp",
  portraitAlt: "Abdullah Elawady — Senior Product Designer portrait",
  navLinks: [
    { label: "ABOUT", href: "#info" },
    { label: "WORK", href: "#work" },
    { label: "EXPERIENCE", href: "#experience" },
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
        label: "ROLE",
        value: "Senior Product Designer",
      },
      {
        label: "SPECIALTY",
        value: "Mobile Apps, Web & Design Systems",
      },
      {
        label: "CRAFT EDGE",
        value: "Figma · Flutter · Front-end Prototyping",
      },
      {
        label: "TIMEZONE",
        value: "LIVE_CLOCK",
      },
      {
        label: "AVAILABILITY",
        value: "Open to Product Roles (Remote / MENA)",
      },
    ] as InfoRowItem[],
    ctaLabel: "VIEW CASE STUDIES",
    ctaHref: "#work",
  },
  booking: {
    hostName: "Abdullah Elawady",
    timezoneIana: "Africa/Cairo",
    timezoneLabel: "CAI",
    durations: [30, 45, 60] as readonly (30 | 45 | 60)[],
    defaultDuration: 30 as 30 | 45 | 60,
    startHour: 10, // 10:00 AM Cairo
    endHour: 22, // 10:00 PM Cairo
    slotStepMinutes: 30,
    minLeadMinutes: 30,
    maxAdvanceDays: 45,
  },
  aboutSection: {
    waveHeading: "DESIGNING PRODUCTS THAT SOLVE REAL PROBLEMS — AT SCALE",
    eyebrow: "APPROACH",
    paragraphs: [
      "I’m a Product Designer focused on end-to-end mobile and web experiences across mobility, marketplaces, and digital platforms. I partner with founders, PMs, and engineers to turn ambiguous user pain points into clear flows, scalable Figma design systems, and shipped products.",
      "With hands-on fluency in Flutter, front-end code, and AI-assisted prototyping, I validate interactions on real devices early, eliminate design-to-engineering friction, and ship interfaces that hold up in production—not just static mockups.",
    ],
    closingLine: "User clarity. Business outcomes. Production-ready craft.",
  },
  workSection: {
    eyebrow: "SELECTED CASE STUDIES",
    heading: "WORK",
    projects: [
      {
        id: "fi-el-sekka",
        title: "FI EL SEKKA",
        category: "INTERCITY MOBILITY · MOBILE CASE STUDY",
        role: "Lead Product Designer",
        domain: "Transit & QR Ticketing · Egypt",
        outcomeTag: "Live on Apple App Store",
        stageBg: "#1E2019",
        stageAccent: "#D7E140",
        cardBg: "#1A1A1A",
        cardAccent: "#C9D41F",
        badge: "SMART COMMUTER BOOKING · EGYPT",
        headline: "SMARTER DAILY\nCOMMUTES",
        subcopy:
          "Intercity shuttle booking and digital wallet app with instant QR seat boarding passes, route tracking, and verified captains.",
        layout: "mobile",
        imageSrc: "/images/projects/fielsekka-bg.webp",
        mobileScreens: [
          "/images/projects/fielsekka-3.webp",
          "/images/projects/fielsekka-1.webp",
          "/images/projects/fielsekka-2.webp",
        ],
        links: [
          {
            type: "appStore",
            href: "https://apps.apple.com/eg/app/fi-el-sekka/id6813012849",
          },
        ],
      },
      {
        id: "tride",
        title: "TRIDE",
        category: "SCHOOL MOBILITY · MOBILE CASE STUDY",
        role: "UI/UX & Product Designer · Corevine",
        domain: "Parent Safety & Commutes · Egypt",
        outcomeTag: "Live on App Store & Google Play",
        stageBg: "#182128",
        stageAccent: "#FFA81D",
        cardBg: "#122535",
        cardAccent: "#FFA81D",
        badge: "SAFE SCHOOL TRANSPORT · COREVINE",
        headline: "SAFE RIDES\nFOR YOUR KIDS",
        subcopy:
          "Trusted school ride-booking app giving parents flexible car or seat plans, multi-child profiles, and verified school routes.",
        layout: "mobile",
        imageSrc: "/images/projects/tride-bg.webp",
        mobileScreens: [
          "/images/projects/tride-2.webp",
          "/images/projects/tride-1.webp",
          "/images/projects/tride-3.webp",
        ],
        links: [
          {
            type: "appStore",
            href: "https://apps.apple.com/eg/app/tride-egypt/id6749056619",
          },
          {
            type: "googlePlay",
            href: "https://play.google.com/store/apps/details?id=com.corevine.trideuser&pcampaignid=web_share",
          },
        ],
      },
      {
        id: "active-platform",
        title: "ACTIVE",
        category: "CREATOR CAMPAIGNS · WEB CASE STUDY",
        role: "Lead Product Designer",
        domain: "B2B Marketing Platform · KSA",
        outcomeTag: "Live Web Platform",
        stageBg: "#1a092b",
        stageAccent: "#89288f",
        cardBg: "#ffffff",
        cardAccent: "#89288f",
        badge: "BRAND CAMPAIGNS PLATFORM · LIVE WEBSITE",
        headline: "CONNECTING BRANDS\nWITH CREATORS",
        subcopy:
          "End-to-end campaign discovery and creator matching web platform crafted for clarity and conversion.",
        layout: "desktop",
        imageSrc: "/images/projects/active-bg.webp",
        posterSrc: "/images/projects/active-poster.webp",
        videoSrc: "/videos/projects/active-tour.mp4",
        links: [{ type: "web", href: "https://activksa.com/brands/" }],
      },
      {
        id: "malahi",
        title: "MALAHI",
        category: "MULTI-BRAND TICKETING · WEB CASE STUDY",
        role: "Product & Web Designer",
        domain: "Entertainment Hub · KSA",
        outcomeTag: "Live Bilingual Web Platform",
        stageBg: "#081018",
        stageAccent: "#059969",
        cardBg: "#0b0d12",
        cardAccent: "#10b981",
        badge: "SAUDI ENTERTAINMENT DESTINATIONS · LIVE WEBSITE",
        headline: "KEEP\nSMILING",
        subcopy:
          "Interactive multi-brand entertainment and ticketing web experience uniting Wanoos, Doos Karting, Garage, and Remote.",
        layout: "desktop",
        imageSrc: "/images/projects/malahi-bg.webp",
        posterSrc: "/images/projects/malahi-poster.webp",
        videoSrc: "/videos/projects/malahi-tour.mp4",
        links: [{ type: "web", href: "https://malahi.com/ar" }],
      },
      {
        id: "yusr-academy",
        title: "YUSR ACADEMY",
        category: "EDTECH & MENTORSHIP · WEB CASE STUDY",
        role: "Product Designer & Mentor",
        domain: "Arabic UX Academy · MENA",
        outcomeTag: "Live Platform & Active Track",
        stageBg: "#060F0F",
        stageAccent: "#52B285",
        cardBg: "#0A1919",
        cardAccent: "#A7F3B8",
        badge: "ARABIC UX ACADEMY · LIVE WEBSITE",
        headline: "MASTER HUMAN\nEXPERIENCE",
        subcopy:
          "Arabic-first UI/UX design academy and design studio uniting practical projects, career coaching, and Vibe Coding.",
        layout: "desktop",
        imageSrc: "/images/projects/yusr-academy-bg.webp",
        posterSrc: "/images/projects/yusr-academy-poster.webp",
        videoSrc: "/videos/projects/yusr-academy-tour.mp4",
        links: [{ type: "web", href: "https://www.yusr-academy.com/" }],
      },
    ] as WorkProjectItem[],
  },
  experienceSection: {
    eyebrow: "TRACK RECORD",
    heading: "EXPERIENCE",
    roles: [
      {
        id: "corevine",
        number: "01",
        role: "Product & UI/UX Designer",
        company: "Corevine",
        scope: "Mobile & Web Products",
        location: "Egypt",
        summary:
          "Designing end-to-end consumer and mobility apps including Tride (live on App Store & Google Play), owning UX flows, UI architecture, and production handoff with engineering squads.",
        highlights: [
          "End-to-end parent booking & multi-child commute setup flows",
          "Reusable Figma component systems built for iOS & Android parity",
          "Direct engineering QA through store release cycles",
        ],
      },
      {
        id: "independent-mena",
        number: "02",
        role: "Independent Product Designer",
        company: "Egypt & KSA Product Teams",
        scope: "End-to-End Delivery",
        location: "MENA",
        summary:
          "Partnering directly with founders and product teams to design and launch live regional mobile and web platforms including Fi El Sekka, Active KSA, and Malahi.",
        highlights: [
          "Arabic RTL & bilingual product architecture across Egypt and Saudi Arabia",
          "Zero-to-launch flows spanning commuter ticketing, B2B creator matching & venue discovery",
          "Interactive code/Flutter prototyping to validate ergonomics before dev freeze",
        ],
      },
      {
        id: "yusr-academy-mentor",
        number: "03",
        role: "UI/UX Mentor & Prototyping Instructor",
        company: "Yusr Academy",
        scope: "Design Education",
        location: "MENA",
        summary:
          "Mentoring Arabic UI/UX designers on real-world case studies, product thinking, and rapid AI-assisted prototyping workflows.",
        highlights: [
          "Teaching case-study storytelling centered on real problem-solving over visual screens",
          "Leading hands-on Vibe Coding workshops turning Figma designs into working builds",
          "Reviewing student flows, information architecture, and portfolio positioning",
        ],
      },
    ] as ExperienceRoleItem[],
    recognition: [
      {
        id: "create-apps-dubai",
        title: "Create Apps Championship 2025–26",
        issuer: "Dubai Chamber of Digital Economy",
        subtitle: "Regional Mobile Product Recognition",
      },
      {
        id: "figma-systems",
        title: "Figma Variables & Design Systems",
        issuer: "Design Systems Track",
        subtitle: "Semantic Tokens & Scalable Components",
      },
      {
        id: "creativa-ideation",
        title: "ITIDA · TIEC Creativa Ideation Camp",
        issuer: "Technology Innovation & Entrepreneurship Center",
        subtitle: "28h Product Validation & Innovation",
      },
    ] as RecognitionItem[],
  },
  certificatesSection: {
    eyebrow: "SELECTED CREDENTIALS",
    heading: "CREDENTIALS",
    subtitle:
      "Selected recognition across mobile product building, design systems, AI engineering workflows, and product validation.",
    ctaLabel: "VIEW ALL CREDENTIALS",
    ctaHref: "/certificates",
    certificates: [
      {
        id: "create-apps-championship",
        number: "01",
        title: "CREATE APPS CHAMPIONSHIP",
        issuer: "Dubai Chamber of Digital Economy",
        issuedDate: "2025–26",
        details: "Create Apps in Dubai · Certificate of Participation",
        description:
          "Recognized for notable contribution in the Create Apps Championship 2025–26 under the Create Apps in Dubai initiative by Dubai Chamber of Digital Economy.",
        accentColor: "#1E7CC6",
        frameFormat: "landscape-4x3",
        imageSrc: "/images/certificates/create-apps-championship-dubai.webp",
        programUrl: "https://createapps.ae/",
        programLabel: "Explore Create Apps",
        featured: true,
      },
      {
        id: "figma-variables",
        number: "02",
        title: "FIGMA VARIABLES",
        issuer: "Osama Eldrieny",
        issuedDate: "OCT 2025",
        details: "October 25, 2025 · Design Systems Track",
        description:
          "Hands-on specialization in Figma Variables, semantic design tokens, multi-mode theming, and scalable component architecture taught by Osama Eldrieny.",
        accentColor: "#00D084",
        imageSrc: "/images/certificates/figma-variables-osama-eldrieny.webp",
        programUrl:
          "https://www.youtube.com/playlist?list=PLk31GonFeFpuGaYgN2uiwa4SpMEitr-ft",
        programLabel: "Take This Course",
        featured: true,
      },
      {
        id: "manara-ai-engineering",
        number: "03",
        title: "AI, DATA & ENGINEERING",
        issuer: "Manara",
        issuedDate: "NOV 2026",
        details: "November 23, 2026 · Official Certificates of Completion",
        description:
          "Completed Manara courses spanning AI-assisted software workflows, Generative AI case studies, and Python data visualization from insight to impact.",
        accentColor: "#F26532",
        frameFormat: "landscape",
        imageSrc: "/images/certificates/manara-next-gen-devs-ai.webp",
        verifyUrl:
          "https://api.manara.tech/api/v1/certificate/asset/mwte3oyi-qg03954g",
        programUrl: "https://manara.tech/",
        programLabel: "Explore Manara",
        featured: true,
        series: [
          {
            id: "manara-next-gen-devs-ai",
            label: "Next-Gen Devs: AI Tools",
            title: "NEXT-GEN DEVS: AI TOOLS FOR SOFTWARE ENGINEERS",
            level: "Course 1",
            issuedDate: "NOV 2026",
            details: "November 23, 2026 · Official Certificate of Completion",
            description:
              "Completed the Manara course on modern AI-assisted software engineering workflows, covering AI coding assistants, rapid prototyping tools, and evaluating AI-generated code for production-grade applications.",
            imageSrc: "/images/certificates/manara-next-gen-devs-ai.webp",
            verifyUrl:
              "https://api.manara.tech/api/v1/certificate/asset/mwte3oyi-qg03954g",
          },
          {
            id: "manara-generative-ai-in-action",
            label: "Generative AI in Action",
            title:
              "GENERATIVE AI IN ACTION: CASE STUDIES AND FUTURE OUTLOOK",
            level: "Course 2",
            issuedDate: "NOV 2026",
            details: "November 23, 2026 · Official Certificate of Completion",
            description:
              "Completed the Manara course exploring real-world Generative AI case studies, practical product applications, and the evolving landscape of AI engineering.",
            imageSrc:
              "/images/certificates/manara-generative-ai-in-action.webp",
            verifyUrl:
              "https://api.manara.tech/api/v1/certificate/asset/mwtflptz-f44ei0mw",
          },
          {
            id: "manara-data-visualization-python",
            label: "Data Visualization with Python",
            title: "DATA VISUALIZATION WITH PYTHON: FROM INSIGHT TO IMPACT",
            level: "Course 3",
            issuedDate: "NOV 2026",
            details: "November 23, 2026 · Official Certificate of Completion",
            description:
              "Completed the Manara course on transforming datasets into clear, decision-ready visualizations with Python, focusing on analytical storytelling from raw insight to measurable impact.",
            imageSrc:
              "/images/certificates/manara-data-visualization-python.webp",
            verifyUrl:
              "https://api.manara.tech/api/v1/certificate/asset/mwtfslo0-b2i2y385",
          },
        ],
      },
      {
        id: "ideation-camp",
        number: "04",
        title: "IDEATION CAMP",
        issuer: "ITIDA · TIEC · Creativa Zagazig",
        issuedDate: "NOV 2026",
        details: "28 Hours Intensive Training · E.Spaces",
        description:
          "Completed 28 hours of intensive product ideation, startup validation, and innovation workshops hosted by ITIDA, TIEC, and Creativa Innovation Hub Zagazig.",
        accentColor: "#0057A8",
        imageSrc: "/images/certificates/ideation-camp-creativa-tiec.webp",
        programUrl:
          "https://www.facebook.com/share/1FYUe9ghRM/?mibextid=wwXIfr",
        programLabel: "Explore Creativa",
        featured: false,
      },
    ] as CertificateItem[],
  },
  contactSection: {
    phoneLabel: "PHONE",
    phoneValue: "+20 103 319 0408",
    phoneHref: "tel:+201033190408",
    whatsappHref: "https://wa.me/201033190408",
    mailLabel: "MAIL",
    mailValue: "ABDULLAHELAWADY68@GMAIL.COM",
    mailHref: "mailto:abdullahelawady68@gmail.com",
    socials: [
      {
        label: "LINKEDIN",
        handle: "@ABDULLAH-ELAWADY",
        href: "https://www.linkedin.com/in/abdullah-elawady-019129330",
      },
      {
        label: "GITHUB",
        handle: "@ELAWADY2002",
        href: "https://github.com/Elawady2002",
      },
    ],
    marqueePrimary: "ABDULLAH ",
    marqueeAccent: "ELAWADY",
  },
} as const;
