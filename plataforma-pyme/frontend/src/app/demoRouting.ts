export const isPublicDemo = import.meta.env.MODE === 'public-demo'

export function demoPath(): string {
  if (!isPublicDemo) return window.location.pathname || '/'
  const hash = window.location.hash.slice(1)
  return hash.startsWith('/') ? hash : '/'
}

export function demoHref(path: string): string {
  return isPublicDemo ? `${import.meta.env.BASE_URL}#${path}` : path
}
