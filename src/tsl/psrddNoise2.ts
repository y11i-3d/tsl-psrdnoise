/**
 * psrddNoise2.ts
 *
 * TSL port of GLSL implementation.
 * @see https://github.com/stegu/psrdnoise/blob/main/src/psrddnoise2.glsl
 *
 * MIT License
 * @license Copyright (C) 2021 Stefan Gustavson and Ian McEwan (Original GLSL)
 * @license Copyright (C) 2026 Yuichiroh Arai (TSL port of GLSL)
 */
import {
  cos,
  dot,
  float,
  floor,
  fract,
  greaterThan,
  max,
  mod,
  select,
  sin,
  step,
  vec2,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";

/**
 * 2-D tiling simplex noise with rotating gradients
 * and first and second order analytical derivatives.
 *
 * Must be called inside a `Fn()` callback, as it uses `.toVar()` and `.assign()` internally.
 *
 * @param pos - The point to evaluate.
 * @param period - The desired periods along x and y.
 * @param rotation - The rotation (in radians) for the swirling gradients.
 * @returns Object containing noise value in [-1, 1], gradient (1st order), and dg (2nd order derivatives).
 */
export const psrddNoise2 = (
  pos: Node<"vec2">,
  period?: Node<"vec2">,
  rotation?: Node<"float">,
): {
  noise: Node<"float">;
  gradient: Node<"vec2">;
  dg: Node<"vec3">;
} => {
  const uv = vec2(pos.x.add(pos.y.mul(0.5)), pos.y).toVar();

  const i0 = floor(uv).toVar();
  const f0 = fract(uv).toVar();

  const cmp = step(f0.y, f0.x).toVar();
  const o1 = vec2(cmp, float(1.0).sub(cmp)).toVar();

  const i1 = i0.add(o1).toVar();
  const i2 = i0.add(vec2(1.0, 1.0)).toVar();

  const v0 = vec2(i0.x.sub(i0.y.mul(0.5)), i0.y).toVar();
  const v1 = vec2(v0.x.add(o1.x).sub(o1.y.mul(0.5)), v0.y.add(o1.y)).toVar();
  const v2 = vec2(v0.x.add(0.5), v0.y.add(1.0)).toVar();

  const x0 = pos.sub(v0).toVar();
  const x1 = pos.sub(v1).toVar();
  const x2 = pos.sub(v2).toVar();

  const iu = vec3(0.0).toVar();
  const iv = vec3(0.0).toVar();

  if (period !== undefined) {
    const v_x = vec3(v0.x, v1.x, v2.x);
    const v_y = vec3(v0.y, v1.y, v2.y);

    // In this case, select() emits an if-statement in the generated shader.
    // With a uniform or constant period, the branch should be effectively free.
    const xw = select(
      greaterThan(period.x, 0.0),
      mod(v_x, period.x),
      v_x,
    ).toVar();
    const yw = select(
      greaterThan(period.y, 0.0),
      mod(v_y, period.y),
      v_y,
    ).toVar();

    iu.assign(floor(xw.add(yw.mul(0.5)).add(0.5)));
    iv.assign(floor(yw.add(0.5)));
  } else {
    iu.assign(vec3(i0.x, i1.x, i2.x));
    iv.assign(vec3(i0.y, i1.y, i2.y));
  }

  const hash = mod(iu, 289.0).toVar();
  hash.assign(mod(hash.mul(51.0).add(2.0).mul(hash).add(iv), 289.0));
  hash.assign(mod(hash.mul(34.0).add(10.0).mul(hash), 289.0));

  const psi = hash.mul(0.07482).toVar();
  if (rotation !== undefined) {
    psi.assign(psi.add(rotation));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gx = cos(psi as any).toVar() as unknown as Node<"vec3">;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gy = sin(psi as any).toVar() as unknown as Node<"vec3">;

  const g0 = vec2(gx.x, gy.x).toVar();
  const g1 = vec2(gx.y, gy.y).toVar();
  const g2 = vec2(gx.z, gy.z).toVar();

  const w = float(0.8)
    .sub(vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)))
    .toVar();
  w.assign(max(w, 0.0));
  const w2 = w.mul(w).toVar();
  const w4 = w2.mul(w2).toVar();

  const gdotx = vec3(dot(g0, x0), dot(g1, x1), dot(g2, x2)).toVar();

  const n = dot(w4, gdotx).toVar();

  const w3 = w2.mul(w).toVar();
  const dw = float(-8.0).mul(w3).mul(gdotx).toVar();
  const dn0 = w4.x.mul(g0).add(dw.x.mul(x0)).toVar();
  const dn1 = w4.y.mul(g1).add(dw.y.mul(x1)).toVar();
  const dn2 = w4.z.mul(g2).add(dw.z.mul(x2)).toVar();
  const gradient = float(10.9).mul(dn0.add(dn1).add(dn2)).toVar();

  const dg0 = vec3(0.0).toVar();
  const dg1 = vec3(0.0).toVar();
  const dg2 = vec3(0.0).toVar();

  const dw2 = float(48.0).mul(w2).mul(gdotx).toVar();

  dg0.xy.assign(
    dw2.x
      .mul(x0)
      .mul(x0)
      .sub(float(8.0).mul(w3.x).mul(float(2.0).mul(g0).mul(x0).add(gdotx.x))),
  );

  dg1.xy.assign(
    dw2.y
      .mul(x1)
      .mul(x1)
      .sub(float(8.0).mul(w3.y).mul(float(2.0).mul(g1).mul(x1).add(gdotx.y))),
  );

  dg2.xy.assign(
    dw2.z
      .mul(x2)
      .mul(x2)
      .sub(float(8.0).mul(w3.z).mul(float(2.0).mul(g2).mul(x2).add(gdotx.z))),
  );

  dg0.z.assign(
    dw2.x
      .mul(x0.x)
      .mul(x0.y)
      .sub(float(8.0).mul(w3.x).mul(dot(g0, x0.yx))),
  );
  dg1.z.assign(
    dw2.y
      .mul(x1.x)
      .mul(x1.y)
      .sub(float(8.0).mul(w3.y).mul(dot(g1, x1.yx))),
  );
  dg2.z.assign(
    dw2.z
      .mul(x2.x)
      .mul(x2.y)
      .sub(float(8.0).mul(w3.z).mul(dot(g2, x2.yx))),
  );

  const dg = float(10.9).mul(dg0.add(dg1).add(dg2)).toVar();

  const noise = float(10.9).mul(n).toVar();

  return { noise, gradient, dg };
};
