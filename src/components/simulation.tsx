import "@styles/simulation.css";
import { createSignal, onCleanup, onMount } from "solid-js";
import { Mirror } from "./mirror";

export function Simulation() {
  let svgEl: SVGSVGElement | undefined;
  const [size, setSize] = createSignal({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  const resizeSvg = () => {
    setSize({ w: window.innerWidth, h: window.innerHeight });
  };

  onMount(() => {
    window.addEventListener("resize", resizeSvg);
    onCleanup(() => {
      window.removeEventListener("resize", resizeSvg);
    });
  });

  const xAxisLength = size().w - 64;

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: it is just a simulation
    <svg
      // biome-ignore lint/style/noNonNullAssertion: svgEl ref should not be null
      ref={svgEl!}
      class="simulation"
      width={size().w}
      height={size().h}
      viewBox={[-size().w / 2, -size().h / 2, size().w, size().h].join(" ")}
      onContextMenu={(ev) => {
        ev.preventDefault();
        return false;
      }}
    >
      {/* X-axis */}
      <rect x={0} y={-150} width={1} height={300} />
      <rect
        x={-xAxisLength / 2}
        y={-1}
        width={xAxisLength}
        height={2}
        class="x-axis"
      />

      <Mirror cx={0} cy={0} r={120} angle={45} />
    </svg>
  );
}
