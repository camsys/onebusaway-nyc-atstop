angular.module('starter.controllers', [])

.controller('MapCtrl', ['$scope', '$location', '$stateParams', 'RouteService', 'VehicleMonitoringService', '$ionicLoading', '$timeout',
    function ($scope, $location, $stateParams, RouteService, VehicleMonitoringService, $ionicLoading, $timeout) {
        $scope.val = true;

        $scope.drawPolylines = function (route) {
            RouteService.getPolylines(route).then(function (results) {
                var stopsAndRoute = {};

                angular.forEach(results.stops, function (val, key) {
                    stopsAndRoute["stops" + key] = {
                        type: "circleMarker",
                        color: '#008888',
                        radius: 2,
                        latlngs: {
                            lat: val.lat,
                            lng: val.lon
                        }
                    }
                });

                angular.forEach(results.polylines, function (val, key) {
                    stopsAndRoute[key] = {
                        color: '#008888',
                        weight: 3,
                        latlngs: []
                    }

                    angular.forEach(L.Polyline.fromEncoded(val).getLatLngs(), function (v, k) {
                        stopsAndRoute[key].latlngs.push({
                            lat: v.lat,
                            lng: v.lng
                        });
                    });
                });

                $scope.paths = stopsAndRoute;
            })
        };

        $scope.drawBuses = function (route) {
            $scope.val = true;
            $timeout(function () {
                $scope.val = false;
            }, 30000);


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

                    buses[key] = {
                        lat: val.latitude,
                        lng: val.longitude,
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


            angular.extend($scope, {
                center: {
                    lat: 40.7142700,
                    lng: -74.0059700,
                    zoom: 10
                },
                defaults: {
                    tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    tileLayerOptions: {
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    },
                    scrollWheelZoom: false
                },
                markers: {},
                paths: {}
            });

        };

        $scope.init = (function () {
            $scope.map();
            $scope.drawPolylines($stateParams.routeId);
            $scope.drawBuses($stateParams.routeId);
        })();
}])

.controller('SearchCtrl', ['$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform',

    function ($scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform) {

        $scope.init = (function () {
            // do nothing ...
        })();

        $scope.go = function (path) {
            $location.path(path);
        };

        $scope.data = {
            "results": [],
            "searchKey": '',
            "notifications": ''
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
		$scope.noSchedService = function(route){
			$scope.data.notifications = "There is no scheduled service on this route at this time.";
		}
        $scope.searchAndGo = function (term) {
            SearchService.search(term).then(
                function (matches) {
                    switch (matches.type) {
                    case "RouteResult":
						//if (matches.hasUpcomingScheduledService){
                        $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
						//}else {
						//$scope.noSchedService(matches.shortName);
						//}
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
                    }
                }
            );

        };
}])

.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService', '$q',
    function ($scope, $ionicLoading, FavoritesService, $q) {
        $scope.data = {
            "loaded": false,
            "favorites": [],
            "notifications": '',
        };

        $scope.remove = function (stopId) {
            FavoritesService.remove(stopId);
            $scope.get();
        };

        $scope.get = function () {
            var getFavorites = FavoritesService.get().then(function (results) {
                if (!angular.isUndefined(results) && results != null) {
                    $scope.data.favorites = results;
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

.controller('AtStopCtrl', ['$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout',
    function ($scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout) {
        $scope.data = {
            "alerts": "",
            "loaded": false,
            "val": true,
            "inFavorites": false,
            "results": [],
            "stopName": $stateParams.stopName,
            "notifications": '',
            "alertsHide" : false
        };

        $scope.addToFavorites = function () {
            FavoritesService.add($stateParams.stopId, $stateParams.stopName);
            $scope.data.inFavorites = true;
        };

        $scope.removeFromFavorites = function () {
            FavoritesService.remove($stateParams.stopId);
        };

        $scope.handleLayovers = function(results){
            console.log(results);
            angular.forEach(results['arriving'], function(val, key){
                angular.forEach(val['distances'], function (v,k) {
                    if(v['progress']=='prevTrip'){
                       v['distance'] = v['distance'] + "+ Scheduled Layover At Terminal";
                    }
                    else if(v['progress']=='layover,prevTrip'){
                        //aagh, dates!
                        v['distance'] = v['distance'] + "+ At terminal. Scheduled to depart at " + v['departs'];
                    }
                })

            })

        };

        $scope.getBuses = function () {
            $scope.data.val = true;
            $timeout(function () {
                $scope.data.val = false;
            }, 30000);

            var getBuses = AtStopService.getBuses($stateParams.stopId).then(function (results) {
                if (!angular.isUndefined(results.arriving) && results.arriving != null) {
                    $scope.handleLayovers(results);
                    $scope.data.results = results.arriving;
                } else {
                    $scope.data.notifications = "No data available right now";
                }

                if (results.alerts.length > 0) {
                    $scope.data.alertsHide = true;
                    angular.forEach(results.alerts, function (val, key) {
                        $scope.data.alerts += "\n" + val;

                    });
                } else {

                    $scope.data.alertsHide = false;
                }
            });

            $q.all([getBuses]).then(function () {
                $scope.data.loaded = true;
            });
        };

        $scope.refresh = function () {
            $scope.getBuses();
        };

        $scope.init = (function () {
            $scope.data.inFavorites = FavoritesService.inFavorites($stateParams.stopId);
            $scope.getBuses();
        })();
}])

.controller('GeolocationCtrl', ['$scope', 'GeolocationService', '$stateParams', '$ionicLoading', '$q',
    function ($scope, GeolocationService, $stateParams, $ionicLoading, $q) {
        $scope.data = {
            "loaded": false,
            "routes": [],
            "stops": [],
            "address": $stateParams.address,
            "notifications": ''
        };

        $scope.getRoutesAndStops = function () {
            var getRoutes = GeolocationService.getRoutes($stateParams.latitude, $stateParams.longitude).then(function (results) {
                $scope.data.routes = results;
            });

            var getStops = GeolocationService.getStops($stateParams.latitude, $stateParams.longitude).then(function (results) {
                $scope.data.stops = results;
            });

            $q.all([getRoutes, getStops]).then(function () {
                $scope.data.loaded = true;
            });
        };

        $scope.init = (function () {
            $scope.getRoutesAndStops();
        })();
}])

.controller('RouteCtrl', ['$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading',
    function ($scope, RouteService, $stateParams, $location, $q, $ionicLoading) {
        $scope.data = {
            "loaded": false,
            "routeName": $stateParams.routeName,
            "direction": [],
            "directionName": "",
            "direction_": [],
            "directionName_": "",

        };

        $scope.getDirectionsAndStops = function () {
            var getDirections = RouteService.getDirections($stateParams.routeId).then(function (results) {
                angular.forEach(results, function (val, key) {
                    if (val.directionId == 0) {
                        $scope.data.directionName = val.destination;
                    }

                    if (val.directionId == 1) {
                        $scope.data.directionName_ = val.destination;
                    }
                });
            });

            var getStops = RouteService.getStops($stateParams.routeId, "0").then(function (results) {
                $scope.data.direction = results;
            });

            var getStops_ = RouteService.getStops($stateParams.routeId, "1").then(function (results) {
                $scope.data.direction_ = results;
            });

            $q.all([getDirections, getStops, getStops_]).then(function () {
                $scope.data.loaded = true;
            });
        };


        $scope.init = (function () {
            $scope.getDirectionsAndStops();
        })();
}])

.controller('NearbyStopsCtrl', ['$scope', 'GeolocationService', '$ionicLoading', '$q', '$ionicPopup',
    function ($scope, GeolocationService, $ionicLoading, $q, $ionicPopup) {
        $scope.data = {
            "loaded": false,
            "stops": [],
            "notifications": ""
        };

        $scope.refresh = function () {
            $scope.getNearbyStops();
        };

        $scope.getNearbyStops = function () {
            $ionicLoading.show();
            GeolocationService.promiseCurrentPosition({
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 10000
            }).then(
                function (position) {
                    $ionicLoading.hide();

                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    var getStops = GeolocationService.getStops(lat, lon).then(function (results) {
                        if (!angular.isUndefined(results) && results != null && results.length > 0) {
                            $scope.data.stops = results;
                        } else {
                            $scope.data.notifications = "No matches";
                        }
                    });

                    $q.all([getFavorites]).then(function () {
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
            $scope.getNearbyStops();
        })();
}]);
