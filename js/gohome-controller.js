/*jshint sub:true*/
angular.module('atstop.gohome.controller', ['configuration'])

/**
 * @ngdoc controller
 * @description
 * Controller that makes tabs go to the root (cleaning Tab Histories)
 */
.controller('GoHomeCtrl', function($scope, $rootScope, $state, $ionicHistory) {
    var clearHistory = function() {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
    };

    $scope.goHomeTab = function() {
        clearHistory();
        $state.go('tab.home');
    };

    $scope.goFavsTab = function() {
        clearHistory();
        $state.go('tab.favorites');
    };
});