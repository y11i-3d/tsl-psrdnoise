/**
 * psrddNoise3.ts
 *
 * TSL port of GLSL implementation.
 * @see https://github.com/stegu/psrdnoise/blob/main/src/psrddnoise3.glsl
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
  mat3,
  max,
  min,
  mod,
  select,
  sin,
  sqrt,
  step,
  vec3,
  vec4,
} from "three/tsl";
import type { Node } from "three/webgpu";

// Permutation polynomial for the hash value
const permute = (i: Node<"vec4">) => {
  const im = mod(i, 289.0).toVar();
  return mod(im.mul(34.0).add(10.0).mul(im), 289.0);
};

/**
 * 3-D tiling simplex noise with rotating gradients and first and
 * second order analytical derivatives.
 *
 * Must be called inside a `Fn()` callback, as it uses `.toVar()` and `.assign()` internally.
 *
 * @param pos - The point to evaluate.
 * @param period - The desired periods along x, y, and z.
 * @param rotation - The rotation (in radians) for the swirling gradients.
 * @returns Object containing noise value in [-1, 1], gradient (1st order), dg (2nd order, d2n/dx2 etc), and dg2 (2nd order, d2n/dxy etc).
 */
export const psrddNoise3 = (
  pos: Node<"vec3">,
  period?: Node<"vec3">,
  rotation?: Node<"float">,
): {
  noise: Node<"float">;
  gradient: Node<"vec3">;
  dg: Node<"vec3">;
  dg2: Node<"vec3">;
} => {
  const M = mat3(
    vec3(0.0, 1.0, 1.0),
    vec3(1.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0),
  ).toVar();

  const Mi = mat3(
    vec3(-0.5, 0.5, 0.5),
    vec3(0.5, -0.5, 0.5),
    vec3(0.5, 0.5, -0.5),
  ).toVar();

  const uvw = M.mul(pos).toVar();

  const i0 = floor(uvw).toVar();
  const f0 = fract(uvw).toVar();

  const g_ = (
    step(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vec3(f0.x, f0.y, f0.x) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vec3(f0.y, f0.z, f0.z) as any,
    ) as unknown as Node<"vec3">
  ).toVar();

  const l_ = float(1.0).sub(g_).toVar();

  const g = vec3(l_.z, g_.x, g_.y).toVar();
  const l = vec3(l_.x, l_.y, g_.z).toVar();

  const o1 = min(g, l).toVar();
  const o2 = max(g, l).toVar();

  const i1 = i0.add(o1).toVar();
  const i2 = i0.add(o2).toVar();
  const i3 = i0.add(float(1.0)).toVar();

  const v0 = Mi.mul(i0).toVar();
  const v1 = Mi.mul(i1).toVar();
  const v2 = Mi.mul(i2).toVar();
  const v3 = Mi.mul(i3).toVar();

  const x0 = pos.sub(v0).toVar();
  const x1 = pos.sub(v1).toVar();
  const x2 = pos.sub(v2).toVar();
  const x3 = pos.sub(v3).toVar();

  if (period !== undefined) {
    const v_x = vec4(v0.x, v1.x, v2.x, v3.x);
    const v_y = vec4(v0.y, v1.y, v2.y, v3.y);
    const v_z = vec4(v0.z, v1.z, v2.z, v3.z);

    const vx = select(
      greaterThan(period.x, 0.0),
      mod(v_x, period.x),
      v_x,
    ).toVar();
    const vy = select(
      greaterThan(period.y, 0.0),
      mod(v_y, period.y),
      v_y,
    ).toVar();
    const vz = select(
      greaterThan(period.z, 0.0),
      mod(v_z, period.z),
      v_z,
    ).toVar();

    const vv0 = vec3(vx.x, vy.x, vz.x).toVar();
    const vv1 = vec3(vx.y, vy.y, vz.y).toVar();
    const vv2 = vec3(vx.z, vy.z, vz.z).toVar();
    const vv3 = vec3(vx.w, vy.w, vz.w).toVar();

    i0.assign(floor(M.mul(vv0).add(0.5)));
    i1.assign(floor(M.mul(vv1).add(0.5)));
    i2.assign(floor(M.mul(vv2).add(0.5)));
    i3.assign(floor(M.mul(vv3).add(0.5)));
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hashCtx1 = vec4(
    (i0 as any).z,
    (i1 as any).z,
    (i2 as any).z,
    (i3 as any).z,
  ).toVar();
  const hashCtx2 = vec4(
    (i0 as any).y,
    (i1 as any).y,
    (i2 as any).y,
    (i3 as any).y,
  ).toVar();
  const hashCtx3 = vec4(
    (i0 as any).x,
    (i1 as any).x,
    (i2 as any).x,
    (i3 as any).x,
  ).toVar();
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const hash = permute(
    permute(permute(hashCtx1).add(hashCtx2)).add(hashCtx3),
  ).toVar();

  const theta = hash.mul(3.883222077).toVar();
  const sz = hash.mul(-0.006920415).add(0.996539792).toVar();
  const psi = hash.mul(0.108705628).toVar();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ct = cos(theta as any).toVar() as unknown as Node<"vec4">;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const St = sin(theta as any).toVar() as unknown as Node<"vec4">;

  const sz_prime = (
    sqrt(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      float(1.0).sub(sz.mul(sz)) as any,
    ) as unknown as Node<"vec4">
  ).toVar();

  const gx = vec4(0.0).toVar();
  const gy = vec4(0.0).toVar();
  const gz = vec4(0.0).toVar();

  if (rotation !== undefined) {
    psi.assign(psi.add(rotation));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sa = sin(psi as any).toVar() as unknown as Node<"vec4">;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ca = cos(psi as any).toVar() as unknown as Node<"vec4">;

    // Use fast algorithm from FASTROTATION define since we don't have dynamic GLSL shortcut in JS branching
    const qx = St.toVar();
    const qy = Ct.negate().toVar();
    const qz = vec4(0.0).toVar();

    const px = sz.mul(qy).toVar();
    const py = sz.negate().mul(qx).toVar();
    const pz = sz_prime.toVar();

    gx.assign(Ca.mul(px).add(Sa.mul(qx)));
    gy.assign(Ca.mul(py).add(Sa.mul(qy)));
    gz.assign(Ca.mul(pz).add(Sa.mul(qz)));
  } else {
    gx.assign(Ct.mul(sz_prime));
    gy.assign(St.mul(sz_prime));
    gz.assign(sz);
  }

  const g0 = vec3(gx.x, gy.x, gz.x).toVar();
  const g1 = vec3(gx.y, gy.y, gz.y).toVar();
  const g2 = vec3(gx.z, gy.z, gz.z).toVar();
  const g3 = vec3(gx.w, gy.w, gz.w).toVar();

  const w = vec4(0.5)
    .sub(vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)))
    .toVar();
  w.assign(max(w, 0.0));
  const w2 = w.mul(w).toVar();
  const w3 = w2.mul(w).toVar();

  const gdotx = vec4(
    dot(g0, x0),
    dot(g1, x1),
    dot(g2, x2),
    dot(g3, x3),
  ).toVar();
  const n = dot(w3, gdotx).toVar();

  const dw = float(-6.0).mul(w2).mul(gdotx).toVar();
  const dn0 = w3.x.mul(g0).add(dw.x.mul(x0)).toVar();
  const dn1 = w3.y.mul(g1).add(dw.y.mul(x1)).toVar();
  const dn2 = w3.z.mul(g2).add(dw.z.mul(x2)).toVar();
  const dn3 = w3.w.mul(g3).add(dw.w.mul(x3)).toVar();
  const gradient = float(39.5).mul(dn0.add(dn1).add(dn2).add(dn3)).toVar();

  const dw2 = float(24.0).mul(w).mul(gdotx).toVar();

  const dga0 = dw2.x
    .mul(x0)
    .mul(x0)
    .sub(
      float(6.0)
        .mul(w2.x)
        .mul(gdotx.x.add(float(2.0).mul(g0).mul(x0))),
    )
    .toVar();
  const dga1 = dw2.y
    .mul(x1)
    .mul(x1)
    .sub(
      float(6.0)
        .mul(w2.y)
        .mul(gdotx.y.add(float(2.0).mul(g1).mul(x1))),
    )
    .toVar();
  const dga2 = dw2.z
    .mul(x2)
    .mul(x2)
    .sub(
      float(6.0)
        .mul(w2.z)
        .mul(gdotx.z.add(float(2.0).mul(g2).mul(x2))),
    )
    .toVar();
  const dga3 = dw2.w
    .mul(x3)
    .mul(x3)
    .sub(
      float(6.0)
        .mul(w2.w)
        .mul(gdotx.w.add(float(2.0).mul(g3).mul(x3))),
    )
    .toVar();
  const dg = float(35.0).mul(dga0.add(dga1).add(dga2).add(dga3)).toVar();

  const dgb0 = dw2.x
    .mul(x0)
    .mul(x0.yzx)
    .sub(
      float(6.0)
        .mul(w2.x)
        .mul(g0.mul(x0.yzx).add(g0.yzx.mul(x0))),
    )
    .toVar();
  const dgb1 = dw2.y
    .mul(x1)
    .mul(x1.yzx)
    .sub(
      float(6.0)
        .mul(w2.y)
        .mul(g1.mul(x1.yzx).add(g1.yzx.mul(x1))),
    )
    .toVar();
  const dgb2 = dw2.z
    .mul(x2)
    .mul(x2.yzx)
    .sub(
      float(6.0)
        .mul(w2.z)
        .mul(g2.mul(x2.yzx).add(g2.yzx.mul(x2))),
    )
    .toVar();
  const dgb3 = dw2.w
    .mul(x3)
    .mul(x3.yzx)
    .sub(
      float(6.0)
        .mul(w2.w)
        .mul(g3.mul(x3.yzx).add(g3.yzx.mul(x3))),
    )
    .toVar();
  const dg2 = float(39.5).mul(dgb0.add(dgb1).add(dgb2).add(dgb3)).toVar();

  const noise = float(39.5).mul(n).toVar();

  return { noise, gradient, dg, dg2 };
};
