import type { NuxtApp } from '#app'
import type { ShallowRef } from 'vue'
import type { Breadcrumb, BreadcrumbResolved } from './crumbs'

export interface BreadcrumbsContext {
  promise: Promise<void>
  /**
   * Mark one matched page's `defineBreadcrumbs` as done. The SSR gate
   * resolves once every dynamic page in the hierarchy has settled.
   */
  settle: () => void
  unsynced: ShallowRef<BreadcrumbResolved[] | Breadcrumb | null>
  sync: () => void
}

export interface CrumbsNuxtApp extends NuxtApp {
  /**
   * @internal
   */
  __crumbs: BreadcrumbsContext
}

export type PageMetaBreadcrumb = string | Breadcrumb

export interface PageMetaExtension {
  breadcrumb?: PageMetaBreadcrumb
}
