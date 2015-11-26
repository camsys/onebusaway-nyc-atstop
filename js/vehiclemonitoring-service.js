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

angular.module('atstop.vehicleMonitoring.service', ['ionic', 'configuration'])

/**
 * Service for SIRI VehicleMonitoringService
 */
.factory('VehicleMonitoringService', function($log, $q, $http, httpTimeout, API_END_POINT, API_KEY) {
        /**
         * return locations for vehicles along a route
         * @param route fully qualified routeID
         * @returns {
            latitude
            longitude
            destination Descriptive destination, e.g. GTFS trip_headsign
            stopPointName
            vehicleId
            angle angle for vehicle display
         }
         */
    var getLocations = function(route) {
        var deferred = $q.defer();
        var locations = {};

        var responsePromise = $http.jsonp(API_END_POINT + "api/siri/vehicle-monitoring.json?callback=JSON_CALLBACK", {
                params: {
                    key: API_KEY,
                    LineRef: route,
                    version: 2,
                    VehicleMonitoringDetailLevel: "basic"
                },
                timeout: httpTimeout,
                cache: false
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
                $log.debug('error');
            });

        return deferred.promise;
    };

    return {
        getLocations: getLocations
    };
});