# Documentation
### Installation
*As npm module*
```bash
npm i @avcs/autocompose --save
```

*As bower component*
```bash
bower install avcs-autocompose --save
```

*As standalone JavaScript plugin*

For contenteditable
```html 
<script type="text/javascript" src="@avcs/autosuggest/dist/AutoCompose.js"></script>
```

For textarea
```html
<script type="text/javascript" src="@avcs/autosuggest/dist/AutoComposeTextarea.js"></script>
```

*Importing Components*
> `AutoCompose` component should be used for contenteditable fields and `AutoComposeTextarea` should be used for textarea fields. User can import any or both of the components based on the usecase.

Contenteditable component
```javascript
import AutoCompose from '@avcs/autosuggest'
```

ES6 Textarea component
```javascript
import AutoComposeTextarea from '@avcs/autosuggest/es/AutoComposeTextarea'
```

Vannila Textarea component
```javascript
import AutoComposeTextarea from '@avcs/autosuggest/lib/AutoComposeTextarea'
```

## AutoCompose or AutoComposeTextarea
> All the options and methods are same for both `AutoCompose` and `AutoComposeTextarea`, only internal implementation changes. The examples here only use `AutoCompose` but same examples can be used for `AutoComposeTextarea` too.
### Initialization
```javascript
var instance = new AutoCompose(options, ...inputFields);
```

### Options
**`composer`**: `Function < value:string, callback: Function < suggestion: string > >` *(required)*
- **`value`**: Current value of the field. For textarea it's the input value. For contenteditable it's text content.
- **`callback`**: Callback accepts a parameter `suggestion`, after processing the input value any suggestion should be provided through the callback.

> Please call the callback with no input `callback()`, if you dont want to show any suggestion for the current input. Dangling it might cause memory leak.

**`onChange`**: `Function < change: Object < suggestion: string, acceptedSuggestion: string > >` *(optional)*  
onChange event is triggered when user accepts a suggestion fully or partially, `change.acceptedSuggestion` provides the accepted part of the suggestion, while `change.suggestion` provides the full suggestion.

**`onReject`**: `Function < change: Object < suggestion: string > >` *(optional)*
onReject event is triggered when user skips or rejects the current suggestion. `change.suggestion` provides the full suggestion that was rejected.

### Methods
**`addInputs`**: `Function < ...inputFields < DOMElement | Array < DOMELement > | Iterable < DOMElement > >`  
Enable the autocompose on new input fields after the instantiation.

**`removeInputs`**: `Function < ...inputFields < DOMElement | Array < DOMELement > | Iterable < DOMElement > >`  
Disable the autocompose on the input fields.

**`destroy`**: `Function < >`  
Disable autocompose on all input fields.
