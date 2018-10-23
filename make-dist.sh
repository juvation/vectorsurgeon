#!/bin/bash

# figure out where we are
DIR=`dirname $0`

if [ -z "$DIR" ]
then
	DIR=.
else
	echo cd $DIR
	cd $DIR
fi

# copy jars into place

cp vs-mac.jar mac/vs.jar
cp vs.jar win
cp vs.jar linux

# Mac

cd mac
zip VectorSurgeonMac.zip vs.jar
zip VectorSurgeonMac.zip vs.command

# Win

cd ../windows
zip VectorSurgeonWindows.zip vs.jar
zip VectorSurgeonWindows.zip vs.bat

# Linux etc

cd ../linux
zip VectorSurgeonLinux.zip vs.jar
zip VectorSurgeonLinux.zip vs.sh

