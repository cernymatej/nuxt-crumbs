import type { NuxtApp } from '#app'
import type { RouteLocationRaw } from 'vue-router'
import type { ShallowRef } from 'vue'

export interface BreadcrumbsContext {
  promise: Promise<void>
  resolve: () => void
  unsynced: ShallowRef<BreadcrumbResolved[] | Breadcrumb | null>
  sync: () => void
}

export interface CrumbsNuxtApp extends NuxtApp {
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
  /**
   * Breadcrumb config for the page. Pass a string for the translation key,
   * or an object to also configure linking behavior.
   */
  breadcrumb?: PageMetaBreadcrumb
}
