/*
 FirebaseApp
 https://github.com/RomainVialard/FirebaseApp
 
 Copyright (c) 2016 - 2018 Romain Vialard - Ludovic Lefebure - Spencer Easton - Jean-Rémi Delteil - Simon Debray
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var FirebaseApp_ = {
  Base: Base
};

/**
 * Retrieves a database by url
 *
 * @param {string} url - the database url
 * @param {string} [secret] - a Firebase app secret
 *
 * @return {FirebaseApp_.Base} the Database found at the given URL
 */
function getDatabaseByUrl(url, secret) {
  if (!doesURLEndsWithSlash(url)) {
    url += '/';
  }

  return new FirebaseApp_.Base({
    url: url,
    secret: secret || ''
  });
}

/**
 * @param {string} url
 */
function doesURLEndsWithSlash(url) {
  return new RegExp('.*/$').test(url);
}
