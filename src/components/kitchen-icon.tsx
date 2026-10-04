// Original line icons drawn for PantryPal; no external icon library.
export function KitchenIcon({ name = "pot", className = "" }: { name?: "pot" | "leaf" | "flame" | "spoon" | "arrow" | "stop" | "chevron" | "book"; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === "pot" && <><path d="M5 11h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7ZM3 11h18M2 14h3m14 0h3M8 7c-2-2 2-3 0-5m4 5c-2-2 2-3 0-5m4 5c-2-2 2-3 0-5" /></>}
    {name === "leaf" && <><path d="M19 4C9 3 3 8 5 15c2 6 13 5 14-11Z" /><path d="m4 21 10-11m-6 7-1-5m4 2 5 1" /></>}
    {name === "flame" && <path d="M13 2c1 6 6 7 6 13a7 7 0 0 1-14 0c0-4 3-7 4-8 0 4 2 5 2 5s4-3 2-10ZM12 14c-3 3-3 6 0 7 3-1 3-4 0-7Z" />}
    {name === "spoon" && <><ellipse cx="15.5" cy="6.5" rx="3.8" ry="5" transform="rotate(35 15.5 6.5)" /><path d="m12 10-7 11" /></>}
    {name === "arrow" && <path d="M5 12h14m-6-6 6 6-6 6" />}
    {name === "stop" && <rect x="6" y="6" width="12" height="12" rx="1" />}
    {name === "chevron" && <path d="m8 10 4 4 4-4" />}
    {name === "book" && <><path d="M5 3h14v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18M9 8h6m-6 4h6m-6 4h4" /></>}
  </svg>;
}
