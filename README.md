# At Stop #

A hybrid mobile app that provides information about when the next bus will arrive at your stop. The app uses free [MTA Bus Time Developer API](http://bustime.mta.info/wiki/Developers/Index)'s to get the real-time location of the buses serving a particular stop. The app is built on top of [Ionic Framework](http://ionicframework.com/), [AngularJS](https://angularjs.org/) and [PhoneGap](http://phonegap.com/).

### Setting up the project ###
* First, clone the repository. 
* Second, you'll need to configure the project to connect and authenticate with MTA Bus Time.
  * Copy `www/js/config.tmpl.js` to `config.js` (in the same folder)
  * Get a MTA Bus Time Developer API key. Go [here](http://spreadsheets.google.com/viewform?hl=en&formkey=dG9kcGIxRFpSS0NhQWM4UjA0V0VkNGc6MQ#gid=0) to request one. You will receive the key within half an hour.
  * Insert your key into the `API_KEY` field of `config.js`.
  * Set the API end point via the `API_END_POINT` constant in the same file (e.g. `http://app.prod.obanyc.com/`)

### Running and testing ###
* Use the serve function of [ionic](http://ionicframework.com/docs/guide/testing.html)
* In order to build the native mobile app, use `ionic build [platform]`

### Using JSHint, UglifyJS, and Pngquant-Imagemin###
Run `npm install` in the root of the project. To use JSHint, run `gulp lint`. In order to use UglifyJS, run `gulp compress`. It will create new compressed files in `dist` folder in the root of the project. To compress the splashes, run `compress_resources`.


### Project License ###
The project uses the [Apache License, version 2.0](http://opensource.org/licenses/Apache-2.0).
