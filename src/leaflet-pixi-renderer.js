/*
 * L.Pixi handles Pixi WebGL layers rendering and mouse events handling. All WebGL-specific code goes here.
 */


L.Pixi = L.Renderer.extend({

	_rendererName: 'Leaflet.PixiJS.Renderer',
	_rendererInfo: 'Pixi.JS Version: ' + PIXI.VERSION,
	_container: null,
	_renderer: null,	
	_paths: {},

	options: {
		// how much to extend the clip area around the map view (relative to its size)
		// e.g. 0.1 would be 10% of map view in each direction; defaults to clip with the map view
		padding: 0.1
	},

	onAdd: function () {
		if (!this._container) {
			this._initContainer(); // defined by renderer implementations
		}
		
		this._layers = this._layers || {};
		this._draw();		
	},

	_animateZoom: function() {},

	_initContainer: function () {
		var mapContainer = this._map.getContainer();
		this._container = new PIXI.Container();
		this._ctx = this._container;
		
		var renderer = new PIXI.WebGLRenderer(
			mapContainer.offsetWidth, 
			mapContainer.offsetHeight, 
			{transparent: false}
		);
		this._renderer = renderer;

		this._map.getPanes().overlayPane.appendChild(renderer.view);
		renderer.view.style.position = "absolute";
		renderer.view.style.top = "0px";
		renderer.view.style.opacity = 0.7;
		renderer.render(this._container);
	
		L.Renderer.prototype._update.call(this);
	},

	_update: function (event) {
		if (this._map._animatingZoom && this._bounds) { 
			return; 
		}		
		this._drawnLayers = {};

		L.Renderer.prototype._update.call(this);

		var b = this._bounds,
		    size = b.getSize(),
		    m = L.Browser.retina ? 2 : 1;

		//set webgl renderer size (2x factor for retina)
		this._renderer.resize(size.x, size.y);


		this._renderer.render(this._container);
		
	},

	_initPath: function (layer) {
		this._layers[L.stamp(layer)] = layer;
	},

	_addPath: function (layer) {
		var uuid = layer.options.uuid;
		
		if (!this._pathExists(layer)) {
			var color = layer.options.color.toNumber();
			var alpha = layer.options.fillOpacity;
			var graphics = new PIXI.Graphics();
			graphics.beginFill(color, alpha);
			var p = this._map.latLngToLayerPoint(layer.getLatLng())
			console.log("p: " + p);
			graphics.drawCircle(p.x, p.y, layer._radius);
			graphics.endFill();		
			var pixiDisplayObject = this._container.addChild(graphics);
			pixiDisplayObject.uuid = uuid;
			pixiDisplayObject.latLng = layer.getLatLng();
			pixiDisplayObject._map = this._map;
			pixiDisplayObject.moveBackToLatLng = function() {
				var p = this._map.latLngToLayerPoint(layer.getLatLng())
				console.log("p': " + p);
				this.x = p.x;
				this.y = p.y;	
			};
			pixiDisplayObject.interactive = layer.options.interactive || true;
			this._paths[uuid] = pixiDisplayObject;
			this._renderer.render(this._container);
		}
	},

	_zoomUpdate: function (layer) {
		this._initPath();
		var uuid = layer.options.uuid;
		var pixiDisplayObject = this._paths[uuid];
		debugger;
	},

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

	},

	_updateTransformPixiCircleMarker: function(event) {
		var p = this.options.padding;
		var size = this._map.getSize();
		var min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
		this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

		if (this._map._animatingZoom && this._bounds) { return; }
		var b = this._bounds;
		//this._renderer._container.position = new PIXI.Point(b.min.x, b.min.y);
		var q = this._map.latLngToLayerPoint(this._latlng);
		//this._renderer._container.children[0].moveTo(q.x, q.y);
		this._renderer._container.children[0].moveBackToLatLng();
		this._renderer._renderer.render(this._renderer._container);
	},

	_pathExists: function (layer) {
		var uuid = layer.options.uuid;
		if (this._paths[uuid] === null || typeof this._paths[uuid] == 'undefined') {
			return false;
		}
		return true;
	},

	_updateCircle: function (layer) {
		var uuid = layer.options.uuid;
		
		if (this._pathExists(layer)) {
			var pixiDisplayObject = this._paths[uuid];
			var p = this._map.latLngToLayerPoint(layer.getLatLng());
			var overlayDiv = this._map.getPanes().overlayPane;

			//pixiDisplayObject.parent.moveTo(p.x, p.y);
			this._paths[uuid] = pixiDisplayObject;			
		}
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