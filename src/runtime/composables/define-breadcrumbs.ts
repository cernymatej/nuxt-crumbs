import { getCurrentScope, computed, watch } from 'vue'
import { useRoute, useNuxtApp } from '#imports'
import type { Breadcrumb, BreadcrumbResolved, CrumbsNuxtApp } from '../types/crumbs'
import { computeBreadcrumbs, resolveBreadcrumb } from '../utils/crumbs'

interface DefineBreadcrumbsContext {
  /** Breadcrumbs resolved from the route hierarchy, ready to filter or map. */
  crumbs: BreadcrumbResolved[]
}

type Falsy = false | null | undefined

type DefineBreadcrumbsValue
  = | Breadcrumb
    // every crumb carries a route
    | ReadonlyArray<BreadcrumbResolved | Falsy>
    // …or the trailing crumb (the current page) may omit its route
    | readonly [...(BreadcrumbResolved | Falsy)[], Breadcrumb | Falsy]

type DefineBreadcrumbsResult
  = | DefineBreadcrumbsValue
    | null
    | undefined
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    | void

type DefineBreadcrumbsCallback = (ctx: DefineBreadcrumbsContext) => DefineBreadcrumbsResult

type DefineBreadcrumbsInput = DefineBreadcrumbsCallback | DefineBreadcrumbsValue

export interface DefineBreadcrumbs {
  (input: DefineBreadcrumbsInput): void
  /**
   * The real implementation. `defineBreadcrumbs` is a compiler macro: the
   * build-time transform rewrites valid root-level calls to `defineBreadcrumbs._(…)`.
   * @internal
   */
  _: (input: DefineBreadcrumbsInput) => void
}

/**
 * Define a dynamic breadcrumb for the current page or transform the whole breadcrumb trail.
 *
 * This is a compiler macro and can only be used at the top level of the
 * `<script setup>` block of a page.
 */
export const defineBreadcrumbs: DefineBreadcrumbs = ((_input: DefineBreadcrumbsInput): void => {
  throw new Error(
    '[nuxt-crumbs] `defineBreadcrumbs()` is a compiler macro and cannot be called at runtime. It can only be used at the top level of the `<script setup>` block of a page.',
  )
}) as DefineBreadcrumbs

// `_` is the internal implementation the build transform rewrites calls to;
// hide it from enumeration since it is not part of the public surface.
Object.defineProperty(defineBreadcrumbs, '_', {
  enumerable: false,
  value: function defineBreadcrumbsImpl(input: DefineBreadcrumbsInput): void {
    const scope = getCurrentScope()
    if (!scope) {
      throw new Error('[nuxt-crumbs] `defineBreadcrumbs()` must be called within a setup function of a page.')
    }

    const route = useRoute()
    const nuxtApp = useNuxtApp() as CrumbsNuxtApp

    const ctx = nuxtApp.__crumbs

    // intentional snapshot of the route at the time of calling `defineBreadcrumbs`
    const baseCrumbs = typeof input === 'function' ? computeBreadcrumbs(route) : []
    const callbackValue = computed(() => typeof input === 'function'
      ? input({ crumbs: baseCrumbs })
      : input)

    watch(callbackValue, () => {
    // when an async page unmounts while its setup is still running,
    // the scope will be deactivated, but the code will still run
    // in the continuation of the async operation
      if (!scope.active) return
      const result = callbackValue.value

      if (Array.isArray(result)) {
        ctx.unsynced.value = result.filter(Boolean).map((crumb, i) => {
          if (i === result.length - 1 && crumb && !('route' in crumb)) {
            return resolveBreadcrumb(crumb, route)
          }
          return crumb
        })
        return
      }
      else if (result) {
        ctx.unsynced.value = result as Breadcrumb
        return
      }
    }, { flush: /* needs to be sync to run during SSR */ 'sync', immediate: true })

    if (import.meta.server) {
      nuxtApp.__crumbs.sync()
    }

    ctx.settle()
  },
})
