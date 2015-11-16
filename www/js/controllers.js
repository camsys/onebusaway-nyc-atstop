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

angular.module('atstop.controllers', ['configuration', 'filters'])

/**
 * @ngdoc controller
 * @description
 * Controller that makes tabs go to the root (cleaning Tab Histories)
 */
.controller('GoHomeCtrl', function($scope, $rootScope, $state, $ionicHistory) {
    var clearHistory = function() {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
    };

    $scope.goHomeTab = function() {
        clearHistory();
        $state.go('tab.home');
    };

    $scope.goFavsTab = function() {
        clearHistory();
        $state.go('tab.favorites');
    };
})

/**
* @ngdoc controller
 * @description
 * Controller that used for searching using autocomplete API.
 */
.controller('SearchCtrl', ['$log','$rootScope', '$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'SearchesService', 'SHOW_BRANDING', '$ionicTabsDelegate',
    function($log, $rootScope, $scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, SearchesService, SHOW_BRANDING,  $ionicTabsDelegate) {

        $scope.go = function(path) {
            $location.path(path);
        };

        $scope.data = {
            "results": [],
            "searchKey": '',
            "notifications": '',
            exampleRoutes: [
                "Bx1", "M15-SBS", "Q58"
            ],
            exampleStops: [
                "200460", "308215", "502030"
            ],
            exampleIntersections: [
                "Main Street & Kissena Bl"
            ],
            "searches": [],
            "showSearches": true,
            "showDefaultTips": true,
            "showBranding": SHOW_BRANDING
        };

        /**
        * @function autocomplete
        * @
        **/

        $scope.autocomplete = function() {
            if ($scope.data.searchKey.length > 0) {
                SearchService.autocomplete($scope.data.searchKey).then(
                    function(matches) {
                        if (!angular.isUndefined(matches) && matches !== null && matches.length > 0) {
                            $scope.data.results = matches;
                            $scope.data.notifications = "";
                        } else {
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                        }
                    }
                );
            } else {
                $scope.data.results = [];
                $scope.data.notifications = "";
            }
        };

        // set no sched svc message.
        /**
         * logic for settng no scheduled service message based on response of type route.
         * @param  {Object} matches [description]
         */
        var handleRouteSearch = function(matches) {
            // console.log(Object.keys(matches.directions).length);
              $log.debug(matches);
            if (Object.keys(matches.directions).length > 1) {
                // if one direction with no service-- handle on route/stop page.
                if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
                    $log.debug('service in both directions');
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else if (!matches.directions[0].hasUpcomingScheduledService && !matches.directions[1].hasUpcomingScheduledService) {
                    $log.debug('no service in both directions');
                    noSchedService(matches.shortName);
                } else {

                }
            } else {
                if (matches.directions[0].hasUpcomingScheduledService) {
                    $log.debug('1direction with service');
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else {
                    $log.debug('1direction with no service');
                    noSchedService(matches.shortName);
                }
            }
        };

        var noSchedService = function(routeDirection) {
            $scope.data.notifications = "There is no scheduled service on this route at this time.";
        };
/**
 * enter searches if only one autocomplete result is returned.
 * @param  {String} term [description]

 */
        $scope.searchAndGo = function(term) {
            // for search page, enter searches if only one autocomplete result is returned.
            //
            if ($scope.data.results.length === 1) {
                term = $scope.data.results[0];
            }

            SearchService.search(term).then(
                function(matches) {
                    SearchesService.add(matches);
                    switch (matches.type) {
                        case "RouteResult":
                            handleRouteSearch(matches);
                            break;
                        case "StopResult":
                            $scope.go("/tab/atstop/" + matches.id + '/' + $filter('encodeStopName')(matches.name));
                            break;
                        case "GeocodeResult":
                            $scope.go("/tab/geolocation/" + matches.latitude + '/' + matches.longitude + '/' + matches.formattedAddress);
                            break;
                        default:
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                            //console.log("undefined type");
                            $log.debug("undefined type");
                            break;
                    }
                }
            );
        };

        /**
         * clear previous searches array
         */
        $scope.clearSearches = function() {
            SearchesService.clear();
            $scope.data.searches = [];
            $scope.data.showSearches = false;
            $scope.data.showDefaultTips = true;
        };

        /**
         * Initialize and grab previously stored searches.
         */
        var init = (function() {

            SearchesService.fetchAll().then(function(results) {
                if (results.length > 0) {
                    $scope.data.searches = results;
                    $scope.data.showSearches = true;
                    $scope.data.showDefaultTips = false;
                } else {
                    $scope.data.searches = [];
                    $scope.data.showSearches = false;
                }
            });
        })();
    }
])

/**
 * Controller that used for showing favorites.
 */
.controller('FavoritesCtrl', ['$log', '$scope', '$ionicLoading', 'FavoritesService', '$q', 'SHOW_BRANDING',
    function($log, $scope, $ionicLoading, FavoritesService, $q, SHOW_BRANDING) {
        $scope.data = {
            "loaded": false,
            "notifications": '',
            "showBranding": SHOW_BRANDING
        };

        $scope.remove = function(id) {
            console.log(id);
            $log.debug(id);
            FavoritesService.remove(id);
            get();
        };

        var get = function() {
            $scope.data.favoriteRoutes = [];
            $scope.data.favoriteStops = [];
            $scope.data.favoriteRouteMaps = [];
            var favoritesDefer = $q.defer();

            FavoritesService.get().then(function(results) {
                if (Object.keys(results).length === 0) {
                    $scope.data.notifications = "You have not added any favorites. You can add favorites by clicking the star icon on routes, favorites, or maps.";
                } else if (!angular.isUndefined(results) && results !== null) {
                    angular.forEach(results, function(value) {
                        if (value.type === 'R') {
                            $scope.data.favoriteRoutes.push(value);
                        } else if (value.type === 'RM') {
                            $scope.data.favoriteRouteMaps.push(value);
                        } else {
                            $scope.data.favoriteStops.push(value);
                        }
                    });
                    $scope.data.notifications = "";
                }
                favoritesDefer.resolve();
            });

            favoritesDefer.promise.then(function() {
                $scope.data.loaded = true;
            });
        };

        var init = (function() {
            get();
        })();
    }
])

/**
 * @ngdoc controller
 * @description
 * Controller used for showing upcoming buses for specific stop.
 */
.controller('AtStopCtrl', ['$log', '$ionicScrollDelegate', '$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService', '$interval', '$location',
    function($log, $ionicScrollDelegate, $scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService, $interval, $location) {
        $scope.data = {
            "link": "map",
            "alerts": "",
            "responseTime": "",
            "loaded": false,
            "favClass": "",
            "results": [],
            "stopName": $stateParams.stopName,
            "notifications": '',
            "alertsHide": false,
            "alertsToggle": false,
            "stopId": $stateParams.stopId,
            "tips": "Pull down for instant refresh."
        };

        $scope.toggleFavorites = function() {
            if (FavoritesService.inFavorites($scope.data.stopId)) {
                FavoritesService.remove($scope.data.stopId);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add($scope.data.stopId, $scope.data.stopName);
                $scope.data.favClass = "button-energized";
            }
        };

        var getBuses = function() {
            var busesDefer = $q.defer();
            AtStopService.getBuses($scope.data.stopId).then(function(results) {
                if (!angular.equals({}, results.arriving)) {
                    $scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
                    $scope.data.results = results.arriving;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.results = "";
                    $scope.data.notifications = "We are not tracking any buses to this stop at this time. Check back later for an update.";
                }

                if (results.alerts.length > 0) {
                    $scope.data.alertsHide = true;
                    $scope.data.alerts = results.alerts;
                    $log.debug($scope.data.alerts);
                } else {
                    $scope.data.alertsHide = false;
                }
                busesDefer.resolve();
            });

            busesDefer.promise.then(function() {
                $scope.data.loaded = true;
            });
        };

        $scope.refresh = function() {
            // restart 'refresh' timer
            $interval.cancel($scope.reloadTimeout);
            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.toggleAlerts = function() {
            $scope.data.alertsToggle = !$scope.data.alertsToggle;
            $ionicScrollDelegate.resize();
        };

        $scope.$on('$destroy', function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        var init = (function() {
            if ($location.$$path.indexOf("atstop-favorites") > -1) {
                $scope.data.link = "map-favorites";
            } else if ($location.$$path.indexOf("atstop-gps") > -1) {
                $scope.data.link = "map-gps";
            }

            if (FavoritesService.inFavorites($scope.data.stopId)) {
                $scope.data.favClass = "button-energized";
            } else {
                $scope.data.favClass = "";
            }

            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
        })();
    }
])

/**
 * @ngdoc controller
 * @description
 *  Route Stop List Controller
 * Controller that used for showing the routes and stops of routes.
 */
.controller('RouteCtrl', ['$log', '$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading', '$ionicScrollDelegate', 'FavoritesService',
    function($log, $scope, RouteService, $stateParams, $location, $q, $ionicLoading, $ionicScrollDelegate, FavoritesService) {

        $scope.data = {
            "loaded": false,
            "routeName": $stateParams.routeName,
            "favClass": "",
            "direction": [],
            "directionName": "",
            "direction_": [],
            "directionName_": "",
            "mapUrl": "map",
            "atStopUrl": "atstop",
            "routeId": $stateParams.routeId,
            "groups": []
        };

        var oneDirection = false;
        // groups of stops by direction in order to enable accordeon list
        $scope.data.groups = [];
        $scope.data.groups[0] = {
            name: "",
            items: [],
            shown: false
        };

        $scope.data.groups[1] = {
            name: "",
            items: [],
            shown: false
        };

        $scope.toggleFavorites = function() {
            //type-R (for route) FTW
            var fav = [$stateParams.routeId, $stateParams.routeName, 'R'];
            if (FavoritesService.inFavorites(fav[0])) {
                FavoritesService.remove(fav[0]);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add(fav[0], fav[1], fav[2]);
                $scope.data.favClass = "button-energized";
            }
        };

        $scope.toggleGroup = function(group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollTop();
        };

        $scope.isGroupShown = function(group) {
            return $scope.shownGroup === group;
        };

        var getDirectionsAndStops = function() {
            var directionsDefer = $q.defer();
            var stopsDefer = $q.defer();

            RouteService.getDirections($stateParams.routeId).then(function(results) {
                if (Object.keys(results).length > 1) {
                    oneDirection = false;
                    angular.forEach(results, function(val, key) {
                        if (val.directionId === 0) {
                            $scope.data.directionName = val.destination;
                            $scope.data.groups[0].name = val.destination;
                        }

                        if (val.directionId === 1) {
                            $scope.data.directionName_ = val.destination;
                            $scope.data.groups[1].name = val.destination;
                        }
                    });
                } else {
                    // with one direction, set destination and remove second group.
                    oneDirection = true;
                    $scope.data.directionName = results[0].destination;
                    $scope.data.groups[0].name = results[0].destination;
                    $scope.data.groups.splice(1);
                    $scope.toggleGroup($scope.data.groups[0]);
                }
                directionsDefer.resolve();
            });

            directionsDefer.promise.then(function() {
                RouteService.getStops($stateParams.routeId, "0").then(function(results) {
                    $scope.data.direction = results;
                    $scope.data.groups[0].items = results;
                    if (oneDirection === false) {
                        //console.log("1D 4eva!");
                        $log.debug("1D 4eva!");
                        RouteService.getStops($stateParams.routeId, "1").then(function(results2) {
                            $scope.data.direction_ = results2;
                            $scope.data.groups[1].items = results2;
                        });
                    }
                    stopsDefer.resolve();
                });
            });

            $q.all([directionsDefer.promise.then(function() {
                // console.log("resolved");
                $log.debug("resolved");
            }), stopsDefer.promise.then(function() {
                // console.log("resolved");
                $log.debug("resolved");
            })]).then(function() {
                $scope.data.loaded = true;
            });
        };

        var init = (function() {
            if ($location.$$path.indexOf("favorites") > -1) {
                $scope.data.mapUrl = "map-favorites";
                $scope.data.atStopUrl = "atstop-favorites";
            }

            var fav = [$stateParams.routeId, $stateParams.routeName, 'R'];
            if (FavoritesService.inFavorites($stateParams.routeId)) {
                $scope.data.favClass = "button-energized";
            }

            getDirectionsAndStops();
        })();
    }
])

/**
 * @ngdoc controller
 * @description
 * Controller that used for showing About Information from config.js
 * Also has morphed into a settings page
 */
.controller('AboutCtrl', ['$log', '$cordovaAppVersion', '$rootScope', '$scope', '$ionicScrollDelegate', 'PRIV_POLICY_TEXT', 'SHOW_BRANDING', 'BRAND_ABOUT_TEXT',
    function($log, $cordovaAppVersion, $rootScope, $scope, $ionicScrollDelegate, PRIV_POLICY_TEXT, SHOW_BRANDING, BRAND_ABOUT_TEXT) {

        $scope.data = {
            version: "1.1.3",
            showBranding: SHOW_BRANDING,
            hideText: true,
            brandAboutText: BRAND_ABOUT_TEXT,
            privText: PRIV_POLICY_TEXT
        };

        $scope.toggleText = function() {
            // resize the content since the Privacy Policy text is too big
            $ionicScrollDelegate.resize();
            $scope.data.hideText = !$scope.data.hideText;
        };

        var init = (function() {
            // get app version
            // Disabled because this causes unpredictable behaviour in iOS9
/*            document.addEventListener("deviceready", function () {
                $cordovaAppVersion.getVersionNumber().then(function(version) {
                    $scope.data.version = version;
                });
            });*/
        })();
    }
])

/**
 * @ngdoc controller
 * @description
 * Controller used for full routes on Maps
 */
.controller('MapCtrl', ['$log', 'MapService', 'FavoritesService', '$scope', '$location', '$stateParams', '$timeout', 'leafletData', '$filter', '$q', '$interval', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
    function($log, MapService, FavoritesService, $scope, $location, $stateParams, $timeout, leafletData, $filter, $q, $interval, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
        $scope.markers = {};
        $scope.paths = {};
        $scope.url = "atstop";
        $scope.tips = "Map refreshes automatically";
        $scope.data = {
            favClass: ""
        };

        $scope.toggleFavorites = function() {
            //hack to have Favorite RouteMap ID and Favorite Route ID not collide.
            //routeId+MAP is the key, but inside the favorite object the id just routeId (see FavoritesService).
            var id = $stateParams.routeId.concat('MAP');
            if (FavoritesService.inFavorites(id)) {
                FavoritesService.remove(id);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add(id, $stateParams.routeName, 'RM');
                $scope.data.favClass = "button-energized";
            }
        };

        $scope.refresh = function() {
            //earlier versions of angular-leaflet did not support binding on popup text.
            // TODO: check if this no longer is the case
            leafletData.getMap().then(function(map) {
                map.closePopup();
            });

            $interval.cancel($scope.reloadTimeout);
            $scope.reloadTimeout = $interval($scope.refresh, 35000);
            showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);
        };

        var showRoutePolylines = function(route) {
            MapService.getRoutePolylines(route).then(function(res) {
                $scope.paths = res;

                // fit to polylines
                leafletData.getMap().then(function(map) {
                    map.fitBounds([
                        [$scope.paths['p0']['latlngs'][0]['lat'], $scope.paths['p0']['latlngs'][0]['lng']],
                        [$scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lat'],
                            $scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lng']]
                    ]);
                });
            });
        };

        var showBusAndStopMarkers = function(route, stop) {
            //start countdown on markers refresh
            $scope.$broadcast('timer-set-countdown', 35);
            $scope.$broadcast('timer-start');
            $scope.markers = {};

            MapService.getBusMarkers(route).then(function(res) {
                angular.extend($scope.markers, res);
            });
            MapService.getStopMarkers(route, stop).then(function(res) {
                angular.extend($scope.markers, res);

                //set zoom around current stop
                angular.forEach($scope.markers, function(val, key) {
                    if (val.layer == 'currentStop') {
                        leafletData.getMap().then(function(map) {
                            map.setView(val, 15, {
                                animate: true
                            });
                        });
                    }
                });
            });
        };

        // map
        var map = function() {
            angular.extend($scope, {
                events: {
                    markers: {
                        enable: ['click'],
                        logic: 'emit'
                    }
                },
                center: {},
                defaults: {
                    scrollWheelZoom: true
                },
                markers: {},
                paths: {},
                layers: {
                    baselayers: {
                        xyz: {
                            url: MAP_TILES,
                            type: 'xyz',
                            name: 'base',
                            layerOptions: {
                                attribution: $filter('hrefToJS')(MAP_ATTRS)
                            },
                            options: {
                                reuseTiles: true,
                                access_token: MAPBOX_KEY
                            }
                        }
                    },
                    overlays: {
                        stops: {
                            type: 'group',
                            name: 'stops',
                            visible: false
                        },
                        currentStop: {
                            type: 'group',
                            name: 'currentStop',
                            visible: true
                        }
                    }
                }
            });

            leafletData.getMap().then(function(map) {
                //leaflet attrib not required
                map.attributionControl.setPrefix('');
            });

        };

        // map click event
        $scope.$on('leafletDirectiveMarker.main.click', function(event, args) {
            var object = $scope.markers[args.modelName];
            var content = '';
            var latLng = [];
            var popup = L.popup();

            // if user clicked on a marker that's not a stop, it's a vehicle
            if ($filter('isUndefinedOrEmpty')(object.stopName)) {
                content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>";
                latLng = [object.lat, object.lng];
                popup.setContent(content).setLatLng(latLng);
            } else {
                content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/' + $scope.url + '/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">See upcoming buses</a>';
                latLng = [object.lat, object.lng];
                popup.setContent(content).setLatLng(latLng);
            }

            leafletData.getMap().then(function(map) {
                popup.openOn(map);
            });
        });

        var toggleLayer = function(type) {
            $scope.layers.overlays[type].visible = !$scope.layers.overlays[type].visible;
        };

        var isLayerVisible = function(type) {
            return $scope.layers.overlays[type].visible;
        };

        $scope.$on('leafletDirectiveMap.zoomend', function(event, args) {
            if (args.leafletEvent.target._zoom > 14 && !isLayerVisible('stops')) {
                toggleLayer('stops');
            } else if (args.leafletEvent.target._zoom <= 14 && isLayerVisible('stops')) {
                toggleLayer('stops');
            }
        });

        $scope.$on('$destroy', function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        var init = (function() {
            if ($location.$$path.indexOf("map-favorites") > -1) {
                $scope.url = "atstop-favorites";
            } else if ($location.$$path.indexOf("map-gps") > -1) {
                $scope.url = "atstop-gps";
            }

            if (FavoritesService.inFavorites($stateParams.routeId.concat('MAP'))) {
                $scope.data.favClass = "button-energized";
            }

            map();
            showRoutePolylines($stateParams.routeId);
            showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);

            if ($scope.center.zoom > 14) {
                toggleLayer('stops');
            }

            $scope.reloadTimeout = $interval($scope.refresh, 35000);
        })();
    }
])


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
                    tick() }, 30000
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
        }

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
            if (inview == true) {
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
         */
        var getNearbyStopsAndRoutes = function(lat, lon, showCurrLocation) {
            if (showCurrLocation === undefined) { showCurrLocation = true };

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
                        $scope.loading = false;
                        $timeout.cancel(timeout);
                        $scope.data.notifications = "";
                        $scope.data.val = true;
                        getNearbyStopsAndRoutes(position.coords.latitude, position.coords.longitude);
                    },
                    function(error) {
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

            })

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
                    mapZoom = map._zoom

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
        }
        /**
         * called in certain cases when moving map.
         * @param event leaflet event
         * @param args leaflet args
         */
        var mapMoveAndReload = function(event, args){
            // angular-leaflet center bound to scope lags the map center for some reason... D'oh!
            //console.log('angular-leaflet center', $scope.center.lat, $scope.center.lng);

            // don't bother if user has chosen a route to view
            if (!$scope.data.inRouteView) {
                $scope.eventDetected = "Drag";

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
