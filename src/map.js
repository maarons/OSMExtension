/*
 * Copyright (c) 2010, 2011, 2012 Marek Sapota
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* Various helper functions. */

function nominatimUrl() {
  u = new Url("http://nominatim.openstreetmap.org/search");
  u.addParams({ "format": "json" });
  return u;
}

function reverseNominatimUrl() {
  u = new Url("http://nominatim.openstreetmap.org/reverse");
  u.addParams({ "format": "json" });
  return u;
}

function moveMap(lat, lng, zoom) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  zoom = parseInt(zoom);
  map.setView([lat, lng], zoom);
  map.fireEvent("moveend");
  map.fireEvent("zoomend");
}

function addViewBox(url) {
  var bounds = map.getBounds();
  var left = bounds.getSouthWest().lng;
  var top = bounds.getNorthEast().lat;
  var right = bounds.getNorthEast().lng;
  var bottom = bounds.getSouthWest().lat;
  return url.addParams({
    "viewbox": [left, top, right, bottom].join()
  });
}

function getCurrentLocation(callback) {
  function success(pos) {
    callback(pos.coords.latitude, pos.coords.longitude, true);
  }
  function error() {
    /* London as default location. */
    callback(51.505, -0.09, false);
  }
  /* Firefox will hang on this function without even displaying some kind of
   * permission confirmation dialog to the user. */
  if (!!navigator.geolocation && !$.browser.mozilla) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    error();
  }
}

var autocompleteEnabled = true;

function enableAutocomplete() {
  autocompleteEnabled = true;
}

function disableAutocomplete() {
  autocompleteEnabled = false;
}

function closeAutocomplete() {
  disableAutocomplete();
  $("#query").autocomplete("close");
}

var markers = [];

function removeMarkers() {
  while (markers.length) {
    map.removeLayer(markers.pop());
  }
}

function addMarker(lat, lng) {
  var lat = parseFloat(lat);
  var lng = parseFloat(lng);
  var marker = L.marker([lat, lng])
  map.addLayer(marker);
  markers.push(marker);
  return marker;
}

/* End of various helper functions. */

function initMap() {
  throbber = new Throbber($("#throbber"));
  cache = new Cache();
  map = L.map("map")
  var layer = L.tileLayer(
    "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      doubleClickZoom: false,
      maxZoom: 18,
      attribution: "© <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>"
    }
  );
  layer.addTo(map);

  map.on("moveend", function() {
    var pos = map.getCenter();
    localStorage.lat = pos.lat;
    localStorage.lng = pos.lng;
  });
  map.on("zoomend", function() {
    localStorage.zoom = map.getZoom();
  });

  if (!localStorage.lat || !localStorage.lng || !localStorage.zoom) {
    getCurrentLocation(function(lat, lng) {
      /* 14 is an arbitrarily chosen default zoom level. */
      moveMap(lat, lng, 14);
      throbber.hide();
    });
  } else {
    moveMap(localStorage.lat, localStorage.lng, localStorage.zoom);
    throbber.hide();
  }
}

initMap();

/* Search form auto-completion. */

/* Resume normal operation if user interacts with the query. */
$("#query").keydown(enableAutocomplete);

/* Close autocomplete if user interacts with something else. */
$("#form").click(closeAutocomplete);
$("#map").click(closeAutocomplete);

$("#query").autocomplete({
  source: function(request, response) {
    var url = addViewBox(nominatimUrl().addParams({
      "q": request.term,
      "limit": 10
    }));

    function error() {
      throbber.hide();
      closeAutocomplete();
    }
    function success(data) {
      if (data.length) {
        var places = [];
        $.each(data, function(_, e) {
          if (e.display_name) {
            /* This is not only for performance, sometimes Nominatim can't find
             * places by their full display name.  If the results are cached
             * it's not a problem. */
            cache.push(e.display_name, e);
            places.push(e.display_name);
          }
        });
        /* Avoid long running autocomplete requests poluting the screen if user
         * moved on to something else already. */
        if (autocompleteEnabled) {
          response(places);
        }
        throbber.hide();
      } else {
        error();
      }
    }

    throbber.show();
    $.ajax({ url: url, dataType: "json", success: success, error: error });
  },
  select: function() {
    $("#form").submit();
  },
  minLength: 3
});

/* Display info about a place on click. */
map.on("click", function(event) {
  var zoom = map.getZoom();
  /* Give most info starting from zoom level 16. */
  if (zoom >= 16) zoom = 18;
  var lat = event.latlng.lat;
  var lng = event.latlng.lng;
  var url = reverseNominatimUrl().addParams({
    "lat": lat,
    "lon": lng,
    "zoom": zoom
  });

  function error() {
    throbber.hide();
    $.errorDialog("Couldn’t get any data about this place.");
  }
  function success(data) {
    if (data.display_name) {
      var popup = L.popup();
      popup.setLatLng(event.latlng);
      popup.setContent(data.display_name);
      map.openPopup(popup);
      throbber.hide();
    } else {
      error();
    }
  }

  throbber.show();
  $.ajax({ url: url, dataType: "json", success: success, error: error });
});

/* Move map to requested location. */
$("#form").submit(function(event) {
  event.preventDefault();
  closeAutocomplete();
  var query = $("#query").val();
  var url = nominatimUrl().addParams({
    "q": query,
    "limit": 1
  });

  function error() {
    throbber.hide();
    $.errorDialog("Couldn’t find " + query + ".");
  }
  function success(data) {
    if (data.length) {
      cache.push(query, data[0]);
      /* 16 is an arbitrarily chosen default zoom level. */
      moveMap(data[0].lat, data[0].lon, 16);
      removeMarkers();
      addMarker(data[0].lat, data[0].lon);
      throbber.hide();
    } else {
      error();
    }
  }

  throbber.show();
  if (cache.get(query)) {
    success([cache.get(query)]);
  } else {
    $.ajax({ url: url, dataType: "json", success: success, error: error });
  }
});

/* Mark matching places. */
$("#marker").click(function(event) {
  event.preventDefault();
  var query = $("#query").val();
  var url = addViewBox(nominatimUrl().addParams({
    "q": query,
    "bounded": 1
  }));

  removeMarkers();

  function error() {
    throbber.hide();
    $.errorDialog("Couldn’t find any matching locations in the vicinity.");
  }
  function success(data) {
    if (data.length) {
      $.each(data, function(_, e) {
        var marker = addMarker(e.lat, e.lon);
        if (e.display_name) {
          marker.on("click", function() {
            marker.bindPopup(e.display_name).openPopup();
          });
        }
      });
      throbber.hide();
    } else {
      error();
    }
  }

  throbber.show();
  $.ajax({ url: url, dataType: "json", success: success, error: error });
});

/* Go to OSM page. */
$("#osm").click(function(event) {
  event.preventDefault();
  var pos = map.getCenter();
  var url = "http://www.openstreetmap.org/?lat=" + pos.lat +
    "&lon=" + pos.lng + "&zoom=" + map.getZoom();
  window.open(url, "_newtab");
});

/* Clean markers. */
$("#eraser").click(removeMarkers);

/* Go to current location. */
$("#geolocation").click(function() {
  throbber.show();
  getCurrentLocation(function(lat, lng, success) {
    throbber.hide();
    if (success) {
      /* 14 is an arbitrarily chosen default zoom level. */
      moveMap(lat, lng, 14);
    } else {
      $.errorDialog("Couldn’t get your current location.");
    }
  });
});
