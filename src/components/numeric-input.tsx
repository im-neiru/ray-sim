import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
} from "solid-js";

type NumericInputProps = {
  label: string;
  getValue: () => number;
  setValue: (n: number) => number;
};

export function NumericInput({ getValue, setValue, label }: NumericInputProps) {
  const [text, setText] = createSignal(getValue().toFixed(2));

  createEffect(() => {
    setText(getValue().toFixed(2));
  });

  const sanitizeInput = (s: string) => s.replace(/[^0-9.]/g, "");

  const commitValue = () => {
    const num = Number(sanitizeInput(text()));
    if (!Number.isNaN(num)) {
      setValue(num);
      setText(num.toFixed(2));
    }

    setText(getValue().toFixed(2));
  };

  let debounceTimer: number | undefined;
  const handleDebounce = () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(commitValue, 1000);
  };
  onCleanup(() => clearTimeout(debounceTimer));

  const id = createUniqueId();

  return (
    <div class="control-part">
      <label for={id}>{label}</label>
      <div>
        <input
          id={id}
          type="text"
          value={text()}
          onInput={(e) => {
            const raw = (e.target as HTMLInputElement).value;
            const santized = sanitizeInput(raw);
            (e.target as HTMLInputElement).value = santized;
            setText(santized);
            handleDebounce();
          }}
          onBlur={commitValue}
        />
        <span>cm</span>
      </div>
    </div>
  );
}
