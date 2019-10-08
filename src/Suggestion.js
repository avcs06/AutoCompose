import { data, createNode, getGlobalOffset } from './Utilities';
import { POSITIONER_CHARACTER, HOST_PROPERTIES } from './Constants';

class Suggestion {
    constructor() {
        this.isEmpty = true;
        this.isActive = false;

        this.host = document.createElement('div');
        this.host.style.cursor = 'text';
        this.host.style.position = 'absolute';
        this.host.style.borderColor = 'transparent';
        this.host.style.backgroundColor = 'transparent';
        this.host.style.overflow = 'hidden';

        this.offset = document.createElement('div');
        this.offset.appendChild(document.createTextNode(POSITIONER_CHARACTER));
        this.offset.addEventListener('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.content = document.createElement('div');
        this.content.addEventListener('mousedown', e => {
            this.content.lastChild &&
                this.content.lastChild.dispatchEvent(new Event('mousedown'));

            e.preventDefault();
            e.stopPropagation();
        });

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

            if (elementStyles.direction === 'ltr') {
                this.offset.style.float = 'left';
                this.offset.style.width = `${(
                    position.left - elementPosition.left -
                    parseFloat(elementStyles.paddingLeft || 0)
                )}px`;
            } else {
                this.offset.style.float = 'right';
                this.offset.style.width = `${(
                    parseFloat(elementStyles.width) - position.left + elementPosition.left -
                    parseFloat(elementStyles.paddingRight || 0)
                )}px`;
            }
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
        data(this.content, 'suggestion', suggestion);

        this.content.appendChild(createNode('<span>&nbsp;</span>'));
        this.content.firstChild.style.fontSize = '1px';
        this.content.insertBefore(document.createElement('span'), this.content.firstChild);
        this.content.firstChild.appendChild(document.createTextNode(POSITIONER_CHARACTER));
        this.content.firstChild.style.lineHeight = window.getComputedStyle(document.body).lineHeight;

        suggestion.split('').forEach((char, i) => {
            const charNode = createNode(`<span>${char}</span>`);
            charNode.style.opacity = 0.7;
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
        this.content.innerHTML = '';
        this.show(position);
    }

    getValue() {
        return data(this.content, 'suggestion');
    }
}

export default Suggestion;
