var data = require("self").data;

var map_panel = require("panel").Panel({
  // 500 + 2 * 5 + 26
  height: 536,
  width: 660,
  contentURL: data.url("src/map.html")
});

require("widget").Widget({
  id: "osm-extension-button",
  label: "OpenStreetMap",
  contentURL: data.url("firefox/osm-logo-128.png"),
  panel: map_panel
});
