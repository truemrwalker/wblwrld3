@ECHO ON

cd ..\..

CALL git pull

CALL npm install
CALL bower install --force-latest
