import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'

export default {
  entry: 'app.jsx',
  format: 'iife',
  plugins: [
    resolve(),
    commonjs({ include: 'node_modules/**' }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('dev') }),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  dest: 'bundle.js'
}
