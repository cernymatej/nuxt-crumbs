import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export interface NuxtCrumbsOptions {
}

export default defineNuxtModule<NuxtCrumbsOptions>({
  meta: {
    name: 'nuxt-crumbs',
    configKey: 'crumbs',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)
  },
})
