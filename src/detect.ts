import { dirname, isAbsolute, resolve } from 'pathe'
import { ScopeTracker, parseAndWalk, walk } from 'oxc-walker'
import type { CallExpression } from '@oxc-project/types'

export const MACRO_NAME = 'defineBreadcrumbs'
export const HAS_MACRO_RE = /\bdefineBreadcrumbs\s*\(/
const EXT_RE = /\.(?:m?[jt]sx?|vue)$/

export function stripExtension(path: string) {
  return path.replace(EXT_RE, '')
}

function resolveImportSource(source: string, fromId: string) {
  if (isAbsolute(source)) return stripExtension(source)
  return stripExtension(resolve(dirname(fromId.replace(/[?#].*$/, '')), source))
}

export interface DefineBreadcrumbsCall {
  node: CallExpression
  /**
   * End offset of the callee identifier used for the rewrite
   */
  calleeEnd: number
}

export interface FindDefineBreadcrumbsOptions {
  /**
   * Resolved source of the file that exports `defineBreadcrumbs` (extension optional).
   */
  macroSource: string
  /**
   * Force the parser language. Defaults to inference from `id`'s extension.
   */
  lang?: 'js' | 'ts' | 'jsx' | 'tsx'
}

/**
 * Find real `defineBreadcrumbs` macro calls in a piece of JS/TS code.
 *
 * Locally declared / shadowed `defineBreadcrumbs` identifiers are ignored.
 */
export function findDefineBreadcrumbsCalls(
  code: string,
  id: string,
  options: FindDefineBreadcrumbsOptions,
): DefineBreadcrumbsCall[] {
  const macroSource = stripExtension(options.macroSource)
  const calls: DefineBreadcrumbsCall[] = []

  const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
  const { program } = parseAndWalk(code, id, {
    scopeTracker,
    ...(options.lang && { parseOptions: { lang: options.lang } }),
  })
  scopeTracker.freeze()

  walk(program, {
    scopeTracker,
    enter(node) {
      if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier' || node.callee.name !== MACRO_NAME) return

      const declaration = scopeTracker.getDeclaration(node.callee.name)

      if (declaration?.type === 'Import') {
        // a non-type, named import of `defineBreadcrumbs` from the correct source
        const specifier = declaration.node
        if (
          declaration.importNode.importKind === 'type'
          || specifier.type !== 'ImportSpecifier'
          || specifier.importKind === 'type'
          || specifier.imported.type !== 'Identifier'
          || specifier.imported.name !== MACRO_NAME
          || resolveImportSource(declaration.importNode.source.value, id) !== macroSource
        ) return
      }
      else {
        // a local declaration shadows the macro
        return
      }

      calls.push({ node, calleeEnd: node.callee.end })
    },
  })

  return calls
}
