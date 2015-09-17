ngDescribe({
  name: 'Service: Geolocation tests',
  modules: 'atstop',
  inject: 'GeolocationService',
  tests: function(deps) {
    it('should return nearby stops', function() {
      var lat = 40.748433;
      var lon = -73.985656;
      deps.GeolocationService.getStops(lat, lon).then(function(results) {
        expect(results.length).to.BeGreaterThan(0);
      });
    });
  }
});

ngDescribe({
  name: 'Service: At Stop Service tests (note: server/data dependent)',
  modules: 'atstop',
  inject: 'AtStopService',
  tests: function(deps) {
    it('should return results for a stop', function() {
      var stop = 'MTA_400861';
      deps.AtStopService.getBuses(stop).then(function(results) {
        expect(Object.keys(data.arriving).length).toBeGreaterThan(1);
      });
    });

    it('should return results for one route at a stop', function() {
      var stop = 'MTA_400861';
      var line = 'MTA NYCT_M7';
      var params = {
        'stop': stop,
        'line': line
      };
      var data = {};
      deps.AtStopService.getBuses(params).then(function(results) {
        except(Object.keys(data.arriving).length).toBeEqualTo(1);
      });
    });
  }
});
