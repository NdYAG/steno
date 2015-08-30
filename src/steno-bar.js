// the base class of steno-menu & steno-toolbar
function StenoBar(element) {
    this.element = element
    this.element.addEventListener('transitionend', function() {
        if (!this.element.classList.contains('is-visible')) {
            this.element.classList.add('is-hidden')
        }
    }.bind(this))
}
StenoBar.prototype = {
    constructor: StenoBar,
    show: function() {
        this.element.classList.remove('is-hidden')
        setTimeout(function() {
            this.element.classList.add('is-visible')
        }.bind(this), 0)
    },
    hide: function() {
        this.element.classList.remove('is-visible')
    }
}
module.exports = StenoBar
