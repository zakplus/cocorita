import EventEmitter from 'events';
import yaml from 'js-yaml';
import some from 'lodash.some';
import every from 'lodash.every';
import cloneDeep from 'lodash.clonedeep';

// Events constants

/**
 * Event emitted every time a translation is not found for any
 * of the languages passed in the initialize array.
 *
 * @typedef {string} EVT_INIT_KEY
 * @example
 * coco.on(Cocorita.EVT_INIT_KEY, ({cocorita, data, source, targets}) => {
 *   // cocorita {Cocorita} : Cocorita instance emitting the event
 *   // data {Object}       : The translations data object
 *   // source {String}     : The source text
 *   // targets {Object}    : The target languages translations object
 * });
 */
const EVT_INIT_KEY = 'init-key';

/**
 * Regular expression validating tr replace keys
 * @type {RegExp}
 */
const REPLACE_KEY_REGEXP = /^[a-zA-Z0-9_]+$/;

/**
 * Check if data is a valid translations object
 * @param {Object} data A translations object
 * @return {Boolean} Return true if data is a valid translations object
 */
function isValidTranslationsObject(data) {
  if (typeof data !== 'object') return false;
  return every(data, (source) => {
    if (typeof source !== 'object') return false;
    return every(source, translation => typeof translation === 'string');
  });
}

// Polyfill for Array.isArray
if (!Array.isArray) {
  Array.isArray = function isArray(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

/**
 * Cocorita class
 */
class Cocorita extends EventEmitter {
  /**
   * Constructor
   *
   * @param {Object} options Options object
   * @param {String} [options.language] The target language identifier
   * @param {String[]} [options.initialize] Array of languages whose translations
   * will be initialized with the source text if not present
   * @return {Cocorita} A new Cocorita instance
   * @throws {Error} Throws a Error if something gone wrong
   */
  constructor(options) {
    super();

    /**
     * Target language
     * @type {String}
     */
    this.lang = '';

    /**
     * Translations object
     * @type {Object}
     */
    this.data = {};

    // Options check
    if (options !== undefined) {
      if (options.language !== undefined) {
        if (typeof options.language !== 'string') throw new Error('options.language must be a string');
        this.language = options.language;
      }

      // Initialize target languages
      if (options.initialize !== undefined) {
        if (!(Array.isArray(options.initialize) && every(options.initialize, value => typeof value === 'string'))) {
          throw new Error('options.initialize must be a string array');
        }

        /**
         * Array of target languages to be initialized if a translation is missing
         * @type {String[]}
         */
        this.initialize = options.initialize;
      }

      // Default target text for tr if missing translation
      if (options.defaultTarget) {
        if (some(['source', 'blank'], def => def === options.defaultTarget)) {
          /**
           * Normally, when a target language translation is found missing,
           * an empty string is emitted.
           * If defaultTarget value is set to 'source', the source text is emitted instead.
           */
          this.defaultTarget = options.defaultTarget;
        } else {
          throw new Error('Invalid defaultTarget option');
        }
      }
    }
  }

  /**
   * Set target language id
   * @type {String}
   */
  set language(lang) {
    if (lang === undefined || typeof lang !== 'string') throw new Error('language must be a string');
    this.lang = lang;
  }

  /**
   * get target language id
   * @type {String}
   */
  get language() {
    return this.lang;
  }

  /**
   * Load translations data from a database file
   * or a translations object
   *
   * @param {String|Object} source A json or yaml string or a valid translations object
   * @param {String} [format] 'json' or 'yaml'. Required only if source is a file path.
   * @throws {Error}
   */
  load(source, format) {
    if (source === undefined) throw new Error('source parameter is required');

    if (typeof source === 'object') {
      const data = cloneDeep(source);
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
   * @return {Object} Translations data object
   */
  getData() {
    return cloneDeep(this.data);
  }

  /**
   * Get translations data serialized to json or yaml format
   *
   * @param {String} format 'json' or 'yaml'
   * @throws {Error}
   * @return {String} Serialized translations data
   */
  dump(format) {
    if (format === undefined) throw new Error('format parameter is required');
    if (typeof format !== 'string') throw new Error('format parameter must be a string');

    if (format === 'json') {
      const sortedData = {};
      Object.keys(this.data).sort().forEach((key) => {
        sortedData[key] = this.data[key];
      });
      return JSON.stringify(sortedData, null, 2);
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
   * @param {String} source The source text
   * @param {Object} replaces Replaces map object
   * @return {String} Translated text in current target language
   * @emits {EVT_INIT_KEY} Emitted if target translation does not exists in data base
   * @throws {Error}
   */
  tr(source, replaces) {
    if (source === undefined) return '';
    if (typeof source !== 'string') throw new Error('source parameter must be a string');

    // Check options object
    const replacesRe = [];
    if (replaces !== undefined) {
      if (typeof replaces !== 'object') throw new Error('replaces parameter must be a map');
      Object.keys(replaces).forEach((key) => {
        const value = replaces[key];
        const strval = `${value}`;
        if (typeof key !== 'string' || !key.match(REPLACE_KEY_REGEXP)) throw new Error(`replace parameter key not matching regular expression ${REPLACE_KEY_REGEXP}`);
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
      this.initialize.forEach((targetLang) => {
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
        replacesRe.forEach((replace) => {
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

Cocorita.EVT_INIT_KEY = EVT_INIT_KEY;

export default Cocorita;
export { Cocorita };
