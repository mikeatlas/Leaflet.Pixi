(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * L.PixiCircleMarker is a circle overlay with a permanent pixel radius.
 */

L.PixiCircleMarker = L.Path.extend({

	options: {
		fill: true,
		fillOpacity: 1,
		radius: 10,
		renderer: new L.pixi(),
	},

	initialize: function (latlng, options) {		
		L.setOptions(this, options);		
		this._latlng = L.latLng(latlng);
		this._radius = this.options.radius;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		this.redraw();
		return this.fire('move', {latlng: this._latlng});
	},

	getLatLng: function () {
		return this._latlng;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	},

	setStyle : function (options) {
		var radius = options && options.radius || this._radius;
		L.Path.prototype.setStyle.call(this, options);
		this.setRadius(radius);
		return this;
	},

	_project: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
		this._updateBounds();
	},

	_updateBounds: function () {
		var r = this._radius,
		    r2 = this._radiusY || r,
		    w = this._clickTolerance(),
		    p = [r + w, r2 + w];
		this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
	},

	_update: function () {
		if (this._map) {
			this._updatePath();
		}
	},

	_updatePath: function () {
		this._renderer._updateCircle(this);
	},

	_empty: function () {
		return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
	}
});

L.pixiCircleMarker = function (latlng, options) {
	return new L.PixiCircleMarker(latlng, options);
};
},{}],2:[function(require,module,exports){
/*
 * L.Pixi handles Pixi WebGL layers rendering and mouse events handling. All WebGL-specific code goes here.
 */


L.Pixi = L.Renderer.extend({

	_rendererName: 'Leaflet.PixiJS.Renderer',
	_rendererInfo: 'Pixi.JS Version: ' + PIXI.VERSION,
	_container: null,
	_renderer: null,
	_graphics: new PIXI.Graphics(),


	onAdd: function () {
		if (!this._container) {
			this._initContainer(); // defined by renderer implementations
		}
		
		this._layers = this._layers || {};

		// matlas todo: "old comment said: /// redraw vectors since canvas is cleared upon removal"
		this._draw();		
	},

	_animateZoom: function() {},

	_initContainer: function () {
		var overlayDiv = this._map.getPanes().overlayPane;
		
		this._container = new PIXI.Container();
		this._ctx = this._container;
		
		var renderer = PIXI.autoDetectRenderer(
			overlayDiv.offsetWidth, 
			overlayDiv.offsetHeight, 
			{transparent: true}
		);
		this._renderer = renderer;

		overlayDiv.appendChild(renderer.view);
		renderer.view.style.position = "absolute";
		renderer.view.style.top = "0px";
		renderer.render(this._container);
	
		L.Renderer.prototype._update.call(this);
	},

	_update: function () {
		if (this._map._animatingZoom && this._bounds) { 
			return; 
		}		
		this._drawnLayers = {};

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    size = b.getSize(),
		    m = L.Browser.retina ? 2 : 1;

		//set webgl renderer size (2x factor for retina)
		this._renderer.resize(m * size.x, m * size.y)

		// if (L.Browser.retina) {
		// 	this._container.scale = new PIXI.Point(2, 2);
		// }

		// translate so we use the same path coordinates after canvas element moves
		console.log("fix ctx.translate!")
		//this._ctx.translate(-b.min.x, -b.min.y);
	},

	_initPath: function (layer) {
		this._layers[L.stamp(layer)] = layer;
	},

	_addPath: L.Util.falseFn,

	_removePath: function (layer) {
		layer._removed = true;
		this._requestRedraw(layer);
	},

	_updatePath: function (layer) {
		this._redrawBounds = layer._pxBounds;
		this._draw(true);
		layer._project();
		layer._update();
		this._draw();
		this._redrawBounds = null;
	},

	_updateStyle: function (layer) {
		this._requestRedraw(layer);
	},

	_requestRedraw: function (layer) {
		if (!this._map) { return; }

		this._redrawBounds = this._redrawBounds || new L.Bounds();
		this._redrawBounds.extend(layer._pxBounds.min).extend(layer._pxBounds.max);

		this._redrawRequest = this._redrawRequest || L.Util.requestAnimFrame(this._redraw, this);
	},

	_redraw: function () {
		this._redrawRequest = null;

		this._draw(true); // clear layers in redraw bounds
		this._draw(); // draw layers

		this._redrawBounds = null;
	},

	_draw: function (clear) {
		this._clear = clear;
		var layer;

		for (var id in this._layers) {
			layer = this._layers[id];
			if (!this._redrawBounds || layer._pxBounds.intersects(this._redrawBounds)) {
				layer._updatePath();
			}
			if (clear && layer._removed) {
				delete layer._removed;
				delete this._layers[id];
			}
		}
	},

	_updatePoly: function (layer, closed) {

		var i, j, len2, p,
		    parts = layer._parts,
		    len = parts.length,
		    ctx = this._ctx;

		if (!len) { return; }

		this._drawnLayers[layer._leaflet_id] = layer;

		ctx.beginPath();

		for (i = 0; i < len; i++) {
			for (j = 0, len2 = parts[i].length; j < len2; j++) {
				p = parts[i][j];
				ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
			}
			if (closed) {
				ctx.closePath();
			}
		}

		this._fillStroke(ctx, layer);

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_updateTransform: function () {
		var zoom = this._map.getZoom(),
		    center = this._map.getCenter(),
		    scale = this._map.getZoomScale(zoom, this._zoom),
		    offset = this._map._latLngToNewLayerPoint(this._topLeft, zoom, center);

		console.log('fix _updateTransform')
		//	L.DomUtil.setTransform(this._container, offset, scale);
	},

	_updateCircle: function (layer) {
		var color = layer.options.color.toNumber();
		var alpha = layer.options.fillOpacity;
		this._graphics.beginFill(color, alpha);
		var p = this._map.latLngToLayerPoint(layer.getLatLng())
		this._graphics.drawCircle(p.x, p.y, layer._radius);
		this._graphics.endFill();		
		this._container.addChild(this._graphics);
		this._renderer.render(this._container);
	},

	_fillStroke: function (ctx, layer) {
		var clear = this._clear,
		    options = layer.options;

		ctx.globalCompositeOperation = clear ? 'destination-out' : 'source-over';

		if (options.fill) {
			ctx.globalAlpha = clear ? 1 : options.fillOpacity;
			ctx.fillStyle = options.fillColor || options.color;
			ctx.fill(options.fillRule || 'evenodd');
		}

		if (options.stroke && options.weight !== 0) {
			ctx.globalAlpha = clear ? 1 : options.opacity;

			// if clearing shape, do it with the previously drawn line width
			layer._prevWeight = ctx.lineWidth = clear ? layer._prevWeight + 1 : options.weight;

			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	},

	// Canvas obviously doesn't have mouse events for individual drawn objects,
	// so we emulate that by calculating what's under the mouse on mousemove/click manually

	_onClick: function (e) {
		var point = this._map.mouseEventToLayerPoint(e);

		for (var id in this._layers) {
			if (this._layers[id]._containsPoint(point)) {
				L.DomEvent._fakeStop(e);
				this._fireEvent(this._layers[id], e);
			}
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map.dragging._draggable._moving || this._map._animatingZoom) { return; }

		var point = this._map.mouseEventToLayerPoint(e);
		this._handleMouseOut(e, point);
		this._handleMouseHover(e, point);
	},


	_handleMouseOut: function (e, point) {
		var layer = this._hoveredLayer;
		if (layer && (e.type === 'mouseout' || !layer._containsPoint(point))) {
			// if we're leaving the layer, fire mouseout
			L.DomUtil.removeClass(this._container, 'leaflet-interactive');
			this._fireEvent(layer, e, 'mouseout');
			this._hoveredLayer = null;
		}
	},

	_handleMouseHover: function (e, point) {
		var id, layer;
		if (!this._hoveredLayer) {
			for (id in this._drawnLayers) {
				layer = this._drawnLayers[id];
				if (layer.options.interactive && layer._containsPoint(point)) {
					L.DomUtil.addClass(this._container, 'leaflet-interactive'); // change cursor
					this._fireEvent(layer, e, 'mouseover');
					this._hoveredLayer = layer;
					break;
				}
			}
		}
		if (this._hoveredLayer) {
			this._fireEvent(this._hoveredLayer, e);
		}
	},

	_fireEvent: function (layer, e, type) {
		this._map._fireDOMEvent(e, type || e.type, [layer]);
	},

	// TODO _bringToFront & _bringToBack, pretty tricky

	_bringToFront: L.Util.falseFn,
	_bringToBack: L.Util.falseFn
});

L.Browser.pixi = (function () {
	return (PIXI);
}());

L.pixi = function (options) {
	return PIXI ? new L.Pixi(options) : null;
};

L.Polyline.prototype._containsPoint = function (p, closed) {
	var i, j, k, len, len2, part,
	    w = this._clickTolerance();

	if (!this._pxBounds.contains(p)) { return false; }

	// hit detection for polylines
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			if (!closed && (j === 0)) { continue; }

			if (L.LineUtil.pointToSegmentDistance(p, part[k], part[j]) <= w) {
				return true;
			}
		}
	}
	return false;
};

L.Polygon.prototype._containsPoint = function (p) {
	var inside = false,
	    part, p1, p2, i, j, k, len, len2;

	if (!this._pxBounds.contains(p)) { return false; }

	// ray casting algorithm for detecting if point is in polygon
	for (i = 0, len = this._parts.length; i < len; i++) {
		part = this._parts[i];

		for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
			p1 = part[j];
			p2 = part[k];

			if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
				inside = !inside;
			}
		}
	}

	// also check if it's on polygon stroke
	return inside || L.Polyline.prototype._containsPoint.call(this, p, true);
};

L.CircleMarker.prototype._containsPoint = function (p) {
	return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
};


L.Map.include({
	// used by each vector layer to decide which renderer to use
	getRenderer: function (layer) {
		var renderer = layer.options.renderer || 
			this._getPaneRenderer(layer.options.pane) || 
			this.options.renderer || 
			this._renderer;

		if (!renderer) {
			renderer = this._renderer = (this.options.preferCanvas && L.canvas()) || 
				(this.options.preferPixi && PIXI) || 
				L.svg();
		}

		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	_getPaneRenderer: function (name) {
		if (name === 'overlayPane' || name === undefined) {
			return false;
		}

		var renderer = this._paneRenderers[name];
		if (renderer === undefined) {
			renderer = (L.SVG && L.svg({pane: name})) || 
				(L.Canvas && L.canvas({pane: name})) ||
				(L.Pixi && L.canvas({pane: name}));
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	}
});
},{}],3:[function(require,module,exports){

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
},{}],4:[function(require,module,exports){
require('./utils.js');
require('./leaflet-pixi-renderer.js');
require('./leaflet-pixi-tilelayer.js');
require('./leaflet-pixi-circlemarker.js');
},{"./leaflet-pixi-circlemarker.js":1,"./leaflet-pixi-renderer.js":2,"./leaflet-pixi-tilelayer.js":3,"./utils.js":5}],5:[function(require,module,exports){

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
},{}]},{},[4]);
