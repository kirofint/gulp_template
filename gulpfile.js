const { src, parallel, series, dest, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps')
const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const cache = require('gulp-cache');
const del = require('del');
const postcss = require('gulp-postcss');
const webpack = require("webpack-stream");
const pug = require('gulp-pug');
const log = require('fancy-log');;

var webConfig =
{
    mode: "development",
    stats: 'errors-only',
    performance: { hints: false },
    output: { filename: 'app.js' },
    module: {
      rules: [
          {
            test: /\.(js)$/,
            loader: 'babel-loader',
            exclude: /(node_modules)/
          }
      ]
    }
};

function pug_to_html() {
  return src('src/pug/**/*.pug')
    .pipe(pug())
    .pipe(dest('src'));
}

function fonts() {
  return src('node_modules/font-awesome/fonts/*')
    .pipe(dest('src/fonts/FontAwesome'))
}

function styles() {
  return src('src/sass/*.+(sass|scss)')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({ overrideBrowserslist: ["ie >= 9", "> 0%"],	cascade: false })
    ]))
    .pipe(concat('main.min.css'))
    .pipe(dest('src/styles'))
    .pipe(browserSync.stream());
}

function js() {
  return src('src/js/*.js')
    .pipe(webpack(webConfig))
    .pipe(dest('src/scripts'))
    .pipe(browserSync.stream());
}

function browserReload() {
    browserSync.init({
        server: { baseDir: "./src" },
        notify: false,
        open: false
    });

    watch('src/js/*.js', js);
    watch('src/pug/*.pug', pug_to_html);
    watch('src/sass/*.+(sass|scss)', styles);
    watch("src/*.html").on('change', browserSync.reload);
}

/** TO COMPILE */
function img() {
	return src('src/img/**/*')
		.pipe(cache(imagemin({
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(dest('public/img'));
}

function mincss(params) {
  return src('src/styles/**/*.css')
    .pipe(sourcemaps.init())
      .pipe(cleanCSS({ compatibility: 'ie9' }))
    .pipe(dest('public/styles'))
}

function minjs() {
  webConfig.mode = "production";
  return src('src/js/*.js')
    .pipe(webpack(webConfig))
    .pipe(sourcemaps.init())
    .pipe(dest('public/scripts'))
}

function collect() {
    return new Promise(function(resolve) {
        del.sync('public');
        src('src/libs/**/*').pipe(dest('public/libs'));
        src('src/fonts/**/*').pipe(dest('public/fonts'));
        src('src/*.+(html|php)').pipe(dest('public'));
      resolve();
    });
}
/** END TO COMPILE */

exports.build = series(collect, minjs, mincss, img);
exports.default = parallel(fonts, styles, js, pug_to_html, browserReload);
exports.clear =()=> cache.clearAll();
