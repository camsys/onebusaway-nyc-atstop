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
