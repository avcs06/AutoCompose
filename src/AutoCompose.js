import {
    data,
    ensure,
    ensureType,
    getGlobalOffset,
    getCursorPosition,
    getScrollLeftForInput,
    getSelectedTextNodes,
    getComputedStyle,
    getNextNode,
    getFirstChildNode,
    removeNodesBetween,
    getNodeValue,
} from './Utilities';
import {
    IS_FIREFOX,
    CLONE_PROPERTIES
} from './Constants';
import Suggestion from './Suggestion';

// Invisible character
const POSITIONER_CHARACTER = "\ufeff";
function getCaretPosition(element) {
    if (data(element, 'isInput')) {
        const [cursorPosition] = getCursorPosition(element);

        // pre to retain special characters
        const clone = document.createElement('pre');
        clone.id = 'autocompose-positionclone';

        const positioner = document.createElement('span');
        positioner.appendChild(document.createTextNode(POSITIONER_CHARACTER));

        const computed = window.getComputedStyle(element);
        CLONE_PROPERTIES.forEach(prop => {
            clone.style[prop] = computed[prop];
        });

        const elementPosition = getGlobalOffset(element);
        clone.style.opacity = 0;
        clone.style.position = 'absolute';
        clone.style.top = `${elementPosition.top}px`;
        clone.style.left = `${elementPosition.left}px`;
        document.body.appendChild(clone);

        if (IS_FIREFOX) {
            if (element.scrollHeight > parseInt(computed.height))
                clone.style.overflowY = 'scroll';
        } else {
            clone.style.overflow = 'hidden';
        }

        clone.appendChild(document.createTextNode(element.value.slice(0, cursorPosition)));
        clone.appendChild(positioner);

        clone.style.maxWidth = '100%';
        clone.style.whiteSpace = 'pre-wrap';
        clone.style.wordWrap = 'break-word';
        clone.scrollTop = element.scrollTop;
        clone.scrollLeft = element.scrollLeft;

        const caretPosition = getGlobalOffset(positioner);
        caretPosition.top -= clone.scrollTop;
        caretPosition.left -= clone.scrollLeft;
        document.body.removeChild(clone);
        return caretPosition;
    } else {
        const { startContainer, startOffset } = window.getSelection().getRangeAt(0);
        const { startContainer: containerTextNode, startOffset: cursorPosition } = getSelectedTextNodes();

        const parentNode = containerTextNode.parentNode;
        const referenceNode = containerTextNode.nextSibling;
        const positioner = document.createElement("span");
        positioner.appendChild(document.createTextNode(POSITIONER_CHARACTER));
        parentNode.insertBefore(positioner, referenceNode);

        const textBeforeCursor = containerTextNode.nodeValue.slice(0, cursorPosition);
        const textAfterCursor = containerTextNode.nodeValue.slice(cursorPosition);
        if (textAfterCursor) {
            containerTextNode.nodeValue = textBeforeCursor;
            const remainingTextNode = document.createTextNode(textAfterCursor);
            parentNode.insertBefore(remainingTextNode, referenceNode);
        }

        const caretPosition = getGlobalOffset(positioner);

        // Reset DOM to the state before changes
        parentNode.removeChild(positioner);
        if (textAfterCursor) {
            parentNode.removeChild(containerTextNode.nextSibling);
            containerTextNode.nodeValue = textBeforeCursor + textAfterCursor;
        }

        const selection = window.getSelection();
        if (selection.setBaseAndExtent) {
            selection.setBaseAndExtent(startContainer, startOffset, startContainer, startOffset);
        } else {
            const range = document.createRange();
            range.setStart(startContainer, startOffset);
            range.setEnd(startContainer, startOffset);
            selection.removeAllRanges();
            selection.addRange(range)
        }

        return caretPosition;
    }
}

const insertHtmlAfter = (node, html) => {
    const psuedoDom = document.createElement('div');
    psuedoDom.innerHTML = html;

    const referenceNode = node.nextSibling;
    const appendedNodes = [];
    while (psuedoDom.firstChild) {
        appendedNodes.push(psuedoDom.firstChild);
        node.parentNode.insertBefore(psuedoDom.firstChild, referenceNode);
    }

    return appendedNodes;
};

const setValue = ({ element, trigger, suggestion, onChange }) => {
    if (data(element, 'isInput')) {
        const [startPosition, endPosition] = getCursorPosition(element);
        const originalValue = element.value;

        let value = originalValue.slice(0, startPosition);
        const currentValue = value.split(trigger || /\W/).pop();
        value = value.slice(0, 0 - currentValue.length - (trigger || '').length) + (suggestion.insertText || suggestion.insertHtml);
        element.value = value + originalValue.slice(endPosition);
        element.focus();

        const focus = suggestion.insertText ? suggestion.focusText : [0, 0];
        const cursorStartPosition = value.length;
        element.setSelectionRange(cursorStartPosition + focus[0], cursorStartPosition + focus[1]);
    } else {
        const { startContainer, startOffset, endContainer, endOffset } = getSelectedTextNodes();
        const selection = window.getSelection();
        const range = document.createRange();

        let preValue = startContainer.nodeValue.slice(0, startOffset);
        const replaceValue = preValue.split(trigger || /\W/).pop();
        preValue = preValue.slice(0, 0 - replaceValue.length - (trigger || '').length);

        if (startContainer !== endContainer) {
            startContainer.nodeValue = preValue;
            removeNodesBetween(startContainer, endContainer);
            endContainer.nodeValue = endContainer.nodeValue.slice(endOffset);
            endContainer.parentNode.normalize();
        } else {
            const remainingText = startContainer.nodeValue.slice(endOffset);
            if (remainingText) {
                const remainingTextNode = document.createTextNode(remainingText);
                startContainer.parentNode.insertBefore(remainingTextNode, startContainer.nextSibling);
            }
            startContainer.nodeValue = preValue;
        }

        if (suggestion.insertHtml) {
            const nodes = insertHtmlAfter(startContainer, suggestion.insertHtml);
            const focus = nodes.length ? suggestion.focusHtml : [0, 0];

            function setSelection(focus, nodes, method) {
                let lastNode, lastFocus = focus;
                if (lastFocus !== 0) {
                    do {
                        lastNode = nodes.pop();
                        lastFocus += lastNode.textContent.length;
                    } while(nodes.length && lastFocus < 0);

                    if (!lastNode) {
                        throw new TypeError(`AutoCompose: Invalid value provided for Suggestion.focusHtml`);
                    };
                }

                if (lastFocus === 0) {
                    range[method + 'After'](nodes[nodes.length - 1] || startContainer);
                } else {
                    if (lastNode.nodeType === lastNode.TEXT_NODE) {
                        range[method](lastNode, lastFocus);
                    } else {
                        setSelection(
                            lastFocus - lastNode.textContent.length,
                            Array.prototype.slice.call(lastNode.childNodes, 0),
                            method
                        );
                    }
                }
            };

            setSelection(focus[1], [...nodes], 'setEnd');
            setSelection(focus[0], [...nodes], 'setStart');
        } else {
            startContainer.nodeValue += suggestion.insertText;
            const focus = suggestion.focusText;
            const cursorStartPosition = startContainer.nodeValue.length;

            range.setStart(startContainer, cursorStartPosition + focus[0]);
            range.setEnd(startContainer, cursorStartPosition + focus[1]);
        }

        selection.removeAllRanges();
        selection.addRange(range);
    }

    onChange(suggestion);
};

class AutoCompose {
    constructor(options, ...inputs) {
        if (!options) {
            throw new Error(`AutoCompose: Missing required parameter, options`);
        }

        this.inputs = [];
        this.suggestion = new Suggestion();
        this.onChange = options.onChange || Function.prototype;

        ensure('AutoCompose', options, 'composer');
        ensureType('AutoCompose', options, 'composer', 'function');
        this.composer = options.composer;

        events: {
            const self = this;
            let handledInKeyDown = false;

            this.onBlurHandler = function() {
                self.suggestion.hide();
            };

            this.onKeyDownHandler = function(e) {
                if (self.suggestion.isActive) {
                    if (e.keyCode === 9 || e.keyCode === 39 || e.keyCode ===40) {
                        setValue({
                            element: this,
                            trigger: activeSuggestionList.trigger,
                            suggestion: self.suggestion.getValue(),
                            onChange: self.onChange.bind(this)
                        });

                        handledInKeyDown = true;
                        e.preventDefault();
                    }

                    self.suggestion.hide();
                }
            };

            let keyUpIndex = 0;
            this.onKeyUpHandler = function(e) {
                if (handledInKeyDown) {
                    handledInKeyDown = false;
                    return;
                }

                self.suggestion.hide();
                let preValue = '', postValue = '';

                if (data(this, 'isInput')) {
                    const [startPosition, endPosition] = getCursorPosition(this);
                    if (startPosition !== endPosition) return;

                    preValue = this.value.slice(0, startPosition);
                    postValue = this.value.slice(startPosition);
                } else {
                    const { startContainer, startOffset, endContainer, endOffset } = getSelectedTextNodes();
                    if (!startContainer || !endContainer) return;

                    let node = getFirstChildNode(this);
                    while (node !== startContainer) {
                        preValue += getNodeValue(node);
                        node = getNextNode(node);
                    }
                    preValue += startContainer.nodeValue.slice(0, startOffset);

                    node = getNextNode(endContainer, this);
                    while (node) {
                        postValue += getNodeValue(node);
                        node = getNextNode(node, this);
                    }
                    postValue = endContainer.nodeValue.slice(endOffset) + postValue;
                }

                handlesuggestion: {
                    keyUpIndex++;
                    self.suggestion.empty();

                    let timer;
                    const caretPosition = getCaretPosition(this);

                    (asyncReference => {
                        timer = setTimeout(() => {
                            self.suggestion.showLoader(caretPosition);
                        }, 0);

                        self.composer.call(this, preValue, postValue, result => {
                            if (asyncReference !== keyUpIndex) return;

                            timer && clearTimeout(timer);
                            if (!result) return self.suggestion.hide();

                            self.suggestion.fill(result, suggestion => {
                                setValue({
                                    element: this,
                                    suggestion: suggestion,
                                    onChange: self.onChange.bind(this)
                                });
                            });

                            self.suggestion.show(caretPosition);
                        });
                    })(keyUpIndex);
                }
            };
        }

        // initialize events on inputs
        this.addInputs(...inputs);
    }

    addInputs(...args) {
        const inputs = Array.prototype.concat.apply([], args.map(d => d[0] ? Array.prototype.slice.call(d, 0) : d));

        inputs.forEach(input => {
            // validate element
            if (input.tagName === 'TEXTAREA') {
                data(input, 'isInput', true)
            } else if (input.isContentEditable) {
                data(input, 'isInput', false)
            } else {
                throw new Error('AutoCompose: Invalid input: only textarea and contenteditable elements are supported');
            }

            // init events
            input.addEventListener('blur', this.onBlurHandler);
            input.addEventListener('keyup', this.onKeyUpHandler);
            input.addEventListener('mouseup', this.onKeyUpHandler);
            input.addEventListener('keydown', this.onKeyDownHandler, true);

            data(input, 'index', this.inputs.push(input) - 1);
        });
    }

    removeInputs(...args) {
        const inputs = Array.prototype.concat.apply([], args.map(d => d[0] ? Array.prototype.slice.call(d, 0) : d));

        inputs.forEach(input => {
            const index = data(input, 'index');
            if (!isNaN(index)) {
                this.inputs.splice(index, 1);

                // destroy events
                input.removeEventListener('blur', this.onBlurHandler);
                input.removeEventListener('keyup', this.onKeyUpHandler);
                input.removeEventListener('mouseup', this.onKeyUpHandler);
                input.removeEventListener('keydown', this.onKeyDownHandler, true);
            }
        });
    }

    destroy() {
        this.removeInputs(this.inputs);
    }
}

export default AutoCompose;
