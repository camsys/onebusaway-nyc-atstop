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

angular.module('atstop.datetime.service', ['ionic', 'configuration'])

/**
 * helper functions for date and time
 */
.factory('datetimeService', ['$log', '$timeout',
    function($log, $timeout) {
        /**
         * get human readable duration between times
         * @param timeSpan
         * @returns {{days: number, hours: number, minutes: number, seconds: number}}
         */
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

        /**
         * get time between now and a time (hopefully in the future)
         * @param referenceTime a time (hopefully in the future)
         * @returns {number|*}
         */
        function getRemainingTime(referenceTime) {
            var now = moment().utc();
            var time = moment(referenceTime) - now;
            if (time < 0 ){
                time = 0;
            }
            return time;
        }

        return {
            duration: duration,
            getRemainingTime: getRemainingTime
        };
    }
]);