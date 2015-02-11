angular.module('configuration', [])
	.constant('MAP_TILES', 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png')
	.constant('MAP_ATTRS', 'Map:<a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data:<a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.')
    .constant('API_END_POINT','')
    .constant('API_KEY','')
    .constant('MAPBOX_KEY','')
    .constant('SHOW_BRANDING', false)
    .constant('exampleSearches',
        {  'exampleRoutes':  [],
        'exampleStops': [],
        'exampleIntersections': []})
;