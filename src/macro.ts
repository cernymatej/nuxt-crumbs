import { normalize } from 'pathe'
import { createUnplugin } from 'unplugin'
import { rolldownString, generateTransform } from 'rolldown-string'
import { HAS_MACRO_RE, findDefineBreadcrumbsCalls } from './detect'

interface DefineBreadcrumbsMacroPluginOptions {
  /**
   * Absolute path to the file that exports `defineBreadcrumbs`.
   * The extension is optional - it is stripped before comparison.
   */
  macroSource: string
  /**
   * Live set of scanned page file paths (normalized, without query).
   */
  pagePaths: ReadonlySet<string>
  sourcemap?: boolean
}

export const VUE_ID_RE = /\.vue(?:\?|$)/

export const DefineBreadcrumbsMacroPlugin = (options: DefineBreadcrumbsMacroPluginOptions) => createUnplugin(() => {
  return {
    name: 'nuxt-crumbs:macro',
    enforce: 'post',
    transform: {
      filter: {
        id: {
          include: VUE_ID_RE,
          exclude: [/(?:\?|%3F).*\btype=(?:style|template)(?:&|$)/],
        },
        code: {
          include: HAS_MACRO_RE,
        },
      },
      handler(code, id, meta?: unknown) {
        // `defineBreadcrumbs` is a page macro - only transform scanned pages
        if (!options.pagePaths.has(normalize(id.replace(/[?#].*$/, '')))) return

        const calls = findDefineBreadcrumbsCalls(code, id, { macroSource: options.macroSource })
        if (!calls.length) return

        const s = rolldownString(code, id, meta)

        for (const call of calls) {
          // rewrite `defineBreadcrumbs(...)` -> `defineBreadcrumbs._(...)`
          s.appendLeft(call.calleeEnd, '._')
        }

        return generateTransform(s, id)
      },
    },
  }
})
