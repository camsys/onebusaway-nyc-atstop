angular.module('starter.controllers', ['configuration', 'filters'])

.controller('MapCtrl', ['$scope', '$location', '$stateParams', 'RouteService',
        'VehicleMonitoringService', '$ionicLoading', '$timeout', 'leafletBoundsHelpers', 'leafletData', 'StopcodeService', 'GeolocationService',
        function ($scope, $location, $stateParams, RouteService, VehicleMonitoringService, $ionicLoading, $timeout, leafletBoundsHelpers, leafletData, StopcodeService, GeolocationService, MAPBOX_KEY) {
        $scope.val = true;
        $scope.paths = {};
        $scope.markers = {};

        $scope.drawPolylines = function (route) {
            RouteService.getPolylines(route).then(function (results) {
                var stopsAndRoute = {};

                angular.forEach(results.stops, function (val, key) {

                    if (val.id == $stateParams.stopId) {
                        stopsAndRoute[val.id] = {
                            message: '<p><strong>' + val.name + '</strong></p>',
                            type: "circleMarker",
                            color: '#2166ac',
                            opacity: 0.75,
                            fillColor: '#2166ac',
                            fillOpacity: 1,
                            weight: 30,
                            radius: 8,
                            name: val.name,
                            id: val.id,
                            routeIds: val.routeIds,
                            latlngs: {
                                lat: val.lat,
                                lng: val.lon
                            },
                            clickable: true
                        }
                    } else {
                        stopsAndRoute[val.id] = {
                            message: '<p><strong>' + val.name + '</strong></p>',
                            type: "circleMarker",
                            color: '#ffffff',
                            opacity: 1,
                            fillColor: '#cb181d',
                            fillOpacity: 1,
                            weight: 1,
                            radius: 8,
                            name: val.name,
                            id: val.id,
                            routeIds: val.routeIds,
                            latlngs: {
                                lat: val.lat,
                                lng: val.lon
                            },
                            clickable: true
                        }
                    }
                });

                angular.forEach(results.polylines, function (val, key) {
                    stopsAndRoute[key] = {
                        color: '#fb6a4a',
                        weight: 3,
                        latlngs: [],
                        clickable: false
                    };

                    angular.forEach(L.Polyline.fromEncoded(val).getLatLngs(), function (v, k) {
                        stopsAndRoute[key].latlngs.push({
                            lat: v.lat,
                            lng: v.lng
                        });
                    });
                });

                $scope.paths = stopsAndRoute;

                leafletData.getMap().then(function (map) {
                    map.fitBounds([
                            [$scope.paths['0']['latlngs'][0]['lat'], $scope.paths['0']['latlngs'][0]['lng']],
                            [$scope.paths['0']['latlngs'][$scope.paths['0']['latlngs'].length - 1]['lat'], $scope.paths['0']['latlngs'][$scope.paths['0']['latlngs'].length - 1]['lng']]]);
                });
            })
        };

        $scope.drawBuses = function (route) {
            $scope.val = true;
            $timeout(function () {
                $scope.val = false;
            }, 5000);

            $scope.markers = {};
            VehicleMonitoringService.getLocations(route).then(function (results) {
                var buses = {};

                function round5(x) {
                    return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
                }

                angular.forEach(results, function (val, key) {
                    angle = round5(val.angle);
                    if (angle == 360) {
                        angle = 0;
                    };
                    buses[val.vehicleId] = {
                        lat: val.latitude,
                        lng: val.longitude,
                        message: "Vehicle " + val.vehicleId + "<br> <h4>" + val.destination + "</h4>" + "<br> <h5>Next Stop: " + val.stopPointName + "</h5>",
                        icon: {
                            iconUrl: 'img/bus_icons/vehicle-' + angle + '.png',
                            iconSize: [51, 51]
                        },
                        focus: false
                    }
                });

                $scope.markers = buses;
            });
        };

        $scope.refresh = function () {
            $scope.drawBuses($stateParams.routeId);
        };

        $scope.map = function () {

            $scope.$on('leafletDirectiveMap.click', function (event, args) {
                var latlng = args.leafletEvent.latlng;
                console.log('Lat: ' + latlng.lat + '<br>Lng: ' + latlng.lng);
            });

            $scope.$on('leafletDirectiveMarker.click', function (event, args) {
                console.log('marker clicked: ' + args.markerName);
            });

            $scope.$on('leafletDirectivePath.click', function (event, args) {
                console.log(args);
            });

            angular.extend($scope, {
                events: {
                    map: {
                        enable: ['click', 'drag', 'blur', 'touchstart'],
                        logic: 'emit'
                    },
                    markers: {
                        enable: ['click'],
                        logic: 'emit'
                    },
                    paths: {
                        enable: ['click'],
                        logic: 'emit'
                    }
                },
                center: {},
                defaults: {
                    tileLayer: "http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png",
                    tileLayerOptions: {
                        attribution: 'Map:<a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data:<a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
                    },
                    scrollWheelZoom: false,
                    key: MAPBOX_KEY
                },
                markers: {},
                paths: {}
            });

        };

        $scope.drawNearbyStopsAndRoutes = function (lclLat, lclLon) {
            GeolocationService.getStops(lclLat, lclLon).then(function (results) {
                var stops = {};

                angular.forEach(results, function (val, key) {
                    stops[key] = {
                        message: '<p><strong>' + val.name + '</strong></p>',
                        type: "circleMarker",
                        color: '#ffffff',
                        opacity: 1,
                        fillColor: '#cb181d',
                        fillOpacity: 1,
                        weight: 1,
                        radius: 8,
                        latlngs: {
                            lat: val.lat,
                            lng: val.lon
                        }
                    }
                });

                $scope.paths = stops;

                leafletData.getMap().then(function (map) {
                    map.setView([lclLat, lclLon], 15);
                });
            });
        }

        $scope.init = (function () {
            $scope.map();
            if ($location.$$path.indexOf('/tab/map-nearby') >= 0) {
                // Test
                // $scope.drawNearbyStopsAndRoutes(40.635081, -73.967235);
                $scope.drawNearbyStopsAndRoutes($stateParams.lat, $stateParams.lon);
            } else {
                $scope.drawPolylines($stateParams.routeId);
                $scope.drawBuses($stateParams.routeId);
            }
        })();
}])

.controller('SearchCtrl', ['$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'FavoritesService',

        function ($scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, FavoritesService) {


        $scope.go = function (path) {
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
            "favorites": [],
            "showFavs": false,
            "showTips": true
        };

        $scope.autocomplete = function () {
            SearchService.autocomplete($scope.data.searchKey).then(
                function (matches) {
                    if (!angular.isUndefined(matches) && matches != null && matches.length > 0) {
                        $scope.data.results = matches;
                        $scope.data.notifications = "";
                    } else {
                        $scope.data.results = [];
                        $scope.data.notifications = "No matches";
                    }
                }
            );
        };

        // set no sched svc message.
        $scope.handleRouteSearch = function (matches) {
            if (matches.directions.length > 1) {
                // if one direction with no service-- handle on route/stop page.
                if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                    console.log($scope.data.notifications);
                } else if (!matches.directions[0].hasUpcomingScheduledService && !matches.directions[1].hasUpcomingScheduledService) {
                    $scope.noSchedService(matches.shortName);
                } else {

                }
            } else {
                if (matches.directions[0].hasUpcomingScheduledService) {
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else {
                    $scope.noSchedService(matches.shortName);
                }
            }
        }

        $scope.noSchedService = function (routeDirection) {
            $scope.data.notifications = "There is no scheduled service on this route at this time.";
        }

        $scope.searchAndGo = function (term) {
            SearchService.search(term).then(
                function (matches) {
                    switch (matches.type) {
                    case "RouteResult":
                        $scope.handleRouteSearch(matches);
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
                        console.log("undefined type");
                        break;
                    }
                }
            );
        };

        $scope.get = function () {
            FavoritesService.get().then(function (results) {
                if (!angular.isUndefined(results) && results != null && !$filter('isEmptyObject')(results)) {
                    $scope.data.favorites = results;
                    $scope.data.showFavs = true;
                    $scope.data.showTips = false;
                } else {
                    $scope.data.showFavs = false;
                    $scope.data.showTips = true;
                }
            });
        };

        $scope.init = (function () {
            $scope.get();
        })();
        }])

.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService', '$q',
        function ($scope, $ionicLoading, FavoritesService, $q) {
        $scope.data = {
            "loaded": false,
            "favorites": [],
            "notifications": '',
            "alerts": []
        };

        $scope.remove = function (stopId) {
            FavoritesService.remove(stopId);
            $scope.get();
        };

        $scope.get = function () {
            var getFavorites = FavoritesService.get().then(function (results) {
                if (!angular.isUndefined(results) && results != null) {
                    $scope.data.favorites = results;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "You have no favorites";
                }
            });

            $q.all([getFavorites]).then(function () {
                $scope.data.loaded = true;
            });
        };

        $scope.init = (function () {
            $scope.get();
        })();
        }])

.controller('AtStopCtrl', ['$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService',
        function ($scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService) {
        $scope.data = {
            "alerts": "",
            "responseTime": "",
            "loaded": false,
            "val": true,
            "favClass": "",
            "results": [],
            "stopName": $stateParams.stopName,
            "notifications": '',
            "alertsHide": false,
            "stopId": $stateParams.stopId
        };

        $scope.toggleFavorites = function () {
            if (FavoritesService.inFavorites($stateParams.stopId)) {
                FavoritesService.remove($stateParams.stopId);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add($stateParams.stopId, $stateParams.stopName);
                $scope.data.favClass = "button-energized";
            }
        }

        $scope.handleLayovers = function (results) {
            angular.forEach(results['arriving'], function (val, key) {
                //updates distances to an array of strings so that multi-line entries come out cleaner.
                angular.forEach(val['distances'], function (v, k) {
                    if (v['progress'] == 'prevTrip') {
                        v['distance'] = [v['distance'], "+ Scheduled Layover At Terminal"];
                    } else if (v['progress'] == 'layover,prevTrip') {
                        v['distance'] = [v['distance'], "At terminal. "];

                        if (!$filter('isUndefinedOrEmpty')(v['departsTerminal'])) {
                            v['distance'].push("Scheduled to depart at " + $filter('date')(v['departsTerminal'], 'shortTime'));
                        }
                    } else {
                        v['distance'] = [v['distance']];
                    }
                })

            })

        };

        $scope.getBuses = function () {
            $scope.data.val = true;
            $timeout(function () {
                $scope.data.val = false;
            }, 5000);

            var getBuses = AtStopService.getBuses($stateParams.stopId).then(function (results) {
                if (!angular.isUndefined(results.arriving) && results.arriving != null && !$filter('isEmptyObject')(results.arriving)) {
                    $scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
                    $scope.handleLayovers(results);
                    $scope.updateArrivalTimes(results);
                    $scope.data.results = results.arriving;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "We are not tracking any buses to this stop at this time";
                }

                if (results.alerts.length > 0) {
                    $scope.data.alertsHide = true;
                    $scope.data.alerts = results.alerts;
                } else {
                    $scope.data.alertsHide = false;
                }

            });
            $q.all([getBuses]).then(function () {
                $scope.data.loaded = true;
            });
        };

        $scope.tick = function () {
            $scope.currentTime = moment();
            $scope.updateArrivalTimes($scope.data.results);
            $timeout($scope.tick, 5000);
        }

        $scope.updateArrivalTimes = function (results) {
            angular.forEach(results['arriving'], function (val, key) {
                angular.forEach(val['distances'], function (v, k) {
                    v.arrivingIn = datetimeService.getRemainingTime(v.expectedArrivalTime);
                });
            });
        };

        $scope.refresh = function () {
            $scope.getBuses();
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.init = (function () {
            if (FavoritesService.inFavorites($stateParams.stopId)) {
                $scope.data.favClass = "button-energized";
            } else {
                $scope.data.favClass = "";
            };
            $scope.getBuses();
            $timeout($scope.tick, 5000);
        })();
        }])

.controller('GeolocationCtrl', ['$scope', 'GeolocationService', '$stateParams', '$ionicLoading', '$q',
        function ($scope, GeolocationService, $stateParams, $ionicLoading, $q) {
        $scope.data = {
            "lat": $stateParams.latitude,
            "lon": $stateParams.longitude,
            "loaded": false,
            "routes": [],
            "stops": [],
            "address": $stateParams.address,
            "notifications": ''
        };

        $scope.getRoutesAndStops = function () {
            var getRoutes = GeolocationService.getRoutes($stateParams.latitude, $stateParams.longitude).then(function (results) {
                if (!angular.isUndefined(results) && results != null && results.length > 0) {
                    $scope.data.routes = results;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "No matches";
                }
            });

            var getStops = GeolocationService.getStops($stateParams.latitude, $stateParams.longitude).then(function (results) {
                if (!angular.isUndefined(results) && results != null && results.length > 0) {
                    $scope.data.stops = results;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "No matches";
                }
            });

            $q.all([getRoutes, getStops]).then(function () {
                $scope.data.loaded = true;
            });
        };

        $scope.init = (function () {
            $scope.getRoutesAndStops();
        })();
        }])

.controller('RouteCtrl', ['$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading', '$ionicScrollDelegate',
        function ($scope, RouteService, $stateParams, $location, $q, $ionicLoading, $ionicScrollDelegate) {

        $scope.routeId = $stateParams.routeId;

        $scope.oneDirection = false;
        $scope.groups = [];
        $scope.groups[0] = {
            name: "",
            items: [],
            shown: false
        };

        $scope.groups[1] = {
            name: "",
            items: [],
            shown: false
        };

        /* if given group is the selected group, deselect it
         * else, select the given group
         */
        $scope.toggleGroup = function (group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollTop();
        };
        $scope.isGroupShown = function (group) {
            return $scope.shownGroup === group;
        };

        $scope.data = {
            "loaded": false,
            "routeName": $stateParams.routeName,
            "direction": [],
            "directionName": "",
            "direction_": [],
            "directionName_": ""
        };

        $scope.getDirectionsAndStops = function () {
            var getDirections = RouteService.getDirections($stateParams.routeId).then(function (results) {
                //console.log(Object.keys(results).length);
                //console.log(Object.keys(results).length > 1);
                if (Object.keys(results).length > 1) {
                    $scope.oneDirection = false;
                    angular.forEach(results, function (val, key) {
                        if (val.directionId == 0) {
                            $scope.data.directionName = val.destination;
                            $scope.groups[0].name = val.destination;
                        }

                        if (val.directionId == 1) {
                            $scope.data.directionName_ = val.destination;
                            $scope.groups[1].name = val.destination;
                        }
                    });
                } else {
                    // with one direction, set destination and remove second group.
                    $scope.data.directionName = results[0].destination;
                    $scope.groups[0].name = results[0].destination;
                    $scope.groups.splice(1);
                    $scope.oneDirection = true;
                    $scope.toggleGroup($scope.groups[0]);
                    //console.log($scope.oneDirection);
                }
            });

            var getStops;

            $q.all([getDirections]).then(function () {
                getStops = RouteService.getStops($stateParams.routeId, "0").then(function (results) {
                    $scope.data.direction = results;
                    $scope.groups[0].items = results;
                    //console.log($scope.oneDirection);
                    if ($scope.oneDirection === false) {
                        //console.log("1D 4eva!");
                        RouteService.getStops($stateParams.routeId, "1").then(function (results2) {
                            $scope.data.direction_ = results2;
                            $scope.groups[1].items = results2;
                        });
                    }
                });
            });

            $q.all([getDirections, getStops]).then(function () {
                $scope.data.loaded = true;
            });
        };


        $scope.init = (function () {
            $scope.getDirectionsAndStops();
        })();
        }])

.controller('NearbyStopsAndRoutesCtrl', ['$scope', 'GeolocationService', '$ionicLoading', '$q', '$ionicPopup', '$cordovaGeolocation',
        function ($scope, GeolocationService, $ionicLoading, $q, $ionicPopup, $cordovaGeolocation) {
        $scope.data = {
            "loaded": false,
            "stops": [],
            "routes": [],
            "notifications": "",
            "val": true,
            "lat": '',
            "lon": ''
        };

        $scope.refresh = function () {
            $scope.getNearbyStopsAndRoutes();
        };




        // For testing only
        $scope.getNearbyStopsAndRoutesTest = function () {
            $scope.data.val = false;
            $scope.data.lat = 40.635081;
            $scope.data.lon = -73.967235;

            // To test only. lat: 40.635081, lon: -73.967235 (near Coney Island and 18th Ave, Brooklyn, NY)
            var getStopsTest = GeolocationService.getStops(40.635081, -73.967235).then(function (results) {
                if (!angular.isUndefined(results) && results != null && results.length > 0) {
                    $scope.data.stops = results;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "No matches";
                }
            });


            var getRoutesTest = GeolocationService.getRoutes(40.635081, -73.967235).then(function (results) {
                if (!angular.isUndefined(results) && results != null && results.length > 0) {
                    $scope.data.routes = results;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.notifications = "No matches";
                }
            });

            $q.all(getStopsTest, getRoutesTest).then(function () {
                $scope.data.loaded = true;
            });
        }

        $scope.getNearbyStopsAndRoutes = function () {
            $ionicLoading.show();
            $cordovaGeolocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 5000
            }).then(
                function (position) {
                    $ionicLoading.hide();
                    $scope.data.val = false;
                    $scope.data.lat = position.coords.latitude;
                    $scope.data.lon = position.coords.longitude;

                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    var getStops = GeolocationService.getStops(lat, lon).then(function (results) {
                        if (!angular.isUndefined(results) && results != null && results.length > 0) {
                            $scope.data.stops = results;
                            $scope.data.notifications = "";
                        } else {
                            $scope.data.notifications = "No matches";
                        }
                    });

                    var getRoutes = GeolocationService.getRoutes(lat, lon).then(function (results) {
                        if (!angular.isUndefined(results) && results != null && results.length > 0) {
                            $scope.data.routes = results;
                            $scope.data.notifications = "";
                        } else {
                            $scope.data.notifications = "No matches";
                        }
                    });

                    $q.all(getStops, getRoutes).then(function () {
                        $scope.data.loaded = true;
                    });
                }, function (error) {
                    $ionicLoading.hide();

                    $ionicPopup.alert({
                        title: "Error",
                        content: "Cannot retrieve position information."
                    })
                        .then(function (result) {
                            if (result) {
                                // ionic.Platform.exitApp();
                            }
                        });
                }
            );
        }

        $scope.init = (function () {
            $scope.getNearbyStopsAndRoutes();

            // getNearbyStopsAndRoutesTest() should test the 'getNearbyStopsAndRoutes' function by substituting the location variables with the real ones
            //$scope.getNearbyStopsAndRoutesTest();
        })();
        }]);