import "@styles/simulation.css";
import {
  CM_TO_PX,
  createRayCompute,
  DISTANCE_RANGE,
  HEIGHT_RANGE,
  RADIUS_RANGE,
  type RayVisibility,
} from "@utils";
import {
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
} from "solid-js";
import { Candle } from "./candle";
import { Mirror } from "./mirror";

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
    window.addEventListener("orientationchange", resizeSvg);
    onCleanup(() => {
      window.removeEventListener("resize", resizeSvg);
      window.removeEventListener("orientationchange", resizeSvg);
    });
  });

  const xAxisLength = size().w > 512 ? size().w - 64 : size().w - 12;

  const incidentArrow = createUniqueId();
  const reflectedArrow = createUniqueId();

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
        <defs>
          <linearGradient id="flameGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="yellow" />
            <stop offset="60%" stop-color="orange" />
            <stop offset="100%" stop-color="red" />
          </linearGradient>
          <marker
            id={incidentArrow}
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            marker-width="6"
            marker-height="6"
            orient="auto-start-reverse"
            fill="var(--ray-incident)"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
          <marker
            id={reflectedArrow}
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            marker-width="6"
            marker-height="6"
            orient="auto-start-reverse"
            fill="var(--ray-reflected)"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
        </defs>

        {/* X-axis */}
        <line
          x1={-xAxisLength / 2}
          y1={0}
          x2={xAxisLength / 2}
          y2={0}
          stroke-dasharray="5, 4"
          class="x-axis"
        />

        <Mirror rayCompute={rayCompute} />
        {/* Object */}
        <Candle rayCompute={rayCompute} image={false} />

        {/* Image */}
        <Candle rayCompute={rayCompute} image={true} />
        <For
          each={[
            rayCompute.pfRay(),
            rayCompute.fpRay(),
            rayCompute.ccRay(),
            rayCompute.vRay(),
          ].filter((ray) => ray !== undefined)}
        >
          {(ray) => {
            const toPointStr = (p: { x: number; y: number }) =>
              `${p.x * CM_TO_PX},${p.y * CM_TO_PX}`;

            return (
              <>
                {ray.incident && (
                  <polyline
                    points={ray.incident.map((p) => toPointStr(p)).join(" ")}
                    class="ray-incident"
                    marker-end={`url(#${incidentArrow})`}
                  />
                )}

                {ray.reflected && (
                  <polyline
                    points={ray.reflected.map((p) => toPointStr(p)).join(" ")}
                    class="ray-reflected"
                    marker-end={`url(#${reflectedArrow})`}
                  />
                )}
                {ray.extended && (
                  <polyline
                    points={ray.extended.map((p) => toPointStr(p)).join(" ")}
                    class="ray-reflected"
                    stroke-dasharray="4 4"
                  />
                )}
                {ray.extendedIncident && (
                  <polyline
                    points={ray.extendedIncident
                      .map((p) => toPointStr(p))
                      .join(" ")}
                    class="ray-ext-incident"
                    stroke-dasharray="4 4"
                    stroke-width="1"
                  />
                )}
              </>
            );
          }}
        </For>

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
  const [hide, setHide] = createSignal(true);

  return (
    <div class="controls" data-hide={hide()}>
      <button
        type="button"
        class="show"
        on:click={() => {
          setHide(false);
        }}
      >
        Show Controls
      </button>
      <button
        type="button"
        class="close"
        on:click={() => {
          setHide(true);
        }}
      >
        {/** biome-ignore lint/a11y/noSvgWithoutTitle: icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          width={24}
          height={24}
        >
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
      </button>

      <div class="stack">
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
              rayCompute.setDistance(
                Number(ev.target.valueAsNumber.toFixed(2))
              );
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
        <div>
          <RaySwitch rayCompute={rayCompute} ray="pf" />
          <RaySwitch rayCompute={rayCompute} ray="fp" />
          <RaySwitch rayCompute={rayCompute} ray="cc" />
          <RaySwitch rayCompute={rayCompute} ray="v" />
        </div>
      </div>
    </div>
  );
}

type RaySwitchProps = {
  rayCompute: ReturnType<typeof createRayCompute>;
  ray: keyof RayVisibility;
};

function RaySwitch({ ray, rayCompute }: RaySwitchProps) {
  const id = createUniqueId();

  return (
    <div class="ray-switch">
      <input
        type="checkbox"
        id={id}
        checked={rayCompute.rayVisibility()[ray]}
        on:change={() => {
          rayCompute.setRayVisibility((old) => ({
            ...old,
            [ray]: !old[ray],
          }));
        }}
      />
      <label for={id}>{String(ray).toUpperCase()} Ray</label>
    </div>
  );
}
