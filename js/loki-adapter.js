"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LokiCordovaFSAdapterError = (function (_Error) {
    _inherits(LokiCordovaFSAdapterError, _Error);

    function LokiCordovaFSAdapterError() {
        _classCallCheck(this, LokiCordovaFSAdapterError);

        _get(Object.getPrototypeOf(LokiCordovaFSAdapterError.prototype), "constructor", this).apply(this, arguments);
    }

    return LokiCordovaFSAdapterError;
})(Error);

var TAG = "[LokiCordovaFSAdapter]";

var LokiCordovaFSAdapter = (function () {
    function LokiCordovaFSAdapter(options) {
        _classCallCheck(this, LokiCordovaFSAdapter);

        this.options = options;
    }

    _createClass(LokiCordovaFSAdapter, [{
        key: "saveDatabase",
        value: function saveDatabase(dbname, dbstring, callback) {
            var _this = this;

            console.log(TAG, "saving database");
            this._getFile(dbname, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function () {
                        if (fileWriter.length === 0) {
                            var blob = _this._createBlob(dbstring, "text/plain");
                            fileWriter.write(blob);
                            callback();
                        }
                    };
                    fileWriter.truncate(0);
                }, function (err) {
                    console.error(TAG, "error writing file", err);
                    throw new LokiCordovaFSAdapterError("Unable to write file" + JSON.stringify(err));
                });
            }, function (err) {
                console.error(TAG, "error getting file", err);
                throw new LokiCordovaFSAdapterError("Unable to get file" + JSON.stringify(err));
            });
        }
    }, {
        key: "loadDatabase",
        value: function loadDatabase(dbname, callback) {

            console.log(TAG, "loading database");
            this._getFile(dbname, function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function (event) {
                        var contents = event.target.result;
                        if (contents.length === 0) {
                            console.warn(TAG, "couldn't find database");
                            callback(null);
                        } else {
                            callback(contents);
                        }
                    };
                    reader.readAsText(file);
                }, function (err) {
                    console.error(TAG, "error reading file", err);
                    callback(new LokiCordovaFSAdapterError("Unable to read file" + err.message));
                });
            }, function (err) {
                console.error(TAG, "error getting file", err);
                callback(new LokiCordovaFSAdapterError("Unable to get file: " + err.message));
            });
        }
    }, {
        key: "_getFile",
        value: function _getFile(name, handleSuccess, handleError) {
            var _this2 = this;


            if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()){
                //  For Cordova
                ionic.Platform.ready(function(){

                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                    var fileName = _this2.options.prefix + "__" + name;
                    dir.getFile(fileName, { create: true }, handleSuccess, handleError);
                }, function (err) {
                    throw new LokiCordovaFSAdapterError("Unable to resolve local file system URL" + JSON.stringify(err));
                });
                });
            } else{
                //For web
                  window.webkitRequestFileSystem(window.TEMPORARY, 5*1024*1024, function (dir) {
                    var fileName = _this2.options.prefix + "__" + name;
                    fs.root.getFile(fileName, {create: true}, handleSuccess, handleError);
                }, function (err) {
                    throw new LokiCordovaFSAdapterError("Unable to resolve local file system URL" + JSON.stringify(err));
                });

            }


        }

        // adapted from http://stackoverflow.com/questions/15293694/blob-constructor-browser-compatibility
    }, {
        key: "_createBlob",
        value: function _createBlob(data, datatype) {
            var blob = undefined;

            try {
                blob = new Blob([data], { type: datatype });
            } catch (err) {
                window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

                if (err.name === "TypeError" && window.BlobBuilder) {
                    var bb = new window.BlobBuilder();
                    bb.append(data);
                    blob = bb.getBlob(datatype);
                } else if (err.name === "InvalidStateError") {
                    // InvalidStateError (tested on FF13 WinXP)
                    blob = new Blob([data], { type: datatype });
                } else {
                    // We're screwed, blob constructor unsupported entirely
                    throw new LokiCordovaFSAdapterError("Unable to create blob" + JSON.stringify(err));
                }
            }
            return blob;
        }
    }]);

    return LokiCordovaFSAdapter;
})();