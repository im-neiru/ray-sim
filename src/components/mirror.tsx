import {
  CM_TO_PX,
  type createRayCompute,
  MIRROR_HEIGHT,
  type Point,
} from "@utils";
import { createMemo } from "solid-js";

type MirrorProps = {
  rayCompute: ReturnType<typeof createRayCompute>;
};

export function Mirror(props: MirrorProps) {
  const { rayCompute } = props;

  const d = createMemo(() => {
    const oppositeSide = MIRROR_HEIGHT * CM_TO_PX * 0.5;
    const hypotenuse = Math.abs(rayCompute.radius()) * CM_TO_PX;
    const adjacentSide = Math.sqrt(
      hypotenuse * hypotenuse - oppositeSide * oppositeSide
    );

    const endX = rayCompute.isConvex()
      ? -(adjacentSide - hypotenuse)
      : adjacentSide - hypotenuse;

    const startPoint: Point = {
      x: endX,
      y: -oppositeSide,
    };

    const endPoint: Point = {
      x: endX,
      y: oppositeSide,
    };

    const sweepFlag = rayCompute.isConvex() ? 0 : 1;

    return [
      `M ${startPoint.x} ${startPoint.y}`,
      `A ${hypotenuse} ${hypotenuse} 0 0 ${sweepFlag} ${endPoint.x} ${endPoint.y}`,
    ].join(" ");
  });

  return <path class="mirror" d={d()} />;
}
