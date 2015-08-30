module.exports = function() {
    return function(scribe) {

        var TEMPLATE = '<figure contenteditable="false"><img src="{{ image_url }}" onload="stenoResizeImage(this)" /><figcaption contenteditable placeholder="{{ placeholder }}">{{ caption }}</figcaption></figure>'

        var nodeHelpers = scribe.node

        var insertFigureCommand = new scribe.api.SimpleCommand('figure', 'FIGURE')

        insertFigureCommand.execute = function(image, callback) {
            // TODO: image protocol validate
            if (!image) { return }
            var html = TEMPLATE.replace(/{{\s*(\w+)\s*}}/g, function(_, key) {
                return image[key]
            })

            var figureElement = (function(str) {
                var div = document.createElement('div')
                div.innerHTML = str
                return div.firstChild
            })(html)

            var selection = new scribe.api.Selection()
            var range = selection.range
            // surround p if p is empty
            // var ancestor = range.commonAncestorContainer
            // if (ancestor && !nodeHelpers.isText(ancestor) && nodeHelpers.isEmptyInlineElement(ancestor)) {

            if (selection.isCaretOnNewLine()) {
                // range.surroundContents(range.commonAncestorContainer)
                // surroundContents may throw exception "The node provided contains the insertion point; it may not be inserted into itself."
                // https://chromium.googlesource.com/chromium/blink/+/master/Source/core/dom/Range.cpp  L1248
                range.setStartBefore(range.commonAncestorContainer)
                range.setEndAfter(range.commonAncestorContainer)
            }
            range.insertNode(figureElement)

            callback && callback(figureElement)
        }

        window.stenoResizeImage = function(image) {
            image.height = Math.floor(image.height / 32) * 32
        }

        scribe.commands.figure = insertFigureCommand
    }
}
