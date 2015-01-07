var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var gulpFilter  = require('gulp-filter');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var rimraf = require('rimraf');
var cssimport = require("gulp-cssimport");
var csso = require('gulp-csso');

var deploy = require("gulp-gh-pages");

gulp.task("deploy", ["sass","jekyll-build"], function () {
  return gulp.src("./_site/**/*")
    .pipe(deploy());
});

var options = {
    extensions: ["css"] // process only css
};


var includes = require('./resources.json');


var externalJsMin = includes.js.external.map(function (path) {
    if (typeof path === 'object') {
        return path.min;
    }
    path = path.replace(/(\.js|\.src.js)/, ".min.js");
    return path;
});




var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(cssimport(options))
        .pipe(prefix(['last 15 versions', '> 3%'], { cascade: true }))
        .pipe(csso(true))
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/**/*.scss', ['sass']);
    gulp.watch('js/**/*.js', ['js']);
    gulp.watch(['index.html', '_layouts/*.html', '_posts/*', '_includes/*'], ['jekyll-rebuild']);
});


gulp.task('js', function () {
    rimraf('dist', function(){
        gulp.src('js/*.js')
            .pipe(uglify())
            .pipe(concat('app.js'))
            .pipe(gulp.dest('./.tmp/js'))

        gulp.src(externalJsMin,{base: "bower_components"})
            //.pipe(addsrc('./.tmp/js/app.js'))
            .pipe(concat('all.js'))
            .pipe(gulp.dest('./_site/js'))
            .pipe(gulp.dest('./js'));

    });

});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch', 'js', 'sass']);
