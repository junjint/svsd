import { useId, useMemo, useState } from "react";
import { Icon } from "../Icons";
import { photos } from "./assets";
import { questById } from "./data";
import { groupMemoryDays, localDayKey, monthCells } from "./calendar";
import type { Memory } from "./model";

/** Photo days without a separate Profile or second collection store. */
export function MemoryCalendar({
  memories,
  selected,
  onSelect,
}: {
  memories: Memory[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false),
    [today] = useState(() => new Date()),
    [month, setMonth] = useState(
      () => new Date(today.getFullYear(), today.getMonth(), 1),
    ),
    id = useId();
  const days = useMemo(() => groupMemoryDays(memories), [memories]);
  const monthNumber = month.getFullYear() * 12 + month.getMonth(),
    current = today.getFullYear() * 12 + today.getMonth();
  const first = Math.min(
    current - 11,
    ...memories.map((m) => {
      const d = new Date(m.completedAt);
      return d.getFullYear() * 12 + d.getMonth();
    }),
  );
  const cells = monthCells(month.getFullYear(), month.getMonth()),
    title = month.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    outDays = cells.days.filter((d) => days.has(d.key)).length;
  const move = (amount: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    onSelect(null);
  };
  return (
    <div className="sq-memory-calendar">
      <button
        className="sq-calendar-disclosure"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open);
          if (open) onSelect(null);
        }}
      >
        <span>Your wandering days</span>
        <small>
          {days.size} {days.size === 1 ? "day" : "days"} out
        </small>
        <Icon name="chevron" />
      </button>
      {open && (
        <div id={id} className="sq-calendar-body">
          <div className="sq-calendar-month">
            <button
              aria-label="Previous memory month"
              disabled={monthNumber <= first}
              onClick={() => move(-1)}
            >
              <Icon name="back" />
            </button>
            <span>
              <strong>{title}</strong>
              <small>
                {outDays} {outDays === 1 ? "day" : "days"} of little discoveries
              </small>
            </span>
            <button
              aria-label="Next memory month"
              disabled={monthNumber >= current}
              onClick={() => move(1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
          <div className="sq-calendar-week" aria-hidden="true">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="sq-calendar-grid" aria-label={title}>
            {Array.from({ length: cells.leading }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {cells.days.map((d) => {
              const memories = days.get(d.key),
                memory = memories?.[0],
                image = memory
                  ? (memory.photo ?? photos[questById(memory.questId)!.image])
                  : null,
                isToday = d.key === localDayKey(today);
              return memory ? (
                <button
                  key={d.key}
                  className={selected === d.key ? "selected" : ""}
                  aria-pressed={selected === d.key}
                  aria-label={`${new Date(month.getFullYear(), month.getMonth(), d.day).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}: ${memories!.length} ${memories!.length === 1 ? "discovery" : "discoveries"}`}
                  onClick={() => onSelect(selected === d.key ? null : d.key)}
                >
                  <img src={image!} alt="" />
                  <span>{d.day}</span>
                  {memories!.length > 1 && <i />}
                </button>
              ) : (
                <span
                  key={d.key}
                  className={`sq-calendar-empty ${isToday ? "today" : ""} ${d.key > localDayKey(today)! ? "future" : ""}`}
                >
                  {d.day}
                </span>
              );
            })}
          </div>
          {selected && (
            <button
              className="sq-calendar-clear"
              onClick={() => onSelect(null)}
            >
              Showing this day · Show all discoveries <Icon name="close" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
