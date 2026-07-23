// Build an absolute in-app URL (respecting the Pages base path and hash router).
// Used for links opened in a new tab/window, e.g. the printable invoice page.
export function appUrl(hashPath: string) {
  return `${location.origin}${import.meta.env.BASE_URL}#${hashPath}`
}
