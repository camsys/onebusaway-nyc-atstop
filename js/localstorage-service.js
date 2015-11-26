/*jshint sub:true*/
angular.module('atstop.localstorage.service', ['ionic', 'configuration'])

.factory('$localstorage', ['$log', '$window',
    function($log, $window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        };
    }
]);