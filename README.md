# About #

A hybrid mobile app that provides information about when the next bus will arrive at your stop. The app uses free MTA Bus Time Developer API's to get the real-time location of the buses serving a particular stop. The app is built on top of jQuery Mobile and PhoneGap.

## Setting up the project ##

First you'll need to get the MTA Bus Time Developer API key. Go [here](http://spreadsheets.google.com/viewform?hl=en&formkey=dG9kcGIxRFpSS0NhQWM4UjA0V0VkNGc6MQ#gid=0) to request one. You will receive one within half an hour. Then, rename the **resources/js/config_tmpl.js** to **config.js**. Insert your key to the *BTKey* field.

To run the app locally, use any web server ([Apache HTTP Server](http://httpd.apache.org/docs/2.4/), [IIS](http://www.iis.net/) or any other). In order to build the native mobile app, use [Adobe PhoneGap Build](https://build.phonegap.com/). You can also use the [PhoneGap Emulatation](http://emulate.phonegap.com/) extension for Google Chrome. 

**NOTE:** The app uses the `connection` object from the [Apache Cordova](http://cordova.apache.org/docs/en/3.5.0/cordova_connection_connection.md.html#Connection) framework which is not available locally.

### Project License ###

[GNU General Public License, version 2](http://www.gnu.org/licenses/gpl-2.0.html)