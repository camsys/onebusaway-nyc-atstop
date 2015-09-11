ngDescribe({
  name: 'Filter: encodeStopName filter tests',
  modules: 'filters',
  inject: '$filter',
  tests: function(deps) {
    it('should be able to replace a forward slash with & character', function() {
      var encodeStopName = deps.$filter('encodeStopName');
      expect(encodeStopName('John St/Smith Ave')).toBe('John St & Smith Ave');
      expect(encodeStopName('Adam Dr/Willson Pl')).toBe('Adam Dr & Willson Pl');
    });
  }
});

ngDescribe({
  name: 'Filter: durationView filter tests',
  modules: ['atstop'],
  inject: ['$filter'],
  tests: function(deps) {
    it('should not show  times <1 min', function() {
      var durationView = deps.$filter('durationView');
      expect(durationView(0)).toBe('');
    });

    it('should show a time of 10 min', function() {
      var durationView = deps.$filter('durationView');
      expect(durationView(633375)).toBe('10 min');
    });

    it('should properly show times of > 60 min', function() {
      var durationView = deps.$filter('durationView');
      expect(durationView(4200922)).toBe('70 min');
    });
  }
});
