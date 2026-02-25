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
npm install @y11i-3d/psrdnoise
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

### API

| Function                               | Returns                        | Requires `Fn()` |
| -------------------------------------- | ------------------------------ | --------------- |
| `psrdNoise2(pos, period?, rotation?)`  | `float`                        | No              |
| `psrdNoise3(pos, period?, rotation?)`  | `float`                        | No              |
| `psrddNoise2(pos, period?, rotation?)` | `{ noise, gradient, dg }`      | Yes             |
| `psrddNoise3(pos, period?, rotation?)` | `{ noise, gradient, dg, dg2 }` | Yes             |
