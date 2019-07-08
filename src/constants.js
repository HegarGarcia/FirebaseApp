/**
 * @typedef {string} FirebaseApp_.NORMALIZED_ERROR
 */

FirebaseApp_._CustomClaimBlackList = {
  iss: true,
  sub: true,
  aud: true,
  exp: true,
  iat: true,
  auth_time: true,
  nonce: true,
  acr: true,
  amr: true,
  azp: true,
  email: true,
  email_verified: true,
  'phone_number	': true,
  name: true,
  'firebase	': true
};

FirebaseApp_._keyWhiteList = {
  auth: true,
  shallow: true,
  print: true,
  limitToFirst: true,
  limitToLast: true
};

FirebaseApp_._errorCodeList = {
  '400': true, // bad request
  // '401': true, // Unauthorized (we do not retry on this error, as this is sent on unauthorized access by the rules)
  '500': true, // Internal Server Error
  '502': true // Bad Gateway
};

FirebaseApp_._methodWhiteList = {
  post: true,
  put: true,
  delete: true
};

/**
 * List all known Errors
 */
FirebaseApp_.NORMALIZED_ERRORS = {
  TRY_AGAIN:
    "We're sorry, a server error occurred. Please wait a bit and try again.",
  GLOBAL_CRASH:
    "We're sorry, a server error occurred. Please wait a bit and try again.",
  PERMISSION_DENIED: 'Permission denied',
  INVALID_DATA:
    "Invalid data; couldn't parse JSON object. Are you sending a JSON object with valid key names?",
  INVALID_CUSTOM_CLAIMS_KEY: 'Invalid custom claims key',
  INVALID_CUSTOM_CLAIMS_LENGTH: 'Invalid custom claims length (>1000)'
};

/**
 * List errors on which no retry is needed
 */
FirebaseApp_.NORETRY_ERRORS = {};
FirebaseApp_.NORETRY_ERRORS[
  FirebaseApp_.NORMALIZED_ERRORS.PERMISSION_DENIED
] = true;
FirebaseApp_.NORETRY_ERRORS[FirebaseApp_.NORMALIZED_ERRORS.INVALID_DATA] = true;
