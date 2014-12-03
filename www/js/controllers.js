angular.module('starter.controllers', ['configuration', 'filters'])

.controller('MapCtrl', ['$scope', '$location', '$stateParams', 'RouteService',
	'VehicleMonitoringService', '$ionicLoading', '$timeout', 'leafletBoundsHelpers', 'leafletData', 'StopcodeService', 'GeolocationService', '$filter', '$q', '$interval',
	function($scope, $location, $stateParams, RouteService, VehicleMonitoringService, $ionicLoading, $timeout, leafletBoundsHelpers, leafletData, StopcodeService, GeolocationService, $filter, $q, $interval, MAPBOX_KEY) {
		$scope.paths = {};
		$scope.markers = {};

		// Refresh Map
		var refresh = function() {
			console.log("refresh");
			drawStopsAndBuses($stateParams.routeId);
		};

		// icons
		var icons = {
			stop: {
				type: 'div',
				iconSize: [13, 13],
				className: 'stop',
			}
		}


		var drawStopsAndBuses = function(route) {
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
						icon: icons.stop,
						focus: false,
						stopId: val.id,
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

		var drawRoute = function(route) {
			RouteService.getPolylines(route).then(function(results) {
				var route = [];
				var i = 0;

				angular.forEach(results.polylines, function(val, key) {
					route[i] = {
						color: '#' + results.color,
						weight: 4,
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
					console.log(object);
					var content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/atstop/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">Go to Stop</a>',
						latLng = [object.lat, object.lng],
						popup = L.popup().setContent(content).setLatLng(latLng);
				}

				leafletData.getMap().then(function(map) {
					popup.openOn(map);
				});
			});


			leafletData.getMap().then(function(map) {
				map.attributionControl.setPrefix('');
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

		$scope.$on('$destroy', function() {
			$interval.cancel($scope.reloadTimeout);
		});

		$scope.init = (function() {
			map();
			drawRoute($stateParams.routeId);
			drawStopsAndBuses($stateParams.routeId);
			$scope.reloadTimeout = $interval(refresh, 35000);

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
		if ($scope.data.searchKey.length > 0) {
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
			);}
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
					$scope.data.notifications = "You have not added any favorites.";
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

.controller('AtStopCtrl', ['$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService', '$interval', '$location',
	function($scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService, $interval, $location) {
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
			"stopId": $stateParams.stopId
		};

		$scope.toggleFavorites = function() {
			if (FavoritesService.inFavorites($scope.data.stopId)) {
				FavoritesService.remove($scope.data.stopId);
				$scope.data.favClass = "";
			} else {
				FavoritesService.add($scope.data.stopId, $scope.data.stopName);
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

			var busesDefer = $q.defer();

			AtStopService.getBuses($scope.data.stopId).then(function(results) {
				if (!angular.isUndefined(results.arriving) && results.arriving != null && !$filter('isEmptyObject')(results.arriving)) {
					$scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
					handleLayovers(results);
					updateArrivalTimes(results.arriving);
					$scope.data.results = results.arriving;
					$scope.data.notifications = "";
				} else {
					$scope.data.results = "";
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
			$interval.cancel($scope.reloadTimeout);
		});

		$scope.init = (function() {
			if ($location.$$path.indexOf("atstop-favorites") > -1) {
				$scope.data.link = "map-favorites";
			}

			if (FavoritesService.inFavorites($scope.data.stopId)) {
				$scope.data.favClass = "button-energized";
			} else {
				$scope.data.favClass = "";
			};
			getBuses();
			$scope.reloadTimeout = $interval(tick, 35000);
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
.controller('NearbyStopsAndRoutesCtrl', ['$stateParams',  '$location', '$scope', 'GeolocationService', '$ionicLoading', '$q', '$ionicPopup', '$cordovaGeolocation', '$filter', 'RouteService', 'leafletData', 'leafletBoundsHelpers', '$ionicModal', 'AtStopService', '$ionicScrollDelegate', 'MAPBOX_KEY',
	function($stateParams, $location, $scope, GeolocationService, $ionicLoading, $q, $ionicPopup, $cordovaGeolocation, $filter, RouteService, leafletData, leafletBoundsHelpers, $ionicModal, AtStopService, $ionicScrollDelegate, MAPBOX_KEY) {
		$scope.data = {
			"loaded": true,
			"stops": [],
			"routes": [],
			"lat": "",
			"lon": "",
			"notifications": "",
			"val": false,
			"showRoutes": false,
			"showStops": true,
			"results": []
		};
		
		var getDistanceInM = function(lat1, lon1, lat2, lon2) {
			var R = 6371;
			var dLat = deg2rad(lat2 - lat1);
			var dLon = deg2rad(lon2 - lon1);
			var a =	Math.sin(dLat / 2) * Math.sin(dLat / 2) +Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *Math.sin(dLon / 2) * Math.sin(dLon / 2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			var d = R * c * 1000;
			return parseInt(d);
		};

		var deg2rad = function(deg) {
			return deg * (Math.PI / 180)
		};

		$scope.refresh = function() {
			$scope.getNearbyStopsAndRoutesGPS();
			$scope.$broadcast('scroll.refreshComplete');
		};
		
		var directionToDegrees = function(direction) {
			var directions = {	"N": 0,
								"NE":45,
								"E":90,
								"SE":135,
								"S":180,
								"SW":225,
								"W":270,
								"NW":315};
			return directions[direction];
		};
		
		var icons = {
				stop: {
					type: 'div',
					
					iconSize: [13, 13],
					className: 'stop'
				},
				currentStop: {
					type: 'div',
					iconSize: [14, 14],
					className: 'stop-current'
				}
			};

		var test = function(lat, lon) {

			var stopsDefer = $q.defer();
			var routesDefer = $q.defer();

			GeolocationService.getStops(lat, lon).then(function(results) {
				if (!angular.isUndefined(results) && results != null && results.length > 0) {
					$scope.data.stops = results;
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "We could not find any stops near your location";
				}
				stopsDefer.resolve();
				routesDefer.resolve();
			});

			$scope.data.loaded = true;
		}

		$scope.getNearbyStopsAndRoutes = function(lat, lon) {
			GeolocationService.getStops(lat, lon).then(function(results) {
				$ionicLoading.hide();
				if (!angular.isUndefined(results) && results != null && results.length > 0) {
					angular.forEach(results, function(stop) {
						stop['dist'] = getDistanceInM(lat, lon, stop['lat'], stop['lon']);
					});
					$scope.data.stops = results;
					plotNearbyStops();
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "No nearby stops found.";
				}
			});
		};

		$scope.getNearbyStopsAndRoutesGPS = function() {
			$ionicLoading.show();
			$cordovaGeolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: 5000
			}).then(
				function(position) {
					$scope.data.val = true;
					$scope.getNearbyStopsAndRoutes(position.coords.latitude, position.coords.longitude);
				}, function(error) {
					$ionicLoading.hide();
					var popup = $ionicPopup.alert({
						content: "Cannot access your position. Check if location services are enabled."
					});
					$timeout(function() {
						popup.close();
						}, 3000);
				}
			);
		}

		var map = function() {
				$scope.$on('leafletDirectiveMarker.click', function(event, args) {
				console.log(event);
				console.log(args);
				var object = $scope.markers[args.markerName];
				leafletData.getMap().then(function(map) {
					console.log('hi!');
					//need to do something interesting here... show stop information below map and hide others?
				});
			});
			leafletData.getMap().then(function(map) {
				//leaflet attribution is not required
				map.attributionControl.setPrefix('');
			});
			
			var mapCenter;
			
			//if we received lat/long from the state, then use that center, otherwise use location
			if (!angular.isUndefined($stateParams.latitude)){
				mapCenter = { lat: Number($stateParams.latitude), lng: Number($stateParams.longitude), zoom: 15};
			}	else {
				mapCenter ={ autoDiscover: true, zoom: 15};
			}
			
			angular.extend($scope, {
				center: mapCenter,
				defaults: {
					tileLayer: "http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png",
					tileLayerOptions: {
						attribution: $filter('hrefToJS')('Map:<a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC-BY-3</a>. Data:<a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://www.openstreetmap.org/copyright">ODbL</a>.')
					},
					scrollWheelZoom: false,
					key: MAPBOX_KEY
				},
				markers: {},
				paths: {}
			});

		};
		
		plotNearbyStops = function() {
			var stops = [];
			var i = 0;
			angular.forEach($scope.data.stops, function (s){
					stops[i] = {
						lat: s["lat"],
						lng: s["lon"],
						icon: icons.stop,
						//iconAngle: directionToDegrees(s["direction"]),
						focus: false
				};
				i++;
			});
			$scope.markers = stops;
		};

		$scope.showOnMap = function(type, ID, lat, lon, name) {
			$ionicScrollDelegate.scrollTop();
			lat = typeof lat !== 'undefined' ? lat : "";
			lon = typeof lon !== 'undefined' ? lon : "";
			name = typeof name !== 'undefined' ? name : "";

			$scope.markers = {};
			$scope.paths = {};

			if (type == "route") {
				RouteService.getPolylines(ID).then(function(results) {
					var route = [];
					var i = 0;

					angular.forEach(results.polylines, function(val, key) {
						route[i] = {
							color: '#' + results.color,
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

				});
			} else {
				var stops = [];
				stops[0] = {
					lat: lat,
					lng: lon,
					icon: icons.currentStop,	
					focus: false,
					stopId: ID,
					stopName: $filter('encodeStopName')(name)
				};

				leafletData.getMap().then(function(map) {
					map.setView(stops[0], 15);
				});
				$scope.markers = stops;
			}
		};

		$scope.init = (function() {
			$scope.data.results = "";
			map();
			//test(40.678178, -73.944158);
			if ($location.$$path == "/tab/nearby-stops-and-routes") {
				$scope.getNearbyStopsAndRoutesGPS();
			} else {
				$scope.getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
			}
		})();

		$ionicModal.fromTemplateUrl('templates/modal.html', {
			scope: $scope
		}).then(function(modal) {
			$scope.modal = modal;
		});

		//Cleanup the modal when we're done with it!
		$scope.$on('$destroy', function() {
			$scope.modal.remove();
		});

		// Execute action on hide modal
		$scope.$on('modal.hidden', function() {
			// Execute action
		});

		// Execute action on remove modal
		$scope.$on('modal.removed', function() {
			// Execute action
		});

		$scope.getBuses = function(ID) {
			AtStopService.getBuses(ID).then(function(results) {
				if (!angular.isUndefined(results.arriving) && results.arriving != null && !$filter('isEmptyObject')(results.arriving)) {
					$scope.data.results = results.arriving;
					$scope.data.notifications = "";
				} else {
					$scope.data.results = "";
					$scope.data.notifications = "We are not tracking any buses to this stop at this time. Check back later for an update.";
				}
			});
		};
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
