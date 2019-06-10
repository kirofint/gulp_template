const { src, parallel, series, dest, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const cache = require('gulp-cache');
const del = require('del');
const postcss = require('gulp-postcss');

function js() {
    return src('src/js/*.js')
    .pipe(concat('app.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(dest('src/scripts'))
    .pipe(browserSync.stream());
}

function styles() {
    return src('src/sass/*.+(sass|scss)')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([ autoprefixer({ grid: true, browsers: ['last 2 versions', 'ie 6-8', 'Firefox > 20'] }) ]))
    .pipe(concat('main.css'))
    .pipe(dest('src/styles'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('src/styles'))
    .pipe(browserSync.stream());
}

function browserReload() {
    browserSync.init({
        proxy: 'localbuild',
        //server: { baseDir: "./src" },
        notify: false
    });

    watch('src/*.+(html|php)').on('change', browserSync.reload);
    watch('src/js/*.js', js);
    watch('src/sass/*.+(sass|scss)', styles);
}

const clear_cache =()=> { return cache.clearAll(); };
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
        src('src/styles/**/*.min.css').pipe(dest('public/styles'));
        src('src/*.+(html|php)').pipe(dest('public'));
      resolve();
    });
}

exports.build = series(collect, img);
exports.default = parallel(js, styles, browserReload);
