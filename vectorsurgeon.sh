#!/bin/sh

DIR=`echo $0 | sed 's?\(.*/\).*?\1?'`

CLASSPATH=${DIR}/vs.jar
export CLASSPATH

exec java com.prophetvs.editor.ControlWindow




