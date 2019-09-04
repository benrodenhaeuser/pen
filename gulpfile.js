var gulp       = require('gulp');
var concatCSS  = require('gulp-concat-css');
var cleanCSS   = require('gulp-clean-css');
var rollup     = require('rollup');
var resolve    = require('rollup-plugin-node-resolve');
var commonjs   = require('rollup-plugin-commonjs');
var rootImport = require('rollup-plugin-root-import');
var terser     = require('rollup-plugin-terser');


gulp.task('scripts', () => {
  return rollup.rollup({
    input: './src/js/app.js',
    onwarn: function(warning, rollupWarn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        rollupWarn(warning);
      }
    },
    plugins: [
      // allow absolute paths (starting with `/`), will resolve to `src/js`:
      rootImport({ root: `${__dirname}/src/js`, useEntry: 'prepend' }),
      resolve(),
      commonjs(),
      // terser.terser(),  // only for production builds
    ]
  }).then(bundle => {
    return bundle.write({
      banner: `// - Bezier.js is copyright (c) by Pomax
//   Distributed under an MIT license
//   https://github.com/Pomax/bezierjs
// - CodeMirror is copyright (c) by Marijn Haverbeke and others
//   Distributed under an MIT license
//   https://codemirror.net/LICENSE
// - svg-pathdata is copyright (c) by Nicolas Froidure
//   Distributed under an MIT license
//   https://github.com/nfroidure/svg-pathdata
// - gl-matrix is copyright (c) Brandon Jones, Colin MacKenzie IV
//   Distributed under an MIT License
//   https://github.com/toji/gl-matrix
// - diff-match-patch is copyright (c) by the authors
//   Distributed under an Apache License
//   https://github.com/google/diff-match-patch
    `,
      file: './dist/js/bundle.js',
      format: 'iife',
      name: 'app',
      sourcemap: true
    });
  });
});

gulp.task('styles', () => {
  return gulp
    .src([
      './src/css/reset.css',
      './src/css/codemirror.css',
      './src/css/html.css',
      './src/css/svg.css',
    ])
    .pipe(concatCSS("bundle.css"))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('./dist/css/'))
});

gulp.task('watch', () => {
  gulp.watch([
    './src/css/*.css',
    './src/js/app.js',
    './src/js/**/*.js'
  ], gulp.parallel('scripts', 'styles'));
});

gulp.task('default', gulp.series('watch'));
