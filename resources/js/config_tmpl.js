/*global logger*/

/* config variables */
var config = {
    BTKey: "",
    radius: 200,
    logger: true,
    MaximumStopVisits: 15,
    MinimumStopVisitsPerLine: 2,
    TFToken: ""
};

/* enable or disable the logging */
(function () {
    if (config.logger === true) {
        logger.enableLogger();
    } else {
        logger.disableLogger();
    }
})();