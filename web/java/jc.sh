#!/bin/sh

CLASSPATH=""
CLASSPATH=${CLASSPATH}:.

CLASSPATH=${CLASSPATH}:jackson-annotations-2.6.3.jar
CLASSPATH=${CLASSPATH}:jackson-core-2.6.3.jar
CLASSPATH=${CLASSPATH}:jackson-databind-2.6.3.jar

export CLASSPATH

exec javac -g $*

