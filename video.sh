#!/usr/bin/env bash

if [ -f /.dockerinit ] || [ -f /.dockerenv ]; then

    cp -r examples/ /usr/local/lib/node_modules/himawari

    if [ -d video-out ]; then
        rm -rf video-out
    fi
    /usr/local/lib/node_modules/himawari/examples/video.js

else

    docker run --rm -v `pwd`:/tmp -it --entrypoint ./video.sh joergpatz/himawari

fi