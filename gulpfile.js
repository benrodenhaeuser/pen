var gulp     = require('gulp');
var rollup   = require('rollup');
var resolve  = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var rootImport = require('rollup-plugin-root-import');

gulp.task('rollup', () => {
  return rollup.rollup({
    input: './src/js/app.js',
    plugins: [rootImport({
      // Will first look in `client/src/*` and then `common/src/*`.
      root: `${__dirname}/src`,
      useEntry: 'prepend',

      // If we don't find the file verbatim, try adding these extensions
      extensions: '.js'
    }), resolve(), commonjs()]
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
// - The Math.js library is copyright (c) Jos de Jong
//   Distributed under an Apache License
//   https://github.com/josdejong/mathjs
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
