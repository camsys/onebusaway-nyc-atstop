angular.module('filters', [])
.filter('durationView', ['datetimeService', function (datetime) {
    return function (input, css) {
        var duration = datetime.duration(input);
        return duration.minutes + " min";
    };
}]);
