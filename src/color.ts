export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

export interface OklabColor {
	l: number;
	a: number;
	b: number;
}

export function getLuminance(rgb: RgbColor): number {
	// Using relative luminance formula
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function rgbToOklab(rgb: RgbColor): OklabColor {
	// Normalize RGB values to 0-1
	let r = rgb.r / 255;
	let g = rgb.g / 255;
	let b = rgb.b / 255;

	// Apply gamma correction
	r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
	g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
	b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

	// Convert to linear RGB
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	// Apply cube root
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	// Convert to Oklab
	return {
		l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
	};
}
