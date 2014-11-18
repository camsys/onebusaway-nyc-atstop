angular.module('starter.controllers', ['configuration', 'filters'])

.controller('MapCtrl', ['$scope', '$location', '$stateParams', 'RouteService',
	'VehicleMonitoringService', '$ionicLoading', '$timeout', 'leafletBoundsHelpers', 'leafletData', 'StopcodeService', 'GeolocationService', '$filter', '$q',
	function($scope, $location, $stateParams, RouteService, VehicleMonitoringService, $ionicLoading, $timeout, leafletBoundsHelpers, leafletData, StopcodeService, GeolocationService, $filter, $q, MAPBOX_KEY) {
		$scope.val = true;
		$scope.paths = {};
		$scope.markers = {};

		// Refresh Map
		$scope.refresh = function() {
			drawStopsAndBuses($stateParams.routeId);
		};

		// Draw nearby stops
		var drawNearbyStops = function(lclLat, lclLon) {
			GeolocationService.getStops(lclLat, lclLon).then(function(results) {
				var stops = [];
				var i = 0;

				angular.forEach(results, function(val, key) {
					var lclName = $filter('encodeStopName')(val.name);
					stops[i] = {
						lat: val.lat,
						lng: val.lon,
						icon: {
							iconUrl: 'img/stop_icons/bullet.png',
							iconSize: [20, 20]
						},
						focus: false,
						stopId: val.stopId,
						stopName: lclName
					}
					i++;
				});

				$scope.markers = stops;

				leafletData.getMap().then(function(map) {
					map.setView([lclLat, lclLon], 15);
				});
			});
		}

		// Draw Stops and Buses
		var drawStopsAndBuses = function(route) {
			$scope.val = true;
			$timeout(function() {
				$scope.val = false;
			}, 5000);

			$scope.markers = {};

			var stopsAndBuses = [];
			var i = 0;

			var stopsDefer = $q.defer();

			RouteService.getPolylines(route).then(function(results) {
				angular.forEach(results.stops, function(val, key) {
					var lclName = $filter('encodeStopName')(val.name);
					stopsAndBuses[i] = {
						lat: val.lat,
						lng: val.lon,
						icon: {
							iconUrl: 'img/stop_icons/bullet.png',
							iconSize: [20, 20]
						},
						focus: false,
						stopId: val.stopId,
						stopName: lclName
					}
					i++;
				});
				stopsDefer.resolve();
			});

			stopsDefer.promise.then(function() {
				VehicleMonitoringService.getLocations(route).then(function(results) {
					function round5(x) {
						return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
					}
					angular.forEach(results, function(val, key) {
						var angle = round5(val.angle);
						if (angle == 360) {
							angle = 0;
						};
						stopsAndBuses[i] = {
							lat: val.latitude,
							lng: val.longitude,
							icon: {
								iconUrl: 'img/bus_icons/vehicle-' + angle + '.png',
								iconSize: [51, 51]
							},
							focus: false,
							vehicleId: val.vehicleId,
							destination: val.destination,
							nextStop: val.stopPointName,
                            zIndexOffset: 800
						}
						i++;
					});
					$scope.markers = stopsAndBuses;
				});
			});
		};

		// Draw Route Polylines
		var drawRoute = function(route) {
			RouteService.getPolylines(route).then(function(results) {
				var route = [];
				var i = 0;

				angular.forEach(results.polylines, function(val, key) {
					route[i] = {
						color: '#fb6a4a',
						weight: 3,
						latlngs: [],
						clickable: false
					};

					angular.forEach(L.Polyline.fromEncoded(val).getLatLngs(), function(v, k) {
						route[i].latlngs.push({
							lat: v.lat,
							lng: v.lng
						});
					});

					i++;
				});

				$scope.paths = route;

				leafletData.getMap().then(function(map) {
					map.fitBounds([
						[$scope.paths['0']['latlngs'][0]['lat'], $scope.paths['0']['latlngs'][0]['lng']],
						[$scope.paths['0']['latlngs'][$scope.paths['0']['latlngs'].length - 1]['lat'], $scope.paths['0']['latlngs'][$scope.paths['0']['latlngs'].length - 1]['lng']]
					]);
				});

			});
		};


		// Map
		var map = function() {
			// watch marker click events
			$scope.$on('leafletDirectiveMarker.click', function(event, args) {
				var object = $scope.markers[args.markerName];
				console.log(object.stopName);
				if ($filter('isUndefinedOrEmpty')(object.stopName)) {
					var content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>",
						latLng = [object.lat, object.lng],
						popup = L.popup().setContent(content).setLatLng(latLng);
				} else {
					var content = object.stopName,
						latLng = [object.lat, object.lng],
						popup = L.popup().setContent(content).setLatLng(latLng);
				}

				leafletData.getMap().then(function(map) {
					popup.openOn(map);
				});
			});


			leafletData.getMap().then(function(map) {
				map.attributionControl.setPrefix($filter('hrefToJS')('<a title="A JS library for interactive maps" href="http://leafletjs.com">Leaflet</a>'));
			});


			angular.extend($scope, {
				events: {
					markers: {
						enable: ['click'],
						logic: 'emit'
					}
				},
				center: {},
				defaults: {
					tileLayer: "http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png",
					tileLayerOptions: {
						attribution: $filter('hrefToJS')('Map:<a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data:<a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.')
					},
					scrollWheelZoom: false,
					key: MAPBOX_KEY
				},
				markers: {},
				paths: {}
			});
		};

		$scope.init = (function() {
			map();
			if ($location.$$path.indexOf('/tab/map-nearby') >= 0) {
				// Test
				// $scope.drawNearbyStopsAndRoutes(40.635081, -73.967235);
				drawNearbyStops($stateParams.lat, $stateParams.lon);
			} else {
				drawRoute($stateParams.routeId);
				drawStopsAndBuses($stateParams.routeId);
			}
		})();

	}
])

// Search
.controller('SearchCtrl', ['$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'FavoritesService',
	function($scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, FavoritesService) {


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
			"favorites": [],
			"showFavs": false,
			"showTips": true
		};

		$scope.autocomplete = function() {
			SearchService.autocomplete($scope.data.searchKey).then(
				function(matches) {
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
		$scope.handleRouteSearch = function(matches) {
			if (matches.directions.length > 1) {
				// if one direction with no service-- handle on route/stop page.
				if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
					$scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
					console.log($scope.data.notifications);
				} else if (!matches.directions[0].hasUpcomingScheduledService && !matches.directions[1].hasUpcomingScheduledService) {
					noSchedService(matches.shortName);
				} else {

				}
			} else {
				if (matches.directions[0].hasUpcomingScheduledService) {
					$scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
				} else {
					noSchedService(matches.shortName);
				}
			}
		}

		var noSchedService = function(routeDirection) {
			$scope.data.notifications = "There is no scheduled service on this route at this time.";
		}

		$scope.searchAndGo = function(term) {
			SearchService.search(term).then(
				function(matches) {
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

		$scope.get = function() {
			FavoritesService.get().then(function(results) {
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

		$scope.init = (function() {
			$scope.get();
		})();
	}
])


// Favorites
.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService', '$q',
	function($scope, $ionicLoading, FavoritesService, $q) {
		$scope.data = {
			"loaded": false,
			"favorites": [],
			"notifications": '',
			"alerts": []
		};

		var favoritesDefer = $q.defer();

		$scope.remove = function(stopId) {
			FavoritesService.remove(stopId);
			$scope.get();
		};

		$scope.get = function() {
			FavoritesService.get().then(function(results) {
				if (!angular.isUndefined(results) && results != null) {
					$scope.data.favorites = results;
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "You have no favorites";
				}
				favoritesDefer.resolve();
			});

			favoritesDefer.promise.then(function() {
				$scope.data.loaded = true;
			});
		};

		$scope.init = (function() {
			$scope.get();
		})();
	}
])

// At Stop
.controller('AtStopCtrl', ['$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService',
	function($scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService) {
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

		$scope.toggleFavorites = function() {
			if (FavoritesService.inFavorites($stateParams.stopId)) {
				FavoritesService.remove($stateParams.stopId);
				$scope.data.favClass = "";
			} else {
				FavoritesService.add($stateParams.stopId, $stateParams.stopName);
				$scope.data.favClass = "button-energized";
			}
		}

		var handleLayovers = function(results) {
			angular.forEach(results['arriving'], function(val, key) {
				//updates distances to an array of strings so that multi-line entries come out cleaner.
				angular.forEach(val['distances'], function(v, k) {
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

		var getBuses = function() {
			$scope.data.val = true;
			$timeout(function() {
				$scope.data.val = false;
			}, 5000);

			var busesDefer = $q.defer();

			AtStopService.getBuses($stateParams.stopId).then(function(results) {
				if (!angular.isUndefined(results.arriving) && results.arriving != null && !$filter('isEmptyObject')(results.arriving)) {
					$scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
					handleLayovers(results);
					updateArrivalTimes(results.arriving);
					$scope.data.results = results.arriving;
					$scope.data.notifications = "";
				} else {
					scope.data.results = "";
					$scope.data.notifications = "We are not tracking any buses to this stop at this time. Check back later for an update.";
				}

				if (results.alerts.length > 0) {
					$scope.data.alertsHide = true;
					$scope.data.alerts = results.alerts;
				} else {
					$scope.data.alertsHide = false;
				}

				busesDefer.resolve();
			});

			busesDefer.promise.then(function() {
				$scope.data.loaded = true;
			});
		};

		var tick = function() {
			getBuses();
		}

		var updateArrivalTimes = function(results) {
			angular.forEach(results, function(val, key) {
				angular.forEach(val['distances'], function(v, k) {
					v.arrivingIn = datetimeService.getRemainingTime(v.expectedArrivalTime);
				});
			});
		};

		$scope.refresh = function() {
			getBuses();
			$scope.$broadcast('scroll.refreshComplete');
		};

		$scope.$on('$destroy', function() {
			$timeout.cancel($scope.reloadTimeout);
		});

		$scope.init = (function() {
			if (FavoritesService.inFavorites($stateParams.stopId)) {
				$scope.data.favClass = "button-energized";
			} else {
				$scope.data.favClass = "";
			};
			getBuses();
			$scope.reloadTimeout = $timeout(tick, 35000);
		})();
	}
])

.controller('GeolocationCtrl', ['$scope', 'GeolocationService', '$stateParams', '$ionicLoading', '$q',
	function($scope, GeolocationService, $stateParams, $ionicLoading, $q) {
		$scope.data = {
			"lat": $stateParams.latitude,
			"lon": $stateParams.longitude,
			"loaded": false,
			"routes": [],
			"stops": [],
			"address": $stateParams.address,
			"notifications": ''
		};

		$scope.getRoutesAndStops = function() {
			var routesDefer = $q.defer();
			var stopsDefer = $q.defer();

			GeolocationService.getRoutes($stateParams.latitude, $stateParams.longitude).then(function(results) {
				if (!angular.isUndefined(results) && results != null && results.length > 0) {
					$scope.data.routes = results;
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "No matches";
				}
				routesDefer.resolve();
			});

			GeolocationService.getStops($stateParams.latitude, $stateParams.longitude).then(function(results) {
				if (!angular.isUndefined(results) && results != null && results.length > 0) {
					$scope.data.stops = results;
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "No matches";
				}
				stopsDefer.resolve();
			});

			$q.all([routesDefer.promise.then(function() {
				console.log("resolved");
			}), stopsDefer.promise.then(function() {
				console.log("resolved");
			})]).then(function() {
				$scope.data.loaded = true;
			});
		};

		$scope.init = (function() {
			$scope.getRoutesAndStops();
		})();
	}
])

// Route Stops
.controller('RouteCtrl', ['$scope', 'RouteService', '$stateParams', '$location', '$q', '$ionicLoading', '$ionicScrollDelegate',
	function($scope, RouteService, $stateParams, $location, $q, $ionicLoading, $ionicScrollDelegate) {
		$scope.routeId = $stateParams.routeId;
		var oneDirection = false;
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

		$scope.data = {
			"loaded": false,
			"routeName": $stateParams.routeName,
			"direction": [],
			"directionName": "",
			"direction_": [],
			"directionName_": ""
		};

		$scope.getDirectionsAndStops = function() {
			var directionsDefer = $q.defer();
			var stopsDefer = $q.defer();

			RouteService.getDirections($stateParams.routeId).then(function(results) {
				if (Object.keys(results).length > 1) {
					oneDirection = false;
					angular.forEach(results, function(val, key) {
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
					oneDirection = true;
					$scope.toggleGroup($scope.groups[0]);
				}
				directionsDefer.resolve();
			});

			directionsDefer.promise.then(function() {
				RouteService.getStops($stateParams.routeId, "0").then(function(results) {
					$scope.data.direction = results;
					$scope.groups[0].items = results;
					if (oneDirection === false) {
						//console.log("1D 4eva!");
						RouteService.getStops($stateParams.routeId, "1").then(function(results2) {
							$scope.data.direction_ = results2;
							$scope.groups[1].items = results2;
						});
					}
					stopsDefer.resolve();
				});
			});

			$q.all([directionsDefer.promise.then(function() {
				console.log("resolved");
			}), stopsDefer.promise.then(function() {
				console.log("resolved");
			})]).then(function() {
				$scope.data.loaded = true;
			});
		};


		$scope.init = (function() {
			$scope.getDirectionsAndStops();
		})();
	}
])

// Nearby Stops and Routes
.controller('NearbyStopsAndRoutesCtrl', ['$scope', 'GeolocationService', '$ionicLoading', '$q', '$ionicPopup', '$cordovaGeolocation',
	function($scope, GeolocationService, $ionicLoading, $q, $ionicPopup, $cordovaGeolocation) {
		$scope.data = {
			"loaded": false,
			"stops": [],
			"routes": [],
			"notifications": "",
			"val": true,
			"lat": '',
			"lon": ''
		};

		$scope.refresh = function() {
			$scope.getNearbyStopsAndRoutes();
		};

		$scope.getNearbyStopsAndRoutes = function() {
			$ionicLoading.show();
			$cordovaGeolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: 5000
			}).then(
				function(position) {
					$ionicLoading.hide();
					$scope.data.val = false;
					$scope.data.lat = position.coords.latitude;
					$scope.data.lon = position.coords.longitude;

					var stopsDefer = $q.defer();
					var routesDefer = $q.defer();

					GeolocationService.getStops($scope.data.lat, $scope.data.lon).then(function(results) {
						if (!angular.isUndefined(results) && results != null && results.length > 0) {
							$scope.data.stops = results;
							$scope.data.notifications = "";
						} else {
							$scope.data.notifications = "No matches";
						}
						stopsDefer.resolve();
					});

					GeolocationService.getRoutes($scope.data.lat, $scope.data.lon).then(function(results) {
						if (!angular.isUndefined(results) && results != null && results.length > 0) {
							$scope.data.routes = results;
							$scope.data.notifications = "";
						} else {
							$scope.data.notifications = "No matches";
						}
						routesDefer.resolve();
					});

					$q.all([stopsDefer.promise.then(function() {
						console.log("resolved");
					}), routesDefer.promise.then(function() {
						console.log("resolved");
					})]).then(function() {
						$scope.data.loaded = true;
					});
				}, function(error) {
					$ionicLoading.hide();

					$ionicPopup.alert({
						title: "Error",
						content: "Cannot retrieve position information. Check if the location service is enabled."
					})
						.then(function(result) {
							if (result) {
								// ionic.Platform.exitApp();
							}
						});
				}
			);
		}

		$scope.init = (function() {
			$scope.getNearbyStopsAndRoutes();
		})();
	}
])


.controller('AboutCtrl', ['$scope', 'PRIV_POLICY_TEXT',
	function($scope, PRIV_POLICY_TEXT) {

		$scope.hideText = true;
		$scope.text = PRIV_POLICY_TEXT;

		$scope.toggleText = function() {
			$scope.hideText = !$scope.hideText;
		};



	}

]);
