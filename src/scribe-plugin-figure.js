module.exports = function() {
    return function(scribe) {
        var nodeHelpers = scribe.node

        function createLineBreak() {
            var node = document.createElement('p')
            node.appendChild(document.createElement('br'))
            return node
        }

        function traverse(root) {
            var i = 0, node;
            while(node = root.children[i++]) {
                if (node.tagName === 'FIGURE' &&
                    !node.nextElementSibling) {
                    var newNode = createLineBreak()
                    nodeHelpers.insertAfter(newNode, node)
                }
            }
        }

        // make sure that every figure has a nextElementSibling
        scribe.registerHTMLFormatter('normalize', function(html) {
            var bin = document.createElement('div')
            bin.innerHTML = html
            traverse(bin)
            return bin.innerHTML
        })

        // place caret on nextElementSibling if press enter on figcaption
        scribe.el.addEventListener('keydown', function(e) {
            if (e.keyCode === 13) { // enter
                var selection = new scribe.api.Selection()
                var range = selection.range
                var captionNode = selection.getContaining(function(node) {
                    return node.nodeName === 'FIGCAPTION'
                })
                if (captionNode && range.collapsed) {
                    e.preventDefault()
                    scribe.transactionManager.run(function() {
                        var figureNode = captionNode.parentNode,
                            pNode

                        var contentToStartRange = range.cloneRange()
                        contentToStartRange.setStartBefore(captionNode, 0)
                        var contentToStartFragment = contentToStartRange.cloneContents()
                        var shouldMoveBackward = contentToStartFragment.firstChild.textContent === '' && captionNode.textContent !== ''

                        if (shouldMoveBackward) {
                            pNode = createLineBreak()
                            figureNode.parentNode.insertBefore(pNode, figureNode)
                        } else {
                            pNode = figureNode.nextElementSibling
                            if (!pNode || pNode.tagName !== 'P') {
                                pNode = createLineBreak()
                                nodeHelpers.insertAfter(pNode, captionNode.parentNode)
                            }
                        }
                        range.setStart(pNode, 0)
                        range.setEnd(pNode, 0)
                        selection.selection.removeAllRanges()
                        selection.selection.addRange(range)
                    })
                }
            }
        })
    }
}
