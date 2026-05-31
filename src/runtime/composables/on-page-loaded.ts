import { getCurrentScope, onScopeDispose } from 'vue'
import { useNuxtApp, useRouter } from '#imports'

export function onPageLoaded(callback: () => void): () => void {
  const nuxtApp = useNuxtApp()
  const router = useRouter()

  const removeHook = nuxtApp.hook('page:finish', () => callback())

  const removeGuard = router.afterEach((to, from) => {
    // during hydration the initial navigation fires `afterEach` with `from`/`to`
    // on the same route (same leaf)
    if (nuxtApp.isHydrating) return

    // same leaf component — only params/query changed (`/p/1` → `/p/2`)
    const sameLeaf = to.matched.at(-1)?.components?.default === from.matched.at(-1)?.components?.default
    // ascending to an ancestor whose matched chain is a prefix of the current one
    const ascendingToAncestor = to.matched.length < from.matched.length
      && to.matched.every((m, i) => m.components?.default === from.matched[i]?.components?.default)

    if (sameLeaf || ascendingToAncestor) {
      callback()
    }
  })

  const stop = () => {
    removeHook()
    removeGuard()
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return stop
}
