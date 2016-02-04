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

angular.module('atstop.favorites.service', ['ionic', 'configuration'])

.factory('FavoritesService', function($log, $q, $window) {
    var add = function(id, name, type) {
        // if type is not passed in, assume it is a stop. 
        type = type || 'S';

        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        // favoriteCount exists in case a future version lets users reorder favorites.
        // This is also the reason that different types of favs are all in one object in LocalStorage.
        //var favoriteCount = JSON.parse($window.localStorage['favoriteCount'] || '0');

        //Route Maps and Routes would share a key and collide, so instead set the display ID/name.
        var dispId = id.replace('MAP', '');

        //favoriteCount = Object.keys(data).length++;

        data[id] = {
            "id": dispId,
            "name": name,
            "type": type
                //"order": favoriteCount
        };
        //$window.localStorage.setItem("favoriteCount", JSON.stringify(favoriteCount));
        $window.localStorage.setItem("favorites", JSON.stringify(data));
    };

    var remove = function(id) {
        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        delete data[id];
        $window.localStorage.setItem("favorites", JSON.stringify(data));
    };

    var get = function() {
        var deferred = $q.defer();
        deferred.resolve(JSON.parse($window.localStorage.getItem("favorites") || '{}'));
        return deferred.promise;
    };

    var inFavorites = function(id) {
        id = id || '';
        var data = JSON.parse($window.localStorage['favorites'] || '{}');
        return !(angular.isUndefined(data[id]) || data[id] === null);
    };

    return {
        add: add,
        remove: remove,
        get: get,
        inFavorites: inFavorites
    };
});