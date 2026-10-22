import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../Icons";
import { createHoldController } from "./hold";

export function HoldToKeep({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0),
    [holding, setHolding] = useState(false),
    hint = useId();
  const controller = useRef<ReturnType<typeof createHoldController> | null>(
      null,
    ),
    complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    const hold = createHoldController(
      {
        now: () => performance.now(),
        request: (callback) => window.requestAnimationFrame(callback),
        cancel: (id) => window.cancelAnimationFrame(id),
      },
      setProgress,
      () => complete.current(),
    );
    controller.current = hold;
    const cancel = () => {
      hold.cancel();
      setHolding(false);
    };
    const hidden = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      hold.dispose();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
      controller.current = null;
    };
  }, []);
  const cancel = () => {
    controller.current?.cancel();
    setHolding(false);
  };
  return (
    <>
      <button
        className={`sq-primary sq-hold-button ${holding ? "holding" : ""}`}
        aria-label="Hold to keep this moment"
        aria-describedby={hint}
        onPointerDown={(e) => {
          if (e.button !== 0 || !e.isPrimary) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setHolding(true);
          controller.current?.begin();
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left - 8 ||
            e.clientX > r.right + 8 ||
            e.clientY < r.top - 8 ||
            e.clientY > r.bottom + 8
          )
            cancel();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onBlur={cancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        onClick={(e) => {
          if (e.detail === 0) controller.current?.activate();
        }}
      >
        <span
          className="sq-hold-fill"
          style={{ width: `${progress * 100}%` }}
        />
        <span className="sq-hold-label">
          {holding ? "Keep holding…" : "Hold to keep this moment"}
          <Icon name="check" />
        </span>
      </button>
      <span id={hint} className="sq-hold-hint">
        Hold briefly, or use Enter.
      </span>
    </>
  );
}
