import type { Ref } from 'vue'
import { onServerPrefetch, watch, getCurrentScope, computed } from 'vue'
import { useNuxtApp, useRoute } from '#imports'
import type { Breadcrumb, BreadcrumbResolved, CrumbsNuxtApp } from '../types/crumbs'
import { useSyncedBreadcrumbs } from '../plugins/breadcrumbs'

interface UseBreadcrumbsReturn {
  crumbs: Ref<BreadcrumbResolved[]>
}

export function useBreadcrumbs(): UseBreadcrumbsReturn {
  const nuxtApp = useNuxtApp() as CrumbsNuxtApp
  const ctx = nuxtApp.__crumbs
  const { promise, resolve } = ctx

  const synced = useSyncedBreadcrumbs()

  const route = useRoute()
  if (!route.matched.some(r => r.meta.__crumbsDynamic)) {
    resolve()
  }

  onServerPrefetch(() => promise)

  return {
    crumbs: computed(() => synced.value ?? []),
  }
}

// eslint-disable-next-line
interface DefineBreadcrumbsContext {}

type DefineBreadcrumbsResult
  = | Breadcrumb
    | ReadonlyArray<BreadcrumbResolved | null | undefined | false>
    | null
    | undefined
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    | void

type DefineBreadcrumbsCallback = (ctx: DefineBreadcrumbsContext) => DefineBreadcrumbsResult

export function defineBreadcrumbs(callback: DefineBreadcrumbsCallback): void {
  const scope = getCurrentScope()
  if (!scope) {
    throw new Error('[defineBreadcrumbs] must be called within a setup function.')
  }

  const nuxtApp = useNuxtApp() as CrumbsNuxtApp

  const ctx = nuxtApp.__crumbs

  const { resolve } = ctx

  const callbackValue = computed(() => callback({}))

  watch(callbackValue, () => {
    // when an async page unmounts while its setup is still running,
    // the scope will be deactivated, but the code will still run
    // in the continuation of the async operation
    if (!scope.active) return
    const result = callbackValue.value

    if (Array.isArray(result)) {
      ctx.unsynced.value = result.filter(Boolean)
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

  resolve()
}
