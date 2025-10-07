import { CM_TO_PX, type createRayCompute } from "@utils";
import { createMemo } from "solid-js";

type MirrorProps = {
  cx: number;
  cy: number;
  height: number;
  rayCompute: ReturnType<typeof createRayCompute>;
};

export function Mirror(props: MirrorProps) {
  const { cx, cy, height, rayCompute } = props;

  const d = createMemo(() => {
    const halfHeight = height * 0.5;
    const radiusRaw = rayCompute.radius() * CM_TO_PX;
    const isConvex = rayCompute.isConvex();

    const y1 = cy - halfHeight;
    const y2 = cy + halfHeight;

    if (Math.abs(radiusRaw) < 0.001) {
      return `M ${cx} ${y1} L ${cx} ${y2}`;
    }

    const radius = Math.abs(radiusRaw);

    const sweepFlag = isConvex ? 0 : 1;

    return [
      `M ${cx} ${y1}`,
      `A ${radius} ${radius} 0 0 ${sweepFlag} ${cx} ${y2}`,
    ].join(" ");
  });

  return <path class="mirror" d={d()} />;
}
