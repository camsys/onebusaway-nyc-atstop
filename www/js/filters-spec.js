ngDescribe({
  name: 'Filter: encodeStopName',
  modules: 'filters',
  inject: '$filter',
  tests: function(deps) {
    it('should be able to replace a forward slash with & character', function () {
      var encodeStopName = deps.$filter('encodeStopName');
      expect(encodeStopName('John St/Smith Ave')).toBe('John St & Smith Ave');
      expect(encodeStopName('Adam Dr/Willson Pl')).toBe('Adam Dr & Willson Pl');
    });
  }
});
