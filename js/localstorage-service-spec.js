ngDescribe({
    name: 'Service: Storage tests',
    modules: 'atstop',
    inject: ['StorageService'],
    tests: function(deps) {
        it('should add to and get from localstorage', function() {
            deps.StorageService.set('1234ABCD');
            expect(deps.StorageService.get() === ['1234ABCD']);
        });
    }
});