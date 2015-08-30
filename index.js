var Scribe = require('scribe-editor'),
    scribePluginSanitizer = require('scribe-plugin-sanitizer'),
    scribePluginLinkPromptCommand = require('scribe-plugin-link-prompt-command'),
    scribePluginUnlinkCommand = require('scribe-plugin-intelligent-unlink-command'),
    scribePluginFigure = require('./src/scribe-plugin-figure'),
    scribePluginInsertFigure = require('./src/scribe-plugin-insert-figure'),
    stenoMenu = require('./src/steno-menu'),
    stenoToolbar = require('./src/steno-toolbar')

var stylesheet = require('./src/steno.scss')

var workspace = document.querySelector('.steno-workspace')
var scribe = new Scribe(workspace, {
    defaultCommandPatches: [
       'bold',
       'insertHTML',
       'createLink'
    ]
})

scribe.use(stenoMenu())
scribe.use(stenoToolbar())
scribe.use(scribePluginSanitizer({
    tags: {
        p: {
            style: false // remove style from pasting
        },
        b: true,
        strong: true,
        i: true,
        em: true,
        a: {
            href: true,
            target: '_blank'
        },
        img: {
            src: true,
            title: true,
            style: true,
            height: true,
            width: true,
            onload: true
        },
        figure: {
            contenteditable: true
        },
        figcaption: {
            contenteditable: true,
            placeholder: true
        }
    }
}))
scribe.use(scribePluginLinkPromptCommand())
scribe.use(scribePluginUnlinkCommand())
scribe.use(scribePluginFigure())
scribe.use(scribePluginInsertFigure())

window.scribe = scribe
