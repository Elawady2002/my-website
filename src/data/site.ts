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
        value: "6+ years",
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
        imageSrc: "/images/projects/yusr-academy-bg.webp",
        posterSrc: "/images/projects/yusr-academy-poster.webp",
        videoSrc: "/videos/projects/yusr-academy-tour.mp4",
        links: [{ type: "web", href: "https://www.yusr-academy.com/" }],
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
        imageSrc: "/images/projects/active-bg.webp",
        posterSrc: "/images/projects/active-poster.webp",
        videoSrc: "/videos/projects/active-tour.mp4",
        links: [{ type: "web", href: "https://activksa.com/brands/" }],
      },
      {
        id: "malahi",
        title: "MALAHI",
        category: "PRODUCT DESIGN / WEBSITE",
        stageBg: "#081018",
        stageAccent: "#059969",
        cardBg: "#0b0d12",
        cardAccent: "#10b981",
        badge: "SAUDI ENTERTAINMENT DESTINATIONS · LIVE WEBSITE",
        headline: "KEEP\nSMILING",
        subcopy:
          "Interactive multi-brand entertainment and ticketing web experience uniting Wanoos, Doos Karting, Garage, and Remote.",
        layout: "desktop",
        imageSrc: "/images/projects/malahi-bg.png",
        posterSrc: "/images/projects/malahi-poster.png",
        videoSrc: "/videos/projects/malahi-tour.mp4",
        links: [{ type: "web", href: "https://malahi.com/ar" }],
      },
      {
        id: "quranic-radio",
        title: "QURANIC RADIO",
        category: "MOBILE UX / FLUTTER",
        stageBg: "#211F22",
        stageAccent: "#DFD7C8",
        cardBg: "#1E1E1E",
        cardAccent: "#D4B363",
        badge: "ISLAMIC AUDIO PLAYER · FLUTTER",
        headline: "TACTILE VINYL\nQURAN STREAMING",
        subcopy:
          "Minimalist Arabic Quran radio experience pairing tactile vinyl turntable motion with curated reciter sleeves.",
        layout: "mobile",
        imageSrc: "/images/projects/quranic-radio-bg.webp",
        mobileScreens: [
          "/images/projects/quranic-radio-1.png",
          "/images/projects/quranic-radio-2.png",
        ],
        links: [
          {
            type: "video",
            href: "https://www.facebook.com/reel/1864644460753214",
          },
          {
            type: "figma",
            href: "https://www.figma.com/design/gbqTrzytAQLRcNWAvw5vyO/Quranic-Radio-%F0%9F%8E%A7?node-id=0-1",
          },
        ],
      },
      {
        id: "fi-el-sekka",
        title: "FI EL SEKKA",
        category: "TRANSIT & TICKETING / FLUTTER",
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
          "/images/projects/fielsekka-3.png",
          "/images/projects/fielsekka-1.png",
          "/images/projects/fielsekka-2.png",
        ],
        links: [
          {
            type: "appStore",
            href: "https://apps.apple.com/eg/app/fi-el-sekka/id6813012849",
          },
        ],
      },
      {
        id: "wanas-ai",
        title: "WANAS AI",
        category: "AI WELLNESS / MOBILE APP",
        stageBg: "#0B583C",
        stageAccent: "#2AC58D",
        cardBg: "#0C1D17",
        cardAccent: "#0EBE7F",
        badge: "MENTAL WELLNESS & GROUP SUPPORT · MOBILE",
        headline: "CONNECTED\nMIND CARE",
        subcopy:
          "Arabic mental wellness and tele-therapy platform featuring live moderated support rooms, licensed specialists, and AI guidance.",
        layout: "desktop",
        imageSrc: "/images/projects/wanas-ai-showcase.webp",
        links: [
          {
            type: "figma",
            href: "https://www.figma.com/design/N8iSt8ctzQODLEwlzAvZId/Wanas-Ai-%D9%88%D9%86%D8%B3-?node-id=285-20730&t=eLBaqikobroLCw7R-1",
          },
        ],
      },
      {
        id: "foxus",
        title: "FOXUS",
        category: "MARKETPLACE APP / FLUTTER",
        stageBg: "#121E24",
        stageAccent: "#F48823",
        cardBg: "#0C191A",
        cardAccent: "#F48823",
        badge: "CLASSIFIEDS MARKETPLACE · EGYPT",
        headline: "DISCOVER EVERY\nOPPORTUNITY",
        subcopy:
          "Bilingual Egyptian marketplace app uniting real estate, automotive, and electronics discovery with instant seller chat.",
        layout: "mobile",
        imageSrc: "/images/projects/foxus-bg.webp",
        mobileScreens: [
          "/images/projects/foxus-2.png",
          "/images/projects/foxus-1.png",
          "/images/projects/foxus-3.png",
        ],
        links: [
          {
            type: "figma",
            href: "https://www.figma.com/design/G0mquJC19n9qXrKTBnntPB/Foxus?node-id=627-840",
          },
        ],
      },
      {
        id: "tride",
        title: "TRIDE",
        category: "PRODUCT DESIGN / UI/UX",
        stageBg: "#182128",
        stageAccent: "#FFA81D",
        cardBg: "#122535",
        cardAccent: "#FFA81D",
        badge: "SAFE SCHOOL TRANSPORT · UI/UX",
        headline: "SAFE RIDES\nFOR YOUR KIDS",
        subcopy:
          "Trusted school ride-booking app giving parents flexible car or seat plans, multi-child profiles, and verified school routes.",
        layout: "mobile",
        imageSrc: "/images/projects/tride-bg.webp",
        mobileScreens: [
          "/images/projects/tride-2.png",
          "/images/projects/tride-1.png",
          "/images/projects/tride-3.png",
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
          {
            type: "figma",
            href: "https://www.figma.com/design/slzrLqEDN0l10yDeJUofbK/Tride?node-id=723-37072",
          },
        ],
      },
      {
        id: "nursy",
        title: "NURSY",
        category: "HEALTHCARE UX / MOBILE APP",
        stageBg: "#132330",
        stageAccent: "#74B9E2",
        cardBg: "#192A38",
        cardAccent: "#74B9E2",
        badge: "ON-DEMAND HOME NURSING · MOBILE",
        headline: "COMPASSIONATE\nHOME CARE",
        subcopy:
          "On-demand home nursing platform pairing real-time Cairo geolocation matching with patient care history and live chat.",
        layout: "mobile",
        imageSrc: "/images/projects/nursy-bg.webp",
        mobileScreens: [
          "/images/projects/nursy-1.png",
          "/images/projects/nursy-3.png",
          "/images/projects/nursy-2.png",
        ],
        links: [
          {
            type: "figma",
            href: "https://www.figma.com/design/7gteXIlESSCoUq8haoZMQU/Nursy-app?node-id=0-1",
          },
        ],
      },
    ] as WorkProjectItem[],
  },
  contactSection: {
    phoneLabel: "PHONE",
    phoneValue: "+20 103 319 0408",
    phoneHref: "tel:+201033190408",
    mailLabel: "MAIL",
    mailValue: "ABDULLAHELAWDY68@GMAIL.COM",
    mailHref: "mailto:abdullahelawdy68@gmail.com",
    socials: [
      {
        label: "LINKEDIN",
        handle: "@ABDULLAHELAWADY",
        href: "https://www.linkedin.com/in/abdullah-elawady-019129330",
      },
      {
        label: "GITHUB",
        handle: "@ELAWADY2002",
        href: "https://github.com/Elawady2002",
      },
      {
        label: "INSTAGRAM",
        handle: "@ABDLLA_67",
        href: "https://www.instagram.com/abdlla_67",
      },
      {
        label: "FACEBOOK",
        handle: "ABDULLAH ELAWADY",
        href: "https://www.facebook.com/share/1A3SmiAnEj/?mibextid=wwXIfr",
      },
    ],
    marqueePrimary: "ABDULLAHELAWADY",
    marqueeAccent: ".STUDIO",
  },
} as const;
