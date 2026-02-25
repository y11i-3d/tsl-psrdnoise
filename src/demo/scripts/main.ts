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
  if (prev !== current) {
    material.colorNode = make2dColorNode(current);
    material.needsUpdate = true;
  }
};

const onChangeRepeat3 = () => {
  const prev = isRepeat3.value;
  const current = getIsRepeat3();
  isRepeat3.value = current;
  if (prev !== current) {
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

const make2dColorNode = (repeat: boolean) =>
  Fn(() => {
    const noiseScale = max(float(1), floor(pow(2, p2Amp)));
    const pos = vec2(uv().x.sub(0.5).mul(p2Repeat).mul(noiseScale), float(0));
    const noiseValue = psrdNoise2(
      pos.add(baseTime.mul(p2Speed.xy.mul(vec2(-1, 1)))).add(random.xx),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repeat ? vec2(noiseScale as any, 289) : undefined,
    );
    return vec3(noiseValue.mul(0.5).add(0.5));
  })();

const make3dColorNode = (repeat: boolean) =>
  Fn(() => {
    const pos = uv().xy.sub(0.5);
    const noiseScale = max(
      float(1.0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      floor(pow(2, p3Amp as any) as unknown as Node<"vec2">),
    );

    const noiseValue = float(0).toVar();

    noiseValue.assign(
      psrdNoise3(
        vec3(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pos.mul(p3Repeat as any).mul(noiseScale),
          0,
        )
          .add(baseTime.mul(p3Speed.xyz.mul(vec3(-1, -1, 1))))
          .add(random.xxy),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        repeat ? vec3(noiseScale as any, 289) : undefined,
        currentP3Rotation,
      ),
    );
    return vec3(noiseValue.mul(0.5).add(0.5));
  })();

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
