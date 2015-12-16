var gulp = require('gulp');
var args = require('yargs').argv;
var del  = require('del');
var $    = require('gulp-load-plugins')({lazy:true});
var browserSync = require('browser-sync');
var angularTemplateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');

var path = {
  "src_html_template"   : "./app/views/**/*.html",
  "dest_html_template"  : "./app/template/",
  "src_images"          : "./source/images/**/*.*",
  "dest_images"         : "./app/images/",
  "src_less"            : "./source/style/**/*.less",
  "dest_css"            : "./app/style/",
  "src_lib"             : "./app/lib/",
  "src_js"              : "./source/js/**/*.js",
  "application_folder"  : "./app/",
  
  "templateCache": {
    "file": "templates.js",
    "options": {
      "module": "AngularAppModule",
      "standAlone": false,
      "root": "views/"
    }
  }
};

gulp.task('TemplateCache', function(){

  log("Creating angular templating ...");

  return gulp.src(path.src_html_template)
            .pipe($.minifyHtml({empty: true}))
            .pipe(angularTemplateCache(
                  path.templateCache.file,
                  path.templateCache.options
                ))
            .pipe(gulp.dest(path.dest_html_template))

});

gulp.task('images',function(){
  return gulp.src(path.src_images)
          .pipe($.imagemin({optimizationLevel: 4}))
          .pipe(gulp.dest(path.dest_images));
});

gulp.task('optimizeJS',function(){
  return gulp.src(path.src_js)
          .pipe(ngAnnotate())
          .pipe($.concat('app.js'))
          //.pipe($.uglify())
          .pipe($.rename({
            suffix: '.min'
          }))
          .pipe(gulp.dest(path.application_folder))
})

gulp.task('optimizeLibJS',function(){
  return gulp.src([
                "app/lib/jquery.js",
                "app/lib/jquery.scrollTo.min.js",
                "app/lib/falcor.browser.js",
                "app/lib/angular.js",
                "app/lib/angular-messages.js",
                "lib/angular-aria.min.js",
                "lib/angular-sanitize.min.js",
                "app/lib/angular-animate.min.js",
                "app/lib/angular-ui-router.js",
                "app/lib/angular-google-analytics.js",
                "app/lib/bootstrap-switch.js",
                "app/lib/angular-bootstrap-switch.js",
                "app/lib/ui-bootstrap-tpls.js",
                "app/lib/slick.js",
                "app/lib/slick-angular.js",
                "app/lib/angular-youtube-embed.js"
                  ])
          .pipe(ngAnnotate())
          .pipe($.concat('lib.js'))
          .pipe($.uglify())
          .pipe($.rename({
            suffix: '.min'
          }))
          .pipe(gulp.dest(path.application_folder))
})

gulp.task('less',['clean-css'], function() {
  return gulp.src(path.src_less)
          .pipe($.less())
          //.on('error',errorLogger)
          .pipe($.plumber())
          .pipe($.autoprefixer({
                  browsers: ['last 2 versions','> 5%'],
                  cascade: false
          }))
          .pipe($.concat('style.css'))
          //.pipe($.cssmin())
          .pipe($.rename({
            suffix: '.min'
          }))
          .pipe(gulp.dest(path.dest_css));
});

gulp.task('clean',function(done){
  var delConfig = [].concat(path.dest_css + "**/*.css", path.dest_images + "**/*.*");
  del(delConfig,done);
});

gulp.task('clean-css',function(done){
  log("clean style file");
  clean(path.dest_css + "**/*.css",done);
});

gulp.task('clean-images',function(done){
  log("clean images file");
  clean(path.dest_images + "**/*.*",done);
});

gulp.task('less-watcher',function(){
  gulp.watch([path.src_less],["less"]);
});

gulp.task('serve-dev', function(){

  return $.nodemon()
          .on('restart',function(ev){
              
              log('*** nodemon restart ***');
              
              setTimeout(function(){
                browserSync.notify("reloading now ..");
                browserSync.reload({stream:false});
              },1000);
          })
          .on('start',function(ev){
              
              log('*** nodemon start ***');
              
              startBrowserSync();
          })
          .on('crash',function(ev){
              
              log('*** nodemon crash ***');
          })
          .on('exit',function(ev){
              log('*** nodemon exit clean ***');
          })
});

/***************************/

function changeEvent(event){
  var srcPattern = new RegExp('/.*(?=/' + path.application_folder + ')/');
  log("File " + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync(){
  
  if(browserSync.active){
    return;
  }
  
  log("Starting browserSync");

  gulp.watch([path.src_less, path.src_html_template, path.src_js],["less","TemplateCache","optimizeJS"])
      .on('change', function(event){ changeEvent(event); });

  var options = {
    //proxy: 'localhost:3000',
    //port: 3000,
    files: [
      path.application_folder + '**/*.*',
      '!' + path.src_less,
      path.application_folder + 'style/**/*.css'
    ],
    server: {
      baseDir: './app/'
    },
    ghostMode: {
      clicks: false,
      location: false,
      forms: false,
      scroll: false
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'debug',
    logPrefix: 'gulp-patterns',
    notify: true,
    reloadDelay: 1000
  };

  browserSync(options);
}

function clean(path,done){
  del(path,done);
}

function errorLogger(error){
  log('*** Start of error ***');
  log(error);
  log('*** End of error ***');
  this.emit('end');
}

function log(msg){
  if(typeof(msg) === 'object'){
    for (var item in msg){
      if(msg.hasOwnProperty(item)){
        $.util.log($.util.colors.blue(msg[item]));
      }
    }
  }
}