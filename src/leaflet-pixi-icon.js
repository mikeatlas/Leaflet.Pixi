/*
 * L.PixiIcon is an icon rendered in a Pixi scene
 * It will create a default scene tile layer if one does not already exist on the map.
 */

L.PixiIcon = L.Class.extend({
	options: {
		
	},

	createIcon: function (oldIcon) {
		
	},

});

L.pixiIcon = function (options) {
	return new L.PixiIcon(options);
};