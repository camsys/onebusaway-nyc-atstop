# At Stop #

A hybrid mobile app that provides information about when the next bus will arrive at your stop. The app uses free MTA Bus Time Developer API's to get the real-time location of the buses serving a particular stop. The app is built on top of Ionic [Framework Mobile](http://ionicframework.com/), [AngularJS](https://angularjs.org/) and [PhoneGap](http://phonegap.com/).

### Setting up the project ###

* Download the source code from [BitBucket repository](https://bitbucket.org/khfayzullaev/at-stop)
* Second, you'll need to get the MTA Bus Time Developer API key. Go [here](http://spreadsheets.google.com/viewform?hl=en&formkey=dG9kcGIxRFpSS0NhQWM4UjA0V0VkNGc6MQ#gid=0) to request one. You will receive the key within half an hour. Then, rename the resources/js/config_tmpl.js to config.js. Insert your key to the *BTKey field*.

### Running and testing ###

To run and test the app, use [The PhoneGap Developer App](http://app.phonegap.com/). In order to build the native mobile app, use [Adobe PhoneGap Build](https://build.phonegap.com/). You can also use the [PhoneGap Emulatation extension](http://emulate.phonegap.com/) for Google Chrome. *NOTE:* The app uses several objects, like the connection object from the Apache Cordova framework, which may not be available locally (in a Web browser).

### Project License ###

The project is based on [GNU General Public License, version 2](http://www.gnu.org/licenses/gpl-2.0.html).