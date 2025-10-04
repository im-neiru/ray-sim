import type { Accessor, Setter } from "solid-js";

type NumberSliderProps = {
  maximumValue: number;
  minimumValue: number;
  state: Accessor<number>;
  setState: Setter<number>;
};

export function NumberSlider({
  maximumValue,
  minimumValue,
  state,
  setState,
}: NumberSliderProps) {
  let trackEl: HTMLDivElement | undefined;

  const logMin = Math.log(minimumValue);
  const logMax = Math.log(maximumValue);

  const percent = () =>
    ((Math.log(state()) - logMin) / (logMax - logMin)) * 100;

  const updateValueFromEvent = (ev: MouseEvent | TouchEvent) => {
    if (!trackEl) return;
    const rect = trackEl.getBoundingClientRect();

    let clientX = (ev as MouseEvent).clientX;
    if ((ev as TouchEvent).touches) {
      clientX = (ev as TouchEvent).touches[0].clientX;
    }

    let newPercent = (clientX - rect.left) / rect.width;
    newPercent = Math.min(1, Math.max(0, newPercent));

    const newLogValue = logMin + newPercent * (logMax - logMin);
    const newValue = Math.exp(newLogValue);
    setState(newValue);
  };

  const onPointerDown = (ev: MouseEvent | TouchEvent) => {
    updateValueFromEvent(ev);

    const moveHandler = (e: MouseEvent | TouchEvent) => updateValueFromEvent(e);
    const upHandler = () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener("touchmove", moveHandler);
      window.removeEventListener("touchend", upHandler);
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
    window.addEventListener("touchmove", moveHandler);
    window.addEventListener("touchend", upHandler);
  };

  return (
    <div class="slider-container">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: skip this for now */}
      <div
        // biome-ignore lint/style/noNonNullAssertion: ref is not null
        ref={trackEl!}
        class="slider-track"
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
      >
        <div
          class="slider-handle"
          style={{
            left: `${percent()}%`,
          }}
        />
      </div>
    </div>
  );
}
