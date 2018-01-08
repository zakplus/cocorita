'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @module cocorita
                                                                                                                                                                                                                                                                               */

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Events constants
var EVT_INIT_KEY = 'init-key';

// Regular expression validating tr replace keys
var REPLACE_KEY_REGEXP = /^[a-zA-Z0-9_]+$/;

// Check if data is a valid translations object
function isValidTranslationsObject(data) {
  if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') return false;
  return _lodash2.default.every(data, function (source) {
    if ((typeof source === 'undefined' ? 'undefined' : _typeof(source)) !== 'object') return false;
    return _lodash2.default.every(source, function (translation) {
      return typeof translation === 'string';
    });
  });
}

var Cocorita = function (_EventEmitter) {
  _inherits(Cocorita, _EventEmitter);

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
  function Cocorita(options) {
    _classCallCheck(this, Cocorita);

    var _this = _possibleConstructorReturn(this, (Cocorita.__proto__ || Object.getPrototypeOf(Cocorita)).call(this));

    _this.lang = '';
    _this.data = {};
    _this.defaultIfMissing = 'source';

    // Options check
    if (options !== undefined) {
      if (options.language !== undefined) {
        if (typeof options.language !== 'string') throw new Error('options.language must be a string');
        _this.language = options.language;
      }

      // Initialize target languages
      if (options.initialize !== undefined) {
        if (!(_lodash2.default.isArray(options.initialize) && _lodash2.default.every(options.initialize, function (value) {
          return typeof value === 'string';
        }))) {
          throw new Error('options.initialize must be a string array');
        }
        _this.initialize = options.initialize;
      }

      // Default target text for tr if missing translation
      if (options.defaultTarget) {
        if (_lodash2.default.some(['source', 'blank'], function (def) {
          return def === options.defaultTarget;
        })) {
          _this.defaultTarget = options.defaultTarget;
        } else {
          throw new Error('Invalid defaultTarget option');
        }
      }
    }
    return _this;
  }

  _createClass(Cocorita, [{
    key: 'load',


    /**
     * Load translations data from a database file
     * or a translations object
     *
     * @method load
     * @param {String|Object} source A json or yaml string or a valid translations object
     * @param {String} [format] 'json' or 'yaml'. Required only if source is a file path.
     * @throws {Error}
     */
    value: function load(source, format) {
      if (source === undefined) throw new Error('source parameter is required');

      if ((typeof source === 'undefined' ? 'undefined' : _typeof(source)) === 'object') {
        var data = _lodash2.default.cloneDeep(source);
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
            var _data = JSON.parse(source);
            if (!isValidTranslationsObject(_data)) throw new Error('invalid source');
            this.data = _data;
            return;
          } catch (e) {
            throw new Error('invalid source');
          }
        }

        if (format === 'yaml') {
          try {
            var _data2 = _jsYaml2.default.safeLoad(source);
            if (!isValidTranslationsObject(_data2)) throw new Error('invalid source');
            this.data = _data2;
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

  }, {
    key: 'getData',
    value: function getData() {
      return _lodash2.default.cloneDeep(this.data);
    }

    /**
     * Get translations data serialized to json or yaml format
     *
     * @method dump
     * @param {String} format 'json' or 'yaml'
     * @throws {Error}
     */

  }, {
    key: 'dump',
    value: function dump(format) {
      if (format === undefined) throw new Error('format parameter is required');
      if (typeof format !== 'string') throw new Error('format parameter must be a string');

      if (format === 'json') {
        var data = (0, _lodash2.default)(this.data).toPairs().sortBy(0).fromPairs().value();
        return JSON.stringify(data, null, 2);
      }

      if (format === 'yaml') {
        return _jsYaml2.default.safeDump(this.data, { sortKeys: true });
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

  }, {
    key: 'tr',
    value: function tr(source, replaces) {
      var _this2 = this;

      if (source === undefined) return '';
      if (typeof source !== 'string') throw new Error('source parameter must be a string');

      // Check options object
      var replacesRe = [];
      if (replaces !== undefined) {
        if ((typeof replaces === 'undefined' ? 'undefined' : _typeof(replaces)) !== 'object') throw new Error('replaces parameter must be a map');
        _lodash2.default.forEach(replaces, function (value, key) {
          var strval = value.toString();
          if (!_lodash2.default.isString(key) || !key.match(REPLACE_KEY_REGEXP)) throw new Error('replace parameter key not matching regular expression ' + REPLACE_KEY_REGEXP);
          replacesRe.push({
            re: new RegExp('\\{\\{ *' + key + ' *\\}\\}', 'g'),
            val: strval
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
        var initKey = false;
        _lodash2.default.forEach(this.initialize, function (targetLang) {
          if (_this2.data[source][targetLang] === undefined) {
            _this2.data[source][targetLang] = source;
            initKey = true;
          }
        });
        if (initKey) {
          this.emit(EVT_INIT_KEY, this, this.data, source, this.data[source]);
        }
      }

      // If a translation is available for target language then return it
      if (this.data[source][this.lang] !== undefined) {
        var target = this.data[source][this.lang];

        // Apply replaces
        if (replacesRe.length > 0) {
          _lodash2.default.forEach(replacesRe, function (replace) {
            target = target.replace(replace.re, replace.val);
          });
        }

        return target;
      }

      // If no translation available then return a default value
      if (this.defaultTarget === 'source') return source;
      return '';
    }
  }, {
    key: 'language',
    set: function set(lang) {
      if (lang === undefined || typeof lang !== 'string') throw new Error('language must be a string');
      this.lang = lang;
    },
    get: function get() {
      return this.lang;
    }
  }]);

  return Cocorita;
}(_events2.default);

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