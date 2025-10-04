import { createMemo, createSignal } from "solid-js";

export function createRayCompute() {
  const [radius, setRadius] = createSignal(5);
  const focalLength = createMemo(() => radius() * 0.5);

  return {
    radius,
    setRadius,
    focalLength,
    setFocalLength: (distance: number) => {
      setRadius(distance * 2);
    },
  };
}
