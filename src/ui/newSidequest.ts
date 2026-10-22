/* The tab bar's + asks the Draw to open its New sidequest sheet. A flag
   rather than an event, so it still works when the Draw mounts after the press. */
let pending = false;

export const askNewSidequest = () => {
  pending = true;
};

export const takeNewSidequest = () => {
  const p = pending;
  pending = false;
  return p;
};
