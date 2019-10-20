(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AutoComposeTextarea = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var ensure = function ensure(context, object, keys) {
    [].concat(keys).forEach(function (key) {
        if (typeof object[key] === 'undefined') {
            throw new Error('AutoCompose: Missing required parameter, ' + context + '.' + key);
        }
    });
};



var ensureType = function ensureType(context, object, key, type) {
    [].concat(object[key]).forEach(function (value) {
        var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
        if (valueType !== type && valueType !== 'undefined') {
            throw new TypeError('AutoCompose: Invalid Type for ' + context + '.' + key + ', expected ' + type);
        }
    });
};

var getCursorPosition = function getCursorPosition(input) {
    return [input.selectionStart, input.selectionEnd].sort(function (a, b) {
        return a - b;
    });
};



var data = function data(element, key, value) {
    key = 'autosuggest_' + key;
    if (typeof value !== 'undefined') {
        element.dataset[key] = JSON.stringify(value);
    } else {
        value = element.dataset[key];
        return typeof value !== 'undefined' ? JSON.parse(element.dataset[key]) : value;
    }
};

var getScrollbarWidth = function getScrollbarWidth() {
    // Creating invisible container
    var outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    var inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    var scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
};

// Invisible character
var POSITIONER_CHARACTER = '\uFEFF';

var FONT_PROPERTIES = [
// https://developer.mozilla.org/en-US/docs/Web/CSS/font
'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', // might not make a difference, but better be safe

'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize', 'whiteSpace', 'wordWrap', 'wordBreak'];

var HOST_PROPERTIES = [].concat(FONT_PROPERTIES, ['direction', 'boxSizing', 'borderRightWidth', 'borderLeftWidth', 'paddingRight', 'paddingLeft']);

var CLONE_PROPERTIES = [].concat(toConsumableArray(HOST_PROPERTIES), ['width', 'overflowX', 'overflowY', 'borderTopWidth', 'borderBottomWidth', 'borderStyle', 'paddingTop', 'paddingBottom', 'lineHeight']);

var FILLER = ' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;';

var getGlobalOffset = function getGlobalOffset($0) {
    var node = $0,
        top = 0,
        left = 0;

    do {
        left += node.offsetLeft;
        top += node.offsetTop;
    } while (node = node.offsetParent);

    return { left: left, top: top };
};



var createNode = function createNode(html) {
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
};

var scrollBarWidth = void 0;

var OverlaySuggestion = function () {
    function OverlaySuggestion() {
        classCallCheck(this, OverlaySuggestion);

        if (scrollBarWidth === undefined) scrollBarWidth = getScrollbarWidth();

        this.isEmpty = true;
        this.isActive = false;
        this.suggestion = '';

        this.host = document.createElement('div');
        this.host.className = 'autocompose-overlay-suggestion';
        this.host.style.zIndex = 9999;
        this.host.style.cursor = 'text';
        this.host.style.position = 'absolute';
        this.host.style.borderColor = 'transparent';
        this.host.style.backgroundColor = 'transparent';
        this.host.style.overflow = 'hidden';
        this.host.style.pointerEvents = 'none';

        this.offset = document.createElement('div');
        this.offset.appendChild(document.createTextNode(POSITIONER_CHARACTER));
        this.offset.style.lineHeight = 1.5;

        this.content = document.createElement('div');
        this.content.style.lineHeight = '1px';

        this.hide();
        document.body.appendChild(this.host);
        this.host.appendChild(this.offset);
        this.host.appendChild(this.content);
    }

    createClass(OverlaySuggestion, [{
        key: 'show',
        value: function show(position, element) {
            var _this = this;

            if (position) {
                var elementPosition = getGlobalOffset(element);
                var elementStyles = window.getComputedStyle(element);

                HOST_PROPERTIES.forEach(function (prop) {
                    _this.host.style[prop] = elementStyles[prop];
                });
                this.host.style.left = elementPosition.left + 'px';
                this.host.style.top = position.top + 'px';
                this.host.style.height = parseFloat(elementStyles.height) - position.top + elementPosition.top + 'px';
                this.host.style.color = elementStyles.color;

                var overlayWidth = parseFloat(elementStyles.width) - scrollBarWidth;
                this.host.style.width = overlayWidth + 'px';

                var leftWidth = position.left - elementPosition.left - parseFloat(elementStyles.paddingLeft || 0);
                var rightWidth = overlayWidth - position.left + elementPosition.left - parseFloat(elementStyles.paddingRight || 0);
                var firstLineWidth = 0;
                if (elementStyles.direction === 'ltr') {
                    this.offset.style.float = 'left';
                    this.offset.style.width = leftWidth + 'px';
                    firstLineWidth = rightWidth;
                } else {
                    this.offset.style.float = 'right';
                    this.offset.style.width = rightWidth + 'px';
                    firstLineWidth = leftWidth;
                }

                var span = document.createElement('span');
                span.style.whiteSpace = 'nowrap';
                FONT_PROPERTIES.forEach(function (prop) {
                    span.style[prop] = elementStyles[prop];
                });

                span.appendChild(createNode('<span>&nbsp;</span>'));
                span.firstChild.style.fontSize = '1px';

                var textNode = document.createTextNode('');
                span.appendChild(textNode);

                document.body.appendChild(span);

                var crossed = false,
                    lastSpaceAt = -1;
                var suggestionLength = this.suggestion.length;
                for (var i = 0; i < suggestionLength; i++) {
                    if (!crossed) {
                        var text = this.suggestion[i];
                        if (/\s/.test(text)) lastSpaceAt = i;
                        textNode.nodeValue += this.suggestion[i];
                        crossed = span.offsetWidth > firstLineWidth;
                        if (crossed) {
                            for (var j = lastSpaceAt + 2; j <= i; j++) {
                                this.content.childNodes[j].style.lineHeight = elementStyles.lineHeight;
                            }
                        }
                    }
                    if (crossed) {
                        this.content.childNodes[i + 1].style.lineHeight = elementStyles.lineHeight;
                    }
                }
                if (crossed) {
                    this.content.lastChild.style.lineHeight = elementStyles.lineHeight;
                }
                document.body.removeChild(span);
            }

            this.host.style.display = 'block';
            this.isActive = true;
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.host.style.display = 'none';
            this.isActive = false;
        }
    }, {
        key: 'empty',
        value: function empty() {
            this.isEmpty = true;
            while (this.content.firstChild) {
                this.content.removeChild(this.content.firstChild);
            }
        }
    }, {
        key: 'fill',
        value: function fill(suggestion, onSet) {
            var _this2 = this;

            this.empty();
            this.suggestion = suggestion;

            this.content.appendChild(createNode('<span>&nbsp;</span>'));
            this.content.firstChild.style.fontSize = '1px';

            suggestion.split('').concat(FILLER).forEach(function (char, i) {
                var charNode = createNode('<span>' + char + '</span>');
                charNode.style.opacity = 0.7;
                charNode.style.lineHeight = 1.5;
                charNode.style.pointerEvents = 'all';
                _this2.content.appendChild(charNode);

                charNode.addEventListener('mousedown', function (e) {
                    onSet(suggestion.slice(0, i + 1));
                    _this2.hide();

                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            this.isEmpty = false;
        }
    }, {
        key: 'getValue',
        value: function getValue() {
            return this.suggestion;
        }
    }]);
    return OverlaySuggestion;
}();

function getCaretPosition(element) {
    var _getCursorPosition = getCursorPosition(element),
        _getCursorPosition2 = slicedToArray(_getCursorPosition, 1),
        cursorPosition = _getCursorPosition2[0];

    // pre to retain special characters


    var clone = document.createElement('pre');
    clone.id = 'autocompose-positionclone';

    var positioner = document.createElement('span');
    positioner.appendChild(document.createTextNode(POSITIONER_CHARACTER));

    var computed = window.getComputedStyle(element);
    CLONE_PROPERTIES.forEach(function (prop) {
        clone.style[prop] = computed[prop];
    });

    var elementPosition = getGlobalOffset(element);
    clone.style.opacity = 0;
    clone.style.position = 'absolute';
    clone.style.top = elementPosition.top + 'px';
    clone.style.left = elementPosition.left + 'px';
    document.body.appendChild(clone);

    if (element.scrollHeight > parseInt(computed.height)) clone.style.overflowY = 'scroll';else clone.style.overflowY = 'hidden';

    clone.appendChild(document.createTextNode(element.value.slice(0, cursorPosition)));
    clone.appendChild(positioner);
    clone.style.maxWidth = '100%';

    var caretPosition = getGlobalOffset(positioner);
    caretPosition.top -= element.scrollTop;
    caretPosition.left -= element.scrollLeft;
    document.body.removeChild(clone);
    return caretPosition;
}

var setValue = function setValue(_ref) {
    var element = _ref.element,
        suggestion = _ref.suggestion,
        fullSuggestion = _ref.fullSuggestion,
        onChange = _ref.onChange;

    var _getCursorPosition3 = getCursorPosition(element),
        _getCursorPosition4 = slicedToArray(_getCursorPosition3, 1),
        startPosition = _getCursorPosition4[0];

    var originalValue = element.value;
    var value = originalValue.slice(0, startPosition) + suggestion;

    element.value = value + originalValue.slice(startPosition);
    element.focus();

    var cursorPosition = value.length;
    element.setSelectionRange(cursorPosition, cursorPosition);
    onChange({ suggestion: fullSuggestion, acceptedSuggestion: suggestion });
};

var AutoComposeTextarea = function () {
    function AutoComposeTextarea(options) {
        classCallCheck(this, AutoComposeTextarea);

        if (!options) {
            throw new Error('AutoCompose Textarea: Missing required parameter, options');
        }

        if (typeof options === 'function') options = { composer: options };

        this.inputs = [];
        this.suggestion = new OverlaySuggestion();
        this.onChange = options.onChange || Function.prototype;
        this.onReject = options.onReject || Function.prototype;

        ensure('AutoCompose Textarea', options, 'composer');
        ensureType('AutoCompose Textarea', options, 'composer', 'function');
        this.composer = options.composer;

        events: {
            var self = this;
            var handledInKeyDown = false;

            this.onBlurHandler = function () {
                self.suggestion.hide();
            };

            this.onKeyDownHandler = function (e) {
                if (self.suggestion.isActive) {
                    if (e.keyCode === 9 || e.keyCode === 39 || e.keyCode === 40) {
                        var fullSuggestion = self.suggestion.getValue();
                        setValue({
                            element: this,
                            fullSuggestion: fullSuggestion,
                            suggestion: fullSuggestion,
                            onChange: self.onChange.bind(this)
                        });

                        self.suggestion.hide();
                        handledInKeyDown = true;
                        e.preventDefault();
                    }
                }
            };

            var keyUpIndex = 0;
            this.onKeyUpHandler = function (e) {
                var _this = this;

                if (handledInKeyDown) {
                    handledInKeyDown = false;
                    return;
                }

                if (self.suggestion.isActive) {
                    self.suggestion.hide();
                    self.onReject({ suggestion: self.suggestion.getValue() });
                }

                var _getCursorPosition5 = getCursorPosition(this),
                    _getCursorPosition6 = slicedToArray(_getCursorPosition5, 2),
                    startPosition = _getCursorPosition6[0],
                    endPosition = _getCursorPosition6[1];

                if (startPosition !== endPosition) return;

                var postValue = this.value.slice(startPosition);
                if (postValue.trim()) return;
                var preValue = this.value.slice(0, startPosition);

                handlesuggestion: {
                    keyUpIndex++;

                    var caretPosition = getCaretPosition(this);
                    (function (asyncReference) {
                        self.composer.call(_this, preValue, function (result) {
                            if (!result || asyncReference !== keyUpIndex) return;

                            self.suggestion.fill(result, function (suggestion) {
                                setValue({
                                    element: _this,
                                    suggestion: suggestion,
                                    fullSuggestion: result,
                                    onChange: self.onChange.bind(_this)
                                });
                            });

                            self.suggestion.show(caretPosition, _this);
                        });
                    })(keyUpIndex);
                }
            };
        }

        // initialize events on inputs

        for (var _len = arguments.length, inputs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            inputs[_key - 1] = arguments[_key];
        }

        this.addInputs.apply(this, inputs);
    }

    createClass(AutoComposeTextarea, [{
        key: 'addInputs',
        value: function addInputs() {
            var _this2 = this;

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            var inputs = Array.prototype.concat.apply([], args.map(function (d) {
                return d[0] ? Array.prototype.slice.call(d, 0) : d;
            }));

            inputs.forEach(function (input) {
                // validate element
                if (input.tagName !== 'TEXTAREA') {
                    throw new Error('AutoCompose Textarea: Invalid input: only textarea elements are supported');
                }

                // init events
                input.addEventListener('blur', _this2.onBlurHandler);
                input.addEventListener('keyup', _this2.onKeyUpHandler);
                input.addEventListener('mouseup', _this2.onKeyUpHandler);
                input.addEventListener('keydown', _this2.onKeyDownHandler, true);

                data(input, 'index', _this2.inputs.push(input) - 1);
            });
        }
    }, {
        key: 'removeInputs',
        value: function removeInputs() {
            var _this3 = this;

            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            var inputs = Array.prototype.concat.apply([], args.map(function (d) {
                return d[0] ? Array.prototype.slice.call(d, 0) : d;
            }));

            inputs.forEach(function (input) {
                var index = data(input, 'index');
                if (!isNaN(index)) {
                    _this3.inputs.splice(index, 1);

                    // destroy events
                    input.removeEventListener('blur', _this3.onBlurHandler);
                    input.removeEventListener('keyup', _this3.onKeyUpHandler);
                    input.removeEventListener('mouseup', _this3.onKeyUpHandler);
                    input.removeEventListener('keydown', _this3.onKeyDownHandler, true);
                }
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.removeInputs(this.inputs);
        }
    }]);
    return AutoComposeTextarea;
}();

return AutoComposeTextarea;

})));
//# sourceMappingURL=AutoComposeTextarea.js.map
