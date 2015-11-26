/*jshint sub:true*/
angular.module('atstop.map.controller', ['configuration', 'filters'])

/**
 * @ngdoc controller
 * @description
 * Controller for showing a full route on a Map
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

                // fit to polyline ends
                // TODO: is there a better method for this? Extents?
                leafletData.getMap().then(function(map) {

                    polylineLength = $scope.paths.p0.latlngs.length - 1;

                    map.fitBounds([
                        [$scope.paths.p0.latlngs[0].lat, 
                        $scope.paths.p0.latlngs[0].lng],
                        [$scope.paths.p0.latlngs[polylineLength].lat,
                         $scope.paths.p0.latlngs[polylineLength].lng]
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
                $log.debug(res);
                angular.extend($scope.markers, res);
            });
            MapService.getStopMarkers(route, stop).then(function(res) {
                $log.debug(res);
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

        // map initialization function 
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

        // when user clicks on a marker, show information on vehicle or stop. 
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
        /**
        * When Zooming in past zoom 14, show stops. If zooming out past 14, hide stops
        * Makes a pretty big difference in performance.  
        */
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

            // if on initialization scale is greater than 14, don't show stops.
            if ($scope.center.zoom > 14) {
                toggleLayer('stops');
            }

            $scope.reloadTimeout = $interval($scope.refresh, 35000);
        })();
    }
]);