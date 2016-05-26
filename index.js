/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/


var APP_ID = ""; 


var AlexaSkill = require('./AlexaSkill');


var http = require('http');


 function getDebtResponse(response) {
	 
	 makeDebtRequest(function debtLoadedCallback(err, debtResponse) {
		 
		var speechOutput; 
	
		var result = []; 
		
		console.log("debtLoadedCallback was run.");
		
		if (err) {
			speechOutput = "Sorry, Reporter is having trouble retrieving the latest U.S federal debt value right now. Please try again later.";
		} else {

			getNames(debtResponse, "b"); 

			function getNames(obj, name) {

				for (var key in obj) {

					if (obj.hasOwnProperty(key)) {

						if ("object" == typeof(obj[key])) {
							
							getNames(obj[key], name); 
						
						} else if (key == name) {

							result.push(obj[key].toString());
						} 
					} 
				} 
			} 


			function removeExtra(result, extra) {
				var matchingString = result.indexOf(extra, matchingString);
				
				while (matchingString !== -1) {
					result.splice(matchingString, 1); 
					matchingString = result.indexOf(extra); 
				} 
			}
			
			function handleEscapeStrings() {
				
				var d = 0; 
				var end = result.length; 
				
				for (d; d < end; d++) {
					if (result[d].indexOf("\r") != -1) {
							
						var intermediaryResultArray = [];
						intermediaryResultArray = result[d].split("\r");

						result.splice.apply(result,[d,1].concat(intermediaryResultArray));
						
						end = result.length; 
						
					} 
				
				} 
				
				d = 0;
				end = result.length;
				
				for (d; d < end; d++) {
					if (result[d].indexOf("\n") != -1) {
								
						var intermediaryResultArray = [];
						intermediaryResultArray = result[d].split("\n");

						result.splice.apply(result,[d,1].concat(intermediaryResultArray));
						
						end = result.length; 
						
						console.log("new result element d is: " + result[d].toString());
						
					} 
					
				} 

				d = 0;
				end = result.length;
				
				for (d; d < end; d++) {
					console.log("iteration " + d);
					if (result[d] === undefined) {
						result.splice(d, 1); 
					} else if (result[d].toString() == "") {
						result.splice(d, 1); 
					} else if (result[d].toString() == null) {
						result.splice(d, 1); 
					}
				} 
				
			} 
			
			handleEscapeStrings(); 

			console.log(result.toString()); 
			
			var intermediarySpeech;
			

			if (/^\s+$/.test(result.toString())) {
				intermediarySpeech = "<speak>An error has occurred. Please try again later. If you continue to receive this message, please contact the developer."
			} else {
				intermediarySpeech = "<speak>The current U.S federal government debt is: ";


				for (var c = 0; c < result.length; c++) {
					intermediarySpeech += "<p>" + result[c].toString() + "</p> <break time='1s'/>";
				} 
				
			} 

			intermediarySpeech += ". You can visit u s governement debt dot u s in your web browser to learn more .</speak>";
			
			console.log("intermediarySpeech output = " + intermediarySpeech.toString());
			
			speechOutput = {
				speech: intermediarySpeech.toString(),
				type: AlexaSkill.speechOutputType.SSML
			}
			
			response.tell(speechOutput);
			
		} 

	});
	 
 } 

function makeDebtRequest(debtLoadedCallback) {
	 
	var baseURL = "http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D%22http%3A%2F%2Fwww.usgovernmentdebt.us%2F%22%20and%20xpath%3D%22%2F%2F*%5B%40id%3D'broad_col2'%5D%2Fdiv%5B2%5D%2Fp%5B1%5D%2Fb%22&format=json&_maxage=60&_nocache=";
	
	var currentTimeStamp = Date.now();
	
	var url = baseURL + currentTimeStamp;
	
	console.log(url);
	
	http.get(url, function (res) {
        var debtResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            debtLoadedCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            debtResponseString += data;
        });

        res.on('end', function () {
            var debtResponseObject = JSON.parse(debtResponseString);

            if (debtResponseObject.error) {
                console.log("Drudge Report error: " + debtResponseObject.error.message);
                debtLoadedCallback(new Error(debtResponseObject.error.message));
            } else {
                debtLoadedCallback(null, debtResponseObject);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        debtLoadedCallback(new Error(e.message));
    });
	
} 


/**
 * ReporterDebtRequester is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see http://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var ReporterDebtRequester = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
ReporterDebtRequester.prototype = Object.create(AlexaSkill.prototype);
ReporterDebtRequester.prototype.constructor = ReporterDebtRequester;

ReporterDebtRequester.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("ReporterDebtRequester onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

ReporterDebtRequester.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("ReporterDebtRequester onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleNewDebtRequest(response);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
ReporterDebtRequester.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("ReporterDebtRequester onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

ReporterDebtRequester.prototype.intentHandlers = {
    "GetNewDebtIntent": function (intent, session, response) {
		console.log("new debt value intent reached");
		handleNewDebtRequest(response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask Reporter to tell you the current U.S federal debt, or, you can say exit... What can I help you with?", "What can I help you with?");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function handleNewDebtRequest(response) {
	
	getDebtResponse(response); 
	
} 


exports.handler = function (event, context) {	
	

    var debtRequester = new ReporterDebtRequester();
	
    debtRequester.execute(event, context);
};

