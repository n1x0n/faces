#!/usr/bin/env bash

if [[ ! -z $APPLOGO ]]
then
    echo "Downloading logo $APPLOGO"
    SUFFIX=$( echo "$APPLOGO" | sed 's/.*\.//g' | tr '[:upper:]' '[:lower:]' )
    wget -O faces/static/img/logo.${SUFFIX} "$APPLOGO"
    APPLOGO="logo.${SUFFIX}"
fi

python run.py
