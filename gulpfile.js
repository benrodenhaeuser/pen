var gulp     = require('gulp');
var rollup   = require('rollup');
var resolve  = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');

gulp.task('rollup', () => {
  return rollup.rollup({
    input: './src/js/app.js',
    plugins: [resolve(), commonjs()]
  }).then(bundle => {
    return bundle.write({
      banner: `// - The Bezier.js library is copyright (c) by Pomax
//   Distributed under an MIT license
//   https://github.com/Pomax/bezierjs
// - CodeMirror is copyright (c) by Marijn Haverbeke and others
//   Distributed under an MIT license
//   https://codemirror.net/LICENSE
// - The SVG PathData library is copyright (c) by Nicolas Froidure
//   Distributed under an MIT license
//   https://github.com/nfroidure/svg-pathdata
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
