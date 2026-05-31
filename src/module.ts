import { readFile } from 'node:fs/promises'
import { defineNuxtModule, addImports, addPlugin, createResolver, addComponent, addBuildPlugin } from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { normalize } from 'pathe'
import { DefineBreadcrumbsMacroPlugin } from './macro'
import { HAS_MACRO_RE, findDefineBreadcrumbsCalls } from './detect'

// eslint-disable-next-line
export interface ModuleOptions {
}

const SCRIPT_LANGS = ['js', 'ts', 'jsx', 'tsx'] as const

function pageHasDefineBreadcrumbs(code: string, filename: string, macroSource: string): boolean {
  const { descriptor } = parseSFC(code, { filename })
  const scriptLang = descriptor.scriptSetup?.lang ?? descriptor.script?.lang
  const script = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n')

  return findDefineBreadcrumbsCalls(script, filename, {
    macroSource,
    lang: SCRIPT_LANGS.find(lang => lang === scriptLang) ?? 'ts',
  }).length > 0
}

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

    nuxt.options.alias['#crumbs'] = resolve('./runtime/index.ts')
    nuxt.options.alias['#crumbs/types'] = resolve('./runtime/types.ts')

    const defineBreadcrumbsSource = resolve('./runtime/composables/define-breadcrumbs.ts')

    // file paths of every page
    const pagePaths = new Set<string>()

    addImports([
      {
        name: 'defineBreadcrumbs',
        from: defineBreadcrumbsSource,
      },
    ])

    addComponent({
      name: 'NuxtCrumbs',
      filePath: resolve('./runtime/components/NuxtCrumbs.vue'),
    })

    addPlugin(resolve('./runtime/plugins/breadcrumbs.ts'))

    nuxt.hook('pages:extend', async (pages) => {
      pagePaths.clear()

      const visit = async (page: NuxtPage): Promise<void> => {
        if (page.file && page.file.endsWith('.vue')) {
          pagePaths.add(normalize(page.file))

          const code = await readFile(page.file, 'utf8').catch(() => '')
          if (HAS_MACRO_RE.test(code) && pageHasDefineBreadcrumbs(code, page.file, defineBreadcrumbsSource)) {
            page.meta = { ...page.meta, __crumbsDynamic: true }
          }
        }
        if (page.children?.length) {
          await Promise.all(page.children.map(visit))
        }
      }
      await Promise.all(pages.map(visit))
    })

    nuxt.hook('modules:done', () => {
      addBuildPlugin(DefineBreadcrumbsMacroPlugin({
        macroSource: defineBreadcrumbsSource,
        pagePaths,
        sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client,
      }))
    })
  },
})
