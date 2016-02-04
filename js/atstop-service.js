/*jshint sub:true*/

/**
 * Copyright (c) 2015 Metropolitan Transportation Authority
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * @authors https://github.com/camsys/onebusaway-nyc-atstop/graphs/contributors
 */

angular.module('atstop.atstop.service', ['ionic', 'configuration'])

/**
 * Service for information about a particular stop
 * In this current incarnation, it is tailored to SIRI StopMonitoring, version 2
 * It is possible to refactor this to use another realtime API spec by changing parameters, URL, and responsePromise
 */
.factory('AtStopService', function($log, $q, $http, $filter, httpTimeout, CacheFactory, datetimeService, API_END_POINT, API_KEY) {

    if (!CacheFactory.get('atStopCache')) {
        CacheFactory('atStopCache', {
            maxAge: 10000, // Items added to this cache expire after 10s
            cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
            deleteOnExpire: 'aggressive' // Items will be deleted from this cache when they expire
        });
    }
        /**
         * core exposed function of this service
         * @param either a stop ID or an object of parameters including \{stop, sort\}
         * @returns {*} an object formatted for the V/VM
         */
    var getBuses = function(params) {
        var stop;
        if (params.hasOwnProperty('stop')) {
            stop = params.stop;
        } else {
            stop = params;
        }
        if (params.hasOwnProperty('sort')) {
            sort = params.sort;
        } else {
            sort = true;
        }

        var deferred = $q.defer();
        var buses = {
            arriving: {},
            alerts: "",
            responseTimestamp: "",
            stopId: stop
        };

        //for supporting queries of a single line (route) from the StopMonitoring API
        //TODO: abstract OperatorRef to config, possibly detailLevel as well
        var getParams = {
            key: API_KEY,
            OperatorRef: "MTA",
            MonitoringRef: stop,
            StopMonitoringDetailLevel: "basic",
            version: 2
        };
        if (params.hasOwnProperty('line')) {
            getParams.LineRef = params.line;
        }

        /**
         * inspect response for the presence of layovers and change the text to represent that
         * for another API this might not be necessary
         * @param results
         */
        var handleLayovers = function(results) {
            angular.forEach(results['arriving'], function(val, key) {
                //updates distances to an array of strings so that multi-line entries come out cleaner.
                angular.forEach(val['distances'], function(v, k) {
                    if (v['progress'] === 'prevTrip') {
                        v['distance'] = [v['distance'], "+ Scheduled Layover At Terminal"];
                    } else if (v['progress'] === 'layover,prevTrip') {
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

        /**
         * calculate time to arrival from clock times
         * @param results returned from this service
         */
        var updateArrivalTimes = function(results) {
            angular.forEach(results, function(val, key) {
                angular.forEach(val['distances'], function(v, k) {
                    v.arrivingIn = datetimeService.getRemainingTime(v.expectedArrivalTime);
                });
            });
        };

        /**
         * This is the meat of the return from this Service
         */
        var responsePromise = $http.jsonp(API_END_POINT + "api/siri/stop-monitoring.json?callback=JSON_CALLBACK", {
                params: getParams,
                timeout: httpTimeout,
                cache: CacheFactory.get('atStopCache')
            })
            .success(function(data, status, header, config) {
                buses.responseTimestamp = data.Siri.ServiceDelivery.ResponseTimestamp;
                if (data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0) {
                    var tmp = [];
                    var grouped_tmp = [];
                    var grouped = {};

                    angular.forEach(data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit, function(value, key) {
                        // SIRI V2 API JSON returns destination in an array :( Bug is filed.
                        var destination = value.MonitoredVehicleJourney.DestinationName;
                        var safeDestination = Array.isArray(destination) ? destination[0] : destination;

                        tmp.push({
                            routeId: value.MonitoredVehicleJourney.LineRef,
                            name: value.MonitoredVehicleJourney.PublishedLineName,
                            distance: value.MonitoredVehicleJourney.MonitoredCall.ArrivalProximityText,
                            destination: safeDestination,
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

                    handleLayovers(buses);
                    updateArrivalTimes(buses.arriving);


                } else {
                    // TODO: check for sched svc and return something else
                }

                if (data.Siri.ServiceDelivery.SituationExchangeDelivery.length > 0) {
                    var alerts = [];
                    angular.forEach(data.Siri.ServiceDelivery.SituationExchangeDelivery[0].Situations, function(val, key) {
                        angular.forEach(val, function(alert, k) {
                            description = alert.Description;
                            var safeDescription = $filter('alertsFilter')(description);

                            alerts.push(safeDescription);
                        });
                    });
                    buses.alerts = alerts;
                }
            })
            .error(function(data, status, header, config) {
                $log.debug('error');
            });

        responsePromise.then(function() {
            deferred.resolve(buses);
        });

        return deferred.promise;
    };

    return {
        getBuses: getBuses
    };
});