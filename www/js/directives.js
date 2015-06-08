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

angular.module('atstop.directives', [])

.directive('ngTips', function($timeout, $rootScope) {
    $rootScope.tipCt = 0;
    return {
        restrict: 'E',
        replace: true,
        scope: {
            ngModel: '='
        },
        template: '<div class="tips">{{ngModel}}</div>',
        link: function(scope, element, attrs) {
            $rootScope.tipCt = ++$rootScope.tipCt;
            //only show tips a few times after app load
            if (scope.$root.tipCt < 3) {
                var to = $timeout(function() {
                    element.remove();
                }, 3000);

                scope.$on("$destroy", function() {
                    $timeout.cancel(to);
                });
            } else {
                element.remove();
            }
        }
    };
})

.directive('appHeader', function() {
    return {
        restrict: 'E',
        scope: {},
        template: '<div style="padding-bottom: -100%; position: relative; text-align: center"><img src="img/logo.svg" style="width: 90%; height: auto;"> </div>'
    };
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
});
