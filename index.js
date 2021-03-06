'use strict';
/**
 * This module provides access to the News API
 * https://newsapi.org/
 *
 * The API provides access to recent news headlines
 * from many popular news sources.
 * 
 * The author of this code has no formal relationship with NewsAPI.org and does not
 * claim to have created any of the facilities provided by NewsAPI.org.
 */

const Promise = require('bluebird'),
  request = require('request'),
  qs = require('querystring'),
  host = 'https://newsapi.org';

let API_KEY; // To be set by clients

class NewsAPI {
  constructor (apiKey) {
    if (!apiKey) throw new Error('No API key specified');
    API_KEY = apiKey;
    this.v2 = {
      topHeadlines (...args) {
        const { options = { language: 'en' }, cb } = splitArgsIntoOptionsAndCallback(args);
        const url = createUrlFromEndpointAndOptions('/v2/top-headlines', options);
        return getDataFromWeb(url, API_KEY, cb);
      },

      everything (...args) {
        const { options, cb } = splitArgsIntoOptionsAndCallback(args);
        const url = createUrlFromEndpointAndOptions('/v2/everything', options);
        return getDataFromWeb(url, API_KEY, cb);
      },

      sources (...args) {
        const { options, cb } = splitArgsIntoOptionsAndCallback(args);
        const url = createUrlFromEndpointAndOptions('/v2/sources', options);
        return getDataFromWeb(url, API_KEY, cb);
      }
    }
  }

  sources (...args) {
    const { options, cb } = splitArgsIntoOptionsAndCallback(args);
    const url = createUrlFromEndpointAndOptions('/v1/sources', options);
    return getDataFromWeb(url, null, cb);
  }

  articles (...args) {
    const { options, cb } = splitArgsIntoOptionsAndCallback(args);
    const url = createUrlFromEndpointAndOptions('/v1/articles', options);
    return getDataFromWeb(url, API_KEY, cb);
  }
}

class NewsAPIError extends Error {
  constructor(err) {
    super();
    this.name = `NewsAPIError: ${err.code}`;
    this.message = err.message;
  }
}

/**
 * Takes a variable-length array that represents arguments to a function and attempts to split it into
 * an 'options' object and a 'cb' callback function.
 * @param {Array}   args The arguments to the function
 * @return {Object}
 */
function splitArgsIntoOptionsAndCallback (args) {
  let options;
  let cb;
  if (args.length > 1) {
    options = args[0];
    cb = args[1];
  } else if ('object' === typeof args[0]) {
    options = args[0];
  } else if ('function' === typeof args[0]) {
    cb = args[0];
  }
  return { options, cb };
}

/**
 * Creates a url string from an endpoint and an options object by appending the endpoint
 * to the global "host" const and appending the options as querystring parameters.
 * @param {String} endpoint 
 * @param {Object} [options]
 * @return {String}
 */
function createUrlFromEndpointAndOptions (endpoint, options) {
  const query = qs.stringify(options);
  const baseURL = `${host}${endpoint}`;
  return query ? `${baseURL}?${query}` : baseURL;
}

/**
 * Takes a URL string and returns a Promise containing
 * a buffer with the data from the web.
 * @param  {String} url      A URL String
 * @param  {String} apiKey   (Optional) A key to be used for authentication
 * @return {Promise<Buffer>} A Promise containing a Buffer
 */
function getDataFromWeb(url, apiKey, cb) {
  let useCallback = 'function' === typeof cb;
  return new Promise((resolve, reject) => {
    const options = { url };
    if (apiKey) {
      options.headers = { 'X-Api-Key': apiKey };
    }
    request.get(options, (err, res, body) => {
      if (err) {
        if (useCallback) return cb(err);
        return reject(err);
      }
      try {
        const data = JSON.parse(body);
        if (data.status === 'error') throw new NewsAPIError(data);
        if (useCallback) return cb(null, data);
        return resolve(data);
      } catch (e) {
        if (useCallback) return cb(e);
        return reject(e);
      }
    });
  });
}

module.exports = NewsAPI;
