angular.module('atstop.search.controller', ['configuration', 'filters'])

/**
* @ngdoc controller
 * @description
 * Controller used for searching using autocomplete API.
 */
.controller('SearchCtrl', ['$log','$rootScope', '$scope', '$location', 'SearchService', '$filter', '$ionicLoading', 'RouteService', '$ionicPopup', '$ionicPlatform', 'SearchesService', 'SHOW_BRANDING', '$ionicTabsDelegate',
    function($log, $rootScope, $scope, $location, SearchService, $filter, $ionicLoading, RouteService, $ionicPopup, $ionicPlatform, SearchesService, SHOW_BRANDING,  $ionicTabsDelegate) {

        $scope.go = function(path) {
            $location.path(path);
        };

        $scope.data = {
            "results": [],
            "searchKey": '',
            "notifications": '',
            exampleRoutes: [
                "Bx1", "M15-SBS", "Q58"
            ],
            exampleStops: [
                "200460", "308215", "502030"
            ],
            exampleIntersections: [
                "Main Street & Kissena Bl"
            ],
            "searches": [],
            "showSearches": true,
            "showDefaultTips": true,
            "showBranding": SHOW_BRANDING
        };

        /**
        * @function autocomplete
        * @
        **/

        $scope.autocomplete = function() {
            if ($scope.data.searchKey.length > 0) {
                SearchService.autocomplete($scope.data.searchKey).then(
                    function(matches) {
                        if (!angular.isUndefined(matches) && matches !== null && matches.length > 0) {
                            $scope.data.results = matches;
                            $scope.data.notifications = "";
                        } else {
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                        }
                    }
                );
            } else {
                $scope.data.results = [];
                $scope.data.notifications = "";
            }
        };

        // set no sched svc message.
        /**
         * logic for settng no scheduled service message based on response of type route.
         * @param  {Object} matches [description]
         */
        var handleRouteSearch = function(matches) {
            // console.log(Object.keys(matches.directions).length);
              $log.debug(matches);
            if (Object.keys(matches.directions).length > 1) {
                // if one direction with no service-- handle on route/stop page.
                if (matches.directions[0].hasUpcomingScheduledService || matches.directions[1].hasUpcomingScheduledService) {
                    $log.debug('service in both directions');
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else if (!matches.directions[0].hasUpcomingScheduledService && !matches.directions[1].hasUpcomingScheduledService) {
                    $log.debug('no service in both directions');
                    noSchedService(matches.shortName);
                } else {

                }
            } else {
                if (matches.directions[0].hasUpcomingScheduledService) {
                    $log.debug('1direction with service');
                    $scope.go("/tab/route/" + matches.id + '/' + matches.shortName);
                } else {
                    $log.debug('1direction with no service');
                    noSchedService(matches.shortName);
                }
            }
        };

        var noSchedService = function(routeDirection) {
            $scope.data.notifications = "There is no scheduled service on this route at this time.";
        };
/**
 * enter searches if only one autocomplete result is returned.
 * @param  {String} term [description]

 */
        $scope.searchAndGo = function(term) {
            // for search page, enter searches if only one autocomplete result is returned.
            //
            if ($scope.data.results.length === 1) {
                term = $scope.data.results[0];
            }

            SearchService.search(term).then(
                function(matches) {
                    SearchesService.add(matches);
                    switch (matches.type) {
                        case "RouteResult":
                            handleRouteSearch(matches);
                            break;
                        case "StopResult":
                            $scope.go("/tab/atstop/" + matches.id + '/' + $filter('encodeStopName')(matches.name));
                            break;
                        case "GeocodeResult":
                            $scope.go("/tab/geolocation/" + matches.latitude + '/' + matches.longitude + '/' + matches.formattedAddress);
                            break;
                        default:
                            $scope.data.results = [];
                            $scope.data.notifications = "No matches";
                            //console.log("undefined type");
                            $log.debug("undefined type");
                            break;
                    }
                }
            );
        };

        /**
         * clear previous searches array
         */
        $scope.clearSearches = function() {
            SearchesService.clear();
            $scope.data.searches = [];
            $scope.data.showSearches = false;
            $scope.data.showDefaultTips = true;
        };

        /**
         * Initialize and grab previously stored searches.
         */
        var init = (function() {

            SearchesService.fetchAll().then(function(results) {
                if (results.length > 0) {
                    $scope.data.searches = results;
                    $scope.data.showSearches = true;
                    $scope.data.showDefaultTips = false;
                } else {
                    $scope.data.searches = [];
                    $scope.data.showSearches = false;
                }
            });
        })();
    }
]);