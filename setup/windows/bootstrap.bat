@ECHO ON

cd ..\..

CALL npm install -g bower
CALL npm install
CALL bower install --force-latest

cd serverside\scripts
CALL node mongoshellgen.js
cd ..\..

mkdir .mongodbdatabase

@ECHO OFF
set MONGOD=C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe
for /r "C:\Program Files\MongoDB" %%a in (*) do if /i "%%~nxa"=="mongod.exe" set "MONGOD=%%a"
@ECHO ON

START /b cmd /c "%MONGOD%" --dbpath=.mongodbdatabase

@ECHO OFF
set MONGO=C:\Program Files\MongoDB\Server\3.2\bin\mongo.exe
for /r "C:\Program Files\MongoDB" %%a in (*) do if /i "%%~nxa"=="mongo.exe" set "MONGO=%%a"
@ECHO ON

CALL "%MONGO%" serverside\scripts\mongoshell.js

node serverside\web-server.js --deployment bootstrap
