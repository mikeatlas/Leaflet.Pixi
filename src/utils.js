
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

if (typeof String.prototype.toNumber !== 'function') {
    String.prototype.toNumber = function() {
        return parseInt(this.replace(/^#/, ''), 16)
    };
}