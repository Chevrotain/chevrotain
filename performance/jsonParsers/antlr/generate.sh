set -e
# look for new versions here: https://www.antlr.org/download.html
VERSION=4.13.2

curl --output antlr-$VERSION-complete.jar https://www.antlr.org/download/antlr-$VERSION-complete.jar

export CLASSPATH=antlr-$VERSION-complete.jar
java org.antlr.v4.Tool -Dlanguage=JavaScript -no-listener JSON_ANTLR.g4

rm antlr-$VERSION-complete.jar