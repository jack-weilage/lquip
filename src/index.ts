import type { SharpInput } from "sharp";
import sharp from "sharp";
import type { RgbColor } from "./color";
import { getLuminance, rgbToOklab } from "./color";
import { quantize } from "./utils";

/**
 * Options for generating a low-quality image placeholder (LQIP).
 */
export interface LQIPOptions {
	/**
	 * Whether to use fast mode (resizes image to 64px on the longest side before processing).
	 */
	fast?: boolean;
}

/**
 * Generates a 20-bit integer representing a low-quality image placeholder (LQIP) for the given image input.
 *
 * @param input - The image input (file path, buffer, etc.) compatible with Sharp.
 * @param options - Optional settings for LQIP generation.
 *
 * @returns A promise that resolves to a 20-bit integer representing the LQIP.
 */
export async function generateLQIP(input: SharpInput, options: LQIPOptions = {}): Promise<number> {
	const { fast = true } = options;
	const image = sharp(input);

	if (fast) {
		image.resize({
			width: 64,
			height: 64,
			fit: "inside",
			withoutEnlargement: true,
			kernel: sharp.kernel.lanczos3,
		});
	}

	const stats = await image.stats();
	const baseColor = stats.dominant;

	// Convert base color to Oklab
	const oklab = rgbToOklab(baseColor);

	// Quantize Oklab values
	// L: 2 bits (0-3), range 0.2-0.8
	const quantizedL = quantize(oklab.l, 0.2, 0.8, 2);
	// a: 3 bits (0-7), range -0.35-0.35
	const quantizedA = quantize(oklab.a, -0.35, 0.35, 3);
	// b: 3 bits (0-7), range -0.35-0.35
	const quantizedB = quantize(oklab.b, -0.35, 0.35, 3);

	// Resize image to 3x2 to get brightness components
	const resized = await image
		.resize({
			width: 3,
			height: 2,
			kernel: sharp.kernel.cubic,
			fit: "fill",
		})
		.sharpen({ sigma: 1 })
		.raw()
		.toBuffer({ resolveWithObject: true });

	// Extract brightness values for each of the 6 cells
	const brightnessComponents: number[] = [];
	const pixelData = resized.data;
	const channels = resized.info.channels;

	for (let y = 0; y < 2; y++) {
		for (let x = 0; x < 3; x++) {
			const index = (y * 3 + x) * channels;
			const pixel: RgbColor = {
				r: pixelData[index] ?? 0,
				g: pixelData[index + 1] ?? 0,
				b: pixelData[index + 2] ?? 0,
			};

			// Get luminance and quantize to 2 bits (0-3)
			const luminance = getLuminance(pixel);
			const quantizedLuminance = quantize(luminance, 0.2, 0.8, 2);
			brightnessComponents.push(quantizedLuminance);
		}
	}

	// Pack all values into a single 20-bit integer
	// Layout (from MSB to LSB):
	// - 12 bits: 6 brightness components (2 bits each)
	// - 2 bits: Oklab L
	// - 3 bits: Oklab a
	// - 3 bits: Oklab b
	let lqipValue = 0;

	// Pack brightness components (higher 12 bits)
	for (let i = 0; i < 6; i++) {
		lqipValue |= ((brightnessComponents[i] ?? 0) & 0b11) << (8 + (5 - i) * 2);
	}

	// Pack Oklab values (lower 8 bits)
	lqipValue |= (quantizedL & 0b11) << 6;
	lqipValue |= (quantizedA & 0b111) << 3;
	lqipValue |= quantizedB & 0b111;

	// Offset to ensure the value stays within CSS integer limits
	lqipValue -= 2 ** 19;

	return lqipValue;
}
