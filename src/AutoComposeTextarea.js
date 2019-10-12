import { data, ensure, ensureType, getCursorPosition } from './utils';
import { POSITIONER_CHARACTER, CLONE_PROPERTIES } from './constants';
import { getGlobalOffset } from './node-utils';
import OverlaySuggestion from './OverlaySuggestion';

function getCaretPosition(element) {
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

    if (element.scrollHeight > parseInt(computed.height))
        clone.style.overflowY = 'scroll';
    else
        clone.style.overflowY = 'hidden';

    clone.appendChild(document.createTextNode(element.value.slice(0, cursorPosition)));
    clone.appendChild(positioner);

    clone.style.maxWidth = '100%';
    clone.style.whiteSpace = 'pre-wrap';
    clone.style.wordWrap = 'break-word';

    const caretPosition = getGlobalOffset(positioner);
    caretPosition.top -= element.scrollTop;
    caretPosition.left -= element.scrollLeft;
    document.body.removeChild(clone);
    return caretPosition;
}

const setValue = ({ element, suggestion, fullSuggestion, onChange }) => {
    const [startPosition] = getCursorPosition(element);
    const originalValue = element.value;
    const value = originalValue.slice(0, startPosition) + suggestion;

    element.value = value + originalValue.slice(startPosition);
    element.focus();

    const cursorPosition = value.length;
    element.setSelectionRange(cursorPosition, cursorPosition);
    onChange({ suggestion: fullSuggestion, acceptedSuggestion: suggestion });
};

class AutoComposeTextarea {
    constructor(options, ...inputs) {
        if (!options) {
            throw new Error(`AutoCompose Textarea: Missing required parameter, options`);
        }

        if (typeof options === 'function')
            options = { composer: options };

        this.inputs = [];
        this.suggestion = new OverlaySuggestion();
        this.onChange = options.onChange || Function.prototype;
        this.onReject = options.onReject || Function.prototype;

        ensure('AutoCompose Textarea', options, 'composer');
        ensureType('AutoCompose Textarea', options, 'composer', 'function');
        this.composer = options.composer;

        events: {
            const self = this;
            let handledInKeyDown = false;

            this.onBlurHandler = function () {
                self.suggestion.hide();
            };

            this.onKeyDownHandler = function (e) {
                if (self.suggestion.isActive) {
                    if (e.keyCode === 9 || e.keyCode === 39 || e.keyCode === 40) {
                        const fullSuggestion = self.suggestion.getValue();
                        setValue({
                            element: this,
                            fullSuggestion,
                            suggestion: fullSuggestion,
                            onChange: self.onChange.bind(this)
                        });

                        self.suggestion.hide();
                        handledInKeyDown = true;
                        e.preventDefault();
                    }
                }
            };

            let keyUpIndex = 0;
            this.onKeyUpHandler = function (e) {
                if (handledInKeyDown) {
                    handledInKeyDown = false;
                    return;
                }

                if (self.suggestion.isActive) {
                    self.suggestion.hide();
                    self.onReject({ suggestion: self.suggestion.getValue() });
                }

                const [startPosition, endPosition] = getCursorPosition(this);
                if (startPosition !== endPosition) return;

                const postValue = this.value.slice(startPosition);
                if (postValue.trim()) return;
                const preValue = this.value.slice(0, startPosition);

                handlesuggestion: {
                    keyUpIndex++;

                    const caretPosition = getCaretPosition(this);
                    (asyncReference => {
                        self.composer.call(this, preValue, result => {
                            if (!result || asyncReference !== keyUpIndex) return;

                            self.suggestion.fill(result, suggestion => {
                                setValue({
                                    element: this,
                                    suggestion: suggestion,
                                    fullSuggestion: result,
                                    onChange: self.onChange.bind(this)
                                });
                            });

                            self.suggestion.show(caretPosition, this);
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
            if (input.tagName !== 'TEXTAREA') {
                throw new Error('AutoCompose Textarea: Invalid input: only textarea elements are supported');
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

export default AutoComposeTextarea;
