ngDescribe({
    name: 'SearchHistory',
    modules: 'atstop',
    inject: 'SearchHistoryService',
    tests: function(deps) {
        // this guy errors out in bulk, but passes on its own
        //it('should add geocodes to the recent list', function(){
        //    var aGeocode = {
        //        "type": "GeocodeResult",
        //        "latitude": 10.00,
        //        "longitude": 10.00,
        //        "formattedAddress": "10 Downing Street"
        //    };
        //    deps.SearchHistoryService.add(aGeocode);
        //    deps.SearchHistoryService.fetchAll().then(function(results){
        //        expect(results.length() > 0);
        //        expect(results[2] === aGeocode);
        //    });
        //});

        it('should add routes to the recent list', function(){
            var aRoute = {
                "type": "RouteResult",
                "id": "1234",
                "shortName": "1234"
            };
            deps.SearchHistoryService.add(aRoute);
            deps.SearchHistoryService.fetchAll().then(function(results){
                expect(results[0] === aRoute);
                expect(results.length() > 0);
            });
        });

        it('should add stops to the recent list', function(){
            var aStop = {
                "type": "StopResult",
                "id": "1234",
                "Name": "1234 Main St"
            };
            deps.SearchHistoryService.add(aStop);
            deps.SearchHistoryService.fetchAll().then(function(results){
                expect(results.length() > 0);
                expect(results[1] === aStop);
            });
        });

        it('should cap size of recent list', function(){
            var aRoute = {
                "type": "RouteResult",
                "id": "1234",
                "shortName": "1234"
            };
            deps.SearchHistoryService.add(aRoute);

            var aStop = {
                "type": "StopResult",
                "id": "1234",
                "Name": "1234 Main St"
            };
            deps.SearchHistoryService.add(aStop);

            var aGeocode = {
                "type": "GeocodeResult",
                "latitude": 10.00,
                "longitude": 10.00,
                "formattedAddress": "10 Downing Street"
            };
            deps.SearchHistoryService.add(aGeocode);

            aRoute = {
                "type": "RouteResult",
                "id": "4",
                "shortName": "4"
            };
            deps.SearchHistoryService.add(aRoute);

            aRoute = {
                "type": "RouteResult",
                "id": "5",
                "shortName": "5"
            };
            deps.SearchHistoryService.add(aRoute);

            aRoute = {
                "type": "RouteResult",
                "id": "6",
                "shortName": "6"
            };
            deps.SearchHistoryService.add(aRoute);

            deps.SearchHistoryService.fetchAll().then(function(results){
                expect(results.length() === 5);
            });
        });

        it('should clear the recent list', function() {
            deps.SearchHistoryService.clear();
            deps.SearchHistoryService.fetchAll().then(function(results){
                expect(results.length() === 0);
            });
        });
    }
});