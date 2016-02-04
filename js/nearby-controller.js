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

angular.module('atstop.nearby.controller', ['configuration', 'filters'])

/**
 * @ngdoc controller
 * @description
 * Controller that used for showing the nearby stops for specific location from geolocations.
 */
.controller('NearbyStopsAndRoutesCtrl', ['$log', '$ionicLoading', 'MapService', '$stateParams', '$window', '$location', '$scope', 'GeolocationService','AtStopService', '$q', '$ionicPopup', '$cordovaGeolocation', '$filter', 'RouteService', 'leafletData', '$ionicScrollDelegate', '$timeout', '$interval', 'debounce', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
    function($log, $ionicLoading, MapService, $stateParams, $window, $location, $scope, GeolocationService, AtStopService, $q, $ionicPopup, $cordovaGeolocation, $filter, RouteService, leafletData, $ionicScrollDelegate, $timeout, $interval, debounce, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
        $scope.markers = {};
        $scope.paths = {};
        $scope.url = "atstop";
        $scope.left = false;
        $scope.center = {};
        $scope.data = {
            "inRouteView": false,
            "title": "Nearby Stops",
            "loaded": true,
            "showMap": true,
            "stops": [],
            "routes": [],
            "markers": {},
            "lat": "",
            "lon": "",
            "notifications": "",
            "val": false,
            "showRoutes": false,
            "showStops": true,
            "results": [],
            "mapHeight": Math.floor(document.getElementsByTagName('html')[0].clientHeight / 2) - 90,
            "listHeight": Math.floor(document.getElementsByTagName('html')[0].clientHeight / 2),
            "tips": "Pull the list to refresh",
            "nearbyStops": []
        };

        // this array holds stops we want to query arrivals from.
        var stopsInTimeout = [];

        var lastZoom;
        var defaultZoom = 15;

        var cancelReloadTimeout = function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        };
        var setReloadTimeout = function() {
            $scope.reloadTimeout = $interval(
                function () {
                    tick(); }, 30000
            );
        };
        var resetReloadTimeout = function() {
            cancelReloadTimeout();
            setReloadTimeout();
        };

        /**
         * move back from stop detail
         */
        $scope.back = function() {
            $scope.data.inRouteView = false;
            resetReloadTimeout();
            $scope.reinitialize();
        };

        $scope.toggleStopAlerts = function(stop){
            stop.showAlerts = !stop.showAlerts;
        };

        $scope.reinitialize = function() {
            $scope.data.notifications = "";
            resetReloadTimeout();

            if ($location.$$path === "/tab/nearby-stops-and-routes") {
                getNearbyStopsAndRoutesGPS();
            } else {
                getNearbyStopsAndRoutes($scope.lat, $scope.lon);
            }

            tick();
            $scope.$broadcast('scroll.refreshComplete');
        };

        /**
         * once a line comes into view check if that stop is in the array to query for. If not, add it.
         * params are passed in via angular-inview
         * @param index
         * @param inview
         * @param inviewpart
         * @param event
         * @returns {boolean}
         */
        $scope.lineInView = function(index, inview, inviewpart, event) {
            if (inview === true) {
                var stopInArray = stopsInTimeout.some(function(stop) {
                    return stop === event.inViewTarget.id;
                });
                if (!stopInArray) {
                    stopsInTimeout.push(event.inViewTarget.id);
                    tick();
                }
            }

            return false;
        };

        /**
         *
         * the meat of the controller
         * queries for data on each stop in the stopsInTimeout array
         * runs on when stops are added to timeouts, as well as on refresh
         */
        var tick = function() {
            var arrivals = {};
            var alerts = {};
            var promises = [];
            angular.forEach(stopsInTimeout, function(stop) {
                // add the stop to the list of promises to query below, building an object along the way
                promises.push(
                    AtStopService.getBuses(stop).then(function(results) {
                        if (!angular.equals({}, results.arriving)) {
                            arrivals[stop] = results.arriving;
                        }
                        if (!angular.equals({}, results.alerts)) {
                            alerts[stop] = results.alerts;
                        }
                    })
                );
            });
            
            $q.all(promises).then(function() {
                //loop through stops adding arrival info if there is some
                //There is probably a better way to do this, I would like to limit piecemeal updates to $scope
                angular.forEach($scope.data.stops, function(s) {
                    s.arriving = arrivals[s.id];
                    s.alerts = alerts[s.id];
                    s.loaded = true;
                    s.showAlerts = false;
                });
            });
            //avoid apply() if it is already active.
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        /**
         * Returns nearby stops from the GeolocationService
         * @param lat
         * @param lon
         * @param showCurrLocation boolean on whether to show current location
         */
        var getNearbyStopsAndRoutes = function(lat, lon, showCurrLocation) {
            if (showCurrLocation === undefined) {
                showCurrLocation = true; 
            }

            GeolocationService.getStops(lat, lon).then(function(results) {
                if (!angular.isUndefined(results) && results !== null && results.length > 0) {

                    //reset the list of stops we're interested in.
                    stopsInTimeout = [];

                    angular.forEach(results, function(stop) {
                        stop['dist'] = MapService.getDistanceInM(lat, lon, stop['lat'], stop['lon']);
                    });
                    $scope.data.stops = results;

                    if (showCurrLocation) {
                        $scope.data.stops.push({
                            id: "current_location",
                            lat: lat,
                            lon: lon
                        });
                    }

                    showNearbyStops();
                    $scope.data.notifications = "";
                    $timeout(function() {
                        $ionicScrollDelegate.scrollTop();
                    });
                } else {
                    $scope.data.notifications = "No nearby stops found.";
                }
            });
        };
        /**
         * activates location services and passes this location on to the getNearbyStopsAndRoutes function
         */

        var getNearbyStopsAndRoutesGPS = function() {

            $scope.loading = true;

            var timeoutVal = 10000;
            var fired = false;
            var timeout = $timeout(function() {
                $scope.data.notifications = "Pull to refresh.";
                $scope.loading = false;
                if ($scope.left !== true) {
                    var popup = $ionicPopup.alert({
                        content: "Cannot access your position. Check if location services are enabled."
                    });
                    $timeout(function() {
                        popup.close();
                    }, 3000);
                } else {
                    $log.debug("You left the current page! Destroying ...");
                }
            }, timeoutVal + 5000);

            // Unfortunately, this function is asynchronous. So, we cannot cancel it.
            // However, we have a trick for this. DO NOT show the popup if a user left the page.
            $cordovaGeolocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: timeoutVal,
                    maximumAge: 0
                }).then(
                    function(position) {
                        $log.debug(position);
                        $scope.loading = false;
                        $timeout.cancel(timeout);
                        $scope.data.notifications = "";
                        $scope.data.val = true;
                        getNearbyStopsAndRoutes(position.coords.latitude, position.coords.longitude);
                    },
                    function(error) {
                        $log.debug(error);
                        $scope.data.notifications = "Pull to refresh.";
                        $ionicLoading.hide();
                        $timeout.cancel(timeout);
                        if ($scope.left !== true) {
                            var popup = $ionicPopup.alert({
                                content: "Cannot access your position. Check if location is enabled."
                            });
                            $timeout(function() {
                                popup.close();
                            }, 3000);
                        } else {
                            $log.debug("You left the current page! Destroying ...");
                        }
                    }
                )
                .finally(function() {
                    $scope.data.notifications = "Pull to refresh.";
                    $scope.loading = false;
                    $timeout.cancel(timeout);
                });
        };
        /**
         * draws nearby stops already in $scope
         */
        var showNearbyStops = function() {
            $scope.markers = {};
            $scope.paths = {};
            leafletData.getMap().then(function (map) {
                map.closePopup();
            });

            var stops = [];
            angular.forEach($scope.data.stops, function (v, k) {
                if (v["id"] != "current_location") {
                    stops['s' + k] = {
                        lat: v["lat"],
                        lng: v["lon"],
                        stopId: v["id"],
                        stopName: $filter('encodeStopName')(v['name']),
                        icon: {
                            iconUrl: 'img/stop_icons/stop.svg',
                            iconSize: [20, 20]
                        },
                        focus: false
                    };
                } else {
                    //console.log(v["lat"], v["lon"]);
                    stops['currentLocation'] = {
                        lat: parseFloat(v["lat"]),
                        lng: parseFloat(v["lon"]),
                        stopId: v["currentLocation"],
                        stopName: "Current Location",
                        icon: {
                            iconUrl: 'img/stop_icons/stop-blue.svg',
                            iconSize: [20, 20]
                        },
                        focus: false,
                        clickable: false
                    };
                }
            });

            $scope.markers = stops;
            leafletData.getMap().then(function (map) {

                var zoomPromise= getCurrentZoom().then(function(currentZoom){
                     // zoom to default if user is far out.
                    var newZoom = (currentZoom <= defaultZoom || angular.isUndefined(currentZoom)) ? defaultZoom : currentZoom;

                    // but don't refocus if user is zoomed too far in. 
                    if (newZoom < 17){
                        map.setView($scope.markers['s0'], newZoom, {
                            animate: true
                    });
                    }
                });

            });

        };

        /**
         * initialize map
         */
        var map = function() {
            //var mapCenter = {};

            angular.extend($scope, {
                events: {
                    markers: {
                        enable: ['click', 'dragend', 'zoomstart', 'zoomend'],
                        logic: 'emit'
                    }
                },
                center: $scope.center,
                defaults: {
                    tileLayer: MAP_TILES,
                    tileLayerOptions: {
                        attribution: $filter('hrefToJS')(MAP_ATTRS)
                    },
                    scrollWheelZoom: true,
                    key: MAPBOX_KEY,
                    zoomControl: false
                },
                options: {
                    reuseTiles: true,
                },
                markers: {},
                paths: {}
            });

            leafletData.getMap().then(function(map) {
                map.attributionControl.setPrefix('');
            });
        };

        /**
         * when passed in a route, get and display polylines for that route
         * @param route
         */
        $scope.showRoutePolylines = function(route) {
            $scope.paths = {};
            MapService.getRoutePolylines(route).then(function(res) {
                $scope.paths = res;
            });
        };

        var showBusMarkers = function(route) {
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            MapService.getBusMarkers(route).then(function(res) {
                angular.extend($scope.markers, res);
            });
        };

        /**
         * refresh specific route
         * @param route
         * @param stop
         * @param lat
         * @param lon
         * @param name
         */
        $scope.showCurrentStop = function(route, stop, lat, lon, name) {

            $scope.data.inRouteView = true;
            $interval.cancel($scope.reloadTimeout);
            drawCurrentStop(route, stop, lat, lon, name);

            //timeout for refreshing information associated with this route at this stop
            $scope.reloadTimeout = $interval(function() {
                drawCurrentStop(route, stop, lat, lon, name);
            }, 35000);
        };

        /**
         * show current stop on the map
         * @param route
         * @param stop
         * @param lat
         * @param lon
         * @param name
         */
        var drawCurrentStop = function(route, stop, lat, lon, name) {
            $scope.markers = {};
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            $scope.markers['currentStop'] = {
                lat: lat,
                lng: lon,
                icon: {
                    iconUrl: 'img/stop_icons/stop-blue.svg',
                    iconSize: [20, 20]
                },
                focus: false,
                stopId: stop,
                stopName: $filter('encodeStopName')(name)
            };

                leafletData.getMap().then(function (map) {
                    map.closePopup();
                    map.setView($scope.markers['currentStop'], 13, {
                        animate: true
                    });
                });
            showBusMarkers(route);
        };

        /**
         * when user clicks on a stop on the map, scroll to that stop on the list
         * @param location index to slide to
         */
        var slideTo = function(location) {
            location = $location.hash(location);
            $timeout(function() {
                $ionicScrollDelegate.anchorScroll("#" + location);
            });
        };

        /**
        * returns the current zoom via a promise
        * First, tries to get Leaflet zoom level
        * else, revert to default zoom 
        */
        var getCurrentZoom = function(args) {

            var zoomDefer = $q.defer();
            var zoom;

            leafletData.getMap().then(function (map) {
                    mapZoom = map._zoom;

                    if (isInt(mapZoom)){
                        zoom = mapZoom;
                    }
                    else {
                        $log.debug('using default zoom');
                        zoom = defaultZoom;
                    }
                    zoomDefer.resolve(zoom);
            });
            return zoomDefer.promise;
        };
        /**
         * called in certain cases when moving map.
         * @param event leaflet event
         * @param args leaflet args
         */
        var mapMoveAndReload = function(event, args){
            // angular-leaflet center bound to scope lags the actual map center for some reason... D'oh!
            //console.log('angular-leaflet center', $scope.center.lat, $scope.center.lng);

            // don't bother if user has chosen a route to view
            if (!$scope.data.inRouteView) {

                leafletData.getMap().then(function (map) {
                    // $log.debug('moving to', map.getCenter().lat, map.getCenter().lng);
                    var lat = map.getCenter().lat;
                    var lng = map.getCenter().lng;

                    debounce(getNearbyStopsAndRoutes(lat, lng, false), 500);
                    $scope.lat = lat;
                    $scope.lon = lng;

                });
            }
        };

        /**
         * when the map is dragged, move and reload stops
         */
        $scope.$on('leafletDirectiveMap.dragend', function(event, args){
            var zoomPromise= getCurrentZoom().then(function(z){
                if (z >= defaultZoom) {
                    mapMoveAndReload(event, args);
               }
            });
        });
        /**
         * when zooming in past a certain level, move and reload stops
         */
        $scope.$on('leafletDirectiveMap.zoomend', function(event, args){

            var zoomPromise= getCurrentZoom().then(function(zoom){
                if (zoom >= defaultZoom  && lastZoom < zoom ){
                    mapMoveAndReload(event, args);
                }
                // else {
                //     $scope.data.notifications = "Zoom in to see stops"
                // }
            });
        });

        /**
         * before zooming, cache the zoom level
         */
        $scope.$on('leafletDirectiveMap.zoomstart', function(event, args){
            var zoomPromise= getCurrentZoom().then(function(z){
                lastZoom = z;
            });
        });

        /**
         * on map marker click event, display popup
         * if a stop, scroll to that stop on the list (which then displays arrivals for said stop)
         */
        $scope.$on('leafletDirectiveMarker.click', function(event, args) {
            var object = $scope.markers[args.modelName];
            var content = '';
            var latlng = [];
            var popup = L.popup();
            if ($filter('isUndefinedOrEmpty')(object.stopName)) {
                content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>";
            } else {
                if (object.stopName === "Current Location") {
                    content = "<p>Current Location</p>";
                } else {
                    slideTo(object.stopId);
                    content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/' + $scope.url + '/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">See upcoming buses</a>';
                }
            }

            latLng = [object.lat, object.lng];
            popup.setContent(content).setLatLng(latLng);

            leafletData.getMap().then(function(map) {
                popup.openOn(map);
            });
        });
        /**
         *  destroy the controller.
         *  fired when leaving the view.
         */
        $scope.$on('$destroy', function() {
            $scope.left = true;
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });


        var isInt = function(value) {
            if (isNaN(value)) {
                return false;
            }
            var x = parseFloat(value);
            return (x | 0) === x;
        };

        /**
         * init function
         */
        var init = (function() {
            map();
            if ($location.$$path === "/tab/nearby-stops-and-routes") {
                $scope.data.title = "Nearby Stops";
                $scope.url = "atstop-gps";
                getNearbyStopsAndRoutesGPS();
            } else {
                $scope.data.title = $stateParams.address;
                getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
            }

            tick();
            setReloadTimeout();
        })();
    }
]);
