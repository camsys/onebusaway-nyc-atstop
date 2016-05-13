/*jshint sub:true*/
angular.module('atstop.storage.service', ['ionic'])
.factory('StorageService', ['$log', '$window',
    function($log, $window) {
        var set= function(key, value) {
            $window.localStorage[key] = value;
        };
        var get= function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        };
        var setObject= function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        };
        var getObject= function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        };
        return {
            set: set,
            get: get,
            setObject: setObject,
            getObject: getObject
        };
    }
]);