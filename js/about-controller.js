/*jshint sub:true*/
angular.module('atstop.about.controller', ['configuration', 'filters'])


/**
 * @ngdoc controller
 * @description
 * Controller that used for showing About Information from config.js
 * Also has morphed into a settings page
 */
.controller('AboutCtrl', ['$log', '$cordovaAppVersion', '$rootScope', '$scope',
 '$ionicScrollDelegate', 'PRIV_POLICY_TEXT', 'SHOW_BRANDING', 'BRAND_ABOUT_TEXT',
 
    function($log, $cordovaAppVersion, $rootScope, $scope, $ionicScrollDelegate,
    PRIV_POLICY_TEXT, SHOW_BRANDING, BRAND_ABOUT_TEXT) {

        $scope.data = {
            version: "1.2.0",
            showBranding: SHOW_BRANDING,
            hideText: true,
            brandAboutText: BRAND_ABOUT_TEXT,
            privText: PRIV_POLICY_TEXT
        };

        $scope.toggleText = function() {
            // resize the content since the Privacy Policy text is too big
            $ionicScrollDelegate.resize();
            $scope.data.hideText = !$scope.data.hideText;
        };

        var init = (function() {
            // get app version
            // Disabled because this causes unpredictable behaviour in iOS9
/*            document.addEventListener("deviceready", function () {
                $cordovaAppVersion.getVersionNumber().then(function(version) {
                    $scope.data.version = version;
                });
            });*/
        })();
    }
]);