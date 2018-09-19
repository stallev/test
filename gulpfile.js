'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var server = require('browser-sync').create();
var csso = require('gulp-csso');
var gulpMerge = require('merge2');
var cssComb = require('gulp-csscomb');
var spritesmith = require('gulp.spritesmith');
var imagemin = require('gulp-imagemin');
var run = require('run-sequence');
var del = require('del');
var rename = require('gulp-rename');
var ghPages = require('gulp-gh-pages');
var smartGrid = require('smart-grid');

gulp.task('smartGR', function(){
  var settingsSmartGrid = {
    outputStyle: 'scss', /* less || scss || sass || styl */
    columns: 12, /* number of grid columns */
    offset: '30px', /* gutter width px || % */
    mobileFirst: false, /* mobileFirst ? 'min-width' : 'max-width' */
    container: {
        maxWidth: '1200px', /* max-width оn very large screen */
        fields: '30px' /* side fields */
    },
    breakPoints: {
        lg: {
            width: '1100px', /* -> @media (max-width: 1100px) */
        },
        md: {
            width: '960px'
        },
        sm: {
            width: '780px',
            fields: '15px' /* set fields only if you want to change container.fields */
        },
        xs: {
            width: '560px'
        }
        /*
        We can create any quantity of break points.

        some_name: {
            width: 'Npx',
            fields: 'N(px|%|rem)',
            offset: 'N(px|%|rem)'
        }
        */
    }
};
return smartGrid('sass', settingsSmartGrid);
})

gulp.task('style', function() {
  gulp.src('sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({browsers: [
        'last 2 versions'
      ]})
    ]))
    .pipe(cssComb())
    .pipe(gulp.dest('build/css'))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('serve', ['style'], function() {
  server.init({
    server: 'build',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('sass/**/*.{scss,sass}', ['style']).on('change', server.reload);
  gulp.watch('*.html', ['copyHtml']);
  gulp.watch('build/*.html').on('change', server.reload);
});

gulp.task('copy', function(){
  return gulp.src([
    'fonts/**/*.{woff,woff2}',
    'js/**',
    'img/*.svg',
    '*.html'
  ], {
    base: '.'
  })
    .pipe(gulp.dest('build'));
});

gulp.task('sprite', function () {
  var spriteData = gulp.src('img/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.css'
  }));
  var imgStream = spriteData.img
    .pipe(gulp.dest('img/'));
  var cssStream = spriteData.css
    .pipe(gulp.dest('sass/global/'));
  return gulpMerge(imgStream, cssStream);
});

gulp.task('copyBootstrapJS', function(){
  return gulp.src(['node_modules/bootstrap-sass/assets/javascripts/*.js'])
    .pipe(gulp.dest('build/js'));
});

gulp.task('clean', function(){
  return del('build/img');
});

gulp.task('copyHtml', function(){
  return gulp.src(['*.html'], {base: '.'})
    .pipe(gulp.dest('build'));
});

gulp.task('images', function() {
  return gulp.src('img/**/*.{jpg,png,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest('build/img'));
});

gulp.task('build', function(fn){
  run('clean', 'copy', 'smartGR', 'copyBootstrapJS', 'images', 'style', fn);
});

gulp.task('server', function(){
  run('build', 'serve');
});
gulp.task('deploy', function() {
  return gulp.src('build/**/*')
    .pipe(ghPages());
});
