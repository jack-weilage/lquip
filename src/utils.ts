export function quantize(value: number, min: number, max: number, bits: number): number {
	const levels = 2 ** bits;
	const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

	return Math.floor(normalized * (levels - 1));
}
