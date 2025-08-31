import commonJs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const ecma = 2019
const nodeEnv = '"production"'

const config = {
  output: {
    compact: true,
    format: 'es',
    inlineDynamicImports: true
  },
  plugins: [
    // CommonJS plugin should come before resolve to properly handle node_modules
    commonJs({
      ignoreGlobal: false,
      include: /node_modules/,
      // Handle 'this' in top-level scope correctly for Supabase and other CommonJS modules
      requireReturnsDefault: 'auto',
      // Additional options to better handle CommonJS modules
      transformMixedEsModules: true,
      // Fix for "this" context issue with @supabase/supabase-js
      // This will properly handle the TypeScript helper functions
      strictRequires: false
    }),
    resolve({browser: true, preferBuiltins: false}),
    replace({
      'process.env.NODE_ENV': nodeEnv,
      'process?.env?.NODE_ENV': nodeEnv,
      // Fix "this" issue by replacing it with globalThis in problematic contexts
      'this && this.__awaiter': 'globalThis && globalThis.__awaiter',
      'this && this.__generator': 'globalThis && globalThis.__generator',
      'this && this.__importDefault': 'globalThis && globalThis.__importDefault',
      'this && this.__exportStar': 'globalThis && globalThis.__exportStar',
      'this && this.__createBinding': 'globalThis && globalThis.__createBinding',
      'this && this.__setModuleDefault': 'globalThis && globalThis.__setModuleDefault',
      'this && this.__importStar': 'globalThis && globalThis.__importStar',
      'this && this.__rest': 'globalThis && globalThis.__rest',
      preventAssignment: true
    }),
    terser({
      compress: {
        ecma,
        drop_console: ['log', 'info'],
        keep_fargs: false,
        module: true,
        toplevel: true,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_symbols: true
      },
      format: {comments: false, ecma},
      mangle: {module: true, toplevel: true}
    })
  ]
}

export default ['firebase', 'ipfs', 'mqtt', 'nostr', 'supabase', 'torrent', 'game'].map(
  name => ({
    ...config,
    input: `src/${name}.js`,
    output: {
      ...config.output,
      file: `dist/trystero-${name}.min.js`
    }
  })
)
