 L.TileLayer.TwoJsTileLayer = L.Class.extend({

 	options: {
 		option1: 1,
 		option2: 2
 	},

 	initialize: function (options) {
 		this.data = [];
 		L.Util.setOptions(this, options);
 		this.initTwoJS();
 	},

 	initTwoJS: function() {
 		var Two, circle, elem, params, two;

		Two = require('twojs-browserify');
		elem = document.querySelector('#container');

		params = {
		  width: 200,
		  height: 100
		};

		two = new Two(params).appendTo(elem);
		circle = two.makeCircle(72, 70, 10);
		circle.fill = '#fff800';
		circle.stroke = 'organered';
		circle.linewidth = 5;
		two.update();
 	},

});

L.TileLayer.twoJsTileLayer = function (options) {
	return new L.TileLayer.TwoJsTileLayer(options);
};