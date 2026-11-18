import { CanvasTexture, SRGBColorSpace } from "three";

export interface OrbBrandSpec {
  id: string;
  name: string;
  baseBg: string;
  sheenColor: number;
  metalness: number;
  roughness: number;
  iconScale: number;
  svg: string;
}

export const FOOTER_ORB_BRANDS: readonly OrbBrandSpec[] = [
  {
    id: "claude",
    name: "Claude",
    baseBg: "#e55324",
    sheenColor: 0xffc4ad,
    metalness: 0.05,
    roughness: 0.22,
    iconScale: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#faf5ee" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>`,
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    baseBg: "#15161b",
    sheenColor: 0xd8dde8,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.47,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-2 -1 132 132"><defs><clipPath id="ag-arch-clip"><path d="M116.005 120.281c7.147 5.36 17.867 1.787 8.043-8.043C94.56 83.658 100.82 5.044 64.197 5.044s-30.374 78.614-59.851 107.2c-10.72 10.716.89 13.393 8.037 8.033 27.691-18.758 25.904-51.808 51.814-51.808 25.904 0 24.117 33.05 51.808 51.813"/></clipPath><radialGradient id="ag-g-green" cx="26%" cy="54%" r="50%"><stop offset="0%" stop-color="#00b95c"/><stop offset="62%" stop-color="#00b95c" stop-opacity="0.72"/><stop offset="100%" stop-color="#00b95c" stop-opacity="0"/></radialGradient><radialGradient id="ag-g-yellow" cx="48%" cy="18%" r="44%"><stop offset="0%" stop-color="#ffe432"/><stop offset="55%" stop-color="#fbbc04" stop-opacity="0.88"/><stop offset="100%" stop-color="#fbbc04" stop-opacity="0"/></radialGradient><radialGradient id="ag-g-red" cx="75%" cy="32%" r="48%"><stop offset="0%" stop-color="#fc413d"/><stop offset="58%" stop-color="#fc413d" stop-opacity="0.78"/><stop offset="100%" stop-color="#fc413d" stop-opacity="0"/></radialGradient><radialGradient id="ag-g-blue-hi" cx="84%" cy="74%" r="48%"><stop offset="0%" stop-color="#749bff"/><stop offset="65%" stop-color="#3186ff" stop-opacity="0.6"/><stop offset="100%" stop-color="#3186ff" stop-opacity="0"/></radialGradient></defs><g clip-path="url(#ag-arch-clip)"><rect x="-10" y="-10" width="148" height="148" fill="#3186ff"/><rect x="-10" y="-10" width="148" height="148" fill="url(#ag-g-green)"/><rect x="-10" y="-10" width="148" height="148" fill="url(#ag-g-yellow)"/><rect x="-10" y="-10" width="148" height="148" fill="url(#ag-g-red)"/><rect x="-10" y="-10" width="148" height="148" fill="url(#ag-g-blue-hi)"/></g></svg>`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    baseBg: "#eee8de",
    sheenColor: 0xffffff,
    metalness: 0.03,
    roughness: 0.2,
    iconScale: 0.47,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#121317" d="M22.282 9.821a6 6 0 0 0-.516-4.91a6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a6 6 0 0 0-3.998 2.9a6.05 6.05 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.05 6.05 0 0 0 6.515 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206a6 6 0 0 0 3.997-2.9a6.06 6.06 0 0 0-.747-7.073M13.26 22.43a4.48 4.48 0 0 1-2.876-1.04l.141-.081l4.779-2.758a.8.8 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494M3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085l4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646M2.34 7.896a4.5 4.5 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354l-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.08.08 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667m2.01-3.023l-.141-.085l-4.774-2.782a.78.78 0 0 0-.785 0L9.409 9.23V6.897a.07.07 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.8.8 0 0 0-.393.681zm1.097-2.365l2.602-1.5l2.607 1.5v2.999l-2.597 1.5l-2.607-1.5Z"/></svg>`,
  },
  {
    id: "figma",
    name: "Figma",
    baseBg: "#17171c",
    sheenColor: 0xd8dde8,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.45,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-2 -3 138 138"><path fill="#0acf83" d="M45.5 129c11.9 0 21.5-9.6 21.5-21.5V86H45.5C33.6 86 24 95.6 24 107.5S33.6 129 45.5 129zm0 0"/><path fill="#a259ff" d="M24 64.5C24 52.6 33.6 43 45.5 43H67v43H45.5C33.6 86 24 76.4 24 64.5zm0 0"/><path fill="#f24e1e" d="M24 21.5C24 9.6 33.6 0 45.5 0H67v43H45.5C33.6 43 24 33.4 24 21.5zm0 0"/><path fill="#ff7262" d="M67 0h21.5C100.4 0 110 9.6 110 21.5S100.4 43 88.5 43H67zm0 0"/><path fill="#1abcfe" d="M110 64.5c0 11.9-9.6 21.5-21.5 21.5S67 76.4 67 64.5 76.6 43 88.5 43 110 52.6 110 64.5zm0 0"/></svg>`,
  },
  {
    id: "miro",
    name: "Miro",
    baseBg: "#f5c527",
    sheenColor: 0xfff2b8,
    metalness: 0.04,
    roughness: 0.21,
    iconScale: 0.4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#0b0726" d="M17.392 0H13.9L17 4.808 10.444 0H6.949l3.102 6.3L3.494 0H0l3.05 8.131L0 24h3.494L10.05 6.985 6.949 24h3.494L17 5.494 13.899 24h3.493L24 3.672 17.392 0z"/></svg>`,
  },
  {
    id: "lottiefiles",
    name: "LottieFiles",
    baseBg: "#121b1b",
    sheenColor: 0xc4fff2,
    metalness: 0.08,
    roughness: 0.24,
    iconScale: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="2.5 2.5 19 19"><path fill="#00ddb3" d="M19.347 7.013a1.4 1.4 0 0 1-.26.39c-.11.11-.24.2-.39.26-.14.06-.3.09-.45.09-2.511 0-3.482 1.53-4.792 4.042l-.8 1.51c-1.231 2.382-2.762 5.323-6.894 5.323-.31 0-.62-.12-.84-.35a1.188 1.188 0 0 1 .84-2.031c2.511 0 3.482-1.53 4.792-4.042l.8-1.51c1.231-2.382 2.762-5.323 6.894-5.323q.24 0 .45.09c.14.06.27.15.39.26.11.11.2.24.26.39a1.17 1.17 0 0 1 0 .9Z"/></svg>`,
  },
  {
    id: "framer",
    name: "Framer",
    baseBg: "#1250eb",
    sheenColor: 0xbdd4ff,
    metalness: 0.05,
    roughness: 0.21,
    iconScale: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#ffffff" d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z"/></svg>`,
  },
  {
    id: "notion",
    name: "Notion",
    baseBg: "#eee8de",
    sheenColor: 0xffffff,
    metalness: 0.03,
    roughness: 0.2,
    iconScale: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#141417" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/></svg>`,
  },
  {
    id: "flutter",
    name: "Flutter",
    baseBg: "#131924",
    sheenColor: 0xcfe4ff,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-2 -2 132 132"><defs><linearGradient id="fl-grad-a" gradientUnits="userSpaceOnUse" x1="59.365" y1="116.36" x2="86.825" y2="99.399"><stop offset="0" stop-color="#1b4e94"/><stop offset=".63" stop-color="#1a5497"/><stop offset="1" stop-color="#195a9b"/></linearGradient></defs><g fill="#3fb6d3"><path d="M12.3 64.2L76.3 0h39.4L32.1 83.6zM76.3 128h39.4L81.6 93.9l34.1-34.8H76.3L42.2 93.5z"/></g><path fill="#27aacd" d="M81.6 93.9l-20-20-19.4 19.6 19.4 19.6z"/><path fill="#19599a" d="M115.7 128L81.6 93.9l-20 19.2L76.3 128z"/><path fill="url(#fl-grad-a)" d="M61.6 113.1l30.8-8.4-10.8-10.8z"/></svg>`,
  },
  {
    id: "firebase",
    name: "Firebase",
    baseBg: "#17161a",
    sheenColor: 0xffe4b5,
    metalness: 0.08,
    roughness: 0.24,
    iconScale: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-2 -2 132 132"><path fill="#ffa000" d="M17.474 103.276 33.229 2.462a2.91 2.91 0 0 1 5.44-.924l16.294 30.39 6.494-12.366a2.91 2.91 0 0 1 5.15 0l43.97 83.714H17.474Z"/><path fill="#f57c00" d="M71.903 64.005 54.955 31.913l-37.481 71.363Z"/><path fill="#ffca28" d="M110.577 103.276 98.51 28.604a2.913 2.913 0 0 0-1.984-2.286 2.906 2.906 0 0 0-2.94.714l-76.112 76.243 42.115 23.618a8.728 8.728 0 0 0 8.51 0l42.478-23.618Z"/></svg>`,
  },
  {
    id: "supabase",
    name: "Supabase",
    baseBg: "#141b18",
    sheenColor: 0xc9f5df,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.45,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-6 -2 132 132"><defs><linearGradient id="sb-grad-a" x1="53.974" x2="94.163" y1="54.974" y2="71.829" gradientTransform="translate(29.387 60.096) scale(1.1436)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#249361"/><stop offset="1" stop-color="#3ecf8e"/></linearGradient><linearGradient id="sb-grad-b" x1="36.156" x2="54.484" y1="30.578" y2="65.081" gradientTransform="translate(29.387 60.096) scale(1.1436)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000000"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient></defs><path fill="url(#sb-grad-a)" d="M102.24 186.21c-3.267 4.117-9.904 1.862-9.977-3.397l-1.156-76.906h51.715c9.365 0 14.587 10.817 8.763 18.149z" transform="translate(-27.722 -60.338)"/><path fill="url(#sb-grad-b)" fill-opacity=".2" d="M102.24 186.21c-3.267 4.117-9.904 1.862-9.977-3.397l-1.156-76.906h51.715c9.365 0 14.587 10.817 8.763 18.149z" transform="translate(-27.722 -60.338)"/><path fill="#3ecf8e" d="M53.484 2.128c3.267-4.117 9.905-1.862 9.977 3.396l.508 76.907H12.902c-9.365 0-14.587-10.817-8.764-18.149z"/></svg>`,
  },
  {
    id: "postman",
    name: "Postman",
    baseBg: "#eee8de",
    sheenColor: 0xffffff,
    metalness: 0.03,
    roughness: 0.2,
    iconScale: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#ff6c37" d="M13.527.099C6.955-.744.942 3.9.099 10.473c-.843 6.572 3.8 12.584 10.373 13.428 6.573.843 12.587-3.801 13.428-10.374C24.744 6.955 20.101.943 13.527.099zm2.471 7.485a.855.855 0 0 0-.593.25l-4.453 4.453-.307-.307-.643-.643c4.389-4.376 5.18-4.418 5.996-3.753zm-4.863 4.861l4.44-4.44a.62.62 0 1 1 .847.903l-4.699 4.125-.588-.588zm.33.694l-1.1.238a.06.06 0 0 1-.067-.032.06.06 0 0 1 .01-.073l.645-.645.512.512zm-2.803-.459l1.172-1.172.879.878-1.979.426a.074.074 0 0 1-.085-.039.072.072 0 0 1 .013-.093zm-3.646 6.058a.076.076 0 0 1-.069-.083.077.077 0 0 1 .022-.046h.002l.946-.946 1.222 1.222-2.123-.147zm2.425-1.256a.228.228 0 0 0-.117.256l.203.865a.125.125 0 0 1-.211.117h-.003l-.934-.934-.294-.295 3.762-3.758 1.82-.393.874.874c-1.255 1.102-2.971 2.201-5.1 3.268zm5.279-3.428h-.002l-.839-.839 4.699-4.125a.952.952 0 0 0 .119-.127c-.148 1.345-2.029 3.245-3.977 5.091zm3.657-6.46l-.003-.002a1.822 1.822 0 0 1 2.459-2.684l-1.61 1.613a.119.119 0 0 0 0 .169l1.247 1.247a1.817 1.817 0 0 1-2.093-.343zm2.578 0a1.714 1.714 0 0 1-.271.218h-.001l-1.207-1.207 1.533-1.533c.661.72.637 1.832-.054 2.522zM18.855 6.05a.143.143 0 0 0-.053.157.416.416 0 0 1-.053.45.14.14 0 0 0 .023.197.141.141 0 0 0 .084.03.14.14 0 0 0 .106-.05.691.691 0 0 0 .087-.751.138.138 0 0 0-.194-.033z"/></svg>`,
  },
  {
    id: "jira",
    name: "Jira",
    baseBg: "#eee8de",
    sheenColor: 0xffffff,
    metalness: 0.03,
    roughness: 0.2,
    iconScale: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="6 6 116 116"><defs><linearGradient id="jr-grad-a" gradientUnits="userSpaceOnUse" x1="22.034" y1="9.773" x2="17.118" y2="14.842" gradientTransform="scale(4)"><stop offset=".176" stop-color="#0052cc"/><stop offset="1" stop-color="#2684ff"/></linearGradient><linearGradient id="jr-grad-b" gradientUnits="userSpaceOnUse" x1="16.641" y1="15.564" x2="10.957" y2="21.094" gradientTransform="scale(4)"><stop offset=".176" stop-color="#0052cc"/><stop offset="1" stop-color="#2684ff"/></linearGradient></defs><path d="M108.023 16H61.805c0 11.52 9.324 20.848 20.847 20.848h8.5v8.226c0 11.52 9.328 20.848 20.848 20.848V19.977A3.98 3.98 0 00108.023 16zm0 0" fill="#2684ff"/><path d="M85.121 39.04H38.902c0 11.519 9.325 20.847 20.844 20.847h8.504v8.226c0 11.52 9.328 20.848 20.848 20.848V43.016a3.983 3.983 0 00-3.977-3.977zm0 0" fill="url(#jr-grad-a)"/><path d="M62.219 62.078H16c0 11.524 9.324 20.848 20.848 20.848h8.5v8.23c0 11.52 9.328 20.844 20.847 20.844V66.059a3.984 3.984 0 00-3.976-3.98zm0 0" fill="url(#jr-grad-b)"/></svg>`,
  },
  {
    id: "vercel",
    name: "Vercel",
    baseBg: "#141418",
    sheenColor: 0xd8dde8,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -2.2 26 26"><path fill="#f5f1e8" d="m12 1.608 12 20.784H0Z"/></svg>`,
  },
  {
    id: "github",
    name: "GitHub",
    baseBg: "#eee8de",
    sheenColor: 0xffffff,
    metalness: 0.03,
    roughness: 0.2,
    iconScale: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-1 -1 26 26"><path fill="#151519" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  },
  {
    id: "slack",
    name: "Slack",
    baseBg: "#18181d",
    sheenColor: 0xd8dde8,
    metalness: 0.08,
    roughness: 0.25,
    iconScale: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-4 -4 136 136"><path d="M27.255 80.719c0 7.33-5.978 13.317-13.309 13.317C6.616 94.036.63 88.049.63 80.719s5.987-13.317 13.317-13.317h13.309zm6.709 0c0-7.33 5.987-13.317 13.317-13.317s13.317 5.986 13.317 13.317v33.335c0 7.33-5.986 13.317-13.317 13.317-7.33 0-13.317-5.987-13.317-13.317zm0 0" fill="#de1c59"/><path d="M47.281 27.255c-7.33 0-13.317-5.978-13.317-13.309C33.964 6.616 39.951.63 47.281.63s13.317 5.987 13.317 13.317v13.309zm0 6.709c7.33 0 13.317 5.987 13.317 13.317s-5.986 13.317-13.317 13.317H13.946C6.616 60.598.63 54.612.63 47.281c0-7.33 5.987-13.317 13.317-13.317zm0 0" fill="#35c5f0"/><path d="M100.745 47.281c0-7.33 5.978-13.317 13.309-13.317 7.33 0 13.317 5.987 13.317 13.317s-5.987 13.317-13.317 13.317h-13.309zm-6.709 0c0 7.33-5.987 13.317-13.317 13.317s-13.317-5.986-13.317-13.317V13.946C67.402 6.616 73.388.63 80.719.63c7.33 0 13.317 5.987 13.317 13.317zm0 0" fill="#2eb57d"/><path d="M80.719 100.745c7.33 0 13.317 5.978 13.317 13.309 0 7.33-5.987 13.317-13.317 13.317s-13.317-5.987-13.317-13.317v-13.309zm0-6.709c-7.33 0-13.317-5.987-13.317-13.317s5.986-13.317 13.317-13.317h33.335c7.33 0 13.317 5.986 13.317 13.317 0 7.33-5.987 13.317-13.317 13.317zm0 0" fill="#ebb02e"/></svg>`,
  },
];

export function createBrandOrbTextures(
  spec: OrbBrandSpec,
  maxAnisotropy: number,
  onLoaded: () => void,
  colorSize = 1024,
  bumpSize = 512
): { colorTex: CanvasTexture; bumpTex: CanvasTexture } {
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = colorSize;
  colorCanvas.height = colorSize;
  const colorCtx = colorCanvas.getContext("2d");
  if (colorCtx) {
    colorCtx.fillStyle = spec.baseBg;
    colorCtx.fillRect(0, 0, colorSize, colorSize);
  }

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = bumpSize;
  bumpCanvas.height = bumpSize;
  const bumpCtx = bumpCanvas.getContext("2d");
  if (bumpCtx) {
    bumpCtx.fillStyle = "#ffffff";
    bumpCtx.fillRect(0, 0, bumpSize, bumpSize);
  }

  const colorTex = new CanvasTexture(colorCanvas);
  colorTex.colorSpace = SRGBColorSpace;
  colorTex.anisotropy = Math.min(8, maxAnisotropy);

  const bumpTex = new CanvasTexture(bumpCanvas);
  bumpTex.anisotropy = Math.min(4, maxAnisotropy);

  const img = new window.Image();
  img.onload = () => {
    img.onload = null;
    if (colorCtx) {
      const drawSize = Math.round(colorSize * spec.iconScale);
      const offset = (colorSize - drawSize) / 2;
      colorCtx.imageSmoothingEnabled = true;
      colorCtx.imageSmoothingQuality = "high";
      colorCtx.fillStyle = spec.baseBg;
      colorCtx.fillRect(0, 0, colorSize, colorSize);
      colorCtx.drawImage(img, offset, offset, drawSize, drawSize);
      colorTex.needsUpdate = true;
    }

    if (bumpCtx) {
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = bumpSize;
      maskCanvas.height = bumpSize;
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        const bumpDrawSize = Math.round(bumpSize * spec.iconScale);
        const bumpOffset = (bumpSize - bumpDrawSize) / 2;
        maskCtx.imageSmoothingEnabled = true;
        maskCtx.imageSmoothingQuality = "high";
        maskCtx.drawImage(
          img,
          bumpOffset,
          bumpOffset,
          bumpDrawSize,
          bumpDrawSize
        );
        maskCtx.globalCompositeOperation = "source-in";
        maskCtx.fillStyle = "#363636";
        maskCtx.fillRect(0, 0, bumpSize, bumpSize);

        bumpCtx.fillStyle = "#ffffff";
        bumpCtx.fillRect(0, 0, bumpSize, bumpSize);
        bumpCtx.save();
        bumpCtx.filter = `blur(${(3.2 * (bumpSize / 512)).toFixed(2)}px)`;
        bumpCtx.drawImage(maskCanvas, 0, 0);
        bumpCtx.filter = "none";
        bumpCtx.restore();
        bumpTex.needsUpdate = true;
      }
    }

    onLoaded();
  };

  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(spec.svg);

  return { colorTex, bumpTex };
}
