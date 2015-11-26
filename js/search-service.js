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

angular.module('atstop.search.service', ['ionic', 'configuration'])

.factory('SearchesService', function($log, $q, $window) {
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
                $log.debug("undefined type");
                break;
        }
    };

    var fetchAll = function() {
        var deferred = $q.defer();
        deferred.resolve(Array.prototype.slice.call(JSON.parse($window.localStorage['searches'] || '[]')).reverse());
        return deferred.promise;
    };

    var clear = function() {
        $window.localStorage.removeItem("searches");
    };

    return {
        add: add,
        fetchAll: fetchAll,
        clear: clear
    };
});