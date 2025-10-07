import { createMemo, createSignal } from "solid-js";

type Range = {
  min: number;
  max: number;
};

export const DISTANCE_RANGE: Range = { min: 30, max: 125 };
export const HEIGHT_RANGE: Range = { min: 4, max: 20 };
export const RADIUS_RANGE: Range = { min: 64, max: 150 };
export const CM_TO_PX = 4;
export const OBJ_W_PX = 6;
export const MIRROR_HEIGHT = 64;

export function createRayCompute() {
  const [radius, setRadius] = createSignal(100);
  const [distance, setDistance] = createSignal(40);
  const [isConvex, setIsConvex] = createSignal(true);
  const [objectHeight, setObjectHeight] = createSignal(16);

  const focalLength = createMemo(() => {
    return radius() * 0.5;
  });

  const imageDistance = createMemo(() => {
    const u = distance();

    if (isConvex()) {
      const f = -focalLength();
      return (u * f) / (u - f);
    } else {
      const f = focalLength();
      return (u * f) / (u - f);
    }
  });

  const magnification = createMemo(() => -(imageDistance() / distance()));
  const imageHeight = createMemo(() => objectHeight() * magnification());

  return {
    radius,
    setRadius: (r: number) =>
      setRadius(Math.min(Math.max(RADIUS_RANGE.min, r), RADIUS_RANGE.max)),

    focalLength,
    setFocalLength: (d: number) =>
      setRadius(Math.min(Math.max(RADIUS_RANGE.min, d * 2), RADIUS_RANGE.max)),

    distance,
    setDistance: (h: number) =>
      setDistance(
        Math.min(Math.max(DISTANCE_RANGE.min, h), DISTANCE_RANGE.max)
      ),

    isConvex,
    setIsConvex,

    objectHeight,
    setObjectHeight: (h: number) =>
      setObjectHeight(
        Math.min(Math.max(HEIGHT_RANGE.min, h), HEIGHT_RANGE.max)
      ),

    imageDistance,
    magnification,
    imageHeight,
  };
}
