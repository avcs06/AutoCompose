// Invisible character
export const POSITIONER_CHARACTER = "\ufeff";

export const HOST_PROPERTIES = [
    'display',
    'direction',  // RTL support
    'boxSizing',
    'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does

    'borderRightWidth',
    'borderLeftWidth',

    'paddingRight',
    'paddingLeft',

    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',

    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',  // might not make a difference, but better be safe

    'letterSpacing',
    'wordSpacing',

    'tabSize',
    'MozTabSize'
];

export const CLONE_PROPERTIES = [
    ...HOST_PROPERTIES,
    'height',
    'overflowX',
    'overflowY',  // copy the scrollbar for IE

    'borderTopWidth',
    'borderBottomWidth',
    'borderStyle',

    'paddingTop',
    'paddingBottom',
];
