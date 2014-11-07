angular.module('filters', [])

.filter('isUndefinedOrEmpty', function () {
    return function (a) {
        //console.log('Filter result: ' + a);
        return angular.isUndefined(a) || null === a;
    }
})

.filter('isEmptyObject', function () {
    var bar;
    return function (obj) {
        for (bar in obj) {
            if (obj.hasOwnProperty(bar)) {
                return false;
            }
        }
        return true;
    };
})

.filter('encodeStopName', function () {
    return function (input) {
        return input.replace("/", " & ");
    }
})

.filter('encode', function () {
    return function (input) {
        return encodeURIComponent(input);
    };
})

.filter('decode', function () {
    return function (input) {
        return decodeURIComponent(input);
    }
})

.filter('durationView', ['datetimeService',
    function (datetime) {
        return function (input) {
            var duration = datetime.duration(input);
            var displayTime = '';

            if (duration.minutes > 0) {
                displayTime = duration.minutes + " min";
            }
            return displayTime;
        };
}]);