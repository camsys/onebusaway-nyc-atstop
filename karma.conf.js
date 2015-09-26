/* Karma Config

First, install (in the root of the project):

npm install --save-dev karma
npm install -g karma-cli
npm install --save-dev karma-jasmine
npm install --save-dev karma-chrome-launcher
npm install --save-dev karma-coverage
npm install --save-dev angular-mocks
npm install --save-dev ng-describe

Note: If this fails on Linux with a node-gyp error, you may need to install the build-essential package

To start use `karma start`
*/
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'www/lib/ionic/js/ionic.bundle.min.js',
      'www/lib/angular-ios9-patch/angular-ios9-uiwebview.patch.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/ng-describe/dist/ng-describe.js',
      'www/lib/ngCordova/dist/ng-cordova.min.js',
      'www/lib/underscore/underscore-min.js',
      'www/lib/moment/moment.min.js',
      'www/lib/angular-cache/angular-cache.min.js',
      'www/lib/leaflet/leaflet.js',
      'www/lib/leaflet/plugins/Polyline.encoded.js',
      'www/lib/leaflet/plugins/Marker.Rotate.js',
      'www/lib/angular-timer/angular-timer.min.js',
      'www/lib/angular-timer/humanize-duration.js',
      'www/lib/angular-leaflet/angular-leaflet-directive.min.js',
      'www/lib/round-progress/roundProgress.min.js',
      'www/lib/angular-inview/angular-inview.js',
      'www/js/*.js'
    ],
    port: 9876,
    browsers: ['Chrome'],
    singleRun: true,
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'www/js/*.js': ['coverage']
    }
  });
};
