# TSL port of psrdnoise

[![npm version](https://img.shields.io/npm/v/@y11i-3d/tsl-psrdnoise.svg)](https://www.npmjs.com/package/@y11i-3d/tsl-psrdnoise)
[![Build](https://github.com/y11i-3d/tsl-psrdnoise/actions/workflows/main.yml/badge.svg)](https://github.com/y11i-3d/tsl-psrdnoise/actions/workflows/main.yml)

This is a TSL (Three.js Shading Language) implementation of psrdnoise, ported from the original GLSL source.

Special thanks to Stefan Gustavson and Ian McEwan for the original implementation.
https://github.com/stegu/psrdnoise/

**MIT License**:  
Copyright (C) 2021 Stefan Gustavson and Ian McEwan (Original GLSL)  
Copyright (C) 2026 Yuichiroh Arai (TSL port of GLSL)

## Demo

https://y11i-3d.github.io/tsl-psrdnoise/

## Installation

```sh
npm install @y11i-3d/tsl-psrdnoise
```

## Usage

### Noise only

```ts
import { uv } from "three/tsl";
import { psrdNoise2 } from "@y11i-3d/tsl-psrdnoise";

material.colorNode = psrdNoise2(uv()).mul(0.5).add(0.5);
```

### With derivatives

`psrddNoise2` and `psrddNoise3` return the noise value along with its derivatives.
They must be called inside a `Fn()` callback.

```ts
import { Fn, uv } from "three/tsl";
import { psrddNoise2 } from "@y11i-3d/tsl-psrdnoise";

material.colorNode = Fn(() => {
  const { noise, gradient, dg } = psrddNoise2(uv());
  return noise.mul(0.5).add(0.5);
})();
```

### setLayout

Since `psrdNoise2` and `psrdNoise3` do not use `setLayout`, they are not compiled as shader functions — passing `undefined` for `period` or `rotation` excludes their corresponding shader code.  
To use them as a reusable shader function with a specific combination of arguments, wrap them with `Fn` and `setLayout`:

```ts
import { Fn, uv, vec2 } from "three/tsl";
import type { Node } from "three/webgpu";
import { psrdNoise2 } from "@y11i-3d/tsl-psrdnoise";

const myNoise = Fn(([pos, period]: [Node<"vec2">, Node<"vec2">]) =>
  psrdNoise2(pos, period),
).setLayout({
  name: "myNoise",
  type: "float",
  inputs: [
    { name: "pos", type: "vec2" },
    { name: "period", type: "vec2" },
  ],
}) as (pos: Node<"vec2">, period: Node<"vec2">) => Node<"float">;

material.colorNode = Fn(() => {
  return myNoise(uv(), vec2(4, 4)).mul(0.5).add(0.5);
})();
```

### API

| Function                               | Returns                        | Requires `Fn()` |
| -------------------------------------- | ------------------------------ | --------------- |
| `psrdNoise2(pos, period?, rotation?)`  | `float`                        | No              |
| `psrdNoise3(pos, period?, rotation?)`  | `float`                        | No              |
| `psrddNoise2(pos, period?, rotation?)` | `{ noise, gradient, dg }`      | Yes             |
| `psrddNoise3(pos, period?, rotation?)` | `{ noise, gradient, dg, dg2 }` | Yes             |
