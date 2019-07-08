/**
 * @typedef BaseType
 *
 * @property {string} url
 * @property {string} [secret]
 * @property {string} [serviceAccountEmail]
 * @property {string} [privateKey]
 *
 */

/**
 * @typedef {Object} QueryParameters
 * @property {string} [auth]
 * @property {string} [shallow]
 * @property {string} [print]
 * @property {string} [limitToFirst]
 * @property {string} [limitToLast]
 */

/**
 * @typedef {Object} Request
 * @property {string}  path
 * @property {'get' | 'post' | 'put' | 'patch' | 'delete'}  [method]
 * @property {*}  [data]
 * @property {QueryParameters}  optQueryParameters
 * @property {Object}  [response]
 * @property {Error}  [error]
 */

/**
 * @class
 */
function Base(settings) {
  /**
   * @name Base#base
   * @type {BaseType}
   */
  this.base = settings;
}

/**
 * Returns the data at this path
 *
 * @param  {string} path - the path where the data is stored
 * @param  {QueryParameters} [queryParameters] - a set of query parameters
 *
 * @returns {Object} the data found at the given path
 */
Base.prototype.getData = function(path, queryParameters) {
  var request = {
    method: 'get',
    path: path,
    optQueryParameters: queryParameters
  };

  var [res] = buildAllRequests_([request], this);

  if (res instanceof Error) {
    throw res;
  }

  return res;
};

/**
 * Returns data in all specified paths
 *
 * @param  {Array<string | Request>} requests - array of requests
 *
 * @return {object} responses to each requests
 */
Base.prototype.getAllData = function(requests) {
  return buildAllRequests_(requests, this);
};

/**
 * Write data at the specified path
 *
 * @param  {string} path - the path where to write data
 * @param  {object} data - the data to be written at the specified path
 * @param  {QueryParameters} [optQueryParameters] - a set of query parameters
 *
 * @return {object} the data written
 */
Base.prototype.setData = function(path, data, queryParameters) {
  var request = {
    method: 'put',
    path: path,
    data: data,
    optQueryParameters: queryParameters
  };

  var [res] = buildAllRequests_([request], this);

  if (res instanceof Error) {
    throw res;
  }

  return res;
};

/**
 * Generates a new child location using a unique key
 *
 * @param  {string} path - the path where to create a new child
 * @param  {object} data - the data to be written at the generated location
 * @param  {QueryParameters} [optQueryParameters] - a set of query parameters
 *
 * @return {string} the child name of the new data that was added
 */
Base.prototype.pushData = function(path, data, optQueryParameters) {
  var request = {
    method: 'post',
    path: path,
    data: data,
    optQueryParameters: optQueryParameters
  };

  var [res] = buildAllRequests_([request], this);

  // Throw error
  if (res instanceof Error) {
    throw res;
  }

  return res;
};

/**
 * Update specific children at the specified path without overwriting existing data
 *
 * @param  {string} path - the path where to update data
 * @param  {object} data - the children to overwrite
 * @param  {QueryParameters} [optQueryParameters] a - set of query parameters
 *
 * @return {object} the data written
 */
Base.prototype.updateData = function(path, data, optQueryParameters) {
  var request = {
    method: 'patch',
    path: path,
    data: data,
    optQueryParameters: optQueryParameters
  };

  var [res] = buildAllRequests_([request], this);

  if (res instanceof Error) {
    throw res;
  }

  return res;
};

/**
 * Delete data at the specified path
 *
 * @param  {string} path - the path where to delete data
 * @param  {QueryParameters} [optQueryParameters] - a set of query parameters
 * @return {null}
 */
Base.prototype.removeData = function(path, optQueryParameters) {
  var request = {
    method: 'delete',
    path: path,
    optQueryParameters: optQueryParameters
  };

  var [res] = buildAllRequests_([request], this);

  if (res instanceof Error) {
    throw res;
  }

  return res;
};

/**
 * Generates an authorization token to firebase
 *
 * @param  {string} userEmail the email account of the user you want to authenticate
 * @param  {object} optAuthData key-pairs of data to be associated to this user.
 * @param  {string} serviceAccountEmail the email of the service account used to generate this token
 * @param  {string} privateKey the private key of this service account
 * @return {object} the auth token granting access to firebase
 */
Base.prototype.createAuthToken = function(
  userEmail,
  optAuthData,
  serviceAccountEmail,
  privateKey
) {
  if (arguments.length > 2) {
    //more then two means they want to use a service account
    if (typeof arguments[1] === 'string') {
      // no optional data
      this.base.serviceAccountEmail = arguments[1];
      this.base.privateKey = arguments[2];
      optAuthData = {};
    } else if (typeof arguments[1] === 'object') {
      // optional data is present
      this.base.serviceAccountEmail = serviceAccountEmail;
      this.base.privateKey = privateKey;
    }
    return this.createAuthTokenFromServiceAccount_(userEmail, optAuthData);
  } else {
    return this.createLegacyAuthToken_(userEmail, optAuthData);
  }
};

/**
 * Generates an authorization token to Firebase
 *
 * @param  {string} userEmail - the email account of the user you want to authenticate
 * @param  {Object} optCustomClaims - key-pairs of data to be associated to this user (aka custom claims).
 *
 * @return {Object} the auth token granting access to firebase
 */
Base.prototype.createAuthTokenFromServiceAccount_ = function(
  userEmail,
  optCustomClaims
) {
  if (!('serviceAccountEmail' in this.base) || !('privateKey' in this.base)) {
    throw Error(
      'You must provide both the serviceEmailAccount and the privateKey to generate a token'
    );
  }

  var header = JSON.stringify({
    typ: 'JWT',
    alg: 'RS256'
  });
  header = Utilities.base64EncodeWebSafe(header);

  var now = Math.floor(new Date().getTime() / 1e3);
  var body = {
    iss: this.base.serviceAccountEmail,
    sub: this.base.serviceAccountEmail,
    aud:
      'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid: userEmail.replace(/[|&;$%@"<>()+,.]/g, ''),
    claims: {}
  };

  // Add custom claims if any
  optCustomClaims &&
    Object.keys(optCustomClaims).forEach(function(item) {
      // Throw on invalid Custom Claims key (https://firebase.google.com/docs/auth/admin/custom-claims#set_and_validate_custom_user_claims_via_the_admin_sdk)
      if (FirebaseApp_._CustomClaimBlackList[item]) {
        throw new Error(
          FirebaseApp_.NORMALIZED_ERRORS.INVALID_CUSTOM_CLAIMS_KEY
        );
      }

      body.claims[item] = optCustomClaims[item];
    });

  // Check Custom Claims length
  if (JSON.stringify(body.claims).length > 1000) {
    throw new Error(
      FirebaseApp_.NORMALIZED_ERRORS.INVALID_CUSTOM_CLAIMS_LENGTH
    );
  }

  body = JSON.stringify(body); // Stringified after adding optional auth data
  body = Utilities.base64Encode(body);
  var signature = Utilities.computeRsaSha256Signature(
    header + '.' + body,
    this.base.privateKey
  );
  return header + '.' + body + '.' + Utilities.base64Encode(signature);
};

/**
 * Generates an authorization token to firebase
 *
 * @param  {string} userEmail the email account of the user you want to authenticate
 * @param  {Object} optCustomClaims - key-pairs of data to be associated to this user (aka custom claims).
 * @return {Object} the auth token granting access to firebase
 */
Base.prototype.createLegacyAuthToken_ = function(userEmail, optCustomClaims) {
  var header = JSON.stringify({
    typ: 'JWT',
    alg: 'HS256'
  });
  header = Utilities.base64EncodeWebSafe(header);
  var payload = {
    v: 0,
    d: {
      uid: userEmail.replace(/[|&;$%@"<>()+,.]/g, '')
    }, // iat : 'issued at' in second
    iat: Math.floor(new Date().getTime() / 1e3)
  };
  if (optCustomClaims) {
    Object.keys(optCustomClaims).forEach(function(item) {
      payload.d[item] = optCustomClaims[item];
    });
  }
  payload = JSON.stringify(payload); // Stringified after adding optional auth data
  payload = Utilities.base64EncodeWebSafe(payload);
  var hmac = Utilities.computeHmacSha256Signature(
    header + '.' + payload,
    this.base.secret
  );
  return header + '.' + payload + '.' + Utilities.base64EncodeWebSafe(hmac);
};
