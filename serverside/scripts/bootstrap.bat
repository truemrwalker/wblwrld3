
set MONGO=..\..\..\..\TOOLS\mongodb\mongo.exe
set NODE=C:\Program Files\nodejs\node.exe

"%NODE%" mongoshellgen.js
"%MONGO%" mongoshell.js
"%NODE%" ..\web-server.js --deployment bootstrap
