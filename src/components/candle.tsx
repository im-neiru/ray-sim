import { CM_TO_PX, type createRayCompute } from "@utils";
import { createMemo, Show } from "solid-js";

type CandleProps = {
  rayCompute: ReturnType<typeof createRayCompute>;
  image: boolean;
};

const FLAME_SIZE = 4 * CM_TO_PX;
const WIDTH = 12;

export function Candle({ rayCompute, image }: CandleProps) {
  const totalHeight = createMemo(
    () =>
      (image ? rayCompute.imageHeight() : rayCompute.objectHeight()) * CM_TO_PX
  );

  const centerX = createMemo(
    () =>
      (image ? -rayCompute.imageDistance() : -rayCompute.distance()) * CM_TO_PX
  );

  const yTip = createMemo(() => -totalHeight());

  const absH = createMemo(() => Math.abs(totalHeight()));
  const isInverted = createMemo(() => totalHeight() < 0);

  const flameScale = createMemo(() =>
    image ? FLAME_SIZE * Math.abs(rayCompute.magnification()) : FLAME_SIZE
  );

  const flameH = createMemo(() => Math.min(flameScale(), absH()));
  const bodyH = createMemo(() => Math.max(absH() - flameH(), 0));

  const scaleX = createMemo(() => (flameScale() * 0.8) / 256);
  const scaleY = createMemo(() => flameH() / 256);

  return (
    <g
      transform={`translate(${centerX()}, ${yTip()})`}
      opacity={image ? 0.5 : 1}
    >
      <g transform={isInverted() ? "scale(1,-1)" : undefined}>
        <g
          transform={`translate(${
            -128 * scaleX()
          }, 0) scale(${scaleX()}, ${scaleY()})`}
        >
          <path
            d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Z"
            fill="url(#flameGradient)"
            stroke="red"
          />
        </g>

        <Show
          when={image}
          fallback={
            bodyH() > 0 && (
              <rect
                x={-WIDTH / 2}
                y={flameH()}
                width={WIDTH}
                height={bodyH()}
                fill="white"
                stroke="black"
              />
            )
          }
        >
          {bodyH() > 0 && (
            <rect
              x={-(WIDTH * Math.abs(rayCompute.magnification())) / 2}
              y={flameH()}
              width={WIDTH * Math.abs(rayCompute.magnification())}
              height={bodyH()}
              fill="white"
              stroke="black"
            />
          )}
        </Show>
      </g>
    </g>
  );
}
