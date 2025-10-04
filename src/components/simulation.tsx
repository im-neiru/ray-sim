import "@styles/simulation.css";
import { createRayCompute } from "@utils";
import { createSignal, createUniqueId, onCleanup, onMount } from "solid-js";
import { Mirror } from "./mirror";

export function Simulation() {
  const [magnification, setMagnification] = createSignal(1.25);
  const rayCompute = createRayCompute();

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
    <>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: it is just a simulation */}
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

        <Mirror cx={0} cy={0} height={120} magnification={magnification} />
      </svg>
      <div class="ui">
        <Controls rayCompute={rayCompute} />
      </div>
    </>
  );
}

type ControlsProps = {
  rayCompute: ReturnType<typeof createRayCompute>;
};
function Controls({ rayCompute }: ControlsProps) {
  const focusId = createUniqueId();
  const curveId = createUniqueId();

  return (
    <div class="controls">
      <div class="control-part">
        <label for={focusId}>Focal Length:</label>

        <div>
          <input
            id={`${curveId}n`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={Math.min(rayCompute.focalLength(), 100).toFixed(2)}
            on:input={(ev) => {
              rayCompute.setFocalLength(
                Number(Math.min(ev.target.valueAsNumber, 100).toFixed(2))
              );
            }}
          />
          <span>cm</span>
        </div>
      </div>

      <div class="control-part">
        <label for={curveId}>Curvature: </label>

        <div>
          <input
            id={`${curveId}n`}
            type="number"
            min="0"
            max="200"
            step="0.01"
            value={Math.min(rayCompute.radius(), 200).toFixed(2)}
            on:input={(ev) => {
              rayCompute.setFocalLength(
                Number(Math.min(ev.target.valueAsNumber, 200).toFixed(2))
              );
            }}
          />
          <span>cm</span>
        </div>
      </div>

      <input
        id={curveId}
        type="range"
        min="0"
        max="200"
        step="0.01"
        value={rayCompute.radius()}
        on:input={(ev) => {
          rayCompute.setRadius(
            Number(Math.min(ev.target.valueAsNumber, 200).toFixed(2))
          );
        }}
      />
    </div>
  );
}
