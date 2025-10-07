import "@styles/simulation.css";
import {
  createRayCompute,
  DISTANCE_RANGE,
  HEIGHT_RANGE,
  RADIUS_RANGE,
} from "@utils";
import {
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Mirror } from "./mirror";

const CM_TO_PX = 4;
const OBJ_W_PX = 6;

const MIRROR_OPENS_LEFT = true;

export function Simulation() {
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

  const imageWidthPx = createMemo(
    () => OBJ_W_PX * Math.abs(rayCompute.magnification())
  );

  const screenXFromCm = (cm: number) =>
    (MIRROR_OPENS_LEFT ? -1 : 1) * cm * CM_TO_PX;

  const objectX = createMemo(
    () => screenXFromCm(rayCompute.distance()) - OBJ_W_PX / 2
  );

  const imageX = createMemo(
    () => screenXFromCm(rayCompute.imageDistance()) - imageWidthPx() / 2
  );

  const objectHeightPx = createMemo(
    () => Math.abs(rayCompute.objectHeight()) * CM_TO_PX
  );

  const imageHeightPx = createMemo(
    () => Math.abs(rayCompute.imageHeight()) * CM_TO_PX
  );

  const imageY = createMemo(() => {
    const h = rayCompute.imageHeight();
    return h >= 0 ? -h * CM_TO_PX : 0;
  });

  return (
    <>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: it is just a simulation */}{" "}
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
        <rect x={0} y={-150} width={1} height={300} fill="#888" />
        {/* X-axis */}
        <rect
          x={-xAxisLength / 2}
          y={-1}
          width={xAxisLength}
          height={2}
          class="x-axis"
        />
        <Mirror cx={0} cy={0} height={80 * CM_TO_PX} rayCompute={rayCompute} />
        {/* Object */}
        <rect
          x={objectX()}
          y={-rayCompute.objectHeight() * CM_TO_PX}
          width={OBJ_W_PX}
          height={objectHeightPx()}
          fill="#fff"
          stroke="#222"
        />
        {/* Image */}
        <rect
          x={imageX()}
          y={imageY()}
          width={imageWidthPx()}
          height={imageHeightPx()}
          fill="#fff"
          stroke="#222"
          opacity={0.5}
        />
        <circle
          fill="#f42490"
          cx={
            (rayCompute.isConvex()
              ? rayCompute.focalLength()
              : -rayCompute.focalLength()) * CM_TO_PX
          }
          cy={0}
          r={4}
        />
        <text
          x={
            (rayCompute.isConvex()
              ? rayCompute.focalLength()
              : -rayCompute.focalLength()) * CM_TO_PX
          }
          y={24}
          text-anchor="middle"
          font-family="Josefin Sans"
          font-size="12pt"
        >
          F
        </text>
        <circle
          fill="#6224f4"
          cx={
            (rayCompute.isConvex()
              ? rayCompute.radius()
              : -rayCompute.radius()) * CM_TO_PX
          }
          cy={0}
          r={4}
        />
        <text
          x={
            (rayCompute.isConvex()
              ? rayCompute.radius()
              : -rayCompute.radius()) * CM_TO_PX
          }
          y={24}
          text-anchor="middle"
          font-family="Josefin Sans"
          font-size="12pt"
        >
          C
        </text>
        <circle fill="#24e85b" cx={0} cy={0} r={4} />
        <text
          x={0}
          y={24}
          text-anchor="middle"
          font-family="Josefin Sans"
          font-size="12pt"
        >
          V
        </text>
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
  const mirrorTypeId = createUniqueId();
  const distanceId = createUniqueId();
  const heightId = createUniqueId();

  return (
    <div class="controls">
      <div>
        <b>Mirror Options</b>
        <div class="control-part">
          <label for={focusId}>Focal Length:</label>

          <div>
            <input
              id={`${curveId}n`}
              type="number"
              min={RADIUS_RANGE.min / 2}
              max={RADIUS_RANGE.max / 2}
              step="0.01"
              value={Math.min(
                Math.abs(rayCompute.focalLength()),
                RADIUS_RANGE.max / 2
              ).toFixed(2)}
              on:input={(ev) => {
                rayCompute.setFocalLength(
                  Number(ev.target.valueAsNumber.toFixed(2))
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
              min={RADIUS_RANGE.min}
              max={RADIUS_RANGE.max}
              step="0.01"
              value={Math.min(
                Math.abs(rayCompute.radius()),
                RADIUS_RANGE.max
              ).toFixed(2)}
              on:input={(ev) => {
                rayCompute.setRadius(
                  Number(ev.target.valueAsNumber.toFixed(2))
                );
              }}
            />
            <span>cm</span>
          </div>
        </div>

        <input
          id={curveId}
          type="range"
          min={RADIUS_RANGE.min}
          max={RADIUS_RANGE.max}
          step="0.01"
          value={rayCompute.radius()}
          on:input={(ev) => {
            rayCompute.setRadius(Number(ev.target.valueAsNumber.toFixed(2)));
          }}
        />
        <div class="control-part">
          <label for={mirrorTypeId}>Type: </label>

          <select
            value={String(rayCompute.isConvex())}
            id={mirrorTypeId}
            on:change={(ev) =>
              rayCompute.setIsConvex(ev.currentTarget.value === "true")
            }
          >
            <option value="true">Convex</option>
            <option value="false">Concave</option>
          </select>
        </div>
      </div>
      <div>
        <b>Object Options</b>
        <div class="control-part">
          <label for={distanceId}>Distance from mirror:</label>

          <div>
            <input
              id={`${distanceId}n`}
              type="number"
              min={DISTANCE_RANGE.min}
              max={DISTANCE_RANGE.max}
              step="0.01"
              value={Math.abs(rayCompute.distance()).toFixed(2)}
              on:input={(ev) => {
                rayCompute.setDistance(
                  Number(ev.target.valueAsNumber.toFixed(2))
                );
              }}
            />
            <span>cm</span>
          </div>
        </div>

        <input
          id={distanceId}
          type="range"
          min={DISTANCE_RANGE.min}
          max={DISTANCE_RANGE.max}
          step="0.01"
          value={rayCompute.distance()}
          on:input={(ev) => {
            rayCompute.setDistance(Number(ev.target.valueAsNumber.toFixed(2)));
          }}
        />

        <div class="control-part">
          <label for={heightId}>Height:</label>

          <div>
            <input
              id={`${heightId}n`}
              type="number"
              min={HEIGHT_RANGE.min}
              max={HEIGHT_RANGE.max}
              step="0.01"
              value={Math.abs(rayCompute.objectHeight()).toFixed(2)}
              on:input={(ev) => {
                rayCompute.setObjectHeight(
                  Number(ev.target.valueAsNumber.toFixed(2))
                );
              }}
            />
            <span>cm</span>
          </div>
        </div>

        <input
          id={heightId}
          type="range"
          min={HEIGHT_RANGE.min}
          max={HEIGHT_RANGE.max}
          step="0.01"
          value={rayCompute.objectHeight()}
          on:input={(ev) => {
            rayCompute.setObjectHeight(
              Number(ev.target.valueAsNumber.toFixed(2))
            );
          }}
        />
      </div>
    </div>
  );
}
