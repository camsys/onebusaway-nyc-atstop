if (typeof (window) === 'undefined') 
var loki = require('../www/lib/lokijs/src/lokijs.js');

ngDescribe({
  name: 'Service: Favorites storage tests',
  modules: 'atstop',
  inject: ['FavoritesService'],
  tests: function(favorites) {

   beforeEach(function () {    
      var db = new loki('favoritesDB');
      var favoriteCollection = db.addCollection('favorites');
      var id = 'MTA_NYCT_M100';
      var name = 'M100';
      var type = 'R';
      var newFav = {'id':id,'name':name,'type':type};
      favoriteCollection.insert(newFav);
      //favorites = db.getCollection('favorites');
    });

  it('should return list of all favorites', function() {
      favorites.FavoritesService.get().
      then(function(results){
        expect(results.length).not.toBeLessThan(0);
      });
    });


    it('should add new favorite to favorites', 
      function(){
      var id = 'MTA_NYCT_M100';
      var name = 'M100';
      var type = 'R';

      var response = favorites.FavoritesService.add(id, name, type);
      expect(response).toBe(true);

      favorites.FavoritesService.get().
      then(function(results){
        expect(results.length() > 0);
      });

    });

    it('should remove an existing favorite from favorites', 
      function(){
      var id = 'MTA NYCT_M100';
      var name = 'M100';
      var type = 'R';
      var favorite = {'id':id, 'name':name, 'type': type};
      var response = favorites.FavoritesService.remove(favorite);
      expect(response).toBe(true);
    }); 

  }
});

