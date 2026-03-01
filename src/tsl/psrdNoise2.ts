/**
 * psrdNoise2.ts
 *
 * TSL port of GLSL implementation.
 * @see https://github.com/stegu/psrdnoise/blob/main/src/psrdnoise2.glsl
 *
 * MIT License
 * @license Copyright (C) 2021 Stefan Gustavson and Ian McEwan (Original GLSL)
 * @license Copyright (C) 2026 Yuichiroh Arai (TSL port of GLSL)
 */
import { Fn } from "three/tsl";
import type { Node } from "three/webgpu";
import { psrddNoise2 } from "./psrddNoise2.js";

/**
 * 2-D tiling simplex noise with rotating gradients.
 *
 * @param pos - The point to evaluate.
 * @param period - The desired periods along x and y.
 * @param rotation - The rotation (in radians) for the swirling gradients.
 * @returns Noise value in [-1, 1].
 */
export const psrdNoise2 = Fn(
  ([pos, period, rotation]: [
    Node<"vec2">,
    Node<"vec2"> | undefined,
    Node<"float"> | undefined,
  ]) => {
    return psrddNoise2(pos, period, rotation).noise;
  },
) as unknown as (
  pos: Node<"vec2">,
  period?: Node<"vec2">,
  rotation?: Node<"float">,
) => Node<"float">;
