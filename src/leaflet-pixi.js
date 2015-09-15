L.TileLayer.PixiTileLayer = L.TileLayer.extend({

 	options: {
 		option1: 1,
 		option2: 2,
 	},

 	initialize: function (options) {
 		options = L.setOptions(this, options); 		 		
 	},

 	onAdd: function (map) {
		this.map = map;
		this.initPixiTileLayer()
	},

 	initPixiTileLayer: function() {
 		var params = {};
 		var mapOverlayPaneDiv = this.map.getPanes().overlayPane
 		var PIXI = require('pixi.js');
		var stage = new PIXI.Container();
		var renderer = PIXI.autoDetectRenderer(
			mapOverlayPaneDiv.offsetWidth, 
			mapOverlayPaneDiv.offsetHeight, 
			{transparent: false}
		);
		mapOverlayPaneDiv.parentNode.lastChild.appendChild(renderer.view);
		renderer.view.style.position = "absolute";
		renderer.view.style.top = "0px";
		renderer.view.style.left = "0px";
		renderer.render(stage);
	},

	runTest: function(){
		var graphics = new PIXI.Graphics();
		var porterSq = new L.LatLng(42.388349, -71.119355);
		var referencePixel = this.map.latLngToContainerPoint(porterSq);

		graphics.beginFill(0xFFFFFF);
		for(var i=0; i < 20000; i++) {
		    graphics.drawRect(referencePixel.x + Math.random()* 1200.0, referencePixel.y + Math.random()*900.0, 2, 2);
		}
		graphics.endFill();
	}

});

L.TileLayer.pixiTileLayer = function (options) {
	return new L.TileLayer.PixiTileLayer(options);
};