module.exports = function(TEMPLATE, data) {
    return TEMPLATE.replace(/{{\s*([^{|^}|^\s]+)\s*}}/g, function(_, key) {
        return data[key]
    })
}
