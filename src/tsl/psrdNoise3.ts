/**
 * psrdNoise3.ts
 *
 * TSL port of GLSL implementation.
 * @see https://github.com/stegu/psrdnoise/blob/main/src/psrdnoise3.glsl
 *
 * MIT License
 * @license Copyright (C) 2021 Stefan Gustavson and Ian McEwan (Original GLSL)
 * @license Copyright (C) 2026 Yuichiroh Arai (TSL port of GLSL)
 */
import { Fn } from "three/tsl";
import type { Node } from "three/webgpu";
import { psrddNoise3 } from "./psrddNoise3.js";

/**
 * 3-D tiling simplex noise with rotating gradients.
 *
 * @param pos - The point to evaluate.
 * @param period - The desired periods along x, y, and z.
 * @param rotation - The rotation (in radians) for the swirling gradients.
 * @returns Noise value in [-1, 1].
 */
export const psrdNoise3 = Fn(
  ([pos, period, rotation]: [
    Node<"vec3">,
    Node<"vec3"> | undefined,
    Node<"float"> | undefined,
  ]) => {
    return psrddNoise3(pos, period, rotation).noise;
  },
).setLayout({
  name: "psrdNoise3",
  type: "float",
  inputs: [
    { name: "pos", type: "vec3" },
    { name: "period", type: "vec3" },
    { name: "rotation", type: "float" },
  ],
}) as (
  pos: Node<"vec3">,
  period?: Node<"vec3">,
  rotation?: Node<"float">,
) => Node<"float">;
