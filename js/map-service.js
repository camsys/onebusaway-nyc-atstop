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

angular.module('atstop.services', ['ionic', 'configuration'])

/**
 * common functionality for creating maps
 */
.factory('MapService', function($log, RouteService, VehicleMonitoringService, $filter, $q) {
    var getStopMarkers = function(route, stop) {
        stop = stop || null;
        var deferred = $q.defer();
        var markers = {};

        RouteService.getPolylines(route).then(function(res) {
            angular.forEach(res.stops, function(val, key) {
                markers['s' + key] = {
                    lat: val.lat,
                    lng: val.lon,
                    layer: 'stops',
                    icon: {
                        iconUrl: 'img/stop_icons/stop.svg',
                        iconSize: [20, 20]
                    },
                    focus: false,
                    stopId: val.id,
                    stopName: $filter('encodeStopName')(val.name)
                };

                if (stop == val.id && stop !== null) {
                    markers['s' + key]['icon']['iconSize'] = [20, 20];
                    markers['s' + key]['icon']['iconUrl'] = 'img/stop_icons/stop-red.svg';
                    markers['s' + key]['layer'] = 'currentStop';
                }
            });

            deferred.resolve(markers);
        });

        return deferred.promise;
    };

    var getRoutePolylines = function(route) {
        var deferred = $q.defer();
        var paths = {};

        RouteService.getPolylines(route).then(function(res) {
            angular.forEach(res.polylines, function(val, key) {
                paths['p' + key] = {
                    color: '#' + res.color,
                    weight: 4,
                    latlngs: [],
                    clickable: false
                };

                angular.forEach(L.Polyline.fromEncoded(val).getLatLngs(), function(v, k) {
                    paths['p' + key].latlngs.push({
                        lat: v.lat,
                        lng: v.lng
                    });
                });
            });

            deferred.resolve(paths);
        });

        return deferred.promise;
    };

    var getBusMarkers = function(route) {
        var deferred = $q.defer();
        var markers = {};

        VehicleMonitoringService.getLocations(route).then(function(res) {
            angular.forEach(res, function(val, key) {
                markers['b' + key] = {
                    lat: val.latitude,
                    lng: val.longitude,
                    icon: {
                        type: 'div',
                        html: '<svg width="45" height="45"><image xlink:href="img/bus_icons/ring.svg" width="45" height="45" transform="rotate(' + (val.angle == 360 ? 0 : -1 * val.angle) + ', 22.5, 22.5)" /><image xlink:href="img/bus_icons/bus.svg" width="45" height="45"/></svg>',
                        className: '',
                        iconSize: [45, 45]
                    },
                    focus: false,
                    vehicleId: val.vehicleId,
                    destination: val.destination,
                    nextStop: val.stopPointName,
                    zIndexOffset: 800
                };
            });

            deferred.resolve(markers);
        });

        return deferred.promise;
    };

    var getDistanceInM = function(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c * 1000;
        return parseInt(d, 10);
    };

    var deg2rad = function(deg) {
        return deg * (Math.PI / 180);
    };

    return {
        getDistanceInM: getDistanceInM,
        getRoutePolylines: getRoutePolylines,
        getStopMarkers: getStopMarkers,
        getBusMarkers: getBusMarkers
    };
});
