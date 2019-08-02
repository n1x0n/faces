#!/usr/bin/env bash

# Since this is the standalone version of the start
# script we will remove "/api/" from all urls.

cat faces/static/js/script.js | sed 's/\/api\//\//g' > /tmp/dummy.js
mv /tmp/dummy.js faces/static/js/script.js

python run.py
