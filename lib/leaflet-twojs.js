
L.LatLng.prototype.asTwoJsPixelPos = function(options) {
	var projecton;
	if (options.projecton)
		projecton = options.projecton;
	else {
		projecton = L.Projection.Mercator;
	}
	var point = projecton.project(this);
	return point;
};


 L.TileLayer.TwoJsTileLayer = L.TileLayer.extend({

 	options: {
 		option1: 1,
 		option2: 2
 	},

 	onAdd: function (map) {
		this.map = map;
		this.initTwoJS()
	},

 	initialize: function (options) {
 		options = L.setOptions(this, options);
 		if (options.zIndex){
 			this.zIndex = options.zIndex;
 		}
 	},

 	initTwoJS: function() {
 		var Two, circle, elem, params, two;

		Two = require('twojs-browserify');
		var mapsize = this.map.getSize();
		var options = this.options;
		
		var layerElem = document.createElement("twojsElementLayer");
		layerElem.id = 'twojsElementLayer' + L.Util.stamp(this);

        layerElem.width = mapsize.x;
        layerElem.height = mapsize.y;
        layerElem.style.opacity = options.opacity;
        layerElem.style.position = 'absolute';
		
		this.map.getPanes().overlayPane.appendChild(layerElem);

		this.two = new Two(params).appendTo(layerElem);		
 	},

 	twoHandle: function () {
 		return this.two;
 	},

});

L.TileLayer.twoJsTileLayer = function (options) {
	return new L.TileLayer.TwoJsTileLayer(options);
};