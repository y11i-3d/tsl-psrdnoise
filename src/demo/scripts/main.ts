import GUI from "lil-gui";
import { Mesh } from "three";
import {
  float,
  floor,
  Fn,
  max,
  pow,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import {
  MeshBasicNodeMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGPURenderer,
  type Node,
} from "three/webgpu";
import { psrdNoise2 } from "../../tsl/psrdNoise2";
import { psrdNoise3 } from "../../tsl/psrdNoise3";

const canvas = document.querySelector("canvas")!;

const renderer = new WebGPURenderer({ canvas, antialias: true });
await renderer.init();

const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

const scene = new Scene();

const material = new MeshBasicNodeMaterial();

const p2Amp = uniform(float(4));
const p2Repeat = uniform(float(4));
const p2Speed = uniform(vec2(-0.5, 0.3));

const p3Amp = uniform(vec2(1, 1));
const p3Repeat = uniform(vec2(1, 1));
const p3Speed = uniform(vec3(0.2, 0.2, 0.4));
const p3Rotation = uniform(float(0.3));
const currentP3Rotation = uniform(0);

const getIsRepeat2 = () => p2Repeat.value > 1;
const getIsRepeat3 = () => p3Repeat.value.x > 1 || p3Repeat.value.y > 1;
const isRepeat2 = { value: getIsRepeat2() };
const isRepeat3 = { value: getIsRepeat3() };

const onChangeRepeat2 = () => {
  const prev = isRepeat2.value;
  const current = getIsRepeat2();
  isRepeat2.value = current;
  if (prev !== current && noiseType.value === "2d") {
    material.colorNode = make2dColorNode(current);
    material.needsUpdate = true;
  }
};

const onChangeRepeat3 = () => {
  const prev = isRepeat3.value;
  const current = getIsRepeat3();
  isRepeat3.value = current;
  if (prev !== current && noiseType.value === "3d") {
    material.colorNode = make3dColorNode(current);
    material.needsUpdate = true;
  }
};

const noiseType = { value: "3d" };

const onChangeNoiseType = (v: string) => {
  noiseType.value = v;
  material.colorNode =
    v === "3d"
      ? make3dColorNode(isRepeat3.value)
      : make2dColorNode(isRepeat2.value);
  material.needsUpdate = true;
};

const gui = new GUI();

gui
  .add(noiseType, "value", ["2d", "3d"])
  .name("Noise Type")
  .onChange(onChangeNoiseType);

const folder3D = gui.addFolder("Noise3D");
folder3D.add(p3Amp.value, "x", -1, 8, 1).name("Amp X");
folder3D.add(p3Amp.value, "y", -1, 8, 1).name("Amp Y");
folder3D
  .add(p3Repeat.value, "x", 1, 8, 1)
  .name("Repeat X")
  .onChange(onChangeRepeat3);
folder3D
  .add(p3Repeat.value, "y", 1, 8, 1)
  .name("Repeat Y")
  .onChange(onChangeRepeat3);
folder3D.add(p3Speed.value, "x", -1, 1, 0.1).name("Speed X");
folder3D.add(p3Speed.value, "y", -1, 1, 0.1).name("Speed Y");
folder3D.add(p3Speed.value, "z", -1, 1, 0.1).name("Speed All");
folder3D.add(p3Rotation, "value", -1, 1, 0.1).name("Rotation");

const folder2D = gui.addFolder("Noise2D");
folder2D.add(p2Amp, "value", -1, 8, 1).name("Amp");
folder2D
  .add(p2Repeat, "value", 1, 8, 1)
  .name("Repeat")
  .onChange(onChangeRepeat2);
folder2D.add(p2Speed.value, "x", -1, 1, 0.1).name("Speed X");
folder2D.add(p2Speed.value, "y", -1, 1, 0.1).name("Speed All");

const random = vec3(Math.random(), Math.random(), Math.random());
const baseTime = time.mul(Math.PI * 2 * 0.3);

const make2dColorNode = (repeat: boolean) => {
  const noiseScale = max(float(1), floor(pow(2, p2Amp)));
  const pos = vec2(uv().x.sub(0.5).mul(p2Repeat).mul(noiseScale), float(0));
  const posWithOffset = pos
    .add(baseTime.mul(p2Speed.xy.mul(vec2(-1, 1))))
    .add(random.xx);

  if (repeat) {
    // noiseFn with period
    const noiseFn = Fn(([pos, period]: [Node<"vec2">, Node<"vec2">]) =>
      psrdNoise2(pos, period),
    ).setLayout({
      name: "noise2d",
      type: "float",
      inputs: [
        { name: "pos", type: "vec2" },
        { name: "period", type: "vec2" },
      ],
    }) as (pos: Node<"vec2">, period: Node<"vec2">) => Node<"float">;

    return Fn(() => {
      const noiseValue = noiseFn(posWithOffset, vec2(noiseScale, 289));
      return vec3(noiseValue.mul(0.5).add(0.5));
    })();
  } else {
    // noiseFn without period
    const noiseFn = Fn(([pos]: [Node<"vec2">]) => psrdNoise2(pos)).setLayout({
      name: "noise2d",
      type: "float",
      inputs: [{ name: "pos", type: "vec2" }],
    }) as (pos: Node<"vec2">) => Node<"float">;

    return Fn(() => {
      const noiseValue = noiseFn(posWithOffset);
      return vec3(noiseValue.mul(0.5).add(0.5));
    })();
  }
};

const make3dColorNode = (repeat: boolean) => {
  const pos = uv().xy.sub(0.5);
  const noiseScale = max(
    float(1.0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    floor(pow(2, p3Amp as any) as unknown as Node<"vec2">),
  );
  const posWithOffset = vec3(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pos.mul(p3Repeat as any).mul(noiseScale),
    0,
  )
    .add(baseTime.mul(p3Speed.xyz.mul(vec3(-1, -1, 1))))
    .add(random.xxy);

  if (repeat) {
    // noiseFn with period and rotation
    const noiseFn = Fn(
      ([pos, period, rotation]: [Node<"vec3">, Node<"vec3">, Node<"float">]) =>
        psrdNoise3(pos, period, rotation),
    ).setLayout({
      name: "noise3d",
      type: "float",
      inputs: [
        { name: "pos", type: "vec3" },
        { name: "period", type: "vec3" },
        { name: "rotation", type: "float" },
      ],
    }) as (
      pos: Node<"vec3">,
      period: Node<"vec3">,
      rotation: Node<"float">,
    ) => Node<"float">;

    return Fn(() => {
      const noiseValue = noiseFn(
        posWithOffset,
        vec3(noiseScale, 289),
        currentP3Rotation,
      );
      return vec3(noiseValue.mul(0.5).add(0.5));
    })();
  } else {
    // noiseFn with rotation only
    const noiseFn = Fn(([pos, rotation]: [Node<"vec3">, Node<"float">]) =>
      psrdNoise3(pos, undefined, rotation),
    ).setLayout({
      name: "noise3d",
      type: "float",
      inputs: [
        { name: "pos", type: "vec3" },
        { name: "rotation", type: "float" },
      ],
    }) as (pos: Node<"vec3">, rotation: Node<"float">) => Node<"float">;

    return Fn(() => {
      const noiseValue = noiseFn(posWithOffset, currentP3Rotation);
      return vec3(noiseValue.mul(0.5).add(0.5));
    })();
  }
};

material.colorNode = float(0);
onChangeNoiseType(noiseType.value);

const geometry = new PlaneGeometry(2, 2);
const mesh = new Mesh(geometry, material);
scene.add(mesh);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const min = Math.min(w, h);
  const meshSize = min * 0.9;

  renderer.setSize(w, h);
  renderer.setPixelRatio(devicePixelRatio);

  mesh.scale.set(meshSize / w, meshSize / h, 1);
}

resize();
window.addEventListener("resize", resize);

renderer.setAnimationLoop(() => {
  currentP3Rotation.value += p3Rotation.value * (1 / 60) * Math.PI * 2;
  renderer.render(scene, camera);
});
