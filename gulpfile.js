var gulp    = require('gulp');
var rollup  = require('rollup');
var resolve = require('rollup-plugin-node-resolve');

gulp.task('rollup', () => {
  return rollup.rollup({
    input: './src/js/app.js',
    plugins: [resolve()]
  }).then(bundle => {
    return bundle.write({
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
