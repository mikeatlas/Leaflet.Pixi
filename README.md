Allows a Leaflet map to render Pixi.js (2D WebGL) analogous abstracts paths in Leaflet such as circles/polygons/polylines.

There is a [demo](http://todo] available, which shows x/y/z

Current state of the project: Incomplete! All work in the develop branch until something is working will be available in master.

# Dependencies

Attempting to be compatible with Leaflet 1.0+.

While Leaflet 0.7 supported SVG and Canvas for a long time, and works on mobile and many low-power mobile or older browsers, the decision to only attempt to integrate with Leaflet 1.0 is because [WebGL](http://caniuse.com/#feat=webgl) really won't be considered widespread for long time, and those wishing to do advanced WebGL rendering with this plugin are likely going to be targeting the latest Leaflet 1.0+ builds anyways.


# Usage

The plugin extends the core `L.Renderer` class and many of the following familar features are possible, for example:


```
L.pixiCircleMarker(porterSq).addTo(map);
```

Options available are as follows:

* `option1`: set to true in order to enable the cache. This option must be set at initialization time.

Additional events available are as follows:

* `event1`
* `event2`

# Credits / Inspiration

* [Displaying WebGL on Bing Maps (using Pixi.js)](http://build-failed.blogspot.com/2015/01/displaying-webgl-on-bing-maps-using.html)