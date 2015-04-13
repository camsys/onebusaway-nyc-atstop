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

angular.module('filters', [])

// modify a link to open URL in a device's browser
.filter('hrefToJS', function($sce, $sanitize) {
	return function(text) {
		return $sce.trustAsHtml($sanitize(text).replace(/href="([\S]+)"/g, "onClick=\"window.open('$1', '_system', 'location=yes')\""));
	};
})

.filter('isUndefinedOrEmpty', function() {
	return function(a) {
		return angular.isUndefined(a) || null === a;
	};
})

.filter('isEmptyObject', function() {
	var bar;
	return function(obj) {
		for (bar in obj) {
			if (obj.hasOwnProperty(bar)) {
				return false;
			}
		}
		return true;
	};
})

.filter('encodeStopName', function() {
	return function(input) {
        input = input || '';
        return input.replace("/", " & ");
	};
})

.filter('encode', function() {
	return function(input) {
		return encodeURIComponent(input);
	};
})

.filter('decode', function() {
	return function(input) {
		return decodeURIComponent(input);
	};
})

// always round down to nearest min, do not show time if less than 1 minute away
.filter('durationView', ['datetimeService',
	function(datetimeService) {
		return function(input) {
			var duration = datetimeService.duration(input);
			var minutes = duration.minutes;
			var displayTime = '';
			if (duration.hours > 0) {
				minutes = minutes + duration.hours * 60;
			}
			if (duration.minutes > 0) {
				displayTime = minutes + " min";
			}
			return displayTime;
		};
	}
]);
