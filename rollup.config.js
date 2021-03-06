// This plugin is needed for resolving dependencies (e.g. d3-timer) that are installed via npm (as normal)
import nodeResolve from 'rollup-plugin-node-resolve'

// This plugin would be useful to pick version automatically from package.json:
import json from 'rollup-plugin-json'

export default {
  entry: 'index.js',
  format: 'umd',
  plugins: [
    json(),
    nodeResolve({ jsnext: true, main: true })
  ],
  dest: 'build/audio-line.js',
  moduleName: 'timeline'
}
