/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Scribe = __webpack_require__(1),
	    scribePluginSanitizer = __webpack_require__(68),
	    scribePluginLinkPromptCommand = __webpack_require__(109),
	    scribePluginUnlinkCommand = __webpack_require__(110),
	    scribePluginFigure = __webpack_require__(111),
	    scribePluginInsertFigure = __webpack_require__(112),
	    stenoMenu = __webpack_require__(113),
	    stenoToolbar = __webpack_require__(115)

	var stylesheet = __webpack_require__(117)

	var workspace = document.querySelector('.steno-workspace')
	var scribe = new Scribe(workspace, {
	    defaultCommandPatches: [
	       'bold',
	       'insertHTML',
	       'createLink'
	    ]
	})

	scribe.use(stenoMenu())
	scribe.use(stenoToolbar())
	scribe.use(scribePluginSanitizer({
	    tags: {
	        p: {
	            style: false // remove style from pasting
	        },
	        b: true,
	        strong: true,
	        i: true,
	        em: true,
	        a: {
	            href: true,
	            target: '_blank'
	        },
	        img: {
	            src: true,
	            title: true,
	            style: true,
	            height: true,
	            width: true,
	            onload: true
	        },
	        figure: {
	            contenteditable: true
	        },
	        figcaption: {
	            contenteditable: true,
	            placeholder: true
	        }
	    }
	}))
	scribe.use(scribePluginLinkPromptCommand())
	scribe.use(scribePluginUnlinkCommand())
	scribe.use(scribePluginFigure())
	scribe.use(scribePluginInsertFigure())

	window.scribe = scribe


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(25),
	  __webpack_require__(54),
	  __webpack_require__(34),
	  __webpack_require__(39),
	  __webpack_require__(41),
	  __webpack_require__(49),
	  __webpack_require__(2),
	  __webpack_require__(62),
	  __webpack_require__(63),
	  __webpack_require__(30),
	  __webpack_require__(28),
	  __webpack_require__(64)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  plugins,
	  commands,
	  formatters,
	  events,
	  patches,
	  Api,
	  buildTransactionManager,
	  UndoManager,
	  EventEmitter,
	  nodeHelpers,
	  Immutable,
	  config
	) {

	  'use strict';

	  function Scribe(el, options) {
	    EventEmitter.call(this);

	    this.el = el;
	    this.commands = {};

	    this.options = config.checkOptions(options);

	    this.commandPatches = {};
	    this._plainTextFormatterFactory = new FormatterFactory();
	    this._htmlFormatterFactory = new HTMLFormatterFactory();

	    this.api = new Api(this);

	    this.Immutable = Immutable;

	    var TransactionManager = buildTransactionManager(this);
	    this.transactionManager = new TransactionManager();

	    //added for explicit checking later eg if (scribe.undoManager) { ... }
	    this.undoManager = false;
	    if (this.options.undo.enabled) {
	      if (this.options.undo.manager) {
	        this.undoManager = this.options.undo.manager;
	      }
	      else {
	        this.undoManager = new UndoManager(this.options.undo.limit, this.el);
	      }
	      this._merge = false;
	      this._forceMerge = false;
	      this._mergeTimer = 0;
	      this._lastItem = {content: ''};
	    }

	    this.setHTML(this.getHTML());

	    this.el.setAttribute('contenteditable', true);

	    this.el.addEventListener('input', function () {
	      /**
	       * This event triggers when either the user types something or a native
	       * command is executed which causes the content to change (i.e.
	       * `document.execCommand('bold')`). We can't wrap a transaction around
	       * these actions, so instead we run the transaction in this event.
	       */
	      this.transactionManager.run();
	    }.bind(this), false);

	    /**
	     * Core Plugins
	     */
	    var corePlugins = Immutable.OrderedSet(this.options.defaultPlugins)
	      .sort(config.sortByPlugin('setRootPElement')) // Ensure `setRootPElement` is always loaded first
	      .filter(config.filterByBlockLevelMode(this.allowsBlockElements()))
	      .map(function (plugin) { return plugins[plugin]; });

	    // Formatters
	    var defaultFormatters = Immutable.List(this.options.defaultFormatters)
	    .filter(function (formatter) { return !!formatters[formatter]; })
	    .map(function (formatter) { return formatters[formatter]; });

	    // Patches

	    var defaultPatches = Immutable.List.of(
	      patches.events
	    );

	    var defaultCommandPatches = Immutable.List(this.options.defaultCommandPatches).map(function(patch) { return patches.commands[patch]; });

	    var defaultCommands = Immutable.List.of(
	      'indent',
	      'insertList',
	      'outdent',
	      'redo',
	      'subscript',
	      'superscript',
	      'undo'
	    ).map(function(command) { return commands[command]; });

	    var allPlugins = Immutable.List().concat(
	      corePlugins,
	      defaultFormatters,
	      defaultPatches,
	      defaultCommandPatches,
	      defaultCommands);

	    allPlugins.forEach(function(plugin) {
	      this.use(plugin());
	    }.bind(this));

	    this.use(events());
	  }

	  Scribe.prototype = Object.create(EventEmitter.prototype);
	  Scribe.prototype.node = nodeHelpers;
	  Scribe.prototype.element= Scribe.prototype.node;

	  // For plugins
	  // TODO: tap combinator?
	  Scribe.prototype.use = function (configurePlugin) {
	    configurePlugin(this);
	    return this;
	  };

	  Scribe.prototype.setHTML = function (html, skipFormatters) {
	    this._lastItem.content = html;

	    if (skipFormatters) {
	      this._skipFormatters = true;
	    }
	    // IE11: Setting HTML to the value it already has causes breakages elsewhere (see #336)
	    if (this.el.innerHTML !== html) {
	      this.el.innerHTML = html;
	    }
	  };

	  Scribe.prototype.getHTML = function () {
	    return this.el.innerHTML;
	  };

	  Scribe.prototype.getContent = function () {
	    // Remove bogus BR element for Firefox — see explanation in BR mode files.
	    return this._htmlFormatterFactory.formatForExport(this.getHTML().replace(/<br>$/, ''));
	  };

	  Scribe.prototype.getTextContent = function () {
	    return this.el.textContent;
	  };

	  Scribe.prototype.pushHistory = function () {
	    /**
	     * Chrome and Firefox: If we did push to the history, this would break
	     * browser magic around `Document.queryCommandState` (http://jsbin.com/eDOxacI/1/edit?js,console,output).
	     * This happens when doing any DOM manipulation.
	     */
	    var scribe = this;

	    if (scribe.options.undo.enabled) {
	      // Get scribe previous content, and strip markers.
	      var lastContentNoMarkers = scribe._lastItem.content.replace(/<em [^>]*class="scribe-marker"[^>]*>[^<]*?<\/em>/g, '');

	      // We only want to push the history if the content actually changed.
	      if (scribe.getHTML() !== lastContentNoMarkers) {
	        var selection = new scribe.api.Selection();

	        selection.placeMarkers();
	        var content = scribe.getHTML();
	        selection.removeMarkers();

	        // Checking if there is a need to merge, and that the previous history item
	        // is the last history item of the same scribe instance.
	        // It is possible the last transaction is not for the same instance, or
	        // even not a scribe transaction (e.g. when using a shared undo manager).
	        var previousItem = scribe.undoManager.item(scribe.undoManager.position);
	        if ((scribe._merge || scribe._forceMerge) && previousItem && scribe._lastItem == previousItem[0]) {
	          // If so, merge manually with the last item to save more memory space.
	          scribe._lastItem.content = content;
	        }
	        else {
	          // Otherwise, create a new history item, and register it as a new transaction
	          scribe._lastItem = {
	            previousItem: scribe._lastItem,
	            content: content,
	            scribe: scribe,
	            execute: function () { },
	            undo: function () { this.scribe.restoreFromHistory(this.previousItem); },
	            redo: function () { this.scribe.restoreFromHistory(this); }
	          };

	          scribe.undoManager.transact(scribe._lastItem, false);
	        }

	        // Merge next transaction if it happens before the interval option, otherwise don't merge.
	        clearTimeout(scribe._mergeTimer);
	        scribe._merge = true;
	        scribe._mergeTimer = setTimeout(function() { scribe._merge = false; }, scribe.options.undo.interval);

	        return true;
	      }
	    }

	    return false;
	  };

	  Scribe.prototype.getCommand = function (commandName) {
	    return this.commands[commandName] || this.commandPatches[commandName] || new this.api.Command(commandName);
	  };

	  Scribe.prototype.restoreFromHistory = function (historyItem) {
	    this._lastItem = historyItem;

	    this.setHTML(historyItem.content, true);

	    // Restore the selection
	    var selection = new this.api.Selection();
	    selection.selectMarkers();

	    // Because we skip the formatters, a transaction is not run, so we have to
	    // emit this event ourselves.
	    this.trigger('content-changed');
	  };

	  // This will most likely be moved to another object eventually
	  Scribe.prototype.allowsBlockElements = function () {
	    return this.options.allowBlockElements;
	  };

	  Scribe.prototype.setContent = function (content) {
	    if (! this.allowsBlockElements()) {
	      // Set bogus BR element for Firefox — see explanation in BR mode files.
	      content = content + '<br>';
	    }

	    this.setHTML(content);

	    this.trigger('content-changed');
	  };

	  Scribe.prototype.insertPlainText = function (plainText) {
	    this.insertHTML('<p>' + this._plainTextFormatterFactory.format(plainText) + '</p>');
	  };

	  Scribe.prototype.insertHTML = function (html) {
	    /**
	     * When pasting text from Google Docs in both Chrome and Firefox,
	     * the resulting text will be wrapped in a B tag. So it would look
	     * something like <b><p>Text</p></b>, which is invalid HTML. The command
	     * insertHTML will then attempt to fix this content by moving the B tag
	     * inside the P. The result is: <p><b></b></p><p>Text</p>, which is valid
	     * but means an extra P is inserted into the text. To avoid this we run the
	     * formatters before the insertHTML command as the formatter will
	     * unwrap the P and delete the B tag. It is acceptable to remove invalid
	     * HTML as Scribe should only accept valid HTML.
	     *
	     * See http://jsbin.com/cayosada/3/edit for more
	     **/

	    // TODO: error if the selection is not within the Scribe instance? Or
	    // focus the Scribe instance if it is not already focused?
	    this.getCommand('insertHTML').execute(this._htmlFormatterFactory.format(html));
	  };

	  Scribe.prototype.isDebugModeEnabled = function () {
	    return this.options.debug;
	  };

	  /**
	   * Applies HTML formatting to all editor text.
	   * @param {String} phase sanitize/normalize/export are the standard phases
	   * @param {Function} fn Function that takes the current editor HTML and returns a formatted version.
	   */
	  Scribe.prototype.registerHTMLFormatter = function (phase, formatter) {
	    this._htmlFormatterFactory.formatters[phase]
	      = this._htmlFormatterFactory.formatters[phase].push(formatter);
	  };

	  Scribe.prototype.registerPlainTextFormatter = function (formatter) {
	    this._plainTextFormatterFactory.formatters
	      = this._plainTextFormatterFactory.formatters.push(formatter);
	  };

	  // TODO: abstract
	  function FormatterFactory() {
	    this.formatters = Immutable.List();
	  }

	  FormatterFactory.prototype.format = function (html) {
	    // Map the object to an array: Array[Formatter]
	    var formatted = this.formatters.reduce(function (formattedData, formatter) {
	      return formatter(formattedData);
	    }, html);

	    return formatted;
	  };

	  function HTMLFormatterFactory() {
	    // Define phases
	    // For a list of formatters, see https://github.com/guardian/scribe/issues/126
	    this.formatters = {
	      // Configurable sanitization of the HTML, e.g. converting/filter/removing
	      // elements
	      sanitize: Immutable.List(),
	      // Normalize content to ensure it is ready for interaction
	      normalize: Immutable.List(),
	      'export': Immutable.List()
	    };
	  }

	  HTMLFormatterFactory.prototype = Object.create(FormatterFactory.prototype);
	  HTMLFormatterFactory.prototype.constructor = HTMLFormatterFactory;

	  HTMLFormatterFactory.prototype.format = function (html) {
	    var formatters = this.formatters.sanitize.concat(this.formatters.normalize);

	    var formatted = formatters.reduce(function (formattedData, formatter) {
	      return formatter(formattedData);
	    }, html);

	    return formatted;
	  };

	  HTMLFormatterFactory.prototype.formatForExport = function (html) {
	    return this.formatters['export'].reduce(function (formattedData, formatter) {
	      return formatter(formattedData);
	    }, html);
	  };

	  return Scribe;

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (assign) {

	  'use strict';

	  return function (scribe) {
	    function TransactionManager() {
	      this.history = [];
	    }

	    assign(TransactionManager.prototype, {
	      start: function () {
	        this.history.push(1);
	      },

	      end: function () {
	        this.history.pop();

	        if (this.history.length === 0) {
	          scribe.pushHistory();
	          scribe.trigger('content-changed');
	        }
	      },

	      run: function (transaction, forceMerge) {
	        this.start();
	        // If there is an error, don't prevent the transaction from ending.
	        try {
	          if (transaction) {
	            transaction();
	          }
	        } finally {
	          scribe._forceMerge = forceMerge === true;
	          this.end();
	          scribe._forceMerge = false;
	        }
	      }
	    });

	    return TransactionManager;
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4), __webpack_require__(21)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseAssign, createAssigner) {

	  /**
	   * Assigns own enumerable properties of source object(s) to the destination
	   * object. Subsequent sources overwrite property assignments of previous sources.
	   * If `customizer` is provided it is invoked to produce the assigned values.
	   * The `customizer` is bound to `thisArg` and invoked with five arguments;
	   * (objectValue, sourceValue, key, object, source).
	   *
	   * @static
	   * @memberOf _
	   * @alias extend
	   * @category Object
	   * @param {Object} object The destination object.
	   * @param {...Object} [sources] The source objects.
	   * @param {Function} [customizer] The function to customize assigning values.
	   * @param {*} [thisArg] The `this` binding of `customizer`.
	   * @returns {Object} Returns `object`.
	   * @example
	   *
	   * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
	   * // => { 'user': 'fred', 'age': 40 }
	   *
	   * // using a customizer callback
	   * var defaults = _.partialRight(_.assign, function(value, other) {
	   *   return typeof value == 'undefined' ? other : value;
	   * });
	   *
	   * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	   * // => { 'user': 'barney', 'age': 36 }
	   */
	  var assign = createAssigner(baseAssign);

	  return assign;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(5), __webpack_require__(6)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseCopy, keys) {

	  /**
	   * The base implementation of `_.assign` without support for argument juggling,
	   * multiple sources, and `this` binding `customizer` functions.
	   *
	   * @private
	   * @param {Object} object The destination object.
	   * @param {Object} source The source object.
	   * @param {Function} [customizer] The function to customize assigning values.
	   * @returns {Object} Returns the destination object.
	   */
	  function baseAssign(object, source, customizer) {
	    var props = keys(source);
	    if (!customizer) {
	      return baseCopy(source, object, props);
	    }
	    var index = -1,
	        length = props.length;

	    while (++index < length) {
	      var key = props[index],
	          value = object[key],
	          result = customizer(value, source[key], key, object, source);

	      if ((result === result ? (result !== value) : (value === value)) ||
	          (typeof value == 'undefined' && !(key in object))) {
	        object[key] = result;
	      }
	    }
	    return object;
	  }

	  return baseAssign;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Copies the properties of `source` to `object`.
	   *
	   * @private
	   * @param {Object} source The object to copy properties from.
	   * @param {Object} [object={}] The object to copy properties to.
	   * @param {Array} props The property names to copy.
	   * @returns {Object} Returns `object`.
	   */
	  function baseCopy(source, object, props) {
	    if (!props) {
	      props = object;
	      object = {};
	    }
	    var index = -1,
	        length = props.length;

	    while (++index < length) {
	      var key = props[index];
	      object[key] = source[key];
	    }
	    return object;
	  }

	  return baseCopy;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(8), __webpack_require__(12), __webpack_require__(13)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isNative, isObject, shimKeys) {

	  /* Native method references for those with the same name as other `lodash` methods. */
	  var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

	  /**
	   * Creates an array of the own enumerable property names of `object`.
	   *
	   * **Note:** Non-object values are coerced to objects. See the
	   * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
	   * for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   * @example
	   *
	   * function Foo() {
	   *   this.a = 1;
	   *   this.b = 2;
	   * }
	   *
	   * Foo.prototype.c = 3;
	   *
	   * _.keys(new Foo);
	   * // => ['a', 'b'] (iteration order is not guaranteed)
	   *
	   * _.keys('hi');
	   * // => ['0', '1']
	   */
	  var keys = !nativeKeys ? shimKeys : function(object) {
	    if (object) {
	      var Ctor = object.constructor,
	          length = object.length;
	    }
	    if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	        (typeof object != 'function' && (length && isLength(length)))) {
	      return shimKeys(object);
	    }
	    return isObject(object) ? nativeKeys(object) : [];
	  };

	  return keys;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Used as the maximum length of an array-like value.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	   * for more details.
	   */
	  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	  /**
	   * Checks if `value` is a valid array-like length.
	   *
	   * **Note:** This function is based on ES `ToLength`. See the
	   * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
	   * for more details.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	   */
	  function isLength(value) {
	    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	  }

	  return isLength;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(escapeRegExp, isObjectLike) {

	  /** `Object#toString` result references. */
	  var funcTag = '[object Function]';

	  /** Used to detect host constructors (Safari > 5). */
	  var reHostCtor = /^\[object .+?Constructor\]$/;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to resolve the decompiled source of functions. */
	  var fnToString = Function.prototype.toString;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /** Used to detect if a method is native. */
	  var reNative = RegExp('^' +
	    escapeRegExp(objToString)
	    .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	  );

	  /**
	   * Checks if `value` is a native function.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	   * @example
	   *
	   * _.isNative(Array.prototype.push);
	   * // => true
	   *
	   * _.isNative(_);
	   * // => false
	   */
	  function isNative(value) {
	    if (value == null) {
	      return false;
	    }
	    if (objToString.call(value) == funcTag) {
	      return reNative.test(fnToString.call(value));
	    }
	    return (isObjectLike(value) && reHostCtor.test(value)) || false;
	  }

	  return isNative;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(10)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseToString) {

	  /**
	   * Used to match `RegExp` special characters.
	   * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)
	   * for more details.
	   */
	  var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
	      reHasRegExpChars = RegExp(reRegExpChars.source);

	  /**
	   * Escapes the `RegExp` special characters "\", "^", "$", ".", "|", "?", "*",
	   * "+", "(", ")", "[", "]", "{" and "}" in `string`.
	   *
	   * @static
	   * @memberOf _
	   * @category String
	   * @param {string} [string=''] The string to escape.
	   * @returns {string} Returns the escaped string.
	   * @example
	   *
	   * _.escapeRegExp('[lodash](https://lodash.com/)');
	   * // => '\[lodash\]\(https://lodash\.com/\)'
	   */
	  function escapeRegExp(string) {
	    string = baseToString(string);
	    return (string && reHasRegExpChars.test(string))
	      ? string.replace(reRegExpChars, '\\$&')
	      : string;
	  }

	  return escapeRegExp;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Converts `value` to a string if it is not one. An empty string is returned
	   * for `null` or `undefined` values.
	   *
	   * @private
	   * @param {*} value The value to process.
	   * @returns {string} Returns the string.
	   */
	  function baseToString(value) {
	    if (typeof value == 'string') {
	      return value;
	    }
	    return value == null ? '' : (value + '');
	  }

	  return baseToString;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Checks if `value` is object-like.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	   */
	  function isObjectLike(value) {
	    return (value && typeof value == 'object') || false;
	  }

	  return isObjectLike;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Checks if `value` is the language type of `Object`.
	   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	   *
	   * **Note:** See the [ES5 spec](https://es5.github.io/#x8) for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	   * @example
	   *
	   * _.isObject({});
	   * // => true
	   *
	   * _.isObject([1, 2, 3]);
	   * // => true
	   *
	   * _.isObject(1);
	   * // => false
	   */
	  function isObject(value) {
	    // Avoid a V8 JIT bug in Chrome 19-20.
	    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	    var type = typeof value;
	    return type == 'function' || (value && type == 'object') || false;
	  }

	  return isObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(14), __webpack_require__(15), __webpack_require__(16), __webpack_require__(7), __webpack_require__(17), __webpack_require__(18)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isArguments, isArray, isIndex, isLength, keysIn, support) {

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * A fallback implementation of `Object.keys` which creates an array of the
	   * own enumerable property names of `object`.
	   *
	   * @private
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   */
	  function shimKeys(object) {
	    var props = keysIn(object),
	        propsLength = props.length,
	        length = propsLength && object.length;

	    var allowIndexes = length && isLength(length) &&
	      (isArray(object) || (support.nonEnumArgs && isArguments(object)));

	    var index = -1,
	        result = [];

	    while (++index < propsLength) {
	      var key = props[index];
	      if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
	        result.push(key);
	      }
	    }
	    return result;
	  }

	  return shimKeys;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isObjectLike) {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /** `Object#toString` result references. */
	  var argsTag = '[object Arguments]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /**
	   * Checks if `value` is classified as an `arguments` object.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   * @example
	   *
	   * _.isArguments(function() { return arguments; }());
	   * // => true
	   *
	   * _.isArguments([1, 2, 3]);
	   * // => false
	   */
	  function isArguments(value) {
	    var length = isObjectLike(value) ? value.length : undefined;
	    return (isLength(length) && objToString.call(value) == argsTag) || false;
	  }

	  return isArguments;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(8), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isNative, isObjectLike) {

	  /** `Object#toString` result references. */
	  var arrayTag = '[object Array]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /* Native method references for those with the same name as other `lodash` methods. */
	  var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

	  /**
	   * Checks if `value` is classified as an `Array` object.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   * @example
	   *
	   * _.isArray([1, 2, 3]);
	   * // => true
	   *
	   * _.isArray(function() { return arguments; }());
	   * // => false
	   */
	  var isArray = nativeIsArray || function(value) {
	    return (isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag) || false;
	  };

	  return isArray;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Used as the maximum length of an array-like value.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	   * for more details.
	   */
	  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	  /**
	   * Checks if `value` is a valid array-like index.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	   */
	  function isIndex(value, length) {
	    value = +value;
	    length = length == null ? MAX_SAFE_INTEGER : length;
	    return value > -1 && value % 1 == 0 && value < length;
	  }

	  return isIndex;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(14), __webpack_require__(15), __webpack_require__(16), __webpack_require__(7), __webpack_require__(12), __webpack_require__(18)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isArguments, isArray, isIndex, isLength, isObject, support) {

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * Creates an array of the own and inherited enumerable property names of `object`.
	   *
	   * **Note:** Non-object values are coerced to objects.
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   * @example
	   *
	   * function Foo() {
	   *   this.a = 1;
	   *   this.b = 2;
	   * }
	   *
	   * Foo.prototype.c = 3;
	   *
	   * _.keysIn(new Foo);
	   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	   */
	  function keysIn(object) {
	    if (object == null) {
	      return [];
	    }
	    if (!isObject(object)) {
	      object = Object(object);
	    }
	    var length = object.length;
	    length = (length && isLength(length) &&
	      (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

	    var Ctor = object.constructor,
	        index = -1,
	        isProto = typeof Ctor == 'function' && Ctor.prototype === object,
	        result = Array(length),
	        skipIndexes = length > 0;

	    while (++index < length) {
	      result[index] = (index + '');
	    }
	    for (var key in object) {
	      if (!(skipIndexes && isIndex(key, length)) &&
	          !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	        result.push(key);
	      }
	    }
	    return result;
	  }

	  return keysIn;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(8), __webpack_require__(19)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isNative, root) {

	  /** Used to detect functions containing a `this` reference. */
	  var reThis = /\bthis\b/;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to detect DOM support. */
	  var document = (document = root.window) && document.document;

	  /** Native method references. */
	  var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	  /**
	   * An object environment feature flags.
	   *
	   * @static
	   * @memberOf _
	   * @type Object
	   */
	  var support = {};

	  (function(x) {

	    /**
	     * Detect if functions can be decompiled by `Function#toString`
	     * (all but Firefox OS certified apps, older Opera mobile browsers, and
	     * the PlayStation 3; forced `false` for Windows 8 apps).
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    support.funcDecomp = !isNative(root.WinRTError) && reThis.test(function() { return this; });

	    /**
	     * Detect if `Function#name` is supported (all but IE).
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    support.funcNames = typeof Function.name == 'string';

	    /**
	     * Detect if the DOM is supported.
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    try {
	      support.dom = document.createDocumentFragment().nodeType === 11;
	    } catch(e) {
	      support.dom = false;
	    }

	    /**
	     * Detect if `arguments` object indexes are non-enumerable.
	     *
	     * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
	     * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
	     * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
	     * checks for indexes that exceed their function's formal parameters with
	     * associated values of `0`.
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    try {
	      support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
	    } catch(e) {
	      support.nonEnumArgs = true;
	    }
	  }(0, 0));

	  return support;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /** Used to determine if values are of the language type `Object`. */
	  var objectTypes = {
	    'function': true,
	    'object': true
	  };

	  /** Detect free variable `exports`. */
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  /** Detect free variable `module`. */
	  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

	  /** Detect free variable `global` from Node.js. */
	  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;

	  /** Detect free variable `window`. */
	  var freeWindow = objectTypes[typeof window] && window;

	  /**
	   * Used as a reference to the global object.
	   *
	   * The `this` value is used if it is the global object to avoid Greasemonkey's
	   * restricted `window` object, otherwise the `window` object is used.
	   */
	  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || this;

	  return root;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)(module), (function() { return this; }())))

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(22), __webpack_require__(24)], __WEBPACK_AMD_DEFINE_RESULT__ = function(bindCallback, isIterateeCall) {

	  /**
	   * Creates a function that assigns properties of source object(s) to a given
	   * destination object.
	   *
	   * @private
	   * @param {Function} assigner The function to assign values.
	   * @returns {Function} Returns the new assigner function.
	   */
	  function createAssigner(assigner) {
	    return function() {
	      var args = arguments,
	          length = args.length,
	          object = args[0];

	      if (length < 2 || object == null) {
	        return object;
	      }
	      var customizer = args[length - 2],
	          thisArg = args[length - 1],
	          guard = args[3];

	      if (length > 3 && typeof customizer == 'function') {
	        customizer = bindCallback(customizer, thisArg, 5);
	        length -= 2;
	      } else {
	        customizer = (length > 2 && typeof thisArg == 'function') ? thisArg : null;
	        length -= (customizer ? 1 : 0);
	      }
	      if (guard && isIterateeCall(args[1], args[2], guard)) {
	        customizer = length == 3 ? null : customizer;
	        length = 2;
	      }
	      var index = 0;
	      while (++index < length) {
	        var source = args[index];
	        if (source) {
	          assigner(object, source, customizer);
	        }
	      }
	      return object;
	    };
	  }

	  return createAssigner;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(23)], __WEBPACK_AMD_DEFINE_RESULT__ = function(identity) {

	  /**
	   * A specialized version of `baseCallback` which only supports `this` binding
	   * and specifying the number of arguments to provide to `func`.
	   *
	   * @private
	   * @param {Function} func The function to bind.
	   * @param {*} thisArg The `this` binding of `func`.
	   * @param {number} [argCount] The number of arguments to provide to `func`.
	   * @returns {Function} Returns the callback.
	   */
	  function bindCallback(func, thisArg, argCount) {
	    if (typeof func != 'function') {
	      return identity;
	    }
	    if (typeof thisArg == 'undefined') {
	      return func;
	    }
	    switch (argCount) {
	      case 1: return function(value) {
	        return func.call(thisArg, value);
	      };
	      case 3: return function(value, index, collection) {
	        return func.call(thisArg, value, index, collection);
	      };
	      case 4: return function(accumulator, value, index, collection) {
	        return func.call(thisArg, accumulator, value, index, collection);
	      };
	      case 5: return function(value, other, key, object, source) {
	        return func.call(thisArg, value, other, key, object, source);
	      };
	    }
	    return function() {
	      return func.apply(thisArg, arguments);
	    };
	  }

	  return bindCallback;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * This method returns the first argument provided to it.
	   *
	   * @static
	   * @memberOf _
	   * @category Utility
	   * @param {*} value Any value.
	   * @returns {*} Returns `value`.
	   * @example
	   *
	   * var object = { 'user': 'fred' };
	   *
	   * _.identity(object) === object;
	   * // => true
	   */
	  function identity(value) {
	    return value;
	  }

	  return identity;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16), __webpack_require__(7), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isIndex, isLength, isObject) {

	  /**
	   * Checks if the provided arguments are from an iteratee call.
	   *
	   * @private
	   * @param {*} value The potential iteratee value argument.
	   * @param {*} index The potential iteratee index or key argument.
	   * @param {*} object The potential iteratee object argument.
	   * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	   */
	  function isIterateeCall(value, index, object) {
	    if (!isObject(object)) {
	      return false;
	    }
	    var type = typeof index;
	    if (type == 'number') {
	      var length = object.length,
	          prereq = isLength(length) && isIndex(index, length);
	    } else {
	      prereq = type == 'string' && index in object;
	    }
	    if (prereq) {
	      var other = object[index];
	      return value === value ? (value === other) : (other !== other);
	    }
	    return false;
	  }

	  return isIterateeCall;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(26),
	  __webpack_require__(27),
	  __webpack_require__(29),
	  __webpack_require__(33)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  setRootPElement,
	  enforcePElements,
	  ensureSelectableContainers,
	  inlineElementsMode
	) {
	  'use strict';

	  return {
	    setRootPElement: setRootPElement,
	    enforcePElements: enforcePElements,
	    ensureSelectableContainers: ensureSelectableContainers,
	    inlineElementsMode: inlineElementsMode
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * Sets the default content of the scribe so that each carriage return creates
	   * a P.
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      // The content might have already been set, in which case we don't want
	      // to apply.
	      if (scribe.getHTML().trim() === '') {
	        /**
	         * We have to begin with the following HTML, because otherwise some
	         * browsers(?) will position the caret outside of the P when the scribe is
	         * focused.
	         */
	        scribe.setContent('<p><br></p>');
	      }
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (Immutable) {

	  /**
	   * Chrome and Firefox: Upon pressing backspace inside of a P, the
	   * browser deletes the paragraph element, leaving the caret (and any
	   * content) outside of any P.
	   *
	   * Firefox: Erasing across multiple paragraphs, or outside of a
	   * whole paragraph (e.g. by ‘Select All’) will leave content outside
	   * of any P.
	   *
	   * Entering a new line in a pristine state state will insert
	   * `<div>`s (in Chrome) or `<br>`s (in Firefox) where previously we
	   * had `<p>`'s. This patches the behaviour of delete/backspace so
	   * that we do not end up in a pristine state.
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nodeHelpers = scribe.node;

	      /**
	       * Wrap consecutive inline elements and text nodes in a P element.
	       */
	      function wrapChildNodes(parentNode) {
	        var index = 0;
	        Immutable.List(parentNode.childNodes)
	          .filter(function(node) {
	            return node.nodeType === Node.TEXT_NODE || !nodeHelpers.isBlockElement(node);
	          })
	          .groupBy(function(node, key, list) {
	            return key === 0 || node.previousSibling === list.get(key - 1) ?
	              index :
	              index += 1;
	          })
	          .forEach(function(nodeGroup) {
	            nodeHelpers.wrap(nodeGroup.toArray(), document.createElement('p'));
	          });
	      }

	      // Traverse the tree, wrapping child nodes as we go.
	      function traverse(parentNode) {
	        var i = 0, node;

	        while (node = parentNode.children[i++]) {
	          if (node.tagName === 'BLOCKQUOTE') {
	            wrapChildNodes(node);
	          }
	        }
	      }

	      scribe.registerHTMLFormatter('normalize', function (html) {
	        /**
	         * Ensure P mode.
	         *
	         * Wrap any orphan text nodes in a P element.
	         */
	        // TODO: This should be configurable and also correct markup such as
	        // `<ul>1</ul>` to <ul><li>2</li></ul>`. See skipped tests.
	        // TODO: This should probably be a part of HTML Janitor, or some other
	        // formatter.
	        var bin = document.createElement('div');
	        bin.innerHTML = html;

	        wrapChildNodes(bin);
	        traverse(bin);

	        return bin.innerHTML;
	      });

	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Copyright (c) 2014-2015, Facebook, Inc.
	 *  All rights reserved.
	 *
	 *  This source code is licensed under the BSD-style license found in the
	 *  LICENSE file in the root directory of this source tree. An additional grant
	 *  of patent rights can be found in the PATENTS file in the same directory.
	 */
	(function (global, factory) {
	   true ? module.exports = factory() :
	  typeof define === 'function' && define.amd ? define(factory) :
	  global.Immutable = factory()
	}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

	  function createClass(ctor, superClass) {
	    if (superClass) {
	      ctor.prototype = Object.create(superClass.prototype);
	    }
	    ctor.prototype.constructor = ctor;
	  }

	  // Used for setting prototype methods that IE8 chokes on.
	  var DELETE = 'delete';

	  // Constants describing the size of trie nodes.
	  var SHIFT = 5; // Resulted in best performance after ______?
	  var SIZE = 1 << SHIFT;
	  var MASK = SIZE - 1;

	  // A consistent shared value representing "not set" which equals nothing other
	  // than itself, and nothing that could be provided externally.
	  var NOT_SET = {};

	  // Boolean references, Rough equivalent of `bool &`.
	  var CHANGE_LENGTH = { value: false };
	  var DID_ALTER = { value: false };

	  function MakeRef(ref) {
	    ref.value = false;
	    return ref;
	  }

	  function SetRef(ref) {
	    ref && (ref.value = true);
	  }

	  // A function which returns a value representing an "owner" for transient writes
	  // to tries. The return value will only ever equal itself, and will not equal
	  // the return of any subsequent call of this function.
	  function OwnerID() {}

	  // http://jsperf.com/copy-array-inline
	  function arrCopy(arr, offset) {
	    offset = offset || 0;
	    var len = Math.max(0, arr.length - offset);
	    var newArr = new Array(len);
	    for (var ii = 0; ii < len; ii++) {
	      newArr[ii] = arr[ii + offset];
	    }
	    return newArr;
	  }

	  function ensureSize(iter) {
	    if (iter.size === undefined) {
	      iter.size = iter.__iterate(returnTrue);
	    }
	    return iter.size;
	  }

	  function wrapIndex(iter, index) {
	    return index >= 0 ? (+index) : ensureSize(iter) + (+index);
	  }

	  function returnTrue() {
	    return true;
	  }

	  function wholeSlice(begin, end, size) {
	    return (begin === 0 || (size !== undefined && begin <= -size)) &&
	      (end === undefined || (size !== undefined && end >= size));
	  }

	  function resolveBegin(begin, size) {
	    return resolveIndex(begin, size, 0);
	  }

	  function resolveEnd(end, size) {
	    return resolveIndex(end, size, size);
	  }

	  function resolveIndex(index, size, defaultIndex) {
	    return index === undefined ?
	      defaultIndex :
	      index < 0 ?
	        Math.max(0, size + index) :
	        size === undefined ?
	          index :
	          Math.min(size, index);
	  }

	  function Iterable(value) {
	      return isIterable(value) ? value : Seq(value);
	    }


	  createClass(KeyedIterable, Iterable);
	    function KeyedIterable(value) {
	      return isKeyed(value) ? value : KeyedSeq(value);
	    }


	  createClass(IndexedIterable, Iterable);
	    function IndexedIterable(value) {
	      return isIndexed(value) ? value : IndexedSeq(value);
	    }


	  createClass(SetIterable, Iterable);
	    function SetIterable(value) {
	      return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
	    }



	  function isIterable(maybeIterable) {
	    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
	  }

	  function isKeyed(maybeKeyed) {
	    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
	  }

	  function isIndexed(maybeIndexed) {
	    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
	  }

	  function isAssociative(maybeAssociative) {
	    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
	  }

	  function isOrdered(maybeOrdered) {
	    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
	  }

	  Iterable.isIterable = isIterable;
	  Iterable.isKeyed = isKeyed;
	  Iterable.isIndexed = isIndexed;
	  Iterable.isAssociative = isAssociative;
	  Iterable.isOrdered = isOrdered;

	  Iterable.Keyed = KeyedIterable;
	  Iterable.Indexed = IndexedIterable;
	  Iterable.Set = SetIterable;


	  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
	  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
	  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
	  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

	  /* global Symbol */

	  var ITERATE_KEYS = 0;
	  var ITERATE_VALUES = 1;
	  var ITERATE_ENTRIES = 2;

	  var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	  var FAUX_ITERATOR_SYMBOL = '@@iterator';

	  var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


	  function src_Iterator__Iterator(next) {
	      this.next = next;
	    }

	    src_Iterator__Iterator.prototype.toString = function() {
	      return '[Iterator]';
	    };


	  src_Iterator__Iterator.KEYS = ITERATE_KEYS;
	  src_Iterator__Iterator.VALUES = ITERATE_VALUES;
	  src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES;

	  src_Iterator__Iterator.prototype.inspect =
	  src_Iterator__Iterator.prototype.toSource = function () { return this.toString(); }
	  src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function () {
	    return this;
	  };


	  function iteratorValue(type, k, v, iteratorResult) {
	    var value = type === 0 ? k : type === 1 ? v : [k, v];
	    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
	      value: value, done: false
	    });
	    return iteratorResult;
	  }

	  function iteratorDone() {
	    return { value: undefined, done: true };
	  }

	  function hasIterator(maybeIterable) {
	    return !!getIteratorFn(maybeIterable);
	  }

	  function isIterator(maybeIterator) {
	    return maybeIterator && typeof maybeIterator.next === 'function';
	  }

	  function getIterator(iterable) {
	    var iteratorFn = getIteratorFn(iterable);
	    return iteratorFn && iteratorFn.call(iterable);
	  }

	  function getIteratorFn(iterable) {
	    var iteratorFn = iterable && (
	      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
	      iterable[FAUX_ITERATOR_SYMBOL]
	    );
	    if (typeof iteratorFn === 'function') {
	      return iteratorFn;
	    }
	  }

	  function isArrayLike(value) {
	    return value && typeof value.length === 'number';
	  }

	  createClass(Seq, Iterable);
	    function Seq(value) {
	      return value === null || value === undefined ? emptySequence() :
	        isIterable(value) ? value.toSeq() : seqFromValue(value);
	    }

	    Seq.of = function(/*...values*/) {
	      return Seq(arguments);
	    };

	    Seq.prototype.toSeq = function() {
	      return this;
	    };

	    Seq.prototype.toString = function() {
	      return this.__toString('Seq {', '}');
	    };

	    Seq.prototype.cacheResult = function() {
	      if (!this._cache && this.__iterateUncached) {
	        this._cache = this.entrySeq().toArray();
	        this.size = this._cache.length;
	      }
	      return this;
	    };

	    // abstract __iterateUncached(fn, reverse)

	    Seq.prototype.__iterate = function(fn, reverse) {
	      return seqIterate(this, fn, reverse, true);
	    };

	    // abstract __iteratorUncached(type, reverse)

	    Seq.prototype.__iterator = function(type, reverse) {
	      return seqIterator(this, type, reverse, true);
	    };



	  createClass(KeyedSeq, Seq);
	    function KeyedSeq(value) {
	      return value === null || value === undefined ?
	        emptySequence().toKeyedSeq() :
	        isIterable(value) ?
	          (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
	          keyedSeqFromValue(value);
	    }

	    KeyedSeq.prototype.toKeyedSeq = function() {
	      return this;
	    };



	  createClass(IndexedSeq, Seq);
	    function IndexedSeq(value) {
	      return value === null || value === undefined ? emptySequence() :
	        !isIterable(value) ? indexedSeqFromValue(value) :
	        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
	    }

	    IndexedSeq.of = function(/*...values*/) {
	      return IndexedSeq(arguments);
	    };

	    IndexedSeq.prototype.toIndexedSeq = function() {
	      return this;
	    };

	    IndexedSeq.prototype.toString = function() {
	      return this.__toString('Seq [', ']');
	    };

	    IndexedSeq.prototype.__iterate = function(fn, reverse) {
	      return seqIterate(this, fn, reverse, false);
	    };

	    IndexedSeq.prototype.__iterator = function(type, reverse) {
	      return seqIterator(this, type, reverse, false);
	    };



	  createClass(SetSeq, Seq);
	    function SetSeq(value) {
	      return (
	        value === null || value === undefined ? emptySequence() :
	        !isIterable(value) ? indexedSeqFromValue(value) :
	        isKeyed(value) ? value.entrySeq() : value
	      ).toSetSeq();
	    }

	    SetSeq.of = function(/*...values*/) {
	      return SetSeq(arguments);
	    };

	    SetSeq.prototype.toSetSeq = function() {
	      return this;
	    };



	  Seq.isSeq = isSeq;
	  Seq.Keyed = KeyedSeq;
	  Seq.Set = SetSeq;
	  Seq.Indexed = IndexedSeq;

	  var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

	  Seq.prototype[IS_SEQ_SENTINEL] = true;



	  // #pragma Root Sequences

	  createClass(ArraySeq, IndexedSeq);
	    function ArraySeq(array) {
	      this._array = array;
	      this.size = array.length;
	    }

	    ArraySeq.prototype.get = function(index, notSetValue) {
	      return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
	    };

	    ArraySeq.prototype.__iterate = function(fn, reverse) {
	      var array = this._array;
	      var maxIndex = array.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    ArraySeq.prototype.__iterator = function(type, reverse) {
	      var array = this._array;
	      var maxIndex = array.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function() 
	        {return ii > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
	      );
	    };



	  createClass(ObjectSeq, KeyedSeq);
	    function ObjectSeq(object) {
	      var keys = Object.keys(object);
	      this._object = object;
	      this._keys = keys;
	      this.size = keys.length;
	    }

	    ObjectSeq.prototype.get = function(key, notSetValue) {
	      if (notSetValue !== undefined && !this.has(key)) {
	        return notSetValue;
	      }
	      return this._object[key];
	    };

	    ObjectSeq.prototype.has = function(key) {
	      return this._object.hasOwnProperty(key);
	    };

	    ObjectSeq.prototype.__iterate = function(fn, reverse) {
	      var object = this._object;
	      var keys = this._keys;
	      var maxIndex = keys.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        var key = keys[reverse ? maxIndex - ii : ii];
	        if (fn(object[key], key, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    ObjectSeq.prototype.__iterator = function(type, reverse) {
	      var object = this._object;
	      var keys = this._keys;
	      var maxIndex = keys.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var key = keys[reverse ? maxIndex - ii : ii];
	        return ii++ > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, key, object[key]);
	      });
	    };

	  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


	  createClass(IterableSeq, IndexedSeq);
	    function IterableSeq(iterable) {
	      this._iterable = iterable;
	      this.size = iterable.length || iterable.size;
	    }

	    IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterable = this._iterable;
	      var iterator = getIterator(iterable);
	      var iterations = 0;
	      if (isIterator(iterator)) {
	        var step;
	        while (!(step = iterator.next()).done) {
	          if (fn(step.value, iterations++, this) === false) {
	            break;
	          }
	        }
	      }
	      return iterations;
	    };

	    IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterable = this._iterable;
	      var iterator = getIterator(iterable);
	      if (!isIterator(iterator)) {
	        return new src_Iterator__Iterator(iteratorDone);
	      }
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step : iteratorValue(type, iterations++, step.value);
	      });
	    };



	  createClass(IteratorSeq, IndexedSeq);
	    function IteratorSeq(iterator) {
	      this._iterator = iterator;
	      this._iteratorCache = [];
	    }

	    IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterator = this._iterator;
	      var cache = this._iteratorCache;
	      var iterations = 0;
	      while (iterations < cache.length) {
	        if (fn(cache[iterations], iterations++, this) === false) {
	          return iterations;
	        }
	      }
	      var step;
	      while (!(step = iterator.next()).done) {
	        var val = step.value;
	        cache[iterations] = val;
	        if (fn(val, iterations++, this) === false) {
	          break;
	        }
	      }
	      return iterations;
	    };

	    IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = this._iterator;
	      var cache = this._iteratorCache;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        if (iterations >= cache.length) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          cache[iterations] = step.value;
	        }
	        return iteratorValue(type, iterations, cache[iterations++]);
	      });
	    };




	  // # pragma Helper functions

	  function isSeq(maybeSeq) {
	    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
	  }

	  var EMPTY_SEQ;

	  function emptySequence() {
	    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
	  }

	  function keyedSeqFromValue(value) {
	    var seq =
	      Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
	      isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
	      hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
	      typeof value === 'object' ? new ObjectSeq(value) :
	      undefined;
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of [k, v] entries, '+
	        'or keyed object: ' + value
	      );
	    }
	    return seq;
	  }

	  function indexedSeqFromValue(value) {
	    var seq = maybeIndexedSeqFromValue(value);
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of values: ' + value
	      );
	    }
	    return seq;
	  }

	  function seqFromValue(value) {
	    var seq = maybeIndexedSeqFromValue(value) ||
	      (typeof value === 'object' && new ObjectSeq(value));
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of values, or keyed object: ' + value
	      );
	    }
	    return seq;
	  }

	  function maybeIndexedSeqFromValue(value) {
	    return (
	      isArrayLike(value) ? new ArraySeq(value) :
	      isIterator(value) ? new IteratorSeq(value) :
	      hasIterator(value) ? new IterableSeq(value) :
	      undefined
	    );
	  }

	  function seqIterate(seq, fn, reverse, useKeys) {
	    var cache = seq._cache;
	    if (cache) {
	      var maxIndex = cache.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        var entry = cache[reverse ? maxIndex - ii : ii];
	        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    }
	    return seq.__iterateUncached(fn, reverse);
	  }

	  function seqIterator(seq, type, reverse, useKeys) {
	    var cache = seq._cache;
	    if (cache) {
	      var maxIndex = cache.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var entry = cache[reverse ? maxIndex - ii : ii];
	        return ii++ > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
	      });
	    }
	    return seq.__iteratorUncached(type, reverse);
	  }

	  createClass(Collection, Iterable);
	    function Collection() {
	      throw TypeError('Abstract');
	    }


	  createClass(KeyedCollection, Collection);function KeyedCollection() {}

	  createClass(IndexedCollection, Collection);function IndexedCollection() {}

	  createClass(SetCollection, Collection);function SetCollection() {}


	  Collection.Keyed = KeyedCollection;
	  Collection.Indexed = IndexedCollection;
	  Collection.Set = SetCollection;

	  /**
	   * An extension of the "same-value" algorithm as [described for use by ES6 Map
	   * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
	   *
	   * NaN is considered the same as NaN, however -0 and 0 are considered the same
	   * value, which is different from the algorithm described by
	   * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
	   *
	   * This is extended further to allow Objects to describe the values they
	   * represent, by way of `valueOf` or `equals` (and `hashCode`).
	   *
	   * Note: because of this extension, the key equality of Immutable.Map and the
	   * value equality of Immutable.Set will differ from ES6 Map and Set.
	   *
	   * ### Defining custom values
	   *
	   * The easiest way to describe the value an object represents is by implementing
	   * `valueOf`. For example, `Date` represents a value by returning a unix
	   * timestamp for `valueOf`:
	   *
	   *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
	   *     var date2 = new Date(1234567890000);
	   *     date1.valueOf(); // 1234567890000
	   *     assert( date1 !== date2 );
	   *     assert( Immutable.is( date1, date2 ) );
	   *
	   * Note: overriding `valueOf` may have other implications if you use this object
	   * where JavaScript expects a primitive, such as implicit string coercion.
	   *
	   * For more complex types, especially collections, implementing `valueOf` may
	   * not be performant. An alternative is to implement `equals` and `hashCode`.
	   *
	   * `equals` takes another object, presumably of similar type, and returns true
	   * if the it is equal. Equality is symmetrical, so the same result should be
	   * returned if this and the argument are flipped.
	   *
	   *     assert( a.equals(b) === b.equals(a) );
	   *
	   * `hashCode` returns a 32bit integer number representing the object which will
	   * be used to determine how to store the value object in a Map or Set. You must
	   * provide both or neither methods, one must not exist without the other.
	   *
	   * Also, an important relationship between these methods must be upheld: if two
	   * values are equal, they *must* return the same hashCode. If the values are not
	   * equal, they might have the same hashCode; this is called a hash collision,
	   * and while undesirable for performance reasons, it is acceptable.
	   *
	   *     if (a.equals(b)) {
	   *       assert( a.hashCode() === b.hashCode() );
	   *     }
	   *
	   * All Immutable collections implement `equals` and `hashCode`.
	   *
	   */
	  function is(valueA, valueB) {
	    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
	      return true;
	    }
	    if (!valueA || !valueB) {
	      return false;
	    }
	    if (typeof valueA.valueOf === 'function' &&
	        typeof valueB.valueOf === 'function') {
	      valueA = valueA.valueOf();
	      valueB = valueB.valueOf();
	      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
	        return true;
	      }
	      if (!valueA || !valueB) {
	        return false;
	      }
	    }
	    if (typeof valueA.equals === 'function' &&
	        typeof valueB.equals === 'function' &&
	        valueA.equals(valueB)) {
	      return true;
	    }
	    return false;
	  }

	  function fromJS(json, converter) {
	    return converter ?
	      fromJSWith(converter, json, '', {'': json}) :
	      fromJSDefault(json);
	  }

	  function fromJSWith(converter, json, key, parentJSON) {
	    if (Array.isArray(json)) {
	      return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
	    }
	    if (isPlainObj(json)) {
	      return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
	    }
	    return json;
	  }

	  function fromJSDefault(json) {
	    if (Array.isArray(json)) {
	      return IndexedSeq(json).map(fromJSDefault).toList();
	    }
	    if (isPlainObj(json)) {
	      return KeyedSeq(json).map(fromJSDefault).toMap();
	    }
	    return json;
	  }

	  function isPlainObj(value) {
	    return value && (value.constructor === Object || value.constructor === undefined);
	  }

	  var src_Math__imul =
	    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
	    Math.imul :
	    function src_Math__imul(a, b) {
	      a = a | 0; // int
	      b = b | 0; // int
	      var c = a & 0xffff;
	      var d = b & 0xffff;
	      // Shift by 0 fixes the sign on the high part.
	      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
	    };

	  // v8 has an optimization for storing 31-bit signed numbers.
	  // Values which have either 00 or 11 as the high order bits qualify.
	  // This function drops the highest order bit in a signed number, maintaining
	  // the sign bit.
	  function smi(i32) {
	    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
	  }

	  function hash(o) {
	    if (o === false || o === null || o === undefined) {
	      return 0;
	    }
	    if (typeof o.valueOf === 'function') {
	      o = o.valueOf();
	      if (o === false || o === null || o === undefined) {
	        return 0;
	      }
	    }
	    if (o === true) {
	      return 1;
	    }
	    var type = typeof o;
	    if (type === 'number') {
	      var h = o | 0;
	      if (h !== o) {
	        h ^= o * 0xFFFFFFFF;
	      }
	      while (o > 0xFFFFFFFF) {
	        o /= 0xFFFFFFFF;
	        h ^= o;
	      }
	      return smi(h);
	    }
	    if (type === 'string') {
	      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
	    }
	    if (typeof o.hashCode === 'function') {
	      return o.hashCode();
	    }
	    return hashJSObj(o);
	  }

	  function cachedHashString(string) {
	    var hash = stringHashCache[string];
	    if (hash === undefined) {
	      hash = hashString(string);
	      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
	        STRING_HASH_CACHE_SIZE = 0;
	        stringHashCache = {};
	      }
	      STRING_HASH_CACHE_SIZE++;
	      stringHashCache[string] = hash;
	    }
	    return hash;
	  }

	  // http://jsperf.com/hashing-strings
	  function hashString(string) {
	    // This is the hash from JVM
	    // The hash code for a string is computed as
	    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
	    // where s[i] is the ith character of the string and n is the length of
	    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
	    // (exclusive) by dropping high bits.
	    var hash = 0;
	    for (var ii = 0; ii < string.length; ii++) {
	      hash = 31 * hash + string.charCodeAt(ii) | 0;
	    }
	    return smi(hash);
	  }

	  function hashJSObj(obj) {
	    var hash;
	    if (usingWeakMap) {
	      hash = weakMap.get(obj);
	      if (hash !== undefined) {
	        return hash;
	      }
	    }

	    hash = obj[UID_HASH_KEY];
	    if (hash !== undefined) {
	      return hash;
	    }

	    if (!canDefineProperty) {
	      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
	      if (hash !== undefined) {
	        return hash;
	      }

	      hash = getIENodeHash(obj);
	      if (hash !== undefined) {
	        return hash;
	      }
	    }

	    hash = ++objHashUID;
	    if (objHashUID & 0x40000000) {
	      objHashUID = 0;
	    }

	    if (usingWeakMap) {
	      weakMap.set(obj, hash);
	    } else if (isExtensible !== undefined && isExtensible(obj) === false) {
	      throw new Error('Non-extensible objects are not allowed as keys.');
	    } else if (canDefineProperty) {
	      Object.defineProperty(obj, UID_HASH_KEY, {
	        'enumerable': false,
	        'configurable': false,
	        'writable': false,
	        'value': hash
	      });
	    } else if (obj.propertyIsEnumerable !== undefined &&
	               obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
	      // Since we can't define a non-enumerable property on the object
	      // we'll hijack one of the less-used non-enumerable properties to
	      // save our hash on it. Since this is a function it will not show up in
	      // `JSON.stringify` which is what we want.
	      obj.propertyIsEnumerable = function() {
	        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
	      };
	      obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
	    } else if (obj.nodeType !== undefined) {
	      // At this point we couldn't get the IE `uniqueID` to use as a hash
	      // and we couldn't use a non-enumerable property to exploit the
	      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
	      // itself.
	      obj[UID_HASH_KEY] = hash;
	    } else {
	      throw new Error('Unable to set a non-enumerable property on object.');
	    }

	    return hash;
	  }

	  // Get references to ES5 object methods.
	  var isExtensible = Object.isExtensible;

	  // True if Object.defineProperty works as expected. IE8 fails this test.
	  var canDefineProperty = (function() {
	    try {
	      Object.defineProperty({}, '@', {});
	      return true;
	    } catch (e) {
	      return false;
	    }
	  }());

	  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
	  // and avoid memory leaks from the IE cloneNode bug.
	  function getIENodeHash(node) {
	    if (node && node.nodeType > 0) {
	      switch (node.nodeType) {
	        case 1: // Element
	          return node.uniqueID;
	        case 9: // Document
	          return node.documentElement && node.documentElement.uniqueID;
	      }
	    }
	  }

	  // If possible, use a WeakMap.
	  var usingWeakMap = typeof WeakMap === 'function';
	  var weakMap;
	  if (usingWeakMap) {
	    weakMap = new WeakMap();
	  }

	  var objHashUID = 0;

	  var UID_HASH_KEY = '__immutablehash__';
	  if (typeof Symbol === 'function') {
	    UID_HASH_KEY = Symbol(UID_HASH_KEY);
	  }

	  var STRING_HASH_CACHE_MIN_STRLEN = 16;
	  var STRING_HASH_CACHE_MAX_SIZE = 255;
	  var STRING_HASH_CACHE_SIZE = 0;
	  var stringHashCache = {};

	  function invariant(condition, error) {
	    if (!condition) throw new Error(error);
	  }

	  function assertNotInfinite(size) {
	    invariant(
	      size !== Infinity,
	      'Cannot perform this action with an infinite size.'
	    );
	  }

	  createClass(ToKeyedSequence, KeyedSeq);
	    function ToKeyedSequence(indexed, useKeys) {
	      this._iter = indexed;
	      this._useKeys = useKeys;
	      this.size = indexed.size;
	    }

	    ToKeyedSequence.prototype.get = function(key, notSetValue) {
	      return this._iter.get(key, notSetValue);
	    };

	    ToKeyedSequence.prototype.has = function(key) {
	      return this._iter.has(key);
	    };

	    ToKeyedSequence.prototype.valueSeq = function() {
	      return this._iter.valueSeq();
	    };

	    ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
	      var reversedSequence = reverseFactory(this, true);
	      if (!this._useKeys) {
	        reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
	      }
	      return reversedSequence;
	    };

	    ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
	      var mappedSequence = mapFactory(this, mapper, context);
	      if (!this._useKeys) {
	        mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
	      }
	      return mappedSequence;
	    };

	    ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var ii;
	      return this._iter.__iterate(
	        this._useKeys ?
	          function(v, k)  {return fn(v, k, this$0)} :
	          ((ii = reverse ? resolveSize(this) : 0),
	            function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
	        reverse
	      );
	    };

	    ToKeyedSequence.prototype.__iterator = function(type, reverse) {
	      if (this._useKeys) {
	        return this._iter.__iterator(type, reverse);
	      }
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      var ii = reverse ? resolveSize(this) : 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, reverse ? --ii : ii++, step.value, step);
	      });
	    };

	  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


	  createClass(ToIndexedSequence, IndexedSeq);
	    function ToIndexedSequence(iter) {
	      this._iter = iter;
	      this.size = iter.size;
	    }

	    ToIndexedSequence.prototype.includes = function(value) {
	      return this._iter.includes(value);
	    };

	    ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
	    };

	    ToIndexedSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, iterations++, step.value, step)
	      });
	    };



	  createClass(ToSetSequence, SetSeq);
	    function ToSetSequence(iter) {
	      this._iter = iter;
	      this.size = iter.size;
	    }

	    ToSetSequence.prototype.has = function(key) {
	      return this._iter.includes(key);
	    };

	    ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
	    };

	    ToSetSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, step.value, step.value, step);
	      });
	    };



	  createClass(FromEntriesSequence, KeyedSeq);
	    function FromEntriesSequence(entries) {
	      this._iter = entries;
	      this.size = entries.size;
	    }

	    FromEntriesSequence.prototype.entrySeq = function() {
	      return this._iter.toSeq();
	    };

	    FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._iter.__iterate(function(entry ) {
	        // Check if entry exists first so array access doesn't throw for holes
	        // in the parent iteration.
	        if (entry) {
	          validateEntry(entry);
	          var indexedIterable = isIterable(entry);
	          return fn(
	            indexedIterable ? entry.get(1) : entry[1],
	            indexedIterable ? entry.get(0) : entry[0],
	            this$0
	          );
	        }
	      }, reverse);
	    };

	    FromEntriesSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        while (true) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          var entry = step.value;
	          // Check if entry exists first so array access doesn't throw for holes
	          // in the parent iteration.
	          if (entry) {
	            validateEntry(entry);
	            var indexedIterable = isIterable(entry);
	            return iteratorValue(
	              type,
	              indexedIterable ? entry.get(0) : entry[0],
	              indexedIterable ? entry.get(1) : entry[1],
	              step
	            );
	          }
	        }
	      });
	    };


	  ToIndexedSequence.prototype.cacheResult =
	  ToKeyedSequence.prototype.cacheResult =
	  ToSetSequence.prototype.cacheResult =
	  FromEntriesSequence.prototype.cacheResult =
	    cacheResultThrough;


	  function flipFactory(iterable) {
	    var flipSequence = makeSequence(iterable);
	    flipSequence._iter = iterable;
	    flipSequence.size = iterable.size;
	    flipSequence.flip = function()  {return iterable};
	    flipSequence.reverse = function () {
	      var reversedSequence = iterable.reverse.apply(this); // super.reverse()
	      reversedSequence.flip = function()  {return iterable.reverse()};
	      return reversedSequence;
	    };
	    flipSequence.has = function(key ) {return iterable.includes(key)};
	    flipSequence.includes = function(key ) {return iterable.has(key)};
	    flipSequence.cacheResult = cacheResultThrough;
	    flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
	    }
	    flipSequence.__iteratorUncached = function(type, reverse) {
	      if (type === ITERATE_ENTRIES) {
	        var iterator = iterable.__iterator(type, reverse);
	        return new src_Iterator__Iterator(function()  {
	          var step = iterator.next();
	          if (!step.done) {
	            var k = step.value[0];
	            step.value[0] = step.value[1];
	            step.value[1] = k;
	          }
	          return step;
	        });
	      }
	      return iterable.__iterator(
	        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
	        reverse
	      );
	    }
	    return flipSequence;
	  }


	  function mapFactory(iterable, mapper, context) {
	    var mappedSequence = makeSequence(iterable);
	    mappedSequence.size = iterable.size;
	    mappedSequence.has = function(key ) {return iterable.has(key)};
	    mappedSequence.get = function(key, notSetValue)  {
	      var v = iterable.get(key, NOT_SET);
	      return v === NOT_SET ?
	        notSetValue :
	        mapper.call(context, v, key, iterable);
	    };
	    mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(
	        function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
	        reverse
	      );
	    }
	    mappedSequence.__iteratorUncached = function (type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        if (step.done) {
	          return step;
	        }
	        var entry = step.value;
	        var key = entry[0];
	        return iteratorValue(
	          type,
	          key,
	          mapper.call(context, entry[1], key, iterable),
	          step
	        );
	      });
	    }
	    return mappedSequence;
	  }


	  function reverseFactory(iterable, useKeys) {
	    var reversedSequence = makeSequence(iterable);
	    reversedSequence._iter = iterable;
	    reversedSequence.size = iterable.size;
	    reversedSequence.reverse = function()  {return iterable};
	    if (iterable.flip) {
	      reversedSequence.flip = function () {
	        var flipSequence = flipFactory(iterable);
	        flipSequence.reverse = function()  {return iterable.flip()};
	        return flipSequence;
	      };
	    }
	    reversedSequence.get = function(key, notSetValue) 
	      {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
	    reversedSequence.has = function(key )
	      {return iterable.has(useKeys ? key : -1 - key)};
	    reversedSequence.includes = function(value ) {return iterable.includes(value)};
	    reversedSequence.cacheResult = cacheResultThrough;
	    reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
	    };
	    reversedSequence.__iterator =
	      function(type, reverse)  {return iterable.__iterator(type, !reverse)};
	    return reversedSequence;
	  }


	  function filterFactory(iterable, predicate, context, useKeys) {
	    var filterSequence = makeSequence(iterable);
	    if (useKeys) {
	      filterSequence.has = function(key ) {
	        var v = iterable.get(key, NOT_SET);
	        return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
	      };
	      filterSequence.get = function(key, notSetValue)  {
	        var v = iterable.get(key, NOT_SET);
	        return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
	          v : notSetValue;
	      };
	    }
	    filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c)  {
	        if (predicate.call(context, v, k, c)) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0);
	        }
	      }, reverse);
	      return iterations;
	    };
	    filterSequence.__iteratorUncached = function (type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (true) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          var entry = step.value;
	          var key = entry[0];
	          var value = entry[1];
	          if (predicate.call(context, value, key, iterable)) {
	            return iteratorValue(type, useKeys ? key : iterations++, value, step);
	          }
	        }
	      });
	    }
	    return filterSequence;
	  }


	  function countByFactory(iterable, grouper, context) {
	    var groups = src_Map__Map().asMutable();
	    iterable.__iterate(function(v, k)  {
	      groups.update(
	        grouper.call(context, v, k, iterable),
	        0,
	        function(a ) {return a + 1}
	      );
	    });
	    return groups.asImmutable();
	  }


	  function groupByFactory(iterable, grouper, context) {
	    var isKeyedIter = isKeyed(iterable);
	    var groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map()).asMutable();
	    iterable.__iterate(function(v, k)  {
	      groups.update(
	        grouper.call(context, v, k, iterable),
	        function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
	      );
	    });
	    var coerce = iterableClass(iterable);
	    return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
	  }


	  function sliceFactory(iterable, begin, end, useKeys) {
	    var originalSize = iterable.size;

	    if (wholeSlice(begin, end, originalSize)) {
	      return iterable;
	    }

	    var resolvedBegin = resolveBegin(begin, originalSize);
	    var resolvedEnd = resolveEnd(end, originalSize);

	    // begin or end will be NaN if they were provided as negative numbers and
	    // this iterable's size is unknown. In that case, cache first so there is
	    // a known size and these do not resolve to NaN.
	    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
	      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
	    }

	    // Note: resolvedEnd is undefined when the original sequence's length is
	    // unknown and this slice did not supply an end and should contain all
	    // elements after resolvedBegin.
	    // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
	    var resolvedSize = resolvedEnd - resolvedBegin;
	    var sliceSize;
	    if (resolvedSize === resolvedSize) {
	      sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
	    }

	    var sliceSeq = makeSequence(iterable);

	    sliceSeq.size = sliceSize;

	    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
	      sliceSeq.get = function (index, notSetValue) {
	        index = wrapIndex(this, index);
	        return index >= 0 && index < sliceSize ?
	          iterable.get(index + resolvedBegin, notSetValue) :
	          notSetValue;
	      }
	    }

	    sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      if (sliceSize === 0) {
	        return 0;
	      }
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var skipped = 0;
	      var isSkipping = true;
	      var iterations = 0;
	      iterable.__iterate(function(v, k)  {
	        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
	                 iterations !== sliceSize;
	        }
	      });
	      return iterations;
	    };

	    sliceSeq.__iteratorUncached = function(type, reverse) {
	      if (sliceSize !== 0 && reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      // Don't bother instantiating parent iterator if taking 0.
	      var iterator = sliceSize !== 0 && iterable.__iterator(type, reverse);
	      var skipped = 0;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (skipped++ < resolvedBegin) {
	          iterator.next();
	        }
	        if (++iterations > sliceSize) {
	          return iteratorDone();
	        }
	        var step = iterator.next();
	        if (useKeys || type === ITERATE_VALUES) {
	          return step;
	        } else if (type === ITERATE_KEYS) {
	          return iteratorValue(type, iterations - 1, undefined, step);
	        } else {
	          return iteratorValue(type, iterations - 1, step.value[1], step);
	        }
	      });
	    }

	    return sliceSeq;
	  }


	  function takeWhileFactory(iterable, predicate, context) {
	    var takeSequence = makeSequence(iterable);
	    takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c) 
	        {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
	      );
	      return iterations;
	    };
	    takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var iterating = true;
	      return new src_Iterator__Iterator(function()  {
	        if (!iterating) {
	          return iteratorDone();
	        }
	        var step = iterator.next();
	        if (step.done) {
	          return step;
	        }
	        var entry = step.value;
	        var k = entry[0];
	        var v = entry[1];
	        if (!predicate.call(context, v, k, this$0)) {
	          iterating = false;
	          return iteratorDone();
	        }
	        return type === ITERATE_ENTRIES ? step :
	          iteratorValue(type, k, v, step);
	      });
	    };
	    return takeSequence;
	  }


	  function skipWhileFactory(iterable, predicate, context, useKeys) {
	    var skipSequence = makeSequence(iterable);
	    skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var isSkipping = true;
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c)  {
	        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0);
	        }
	      });
	      return iterations;
	    };
	    skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var skipping = true;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step, k, v;
	        do {
	          step = iterator.next();
	          if (step.done) {
	            if (useKeys || type === ITERATE_VALUES) {
	              return step;
	            } else if (type === ITERATE_KEYS) {
	              return iteratorValue(type, iterations++, undefined, step);
	            } else {
	              return iteratorValue(type, iterations++, step.value[1], step);
	            }
	          }
	          var entry = step.value;
	          k = entry[0];
	          v = entry[1];
	          skipping && (skipping = predicate.call(context, v, k, this$0));
	        } while (skipping);
	        return type === ITERATE_ENTRIES ? step :
	          iteratorValue(type, k, v, step);
	      });
	    };
	    return skipSequence;
	  }


	  function concatFactory(iterable, values) {
	    var isKeyedIterable = isKeyed(iterable);
	    var iters = [iterable].concat(values).map(function(v ) {
	      if (!isIterable(v)) {
	        v = isKeyedIterable ?
	          keyedSeqFromValue(v) :
	          indexedSeqFromValue(Array.isArray(v) ? v : [v]);
	      } else if (isKeyedIterable) {
	        v = KeyedIterable(v);
	      }
	      return v;
	    }).filter(function(v ) {return v.size !== 0});

	    if (iters.length === 0) {
	      return iterable;
	    }

	    if (iters.length === 1) {
	      var singleton = iters[0];
	      if (singleton === iterable ||
	          isKeyedIterable && isKeyed(singleton) ||
	          isIndexed(iterable) && isIndexed(singleton)) {
	        return singleton;
	      }
	    }

	    var concatSeq = new ArraySeq(iters);
	    if (isKeyedIterable) {
	      concatSeq = concatSeq.toKeyedSeq();
	    } else if (!isIndexed(iterable)) {
	      concatSeq = concatSeq.toSetSeq();
	    }
	    concatSeq = concatSeq.flatten(true);
	    concatSeq.size = iters.reduce(
	      function(sum, seq)  {
	        if (sum !== undefined) {
	          var size = seq.size;
	          if (size !== undefined) {
	            return sum + size;
	          }
	        }
	      },
	      0
	    );
	    return concatSeq;
	  }


	  function flattenFactory(iterable, depth, useKeys) {
	    var flatSequence = makeSequence(iterable);
	    flatSequence.__iterateUncached = function(fn, reverse) {
	      var iterations = 0;
	      var stopped = false;
	      function flatDeep(iter, currentDepth) {var this$0 = this;
	        iter.__iterate(function(v, k)  {
	          if ((!depth || currentDepth < depth) && isIterable(v)) {
	            flatDeep(v, currentDepth + 1);
	          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
	            stopped = true;
	          }
	          return !stopped;
	        }, reverse);
	      }
	      flatDeep(iterable, 0);
	      return iterations;
	    }
	    flatSequence.__iteratorUncached = function(type, reverse) {
	      var iterator = iterable.__iterator(type, reverse);
	      var stack = [];
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (iterator) {
	          var step = iterator.next();
	          if (step.done !== false) {
	            iterator = stack.pop();
	            continue;
	          }
	          var v = step.value;
	          if (type === ITERATE_ENTRIES) {
	            v = v[1];
	          }
	          if ((!depth || stack.length < depth) && isIterable(v)) {
	            stack.push(iterator);
	            iterator = v.__iterator(type, reverse);
	          } else {
	            return useKeys ? step : iteratorValue(type, iterations++, v, step);
	          }
	        }
	        return iteratorDone();
	      });
	    }
	    return flatSequence;
	  }


	  function flatMapFactory(iterable, mapper, context) {
	    var coerce = iterableClass(iterable);
	    return iterable.toSeq().map(
	      function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
	    ).flatten(true);
	  }


	  function interposeFactory(iterable, separator) {
	    var interposedSequence = makeSequence(iterable);
	    interposedSequence.size = iterable.size && iterable.size * 2 -1;
	    interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      iterable.__iterate(function(v, k) 
	        {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
	        fn(v, iterations++, this$0) !== false},
	        reverse
	      );
	      return iterations;
	    };
	    interposedSequence.__iteratorUncached = function(type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
	      var iterations = 0;
	      var step;
	      return new src_Iterator__Iterator(function()  {
	        if (!step || iterations % 2) {
	          step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	        }
	        return iterations % 2 ?
	          iteratorValue(type, iterations++, separator) :
	          iteratorValue(type, iterations++, step.value, step);
	      });
	    };
	    return interposedSequence;
	  }


	  function sortFactory(iterable, comparator, mapper) {
	    if (!comparator) {
	      comparator = defaultComparator;
	    }
	    var isKeyedIterable = isKeyed(iterable);
	    var index = 0;
	    var entries = iterable.toSeq().map(
	      function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
	    ).toArray();
	    entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
	      isKeyedIterable ?
	      function(v, i)  { entries[i].length = 2; } :
	      function(v, i)  { entries[i] = v[1]; }
	    );
	    return isKeyedIterable ? KeyedSeq(entries) :
	      isIndexed(iterable) ? IndexedSeq(entries) :
	      SetSeq(entries);
	  }


	  function maxFactory(iterable, comparator, mapper) {
	    if (!comparator) {
	      comparator = defaultComparator;
	    }
	    if (mapper) {
	      var entry = iterable.toSeq()
	        .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
	        .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
	      return entry && entry[0];
	    } else {
	      return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
	    }
	  }

	  function maxCompare(comparator, a, b) {
	    var comp = comparator(b, a);
	    // b is considered the new max if the comparator declares them equal, but
	    // they are not equal and b is in fact a nullish value.
	    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
	  }


	  function zipWithFactory(keyIter, zipper, iters) {
	    var zipSequence = makeSequence(keyIter);
	    zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
	    // Note: this a generic base implementation of __iterate in terms of
	    // __iterator which may be more generically useful in the future.
	    zipSequence.__iterate = function(fn, reverse) {
	      /* generic:
	      var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
	      var step;
	      var iterations = 0;
	      while (!(step = iterator.next()).done) {
	        iterations++;
	        if (fn(step.value[1], step.value[0], this) === false) {
	          break;
	        }
	      }
	      return iterations;
	      */
	      // indexed:
	      var iterator = this.__iterator(ITERATE_VALUES, reverse);
	      var step;
	      var iterations = 0;
	      while (!(step = iterator.next()).done) {
	        if (fn(step.value, iterations++, this) === false) {
	          break;
	        }
	      }
	      return iterations;
	    };
	    zipSequence.__iteratorUncached = function(type, reverse) {
	      var iterators = iters.map(function(i )
	        {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
	      );
	      var iterations = 0;
	      var isDone = false;
	      return new src_Iterator__Iterator(function()  {
	        var steps;
	        if (!isDone) {
	          steps = iterators.map(function(i ) {return i.next()});
	          isDone = steps.some(function(s ) {return s.done});
	        }
	        if (isDone) {
	          return iteratorDone();
	        }
	        return iteratorValue(
	          type,
	          iterations++,
	          zipper.apply(null, steps.map(function(s ) {return s.value}))
	        );
	      });
	    };
	    return zipSequence
	  }


	  // #pragma Helper Functions

	  function reify(iter, seq) {
	    return isSeq(iter) ? seq : iter.constructor(seq);
	  }

	  function validateEntry(entry) {
	    if (entry !== Object(entry)) {
	      throw new TypeError('Expected [K, V] tuple: ' + entry);
	    }
	  }

	  function resolveSize(iter) {
	    assertNotInfinite(iter.size);
	    return ensureSize(iter);
	  }

	  function iterableClass(iterable) {
	    return isKeyed(iterable) ? KeyedIterable :
	      isIndexed(iterable) ? IndexedIterable :
	      SetIterable;
	  }

	  function makeSequence(iterable) {
	    return Object.create(
	      (
	        isKeyed(iterable) ? KeyedSeq :
	        isIndexed(iterable) ? IndexedSeq :
	        SetSeq
	      ).prototype
	    );
	  }

	  function cacheResultThrough() {
	    if (this._iter.cacheResult) {
	      this._iter.cacheResult();
	      this.size = this._iter.size;
	      return this;
	    } else {
	      return Seq.prototype.cacheResult.call(this);
	    }
	  }

	  function defaultComparator(a, b) {
	    return a > b ? 1 : a < b ? -1 : 0;
	  }

	  function forceIterator(keyPath) {
	    var iter = getIterator(keyPath);
	    if (!iter) {
	      // Array might not be iterable in this environment, so we need a fallback
	      // to our wrapped type.
	      if (!isArrayLike(keyPath)) {
	        throw new TypeError('Expected iterable or array-like: ' + keyPath);
	      }
	      iter = getIterator(Iterable(keyPath));
	    }
	    return iter;
	  }

	  createClass(src_Map__Map, KeyedCollection);

	    // @pragma Construction

	    function src_Map__Map(value) {
	      return value === null || value === undefined ? emptyMap() :
	        isMap(value) ? value :
	        emptyMap().withMutations(function(map ) {
	          var iter = KeyedIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v, k)  {return map.set(k, v)});
	        });
	    }

	    src_Map__Map.prototype.toString = function() {
	      return this.__toString('Map {', '}');
	    };

	    // @pragma Access

	    src_Map__Map.prototype.get = function(k, notSetValue) {
	      return this._root ?
	        this._root.get(0, undefined, k, notSetValue) :
	        notSetValue;
	    };

	    // @pragma Modification

	    src_Map__Map.prototype.set = function(k, v) {
	      return updateMap(this, k, v);
	    };

	    src_Map__Map.prototype.setIn = function(keyPath, v) {
	      return this.updateIn(keyPath, NOT_SET, function()  {return v});
	    };

	    src_Map__Map.prototype.remove = function(k) {
	      return updateMap(this, k, NOT_SET);
	    };

	    src_Map__Map.prototype.deleteIn = function(keyPath) {
	      return this.updateIn(keyPath, function()  {return NOT_SET});
	    };

	    src_Map__Map.prototype.update = function(k, notSetValue, updater) {
	      return arguments.length === 1 ?
	        k(this) :
	        this.updateIn([k], notSetValue, updater);
	    };

	    src_Map__Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
	      if (!updater) {
	        updater = notSetValue;
	        notSetValue = undefined;
	      }
	      var updatedValue = updateInDeepMap(
	        this,
	        forceIterator(keyPath),
	        notSetValue,
	        updater
	      );
	      return updatedValue === NOT_SET ? undefined : updatedValue;
	    };

	    src_Map__Map.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._root = null;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyMap();
	    };

	    // @pragma Composition

	    src_Map__Map.prototype.merge = function(/*...iters*/) {
	      return mergeIntoMapWith(this, undefined, arguments);
	    };

	    src_Map__Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoMapWith(this, merger, iters);
	    };

	    src_Map__Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
	      return this.updateIn(
	        keyPath,
	        emptyMap(),
	        function(m ) {return typeof m.merge === 'function' ?
	          m.merge.apply(m, iters) :
	          iters[iters.length - 1]}
	      );
	    };

	    src_Map__Map.prototype.mergeDeep = function(/*...iters*/) {
	      return mergeIntoMapWith(this, deepMerger(undefined), arguments);
	    };

	    src_Map__Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoMapWith(this, deepMerger(merger), iters);
	    };

	    src_Map__Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
	      return this.updateIn(
	        keyPath,
	        emptyMap(),
	        function(m ) {return typeof m.mergeDeep === 'function' ?
	          m.mergeDeep.apply(m, iters) :
	          iters[iters.length - 1]}
	      );
	    };

	    src_Map__Map.prototype.sort = function(comparator) {
	      // Late binding
	      return OrderedMap(sortFactory(this, comparator));
	    };

	    src_Map__Map.prototype.sortBy = function(mapper, comparator) {
	      // Late binding
	      return OrderedMap(sortFactory(this, comparator, mapper));
	    };

	    // @pragma Mutability

	    src_Map__Map.prototype.withMutations = function(fn) {
	      var mutable = this.asMutable();
	      fn(mutable);
	      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
	    };

	    src_Map__Map.prototype.asMutable = function() {
	      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
	    };

	    src_Map__Map.prototype.asImmutable = function() {
	      return this.__ensureOwner();
	    };

	    src_Map__Map.prototype.wasAltered = function() {
	      return this.__altered;
	    };

	    src_Map__Map.prototype.__iterator = function(type, reverse) {
	      return new MapIterator(this, type, reverse);
	    };

	    src_Map__Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      this._root && this._root.iterate(function(entry ) {
	        iterations++;
	        return fn(entry[1], entry[0], this$0);
	      }, reverse);
	      return iterations;
	    };

	    src_Map__Map.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this.__altered = false;
	        return this;
	      }
	      return makeMap(this.size, this._root, ownerID, this.__hash);
	    };


	  function isMap(maybeMap) {
	    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
	  }

	  src_Map__Map.isMap = isMap;

	  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

	  var MapPrototype = src_Map__Map.prototype;
	  MapPrototype[IS_MAP_SENTINEL] = true;
	  MapPrototype[DELETE] = MapPrototype.remove;
	  MapPrototype.removeIn = MapPrototype.deleteIn;


	  // #pragma Trie Nodes



	    function ArrayMapNode(ownerID, entries) {
	      this.ownerID = ownerID;
	      this.entries = entries;
	    }

	    ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      var entries = this.entries;
	      for (var ii = 0, len = entries.length; ii < len; ii++) {
	        if (is(key, entries[ii][0])) {
	          return entries[ii][1];
	        }
	      }
	      return notSetValue;
	    };

	    ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      var removed = value === NOT_SET;

	      var entries = this.entries;
	      var idx = 0;
	      for (var len = entries.length; idx < len; idx++) {
	        if (is(key, entries[idx][0])) {
	          break;
	        }
	      }
	      var exists = idx < len;

	      if (exists ? entries[idx][1] === value : removed) {
	        return this;
	      }

	      SetRef(didAlter);
	      (removed || !exists) && SetRef(didChangeSize);

	      if (removed && entries.length === 1) {
	        return; // undefined
	      }

	      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
	        return createNodes(ownerID, entries, key, value);
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newEntries = isEditable ? entries : arrCopy(entries);

	      if (exists) {
	        if (removed) {
	          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
	        } else {
	          newEntries[idx] = [key, value];
	        }
	      } else {
	        newEntries.push([key, value]);
	      }

	      if (isEditable) {
	        this.entries = newEntries;
	        return this;
	      }

	      return new ArrayMapNode(ownerID, newEntries);
	    };




	    function BitmapIndexedNode(ownerID, bitmap, nodes) {
	      this.ownerID = ownerID;
	      this.bitmap = bitmap;
	      this.nodes = nodes;
	    }

	    BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
	      var bitmap = this.bitmap;
	      return (bitmap & bit) === 0 ? notSetValue :
	        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
	    };

	    BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var bit = 1 << keyHashFrag;
	      var bitmap = this.bitmap;
	      var exists = (bitmap & bit) !== 0;

	      if (!exists && value === NOT_SET) {
	        return this;
	      }

	      var idx = popCount(bitmap & (bit - 1));
	      var nodes = this.nodes;
	      var node = exists ? nodes[idx] : undefined;
	      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

	      if (newNode === node) {
	        return this;
	      }

	      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
	        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
	      }

	      if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
	        return nodes[idx ^ 1];
	      }

	      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
	        return newNode;
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
	      var newNodes = exists ? newNode ?
	        setIn(nodes, idx, newNode, isEditable) :
	        spliceOut(nodes, idx, isEditable) :
	        spliceIn(nodes, idx, newNode, isEditable);

	      if (isEditable) {
	        this.bitmap = newBitmap;
	        this.nodes = newNodes;
	        return this;
	      }

	      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
	    };




	    function HashArrayMapNode(ownerID, count, nodes) {
	      this.ownerID = ownerID;
	      this.count = count;
	      this.nodes = nodes;
	    }

	    HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var node = this.nodes[idx];
	      return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
	    };

	    HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var removed = value === NOT_SET;
	      var nodes = this.nodes;
	      var node = nodes[idx];

	      if (removed && !node) {
	        return this;
	      }

	      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
	      if (newNode === node) {
	        return this;
	      }

	      var newCount = this.count;
	      if (!node) {
	        newCount++;
	      } else if (!newNode) {
	        newCount--;
	        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
	          return packNodes(ownerID, nodes, newCount, idx);
	        }
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newNodes = setIn(nodes, idx, newNode, isEditable);

	      if (isEditable) {
	        this.count = newCount;
	        this.nodes = newNodes;
	        return this;
	      }

	      return new HashArrayMapNode(ownerID, newCount, newNodes);
	    };




	    function HashCollisionNode(ownerID, keyHash, entries) {
	      this.ownerID = ownerID;
	      this.keyHash = keyHash;
	      this.entries = entries;
	    }

	    HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      var entries = this.entries;
	      for (var ii = 0, len = entries.length; ii < len; ii++) {
	        if (is(key, entries[ii][0])) {
	          return entries[ii][1];
	        }
	      }
	      return notSetValue;
	    };

	    HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }

	      var removed = value === NOT_SET;

	      if (keyHash !== this.keyHash) {
	        if (removed) {
	          return this;
	        }
	        SetRef(didAlter);
	        SetRef(didChangeSize);
	        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
	      }

	      var entries = this.entries;
	      var idx = 0;
	      for (var len = entries.length; idx < len; idx++) {
	        if (is(key, entries[idx][0])) {
	          break;
	        }
	      }
	      var exists = idx < len;

	      if (exists ? entries[idx][1] === value : removed) {
	        return this;
	      }

	      SetRef(didAlter);
	      (removed || !exists) && SetRef(didChangeSize);

	      if (removed && len === 2) {
	        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newEntries = isEditable ? entries : arrCopy(entries);

	      if (exists) {
	        if (removed) {
	          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
	        } else {
	          newEntries[idx] = [key, value];
	        }
	      } else {
	        newEntries.push([key, value]);
	      }

	      if (isEditable) {
	        this.entries = newEntries;
	        return this;
	      }

	      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
	    };




	    function ValueNode(ownerID, keyHash, entry) {
	      this.ownerID = ownerID;
	      this.keyHash = keyHash;
	      this.entry = entry;
	    }

	    ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
	    };

	    ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      var removed = value === NOT_SET;
	      var keyMatch = is(key, this.entry[0]);
	      if (keyMatch ? value === this.entry[1] : removed) {
	        return this;
	      }

	      SetRef(didAlter);

	      if (removed) {
	        SetRef(didChangeSize);
	        return; // undefined
	      }

	      if (keyMatch) {
	        if (ownerID && ownerID === this.ownerID) {
	          this.entry[1] = value;
	          return this;
	        }
	        return new ValueNode(ownerID, this.keyHash, [key, value]);
	      }

	      SetRef(didChangeSize);
	      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
	    };



	  // #pragma Iterators

	  ArrayMapNode.prototype.iterate =
	  HashCollisionNode.prototype.iterate = function (fn, reverse) {
	    var entries = this.entries;
	    for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
	      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
	        return false;
	      }
	    }
	  }

	  BitmapIndexedNode.prototype.iterate =
	  HashArrayMapNode.prototype.iterate = function (fn, reverse) {
	    var nodes = this.nodes;
	    for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
	      var node = nodes[reverse ? maxIndex - ii : ii];
	      if (node && node.iterate(fn, reverse) === false) {
	        return false;
	      }
	    }
	  }

	  ValueNode.prototype.iterate = function (fn, reverse) {
	    return fn(this.entry);
	  }

	  createClass(MapIterator, src_Iterator__Iterator);

	    function MapIterator(map, type, reverse) {
	      this._type = type;
	      this._reverse = reverse;
	      this._stack = map._root && mapIteratorFrame(map._root);
	    }

	    MapIterator.prototype.next = function() {
	      var type = this._type;
	      var stack = this._stack;
	      while (stack) {
	        var node = stack.node;
	        var index = stack.index++;
	        var maxIndex;
	        if (node.entry) {
	          if (index === 0) {
	            return mapIteratorValue(type, node.entry);
	          }
	        } else if (node.entries) {
	          maxIndex = node.entries.length - 1;
	          if (index <= maxIndex) {
	            return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
	          }
	        } else {
	          maxIndex = node.nodes.length - 1;
	          if (index <= maxIndex) {
	            var subNode = node.nodes[this._reverse ? maxIndex - index : index];
	            if (subNode) {
	              if (subNode.entry) {
	                return mapIteratorValue(type, subNode.entry);
	              }
	              stack = this._stack = mapIteratorFrame(subNode, stack);
	            }
	            continue;
	          }
	        }
	        stack = this._stack = this._stack.__prev;
	      }
	      return iteratorDone();
	    };


	  function mapIteratorValue(type, entry) {
	    return iteratorValue(type, entry[0], entry[1]);
	  }

	  function mapIteratorFrame(node, prev) {
	    return {
	      node: node,
	      index: 0,
	      __prev: prev
	    };
	  }

	  function makeMap(size, root, ownerID, hash) {
	    var map = Object.create(MapPrototype);
	    map.size = size;
	    map._root = root;
	    map.__ownerID = ownerID;
	    map.__hash = hash;
	    map.__altered = false;
	    return map;
	  }

	  var EMPTY_MAP;
	  function emptyMap() {
	    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
	  }

	  function updateMap(map, k, v) {
	    var newRoot;
	    var newSize;
	    if (!map._root) {
	      if (v === NOT_SET) {
	        return map;
	      }
	      newSize = 1;
	      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
	    } else {
	      var didChangeSize = MakeRef(CHANGE_LENGTH);
	      var didAlter = MakeRef(DID_ALTER);
	      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
	      if (!didAlter.value) {
	        return map;
	      }
	      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
	    }
	    if (map.__ownerID) {
	      map.size = newSize;
	      map._root = newRoot;
	      map.__hash = undefined;
	      map.__altered = true;
	      return map;
	    }
	    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
	  }

	  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	    if (!node) {
	      if (value === NOT_SET) {
	        return node;
	      }
	      SetRef(didAlter);
	      SetRef(didChangeSize);
	      return new ValueNode(ownerID, keyHash, [key, value]);
	    }
	    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
	  }

	  function isLeafNode(node) {
	    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
	  }

	  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
	    if (node.keyHash === keyHash) {
	      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
	    }

	    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
	    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

	    var newNode;
	    var nodes = idx1 === idx2 ?
	      [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
	      ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

	    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
	  }

	  function createNodes(ownerID, entries, key, value) {
	    if (!ownerID) {
	      ownerID = new OwnerID();
	    }
	    var node = new ValueNode(ownerID, hash(key), [key, value]);
	    for (var ii = 0; ii < entries.length; ii++) {
	      var entry = entries[ii];
	      node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
	    }
	    return node;
	  }

	  function packNodes(ownerID, nodes, count, excluding) {
	    var bitmap = 0;
	    var packedII = 0;
	    var packedNodes = new Array(count);
	    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
	      var node = nodes[ii];
	      if (node !== undefined && ii !== excluding) {
	        bitmap |= bit;
	        packedNodes[packedII++] = node;
	      }
	    }
	    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
	  }

	  function expandNodes(ownerID, nodes, bitmap, including, node) {
	    var count = 0;
	    var expandedNodes = new Array(SIZE);
	    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
	      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
	    }
	    expandedNodes[including] = node;
	    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
	  }

	  function mergeIntoMapWith(map, merger, iterables) {
	    var iters = [];
	    for (var ii = 0; ii < iterables.length; ii++) {
	      var value = iterables[ii];
	      var iter = KeyedIterable(value);
	      if (!isIterable(value)) {
	        iter = iter.map(function(v ) {return fromJS(v)});
	      }
	      iters.push(iter);
	    }
	    return mergeIntoCollectionWith(map, merger, iters);
	  }

	  function deepMerger(merger) {
	    return function(existing, value, key) 
	      {return existing && existing.mergeDeepWith && isIterable(value) ?
	        existing.mergeDeepWith(merger, value) :
	        merger ? merger(existing, value, key) : value};
	  }

	  function mergeIntoCollectionWith(collection, merger, iters) {
	    iters = iters.filter(function(x ) {return x.size !== 0});
	    if (iters.length === 0) {
	      return collection;
	    }
	    if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
	      return collection.constructor(iters[0]);
	    }
	    return collection.withMutations(function(collection ) {
	      var mergeIntoMap = merger ?
	        function(value, key)  {
	          collection.update(key, NOT_SET, function(existing )
	            {return existing === NOT_SET ? value : merger(existing, value, key)}
	          );
	        } :
	        function(value, key)  {
	          collection.set(key, value);
	        }
	      for (var ii = 0; ii < iters.length; ii++) {
	        iters[ii].forEach(mergeIntoMap);
	      }
	    });
	  }

	  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
	    var isNotSet = existing === NOT_SET;
	    var step = keyPathIter.next();
	    if (step.done) {
	      var existingValue = isNotSet ? notSetValue : existing;
	      var newValue = updater(existingValue);
	      return newValue === existingValue ? existing : newValue;
	    }
	    invariant(
	      isNotSet || (existing && existing.set),
	      'invalid keyPath'
	    );
	    var key = step.value;
	    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
	    var nextUpdated = updateInDeepMap(
	      nextExisting,
	      keyPathIter,
	      notSetValue,
	      updater
	    );
	    return nextUpdated === nextExisting ? existing :
	      nextUpdated === NOT_SET ? existing.remove(key) :
	      (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
	  }

	  function popCount(x) {
	    x = x - ((x >> 1) & 0x55555555);
	    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
	    x = (x + (x >> 4)) & 0x0f0f0f0f;
	    x = x + (x >> 8);
	    x = x + (x >> 16);
	    return x & 0x7f;
	  }

	  function setIn(array, idx, val, canEdit) {
	    var newArray = canEdit ? array : arrCopy(array);
	    newArray[idx] = val;
	    return newArray;
	  }

	  function spliceIn(array, idx, val, canEdit) {
	    var newLen = array.length + 1;
	    if (canEdit && idx + 1 === newLen) {
	      array[idx] = val;
	      return array;
	    }
	    var newArray = new Array(newLen);
	    var after = 0;
	    for (var ii = 0; ii < newLen; ii++) {
	      if (ii === idx) {
	        newArray[ii] = val;
	        after = -1;
	      } else {
	        newArray[ii] = array[ii + after];
	      }
	    }
	    return newArray;
	  }

	  function spliceOut(array, idx, canEdit) {
	    var newLen = array.length - 1;
	    if (canEdit && idx === newLen) {
	      array.pop();
	      return array;
	    }
	    var newArray = new Array(newLen);
	    var after = 0;
	    for (var ii = 0; ii < newLen; ii++) {
	      if (ii === idx) {
	        after = 1;
	      }
	      newArray[ii] = array[ii + after];
	    }
	    return newArray;
	  }

	  var MAX_ARRAY_MAP_SIZE = SIZE / 4;
	  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
	  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

	  createClass(List, IndexedCollection);

	    // @pragma Construction

	    function List(value) {
	      var empty = emptyList();
	      if (value === null || value === undefined) {
	        return empty;
	      }
	      if (isList(value)) {
	        return value;
	      }
	      var iter = IndexedIterable(value);
	      var size = iter.size;
	      if (size === 0) {
	        return empty;
	      }
	      assertNotInfinite(size);
	      if (size > 0 && size < SIZE) {
	        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
	      }
	      return empty.withMutations(function(list ) {
	        list.setSize(size);
	        iter.forEach(function(v, i)  {return list.set(i, v)});
	      });
	    }

	    List.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    List.prototype.toString = function() {
	      return this.__toString('List [', ']');
	    };

	    // @pragma Access

	    List.prototype.get = function(index, notSetValue) {
	      index = wrapIndex(this, index);
	      if (index < 0 || index >= this.size) {
	        return notSetValue;
	      }
	      index += this._origin;
	      var node = listNodeFor(this, index);
	      return node && node.array[index & MASK];
	    };

	    // @pragma Modification

	    List.prototype.set = function(index, value) {
	      return updateList(this, index, value);
	    };

	    List.prototype.remove = function(index) {
	      return !this.has(index) ? this :
	        index === 0 ? this.shift() :
	        index === this.size - 1 ? this.pop() :
	        this.splice(index, 1);
	    };

	    List.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = this._origin = this._capacity = 0;
	        this._level = SHIFT;
	        this._root = this._tail = null;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyList();
	    };

	    List.prototype.push = function(/*...values*/) {
	      var values = arguments;
	      var oldSize = this.size;
	      return this.withMutations(function(list ) {
	        setListBounds(list, 0, oldSize + values.length);
	        for (var ii = 0; ii < values.length; ii++) {
	          list.set(oldSize + ii, values[ii]);
	        }
	      });
	    };

	    List.prototype.pop = function() {
	      return setListBounds(this, 0, -1);
	    };

	    List.prototype.unshift = function(/*...values*/) {
	      var values = arguments;
	      return this.withMutations(function(list ) {
	        setListBounds(list, -values.length);
	        for (var ii = 0; ii < values.length; ii++) {
	          list.set(ii, values[ii]);
	        }
	      });
	    };

	    List.prototype.shift = function() {
	      return setListBounds(this, 1);
	    };

	    // @pragma Composition

	    List.prototype.merge = function(/*...iters*/) {
	      return mergeIntoListWith(this, undefined, arguments);
	    };

	    List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoListWith(this, merger, iters);
	    };

	    List.prototype.mergeDeep = function(/*...iters*/) {
	      return mergeIntoListWith(this, deepMerger(undefined), arguments);
	    };

	    List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoListWith(this, deepMerger(merger), iters);
	    };

	    List.prototype.setSize = function(size) {
	      return setListBounds(this, 0, size);
	    };

	    // @pragma Iteration

	    List.prototype.slice = function(begin, end) {
	      var size = this.size;
	      if (wholeSlice(begin, end, size)) {
	        return this;
	      }
	      return setListBounds(
	        this,
	        resolveBegin(begin, size),
	        resolveEnd(end, size)
	      );
	    };

	    List.prototype.__iterator = function(type, reverse) {
	      var index = 0;
	      var values = iterateList(this, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var value = values();
	        return value === DONE ?
	          iteratorDone() :
	          iteratorValue(type, index++, value);
	      });
	    };

	    List.prototype.__iterate = function(fn, reverse) {
	      var index = 0;
	      var values = iterateList(this, reverse);
	      var value;
	      while ((value = values()) !== DONE) {
	        if (fn(value, index++, this) === false) {
	          break;
	        }
	      }
	      return index;
	    };

	    List.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        return this;
	      }
	      return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
	    };


	  function isList(maybeList) {
	    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
	  }

	  List.isList = isList;

	  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

	  var ListPrototype = List.prototype;
	  ListPrototype[IS_LIST_SENTINEL] = true;
	  ListPrototype[DELETE] = ListPrototype.remove;
	  ListPrototype.setIn = MapPrototype.setIn;
	  ListPrototype.deleteIn =
	  ListPrototype.removeIn = MapPrototype.removeIn;
	  ListPrototype.update = MapPrototype.update;
	  ListPrototype.updateIn = MapPrototype.updateIn;
	  ListPrototype.mergeIn = MapPrototype.mergeIn;
	  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
	  ListPrototype.withMutations = MapPrototype.withMutations;
	  ListPrototype.asMutable = MapPrototype.asMutable;
	  ListPrototype.asImmutable = MapPrototype.asImmutable;
	  ListPrototype.wasAltered = MapPrototype.wasAltered;



	    function VNode(array, ownerID) {
	      this.array = array;
	      this.ownerID = ownerID;
	    }

	    // TODO: seems like these methods are very similar

	    VNode.prototype.removeBefore = function(ownerID, level, index) {
	      if (index === level ? 1 << level : 0 || this.array.length === 0) {
	        return this;
	      }
	      var originIndex = (index >>> level) & MASK;
	      if (originIndex >= this.array.length) {
	        return new VNode([], ownerID);
	      }
	      var removingFirst = originIndex === 0;
	      var newChild;
	      if (level > 0) {
	        var oldChild = this.array[originIndex];
	        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
	        if (newChild === oldChild && removingFirst) {
	          return this;
	        }
	      }
	      if (removingFirst && !newChild) {
	        return this;
	      }
	      var editable = editableVNode(this, ownerID);
	      if (!removingFirst) {
	        for (var ii = 0; ii < originIndex; ii++) {
	          editable.array[ii] = undefined;
	        }
	      }
	      if (newChild) {
	        editable.array[originIndex] = newChild;
	      }
	      return editable;
	    };

	    VNode.prototype.removeAfter = function(ownerID, level, index) {
	      if (index === level ? 1 << level : 0 || this.array.length === 0) {
	        return this;
	      }
	      var sizeIndex = ((index - 1) >>> level) & MASK;
	      if (sizeIndex >= this.array.length) {
	        return this;
	      }
	      var removingLast = sizeIndex === this.array.length - 1;
	      var newChild;
	      if (level > 0) {
	        var oldChild = this.array[sizeIndex];
	        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
	        if (newChild === oldChild && removingLast) {
	          return this;
	        }
	      }
	      if (removingLast && !newChild) {
	        return this;
	      }
	      var editable = editableVNode(this, ownerID);
	      if (!removingLast) {
	        editable.array.pop();
	      }
	      if (newChild) {
	        editable.array[sizeIndex] = newChild;
	      }
	      return editable;
	    };



	  var DONE = {};

	  function iterateList(list, reverse) {
	    var left = list._origin;
	    var right = list._capacity;
	    var tailPos = getTailOffset(right);
	    var tail = list._tail;

	    return iterateNodeOrLeaf(list._root, list._level, 0);

	    function iterateNodeOrLeaf(node, level, offset) {
	      return level === 0 ?
	        iterateLeaf(node, offset) :
	        iterateNode(node, level, offset);
	    }

	    function iterateLeaf(node, offset) {
	      var array = offset === tailPos ? tail && tail.array : node && node.array;
	      var from = offset > left ? 0 : left - offset;
	      var to = right - offset;
	      if (to > SIZE) {
	        to = SIZE;
	      }
	      return function()  {
	        if (from === to) {
	          return DONE;
	        }
	        var idx = reverse ? --to : from++;
	        return array && array[idx];
	      };
	    }

	    function iterateNode(node, level, offset) {
	      var values;
	      var array = node && node.array;
	      var from = offset > left ? 0 : (left - offset) >> level;
	      var to = ((right - offset) >> level) + 1;
	      if (to > SIZE) {
	        to = SIZE;
	      }
	      return function()  {
	        do {
	          if (values) {
	            var value = values();
	            if (value !== DONE) {
	              return value;
	            }
	            values = null;
	          }
	          if (from === to) {
	            return DONE;
	          }
	          var idx = reverse ? --to : from++;
	          values = iterateNodeOrLeaf(
	            array && array[idx], level - SHIFT, offset + (idx << level)
	          );
	        } while (true);
	      };
	    }
	  }

	  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
	    var list = Object.create(ListPrototype);
	    list.size = capacity - origin;
	    list._origin = origin;
	    list._capacity = capacity;
	    list._level = level;
	    list._root = root;
	    list._tail = tail;
	    list.__ownerID = ownerID;
	    list.__hash = hash;
	    list.__altered = false;
	    return list;
	  }

	  var EMPTY_LIST;
	  function emptyList() {
	    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
	  }

	  function updateList(list, index, value) {
	    index = wrapIndex(list, index);

	    if (index >= list.size || index < 0) {
	      return list.withMutations(function(list ) {
	        index < 0 ?
	          setListBounds(list, index).set(0, value) :
	          setListBounds(list, 0, index + 1).set(index, value)
	      });
	    }

	    index += list._origin;

	    var newTail = list._tail;
	    var newRoot = list._root;
	    var didAlter = MakeRef(DID_ALTER);
	    if (index >= getTailOffset(list._capacity)) {
	      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
	    } else {
	      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
	    }

	    if (!didAlter.value) {
	      return list;
	    }

	    if (list.__ownerID) {
	      list._root = newRoot;
	      list._tail = newTail;
	      list.__hash = undefined;
	      list.__altered = true;
	      return list;
	    }
	    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
	  }

	  function updateVNode(node, ownerID, level, index, value, didAlter) {
	    var idx = (index >>> level) & MASK;
	    var nodeHas = node && idx < node.array.length;
	    if (!nodeHas && value === undefined) {
	      return node;
	    }

	    var newNode;

	    if (level > 0) {
	      var lowerNode = node && node.array[idx];
	      var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
	      if (newLowerNode === lowerNode) {
	        return node;
	      }
	      newNode = editableVNode(node, ownerID);
	      newNode.array[idx] = newLowerNode;
	      return newNode;
	    }

	    if (nodeHas && node.array[idx] === value) {
	      return node;
	    }

	    SetRef(didAlter);

	    newNode = editableVNode(node, ownerID);
	    if (value === undefined && idx === newNode.array.length - 1) {
	      newNode.array.pop();
	    } else {
	      newNode.array[idx] = value;
	    }
	    return newNode;
	  }

	  function editableVNode(node, ownerID) {
	    if (ownerID && node && ownerID === node.ownerID) {
	      return node;
	    }
	    return new VNode(node ? node.array.slice() : [], ownerID);
	  }

	  function listNodeFor(list, rawIndex) {
	    if (rawIndex >= getTailOffset(list._capacity)) {
	      return list._tail;
	    }
	    if (rawIndex < 1 << (list._level + SHIFT)) {
	      var node = list._root;
	      var level = list._level;
	      while (node && level > 0) {
	        node = node.array[(rawIndex >>> level) & MASK];
	        level -= SHIFT;
	      }
	      return node;
	    }
	  }

	  function setListBounds(list, begin, end) {
	    var owner = list.__ownerID || new OwnerID();
	    var oldOrigin = list._origin;
	    var oldCapacity = list._capacity;
	    var newOrigin = oldOrigin + begin;
	    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
	    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
	      return list;
	    }

	    // If it's going to end after it starts, it's empty.
	    if (newOrigin >= newCapacity) {
	      return list.clear();
	    }

	    var newLevel = list._level;
	    var newRoot = list._root;

	    // New origin might need creating a higher root.
	    var offsetShift = 0;
	    while (newOrigin + offsetShift < 0) {
	      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
	      newLevel += SHIFT;
	      offsetShift += 1 << newLevel;
	    }
	    if (offsetShift) {
	      newOrigin += offsetShift;
	      oldOrigin += offsetShift;
	      newCapacity += offsetShift;
	      oldCapacity += offsetShift;
	    }

	    var oldTailOffset = getTailOffset(oldCapacity);
	    var newTailOffset = getTailOffset(newCapacity);

	    // New size might need creating a higher root.
	    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
	      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
	      newLevel += SHIFT;
	    }

	    // Locate or create the new tail.
	    var oldTail = list._tail;
	    var newTail = newTailOffset < oldTailOffset ?
	      listNodeFor(list, newCapacity - 1) :
	      newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

	    // Merge Tail into tree.
	    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
	      newRoot = editableVNode(newRoot, owner);
	      var node = newRoot;
	      for (var level = newLevel; level > SHIFT; level -= SHIFT) {
	        var idx = (oldTailOffset >>> level) & MASK;
	        node = node.array[idx] = editableVNode(node.array[idx], owner);
	      }
	      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
	    }

	    // If the size has been reduced, there's a chance the tail needs to be trimmed.
	    if (newCapacity < oldCapacity) {
	      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
	    }

	    // If the new origin is within the tail, then we do not need a root.
	    if (newOrigin >= newTailOffset) {
	      newOrigin -= newTailOffset;
	      newCapacity -= newTailOffset;
	      newLevel = SHIFT;
	      newRoot = null;
	      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

	    // Otherwise, if the root has been trimmed, garbage collect.
	    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
	      offsetShift = 0;

	      // Identify the new top root node of the subtree of the old root.
	      while (newRoot) {
	        var beginIndex = (newOrigin >>> newLevel) & MASK;
	        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
	          break;
	        }
	        if (beginIndex) {
	          offsetShift += (1 << newLevel) * beginIndex;
	        }
	        newLevel -= SHIFT;
	        newRoot = newRoot.array[beginIndex];
	      }

	      // Trim the new sides of the new root.
	      if (newRoot && newOrigin > oldOrigin) {
	        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
	      }
	      if (newRoot && newTailOffset < oldTailOffset) {
	        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
	      }
	      if (offsetShift) {
	        newOrigin -= offsetShift;
	        newCapacity -= offsetShift;
	      }
	    }

	    if (list.__ownerID) {
	      list.size = newCapacity - newOrigin;
	      list._origin = newOrigin;
	      list._capacity = newCapacity;
	      list._level = newLevel;
	      list._root = newRoot;
	      list._tail = newTail;
	      list.__hash = undefined;
	      list.__altered = true;
	      return list;
	    }
	    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
	  }

	  function mergeIntoListWith(list, merger, iterables) {
	    var iters = [];
	    var maxSize = 0;
	    for (var ii = 0; ii < iterables.length; ii++) {
	      var value = iterables[ii];
	      var iter = IndexedIterable(value);
	      if (iter.size > maxSize) {
	        maxSize = iter.size;
	      }
	      if (!isIterable(value)) {
	        iter = iter.map(function(v ) {return fromJS(v)});
	      }
	      iters.push(iter);
	    }
	    if (maxSize > list.size) {
	      list = list.setSize(maxSize);
	    }
	    return mergeIntoCollectionWith(list, merger, iters);
	  }

	  function getTailOffset(size) {
	    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
	  }

	  createClass(OrderedMap, src_Map__Map);

	    // @pragma Construction

	    function OrderedMap(value) {
	      return value === null || value === undefined ? emptyOrderedMap() :
	        isOrderedMap(value) ? value :
	        emptyOrderedMap().withMutations(function(map ) {
	          var iter = KeyedIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v, k)  {return map.set(k, v)});
	        });
	    }

	    OrderedMap.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    OrderedMap.prototype.toString = function() {
	      return this.__toString('OrderedMap {', '}');
	    };

	    // @pragma Access

	    OrderedMap.prototype.get = function(k, notSetValue) {
	      var index = this._map.get(k);
	      return index !== undefined ? this._list.get(index)[1] : notSetValue;
	    };

	    // @pragma Modification

	    OrderedMap.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._map.clear();
	        this._list.clear();
	        return this;
	      }
	      return emptyOrderedMap();
	    };

	    OrderedMap.prototype.set = function(k, v) {
	      return updateOrderedMap(this, k, v);
	    };

	    OrderedMap.prototype.remove = function(k) {
	      return updateOrderedMap(this, k, NOT_SET);
	    };

	    OrderedMap.prototype.wasAltered = function() {
	      return this._map.wasAltered() || this._list.wasAltered();
	    };

	    OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._list.__iterate(
	        function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
	        reverse
	      );
	    };

	    OrderedMap.prototype.__iterator = function(type, reverse) {
	      return this._list.fromEntrySeq().__iterator(type, reverse);
	    };

	    OrderedMap.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map.__ensureOwner(ownerID);
	      var newList = this._list.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        this._list = newList;
	        return this;
	      }
	      return makeOrderedMap(newMap, newList, ownerID, this.__hash);
	    };


	  function isOrderedMap(maybeOrderedMap) {
	    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
	  }

	  OrderedMap.isOrderedMap = isOrderedMap;

	  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
	  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



	  function makeOrderedMap(map, list, ownerID, hash) {
	    var omap = Object.create(OrderedMap.prototype);
	    omap.size = map ? map.size : 0;
	    omap._map = map;
	    omap._list = list;
	    omap.__ownerID = ownerID;
	    omap.__hash = hash;
	    return omap;
	  }

	  var EMPTY_ORDERED_MAP;
	  function emptyOrderedMap() {
	    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
	  }

	  function updateOrderedMap(omap, k, v) {
	    var map = omap._map;
	    var list = omap._list;
	    var i = map.get(k);
	    var has = i !== undefined;
	    var newMap;
	    var newList;
	    if (v === NOT_SET) { // removed
	      if (!has) {
	        return omap;
	      }
	      if (list.size >= SIZE && list.size >= map.size * 2) {
	        newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
	        newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
	        if (omap.__ownerID) {
	          newMap.__ownerID = newList.__ownerID = omap.__ownerID;
	        }
	      } else {
	        newMap = map.remove(k);
	        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
	      }
	    } else {
	      if (has) {
	        if (v === list.get(i)[1]) {
	          return omap;
	        }
	        newMap = map;
	        newList = list.set(i, [k, v]);
	      } else {
	        newMap = map.set(k, list.size);
	        newList = list.set(list.size, [k, v]);
	      }
	    }
	    if (omap.__ownerID) {
	      omap.size = newMap.size;
	      omap._map = newMap;
	      omap._list = newList;
	      omap.__hash = undefined;
	      return omap;
	    }
	    return makeOrderedMap(newMap, newList);
	  }

	  createClass(Stack, IndexedCollection);

	    // @pragma Construction

	    function Stack(value) {
	      return value === null || value === undefined ? emptyStack() :
	        isStack(value) ? value :
	        emptyStack().unshiftAll(value);
	    }

	    Stack.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    Stack.prototype.toString = function() {
	      return this.__toString('Stack [', ']');
	    };

	    // @pragma Access

	    Stack.prototype.get = function(index, notSetValue) {
	      var head = this._head;
	      index = wrapIndex(this, index);
	      while (head && index--) {
	        head = head.next;
	      }
	      return head ? head.value : notSetValue;
	    };

	    Stack.prototype.peek = function() {
	      return this._head && this._head.value;
	    };

	    // @pragma Modification

	    Stack.prototype.push = function(/*...values*/) {
	      if (arguments.length === 0) {
	        return this;
	      }
	      var newSize = this.size + arguments.length;
	      var head = this._head;
	      for (var ii = arguments.length - 1; ii >= 0; ii--) {
	        head = {
	          value: arguments[ii],
	          next: head
	        };
	      }
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    Stack.prototype.pushAll = function(iter) {
	      iter = IndexedIterable(iter);
	      if (iter.size === 0) {
	        return this;
	      }
	      assertNotInfinite(iter.size);
	      var newSize = this.size;
	      var head = this._head;
	      iter.reverse().forEach(function(value ) {
	        newSize++;
	        head = {
	          value: value,
	          next: head
	        };
	      });
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    Stack.prototype.pop = function() {
	      return this.slice(1);
	    };

	    Stack.prototype.unshift = function(/*...values*/) {
	      return this.push.apply(this, arguments);
	    };

	    Stack.prototype.unshiftAll = function(iter) {
	      return this.pushAll(iter);
	    };

	    Stack.prototype.shift = function() {
	      return this.pop.apply(this, arguments);
	    };

	    Stack.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._head = undefined;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyStack();
	    };

	    Stack.prototype.slice = function(begin, end) {
	      if (wholeSlice(begin, end, this.size)) {
	        return this;
	      }
	      var resolvedBegin = resolveBegin(begin, this.size);
	      var resolvedEnd = resolveEnd(end, this.size);
	      if (resolvedEnd !== this.size) {
	        // super.slice(begin, end);
	        return IndexedCollection.prototype.slice.call(this, begin, end);
	      }
	      var newSize = this.size - resolvedBegin;
	      var head = this._head;
	      while (resolvedBegin--) {
	        head = head.next;
	      }
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    // @pragma Mutability

	    Stack.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this.__altered = false;
	        return this;
	      }
	      return makeStack(this.size, this._head, ownerID, this.__hash);
	    };

	    // @pragma Iteration

	    Stack.prototype.__iterate = function(fn, reverse) {
	      if (reverse) {
	        return this.reverse().__iterate(fn);
	      }
	      var iterations = 0;
	      var node = this._head;
	      while (node) {
	        if (fn(node.value, iterations++, this) === false) {
	          break;
	        }
	        node = node.next;
	      }
	      return iterations;
	    };

	    Stack.prototype.__iterator = function(type, reverse) {
	      if (reverse) {
	        return this.reverse().__iterator(type);
	      }
	      var iterations = 0;
	      var node = this._head;
	      return new src_Iterator__Iterator(function()  {
	        if (node) {
	          var value = node.value;
	          node = node.next;
	          return iteratorValue(type, iterations++, value);
	        }
	        return iteratorDone();
	      });
	    };


	  function isStack(maybeStack) {
	    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
	  }

	  Stack.isStack = isStack;

	  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

	  var StackPrototype = Stack.prototype;
	  StackPrototype[IS_STACK_SENTINEL] = true;
	  StackPrototype.withMutations = MapPrototype.withMutations;
	  StackPrototype.asMutable = MapPrototype.asMutable;
	  StackPrototype.asImmutable = MapPrototype.asImmutable;
	  StackPrototype.wasAltered = MapPrototype.wasAltered;


	  function makeStack(size, head, ownerID, hash) {
	    var map = Object.create(StackPrototype);
	    map.size = size;
	    map._head = head;
	    map.__ownerID = ownerID;
	    map.__hash = hash;
	    map.__altered = false;
	    return map;
	  }

	  var EMPTY_STACK;
	  function emptyStack() {
	    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
	  }

	  createClass(src_Set__Set, SetCollection);

	    // @pragma Construction

	    function src_Set__Set(value) {
	      return value === null || value === undefined ? emptySet() :
	        isSet(value) ? value :
	        emptySet().withMutations(function(set ) {
	          var iter = SetIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v ) {return set.add(v)});
	        });
	    }

	    src_Set__Set.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    src_Set__Set.fromKeys = function(value) {
	      return this(KeyedIterable(value).keySeq());
	    };

	    src_Set__Set.prototype.toString = function() {
	      return this.__toString('Set {', '}');
	    };

	    // @pragma Access

	    src_Set__Set.prototype.has = function(value) {
	      return this._map.has(value);
	    };

	    // @pragma Modification

	    src_Set__Set.prototype.add = function(value) {
	      return updateSet(this, this._map.set(value, true));
	    };

	    src_Set__Set.prototype.remove = function(value) {
	      return updateSet(this, this._map.remove(value));
	    };

	    src_Set__Set.prototype.clear = function() {
	      return updateSet(this, this._map.clear());
	    };

	    // @pragma Composition

	    src_Set__Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
	      iters = iters.filter(function(x ) {return x.size !== 0});
	      if (iters.length === 0) {
	        return this;
	      }
	      if (this.size === 0 && !this.__ownerID && iters.length === 1) {
	        return this.constructor(iters[0]);
	      }
	      return this.withMutations(function(set ) {
	        for (var ii = 0; ii < iters.length; ii++) {
	          SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
	        }
	      });
	    };

	    src_Set__Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
	      if (iters.length === 0) {
	        return this;
	      }
	      iters = iters.map(function(iter ) {return SetIterable(iter)});
	      var originalSet = this;
	      return this.withMutations(function(set ) {
	        originalSet.forEach(function(value ) {
	          if (!iters.every(function(iter ) {return iter.includes(value)})) {
	            set.remove(value);
	          }
	        });
	      });
	    };

	    src_Set__Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
	      if (iters.length === 0) {
	        return this;
	      }
	      iters = iters.map(function(iter ) {return SetIterable(iter)});
	      var originalSet = this;
	      return this.withMutations(function(set ) {
	        originalSet.forEach(function(value ) {
	          if (iters.some(function(iter ) {return iter.includes(value)})) {
	            set.remove(value);
	          }
	        });
	      });
	    };

	    src_Set__Set.prototype.merge = function() {
	      return this.union.apply(this, arguments);
	    };

	    src_Set__Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return this.union.apply(this, iters);
	    };

	    src_Set__Set.prototype.sort = function(comparator) {
	      // Late binding
	      return OrderedSet(sortFactory(this, comparator));
	    };

	    src_Set__Set.prototype.sortBy = function(mapper, comparator) {
	      // Late binding
	      return OrderedSet(sortFactory(this, comparator, mapper));
	    };

	    src_Set__Set.prototype.wasAltered = function() {
	      return this._map.wasAltered();
	    };

	    src_Set__Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
	    };

	    src_Set__Set.prototype.__iterator = function(type, reverse) {
	      return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
	    };

	    src_Set__Set.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        return this;
	      }
	      return this.__make(newMap, ownerID);
	    };


	  function isSet(maybeSet) {
	    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
	  }

	  src_Set__Set.isSet = isSet;

	  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

	  var SetPrototype = src_Set__Set.prototype;
	  SetPrototype[IS_SET_SENTINEL] = true;
	  SetPrototype[DELETE] = SetPrototype.remove;
	  SetPrototype.mergeDeep = SetPrototype.merge;
	  SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
	  SetPrototype.withMutations = MapPrototype.withMutations;
	  SetPrototype.asMutable = MapPrototype.asMutable;
	  SetPrototype.asImmutable = MapPrototype.asImmutable;

	  SetPrototype.__empty = emptySet;
	  SetPrototype.__make = makeSet;

	  function updateSet(set, newMap) {
	    if (set.__ownerID) {
	      set.size = newMap.size;
	      set._map = newMap;
	      return set;
	    }
	    return newMap === set._map ? set :
	      newMap.size === 0 ? set.__empty() :
	      set.__make(newMap);
	  }

	  function makeSet(map, ownerID) {
	    var set = Object.create(SetPrototype);
	    set.size = map ? map.size : 0;
	    set._map = map;
	    set.__ownerID = ownerID;
	    return set;
	  }

	  var EMPTY_SET;
	  function emptySet() {
	    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
	  }

	  createClass(OrderedSet, src_Set__Set);

	    // @pragma Construction

	    function OrderedSet(value) {
	      return value === null || value === undefined ? emptyOrderedSet() :
	        isOrderedSet(value) ? value :
	        emptyOrderedSet().withMutations(function(set ) {
	          var iter = SetIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v ) {return set.add(v)});
	        });
	    }

	    OrderedSet.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    OrderedSet.fromKeys = function(value) {
	      return this(KeyedIterable(value).keySeq());
	    };

	    OrderedSet.prototype.toString = function() {
	      return this.__toString('OrderedSet {', '}');
	    };


	  function isOrderedSet(maybeOrderedSet) {
	    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
	  }

	  OrderedSet.isOrderedSet = isOrderedSet;

	  var OrderedSetPrototype = OrderedSet.prototype;
	  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

	  OrderedSetPrototype.__empty = emptyOrderedSet;
	  OrderedSetPrototype.__make = makeOrderedSet;

	  function makeOrderedSet(map, ownerID) {
	    var set = Object.create(OrderedSetPrototype);
	    set.size = map ? map.size : 0;
	    set._map = map;
	    set.__ownerID = ownerID;
	    return set;
	  }

	  var EMPTY_ORDERED_SET;
	  function emptyOrderedSet() {
	    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
	  }

	  createClass(Record, KeyedCollection);

	    function Record(defaultValues, name) {
	      var hasInitialized;

	      var RecordType = function Record(values) {
	        if (values instanceof RecordType) {
	          return values;
	        }
	        if (!(this instanceof RecordType)) {
	          return new RecordType(values);
	        }
	        if (!hasInitialized) {
	          hasInitialized = true;
	          var keys = Object.keys(defaultValues);
	          setProps(RecordTypePrototype, keys);
	          RecordTypePrototype.size = keys.length;
	          RecordTypePrototype._name = name;
	          RecordTypePrototype._keys = keys;
	          RecordTypePrototype._defaultValues = defaultValues;
	        }
	        this._map = src_Map__Map(values);
	      };

	      var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
	      RecordTypePrototype.constructor = RecordType;

	      return RecordType;
	    }

	    Record.prototype.toString = function() {
	      return this.__toString(recordName(this) + ' {', '}');
	    };

	    // @pragma Access

	    Record.prototype.has = function(k) {
	      return this._defaultValues.hasOwnProperty(k);
	    };

	    Record.prototype.get = function(k, notSetValue) {
	      if (!this.has(k)) {
	        return notSetValue;
	      }
	      var defaultVal = this._defaultValues[k];
	      return this._map ? this._map.get(k, defaultVal) : defaultVal;
	    };

	    // @pragma Modification

	    Record.prototype.clear = function() {
	      if (this.__ownerID) {
	        this._map && this._map.clear();
	        return this;
	      }
	      var RecordType = this.constructor;
	      return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()));
	    };

	    Record.prototype.set = function(k, v) {
	      if (!this.has(k)) {
	        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
	      }
	      var newMap = this._map && this._map.set(k, v);
	      if (this.__ownerID || newMap === this._map) {
	        return this;
	      }
	      return makeRecord(this, newMap);
	    };

	    Record.prototype.remove = function(k) {
	      if (!this.has(k)) {
	        return this;
	      }
	      var newMap = this._map && this._map.remove(k);
	      if (this.__ownerID || newMap === this._map) {
	        return this;
	      }
	      return makeRecord(this, newMap);
	    };

	    Record.prototype.wasAltered = function() {
	      return this._map.wasAltered();
	    };

	    Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
	      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
	    };

	    Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
	    };

	    Record.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map && this._map.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        return this;
	      }
	      return makeRecord(this, newMap, ownerID);
	    };


	  var RecordPrototype = Record.prototype;
	  RecordPrototype[DELETE] = RecordPrototype.remove;
	  RecordPrototype.deleteIn =
	  RecordPrototype.removeIn = MapPrototype.removeIn;
	  RecordPrototype.merge = MapPrototype.merge;
	  RecordPrototype.mergeWith = MapPrototype.mergeWith;
	  RecordPrototype.mergeIn = MapPrototype.mergeIn;
	  RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
	  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
	  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
	  RecordPrototype.setIn = MapPrototype.setIn;
	  RecordPrototype.update = MapPrototype.update;
	  RecordPrototype.updateIn = MapPrototype.updateIn;
	  RecordPrototype.withMutations = MapPrototype.withMutations;
	  RecordPrototype.asMutable = MapPrototype.asMutable;
	  RecordPrototype.asImmutable = MapPrototype.asImmutable;


	  function makeRecord(likeRecord, map, ownerID) {
	    var record = Object.create(Object.getPrototypeOf(likeRecord));
	    record._map = map;
	    record.__ownerID = ownerID;
	    return record;
	  }

	  function recordName(record) {
	    return record._name || record.constructor.name || 'Record';
	  }

	  function setProps(prototype, names) {
	    try {
	      names.forEach(setProp.bind(undefined, prototype));
	    } catch (error) {
	      // Object.defineProperty failed. Probably IE8.
	    }
	  }

	  function setProp(prototype, name) {
	    Object.defineProperty(prototype, name, {
	      get: function() {
	        return this.get(name);
	      },
	      set: function(value) {
	        invariant(this.__ownerID, 'Cannot set on an immutable record.');
	        this.set(name, value);
	      }
	    });
	  }

	  function deepEqual(a, b) {
	    if (a === b) {
	      return true;
	    }

	    if (
	      !isIterable(b) ||
	      a.size !== undefined && b.size !== undefined && a.size !== b.size ||
	      a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
	      isKeyed(a) !== isKeyed(b) ||
	      isIndexed(a) !== isIndexed(b) ||
	      isOrdered(a) !== isOrdered(b)
	    ) {
	      return false;
	    }

	    if (a.size === 0 && b.size === 0) {
	      return true;
	    }

	    var notAssociative = !isAssociative(a);

	    if (isOrdered(a)) {
	      var entries = a.entries();
	      return b.every(function(v, k)  {
	        var entry = entries.next().value;
	        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
	      }) && entries.next().done;
	    }

	    var flipped = false;

	    if (a.size === undefined) {
	      if (b.size === undefined) {
	        if (typeof a.cacheResult === 'function') {
	          a.cacheResult();
	        }
	      } else {
	        flipped = true;
	        var _ = a;
	        a = b;
	        b = _;
	      }
	    }

	    var allEqual = true;
	    var bSize = b.__iterate(function(v, k)  {
	      if (notAssociative ? !a.has(v) :
	          flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
	        allEqual = false;
	        return false;
	      }
	    });

	    return allEqual && a.size === bSize;
	  }

	  createClass(Range, IndexedSeq);

	    function Range(start, end, step) {
	      if (!(this instanceof Range)) {
	        return new Range(start, end, step);
	      }
	      invariant(step !== 0, 'Cannot step a Range by 0');
	      start = start || 0;
	      if (end === undefined) {
	        end = Infinity;
	      }
	      step = step === undefined ? 1 : Math.abs(step);
	      if (end < start) {
	        step = -step;
	      }
	      this._start = start;
	      this._end = end;
	      this._step = step;
	      this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
	      if (this.size === 0) {
	        if (EMPTY_RANGE) {
	          return EMPTY_RANGE;
	        }
	        EMPTY_RANGE = this;
	      }
	    }

	    Range.prototype.toString = function() {
	      if (this.size === 0) {
	        return 'Range []';
	      }
	      return 'Range [ ' +
	        this._start + '...' + this._end +
	        (this._step > 1 ? ' by ' + this._step : '') +
	      ' ]';
	    };

	    Range.prototype.get = function(index, notSetValue) {
	      return this.has(index) ?
	        this._start + wrapIndex(this, index) * this._step :
	        notSetValue;
	    };

	    Range.prototype.includes = function(searchValue) {
	      var possibleIndex = (searchValue - this._start) / this._step;
	      return possibleIndex >= 0 &&
	        possibleIndex < this.size &&
	        possibleIndex === Math.floor(possibleIndex);
	    };

	    Range.prototype.slice = function(begin, end) {
	      if (wholeSlice(begin, end, this.size)) {
	        return this;
	      }
	      begin = resolveBegin(begin, this.size);
	      end = resolveEnd(end, this.size);
	      if (end <= begin) {
	        return new Range(0, 0);
	      }
	      return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
	    };

	    Range.prototype.indexOf = function(searchValue) {
	      var offsetValue = searchValue - this._start;
	      if (offsetValue % this._step === 0) {
	        var index = offsetValue / this._step;
	        if (index >= 0 && index < this.size) {
	          return index
	        }
	      }
	      return -1;
	    };

	    Range.prototype.lastIndexOf = function(searchValue) {
	      return this.indexOf(searchValue);
	    };

	    Range.prototype.__iterate = function(fn, reverse) {
	      var maxIndex = this.size - 1;
	      var step = this._step;
	      var value = reverse ? this._start + maxIndex * step : this._start;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        if (fn(value, ii, this) === false) {
	          return ii + 1;
	        }
	        value += reverse ? -step : step;
	      }
	      return ii;
	    };

	    Range.prototype.__iterator = function(type, reverse) {
	      var maxIndex = this.size - 1;
	      var step = this._step;
	      var value = reverse ? this._start + maxIndex * step : this._start;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var v = value;
	        value += reverse ? -step : step;
	        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
	      });
	    };

	    Range.prototype.equals = function(other) {
	      return other instanceof Range ?
	        this._start === other._start &&
	        this._end === other._end &&
	        this._step === other._step :
	        deepEqual(this, other);
	    };


	  var EMPTY_RANGE;

	  createClass(Repeat, IndexedSeq);

	    function Repeat(value, times) {
	      if (!(this instanceof Repeat)) {
	        return new Repeat(value, times);
	      }
	      this._value = value;
	      this.size = times === undefined ? Infinity : Math.max(0, times);
	      if (this.size === 0) {
	        if (EMPTY_REPEAT) {
	          return EMPTY_REPEAT;
	        }
	        EMPTY_REPEAT = this;
	      }
	    }

	    Repeat.prototype.toString = function() {
	      if (this.size === 0) {
	        return 'Repeat []';
	      }
	      return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
	    };

	    Repeat.prototype.get = function(index, notSetValue) {
	      return this.has(index) ? this._value : notSetValue;
	    };

	    Repeat.prototype.includes = function(searchValue) {
	      return is(this._value, searchValue);
	    };

	    Repeat.prototype.slice = function(begin, end) {
	      var size = this.size;
	      return wholeSlice(begin, end, size) ? this :
	        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
	    };

	    Repeat.prototype.reverse = function() {
	      return this;
	    };

	    Repeat.prototype.indexOf = function(searchValue) {
	      if (is(this._value, searchValue)) {
	        return 0;
	      }
	      return -1;
	    };

	    Repeat.prototype.lastIndexOf = function(searchValue) {
	      if (is(this._value, searchValue)) {
	        return this.size;
	      }
	      return -1;
	    };

	    Repeat.prototype.__iterate = function(fn, reverse) {
	      for (var ii = 0; ii < this.size; ii++) {
	        if (fn(this._value, ii, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
	      var ii = 0;
	      return new src_Iterator__Iterator(function() 
	        {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
	      );
	    };

	    Repeat.prototype.equals = function(other) {
	      return other instanceof Repeat ?
	        is(this._value, other._value) :
	        deepEqual(other);
	    };


	  var EMPTY_REPEAT;

	  /**
	   * Contributes additional methods to a constructor
	   */
	  function mixin(ctor, methods) {
	    var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
	    Object.keys(methods).forEach(keyCopier);
	    Object.getOwnPropertySymbols &&
	      Object.getOwnPropertySymbols(methods).forEach(keyCopier);
	    return ctor;
	  }

	  Iterable.Iterator = src_Iterator__Iterator;

	  mixin(Iterable, {

	    // ### Conversion to other types

	    toArray: function() {
	      assertNotInfinite(this.size);
	      var array = new Array(this.size || 0);
	      this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
	      return array;
	    },

	    toIndexedSeq: function() {
	      return new ToIndexedSequence(this);
	    },

	    toJS: function() {
	      return this.toSeq().map(
	        function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
	      ).__toJS();
	    },

	    toJSON: function() {
	      return this.toSeq().map(
	        function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
	      ).__toJS();
	    },

	    toKeyedSeq: function() {
	      return new ToKeyedSequence(this, true);
	    },

	    toMap: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return src_Map__Map(this.toKeyedSeq());
	    },

	    toObject: function() {
	      assertNotInfinite(this.size);
	      var object = {};
	      this.__iterate(function(v, k)  { object[k] = v; });
	      return object;
	    },

	    toOrderedMap: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return OrderedMap(this.toKeyedSeq());
	    },

	    toOrderedSet: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toSet: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return src_Set__Set(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toSetSeq: function() {
	      return new ToSetSequence(this);
	    },

	    toSeq: function() {
	      return isIndexed(this) ? this.toIndexedSeq() :
	        isKeyed(this) ? this.toKeyedSeq() :
	        this.toSetSeq();
	    },

	    toStack: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return Stack(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toList: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return List(isKeyed(this) ? this.valueSeq() : this);
	    },


	    // ### Common JavaScript methods and properties

	    toString: function() {
	      return '[Iterable]';
	    },

	    __toString: function(head, tail) {
	      if (this.size === 0) {
	        return head + tail;
	      }
	      return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
	    },


	    // ### ES6 Collection methods (ES6 Array and Map)

	    concat: function() {var values = SLICE$0.call(arguments, 0);
	      return reify(this, concatFactory(this, values));
	    },

	    contains: function(searchValue) {
	      return this.includes(searchValue);
	    },

	    includes: function(searchValue) {
	      return this.some(function(value ) {return is(value, searchValue)});
	    },

	    entries: function() {
	      return this.__iterator(ITERATE_ENTRIES);
	    },

	    every: function(predicate, context) {
	      assertNotInfinite(this.size);
	      var returnValue = true;
	      this.__iterate(function(v, k, c)  {
	        if (!predicate.call(context, v, k, c)) {
	          returnValue = false;
	          return false;
	        }
	      });
	      return returnValue;
	    },

	    filter: function(predicate, context) {
	      return reify(this, filterFactory(this, predicate, context, true));
	    },

	    find: function(predicate, context, notSetValue) {
	      var entry = this.findEntry(predicate, context);
	      return entry ? entry[1] : notSetValue;
	    },

	    findEntry: function(predicate, context) {
	      var found;
	      this.__iterate(function(v, k, c)  {
	        if (predicate.call(context, v, k, c)) {
	          found = [k, v];
	          return false;
	        }
	      });
	      return found;
	    },

	    findLastEntry: function(predicate, context) {
	      return this.toSeq().reverse().findEntry(predicate, context);
	    },

	    forEach: function(sideEffect, context) {
	      assertNotInfinite(this.size);
	      return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
	    },

	    join: function(separator) {
	      assertNotInfinite(this.size);
	      separator = separator !== undefined ? '' + separator : ',';
	      var joined = '';
	      var isFirst = true;
	      this.__iterate(function(v ) {
	        isFirst ? (isFirst = false) : (joined += separator);
	        joined += v !== null && v !== undefined ? v.toString() : '';
	      });
	      return joined;
	    },

	    keys: function() {
	      return this.__iterator(ITERATE_KEYS);
	    },

	    map: function(mapper, context) {
	      return reify(this, mapFactory(this, mapper, context));
	    },

	    reduce: function(reducer, initialReduction, context) {
	      assertNotInfinite(this.size);
	      var reduction;
	      var useFirst;
	      if (arguments.length < 2) {
	        useFirst = true;
	      } else {
	        reduction = initialReduction;
	      }
	      this.__iterate(function(v, k, c)  {
	        if (useFirst) {
	          useFirst = false;
	          reduction = v;
	        } else {
	          reduction = reducer.call(context, reduction, v, k, c);
	        }
	      });
	      return reduction;
	    },

	    reduceRight: function(reducer, initialReduction, context) {
	      var reversed = this.toKeyedSeq().reverse();
	      return reversed.reduce.apply(reversed, arguments);
	    },

	    reverse: function() {
	      return reify(this, reverseFactory(this, true));
	    },

	    slice: function(begin, end) {
	      return reify(this, sliceFactory(this, begin, end, true));
	    },

	    some: function(predicate, context) {
	      return !this.every(not(predicate), context);
	    },

	    sort: function(comparator) {
	      return reify(this, sortFactory(this, comparator));
	    },

	    values: function() {
	      return this.__iterator(ITERATE_VALUES);
	    },


	    // ### More sequential methods

	    butLast: function() {
	      return this.slice(0, -1);
	    },

	    isEmpty: function() {
	      return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
	    },

	    count: function(predicate, context) {
	      return ensureSize(
	        predicate ? this.toSeq().filter(predicate, context) : this
	      );
	    },

	    countBy: function(grouper, context) {
	      return countByFactory(this, grouper, context);
	    },

	    equals: function(other) {
	      return deepEqual(this, other);
	    },

	    entrySeq: function() {
	      var iterable = this;
	      if (iterable._cache) {
	        // We cache as an entries array, so we can just return the cache!
	        return new ArraySeq(iterable._cache);
	      }
	      var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
	      entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
	      return entriesSequence;
	    },

	    filterNot: function(predicate, context) {
	      return this.filter(not(predicate), context);
	    },

	    findLast: function(predicate, context, notSetValue) {
	      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
	    },

	    first: function() {
	      return this.find(returnTrue);
	    },

	    flatMap: function(mapper, context) {
	      return reify(this, flatMapFactory(this, mapper, context));
	    },

	    flatten: function(depth) {
	      return reify(this, flattenFactory(this, depth, true));
	    },

	    fromEntrySeq: function() {
	      return new FromEntriesSequence(this);
	    },

	    get: function(searchKey, notSetValue) {
	      return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
	    },

	    getIn: function(searchKeyPath, notSetValue) {
	      var nested = this;
	      // Note: in an ES6 environment, we would prefer:
	      // for (var key of searchKeyPath) {
	      var iter = forceIterator(searchKeyPath);
	      var step;
	      while (!(step = iter.next()).done) {
	        var key = step.value;
	        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
	        if (nested === NOT_SET) {
	          return notSetValue;
	        }
	      }
	      return nested;
	    },

	    groupBy: function(grouper, context) {
	      return groupByFactory(this, grouper, context);
	    },

	    has: function(searchKey) {
	      return this.get(searchKey, NOT_SET) !== NOT_SET;
	    },

	    hasIn: function(searchKeyPath) {
	      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
	    },

	    isSubset: function(iter) {
	      iter = typeof iter.includes === 'function' ? iter : Iterable(iter);
	      return this.every(function(value ) {return iter.includes(value)});
	    },

	    isSuperset: function(iter) {
	      iter = typeof iter.isSubset === 'function' ? iter : Iterable(iter);
	      return iter.isSubset(this);
	    },

	    keySeq: function() {
	      return this.toSeq().map(keyMapper).toIndexedSeq();
	    },

	    last: function() {
	      return this.toSeq().reverse().first();
	    },

	    max: function(comparator) {
	      return maxFactory(this, comparator);
	    },

	    maxBy: function(mapper, comparator) {
	      return maxFactory(this, comparator, mapper);
	    },

	    min: function(comparator) {
	      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
	    },

	    minBy: function(mapper, comparator) {
	      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
	    },

	    rest: function() {
	      return this.slice(1);
	    },

	    skip: function(amount) {
	      return this.slice(Math.max(0, amount));
	    },

	    skipLast: function(amount) {
	      return reify(this, this.toSeq().reverse().skip(amount).reverse());
	    },

	    skipWhile: function(predicate, context) {
	      return reify(this, skipWhileFactory(this, predicate, context, true));
	    },

	    skipUntil: function(predicate, context) {
	      return this.skipWhile(not(predicate), context);
	    },

	    sortBy: function(mapper, comparator) {
	      return reify(this, sortFactory(this, comparator, mapper));
	    },

	    take: function(amount) {
	      return this.slice(0, Math.max(0, amount));
	    },

	    takeLast: function(amount) {
	      return reify(this, this.toSeq().reverse().take(amount).reverse());
	    },

	    takeWhile: function(predicate, context) {
	      return reify(this, takeWhileFactory(this, predicate, context));
	    },

	    takeUntil: function(predicate, context) {
	      return this.takeWhile(not(predicate), context);
	    },

	    valueSeq: function() {
	      return this.toIndexedSeq();
	    },


	    // ### Hashable Object

	    hashCode: function() {
	      return this.__hash || (this.__hash = hashIterable(this));
	    },


	    // ### Internal

	    // abstract __iterate(fn, reverse)

	    // abstract __iterator(type, reverse)
	  });

	  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
	  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
	  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
	  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

	  var IterablePrototype = Iterable.prototype;
	  IterablePrototype[IS_ITERABLE_SENTINEL] = true;
	  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
	  IterablePrototype.__toJS = IterablePrototype.toArray;
	  IterablePrototype.__toStringMapper = quoteString;
	  IterablePrototype.inspect =
	  IterablePrototype.toSource = function() { return this.toString(); };
	  IterablePrototype.chain = IterablePrototype.flatMap;

	  // Temporary warning about using length
	  (function () {
	    try {
	      Object.defineProperty(IterablePrototype, 'length', {
	        get: function () {
	          if (!Iterable.noLengthWarning) {
	            var stack;
	            try {
	              throw new Error();
	            } catch (error) {
	              stack = error.stack;
	            }
	            if (stack.indexOf('_wrapObject') === -1) {
	              console && console.warn && console.warn(
	                'iterable.length has been deprecated, '+
	                'use iterable.size or iterable.count(). '+
	                'This warning will become a silent error in a future version. ' +
	                stack
	              );
	              return this.size;
	            }
	          }
	        }
	      });
	    } catch (e) {}
	  })();



	  mixin(KeyedIterable, {

	    // ### More sequential methods

	    flip: function() {
	      return reify(this, flipFactory(this));
	    },

	    findKey: function(predicate, context) {
	      var entry = this.findEntry(predicate, context);
	      return entry && entry[0];
	    },

	    findLastKey: function(predicate, context) {
	      return this.toSeq().reverse().findKey(predicate, context);
	    },

	    keyOf: function(searchValue) {
	      return this.findKey(function(value ) {return is(value, searchValue)});
	    },

	    lastKeyOf: function(searchValue) {
	      return this.findLastKey(function(value ) {return is(value, searchValue)});
	    },

	    mapEntries: function(mapper, context) {var this$0 = this;
	      var iterations = 0;
	      return reify(this,
	        this.toSeq().map(
	          function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
	        ).fromEntrySeq()
	      );
	    },

	    mapKeys: function(mapper, context) {var this$0 = this;
	      return reify(this,
	        this.toSeq().flip().map(
	          function(k, v)  {return mapper.call(context, k, v, this$0)}
	        ).flip()
	      );
	    },

	  });

	  var KeyedIterablePrototype = KeyedIterable.prototype;
	  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
	  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
	  KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
	  KeyedIterablePrototype.__toStringMapper = function(v, k)  {return JSON.stringify(k) + ': ' + quoteString(v)};



	  mixin(IndexedIterable, {

	    // ### Conversion to other types

	    toKeyedSeq: function() {
	      return new ToKeyedSequence(this, false);
	    },


	    // ### ES6 Collection methods (ES6 Array and Map)

	    filter: function(predicate, context) {
	      return reify(this, filterFactory(this, predicate, context, false));
	    },

	    findIndex: function(predicate, context) {
	      var entry = this.findEntry(predicate, context);
	      return entry ? entry[0] : -1;
	    },

	    indexOf: function(searchValue) {
	      var key = this.toKeyedSeq().keyOf(searchValue);
	      return key === undefined ? -1 : key;
	    },

	    lastIndexOf: function(searchValue) {
	      return this.toSeq().reverse().indexOf(searchValue);
	    },

	    reverse: function() {
	      return reify(this, reverseFactory(this, false));
	    },

	    slice: function(begin, end) {
	      return reify(this, sliceFactory(this, begin, end, false));
	    },

	    splice: function(index, removeNum /*, ...values*/) {
	      var numArgs = arguments.length;
	      removeNum = Math.max(removeNum | 0, 0);
	      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
	        return this;
	      }
	      index = resolveBegin(index, this.size);
	      var spliced = this.slice(0, index);
	      return reify(
	        this,
	        numArgs === 1 ?
	          spliced :
	          spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
	      );
	    },


	    // ### More collection methods

	    findLastIndex: function(predicate, context) {
	      var key = this.toKeyedSeq().findLastKey(predicate, context);
	      return key === undefined ? -1 : key;
	    },

	    first: function() {
	      return this.get(0);
	    },

	    flatten: function(depth) {
	      return reify(this, flattenFactory(this, depth, false));
	    },

	    get: function(index, notSetValue) {
	      index = wrapIndex(this, index);
	      return (index < 0 || (this.size === Infinity ||
	          (this.size !== undefined && index > this.size))) ?
	        notSetValue :
	        this.find(function(_, key)  {return key === index}, undefined, notSetValue);
	    },

	    has: function(index) {
	      index = wrapIndex(this, index);
	      return index >= 0 && (this.size !== undefined ?
	        this.size === Infinity || index < this.size :
	        this.indexOf(index) !== -1
	      );
	    },

	    interpose: function(separator) {
	      return reify(this, interposeFactory(this, separator));
	    },

	    interleave: function(/*...iterables*/) {
	      var iterables = [this].concat(arrCopy(arguments));
	      var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
	      var interleaved = zipped.flatten(true);
	      if (zipped.size) {
	        interleaved.size = zipped.size * iterables.length;
	      }
	      return reify(this, interleaved);
	    },

	    last: function() {
	      return this.get(-1);
	    },

	    skipWhile: function(predicate, context) {
	      return reify(this, skipWhileFactory(this, predicate, context, false));
	    },

	    zip: function(/*, ...iterables */) {
	      var iterables = [this].concat(arrCopy(arguments));
	      return reify(this, zipWithFactory(this, defaultZipper, iterables));
	    },

	    zipWith: function(zipper/*, ...iterables */) {
	      var iterables = arrCopy(arguments);
	      iterables[0] = this;
	      return reify(this, zipWithFactory(this, zipper, iterables));
	    },

	  });

	  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
	  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



	  mixin(SetIterable, {

	    // ### ES6 Collection methods (ES6 Array and Map)

	    get: function(value, notSetValue) {
	      return this.has(value) ? value : notSetValue;
	    },

	    includes: function(value) {
	      return this.has(value);
	    },


	    // ### More sequential methods

	    keySeq: function() {
	      return this.valueSeq();
	    },

	  });

	  SetIterable.prototype.has = IterablePrototype.includes;


	  // Mixin subclasses

	  mixin(KeyedSeq, KeyedIterable.prototype);
	  mixin(IndexedSeq, IndexedIterable.prototype);
	  mixin(SetSeq, SetIterable.prototype);

	  mixin(KeyedCollection, KeyedIterable.prototype);
	  mixin(IndexedCollection, IndexedIterable.prototype);
	  mixin(SetCollection, SetIterable.prototype);


	  // #pragma Helper functions

	  function keyMapper(v, k) {
	    return k;
	  }

	  function entryMapper(v, k) {
	    return [k, v];
	  }

	  function not(predicate) {
	    return function() {
	      return !predicate.apply(this, arguments);
	    }
	  }

	  function neg(predicate) {
	    return function() {
	      return -predicate.apply(this, arguments);
	    }
	  }

	  function quoteString(value) {
	    return typeof value === 'string' ? JSON.stringify(value) : value;
	  }

	  function defaultZipper() {
	    return arrCopy(arguments);
	  }

	  function defaultNegComparator(a, b) {
	    return a < b ? 1 : a > b ? -1 : 0;
	  }

	  function hashIterable(iterable) {
	    if (iterable.size === Infinity) {
	      return 0;
	    }
	    var ordered = isOrdered(iterable);
	    var keyed = isKeyed(iterable);
	    var h = ordered ? 1 : 0;
	    var size = iterable.__iterate(
	      keyed ?
	        ordered ?
	          function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
	          function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
	        ordered ?
	          function(v ) { h = 31 * h + hash(v) | 0; } :
	          function(v ) { h = h + hash(v) | 0; }
	    );
	    return murmurHashOfSize(size, h);
	  }

	  function murmurHashOfSize(size, h) {
	    h = src_Math__imul(h, 0xCC9E2D51);
	    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593);
	    h = src_Math__imul(h << 13 | h >>> -13, 5);
	    h = (h + 0xE6546B64 | 0) ^ size;
	    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B);
	    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35);
	    h = smi(h ^ h >>> 16);
	    return h;
	  }

	  function hashMerge(a, b) {
	    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
	  }

	  var Immutable = {

	    Iterable: Iterable,

	    Seq: Seq,
	    Collection: Collection,
	    Map: src_Map__Map,
	    OrderedMap: OrderedMap,
	    List: List,
	    Stack: Stack,
	    Set: src_Set__Set,
	    OrderedSet: OrderedSet,

	    Record: Record,
	    Range: Range,
	    Repeat: Repeat,

	    is: is,
	    fromJS: fromJS,

	  };

	  return Immutable;

	}));

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(30),
	    __webpack_require__(28)
	  ], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	    nodeHelpers,
	    Immutable
	  ) {

	  /**
	   * Chrome and Firefox: All elements need to contain either text or a `<br>` to
	   * remain selectable. (Unless they have a width and height explicitly set with
	   * CSS(?), as per: http://jsbin.com/gulob/2/edit?html,css,js,output)
	   */

	  'use strict';

	  // http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
	  var html5VoidElements = Immutable.Set.of('AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR');

	  function parentHasNoTextContent(node) {
	    if (nodeHelpers.isCaretPositionNode(node)) {
	      return true;
	    } else {
	      return node.parentNode.textContent.trim() === '';
	    }
	  }


	  function traverse(parentNode) {
	    // Instead of TreeWalker, which gets confused when the BR is added to the dom,
	    // we recursively traverse the tree to look for an empty node that can have childNodes

	    var node = parentNode.firstElementChild;

	    function isEmpty(node) {

	      if ((node.children.length === 0 && nodeHelpers.isBlockElement(node))
	        || (node.children.length === 1 && nodeHelpers.isSelectionMarkerNode(node.children[0]))) {
	         return true;
	      }

	      // Do not insert BR in empty non block elements with parent containing text
	      if (!nodeHelpers.isBlockElement(node) && node.children.length === 0) {
	        return parentHasNoTextContent(node);
	      }

	      return false;
	    }

	    while (node) {
	      if (!nodeHelpers.isSelectionMarkerNode(node)) {
	        // Find any node that contains no child *elements*, or just contains
	        // whitespace, and is not self-closing
	        if (isEmpty(node) &&
	          node.textContent.trim() === '' &&
	          !html5VoidElements.includes(node.nodeName)) {
	          node.appendChild(document.createElement('br'));
	        } else if (node.children.length > 0) {
	          traverse(node);
	        }
	      }
	      node = node.nextElementSibling;
	    }
	  }

	  return function () {
	    return function (scribe) {

	      scribe.registerHTMLFormatter('normalize', function (html) {
	        var bin = document.createElement('div');
	        bin.innerHTML = html;

	        traverse(bin);

	        return bin.innerHTML;
	      });

	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(31),
	  __webpack_require__(32),
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (inlineElementNames, blockElementNames, Immutable) {

	  'use strict';

	  function isBlockElement(node) {
	    return blockElementNames.includes(node.nodeName);
	  }

	  function isInlineElement(node) {
	    return inlineElementNames.includes(node.nodeName);
	  }

	  // return true if nested inline tags ultimately just contain <br> or ""
	  function isEmptyInlineElement(node) {
	    if( node.children.length > 1 ) return false;
	    if( node.children.length === 1 && node.textContent.trim() !== '' ) return false;
	    if( node.children.length === 0 ) return node.textContent.trim() === '';
	    return isEmptyInlineElement(node.children[0]);
	  }

	  function isText(node) {
	    return node.nodeType === Node.TEXT_NODE;
	  }

	  function isEmptyTextNode(node) {
	    return isText(node) && node.data === '';
	  }

	  function isFragment(node) {
	    return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
	  }

	  function isBefore(node1, node2) {
	    return node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING;
	  }

	  function isSelectionMarkerNode(node) {
	    return (node.nodeType === Node.ELEMENT_NODE && node.className === 'scribe-marker');
	  }

	  function isCaretPositionNode(node) {
	    return (node.nodeType === Node.ELEMENT_NODE && node.className === 'caret-position');
	  }

	  function firstDeepestChild(node) {
	    var fs = node.firstChild;
	    return !fs || fs.nodeName === 'BR' ?
	      node :
	      firstDeepestChild(fs);
	  }

	  function insertAfter(newNode, referenceNode) {
	    return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	  }

	  function removeNode(node) {
	    return node.parentNode.removeChild(node);
	  }

	  function getAncestor(node, rootElement, nodeFilter) {
	    function isTopContainerElement (element) {
	      return rootElement === element;
	    }
	    // TODO: should this happen here?
	    if (isTopContainerElement(node)) {
	      return;
	    }

	    var currentNode = node.parentNode;

	    // If it's a `contenteditable` then it's likely going to be the Scribe
	    // instance, so stop traversing there.
	    while (currentNode && ! isTopContainerElement(currentNode)) {
	      if (nodeFilter(currentNode)) {
	        return currentNode;
	      }
	      currentNode = currentNode.parentNode;
	    }
	  }

	  function nextSiblings(node) {
	    var all = Immutable.List();
	    while (node = node.nextSibling) {
	      all = all.push(node);
	    }
	    return all;
	  }

	  function wrap(nodes, parentNode) {
	    nodes[0].parentNode.insertBefore(parentNode, nodes[0]);
	    nodes.forEach(function (node) {
	      parentNode.appendChild(node);
	    });
	    return parentNode;
	  }

	  function unwrap(node, childNode) {
	    while (childNode.childNodes.length > 0) {
	      node.insertBefore(childNode.childNodes[0], childNode);
	    }
	    node.removeChild(childNode);
	  }

	  /**
	   * Chrome: If a parent node has a CSS `line-height` when we apply the
	   * insertHTML command, Chrome appends a SPAN to plain content with
	   * inline styling replicating that `line-height`, and adjusts the
	   * `line-height` on inline elements.
	   *
	   * As per: http://jsbin.com/ilEmudi/4/edit?css,js,output
	   * More from the web: http://stackoverflow.com/q/15015019/40352
	   */
	  function removeChromeArtifacts(parentElement) {
	    function isInlineWithStyle(parentStyle, element) {
	      return window.getComputedStyle(element).lineHeight === parentStyle.lineHeight;
	    }

	    var nodes = Immutable.List(parentElement.querySelectorAll(inlineElementNames
	      .map(function(elName) { return elName + '[style*="line-height"]' })
	      .join(',')
	      ));
	    nodes = nodes.filter(isInlineWithStyle.bind(null, window.getComputedStyle(parentElement)));

	    var emptySpans = Immutable.List();

	    nodes.forEach(function(node) {
	      node.style.lineHeight = null;
	      if (!node.getAttribute('style')) {
	        node.removeAttribute('style');
	      }
	      if (node.nodeName === 'SPAN' && node.attributes.length === 0) {
	        emptySpans = emptySpans.push(node);
	      }
	    });

	    emptySpans.forEach(function(node) {
	      unwrap(node.parentNode, node);
	    });
	  }

	  return {
	    isInlineElement: isInlineElement,
	    isBlockElement: isBlockElement,
	    isEmptyInlineElement: isEmptyInlineElement,
	    isText: isText,
	    isEmptyTextNode: isEmptyTextNode,
	    isFragment: isFragment,
	    isBefore: isBefore,
	    isSelectionMarkerNode: isSelectionMarkerNode,
	    isCaretPositionNode: isCaretPositionNode,
	    firstDeepestChild: firstDeepestChild,
	    insertAfter: insertAfter,
	    removeNode: removeNode,
	    getAncestor: getAncestor,
	    nextSiblings: nextSiblings,
	    wrap: wrap,
	    unwrap: unwrap,
	    removeChromeArtifacts: removeChromeArtifacts
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (Immutable) {
	  // Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elemente
	  var inlineElementNames = Immutable.Set.of('B', 'BIG', 'I', 'SMALL', 'TT',
	    'ABBR', 'ACRONYM', 'CITE', 'CODE', 'DFN', 'EM', 'KBD', 'STRONG', 'SAMP', 'VAR',
	    'A', 'BDO', 'BR', 'IMG', 'MAP', 'OBJECT', 'Q', 'SCRIPT', 'SPAN', 'SUB', 'SUP',
	    'BUTTON', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA');

	  return inlineElementNames;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(Immutable) {
	  var blockElementNames = Immutable.Set.of('ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'CANVAS', 'DD',
	                           'DIV', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1',
	                           'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'LI',
	                           'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TD',
	                           'TH', 'TFOOT', 'UL', 'VIDEO');

	  return blockElementNames;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  // TODO: abstract
	  function hasContent(rootNode) {
	    var treeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ALL, null, false);

	    while (treeWalker.nextNode()) {
	      if (treeWalker.currentNode) {
	        // If the node is a non-empty element or has content
	        if (~['br'].indexOf(treeWalker.currentNode.nodeName.toLowerCase()) || treeWalker.currentNode.length > 0) {
	          return true;
	        }
	      }
	    }

	    return false;
	  }

	  return function () {
	    return function (scribe) {
	      /**
	       * Firefox has a `insertBrOnReturn` command, but this is not a part of
	       * any standard. One day we might have an `insertLineBreak` command,
	       * proposed by this spec:
	       * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#the-insertlinebreak-command
	       * As per: http://jsbin.com/IQUraXA/1/edit?html,js,output
	       */
	      scribe.el.addEventListener('keydown', function (event) {
	        if (event.keyCode === 13) { // enter
	          var selection = new scribe.api.Selection();
	          var range = selection.range;

	          var blockNode = selection.getContaining(function (node) {
	            return node.nodeName === 'LI' || (/^(H[1-6])$/).test(node.nodeName);
	          });

	          if (! blockNode) {
	            event.preventDefault();

	            scribe.transactionManager.run(function () {
	              /**
	               * Firefox: Delete the bogus BR as we insert another one later.
	               * We have to do this because otherwise the browser will believe
	               * there is content to the right of the selection.
	               */
	              if (scribe.el.lastChild.nodeName === 'BR') {
	                scribe.el.removeChild(scribe.el.lastChild);
	              }

	              var brNode = document.createElement('br');

	              range.insertNode(brNode);
	              // After inserting the BR into the range is no longer collapsed, so
	              // we have to collapse it again.
	              // TODO: Older versions of Firefox require this argument even though
	              // it is supposed to be optional. Proxy/polyfill?
	              range.collapse(false);

	              /**
	               * Chrome: If there is no right-hand side content, inserting a BR
	               * will not appear to create a line break.
	               * Firefox: If there is no right-hand side content, inserting a BR
	               * will appear to create a weird "half-line break".
	               *
	               * Possible solution: Insert two BRs.
	               * ✓ Chrome: Inserting two BRs appears to create a line break.
	               * Typing will then delete the bogus BR element.
	               * Firefox: Inserting two BRs will create two line breaks.
	               *
	               * Solution: Only insert two BRs if there is no right-hand
	               * side content.
	               *
	               * If the user types on a line immediately after a BR element,
	               * Chrome will replace the BR element with the typed characters,
	               * whereas Firefox will not. Thus, to satisfy Firefox we have to
	               * insert a bogus BR element on initialization (see below).
	               */

	              var contentToEndRange = range.cloneRange();
	              contentToEndRange.setEndAfter(scribe.el.lastChild, 0);

	              // Get the content from the range to the end of the heading
	              var contentToEndFragment = contentToEndRange.cloneContents();

	              // If there is not already a right hand side content we need to
	              // insert a bogus BR element.
	              if (! hasContent(contentToEndFragment)) {
	                var bogusBrNode = document.createElement('br');
	                range.insertNode(bogusBrNode);
	              }

	              var newRange = range.cloneRange();

	              newRange.setStartAfter(brNode, 0);
	              newRange.setEndAfter(brNode, 0);

	              selection.selection.removeAllRanges();
	              selection.selection.addRange(newRange);
	            });
	          }
	        }
	      }.bind(this));

	      if (scribe.getHTML().trim() === '') {
	        // Bogus BR element for Firefox — see explanation above.
	        // TODO: also append when consumer sets the content manually.
	        // TODO: hide when the user calls `getHTML`?
	        scribe.setContent('');
	      }
	    };
	  };
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(35),
	  __webpack_require__(36)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  replaceNbspCharsFormatter,
	  escapeHtmlCharactersFormatter
	) {
	  'use strict';

	  return {
	    replaceNbspCharsFormatter: replaceNbspCharsFormatter,
	    escapeHtmlCharactersFormatter: escapeHtmlCharactersFormatter
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * Chrome:
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nbspCharRegExp = /(\s|&nbsp;)+/g;

	      // TODO: should we be doing this on paste?
	      scribe.registerHTMLFormatter('export', function (html) {
	        return html.replace(nbspCharRegExp, ' ');
	      });
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(37)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  escape
	) {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      scribe.registerPlainTextFormatter(escape);
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(10), __webpack_require__(38)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseToString, escapeHtmlChar) {

	  /** Used to match HTML entities and HTML characters. */
	  var reUnescapedHtml = /[&<>"'`]/g,
	      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

	  /**
	   * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
	   * their corresponding HTML entities.
	   *
	   * **Note:** No other characters are escaped. To escape additional characters
	   * use a third-party library like [_he_](https://mths.be/he).
	   *
	   * Though the ">" character is escaped for symmetry, characters like
	   * ">" and "/" don't require escaping in HTML and have no special meaning
	   * unless they're part of a tag or unquoted attribute value.
	   * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
	   * (under "semi-related fun fact") for more details.
	   *
	   * Backticks are escaped because in Internet Explorer < 9, they can break out
	   * of attribute values or HTML comments. See [#102](https://html5sec.org/#102),
	   * [#108](https://html5sec.org/#108), and [#133](https://html5sec.org/#133) of
	   * the [HTML5 Security Cheatsheet](https://html5sec.org/) for more details.
	   *
	   * When working with HTML you should always quote attribute values to reduce
	   * XSS vectors. See [Ryan Grove's article](http://wonko.com/post/html-escaping)
	   * for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category String
	   * @param {string} [string=''] The string to escape.
	   * @returns {string} Returns the escaped string.
	   * @example
	   *
	   * _.escape('fred, barney, & pebbles');
	   * // => 'fred, barney, &amp; pebbles'
	   */
	  function escape(string) {
	    // Reset `lastIndex` because in IE < 9 `String#replace` does not.
	    string = baseToString(string);
	    return (string && reHasUnescapedHtml.test(string))
	      ? string.replace(reUnescapedHtml, escapeHtmlChar)
	      : string;
	  }

	  return escape;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /** Used to map characters to HTML entities. */
	  var htmlEscapes = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;',
	    '`': '&#96;'
	  };

	  /**
	   * Used by `_.escape` to convert characters to HTML entities.
	   *
	   * @private
	   * @param {string} chr The matched character to escape.
	   * @returns {string} Returns the escaped character.
	   */
	  function escapeHtmlChar(chr) {
	    return htmlEscapes[chr];
	  }

	  return escapeHtmlChar;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(40),
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  observeDomChanges,
	  Immutable
	) {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nodeHelpers = scribe.node;

	      /**
	       * Firefox: Giving focus to a `contenteditable` will place the caret
	       * outside of any block elements. Chrome behaves correctly by placing the
	       * caret at the  earliest point possible inside the first block element.
	       * As per: http://jsbin.com/eLoFOku/1/edit?js,console,output
	       *
	       * We detect when this occurs and fix it by placing the caret ourselves.
	       */
	      scribe.el.addEventListener('focus', function placeCaretOnFocus() {
	        var selection = new scribe.api.Selection();
	        // In Chrome, the range is not created on or before this event loop.
	        // It doesn’t matter because this is a fix for Firefox.
	        if (selection.range) {

	          var isFirefoxBug = scribe.allowsBlockElements() &&
	                  selection.range.startContainer === scribe.el;

	          if (isFirefoxBug) {
	            var focusElement = nodeHelpers.firstDeepestChild(scribe.el);

	            var range = selection.range;

	            range.setStart(focusElement, 0);
	            range.setEnd(focusElement, 0);

	            selection.selection.removeAllRanges();
	            selection.selection.addRange(range);
	          }
	        }
	      }.bind(scribe));

	      /**
	       * Apply the formatters when there is a DOM mutation.
	       */
	      var applyFormatters = function() {
	        if (!scribe._skipFormatters) {
	          var selection = new scribe.api.Selection();
	          var isEditorActive = selection.range;

	          var runFormatters = function () {
	            if (isEditorActive) {
	              selection.placeMarkers();
	            }
	            scribe.setHTML(scribe._htmlFormatterFactory.format(scribe.getHTML()));
	            selection.selectMarkers();
	          }.bind(scribe);

	          // We only want to wrap the formatting in a transaction if the editor is
	          // active. If the DOM is mutated when the editor isn't active (e.g.
	          // `scribe.setContent`), we do not want to push to the history. (This
	          // happens on the first `focus` event).

	          // The previous check is no longer needed, and the above comments are no longer valid.
	          // Now `scribe.setContent` updates the content manually, and `scribe.pushHistory`
	          // will not detect any changes, and nothing will be push into the history.
	          // Any mutations made without `scribe.getContent` will be pushed into the history normally.

	          // Pass content through formatters, place caret back
	          scribe.transactionManager.run(runFormatters);
	        }

	        delete scribe._skipFormatters;
	      }.bind(scribe);

	      observeDomChanges(scribe.el, applyFormatters);

	      // TODO: disconnect on tear down:
	      // observer.disconnect();

	      /**
	       * If the paragraphs option is set to true, we need to manually handle
	       * keyboard navigation inside a heading to ensure a P element is created.
	       */
	      if (scribe.allowsBlockElements()) {
	        scribe.el.addEventListener('keydown', function (event) {
	          if (event.keyCode === 13) { // enter

	            var selection = new scribe.api.Selection();
	            var range = selection.range;

	            var headingNode = selection.getContaining(function (node) {
	              return (/^(H[1-6])$/).test(node.nodeName);
	            });

	            /**
	             * If we are at the end of the heading, insert a P. Otherwise handle
	             * natively.
	             */
	            if (headingNode && range.collapsed) {
	              var contentToEndRange = range.cloneRange();
	              contentToEndRange.setEndAfter(headingNode, 0);

	              // Get the content from the range to the end of the heading
	              var contentToEndFragment = contentToEndRange.cloneContents();

	              if (contentToEndFragment.firstChild.textContent === '') {
	                event.preventDefault();

	                scribe.transactionManager.run(function () {
	                  // Default P
	                  // TODO: Abstract somewhere
	                  var pNode = document.createElement('p');
	                  var brNode = document.createElement('br');
	                  pNode.appendChild(brNode);

	                  headingNode.parentNode.insertBefore(pNode, headingNode.nextElementSibling);

	                  // Re-apply range
	                  range.setStart(pNode, 0);
	                  range.setEnd(pNode, 0);

	                  selection.selection.removeAllRanges();
	                  selection.selection.addRange(range);
	                });
	              }
	            }
	          }
	        });
	      }

	      /**
	       * If the paragraphs option is set to true, we need to manually handle
	       * keyboard navigation inside list item nodes.
	       */
	      if (scribe.allowsBlockElements()) {
	        scribe.el.addEventListener('keydown', function (event) {
	          if (event.keyCode === 13 || event.keyCode === 8) { // enter || backspace

	            var selection = new scribe.api.Selection();
	            var range = selection.range;

	            if (range.collapsed) {
	              var containerLIElement = selection.getContaining(function (node) {
	                return node.nodeName === 'LI';
	              });
	              if (containerLIElement && containerLIElement.textContent.trim() === '') {
	                /**
	                 * LIs
	                 */

	                event.preventDefault();

	                var listNode = selection.getContaining(function (node) {
	                  return node.nodeName === 'UL' || node.nodeName === 'OL';
	                });

	                var command = scribe.getCommand(listNode.nodeName === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');

	                command.execute();
	              }
	            }
	          }
	        });
	      }

	      /**
	       * We have to hijack the paste event to ensure it uses
	       * `scribe.insertHTML`, which executes the Scribe version of the command
	       * and also runs the formatters.
	       */

	      /**
	       * TODO: could we implement this as a polyfill for `event.clipboardData` instead?
	       * I also don't like how it has the authority to perform `event.preventDefault`.
	       */

	      scribe.el.addEventListener('paste', function handlePaste(event) {
	        /**
	         * Browsers without the Clipboard API (specifically `ClipboardEvent.clipboardData`)
	         * will execute the second branch here.
	         */
	        if (event.clipboardData) {
	          event.preventDefault();

	          if (Immutable.List(event.clipboardData.types).includes('text/html')) {
	            scribe.insertHTML(event.clipboardData.getData('text/html'));
	          } else {
	            scribe.insertPlainText(event.clipboardData.getData('text/plain'));
	          }
	        } else {
	          /**
	           * If the browser doesn't have `ClipboardEvent.clipboardData`, we run through a
	           * sequence of events:
	           *
	           *   - Save the text selection
	           *   - Focus another, hidden textarea so we paste there
	           *   - Copy the pasted content of said textarea
	           *   - Give focus back to the scribe
	           *   - Restore the text selection
	           *
	           * This is required because, without access to the Clipboard API, there is literally
	           * no other way to manipulate content on paste.
	           * As per: https://github.com/jejacks0n/mercury/issues/23#issuecomment-2308347
	           *
	           * Firefox <= 21
	           * https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent.clipboardData
	           */

	          var selection = new scribe.api.Selection();

	          // Store the caret position
	          selection.placeMarkers();

	          var bin = document.createElement('div');
	          document.body.appendChild(bin);
	          bin.setAttribute('contenteditable', true);
	          bin.focus();

	          // Wait for the paste to happen (next loop?)
	          setTimeout(function () {
	            var data = bin.innerHTML;
	            bin.parentNode.removeChild(bin);

	            // Restore the caret position
	            selection.selectMarkers();
	            /**
	             * Firefox 19 (and maybe others): even though the applied range
	             * exists within the Scribe instance, we need to focus it.
	             */
	            scribe.el.focus();

	            scribe.insertHTML(data);
	          }, 1);
	        }
	      });

	    };
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(30)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (nodeHelpers) {

	  var MutationObserver = window.MutationObserver ||
	    window.WebKitMutationObserver ||
	    window.MozMutationObserver;

	  function hasRealMutation(n) {
	    return ! nodeHelpers.isEmptyTextNode(n) &&
	      ! nodeHelpers.isSelectionMarkerNode(n);
	  }

	  function includeRealMutations(mutations) {
	    return mutations.some(function(mutation) {
	      return Array.prototype.some.call(mutation.addedNodes, hasRealMutation) ||
	        Array.prototype.some.call(mutation.removedNodes, hasRealMutation);
	    });
	  }

	  function observeDomChanges(el, callback) {
	    // Flag to avoid running recursively
	    var runningPostMutation = false;

	    var observer = new MutationObserver(function(mutations) {
	      if (! runningPostMutation && includeRealMutations(mutations)) {
	        runningPostMutation = true;

	        try {
	          callback();
	        } catch(e) {
	          // The catch block is required but we don't want to swallow the error
	          throw e;
	        } finally {
	          // We must yield to let any mutation we caused be triggered
	          // in the next cycle
	          setTimeout(function() {
	            runningPostMutation = false;
	          }, 0);
	        }
	      }
	    });

	    observer.observe(el, {
	      childList: true,
	      subtree: true
	    });

	    return observer;
	  }

	  return observeDomChanges;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(42),
	  __webpack_require__(43),
	  __webpack_require__(44),
	  __webpack_require__(45),
	  __webpack_require__(46),
	  __webpack_require__(47),
	  __webpack_require__(48)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  boldCommand,
	  indentCommand,
	  insertHTMLCommand,
	  insertListCommands,
	  outdentCommand,
	  createLinkCommand,
	  events
	) {

	  /**
	   * Command patches browser inconsistencies. They do not perform core features
	   * of the editor, such as ensuring P elements are created when
	   * applying/unapplying commands — that is the job of the core commands.
	   */

	  'use strict';

	  return {
	    commands: {
	      bold: boldCommand,
	      indent: indentCommand,
	      insertHTML: insertHTMLCommand,
	      insertList: insertListCommands,
	      outdent: outdentCommand,
	      createLink: createLinkCommand,
	    },
	    events: events
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var boldCommand = new scribe.api.CommandPatch('bold');

	      /**
	       * Chrome: Executing the bold command inside a heading corrupts the markup.
	       * Disabling for now.
	       */
	      boldCommand.queryEnabled = function () {
	        var selection = new scribe.api.Selection();
	        var headingNode = selection.getContaining(function (node) {
	          return (/^(H[1-6])$/).test(node.nodeName);
	        });

	        return scribe.api.CommandPatch.prototype.queryEnabled.apply(this, arguments) && ! headingNode;
	      };

	      // TODO: We can't use STRONGs because this would mean we have to
	      // re-implement the `queryState` command, which would be difficult.

	      scribe.commandPatches.bold = boldCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * Prevent Chrome from inserting BLOCKQUOTEs inside of Ps, and also from
	   * adding a redundant `style` attribute to the created BLOCKQUOTE.
	   */

	  'use strict';

	  var INVISIBLE_CHAR = '\uFEFF';

	  return function () {
	    return function (scribe) {
	      var indentCommand = new scribe.api.CommandPatch('indent');

	      indentCommand.execute = function (value) {
	        scribe.transactionManager.run(function () {
	          /**
	           * Chrome: If we apply the indent command on an empty P, the
	           * BLOCKQUOTE will be nested inside the P.
	           * As per: http://jsbin.com/oDOriyU/3/edit?html,js,output
	           */
	          var selection = new scribe.api.Selection();
	          var range = selection.range;

	          var isCaretOnNewLine =
	              (range.commonAncestorContainer.nodeName === 'P'
	               && range.commonAncestorContainer.innerHTML === '<br>');
	          if (isCaretOnNewLine) {
	            // FIXME: this text node is left behind. Tidy it up somehow,
	            // or don't use it at all.
	            var textNode = document.createTextNode(INVISIBLE_CHAR);

	            range.insertNode(textNode);

	            range.setStart(textNode, 0);
	            range.setEnd(textNode, 0);

	            selection.selection.removeAllRanges();
	            selection.selection.addRange(range);
	          }

	          scribe.api.CommandPatch.prototype.execute.call(this, value);

	          /**
	           * Chrome: The BLOCKQUOTE created contains a redundant style attribute.
	           * As per: http://jsbin.com/AkasOzu/1/edit?html,js,output
	           */

	          // Renew the selection
	          selection = new scribe.api.Selection();
	          var blockquoteNode = selection.getContaining(function (node) {
	            return node.nodeName === 'BLOCKQUOTE';
	          });

	          if (blockquoteNode) {
	            blockquoteNode.removeAttribute('style');
	          }
	        }.bind(this));
	      };

	      scribe.commandPatches.indent = indentCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  "use strict";
	  return function () {
	    return function (scribe) {
	      var insertHTMLCommandPatch = new scribe.api.CommandPatch('insertHTML');
	      var nodeHelpers = scribe.node;

	      insertHTMLCommandPatch.execute = function (value) {
	        scribe.transactionManager.run(function () {
	          scribe.api.CommandPatch.prototype.execute.call(this, value);
	          nodeHelpers.removeChromeArtifacts(scribe.el);
	        }.bind(this));
	      };

	      scribe.commandPatches.insertHTML = insertHTMLCommandPatch;
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nodeHelpers = scribe.node;

	      var InsertListCommandPatch = function (commandName) {
	        scribe.api.CommandPatch.call(this, commandName);
	      };

	      InsertListCommandPatch.prototype = Object.create(scribe.api.CommandPatch.prototype);
	      InsertListCommandPatch.prototype.constructor = InsertListCommandPatch;

	      InsertListCommandPatch.prototype.execute = function (value) {
	        scribe.transactionManager.run(function () {
	          scribe.api.CommandPatch.prototype.execute.call(this, value);

	          if (this.queryState()) {
	            var selection = new scribe.api.Selection();

	            var listElement = selection.getContaining(function (node) {
	              return node.nodeName === 'OL' || node.nodeName === 'UL';
	            });

	            /**
	             * Firefox: If we apply the insertOrderedList or the insertUnorderedList
	             * command on an empty block, a P will be inserted after the OL/UL.
	             * As per: http://jsbin.com/cubacoli/3/edit?html,js,output
	             */

	            if (listElement.nextElementSibling &&
	                listElement.nextElementSibling.childNodes.length === 0) {
	              nodeHelpers.removeNode(listElement.nextElementSibling);
	            }

	            /**
	             * Chrome: If we apply the insertOrderedList or the insertUnorderedList
	             * command on an empty block, the OL/UL will be nested inside the block.
	             * As per: http://jsbin.com/eFiRedUc/1/edit?html,js,output
	             */

	            if (listElement) {
	              var listParentNode = listElement.parentNode;
	              // If list is within a text block then split that block
	              if (listParentNode && /^(H[1-6]|P)$/.test(listParentNode.nodeName)) {
	                selection.placeMarkers();
	                // Move listElement out of the block
	                nodeHelpers.insertAfter(listElement, listParentNode);
	                selection.selectMarkers();

	                /**
	                 * Chrome 27-34: An empty text node is inserted.
	                 */
	                if (listParentNode.childNodes.length === 2 &&
	                    nodeHelpers.isEmptyTextNode(listParentNode.firstChild)) {
	                  nodeHelpers.removeNode(listParentNode);
	                }

	                // Remove the block if it's empty
	                if (listParentNode.childNodes.length === 0) {
	                  nodeHelpers.removeNode(listParentNode);
	                }
	              }
	            }

	            nodeHelpers.removeChromeArtifacts(listElement);
	          }
	        }.bind(this));
	      };

	      InsertListCommandPatch.prototype.queryState = function() {
	        try {
	          return scribe.api.CommandPatch.prototype.queryState.apply(this, arguments);
	        } catch (err) {
	          // Explicitly catch unexpected error when calling queryState - bug in Firefox: https://github.com/guardian/scribe/issues/208
	          if (err.name == 'NS_ERROR_UNEXPECTED') {
	            return false;
	          } else {
	            throw err;
	          }
	        }
	      };

	      scribe.commandPatches.insertOrderedList = new InsertListCommandPatch('insertOrderedList');
	      scribe.commandPatches.insertUnorderedList = new InsertListCommandPatch('insertUnorderedList');
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * Prevent Chrome from removing formatting of BLOCKQUOTE contents.
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nodeHelpers = scribe.node;
	      var outdentCommand = new scribe.api.CommandPatch('outdent');

	      outdentCommand.execute = function () {
	        scribe.transactionManager.run(function () {
	          var selection = new scribe.api.Selection();
	          var range = selection.range;

	          var blockquoteNode = selection.getContaining(function (node) {
	            return node.nodeName === 'BLOCKQUOTE';
	          });

	          if (range.commonAncestorContainer.nodeName === 'BLOCKQUOTE') {
	            /**
	             * Chrome: Applying the outdent command when a whole BLOCKQUOTE is
	             * selected removes the formatting of its contents.
	             * As per: http://jsbin.com/okAYaHa/1/edit?html,js,output
	             */

	            // Insert a copy of the selection before the BLOCKQUOTE, and then
	            // restore the selection on the copy.
	            selection.placeMarkers();
	            // We want to copy the selected nodes *with* the markers
	            selection.selectMarkers(true);
	            var selectedNodes = range.cloneContents();
	            blockquoteNode.parentNode.insertBefore(selectedNodes, blockquoteNode);
	            range.deleteContents();
	            selection.selectMarkers();

	            // Delete the BLOCKQUOTE if it's empty
	            if (blockquoteNode.textContent === '') {
	              blockquoteNode.parentNode.removeChild(blockquoteNode);
	            }
	          } else {
	            /**
	             * Chrome: If we apply the outdent command on a P, the contents of the
	             * P will be outdented instead of the whole P element.
	             * As per: http://jsbin.com/IfaRaFO/1/edit?html,js,output
	             */

	            var pNode = selection.getContaining(function (node) {
	              return node.nodeName === 'P';
	            });

	            if (pNode) {
	              /**
	               * If we are not at the start of end of a BLOCKQUOTE, we have to
	               * split the node and insert the P in the middle.
	               */

	              var nextSiblingNodes = nodeHelpers.nextSiblings(pNode);

	              if (!!nextSiblingNodes.size) {
	                var newContainerNode = document.createElement(blockquoteNode.nodeName);

	                while (!!nextSiblingNodes.size) {
	                  newContainerNode.appendChild(nextSiblingNodes.first());
	                  nextSiblingNodes = nextSiblingNodes.shift();
	                }

	                blockquoteNode.parentNode.insertBefore(newContainerNode, blockquoteNode.nextElementSibling);
	              }

	              selection.placeMarkers();
	              blockquoteNode.parentNode.insertBefore(pNode, blockquoteNode.nextElementSibling);
	              selection.selectMarkers();

	              // If the BLOCKQUOTE is now empty, clean it up.
	              if (blockquoteNode.innerHTML === '') {
	                blockquoteNode.parentNode.removeChild(blockquoteNode);
	              }
	            } else {
	              scribe.api.CommandPatch.prototype.execute.call(this);
	            }
	          }
	        }.bind(this));
	      };

	      scribe.commandPatches.outdent = outdentCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var createLinkCommand = new scribe.api.CommandPatch('createLink');
	      scribe.commandPatches.createLink = createLinkCommand;

	      createLinkCommand.execute = function (value) {
	        var selection = new scribe.api.Selection();

	        /**
	         * Firefox does not create a link when selection is collapsed
	         * so we create it manually. http://jsbin.com/tutufi/2/edit?js,output
	         */
	        // using range.collapsed vs selection.isCollapsed - https://code.google.com/p/chromium/issues/detail?id=447523
	        if (selection.range.collapsed) {
	          var aElement = document.createElement('a');
	          aElement.setAttribute('href', value);
	          aElement.textContent = value;

	          selection.range.insertNode(aElement);

	          // Select the created link
	          var newRange = document.createRange();
	          newRange.setStartBefore(aElement);
	          newRange.setEndAfter(aElement);

	          selection.selection.removeAllRanges();
	          selection.selection.addRange(newRange);
	        } else {
	          scribe.api.CommandPatch.prototype.execute.call(this, value);
	        }
	      };
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      // TODO: do we need to run this on every key press, or could we
	      //       detect when the issue may have occurred?
	      // TODO: run in a transaction so as to record the change? how do
	      //       we know in advance whether there will be a change though?
	      // TODO: share somehow with `InsertList` command

	      var nodeHelpers = scribe.node;

	      if (scribe.allowsBlockElements()) {
	        scribe.el.addEventListener('keyup', function (event) {
	          if (event.keyCode === 8 || event.keyCode === 46) { // backspace or delete

	            var selection = new scribe.api.Selection();

	            // Note: the range is always collapsed on keyup here
	            var containerPElement = selection.getContaining(function (node) {
	              return node.nodeName === 'P';
	            });
	            if (containerPElement) {
	              /**
	               * The 'input' event listener has already triggered
	               * and recorded the faulty content as an item in the
	               * UndoManager. We interfere with the undoManager
	               * by force merging that transaction with the next
	               * transaction which produce a clean one instead.
	               *
	               * FIXME: ideally we would not trigger a
	               * 'content-changed' event with faulty HTML at all, but
	               * it's too late to cancel it at this stage (and it's
	               * not happened yet at keydown time).
	               */

	              scribe.transactionManager.run(function () {
	                // Store the caret position
	                selection.placeMarkers();
	                nodeHelpers.removeChromeArtifacts(containerPElement);
	                selection.selectMarkers();
	              }, true);
	            }
	          }
	        });
	      }
	    };
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(50),
	  __webpack_require__(51),
	  __webpack_require__(52),
	  __webpack_require__(53)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  buildCommandPatch,
	  buildCommand,
	  buildSelection,
	  buildSimpleCommand
	) {

	  'use strict';

	  return function Api(scribe) {
	    this.CommandPatch = buildCommandPatch(scribe);
	    this.Command = buildCommand(scribe);
	    this.Selection = buildSelection(scribe);
	    this.SimpleCommand = buildSimpleCommand(this, scribe);
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function (scribe) {
	    function CommandPatch(commandName) {
	      this.commandName = commandName;
	    }

	    CommandPatch.prototype.execute = function (value) {
	      scribe.transactionManager.run(function () {
	        document.execCommand(this.commandName, false, value || null);
	      }.bind(this));
	    };

	    CommandPatch.prototype.queryState = function () {
	      return document.queryCommandState(this.commandName);
	    };

	    CommandPatch.prototype.queryEnabled = function () {
	      return document.queryCommandEnabled(this.commandName);
	    };

	    return CommandPatch;
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function (scribe) {
	    function Command(commandName) {
	      this.commandName = commandName;
	      this.patch = scribe.commandPatches[this.commandName];
	    }

	    Command.prototype.execute = function (value) {
	      if (this.patch) {
	        this.patch.execute(value);
	      } else {
	        scribe.transactionManager.run(function () {
	          document.execCommand(this.commandName, false, value || null);
	        }.bind(this));
	      }
	    };

	    Command.prototype.queryState = function () {
	      if (this.patch) {
	        return this.patch.queryState();
	      } else {
	        return document.queryCommandState(this.commandName);
	      }
	    };

	    Command.prototype.queryEnabled = function () {
	      if (this.patch) {
	        return this.patch.queryEnabled();
	      } else {
	        return document.queryCommandEnabled(this.commandName);
	      }
	    };

	    return Command;
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function (scribe) {
	    var rootDoc = scribe.el.ownerDocument;
	    var nodeHelpers = scribe.node;

	    // find the parent document or document fragment
	    if( rootDoc.compareDocumentPosition(scribe.el) & Node.DOCUMENT_POSITION_DISCONNECTED ) {
	      var currentElement = scribe.el.parentNode;
	      while(currentElement && nodeHelpers.isFragment(currentElement)) {
	        currentElement = currentElement.parentNode;
	      }

	      // if we found a document fragment and it has a getSelection method, set it to the root doc
	      if (currentElement && currentElement.getSelection) {
	        rootDoc = currentElement;
	      }
	    }

	    function createMarker() {
	      var node = document.createElement('em');
	      node.style.display = 'none';
	      node.classList.add('scribe-marker');
	      return node;
	    }

	    function insertMarker(range, marker) {
	      range.insertNode(marker);

	      /**
	       * Chrome and Firefox: `Range.insertNode` inserts a bogus text node after
	       * the inserted element. We just remove it. This in turn creates several
	       * bugs when perfoming commands on selections that contain an empty text
	       * node (`removeFormat`, `unlink`).
	       * As per: http://jsbin.com/hajim/5/edit?js,console,output
	       */
	      if (marker.nextSibling && nodeHelpers.isEmptyTextNode(marker.nextSibling)) {
	        nodeHelpers.removeNode(marker.nextSibling);
	      }

	      /**
	       * Chrome and Firefox: `Range.insertNode` inserts a bogus text node before
	       * the inserted element when the child element is at the start of a block
	       * element. We just remove it.
	       * FIXME: Document why we need to remove this
	       * As per: http://jsbin.com/sifez/1/edit?js,console,output
	       */
	      if (marker.previousSibling && nodeHelpers.isEmptyTextNode(marker.previousSibling)) {
	        nodeHelpers.removeNode(marker.previousSibling);
	      }
	    }

	    /**
	     * Wrapper for object holding currently selected text.
	     */
	    function Selection() {
	      this.selection = rootDoc.getSelection();
	      if (this.selection.rangeCount && this.selection.anchorNode) {
	        var startNode   = this.selection.anchorNode;
	        var startOffset = this.selection.anchorOffset;
	        var endNode     = this.selection.focusNode;
	        var endOffset   = this.selection.focusOffset;

	        // if the range starts and ends on the same node, then we must swap the
	        // offsets if ever focusOffset is smaller than anchorOffset
	        if (startNode === endNode && endOffset < startOffset) {
	          var tmp = startOffset;
	          startOffset = endOffset;
	          endOffset = tmp;
	        }
	        // if the range ends *before* it starts, then we must reverse the range
	        else if (nodeHelpers.isBefore(endNode, startNode)) {
	          var tmpNode = startNode,
	            tmpOffset = startOffset;
	          startNode = endNode;
	          startOffset = endOffset;
	          endNode = tmpNode;
	          endOffset = tmpOffset;
	        }

	        // create the range to avoid chrome bug from getRangeAt / window.getSelection()
	        // https://code.google.com/p/chromium/issues/detail?id=380690
	        this.range = document.createRange();
	        this.range.setStart(startNode, startOffset);
	        this.range.setEnd(endNode, endOffset);
	      }
	    }

	    /**
	     * @returns Closest ancestor Node satisfying nodeFilter. Undefined if none exist before reaching Scribe container.
	     */
	    Selection.prototype.getContaining = function (nodeFilter) {
	      var range = this.range;
	      if (!range) { return; }

	      var node = this.range.commonAncestorContainer;
	      return ! (node && scribe.el === node) && nodeFilter(node) ?
	        node :
	        nodeHelpers.getAncestor(node, scribe.el, nodeFilter);
	    };

	    Selection.prototype.placeMarkers = function () {
	      var range = this.range;
	      if (!range) {
	        return;
	      }

	      //we need to ensure that the scribe's element lives within the current document to avoid errors with the range comparison (see below)
	      //one way to do this is to check if it's visible (is this the best way?).
	      if (!document.contains(scribe.el)) {
	        return;
	      }

	      //we want to ensure that the current selection is within the current scribe node
	      //if this isn't true scribe will place markers within the selections parent
	      //we want to ensure that scribe ONLY places markers within it's own element
	      if (scribe.el.contains(range.startContainer) && scribe.el.contains(range.endContainer)) {
	        // insert start marker
	        insertMarker(range.cloneRange(), createMarker());

	        if (! range.collapsed ) {
	          // End marker
	          var rangeEnd = range.cloneRange();
	          rangeEnd.collapse(false);
	          insertMarker(rangeEnd, createMarker());
	        }

	        this.selection.removeAllRanges();
	        this.selection.addRange(range);
	      }
	    };

	    Selection.prototype.getMarkers = function () {
	      return scribe.el.querySelectorAll('em.scribe-marker');
	    };

	    Selection.prototype.removeMarkers = function () {
	      Array.prototype.forEach.call(this.getMarkers(), function (marker) {
	        var markerParent = marker.parentNode;
	        nodeHelpers.removeNode(marker);
	        // Placing the markers may have split a text node. Sew it up, otherwise
	        // if the user presses space between the nodes the browser will insert
	        // an `&nbsp;` and that will cause word wrapping issues.
	        markerParent.normalize();
	      });
	    };

	    // This will select markers if there are any. You will need to focus the
	    // Scribe instance’s element if it is not already for the selection to
	    // become active.
	    Selection.prototype.selectMarkers = function (keepMarkers) {
	      var markers = this.getMarkers();
	      if (!markers.length) {
	        return;
	      }

	      var newRange = document.createRange();

	      newRange.setStartBefore(markers[0]);
	      // We always reset the end marker because otherwise it will just
	      // use the current range’s end marker.
	      newRange.setEndAfter(markers.length >= 2 ? markers[1] : markers[0]);

	      if (! keepMarkers) {
	        this.removeMarkers();
	      }

	      this.selection.removeAllRanges();
	      this.selection.addRange(newRange);
	    };

	    Selection.prototype.isCaretOnNewLine = function () {
	      var containerPElement = this.getContaining(function (node) {
	        return node.nodeName === 'P';
	      });
	      return !! containerPElement && nodeHelpers.isEmptyInlineElement(containerPElement);
	    };

	    return Selection;
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function (api, scribe) {
	    function SimpleCommand(commandName, nodeName) {
	      scribe.api.Command.call(this, commandName);

	      this._nodeName = nodeName;
	    }

	    SimpleCommand.prototype = Object.create(api.Command.prototype);
	    SimpleCommand.prototype.constructor = SimpleCommand;

	    SimpleCommand.prototype.queryState = function () {
	      var selection = new scribe.api.Selection();
	      return scribe.api.Command.prototype.queryState.call(this) && !! selection.getContaining(function (node) {
	        return node.nodeName === this._nodeName;
	      }.bind(this));
	    };

	    return SimpleCommand;
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(55),
	  __webpack_require__(56),
	  __webpack_require__(57),
	  __webpack_require__(58),
	  __webpack_require__(59),
	  __webpack_require__(60),
	  __webpack_require__(61)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  indent,
	  insertList,
	  outdent,
	  redo,
	  subscript,
	  superscript,
	  undo
	) {

	  'use strict';

	  return {
	    indent: indent,
	    insertList: insertList,
	    outdent: outdent,
	    redo: redo,
	    subscript: subscript,
	    superscript: superscript,
	    undo: undo
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var indentCommand = new scribe.api.Command('indent');

	      indentCommand.queryEnabled = function () {
	        /**
	         * FIXME: Chrome nests ULs inside of ULs
	         * Currently we just disable the command when the selection is inside of
	         * a list.
	         * As per: http://jsbin.com/ORikUPa/3/edit?html,js,output
	         */
	        var selection = new scribe.api.Selection();
	        var listElement = selection.getContaining(function (element) {
	          return element.nodeName === 'UL' || element.nodeName === 'OL';
	        });

	        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements() && ! listElement;
	      };

	      scribe.commands.indent = indentCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (Immutable) {

	  /**
	   * If the paragraphs option is set to true, then when the list is
	   * unapplied, ensure that we enter a P element.
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var nodeHelpers = scribe.node;

	      var InsertListCommand = function (commandName) {
	        scribe.api.Command.call(this, commandName);
	      };

	      InsertListCommand.prototype = Object.create(scribe.api.Command.prototype);
	      InsertListCommand.prototype.constructor = InsertListCommand;

	      InsertListCommand.prototype.execute = function (value) {
	        function splitList(listItemElements) {
	          if (!!listItemElements.size) {
	            var newListNode = document.createElement(listNode.nodeName);

	            while (!!listItemElements.size) {
	              newListNode.appendChild(listItemElements.first());
	              listItemElements = listItemElements.shift();
	            }

	            listNode.parentNode.insertBefore(newListNode, listNode.nextElementSibling);
	          }
	        }

	        if (this.queryState()) {
	          var selection = new scribe.api.Selection();
	          var range = selection.range;

	          var listNode = selection.getContaining(function (node) {
	            return node.nodeName === 'OL' || node.nodeName === 'UL';
	          });

	          var listItemElement = selection.getContaining(function (node) {
	            return node.nodeName === 'LI';
	          });

	          scribe.transactionManager.run(function () {
	            if (listItemElement) {
	              var nextListItemElements = nodeHelpers.nextSiblings(listItemElement);

	              /**
	               * If we are not at the start or end of a UL/OL, we have to
	               * split the node and insert the P(s) in the middle.
	               */
	              splitList(nextListItemElements);

	              /**
	               * Insert a paragraph in place of the list item.
	               */

	              selection.placeMarkers();

	              var pNode = document.createElement('p');
	              pNode.innerHTML = listItemElement.innerHTML;

	              listNode.parentNode.insertBefore(pNode, listNode.nextElementSibling);
	              listItemElement.parentNode.removeChild(listItemElement);
	            } else {
	              /**
	               * When multiple list items are selected, we replace each list
	               * item with a paragraph.
	               */

	              // We can't query for list items in the selection so we loop
	              // through them all and find the intersection ourselves.
	              var selectedListItemElements = Immutable.List(listNode.querySelectorAll('li'))
	                .filter(function (listItemElement) {
	                  return range.intersectsNode(listItemElement);
	                });
	              var lastSelectedListItemElement = selectedListItemElements.last();
	              var listItemElementsAfterSelection = nodeHelpers.nextSiblings(lastSelectedListItemElement);

	              /**
	               * If we are not at the start or end of a UL/OL, we have to
	               * split the node and insert the P(s) in the middle.
	               */
	              splitList(listItemElementsAfterSelection);

	              // Store the caret/range positioning inside of the list items so
	              // we can restore it from the newly created P elements soon
	              // afterwards.
	              selection.placeMarkers();

	              var documentFragment = document.createDocumentFragment();
	              selectedListItemElements.forEach(function (listItemElement) {
	                var pElement = document.createElement('p');
	                pElement.innerHTML = listItemElement.innerHTML;
	                documentFragment.appendChild(pElement);
	              });

	              // Insert the Ps
	              listNode.parentNode.insertBefore(documentFragment, listNode.nextElementSibling);

	              // Remove the LIs
	              selectedListItemElements.forEach(function (listItemElement) {
	                listItemElement.parentNode.removeChild(listItemElement);
	              });
	            }

	            // If the list is now empty, clean it up.
	            if (listNode.childNodes.length === 0) {
	              listNode.parentNode.removeChild(listNode);
	            }

	            selection.selectMarkers();
	          }.bind(this));
	        } else {
	          scribe.api.Command.prototype.execute.call(this, value);
	        }
	      };

	      InsertListCommand.prototype.queryEnabled = function () {
	        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements();
	      };

	      scribe.commands.insertOrderedList = new InsertListCommand('insertOrderedList');
	      scribe.commands.insertUnorderedList = new InsertListCommand('insertUnorderedList');
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var outdentCommand = new scribe.api.Command('outdent');

	      outdentCommand.queryEnabled = function () {
	        /**
	         * FIXME: If the paragraphs option is set to true, then when the
	         * list is unapplied, ensure that we enter a P element.
	         * Currently we just disable the command when the selection is inside of
	         * a list.
	         */
	        var selection = new scribe.api.Selection();
	        var listElement = selection.getContaining(function (element) {
	          return element.nodeName === 'UL' || element.nodeName === 'OL';
	        });

	        // FIXME: define block element rule here?
	        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements() && ! listElement;
	      };

	      scribe.commands.outdent = outdentCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var redoCommand = new scribe.api.Command('redo');

	      redoCommand.execute = function () {
	        scribe.undoManager.redo();
	      };

	      redoCommand.queryEnabled = function () {
	        return scribe.undoManager.position > 0;
	      };

	      scribe.commands.redo = redoCommand;

	      //is scribe is configured to undo assign listener
	      if (scribe.options.undo.enabled) {
	        scribe.el.addEventListener('keydown', function (event) {
	          if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.keyCode === 90) {
	            event.preventDefault();
	            redoCommand.execute();
	          }
	        });
	      }
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var subscriptCommand = new scribe.api.Command('subscript');

	      scribe.commands.subscript = subscriptCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var superscriptCommand = new scribe.api.Command('superscript');

	      scribe.commands.superscript = superscriptCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var undoCommand = new scribe.api.Command('undo');

	      undoCommand.execute = function () {
	        scribe.undoManager.undo();
	      };

	      undoCommand.queryEnabled = function () {
	        return scribe.undoManager.position < scribe.undoManager.length;
	      };

	      scribe.commands.undo = undoCommand;

	      if (scribe.options.undo.enabled) {
	        scribe.el.addEventListener('keydown', function (event) {
	          // TODO: use lib to abstract meta/ctrl keys?
	          if (! event.shiftKey && (event.metaKey || event.ctrlKey) && event.keyCode === 90) {
	            event.preventDefault();
	            undoCommand.execute();
	          }
	        });
	      }
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(28)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (Immutable) {
	  'use strict';

	  function UndoManager(limit, undoScopeHost) {
	    this._stack = Immutable.List();
	    this._limit = limit;
	    this._fireEvent = typeof CustomEvent != 'undefined' && undoScopeHost && undoScopeHost.dispatchEvent;
	    this._ush = undoScopeHost;

	    this.position = 0;
	    this.length = 0;
	  }

	  UndoManager.prototype.transact = function (transaction, merge) {
	    if (arguments.length < 2) {
	      throw new TypeError('Not enough arguments to UndoManager.transact.');
	    }

	    transaction.execute();

	    if (this.position > 0) {
	      this.clearRedo();
	    }

	    var transactions;
	    if (merge && this.length) {
	      transactions = this._stack.first().push(transaction);
	      this._stack = this._stack.shift().unshift(transactions);
	    }
	    else {
	      transactions = Immutable.List.of(transaction);
	      this._stack = this._stack.unshift(transactions);
	      this.length++;

	      if (this._limit && this.length > this._limit) {
	        this.clearUndo(this._limit);
	      }
	    }

	    this._dispatch('DOMTransaction', transactions);
	  };

	  UndoManager.prototype.undo = function () {
	    if (this.position >= this.length) { return; }

	    var transactions = this._stack.get(this.position);
	    var i = transactions.size;
	    while (i--) {
	      transactions.get(i).undo();
	    }
	    this.position++;

	    this._dispatch('undo', transactions);
	  };

	  UndoManager.prototype.redo = function () {
	    if (this.position === 0) { return; }

	    this.position--;
	    var transactions = this._stack.get(this.position);
	    for (var i = 0; i < transactions.size; i++) {
	      transactions.get(i).redo();
	    }

	    this._dispatch('redo', transactions);
	  };

	  UndoManager.prototype.item = function (index) {
	    return index >= 0 && index < this.length ?
	      this._stack.get(index).toArray() :
	      null;
	  };

	  UndoManager.prototype.clearUndo = function (position) {
	    this._stack = this._stack.take(position !== undefined ? position : this.position);
	    this.length = this._stack.size;
	  };

	  UndoManager.prototype.clearRedo = function () {
	    this._stack = this._stack.skip(this.position);
	    this.length = this._stack.size;
	    this.position = 0;
	  };

	  UndoManager.prototype._dispatch = function(event, transactions) {
	    if (this._fireEvent) {
	      this._ush.dispatchEvent(new CustomEvent(event, {
	        detail: {transactions: transactions.toArray()},
	        bubbles: true,
	        cancelable: false
	      }));
	    }
	  }

	  return UndoManager;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(28)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Immutable) {

	  'use strict';

	  // TODO: once
	  // TODO: unit test
	  // Good example of a complete(?) implementation: https://github.com/Wolfy87/EventEmitter
	  function EventEmitter() {
	    this._listeners = {};
	  }

	  EventEmitter.prototype.on = function (eventName, fn) {
	    var listeners = this._listeners[eventName] || Immutable.Set();

	    this._listeners[eventName] = listeners.add(fn);
	  };

	  EventEmitter.prototype.off = function (eventName, fn) {
	    var listeners = this._listeners[eventName] || Immutable.Set();
	    if (fn) {
	      this._listeners[eventName] = listeners.delete(fn);
	    } else {
	      this._listeners[eventName] = listeners.clear();
	    }
	  };

	  EventEmitter.prototype.trigger = function (eventName, args) {

	    //fire events like my:custom:event -> my:custom -> my
	    var events = eventName.split(':');
	    while(!!events.length){
	      var currentEvent = events.join(':');
	      var listeners = this._listeners[currentEvent] || Immutable.Set();
	      //trigger handles
	      listeners.forEach(function (listener) {
	        listener.apply(null, args);
	      });
	      events.splice((events.length - 1), 1);
	    }
	  };

	  return EventEmitter;

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(65)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (defaults) {

	  var blockModePlugins = [
	    'setRootPElement',
	    'enforcePElements',
	    'ensureSelectableContainers',
	  ],
	  inlineModePlugins = [
	    'inlineElementsMode'
	  ],
	  defaultOptions = {
	    allowBlockElements: true,
	    debug: false,
	    undo: {
	      manager: false,
	      enabled: true,
	      limit: 100,
	      interval: 250
	    },
	    defaultCommandPatches: [
	      'bold',
	      'indent',
	      'insertHTML',
	      'insertList',
	      'outdent',
	      'createLink'
	    ],

	    defaultPlugins: blockModePlugins.concat(inlineModePlugins),

	    defaultFormatters: [
	      'escapeHtmlCharactersFormatter',
	      'replaceNbspCharsFormatter'
	    ]
	  };

	  /**
	   * Overrides defaults with user's options
	   *
	   * @param  {Object} userSuppliedOptions The user's options
	   * @return {Object}                     The overridden options
	   */
	  function checkOptions(userSuppliedOptions) {
	    var options = userSuppliedOptions || {};

	    // Remove invalid plugins
	    if (options.defaultPlugins) {
	      options.defaultPlugins    = options.defaultPlugins.filter(filterByPluginExists(defaultOptions.defaultPlugins));
	    }

	    if (options.defaultFormatters) {
	      options.defaultFormatters = options.defaultFormatters.filter(filterByPluginExists(defaultOptions.defaultFormatters));
	    }

	    return Object.freeze(defaults(options, defaultOptions));
	  }

	  /**
	   * Sorts a plugin list by a specified plugin name
	   *
	   * @param  {String} priorityPlugin The plugin name to be given priority
	   * @return {Function}              Sorting function for the given plugin name
	   */
	  function sortByPlugin(priorityPlugin) {
	    return function (pluginCurrent, pluginNext) {
	      if (pluginCurrent === priorityPlugin) {
	        // pluginCurrent comes before plugin next
	        return -1;
	      } else if (pluginNext === priorityPlugin) {
	        // pluginNext comes before pluginCurrent
	        return 1;
	      }

	      // Do no swap
	      return 0;
	    }
	  }

	  /**
	   * Filters a list of plugins by block level / inline level mode.
	   *
	   * @param  {Boolean} isBlockLevelMode Whether block level mode is enabled
	   * @return {Function}                 Filtering function based upon the given mode
	   */
	  function filterByBlockLevelMode(isBlockLevelMode) {
	    return function (plugin) {
	      return (isBlockLevelMode ? blockModePlugins : inlineModePlugins).indexOf(plugin) !== -1;
	    }
	  }

	  /**
	   * Filters a list of plugins by their validity
	   *
	   * @param  {Array<String>} pluginList   List of plugins to check against
	   * @return {Function}                   Filtering function based upon the given list
	   */
	  function filterByPluginExists(pluginList) {
	    return function (plugin) {
	      return pluginList.indexOf(plugin) !== -1;
	    }
	  }

	  return {
	    defaultOptions: defaultOptions,
	    checkOptions: checkOptions,
	    sortByPlugin: sortByPlugin,
	    filterByBlockLevelMode: filterByBlockLevelMode,
	    filterByPluginExists: filterByPluginExists
	  }
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(66), __webpack_require__(3), __webpack_require__(67)], __WEBPACK_AMD_DEFINE_RESULT__ = function(arrayCopy, assign, assignDefaults) {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /**
	   * Assigns own enumerable properties of source object(s) to the destination
	   * object for all destination properties that resolve to `undefined`. Once a
	   * property is set, additional values of the same property are ignored.
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The destination object.
	   * @param {...Object} [sources] The source objects.
	   * @returns {Object} Returns `object`.
	   * @example
	   *
	   * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	   * // => { 'user': 'barney', 'age': 36 }
	   */
	  function defaults(object) {
	    if (object == null) {
	      return object;
	    }
	    var args = arrayCopy(arguments);
	    args.push(assignDefaults);
	    return assign.apply(undefined, args);
	  }

	  return defaults;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Copies the values of `source` to `array`.
	   *
	   * @private
	   * @param {Array} source The array to copy values from.
	   * @param {Array} [array=[]] The array to copy values to.
	   * @returns {Array} Returns `array`.
	   */
	  function arrayCopy(source, array) {
	    var index = -1,
	        length = source.length;

	    array || (array = Array(length));
	    while (++index < length) {
	      array[index] = source[index];
	    }
	    return array;
	  }

	  return arrayCopy;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Used by `_.defaults` to customize its `_.assign` use.
	   *
	   * @private
	   * @param {*} objectValue The destination object property value.
	   * @param {*} sourceValue The source object property value.
	   * @returns {*} Returns the value to assign to the destination object.
	   */
	  function assignDefaults(objectValue, sourceValue) {
	    return typeof objectValue == 'undefined' ? sourceValue : objectValue;
	  }

	  return assignDefaults;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	  __webpack_require__(69),
	  __webpack_require__(70),
	  __webpack_require__(102)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	  HTMLJanitor,
	  merge,
	  cloneDeep
	) {

	  /**
	   * This plugin adds the ability to sanitize content when it is pasted into the
	   * scribe, adhering to a whitelist of allowed tags and attributes.
	   */

	  'use strict';

	  return function (config) {
	    // We extend the config to let through (1) Scribe position markers,
	    // otherwise we lose the caret position when running the Scribe content
	    // through this sanitizer, and (2) BR elements which are needed by the
	    // browser to ensure elements are selectable.
	    var configAllowMarkers = merge(cloneDeep(config), {
	      tags: {
	        em: {class: 'scribe-marker'},
	        br: {}
	      }
	    });

	    return function (scribe) {
	      var janitor = new HTMLJanitor(configAllowMarkers);

	      scribe.registerHTMLFormatter('sanitize', janitor.clean.bind(janitor));
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
	    module.exports = factory();
	  } else {
	    root.HTMLJanitor = factory();
	  }
	}(this, function () {

	  /**
	   * @param {Object} config.tags Dictionary of allowed tags.
	   * @param {boolean} config.keepNestedBlockElements Default false.
	   */
	  function HTMLJanitor(config) {
	    this.config = config;
	  }

	  // TODO: not exhaustive?
	  var blockElementNames = ['P', 'LI', 'TD', 'TH', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'];
	  function isBlockElement(node) {
	    return blockElementNames.indexOf(node.nodeName) !== -1;
	  }

	  var inlineElementNames = ['A', 'B', 'STRONG', 'I', 'EM', 'SUB', 'SUP', 'U', 'STRIKE'];
	  function isInlineElement(node) {
	    return inlineElementNames.indexOf(node.nodeName) !== -1;
	  }

	  HTMLJanitor.prototype.clean = function (html) {
	    var sandbox = document.createElement('div');
	    sandbox.innerHTML = html;

	    this._sanitize(sandbox);

	    return sandbox.innerHTML;
	  };

	  HTMLJanitor.prototype._sanitize = function (parentNode) {
	    var treeWalker = createTreeWalker(parentNode);
	    var node = treeWalker.firstChild();
	    if (!node) { return; }

	    do {
	      var nodeName = node.nodeName.toLowerCase();
	      var allowedAttrs = this.config.tags[nodeName];

	      // Ignore nodes that have already been sanitized
	      if (node._sanitized) {
	        continue;
	      }

	      if (node.nodeType === Node.TEXT_NODE) {
	        // If this text node is just whitespace and the previous or next element
	        // sibling is a block element, remove it
	        // N.B.: This heuristic could change. Very specific to a bug with
	        // `contenteditable` in Firefox: http://jsbin.com/EyuKase/1/edit?js,output
	        // FIXME: make this an option?
	        if (node.data.trim() === ''
	            && ((node.previousElementSibling && isBlockElement(node.previousElementSibling))
	                 || (node.nextElementSibling && isBlockElement(node.nextElementSibling)))) {
	          parentNode.removeChild(node);
	          this._sanitize(parentNode);
	          break;
	        } else {
	          continue;
	        }
	      }

	      // Remove all comments
	      if (node.nodeType === Node.COMMENT_NODE) {
	        parentNode.removeChild(node);
	        this._sanitize(parentNode);
	        break;
	      }

	      var isInline = isInlineElement(node);
	      var containsBlockElement;
	      if (isInline) {
	        containsBlockElement = Array.prototype.some.call(node.childNodes, isBlockElement);
	      }

	      var isInvalid = isInline && containsBlockElement;

	      // Block elements should not be nested (e.g. <li><p>...); if
	      // they are, we want to unwrap the inner block element.
	      var isNotTopContainer = !! parentNode.parentNode;
	      var isNestedBlockElement =
	            isBlockElement(parentNode) &&
	            isBlockElement(node) &&
	            isNotTopContainer;

	      // Drop tag entirely according to the whitelist *and* if the markup
	      // is invalid.
	      if (!this.config.tags[nodeName] || isInvalid || (!this.config.keepNestedBlockElements && isNestedBlockElement)) {
	        // Do not keep the inner text of SCRIPT/STYLE elements.
	        if (! (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE')) {
	          while (node.childNodes.length > 0) {
	            parentNode.insertBefore(node.childNodes[0], node);
	          }
	        }
	        parentNode.removeChild(node);

	        this._sanitize(parentNode);
	        break;
	      }

	      // Sanitize attributes
	      for (var a = 0; a < node.attributes.length; a += 1) {
	        var attr = node.attributes[a];
	        var attrName = attr.name.toLowerCase();

	        // Allow attribute?
	        var allowedAttrValue = allowedAttrs[attrName] || allowedAttrs === true;
	        var notInAttrList = ! allowedAttrValue;
	        var valueNotAllowed = allowedAttrValue !== true && attr.value !== allowedAttrValue;
	        if (notInAttrList || valueNotAllowed) {
	          node.removeAttribute(attr.name);
	          // Shift the array to continue looping.
	          a = a - 1;
	        }
	      }

	      // Sanitize children
	      this._sanitize(node);

	      // Mark node as sanitized so it's ignored in future runs
	      node._sanitized = true;
	    } while ((node = treeWalker.nextSibling()));
	  };

	  function createTreeWalker(node) {
	    return document.createTreeWalker(node,
	                                     NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
	                                     null, false);
	  }

	  return HTMLJanitor;

	}));


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(71), __webpack_require__(98)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseMerge, createAssigner) {

	  /**
	   * Recursively merges own enumerable properties of the source object(s), that
	   * don't resolve to `undefined` into the destination object. Subsequent sources
	   * overwrite property assignments of previous sources. If `customizer` is
	   * provided it is invoked to produce the merged values of the destination and
	   * source properties. If `customizer` returns `undefined` merging is handled
	   * by the method instead. The `customizer` is bound to `thisArg` and invoked
	   * with five arguments; (objectValue, sourceValue, key, object, source).
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The destination object.
	   * @param {...Object} [sources] The source objects.
	   * @param {Function} [customizer] The function to customize merging properties.
	   * @param {*} [thisArg] The `this` binding of `customizer`.
	   * @returns {Object} Returns `object`.
	   * @example
	   *
	   * var users = {
	   *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
	   * };
	   *
	   * var ages = {
	   *   'data': [{ 'age': 36 }, { 'age': 40 }]
	   * };
	   *
	   * _.merge(users, ages);
	   * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
	   *
	   * // using a customizer callback
	   * var object = {
	   *   'fruits': ['apple'],
	   *   'vegetables': ['beet']
	   * };
	   *
	   * var other = {
	   *   'fruits': ['banana'],
	   *   'vegetables': ['carrot']
	   * };
	   *
	   * _.merge(object, other, function(a, b) {
	   *   if (_.isArray(a)) {
	   *     return a.concat(b);
	   *   }
	   * });
	   * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
	   */
	  var merge = createAssigner(baseMerge);

	  return merge;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(72), __webpack_require__(73), __webpack_require__(90), __webpack_require__(85), __webpack_require__(78), __webpack_require__(76), __webpack_require__(82), __webpack_require__(95)], __WEBPACK_AMD_DEFINE_RESULT__ = function(arrayEach, baseForOwn, baseMergeDeep, isArray, isLength, isObject, isObjectLike, isTypedArray) {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /**
	   * The base implementation of `_.merge` without support for argument juggling,
	   * multiple sources, and `this` binding `customizer` functions.
	   *
	   * @private
	   * @param {Object} object The destination object.
	   * @param {Object} source The source object.
	   * @param {Function} [customizer] The function to customize merging properties.
	   * @param {Array} [stackA=[]] Tracks traversed source objects.
	   * @param {Array} [stackB=[]] Associates values with source counterparts.
	   * @returns {Object} Returns the destination object.
	   */
	  function baseMerge(object, source, customizer, stackA, stackB) {
	    if (!isObject(object)) {
	      return object;
	    }
	    var isSrcArr = isLength(source.length) && (isArray(source) || isTypedArray(source));
	    (isSrcArr ? arrayEach : baseForOwn)(source, function(srcValue, key, source) {
	      if (isObjectLike(srcValue)) {
	        stackA || (stackA = []);
	        stackB || (stackB = []);
	        return baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
	      }
	      var value = object[key],
	          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	          isCommon = typeof result == 'undefined';

	      if (isCommon) {
	        result = srcValue;
	      }
	      if ((isSrcArr || typeof result != 'undefined') &&
	          (isCommon || (result === result ? (result !== value) : (value === value)))) {
	        object[key] = result;
	      }
	    });
	    return object;
	  }

	  return baseMerge;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * A specialized version of `_.forEach` for arrays without support for callback
	   * shorthands or `this` binding.
	   *
	   * @private
	   * @param {Array} array The array to iterate over.
	   * @param {Function} iteratee The function invoked per iteration.
	   * @returns {Array} Returns `array`.
	   */
	  function arrayEach(array, iteratee) {
	    var index = -1,
	        length = array.length;

	    while (++index < length) {
	      if (iteratee(array[index], index, array) === false) {
	        break;
	      }
	    }
	    return array;
	  }

	  return arrayEach;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(74), __webpack_require__(77)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseFor, keys) {

	  /**
	   * The base implementation of `_.forOwn` without support for callback
	   * shorthands and `this` binding.
	   *
	   * @private
	   * @param {Object} object The object to iterate over.
	   * @param {Function} iteratee The function invoked per iteration.
	   * @returns {Object} Returns `object`.
	   */
	  function baseForOwn(object, iteratee) {
	    return baseFor(object, iteratee, keys);
	  }

	  return baseForOwn;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(75)], __WEBPACK_AMD_DEFINE_RESULT__ = function(toObject) {

	  /**
	   * The base implementation of `baseForIn` and `baseForOwn` which iterates
	   * over `object` properties returned by `keysFunc` invoking `iteratee` for
	   * each property. Iterator functions may exit iteration early by explicitly
	   * returning `false`.
	   *
	   * @private
	   * @param {Object} object The object to iterate over.
	   * @param {Function} iteratee The function invoked per iteration.
	   * @param {Function} keysFunc The function to get the keys of `object`.
	   * @returns {Object} Returns `object`.
	   */
	  function baseFor(object, iteratee, keysFunc) {
	    var index = -1,
	        iterable = toObject(object),
	        props = keysFunc(object),
	        length = props.length;

	    while (++index < length) {
	      var key = props[index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  }

	  return baseFor;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(76)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isObject) {

	  /**
	   * Converts `value` to an object if it is not one.
	   *
	   * @private
	   * @param {*} value The value to process.
	   * @returns {Object} Returns the object.
	   */
	  function toObject(value) {
	    return isObject(value) ? value : Object(value);
	  }

	  return toObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Checks if `value` is the language type of `Object`.
	   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	   *
	   * **Note:** See the [ES5 spec](https://es5.github.io/#x8) for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	   * @example
	   *
	   * _.isObject({});
	   * // => true
	   *
	   * _.isObject([1, 2, 3]);
	   * // => true
	   *
	   * _.isObject(1);
	   * // => false
	   */
	  function isObject(value) {
	    // Avoid a V8 JIT bug in Chrome 19-20.
	    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	    var type = typeof value;
	    return type == 'function' || (value && type == 'object') || false;
	  }

	  return isObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(78), __webpack_require__(79), __webpack_require__(76), __webpack_require__(83)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isNative, isObject, shimKeys) {

	  /* Native method references for those with the same name as other `lodash` methods. */
	  var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

	  /**
	   * Creates an array of the own enumerable property names of `object`.
	   *
	   * **Note:** Non-object values are coerced to objects. See the
	   * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
	   * for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   * @example
	   *
	   * function Foo() {
	   *   this.a = 1;
	   *   this.b = 2;
	   * }
	   *
	   * Foo.prototype.c = 3;
	   *
	   * _.keys(new Foo);
	   * // => ['a', 'b'] (iteration order is not guaranteed)
	   *
	   * _.keys('hi');
	   * // => ['0', '1']
	   */
	  var keys = !nativeKeys ? shimKeys : function(object) {
	    if (object) {
	      var Ctor = object.constructor,
	          length = object.length;
	    }
	    if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	        (typeof object != 'function' && (length && isLength(length)))) {
	      return shimKeys(object);
	    }
	    return isObject(object) ? nativeKeys(object) : [];
	  };

	  return keys;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Used as the maximum length of an array-like value.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	   * for more details.
	   */
	  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	  /**
	   * Checks if `value` is a valid array-like length.
	   *
	   * **Note:** This function is based on ES `ToLength`. See the
	   * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
	   * for more details.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	   */
	  function isLength(value) {
	    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	  }

	  return isLength;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(80), __webpack_require__(82)], __WEBPACK_AMD_DEFINE_RESULT__ = function(escapeRegExp, isObjectLike) {

	  /** `Object#toString` result references. */
	  var funcTag = '[object Function]';

	  /** Used to detect host constructors (Safari > 5). */
	  var reHostCtor = /^\[object .+?Constructor\]$/;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to resolve the decompiled source of functions. */
	  var fnToString = Function.prototype.toString;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /** Used to detect if a method is native. */
	  var reNative = RegExp('^' +
	    escapeRegExp(objToString)
	    .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	  );

	  /**
	   * Checks if `value` is a native function.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	   * @example
	   *
	   * _.isNative(Array.prototype.push);
	   * // => true
	   *
	   * _.isNative(_);
	   * // => false
	   */
	  function isNative(value) {
	    if (value == null) {
	      return false;
	    }
	    if (objToString.call(value) == funcTag) {
	      return reNative.test(fnToString.call(value));
	    }
	    return (isObjectLike(value) && reHostCtor.test(value)) || false;
	  }

	  return isNative;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(81)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseToString) {

	  /**
	   * Used to match `RegExp` special characters.
	   * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)
	   * for more details.
	   */
	  var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
	      reHasRegExpChars = RegExp(reRegExpChars.source);

	  /**
	   * Escapes the `RegExp` special characters "\", "^", "$", ".", "|", "?", "*",
	   * "+", "(", ")", "[", "]", "{" and "}" in `string`.
	   *
	   * @static
	   * @memberOf _
	   * @category String
	   * @param {string} [string=''] The string to escape.
	   * @returns {string} Returns the escaped string.
	   * @example
	   *
	   * _.escapeRegExp('[lodash](https://lodash.com/)');
	   * // => '\[lodash\]\(https://lodash\.com/\)'
	   */
	  function escapeRegExp(string) {
	    string = baseToString(string);
	    return (string && reHasRegExpChars.test(string))
	      ? string.replace(reRegExpChars, '\\$&')
	      : string;
	  }

	  return escapeRegExp;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Converts `value` to a string if it is not one. An empty string is returned
	   * for `null` or `undefined` values.
	   *
	   * @private
	   * @param {*} value The value to process.
	   * @returns {string} Returns the string.
	   */
	  function baseToString(value) {
	    if (typeof value == 'string') {
	      return value;
	    }
	    return value == null ? '' : (value + '');
	  }

	  return baseToString;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Checks if `value` is object-like.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	   */
	  function isObjectLike(value) {
	    return (value && typeof value == 'object') || false;
	  }

	  return isObjectLike;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(84), __webpack_require__(85), __webpack_require__(86), __webpack_require__(78), __webpack_require__(87), __webpack_require__(88)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isArguments, isArray, isIndex, isLength, keysIn, support) {

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * A fallback implementation of `Object.keys` which creates an array of the
	   * own enumerable property names of `object`.
	   *
	   * @private
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   */
	  function shimKeys(object) {
	    var props = keysIn(object),
	        propsLength = props.length,
	        length = propsLength && object.length;

	    var allowIndexes = length && isLength(length) &&
	      (isArray(object) || (support.nonEnumArgs && isArguments(object)));

	    var index = -1,
	        result = [];

	    while (++index < propsLength) {
	      var key = props[index];
	      if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
	        result.push(key);
	      }
	    }
	    return result;
	  }

	  return shimKeys;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(78), __webpack_require__(82)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isObjectLike) {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /** `Object#toString` result references. */
	  var argsTag = '[object Arguments]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /**
	   * Checks if `value` is classified as an `arguments` object.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   * @example
	   *
	   * _.isArguments(function() { return arguments; }());
	   * // => true
	   *
	   * _.isArguments([1, 2, 3]);
	   * // => false
	   */
	  function isArguments(value) {
	    var length = isObjectLike(value) ? value.length : undefined;
	    return (isLength(length) && objToString.call(value) == argsTag) || false;
	  }

	  return isArguments;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(78), __webpack_require__(79), __webpack_require__(82)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isNative, isObjectLike) {

	  /** `Object#toString` result references. */
	  var arrayTag = '[object Array]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /* Native method references for those with the same name as other `lodash` methods. */
	  var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

	  /**
	   * Checks if `value` is classified as an `Array` object.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   * @example
	   *
	   * _.isArray([1, 2, 3]);
	   * // => true
	   *
	   * _.isArray(function() { return arguments; }());
	   * // => false
	   */
	  var isArray = nativeIsArray || function(value) {
	    return (isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag) || false;
	  };

	  return isArray;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Used as the maximum length of an array-like value.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
	   * for more details.
	   */
	  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

	  /**
	   * Checks if `value` is a valid array-like index.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	   */
	  function isIndex(value, length) {
	    value = +value;
	    length = length == null ? MAX_SAFE_INTEGER : length;
	    return value > -1 && value % 1 == 0 && value < length;
	  }

	  return isIndex;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(84), __webpack_require__(85), __webpack_require__(86), __webpack_require__(78), __webpack_require__(76), __webpack_require__(88)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isArguments, isArray, isIndex, isLength, isObject, support) {

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * Creates an array of the own and inherited enumerable property names of `object`.
	   *
	   * **Note:** Non-object values are coerced to objects.
	   *
	   * @static
	   * @memberOf _
	   * @category Object
	   * @param {Object} object The object to inspect.
	   * @returns {Array} Returns the array of property names.
	   * @example
	   *
	   * function Foo() {
	   *   this.a = 1;
	   *   this.b = 2;
	   * }
	   *
	   * Foo.prototype.c = 3;
	   *
	   * _.keysIn(new Foo);
	   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	   */
	  function keysIn(object) {
	    if (object == null) {
	      return [];
	    }
	    if (!isObject(object)) {
	      object = Object(object);
	    }
	    var length = object.length;
	    length = (length && isLength(length) &&
	      (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

	    var Ctor = object.constructor,
	        index = -1,
	        isProto = typeof Ctor == 'function' && Ctor.prototype === object,
	        result = Array(length),
	        skipIndexes = length > 0;

	    while (++index < length) {
	      result[index] = (index + '');
	    }
	    for (var key in object) {
	      if (!(skipIndexes && isIndex(key, length)) &&
	          !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	        result.push(key);
	      }
	    }
	    return result;
	  }

	  return keysIn;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(79), __webpack_require__(89)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isNative, root) {

	  /** Used to detect functions containing a `this` reference. */
	  var reThis = /\bthis\b/;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to detect DOM support. */
	  var document = (document = root.window) && document.document;

	  /** Native method references. */
	  var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	  /**
	   * An object environment feature flags.
	   *
	   * @static
	   * @memberOf _
	   * @type Object
	   */
	  var support = {};

	  (function(x) {

	    /**
	     * Detect if functions can be decompiled by `Function#toString`
	     * (all but Firefox OS certified apps, older Opera mobile browsers, and
	     * the PlayStation 3; forced `false` for Windows 8 apps).
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    support.funcDecomp = !isNative(root.WinRTError) && reThis.test(function() { return this; });

	    /**
	     * Detect if `Function#name` is supported (all but IE).
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    support.funcNames = typeof Function.name == 'string';

	    /**
	     * Detect if the DOM is supported.
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    try {
	      support.dom = document.createDocumentFragment().nodeType === 11;
	    } catch(e) {
	      support.dom = false;
	    }

	    /**
	     * Detect if `arguments` object indexes are non-enumerable.
	     *
	     * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
	     * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
	     * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
	     * checks for indexes that exceed their function's formal parameters with
	     * associated values of `0`.
	     *
	     * @memberOf _.support
	     * @type boolean
	     */
	    try {
	      support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
	    } catch(e) {
	      support.nonEnumArgs = true;
	    }
	  }(0, 0));

	  return support;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /** Used to determine if values are of the language type `Object`. */
	  var objectTypes = {
	    'function': true,
	    'object': true
	  };

	  /** Detect free variable `exports`. */
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  /** Detect free variable `module`. */
	  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

	  /** Detect free variable `global` from Node.js. */
	  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;

	  /** Detect free variable `window`. */
	  var freeWindow = objectTypes[typeof window] && window;

	  /**
	   * Used as a reference to the global object.
	   *
	   * The `this` value is used if it is the global object to avoid Greasemonkey's
	   * restricted `window` object, otherwise the `window` object is used.
	   */
	  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || this;

	  return root;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)(module), (function() { return this; }())))

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(91), __webpack_require__(84), __webpack_require__(85), __webpack_require__(78), __webpack_require__(92), __webpack_require__(95), __webpack_require__(96)], __WEBPACK_AMD_DEFINE_RESULT__ = function(arrayCopy, isArguments, isArray, isLength, isPlainObject, isTypedArray, toPlainObject) {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /**
	   * A specialized version of `baseMerge` for arrays and objects which performs
	   * deep merges and tracks traversed objects enabling objects with circular
	   * references to be merged.
	   *
	   * @private
	   * @param {Object} object The destination object.
	   * @param {Object} source The source object.
	   * @param {string} key The key of the value to merge.
	   * @param {Function} mergeFunc The function to merge values.
	   * @param {Function} [customizer] The function to customize merging properties.
	   * @param {Array} [stackA=[]] Tracks traversed source objects.
	   * @param {Array} [stackB=[]] Associates values with source counterparts.
	   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	   */
	  function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
	    var length = stackA.length,
	        srcValue = source[key];

	    while (length--) {
	      if (stackA[length] == srcValue) {
	        object[key] = stackB[length];
	        return;
	      }
	    }
	    var value = object[key],
	        result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	        isCommon = typeof result == 'undefined';

	    if (isCommon) {
	      result = srcValue;
	      if (isLength(srcValue.length) && (isArray(srcValue) || isTypedArray(srcValue))) {
	        result = isArray(value)
	          ? value
	          : (value ? arrayCopy(value) : []);
	      }
	      else if (isPlainObject(srcValue) || isArguments(srcValue)) {
	        result = isArguments(value)
	          ? toPlainObject(value)
	          : (isPlainObject(value) ? value : {});
	      }
	      else {
	        isCommon = false;
	      }
	    }
	    // Add the source value to the stack of traversed objects and associate
	    // it with its merged value.
	    stackA.push(srcValue);
	    stackB.push(result);

	    if (isCommon) {
	      // Recursively merge objects and arrays (susceptible to call stack limits).
	      object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
	    } else if (result === result ? (result !== value) : (value === value)) {
	      object[key] = result;
	    }
	  }

	  return baseMergeDeep;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Copies the values of `source` to `array`.
	   *
	   * @private
	   * @param {Array} source The array to copy values from.
	   * @param {Array} [array=[]] The array to copy values to.
	   * @returns {Array} Returns `array`.
	   */
	  function arrayCopy(source, array) {
	    var index = -1,
	        length = source.length;

	    array || (array = Array(length));
	    while (++index < length) {
	      array[index] = source[index];
	    }
	    return array;
	  }

	  return arrayCopy;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(79), __webpack_require__(93)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isNative, shimIsPlainObject) {

	  /** `Object#toString` result references. */
	  var objectTag = '[object Object]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /** Native method references. */
	  var getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf;

	  /**
	   * Checks if `value` is a plain object, that is, an object created by the
	   * `Object` constructor or one with a `[[Prototype]]` of `null`.
	   *
	   * **Note:** This method assumes objects created by the `Object` constructor
	   * have no inherited enumerable properties.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	   * @example
	   *
	   * function Foo() {
	   *   this.a = 1;
	   * }
	   *
	   * _.isPlainObject(new Foo);
	   * // => false
	   *
	   * _.isPlainObject([1, 2, 3]);
	   * // => false
	   *
	   * _.isPlainObject({ 'x': 0, 'y': 0 });
	   * // => true
	   *
	   * _.isPlainObject(Object.create(null));
	   * // => true
	   */
	  var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
	    if (!(value && objToString.call(value) == objectTag)) {
	      return false;
	    }
	    var valueOf = value.valueOf,
	        objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

	    return objProto
	      ? (value == objProto || getPrototypeOf(value) == objProto)
	      : shimIsPlainObject(value);
	  };

	  return isPlainObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(94), __webpack_require__(82)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseForIn, isObjectLike) {

	  /** `Object#toString` result references. */
	  var objectTag = '[object Object]';

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /**
	   * A fallback implementation of `_.isPlainObject` which checks if `value`
	   * is an object created by the `Object` constructor or has a `[[Prototype]]`
	   * of `null`.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	   */
	  function shimIsPlainObject(value) {
	    var Ctor;

	    // Exit early for non `Object` objects.
	    if (!(isObjectLike(value) && objToString.call(value) == objectTag) ||
	        (!hasOwnProperty.call(value, 'constructor') &&
	          (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
	      return false;
	    }
	    // IE < 9 iterates inherited properties before own properties. If the first
	    // iterated property is an object's own property then there are no inherited
	    // enumerable properties.
	    var result;
	    // In most environments an object's own properties are iterated before
	    // its inherited properties. If the last iterated property is an object's
	    // own property then there are no inherited enumerable properties.
	    baseForIn(value, function(subValue, key) {
	      result = key;
	    });
	    return typeof result == 'undefined' || hasOwnProperty.call(value, result);
	  }

	  return shimIsPlainObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(74), __webpack_require__(87)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseFor, keysIn) {

	  /**
	   * The base implementation of `_.forIn` without support for callback
	   * shorthands and `this` binding.
	   *
	   * @private
	   * @param {Object} object The object to iterate over.
	   * @param {Function} iteratee The function invoked per iteration.
	   * @returns {Object} Returns `object`.
	   */
	  function baseForIn(object, iteratee) {
	    return baseFor(object, iteratee, keysIn);
	  }

	  return baseForIn;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(78), __webpack_require__(82)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isLength, isObjectLike) {

	  /** `Object#toString` result references. */
	  var argsTag = '[object Arguments]',
	      arrayTag = '[object Array]',
	      boolTag = '[object Boolean]',
	      dateTag = '[object Date]',
	      errorTag = '[object Error]',
	      funcTag = '[object Function]',
	      mapTag = '[object Map]',
	      numberTag = '[object Number]',
	      objectTag = '[object Object]',
	      regexpTag = '[object RegExp]',
	      setTag = '[object Set]',
	      stringTag = '[object String]',
	      weakMapTag = '[object WeakMap]';

	  var arrayBufferTag = '[object ArrayBuffer]',
	      float32Tag = '[object Float32Array]',
	      float64Tag = '[object Float64Array]',
	      int8Tag = '[object Int8Array]',
	      int16Tag = '[object Int16Array]',
	      int32Tag = '[object Int32Array]',
	      uint8Tag = '[object Uint8Array]',
	      uint8ClampedTag = '[object Uint8ClampedArray]',
	      uint16Tag = '[object Uint16Array]',
	      uint32Tag = '[object Uint32Array]';

	  /** Used to identify `toStringTag` values of typed arrays. */
	  var typedArrayTags = {};
	  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	  typedArrayTags[uint32Tag] = true;
	  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
	  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
	  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
	  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
	  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /**
	   * Checks if `value` is classified as a typed array.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   * @example
	   *
	   * _.isTypedArray(new Uint8Array);
	   * // => true
	   *
	   * _.isTypedArray([]);
	   * // => false
	   */
	  function isTypedArray(value) {
	    return (isObjectLike(value) && isLength(value.length) && typedArrayTags[objToString.call(value)]) || false;
	  }

	  return isTypedArray;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(97), __webpack_require__(87)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseCopy, keysIn) {

	  /**
	   * Converts `value` to a plain object flattening inherited enumerable
	   * properties of `value` to own properties of the plain object.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to convert.
	   * @returns {Object} Returns the converted plain object.
	   * @example
	   *
	   * function Foo() {
	   *   this.b = 2;
	   * }
	   *
	   * Foo.prototype.c = 3;
	   *
	   * _.assign({ 'a': 1 }, new Foo);
	   * // => { 'a': 1, 'b': 2 }
	   *
	   * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	   * // => { 'a': 1, 'b': 2, 'c': 3 }
	   */
	  function toPlainObject(value) {
	    return baseCopy(value, keysIn(value));
	  }

	  return toPlainObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Copies the properties of `source` to `object`.
	   *
	   * @private
	   * @param {Object} source The object to copy properties from.
	   * @param {Object} [object={}] The object to copy properties to.
	   * @param {Array} props The property names to copy.
	   * @returns {Object} Returns `object`.
	   */
	  function baseCopy(source, object, props) {
	    if (!props) {
	      props = object;
	      object = {};
	    }
	    var index = -1,
	        length = props.length;

	    while (++index < length) {
	      var key = props[index];
	      object[key] = source[key];
	    }
	    return object;
	  }

	  return baseCopy;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(99), __webpack_require__(101)], __WEBPACK_AMD_DEFINE_RESULT__ = function(bindCallback, isIterateeCall) {

	  /**
	   * Creates a function that assigns properties of source object(s) to a given
	   * destination object.
	   *
	   * @private
	   * @param {Function} assigner The function to assign values.
	   * @returns {Function} Returns the new assigner function.
	   */
	  function createAssigner(assigner) {
	    return function() {
	      var args = arguments,
	          length = args.length,
	          object = args[0];

	      if (length < 2 || object == null) {
	        return object;
	      }
	      var customizer = args[length - 2],
	          thisArg = args[length - 1],
	          guard = args[3];

	      if (length > 3 && typeof customizer == 'function') {
	        customizer = bindCallback(customizer, thisArg, 5);
	        length -= 2;
	      } else {
	        customizer = (length > 2 && typeof thisArg == 'function') ? thisArg : null;
	        length -= (customizer ? 1 : 0);
	      }
	      if (guard && isIterateeCall(args[1], args[2], guard)) {
	        customizer = length == 3 ? null : customizer;
	        length = 2;
	      }
	      var index = 0;
	      while (++index < length) {
	        var source = args[index];
	        if (source) {
	          assigner(object, source, customizer);
	        }
	      }
	      return object;
	    };
	  }

	  return createAssigner;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(100)], __WEBPACK_AMD_DEFINE_RESULT__ = function(identity) {

	  /**
	   * A specialized version of `baseCallback` which only supports `this` binding
	   * and specifying the number of arguments to provide to `func`.
	   *
	   * @private
	   * @param {Function} func The function to bind.
	   * @param {*} thisArg The `this` binding of `func`.
	   * @param {number} [argCount] The number of arguments to provide to `func`.
	   * @returns {Function} Returns the callback.
	   */
	  function bindCallback(func, thisArg, argCount) {
	    if (typeof func != 'function') {
	      return identity;
	    }
	    if (typeof thisArg == 'undefined') {
	      return func;
	    }
	    switch (argCount) {
	      case 1: return function(value) {
	        return func.call(thisArg, value);
	      };
	      case 3: return function(value, index, collection) {
	        return func.call(thisArg, value, index, collection);
	      };
	      case 4: return function(accumulator, value, index, collection) {
	        return func.call(thisArg, accumulator, value, index, collection);
	      };
	      case 5: return function(value, other, key, object, source) {
	        return func.call(thisArg, value, other, key, object, source);
	      };
	    }
	    return function() {
	      return func.apply(thisArg, arguments);
	    };
	  }

	  return bindCallback;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * This method returns the first argument provided to it.
	   *
	   * @static
	   * @memberOf _
	   * @category Utility
	   * @param {*} value Any value.
	   * @returns {*} Returns `value`.
	   * @example
	   *
	   * var object = { 'user': 'fred' };
	   *
	   * _.identity(object) === object;
	   * // => true
	   */
	  function identity(value) {
	    return value;
	  }

	  return identity;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(86), __webpack_require__(78), __webpack_require__(76)], __WEBPACK_AMD_DEFINE_RESULT__ = function(isIndex, isLength, isObject) {

	  /**
	   * Checks if the provided arguments are from an iteratee call.
	   *
	   * @private
	   * @param {*} value The potential iteratee value argument.
	   * @param {*} index The potential iteratee index or key argument.
	   * @param {*} object The potential iteratee object argument.
	   * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	   */
	  function isIterateeCall(value, index, object) {
	    if (!isObject(object)) {
	      return false;
	    }
	    var type = typeof index;
	    if (type == 'number') {
	      var length = object.length,
	          prereq = isLength(length) && isIndex(index, length);
	    } else {
	      prereq = type == 'string' && index in object;
	    }
	    if (prereq) {
	      var other = object[index];
	      return value === value ? (value === other) : (other !== other);
	    }
	    return false;
	  }

	  return isIterateeCall;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(103), __webpack_require__(99)], __WEBPACK_AMD_DEFINE_RESULT__ = function(baseClone, bindCallback) {

	  /**
	   * Creates a deep clone of `value`. If `customizer` is provided it is invoked
	   * to produce the cloned values. If `customizer` returns `undefined` cloning
	   * is handled by the method instead. The `customizer` is bound to `thisArg`
	   * and invoked with two argument; (value [, index|key, object]).
	   *
	   * **Note:** This method is loosely based on the structured clone algorithm.
	   * The enumerable properties of `arguments` objects and objects created by
	   * constructors other than `Object` are cloned to plain `Object` objects. An
	   * empty object is returned for uncloneable values such as functions, DOM nodes,
	   * Maps, Sets, and WeakMaps. See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)
	   * for more details.
	   *
	   * @static
	   * @memberOf _
	   * @category Lang
	   * @param {*} value The value to deep clone.
	   * @param {Function} [customizer] The function to customize cloning values.
	   * @param {*} [thisArg] The `this` binding of `customizer`.
	   * @returns {*} Returns the deep cloned value.
	   * @example
	   *
	   * var users = [
	   *   { 'user': 'barney' },
	   *   { 'user': 'fred' }
	   * ];
	   *
	   * var deep = _.cloneDeep(users);
	   * deep[0] === users[0];
	   * // => false
	   *
	   * // using a customizer callback
	   * var el = _.cloneDeep(document.body, function(value) {
	   *   if (_.isElement(value)) {
	   *     return value.cloneNode(true);
	   *   }
	   * });
	   *
	   * el === document.body
	   * // => false
	   * el.nodeName
	   * // => BODY
	   * el.childNodes.length;
	   * // => 20
	   */
	  function cloneDeep(value, customizer, thisArg) {
	    customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
	    return baseClone(value, true, customizer);
	  }

	  return cloneDeep;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(91), __webpack_require__(72), __webpack_require__(97), __webpack_require__(73), __webpack_require__(107), __webpack_require__(104), __webpack_require__(108), __webpack_require__(85), __webpack_require__(76), __webpack_require__(77)], __WEBPACK_AMD_DEFINE_RESULT__ = function(arrayCopy, arrayEach, baseCopy, baseForOwn, initCloneArray, initCloneByTag, initCloneObject, isArray, isObject, keys) {

	  /** `Object#toString` result references. */
	  var argsTag = '[object Arguments]',
	      arrayTag = '[object Array]',
	      boolTag = '[object Boolean]',
	      dateTag = '[object Date]',
	      errorTag = '[object Error]',
	      funcTag = '[object Function]',
	      mapTag = '[object Map]',
	      numberTag = '[object Number]',
	      objectTag = '[object Object]',
	      regexpTag = '[object RegExp]',
	      setTag = '[object Set]',
	      stringTag = '[object String]',
	      weakMapTag = '[object WeakMap]';

	  var arrayBufferTag = '[object ArrayBuffer]',
	      float32Tag = '[object Float32Array]',
	      float64Tag = '[object Float64Array]',
	      int8Tag = '[object Int8Array]',
	      int16Tag = '[object Int16Array]',
	      int32Tag = '[object Int32Array]',
	      uint8Tag = '[object Uint8Array]',
	      uint8ClampedTag = '[object Uint8ClampedArray]',
	      uint16Tag = '[object Uint16Array]',
	      uint32Tag = '[object Uint32Array]';

	  /** Used to identify `toStringTag` values supported by `_.clone`. */
	  var cloneableTags = {};
	  cloneableTags[argsTag] = cloneableTags[arrayTag] =
	  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
	  cloneableTags[dateTag] = cloneableTags[float32Tag] =
	  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
	  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
	  cloneableTags[numberTag] = cloneableTags[objectTag] =
	  cloneableTags[regexpTag] = cloneableTags[stringTag] =
	  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	  cloneableTags[errorTag] = cloneableTags[funcTag] =
	  cloneableTags[mapTag] = cloneableTags[setTag] =
	  cloneableTags[weakMapTag] = false;

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /**
	   * Used to resolve the `toStringTag` of values.
	   * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
	   * for more details.
	   */
	  var objToString = objectProto.toString;

	  /**
	   * The base implementation of `_.clone` without support for argument juggling
	   * and `this` binding `customizer` functions.
	   *
	   * @private
	   * @param {*} value The value to clone.
	   * @param {boolean} [isDeep] Specify a deep clone.
	   * @param {Function} [customizer] The function to customize cloning values.
	   * @param {string} [key] The key of `value`.
	   * @param {Object} [object] The object `value` belongs to.
	   * @param {Array} [stackA=[]] Tracks traversed source objects.
	   * @param {Array} [stackB=[]] Associates clones with source counterparts.
	   * @returns {*} Returns the cloned value.
	   */
	  function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
	    var result;
	    if (customizer) {
	      result = object ? customizer(value, key, object) : customizer(value);
	    }
	    if (typeof result != 'undefined') {
	      return result;
	    }
	    if (!isObject(value)) {
	      return value;
	    }
	    var isArr = isArray(value);
	    if (isArr) {
	      result = initCloneArray(value);
	      if (!isDeep) {
	        return arrayCopy(value, result);
	      }
	    } else {
	      var tag = objToString.call(value),
	          isFunc = tag == funcTag;

	      if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	        result = initCloneObject(isFunc ? {} : value);
	        if (!isDeep) {
	          return baseCopy(value, result, keys(value));
	        }
	      } else {
	        return cloneableTags[tag]
	          ? initCloneByTag(value, tag, isDeep)
	          : (object ? value : {});
	      }
	    }
	    // Check for circular references and return corresponding clone.
	    stackA || (stackA = []);
	    stackB || (stackB = []);

	    var length = stackA.length;
	    while (length--) {
	      if (stackA[length] == value) {
	        return stackB[length];
	      }
	    }
	    // Add the source value to the stack of traversed objects and associate it with its clone.
	    stackA.push(value);
	    stackB.push(result);

	    // Recursively populate clone (susceptible to call stack limits).
	    (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
	      result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
	    });
	    return result;
	  }

	  return baseClone;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(105)], __WEBPACK_AMD_DEFINE_RESULT__ = function(bufferClone) {

	  /** `Object#toString` result references. */
	  var boolTag = '[object Boolean]',
	      dateTag = '[object Date]',
	      numberTag = '[object Number]',
	      regexpTag = '[object RegExp]',
	      stringTag = '[object String]';

	  var arrayBufferTag = '[object ArrayBuffer]',
	      float32Tag = '[object Float32Array]',
	      float64Tag = '[object Float64Array]',
	      int8Tag = '[object Int8Array]',
	      int16Tag = '[object Int16Array]',
	      int32Tag = '[object Int32Array]',
	      uint8Tag = '[object Uint8Array]',
	      uint8ClampedTag = '[object Uint8ClampedArray]',
	      uint16Tag = '[object Uint16Array]',
	      uint32Tag = '[object Uint32Array]';

	  /** Used to match `RegExp` flags from their coerced string values. */
	  var reFlags = /\w*$/;

	  /**
	   * Initializes an object clone based on its `toStringTag`.
	   *
	   * **Note:** This function only supports cloning values with tags of
	   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	   *
	   *
	   * @private
	   * @param {Object} object The object to clone.
	   * @param {string} tag The `toStringTag` of the object to clone.
	   * @param {boolean} [isDeep] Specify a deep clone.
	   * @returns {Object} Returns the initialized clone.
	   */
	  function initCloneByTag(object, tag, isDeep) {
	    var Ctor = object.constructor;
	    switch (tag) {
	      case arrayBufferTag:
	        return bufferClone(object);

	      case boolTag:
	      case dateTag:
	        return new Ctor(+object);

	      case float32Tag: case float64Tag:
	      case int8Tag: case int16Tag: case int32Tag:
	      case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	        var buffer = object.buffer;
	        return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

	      case numberTag:
	      case stringTag:
	        return new Ctor(object);

	      case regexpTag:
	        var result = new Ctor(object.source, reFlags.exec(object));
	        result.lastIndex = object.lastIndex;
	    }
	    return result;
	  }

	  return initCloneByTag;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(106), __webpack_require__(79), __webpack_require__(89)], __WEBPACK_AMD_DEFINE_RESULT__ = function(constant, isNative, root) {

	  /** Native method references. */
	  var ArrayBuffer = isNative(ArrayBuffer = root.ArrayBuffer) && ArrayBuffer,
	      bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,
	      floor = Math.floor,
	      Uint8Array = isNative(Uint8Array = root.Uint8Array) && Uint8Array;

	  /** Used to clone array buffers. */
	  var Float64Array = (function() {
	    // Safari 5 errors when using an array buffer to initialize a typed array
	    // where the array buffer's `byteLength` is not a multiple of the typed
	    // array's `BYTES_PER_ELEMENT`.
	    try {
	      var func = isNative(func = root.Float64Array) && func,
	          result = new func(new ArrayBuffer(10), 0, 1) && func;
	    } catch(e) {}
	    return result;
	  }());

	  /** Used as the size, in bytes, of each `Float64Array` element. */
	  var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;

	  /**
	   * Creates a clone of the given array buffer.
	   *
	   * @private
	   * @param {ArrayBuffer} buffer The array buffer to clone.
	   * @returns {ArrayBuffer} Returns the cloned array buffer.
	   */
	  function bufferClone(buffer) {
	    return bufferSlice.call(buffer, 0);
	  }
	  if (!bufferSlice) {
	    // PhantomJS has `ArrayBuffer` and `Uint8Array` but not `Float64Array`.
	    bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {
	      var byteLength = buffer.byteLength,
	          floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,
	          offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,
	          result = new ArrayBuffer(byteLength);

	      if (floatLength) {
	        var view = new Float64Array(result, 0, floatLength);
	        view.set(new Float64Array(buffer, 0, floatLength));
	      }
	      if (byteLength != offset) {
	        view = new Uint8Array(result, offset);
	        view.set(new Uint8Array(buffer, offset));
	      }
	      return result;
	    };
	  }

	  return bufferClone;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Creates a function that returns `value`.
	   *
	   * @static
	   * @memberOf _
	   * @category Utility
	   * @param {*} value The value to return from the new function.
	   * @returns {Function} Returns the new function.
	   * @example
	   *
	   * var object = { 'user': 'fred' };
	   * var getter = _.constant(object);
	   *
	   * getter() === object;
	   * // => true
	   */
	  function constant(value) {
	    return function() {
	      return value;
	    };
	  }

	  return constant;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /** Used for native method references. */
	  var objectProto = Object.prototype;

	  /** Used to check objects for own properties. */
	  var hasOwnProperty = objectProto.hasOwnProperty;

	  /**
	   * Initializes an array clone.
	   *
	   * @private
	   * @param {Array} array The array to clone.
	   * @returns {Array} Returns the initialized clone.
	   */
	  function initCloneArray(array) {
	    var length = array.length,
	        result = new array.constructor(length);

	    // Add array properties assigned by `RegExp#exec`.
	    if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	      result.index = array.index;
	      result.input = array.input;
	    }
	    return result;
	  }

	  return initCloneArray;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  /**
	   * Initializes an object clone.
	   *
	   * @private
	   * @param {Object} object The object to clone.
	   * @returns {Object} Returns the initialized clone.
	   */
	  function initCloneObject(object) {
	    var Ctor = object.constructor;
	    if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
	      Ctor = Object;
	    }
	    return new Ctor;
	  }

	  return initCloneObject;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * This plugin adds a command for creating links, including a basic prompt.
	   */

	  'use strict';

	  return function (options) {
	    var options = options || {};

	    return function (scribe) {
	      var linkPromptCommand = new scribe.api.Command('createLink');

	      linkPromptCommand.nodeName = 'A';

	      linkPromptCommand.execute = function (passedLink) {
	        var link;
	        var selection = new scribe.api.Selection();
	        var range = selection.range;
	        var anchorNode = selection.getContaining(function (node) {
	          return node.nodeName === this.nodeName;
	        }.bind(this));

	        var initialLink = anchorNode ? anchorNode.href : '';

	        if (!passedLink)  {
	          link = window.prompt('Enter a link.', initialLink);
	        } else {
	          link = passedLink;
	        }

	        if(options && options.validation) {
	          var validationResult = options.validation(link);

	          if(!validationResult.valid) {
	            window.alert(validationResult.message || 'The link is not valid');
	            return;
	          }
	        }
	        if (anchorNode) {
	          range.selectNode(anchorNode);
	          selection.selection.removeAllRanges();
	          selection.selection.addRange(range);
	        }

	        // FIXME: I don't like how plugins like this do so much. Is there a way
	        // to compose?

	        if (link) {
	          // Prepend href protocol if missing
	          // If a http/s or mailto link is provided, then we will trust that an link is valid
	          var urlProtocolRegExp = /^https?\:\/\//;
	          var mailtoProtocolRegExp = /^mailto\:/;
	          if (! urlProtocolRegExp.test(link) && ! mailtoProtocolRegExp.test(link)) {
	            // For emails we just look for a `@` symbol as it is easier.
	            if (/@/.test(link)) {
	              var shouldPrefixEmail = window.confirm(
	                'The URL you entered appears to be an email address. ' +
	                'Do you want to add the required “mailto:” prefix?'
	              );
	              if (shouldPrefixEmail) {
	                link = 'mailto:' + link;
	              }
	            } else {
	              var shouldPrefixLink = window.confirm(
	                'The URL you entered appears to be a link. ' +
	                'Do you want to add the required “http://” prefix?'
	              );
	              if (shouldPrefixLink) {
	                link = 'http://' + link;
	              }
	            }
	          }

	          scribe.api.SimpleCommand.prototype.execute.call(this, link);
	        }
	      };

	      linkPromptCommand.queryState = function () {
	        /**
	         * We override the native `document.queryCommandState` for links because
	         * the `createLink` and `unlink` commands are not supported.
	         * As per: http://jsbin.com/OCiJUZO/1/edit?js,console,output
	         */
	        var selection = new scribe.api.Selection();
	        return !! selection.getContaining(function (node) {
	          return node.nodeName === this.nodeName;
	        }.bind(this));
	      };

	      scribe.commands.linkPrompt = linkPromptCommand;
	    };
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {

	  /**
	   * This plugin modifies the `unlink` command so that, when the user's
	   * selection is collapsed, remove the containing A.
	   */

	  'use strict';

	  return function () {
	    return function (scribe) {
	      var element = scribe.element;
	      
	      var unlinkCommand = new scribe.api.Command('unlink');

	      unlinkCommand.execute = function () {
	        var selection = new scribe.api.Selection();

	        if (selection.selection.isCollapsed) {
	          scribe.transactionManager.run(function () {
	            /**
	             * If the selection is collapsed, we can remove the containing anchor.
	             */

	            var aNode = selection.getContaining(function (node) {
	              return node.nodeName === 'A';
	            });

	            if (aNode) {
	              // we must save and then restore the selection because unwrapping
	              // the anchor loses the current selection
	              selection.placeMarkers();

	              // unwrap the A element's children, then remove it
	              element.unwrap(aNode.parentNode, aNode);

	              // finally restore selection to the initial position
	              selection.selectMarkers();
	            }
	          });
	        } else {
	          scribe.api.Command.prototype.execute.apply(this, arguments);
	        }
	      };

	      unlinkCommand.queryEnabled = function () {
	        var selection = new scribe.api.Selection();
	        if (selection.selection.isCollapsed) {
	          return !! selection.getContaining(function (node) {
	            return node.nodeName === 'A';
	          });
	        } else {
	          return scribe.api.Command.prototype.queryEnabled.apply(this, arguments);
	        }
	      };

	      scribe.commands.unlink = unlinkCommand;
	    };
	  };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 111 */
/***/ function(module, exports) {

	module.exports = function() {
	    return function(scribe) {
	        var nodeHelpers = scribe.node

	        function createLineBreak() {
	            var node = document.createElement('p')
	            node.appendChild(document.createElement('br'))
	            return node
	        }

	        function traverse(root) {
	            var i = 0, node;
	            while(node = root.children[i++]) {
	                if (node.tagName === 'FIGURE' &&
	                    !node.nextElementSibling) {
	                    var newNode = createLineBreak()
	                    nodeHelpers.insertAfter(newNode, node)
	                }
	            }
	        }

	        // make sure that every figure has a nextElementSibling
	        scribe.registerHTMLFormatter('normalize', function(html) {
	            var bin = document.createElement('div')
	            bin.innerHTML = html
	            traverse(bin)
	            return bin.innerHTML
	        })

	        // place caret on nextElementSibling if press enter on figcaption
	        scribe.el.addEventListener('keydown', function(e) {
	            if (e.keyCode === 13) { // enter
	                var selection = new scribe.api.Selection()
	                var range = selection.range
	                var captionNode = selection.getContaining(function(node) {
	                    return node.nodeName === 'FIGCAPTION'
	                })
	                if (captionNode && range.collapsed) {
	                    e.preventDefault()
	                    scribe.transactionManager.run(function() {
	                        var figureNode = captionNode.parentNode,
	                            pNode

	                        var contentToStartRange = range.cloneRange()
	                        contentToStartRange.setStartBefore(captionNode, 0)
	                        var contentToStartFragment = contentToStartRange.cloneContents()
	                        var shouldMoveBackward = contentToStartFragment.firstChild.textContent === '' && captionNode.textContent !== ''

	                        if (shouldMoveBackward) {
	                            pNode = createLineBreak()
	                            figureNode.parentNode.insertBefore(pNode, figureNode)
	                        } else {
	                            pNode = figureNode.nextElementSibling
	                            if (!pNode || pNode.tagName !== 'P') {
	                                pNode = createLineBreak()
	                                nodeHelpers.insertAfter(pNode, captionNode.parentNode)
	                            }
	                        }
	                        range.setStart(pNode, 0)
	                        range.setEnd(pNode, 0)
	                        selection.selection.removeAllRanges()
	                        selection.selection.addRange(range)
	                    })
	                }
	            }
	        })
	    }
	}


/***/ },
/* 112 */
/***/ function(module, exports) {

	module.exports = function() {
	    return function(scribe) {

	        var TEMPLATE = '<figure contenteditable="false"><img src="{{ image_url }}" onload="stenoResizeImage(this)" /><figcaption contenteditable placeholder="{{ placeholder }}">{{ caption }}</figcaption></figure>'

	        var nodeHelpers = scribe.node

	        var insertFigureCommand = new scribe.api.SimpleCommand('figure', 'FIGURE')

	        insertFigureCommand.execute = function(image, callback) {
	            // TODO: image protocol validate
	            if (!image) { return }
	            var html = TEMPLATE.replace(/{{\s*(\w+)\s*}}/g, function(_, key) {
	                return image[key]
	            })

	            var figureElement = (function(str) {
	                var div = document.createElement('div')
	                div.innerHTML = str
	                return div.firstChild
	            })(html)

	            var selection = new scribe.api.Selection()
	            var range = selection.range
	            // surround p if p is empty
	            // var ancestor = range.commonAncestorContainer
	            // if (ancestor && !nodeHelpers.isText(ancestor) && nodeHelpers.isEmptyInlineElement(ancestor)) {

	            if (selection.isCaretOnNewLine()) {
	                // range.surroundContents(range.commonAncestorContainer)
	                // surroundContents may throw exception "The node provided contains the insertion point; it may not be inserted into itself."
	                // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/Range.cpp  L1248
	                range.setStartBefore(range.commonAncestorContainer)
	                range.setEndAfter(range.commonAncestorContainer)
	            }
	            range.insertNode(figureElement)

	            callback && callback(figureElement)
	        }

	        window.stenoResizeImage = function(image) {
	            image.height = Math.floor(image.height / 32) * 32
	        }

	        scribe.commands.figure = insertFigureCommand
	    }
	}


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var StenoBar = __webpack_require__(114)

	module.exports = function() {
	    return function(scribe) {
	        var menuElement = document.querySelector('.steno-menu')
	        var menu = new StenoBar(menuElement)

	        var stenoFileInput = document.querySelector('#stenoFileInput')
	        stenoFileInput.addEventListener('change', function(e) {
	            var command = scribe.getCommand(stenoFileInput.dataset.command)
	            var selection = new scribe.api.Selection()
	            scribe.el.focus()

	            var file = stenoFileInput.files[0]
	            var fileType = /image.*/

	            if (file.type.match(fileType)) {
	                var reader = new FileReader()
	                reader.onload = function(e) {
	                    // insertImage(reader.result)
	                    command.execute({
	                        image_url: reader.result,
	                        caption: '',
	                        placeholder: '给图片写点文字'
	                    }, function(figureElement) {
	                        // focus on figcaption & hide menu
	                        var newRange = document.createRange()
	                        var figcaption = figureElement.querySelector('figcaption')
	                        newRange.setStart(figcaption, 0)
	                        newRange.setEnd(figcaption, 0)
	                        selection.selection.removeAllRanges()
	                        selection.selection.addRange(newRange)
	                    })
	                }
	                // reader.onload = insertImage.bind(this, reader.result)
	                reader.readAsDataURL(file)
	            }
	        })

	        // var buttons = menuElement.querySelectorAll('[data-command]')
	        // Array.prototype.forEach.call(buttons, function(button) {
	        //     button.addEventListener('click', function() {
	        //         var command = scribe.getCommand(button.dataset.command)
	        //
	        //         var selection = new scribe.api.Selection()
	        //
	        //         scribe.el.focus()
	        //
	        //         command.execute({
	        //             image_url: 'http://7d9o0k.com1.z0.glb.clouddn.com/little_forest.jpg',
	        //             caption: '',
	        //             placeholder: '给图片写点文字'
	        //         }, function(figureElement) {
	        //             // focus on figcaption & hide menu
	        //             var newRange = document.createRange()
	        //             var figcaption = figureElement.querySelector('figcaption')
	        //             newRange.setStart(figcaption, 0)
	        //             newRange.setEnd(figcaption, 0)
	        //             selection.selection.removeAllRanges()
	        //             selection.selection.addRange(newRange)
	        //         })
	        //     })
	        // })


	        function toggleMenu(e) {
	            var selection = new scribe.api.Selection(),
	                anchorNode = selection.selection.anchorNode,
	                isCaretOnNewLine = anchorNode && anchorNode.nodeType === 1 && anchorNode.tagName === 'P' && anchorNode.innerHTML === '<br>'

	            if (isCaretOnNewLine) {
	                menu.show()
	                menuElement.style.top = (anchorNode.offsetTop - 8) + 'px' // 8 = 0.5em
	            } else if (scribe.el.textContent === '' && scribe.el.childNodes[0].tagName === 'P') { // empty scribe
	                menuElement.classList.add('is-visible')
	                menuElement.style.top = 0
	            } else {
	                hideMenu()
	            }
	        }

	        function hideMenu() {
	            menu.hide()
	        }

	        scribe.el.addEventListener('mouseup', toggleMenu)
	        scribe.el.addEventListener('keyup', toggleMenu)
	        scribe.el.addEventListener('focus', toggleMenu)
	        scribe.el.addEventListener('blur', hideMenu)
	    }
	}


/***/ },
/* 114 */
/***/ function(module, exports) {

	// the base class of steno-menu & steno-toolbar
	function StenoBar(element) {
	    this.element = element
	    this.element.addEventListener('transitionend', function() {
	        if (!this.element.classList.contains('is-visible')) {
	            this.element.classList.add('is-hidden')
	        }
	    }.bind(this))
	}
	StenoBar.prototype = {
	    constructor: StenoBar,
	    show: function() {
	        this.element.classList.remove('is-hidden')
	        setTimeout(function() {
	            this.element.classList.add('is-visible')
	        }.bind(this), 0)
	    },
	    hide: function() {
	        this.element.classList.remove('is-visible')
	    }
	}
	module.exports = StenoBar


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	var StenoBar = __webpack_require__(114),
	    saveSelection = __webpack_require__(116).saveSelection,
	    restoreSelection = __webpack_require__(116).restoreSelection

	module.exports = function() {
	    return function(scribe) {
	        var toolbarNode = document.querySelector('.steno-toolbar'),
	            toolbar = new StenoBar(toolbarNode),
	            toolbarLink = toolbarNode.querySelector('.steno-toolbar-link'),
	            toolbarLinkInput = toolbarLink.querySelector('input'),
	            toolbarButtons = toolbarNode.querySelector('.steno-toolbar-buttons'),
	            forEach = Array.prototype.forEach

	        // TODO: separate link feature into a plugin
	        var createLinkCommand = scribe.getCommand('createLink')
	        createLinkCommand.queryState = function() {
	            var selection = new scribe.api.Selection()
	            return !! selection.getContaining(function (node) {
	                return node.nodeName === 'A'
	            })
	        }

	        var buttons = toolbarNode.querySelectorAll('[data-command]')
	        var savedSel
	        forEach.call(buttons, function(button) {
	            button.addEventListener('click', function() {
	                var commandName = button.dataset.command
	                var command = scribe.getCommand(commandName)
	                if (commandName === 'createLink') {
	                    scribe.el.focus()
	                    savedSel = saveSelection()
	                    displayLinkEditor()
	                } else {
	                    scribe.el.focus()
	                    command.execute()
	                }
	            })
	        })
	        toolbarLinkInput.addEventListener('keydown', function(e) {
	            if (e.keyCode === 13) {
	                e.preventDefault()
	                var createLinkCommand = scribe.getCommand('createLink'),
	                    unlinkCommand = scribe.getCommand('unlink')
	                if (toolbarLinkInput.value.trim().length) {
	                    if (savedSel) {
	                        restoreSelection(savedSel)
	                        createLinkCommand.execute(toolbarLinkInput.value)

	                        // remove selection so that toolbar will not display after hiding
	                        var selection = new scribe.api.Selection()
	                        selection.selection.removeAllRanges()
	                        toolbar.hide()
	                    }
	                } else {
	                    if (savedSel) {
	                        restoreSelection(savedSel)
	                        unlinkCommand.execute()
	                    }
	                }
	            }
	        })
	        function displayLinkEditor(url) {
	            toolbarLink.classList.remove('is-hidden')
	            toolbarButtons.classList.add('is-hidden')
	            var input = toolbarLink.querySelector('input')
	            url = url || ''
	            input.value = url
	            input.focus()
	        }
	        function hideLinkEditor() {
	            toolbarLink.classList.add('is-hidden')
	            toolbarButtons.classList.remove('is-hidden')
	        }

	        function toggleToolbar(e) {
	            // setTimeout in case range is to be collapsed right after event fired
	            // example: select all text, click to collapse range
	            setTimeout(function() {
	                var selection = new scribe.api.Selection(),
	                    range = selection.range
	                if(range && !range.collapsed) {
	                    toolbar.show()
	                    forEach.call(buttons, function(button) {
	                        var cmdName = button.dataset.command
	                        var cmd = scribe.getCommand(cmdName)

	                        if (selection.range && cmdName === 'createLink' && cmd.queryState()) {
	                            var anchorNode = selection.getContaining(function (node) {
	                                return node.nodeName === 'A'
	                            })
	                            if (anchorNode) {
	                                range.selectNode(anchorNode)
	                                selection.selection.removeAllRanges()
	                                selection.selection.addRange(range)
	                                savedSel = saveSelection()
	                            }
	                            displayLinkEditor(anchorNode? anchorNode.href: undefined)
	                        } else {
	                            hideLinkEditor()
	                            if (selection.range && cmd.queryState(cmdName)) {
	                                button.classList.add('is-active')
	                            } else {
	                                button.classList.remove('is-active')
	                            }
	                        }
	                    })
	                    var rect = range.getBoundingClientRect(),
	                        parentRect = scribe.el.getBoundingClientRect(),
	                        toolbarRect = toolbarNode.getBoundingClientRect()
	                    toolbarNode.style.left = rect.left - parentRect.left + rect.width/2 - toolbarRect.width/2 + 'px'
	                    toolbarNode.style.top = rect.top - parentRect.top - toolbarRect.height - 20 + 'px'
	                } else {
	                    toolbar.hide()
	                }
	            }, 0)
	        }

	        scribe.el.addEventListener('mouseup', toggleToolbar)
	        scribe.el.addEventListener('keyup', toggleToolbar)
	        scribe.on('content-changed', toggleToolbar)
	    }
	}


/***/ },
/* 116 */
/***/ function(module, exports) {

	function saveSelection() {
	    if (window.getSelection) {
	        var sel = window.getSelection();
	        if (sel.getRangeAt && sel.rangeCount) {
	            var ranges = [];
	            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
	                ranges.push(sel.getRangeAt(i));
	            }
	            return ranges;
	        }
	    } else if (document.selection && document.selection.createRange) {
	        return document.selection.createRange();
	    }
	    return null;
	}

	function restoreSelection(savedSel) {
	    if (savedSel) {
	        if (window.getSelection) {
	            var sel = window.getSelection();
	            sel.removeAllRanges();
	            for (var i = 0, len = savedSel.length; i < len; ++i) {
	                sel.addRange(savedSel[i]);
	            }
	        } else if (document.selection && savedSel.select) {
	            savedSel.select();
	        }
	    }
	}
	module.exports = {
	    saveSelection: saveSelection,
	    restoreSelection: restoreSelection
	}


/***/ },
/* 117 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }
/******/ ]);