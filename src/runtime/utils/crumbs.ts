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
    : { label: breadcrumb.label, to, routeName: route.name ?? null }
}

export function computeBreadcrumbs(route: RouteLocationNormalizedLoaded): BreadcrumbResolved[] {
  // consider only the routes which have a breadcrumb defined
  const matched = route.matched.filter(
    (r): r is typeof r & { meta: Required<PageMetaExtension> } => !!r.meta.breadcrumb,
  )
  return matched.map(r => resolveBreadcrumb(r.meta.breadcrumb, r))
}
