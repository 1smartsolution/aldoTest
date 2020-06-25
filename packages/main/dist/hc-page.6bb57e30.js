// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../../../node_modules/loadjs/dist/loadjs.umd.js":[function(require,module,exports) {
var define;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.loadjs = factory();
  }
}(this, function() {
/**
 * Global dependencies.
 * @global {Object} document - DOM
 */

var devnull = function() {},
    bundleIdCache = {},
    bundleResultCache = {},
    bundleCallbackQueue = {};


/**
 * Subscribe to bundle load event.
 * @param {string[]} bundleIds - Bundle ids
 * @param {Function} callbackFn - The callback function
 */
function subscribe(bundleIds, callbackFn) {
  // listify
  bundleIds = bundleIds.push ? bundleIds : [bundleIds];

  var depsNotFound = [],
      i = bundleIds.length,
      numWaiting = i,
      fn,
      bundleId,
      r,
      q;

  // define callback function
  fn = function (bundleId, pathsNotFound) {
    if (pathsNotFound.length) depsNotFound.push(bundleId);

    numWaiting--;
    if (!numWaiting) callbackFn(depsNotFound);
  };

  // register callback
  while (i--) {
    bundleId = bundleIds[i];

    // execute callback if in result cache
    r = bundleResultCache[bundleId];
    if (r) {
      fn(bundleId, r);
      continue;
    }

    // add to callback queue
    q = bundleCallbackQueue[bundleId] = bundleCallbackQueue[bundleId] || [];
    q.push(fn);
  }
}


/**
 * Publish bundle load event.
 * @param {string} bundleId - Bundle id
 * @param {string[]} pathsNotFound - List of files not found
 */
function publish(bundleId, pathsNotFound) {
  // exit if id isn't defined
  if (!bundleId) return;

  var q = bundleCallbackQueue[bundleId];

  // cache result
  bundleResultCache[bundleId] = pathsNotFound;

  // exit if queue is empty
  if (!q) return;

  // empty callback queue
  while (q.length) {
    q[0](bundleId, pathsNotFound);
    q.splice(0, 1);
  }
}


/**
 * Execute callbacks.
 * @param {Object or Function} args - The callback args
 * @param {string[]} depsNotFound - List of dependencies not found
 */
function executeCallbacks(args, depsNotFound) {
  // accept function as argument
  if (args.call) args = {success: args};

  // success and error callbacks
  if (depsNotFound.length) (args.error || devnull)(depsNotFound);
  else (args.success || devnull)(args);
}


/**
 * Load individual file.
 * @param {string} path - The file path
 * @param {Function} callbackFn - The callback function
 */
function loadFile(path, callbackFn, args, numTries) {
  var doc = document,
      async = args.async,
      maxTries = (args.numRetries || 0) + 1,
      beforeCallbackFn = args.before || devnull,
      pathname = path.replace(/[\?|#].*$/, ''),
      pathStripped = path.replace(/^(css|img)!/, ''),
      isLegacyIECss,
      e;

  numTries = numTries || 0;

  if (/(^css!|\.css$)/.test(pathname)) {
    // css
    e = doc.createElement('link');
    e.rel = 'stylesheet';
    e.href = pathStripped;

    // tag IE9+
    isLegacyIECss = 'hideFocus' in e;

    // use preload in IE Edge (to detect load errors)
    if (isLegacyIECss && e.relList) {
      isLegacyIECss = 0;
      e.rel = 'preload';
      e.as = 'style';
    }
  } else if (/(^img!|\.(png|gif|jpg|svg|webp)$)/.test(pathname)) {
    // image
    e = doc.createElement('img');
    e.src = pathStripped;    
  } else {
    // javascript
    e = doc.createElement('script');
    e.src = path;
    e.async = async === undefined ? true : async;
  }

  e.onload = e.onerror = e.onbeforeload = function (ev) {
    var result = ev.type[0];

    // treat empty stylesheets as failures to get around lack of onerror
    // support in IE9-11
    if (isLegacyIECss) {
      try {
        if (!e.sheet.cssText.length) result = 'e';
      } catch (x) {
        // sheets objects created from load errors don't allow access to
        // `cssText` (unless error is Code:18 SecurityError)
        if (x.code != 18) result = 'e';
      }
    }

    // handle retries in case of load failure
    if (result == 'e') {
      // increment counter
      numTries += 1;

      // exit function and try again
      if (numTries < maxTries) {
        return loadFile(path, callbackFn, args, numTries);
      }
    } else if (e.rel == 'preload' && e.as == 'style') {
      // activate preloaded stylesheets
      return e.rel = 'stylesheet'; // jshint ignore:line
    }
    
    // execute callback
    callbackFn(path, result, ev.defaultPrevented);
  };

  // add to document (unless callback returns `false`)
  if (beforeCallbackFn(path, e) !== false) doc.head.appendChild(e);
}


/**
 * Load multiple files.
 * @param {string[]} paths - The file paths
 * @param {Function} callbackFn - The callback function
 */
function loadFiles(paths, callbackFn, args) {
  // listify paths
  paths = paths.push ? paths : [paths];

  var numWaiting = paths.length,
      x = numWaiting,
      pathsNotFound = [],
      fn,
      i;

  // define callback function
  fn = function(path, result, defaultPrevented) {
    // handle error
    if (result == 'e') pathsNotFound.push(path);

    // handle beforeload event. If defaultPrevented then that means the load
    // will be blocked (ex. Ghostery/ABP on Safari)
    if (result == 'b') {
      if (defaultPrevented) pathsNotFound.push(path);
      else return;
    }

    numWaiting--;
    if (!numWaiting) callbackFn(pathsNotFound);
  };

  // load scripts
  for (i=0; i < x; i++) loadFile(paths[i], fn, args);
}


/**
 * Initiate script load and register bundle.
 * @param {(string|string[])} paths - The file paths
 * @param {(string|Function|Object)} [arg1] - The (1) bundleId or (2) success
 *   callback or (3) object literal with success/error arguments, numRetries,
 *   etc.
 * @param {(Function|Object)} [arg2] - The (1) success callback or (2) object
 *   literal with success/error arguments, numRetries, etc.
 */
function loadjs(paths, arg1, arg2) {
  var bundleId,
      args;

  // bundleId (if string)
  if (arg1 && arg1.trim) bundleId = arg1;

  // args (default is {})
  args = (bundleId ? arg2 : arg1) || {};

  // throw error if bundle is already defined
  if (bundleId) {
    if (bundleId in bundleIdCache) {
      throw "LoadJS";
    } else {
      bundleIdCache[bundleId] = true;
    }
  }

  function loadFn(resolve, reject) {
    loadFiles(paths, function (pathsNotFound) {
      // execute callbacks
      executeCallbacks(args, pathsNotFound);
      
      // resolve Promise
      if (resolve) {
        executeCallbacks({success: resolve, error: reject}, pathsNotFound);
      }

      // publish bundle load event
      publish(bundleId, pathsNotFound);
    }, args);
  }
  
  if (args.returnPromise) return new Promise(loadFn);
  else loadFn();
}


/**
 * Execute callbacks when dependencies have been satisfied.
 * @param {(string|string[])} deps - List of bundle ids
 * @param {Object} args - success/error arguments
 */
loadjs.ready = function ready(deps, args) {
  // subscribe to bundle load event
  subscribe(deps, function (depsNotFound) {
    // execute callbacks
    executeCallbacks(args, depsNotFound);
  });

  return loadjs;
};


/**
 * Manually satisfy bundle dependencies.
 * @param {string} bundleId - The bundle id
 */
loadjs.done = function done(bundleId) {
  publish(bundleId, []);
};


/**
 * Reset loadjs dependencies statuses
 */
loadjs.reset = function reset() {
  bundleIdCache = {};
  bundleResultCache = {};
  bundleCallbackQueue = {};
};


/**
 * Determine if bundle has already been defined
 * @param String} bundleId - The bundle id
 */
loadjs.isDefined = function isDefined(bundleId) {
  return bundleId in bundleIdCache;
};


// export
return loadjs;

}));

},{}],"../../../node_modules/react-twitter-widgets/es/utils.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.twLoad = twLoad;
exports.twWidgetFactory = twWidgetFactory;
exports.removeChildrenWithAttribute = removeChildrenWithAttribute;
exports.useShallowCompareMemoize = useShallowCompareMemoize;
exports.cloneShallow = cloneShallow;
exports.canUseDOM = void 0;

var _loadjs = _interopRequireDefault(require("loadjs"));

var _react = require("react");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

var twScriptUrl = "https://platform.twitter.com/widgets.js";
var twScriptWindowFieldName = "twttr";
var twScriptName = twScriptWindowFieldName;
var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
exports.canUseDOM = canUseDOM;

function twLoad() {
  (0, _loadjs.default)(twScriptUrl, twScriptName);
}

function twWidgetFactory() {
  return new Promise(function (resolve, reject) {
    var rejectWithError = function rejectWithError() {
      return reject(new Error("Could not load remote twitter widgets js"));
    };

    _loadjs.default.ready(twScriptName, {
      success: function success() {
        // Ensure loaded
        var twttr = window[twScriptWindowFieldName];

        if (!twttr || !twttr.widgets) {
          rejectWithError();
        }

        resolve(twttr.widgets);
      },
      error: rejectWithError
    });
  });
}

function removeChildrenWithAttribute(node, attribute) {
  if (node) {
    node.querySelectorAll("*").forEach(function (child) {
      if (child.hasAttribute(attribute)) {
        child.remove();
      }
    });
  }
}

function is(x, y) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

function isShallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (var i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

function useShallowCompareMemoize(value) {
  var ref = (0, _react.useRef)();

  if (!isShallowEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function cloneShallow(value) {
  return typeof value === "object" ? _extends({}, value) : value;
}
},{"loadjs":"../../../node_modules/loadjs/dist/loadjs.umd.js","react":"../../../node_modules/react/index.js"}],"../../../node_modules/react-twitter-widgets/es/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tweet = exports.Timeline = exports.Share = exports.Mention = exports.Hashtag = exports.Follow = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _react = _interopRequireWildcard(require("react"));

var _utils = require("./utils");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

if (_utils.canUseDOM) {
  (0, _utils.twLoad)();
}

var childDivIdentifyingAttribute = "twdiv";

function useTwitterWidget(factoryFunctionName, primaryArg, options, onLoad) {
  var _useState = (0, _react.useState)(null),
      error = _useState[0],
      setError = _useState[1];

  var ref = (0, _react.useRef)(null); // noop if ssr

  if (!_utils.canUseDOM) {
    return {
      ref: ref,
      error: error
    };
  } // Make deps for useEffect.
  // options, and possibly primaryArg, are objects that should be compared (shallow).
  // There currently aren't any nested arrays or objects, so they
  // can be cloned in a shallow manner.
  // NOTE onLoad is used in useCallback, but it is not listed as a dependency.
  // Listing it would likely cause unnecessary loads. The latest onLoad should be
  // used regardless, since it will not be called unless the other dependencies
  // change, so it works out.


  var deps = [factoryFunctionName, (0, _utils.useShallowCompareMemoize)(primaryArg), (0, _utils.useShallowCompareMemoize)(options)];
  (0, _react.useEffect)(function () {
    // Reset error
    setError(null); // Protect against race conditions
    // (set to true in cleanup function;
    // checked if canceled in async loadWidget)

    var isCanceled = false;

    if (ref.current) {
      var loadWidget = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator.default.mark(function _callee() {
          var childEl, wf, resultMaybe;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!(!ref || !ref.current)) {
                    _context.next = 2;
                    break;
                  }

                  return _context.abrupt("return");

                case 2:
                  childEl = document.createElement("div");
                  childEl.setAttribute(childDivIdentifyingAttribute, "yes");
                  ref.current.appendChild(childEl);
                  _context.prev = 5;
                  _context.next = 8;
                  return (0, _utils.twWidgetFactory)();

                case 8:
                  wf = _context.sent;
                  _context.next = 11;
                  return wf[factoryFunctionName]((0, _utils.cloneShallow)(primaryArg), childEl, (0, _utils.cloneShallow)(options));

                case 11:
                  resultMaybe = _context.sent;

                  if (!(!resultMaybe && !isCanceled)) {
                    _context.next = 14;
                    break;
                  }

                  throw new Error("Twitter could not create widget. If it is a Timeline or " + "Tweet, ensure the screenName/tweetId exists.");

                case 14:
                  _context.next = 21;
                  break;

                case 16:
                  _context.prev = 16;
                  _context.t0 = _context["catch"](5);
                  console.error(_context.t0);
                  setError(_context.t0);
                  return _context.abrupt("return");

                case 21:
                  if (!(!ref || !ref.current)) {
                    _context.next = 23;
                    break;
                  }

                  return _context.abrupt("return");

                case 23:
                  if (!isCanceled) {
                    _context.next = 26;
                    break;
                  }

                  if (childEl) {
                    childEl.remove();
                  }

                  return _context.abrupt("return");

                case 26:
                  if (onLoad) {
                    onLoad();
                  }

                case 27:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[5, 16]]);
        }));

        return function loadWidget() {
          return _ref.apply(this, arguments);
        };
      }();

      (0, _utils.removeChildrenWithAttribute)(ref.current, childDivIdentifyingAttribute);
      loadWidget();
    }

    return function () {
      isCanceled = true;
    };
  }, deps);
  return {
    ref: ref,
    error: error
  };
}

var Follow = function Follow(_ref2) {
  var username = _ref2.username,
      options = _ref2.options,
      onLoad = _ref2.onLoad,
      renderError = _ref2.renderError;

  var _useTwitterWidget = useTwitterWidget("createFollowButton", username, options, onLoad),
      ref = _useTwitterWidget.ref,
      error = _useTwitterWidget.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Follow = Follow;

var Hashtag = function Hashtag(_ref3) {
  var hashtag = _ref3.hashtag,
      options = _ref3.options,
      onLoad = _ref3.onLoad,
      renderError = _ref3.renderError;

  var _useTwitterWidget2 = useTwitterWidget("createHashtagButton", hashtag, options, onLoad),
      ref = _useTwitterWidget2.ref,
      error = _useTwitterWidget2.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Hashtag = Hashtag;

var Mention = function Mention(_ref4) {
  var username = _ref4.username,
      options = _ref4.options,
      onLoad = _ref4.onLoad,
      renderError = _ref4.renderError;

  var _useTwitterWidget3 = useTwitterWidget("createMentionButton", username, options, onLoad),
      ref = _useTwitterWidget3.ref,
      error = _useTwitterWidget3.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Mention = Mention;

var Share = function Share(_ref5) {
  var url = _ref5.url,
      options = _ref5.options,
      onLoad = _ref5.onLoad,
      renderError = _ref5.renderError;

  var _useTwitterWidget4 = useTwitterWidget("createShareButton", url, options, onLoad),
      ref = _useTwitterWidget4.ref,
      error = _useTwitterWidget4.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Share = Share;

var Timeline = function Timeline(_ref6) {
  var dataSource = _ref6.dataSource,
      options = _ref6.options,
      onLoad = _ref6.onLoad,
      renderError = _ref6.renderError;

  var _useTwitterWidget5 = useTwitterWidget("createTimeline", dataSource, options, onLoad),
      ref = _useTwitterWidget5.ref,
      error = _useTwitterWidget5.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Timeline = Timeline;

var Tweet = function Tweet(_ref7) {
  var tweetId = _ref7.tweetId,
      options = _ref7.options,
      onLoad = _ref7.onLoad,
      renderError = _ref7.renderError;

  var _useTwitterWidget6 = useTwitterWidget("createTweet", tweetId, options, onLoad),
      ref = _useTwitterWidget6.ref,
      error = _useTwitterWidget6.error;

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref
  }, error && renderError && renderError(error));
};

exports.Tweet = Tweet;
},{"@babel/runtime/regenerator":"../../../node_modules/@babel/runtime/regenerator/index.js","react":"../../../node_modules/react/index.js","./utils":"../../../node_modules/react-twitter-widgets/es/utils.js"}],"../../../node_modules/@template/layouts/screens/hc-page.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactTwitterWidgets = require("react-twitter-widgets");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HCPage = function HCPage() {
  return /*#__PURE__*/_react.default.createElement("ul", null, /*#__PURE__*/_react.default.createElement(_reactTwitterWidgets.Timeline, {
    dataSource: {
      sourceType: 'profile',
      screenName: 'HillaryClinton'
    },
    options: {
      height: '600'
    }
  }));
};

var _default = HCPage;
exports.default = _default;
},{"react":"../../../node_modules/react/index.js","react-twitter-widgets":"../../../node_modules/react-twitter-widgets/es/index.js"}],"../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "57374" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js"], null)
//# sourceMappingURL=/hc-page.6bb57e30.js.map