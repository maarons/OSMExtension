.PHONY: clean fetch all opera firefox

JV=1.7.2
JUV=1.8.22
LV=0.4.2

all: opera firefox

fetch: lib/jquery-${JV}.min.js lib/jquery-ui-${JUV}.min.js lib/leaflet-${LV}

lib/jquery-${JV}.min.js:
	wget http://code.jquery.com/jquery-${JV}.min.js -O lib/jquery-${JV}.min.js

lib/jquery-ui-${JUV}.min.js:
	wget http://code.jquery.com/ui/${JUV}/jquery-ui.min.js -O lib/jquery-ui-${JUV}.min.js

lib/leaflet-${LV}:
	wget https://github.com/CloudMade/Leaflet/tarball/v${LV} -O - | tar xzf - --wildcards --transform "s:[^/]*/dist/:lib/leaflet-${LV}/:" "*/dist/leaflet.js" "*/dist/images"

firefox: fetch
	./firefox/build.sh

opera: fetch
	zip -r openstreetmap.oex config.xml COPYING lib opera README.md src/

clean:
	-rm -f openstreetmap.xpi
	-rm -f openstreetmap.oex
	-rm -f lib/jquery-*.min.js
	-rm -rf lib/leaflet-*
