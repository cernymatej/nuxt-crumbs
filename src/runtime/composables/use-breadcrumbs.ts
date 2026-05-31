import type { Ref } from 'vue'
import { onServerPrefetch, computed } from 'vue'
import { useNuxtApp } from '#imports'
import type { BreadcrumbResolved } from '../types/crumbs'
import type { CrumbsNuxtApp } from '../types/internal'
import { useSyncedBreadcrumbs } from '../plugins/breadcrumbs'

interface UseBreadcrumbsReturn {
  crumbs: Ref<BreadcrumbResolved[]>
}

export function useBreadcrumbs(): UseBreadcrumbsReturn {
  const nuxtApp = useNuxtApp() as CrumbsNuxtApp
  const ctx = nuxtApp.__crumbs
  const { promise } = ctx

  const synced = useSyncedBreadcrumbs()

  // block the consumer's render until every dynamic page has settled the gate
  onServerPrefetch(() => promise)

  return {
    crumbs: computed(() => synced.value ?? []),
  }
}
