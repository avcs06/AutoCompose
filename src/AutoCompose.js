import { INLINE_SUGGESTION_ID } from './constants';
import { data, ensure, ensureType } from './utils';
import {
    getSelectedTextNodes,
    getNodeValue,
    setSelection,
    getPrevNode,
    getNextNode,
    createNode,
} from './node-utils';

class AutoCompose {
    constructor(options, ...inputs) {
        if (!options)
            throw new Error(`AutoCompose: Missing required parameter, options`);

        if (typeof options === 'function')
            options = { composer: options };

        this.inputs = [];
        this.onChange = options.onChange || Function.prototype;
        this.onReject = options.onReject || Function.prototype;

        ensure('AutoCompose', options, 'composer');
        ensureType('AutoCompose', options, 'composer', 'function');
        this.composer = options.composer;

        events: {
            const self = this;
            let handledInKeyDown = false, suggestionNode = null, activeSuggestion = null;

            const clearSuggestion = normalize => {
                const parentNode = suggestionNode.parentNode;
                parentNode.removeChild(suggestionNode);
                normalize && parentNode.normalize();
                suggestionNode = activeSuggestion = null;
            };

            const acceptSuggestion = ignoreCursor => {
                const suggestion = suggestionNode.firstChild.nodeValue;
                suggestionNode.parentNode.insertBefore(suggestionNode.firstChild, suggestionNode);
                const insertedNode = suggestionNode.previousSibling;

                clearSuggestion();
                !ignoreCursor && setSelection(range => {
                    range.setStartAfter(insertedNode);
                    range.setEndAfter(insertedNode);
                });

                this.onChange({
                    suggestion: activeSuggestion,
                    acceptedSuggestion: suggestion
                });
            };

            const rejectSuggestion = () => {
                clearSuggestion();
                this.onReject({ suggestion: activeSuggestion });
            };

            const isSuggestionTextNode = node => node.parentNode === suggestionNode;
            const isAfterSuggestionNode = node => {
                while ((node = getPrevNode(node)) && isSuggestionTextNode(node));
                return Boolean(node);
            };

            this.onBlurHandler = () => suggestionNode && clearSuggestion(true);
            this.onKeyDownHandler = function (e) {
                if (suggestionNode) {
                    if (e.keyCode === 9 || e.keyCode === 39 || e.keyCode === 40) {
                        acceptSuggestion();
                        handledInKeyDown = true;
                        e.preventDefault();
                    } else {
                        rejectSuggestion();
                    }
                }
            };

            let keyUpIndex = 0;
            this.onKeyUpHandler = function (e) {
                if (e.type === 'keyup' && handledInKeyDown) {
                    handledInKeyDown = false;
                    return;
                }

                let { node: textNode, offset } = getSelectedTextNodes();
                if (!textNode) return;

                const isSuggestionNode = isSuggestionTextNode(textNode);
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
                        textNode = getPrevNode(suggestionNode);
                        offset = textNode.nodeValue.length;
                    } catch(e) {
                        textNode = getNextNode(suggestionNode);
                        offset = 0;
                    }
                }
                if (textNode.nodeType !== textNode.TEXT_NODE) return;

                suggestionNode && rejectSuggestion();
                postValue: {
                    let postValue = textNode.nodeValue.slice(offset);
                    if (postValue.trim()) return;

                    let node = textNode;
                    while (node = getNextNode(node, this)) {
                        postValue += getNodeValue(node);
                        if (postValue.trim()) return;
                    }
                }

                let preValue = '';
                preValue: {
                    preValue = textNode.nodeValue.slice(0, offset);

                    let node = textNode;
                    while (node = getPrevNode(node, this)) {
                        preValue = getNodeValue(node) + preValue;
                    }
                }

                handlesuggestion: {
                    keyUpIndex++;
                    (asyncReference => {
                        self.composer.call(this, preValue, result => {
                            if (!result || asyncReference !== keyUpIndex) return;
                            const textAfterCursor = textNode.nodeValue.slice(offset);
                            const parentNode = textNode.parentNode;
                            const referenceNode = textNode.nextSibling;

                            textNode.nodeValue = textNode.nodeValue.slice(0, offset);
                            parentNode.insertBefore(document.createTextNode(textAfterCursor), referenceNode);

                            activeSuggestion = result;
                            suggestionNode = createNode(`<span>${result}</span>`);
                            suggestionNode.style.opacity = 0.7;
                            suggestionNode.id = INLINE_SUGGESTION_ID;
                            parentNode.insertBefore(suggestionNode, referenceNode);

                            setSelection(range => {
                                range.setStartBefore(suggestionNode);
                                range.setEndBefore(suggestionNode);
                            });
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
           if (!input.isContentEditable) {
                throw new Error('AutoCompose: Invalid input: only contenteditable elements are supported');
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
