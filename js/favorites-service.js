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

.factory('FavoritesService', function($log, $q, $window, Loki, $rootScope) {
    var favorites;
    var db;

    var initDB = function() {            
        var fsAdapter = new LokiCordovaFSAdapter({"prefix": "loki"});  
        //db = new Loki('loki.json')
        db = new Loki('favoritesDB',
                {
                    autosave: true,
                    autosaveInterval: 1000, // 1 second
                    adapter: fsAdapter,
                    autoupdate: true
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
        if (!db){
            initDB();
        }

        db.loadDatabase(options, function(){
            favorites = db.getCollection('favorites');
           
            if (!favorites)
                favorites = db.addCollection('favorites');

            deferred.resolve(favorites.data);
        });
        return deferred.promise;
    };

    var add = function(id, name, type) {
        // if type is not passed in, assume it is a stop. 
        type = type || 'S';

        //Route Maps and Routes would share a key and collide, so instead set the display ID/name.
        //var dispId = id.replace('MAP', '');
        if (type === "RM")
            id = id.replace('MAP', '');
        //favoriteCount = Object.keys(data).length++;
        var  data = {
            id: id,
            name: name,
            type: type
        };
         if (!db){
            initDB();
        }

        if (!favorites){
            favorites = db.addCollection('favorites');
        }
        $rootScope.newFavoriteCount += 1; 
        favorites.insert(data);
        return true;
    };

    var remove = function(data) {
        if (!db){
            initDB();
        }

        var updatedFavorites = [];

        favoritesCollect = db.getCollection('favorites');

        if (favoritesCollect != null && favoritesCollect.count() > 0){
            var numFavorites = favoritesCollect.count();

            for (var i=1; i<=numFavorites; i++){
                 var collectionDoc = favoritesCollect.get(i);
                 if (collectionDoc.id != data.id)
                    updatedFavorites.push (collectionDoc);
            }
        }
        if (favorites != null) //needed to simulate test
        favorites.clear();

        for (var i=0; i<updatedFavorites.length; i++){
             favorites.insert({ 'id':updatedFavorites[i].id, 
                                'name':updatedFavorites[i].name,
                                'type':updatedFavorites[i].type 
             });
         }
         db.saveDatabase();
         return true;
    };

    var inFavorites = function(data) {
        if (!db){
            initDB();
        }

        var fav = {};

        if (!favorites){
            fetchFav = get().then(function(results){
                 fav = results;
            });
           
        }else{
            fav = favorites;
        }

        if (fav.data){
            numFavorites =  fav.data.length;
            for (var i=0; i<numFavorites; i++){
                if (data.id == fav.data[i].id) //fav exists
                    return true;
            }
            return false;
        }
        else 
            return false;
    };

    return {
        initDB: initDB,
        get: get,
        add: add,
        remove: remove,
        inFavorites: inFavorites
    };
});

