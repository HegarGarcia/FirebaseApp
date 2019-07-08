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

/**
 * Returns a valid Firebase key from a given string
 * Firebase Keys can't contain any of the following characters: . $ # [ ] /
 * https://firebase.google.com/docs/database/usage/limits#data_tree
 * https://groups.google.com/forum/#!msg/firebase-talk/vtX8lfxxShk/skzA5vQFdosJ
 *
 * @param  {string} string - the string to encode
 *
 * @return {string} the encoded string
 */
function encodeAsFirebaseKey(string) {
  return string
    .replace(/\%/g, '%25')
    .replace(/\./g, '%2E')
    .replace(/\#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/\//g, '%2F')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D');
}
