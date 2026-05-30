import type { PageMetaExtension } from './crumbs'

declare module '#app' {
  // eslint-disable-next-line
  interface PageMeta extends PageMetaExtension {}
}

export {}
