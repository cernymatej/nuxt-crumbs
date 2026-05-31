import type { NuxtApp } from '#app'
import type { RouteLocationRaw } from 'vue-router'
import type { ShallowRef } from 'vue'

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

export interface Breadcrumb {
  label: string
}

export interface BreadcrumbResolved extends Breadcrumb {
  to: RouteLocationRaw
  routeName: string | symbol | null
}

export type PageMetaBreadcrumb = string | Breadcrumb

export interface PageMetaExtension {
  breadcrumb?: PageMetaBreadcrumb
}
