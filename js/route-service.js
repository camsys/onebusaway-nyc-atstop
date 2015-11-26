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

angular.module('atstop.route.service', ['ionic', 'configuration'])

/**
 * Service for getting data about routes (or lines in SIRI-speak)
 * Currently uses OBA Discovery APIs
 */
.factory('RouteService', function($log, $filter, $q, $http, httpTimeout, API_END_POINT, API_KEY) {

        /**
         * All your polylines are belong to us
         * @param route
         * @returns {*}
         */
    var getPolylines = function(route) {
        var deferred = $q.defer();
        var results = {
            stops: {},
            polylines: [],
            color: ""
        };

        var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK", {
                params: {
                    key: API_KEY,
                    version: 2,
                    includePolylines: true
                },
                cache: true,
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                angular.forEach(data.data.references.routes, function(val, key) {
                    if (val.id == route) {
                        results.color = val.color;
                    }
                });

                results.stops = data.data.references.stops;

                angular.forEach(data.data.entry.stopGroupings[0].stopGroups, function(val, key) {
                    angular.forEach(val.polylines, function(v, k) {
                        results.polylines.push(v.points);
                    });
                });

                return deferred.resolve(results);
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        return deferred.promise;
    };
        /**
         * Get direction names for a route
         * @param route
         * @returns {*}
         */
    var getDirections = function(route) {
        var deferred = $q.defer();
        var directions = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK", {
                cache: true,
                params: {
                    key: API_KEY,
                    version: 2,
                    includePolylines: false,
                    includeReferences: false
                },
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                if (data.data.entry.stopGroupings[0].stopGroups[0]) {
                    if (data.data.entry.stopGroupings[0].stopGroups[0].id == "0") {
                        directions[0] = {
                            directionId: 0,
                            destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
                        };
                    }

                    if (data.data.entry.stopGroupings[0].stopGroups[0].id == "1") {
                        directions[1] = {
                            directionId: 1,
                            destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
                        };
                    }
                }

                if (data.data.entry.stopGroupings[0].stopGroups[1]) {
                    if (data.data.entry.stopGroupings[0].stopGroups[1].id == "0") {
                        directions[0] = {
                            directionId: 0,
                            destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
                        };
                    }

                    if (data.data.entry.stopGroupings[0].stopGroups[1].id == "1") {
                        directions[1] = {
                            directionId: 1,
                            destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
                        };
                    }
                }
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        responsePromise.then(function() {
            deferred.resolve(directions);
        });

        return deferred.promise;
    };

        /**
         * wraps an undocumented convenience method to return a list of stops along a route
         * TODO: replace with SIRI LinesRequest API
         * @param route
         * @param direction
         * @returns {*}
         */
    var getStops = function(route, direction) {
        var deferred = $q.defer();
        var stops = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/stops-on-route-for-direction?callback=JSON_CALLBACK", {
                cache: true,
                params: {
                    routeId: route,
                    directionId: direction,
                    key: API_KEY
                },
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                stops = data.stops;
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
        getStops: getStops,
        getDirections: getDirections,
        getPolylines: getPolylines
    };
});