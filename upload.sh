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

mac=$DIR/mac/VectorSurgeonMac.zip
windows=$DIR/windows/VectorSurgeonWindows.zip
linux=$DIR/linux/VectorSurgeonLinux.zip

if test ! -f $mac
then
	echo $mac not found, please to fix
	exit 1
fi

if test ! -f $windows
then
	echo $windows not found, please to fix
	exit 1
fi

if test ! -f $linux
then
	echo $linux not found, please to fix
	exit 1
fi

scp -i ~/ec2/Redfish.pem $mac $windows $linux ec2-user@redfish.net:prophetvs.com/editor/


