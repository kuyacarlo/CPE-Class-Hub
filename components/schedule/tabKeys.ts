/** Arrow keys, Home and End move to a tablist's next, previous, first or last tab and pick it (the ARIA tabs pattern). */
export function tabKeys(e: React.KeyboardEvent<HTMLElement>) {
  const tabs = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=tab]")];
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  const to = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key];
  if (i < 0 || to === undefined) return;
  e.preventDefault();
  const tab = tabs[(to + tabs.length) % tabs.length];
  tab.focus();
  tab.click();
}
