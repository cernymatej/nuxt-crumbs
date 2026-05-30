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

    const __crumbs: BreadcrumbsContext = {
      promise,
      resolve,
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
