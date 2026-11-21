/** True when Class Hub was opened from the home screen (an installed web app), not in a browser tab. */
export const installed = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
