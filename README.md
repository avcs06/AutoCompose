# AutoCompose
A JavaScript plugin to provide UI support for Gmail like smart compose in textarea and contenteditable.

### [Demo](https://avcs.pro/autocompose) | [Documentation](Documentation.md)

# Features
### General
1. Supports textarea and contenteditable fields
2. No external dependencies like jquery or bootstrap
3. Can add and remove inputs dynamically.
4. **DOES NOT** provide any suggestion algorithms or database, you have to provide the `composer`, a method which takes in current value and returns the suggestion.

### Textarea
1. Provides a completely different Component `AutoComposeTextarea` to support textarea.
2. Uses overlay to show the suggestion.

### Contenteditable
1. Inserts the suggestion into HTML directly.
2. Current text style will be applied to the suggestion too.

### Suggestion
1. User can accept partial suggestion, by placing the cursor in the middle of the suggestion.
2. User can accept the full suggestion by placing the cursor at the end of suggestion or using keys `Tab`, `Left arrow` or `Down arrow`.
3. OnChange event provides `acceptedSuggestion`, which gives the partial suggestion if user accepts only partial suggestion.
4. OnReject event will be triggered if the shown suggestion is not accepted by user.
