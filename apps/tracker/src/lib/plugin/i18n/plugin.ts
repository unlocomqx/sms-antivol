import {babelParse, getLang, walkAST, type WithScope} from 'ast-kit'
import type {Node} from '@babel/types'
import type {PluginOption} from 'vite'
import path from 'node:path'
import * as fs from 'node:fs'
import 'dotenv/config'
import {hashCode} from './hash'
import {glob} from 'glob'

export function i18n_plugin() {
  const strings = new Set<string>()

  // noinspection JSUnusedGlobalSymbols
  return {
    name: 'vite-plugin-i18n',
    apply: 'build',
    transform(code: string, id: string) {
      if (id.includes('node_modules')) return code
      if (!id.endsWith('.svelte') && !id.endsWith('.ts')) return code

      const program = babelParse(code, getLang(id), {
        sourceFilename: id
      })

      walkAST<WithScope<Node>>(program, {
        enter(node: any) {
          if (
            node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.callee.name === '_'
          ) {
            const str = node.arguments[0]
            if (str && str.type === 'StringLiteral') {
              strings.add(str.value)
            }
          }
        }
      })

      return code
    },

    async buildEnd() {
      const sorted_strings = Array.from(strings).sort()
      const translations: Record<string, string> = Object.fromEntries(sorted_strings.map(s => [s, ""]))
      const new_content = `export default ` + JSON.stringify(translations, null, 2)

      const output_path = path.resolve(new URL('./output/dict.en.js', import.meta.url).pathname)
      const hash_path = path.resolve(path.dirname(output_path), 'hash.json')
      const new_hash = hashCode(new_content)
      if (fs.existsSync(hash_path)) {
        const json = fs.readFileSync(hash_path).toString()
        const {hash} = JSON.parse(json)
        if (hash === new_hash) {
          console.info('No changes')
          return
        }
      }

      fs.writeFileSync(output_path, new_content)
      fs.writeFileSync(hash_path, JSON.stringify({hash: String(new_hash)}))

      // update other languages
      const lang_files = await glob(path.resolve(path.dirname(output_path), 'dict.*.js'))
      for (const lang_file of lang_files) {
        if (lang_file === output_path) continue
        const {default: translations} = await import(lang_file)
        // only add new keys
        for (const key of sorted_strings) {
          if (!translations[key]) {
            translations[key] = ""
          }
        }
        fs.writeFileSync(lang_file, `export default ` + JSON.stringify(translations, null, 2))
      }

      console.info('Build end')
    }
  } as PluginOption
}
