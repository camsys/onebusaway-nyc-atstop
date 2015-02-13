angular.module('starter.controllers', ['configuration', 'filters'])
// Controller that makes tabs go to root (for search and favs)
    .controller('GoHomeCtrl', function($scope, $rootScope, $state, $ionicHistory) {
        var clearHistory = function(){
            $ionicHistory.clearHistory();
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
        }
        $scope.goHomeTab = function() {
            clearHistory();
            $state.go('tab.home');
        }
        $scope.goFavsTab = function() {
            clearHistory();
            $state.go('tab.favorites');
        }

    })
// Search
.controller('SearchCtrl', ['$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'SearchesService', 'SHOW_BRANDING',
	function($scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, SearchesService, SHOW_BRANDING) {

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
			"showTips": true,
            "showBranding": SHOW_BRANDING
		};

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

		$scope.searchesGo = function(matches) {
			SearchesService.add(matches);
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
					//console.log("undefined type");
					break;
			}
		};

		// set no sched svc message.
		$scope.handleRouteSearch = function(matches) {
			if (matches.directions.length > 1) {
				// if one direction with no service-- handle on route/stop page.
				if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
					$scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
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
		};

		var noSchedService = function(routeDirection) {
			$scope.data.notifications = "There is no scheduled service on this route at this time.";
		};

		$scope.searchAndGo = function(term) {
			// for search page, enter searches if only one autocomplete result is returned.
			if ($scope.data.results.length == 1) {
				term = $scope.data.results[0];
			}

			SearchService.search(term).then(
				function(matches) {
					SearchesService.add(matches);
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
							//console.log("undefined type");
							break;
					}
				}
			);
		};

		$scope.init = (function() {
			SearchesService.fetchAll().then(function(results) {
				if (results.length > 0) {
					$scope.data.searches = results;
					$scope.data.showSearches = true;
					//$scope.data.showTips = false;
				} else {
					$scope.data.searches = [];
					$scope.data.showSearches = false;
					//$scope.data.showTips = true;
				}
			});
		})();
	}
])


.controller('FavoritesCtrl', ['$scope', '$ionicLoading', 'FavoritesService', '$q', 'SHOW_BRANDING',
	function($scope, $ionicLoading, FavoritesService, $q, SHOW_BRANDING) {
		$scope.data = {
			"loaded": false,
			"favorites": [],
			"notifications": '',
			"alerts": [],
            "showBranding": SHOW_BRANDING
		};

		$scope.remove = function(stopId) {
			FavoritesService.remove(stopId);
			get();
		};

		var get = function() {
			var favoritesDefer = $q.defer();

			FavoritesService.get().then(function(results) {
				if (!angular.isUndefined(results) && results !== null) {
					$scope.data.favorites = results;
					$scope.data.notifications = "";
				} else {
					$scope.data.notifications = "You have not added any favorites. Click the Star on a stop page to add one.";
				}
				favoritesDefer.resolve();
			});

			favoritesDefer.promise.then(function() {
				$scope.data.loaded = true;
			});
		};

		$scope.init = (function() {
			get();
		})();
	}
])

.controller('AtStopCtrl', ['$ionicScrollDelegate', '$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService', '$interval', '$location',
	function($ionicScrollDelegate, $scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService, $interval, $location) {
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
			"tips": "Refreshes automatically or pull for instant refresh."
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
				});

			});

		};

		var getBuses = function() {
			var busesDefer = $q.defer();
			AtStopService.getBuses($scope.data.stopId).then(function(results) {
				if (!angular.isUndefined(results.arriving) && results.arriving !== null && !$filter('isEmptyObject')(results.arriving)) {
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

		var updateArrivalTimes = function(results) {
			angular.forEach(results, function(val, key) {
				angular.forEach(val['distances'], function(v, k) {
					v.arrivingIn = datetimeService.getRemainingTime(v.expectedArrivalTime);
				});
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

		$scope.init = (function() {
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
		 * else, select the given group*/
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
						if (val.directionId === 0) {
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
					oneDirection = true;
					$scope.data.directionName = results[0].destination;
					$scope.groups[0].name = results[0].destination;
					$scope.groups.splice(1);
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
				// console.log("resolved");
			}), stopsDefer.promise.then(function() {
				// console.log("resolved");
			})]).then(function() {
				$scope.data.loaded = true;
			});
		};


		$scope.init = (function() {
			$scope.getDirectionsAndStops();
		})();
	}
])

.controller('AboutCtrl', ['$scope', '$ionicScrollDelegate', 'PRIV_POLICY_TEXT','SHOW_BRANDING','BRAND_ABOUT_TEXT',
	function($scope, $ionicScrollDelegate, PRIV_POLICY_TEXT,SHOW_BRANDING,BRAND_ABOUT_TEXT) {
        $scope.data = {
            showBranding: SHOW_BRANDING,
            hideText: true,
            brandAboutText: BRAND_ABOUT_TEXT,
            privText: PRIV_POLICY_TEXT
        }
		$scope.toggleText = function() {
			// resize the content since the Privacy Policy text is too big 
			$ionicScrollDelegate.resize();
			$scope.data.hideText = !$scope.data.hideText;
		};
	}
])

.controller('MapCtrl', ['MapService', '$scope', '$location', '$stateParams', '$timeout', 'leafletData', '$filter', '$q', '$interval', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
	function(MapService, $scope, $location, $stateParams, $timeout, leafletData, $filter, $q, $interval, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
		$scope.markers = {};
		$scope.paths = {};
		$scope.url = "atstop";
        $scope.tips= "Map refreshes automatically";

		// refresh map
		var refresh = function() {
			//console.log("refresh");
			leafletData.getMap().then(function(map) {
				map.closePopup();
			});
			showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);
		};

		// show route polylines
		var showRoutePolylines = function(route) {
			MapService.getRoutePolylines(route).then(function(res) {
				$scope.paths = res;

				// fit to polylines
				leafletData.getMap().then(function(map) {
					map.fitBounds([
						[$scope.paths['p0']['latlngs'][0]['lat'], $scope.paths['p0']['latlngs'][0]['lng']],
						[$scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lat'], $scope.paths['p0']['latlngs'][$scope.paths['p0']['latlngs'].length - 1]['lng']]
					]);
				});
			});
		};

		// show buses and stops
		var showBusAndStopMarkers = function(route, stop) {
			$scope.markers = {};

			MapService.getBusMarkers(route).then(function(res) {
				angular.extend($scope.markers, res);
			});

			MapService.getStopMarkers(route, stop).then(function(res) {
				angular.extend($scope.markers, res);
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
					tileLayer: MAP_TILES,
					tileLayerOptions: {
						attribution: $filter('hrefToJS')(MAP_ATTRS),
                        reuseTiles: true,
                        access_token: MAPBOX_KEY
					},
					scrollWheelZoom: false
				},
				markers: {},
				paths: {}
			});
			leafletData.getMap().then(function(map) {
				//leaflet attribution is not required
				map.attributionControl.setPrefix('');
				L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
			});
		};

		// map click event
		$scope.$on('leafletDirectiveMarker.click', function(event, args) {
			var object = $scope.markers[args.markerName];
			var content = '';
			var latlng = [];
			var popup = L.popup();
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

		$scope.$on('$destroy', function() {
			if ($scope.reloadTimeout) {
				$interval.cancel($scope.reloadTimeout);
			}
		});

		$scope.init = (function() {
			if ($location.$$path.indexOf("map-favorites") > -1) {
				$scope.url = "atstop-favorites";
			} else if ($location.$$path.indexOf("map-gps") > -1) {
				$scope.url = "atstop-gps";
			}

			map();
			showRoutePolylines($stateParams.routeId);
			showBusAndStopMarkers($stateParams.routeId, $stateParams.stopId);
			$scope.reloadTimeout = $interval(refresh, 35000);
		})();
	}
])

// Nearby Stops and Routes
.controller('NearbyStopsAndRoutesCtrl', ['MapService', '$stateParams', '$location', '$scope', 'GeolocationService', '$ionicLoading', '$q', '$ionicPopup', '$cordovaGeolocation', '$filter', 'RouteService', 'leafletData', '$ionicScrollDelegate', '$timeout', '$interval', 'MAPBOX_KEY', 'MAP_TILES', 'MAP_ATTRS',
	function(MapService, $stateParams, $location, $scope, GeolocationService, $ionicLoading, $q, $ionicPopup, $cordovaGeolocation, $filter, RouteService, leafletData, $ionicScrollDelegate, $timeout, $interval, MAPBOX_KEY, MAP_TILES, MAP_ATTRS) {
		$scope.markers = {};
		$scope.paths = {};
		$scope.url = "atstop";

		$scope.data = {
			"returnShow": false,
			"title": "Nearby Stops",
			"loaded": true,
			"showMap": false,
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

		$scope.back = function() {
			$scope.data.returnShow = false;
			if ($scope.reloadTimeout) {
				$interval.cancel($scope.reloadTimeout);
			}
            $scope.data.stops = $scope.data.nearbyStops;
			showNearbyStops();
			$scope.data.notifications = "";
			$scope.data.showMap = true;
		};

		$scope.refresh = function() {
			if ($scope.reloadTimeout) {
				$interval.cancel($scope.reloadTimeout);
			}
			if ($location.$$path == "/tab/nearby-stops-and-routes") {
				$scope.getNearbyStopsAndRoutesGPS();
			} else {
				$scope.getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
			}
			$scope.$broadcast('scroll.refreshComplete');
		};

		$scope.getNearbyStopsAndRoutes = function(lat, lon) {
			GeolocationService.getStops(lat, lon).then(function(results) {
				$ionicLoading.hide();
				if (!angular.isUndefined(results) && results !== null && results.length > 0) {
					angular.forEach(results, function(stop) {
						stop['dist'] = MapService.getDistanceInM(lat, lon, stop['lat'], stop['lon']);
					});
					$scope.data.stops = results;
                    $scope.data.stops.push({id: "current_location", lat: lat, lon: lon});
                    $scope.data.nearbyStops = results;
					showNearbyStops();
					$scope.data.notifications = "";
					$scope.data.showMap = true;
					leafletData.getMap().then(function(map) {
						L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
					});
				} else {
					$scope.data.showMap = false;
					$scope.data.notifications = "No nearby stops found.";
				}
			});
		};

		$scope.getNearbyStopsAndRoutesGPS = function() {
			//console.log("getNearbyStopsAndRoutesGPS called");
			$ionicLoading.show();
			$cordovaGeolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: 10000
			}).then(
				function(position) {
					//console.log("GPS succeeded");
					$scope.data.val = true;
					$scope.getNearbyStopsAndRoutes(position.coords.latitude, position.coords.longitude);
				}, function(error) {
					$scope.data.showMap = false;
					$scope.data.notifications = "No nearby stops found.";
					//console.log("GPS failed", error);
					$ionicLoading.hide();
					var popup = $ionicPopup.alert({
						content: "Cannot access your position. Check if location services are enabled."
					});
					$timeout(function() {
						popup.close();
					}, 3000);
				}
			);
		};

		var showNearbyStops = function() {
			$scope.markers = {};
			$scope.paths = {};
			leafletData.getMap().then(function(map) {
				map.closePopup();
			});

			var stops = [];
			angular.forEach($scope.data.stops, function(v, k) {
				if (v["id"] != "current_location"){
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
			}
            );
            //set zoom around nearest stop
            leafletData.getMap().then(function(map) {
                map.setView(stops['s0'], 15);
            });
			$scope.markers = stops;
		};

		// map
		var map = function() {
			var mapCenter = {};

			angular.extend($scope, {
				events: {
					markers: {
						enable: ['click'],
						logic: 'emit'
					}
				},
				center: mapCenter,
				defaults: {
					tileLayer: MAP_TILES,
					tileLayerOptions: {
						attribution: $filter('hrefToJS')(MAP_ATTRS)
					},
					scrollWheelZoom: false,
					key: MAPBOX_KEY
				},
				markers: {},
				paths: {}
			});

			leafletData.getMap().then(function(map) {
				map.attributionControl.setPrefix('');
			});
		};

		// show route polylines
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

		$scope.$on('$destroy', function() {
			if ($scope.reloadTimeout) {
				$interval.cancel($scope.reloadTimeout);
			}
		});

		// refresh specific route 
		$scope.showCurrentStop = function(route, stop, lat, lon, name) {
			$scope.data.returnShow = true;
			$interval.cancel($scope.reloadTimeout);
			drawCurrentStop(route, stop, lat, lon, name);
			$scope.reloadTimeout = $interval(function() {
				drawCurrentStop(route, stop, lat, lon, name);
			}, 35000);
		};

		// show current stop
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

			leafletData.getMap().then(function(map) {
				map.closePopup();
				//map.setView($scope.markers['currentStop'], 13);
			});

			showBusMarkers(route);
		};

		$scope.slideTo = function(location) {
			location = $location.hash(location);

			//console.log(location);
			//console.log('scrolling to: ' + location);

			// not satisfied with performance
			/*
			$timeout(function() {
				$ionicScrollDelegate.anchorScroll("#" + location);
			});
			*/
		};


		// map click event
		$scope.$on('leafletDirectiveMarker.click', function(event, args) {
			var object = $scope.markers[args.markerName];
			var content = '';
			var latlng = [];
			var popup = L.popup();
			if ($filter('isUndefinedOrEmpty')(object.stopName)) {
				content = "Vehicle " + object.vehicleId + "<br> <h4>" + object.destination + "</h4>" + "<br> <h5>Next Stop: " + object.nextStop + "</h5>";
			} else {
				if (object.stopName == "Current Location"){
					content = "<p>Current Location</p>";
				} else {
					content = '<p>' + object.stopName + '</p>' + '<a href="#/tab/' + $scope.url + '/' + object.stopId + '/' + object.stopName + '" class="button button-clear button-full button-small">See upcoming buses</a>';
				}
			}
			
			latLng = [object.lat, object.lng];
			popup.setContent(content).setLatLng(latLng);
			
			leafletData.getMap().then(function(map) {
				popup.openOn(map);
			});
		});

		$scope.init = (function() {
			map();
			if ($location.$$path == "/tab/nearby-stops-and-routes") {
				//console.log("GPS Mode");
				$scope.data.title = "Nearby Stops";
				$scope.url = "atstop-gps";
				$scope.getNearbyStopsAndRoutesGPS();

			} else {
				$scope.data.title = $stateParams.address;
				$scope.getNearbyStopsAndRoutes($stateParams.latitude, $stateParams.longitude);
			}
		})();
	}
]);
