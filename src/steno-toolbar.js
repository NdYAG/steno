var StenoBar = require('./steno-bar'),
    saveSelection = require('./utils/selection').saveSelection,
    restoreSelection = require('./utils/selection').restoreSelection

module.exports = function() {
    return function(scribe) {
        var toolbarNode = document.querySelector('.steno-toolbar'),
            toolbar = new StenoBar(toolbarNode),
            toolbarLink = toolbarNode.querySelector('.steno-toolbar-link'),
            toolbarLinkInput = toolbarLink.querySelector('input'),
            toolbarButtons = toolbarNode.querySelector('.steno-toolbar-buttons'),
            forEach = Array.prototype.forEach

        // TODO: separate link feature into a plugin
        var createLinkCommand = scribe.getCommand('createLink')
        createLinkCommand.queryState = function() {
            var selection = new scribe.api.Selection()
            return !! selection.getContaining(function (node) {
                return node.nodeName === 'A'
            })
        }

        var buttons = toolbarNode.querySelectorAll('[data-command]')
        var savedSel
        forEach.call(buttons, function(button) {
            button.addEventListener('click', function() {
                var commandName = button.dataset.command
                var command = scribe.getCommand(commandName)
                if (commandName === 'createLink') {
                    scribe.el.focus()
                    savedSel = saveSelection()
                    displayLinkEditor()
                } else {
                    scribe.el.focus()
                    command.execute()
                }
            })
        })
        toolbarLinkInput.addEventListener('keydown', function(e) {
            if (e.keyCode === 13) {
                e.preventDefault()
                var createLinkCommand = scribe.getCommand('createLink'),
                    unlinkCommand = scribe.getCommand('unlink')
                if (toolbarLinkInput.value.trim().length) {
                    if (savedSel) {
                        restoreSelection(savedSel)
                        createLinkCommand.execute(toolbarLinkInput.value)

                        // remove selection so that toolbar will not display after hiding
                        var selection = new scribe.api.Selection()
                        selection.selection.removeAllRanges()
                        toolbar.hide()
                    }
                } else {
                    if (savedSel) {
                        restoreSelection(savedSel)
                        unlinkCommand.execute()
                    }
                }
            }
        })
        function displayLinkEditor(url) {
            toolbarLink.classList.remove('is-hidden')
            toolbarButtons.classList.add('is-hidden')
            var input = toolbarLink.querySelector('input')
            url = url || ''
            input.value = url
            input.focus()
        }
        function hideLinkEditor() {
            toolbarLink.classList.add('is-hidden')
            toolbarButtons.classList.remove('is-hidden')
        }

        function toggleToolbar(e) {
            // setTimeout in case range is to be collapsed right after event fired
            // example: select all text, click to collapse range
            setTimeout(function() {
                var selection = new scribe.api.Selection(),
                    range = selection.range
                if(range && !range.collapsed) {
                    toolbar.show()
                    forEach.call(buttons, function(button) {
                        var cmdName = button.dataset.command
                        var cmd = scribe.getCommand(cmdName)

                        if (selection.range && cmdName === 'createLink' && cmd.queryState()) {
                            var anchorNode = selection.getContaining(function (node) {
                                return node.nodeName === 'A'
                            })
                            if (anchorNode) {
                                range.selectNode(anchorNode)
                                selection.selection.removeAllRanges()
                                selection.selection.addRange(range)
                                savedSel = saveSelection()
                            }
                            displayLinkEditor(anchorNode? anchorNode.href: undefined)
                        } else {
                            hideLinkEditor()
                            if (selection.range && cmd.queryState(cmdName)) {
                                button.classList.add('is-active')
                            } else {
                                button.classList.remove('is-active')
                            }
                        }
                    })
                    var rect = range.getBoundingClientRect(),
                        parentRect = scribe.el.getBoundingClientRect(),
                        toolbarRect = toolbarNode.getBoundingClientRect()
                    toolbarNode.style.left = rect.left - parentRect.left + rect.width/2 - toolbarRect.width/2 + 'px'
                    toolbarNode.style.top = rect.top - parentRect.top - toolbarRect.height - 20 + 'px'
                } else {
                    toolbar.hide()
                }
            }, 0)
        }

        scribe.el.addEventListener('mouseup', toggleToolbar)
        scribe.el.addEventListener('keyup', toggleToolbar)
        scribe.on('content-changed', toggleToolbar)
    }
}
