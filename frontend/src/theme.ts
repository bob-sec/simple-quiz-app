/**
 * Apply theme color as CSS custom properties.
 * The hex color from quiz_data.json becomes the primary color,
 * with light/dark variants calculated automatically.
 */
export function applyTheme(hexColor: string): void {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", hexColor);
  root.style.setProperty("--color-primary-light", lighten(hexColor, 20));
  root.style.setProperty("--color-primary-dark", darken(hexColor, 20));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r - amount, g - amount, b - amount);
}
