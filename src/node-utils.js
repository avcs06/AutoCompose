export const getGlobalOffset = $0 => {
    let node = $0, top = 0, left = 0;

    do {
        left += node.offsetLeft;
        top += node.offsetTop;
    } while (node = node.offsetParent);

    return { left, top };
};

export const getSelectedTextNodes = () => {
    const selection = window.getSelection();
    if (!selection.isCollapsed) return {};

    let { startContainer: node, startOffset: offset } = selection.getRangeAt(0);
    if (node.nodeType !== node.TEXT_NODE) {
        try {
            node = getFirstChildNode(node.childNodes[offset]);
            offset = 0;
        } catch (e) {
            try {
                node = getLastChildNode(node.childNodes[offset - 1]);
                offset = node.nodeValue ? node.nodeValue.length : null;
            } catch(e) {}
        }
    }

    return { node, offset };
};

export const createNode = html => {
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
};

export const getFirstChildNode = node => {
    let nextNode = node;
    while (nextNode.firstChild) nextNode = nextNode.firstChild;
    return nextNode;
};

export const getLastChildNode = node => {
    let nextNode = node;
    while (nextNode.lastChild) nextNode = nextNode.lastChild;
    return nextNode;
};

export const getNextNode = (node, root) => {
    let nextNode;
    if (node.nextSibling)
        nextNode = node.nextSibling;
    else {
        nextNode = node.parentNode;
        while (nextNode !== root && !nextNode.nextSibling)
            nextNode = nextNode.parentNode;
        if (nextNode && nextNode !== root)
            nextNode = nextNode.nextSibling
        else return;
    }

    return getFirstChildNode(nextNode);
};

export const getPrevNode = (node, root) => {
    let prevNode;
    if (node.previousSibling)
        prevNode = node.previousSibling;
    else {
        prevNode = node.parentNode;
        while (prevNode !== root && !prevNode.previousSibling)
            prevNode = prevNode.parentNode;
        if (prevNode && prevNode !== root)
            prevNode = prevNode.previousSibling
        else return;
    }

    return getLastChildNode(prevNode);
};

export const removeNodesBetween = (startContainer, endContainer) => {
    if (startContainer === endContainer) return;
    let node = getNextNode(startContainer);
    while (node !== endContainer) {
        node.parentNode.removeChild(node);
        node = getNextNode(startContainer);
    }
};

export const getNodeValue = node => {
    if (node.tagName && node.tagName === 'BR')
        return '\n';
    return node.nodeValue || '';
};

export const setSelection = callback => {
    const selection = window.getSelection();
    const range = document.createRange();
    callback(range);
    selection.removeAllRanges();
    selection.addRange(range);
};