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
const log = require('fancy-log');

const public_path = "public";

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

function convert_to_html() {
  return src('src/html_compile/*.+(pug|jade)')
    .pipe(pug())
    .pipe(dest('src'));
}

function fonts() {
  return src('node_modules/font-awesome/fonts/*')
    .pipe(dest('src/fonts/FontAwesome'))
}

function styles() {
  return src('src/sass/**/*.+(sass|scss)')
    .pipe(sass().on('error', sass.logError))
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
    watch('src/html_compile/**/*.+(pug|jade)', convert_to_html);
    watch('src/sass/**/*.+(sass|scss)', styles);
    watch("src/*.+(html|php)").on('change', browserSync.reload);
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
		.pipe(dest(`${public_path}/img`));
}

function setcss() {
  return src('src/styles/**/*.css')
    .pipe(sourcemaps.init())
      .pipe(postcss([
        autoprefixer({ overrideBrowserslist: ["ie >= 9", "> 0%"],	cascade: false })
      ]))
      .pipe(cleanCSS({ compatibility: 'ie9' }))
    .pipe(dest(`${public_path}/styles`))
}

function setjs() {
  webConfig.mode = "production";
  return src('src/js/*.js')
    .pipe(webpack(webConfig))
    .pipe(sourcemaps.init())
    .pipe(dest(`${public_path}/scripts`))
}

function collect() {
    return new Promise(function(resolve) {
        del.sync(public_path);
        src('src/libs/**/*').pipe(dest(`${public_path}/libs`));
        src('src/fonts/**/*').pipe(dest(`${public_path}/fonts`));
        src('src/*.+(html|php)').pipe(dest(public_path));
      resolve();
    });
}
/** END TO COMPILE */

exports.build = series(collect, setjs, setcss, img);
exports.default = parallel(fonts, styles, js, convert_to_html, browserReload);
exports.clear =()=> cache.clearAll();
