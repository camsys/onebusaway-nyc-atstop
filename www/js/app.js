angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'leaflet-directive', 'ngCordova', 'pasvaz.bindonce', 'angular-data.DSCacheFactory'])

// global timeout variable
.value('httpTimeout', 5000)

.run(function($rootScope, $ionicPlatform, $ionicPopup, $cordovaNetwork) {
	$ionicPlatform.ready(function() {
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			StatusBar.styleDefault();
		}
		if ($cordovaNetwork.isOffline()) {
			$ionicPopup.alert({
				title: "Internet Disconnected",
				content: "The internet is not available on your device."
			})
				.then(function(result) {
					if (result) {
						ionic.Platform.exitApp();
					}
				});
		}
	});
})

.config(function($httpProvider) {
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
		}
	})
})


.run(function($rootScope, $ionicLoading, $ionicPopup, $cordovaNetwork) {
	$rootScope.$on('loading:show', function() {
		$ionicLoading.show({
			template: 'Loading',
			showBackdrop: false
		})
	});

	$rootScope.$on('loading:hide', function() {
		$ionicLoading.hide()
	});

	$rootScope.$on('requestRejection', function(obj, data) {
		$ionicLoading.hide();

		if (data.config.url.indexOf("autocomplete") == -1) {
			$ionicPopup.alert({
				title: "Error",
				content: "Something went wrong. Please check your internet connection."
			})
				.then(function(result) {
					if (result) {
						// ionic.Platform.exitApp();
					}
				});
		}
	});
})


.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider

	.state('tab', {
		url: "/tab",
		abstract: true,
		templateUrl: "templates/tabs.html"
	})

	.state('tab.home', {
		url: '/home',
		views: {
			'tab-home': {
				templateUrl: 'templates/tab-home.html',
				controller: 'SearchCtrl'
			}
		}
	})

	.state('tab.favorites', {
		url: '/favorites',
		views: {
			'tab-favorites': {
				templateUrl: 'templates/tab-favorites.html',
				controller: 'FavoritesCtrl'
			}
		}
	})

	.state('tab.nearby-stops-and-routes', {
		url: '/nearby-stops-and-routes',
		views: {
			'tab-nearby-stops-and-routes': {
				templateUrl: 'templates/tab-nearby-stops-and-routes.html',
				controller: 'NearbyStopsAndRoutesCtrl'
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

	.state('tab.geolocation', {
		url: '/geolocation/:latitude/:longitude/:address',
		views: {
			'tab-home': {
				templateUrl: 'templates/tab-nearby-stops-and-routes.html',
				controller: 'NearbyStopsAndRoutesCtrl'
			}
		}
	})

	.state('tab.stopcode', {
		url: '/stopcode/:stopId',
		views: {
			'tab-home': {
				templateUrl: 'templates/stopcode.html',
				controller: 'StopcodeCtrl'
			}
		}
	})

	.state('tab.atstop', {
		url: '/atstop/:stopId/:stopName',
		views: {
			'tab-home': {
				templateUrl: 'templates/atstop.html',
				controller: 'AtStopCtrl'
			}
		}
	})

	.state('tab.atstop-favorites', {
		url: '/atstop-favorites/:stopId/:stopName',
		views: {
			'tab-favorites': {
				templateUrl: 'templates/atstop.html',
				controller: 'AtStopCtrl'
			}
		}
	})

	.state('tab.map', {
		url: '/map/:routeId/:stopId',
		views: {
			'tab-home': {
				templateUrl: 'templates/map.html',
				controller: 'MapCtrl'
			}
		}
	})

	.state('tab.map-favorites', {
		url: '/map-favorites/:routeId/:stopId',
		views: {
			'tab-favorites': {
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

	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/tab/home');

});
