var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
//var uncss = require('gulp-uncss');
var del = require('del');

var paths = {
  sass: ['./scss/**/*.scss'],
  targetdir: ['./www'],
  js: ['./js/*.js']
};

gulp.task('default', ['sass', 'compress']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass({style: 'compact'}))
    .pipe(gulp.dest('./www/css/'))
    // sadly, uncss on mobile is a little too aggressive.
    // .pipe(uncss({
    //         html: ['./www/**/*.html']
    //     }))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.js, ['compress']);
});

gulp.task('lint', function() {
  return gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('compress', function() {
	gulp.src(
        ['./js/*.js',
        '!./js/*-spec.js',
        '!./js/*.tmpl*'])
		.pipe(ngAnnotate({
			remove: true,
			add: true,
			single_quotes: true
		}))
		.pipe(uglify())
        .pipe(concat('scripts.js'))
		.pipe(gulp.dest('www/js'))
});


gulp.task('docs', shell.task([
  'node_modules/jsdoc/jsdoc.js '+
    '-c node_modules/angular-jsdoc/common/conf.json '+   // config file
    '-t node_modules/angular-jsdoc/angular-template '+   // template file
    '-d docs '+                                          // output directory
    './README.md '+                                      // to include README.md as index contents
    '-r ./js' +                                         // source code directory
    '--verbose'
]));

//var options = ['-o3'];
//
//gulp.task('compress_resources', function () {
//	gulp.src('./resources/**/*.png')
//		//.pipe(pngquant({quality: '80-90', speed: 4}))
//		.pipe(optipng(options))
//		.pipe(gulp.dest('dist'));
//});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
      .on('log', function(data) {
        gutil.log('bower', gutil.colors.cyan(data.id), data.message);
      });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
        '  ' + gutil.colors.red('Git is not installed.'),
        '\n  Git, the version control system, is required to download Ionic.',
        '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
        '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
