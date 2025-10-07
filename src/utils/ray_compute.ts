// utils/rayCompute.ts
import { createMemo, createSignal } from "solid-js";

type Point = { x: number; y: number };
export type RayData = {
  incident?: [Point, Point];
  reflected?: [Point, Point];
  extended?: [Point, Point];
};

type Range = { min: number; max: number };

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

  const focalLength = createMemo(() => radius() * 0.5);
  const imageDistance = createMemo(() => {
    const u = distance();
    const f = isConvex() ? -focalLength() : focalLength();
    if (Math.abs(u - f) < 1e-9) return Infinity;
    return (u * f) / (u - f);
  });
  const magnification = createMemo(() => {
    const v = imageDistance();
    const u = distance();
    if (!Number.isFinite(v)) return Infinity;
    return -(v / u);
  });
  const imageHeight = createMemo(() => {
    const m = magnification();
    if (!Number.isFinite(m)) return Infinity;
    return objectHeight() * m;
  });

  const isVirtual = createMemo(
    () => imageDistance() < 0 || !Number.isFinite(imageDistance())
  );

  const objectPoint = createMemo<Point>(() => ({
    x: -distance(),
    y: -objectHeight(),
  }));

  const imagePoint = createMemo<Point>(() => {
    const vRaw = imageDistance();
    if (!Number.isFinite(vRaw)) {
      const sign = isConvex() ? -1 : 1;
      return { x: -sign * 10000, y: -objectHeight() };
    }
    const imgY = Number.isFinite(imageHeight())
      ? -imageHeight()
      : -objectHeight();
    return { x: -vRaw, y: imgY };
  });

  function linearYAtX(a: Point, b: Point, x: number) {
    if (Math.abs(b.x - a.x) < 1e-9) return a.y;
    const t = (x - a.x) / (b.x - a.x);
    return a.y + t * (b.y - a.y);
  }

  function makeBehindPoint(hit: Point, image: Point, extLenCm: number) {
    const dx = image.x - hit.x;
    const dy = image.y - hit.y;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    const factor = extLenCm / norm;
    return { x: hit.x - dx * factor, y: hit.y - dy * factor };
  }

  const pfRay = createMemo<RayData>(() => {
    const obj = objectPoint();
    const img = imagePoint();
    const hit: Point = { x: 0, y: obj.y };
    const behind = makeBehindPoint(hit, img, Math.max(distance(), 30));

    const result: RayData = { incident: [obj, hit], reflected: [hit, behind] };

    if (isVirtual()) {
      result.extended = [hit, img];
    } else {
      result.reflected = [hit, img];
      result.extended = undefined;
    }

    return result;
  });

  const fpRay = createMemo<RayData>(() => {
    const obj = objectPoint();
    const img = imagePoint();
    const f = isConvex() ? -focalLength() : focalLength();
    const focus: Point = { x: f, y: 0 };

    const hitY = linearYAtX(obj, focus, 0);
    const hit: Point = { x: 0, y: hitY };

    const behind = makeBehindPoint(hit, img, Math.max(distance(), 30));
    const result: RayData = { incident: [obj, hit], reflected: [hit, behind] };

    if (isVirtual()) {
      result.extended = [hit, img];
    } else {
      result.reflected = [hit, img];
      result.extended = undefined;
    }

    return result;
  });

  const ccRay = createMemo<RayData>(() => {
    const obj = objectPoint();
    const img = imagePoint();

    const centerX = isConvex() ? radius() : -radius();
    const center: Point = { x: centerX, y: 0 };

    const hitY = linearYAtX(obj, center, 0);
    const hit: Point = { x: 0, y: hitY };
    const behind = makeBehindPoint(hit, img, Math.max(distance(), 30));

    const result: RayData = { incident: [obj, hit], reflected: [hit, behind] };

    if (isVirtual()) {
      result.extended = [hit, img];
    } else {
      result.reflected = [hit, img];
      result.extended = undefined;
    }

    return result;
  });

  const vRay = createMemo<RayData>(() => {
    const obj = objectPoint();
    const img = imagePoint();
    const hit: Point = { x: 0, y: 0 };

    const behind = makeBehindPoint(hit, img, Math.max(distance(), 30));

    const result: RayData = { incident: [obj, hit], reflected: [hit, behind] };

    if (isVirtual()) {
      result.extended = [hit, img];
    } else {
      result.reflected = [hit, img];
      result.extended = undefined;
    }

    return result;
  });

  return {
    radius,
    setRadius: (r: number) =>
      setRadius(Math.min(Math.max(RADIUS_RANGE.min, r), RADIUS_RANGE.max)),
    focalLength,
    setFocalLength: (f: number) =>
      setRadius(Math.min(Math.max(RADIUS_RANGE.min, f * 2), RADIUS_RANGE.max)),

    distance,
    setDistance: (d: number) =>
      setDistance(
        Math.min(Math.max(DISTANCE_RANGE.min, d), DISTANCE_RANGE.max)
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
    isVirtual,

    objectPoint,
    imagePoint,

    pfRay,
    fpRay,
    ccRay,
    vRay,
  } as const;
}
