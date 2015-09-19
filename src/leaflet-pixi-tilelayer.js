
L.TileLayer.PixiTileLayer = L.TileLayer.extend({
 	options: { 		
 		option2: 2,
 	},

 	// matlas todo: figure out how to override DOM class thing in base Renderer
	// https://github.com/Leaflet/Leaflet/blob/bf8f0b45b1e734fcf317505511b8bc2fc0229c50/src/layer/vector/Renderer.js#L24
	// pixi stuff can certainly be "zoom animated" but not in the traditional
	// Leaflet 1.0 DOM CSS transition sense.
	_zoomAnimated: false,


 	initialize: function (options) {
 		options = L.setOptions(this, options); 		 		
 		options.renderer = L.Pixi;
 	},

 	onAdd: function (map) {
		this.map = map;
		this.initPixiTileLayer();
		this.initMapEventHandlers();
	},

 	initPixiTileLayer: function() {
 		var params = {};
 		var tilePaneDiv = this.map.getPanes().tilePane
 		var overlayPaneDiv = this.map.getPanes().overlayPane
		var stage = new PIXI.Container();
		this.stage = stage;
		var mapContainerDiv = this.map.getContainer();
		var renderer = PIXI.autoDetectRenderer(
			mapContainerDiv.offsetWidth, 
			tilePaneDiv.offsetHeight, 
			{transparent: true}
		);
		this.renderer = renderer;
		overlayPaneDiv.parentNode.lastChild.appendChild(renderer.view);
		renderer.view.style.position = "absolute";
		renderer.view.style.top = "0px";
		renderer.render(stage);
	},

	initMapEventHandlers: function() {
		this.map.on('move', this._mapMoved, this);
	},

	_mapMoved: function(moveEvent){
		var pixelCenter = this.map.latLngToContainerPoint(moveEvent.target.getCenter());

		var divTopLeft = this.map.getPixelOrigin();
	
        var x = divTopLeft.x;
        var y = divTopLeft.y;

        this.graphics.position.x = x;
        this.graphics.position.y = y;
        this.renderer.render(this.stage);
	},

	runTest: function(){
		// test
		var graphics = new PIXI.Graphics();
		this.graphics = graphics
		var porterSq = new L.LatLng(42.388349, -71.119355);
		var referencePixel = this.map.latLngToContainerPoint(porterSq);

		this.graphics.beginFill(0xFFFFFF);
		for(var i=0; i < 20000; i++) {
		    graphics.drawCircle(referencePixel.x + Math.random()* 1200.0, referencePixel.y + Math.random()*900.0, 2, 2);
		}
		this.graphics.endFill();		
		this.stage.addChild(this.graphics);
		this.renderer.render(this.stage);
	}

});

L.TileLayer.pixiTileLayer = function (options) {
	return new L.TileLayer.PixiTileLayer(options);
};