import type { RouteLocationNormalizedLoaded, RouteLocationMatched } from 'vue-router'
import type { BreadcrumbResolved, PageMetaBreadcrumb, PageMetaExtension } from '../types/crumbs'

export function resolveBreadcrumb(breadcrumb: PageMetaBreadcrumb | BreadcrumbResolved, route: RouteLocationNormalizedLoaded | RouteLocationMatched): BreadcrumbResolved {
  if (typeof breadcrumb !== 'string' && 'to' in breadcrumb) {
    return breadcrumb
  }

  const to = 'query' in route
    ? { name: route.name, hash: route.hash, params: route.params, query: route.query }
    : { path: route.path }

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
    return resolveBreadcrumb(r.meta.breadcrumb, record)
  })
}
