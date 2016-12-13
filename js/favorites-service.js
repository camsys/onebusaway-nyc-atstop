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

angular.module('atstop.favorites.service', ['ionic', 'configuration','lokijs'])

.factory('FavoritesService', function($log, $q, $window, Loki) {

    var favorites;
    var db;

    var initDB = function() {            
        var fsAdapter = new LokiCordovaFSAdapter({"prefix": "loki"});  
        //db = new Loki('loki.json')
        db = new Loki('favoritesDB',
                {
                    autosave: true,
                    autosaveInterval: 1000, // 1 second
                    adapter: fsAdapter
                });
    };

    var options = {  
    favorites: {
        proto: Object,
        inflate: function (src, dst) {
            var prop;
            for (prop in src) {
                if (prop === 'Date') {
                    dst.Date = new Date(src.Date);
                } else {
                    dst[prop] = src[prop];
                }
            }
        }
        }
    };

    var get = function() {
        var deferred = $q.defer();

        db.loadDatabase(options, function(){
            favorites = db.getCollection('favorites');
           
            if (!favorites)
                favorites = db.addCollection('favorites');

            deferred.resolve(favorites.data);
            //return deferred.promise;
        });
        // deferred.resolve(JSON.parse($window.localStorage.getItem("favorites") || '{}'));
        return deferred.promise;

    };

    var add = function(id, name, type) {
        // if type is not passed in, assume it is a stop. 
        type = type || 'S';

        //Route Maps and Routes would share a key and collide, so instead set the display ID/name.
        var dispId = id.replace('MAP', '');
        //favoriteCount = Object.keys(data).length++;
        var  data = {
            id: id,
            name: name,
            type: type
                //"order": favoriteCount
        };


        
        if (!favorites){
            favorites = db.addCollection('favorites');
        }
        
        favorites.insert(data);
        
        //var data = JSON.parse($window.localStorage['favorites'] || '{}');
        // favoriteCount exists in case a future version lets users reorder favorites.
        // This is also the reason that different types of favs are all in one object in LocalStorage.
        //var favoriteCount = JSON.parse($window.localStorage['favoriteCount'] || '0');

        //$window.localStorage.setItem("favoriteCount", JSON.stringify(favoriteCount));
        //$window.localStorage.setItem("favorites", JSON.stringify(data));
    };

    var remove = function(favorite) {
        if (!favorites){
            if (!db)
                initDB();
            favorites = db.getCollection('favorites');
        }
        // //var fav = favorites.find({id:favorite.id});
        // if (fav && fav.length){
            favorites.remove(favorite);
        //}
        
    };

    var inFavorites = function(data) {
        if (!db){
            initDB();
        }

        if (!favorites){
            favorites = get().then(function(results){
                if (results.length > 0){
                    searchForFav = favorites.find({'id': data.id});
                    if (searchForFav.length > 0)
                        return true;
                }
            });
        }
            
        return false;

        // id = id || '';
        // var data = JSON.parse($window.localStorage['favorites'] || '{}');
        // return !(angular.isUndefined(data[id]) || data[id] === null);
    };

    return {
        initDB: initDB,
        get: get,
        add: add,
        remove: remove,
        inFavorites: inFavorites
    };
});

