import { type Accessor, createMemo } from "solid-js";

type MirrorProps = {
  cx: number;
  cy: number;
  height: number;
  magnification: Accessor<number>;
};

export function Mirror(props: MirrorProps) {
  const { cx, cy, height, magnification } = props;

  const d = createMemo(() => {
    const height_half = height * 0.5;
    const sagitta = (magnification() - 1) * height_half;
    let curve = sagitta;

    if (Math.abs(sagitta) < 0.001) curve = 0;

    const xFlat = cx;
    const xCurve = cx + 10;

    return [
      `M ${xFlat} ${cy - height_half}`,
      `L ${xCurve} ${cy - height_half}`,
      `Q ${xCurve + curve} ${cy} ${xCurve} ${cy + height_half}`,
      `L ${xFlat} ${cy + height_half}`,
      "Z",
    ].join(" ");
  });

  return <path class="mirror" d={d()} />;
}
