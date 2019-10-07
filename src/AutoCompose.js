import {
  data,
  ensure,
  ensureType,
  getGlobalOffset,
  getCursorPosition,
  getSelectedTextNodes,
  getNextNode,
  getFirstChildNode,
  getNodeValue,
  isFirefox,
} from './Utilities';
import {
  POSITIONER_CHARACTER,
  CLONE_PROPERTIES
} from './Constants';
import Suggestion from './Suggestion';

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

    if (isFirefox()) {
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
    const { startContainer, startOffset, endContainer, endOffset } = window.getSelection().getRangeAt(0);
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
      selection.setBaseAndExtent(startContainer, startOffset, endContainer, endOffset);
    } else {
      const range = document.createRange();
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(range)
    }

    return caretPosition;
  }
}

const setValue = ({ element, suggestion, onChange }) => {
  if (data(element, 'isInput')) {
    const [startPosition] = getCursorPosition(element);
    const originalValue = element.value;
    const value = originalValue.slice(0, startPosition) + suggestion;

    element.value = value + originalValue.slice(startPosition);
    element.focus();

    const cursorPosition = value.length;
    element.setSelectionRange(cursorPosition, cursorPosition);
  } else {
    const { startContainer, startOffset, endContainer, endOffset } = getSelectedTextNodes();
    const selection = window.getSelection();
    const range = document.createRange();

    const preValue = startContainer.nodeValue.slice(0, startOffset);
    const postValue = endContainer.nodeValue.slice(endOffset);
    startContainer.nodeValue = prevalue + suggestion + postValue;

    const cursorPosition = preValue.length + suggestion.length;
    range.setStart(startContainer, cursorPosition);
    range.setEnd(startContainer, cursorPosition);
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

    if (typeof options === 'function')
      options = { composer: options };

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
