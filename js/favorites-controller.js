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

angular.module('atstop.favorites.controller', ['configuration', 'filters'])
    /**
     * @ngdoc controller
     * @description
     * Controller used for showing favorites.
     */
    .controller('FavoritesCtrl', ['$log', '$scope', '$ionicLoading', 'FavoritesService', '$q', 'SHOW_BRANDING',
        function($log, $scope, $ionicLoading, FavoritesService, $q, SHOW_BRANDING) {
            $scope.data = {
                "loaded": false,
                "notifications": '',
                "showBranding": SHOW_BRANDING
            };

            $scope.remove = function(id) {
                console.log(id);
                $log.debug(id);
                FavoritesService.remove(id);
                get();
            };

            var get = function() {
                $scope.data.favoriteRoutes = [];
                $scope.data.favoriteStops = [];
                $scope.data.favoriteRouteMaps = [];
                var favoritesDefer = $q.defer();

                FavoritesService.get().then(function(results) {
                    if (Object.keys(results).length === 0) {
                        $scope.data.notifications = "You have not added any favorites. You can add favorites by clicking the star icon on routes, favorites, or maps.";
                    } else if (!angular.isUndefined(results) && results !== null) {
                        angular.forEach(results, function(value) {
                            if (value.type === 'R') {
                                $scope.data.favoriteRoutes.push(value);
                            } else if (value.type === 'RM') {
                                $scope.data.favoriteRouteMaps.push(value);
                            } else {
                                $scope.data.favoriteStops.push(value);
                            }
                        });
                        $scope.data.notifications = "";
                    }
                    favoritesDefer.resolve();
                });

                favoritesDefer.promise.then(function() {
                    $scope.data.loaded = true;
                });
            };

            var init = (function() {
                get();
            })();
        }
    ]);