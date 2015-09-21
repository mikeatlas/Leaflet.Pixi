
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

if (typeof String.prototype.toNumber !== 'function') {
    String.prototype.toNumber = function() {
        return parseInt(this.replace(/^#/, ''), 16)
    };
}

if (typeof String.prototype.genUUID !== 'function') {
    String.prototype.genUUID = function() {
    	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    		return v.toString(16);
		});
		return uuid; 
    };
}
