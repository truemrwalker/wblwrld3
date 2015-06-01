//======================================================================================================================
// Controllers for Soap Client Webble for Webble World v3.0 (2013)
// Created By: truemrwalker
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================
wblwrld3App.controller('soapClientCtrl', function($scope, $log, Slot, Enum, dbService, $timeout) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        SoClHolder: ['width', 'height', 'background-color', 'border', 'border-radius'],
        SoClDisplay:['width', 'font-family', 'font-size', 'font-weight']
    };

    $scope.customMenu = [
      {itemId: 'info', itemTxt: 'How does this work?'},
      {itemId: 'createParam', itemTxt: 'Create Service Parameter Slot'}
    ];

    var SoClDisplay, initiationDone;
	var RestCallMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    $scope.soapWblProps = {
      currentWsdl: '',
      currentWsdlMethods: []
    };

    var myAccessKeyForSomething;


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization

    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        SoClDisplay = $scope.theView.parent().find("#SoClDisplay");

        $scope.addSlot(new Slot('serviceType',
            1,
            'Web Service Type',
            'Make sure that this is set to the right type for the service being invoked, for making sure it works properly',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: ['SOAP', 'REST']},
            undefined
        ));

        $scope.addSlot(new Slot('executeServiceCall',
            false,
            'Invoke Service Call',
            'In order to make the Webble call the service with the current set values, set this slot to true',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('displayRes',
            false,
            'Display Result',
            'if set the Webble will display the result of the soap call in a textarea on top of the Webble',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('serviceUrl',
            '',
            'Web Service URL',
            'This is the URL where the web service is that you would like to make a soap call to',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('serviceMethod',
            '',
            'Web Service Method Name',
            'APPLIES ONLY TO SOAP SERVICE. This is the method/function name that will be invoked in the service call as found available from the service WSDL',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('serviceMethodType',
          0,
          'Web Service Method Type',
          'APPLIES ONLY TO REST SERVICE. This is method/function type that usually is GET, but sometimes POST. If you do not know which one to use and GET does not work, experiment with the others',
          $scope.theWblMetadata['templateid'],
          {inputType: Enum.aopInputTypes.ComboBoxUseIndex, comboBoxContent: RestCallMethods},
          undefined
        ));

        $scope.addSlot(new Slot('serviceUsername',
            '',
            'Web Service Username',
            'If the web service requires authentication with username and password type it here, if not leave it blank.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('servicePassword',
            '',
            'Web Service Password',
            'If the web service requires authentication with username and password type it here, if not leave it blank.',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('result',
            '',
            'Result',
            'This is the returning result from the server after executing the service call (as default XML)',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('result').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('resultAsJson',
            '',
            'Result (As JSON)',
            'This is the returning result from the server after executing the service call (as a JSON Object)',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextArea},
            undefined
        ));
        $scope.getSlot('resultAsJson').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.addSlot(new Slot('APIKeyParameterName',
            '',
            'API Key Parameter Name',
            'If you need to send an API key with your REST call, include the name of the key parameter here (most common it is called simply "key")',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('APIKeyRealm',
            '',
            'API Key Realm',
            'If you want to collect a Webble account stored API key to use in your REST service call, use Realm (e.g. "Google") and Resource (e.g. "Map") in order to identify the key to use',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('APIKeyResource',
            '',
            'API Key Resource',
            'If you want to collect a Webble account stored API key to use in your REST service call, use Realm (e.g. "Google") and Resource (e.g. "Map") in order to identify the key to use',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.addSlot(new Slot('APIKeyIsLoaded',
            false,
            'API Key Is Loaded',
            'If this is set, it means an API key has been loaded from the users account and stored inside the webble to use with any future REST call',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));
        $scope.getSlot('APIKeyIsLoaded').setDisabledSetting(Enum.SlotDisablingState.PropertyEditing);

        $scope.setResizeSlots('SoClHolder:width', 'SoClHolder:height');

        initiationDone = $scope.$watch(function(){return $scope.eventInfo.loadingWebble;}, function(newVal, oldVal) {
            if(newVal != undefined && $scope.getInstanceId() == newVal){
                initiationDone();
                for(var slot in $scope.getSlots()){
                    if(slot.search('wbSrvcParam_') != -1){
                        var thePSlot = $scope.getSlot(slot);
                        var pName = slot.replace('wbSrvcParam_', '');
                        thePSlot.setDisplayName(pName);
                        thePSlot.setDisplayDescription('This is a web service parameter slot which value will be sent when invoking the web service with the selected method');
                    }
                }
            }
        }, true);

        $scope.$watch(function(){return $scope.gimme('executeServiceCall');}, function(newVal, oldVal) {
            if(newVal != undefined && newVal == true){
                $scope.set('result', '');
                $scope.set('resultAsJson', '');
                $timeout(function(){SoClDisplay.trigger('autosize.resize');});
                $scope.set('executeServiceCall', false);
                var serviceUrl = $scope.gimme('serviceUrl');
                var serviceMethod = $scope.gimme('serviceMethod');
				var serviceType = $scope.gimme('serviceType');
                if(serviceUrl != '' && (serviceMethod != '' || serviceType == 1)){
                    $scope.waiting(true);
                    $scope.showQIM("Call Made, Waiting for reply...", 20000);
                    if(serviceType == 0){ //SOAP
                        makeSoapCall(serviceUrl, serviceMethod);
                    }
                    else{ //REST
                        makeRestCall(serviceUrl, serviceMethod);
                    }
                }
                else{
                    $scope.showQIM("Service URL or Service Method are not set properly", 2000);
                }
            }
        }, true);

        $scope.$watch(function(){return $scope.wblEventInfo.slotChanged;}, function(newVal, oldVal) {
            if(newVal != undefined && newVal.slotname != undefined){
              if(newVal.slotname == 'serviceUrl' || newVal.slotname == 'serviceMethod') {
                  $scope.set('result', '');
                  $scope.set('resultAsJson', '');
                  $timeout(function () { SoClDisplay.trigger('autosize.resize'); });
              }
              else if(newVal.slotname == 'APIKeyRealm' || newVal.slotname == 'APIKeyResource') {
                  var apiRealm = $scope.gimme('APIKeyRealm');
                  var apiResource = $scope.gimme('APIKeyResource');
                  if(apiRealm != '' && apiResource != ''){
                      myAccessKeyForSomething = undefined;
                      $scope.set('APIKeyIsLoaded', false);
                      dbService.getMyAccessKey(apiRealm, apiResource).then(
                          function(returningKey) {
                                if(returningKey){
                                    myAccessKeyForSomething = returningKey;
                                    $scope.set('APIKeyIsLoaded', true);
                                    $scope.showQIM("API access key was collected and stored inside the Webble to be used with the next REST call", 3500, {w: 250, h: 80});
                                }
                                else{
                                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Access Key Found"), content: gettext("There was no key of the specified realm and resource saved in your user profile.")}, null);
                                }
                            },
                            function (err) {
                                $log.log("ERROR: " + err);
                            }
                      );
                  }
                  else{
                      myAccessKeyForSomething = undefined;
                      $scope.set('APIKeyIsLoaded', false);
                      $scope.showQIM("Stored API access key was unloaded from this Webble", 3000);
                  }
              }
            }
        }, true);

        $timeout(function(){$scope.set('SoClHolder:height', 'auto'); $scope.set('SoClHolder:width', 'auto'); SoClDisplay.autosize();}, 300);
    };
    //===================================================================================


    //===================================================================================
    // Make Soap Call
    // Make a soap service call using the current slot settings
    //===================================================================================
    var makeSoapCall = function(serviceUrl, serviceMethod){
        if(serviceUrl.toLowerCase().substring(serviceUrl.length-5) == '?wsdl'){ serviceUrl = serviceUrl.toLowerCase().replace("?wsdl", ''); }
        if($scope.gimme('serviceUsername') != ''){ SOAPClient.username = $scope.gimme('serviceUsername'); } else{ SOAPClient.username = null; }
        if($scope.gimme('servicePassword') != ''){ SOAPClient.password = $scope.gimme('servicePassword'); } else{ SOAPClient.password = null; }
        var pl = createServiceParametersObject();
        SOAPClient.invoke(serviceUrl, serviceMethod, pl, true, GetSoapResponse_callback);
    };
    //===================================================================================


    //===================================================================================
    // Make Rest Call
    // Make a rest service call using the current slot settings
    //===================================================================================
    var makeRestCall = function(serviceUrl, serviceMethod){
      var params = createServiceParametersObject();
      var methodType = RestCallMethods[parseInt($scope.gimme('serviceMethodType'))];
$log.log(methodType);
      if(methodType != undefined){
		  $.ajax({
			  url: serviceUrl,
			  type: methodType,
			  data: params,
			  beforeSend: function(xhr) {
				  if($scope.gimme('serviceUsername') != "" && $scope.gimme('servicePassword') != ""){
					  xhr.setRequestHeader("Authorization", "Basic " + btoa($scope.gimme('serviceUsername') + ":" + $scope.gimme('servicePassword')));
				  }
			  }
		  })
			  .done(GetRestResponse_callback)
			  .fail(restCallFailed);
      }
      else{
        $scope.waiting(false);
        $scope.showQIM("Method Type unknown. Service Call Canceled", 2500);
      }
    };
    //===================================================================================


    //===================================================================================
    // Rest Call Failed
    // If the Rest call failed, this method is invoked
    //===================================================================================
    var restCallFailed = function(e){
        $scope.waiting(false);
        $scope.showQIM("Call Made, Waiting for reply...", 1);
        alert("An ERROR occured! Please check your slot values and web service server status");
    };
    //===================================================================================


    //===================================================================================
    // Get Rest Response Callback
    // When the service send back the Rest response it invokes this method.
    //===================================================================================
    var GetRestResponse_callback = function(data){
      $scope.waiting(false);
      $scope.showQIM("Call Made, Waiting for reply...", 1);
      if(data != null && data != undefined){
        if(data.toString().toLowerCase().search('error') != -1){
            alert("An ERROR occured! Please check your slot values and web service server status");
            $log.log(data);
        }
        else{
          $scope.set('result', data);
          if(data.toString() != '[object Object]' && !$.isArray(data)){
              var jsonRes = (new Xml2Json()).xml_str2json( data );
              if(jsonRes != undefined && jsonRes != 1000){
                  $scope.set('resultAsJson', jsonRes);
              }
          }
          else{
              $scope.set('resultAsJson', data);
          }

          $timeout(function(){SoClDisplay.trigger('autosize.resize');}, 100);
        }
      }
    };
    //===================================================================================


    //===================================================================================
    // Get Soap Response Callback
    // When the service send back the Soap response it invokes this method.
    //===================================================================================
    var GetSoapResponse_callback = function(res){
        $scope.waiting(false);
        $scope.showQIM("Call Made, Waiting for reply...", 1);
        if(res != null && res != undefined){
            if(res.toString().toLowerCase().search('error') != -1){
                alert("An ERROR occured! Please check your slot values and web service server status");
                $log.log(res);
            }
            else{
                $scope.set('result', res);
                var jsonRes = (new Xml2Json()).xml_str2json( res );
                if(jsonRes != undefined && jsonRes != 1000){
                  $scope.set('resultAsJson', jsonRes);
                }
                $timeout(function(){SoClDisplay.trigger('autosize.resize');}, 100);
            }
        }
    };
    //===================================================================================


    //===================================================================================
    // XML to JSON (minified pack)
    // creates a json object from an XML string
    //===================================================================================
    var Xml2Json = function(v){var q="1.1.5";v=v||{};h();r();
      function h(){if(v.escapeMode===undefined){v.escapeMode=true;}v.attributePrefix=v.attributePrefix||"_";v.arrayAccessForm=v.arrayAccessForm||"none";v.emptyNodeForm=v.emptyNodeForm||"text";if(v.enableToStringFunc===undefined){v.enableToStringFunc=true;}v.arrayAccessFormPaths=v.arrayAccessFormPaths||[];if(v.skipEmptyTextNodesForObj===undefined){v.skipEmptyTextNodesForObj=true;}if(v.stripWhitespaces===undefined){v.stripWhitespaces=true;}v.datetimeAccessFormPaths=v.datetimeAccessFormPaths||[];}var g={ELEMENT_NODE:1,TEXT_NODE:3,CDATA_SECTION_NODE:4,COMMENT_NODE:8,DOCUMENT_NODE:9};
      function r(){function x(z){var y=String(z);if(y.length===1){y="0"+y;}return y;}if(typeof String.prototype.trim!=="function"){String.prototype.trim=function(){return this.replace(/^\s+|^\n+|(\s|\n)+$/g,"");};}if(typeof Date.prototype.toISOString!=="function"){Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+x(this.getUTCMonth()+1)+"-"+x(this.getUTCDate())+"T"+x(this.getUTCHours())+":"+x(this.getUTCMinutes())+":"+x(this.getUTCSeconds())+"."+String((this.getUTCMilliseconds()/1000).toFixed(3)).slice(2,5)+"Z";};}}function t(x){var y=x.localName;if(y==null){y=x.baseName;}if(y==null||y==""){y=x.nodeName;}return y;}function o(x){return x.prefix;}function p(x){if(typeof(x)=="string"){return x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");}else{return x;}}function j(x){return x.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#x2F;/g,"/");}function l(B,y,A){switch(v.arrayAccessForm){case"property":if(!(B[y] instanceof Array)){B[y+"_asArray"]=[B[y]];}else{B[y+"_asArray"]=B[y];}break;}if(!(B[y] instanceof Array)&&v.arrayAccessFormPaths.length>0){var x=0;for(;x<v.arrayAccessFormPaths.length;x++){var z=v.arrayAccessFormPaths[x];if(typeof z==="string"){if(z==A){break;}}else{if(z instanceof RegExp){if(z.test(A)){break;}}else{if(typeof z==="function"){if(z(B,y,A)){break;}}}}}if(x!=v.arrayAccessFormPaths.length){B[y]=[B[y]];}}}function a(C){var A=C.split(/[-T:+Z]/g);var B=new Date(A[0],A[1]-1,A[2]);var z=A[5].split(".");B.setHours(A[3],A[4],z[0]);if(z.length>1){B.setMilliseconds(z[1]);}if(A[6]&&A[7]){var y=A[6]*60+Number(A[7]);var x=/\d\d-\d\d:\d\d$/.test(C)?"-":"+";y=0+(x=="-"?-1*y:y);B.setMinutes(B.getMinutes()-y-B.getTimezoneOffset());}else{if(C.indexOf("Z",C.length-1)!==-1){B=new Date(Date.UTC(B.getFullYear(),B.getMonth(),B.getDate(),B.getHours(),B.getMinutes(),B.getSeconds(),B.getMilliseconds()));}}return B;}function n(A,y,z){if(v.datetimeAccessFormPaths.length>0){var B=z.split(".#")[0];var x=0;for(;x<v.datetimeAccessFormPaths.length;x++){var C=v.datetimeAccessFormPaths[x];if(typeof C==="string"){if(C==B){break;}}else{if(C instanceof RegExp){if(C.test(B)){break;}}else{if(typeof C==="function"){if(C(obj,y,B)){break;}}}}}if(x!=v.datetimeAccessFormPaths.length){return a(A);}else{return A;}}else{return A;}}function w(z,E){if(z.nodeType==g.DOCUMENT_NODE){var F=new Object;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);if(y.nodeType==g.ELEMENT_NODE){var D=t(y);F[D]=w(y,D);}}return F;}else{if(z.nodeType==g.ELEMENT_NODE){var F=new Object;F.__cnt=0;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);var D=t(y);if(y.nodeType!=g.COMMENT_NODE){F.__cnt++;if(F[D]==null){F[D]=w(y,E+"."+D);l(F,D,E+"."+D);}else{if(F[D]!=null){if(!(F[D] instanceof Array)){F[D]=[F[D]];l(F,D,E+"."+D);}}(F[D])[F[D].length]=w(y,E+"."+D);}}}for(var A=0;A<z.attributes.length;A++){var B=z.attributes.item(A);F.__cnt++;F[v.attributePrefix+B.name]=B.value;}var C=o(z);if(C!=null&&C!=""){F.__cnt++;F.__prefix=C;}if(F["#text"]!=null){F.__text=F["#text"];if(F.__text instanceof Array){F.__text=F.__text.join("\n");}if(v.escapeMode){F.__text=j(F.__text);}if(v.stripWhitespaces){F.__text=F.__text.trim();}delete F["#text"];if(v.arrayAccessForm=="property"){delete F["#text_asArray"];}F.__text=n(F.__text,D,E+"."+D);}if(F["#cdata-section"]!=null){F.__cdata=F["#cdata-section"];delete F["#cdata-section"];if(v.arrayAccessForm=="property"){delete F["#cdata-section_asArray"];}}if(F.__cnt==1&&F.__text!=null){F=F.__text;}else{if(F.__cnt==0&&v.emptyNodeForm=="text"){F="";}else{if(F.__cnt>1&&F.__text!=null&&v.skipEmptyTextNodesForObj){if((v.stripWhitespaces&&F.__text=="")||(F.__text.trim()=="")){delete F.__text;}}}}delete F.__cnt;if(v.enableToStringFunc&&(F.__text!=null||F.__cdata!=null)){F.toString=function(){return(this.__text!=null?this.__text:"")+(this.__cdata!=null?this.__cdata:"");};}return F;}else{if(z.nodeType==g.TEXT_NODE||z.nodeType==g.CDATA_SECTION_NODE){return z.nodeValue;}}}}function m(E,B,D,y){var A="<"+((E!=null&&E.__prefix!=null)?(E.__prefix+":"):"")+B;if(D!=null){for(var C=0;C<D.length;C++){var z=D[C];var x=E[z];if(v.escapeMode){x=p(x);}A+=" "+z.substr(v.attributePrefix.length)+"='"+x+"'";}}if(!y){A+=">";}else{A+="/>";}return A;}function i(y,x){return"</"+(y.__prefix!=null?(y.__prefix+":"):"")+x+">";}function s(y,x){return y.indexOf(x,y.length-x.length)!==-1;}function u(y,x){if((v.arrayAccessForm=="property"&&s(x.toString(),("_asArray")))||x.toString().indexOf(v.attributePrefix)==0||x.toString().indexOf("__")==0||(y[x] instanceof Function)){return true;}else{return false;}}function k(z){var y=0;if(z instanceof Object){for(var x in z){if(u(z,x)){continue;}y++;}}return y;}function b(z){var y=[];if(z instanceof Object){for(var x in z){if(x.toString().indexOf("__")==-1&&x.toString().indexOf(v.attributePrefix)==0){y.push(x);}}}return y;}function f(y){var x="";if(y.__cdata!=null){x+="<![CDATA["+y.__cdata+"]]>";}if(y.__text!=null){if(v.escapeMode){x+=p(y.__text);}else{x+=y.__text;}}return x;}function c(y){var x="";if(y instanceof Object){x+=f(y);}else{if(y!=null){if(v.escapeMode){x+=p(y);}else{x+=y;}}}return x;}function e(z,B,A){var x="";if(z.length==0){x+=m(z,B,A,true);}else{for(var y=0;y<z.length;y++){x+=m(z[y],B,b(z[y]),false);x+=d(z[y]);x+=i(z[y],B);}}return x;}function d(D){var x="";var B=k(D);if(B>0){for(var A in D){if(u(D,A)){continue;}var z=D[A];var C=b(z);if(z==null||z==undefined){x+=m(z,A,C,true);}else{if(z instanceof Object){if(z instanceof Array){x+=e(z,A,C);}else{if(z instanceof Date){x+=m(z,A,C,false);x+=z.toISOString();x+=i(z,A);}else{var y=k(z);if(y>0||z.__text!=null||z.__cdata!=null){x+=m(z,A,C,false);x+=d(z);x+=i(z,A);}else{x+=m(z,A,C,true);}}}}else{x+=m(z,A,C,false);x+=c(z);x+=i(z,A);}}}}x+=c(D);return x;}this.parseXmlString=function(z){var B=window.ActiveXObject||"ActiveXObject" in window;if(z===undefined){return null;}var A;if(window.DOMParser){var C=new window.DOMParser();var x=null;if(!B){try{x=C.parseFromString("INVALID","text/xml").childNodes[0].namespaceURI;}catch(y){x=null;}}try{A=C.parseFromString(z,"text/xml");if(x!=null&&A.getElementsByTagNameNS(x,"parsererror").length>0){A=null;}}catch(y){A=null;}}else{if(z.indexOf("<?")==0){z=z.substr(z.indexOf("?>")+2);}A=new ActiveXObject("Microsoft.XMLDOM");A.async="false";A.loadXML(z);}return A;};this.asArray=function(x){if(x instanceof Array){return x;}else{return[x];}};this.toXmlDateTime=function(x){if(x instanceof Date){return x.toISOString();}else{if(typeof(x)==="number"){return new Date(x).toISOString();}else{return null;}}};this.asDateTime=function(x){if(typeof(x)=="string"){return a(x);}else{return x;}};this.xml2json=function(x){return w(x);};this.xml_str2json=function(x){var y=this.parseXmlString(x);if(y!=null){return this.xml2json(y);}else{return null;}};this.json2xml_str=function(x){return d(x);};this.json2xml=function(y){var x=this.json2xml_str(y);return this.parseXmlString(x);};this.getVersion=function(){return q;};}
    //===================================================================================


    //===================================================================================
    // Create Soap Parameters Object
    // this method creates a soap parameters object and fills it with parameters saved a
    // slots with the prefix 'param_'.
    //===================================================================================
    var createServiceParametersObject = function(){
        var serviceType = $scope.gimme('serviceType');
        var pl;

        if(serviceType == 0){ //SOAP
            pl = new SOAPClientParameters();
        }
        else{  //REST
            pl = "";
        }

        for(var slot in $scope.getSlots()){
            if(slot.search('wbSrvcParam_') != -1){
                var pName = slot.replace('wbSrvcParam_', '');
                if(serviceType == 0){  //SOAP
                    pl.add(pName, $scope.gimme(slot));
                }
                else{  //REST
					pl = pl != "" ? pl += "&" : pl;
					pl += (pName + "=" + $scope.gimme(slot));
                }
            }
        }

        if(serviceType == 1){
            var APIKeyParameter = $scope.gimme('APIKeyParameterName');
            if(APIKeyParameter  != '' && myAccessKeyForSomething != undefined){
				pl = pl != "" ? pl += "&" : pl;
				pl += (APIKeyParameter + "=" + myAccessKeyForSomething);
            }
        }

        return pl;
    };
    //===================================================================================


    //========================================================================================
    // Close Add Service Parameter Form
    //========================================================================================
    var closeAddServiceParameterForm = function(returnContent){
      if(returnContent != null){
          if(returnContent != ''){
              var slotName = 'wbSrvcParam_' + returnContent;
              $scope.addSlot(new Slot(slotName,
                  '',
                  returnContent,
                  'This is a web service parameter slot which value will be sent when invoking the web service with the selected method',
                  'Service Parmeters',
                  {inputType: Enum.aopInputTypes.TextBox},
                  undefined
              ));
              $scope.getSlot(slotName).setIsCustomMade(true);
              $scope.showQIM("A new service parameter slot has been created", 2000);
          }
      }
    }
    //========================================================================================


    //===================================================================================
    // Webble template Menu Item Activity Reaction
    // If this template has its own custom menu items that needs to be taken care of,
    // then it is here where that should be executed.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_Event_WblMenuActivityReaction = function(itemName){
        if(itemName == $scope.customMenu[0].itemId){  //info
          $scope.openForm(Enum.aopForms.infoMsg, {title: 'How to Use Soap Client Service Webble', content:
            "<p>The first you need to do is of course to type in the url of the service you are using in the " +
            "[serviceUrl] slot and also the name of the method you wish to invoke in the [serviceMethod] slot</p>" +
            "<p>If the service requires parameters then you need to add those as slots. Most easy that is done " +
            "via the webble menu's [Create Service Parameter Slot] where you add the name of the parameter " +
            "(be careful with the spelling and capital letters since all web services are sensitive to that). " +
            "You can also create those parameters slots manually, but that is more inconvenioent and error prone." +
            "Next fill in the values of the parameters in the property form of the webble and finally incoke the " +
            "service call via the asigned slot [executeServiceCall].</p>" +
            "<p>To remove parameter slots, just delete them like you would any other custom made slot.</p>" +
            "<p>The result appear in the [result] slot. If the response is an XML, it will also be available " +
            "in the [resultAsJson] slot as a json object</p>" +
            "<p>If the service require authentication type username and password the dedicated slots, otherwise " +
            "just leave them blank.</p>" +
            "<p>If the service require an API key just make sure you have a key registered in your Webble World account and fill in the slots dedicated to that in the property form." +
            "<h3>Same Origin And Mixed Content Policy</h2>" +
            "<p>You won't be able to invoke a soap call to a service on a different domain and without https security " +
            "due to Same Origin Policy and Mixed Content Rules. To overcome this you should either make the service secure with https or change your browser settings for mixed content and also " +
            "maybe use <a href='http://en.wikipedia.org/wiki/Cross-origin_resource_sharing' target='_blank'>CORS</a>.</p>"}
          );
        }
        else if(itemName == $scope.customMenu[1].itemId){  //createParam
          $scope.openForm('addServiceParamForm', [{templateUrl: 'addParam-form.html', controller: 'addServiceParamForm_Ctrl', size: ''}, {}], closeAddServiceParameterForm);
        }
    };
    //===================================================================================


    //===================================================================================
    // Webble template Create Custom Webble Definition
    // If this template wants to store its own private data in the Webble definition it
    // can create that custom object here and return to the core.
    // If this function is empty and unused it can safely be deleted.
    //===================================================================================
    $scope.coreCall_CreateCustomWblDef = function(){
        var customWblDefPart = {

        };

        return customWblDefPart;
    };
    //===================================================================================

    //=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================



//*********************************************************************************************************************


//=======================================================================================
// EVENT ACTION MAIN FORM CONTROLLER
// This is the controller for this Webbles Event Action Manager Form
//=======================================================================================
wblwrld3App.controller('addServiceParamForm_Ctrl', function($scope, $log, $modalInstance, $timeout, Slot, Enum, props) {

    //=== PROPERTIES ====================================================================
    $scope.formitem = {
        nsName: ''
    };

    $scope.propMsgs = {
      info: "",
      tooltip: {
          nsName: 'Type the name of a service method parameter here and a slot will be created for use when invoking the service'
      }
    };


    //=== METHODS & FUNCTIONS ===========================================================

    //========================================================================================
    // Adjust Tooltip Placement By Device Width
    // the placement of the tooltip is by default at the bottom, but with smaller devices in
    // some rare cases that should be set to right instead.
    //========================================================================================
    $scope.adjustTooltipPlacementByDeviceWidth = function(){
      if($(document).width() < 410){
        return 'right';
      }
      else{
        return 'left';
      }
    };
    //========================================================================================

    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
      if(result == 'cancel'){
        $modalInstance.close(null);
      }
      else if(result == 'submit'){
        $modalInstance.close($scope.formitem.nsName);
      }
    };
    //========================================================================================


    //=== CTRL MAIN CODE ======================================================================
    $('#paramNameInputBox').focus();
});
//=======================================================================================
//======================================================================================================================
