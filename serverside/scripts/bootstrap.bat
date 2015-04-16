
set MONGO=..\..\..\..\TOOLS\mongodb\mongo.exe
set NODE=C:\Program Files\nodejs\node.exe

"%MONGO%" mongoshell.js
"%NODE%" ..\web-server.js --deployment bootstrap
