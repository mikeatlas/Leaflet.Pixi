L.TileLayer.TwoJsTileLayer = L.TileLayer.extend({

 	options: {
 		size: 30000, // in meters
 	},

 	initialize: function (options) {
 		options = L.setOptions(this, options); 		 		
 	},

 	onAdd: function (map) {
		this.map = map;
		this.initTwoJS()
	},

 	initTwoJS: function() {
 		var Two, circle, elem, params, two;
 		var params = {};

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

		params.type=Two.Types.canvas;

		this.two = new Two(params).appendTo(layerElem);	

 	},

 	twoHandle: function () {
 		return this.two;
 	},



});

L.TileLayer.twoJsTileLayer = function (options) {
	return new L.TileLayer.TwoJsTileLayer(options);
};