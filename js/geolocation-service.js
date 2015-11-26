/*jshint sub:true*/

/**
 * Copyright (c) 2015 Metropolitan Transportation Authority
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * @authors https://github.com/camsys/onebusaway-nyc-atstop/graphs/contributors
 */

angular.module('atstop.geolocation.service', ['ionic', 'configuration'])
/**
 * Service for returning nearby routes and stops
 * Currently uses OBA discovery APIs
 */
.factory('GeolocationService', function($log, $q, $http, httpTimeout, API_END_POINT, API_KEY) {
        /**
         * get routes near coordinates
         * @param lat
         * @param lon
         * @returns {*}
         */
    var getRoutes = function(lat, lon) {
        var deferred = $q.defer();
        var routes = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/where/routes-for-location.json?callback=JSON_CALLBACK", {
                params: {
                    key: API_KEY,
                    lat: lat,
                    lon: lon,
                    radius: 200,
                    includeReferences: false
                },
                cache: true,
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                routes = data.data.routes;
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        responsePromise.then(function() {
            deferred.resolve(routes);
        });

        return deferred.promise;
    };


        /**
         * get stops near coordinates
         * @param lat
         * @param lon
         * @returns {*}
         */
    var getStops = function(lat, lon) {
        var deferred = $q.defer();
        var stops = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-location.json?callback=JSON_CALLBACK", {
                params: {
                    key: API_KEY,
                    lat: lat,
                    lon: lon,
                    radius: 200
                },
                cache: true,
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                stops = data.data.stops;
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        responsePromise.then(function() {
            deferred.resolve(stops);
        });

        return deferred.promise;
    };

    return {
        getRoutes: getRoutes,
        getStops: getStops
    };
});