var button = opera.contexts.toolbar.createItem({
  title: "OpenStreetMap",
  icon: "opera/osm-logo-18.png",
  popup: {
    href: "../src/map.html",
    // 500 + 2 * 5 + 26
    height: 536,
    width: 660
  }
});
opera.contexts.toolbar.addItem(button);
