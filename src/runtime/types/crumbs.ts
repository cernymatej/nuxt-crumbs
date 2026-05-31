import type { RouteLocationRaw } from 'vue-router'
import type { Breadcrumb as BreadcrumbBase } from '../index'

export interface Breadcrumb extends Partial<BreadcrumbBase> {
  label: string
}

export interface BreadcrumbResolved extends Breadcrumb {
  to: RouteLocationRaw
  routeName: string | symbol | null
}
