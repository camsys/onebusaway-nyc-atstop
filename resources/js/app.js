/*global $*/
/*global document*/
/*global console*/
/*global setInterval:true */
/*global clearInterval:true */
/*global setTimeout */
/*global window */
/*global alert */
/*global localStorage*/
/*global logger */
/*global L */
/*global _ */
/*global config*/
/*global navigator*/







/* global timer for the 'refresh' button */
var globalTimer = null;
var globalTimerMap = null;





/* show or hide loading indicator during AJAX request */
$.ajaxSetup({
    'beforeSend': function () {
        var interval = setInterval(function () {
            $.mobile.loading('show');
            clearInterval(interval);
        }, 1);
    },
    'complete': function () {
        var interval = setInterval(function () {
            $.mobile.loading('hide');
            clearInterval(interval);
        }, 500);
    },
    'error': function () {
        var interval = setInterval(function () {
            $.mobile.loading('hide');
            clearInterval(interval);
        }, 1);
        showError("Connection failed");
    },
    'timeout': 10000
});









/* handling errors */
function showError(msg) {
    console.log("error: " + msg);
    switchView("Error");
    $.mobile.loading("hide");
    $("#errors .error").text(msg);
}








/* show or hide views */
function switchView(view) {
    $.mobile.loading("hide");

    var $slctByRoute = $("#by-route"),
        $slctByStop = $("#by-stop"),
        $slctByGeocode = $("#by-geocode"),
        $slctAtStop = $("#at-stop"),
        $slctErrors = $("#errors"),
        $slctRefresh = $("#refresh"),
        $slctFavorites = $("#favorites"),
        $slctMap = $("#map"),
        $slctSearch = $("#search"),
        $slctBackButton = $("#back-button"),
        $slctLocalStops = $("#local-stops"),
        $slctHome = $("#home"),
        $slctDirections = $("#directions"),
        $slctRoutes = $("#routes"),
        $slctNearbyStops = $("#nearby-stops"),
        $slctNearbyRoutes = $("#nearby-routes"),
        $slctInfo = $("#info"),
        $slctFavoritesList = $("#favorites-list"),
        $slctLocalStopsList = $("#local-stops-list");

    $slctByRoute.hide();
    $slctByStop.hide();
    $slctByGeocode.hide();
    $slctAtStop.hide();
    $slctErrors.hide();
    $slctRefresh.hide();
    $slctFavorites.hide();
    $slctMap.hide();
    $slctLocalStops.hide();
    $slctHome.hide();
    $slctBackButton.hide();
    $slctSearch.show();

    $slctDirections.empty();
    $slctRoutes.empty();
    $slctNearbyStops.empty();
    $slctNearbyRoutes.empty();
    $slctInfo.empty();
    $slctFavoritesList.empty();
    $slctLocalStopsList.empty();

    $("#by-route, #by-stop, #by-geocode, #at-stop, #favorites, #local-stops").find(".header").text("").find(".desc").text("").find(".auxiliary").text("");
    $("#errors").find(".error").text("");

    switch (view) {
    case "RouteResult":
        $slctByRoute.show();
        break;
    case "StopResult":
        $slctByStop.show();
        break;
    case "GeocodeResult":
        $slctByGeocode.show();
        break;
    case "AtStop":
        $slctAtStop.show();
        $slctRefresh.show();
        break;
    case "Error":
        $slctErrors.show();
        break;
    case "Favorites":
        $slctFavorites.show();
        break;
    case "Map":
        $slctMap.show();
        $slctBackButton.show();
        $slctSearch.hide();
        break;
    case "LocalStops":
        $slctLocalStops.show();
        break;
    case "Home":
        $slctHome.show();
        break;
    default:
    }
}









/* triggered when the page has been created in the DOM (via ajax or other) and after all widgets have had an opportunity to enhance the contained markup */
$(document).on("pagecreate", "#main", function () {
    "use strict";

    /* search autocomplete */
    $("#autocomplete").on("filterablebeforefilter", function (e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            $error = $("#autocomplete-error");

        $ul.empty();
        if (value && value.length >= 1) {
            $ul.listview("refresh");
            $.ajax({
                url: "http://bt.mta.info/api/autocomplete",
                dataType: "jsonp",
                crossDomain: true,
                data: {
                    term: $input.val()
                }
            }).then(function (response) {
                console.log("autocomplete response:");
                console.log(response);

                $error.text("");
                $ul.empty();

                if (response.length !== 0) {
                    $.each(response, function (i, val) {
                        $ul.append($("<li/>").data("term", val).append($("<a/>").text(val)));
                    });
                } else {
                    $error.text("No matches found");
                }

                $ul.listview("refresh");
                $ul.trigger("updatelayout");
            }).fail(function () {
                console.log("autocomplete request has failed");
            });
        } else {
            $error.text("");
        }
    });
});









/* search request */
function search(term) {
    var search_request = $.get("http://bt.mta.info/api/search", {
        q: term
    }, function (response) {
        if (response.searchResults.empty === false && response.searchResults.matches.length > 0) {
            var matches = response.searchResults.matches[0];
            switch (response.searchResults.resultType) {
            case "RouteResult":
                console.log("route result");
                handleRouteResult(matches);
                break;
            case "StopResult":
                console.log("stop result");
                handleStopResult(matches);
                break;
            case "GeocodeResult":
                console.log("geocode result");
                handleGeocodeResult(matches);
                break;
            default:
                console.log("default");
                console.log("no matches found");
                showError("No matches found");

            }
        } else {
            console.log("no matches found");
            showError("No matches found");

        }
    }, "jsonp").fail(function () {
        console.log("search request has failed");
        showError("No data available");
    });
}









/* handling route result */
function handleRouteResult(matches) {
    console.log("route search results:");
    console.log(matches);
    console.log("handling route result");

    switchView("RouteResult");

    $("#by-route .header").text(matches.shortName + " " + matches.longName);
    $("#by-route .auxiliary").text("Directions:");
    $.each(matches.directions, function (key, value) {
        getStops(matches.id, matches.shortName + " " + matches.longName, value.directionId, value.destination);
    });
}

/* get stops (directions) */
function getStops(lclRouteId, lclRouteName, lclDirectionId, lclDestination) {
    var request = $.get("http://bt.mta.info/api/stops-on-route-for-direction", {
        routeId: lclRouteId,
        directionId: lclDirectionId
    }, function (response) {
        console.log("get directions request results: ");
        console.log(response);
        $.each(response, function (key, value) {
            addStops(lclRouteId, lclRouteName, lclDirectionId, lclDestination, value);
        });
    }, "jsonp").fail(function () {
        console.log("get directions request has failed");
        showError("No data available");
    });
}

/* add stops (direction-based) */
function addStops(lclRouteId, lclRouteName, lclDirectionId, lclDestination, data) {
    var $collapsibleset = $("#directions");
    $collapsibleset.append(
        $("<div/>").attr("data-role", "collapsible")
        .append($('<h4/>').text("To " + lclDestination))
        .append($('<ul/>')
            .attr("data-role", "listview")
            .attr("id", "collapsibleListview" + lclDirectionId))
    ).trigger("create");

    $.each(data, function (key, value) {
        $("#collapsibleListview" + lclDirectionId).append(
            $("<li/>").data("route-id", lclRouteId)
            .data("stop-id", value.id)
            .data("route-name", lclRouteName)
            .data("stop-name", value.name)
            .append(
                $("<a/>").text(value.name)
            ).on("click", function (e) {
                e.preventDefault();
                var $this = $(this);
                console.log("click");
                handleAtStopResult($this.data("route-id"), $this.data("route-name"), $this.data("stop-id"), $this.data("stop-name"));
            })
        );
    });
    $("#collapsibleListview" + lclDirectionId).listview("refresh");
    $("#collapsibleListview" + lclDirectionId).trigger("updatelayout");
}









/* handling stop result */
function handleStopResult(matches) {
    console.log("stop search results:");
    console.log(matches);
    console.log("handling stop search results");

    switchView("StopResult");

    $("#by-stop .header").text(matches.name);
    $("#by-stop .auxiliary").text("Routes:");

    var $ul = $("#routes");
    $ul.listview("refresh");
    $.each(matches.routesAvailable, function (key, value) {
        $ul.append($("<li/>").data("route-id", value.id)
            .data("route-name", value.shortName + " - " + value.longName)
            .data("stop-id", matches.id)
            .data("stop-name", matches.name)
            .append(
                $("<a/>").text(value.shortName + " - " + value.longName)
            ));
    });
    $ul.listview("refresh");
    $ul.trigger("updatelayout");
}









/* handling geocode result */
function handleGeocodeResult(matches) {
    console.log("geocode search results:");
    console.log(matches);
    console.log("handling geocode result");

    switchView("GeocodeResult");

    $("#by-geocode .header").text(matches.formattedAddress);

    addNearbyRoutes(matches.nearbyRoutes);
    getNearbyStops(matches.latitude, matches.longitude);
}

/* get stops for location */
function getNearbyStops(lclLat, lclLon) {
    $("#by-geocode .auxiliary-stops").text("Nearby Stops:");
    var request = $.get("http://bt.mta.info/api/where/stops-for-location.json", {
        key: config.BTKey,
        lat: lclLat,
        lon: lclLon,
        radius: config.radius
    }, function (response) {
        console.log("nearby stops search results:");
        console.log(response);
        addNearbyStops(response);
    }, "jsonp").fail(function () {
        console.log("nearby stops search request has failed");
        showError("No data available");
    });
}

/* add stops for location */
function addNearbyStops(data) {
    var $ulStops = $("#nearby-stops");
    $ulStops.listview("refresh");
    if (data.data.stops.length > 0) {
        $.each(data.data.stops, function (key, value) {
            $ulStops.append(
                $("<li/>").data("stop-code", value.code)
                .append($("<a/>").text(value.name))
            );
        });
    } else {
        $ulStops.append($("<p/>").text("No data available"));
    }
    $ulStops.listview("refresh");
    $ulStops.trigger("updatelayout");
}

/* add routes for location */
function addNearbyRoutes(data) {
    console.log("nearby routes search results:");
    console.log(data);
    $("#by-geocode .auxiliary-routes").text("Nearby Routes:");
    var $ulRoutes = $("#nearby-routes");

    $ulRoutes.listview("refresh");
    if (data.length > 0) {
        $.each(data, function (key, value) {
            $ulRoutes.append(
                $("<li/>").data("route-name", value.shortName).append($("<a/>").text(value.shortName + " - " + value.description))
            );
        });
    } else {
        $ulRoutes.append($("<p/>").text("No data available"));
    }
    $ulRoutes.listview("refresh");
    $ulRoutes.trigger("updatelayout");
}









/* show favorites */
function showFavorites() {
    console.log("show favorites");
    switchView("Favorites");

    $("#favorites h3").text("Favorite stops:");

    var favorites = window.localStorage.getItem("favorites");
    if (typeof favorites !== 'undefined' && favorites !== null && $.isEmptyObject($.parseJSON(favorites)) !== true) {
        console.log(favorites);

        var $ul = $("#favorites-list");
        $ul.listview("refresh");
        $.each($.parseJSON(favorites), function (key, value) {
            console.log(value);
            $ul.append($("<li/>").data("stop-id", value.id).data("stop-name", value.name).append($("<a/>").text(value.name)));
        });
        $ul.listview("refresh");
        $ul.trigger("updatelayout");

    } else {
        showError("No favorites added");
    }
}









/* handling 'at stop' result */
function handleAtStopResult(routeId, routeName, stopId, stopName) {
    console.log("at stop");
    console.log("route id:" + routeId, "route name:" + routeName, "stop id:" + stopId, "stop name:" + stopName);
    switchView("AtStop");

    if (routeName !== "") {
        $("#at-stop .header").text("Route: " + routeName);
    }

    $("#at-stop .auxiliary").text("Stop: " + stopName);

    if (routeId === "") {
        $("#map-button").hide();
    } else {
        $("#map-button").show();
    }

    handleRefreshBtn(routeId, stopId);
    getInfo(routeId, stopId);

    var $addToFavorites = $("#add-to-favorites");
    $addToFavorites.data("stop-id", stopId);
    $addToFavorites.data("stop-name", stopName);

    var $removeFromFavorites = $("#remove-from-favorites");
    $removeFromFavorites.data("stop-id", stopId);

    var $mapButton = $("#map-button");
    $mapButton.data("stop-id", stopId);
    $mapButton.data("route-id", routeId);
    $mapButton.data("route-name", routeName);
    $mapButton.data("stop-name", stopName);

    var $backButton = $("#back-button");
    $backButton.data("stop-id", stopId);
    $backButton.data("route-id", routeId);
    $backButton.data("route-name", routeName);
    $backButton.data("stop-name", stopName);

    var favorites = window.localStorage.getItem("favorites");
    if (typeof favorites !== 'undefined' && favorites !== null && $.isEmptyObject($.parseJSON(favorites)) !== true) {
        var tmp = $.parseJSON(favorites);
        if (typeof tmp[stopId] !== 'undefined' && tmp[stopId] !== null && $.isEmptyObject(tmp[stopId]) !== true) {
            $addToFavorites.hide();
            $removeFromFavorites.show();
        } else {
            $addToFavorites.show();
            $removeFromFavorites.hide();
        }
    } else {
        $addToFavorites.show();
        $removeFromFavorites.hide();
    }
}

/* get info about arriving buses */
function getInfo(routeId, stopId) {
    console.log("route id:" + routeId, "stop id:" + stopId);
    var request = $.get("http://bt.mta.info/api/siri/stop-monitoring.json", {
        MaximumStopVisits: config.MaximumStopVisits,
        MinimumStopVisitsPerLine: config.MinimumStopVisitsPerLine,
        key: config.BTKey,
        OperatorRef: "MTA",
        MonitoringRef: stopId
    }, function (response) {
        if (response.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0) {
            console.log("Stop Monitoring:");
            console.log(response.Siri.ServiceDelivery);
            var tmp = [],
                i = 0,
                currentLine = null;
            $.each(response.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit, function (key, value) {
                tmp.push(value.MonitoredVehicleJourney);
            });

            var groupByLineRef = [];
            groupByLineRef = _.groupBy(tmp, function (obj) {
                console.log(obj);
                return obj.LineRef;
            });

            addInfo(groupByLineRef);
        } else {
            console.log("no data available");
            showError("No data available");
        }
    }, "jsonp").fail(function () {
        console.log("stop monitoring request has failed");
        showError("No data available");
    });
}

/* add info about arriving buses */
var regex = /T[0-9][0-9]:[0-9][0-9]/g;
var regex_route_name = /\_[a-zA-Z0-9]+/g;

function addInfo(data) {
    var $ul = $("#info");
    $ul.listview("refresh");
    $.each(data, function (key, value) {
        console.log(value);
        $ul.append($("<li/>").attr("data-role", "list-divider").text(key.match(regex_route_name)[0].substring(1)));
        var i = 0;
        $.each(value, function (k, v) {
            if (i < 3) {
                if (v.ProgressStatus === "prevTrip") {
                    $ul.append($("<li/>").append('<img src="resources/images/bus_icon.svg" class="ui-li-icon">').append($("<p/>").attr("style", "color: #16a085; text-transform: uppercase; font-weight: bold;").text(v.MonitoredCall.Extensions.Distances.PresentableDistance + " (+ scheduled layover at terminal)")).append($("<h2/>").text(v.PublishedLineName)).append($("<p/>").text(v.DestinationName)));
                } else if (v.ProgressStatus === "layover,prevTrip" && v.OriginAimedDepartureTime) {
                    var time = v.OriginAimedDepartureTime.match(regex)[0].substring(1);
                    // console.log(time[0].substring(1));
                    $ul.append($("<li/>").append('<img src="resources/images/bus_icon.svg" class="ui-li-icon">').append($("<p/>").attr("style", "color: #16a085; text-transform: uppercase; font-weight: bold;").text(v.MonitoredCall.Extensions.Distances.PresentableDistance + " (at terminal, scheduled to depart " + time + ")")).append($("<h2/>").text(v.PublishedLineName)).append($("<p/>").text(v.DestinationName)));
                } else if (v.ProgressStatus === "layover") {
                    $ul.append($("<li/>").append('<img src="resources/images/bus_icon.svg" class="ui-li-icon">').append($("<p/>").attr("style", "color: #16a085; text-transform: uppercase; font-weight: bold;").text(v.MonitoredCall.Extensions.Distances.PresentableDistance + " (at terminal)")).append($("<h2/>").text(v.PublishedLineName)).append($("<p/>").text(v.DestinationName)));
                } else {
                    $ul.append($("<li/>").append('<img src="resources/images/bus_icon.svg" class="ui-li-icon">').append($("<p/>").attr("style", "color: #16a085; text-transform: uppercase; font-weight: bold;").text(v.MonitoredCall.Extensions.Distances.PresentableDistance)).append($("<h2/>").text(v.PublishedLineName)).append($("<p/>").text(v.DestinationName)));
                }
                i = i + 1;
            } else {
                return false;
            }
        });
    });
    $ul.listview("refresh");
    $ul.trigger("updatelayout");
}

/* refresh button handler */
function handleRefreshBtn(routeId, stopId) {
    var $this = $("#refresh");
    $this.data("route-id", routeId).data("stop-id", stopId).attr('disabled', 'disabled').html('Refresh (30s)');
    window.clearTimeout(globalTimer);
    globalTimer = window.setTimeout(function () {
        $this.removeAttr('disabled').html('Refresh');
    }, 30000);
}









/* show local stops */
function showLocalStops() {
    console.log("show local stops");
    switchView("LocalStops");
    $.mobile.loading("show");
    navigator.geolocation.getCurrentPosition(onLocSuccess, onLocError, {
        maximumAge: 10000,
        timeout: 15000,
        enableHighAccuracy: true
    });
}

/* location succes */
var onLocSuccess = function (position) {
    console.log('Latitude: ' + position.coords.latitude + '\n' +
        'Longitude: ' + position.coords.longitude);

    $("#favorites h3").text("Local stops:");
    getLocalStops(position.coords.latitude, position.coords.longitude);
};

/* get local stops */
function getLocalStops(lclLat, lclLot) {
    var request = $.get("http://bt.mta.info/api/where/stops-for-location.json", {
        key: config.BTKey,
        lat: lclLat,
        lon: lclLot,
        radius: config.radius
    }, function (response) {
        console.log("local stops search results:");
        console.log(response);
        addLocalStops(response);
    }, "jsonp").fail(function () {
        console.log("local stops search request has failed");
        showError("No data available");
    });
}


/* add stops for location */
function addLocalStops(data) {
    var $ulLocalStops = $("#local-stops-list");
    $ulLocalStops.listview("refresh");
    if (data.data.stops.length > 0) {
        $.each(data.data.stops, function (key, value) {
            $ulLocalStops.append(
                $("<li/>").data("stop-code", value.code)
                .append($("<a/>").text(value.name))
            );
        });
    } else {
        $ulLocalStops.append($("<p/>").text("No data available"));
    }
    $ulLocalStops.listview("refresh");
    $ulLocalStops.trigger("updatelayout");
}

function onLocError(error) {
    console.log('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
    showError("Could not get the current location");
}









/* show map */
function showMap() {
    console.log("show map");
    switchView("Map");
}








// inform connection status only after 5 sec
var connTimer = null;

/* this is an event that fires when PhoneGap is fully loaded */
$(document).on("deviceready", function () {
    onDeviceReady();
});

/* these are two events that fire when a device is online or offline */
$(document).on("online", function () {
    onOnline();

}).on("offline", function () {
    window.clearTimeout(connTimer);
    globalTimer = window.setTimeout(function () {
        onOffline();
    }, 5000);
});

/* PhoneGap is loaded and it is now safe to make calls PhoneGap methods */
function onDeviceReady() {
    console.log("device is ready");
}

/* on online */
function onOnline() {
    console.log("online");
    // switchView("Home");
}

/* on offline */
function onOffline() {
    console.log("offline");
    showError("No internet connection. Check the network.");
}

/* back button on Android */
$(document).on("backbutton", function () {
    onBackKeyDown();
});

/* on back button function */
function onBackKeyDown() {
    navigator.notification.confirm(
        'Are you sure to exit!', // message
        onConfirm, // callback to invoke with index of button pressed
        'Confirm', // title
 ['Cancel', 'Exit'] // buttonLabels
    );
}

/* on confirm */
function onConfirm(buttonIndex) {
    if (buttonIndex == 2) {
        navigator.app.exitApp();
    }
}






/* function which gets called when all the dom elements can be accessed */
$(document).ready(function () {
    "use strict";




    /* start with 'home' page */
    switchView("Home");









    $("#home-button").on("click", function (e) {
        e.preventDefault();
        switchView("Home");
    });









    /* autocomplete 'enter' event handler */
    $('input[data-type="search"]').on("keydown", function (e) {
        var $this = $(this);
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13) {
            search($this.val());
            // clean search input and hide autocomplete list
            $this.val("").trigger("keyup");
        }
    });

    /* autocomplete `on click` event handler */
    $("#autocomplete").off('mouseover', 'li', function () {
        return false;
    }).on("click", "li", function (e) {
        e.preventDefault();
        var $searchInput = $('input[data-type="search"]');
        search($(this).data("term"));
        // clean search input and hide autocomplete list
        $searchInput.val("").trigger("keyup");
    });









    /* click event handler for routes */
    $("#routes").on("click", "li", function (e) {
        e.preventDefault();
        var $this = $(this);
        console.log("click");
        handleAtStopResult($this.data("route-id"), $this.data("route-name"), $this.data("stop-id"), $this.data("stop-name"));
    });








    /* click event handler for the 'refresh' button */
    $("#refresh").on("click", function (e) {
        e.preventDefault();
        console.log("refresh");
        $("#info").empty();
        getInfo($(this).data("route-id"), $(this).data("stop-id"));

        $(this).attr('disabled', 'disabled').html('Refresh (30s)');
        window.clearTimeout(globalTimer);
        globalTimer = window.setTimeout(function () {
            $("#refresh").removeAttr('disabled').html('Refresh');
        }, 30000);
    });








    /* click event handlers for nearby stops as well as routes */
    $("#nearby-stops").on("click", "li", function (e) {
        e.preventDefault();
        var $this = $(this);
        search($this.data("stop-code"));
    });

    $("#nearby-routes").on("click", "li", function (e) {
        e.preventDefault();
        var $this = $(this);
        search($this.data("route-name"));
    });









    /* 'show favorites' button */
    $("#favorites-button, #favorites-btn").on("click", function (e) {
        e.preventDefault();
        var $this = $('input[data-type="search"]');
        showFavorites();
        $this.val("").trigger("keyup");
    });







    /* click handler for favorite items */
    $("#favorites-list").on("click", "li", function (e) {
        e.preventDefault();
        var stopId = $(this).data("stop-id"),
            stopName = $(this).data("stop-name");

        handleAtStopResult("", "", stopId, stopName);
    });

    /* click handler for 'remove from the favos' items */
    $("#remove-from-favorites").on("click", function (e) {
        e.preventDefault();
        var lclStopId = $(this).data("stop-id"),
            tmp = $.parseJSON(window.localStorage.getItem("favorites"));
        delete tmp[lclStopId];
        console.log(lclStopId + "deleted from the favorites");
        window.localStorage.setItem("favorites", JSON.stringify(tmp));
        $(this).hide();
        $("#add-to-favorites").show();
    });

    /* click handler for 'add to the favos' items */
    $("#add-to-favorites").on("click", function (e) {
        e.preventDefault();
        var lclStopId = $(this).data("stop-id"),
            lclStopName = $(this).data("stop-name"),
            tmp = {},
            favorites = window.localStorage.getItem("favorites");
        if (typeof favorites !== 'undefined' && favorites !== null || $.isEmptyObject($.parseJSON(favorites)) !== true) {
            tmp = $.parseJSON(favorites);
            tmp[lclStopId] = {
                "id": lclStopId,
                "name": lclStopName
            };
            window.localStorage.setItem("favorites", JSON.stringify(tmp));
            console.log("added to favorites (non-empty)");
        } else {
            tmp[lclStopId] = {
                "id": lclStopId,
                "name": lclStopName
            };

            window.localStorage.setItem("favorites", JSON.stringify(tmp));
            console.log("added to favorites (empty)");
        }
        $(this).hide();
        $("#remove-from-favorites").show();
    });








    /* click event handler for local stops */
    $("#local-stops-btn, #refresh-local-btn").on("click", function (e) {
        e.preventDefault();
        showLocalStops();
    });

    $("#local-stops-list").on("click", "li", function (e) {
        e.preventDefault();
        var $this = $(this);
        search($this.data("stop-code"));
    });







    /* Map handling */
    /* show the map */
    var layerMain = new L.StamenTileLayer("terrain");
    var map = new L.Map('map');
    map.addLayer(layerMain);
    var stop = new L.marker();
    var markers = new L.MarkerClusterGroup();
    var polylinesGroup = new L.FeatureGroup();
    var stamenLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }).addTo(map);

    var myButton = L.control({
        position: 'topright'
    });

    myButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div');
        this._div.innerHTML = '<button class="ui-btn" id="map-refresh">Refresh</button>';
        return this._div;
    };

    myButton.addTo(map);

    $("#map-refresh").on("click", function (e) {
        e.preventDefault();
        var $this = $(this);
        console.log("click");
        addMarkers($this.data("route-id"), map, markers);

        $(this).attr('disabled', 'disabled').html('Refresh (30s)');
        window.clearTimeout(globalTimerMap);
        globalTimerMap = window.setTimeout(function () {
            $("#map-refresh").removeAttr('disabled').html('Refresh');
        }, 30000);
    });

    $("#back-button").on("click", function (e) {
        e.preventDefault();
        var $this = $(this);
        handleAtStopResult($this.data("route-id"), $this.data("route-name"), $this.data("stop-id"), $this.data("stop-name"));
    });

    $("#map-button").on("click", function (e) {
        e.preventDefault();
        var $this = $(this);

        $("#map-refresh").data("route-id", $this.data("route-id"));

        /* clear the map */
        markers.clearLayers();
        polylinesGroup.eachLayer(function (layer) {
            map.removeLayer(layer);
        });

        var stop_id = $this.data("stop-id");
        console.log(stop_id);
        var stop_loc = $.get("http://bt.mta.info/api/where/stop/" + stop_id + ".json", {
            key: config.BTKey
        }, function (response) {
            var newLatLng = new L.LatLng(response.data.lat, response.data.lon);
            stop.setLatLng(newLatLng);
            stop.addTo(map);
        }, "jsonp").fail(function () {
            console.log("error");
        });


        var polylines = $.get("http://bt.mta.info/api/where/stops-for-route/" + $this.data("route-id") + ".json", {
            key: config.BTKey
        }, function (response) {
            // console.log(response.data.stopGroupings[0].stopGroups);
            $.each(response.data.stopGroupings[0].stopGroups, function (key, value) {
                $.each(value.polylines, function (k, v) {
                    console.log(k);
                    var polyline = L.Polyline.fromEncoded(v.points).addTo(map);
                    polyline.setStyle({
                        color: "#2c3e50",
                        opacity: 1
                    });
                    //					map.fitBounds(polyline.getBounds());
                    polylinesGroup.addLayer(polyline);
                });

                map.fitBounds(polylinesGroup.getBounds());

                map.invalidateSize();
            });
        }, "jsonp").fail(function () {
            console.log("error");
        });

        addMarkers($this.data("route-id"), map, markers);

        showMap();
    });
});



function addMarkers(lclRouteId, map, markers) {
    $("#map-refresh").attr('disabled', 'disabled').html('Refresh (30s)');
    window.clearTimeout(globalTimerMap);
    globalTimerMap = window.setTimeout(function () {
        $("#map-refresh").removeAttr('disabled').html('Refresh');
    }, 30000);

    markers.clearLayers();

    var busIcon = L.icon({
        iconUrl: 'resources/images/arrow.svg',
        iconSize: [30, 30], // size of the icon
    });


    var vehicles = $.get("http://bt.mta.info/api/siri/vehicle-monitoring.json", {
        key: config.BTKey,
        OperatorRef: "MTA NYCT",
        LineRef: lclRouteId
    }, function (response) {
        var vehiclesData = response.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;
        $.each(vehiclesData, function (key, value) {
            console.log(value.MonitoredVehicleJourney.VehicleLocation);
            var marker = new L.rotatedMarker([value.MonitoredVehicleJourney.VehicleLocation.Latitude, value.MonitoredVehicleJourney.VehicleLocation.Longitude], {
                icon: busIcon
            });
            marker.options.angle = -value.MonitoredVehicleJourney.Bearing;
            markers.addLayer(marker);
        });
    }, "jsonp").fail(function () {
        console.log("error");
    });

    $.when(vehicles).then(function () {
        map.addLayer(markers);
    });

}



/* cache handler */
/*
function clearCacheAndData() {
	console.log("clear cache");
	var success = function (status) {
			console.log('Message: ' + status);
		},
		error = function (status) {
			console.log('Error: ' + status);
		};
	// window.cache.clear(success, error);

	var favorites = window.localStorage.getItem("favorites");
	if (typeof favorites !== 'undefined' && favorites !== null && $.isEmptyObject($.parseJSON(favorites)) !== true) {
		window.localStorage.clear();
		window.localStorage.setItem("favorites", favorites);
	} else {
		window.localStorage.clear();
	}
}
*/