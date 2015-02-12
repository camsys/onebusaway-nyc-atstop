# At Stop #

A hybrid mobile app that provides information about when the next bus will arrive at your stop. The app uses free [MTA Bus Time Developer API](http://bustime.mta.info/wiki/Developers/Index)'s to get the real-time location of the buses serving a particular stop. The app is built on top of [Ionic Framework](http://ionicframework.com/), [AngularJS](https://angularjs.org/) and [PhoneGap](http://phonegap.com/).

### Setting up the project ###
* First, download the source code. 
* Second, you'll need to get the MTA Bus Time Developer API key. Go [here](http://spreadsheets.google.com/viewform?hl=en&formkey=dG9kcGIxRFpSS0NhQWM4UjA0V0VkNGc6MQ#gid=0) to request one. You will receive the key within half an hour. Then, rename the **resources/js/config_tmpl.js** to **config.js**. Insert your key to the *BTKey field*.

### Running and testing ###
To run and test the app, use [PhoneGap Developer App](http://app.phonegap.com/). In order to build the native mobile app, use [Adobe PhoneGap Build](https://build.phonegap.com/). Rename the **config.tmpl.xml** to **config.xml**. You can also use [PhoneGap Emulatation extension](http://emulate.phonegap.com/) for Google Chrome. *NOTE:* The app uses several objects, like the connection object from the Apache Cordova framework, which may not be available locally (in a Web browser).

### Using JSHint, UglifyJS, and Pngquant-Imagemin###
Run `npm install` in the root of the project. To use JSHint, run `gulp lint`. In order to use UglifyJS, run `gulp compress`. It will create new compressed files in `dist` folder in the root of the project. To compress the splashes, run `compress_resources`.


### Project License ###
The project is based on [GNU General Public License, version 2](http://www.gnu.org/licenses/gpl-2.0.html).
