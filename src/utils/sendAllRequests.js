/**
 * Send all request using UrlFetchApp.fetchAll()
 * The results are directly written in the originalsRequests objects (in the <error> and <response> fields
 *
 * @param {Array.<{url: string, headers: {}, muteHttpExceptions: boolean, method: string, [data]: string}>} finalRequests
 * @param {Array<FirebaseApp_.request>} originalsRequests - location of each data
 * @param {FirebaseApp_.Base} db - information of the database
 * @param {number} [n] - exponential back-off count
 *
 * @return {*}
 * @private
 */
FirebaseApp_._sendAllRequests = function(
  finalRequests,
  originalsRequests,
  db,
  n
) {
  var responses;

  // If we only have one request, use fetch() instead of fetchAll(), as it's quicker
  if (finalRequests.length === 1) {
    try {
      responses = [UrlFetchApp.fetch(finalRequests[0].url, finalRequests[0])];
    } catch (e) {
      // As muteHttpExceptions is set to true we are only catching timeout errors here (after 60s)
      // If we are writing data, assume Firebase will eventually write -> ignore failure
      if (FirebaseApp_._methodWhiteList[finalRequests[0].method]) {
        responses = [new FirebaseApp_.FetchResponse(200, undefined)];
      } else {
        responses = [
          new FirebaseApp_.FetchResponse(400, 'Bad request or Time-out')
        ];
      }
    }
  }
  // For multiple request, use fetchAll()
  else {
    try {
      responses = UrlFetchApp.fetchAll(finalRequests);
    } catch (e) {
      // <e> will contain the problematic URL (only one) in clear, so with the secret if provided.
      // As we are not able to clearly tell which request crashed, and we will not retry with excluding request one by one
      throw new Error(FirebaseApp_.NORMALIZED_ERRORS.GLOBAL_CRASH);
    }
  }

  var errorCount = 0;
  // to push all requests that should be retried
  var retry = {
    finalReq: [],
    originalReq: []
  };

  // Init exponential back-off counter
  n = n || 0;

  // Process all responses
  for (var i = 0; i < responses.length; i++) {
    var responseCode = responses[i].getResponseCode();

    // print=silent, used to improve write performance returns a 204 No Content on success
    // https://firebase.google.com/docs/database/rest/save-data#section-rest-write-performance
    if (responseCode === 204) {
      originalsRequests[i].response = undefined;

      // Delete possible previous error (when in re-try)
      delete originalsRequests[i].error;

      continue;
    }

    var responseContent = responses[i].getContentText();

    // if response content is a string and contains the Firebase secret, assume it's an error on which a retry is needed
    // and replace the error returned by a generic one to avoid throwing the secret
    if (
      db.base.secret &&
      typeof responseContent === 'string' &&
      responseContent.indexOf(db.base.secret) !== -1
    ) {
      errorCount += 1;

      originalsRequests[i].error = new Error(
        FirebaseApp_.NORMALIZED_ERRORS.TRY_AGAIN
      );

      retry.finalReq.push(finalRequests[i]);
      retry.originalReq.push(originalsRequests[i]);

      continue;
    }

    var errorMessage;
    var responseParsed;
    // try parsing response
    try {
      responseParsed = JSON.parse(responseContent);
    } catch (e) {
      // if responseContent is undefined => internal error on UrlFetch service, try again
      // It is caught as JSON.parse(undefined) fails ("Unexpected token")
      errorMessage = FirebaseApp_.NORMALIZED_ERRORS.TRY_AGAIN;
    }

    // Save valid response
    if (responseCode === 200 && !errorMessage) {
      // For POST request, the result is a JSON {"name": "$newKey"} and we want to return the $newKey
      if (
        finalRequests[i].method === 'post' &&
        finalRequests[i].headers['X-HTTP-Method-Override'] !== 'PATCH'
      ) {
        originalsRequests[i].response =
          (responseParsed && responseParsed['name']) || '';
      } else {
        originalsRequests[i].response = responseParsed;
      }

      // Delete possible previous error (when in re-try)
      delete originalsRequests[i].error;

      continue;
    }

    if (responseCode === 401) {
      originalsRequests[i].error = new Error(
        responseParsed.error || FirebaseApp_.NORMALIZED_ERRORS.PERMISSION_DENIED
      );

      continue;
    }

    // Retry on specific response codes, specific error messages or if we failed to parse the response
    if (
      FirebaseApp_._errorCodeList[responseCode] ||
      errorMessage ||
      (responseParsed &&
        responseParsed.error &&
        !FirebaseApp_.NORETRY_ERRORS[responseParsed.error])
    ) {
      errorCount += 1;

      // Add the response code to the error message if it comes from the response
      originalsRequests[i].error =
        responseParsed && responseParsed.error
          ? new Error(responseCode + ' - ' + responseParsed.error)
          : new Error(errorMessage || FirebaseApp_.NORMALIZED_ERRORS.TRY_AGAIN);

      retry.finalReq.push(finalRequests[i]);
      retry.originalReq.push(originalsRequests[i]);

      continue;
    }

    // All other cases are errors that we do not retry
    originalsRequests[i].error = new Error(
      FirebaseApp_.NORMALIZED_ERRORS.TRY_AGAIN
    );
  }

  // Retry at max 6 times on failed calls
  // and - for the first try - only retry if
  // there are less than 100 errors and the error number account for less than a quarter of the requests
  // This is to avoid emptying the UrlFetchApp quota for nothing
  if (
    errorCount &&
    n <= 6 &&
    (n > 0 || (errorCount <= 100 && errorCount < originalsRequests.length / 4))
  ) {
    // Exponential back-off is needed as server errors are more and more common on Firebase
    Utilities.sleep(Math.pow(2, n) * 1000 + Math.round(Math.random() * 1000));

    FirebaseApp_._sendAllRequests(retry.finalReq, retry.originalReq, db, n + 1);
  }
};
