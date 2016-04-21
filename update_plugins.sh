#!/bin/bash

PLUGINS=$(cordova plugin list | awk '{print $1'})

for PLUGIN in $PLUGINS; do
    cordova plugin rm $PLUGIN && cordova plugin add $PLUGIN
done
