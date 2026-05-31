import type { RouteLocationNormalizedLoaded, RouteLocationMatched } from 'vue-router'
import type { BreadcrumbResolved } from '../types/crumbs'
import type { PageMetaBreadcrumb, PageMetaExtension } from '../types/internal'

export function resolveBreadcrumb(breadcrumb: PageMetaBreadcrumb | BreadcrumbResolved, route: RouteLocationNormalizedLoaded | RouteLocationMatched, current?: RouteLocationNormalizedLoaded): BreadcrumbResolved {
  if (typeof breadcrumb !== 'string' && 'to' in breadcrumb) {
    return breadcrumb
  }

  let to
  if ('query' in route) {
    // a fully-resolved location carries its own params/query/hash
    to = { name: route.name, hash: route.hash, params: route.params, query: route.query }
  }
  else if (route.name != null && route.path.includes(':')) {
    // resolve params for routes with dynamic segments (e.g. `/shop/:category()`)
    // from the current route
    const names = [...route.path.matchAll(/:(\w+)/g)].map(m => m[1])
    const params = current
      ? Object.fromEntries(
          names.filter((name): name is string => !!(name && name in current.params)).map(name => [name, current.params[name]]),
        )
      : {}
    to = { name: route.name, params }
  }
  else {
    to = { path: route.path }
  }

  return typeof breadcrumb === 'string'
    ? { label: breadcrumb, to, routeName: route.name ?? null }
    // spreading the breadcrumb to allow for additional augmented properties
    : { ...breadcrumb, label: breadcrumb.label, to, routeName: route.name ?? null }
}

export function computeBreadcrumbs(route: RouteLocationNormalizedLoaded): BreadcrumbResolved[] {
  const withBreadcrumb: (RouteLocationMatched & { meta: Required<PageMetaExtension> })[] = []
  const namedByPath = new Map<string, RouteLocationMatched>()

  for (const r of route.matched) {
    if (r.meta.breadcrumb) {
      withBreadcrumb.push(r as typeof r & { meta: Required<PageMetaExtension> })
    }
    // with parallel routes, records can share a `path` while only one has a
    // `name`, and the breadcrumb meta may sit on the nameless one
    if (r.name != null && !namedByPath.has(r.path)) {
      namedByPath.set(r.path, r)
    }
  }

  return withBreadcrumb.map((r) => {
    const record = r.name == null ? namedByPath.get(r.path) ?? r : r
    return resolveBreadcrumb(r.meta.breadcrumb, record, route)
  })
}
