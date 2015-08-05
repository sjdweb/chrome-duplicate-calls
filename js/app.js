angular.module('dupeApp', []);

angular.module('dupeApp').controller('ResultsController', [
	'$scope', 'requestsService', function ($scope, requestsService) {
		$scope.requestsService = requestsService;

		$scope.getDuplicateResponses = function() {
			return requestsService.getDuplicateResponses();
		};

		chrome.webRequest.onHeadersReceived.addListener(function(n) {
			requestsService.addResponse(n);
	    }, {
	        urls: ["<all_urls>"],
	        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
	    }, ["blocking", "responseHeaders"]);

	    chrome.webRequest.onSendHeaders.addListener(function(n) {
	    	requestsService.addRequest(n);
	    }, {
	        urls: ["<all_urls>"],
	        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
	    }, ["requestHeaders"]);
}]);

angular.module('dupeApp').factory('requestsService', ['$rootScope', function($rootScope) {
	var requests = [];
	var responses = [];

	function addRequest(req) {
		requests.push(req);
	}

	function ResponseGroup(frameId, method, url, response) {
		this.frameId = frameId;
		this.method = method;
		this.url = url;
		this.responses = response ? [response] : [];
		this.lastUpdated = Date.now();

		this.addResponse = function(res) {
			this.responses.push(res);
			this.lastUpdated = Date.now();
		};

		this.requestCount = function() {
			return this.responses.length;
		};
	}

	function addResponse(res) {
		var exists = _.findWhere(responses, { frameId: res.frameId, method: res.method, url: res.url });
		if(exists) {
			$rootScope.$apply(function() {
				exists.addResponse(res);
			});
		} else {
			$rootScope.$apply(function() {
				responses.push(new ResponseGroup(res.frameId, res.method, res.url));
			});
		}
	}

	return {
		addRequest: function(req) {
			addRequest(req);
		},
		addResponse: function(res) {
			addResponse(res);
		},
		getDuplicateResponses: function() {
			return responses.filter(function(r) {
				return r.responses.length > 1;
			});
		},
		clear: function() {
			requests.length = 0;
			responses.length = 0;
		}
	};
}]);