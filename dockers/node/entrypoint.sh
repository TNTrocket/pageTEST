#!/usr/bin/env bash

#alias cnpm="npm --registry=https://registry.npm.taobao.org \
#--cache=$HOME/.npm/.cache/cnpm \
#--disturl=https://npm.taobao.org/dist \
#--userconfig=$HOME/.cnpmrc"
if [ ! -d node_modules ] ; then
  npm --registry=https://registry.npm.taobao.org install
fi
# cnpm install
#./node_modules/forever/bin/forever ./bin/www
 npm start
