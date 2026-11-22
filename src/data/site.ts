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

/**
 * Credential entry displayed inside the Home 3D wooden-and-glass frame teaser
 * and on the dedicated `/certificates` archive page.
 *
 * To attach a real scanned certificate image:
 * 1. Save the image under `public/images/certificates/<file>.webp` (recommended 1600×1125 or ~1.42:1 landscape).
 * 2. Set `imageSrc: "/images/certificates/<file>.webp"` on the item below.
 * 3. Add the official verification link to `verifyUrl` so visitors can click "Verify Certificate".
 */
export interface CertificateItem {
  id: string;
  number: string;
  title: string;
  issuer: string;
  platform: string;
  category: string;
  issuedDate: string;
  duration: string;
  credentialId: string;
  summary: string;
  howEarned: string;
  howToEarn: string;
  skills: readonly string[];
  accentColor: string;
  imageSrc?: string;
  verifyUrl?: string;
  programUrl: string;
  featured?: boolean;
}

export const siteConfig = {
  domain: "ABDULLAHELAWADY.STUDIO",
  edition: "PORTFOLIO 2026",
  greeting: "HI THERE",
  tagline:
    "I craft digital products and mobile apps, sharper, faster, unforgettable.",
  heroLine1: "ABDULLAHELAWADY",
  heroLine2: ".STUDIO",
  portraitSrc: "/images/abdullah-portrait.webp",
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
        imageSrc: "/images/projects/malahi-bg.webp",
        posterSrc: "/images/projects/malahi-poster.webp",
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
          "/images/projects/quranic-radio-1.webp",
          "/images/projects/quranic-radio-2.webp",
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
          "/images/projects/foxus-2.webp",
          "/images/projects/foxus-1.webp",
          "/images/projects/foxus-3.webp",
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
          "/images/projects/nursy-1.webp",
          "/images/projects/nursy-3.webp",
          "/images/projects/nursy-2.webp",
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
  certificatesSection: {
    eyebrow: "VERIFIED CREDENTIALS",
    heading: "CERTIFICATES",
    subtitle:
      "Selected design & engineering credentials framed in museum-grade 3D walnut and glass. Explore the full archive for how each was earned and how to follow the same track.",
    ctaLabel: "VIEW ALL CERTIFICATES",
    ctaHref: "/certificates",
    /**
     * To replace the generated museum plate inside any 3D wooden frame with a real scan:
     * drop `<name>.webp` in `public/images/certificates/` and set `imageSrc: "/images/certificates/<name>.webp"`
     * alongside the live `verifyUrl`.
     */
    certificates: [
      {
        id: "google-ux-design",
        number: "01",
        title: "GOOGLE UX DESIGN PROFESSIONAL",
        issuer: "Google",
        platform: "Coursera",
        category: "UX & PRODUCT DESIGN",
        issuedDate: "MAY 2024",
        duration: "7 COURSES · ~240 HOURS",
        credentialId: "GUX-2024-AE01",
        summary:
          "End-to-end UX research, wireframing, interactive Figma prototyping, and usability testing across mobile & web products.",
        howEarned:
          "Completed all 7 hands-on courses covering user research, empathy mapping, wireframes, design systems, and high-fidelity prototypes in Figma. Shipped 3 full portfolio case studies evaluated through peer-reviewed usability testing loops.",
        howToEarn:
          "Enroll in the 7-course Google UX Design specialization on Coursera, complete the graded labs and 3 end-to-end capstone projects (mobile app, responsive web, and cross-platform product), and pass peer assessments.",
        skills: [
          "User Research",
          "Wireframing",
          "Figma Prototyping",
          "Usability Testing",
          "Design Thinking",
        ],
        accentColor: "#f34213",
        programUrl:
          "https://www.coursera.org/professional-certificates/google-ux-design",
        featured: true,
      },
      {
        id: "flutter-dart-complete",
        number: "02",
        title: "FLUTTER & DART PRODUCTION ARCHITECTURE",
        issuer: "Google Developers",
        platform: "Flutter Learning Pathway",
        category: "FLUTTER & MOBILE",
        issuedDate: "NOV 2024",
        duration: "MULTI-MODULE · 140+ HOURS",
        credentialId: "FLT-2024-AE02",
        summary:
          "Cross-platform iOS & Android engineering focused on 60fps custom animations, state management, and native integrations.",
        howEarned:
          "Built production-grade Flutter applications applying clean architecture, Bloc/Riverpod state management, custom Canvas/Shader animations, offline persistence, and App Store / Google Play release pipelines.",
        howToEarn:
          "Follow the official Google Developers Flutter & Dart pathway, build responsive multi-screen mobile apps with state management and animations, and complete the practical architecture assessments.",
        skills: [
          "Flutter",
          "Dart 3",
          "State Management",
          "60fps Motion",
          "Mobile Release",
        ],
        accentColor: "#38bdf8",
        programUrl: "https://docs.flutter.dev/learn/pathway",
        featured: true,
      },
      {
        id: "idf-design-systems",
        number: "03",
        title: "DESIGN SYSTEMS & SCALABLE INTERFACES",
        issuer: "Interaction Design Foundation",
        platform: "IxDF",
        category: "DESIGN SYSTEMS",
        issuedDate: "FEB 2025",
        duration: "8 WEEKS · GRADED TRACK",
        credentialId: "IXDF-2025-AE03",
        summary:
          "Design tokens, multi-brand component libraries, accessibility contrast standards, and Figma-to-code handoff workflows.",
        howEarned:
          "Mastered semantic token architecture, component API governance, WCAG accessibility auditing, and multi-platform Figma variable pipelines that keep engineering and design tightly aligned.",
        howToEarn:
          "Join the Interaction Design Foundation (IxDF), complete the Design Systems & UI Pattern modules with ≥70% open-ended assignment grades, and publish your documented token architecture.",
        skills: [
          "Design Tokens",
          "Figma Variables",
          "WCAG Accessibility",
          "Component APIs",
          "Dev Handoff",
        ],
        accentColor: "#d4a656",
        programUrl: "https://www.interaction-design.org/courses",
        featured: true,
      },
      {
        id: "meta-frontend-craft",
        number: "04",
        title: "META FRONT-END INTERACTIVE ENGINEERING",
        issuer: "Meta",
        platform: "Coursera",
        category: "INTERACTIVE WEB",
        issuedDate: "AUG 2025",
        duration: "9 COURSES · ~210 HOURS",
        credentialId: "META-2025-AE04",
        summary:
          "Modern React architecture, TypeScript UI engineering, responsive CSS layout craft, and performance-conscious web delivery.",
        howEarned:
          "Completed Meta's 9-course front-end track spanning semantic HTML, modern CSS grids, React component architecture, UI testing, and interactive web capstone delivery bridging design craft with clean production code.",
        howToEarn:
          "Complete Meta's Front-End Developer Professional Certificate on Coursera, pass all coding labs, version-control exercises, and build the final responsive React capstone project.",
        skills: [
          "React & Next.js",
          "TypeScript",
          "UI Architecture",
          "Responsive Grids",
          "Web Performance",
        ],
        accentColor: "#60a5fa",
        programUrl:
          "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        featured: false,
      },
    ] as CertificateItem[],
  },
  contactSection: {
    phoneLabel: "PHONE",
    phoneValue: "+20 103 319 0408",
    phoneHref: "tel:+201033190408",
    mailLabel: "MAIL",
    mailValue: "ABDULLAHELAWADY68@GMAIL.COM",
    mailHref: "mailto:abdullahelawady68@gmail.com",
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
