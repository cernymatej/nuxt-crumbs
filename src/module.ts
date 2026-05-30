import { readFile } from 'node:fs/promises'
import { defineNuxtModule, addImports, addPlugin, createResolver, addComponent } from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'

export interface ModuleOptions {
}

const BREADCRUMBS_RE = /\bdefineBreadcrumbs\s*\(/

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-crumbs',
    configKey: 'crumbs',
  },
  defaults: {},
  setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.typescript.tsConfig.include ||= []
    nuxt.options.typescript.tsConfig.include.push(resolve('./runtime/types/augments.d.ts'))

    addImports([
      {
        name: 'defineBreadcrumbs',
        from: resolve('./runtime/composables/breadcrumbs'),
      },
    ])

    addComponent({
      name: 'NuxtCrumbs',
      filePath: resolve('./runtime/components/NuxtCrumbs.vue'),
    })

    addPlugin(resolve('./runtime/plugins/breadcrumbs'))

    nuxt.hook('pages:extend', async (pages) => {
      const visit = async (page: NuxtPage): Promise<void> => {
        if (page.file && page.file.endsWith('.vue')) {
          const code = await readFile(page.file, 'utf8').catch(() => '')
          if (BREADCRUMBS_RE.test(code)) {
            page.meta = { ...page.meta, __crumbsDynamic: true }
          }
        }
        if (page.children?.length) {
          await Promise.all(page.children.map(visit))
        }
      }
      await Promise.all(pages.map(visit))
    })
  },
})
