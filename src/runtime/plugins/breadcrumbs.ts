import { shallowRef } from 'vue'
import { defineNuxtPlugin, useNuxtApp } from '#app'
import type { BreadcrumbResolved, BreadcrumbsContext } from '../types/crumbs'
import { computeBreadcrumbs, resolveBreadcrumb } from '../utils/crumbs'
import { useRoute, useRouter, useState } from '#imports'

export const useSyncedBreadcrumbs = () => useState<BreadcrumbResolved[] | null>('_crumbs', () => null)

export default defineNuxtPlugin({
  name: 'nuxt-crumbs',
  setup() {
    const nuxtApp = useNuxtApp()
    const route = useRoute()
    const router = useRouter()

    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const { promise, resolve } = Promise.withResolvers<void>()

    const synced = useSyncedBreadcrumbs()

    // multiple pages in the matched route hierarchy can call `defineBreadcrumbs`
    // and we need to wait for all of them to settle before resolving the SSR gate
    let pending = import.meta.server
      ? route.matched.filter(r => r.meta.__crumbsDynamic).length
      : 0

    const __crumbs: BreadcrumbsContext = {
      promise,
      settle: () => {
        if (--pending <= 0) resolve()
      },
      unsynced: shallowRef(null),
      sync: () => {
        if (Array.isArray(__crumbs.unsynced.value)) {
          synced.value = __crumbs.unsynced.value
          return
        }

        const crumbsFromMeta = computeBreadcrumbs(route)

        // add dynamic breadcrumb defined via `defineBreadcrumbs` if any
        if (__crumbs.unsynced.value) {
          crumbsFromMeta.push(resolveBreadcrumb(__crumbs.unsynced.value, route))
        }

        synced.value = crumbsFromMeta
      },
    }

    // open the gate immediately when there is nothing dynamic to wait for
    // (and always on the client, where it is never awaited)
    if (pending === 0) resolve()

    router.beforeEach(() => {
      __crumbs.unsynced.value = null
    })

    nuxtApp.hook('page:finish', __crumbs.sync)
    if (import.meta.server) {
      __crumbs.sync()
    }

    Object.defineProperty(nuxtApp, '__crumbs', {
      get: () => __crumbs,
    })
  },
})
