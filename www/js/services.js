angular.module('starter.services', ['ionic', 'configuration'])

.factory('$localstorage', ['$window',
    function ($window) {
        return {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
}])


.factory('FavoritesService', function ($q, $window) {
    var add = function (stopId, stopName) {
        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        data[stopId] = {
            "stopId": stopId,
            "stopName": stopName
        };

        window.localStorage.setItem("favorites", JSON.stringify(data));
    };

    var remove = function (stopId) {
        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        delete data[stopId];
        window.localStorage.setItem("favorites", JSON.stringify(data));
    };

    var get = function () {
        var deferred = $q.defer();
        deferred.resolve(JSON.parse($window.localStorage.getItem("favorites") || '{}'));
        return deferred.promise;
    };

    var inFavorites = function (stopId) {
        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        return !(angular.isUndefined(data[stopId]) || data[stopId] === null);
    };

    return {
        add: add,
        remove: remove,
        get: get,
        inFavorites: inFavorites
    }
})

.factory('VehicleMonitoringService', function ($q, $http, API_END_POINT, API_KEY) {
    var getLocations = function (route) {
        var deferred = $q.defer();
        var locations = {};

        var url = API_END_POINT + "api/siri/vehicle-monitoring.json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY,
                    LineRef: route
                }
            })
            .success(function (data, status, header, config) {
                angular.forEach(data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity, function (val, key) {
                    locations[key] = {
                        latitude: val.MonitoredVehicleJourney.VehicleLocation.Latitude,
                        longitude: val.MonitoredVehicleJourney.VehicleLocation.Longitude,
                        destination: val.MonitoredVehicleJourney.DestinationName,
                        stopPointName: val.MonitoredVehicleJourney.MonitoredCall.StopPointName,
                        vehicleId: val.MonitoredVehicleJourney.VehicleRef.replace(/\D/g, ''),
                        angle: val.MonitoredVehicleJourney.Bearing
                    }
                });

                return deferred.resolve(locations);
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        return deferred.promise;
    };

    return {
        getLocations: getLocations
    }
})

.factory('RouteService', function ($q, $http, API_END_POINT, API_KEY) {

    var getPolylines = function (route) {
        var deferred = $q.defer();
        var results = {
            stops: {},
            polylines: []
        };

        var url = API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK";

        var responsePromise = $http.jsonp(url, {

                params: {
                    key: API_KEY,
                    version: 2,
                    includePolylines: true
                }
            })
            .success(function (data, status, header, config) {
                results.stops = data.data.references.stops;

                angular.forEach(data.data.entry.stopGroupings[0].stopGroups, function (val, key) {
                    angular.forEach(val.polylines, function (v, k) {
                        results.polylines.push(v.points);
                    });
                });

                return deferred.resolve(results);
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        return deferred.promise;
    };

    var getDirections = function (route) {
        var deferred = $q.defer();
        var directions = {};

        var url = API_END_POINT + "api/where/stops-for-route/" + route + ".json?callback=JSON_CALLBACK";

        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY,
                    version: 2,
                    includePolylines: false
                }
            })
            .success(function (data, status, header, config) {
                if (data.data.entry.stopGroupings[0].stopGroups[0]) {
                    if (data.data.entry.stopGroupings[0].stopGroups[0].id == "0") {
                        directions[0] = {
                            directionId: 0,
                            destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
                        }
                    }

                    if (data.data.entry.stopGroupings[0].stopGroups[0].id == "1") {
                        directions[1] = {
                            directionId: 1,
                            destination: data.data.entry.stopGroupings[0].stopGroups[0].name.name
                        }
                    }
                }

                if (data.data.entry.stopGroupings[0].stopGroups[1]) {
                    if (data.data.entry.stopGroupings[0].stopGroups[1].id == "0") {
                        directions[0] = {
                            directionId: 0,
                            destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
                        }
                    }

                    if (data.data.entry.stopGroupings[0].stopGroups[1].id == "1") {
                        directions[1] = {
                            directionId: 1,
                            destination: data.data.entry.stopGroupings[0].stopGroups[1].name.name
                        }
                    }
                }
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(directions);
        });

        return deferred.promise;
    }

    var getStops = function (route, direction) {
        var deferred = $q.defer();
        var stops = {};

        var url = API_END_POINT + "api/stops-on-route-for-direction?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    routeId: route,
                    directionId: direction,
                    key: API_KEY
                }
            })
            .success(function (data, status, header, config) {
                stops = data.stops;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(stops);
        });

        return deferred.promise;
    };

    return {
        getStops: getStops,
        getDirections: getDirections,
        getPolylines: getPolylines
    }
})

.factory('GeolocationService', function ($q, $http, API_END_POINT, API_KEY) {

    var promiseCurrentPosition = function (geolocationOptions) {
        var deferred = $q.defer();
        navigator.geolocation.getCurrentPosition(
            function (position) {
                deferred.resolve(position);
            },
            function (error) {
                deferred.reject(error);
            },
            geolocationOptions
        );
        return deferred.promise;
    }

    var getRoutes = function (lat, lon) {
        var deferred = $q.defer();
        var routes = {};

        var url = API_END_POINT + "api/where/routes-for-location.json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY,
                    lat: lat,
                    lon: lon,
                    radius: 300
                }
            })
            .success(function (data, status, header, config) {
                routes = data.data.routes;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(routes);
        });

        return deferred.promise;
    };

    var getStops = function (lat, lon) {
        var deferred = $q.defer();
        var stops = {};

        var url = API_END_POINT + "api/where/stops-for-location.json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY,
                    lat: lat,
                    lon: lon,
                    radius: 300
                }
            })
            .success(function (data, status, header, config) {
                stops = data.data.stops;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(stops);
        });

        return deferred.promise;
    };

    return {
        promiseCurrentPosition: promiseCurrentPosition,
        getRoutes: getRoutes,
        getStops: getStops
    }
})

.factory('AtStopService', function ($q, $http, API_END_POINT, API_KEY) {
    var getBuses = function (stop) {
        var deferred = $q.defer();
        var buses = {
            arriving: {},
            alerts: ""
        };

        var url = API_END_POINT + "api/siri/stop-monitoring.json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY,
                    OperatorRef: "MTA",
                    MonitoringRef: stop
                }
            })
            .success(function (data, status, header, config) {
                if (data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0) {
                    var tmp = [];
                    var grouped_tmp = [];
                    var grouped = {};
                    var counter = {};

                    angular.forEach(data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit, function (value, key) {
                        if (angular.isUndefined(counter[value.MonitoredVehicleJourney.LineRef]) || counter[value.MonitoredVehicleJourney.LineRef] == null) {
                            counter[value.MonitoredVehicleJourney.LineRef] = 1;
                        } else {
                            counter[value.MonitoredVehicleJourney.LineRef] += 1;
                        }

                        if (counter[value.MonitoredVehicleJourney.LineRef] < 4) {
                            tmp.push({
                                routeId: value.MonitoredVehicleJourney.LineRef,
                                name: value.MonitoredVehicleJourney.PublishedLineName,
                                distance: value.MonitoredVehicleJourney.MonitoredCall.Extensions.Distances.PresentableDistance,
                                destination: value.MonitoredVehicleJourney.DestinationName,
                                progress: value.MonitoredVehicleJourney.ProgressStatus,
                                departsTerminal: value.MonitoredVehicleJourney.OriginAimedDepartureTime,
                                expectedArrivalTime: value.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime
                            });
                        }
                    });

                    grouped_tmp = _.groupBy(tmp, "routeId");

                    angular.forEach(grouped_tmp, function (val, key) {
                        var tmp = _.groupBy(val, "name");
                        angular.forEach(tmp, function (v, k) {
                            grouped[key] = {
                                name: k,
                                distances: v
                            };
                        });
                    });
                    buses.arriving = grouped;
                }

                if (data.Siri.ServiceDelivery.SituationExchangeDelivery.length > 0) {
                    var alerts = [];
                    angular.forEach(data.Siri.ServiceDelivery.SituationExchangeDelivery[0].Situations, function (val, key) {
                        angular.forEach(val, function (v, k) {
                            alerts.push(v.Description);
                        });
                    });

                    buses.alerts = alerts;
                }
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(buses);
        });

        return deferred.promise;
    };

    return {
        getBuses: getBuses
    }
})

.factory('StopcodeService', function ($q, $http, API_END_POINT, API_KEY) {
    var getRoutes = function (stop) {
        var deferred = $q.defer();
        var routes = {};

        var url = API_END_POINT + "api/where/stop/" + stop + ".json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY
                }
            })
            .success(function (data, status, header, config) {
                routes['stopId'] = data.data.id;
                routes['stopName'] = data.data.name;
                routes['routes'] = data.data.routes;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(routes);
        });

        return deferred.promise;
    };

    var getCoordinates = function (stop) {
        var deferred = $q.defer();
        var coordinates = {};

        var url = API_END_POINT + "api/where/stop/" + stop + ".json?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    key: API_KEY
                }
            })
            .success(function (data, status, header, config) {
                coordinates['lat'] = data.data.lat;
                coordinates['lon'] = data.data.lon;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(coordinates);
        });

        return deferred.promise;
    };

    return {
        getRoutes: getRoutes,
        getCoordinates: getCoordinates
    }
})

.factory('SearchService', function ($q, $http, API_END_POINT, API_KEY) {
    var autocomplete = function (searchKey) {
        var deferred = $q.defer();
        var matches = [];

        searchKey = encodeURIComponent(searchKey);

        var url = API_END_POINT + "api/autocomplete?callback=JSON_CALLBACK";
        var responsePromise = $http.jsonp(url, {
                params: {
                    term: searchKey
                }
            })
            .success(function (data, status, header, config) {
                matches = data;
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(matches);
        });

        return deferred.promise;
    };

    var search = function (term) {
        var deferred = $q.defer();
        var matches = {};


        var url = API_END_POINT + "api/search?callback=JSON_CALLBACK";

        var responsePromise = $http.jsonp(url, {
                params: {
                    q: term
                }
            })
            .success(function (data, status, header, config) {
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
                        }
                        break;
                    default:
                        console.log("undefined type");
                    }
                }
            })
            .error(function (data, status, header, config) {
                console.log('error');
            });

        responsePromise.then(function () {
            deferred.resolve(matches);
        });

        return deferred.promise;
    };

    return {
        autocomplete: autocomplete,
        search: search
    }
})
    .factory('datetimeService', ['$timeout',
        function ($timeout) {
            var duration = function (timeSpan) {
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
    }]);