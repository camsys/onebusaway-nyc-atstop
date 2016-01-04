angular.module('atstop.route.controller', ['configuration', 'filters'])

/**
 * @ngdoc controller
 * @description
 *  Route Stop List Controller
 * Controller that used for showing the routes and stops of routes.
 */
.controller('RouteCtrl', ['$log', '$scope', 'RouteService', '$stateParams', '$location', '$q',
    '$ionicLoading', '$ionicScrollDelegate', 'FavoritesService',
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

        // set to true if there is only one direction (e.g. [0] vs [0,1]) on the route 
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
            var oneDirection;

            RouteService.getDirections($stateParams.routeId).then(function(results) {
                $log.debug(results);

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

                    // there now are routes that have one direction with ID 1. This is getting hacky.
                    var directionName = Object.keys(results)[0][0];

                    $scope.data.directionName = results[directionName].destination;
                    $scope.data.groups[0].name = results[directionName].destination;
                    $scope.data.groups.splice(1);
                    $scope.toggleGroup($scope.data.groups[directionName]);
                }
                directionsDefer.resolve();
            });

            directionsDefer.promise.then(function() {
                RouteService.getStops($stateParams.routeId, "0").then(function(results) {

                    $scope.data.direction = results;
                    $scope.data.groups[0].items = results;
                    if (oneDirection === false || Object.keys(results).length == 0) {
                        var directionToSet =1;
                        // if direction 0 came back empty, try to get stops with direction 1.
                        // but set the first group for display.
                        if (Object.keys(results).length == 0){directionToSet =0; }

                        RouteService.getStops($stateParams.routeId, 1).then(function(results2) {
                            $log.debug('stops '+results2);
                            $scope.data.direction_ = results2;
                            $scope.data.groups[directionToSet].items = results2;
                        });
                    }
                    stopsDefer.resolve();
                });
            });

            $q.all([directionsDefer.promise.then(function() {
                $log.debug("resolved");
            }), stopsDefer.promise.then(function() {
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
]);