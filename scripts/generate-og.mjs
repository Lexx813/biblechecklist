import sharp from "sharp";

const W = 1200;
const H = 630;

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0D0620"/>
      <stop offset="50%"  stop-color="#1E0D3C"/>
      <stop offset="100%" stop-color="#2D1060"/>
    </linearGradient>

    <!-- Purple glow top-left -->
    <radialGradient id="glow1" cx="20%" cy="30%" r="45%">
      <stop offset="0%"   stop-color="#6A3DAA" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#6A3DAA" stop-opacity="0"/>
    </radialGradient>

    <!-- Teal glow bottom-right -->
    <radialGradient id="glow2" cx="85%" cy="75%" r="40%">
      <stop offset="0%"   stop-color="#0EA5E9" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/>
    </radialGradient>

    <!-- Accent glow centre -->
    <radialGradient id="glow3" cx="50%" cy="50%" r="35%">
      <stop offset="0%"   stop-color="#C084FC" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0"/>
    </radialGradient>

    <!-- Badge gradient -->
    <linearGradient id="badgeBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#4F2D85"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>

    <!-- Title gradient -->
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="60%"  stop-color="#E9D5FF"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>

    <!-- Progress bar gradient -->
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <rect width="${W}" height="${H}" fill="url(#glow3)"/>

  <!-- Subtle grid lines -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="157" x2="${W}" y2="157"/>
    <line x1="0" y1="315" x2="${W}" y2="315"/>
    <line x1="0" y1="472" x2="${W}" y2="472"/>
    <line x1="300" y1="0" x2="300" y2="${H}"/>
    <line x1="600" y1="0" x2="600" y2="${H}"/>
    <line x1="900" y1="0" x2="900" y2="${H}"/>
  </g>

  <!-- Badge pill -->
  <rect x="80" y="72" width="230" height="38" rx="19" fill="rgba(192,132,252,0.15)" stroke="rgba(192,132,252,0.4)" stroke-width="1.5"/>
  <text x="195" y="97" font-family="Georgia, serif" font-size="15" font-weight="600" fill="#C084FC" text-anchor="middle" letter-spacing="2">✦ NWT BIBLE</text>

  <!-- Main title -->
  <text x="80" y="205" font-family="Georgia, serif" font-size="88" font-weight="700" fill="url(#titleGrad)" letter-spacing="-2">JW Study</text>

  <!-- Tagline -->
  <text x="80" y="268" font-family="Georgia, serif" font-size="28" fill="rgba(220,200,255,0.75)" letter-spacing="0.5">Track · Learn · Grow in Scripture</text>

  <!-- Divider -->
  <rect x="80" y="300" width="120" height="3" rx="2" fill="url(#barGrad)"/>

  <!-- Feature pills row -->
  <!-- Pill 1: 66 Books -->
  <rect x="80" y="336" width="172" height="44" rx="12" fill="rgba(106,61,170,0.35)" stroke="rgba(106,61,170,0.7)" stroke-width="1.5"/>
  <text x="166" y="364" font-family="Georgia, serif" font-size="18" fill="#E9D5FF" text-anchor="middle">📖  66 Books</text>

  <!-- Pill 2: 12 Quiz Levels -->
  <rect x="272" y="336" width="210" height="44" rx="12" fill="rgba(106,61,170,0.35)" stroke="rgba(106,61,170,0.7)" stroke-width="1.5"/>
  <text x="377" y="364" font-family="Georgia, serif" font-size="18" fill="#E9D5FF" text-anchor="middle">🏆  12 Quiz Levels</text>

  <!-- Pill 3: Community -->
  <rect x="502" y="336" width="188" height="44" rx="12" fill="rgba(106,61,170,0.35)" stroke="rgba(106,61,170,0.7)" stroke-width="1.5"/>
  <text x="596" y="364" font-family="Georgia, serif" font-size="18" fill="#E9D5FF" text-anchor="middle">💬  Community</text>

  <!-- Progress bar section -->
  <text x="80" y="440" font-family="Georgia, serif" font-size="15" fill="rgba(200,180,255,0.55)" letter-spacing="2">BIBLE READING PROGRESS</text>
  <rect x="80" y="456" width="760" height="10" rx="5" fill="rgba(255,255,255,0.08)"/>
  <rect x="80" y="456" width="456" height="10" rx="5" fill="url(#barGrad)"/>
  <text x="856" y="468" font-family="Georgia, serif" font-size="16" fill="#C084FC" font-weight="700">60%</text>

  <!-- Domain badge bottom-right -->
  <rect x="870" y="72" width="254" height="48" rx="14" fill="url(#badgeBg)" opacity="0.9"/>
  <text x="997" y="103" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">nwtprogress.com</text>

  <!-- Book spine decorations right side -->
  <g opacity="0.18">
    <rect x="1060" y="200" width="18" height="300" rx="4" fill="#7C3AED"/>
    <rect x="1086" y="230" width="18" height="260" rx="4" fill="#0EA5E9"/>
    <rect x="1112" y="210" width="18" height="280" rx="4" fill="#C084FC"/>
    <rect x="1138" y="250" width="18" height="220" rx="4" fill="#7C3AED"/>
    <rect x="1164" y="190" width="18" height="310" rx="4" fill="#0EA5E9"/>
  </g>

  <!-- Bottom URL -->
  <text x="80" y="590" font-family="Georgia, serif" font-size="16" fill="rgba(200,180,255,0.4)" letter-spacing="1">nwtprogress.com</text>
</svg>
`;

const buf = Buffer.from(svg);
await sharp(buf).png().toFile("public/og-image.png");
console.log("✅  public/og-image.png created (1200×630)");
