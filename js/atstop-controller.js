/*jshint sub:true*/
angular.module('atstop.atstop.controller', ['configuration', 'filters'])
/**
 * @ngdoc controller
 * @description
 * Controller used for showing upcoming vehicles for specific stop.
 */
.controller('AtStopCtrl', ['$log', '$ionicScrollDelegate', '$scope', 'AtStopService', '$stateParams', '$q', '$ionicLoading', 'FavoritesService', '$timeout', '$filter', 'datetimeService', '$interval', '$location',
    function($log, $ionicScrollDelegate, $scope, AtStopService, $stateParams, $q, $ionicLoading, FavoritesService, $timeout, $filter, datetimeService, $interval, $location) {
        $scope.data = {
            "link": "map",
            "alerts": "",
            "responseTime": "",
            "loaded": false,
            "favClass": "",
            "results": [],
            "stopName": $stateParams.stopName,
            "notifications": '',
            "alertsHide": false,
            "alertsToggle": false,
            "stopId": $stateParams.stopId,
            "tips": "Pull down for instant refresh."
        };

        $scope.toggleFavorites = function() {
            if (FavoritesService.inFavorites($scope.data.stopId)) {
                FavoritesService.remove($scope.data.stopId);
                $scope.data.favClass = "";
            } else {
                FavoritesService.add($scope.data.stopId, $scope.data.stopName);
                $scope.data.favClass = "button-energized";
            }
        };

        var getBuses = function() {
            var busesDefer = $q.defer();
            AtStopService.getBuses($scope.data.stopId).then(function(results) {
                if (!angular.equals({}, results.arriving)) {
                    $scope.data.responseTime = $filter('date')(results.responseTimestamp, 'shortTime');
                    $scope.data.results = results.arriving;
                    $scope.data.notifications = "";
                } else {
                    $scope.data.results = "";
                    $scope.data.notifications = "We are not tracking any buses to this stop at this time. Check back later for an update.";
                }

                if (results.alerts.length > 0) {
                    $scope.data.alertsHide = true;
                    $scope.data.alerts = results.alerts;
                    $log.debug($scope.data.alerts);
                } else {
                    $scope.data.alertsHide = false;
                }
                busesDefer.resolve();
            });

            busesDefer.promise.then(function() {
                $scope.data.loaded = true;
            });
        };

        $scope.refresh = function() {
            // restart 'refresh' timer
            $interval.cancel($scope.reloadTimeout);
            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.toggleAlerts = function() {
            $scope.data.alertsToggle = !$scope.data.alertsToggle;
            $ionicScrollDelegate.resize();
        };

        $scope.$on('$destroy', function() {
            if ($scope.reloadTimeout) {
                $interval.cancel($scope.reloadTimeout);
            }
        });

        var init = (function() {
            if ($location.$$path.indexOf("atstop-favorites") > -1) {
                $scope.data.link = "map-favorites";
            } else if ($location.$$path.indexOf("atstop-gps") > -1) {
                $scope.data.link = "map-gps";
            }

            if (FavoritesService.inFavorites($scope.data.stopId)) {
                $scope.data.favClass = "button-energized";
            } else {
                $scope.data.favClass = "";
            }

            getBuses();
            $scope.reloadTimeout = $interval(getBuses, 35000);
        })();
    }
]);