/** Adapted from Rebecca Sun's 8516b88 HoldToComplete: intentional, cancelable completion.
 * This renderer-independent controller additionally cleans up unmount/blur and supports keyboard activation.
 */
export const HOLD_MS = 1400;
export interface HoldClock {
  now: () => number;
  request: (callback: () => void) => number;
  cancel: (id: number) => void;
}
export function createHoldController(
  clock: HoldClock,
  progress: (value: number) => void,
  complete: () => void,
) {
  let frame: number | null = null,
    started = 0,
    holding = false,
    finished = false,
    disposed = false;
  const cancelFrame = () => {
    if (frame !== null) clock.cancel(frame);
    frame = null;
  };
  const commit = () => {
    if (finished || disposed) return;
    finished = true;
    holding = false;
    cancelFrame();
    progress(1);
    complete();
  };
  const update = () => {
    frame = null;
    if (!holding || finished || disposed) return;
    const value = Math.min(1, Math.max(0, (clock.now() - started) / HOLD_MS));
    progress(value);
    if (value >= 1) commit();
    else frame = clock.request(update);
  };
  return {
    begin() {
      if (holding || finished || disposed) return;
      holding = true;
      started = clock.now();
      progress(0);
      frame = clock.request(update);
    },
    cancel() {
      if (finished || disposed) return;
      holding = false;
      cancelFrame();
      progress(0);
    },
    activate: commit,
    dispose() {
      disposed = true;
      holding = false;
      cancelFrame();
    },
  };
}
