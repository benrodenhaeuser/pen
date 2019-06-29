var gulp       = require('gulp');
var rollup     = require('rollup');
var resolve    = require('rollup-plugin-node-resolve');
var commonjs   = require('rollup-plugin-commonjs');
var rootImport = require('rollup-plugin-root-import');

gulp.task('rollup', () => {
  return rollup.rollup({
    input: './src/js/app.js',
    plugins: [
      rootImport({ root: `${__dirname}/src`, useEntry: 'prepend' }),
      resolve(),
      commonjs()
    ]
  }).then(bundle => {
    return bundle.write({
      banner: `// - Bezier.js is copyright (c) by Pomax
//   Distributed under an MIT license
//   https://github.com/Pomax/bezierjs
// - CodeMirror is copyright (c) by Marijn Haverbeke and others
//   Distributed under an MIT license
//   https://codemirror.net/LICENSE
// - svg-pathdata library is copyright (c) by Nicolas Froidure
//   Distributed under an MIT license
//   https://github.com/nfroidure/svg-pathdata
// - gl-matrix is copyright (c) Brandon Jones, Colin MacKenzie IV
//   Distributed under an MIT License
//   https://github.com/toji/gl-matrix
    `,
      file: './dist/js/bundle.js',
      format: 'iife',
      name: 'library',
      sourcemap: true
    });
  });
});

gulp.task('watch', () => {
  gulp.watch(['./src/js/app.js', './src/js/**/*.js'], gulp.series('rollup'));
});

gulp.task('default', gulp.series('watch'));
