var path = require('path');

var ret = {
  'suites': ['.tmp/elements/**/*_test.html'],
  'webserver': {
    'pathMappings': []
  },
  extraScripts: [
    'app/polymer-settings.js', 'app/polyfill.min.js'],
  plugins: {
    local: {browsers: ['chrome']},
  }
};

var mapping = {};
var rootPath = (__dirname).split(path.sep).slice(-1)[0];

mapping['/components/' + rootPath  +
'/.tmp/bower_components'] = 'app/bower_components';
mapping['/components/' + rootPath  + '/.tmp/polyfill.min.js'] = 'app/polyfill.min.js';

ret.webserver.pathMappings.push(mapping);

module.exports = ret;
