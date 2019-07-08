/**
 * Pre-build all Urls
 *
 * @param {Array<string | Request>} requests
 * @param {FirebaseApp_.Base} db information of the database
 *
 * @return {Array<Object | *>}
 */
buildAllRequests_ = function(requests, db) {
  var authToken = db.base.secret;
  var finalRequests = [];
  var headers = {};

  // Deep copy of object to avoid changing it
  /** @type {Array<string | Request>} */
  var initialRequests = JSON.parse(JSON.stringify(requests));

  // Check if authentication done via OAuth 2 access token
  if (authToken && authToken.indexOf('ya29.') !== -1) {
    headers['Authorization'] = 'Bearer ' + authToken;
    authToken = '';
  }

  // Prepare all URLs requests
  for (var i = 0; i < initialRequests.length; i++) {
    var request = initialRequests[i];

    // Transform string request in object
    if (typeof request === 'string') {
      request = {
        optQueryParameters: {},
        path: request
      };
    } else {
      // Make sure that query parameters are initialized
      request.optQueryParameters = request.optQueryParameters || {};
      request.path = request.path || '';
    }

    // Init request object
    var requestParams = {
      muteHttpExceptions: true,
      headers: {},
      url: '',
      method: request.method || 'get'
    };

    // Add data if any
    if ('data' in request) {
      requestParams.payload = JSON.stringify(request.data);
    }

    // Add Authorization header if necessary
    if (headers['Authorization']) {
      requestParams.headers['Authorization'] = headers['Authorization'];
    }

    // Change parameters for PATCH method
    if (requestParams.method === 'patch') {
      requestParams.headers['X-HTTP-Method-Override'] = 'PATCH';
      requestParams.method = 'post';
    }

    // Add authToken if needed
    if (authToken) {
      request.optQueryParameters['auth'] = authToken;
    }

    // Query parameters in URLs aren't parsed correctly (and are not RFC-compliant, according to RFC 3986, Section 2).
    // To parse URLs in queries correctly, we need to add the X-Firebase-Decoding: 1 header to all REST requests.
    requestParams.headers['X-Firebase-Decoding'] = 1;
    // This workaround is temporary. An update expected in February 2019 will resolve issues with parsing URLs in query parameters.
    // Learn more: https://firebase.google.com/support/releases#november_12_2018

    // Build parameters before adding them in the url
    var parameters = [];
    for (var key in request.optQueryParameters) {
      // Encode non boolean parameters (except whitelisted keys)
      if (
        !FirebaseApp_._keyWhiteList[key] &&
        typeof request.optQueryParameters[key] === 'string'
      ) {
        request.optQueryParameters[key] = encodeURIComponent(
          '"' + request.optQueryParameters[key] + '"'
        );
      }

      parameters.push(key + '=' + request.optQueryParameters[key]);
    }

    // Build request URL, encode all "%" to avoid URL path auto decoding
    requestParams.url =
      db.base.url +
      request.path.replace(/%/g, '%25').replace(/\+/g, '%2b') +
      '.json' +
      (parameters.length ? '?' + parameters.join('&') : '');

    // Store request
    finalRequests.push(requestParams);
  }

  // Get request results
  FirebaseApp_._sendAllRequests(finalRequests, initialRequests, db);
  var data = [];

  // Store each response in an object with the respective Firebase path as key
  for (var j = 0; j < initialRequests.length; j++) {
    data.push(
      'response' in initialRequests[j]
        ? initialRequests[j].response
        : initialRequests[j].error
    );
  }

  return data;
};
