import { createMemo, createSignal } from "solid-js";

export type Point = { x: number; y: number };
export type RayData = {
  incident?: [Point, Point];
  reflected?: [Point, Point];
  extended?: [Point, Point];
  extendedIncident?: [Point, Point];
};

type Range = { min: number; max: number };
export type RayVisibility = {
  pf: boolean;
  fp: boolean;
  cc: boolean;
  v: boolean;
};

export const DISTANCE_RANGE: Range = { min: 24, max: 125 };
export const HEIGHT_RANGE: Range = { min: 4, max: 32 };
export const RADIUS_RANGE: Range = { min: 64, max: 150 };
export const CM_TO_PX = 4;
export const OBJ_W_PX = 6;
export const MIRROR_HEIGHT = 96;

function addPoint(a: Point, b: Point) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subPoint(a: Point, b: Point) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mulPoint(a: Point, s: number) {
  return { x: a.x * s, y: a.y * s };
}
function dotPoint(a: Point, b: Point) {
  return a.x * b.x + a.y * b.y;
}

function lenPoint(a: Point) {
  return Math.hypot(a.x, a.y);
}

function normalize(a: Point) {
  const L = lenPoint(a) || 1;
  return { x: a.x / L, y: a.y / L };
}

export function createRayCompute() {
  const [radius, setRadius] = createSignal(100);
  const [distance, setDistance] = createSignal(40);
  const [isConvex, setIsConvex] = createSignal(true);
  const [objectHeight, setObjectHeight] = createSignal(16);
  const [rayVisibility, setRayVisibility] = createSignal<RayVisibility>({
    pf: true,
    fp: true,
    cc: true,
    v: true,
  });

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

  const isVirtual = createMemo(
    () => imageDistance() < 0 || !Number.isFinite(imageDistance())
  );

  const imageHeight = createMemo(() => {
    const m = magnification();
    if (!Number.isFinite(m)) return Infinity;
    return objectHeight() * m;
  });

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

  function lineCircleIntersectionParam(
    p: Point,
    v: Point,
    C: Point,
    R: number
  ) {
    const pc = subPoint(p, C);
    const A = dotPoint(v, v);
    const B = 2 * dotPoint(v, pc);
    const cc = dotPoint(pc, pc) - R * R;
    const disc = B * B - 4 * A * cc;
    if (disc < 0) return undefined;
    const sqrtD = Math.sqrt(disc);
    const t1 = (-B - sqrtD) / (2 * A);
    const t2 = (-B + sqrtD) / (2 * A);
    const candidates = [t1, t2].filter((t) => t > 1e-9);
    if (candidates.length === 0) return undefined;
    return Math.min(...candidates);
  }

  function raycastToMirror(
    origin: Point,
    dir: Point,
    center: Point,
    R: number
  ) {
    const t = lineCircleIntersectionParam(origin, dir, center, R);
    if (t === undefined) return undefined;
    return addPoint(origin, mulPoint(dir, t));
  }

  function makeBehindPoint(hit: Point, image: Point, extLenCm: number) {
    const dx = image.x - hit.x;
    const dy = image.y - hit.y;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    const factor = extLenCm / norm;
    return { x: hit.x - dx * factor, y: hit.y - dy * factor };
  }

  function linearYAtX(a: Point, b: Point, x: number) {
    if (Math.abs(b.x - a.x) < 1e-9) return a.y;
    const t = (x - a.x) / (b.x - a.x);
    return a.y + t * (b.y - a.y);
  }

  function mirrorCenter(): Point {
    const cx = isConvex() ? radius() : -radius();
    return { x: cx, y: 0 };
  }

  function focalPoint(): Point {
    const c = mirrorCenter();
    return { x: c.x * 0.5, y: 0 };
  }

  const pfRay = createMemo<RayData | undefined>(() => {
    if (!rayVisibility().pf) return undefined;
    const obj = objectPoint();
    const img = imagePoint();
    const r = radius();
    const c = mirrorCenter();
    const dir = { x: 1, y: 0 };

    let hit = raycastToMirror(obj, dir, c, r);
    if (!hit) hit = { x: 0, y: obj.y };

    const result: RayData = { incident: [obj, hit] };

    if (isConvex()) {
      result.reflected = [
        hit,
        makeBehindPoint(hit, focalPoint(), Math.abs(obj.x)),
      ];
      result.extended = [hit, focalPoint()];
    } else {
      if (isVirtual()) {
        result.extended = [
          hit,
          makeBehindPoint(
            img,
            hit,
            Math.sqrt(objectHeight() ** 2 + focalLength() ** 2 + 8)
          ),
        ];
        result.reflected = [
          hit,
          makeBehindPoint(focalPoint(), hit, radius() * 0.2),
        ];
      } else {
        result.reflected = [hit, img];
      }
    }
    return result;
  });

  const fpRay = createMemo<RayData | undefined>(() => {
    if (!rayVisibility().fp) return undefined;

    const obj = objectPoint();
    const img = imagePoint();
    const r = radius();
    const c = mirrorCenter();
    const F = focalPoint();

    if (isConvex()) {
      const dir = normalize(subPoint(F, obj));
      let hit = raycastToMirror(obj, dir, c, r);
      if (!hit) hit = { x: 0, y: linearYAtX(obj, F, 0) };
      return {
        incident: [obj, hit],
        reflected: [hit, { x: obj.x + 2, y: img.y }],
        extended: [hit, img],
        extendedIncident: [hit, F],
      };
    }

    const u = distance();
    const f = focalLength();
    if (Math.abs(u - f) < 1e-6) {
      const dir = normalize(subPoint(F, obj));
      let hit = raycastToMirror(obj, dir, c, r);
      if (!hit) hit = { x: 0, y: linearYAtX(obj, F, 0) };

      const reflectedEnd: Point = { x: hit.x + 200, y: hit.y };

      return {
        incident: [obj, hit],
        reflected: [hit, reflectedEnd],
      };
    }

    if (isVirtual()) {
      return {
        extendedIncident: [obj, focalPoint()],
      };
    }

    const dir = normalize(subPoint(F, obj));
    let hit = raycastToMirror(obj, dir, c, r);
    if (!hit) hit = { x: 0, y: linearYAtX(obj, F, 0) };

    return {
      incident: [obj, hit],
      reflected: [hit, img],
    };
  });

  const ccRay = createMemo<RayData | undefined>(() => {
    if (!rayVisibility().cc) return undefined;
    const obj = objectPoint();
    const img = imagePoint();
    const r = radius();
    const c = mirrorCenter();
    const dir = normalize(subPoint(c, obj));

    let hit = raycastToMirror(obj, dir, c, r);
    if (!hit) hit = { x: 0, y: linearYAtX(obj, c, 0) };

    const result: RayData = { incident: [obj, hit] };

    if (isConvex()) {
      result.reflected = [hit, makeBehindPoint(hit, c, Math.abs(obj.x))];
      result.extended = [hit, c];
    } else {
      result.incident = [obj, c];
      if (isVirtual()) {
        const cAngle = Math.atan2(img.y, radius() + img.x);

        hit = {
          x: Math.cos(cAngle) * radius() - radius(),
          y: Math.sin(cAngle) * radius(),
        };

        result.reflected = [hit, makeBehindPoint(c, hit, radius() * 0.2)];
        result.extended = [c, makeBehindPoint(img, c, radius() * 0.2)];
      } else {
        const dr = distance() - radius();
        result.extendedIncident = [
          c,
          makeBehindPoint(
            img,
            c,
            Math.sqrt(objectHeight() * objectHeight() + dr * dr)
          ),
        ];
      }
    }

    return result;
  });

  const vRay = createMemo<RayData | undefined>(() => {
    if (!rayVisibility().v) return undefined;
    const obj = objectPoint();
    const img = imagePoint();
    const hit: Point = { x: 0, y: 0 };

    const result: RayData = { incident: [obj, hit] };

    if (isConvex()) {
      result.reflected = [hit, makeBehindPoint(hit, img, Math.abs(obj.x))];
      result.extended = [hit, img];
    } else {
      if (isVirtual()) {
        const ratio = radius() * 0.3;
        result.extended = [hit, img];

        const vAngle = Math.atan2(img.y, img.x) + Math.PI;

        result.reflected = [
          { x: 0, y: 0 },
          { x: Math.cos(vAngle) * ratio, y: Math.sin(vAngle) * ratio },
        ];
      } else {
        result.reflected = [{ x: 0, y: 0 }, img];
      }
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
    rayVisibility,
    setRayVisibility,
  } as const;
}
