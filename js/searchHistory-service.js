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

angular.module('atstop.searchHistory.service', ['ionic', 'configuration', 'lokijs'])

.factory('SearchHistoryService', function($log, $q, $window, Loki) {

    var searchHistory;
    var db;

    var initDB = function(){
        var fsAdapter = new LokiCordovaFSAdapter({"prefix":"loki"});
        db = new Loki('searchHistoryDB', {
                autosave: true,
                autosaveInterval : 1000,
                adapter: fsAdapter,
                autoupdate: true
        });
    };
 

    var insert = function(term, title, data) {
        var termArray = term.split("_");
        term = termArray[termArray.length - 1];

        $log.debug(termArray);

        var data = {
            term: term,
            title: title,
            data: data
        };
        if (inSearchHistory(data))
            return;
        if (!searchHistory){
            searchHistory = db.addCollection('searchHistory');
        }
        searchHistory.insert(data);

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
    var options = {  
    searchHistory: {
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

    var fetchAll = function() {
        var deferred = $q.defer();

        db.loadDatabase(options, function(){
            searchHistory = db.getCollection('searchHistory');
           
            if (!searchHistory)
                searchHistory = db.addCollection('searchHistory');

            deferred.resolve(searchHistory.data);
        });
        return deferred.promise;
    };

    var clear = function() {
        if (!db){
            initDB();
        }
        searchHistoryCollect = db.getCollection('searchHistory');
        if (searchHistory != null)
            searchHistory.clear();
        db.saveDatabase();

    };

    var inSearchHistory = function(data) {
        if (!db){
            initDB();
        }

        var history = {};

        if (!searchHistory){
            fetchHistory = fetchAll().then(function(results){
                 history = results;
            });
        }else{
            history = searchHistory;
        }
        if (history.data){
            numSearchHist =  history.data.length;
            for (var i=0; i<numSearchHist; i++){
                if (data.term == history.data[i].term) 
                    return true;
            }
            return false;
        }
        else 
            return false;
    };


    return {
        initDB: initDB,
        add: add,
        fetchAll: fetchAll,
        clear: clear
    };
});