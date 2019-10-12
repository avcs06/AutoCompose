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
