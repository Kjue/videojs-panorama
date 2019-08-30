import path from 'path';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import { terser } from 'rollup-plugin-terser';
import minify from 'rollup-plugin-babel-minify';

const rollGlobals = {
  three: 'THREE',
  'video.js': 'video.js'
};

export default [
  {
    input: 'src/scripts/plugin_es6.js',
    plugins: [
      babel(), terser(),
    ],
    external: ['THREE', 'video.js'],
    output: {
      file: 'dist/videojs-panorama.es6.js',
      format: 'es',
      globals: rollGlobals
    }
  }
  // }, {
  //   input: 'src/scripts/plugin_v4.js',
  //   plugins: [
  //     babel(),
  //   ],
  //   output: [
  //     {
  //       file: 'dist/videojs-panorama.v4.js',
  //       format: 'cjs',
  //       globals: rollGlobals
  //     }
  //   ]
  // }, {
  //   input: 'src/scripts/plugin_v4.js',
  //   plugins: [
  //     minify(),
  //   ],
  //   output: [
  //     {
  //       file: 'dist/videojs-panorama.v4.min.js',
  //       format: 'cjs',
  //       globals: rollGlobals
  //     }
  //   ]
  // }
];
