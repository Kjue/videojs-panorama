import pkg from './package.json'
import babel from 'rollup-plugin-babel'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export default {
  input: 'src/scripts/plugin_es6.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    peerDepsExternal(),
    babel()
  ]
}
