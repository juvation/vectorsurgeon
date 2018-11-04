#!/bin/sh

# figure out where we are
DIR=`dirname $0`

if [ -z "$DIR" ]
then
	DIR=.
fi

cd $DIR/VectorSurgeonMac

exec java -cp vs.jar:mmj.jar com.prophetvs.editor.ControlWindow




