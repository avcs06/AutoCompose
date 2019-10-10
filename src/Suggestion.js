import { data, createNode, getGlobalOffset } from './Utilities';
import { POSITIONER_CHARACTER, HOST_PROPERTIES, FONT_PROPERTIES, FILLER } from './Constants';

class Suggestion {
    constructor() {
        this.isEmpty = true;
        this.isActive = false;
        this.suggestion = '';

        this.host = document.createElement('div');
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

    show(position, element) {
        if (position) {
            const elementPosition = getGlobalOffset(element);
            const elementStyles = window.getComputedStyle(element);

            HOST_PROPERTIES.forEach(prop => {
                this.host.style[prop] = elementStyles[prop];
            });
            this.host.style.left = `${elementPosition.left}px`;
            this.host.style.top = `${position.top}px`;
            this.host.style.height = `${parseFloat(elementStyles.height) - position.top + elementPosition.top}px`;
            this.host.style.color = elementStyles.color;

            if (element.scrollHeight > parseInt(elementStyles.height))
                this.host.style.overflowY = 'scroll';
            else
                this.host.style.overflowY = 'hidden';

            const leftWidth = position.left - elementPosition.left -
                parseFloat(elementStyles.paddingLeft || 0);
            const rightWidth = parseFloat(elementStyles.width) - position.left + elementPosition.left -
                parseFloat(elementStyles.paddingRight || 0);
            let firstLineWidth = 0;
            if (elementStyles.direction === 'ltr') {
                this.offset.style.float = 'left';
                this.offset.style.width = `${leftWidth}px`;
                firstLineWidth = rightWidth;
            } else {
                this.offset.style.float = 'right';
                this.offset.style.width = `${rightWidth}px`;
                firstLineWidth = leftWidth;
            }

            const span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';
            FONT_PROPERTIES.forEach(prop => {
                span.style[prop] = elementStyles[prop];
            });

            span.appendChild(createNode('<span>&nbsp;</span>'));
            span.firstChild.style.fontSize = '1px';

            const textNode = document.createTextNode('');
            span.appendChild(textNode);

            document.body.appendChild(span);

            let crossed = false, lastSpaceAt = -1;
            const suggestionLength = this.suggestion.length;
            for (let i = 0; i < suggestionLength; i++) {
                if (!crossed) {
                    const text = this.suggestion[i];
                    if (/\s/.test(text)) lastSpaceAt = i;
                    textNode.nodeValue += this.suggestion[i];
                    crossed = span.offsetWidth > firstLineWidth;
                    if (crossed) {
                        for (let j = lastSpaceAt + 2; j <= i; j++) {
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

    hide() {
        this.host.style.display = 'none';
        this.isActive = false;
    }

    empty() {
        this.isEmpty = true;
        while (this.content.firstChild)
            this.content.removeChild(this.content.firstChild);
    }

    fill(suggestion, onSet) {
        this.empty();
        this.suggestion = suggestion;

        this.content.appendChild(createNode('<span>&nbsp;</span>'));
        this.content.firstChild.style.fontSize = '1px';

        suggestion.split('').concat(FILLER).forEach((char, i) => {
            const charNode = createNode(`<span>${char}</span>`);
            charNode.style.opacity = 0.7;
            charNode.style.lineHeight = 1.5;
            charNode.style.pointerEvents = 'all';
            this.content.appendChild(charNode);

            charNode.addEventListener('mousedown', e => {
                onSet(suggestion.slice(0, i + 1));
                this.hide();

                e.preventDefault();
                e.stopPropagation();
            });
        });

        this.isEmpty = false;
    }

    showLoader(position) {
        this.empty();
        this.show(position);
    }

    getValue() {
        return this.suggestion;
    }
}

export default Suggestion;
