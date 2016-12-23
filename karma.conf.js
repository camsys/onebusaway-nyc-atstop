/* Karma Config

First, install (in the root of the project):

npm install -g karma-cli

Note: If this fails on Linux with a node-gyp error, you may need to install the build-essential package

To start use `karma start`
*/
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'www/lib/ionic/js/ionic.bundle.js',
      'node_modules/ng-describe/dist/ng-describe.js',
      'www/lib/ngCordova/dist/ng-cordova-mocks.js',
      'www/lib/ngCordova/dist/ng-cordova.min.js',
      'www/lib/underscore/underscore-min.js',
      'www/lib/moment/moment.min.js',
      'www/lib/angular-cache/angular-cache.min.js',
      'www/lib/leaflet/leaflet.js',
      'www/lib/leaflet/plugins/Polyline.encoded.js',
      'www/lib/leaflet/plugins/Marker.Rotate.js',
      'www/lib/angular-timer/angular-timer.min.js',
      'www/lib/angular-timer/humanize-duration.js',
      'www/lib/angular-leaflet-directive/dist/angular-leaflet-directive.min.js',
      'www/lib/angular-inview/angular-inview.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'www/lib/lokijs/src/lokijs.js',
      'www/lib/lokijs/src/loki-angular.js',
      'js/*.js'
    ],
    port: 9876,
    browsers: ['Chrome'],
    singleRun: false,
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'js/*.js': ['coverage']
    }
  });
};
