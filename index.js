// =======================================================
// Requires
// =======================================================

var fs = require('fs')
// 
var sys = require("sys");
var my_http = require("http");
var url = require("url");

// =======================================================

// =======================================================
// External File Handling
// =======================================================
var projectName = "Project";
var orgName = "Org";
var configObj;

var data = fs.readFileSync("config.json");

configObj = JSON.parse(data);

// Twilio Credentials
var accountSid = configObj.twilioSID; 
var authToken = configObj.twilioAuthCode; 

projectName = configObj.projectName;
orgName = configObj.orgName;
registeredNumbers = configObj.registeredNumbers;

console.log(configObj);

try
{
	// using bitwise operator "or" | to drop fractions off the float instead of math.floor
	fs.appendFileSync("logs/errorLog.txt","\r\n===   " +projectName + " SMS Error Logging Server Started: " + (Date.now() / 1000 | 0) + "   ===");
}
catch (e)
{
	fs.mkdirSync("logs");
	fs.appendFileSync("logs/errorLog.txt","\r\n===   " +projectName + " SMS Error Logging Server Started: " + (Date.now() / 1000 | 0) + "   ===");
}

function saveConfigJSON()
{
	fs.writeFile("config.json",JSON.stringify(configObj,null,4),function (err){
		if (err) throw (err);
		console.log("config.json updated");
	});
}

function saveErrorLog(error)
{
	fs.appendFile("logs/errorLog.txt","\r\nError at " + (Date.now() / 1000 | 0) + ":\r\n" + error, function (err) {
	if (err) throw (err);
});
}

// =======================================================

// =======================================================
// Twilio
// =======================================================

//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken);
 
// Phone list
var registeredNumbers = [];

// =======================================================

// =======================================================
// HTTP
// =======================================================

my_http.createServer(onRequest).listen(8080);
console.log("Server created.");

function onRequest(request, response)
{
	console.log("Server got a hit");
	
	var pathname = url.parse(request.url).pathname;
	console.log("pathname: " + pathname);
	var query = url.parse(request.url).query;
	var responseString = "Pathname on " + projectName + " error server not recognized";
	if (pathname == "/error")
	{
		sendErrorLog(query);
		responseString = "Error Sent";
	}
	else if (pathname == "/addNumber")
	{
		addNumber(query);
		responseString = "Number Added";
	}
	else if (pathname == "/removeNumber")
	{
		removeNumber(query);
		responseString = "Number Removed";
	}
	else if (pathname == "/setProjectName")
	{
		setProjectName(query);
		responseString = "Project name set.";
	}
	
	response.writeHead(200, {'Content-Type':'text/plain'});
	response.write(responseString);
	response.end();
}

// =======================================================

function setProjectName(newProjectName)
{
	projectName = newProjectName;
	configObj.projectName = projectName;
	saveConfigJSON();
	console.log("Changed project name to: " + projectName);
	
	console.log(configObj);
}

function removeNumber(numberToRemove)
{
	for (var i = 0;i < registeredNumbers.length;i++)
	{
		if (registeredNumbers[i] == numberToRemove)
		{
			registeredNumbers.pop(numberToRemove);
			configObj.registeredNumbers = registeredNumbers;
			saveConfigJSON();
			
			console.log(configObj);
			
			console.log("Removed registered number: " + numberToRemove);
			// send a text message to the number to confirm that they have been removed
			client.messages.create({  
			to: numberToRemove,
			from: "+12405284950",
			body: "Your number has been REMOVED from " + orgName + " error reporting on " + projectName,
			}, function(err, message) { 

			});
			break;
		}
	}
}

function addNumber(numberToAdd)
{
	var matched = false;

	for (var i = 0;i < registeredNumbers.length;i++)
	{
		if (registeredNumbers[i] == numberToAdd)
		{
			matched = true;
		}
	}
	
	if (!matched)
	{
		console.log("Added registered number:" + numberToAdd);
		registeredNumbers.push(numberToAdd);
		configObj.registeredNumbers = registeredNumbers;
		saveConfigJSON();
		
		console.log(configObj);
		
		client.messages.create({  
		to: numberToAdd,
		from: "+12405284950",
		body: "Your number has been ADDED to " + orgName + " error reporting on " + projectName,
		}, function(err, message) { 

		});
	}
}

function sendErrorLog(errorMessage)
{
	console.log("query: " + errorMessage);
	for (var i = 0;i < registeredNumbers.length;i++)
	{
		if ((errorMessage != null) && (errorMessage != ""))
		{
			saveErrorLog(errorMessage);
			client.messages.create({  
			to: registeredNumbers[i],
			from: "+12405284950",
			body: projectName + ":: " + errorMessage,
			}, function(err, message) { 

			});
		}
	}
}

