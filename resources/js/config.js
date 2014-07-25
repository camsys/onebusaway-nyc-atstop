/*global logger*/

/* config variables */
var config = {
	BTKey: "TEST",
	radius: 300,
	logger: true
};

/* enable or disable the logging */
(function () {
	if (config.logger === true) {
		logger.enableLogger();
	} else {
		logger.disableLogger();
	}
})();