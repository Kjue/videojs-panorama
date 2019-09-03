import pkg from './package.json'
import babel from 'rollup-plugin-babel'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import scss from 'rollup-plugin-scss'

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
    babel(),
    scss({
      // Filename to write all styles to
      output: 'dist/' + pkg.name + '.scss',

      // Determine if node process should be terminated on error (default: false)
      failOnError: true
    })
  ]
}
