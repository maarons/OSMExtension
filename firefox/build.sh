#!/bin/bash
which cfx &> /dev/null
HAS_CFX=$?
if [[ $HAS_CFX -eq 1 ]]; then
    echo "Downloading Add-on SDK…"
    CURRENT_DIR=`pwd`
    TMP_DIR=`mktemp -d`
    cd "$TMP_DIR"
    wget -q https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.zip
    unzip jetpack-sdk-latest.zip &> /dev/null
    echo "Done."
    cd addon-sdk-*
    source "bin/activate" &> /dev/null
    cd "$CURRENT_DIR"
fi
cfx xpi
