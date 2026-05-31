import type { PageMetaExtension } from './internal'

declare module '#app' {
  // eslint-disable-next-line
  interface PageMeta extends PageMetaExtension {}
}

export {}
