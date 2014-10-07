angular.module('filters', [])
.filter('durationView', ['datetimeService', function (datetime) {
    return function (input, css) {
        var duration = datetime.duration(input);
        var displayTime = '';
        if (duration.minutes > 0){
            displayTime = duration.minutes + " min";
        }
        return displayTime;
    };
}]);
