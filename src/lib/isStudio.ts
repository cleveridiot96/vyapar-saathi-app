
export const isStudio =
  typeof window !== "undefined" &&
  window.location.hostname.includes("firebase");
