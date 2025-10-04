import { createMemo, createSignal } from "solid-js";

export function createRayCompute() {
  const [radius, setRadius] = createSignal(5);
  const focalLength = createMemo(() => radius() * 0.5);
  const [isConvex, setIsConvex] = createSignal(true);

  return {
    radius,
    setRadius: (r: number) => {
      setRadius(Math.min(Math.max(1, r), 200));
    },
    focalLength,
    setFocalLength: (distance: number) => {
      setRadius(Math.min(Math.max(1, distance * 2), 200));
    },
    isConvex,
    setIsConvex,
  };
}
