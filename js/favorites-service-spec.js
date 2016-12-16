ngDescribe({
  name: 'Service: Favorites storage tests',
  modules: 'atstop',
  inject: ['FavoritesService'],
  tests: function(favorites) {
    it('should return list of all favorites', function() {
      favorites.FavoritesService.get().
      then(function(results){
        expect(results.length).not.toBeLessThan(0);
      });
    });

    it('should check if favorite exists or not', function(){
      var fav_route = 'MTA NYCT_B63';
      favorites.FavoritesService.inFavorites(fav_route).then(function(response){
        expect(response).not.toBe(null);
        expect(response).toBe(true || false);
      });
    });

    it('should add new favorite to favorites', 
      function(){
      var id = 'MTA NYCT_M100';
      var name = 'M100';
      var type = 'R';

      favorites.FavoritesService.add(id, name, type).then(function(response){
        expect(response).toBeEquals(true);
      });
    });

    // it('should remove an existing favorite from favorites', 
    //   function(){
    //   var id = 'MTA NYCT_M100';
    //   var name = 'M100';
    //   var type = 'R';
    //   var favorite = {'id':id, 'name':name, 'type': type};
    //   favorites.FavoritesService.remove(favorite).then(function(response){
    //     expect(response).toBeEquals(true);
    //   });
    // });  



  }
});

