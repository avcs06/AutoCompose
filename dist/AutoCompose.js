(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AutoCompose = factory());
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









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// Invisible character


var FONT_PROPERTIES = [
// https://developer.mozilla.org/en-US/docs/Web/CSS/font
'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', // might not make a difference, but better be safe

'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize', 'whiteSpace', 'wordWrap', 'wordBreak'];

var HOST_PROPERTIES = [].concat(FONT_PROPERTIES, ['direction', 'boxSizing', 'borderRightWidth', 'borderLeftWidth', 'paddingRight', 'paddingLeft']);

var CLONE_PROPERTIES = [].concat(toConsumableArray(HOST_PROPERTIES), ['width', 'overflowX', 'overflowY', 'borderTopWidth', 'borderBottomWidth', 'borderStyle', 'paddingTop', 'paddingBottom', 'lineHeight']);



var INLINE_SUGGESTION_ID = '___autocompose_inline_suggestion___';

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





var data = function data(element, key, value) {
    key = 'autosuggest_' + key;
    if (typeof value !== 'undefined') {
        element.dataset[key] = JSON.stringify(value);
    } else {
        value = element.dataset[key];
        return typeof value !== 'undefined' ? JSON.parse(element.dataset[key]) : value;
    }
};

var getSelectedTextNodes = function getSelectedTextNodes() {
    var selection = window.getSelection();
    if (!selection.isCollapsed) return {};

    var _selection$getRangeAt = selection.getRangeAt(0),
        node = _selection$getRangeAt.startContainer,
        offset = _selection$getRangeAt.startOffset;

    if (node.nodeType !== node.TEXT_NODE) {
        try {
            node = getFirstChildNode(node.childNodes[offset]);
            offset = 0;
        } catch (e) {
            try {
                node = getLastChildNode(node.childNodes[offset - 1]);
                offset = node.nodeValue ? node.nodeValue.length : null;
            } catch (e) {}
        }
    }

    return { node: node, offset: offset };
};

var createNode = function createNode(html) {
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
};

var getFirstChildNode = function getFirstChildNode(node) {
    var nextNode = node;
    while (nextNode.firstChild) {
        nextNode = nextNode.firstChild;
    }return nextNode;
};

var getLastChildNode = function getLastChildNode(node) {
    var nextNode = node;
    while (nextNode.lastChild) {
        nextNode = nextNode.lastChild;
    }return nextNode;
};

var getNextNode = function getNextNode(node, root) {
    var nextNode = void 0;
    if (node.nextSibling) nextNode = node.nextSibling;else {
        nextNode = node.parentNode;
        while (nextNode !== root && !nextNode.nextSibling) {
            nextNode = nextNode.parentNode;
        }if (nextNode && nextNode !== root) nextNode = nextNode.nextSibling;else return;
    }

    return getFirstChildNode(nextNode);
};

var getPrevNode = function getPrevNode(node, root) {
    var prevNode = void 0;
    if (node.previousSibling) prevNode = node.previousSibling;else {
        prevNode = node.parentNode;
        while (prevNode !== root && !prevNode.previousSibling) {
            prevNode = prevNode.parentNode;
        }if (prevNode && prevNode !== root) prevNode = prevNode.previousSibling;else return;
    }

    return getLastChildNode(prevNode);
};



var getNodeValue = function getNodeValue(node) {
    if (node.tagName && node.tagName === 'BR') return '\n';
    return node.nodeValue || '';
};

var setSelection = function setSelection(callback) {
    var selection = window.getSelection();
    var range = document.createRange();
    callback(range);
    selection.removeAllRanges();
    selection.addRange(range);
};

var AutoCompose = function () {
    function AutoCompose(options) {
        var _this = this;

        classCallCheck(this, AutoCompose);

        if (!options) throw new Error('AutoCompose: Missing required parameter, options');

        if (typeof options === 'function') options = { composer: options };

        this.inputs = [];
        this.onChange = options.onChange || Function.prototype;
        this.onReject = options.onReject || Function.prototype;

        ensure('AutoCompose', options, 'composer');
        ensureType('AutoCompose', options, 'composer', 'function');
        this.composer = options.composer;

        events: {
            var self = this;
            var handledInKeyDown = false;
            var activeElement = null;
            var suggestionNode = null;
            var activeSuggestion = null;

            var clearSuggestion = function clearSuggestion(normalize) {
                var parentNode = suggestionNode.parentNode;
                parentNode.removeChild(suggestionNode);
                normalize && parentNode.normalize();
                suggestionNode = activeSuggestion = activeElement = null;
            };

            var acceptSuggestion = function acceptSuggestion(ignoreCursor) {
                var suggestion = suggestionNode.firstChild.nodeValue;
                suggestionNode.parentNode.insertBefore(suggestionNode.firstChild, suggestionNode);
                var insertedNode = suggestionNode.previousSibling;

                _this.onChange.call(activeElement, {
                    suggestion: activeSuggestion,
                    acceptedSuggestion: suggestion
                });

                clearSuggestion();
                !ignoreCursor && setSelection(function (range) {
                    range.setStartAfter(insertedNode);
                    range.setEndAfter(insertedNode);
                });
            };

            var rejectSuggestion = function rejectSuggestion() {
                _this.onReject.call(activeElement, { suggestion: activeSuggestion });
                clearSuggestion();
            };

            var isSuggestionTextNode = function isSuggestionTextNode(node) {
                return node.parentNode === suggestionNode;
            };
            var isAfterSuggestionNode = function isAfterSuggestionNode(node) {
                while ((node = getPrevNode(node, activeElement)) && !isSuggestionTextNode(node)) {}
                return Boolean(node);
            };

            this.onBlurHandler = function () {
                return suggestionNode && clearSuggestion(true);
            };
            this.onKeyDownHandler = function (e) {
                if (suggestionNode) {
                    if (e.keyCode === 9 || e.keyCode === 39 || e.keyCode === 40) {
                        acceptSuggestion();
                        handledInKeyDown = true;
                        e.preventDefault();
                    }
                }
            };

            var keyUpIndex = 0;
            this.onKeyUpHandler = function (e) {
                var _this2 = this;

                if (e.type === 'keyup' && handledInKeyDown) {
                    handledInKeyDown = false;
                    return;
                }

                var _getSelectedTextNodes = getSelectedTextNodes(),
                    textNode = _getSelectedTextNodes.node,
                    offset = _getSelectedTextNodes.offset;

                if (!textNode) return suggestionNode && rejectSuggestion();

                var isSuggestionNode = isSuggestionTextNode(textNode);
                if (e.type === 'mouseup' && suggestionNode) {
                    if (isSuggestionNode && offset) {
                        textNode.nodeValue = textNode.nodeValue.slice(0, offset);
                        return acceptSuggestion();
                    } else if (isAfterSuggestionNode(textNode)) {
                        return acceptSuggestion(true);
                    }
                }

                if (isSuggestionNode) {
                    try {
                        textNode = getPrevNode(suggestionNode, this);
                        offset = textNode.nodeValue.length;
                    } catch (e) {
                        textNode = getNextNode(suggestionNode, this);
                        offset = 0;
                    }
                }

                suggestionNode && rejectSuggestion();
                if (textNode.nodeType !== textNode.TEXT_NODE) return;

                postValue: {
                    var postValue = textNode.nodeValue.slice(offset);
                    if (postValue.trim()) return;

                    var node = textNode;
                    while (node = getNextNode(node, this)) {
                        postValue += getNodeValue(node);
                        if (postValue.trim()) return;
                    }
                }

                var preValue = '';
                preValue: {
                    preValue = textNode.nodeValue.slice(0, offset);

                    var _node = textNode;
                    while (_node = getPrevNode(_node, this)) {
                        preValue = getNodeValue(_node) + preValue;
                    }
                }

                handlesuggestion: {
                    keyUpIndex++;
                    (function (asyncReference) {
                        self.composer.call(_this2, preValue, function (result) {
                            if (!result || asyncReference !== keyUpIndex) return;
                            activeElement = _this2;

                            var textAfterCursor = textNode.nodeValue.slice(offset);
                            var parentNode = textNode.parentNode;
                            var referenceNode = textNode.nextSibling;

                            textNode.nodeValue = textNode.nodeValue.slice(0, offset);
                            parentNode.insertBefore(document.createTextNode(textAfterCursor), referenceNode);

                            activeSuggestion = result;
                            suggestionNode = createNode('<span>' + result + '</span>');
                            suggestionNode.style.opacity = 0.7;
                            suggestionNode.id = INLINE_SUGGESTION_ID;
                            parentNode.insertBefore(suggestionNode, referenceNode);

                            setSelection(function (range) {
                                range.setStartBefore(suggestionNode);
                                range.setEndBefore(suggestionNode);
                            });
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

    createClass(AutoCompose, [{
        key: 'addInputs',
        value: function addInputs() {
            var _this3 = this;

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            var inputs = Array.prototype.concat.apply([], args.map(function (d) {
                return d[0] ? Array.prototype.slice.call(d, 0) : d;
            }));

            inputs.forEach(function (input) {
                // validate element
                if (!input.isContentEditable) {
                    throw new Error('AutoCompose: Invalid input: only contenteditable elements are supported');
                }

                // init events
                input.addEventListener('blur', _this3.onBlurHandler);
                input.addEventListener('keyup', _this3.onKeyUpHandler);
                input.addEventListener('mouseup', _this3.onKeyUpHandler);
                input.addEventListener('keydown', _this3.onKeyDownHandler, true);

                data(input, 'index', _this3.inputs.push(input) - 1);
            });
        }
    }, {
        key: 'removeInputs',
        value: function removeInputs() {
            var _this4 = this;

            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            var inputs = Array.prototype.concat.apply([], args.map(function (d) {
                return d[0] ? Array.prototype.slice.call(d, 0) : d;
            }));

            inputs.forEach(function (input) {
                var index = data(input, 'index');
                if (!isNaN(index)) {
                    _this4.inputs.splice(index, 1);

                    // destroy events
                    input.removeEventListener('blur', _this4.onBlurHandler);
                    input.removeEventListener('keyup', _this4.onKeyUpHandler);
                    input.removeEventListener('mouseup', _this4.onKeyUpHandler);
                    input.removeEventListener('keydown', _this4.onKeyDownHandler, true);
                }
            });
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.removeInputs(this.inputs);
        }
    }]);
    return AutoCompose;
}();

return AutoCompose;

})));
//# sourceMappingURL=AutoCompose.js.map
