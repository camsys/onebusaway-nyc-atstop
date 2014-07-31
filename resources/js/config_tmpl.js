/*global logger*/

/* config variables */
var config = {
    BTKey: "",
    radius: 300,
    logger: true,
    MaximumStopVisits: 20,
    MinimumStopVisitsPerLine: 2
};

/* enable or disable the logging */
(function () {
    if (config.logger === true) {
        logger.enableLogger();
    } else {
        logger.disableLogger();
    }
})();