/*jshint sub:true*/
//nothing
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

angular.module('atstop', [
 'atstop.about.controller','atstop.atstop.controller',
 'atstop.favorites.controller', 'atstop.gohome.controller', 'atstop.nearby.controller', 
 'atstop.route.controller', 'atstop.search.controller', 
 'atstop.datetime.service', 
 'atstop.favorites.service', 'atstop.geolocation.service', 'atstop.route.service',
  'atstop.search.service', 'atstop.vehicleMonitoring.service',
 'atstop.services', 'atstop.directives', 'leaflet-directive','ionic',
    'ngCordova', 'angular-cache', 'angular-inview', 'timer', 'angular-svg-round-progress', 'ngIOS9UIWebViewPatch', 'debounce'])

// global timeout variable for HTTP requests
.value('httpTimeout', 10000)

.constant('$ionicLoadingConfig', {
    template: '<ion-spinner></ion-spinner>',
    showBackdrop: false
})

.run(function($ionicPlatform, $ionicPopup, $cordovaNetwork) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }

        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        //checking if app is in cordova. Otherwise, don't worry about network connections.
        if (window.cordova && $cordovaNetwork.isOffline()) {
            $ionicPopup.alert({
                    title: "Internet Disconnected",
                    content: "Internet is not available on your device."
                })
                .then(function(result) {
                    if (result) {
                        ionic.Platform.exitApp();
                    }
                });
        }
    });
})

// use Angular Cache by default
.run(function($http, CacheFactory) {
  if (!CacheFactory.get('dataCache')) {
    $http.defaults.cache = CacheFactory('dataCache', {
        maxAge: 15 * 60 * 1000, // Items added to this cache expire after 15 minutes
        cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
        deleteOnExpire: 'aggressive' // Items will be deleted from this cache when they expire
    });
  }
})

.run(function($rootScope, $ionicHistory, $ionicLoading, $ionicPopup, $cordovaNetwork, $timeout) {

    // if 'loading:show' is broadcasted then show the loading indicator or hide if 'loading:hide' is broadcasted
    $rootScope.$on('loading:show', function() {
        $ionicLoading.show();
    });

    $rootScope.$on('loading:hide', function() {
        $ionicLoading.hide();
    });

    $rootScope.$on('requestRejection', function(obj, data) {
        $ionicLoading.hide();

        if (data.config.url.indexOf("autocomplete") == -1) {
            var popup = $ionicPopup.alert({
                title: "Error",
                content: "Something went wrong. Please check your internet connection."
            });
            $timeout(function() {
                popup.close();
            }, 2000);
        }

    });
})

.config(function($httpProvider, $ionicConfigProvider) {
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.tabs.position('bottom');

    if (ionic.Platform.isAndroid()) {
        $ionicConfigProvider.views.transition('none');
    }

    $httpProvider.interceptors.push(function($rootScope) {
        return {
            request: function(config) {
                $rootScope.$broadcast('loading:show');
                return config;
            },
            requestError: function(rejection) {
                $rootScope.$broadcast('requestRejection', rejection);
                return rejection;
            },
            response: function(response) {
                $rootScope.$broadcast('loading:hide');
                return response;
            },
            responseError: function(rejection) {
                $rootScope.$broadcast('requestRejection', rejection);
                return rejection;
            }
        };
    });
})

// use the logProvider instead of console.log
.config(function($logProvider){
  // you are developing on a Mac or Linux, right?? otherwise add some || here with your dev platforms
  var platform = ionic.Platform.platform();
  if (platform === 'macintel' || platform === 'linux'){
    $logProvider.debugEnabled(true);
  }
  else {
    $logProvider.debugEnabled(false);
  }

})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    // abstract state for the tabs
        .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
    })

    .state('tab.home', {
        url: '/home',
        cache: false,
        views: {
            'tab-home': {
                templateUrl: 'templates/tab-home.html',
                controller: 'SearchCtrl'
            }
        }
    })

    .state('tab.route', {
        url: '/route/:routeId/:routeName',
        views: {
            'tab-home': {
                templateUrl: 'templates/route.html',
                controller: 'RouteCtrl'
            }
        }
    })

    .state('tab.route-favorites', {
        url: '/route-favorites/:routeId/:routeName',
        views: {
            'tab-favorites': {
                templateUrl: 'templates/route.html',
                controller: 'RouteCtrl'
            }
        }
    })

    .state('tab.geolocation', {
        url: '/geolocation/:latitude/:longitude/:address',
        cache: false,
        views: {
            'tab-home': {
                templateUrl: 'templates/tab-nearby-stops-and-routes.html',
                controller: 'NearbyStopsAndRoutesCtrl'
            }
        }
    })

    .state('tab.atstop', {
        url: '/atstop/:stopId/:stopName',
        cache: false,
        views: {
            'tab-home': {
                templateUrl: 'templates/atstop.html',
                controller: 'AtStopCtrl'
            }
        }
    })

    .state('tab.map', {
        url: '/map/:routeId/:routeName/:stopId',
        cache: false,
        views: {
            'tab-home': {
                templateUrl: 'templates/map.html',
                controller: 'MapCtrl'
            }
        }
    })

    .state('tab.about', {
        url: '/about',
        views: {
            'tab-home': {
                templateUrl: 'templates/about.html',
                controller: 'AboutCtrl'
            }
        }
    })

    .state('tab.favorites', {
        url: '/favorites',
        cache: false,
        views: {
            'tab-favorites': {
                templateUrl: 'templates/tab-favorites.html',
                controller: 'FavoritesCtrl'
            }
        }
    })

    .state('tab.atstop-favorites', {
        url: '/atstop-favorites/:stopId/:stopName',
        cache: false,
        views: {
            'tab-favorites': {
                templateUrl: 'templates/atstop.html',
                controller: 'AtStopCtrl'
            }
        }
    })

    .state('tab.map-favorites', {
        url: '/map-favorites/:routeId/:routeName/:stopId',
        cache: false,
        views: {
            'tab-favorites': {
                templateUrl: 'templates/map.html',
                controller: 'MapCtrl'
            }
        }
    })

    .state('tab.nearby-stops-and-routes', {
        url: '/nearby-stops-and-routes',
        cache: false,
        views: {
            'tab-nearby-stops-and-routes': {
                templateUrl: 'templates/tab-nearby-stops-and-routes.html',
                controller: 'NearbyStopsAndRoutesCtrl'
            }
        }
    })

    .state('tab.atstop-gps', {
        url: '/atstop-gps/:stopId/:stopName',
        cache: false,
        views: {
            'tab-nearby-stops-and-routes': {
                templateUrl: 'templates/atstop.html',
                controller: 'AtStopCtrl'
            }
        }
    })

    .state('tab.map-gps', {
        url: '/map-gps/:routeId/:routeName/:stopId',
        cache: false,
        views: {
            'tab-nearby-stops-and-routes': {
                templateUrl: 'templates/map.html',
                controller: 'MapCtrl'
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/home');
});
