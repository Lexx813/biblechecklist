const AVATAR_GRADIENTS: [string, string][] = [
  ["#7c3aed","#3b0764"], ["#1d4ed8","#1e3a8a"], ["#059669","#064e3b"],
  ["#ea580c","#7c2d12"], ["#db2777","#831843"], ["#0891b2","#164e63"],
  ["#7c3aed","#4c1d95"], ["#16a34a","#14532d"], ["#d97706","#78350f"],
  ["#dc2626","#7f1d1d"], ["#0284c7","#0c4a6e"], ["#9333ea","#581c87"],
];

export function avatarGradient(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}
