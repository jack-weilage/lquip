# lquip

A tiny TypeScript library that generates CSS-only Low Quality Image Placeholders (LQIP) as a single integer you can drop straight into your markup. The corresponding CSS decodes that integer back into a blurry placeholder using only gradients and modern CSS functions — no JavaScript on the client and minimal markup.

Technique inspired by and aligned with Lean Rada’s [“Minimal CSS-only blurry image placeholders”](https://leanrada.com/notes/css-only-lqip/):

## Why

- One integer per image, stored inline via a CSS custom property
- Pure CSS decode and render — no client JS, no data URLs
- Minimal markup — keep your HTML clean
- Fast to compute server-side and tiny to ship to the client

## How it works (overview)

Each image is reduced to 20 bits of information:

- 12 bits: six 2-bit greyscale components arranged in a 3×2 grid
- 8 bits: base color in Oklab — 2 bits for L, 3 bits for a, 3 bits for b

The 20-bit value is offset by 2^19 to keep it comfortably within CSS integer precision limits and then exposed to the browser as:

```
<img src="…" style="--lqip: <integer>;" />
```

A decoder stylesheet unpacks the bits using CSS math (mod, round, pow) and renders a composite of radial-gradients over a base Oklab color to approximate a blurry version of the source image.

## Install

```
npm install lquip
# or
pnpm add lquip
# or
yarn add lquip
```

## Usage

1. Generate the LQIP integer server-side

```ts
import { readFile } from "node:fs/promises";
import { generateLQIP } from "lquip";

const buf = await readFile("/path/to/image.jpg");
const value = await generateLQIP(buf, { fast: true });
```

2. Add the decoder CSS to your site

- Using a bundler that supports package subpath exports:

```css
@import "lquip/css";
```

or in Vite:

```ts
import "lquip/css";
```

- Or copy the built CSS file into your pipeline (after build it’s at `dist/lqip-decoder.css`).

3. Set the custom property inline

```
<img src="/images/pic.jpg" width="1200" height="800" style="--lqip: 192900;" />
```

Any element with a `style` attribute containing `--lqip:` gets the placeholder background applied by the decoder stylesheet. The background is layered gradients that produce a soft blurry approximation of the full image.

## API

```ts
export interface LQIPOptions {
  /**
   * Fast mode resizes to 64px (longest side) before analysis.
   * Default: true
   */
  fast?: boolean;
}

export async function generateLQIP(
  input: import("sharp").SharpInput,
  options?: LQIPOptions,
): Promise<number>;
```

## Caveats and notes

- This is intentionally a very low-fidelity placeholder — it should render instantly and be unobtrusive. It’s not a thumbnail replacement.
- The technique assumes images have a sensible dominant color and broad structure that a 3×2 grid can suggest.
- The decoder requires modern (baseline 2023) CSS features: `mod()`, `oklab()`

## Acknowledgements

- Idea and decoding technique inspired by Lean Rada’s article: https://leanrada.com/notes/css-only-lqip/

## License

MIT
