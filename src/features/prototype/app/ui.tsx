import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../Icons";
export function IconButton({
  icon,
  label,
  onClick,
  className = "",
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`sq-icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      className={`sq-toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
export function Sheet({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDivElement>(null),
    start = useRef(0),
    [drag, setDrag] = useState({ y: 0, active: false });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current
      ?.querySelector<HTMLElement>("button,input,textarea")
      ?.focus({ preventScroll: true });
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="sq-sheet-scrim" onClick={onClose}>
      <div
        ref={dialog}
        className={`sq-sheet ${className}`}
        style={{
          translate: `0 ${drag.y}px`,
          transition: drag.active ? "none" : "translate .25s ease-out",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key === "Tab") {
            const focusable = dialog.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input,textarea,select,[tabindex="0"]',
            );
            if (!focusable?.length) return;
            const first = focusable[0],
              last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div
          className="sq-sheet-grab"
          onPointerDown={(e) => {
            start.current = e.clientY;
            setDrag({ y: 0, active: true });
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              setDrag({
                y: Math.max(0, e.clientY - start.current),
                active: true,
              });
          }}
          onPointerUp={(e) => {
            if (e.clientY - start.current > 45) onClose();
            else setDrag({ y: 0, active: false });
          }}
          onPointerCancel={() => setDrag({ y: 0, active: false })}
        >
          <span />
        </div>
        <IconButton
          icon="close"
          label={`Close ${title}`}
          onClick={onClose}
          className="sq-sheet-close"
        />
        {children}
      </div>
    </div>
  );
}
export function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`ios-status ${light ? "light" : ""}`} aria-hidden="true">
      <span className="ios-clock">9:41</span>
      <div className="ios-status-right">
        <svg viewBox="0 0 18 13" width="18" height="13" fill="currentColor">
          <rect y="9" width="3" height="4" rx=".8" />
          <rect x="5" y="6" width="3" height="7" rx=".8" />
          <rect x="10" y="3" width="3" height="10" rx=".8" />
          <rect x="15" width="3" height="13" rx=".8" />
        </svg>
        <svg
          viewBox="0 0 18 14"
          width="17"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M1 4q8-6 16 0M4 7q5-4 10 0M7 10q2-2 4 0" />
          <circle cx="9" cy="13" r=".8" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 27 13" width="26" height="13" fill="none">
          <rect
            x=".5"
            y="1"
            width="23"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeOpacity=".4"
          />
          <rect
            x="2.5"
            y="3"
            width="18"
            height="7"
            rx="1.4"
            fill="currentColor"
          />
          <path d="M25 4v5q3-1 0-5Z" fill="currentColor" fillOpacity=".4" />
        </svg>
      </div>
    </div>
  );
}
