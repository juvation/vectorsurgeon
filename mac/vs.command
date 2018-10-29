#!/bin/sh

# figure out where we are
DIR=`dirname $0`

if [ -z "$DIR" ]
then
	DIR=.
fi

exec java -cp $DIR/vs.jar com.prophetvs.editor.ControlWindow




