/**
 * Fake UrlFetchApp.HTTPResponse object
 *
 * @param {number} responseCode
 * @param {string | undefined} responseContent
 *
 * @constructor
 */
FirebaseApp_.FetchResponse = function(responseCode, responseContent) {
  this.code = responseCode;
  this.content = responseContent;
};

/**
 * Return set HTTP response code
 *
 * @return {number}
 */
FirebaseApp_.FetchResponse.prototype.getResponseCode = function() {
  return this.code;
};

/**
 * Return set HTTP response content text
 *
 * @return {string | undefined}
 */
FirebaseApp_.FetchResponse.prototype.getContentText = function() {
  return this.content;
};
