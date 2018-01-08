/**
 * @module cocorita
 */

import EventEmitter from 'events';
import yaml from 'js-yaml';
import _ from 'lodash';

// Events constants
const EVT_INIT_KEY = 'init-key';

// Regular expression validating tr replace keys
const REPLACE_KEY_REGEXP = /^[a-zA-Z0-9_]+$/;

// Check if data is a valid translations object
function isValidTranslationsObject(data) {
  if (typeof data !== 'object') return false;
  return _.every(data, (source) => {
    if (typeof source !== 'object') return false;
    return _.every(source, translation => typeof translation === 'string');
  });
}

class Cocorita extends EventEmitter {
  /**
 * options object keys:<br/>
 * <br/>
 * <b>language {String}:</b>
 * The target language identifier<br/>
 * <br/>
 * <b>initialize {String Array}:</b>
 * Array of languages whose translations will be initialized with the source text if not present.
 *
 * @class Cocorita
 * @constructor
 * @param {Object} options Options object
 * @return {Cocorita} A new Cocorita instance
 * @throws {Error} Throws a Error if something gone wrong
 */
  constructor(options) {
    super();

    this.lang = '';
    this.data = {};
    this.defaultIfMissing = 'source';

    // Options check
    if (options !== undefined) {
      if (options.language !== undefined) {
        if (typeof options.language !== 'string') throw new Error('options.language must be a string');
        this.language = options.language;
      }

      // Initialize target languages
      if (options.initialize !== undefined) {
        if (!(_.isArray(options.initialize) && _.every(options.initialize, value => typeof value === 'string'))) {
          throw new Error('options.initialize must be a string array');
        }
        this.initialize = options.initialize;
      }

      // Default target text for tr if missing translation
      if (options.defaultTarget) {
        if (_.some(['source', 'blank'], def => def === options.defaultTarget)) {
          this.defaultTarget = options.defaultTarget;
        } else {
          throw new Error('Invalid defaultTarget option');
        }
      }
    }
  }

  set language(lang) {
    if (lang === undefined || typeof lang !== 'string') throw new Error('language must be a string');
    this.lang = lang;
  }

  get language() {
    return this.lang;
  }

  /**
   * Load translations data from a database file
   * or a translations object
   *
   * @method load
   * @param {String|Object} source A json or yaml string or a valid translations object
   * @param {String} [format] 'json' or 'yaml'. Required only if source is a file path.
   * @throws {Error}
   */
  load(source, format) {
    if (source === undefined) throw new Error('source parameter is required');

    if (typeof source === 'object') {
      const data = _.cloneDeep(source);
      if (isValidTranslationsObject(data)) {
        this.data = data;
        return;
      }
      throw new Error('invalid translations object');
    }

    if (typeof source === 'string') {
      if (format === undefined) throw new Error('format parameter is required if source is a string');
      if (typeof format !== 'string') throw new Error('format parameter must be a string');

      if (format === 'json') {
        try {
          const data = JSON.parse(source);
          if (!isValidTranslationsObject(data)) throw new Error('invalid source');
          this.data = data;
          return;
        } catch (e) {
          throw new Error('invalid source');
        }
      }

      if (format === 'yaml') {
        try {
          const data = yaml.safeLoad(source);
          if (!isValidTranslationsObject(data)) throw new Error('invalid source');
          this.data = data;
          return;
        } catch (e) {
          throw new Error('invalid source');
        }
      }

      throw new Error('unsupported format');
    }

    throw new Error('source parameter must be a valid translations object or a file path');
  }

  /**
   * Get a copy of translations data object
   */
  getData() {
    return _.cloneDeep(this.data);
  }

  /**
   * Get translations data serialized to json or yaml format
   *
   * @method dump
   * @param {String} format 'json' or 'yaml'
   * @throws {Error}
   */
  dump(format) {
    if (format === undefined) throw new Error('format parameter is required');
    if (typeof format !== 'string') throw new Error('format parameter must be a string');

    if (format === 'json') {
      const data = _(this.data)
        .toPairs()
        .sortBy(0)
        .fromPairs()
        .value();
      return JSON.stringify(data, null, 2);
    }

    if (format === 'yaml') {
      return yaml.safeDump(this.data, { sortKeys: true });
    }

    throw new Error('unsupported format');
  }

  /**
   * Translate a string of source text in the target language.<br/>
   * If the translation is not available in the database the method return a blank string.<br/>
   * If the initialize option was passed to the constructor, then this method will check all the
   * target languages translations for the source text and will initialize them with a blank string
   * were are not available.
   *
   * @method tr
   * @param {String} source The source text
   * @param {Object} replaces Replaces map object
   * @return {String} Translated text in current target language
   * @throws EVT_INIT_KEY
   * @throws {Error}
   */
  tr(source, replaces) {
    if (source === undefined) return '';
    if (typeof source !== 'string') throw new Error('source parameter must be a string');

    // Check options object
    const replacesRe = [];
    if (replaces !== undefined) {
      if (typeof replaces !== 'object') throw new Error('replaces parameter must be a map');
      _.forEach(replaces, (value, key) => {
        const strval = value.toString();
        if (!_.isString(key) || !key.match(REPLACE_KEY_REGEXP)) throw new Error(`replace parameter key not matching regular expression ${REPLACE_KEY_REGEXP}`);
        replacesRe.push({
          re: new RegExp(`\\{\\{ *${key} *\\}\\}`, 'g'),
          val: strval,
        });
      });
    }

    // If targets object does not exists then initialize it
    if (this.data[source] === undefined) {
      this.data[source] = {};
    }

    // If initialization is required then initialize target languages
    // if a translation is not available for them
    if (this.initialize !== undefined) {
      let initKey = false;
      _.forEach(this.initialize, (targetLang) => {
        if (this.data[source][targetLang] === undefined) {
          this.data[source][targetLang] = source;
          initKey = true;
        }
      });
      if (initKey) {
        this.emit(EVT_INIT_KEY, this, this.data, source, this.data[source]);
      }
    }

    // If a translation is available for target language then return it
    if (this.data[source][this.lang] !== undefined) {
      let target = this.data[source][this.lang];

      // Apply replaces
      if (replacesRe.length > 0) {
        _.forEach(replacesRe, (replace) => {
          target = target.replace(replace.re, replace.val);
        });
      }

      return target;
    }

    // If no translation available then return a default value
    if (this.defaultTarget === 'source') return source;
    return '';
  }
}

/**
 * Event emitted every time a translation is not found for any
 * of the languages passed in the initialize array
 *
 * @event EVT_INIT_KEY
 * @param {Cocorita} cocorita Cocorita instance emitting the event
 * @param {Object} data The translations data object
 * @param {String} source The source text
 * @param {Object} targets The target languages translations object
 */
Cocorita.EVT_INIT_KEY = EVT_INIT_KEY;

module.exports = Cocorita;
