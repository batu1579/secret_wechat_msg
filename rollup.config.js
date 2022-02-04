import babel from 'rollup-plugin-babel';

import { uglify } from 'rollup-plugin-uglify';

import commonjs from 'rollup-plugin-commonjs'

export default {
    input: 'src/index.js',
    output: {
        format: 'umd',
        file: 'dist/index.js'
    },
    plugins: [
        commonjs(),
        babel({
            exclude: "node_modules/**"
        }),
        uglify()
    ]
}
