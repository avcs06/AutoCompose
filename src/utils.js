export const ensure = (context, object, keys) => {
    [].concat(keys).forEach(key => {
        if (typeof object[key] === 'undefined') {
            throw new Error(`AutoCompose: Missing required parameter, ${context}.${key}`);
        }
    });
};

export const ensureAnyOf = (context, object, keys) => {
    let currentKey;
    if (!keys.some(key => (
        typeof object[currentKey = key] !== 'undefined'
    ))) throw new Error(`AutoCompose: Missing required parameter, ${context}.${currentKey}`);
};

export const ensureType = (context, object, key, type) => {
    [].concat(object[key]).forEach(value => {
        const valueType = typeof value;
        if (valueType !== type && valueType !== 'undefined') {
            throw new TypeError(`AutoCompose: Invalid Type for ${context}.${key}, expected ${type}`);
        }
    });
};

export const getCursorPosition = input => {
    return [input.selectionStart, input.selectionEnd].sort((a, b) => a - b);
};

export const makeAsyncQueueRunner = () => {
    let i = 0;
    let queue = [];

    return (f, j) => {
        queue[j - i] = f;
        while (queue[0]) ++i, queue.shift()();
    };
};

export const data = (element, key, value) => {
    key = 'autosuggest_' + key;
    if (typeof value !== 'undefined') {
        element.dataset[key] = JSON.stringify(value);
    } else {
        value = element.dataset[key];
        return typeof value !== 'undefined' ? JSON.parse(element.dataset[key]) : value;
    }
};

export const getScrollbarWidth = () => {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
};
