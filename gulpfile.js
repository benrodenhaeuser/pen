const gulp       = require('gulp');
const rollup     = require('rollup');
const resolve    = require('rollup-plugin-node-resolve');
const commonjs   = require('rollup-plugin-commonjs');
const rootImport = require('rollup-plugin-root-import');
const terser     = require('rollup-plugin-terser');
const concatCSS  = require('gulp-concat-css');
const cleanCSS   = require('gulp-clean-css');
const eslint     = require('gulp-eslint');
const jest       = require('gulp-jest').default;

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
      terser.terser(),  // => use only for production builds
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

gulp.task('lint', () => {
  return gulp
    .src(['./src/js/app/**/*.js', './src/js/app.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', () => {
  gulp.watch([
    './src/css/*.css',
    './src/js/app.js',
    './src/js/**/*.js'
  ], gulp.parallel('scripts', 'styles'));
});

gulp.task('default', gulp.series('watch'));

gulp.task('jest', () => {
  return gulp.src('./test/app.test.js').pipe(jest());
});

gulp.task('make-test-bundle', () => {
  return rollup.rollup({
    input: './test/src/app.js',
    onwarn: function(warning, rollupWarn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        rollupWarn(warning);
      }
    },
    plugins: [
      rootImport({ root: `${__dirname}/src/js`, useEntry: 'prepend' }),
      resolve(),
      commonjs(),
    ]
  }).then(bundle => {
    return bundle.write({
      file: './test/dist/bundle.js',
      format: 'cjs',
      name: 'app',
      sourcemap: false
    });
  });
});

gulp.task('test', gulp.series('make-test-bundle', 'jest'));
