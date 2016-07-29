cd ..\..

@ECHO OFF
set MONGOD=C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe
for /r "C:\Program Files\MongoDB" %%a in (*) do if /i "%%~nxa"=="mongod.exe" set "MONGOD=%%a"
@ECHO ON

START /b cmd /c "%MONGOD%" --dbpath=.mongodbdatabase

ECHO Wating for mongodb to start...
timeout /t 5 /nobreak

node serverside\web-server.js
