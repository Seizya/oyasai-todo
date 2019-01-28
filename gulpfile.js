const gulp = require('gulp');
const watch = require('gulp-watch');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const sass = require('gulp-sass');
// const sassGlob = require("gulp-sass-glob");
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
// const typedoc = require('gulp-typedoc');
// const uglify = require('gulp-uglify');
const closureCompiler = require('google-closure-compiler').gulp( /*{ jsmode: true }*/ );
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const rollup = require('rollup-stream');
const commonjs = require("rollup-plugin-commonjs");
const resolve = require("rollup-plugin-node-resolve");
const includePaths = require("rollup-plugin-includepaths");
const fs = require('fs');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');

// Setting : Paths
const paths = {
  'src_pug': './src/pug/',
  'src_sass': './src/sass/',
  'pug_config_package': "./package.json",
  'pug_config_user': "./src/pug/config.json",
  'out_html': './out/',
  'out_css': './out/css/',
  // 'src_ts': './src/ts/',
  // 'out_typedoc': './typedoc/',
  'src_js': './out/js/',
  'src_js_entry': "./out/js/index.js",
  'out_js_bundle': "./out/js/",
  'out_js_bundle_name': "bundle",
  'src_thirdparty': './thirdparty/',
  'out_thirdparty': "./out/thirdparty/"
}

// Setting : Pug Options
const pugLocals = {
  package: {},
  user: {}
}

const pugOptions = {
  locals: pugLocals
}

// Setting : Sass Options
const sassOptions = {
  outputStyle: 'expanded'
}

/*
const typedocOptions = {
  module: "commonjs",
  target: "es5",
  name: "my-project",
  includeDeclarations: true,
  out: paths.out_typedoc,
  ignoreCompilerErrors: false,
  version: true
};
*/

const includePathOptions = {
  include: {},
  paths: [paths.src_js_entry],
  external: [],
  extensions: ['.js', '.json']
}

const rollupOptions = {
  input: paths.src_js_entry,
  format: 'es',
  cache: cache,
  treeshake: true,
  sourcemap: true,
  plugins: [resolve(), commonjs(), includePaths(includePathOptions)]
}

const closureOptions = {
  "compilation_level": "SIMPLE", // ADVANCED は、JSONの変数名を書き換える。対応がめんどくさい。 TODO: ADVANCED への対応。
  "warning_level": "VERBOSE",
  "language_in": "ECMASCRIPT_2015",
  "language_out": "ECMASCRIPT_2015",
  "output_wrapper": "(function(){%output%})()",
  "js_output_file": paths.out_js_bundle + paths.out_js_bundle_name + ".min.js"
}

// [src_pug]/*.pug -> [out_html]/*.html
gulp.task('pug', () => {
  pugLocals.package = JSON.parse(fs.readFileSync(paths.pug_config_package).toString());
  pugLocals.user = JSON.parse(fs.readFileSync(paths.pug_config_user).toString());
  return gulp.src([paths.src_pug + '**/*.pug', '!' + paths.src_pug + '**/_*.pug'])
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(pug(pugOptions))
    .pipe(gulp.dest(paths.out_html));
});

// [src_sass]/*.sass -> [out_css]/*.css
gulp.task('sass', () => {
  return gulp.src(paths.src_sass + '**/*.sass')
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    // .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions))
    .pipe(autoprefixer(['> 3% in JP', 'ie 11', 'android 4.4', 'last 1 versions']))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.out_css));
});

// [out_css]/*.css -> [out_css]/*.min.css
gulp.task('cssmin', () => {
  return gulp.src([paths.out_css + '**/*.css', '!' + paths.out_css + '**/*.min.css'])
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.out_css));
});

// TypeDoc
// gulp.task('typedoc', () => {
//   return gulp.src(paths.src_ts + '**/*.ts')
//     .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
//     .pipe(typedoc(typedocOptions))
// });

// JS Uglify
// gulp.task('jsmin', () => {
//   return gulp.src([paths.src_js + '**/*.js', '!' + paths.src_js + '**/*.min.js'])
//     .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
//     .pipe(uglify())
//     .pipe(rename({ suffix: '.min' }))
//     .pipe(gulp.dest(paths.src_js))
// });

// JS bundle & minify
var cache;
gulp.task('jsbundle', () => {
  return rollup(rollupOptions)
    .on('bundle', (bundle) => {
      cache = bundle;
    })
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(source(paths.out_js_bundle_name + ".js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.out_js_bundle))
    .pipe(closureCompiler(closureOptions))
    .pipe(rename(paths.out_js_bundle_name + ".min.js"))
    .pipe(gulp.dest(paths.out_js_bundle));
});

gulp.task('copy-thirdparty', () => {
  return gulp.src(
      [paths.src_thirdparty + '**/*.*'], {
        base: paths.src_thirdparty
      }
    )
    .pipe(gulp.dest(paths.out_thirdparty));
})

// Browser Sync
gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: paths.out_html
    }
  });
});

gulp.task('reload', () => {
  if (browserSync.active) {
    browserSync.reload();
  }
});

gulp.task('build-sass', callback => {
  runSequence("sass", "cssmin", "reload",callback)
});
gulp.task('build-pug', callback => {
  runSequence("pug", "reload",callback)
});
gulp.task('build-js', callback => {
  runSequence("jsbundle", "reload",callback)
});
gulp.task('build-3rd', callback => {
  runSequence("copy-thirdparty", "reload",callback)
});

gulp.task('build', ["build-sass", "build-pug", "build-js", "build-3rd"]);

gulp.task('watch', () => {
  watch([paths.src_pug + '**/*.*', paths.pug_config_user, paths.pug_config_package],
    () => gulp.start("build-pug"))

  watch(paths.src_sass + '**/*.sass',
    () => gulp.start("build-sass"))

  watch([paths.src_js + '**/*.js', '!' + paths.src_js + '**/*.min.js'],
    () => gulp.start("build-js"))

  watch([paths.src_thirdparty + '**/*.*'],
    () => gulp.start("build-3rd"))
});

gulp.task('default', (callback) => {
  runSequence('browser-sync', 'build', 'watch', callback);
});