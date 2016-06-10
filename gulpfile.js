/*
 Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */


// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob-all');
var historyApiFallback = require('connect-history-api-fallback');
var packageJson = require('./package.json');
var crypto = require('crypto');
var ensureFiles = require('./tasks/ensure-files.js');
var polyclean = require('polyclean');
var dependencyTree = require('dependency-tree');
var through = require('through2');
var webpack = require('webpack-stream');
var karmaServer = require('karma').Server;

var config = require('./config');


// Get a task path
function task(filename) {
  return './tasks/' + filename;
}

// var ghPages = require('gulp-gh-pages');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 38',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var DIST = 'dist';

var dist = function(subpath) {
  return !subpath ? DIST : path.join(DIST, subpath);
};

var styleTask = function(stylesPath, srcs) {
  return gulp.src(srcs.map(function(src) {
    return path.join('app', stylesPath, src);
  }))
    .pipe($.changed(stylesPath, {extension: '.css'}))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/' + stylesPath))
    .pipe($.minifyCss())
    .pipe(gulp.dest(dist(stylesPath)))
    .pipe($.size({title: stylesPath}));
};

var imageOptimizeTask = function(src, dest) {
  return gulp.src(src)
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(dest))
    .pipe($.size({title: 'images'}));
};

var optimizeHtmlTask = function(src, dest) {

  return gulp.src(src)
    .pipe($.debug())
    // Concatenate and minify JavaScript
    .pipe($.if('*.js', $.uglify({
      preserveComments: 'some'
    })))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.minifyCss()))
    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    // Output files
    .pipe(gulp.dest(dest))
    .pipe($.size({
      title: 'html'
    }));
};

// Compile and automatically prefix stylesheets
gulp.task('styles', function() {
  return styleTask('styles', ['**/*.css']);
});

gulp.task('elements', function() {
  return styleTask('elements', ['**/*.css']);
});

// Ensure that we are not missing required files for the project
// "dot" files are specifically tricky due to them being hidden on
// some systems.
gulp.task('ensureFiles', function(cb) {
  var requiredFiles = ['.bowerrc'];

  ensureFiles(requiredFiles.map(function(p) {
    return path.join(__dirname, p);
  }), cb);
});

// Optimize images
gulp.task('images', function() {
  return imageOptimizeTask('app/images/**/*', dist('images'));
});

gulp.task('copy:vulcanize', function() {
  return gulp.src([
    'app/bower_components/**/*',
    'app/polyfill.min.js',
  ], {
    base: 'app'
  }).pipe(gulp.dest('.tmp'));
});

// Copy all files at the root level (app)
gulp.task('copy', function() {
  var app = gulp.src([
    'app/*',
    '!app/test',
    '!app/elements',
    '!app/bower_components',
    '!app/cache-config.json',
    '!**/.DS_Store'
  ], {
    dot: true
  }).pipe(gulp.dest(dist()));

  // Copy over only the bower_components we need
  // These are things which cannot be vulcanized
  var bower = gulp.src([
    'app/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill,page,mediarecorder,webrtc-adapter}/**/*'
  ]).pipe(gulp.dest(dist('bower_components')));

  return merge(app, bower)
    .pipe($.size({
      title: 'copy'
    }));
});

// Copy web fonts to dist
gulp.task('fonts', function() {
  return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest(dist('fonts')))
    .pipe($.size({
      title: 'fonts'
    }));
});

// Scan your HTML for assets & optimize them
gulp.task('html', function() {
  return optimizeHtmlTask(
    [dist('/**/*.html'), '!' + dist('/{test,bower_components}/**/*.html')],
    dist());
});

// Vulcanize granular configuration
gulp.task('vulcanize', function() {
  return gulp.src('.tmp/elements/my-demo-app.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(polyclean.cleanCss())
    .pipe(polyclean.uglifyJs())
    .pipe(gulp.dest(dist('elements')))
    .pipe($.size({title: 'vulcanize'}));
});

// Generate config data for the <sw-precache-cache> element.
// This include a list of files that should be precached, as well as a (hopefully unique) cache
// id that ensure that multiple PSK projects don't share the same Cache Storage.
// This task does not run by default, but if you are interested in using service worker caching
// in your project, please enable it within the 'default' task.
// See https://github.com/PolymerElements/polymer-starter-kit#enable-service-worker-support
// for more context.
gulp.task('cache-config', function(callback) {
  var dir = dist();
  var config = {
    cacheId: packageJson.name || path.basename(__dirname),
    disabled: false
  };

  glob([
      'index.html',
      './',
      'bower_components/webcomponentsjs/webcomponents-lite.min.js',
      '{elements,scripts,styles}/**/*.*'],
    {cwd: dir}, function(error, files) {
      if (error) {
        callback(error);
      } else {
        config.precache = files;

        var md5 = crypto.createHash('md5');
        md5.update(JSON.stringify(config.precache));
        config.precacheFingerprint = md5.digest('hex');

        var configPath = path.join(dir, 'cache-config.json');
        fs.writeFile(configPath, JSON.stringify(config), callback);
      }
    });
});

// Clean output directory
gulp.task('clean', function() {
  return del(['.tmp', dist()]);
});

gulp.task('serve', ['clean'], function(cb) {
  // Uncomment 'cache-config' if you are going to use service workers.
  return runSequence(['serve:dev']);
});

// Watch files for changes & reload
gulp.task('serve:dev', ['styles', 'elements', 'npm', 'js'], function() {
  browserSync({
    port: 5000,
    open: false,
    notify: false,
    https: false,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [historyApiFallback()]
    }
  });

  gulp.watch(['app/**/*.html'], ['js', reload]);
  gulp.watch(['app/styles/**/*.css'], ['styles', reload]);
  gulp.watch(['app/elements/**/*.css'], ['elements', reload]);
  gulp.watch(['app/{scripts,elements,components}/**/{*.js,*.html}'], ['js']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function() {
  browserSync({
    port: 5001,
    notify: false,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: dist(),
    middleware: [historyApiFallback()]
  });
});

// Build production files, the default task
gulp.task('default', ['clean', 'test', 'eslint'], function(cb) {
  // Uncomment 'cache-config' if you are going to use service workers.
  runSequence(
    ['ensureFiles', 'copy', 'copy:vulcanize', 'styles'],
    ['elements', 'js', 'npm'],
    'vulcanize', // 'cache-config',
    ['images', 'fonts', 'html'],
    cb);
});

gulp.task('npm', function() {
  return gulp.src('npm-imports.js')
    .pipe(webpack({
      output: {
        filename: 'npm-imports.js',
        library: 'npm-imports.js',
         libraryTarget: 'amd'
       },
       module: {
         loaders: [
           {
             loader: 'babel-loader',
             query: {
               presets: ['es2015', 'stage-2']
             }
           }
         ]
       },
       plugins: [
         new webpack.webpack.DefinePlugin({
           'process.env.NODE_ENV': '"production"'
         })
       ]
     }))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('js', function(cb) {
  runSequence(
    'js-babel',
    'modules', cb);
  });

// Transpile all JS to ES5.
gulp.task('js-babel', function() {
  return gulp.src(['app/**/*.{js,html}',
  '!app/bower_components/**',
  '!app/polymer-settings.js',
  '!app/polyfill.min.js'], {follow: true})
    .pipe($.changed('.tmp/'))
    .pipe($.if('*.html', $.crisper({scriptInHead: false}))) // Extract JS from .html files
    .pipe($.plumber(function(err) {
      if (err.codeFrame) {
        console.error(err.codeFrame);
        console.error(err.message);
      } else {
        console.error(err);
     }
      this.emit('end');
    }))
    .pipe($.if('*.js', $.sourcemaps.init()))
    .pipe($.if('*.js', $.babel({
      plugins: ['transform-es2015-modules-amd'],
      moduleIds: true,
      getModuleId: function(mod) {
        return mod + '.js';
      },
      presets: ['es2015', 'stage-2']
    })))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/'));
});

gulp.task('modules', function() {
  var fullList = new Set();
  var visited = {};
  function generateImport(base, htmlFile) {
    return through.obj(function(file, enc, cb) {
      var list = dependencyTree.toList({
        filename: path.relative('./', file.path),
        root: './',
        visited: visited
      });
      for (var item of list) {
        if (item !== file.path)
          fullList.add(item);
      }
      cb();
    }, function() {
      var filePath = path.join(base, htmlFile);
      fullList = Array.from(fullList);
      var imports = fullList.map(function(file) {
        file = path.relative(path.dirname(filePath), file);
        return `<script src="${file}"></script>`;
      }).join('\n');
      var f = new $.util.File({
        contents: new Buffer(imports),
        base: path.resolve(base),
        path: path.resolve(filePath)
      });
      this.push(f);
      this.push(null);
    });
  }
  return gulp.src(['.tmp/elements/**/*.js'])
  .pipe(generateImport('.tmp/', 'elements/modules.html'))
    .pipe($.plumber(function(err) {
      console.error(err);
      this.emit('end');
    }))
  .pipe(gulp.dest('.tmp/'));
});

gulp.task('eslint', function() {
  function isFixed(file) {
	// Has ESLint fixed the file contents?
	return file.eslint != null && file.eslint.fixed;
}
  return gulp.src(['app/**/*.{js,html}', 'gulpfile.js',
  '!app/bower_components/**',
  '!app/**/*.min.js'], {base: './'})
    .pipe($.eslint({fix: true}))
    .pipe($.eslint.format())
    .pipe($.if(isFixed, gulp.dest('./')));
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

gulp.task('test', ['clean'], function(cb) {
  // Uncomment 'cache-config' if you are going to use service workers.
  runSequence(['test:local', 'karma'], cb);
});

gulp.task('karma', ['npm'], function(done) {
  new karmaServer({
    configFile: __dirname + '/karma.conf.js',
    // browsers: ['Chrome_docker'],
    autoWatch: false,
    singleRun: true
  }, done).start();
});

var injectDependencies = function (task, dependencies) {

  if (task !== null) {
    dependencies.forEach(function (dependency) {
      task.dep.push(dependency);
    });
  }
};

var wctTestDependencies = gulp.tasks['serve:dev'].dep;
injectDependencies(gulp.tasks[ 'wct:local' ], wctTestDependencies);
injectDependencies(gulp.tasks[ 'wct:sauce' ], wctTestDependencies);

// Build and serve the output from the dist build with GAE tool
gulp.task('serve:gae', ['default'], require(task('serve-gae'))($, gulp));

// Deploy Tasks
// ------------

// Pre-deploy tasks
gulp.task('pre-deploy', function(cb) {
  runSequence(
    'default',
    ['copy-hosting-config', 'fix-paths-before-revision'],
    'revision',
    'fix-paths-after-revision',
    cb);
});

// Deploy to development environment
gulp.task('deploy:dev', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'development'));

// Deploy to staging environment
gulp.task('deploy:stag', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'staging'));

// Deploy to production environment
gulp.task('deploy:prod', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'production'));

// Promote the staging version to the production environment
gulp.task('deploy:promote',
require(task('deploy'))($, config, gulp, 'promote'));


// Copy hosting configuration
gulp.task('copy-hosting-config', require(task('copy-hosting-config'))($, config, gulp));

// Fix paths before revision task
gulp.task('fix-paths-before-revision', require(task('fix-paths'))($, gulp, merge, 'before'));

// Fix paths after revision task
gulp.task('fix-paths-after-revision', require(task('fix-paths'))($, gulp, merge, 'after'));

// Static asset revisioning by appending content hash to filenames
gulp.task('revision', require(task('revision'))($, gulp));

// Load custom tasks from the `tasks` directory
try {
  require('require-dir')('tasks');
} catch (err) {
}
