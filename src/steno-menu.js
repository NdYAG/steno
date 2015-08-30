var StenoBar = require('./steno-bar')

module.exports = function() {
    return function(scribe) {
        var menuElement = document.querySelector('.steno-menu')
        var menu = new StenoBar(menuElement)

        var stenoFileInput = document.querySelector('#stenoFileInput')
        stenoFileInput.addEventListener('change', function(e) {
            var command = scribe.getCommand(stenoFileInput.dataset.command)
            var selection = new scribe.api.Selection()
            scribe.el.focus()

            var file = stenoFileInput.files[0]
            var fileType = /image.*/

            if (file.type.match(fileType)) {
                var reader = new FileReader()
                reader.onload = function(e) {
                    // insertImage(reader.result)
                    command.execute({
                        image_url: reader.result,
                        caption: '',
                        placeholder: '给图片写点文字'
                    }, function(figureElement) {
                        // focus on figcaption & hide menu
                        var newRange = document.createRange()
                        var figcaption = figureElement.querySelector('figcaption')
                        newRange.setStart(figcaption, 0)
                        newRange.setEnd(figcaption, 0)
                        selection.selection.removeAllRanges()
                        selection.selection.addRange(newRange)
                    })
                }
                // reader.onload = insertImage.bind(this, reader.result)
                reader.readAsDataURL(file)
            }
        })

        // var buttons = menuElement.querySelectorAll('[data-command]')
        // Array.prototype.forEach.call(buttons, function(button) {
        //     button.addEventListener('click', function() {
        //         var command = scribe.getCommand(button.dataset.command)
        //
        //         var selection = new scribe.api.Selection()
        //
        //         scribe.el.focus()
        //
        //         command.execute({
        //             image_url: 'http://7d9o0k.com1.z0.glb.clouddn.com/little_forest.jpg',
        //             caption: '',
        //             placeholder: '给图片写点文字'
        //         }, function(figureElement) {
        //             // focus on figcaption & hide menu
        //             var newRange = document.createRange()
        //             var figcaption = figureElement.querySelector('figcaption')
        //             newRange.setStart(figcaption, 0)
        //             newRange.setEnd(figcaption, 0)
        //             selection.selection.removeAllRanges()
        //             selection.selection.addRange(newRange)
        //         })
        //     })
        // })


        function toggleMenu(e) {
            var selection = new scribe.api.Selection(),
                anchorNode = selection.selection.anchorNode,
                isCaretOnNewLine = anchorNode && anchorNode.nodeType === 1 && anchorNode.tagName === 'P' && anchorNode.innerHTML === '<br>'

            if (isCaretOnNewLine) {
                menu.show()
                menuElement.style.top = (anchorNode.offsetTop - 8) + 'px' // 8 = 0.5em
            } else if (scribe.el.textContent === '' && scribe.el.childNodes[0].tagName === 'P') { // empty scribe
                menuElement.classList.add('is-visible')
                menuElement.style.top = 0
            } else {
                hideMenu()
            }
        }

        function hideMenu() {
            menu.hide()
        }

        scribe.el.addEventListener('mouseup', toggleMenu)
        scribe.el.addEventListener('keyup', toggleMenu)
        scribe.el.addEventListener('focus', toggleMenu)
        scribe.el.addEventListener('blur', hideMenu)
    }
}
