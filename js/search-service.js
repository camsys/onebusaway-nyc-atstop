/**
 * Created by tonylaidig on 12/10/15.
 */
angular.module('atstop.search.service', ['ionic', 'configuration'])
.factory('SearchService', function($log, $q, $http, httpTimeout, API_END_POINT, API_KEY) {
    /**
     * Autocomplete
     * @param searchKey text entered in
     * @returns {*} array of results
     */
    var autocomplete = function(searchKey) {
        var deferred = $q.defer();
        var matches = [];

        var responsePromise = $http.jsonp(API_END_POINT + "api/autocomplete?callback=JSON_CALLBACK", {
                params: {
                    term: searchKey
                },
                cache: true,
                timeout: httpTimeout
            })
            .success(function(data, status, header, config) {
                matches = data;
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        responsePromise.then(function() {
            deferred.resolve(matches);
        });

        return deferred.promise;
    };
    /**
     * search!
     * @param term Term to search for
     * @returns {*} appropriately formatter result-- Route, Stop, or Geolocation
     */
    var search = function(term) {
        var deferred = $q.defer();
        var matches = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/search?callback=JSON_CALLBACK", {
                params: {
                    q: term
                },
                cache: true,
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
                            //might be able to simplify this with an angular.sort on what is returned.
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
                            $log.debug("undefined type");
                    }
                }
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
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