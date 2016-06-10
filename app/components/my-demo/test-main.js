// Copyright 2015 Manuel Braun (mb@w69b.com). All Rights Reserved.
// LICENSE: http://www.apache.org/licenses/LICENSE-2.0

// make it async
var karma = window.__karma__;
karma.loaded = function() {
};

// Modules that are loaded before all tests.
var allTestModuleNames = ['test-helpers.js'];
var TEST_REGEXP = /_test\.js$/;

var pathToModule = function(path) {
  return path.replace(/^\/base\//, '');
};
var allTestModules = Object.keys(window.karma.files).filter(function(file) {
  return allTestModuleNames.some(function(suffix) {
    return file.endsWith(suffix);
  });
}).map(pathToModule);

Object.keys(window.karma.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    allTestModules.push(pathToModule(file));
  }
});

window.Polymer = window.Polymer || {};
window.Polymer.dom = 'shadow';

System.config({
  baseURL: '/base',
  paths: {
    'bower_components/*': '/base/dist/bower_components/*.js'
  }
});

var promises = allTestModules.map(function(module) {
  return System.import(module);
});
Promise.all(promises).then(function() {
  karma.start();
}, function(e) {
  console.error(e);
  karma.start();
  karma.result({
    id: 'bootstrap',
    description: 'bootstrap',
    suite: [],
    success: false,
    log: [e.stack]
  });
});
