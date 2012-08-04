# License

This extension is free software licensed under the X11 license, you are welcome
to share it and/or modify it.  See `COPYING` for the full license text.

# Usage



# Packaging

This extension can be packaged as a Mozilla Firefox or Opera by runing `make
firefox` or `make opera` respectively.  To package this extension for Google
Chromium and Google Chrome you should run `make fetch` and then follow the
[official packaging
instructions](http://code.google.com/chrome/extensions/packaging.html).

# Browser specific files

These files are needed to package this extension for a specific platform.

## Mozilla Firefox

    package.json
    firefox/
    data

## Google Chromium and Google Chrome

    manifest.json
    chromium/

## Opera

    config.xml
    opera/
