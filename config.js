var execSync = require('child_process').execSync,
    gitDescribe = execSync('git describe --tags').toString().replace(/(\r\n|\n|\r)/gm, '');

module.exports = {
  // Autoprefixer
  autoprefixer: {
    // https://github.com/postcss/autoprefixer#browsers
    browsers: [
      // Setup for WebComponents Browser Support
      // https://github.com/WebComponents/webcomponentsjs#browser-support
      'Chrome >= 50'
    ]
  },
  // BrowserSync
  browserSync: {
    browser: 'default', // or ["google chrome", "firefox"]
    https: false, // Enable https for localhost development.
    notify: false, // The small pop-over notifications in the browser.
    port: process.env.PORT || 3000, // Environment variable $PORT is for Cloud9 IDE
    ui: {
      port: 3001
    }
  },
  // Deploy task
  deploy: {
    // Choose hosting
    hosting: 'gae',
    // Google App Engine
    // GAE requires Google Cloud SDK to be installed and configured.
    // For info on SDK: https://cloud.google.com/sdk/
    gae: {
      env: {
        // development: 'XXX-dev', // project ID
        // staging:     'XXX-staging',
        production:  'XXX'
      },
      // Promote the deployed version to receive all traffic.
      // https://cloud.google.com/sdk/gcloud/reference/preview/app/deploy
      promote: true
    },
  },
  // PageSpeed Insights
  // Please feel free to use the `nokey` option to try out PageSpeed
  // Insights as part of your build process. For more frequent use,
  // we recommend registering for your own API key. For more info:
  // https://developers.google.com/speed/docs/insights/v1/getting_started
  pageSpeed: {
    key: '', // need uncomment in task
    nokey: true,
    site: 'https://www.example.com',
    strategy: 'mobile' // or desktop
  },
  // App theme
  theme: 'default-theme',
  // App version from git
  version: gitDescribe
};
