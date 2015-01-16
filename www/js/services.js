angular.module('starter.services', ['ionic', 'configuration'])

.factory('SearchesService', function($q, $window) {
	var insert = function(term, title, data) {
		var searches = Array.prototype.slice.call(JSON.parse($window.localStorage['searches'] || '[]'));

		if (searches.length > 0) {
			angular.forEach(searches, function(val, key) {
				if (val.term == term) {
					searches.splice(key, 1);
				}
			});

			if (searches.length >= 5) {
				searches.splice(0, 1);
			}
		}

		searches.push({
			term: term,
			title: title,
			data: data
		});

		$window.localStorage.setItem("searches", JSON.stringify(searches));
	};

	var add = function(matches) {
		switch (matches.type) {
			case "RouteResult":
				insert(matches.id, matches.shortName, matches);
				break;
			case "StopResult":
				insert(matches.id, matches.name, matches);
				break;
			case "GeocodeResult":
				insert(matches.formattedAddress, matches.formattedAddress, matches);
				break;
			default:
				//console.log("undefined type");
				break;
		}
	};

	var fetchAll = function() {
		var deferred = $q.defer();
		deferred.resolve(Array.prototype.slice.call(JSON.parse($window.localStorage['searches'] || '[]')).reverse());
		return deferred.promise;
	};

	return {
		add: add,
		fetchAll: fetchAll
	};
})

.factory('$localstorage', ['$window',
	function($window) {
		return {
			set: function(key, value) {
				$window.localStorage[key] = value;
			},
			get: function(key, defaultValue) {
				return $window.localStorage[key] || defaultValue;
			},
			setObject: function(key, value) {
				$window.localStorage[key] = JSON.stringify(value);
			},
			getObject: function(key) {
				return JSON.parse($window.localStorage[key] || '{}');
			}
		};
	}
])

.factory('FavoritesService', function($q, $window) {
	var add = function(stopId, stopName) {
		var data = JSON.parse($window.localStorage['favorites'] || '{}');
		data[stopId] = {
			"stopId": stopId,
			"stopName": stopName
		};
		$window.localStorage.setItem("favorites", JSON.stringify(data));
		//console.log('Added to the favorites');
	};

	var remove = function(stopId) {
		var data = JSON.parse($window.localStorage['favorites'] || '{}');
		delete data[stopId];
		$window.localStorage.setItem("favorites", JSON.stringify(data));
	};

	var get = function() {
		var deferred = $q.defer();
		deferred.resolve(JSON.parse($window.localStorage.getItem("favorites") || '{}'));
		return deferred.promise;
	};

	var inFavorites = function(stopId) {
		var data = JSON.parse($window.localStorage['favorites'] || '{}');
		return !(angular.isUndefined(data[stopId]) || data[stopId] === null);
	};

	return {
		add: add,
		remove: remove,
		get: get,
		inFavorites: inFavorites
	};
})

.factory('VehicleMonitoringService', function($q, $http, httpTimeout, API_END_POINT, API_KEY) {
	var getLocations = function(route) {
		var deferred = $q.defer();
		var locations = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/siri/vehicle-monitoring.json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY,
				LineRef: route
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				angular.forEach(data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity, function(val, key) {
					locations[key] = {
						latitude: val.MonitoredVehicleJourney.VehicleLocation.Latitude,
						longitude: val.MonitoredVehicleJourney.VehicleLocation.Longitude,
						destination: val.MonitoredVehicleJourney.DestinationName,
						stopPointName: val.MonitoredVehicleJourney.MonitoredCall.StopPointName,
						vehicleId: val.MonitoredVehicleJourney.VehicleRef.replace(/\D/g, ''),
						angle: val.MonitoredVehicleJourney.Bearing
					};
				});

				return deferred.resolve(locations);
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		return deferred.promise;
	};

	return {
		getLocations: getLocations
	};
})

.factory('RouteService', function($filter, $q, $http, httpTimeout, API_END_POINT, API_KEY, DSCacheFactory) {
	DSCacheFactory('dataCache', {
		maxAge: 600000,
		cacheFlushInterval: 600000,
		deleteOnExpire: 'aggressive' // Items will be deleted from this cache right when they expire.
	});


	var getPolylines = function(route) {
		var deferred = $q.defer();
		var results = {
			stops: {},
			polylines: [],
			color: ""
		};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY,
				version: 2,
				includePolylines: true
			},
			cache: true,
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				angular.forEach(data.data.references.routes, function(val, key) {
					if (val.id == route) {
						results.color = val.color;
					}
				});

				results.stops = data.data.references.stops;

				angular.forEach(data.data.entry.stopGroupings[0].stopGroups, function(val, key) {
					angular.forEach(val.polylines, function(v, k) {
						results.polylines.push(v.points);
					});
				});

				return deferred.resolve(results);
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		return deferred.promise;
	};

	var getDirections = function(route) {
		var deferred = $q.defer();
		var directions = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK", {
			cache: DSCacheFactory.get('dataCache'),
			params: {
				key: API_KEY,
				version: 2,
				includePolylines: false,
				includeReferences: false
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				if (data.data.entry.stopGroupings[0].stopGroups[0]) {
					if (data.data.entry.stopGroupings[0].stopGroups[0].id == "0") {
						directions[0] = {
							directionId: 0,
							destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
						};
					}

					if (data.data.entry.stopGroupings[0].stopGroups[0].id == "1") {
						directions[1] = {
							directionId: 1,
							destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
						};
					}
				}

				if (data.data.entry.stopGroupings[0].stopGroups[1]) {
					if (data.data.entry.stopGroupings[0].stopGroups[1].id == "0") {
						directions[0] = {
							directionId: 0,
							destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
						};
					}

					if (data.data.entry.stopGroupings[0].stopGroups[1].id == "1") {
						directions[1] = {
							directionId: 1,
							destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
						};
					}
				}
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(directions);
		});

		return deferred.promise;
	};

	var getStops = function(route, direction) {
		var deferred = $q.defer();
		var stops = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/stops-on-route-for-direction?callback=JSON_CALLBACK", {
			cache: DSCacheFactory.get('dataCache'),
			params: {
				routeId: route,
				directionId: direction,
				key: API_KEY
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				stops = data.stops;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(stops);
		});

		return deferred.promise;
	};

	return {
		getStops: getStops,
		getDirections: getDirections,
		getPolylines: getPolylines
	};
})

.factory('GeolocationService', function($q, $http, httpTimeout, API_END_POINT, API_KEY) {

	var promiseCurrentPosition = function(geolocationOptions) {
		var deferred = $q.defer();
		navigator.geolocation.getCurrentPosition(
			function(position) {
				deferred.resolve(position);
			},
			function(error) {
				deferred.reject(error);
			},
			geolocationOptions
		);
		return deferred.promise;
	};

	var getRoutes = function(lat, lon) {
		var deferred = $q.defer();
		var routes = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/routes-for-location.json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY,
				lat: lat,
				lon: lon,
				radius: 200,
				includeReferences: false
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				routes = data.data.routes;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(routes);
		});

		return deferred.promise;
	};

	var getStops = function(lat, lon) {
		var deferred = $q.defer();
		var stops = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/stops-for-location.json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY,
				lat: lat,
				lon: lon,
				radius: 200
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				stops = data.data.stops;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(stops);
		});

		return deferred.promise;
	};

	return {
		promiseCurrentPosition: promiseCurrentPosition,
		getRoutes: getRoutes,
		getStops: getStops
	};
})

.factory('AtStopService', function($q, $http, httpTimeout, API_END_POINT, API_KEY) {
	var getBuses = function(params) {
		var stop;
		if (params.hasOwnProperty('stop')) {
			stop = params.stop;
		} else {
			stop = params;
		}

		var deferred = $q.defer();
		var buses = {
			arriving: {},
			alerts: "",
			responseTimestamp: ""
		};
		//for single line support
		var getParams = {
			key: API_KEY,
			OperatorRef: "MTA",
			MonitoringRef: stop
		};
		if (params.hasOwnProperty('line')) {
			getParams.LineRef = params.line;
		}

		var responsePromise = $http.jsonp(API_END_POINT + "api/siri/stop-monitoring.json?callback=JSON_CALLBACK", {
			params: getParams,
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				buses.responseTimestamp = data.Siri.ServiceDelivery.ResponseTimestamp;
				if (data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0) {
					var tmp = [];
					var grouped_tmp = [];
					var grouped = {};

					angular.forEach(data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit, function(value, key) {
						tmp.push({
							routeId: value.MonitoredVehicleJourney.LineRef,
							name: value.MonitoredVehicleJourney.PublishedLineName,
							distance: value.MonitoredVehicleJourney.MonitoredCall.Extensions.Distances.PresentableDistance,
							destination: value.MonitoredVehicleJourney.DestinationName,
							progress: value.MonitoredVehicleJourney.ProgressStatus,
							departsTerminal: value.MonitoredVehicleJourney.OriginAimedDepartureTime,
							expectedArrivalTime: value.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime
						});
					});

					grouped_tmp = _.groupBy(tmp, "routeId");

					angular.forEach(grouped_tmp, function(val, key) {
						var tmp = _.groupBy(val, "name");
						angular.forEach(tmp, function(v, k) {
							grouped[key] = {
								name: k,
								distances: v
							};
						});
					});
					buses.arriving = grouped;
				} else {
					// check for sched svc:
				}

				if (data.Siri.ServiceDelivery.SituationExchangeDelivery.length > 0) {
					var alerts = [];
					angular.forEach(data.Siri.ServiceDelivery.SituationExchangeDelivery[0].Situations, function(val, key) {
						angular.forEach(val, function(v, k) {
							alerts.push(v.Description);
						});
					});
					buses.alerts = alerts;
				}
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(buses);
		});

		return deferred.promise;
	};

	return {
		getBuses: getBuses
	};
})

.factory('StopcodeService', function($q, $http, httpTimeout, API_END_POINT, API_KEY) {
	var getRoutes = function(stop) {
		var deferred = $q.defer();
		var routes = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/stop/" + stop + ".json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				routes['stopId'] = data.data.id;
				routes['stopName'] = data.data.name;
				routes['routes'] = data.data.routes;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(routes);
		});

		return deferred.promise;
	};

	var getCoordinates = function(stop) {
		var deferred = $q.defer();
		var coordinates = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/where/stop/" + stop + ".json?callback=JSON_CALLBACK", {
			params: {
				key: API_KEY
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				coordinates['lat'] = data.data.lat;
				coordinates['lon'] = data.data.lon;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(coordinates);
		});

		return deferred.promise;
	};

	return {
		getRoutes: getRoutes,
		getCoordinates: getCoordinates
	};
})

.factory('SearchService', function($q, $http, httpTimeout, API_END_POINT, API_KEY) {
	var autocomplete = function(searchKey) {
		var deferred = $q.defer();
		var matches = [];

		var responsePromise = $http.jsonp(API_END_POINT + "api/autocomplete?callback=JSON_CALLBACK", {
			params: {
				term: searchKey
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				matches = data;
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(matches);
		});

		return deferred.promise;
	};

	var search = function(term) {
		var deferred = $q.defer();
		var matches = {};

		var responsePromise = $http.jsonp(API_END_POINT + "api/search?callback=JSON_CALLBACK", {
			params: {
				q: term
			},
			timeout: httpTimeout
		})
			.success(function(data, status, header, config) {
				if (data.searchResults.empty === false && data.searchResults.matches.length > 0) {
					var matchesData = data.searchResults.matches[0];
					switch (data.searchResults.resultType) {
						case "RouteResult":
							matches = {
								type: "RouteResult",
								shortName: matchesData.shortName,
								longName: matchesData.longName,
								id: matchesData.id,
								description: matchesData.description,
								directions: {}
							};

							if (matchesData.directions[0]) {
								if (matchesData.directions[0].directionId == "0") {
									matches.directions[0] = {
										destination: matchesData.directions[0].destination,
										directionId: matchesData.directions[0].directionId,
										hasUpcomingScheduledService: matchesData.directions[0].hasUpcomingScheduledService
									};
								}

								if (matchesData.directions[0].directionId == "1") {
									matches.directions[1] = {
										destination: matchesData.directions[0].destination,
										directionId: matchesData.directions[0].directionId,
										hasUpcomingScheduledService: matchesData.directions[0].hasUpcomingScheduledService
									};
								}
							}

							if (matchesData.directions[1]) {
								if (matchesData.directions[1].directionId == "0") {
									matches.directions[0] = {
										destination: matchesData.directions[1].destination,
										directionId: matchesData.directions[1].directionId,
										hasUpcomingScheduledService: matchesData.directions[1].hasUpcomingScheduledService
									};
								}

								if (matchesData.directions[1].directionId == "1") {
									matches.directions[1] = {
										destination: matchesData.directions[1].destination,
										directionId: matchesData.directions[1].directionId,
										hasUpcomingScheduledService: matchesData.directions[1].hasUpcomingScheduledService
									};
								}
							}
							break;
						case "StopResult":
							matches = {
								type: "StopResult",
								name: matchesData.name,
								id: matchesData.id
							};
							break;
						case "GeocodeResult":
							matches = {
								type: "GeocodeResult",
								formattedAddress: matchesData.formattedAddress,
								latitude: matchesData.latitude,
								longitude: matchesData.longitude
							};
							break;
						default:
							//console.log("undefined type");
					}
				}
			})
			.error(function(data, status, header, config) {
				//console.log('error');
			});

		responsePromise.then(function() {
			deferred.resolve(matches);
		});

		return deferred.promise;
	};

	return {
		autocomplete: autocomplete,
		search: search
	};
})

.factory('datetimeService', ['$timeout',
	function($timeout) {
		var duration = function(timeSpan) {
			var days = Math.floor(timeSpan / 86400000);
			var diff = timeSpan - days * 86400000;
			var hours = Math.floor(diff / 3600000);
			diff = diff - hours * 3600000;
			var minutes = Math.floor(diff / 60000);
			diff = diff - minutes * 60000;
			var secs = Math.floor(diff / 1000);
			return {
				'days': days,
				'hours': hours,
				'minutes': minutes,
				'seconds': secs
			};
		};

		function getRemainingTime(referenceTime) {
			var now = moment().utc();
			return moment(referenceTime) - now;
		}

		return {
			duration: duration,
			getRemainingTime: getRemainingTime
		};
	}
])

.factory('MapService', function(RouteService, VehicleMonitoringService, $filter, $q) {
	var getStopMarkers = function(route, stop) {
		stop = stop || null;
		var deferred = $q.defer();
		var markers = {};

		RouteService.getPolylines(route).then(function(res) {
			angular.forEach(res.stops, function(val, key) {
				markers['s' + key] = {
					lat: val.lat,
					lng: val.lon,
					icon: {
						iconUrl: 'img/stop_icons/stop.svg',
						iconSize: [20, 20]
					},
					focus: false,
					stopId: val.id,
					stopName: $filter('encodeStopName')(val.name)
				};

				if (stop == val.id && stop !== null) {
					markers['s' + key]['icon']['iconSize'] = [35, 35];
					markers['s' + key]['icon']['iconUrl'] = 'img/stop_icons/stop-red.svg';
				}
			});

			//console.log(markers);
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
			//console.log(paths);
			deferred.resolve(paths);
		});

		return deferred.promise;
	};

	var round5 = function round5(x) {
		return (x % 5) >= 2.5 ? parseInt(x / 5) * 5 + 5 : parseInt(x / 5) * 5;
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
						iconUrl: 'img/bus_icons/vehicle-' + ((round5(val.angle) == 360) ? 0 : round5(val.angle)) + '.png',
						iconSize: [51, 51]
					},
					focus: false,
					vehicleId: val.vehicleId,
					destination: val.destination,
					nextStop: val.stopPointName,
					zIndexOffset: 800
				};
			});
			//console.log(markers);
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
		return parseInt(d);
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
