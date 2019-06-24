const { src, parallel, series, dest, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const cache = require('gulp-cache');
const del = require('del');
const postcss = require('gulp-postcss');
const webpack = require("webpack-stream");
const pug = require('gulp-pug');
const log = require('fancy-log');

var toggleMode = (false) ? "production" : "development";

var webConfig =
{
    mode: toggleMode,
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
    .pipe(dest('src'))
    .pipe(browserSync.stream());
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
    .pipe(concat('main.css'))
    .pipe(dest('src/styles'))
    .pipe(cleanCSS({ compatibility: 'ie9' }))
    .pipe(rename({ suffix: '.min' }))
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
        open: true
    });

    watch('src/js/*.js', js);
    watch('src/sass/*.+(sass|scss)', styles);
    watch('src/pug/*.pug', pug_to_html);
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

function collect() {
    return new Promise(function(resolve) {
        del.sync('public');
        src('src/libs/**/*').pipe(dest('public/libs'));
        src('src/fonts/**/*').pipe(dest('public/fonts'));
        src('src/scripts/**/*').pipe(dest('public/scripts'));
        src('src/styles/**/*').pipe(dest('public/styles'));
        src('src/*.+(html|php)').pipe(dest('public'));
      resolve();
    });
}
/** END TO COMPILE */

exports.build = series(collect, img);
exports.default = parallel(pug_to_html, fonts, styles, js, browserReload);
exports.clear =()=> cache.clearAll();
