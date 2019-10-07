import { data, createNode, getGlobalOffset } from './Utilities';
import { POSITIONER_CHARACTER } from './Constants';

class Suggestion {
    constructor() {
        this.isEmpty = true;
        this.isActive = false;

        this.host = document.createElement('div');
        this.host.style.position = 'absolute';
        this.host.style.cursor = 'text';
        this.host.style.backgroundColor = 'transparent';

        this.offset = document.createElement('div');
        this.offset.appendChild(document.createTextNode(POSITIONER_CHARACTER));
        this.content = document.createElement('div');

        this.hide();
        document.body.appendChild(this.host);
        this.host.appendChild(this.offset);
        this.host.appendChild(this.content);
    }

    show(position, element) {
        if (position) {
            const elementPosition = getGlobalOffset(element);
            const elementStyles = window.getComputedStyle(element);

            this.host.style.width = elementStyles.width;
            this.host.style.left = `${elementPosition.left}px`;
            this.host.style.top = `${position.top}px`;
            this.host.style.lineHeight = elementStyles.lineHeight;
            this.host.style.color = elementStyles.color;

            this.host.style.paddingLeft = elementStyles.paddingLeft;
            this.host.style.paddingRight = elementStyles.paddingRight;
            this.host.style.paddingBottom = elementStyles.paddingBottom;
            this.host.style.paddingRight = elementStyles.paddingRight;

            if (!elementStyles.direction || elementStyles.direction === 'ltr') {
                this.offset.style.float = 'left';
                this.offset.style.width = `${position.left - elementPosition.left - parseFloat(elementStyles.paddingLeft || 0)}px`;
            } else {
                this.offset.style.float = 'right';
                this.offset.style.width = `${parseFloat(elementStyles.width) - position.left + parseFloat(elementPosition.left)}px`;
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
