"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cocorita = exports["default"] = void 0;

var _events = _interopRequireDefault(require("events"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _lodash = _interopRequireDefault(require("lodash.some"));

var _lodash2 = _interopRequireDefault(require("lodash.every"));

var _lodash3 = _interopRequireDefault(require("lodash.clonedeep"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _createSuper(Derived) { return function () { var Super = _getPrototypeOf(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
var EVT_INIT_KEY = 'init-key';
/**
 * Regular expression validating tr replace keys
 * @type {RegExp}
 */

var REPLACE_KEY_REGEXP = /^[a-zA-Z0-9_]+$/;
/**
 * Check if data is a valid translations object
 * @param {Object} data A translations object
 * @return {Boolean} Return true if data is a valid translations object
 */

function isValidTranslationsObject(data) {
  if (_typeof(data) !== 'object') return false;
  return (0, _lodash2["default"])(data, function (source) {
    if (_typeof(source) !== 'object') return false;
    return (0, _lodash2["default"])(source, function (translation) {
      return typeof translation === 'string';
    });
  });
} // Polyfill for Array.isArray


if (!Array.isArray) {
  Array.isArray = function isArray(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}
/**
 * Cocorita class
 */


var Cocorita = /*#__PURE__*/function (_EventEmitter) {
  _inherits(Cocorita, _EventEmitter);

  var _super = _createSuper(Cocorita);

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
  function Cocorita(options) {
    var _this;

    _classCallCheck(this, Cocorita);

    _this = _super.call(this);
    /**
     * Target language
     * @type {String}
     */

    _this.lang = '';
    /**
     * Translations object
     * @type {Object}
     */

    _this.data = {}; // Options check

    if (options !== undefined) {
      if (options.language !== undefined) {
        if (typeof options.language !== 'string') throw new Error('options.language must be a string');
        _this.language = options.language;
      } // Initialize target languages


      if (options.initialize !== undefined) {
        if (!(Array.isArray(options.initialize) && (0, _lodash2["default"])(options.initialize, function (value) {
          return typeof value === 'string';
        }))) {
          throw new Error('options.initialize must be a string array');
        }
        /**
         * Array of target languages to be initialized if a translation is missing
         * @type {String[]}
         */


        _this.initialize = options.initialize;
      } // Default target text for tr if missing translation


      if (options.defaultTarget) {
        if ((0, _lodash["default"])(['source', 'blank'], function (def) {
          return def === options.defaultTarget;
        })) {
          /**
           * Normally, when a target language translation is found missing,
           * an empty string is emitted.
           * If defaultTarget value is set to 'source', the source text is emitted instead.
           */
          _this.defaultTarget = options.defaultTarget;
        } else {
          throw new Error('Invalid defaultTarget option');
        }
      }
    }

    return _this;
  }
  /**
   * Set target language id
   * @type {String}
   */


  _createClass(Cocorita, [{
    key: "load",

    /**
     * Load translations data from a database file
     * or a translations object
     *
     * @param {String|Object} source A json or yaml string or a valid translations object
     * @param {String} [format] 'json' or 'yaml'. Required only if source is a file path.
     * @throws {Error}
     */
    value: function load(source, format) {
      if (source === undefined) throw new Error('source parameter is required');

      if (_typeof(source) === 'object') {
        var data = (0, _lodash3["default"])(source);

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
            var _data2 = _jsYaml["default"].safeLoad(source);

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
     * @return {Object} Translations data object
     */

  }, {
    key: "getData",
    value: function getData() {
      return (0, _lodash3["default"])(this.data);
    }
    /**
     * Get translations data serialized to json or yaml format
     *
     * @param {String} format 'json' or 'yaml'
     * @throws {Error}
     * @return {String} Serialized translations data
     */

  }, {
    key: "dump",
    value: function dump(format) {
      var _this2 = this;

      if (format === undefined) throw new Error('format parameter is required');
      if (typeof format !== 'string') throw new Error('format parameter must be a string');

      if (format === 'json') {
        var sortedData = {};
        Object.keys(this.data).sort().forEach(function (key) {
          sortedData[key] = _this2.data[key];
        });
        return JSON.stringify(sortedData, null, 2);
      }

      if (format === 'yaml') {
        return _jsYaml["default"].safeDump(this.data, {
          sortKeys: true
        });
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

  }, {
    key: "tr",
    value: function tr(source, replaces) {
      var _this3 = this;

      if (source === undefined) return '';
      if (typeof source !== 'string') throw new Error('source parameter must be a string'); // Check options object

      var replacesRe = [];

      if (replaces !== undefined) {
        if (_typeof(replaces) !== 'object') throw new Error('replaces parameter must be a map');
        Object.keys(replaces).forEach(function (key) {
          var value = replaces[key];
          var strval = "".concat(value);
          if (typeof key !== 'string' || !key.match(REPLACE_KEY_REGEXP)) throw new Error("replace parameter key not matching regular expression ".concat(REPLACE_KEY_REGEXP));
          replacesRe.push({
            re: new RegExp("\\{\\{ *".concat(key, " *\\}\\}"), 'g'),
            val: strval
          });
        });
      } // If targets object does not exists then initialize it


      if (this.data[source] === undefined) {
        this.data[source] = {};
      } // If initialization is required then initialize target languages
      // if a translation is not available for them


      if (this.initialize !== undefined) {
        var initKey = false;
        this.initialize.forEach(function (targetLang) {
          if (_this3.data[source][targetLang] === undefined) {
            _this3.data[source][targetLang] = source;
            initKey = true;
          }
        });

        if (initKey) {
          this.emit(EVT_INIT_KEY, this, this.data, source, this.data[source]);
        }
      } // If a translation is available for target language then return it


      if (this.data[source][this.lang] !== undefined) {
        var target = this.data[source][this.lang]; // Apply replaces

        if (replacesRe.length > 0) {
          replacesRe.forEach(function (replace) {
            target = target.replace(replace.re, replace.val);
          });
        }

        return target;
      } // If no translation available then return a default value


      if (this.defaultTarget === 'source') return source;
      return '';
    }
  }, {
    key: "language",
    set: function set(lang) {
      if (lang === undefined || typeof lang !== 'string') throw new Error('language must be a string');
      this.lang = lang;
    }
    /**
     * get target language id
     * @type {String}
     */
    ,
    get: function get() {
      return this.lang;
    }
  }]);

  return Cocorita;
}(_events["default"]);

exports.Cocorita = Cocorita;
Cocorita.EVT_INIT_KEY = EVT_INIT_KEY;
var _default = Cocorita;
exports["default"] = _default;