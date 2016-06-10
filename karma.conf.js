
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'source-map-support'],
    browsers: ['Chrome'],

    plugins: [
      'karma-*'
    ],
    // list of files / patterns to load in the browser
    files: [
        'app/bower_components/system.js/dist/system.src.js',
        'app/components/my-demo/config.js',
        'app/components/my-demo/test-main.js',
         {pattern: 'node_modules/systemjs-plugin-babel/**/*.js', included: false},
         {pattern: 'app/components/**/*.{js,}', included: false},
         {pattern: '.tmp/npm-imports.js', included: false},
    ],
    proxies: {
      '/base/app/npm-imports.js': '/base/.tmp/npm-imports.js'
    },
    basePath : './',
  });
};
