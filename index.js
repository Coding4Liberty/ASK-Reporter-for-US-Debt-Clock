/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID = ""; 

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var https = require('https');


function getDebtResponse(response) {
	 
	 makeDebtRequest(function debtLoadedCallback(err, debtResponse) {
		 
		var speechOutput; 
	
		var result = []; 
		
		console.log("debtLoadedCallback was run.");
		
		if (err) {
			speechOutput = "Sorry, Reporter is having trouble retrieving the latest U.S federal debt value right now. Please try again later.";
		} else {

			getNames(debtResponse, "content"); 

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

			var intermediarySpeech;
			
			if (/^\s+$/.test(result.toString())) {
				intermediarySpeech = "<speak>An error has occurred. Please try again later. If you continue to receive this message, please contact the developer."
			} else {
				intermediarySpeech = "<speak>The current U.S federal government debt is: $";

				for (var c = 0; c < result.length; c++) {
					intermediarySpeech += result[c].toString() + ". <break time='1s'/>";
				} 
				
			} 

			intermediarySpeech += ". You can visit national debt clocks dot org in your web browser to learn more .</speak>";
			
			speechOutput = {
				speech: intermediarySpeech.toString(),
				type: AlexaSkill.speechOutputType.SSML
			}
			
			response.tell(speechOutput);
			
		}

	}); 
	 
} 

function makeDebtRequest(debtLoadedCallback) {
		 
	var baseURL = "https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D%22http%3A%2F%2Fwww.nationaldebtclocks.org%2Fdebtclock%2Funitedstates%22%20and%20xpath%3D%22%2F%2F*%5B%40id%3D'debtDisplayFast'%5D%22&format=json";
	
	var url = baseURL; 
	
	https.get(url, function (res) {
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

