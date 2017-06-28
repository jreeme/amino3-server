/**
 * Copyright (c) 2013-2014 Oculus Info Inc. 
 * http://www.oculusinfo.com/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Aperture
 */
aperture = (function(aperture){

/**
 * Source: esri.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Map APIs
 *
 *This code was written to integrate maps created using the Esri JS/ArcGIS Javascript library 
 * into Aperture.
 *
 */

/**
 * @namespace Geospatial vizlet layers. If not used the geospatial package may be excluded.
 * @requires OpenLayers or ESRI
 */
aperture.geo = (
/** @private */
function(ns) {
function esriMaps() {
	aperture.log.info('Loading ESRI map api implementation...');
	
	var SpatialReference = require("esri/SpatialReference"), 
		Extent = require("esri/geometry/Extent"), 
		Point = require("esri/geometry/Point"), 
		EsriMapType = require("esri/map"), 
		ArcGISDynamicMapServiceLayer = require( "esri/layers/ArcGISDynamicMapServiceLayer");

	// util is always defined by this point
	var util = aperture.util, esri = 'ESRI_CANVAS';
	//
	// Searchers through a set of layers to find
	// the base layer's index.
	var getBaseLayerIndex = function(map) {
		var i, layers = map.layers;
		for(i=0; i < layers.length; i++) {
			if(layers[i].isBaseLayer==true){
				return(i);
			}
		}
	};
	

	define("ApertureEsriTMSLayer", [ "dojo/_base/declare","esri/SpatialReference", "esri/geometry/Extent", "esri/layers/TileInfo", "esri/layers/TiledMapServiceLayer" ], 
									function(declare, SpatialReference, Extent, TileInfo, TiledMapServiceLayer) {
		return declare(TiledMapServiceLayer, {
			constructor : function(config) {
				if (typeof config.esriOptions == 'undefined') {
					return aperture.log.error('Esri options must be specfied for Esri TMS layers');
				}
			
				if (typeof config.esriOptions.wkid !== 'undefined') {
					this.spatialReference = new SpatialReference({
						wkid : config.wkid
					});
					if (typeof config.extent !== 'undefined') {
						var extentConfig = config.extent;
						extentConfig.spatialReference = this.spatialReference;
						var ext = new Extent(extentConfig);
						this.initialExtent = this.fullExtent = ext;
					}
				}

				// Could do a mixin but will get properties we don't want
				this.urlPrefix = config.urlPrefix;
				this.urlVersion = config.urlVersion;
				this.urlLayer = config.urlLayer;
				this.urlType = config.urlType;
				this.maxScale = config.esriOptions.maxScale;
				this.minScale = config.esriOptions.minScale;
				this.opacity = config.esriOptions.opacity;

				if ((typeof config.esriOptions.tiles !== 'undefined') && (typeof config.esriOptions.lods !== 'undefined')) {
					var tileConfig = config.esriOptions.tiles;
					tileConfig.lods = config.esriOptions.lods;
					this.tileInfo = new TileInfo(tileConfig);
				}

				this.loaded = true;
				this.onLoad(this);
			},

			getTileUrl : function(level, row, col) {
				row = Math.pow(2, level) - row - 1;
				return 	this.urlPrefix + "/" +
						this.urlVersion + "/" + 
						this.urlLayer + "/" + 
						level + "/" + 
						col + "/" + 
						row	+ this.urlType;
			}
		});
	});		

	// if basic Canvas ever implements stuff for real we should override where it makes sense
	var EsriCanvas = aperture.canvas.Canvas.extend( 'aperture.geo.EsriCanvas', {
			init : function(root, map) {
				aperture.canvas.Canvas.prototype.init.call(this, root);
				this.esriMap_ = map;
			}
		}
	);
	//
	aperture.canvas.handle( esri, EsriCanvas );
	//
//			    /**
//			     * @private
//			     * Base of Map Layer classes
//			     */
	var EsriMapLayer = aperture.Layer.extend( '[private].EsriMapLayer', {
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);
	//
			if (spec.extent) {
				spec.extent = OpenLayers.Bounds.fromArray(spec.extent);
			}
			if ( !this.canvas_ ) {
				throw new Error('Map layer must be constructed by a parent layer through an addLayer call');
			}
		},
	//
		/**
		 * OpenLayers layer
		 */
		esriLayer_ : null, // Assumption that a single OpenLayers layer can be used for all rendering
	//
	//
		/**
		 * Canvas type is OpenLayers
		 */
		canvasType : esri,
	//
		/**
		 * @private
		 */
		data : function(value) {
			if( value ) {
				throw new Error('Cannot add data to a base map layer');
			}
		},
	//
		/**
		 * @private
		 */
		render : function(changeSet) {
			// Must force no render logic so the layer doesn't try to monkey around with data
		},
//			        
		/**
		 * @private
		 */
		remove : function() {
			aperture.Layer.prototype.remove.call(this);
	//
			// hook into open layers to remove
			//ESRI TODO REMOVE CALL
			//this.canvas_.olMap_.removeLayer(this.olLayer_);
		}
	});
	//    

	// deprecated
	var tileTypeAliases = {
			tms : 'TMS',
			wms : 'WMS'
		};
	//    
	//    
	var MapTileLayer = EsriMapLayer.extend( 'aperture.geo.MapTileLayer', 
	/** @lends aperture.geo.MapTileLayer# */
	{
		/**
		 * @class The base class for Aperture Map layers that displays one or more image tiles 
		 * from one of a variety of standards based sources.
		 *
		 * @augments aperture.Layer
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			EsriMapLayer.prototype.init.call(this, spec, mappings);
	//
			spec.options = spec.options || {};
			
			if (spec.options.isBaseLayer == null) {
				spec.options.isBaseLayer = false;
			}
		}		
	});
	//
		ns.MapTileLayer = MapTileLayer;
	//

	ns.MapTileLayer.TMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.TMS', 
			/** @lends aperture.geo.MapTileLayer.TMS# */
			{

				init : function(spec, mappings) {
					MapTileLayer.prototype.init.call(this, spec, mappings);
					var ApertureEsriTMSLayer = require("ApertureEsriTMSLayer");
					this.esriLayer = new ApertureEsriTMSLayer(spec);
					this.canvas_.esriMap_.addLayer(this.esriLayers);			
				}		
			});

	//
	/**********************************************************************/
	/*
	 * The list of OpenLayers vector layer styles that can be mapped in Aperture
	 */
	var availableStyles = {
			'fillColor' : 'fill',
			'fillOpacity': 'opacity',
			'strokeColor': 'stroke',
			'strokeOpacity': 'stroke-opacity',
			'strokeWidth': 'stroke-width',
			'strokeLinecap': 'stroke-linecap',
			'strokeDashstyle': 'stroke-style', // needs translation?
//					'graphicZIndex', ??
			'label': 'label',
			'pointRadius': 'radius',
			'cursor': 'cursor',
			'externalGraphic': '' // overridden below
	};
	//
	/*
	 * Default values for all settable styles (used if not mapped)
	 * TODO Allow this to be overridden by configuration
	 */
	var vectorStyleDefaults = {
		fillColor: '#999999',
		fillOpacity: '1',
		strokeColor: '#333333',
		strokeOpacity: '1',
		strokeWidth: 1,
		strokeLinecap: 'round',
		strokeDashstyle: 'solid',
		graphicZIndex: 0,
		// Must have a non-undefined label or else OpenLayers writes "undefined"
		label: '',
		// Must have something defined here or IE throws errors trying to do math on "undefined"
		pointRadius: 0,
		cursor: ''
	};
	//
	/*
	 * Styles that are fixed and cannot be altered
	 * TODO Allow this to be overridden by configuration
	 */
	var fixedStyles = {
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 10
	//
		// If we allow the following to be customizable by the user
		// this prevents us from using the default of the center of the image!
		//graphicXOffset:
		//graphicYOffset:
	};
	//
	// returns private function for use by map external layer
	var makeHandler = (function() {
		
		// event hooks for features.
		function makeCallback( type ) {
			var stopKey;
			
			switch (type) {
			case 'click':
			case 'dblclick':
				stopKey = 'stopClick';
				break;
			case 'mousedown':
			case 'touchstart': // ?
				stopKey = 'stopDown';
				break;
			case 'mouseup':
				stopKey = 'stopUp';
				break;
			}
			if (stopKey) {
				return function(feature) {
					this.handler_[stopKey] = this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			} else {
				return function(feature) {
					this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			}
		}

		var featureEvents = {
			'mouseout' : 'out',
			'mouseover' : 'over'
		};
		
		return function (events) {
			var handlers = {}, active;
			
			if (this.handler_) {
				this.handler_.deactivate();
				this.handler_= null;
			}
			
			aperture.util.forEach(events, function(fn, event) {
				handlers[ featureEvents[event] || event ] = makeCallback(event);
				active = true;
			}); 
	//
			if (active) {

			}
		};
	}());
	
	//
	// default property values for map nodes.
	var mapNodeProps = {
		'longitude' : 0,
		'latitude' : 0
	};
	
	var updateContentFrame = function(mapNodeLayer) {
		var contentFrame = mapNodeLayer.contentFrame;
		var esriMap = mapNodeLayer.mapCanvas.esriMap_;
		var extent = esriMap.geographicExtent;
		var apiProjection = new SpatialReference(4326);
		var topLeft = new Point(extent.xmin , extent.ymax, apiProjection );
		var bottomRight = new Point( extent.xmax, extent.ymin, apiProjection);
		
		var screenTL = esriMap.toScreen(topLeft);
		var screenBR = esriMap.toScreen(bottomRight);
		
		//If we render the aperture SVG elements into a div that is a 3x3 grid of the actual viewport
		//then when we pan (move the div) the elements that are outside the viewport are rendered correctly.
		var returnHeight = screenBR.y * 3;
		var returnWidth  = screenBR.x * 3;
		
		screenBR.x = screenBR.x * -1;
		screenBR.y = screenBR.y * -1;
		mapNodeLayer.corrective = { x:screenBR.x,y:screenBR.y};
		var canvasSize =  {h: returnHeight, w : returnWidth};

		mapNodeLayer._canvasWidth = canvasSize.w;
		mapNodeLayer._canvasHeight = canvasSize.h;
		
		OpenLayers.Util.modifyDOMElement(contentFrame, null, mapNodeLayer.corrective, canvasSize, 'absolute');
		mapNodeLayer.corrective.x = mapNodeLayer.corrective.x * -1;
		mapNodeLayer.corrective.y = mapNodeLayer.corrective.y * -1;
	};
	
	//
	/*
	 * TODO: Create a generic container layer that just creates a canvas for children
	 * to use.  Map lat/lon to [0,1] ranges and then renderers can scale x/y based on
	 * size of canvas.  Then can make MapNodeLayer derive from this layer.  This layer
	 * could be used as parent for a layer drawing a series of points/labels, for
	 * example.
	 */
	//
	var MapNodeLayer = aperture.PlotLayer.extend( 'aperture.geo.MapNodeLayer',
	/** @lends aperture.geo.MapNodeLayer# */
	{
		/**
		 * @class A layer that draws child layer items at point locations.
		 * 
		 * @mapping {Number} longitude
		 *   The longitude at which to locate a node
		 *   
		 * @mapping {Number} latitude
		 *   The latitude at which to locate a node
		 *
		 * @augments aperture.PlotLayer
		 * @constructs
		 * @factoryMade
		 */
		init: function(spec, mappings) {
			this.robId = "MapNodeLayer";
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
			
			if (mappings && mappings.map) {
				this.canvas_.esriMap_ = mappings.map;
			}

			// because we declare ourselves as an open layers canvas layer this will be 
			// the parenting open layers canvas, which holds the map reference. Note however that
			// since we are really a vector canvas layer we override that a ways below.
			this.mapCanvas = this.canvas_;
			if (!this.mapCanvas.esriMap_) {
				aperture.log.error('MapNodeLayer must be added to a map.');
				return;
			}
			
			var that = this;

			
			var appendControl = document.getElementById('map_container');
			this.contentFrame = document.createElement('div');
			this.contentFrame.style.position = 'absolute';
			
			appendControl.appendChild(this.contentFrame);
			
			this.mapCanvas.esriMap_.on("load", function() {
				that.mapCanvas.esriMap_.graphics.enableMouseEvents();						
				updateContentFrame(that);
			});					
				
			var renderHandler = function() {						
				updateContentFrame(that);
				that.contentFrame.style.visibility = "visible";
				that.all().redraw();						
			};
			
			var hideHandler = function() {
				that.contentFrame.style.visibility = "hidden";
			};
			
			var panHandler = function(extent) {
				var newY = extent.delta.y - that.corrective.y;
				var newX = extent.delta.x - that.corrective.x;
				that.contentFrame.style.top  = newY + "px";
				that.contentFrame.style.left = newX + "px";
			};
			
			this.mapCanvas.esriMap_.on("zoom-start", hideHandler);
			this.mapCanvas.esriMap_.on("zoom-end", renderHandler);
			this.mapCanvas.esriMap_.on("pan-end", renderHandler);
			this.mapCanvas.esriMap_.on("pan", panHandler);			
													
			// because we parent vector graphics but render into a specialized open layers
			// canvas we need to help bridge the two by pre-creating this canvas with the
			// right parentage.
			var EsriVectorCanvas = aperture.canvas.type(aperture.canvas.VECTOR_CANVAS);
	//
			this.canvas_ = new EsriVectorCanvas( this.contentFrame );
			this.mapCanvas.canvases_.push( this.canvas_ );
		},				

		update : function() {
			updateContentFrame(this);
		},
						
	//
		/**
		 * @private
		 */
		canvasType : esri,
	//
		/**
		 * @private
		 */
		render : function( changeSet ) {
			// just need to update positions
			aperture.util.forEach(changeSet.updates, function( node ) {
				// If lon,lat is specified pass the position to children
				// Otherwise let the children render at (x,y)=(0,0)
				var lat = this.valueFor('latitude', node.data, null);
				var lon = this.valueFor('longitude', node.data, null);
	//
				// Find pixel x/y from lon/lat
				var px = {x:0,y:0};
				if (lat != null && lon != null) {
					var mapPoint = new Point( lon, lat, apiProjection );
					px = this.vizlet_.esriMap_.toScreen(mapPoint);
					px.x += this.corrective.x;
					px.y += this.corrective.y;
				}
	//
				node.position = [px.x,px.y];
				node.userData.width = this._canvasWidth;
				node.userData.height = this._canvasHeight;							
	//
				// Update width/height
	//
			}, this);
			
			
			// will call renderChild for each child.
//					this.zoomed = false;
			aperture.PlotLayer.prototype.render.call(this, changeSet);
//					
//					//Copy the rendered elements into the Esri Graphics layer
//					var svgElement = document.getElementById('map_graphics_layer');
//					var removeElements = [];
//					for (var index = 0; index < svgElement.children.length; index++) {
//						removeElements.push(svgElement.children[index]);
//					}
//					
//					for (var index = 0; index < removeElements.length; index++) {
//						svgElement.removeChild(removeElements[index]);
//					}
//										
//					var copyElements = this.contentFrame.children[0].children;					
//					for (var index = 0; index < copyElements.length; index++) {
//						var clonedNode = copyElements[index].cloneNode(true);
//						svgElement.appendChild(clonedNode);
//					}
			
//					//The appendChild call removes the element from the children array so must
//					//clone the array
//					var tempArray = [];
//					for (var index = 0; index < copyElements.length; index++) {
//						tempArray.push(copyElements[index]);
//					}
//					
//					for (var index = 0; index < tempArray.length; index++) {
//						svgElement.appendChild(tempArray[index]);						
//					}
	//
		},
	//
		/**
		 * @private
		 */
		renderChild : function(layer, changeSet) {
			// Pass size information to children (so LineSeriesLayer can render correctly)
			aperture.util.forEach( changeSet.updates, function (node) {
				if (node) {
					node.width = node.parent.userData.width;
					node.height = node.parent.userData.height;
				}
			});
			layer.render( changeSet );
		},
	//
		/**
		 * Given a location returns its pixel coordinates in container space.
		 */
		getXY: function(lon,lat) {
			var mapPoint = new Point( lon, lat, apiProjection );
			var screenPoint = this.vizlet_.esriMap_.toScreen(mapPoint);
			return screenPoint;
		},
	//
		getExtent: function() {
//					var extent =  this.vizlet_.esriMap_.extent;
			return {left: 0, right:0, top:0, bottom:0};
		}
	});
	//
	ns.MapNodeLayer = MapNodeLayer;
	//
	//
	/************************************************************************************/
	//
	//

	//
	/*
	 * The projection that the API expects unless instructed otherwise.  All layers
	 * and data are to be expressed in this projection.
	 */
	var apiProjection = new SpatialReference(4326);
	//
	/*
	 * Default map options
	 */
	var defaultMapConfig = {
		options : {
			projection : apiProjection,
			displayProjection : apiProjection
		}
	};
	//
	/**
	 * Call on zoom completion.
	 */
	function notifyZoom() {
		this.trigger('zoom', {
			eventType : 'zoom',
			layer : this
		});
	}
	//
	function notifyPan() {
		this.trigger('panend', {
			eventType : 'panend',
			layer : this
		});
	}

	var EsriMapVizletLayer = aperture.PlotLayer.extend( 'aperture.geo.EsriMapVizletLayer',
	// documented as Map, since it currently cannot function as a non-vizlet layer.
	/**
	 * @lends aperture.geo.Map#
	 */
	{
		/**
		 * @class A map vizlet is capable of showing geographic and geographically located data.  It
		 * contains a base map and additional child geo layers can be added. The base map is
		 * typically configured as a system-wide default, although can be overridden via the
		 * spec object passed into this constructor.  This layer does not require or support any
		 * mapped properties. 
		 *
		 *
		 * @constructs
		 * @augments aperture.PlotLayer
		 *
		 * @param {Object|String|Element} spec
		 *      A specification object detailing options for the map construction, or
		 *      a string specifying the id of the DOM element container for the vizlet, or
		 *      a DOM element itself. A
		 *      specification object, if provided, includes optional creation options for the
		 *      map layer.  These options can include base map configuration, map projection settings,
		 *      zoom level and visible area restrictions, and initial visible bounds.  Other than an id,
		 *      the following options do not need to be included if they are already configured via the 
		 *      aperture.config system.
		 * @param {String|Element} spec.id
		 *      If the spec parameter is an object, a string specifying the id of the DOM
		 *      element container for the vizlet or a DOM element itself.
		 * @param {Object} [spec.options]
		 *      Object containing options to pass directly to the Openlayers map.
		 * @param {String} [spec.options.projection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for the map.
		 * @param {String} [spec.options.displayProjection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for displaying map data to the user, for example mouse hover coordinate overlays.
		 * @param {String} [spec.options.units]
		 *      The units used by the projection set above
		 * @param {Array} [spec.options.maxExtent]
		 *      A four-element array containing the maximum allowed extent (expressed in units of projection
		 *      specified above) of the map given the limits of the projection.
		 * @param {Object} [spec.baseLayer]
		 *      Object containing information about the base map layer that should be created.
		 * @param {Object} spec.baseLayer.{TYPE}
		 *      The base layer specification where {TYPE} is the class of MapTileLayer 
		 *      (e.g. {@link aperture.geo.MapTileLayer.TMS TMS}) and
		 *      its value is the specification for it.
		 * @param {Object} [mappings]
		 *      An optional initial set of property mappings.
		 */
		init : function(spec, mappings) {
	//
			// clone - we will be modifying, filling in defaults.
			this.spec = spec = util.extend({}, spec);
	//
			// pass clone onto parent.
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
	//
	//
			// PROCESS SPEC
			// Clone provided options and fill in defaults
			spec.options = util.extend({}, defaultMapConfig.options || {}, spec.options);
	//
			// Ensure projections are in OpenLayers class format
			if( util.isString(spec.options.projection) ) {
				spec.options.projection = new OpenLayers.Projection(spec.options.projection);
			}
			if( util.isString(spec.options.displayProjection) ) {
				spec.options.displayProjection = new OpenLayers.Projection(spec.options.displayProjection);
			}
	//
			// Ensure maxExtent is an OpenLayer bounds object
			if( util.isArray(spec.options.maxExtent) ) {
				spec.options.maxExtent = OpenLayers.Bounds.fromArray(spec.options.maxExtent);
			}
			
			// If map to have no controls, initialize with new empty array, not array from defaultMapConfig
			if(util.isString(spec.options.controls)||(util.isArray(spec.options.controls)&&(spec.options.controls.length==0))){
				spec.options.controls = [];  
			}
	//
			// Clone provided base layer information and fill in defaults
			spec.baseLayer = util.extend({}, defaultMapConfig.baseLayer || {}, spec.baseLayer);
	//
			// CREATE MAP
			// Create the map without a parent
						
			this.esriMap_ = new EsriMapType("map", defaultMapConfig.esriOptions );
			this.canvas_.canvases_.push(new EsriCanvas( this.canvas_.root(), this.esriMap_ ) );

			this.basemapLayer = new ArcGISDynamicMapServiceLayer("http://192.168.0.152:6080/arcgis/rest/services/Natural_Earth_SERVICE_BLACK_WM/Natural_Earth_SERVICE_BLACK_WM/MapServer");
			this.esriMap_.addLayer(this.basemapLayer);
			
			var type = '', config = null;
			
			for (type in spec.baseLayer) {
				if (spec.baseLayer.hasOwnProperty(type)) {
					config = spec.baseLayer[type];
					break;
				}
			}
	// 
			if (!config) {
				//Do nothing				
			} else {
				config.options = config.options || {};
				config.options.isBaseLayer = true;
				
				var resolvedType = tileTypeAliases[type] || type;
	//
				if (MapTileLayer[resolvedType]) {
					this.addLayer( MapTileLayer[resolvedType], {}, config );
				} else {
					aperture.log.warn('WARNING: unrecognized map base layer type: '+ type);
					//Do nothing
				}
			}
			
			// Add mouse event handlers that pass click and dblclick events
			// through to layer event handers
			var that = this,
				handler = function( event ) {
					that.trigger(event.type, {
						eventType: event.type
					});
				};
	//
			// XXX Set an initial viewpoint so OpenLayers doesn't whine
			// If we don't do this OpenLayers dies on nearly all lat/lon and pixel operations
//					this.zoomTo(0,0,1);
//			//
			this.esriMap_.on('zoom-end', function() {
				notifyZoom.apply(that);
			});
			this.esriMap_.on('pan-end', function() {
				notifyPan.apply(that);
			});
		},
	//
		/**
		 * @private
		 * The map requires a DOM render context
		 */
		canvasType : aperture.canvas.DIV_CANVAS,
	//
		/**
		 * Zooms to the max extent of the map.
		 */
		zoomToMaxExtent: function() {
			//Do not know how to implement this in ESRI
			//this.olMap_.zoomToMaxExtent();
		},
		
		setOpacity: function(opacity) {
			if (this.basemapLayer) {
				this.basemapLayer.setOpacity(opacity);
			}
		},
		
		getOpacity : function() {
			return this.basemapLayer ? this.basemapLayer.opacity : -1;
		},
		
		on: function(eventType, handler) {
			return this.esriMap_.on(eventType, handler);
		},
		
		
		getExtent: function() {
			var bounds = null;
			if (this.esriMap_.extent) {
				bounds = {};
				bounds.left = this.esriMap_.extent.xmin;
				bounds.bottom = this.esriMap_.extent.ymin;
				bounds.right = this.esriMap_.extent.xmax;
				bounds.top = this.esriMap_.extent.ymax;
			}
			return bounds;
		},
		
		/**
		 * Zooms in one zoom level, keeps center the same.
		 */
		zoomIn: function() {
			var maxZoom = this.esriMap_.getMaxZoom();
			var currentZoom = this.esriMap_.getZoom();
			if ((maxZoom !== -1) && (currentZoom < maxZoom)) {
				this.esriMap_.setZoom(currentZoom + 1);
			}			
		},
	//
		/**
		 * Zooms out one zoom level, keeps center the same (if possible).
		 */
		zoomOut: function() {
			var minZoom = this.esriMap_.getMinZoom();
			var currentZoom = this.esriMap_.getZoom();
			if ((minZoom !== -1) && (currentZoom > minZoom)) {
				this.esriMap_.setZoom(currentZoom - 1);
			}
		},
	//
		/**
		 * Returns the zoom level as an integer.
		 */
		getZoom: function() {
			return this.esriMap_.getZoom();
		},
	//
		/**
		 * Sets the map extents give a center point in lon/lat and a zoom level
		 * Always accepts center as lon/lat, regardless of map's projection
		 * @param lat latitude to zoom to
		 * @param lon longitude to zoom to
		 * @param zoom zoom level (map setup dependent)
		 */
		zoomTo : function( lat, lon, zoom ) {
			var mapPoint = new Point( lon, lat, apiProjection );
			this.esriMap_.centerAndZoom(mapPoint, zoom);
		},
	//
		/**
		 * Sets visible extents of the map in lat/lon (regardless of current coordinate
		 * system)
		 * @param left left longitude of extent
		 * @param top top latitude of extent
		 * @param right right longitude of extent
		 * @param bottom bottom latitude of extent
		 */
		setExtents : function( left, top, right, bottom ) {
			var extent = new Extent(left, bottom,right, top , new SpatialReference({ wkid: 4326 })); 
			this.esriMap_.setExtent(extent);
		}
	});
	//
	/**
	 * @private
	 */
	// MapVizletLayer is currently documented as Map, since it does not currently function as a non-vizlet layer.
	var EsriMap = aperture.vizlet.make( EsriMapVizletLayer );
	ns.Map = EsriMap;
	//
	//
	/*
	 * Register for config notification
	 */
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				// override local defaults with any configured defaults.
				util.extend( defaultMapConfig, config['aperture.map'].defaultMapConfig );
			}
	//
			aperture.log.info('Map configuration set.');
		}
	});
}

	// load the esri map implementation if the default mapType is configured to be esri.
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				mapType = config['aperture.map'].defaultMapConfig.mapType;
				
				if ((mapType && mapType.toLowerCase()) === 'esri') {
					esriMaps();
				}
			}
		}
	});
	
	return ns;
}(aperture.geo || {}));

/**
 * Source: map.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Map APIs
 */

/**
 * @namespace Geospatial vizlet layers. If not used the geospatial package may be excluded.
 * @requires OpenLayers or ESRI
 */
aperture.geo = (
/** @private */
function(ns) {
function openLayersMaps() {
	if (!window.OpenLayers) {
		aperture.log.info('OpenLayers js not present. Skipping default map api implementation.');
		return;
	}
	
	aperture.log.info('Loading OpenLayers map api implementation...');
	
	// util is always defined by this point
	var util = aperture.util, ol = 'OPEN_LAYERS_CANVAS';

	// Searchers through a set of layers to find
	// the base layer's index.
	var getBaseLayerIndex = function(map) {
	    var i, layers = map.layers;
	    for(i=0; i < layers.length; i++){
	        if(layers[i].isBaseLayer==true){
	            return(i);
	        }
	    }
	};
	
	// if basic Canvas ever implements stuff for real we should override where it makes sense
	var OpenLayersCanvas = aperture.canvas.Canvas.extend( 'aperture.geo.OpenLayersCanvas', {
			init : function(root, map) {
				aperture.canvas.Canvas.prototype.init.call(this, root);
				this.olMap_ = map;
			}
		}
	);

	aperture.canvas.handle( ol, OpenLayersCanvas );

    /**
     * @private
     * Base of Map Layer classes
     */
	var OpenLayersMapLayer = aperture.Layer.extend( '[private].OpenLayersMapLayer', {
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);

			if (spec.extent) {
				spec.extent = OpenLayers.Bounds.fromArray(spec.extent);
			}
			if ( !this.canvas_ ) {
				throw new Error('Map layer must be constructed by a parent layer through an addLayer call');
			}
			if (this.canvas_.olMap_ === undefined) {
				this.canvas_.olMap_ = spec.parent.olMap_;
			}
		},

		/**
		 * OpenLayers layer
		 */
		olLayer_ : null, // Assumption that a single OpenLayers layer can be used for all rendering


		/**
		 * Canvas type is OpenLayers
		 */
		canvasType : ol,

		/**
		 * @private
		 */
		data : function(value) {
			if( value ) {
				throw new Error('Cannot add data to a base map layer');
			}
		},

		/**
		 * @private
		 */
		render : function(changeSet) {
			// Must force no render logic so the layer doesn't try to monkey around with data
		},
        
		/**
		 * @private
		 */
		remove : function() {
			aperture.Layer.prototype.remove.call(this);

			// hook into open layers to remove
			this.canvas_.olMap_.removeLayer(this.olLayer_);
		}
	});
    
	
	// deprecated
	var tileTypeAliases = {
			tms : 'TMS',
			wms : 'WMS'
		};
    
    
	var MapTileLayer = OpenLayersMapLayer.extend( 'aperture.geo.MapTileLayer', 
	/** @lends aperture.geo.MapTileLayer# */
	{
		/**
		 * @class The base class for Aperture Map layers that displays one or more image tiles 
		 * from one of a variety of standards based sources.
		 *
		 * @augments aperture.Layer
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			OpenLayersMapLayer.prototype.init.call(this, spec, mappings);

			spec.options = spec.options || {};
			
			if (spec.options.isBaseLayer == null) {
				spec.options.isBaseLayer = false;
			}
		}		
	});

    ns.MapTileLayer = MapTileLayer;

	ns.MapTileLayer.TMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.TMS', 
	/** @lends aperture.geo.MapTileLayer.TMS# */
	{
		/**
		 * @class A Tile Mapping Service (TMS) specification. TMS relies on client information to
		 * be supplied about extents and available zoom levels but can be simply stood up
		 * as a service by deploying a static set of named tiles.
		 *
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in 
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 * 
		 * @example
		 * var spec = {
		 *     name : 'My TMS Layer',
		 *     url : 'http://mysite/mytiles/',
		 *     options : {
		 *         layername: 'mynamedlayer',
		 *         type: 'png'
		 *     }
		 * };
		 * 
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      options : {
		 *          'projection': 'EPSG:900913',
		 *          'displayProjection': 'EPSG:900913',
		 *          'units': 'm',
		 *          'numZoomLevels': 9,
		 *          'maxExtent': [
		 *              -20037500,
		 *              -20037500,
		 *              20037500,
		 *              20037500
		 *           ]
		 *      },
		 *      baseLayer : {
		 *          TMS: spec
		 *      }
		 * });
		 * 
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.TMS, {}, spec );
		 * 
		 * @param {Object} spec
		 *      a specification object
		 *      
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *      
		 * @param {String} spec.url
		 *      the source url for the tiles.
		 *      
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *      
		 * @param {String} spec.options.layername
		 *      required name of the served layer to request of the source tile data.
		 *      
		 * @param {String} spec.options.type
		 *      required type of the images in the source tile data.

		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.TMS(
				spec.name || 'TMS ' + this.uid,
                [spec.url],
                spec.options
			);
			
			this.canvas_.olMap_.addLayer(this.olLayer_);
		}		
	});
	

	ns.MapTileLayer.WMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.WMS', 
	/** @lends aperture.geo.MapTileLayer.WMS# */
	{
		/**
		 * @class A Web Map Service (WMS) specification. TMS relies on client information to
		 * be supplied about extents and available resolutions but are simple to stand
		 * up as a service by deploying a static set of named tiles.
		 *
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in 
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 * 
		 * @example
		 * var spec = {
		 *     name: 'OSGeo WMS',
		 *     url:  'http://vmap0.tiles.osgeo.org/wms/vmap0',
		 *     options: {
		 *         layers : 'basic',
		 *         projection : 'EPSG:4326',
		 *         displayProjection : 'EPSG:4326'
		 *     }
		 * };
		 * 
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          WMS: spec
		 *      }
		 * });
		 * 
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.WMS, {}, spec );
		 * 
		 * @param {Object} spec
		 *      a specification object
		 *      
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *      
		 * @param {String} spec.url
		 *      the source url for the tiles.
		 *      
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *      
		 * @param {String} spec.options.layers
		 *      a single layer name or comma separated list of served layer names to request.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.WMS(
				spec.name || 'WMS ' + this.uid,
                spec.url,
                spec.options
			);
			
			this.canvas_.olMap_.addLayer(this.olLayer_);
		}		
	});
	
	
	
	ns.MapTileLayer.Google = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Google', 
	/** @lends aperture.geo.MapTileLayer.Google# */
	{
		/**
		 * @class A Google Maps service. Use of this layer requires the inclusion of the
		 * <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank">Google Maps v3 API</a> script
		 * and is subject to its terms of use. Map options include dynamically 
		 * <a href="https://developers.google.com/maps/documentation/javascript/styling" target="_blank">styled maps</a>.
		 * 
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in 
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 * 
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     options: {
		 *          type: google.maps.MapTypeId.TERRAIN
		 *     }
		 * };
		 * 
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          Google: spec
		 *      }
		 * });
		 * 
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Google, {}, spec );
		 * 
		 * // EXAMPLE THREE: create a styled map
		 * var map = new Map({
		 *      baseLayer : {
		 *          Google: {
		 *              name: 'My Layer',
		 *              options: {
		 *                  type: 'styled',
		 *                  style: [{
		 *                      stylers: [
		 *                          { saturation: -80 }
		 *                      ]
		 *                  }]
		 *              }
		 *          }
		 *      }
		 * });
		 * 
		 * @param {Object} spec
		 *      a specification object
		 *      
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *      
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *      
		 * @param {google.maps.MapTypeId|'styled'} spec.options.type
		 *      a Google defined layer type to request.
		 *      
		 * @param {Array} spec.options.style
		 *      a list of Google defined
		 *      <a href="https://developers.google.com/maps/documentation/javascript/styling" target="_blank">style rules</a>.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.Google(
				spec.name || 'Google ' + this.uid,
				spec.options
			);
			
			this.canvas_.olMap_.addLayer(this.olLayer_);
			
			if (spec.options.type == 'styled') {
				var styledMapType = new google.maps.StyledMapType(spec.options.style, {name: 'Styled Map'});

				this.olLayer_.mapObject.mapTypes.set('styled', styledMapType);
				this.olLayer_.mapObject.setMapTypeId('styled');
			}			
		}		
	});
			
	
	
	ns.MapTileLayer.Bing = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Bing', 
	/** @lends aperture.geo.MapTileLayer.Bing# */
	{
		/**
		 * @class A Bing (Microsoft) map service. Use of a Bing map layer 
		 * <a href="http://bingmapsportal.com/" target="_blank">requires a key</a>.

		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in 
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 * 
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     options: {
		 *          type: 'Road',
		 *          key: 'my-license-key-here'
		 *     }
		 * };
		 * 
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          Bing: spec
		 *      }
		 * });
		 * 
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Bing, {}, spec );
		 * 
		 * @param {Object} spec
		 *      a specification object
		 *      
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *      
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *      
		 * @param {String='Road'|'Aerial'|...} spec.options.type
		 *      the name of a Bing defined layer type to request.
		 *      
		 * @param {String} spec.options.key
		 *      a client license key, obtained from Microsoft.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			spec.options.name = spec.options.name || spec.name || 'Bing ' + this.uid;
			
			this.olLayer_ = new OpenLayers.Layer.Bing(
				spec.options
			);
			
			this.canvas_.olMap_.addLayer(this.olLayer_);
		}		
	});

	
	ns.MapTileLayer.Image = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Image', 
	/** @lends aperture.geo.MapTileLayer.Image# */
	{
		/**
		 * @class A single image.

		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in 
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 * 
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     url: 'http://mysite/myimage.png',
		 *     size: [1024, 1024], // width and height in pixels
		 *     extent: [
		 *        -20037500, // left
		 *        -20037500, // bottom
		 *         20037500, // right
		 *         20037500  // top
		 *     ]
		 * };
		 * 
		 * // EXAMPLE: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Image, {}, spec );
		 * 
		 * @param {Object} spec
		 *      a specification object
		 *      
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *      
		 * @param {String} spec.url
		 *      the source url for the image.
		 *      
		 * @param {Array(Number)} spec.size
		 *      an array of two numbers specifying width and height
		 *      of the image in pixels.
		 *      
		 * @param {Array(Number)} spec.extent
		 *      an array of numbers specifying the geographical
		 *      bounding region of the image. The expected order is: [left, bottom, right, top]
		 * };
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			var options = spec.options;
			
			if (spec.size) {
				spec.size = new OpenLayers.Size(spec.size[0], spec.size[1]);
			}
	        
			if (!options.isBaseLayer) {

				// clone from base layer
				if (!options.resolutions) {
					options.resolutions = this.canvas_.olMap_.layers[getBaseLayerIndex(this.canvas_.olMap_)].resolutions;
				}
				if (!options.maxResolution) {
					options.maxResolution = options.resolutions[0];
				}
		
				if (spec.projection) {
					var tmpFromProjection = new OpenLayers.Projection(spec.projection);
					var tmpToProjection = new OpenLayers.Projection(this.canvas_.olMap_.projection.projCode);
					spec.extent = spec.extent.clone().transform(tmpFromProjection, tmpToProjection);
				}
	        }
	        
			this.olLayer_ = new OpenLayers.Layer.Image(
	            spec.name || 'Image ' + this.uid,
	            spec.url,
	            spec.extent,
	            spec.size,
	            options
	        );
	        
			this.canvas_.olMap_.addLayer(this.olLayer_);
		}		
	});
	
    /**
     * @private
     * Blank Layer
     *
     * Needed an option to have an empty baselayer, especially good if the
     * tiles are not geographically-based.
     * This layer is not exposed right now, may never be.  Used internally by map layer
     */
	var BlankMapLayer = OpenLayersMapLayer.extend( '[private].BlankMapLayer', {
		init : function(spec, mappings) {
			OpenLayersMapLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer('BlankBase');
			this.olLayer_.isBaseLayer = true; // OpenLayers.Layer defaults to false.
			this.olLayer_.extent = spec.baseLayer.extent || spec.options.extent || spec.options.maxExtent;

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});


	/**********************************************************************/
	/*
	 * The list of OpenLayers vector layer styles that can be mapped in Aperture
	 */
	var availableStyles = {
			'fillColor' : 'fill',
			'fillOpacity': 'opacity',
			'strokeColor': 'stroke',
			'strokeOpacity': 'stroke-opacity',
			'strokeWidth': 'stroke-width',
			'strokeLinecap': 'stroke-linecap',
			'strokeDashstyle': 'stroke-style', // needs translation?
//			'graphicZIndex', ??
			'label': 'label',
			'pointRadius': 'radius',
			'cursor': 'cursor',
			'externalGraphic': '' // overridden below
	};

	/*
	 * Default values for all settable styles (used if not mapped)
	 * TODO Allow this to be overridden by configuration
	 */
	var vectorStyleDefaults = {
		fillColor: '#999999',
		fillOpacity: '1',
		strokeColor: '#333333',
		strokeOpacity: '1',
		strokeWidth: 1,
		strokeLinecap: 'round',
		strokeDashstyle: 'solid',
		graphicZIndex: 0,
		// Must have a non-undefined label or else OpenLayers writes "undefined"
		label: '',
		// Must have something defined here or IE throws errors trying to do math on "undefined"
		pointRadius: 0,
		cursor: ''
	};

	/*
	 * Styles that are fixed and cannot be altered
	 * TODO Allow this to be overridden by configuration
	 */
	var fixedStyles = {
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 10

		// If we allow the following to be customizable by the user
		// this prevents us from using the default of the center of the image!
		//graphicXOffset:
		//graphicYOffset:
	};

	// returns private function for use by map external layer
	var makeHandler = (function() {
		
		// event hooks for features.
		function makeCallback( type ) {
			var stopKey;
			
			switch (type) {
			case 'click':
			case 'dblclick':
				stopKey = 'stopClick';
				break;
			case 'mousedown':
			case 'touchstart': // ?
				stopKey = 'stopDown';
				break;
			case 'mouseup':
				stopKey = 'stopUp';
				break;
			}
			if (stopKey) {
				return function(feature) {
					this.handler_[stopKey] = this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			} else {
				return function(feature) {
					this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			}
		}
	
		var featureEvents = {
			'mouseout' : 'out',
			'mouseover' : 'over'
		};
		
		return function (events) {
			var handlers = {}, active;
			
			if (this.handler_) {
				this.handler_.deactivate();
				this.handler_= null;
			}
			
			aperture.util.forEach(events, function(fn, event) {
				handlers[ featureEvents[event] || event ] = makeCallback(event);
				active = true;
			}); 

			if (active) {
				this.handler_ = new OpenLayers.Handler.Feature(
					this, this._layer, handlers,
					{ map: this.canvas_.olMap_, 
						stopClick: false,
						stopDown: false,
						stopUp: false
					}
				);
				this.handler_.activate();
			}
		};
	}());
	
	var MapGISLayer = aperture.Layer.extend( 'aperture.geo.MapGISLayer',
	/** @lends aperture.geo.MapGISLayer# */
	{
		/**
		 * @class An Aperture Map layer that sources GIS data from an external data source such
		 * as KML, GML, or GeoRSS.  Visual properties of this layer are mapped like any
		 * other layer where the data available for mapping are attributes of the features
		 * loaded from the external source.
		 *
		 * @mapping {String} fill
		 *   The fill color of the feature
		 * 
		 * @mapping {String} stroke
		 *   The line color of the feature
		 *   
		 * @mapping {Number} stroke-opacity
		 *   The line opacity of the feature as a value from 0 (transparent) to 1.
		 *   
		 * @mapping {Number} stroke-width
		 *   The line width of the feature.
		 *   
		 * @mapping {String} label
		 *   The label of the feature.
		 *   
		 * @mapping {Number} radius
		 *   The radius of the feature.
		 *   
		 * @mapping {String} cursor
		 *   The hover cursor for the feature.
		 *   
		 * @augments aperture.Layer
		 * @constructs
		 *
		 * @description Layer constructors are invoked indirectly by calling
		 *  {@link aperture.PlotLayer#addLayer addLayer} on a parent layer with the following specifications...
		 * 
		 * @param {Object} spec
		 *      a specification object describing how to construct this layer
		 *      
		 * @param {String} spec.url
		 *      the URL of the external data source to load
		 *      
		 * @param {String='KML'|'GML'|'GeoRSS'} spec.format
		 *      indicates the type of data that will be loaded from the	provided URL.
		 *      One of 'KML', 'GML', or 'GeoRSS'.
		 *      
		 * @param {String} [spec.projection]
		 *      an optional string specifying the projection of the data contained in
		 *      the external data file.  If not provided, WGS84 (EPSG:4326) is assumed.
		 *      
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);

			var name = spec.name || 'External_' + this.uid;

			// Create layer for KML, GML, or GeoRSS formats.
			var options = {
	            strategies: [new OpenLayers.Strategy.Fixed()],
				projection: spec.projection || apiProjection.projCode,
	            protocol: new OpenLayers.Protocol.HTTP({
	                url: spec.url,
	                format: new OpenLayers.Format[spec.format]({
	                    extractAttributes: true,
	                    maxDepth: 2
	                })
	            })
			};
			
			this._layer = new OpenLayers.Layer.Vector( name, options );	
			if( this.canvas_ ) {
				this.canvas_.olMap_.addLayer(this._layer);
			}

			//
			// Ensure Openlayers defers to Aperture for all style queries
			// Creates an OpenLayers style map that will call the Aperture layer's "valueFor"
			// function for all styles.
			//
			// Create a base spec that directs OpenLayers to call our functions for all properties
			var defaultSpec = util.extend({}, fixedStyles);

			// plus any set properties
			util.forEach(availableStyles, function(property, styleName) {
				defaultSpec[styleName] = '${'+styleName+'}';
			});

			// Create a cloned version for each item state
			var selectedSpec = util.extend({}, defaultSpec);
			var highlighedSpec = util.extend({}, defaultSpec);

			// Override some properties for custom styles (e.g. selection bumps up zIndex)
			//util.extend(selectedSpec, customStyles.select);
			//util.extend(highlighedSpec, customStyles.highlight);

			// Create context object that provides feature styles
			// For each available style create a function that calls "valueFor" giving the
			// feature as the data value
			var styleContext = {},
				that = this;

			util.forEach(availableStyles, function(property, styleName) {
				styleContext[styleName] = function(feature) {
					// Value for the style given the data attributes of the feature
					return that.valueFor(property, feature.attributes, vectorStyleDefaults[styleName]);
				};
			});
			styleContext.externalGraphic = function(feature) {
				// Must have a non-undefined externalGraphic or else OpenLayers tries
				// to load the URL "undefined"
				if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.Point') {
					return that.valueFor('icon-url', feature.attributes, '');
				}
				return that.valueFor('fill-pattern', feature.attributes, '');
			};

			// Create the style map for this layer
			styleMap = new OpenLayers.StyleMap({
				'default' : new OpenLayers.Style(defaultSpec, {context: styleContext}),
				'select' : new OpenLayers.Style(selectedSpec, {context: styleContext}),
				'highlight' : new OpenLayers.Style(highlighedSpec, {context: styleContext})
			});

			this._layer.styleMap = styleMap;
		},

		canvasType : ol,

		/**
		 * @private not supported
		 */
		data : function(value) {
			// Not supported
			if( value ) {
				throw new Error('Cannot add data to a layer with an external data source');
			}
		},

		/**
		 * @private monitor adds and removes.
		 */
		on : function( eventType, callback ) {
			var hadit = this.handlers_[eventType];
			
			aperture.Layer.prototype.on.call(this, eventType, callback);
			
			if (!hadit) {
				makeHandler.call(this, this.handlers_);
			}
		},
		
		/**
		 * @private monitor adds and removes.
		 */
		off : function( eventType, callback ) {
			aperture.Layer.prototype.off.call(this, eventType, callback);
			
			if (!this.handlers_[eventType]) {
				makeHandler.call(this, this.handlers_);
			}
		},
		
		/**
		 * @private
		 */
		render : function(changeSet) {
			// No properties or properties and intersection with our properties
			// Can redraw
			this._layer.redraw();
		}
	});

	ns.MapGISLayer = MapGISLayer;



	/**********************************************************************/

	/**
	 * @private
	 * OpenLayers implementation that positions a DIV that covers the entire world
	 * at the current zoom level.  This provides the basis for the MapNodeLayer
	 * to allow child layers to render via DOM or Vector graphics.
	 */
	var DivOpenLayer = OpenLayers.Class(OpenLayers.Layer,
	{

		/**
		 * APIProperty: isBaseLayer
		 * {Boolean} Markers layer is never a base layer.
		 */
		isBaseLayer : false,

		/**
		 * @private
		 */
		topLeftPixelLocation : null,

		/**
		 * @private constructor
		 *
		 * Parameters:
		 * name - {String}
		 * options - {Object} Hashtable of extra options to tag onto the layer
		 */
		initialize : function(name, options) {
			OpenLayers.Layer.prototype.initialize.apply(this, arguments);

			// The frame is big enough to contain the entire world
			this.contentFrame = document.createElement('div');
			this.contentFrame.style.overflow = 'hidden';
			this.contentFrame.style.position = 'absolute';
			// It is contained in the 'div' element which is fit exactly
			// to the map's main container layer
			this.div.appendChild(this.contentFrame);
		},

		/**
		 * APIMethod: destroy
		 */
		destroy : function() {
			OpenLayers.Layer.prototype.destroy.apply(this, arguments);
		},

		/**
		 * Method: moveTo
		 *
		 * Parameters:
		 * bounds - {<OpenLayers.Bounds>}
		 * zoomChanged - {Boolean}
		 * dragging - {Boolean}
		 */
		moveTo : function(bounds, zoomChanged, dragging) {
			var extent, topLeft, bottomRight;

			OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

			// Adjust content DIV to cover visible area + 1 equivalent area in each direction
			topLeft = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(bounds.left, bounds.top));
			bottomRight = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(bounds.right, bounds.bottom));

			var width = bottomRight.x - topLeft.x;
			var height = bottomRight.y - topLeft.y;

			// Layer origin is offset that must be subtracted from a pixel location to transform
			// from OpenLayer's layer pixel coordinates to the contentFrame's coordinates
			this.olLayerOrigin = {
				x: topLeft.x - width,
				y: topLeft.y - height,
			};

			this.contentFrame.style.top = this.olLayerOrigin.y + 'px';
			this.contentFrame.style.left = this.olLayerOrigin.x + 'px';
			this.contentFrame.style.width = (3*width) + 'px';
			this.contentFrame.style.height = (3*height) + 'px';

			if (this.onFrameChange) {
				this.onFrameChange(bounds);
				}
		},

		getContentPixelForLonLat : function( lon, lat ) {
			// Convert from lon/lat to pixel space, account for projection
			var pt = new OpenLayers.Geometry.Point(lon, lat);
			// Reproject to map's projection
			if( this.map.projection != apiProjection ) {
				pt.transform(apiProjection, this.map.projection);
			}
			// Get layer pixel
			var px = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(pt.x, pt.y));
			// Transform pixel to contentFrame space
			px.x -= this.olLayerOrigin.x;
			px.y -= this.olLayerOrigin.y;

			return px;
		},

		getLonLatExtent: function() {
			var extent = this.map.getExtent();
			var p0 = new OpenLayers.Geometry.Point(extent.left, extent.top);
			var p1 = new OpenLayers.Geometry.Point(extent.right, extent.bottom);
			if( this.map.projection != apiProjection ) {
				p0.transform(this.map.projection, apiProjection);
				p1.transform(this.map.projection, apiProjection);
			}
			return {
				left: p0.x,
				top: p0.y,
				right: p1.x,
				bottom: p1.y
			};
		},

		drawFeature : function(feature, style, force) {
			// Called by OpenLayers to force this feature to redraw (e.g. if some state changed
			// such as selection that could affect the visual.  Not needed for a container layer
		},

		CLASS_NAME : 'DivOpenLayer'
	});


	// default property values for map nodes.
	var mapNodeProps = {
		'longitude' : 0,
		'latitude' : 0
	};

	/*
	 * TODO: Create a generic container layer that just creates a canvas for children
	 * to use.  Map lat/lon to [0,1] ranges and then renderers can scale x/y based on
	 * size of canvas.  Then can make MapNodeLayer derive from this layer.  This layer
	 * could be used as parent for a layer drawing a series of points/labels, for
	 * example.
	 */

	var MapNodeLayer = aperture.PlotLayer.extend( 'aperture.geo.MapNodeLayer',
	/** @lends aperture.geo.MapNodeLayer# */
	{
		/**
		 * @class A layer that draws child layer items at point locations.
		 * 
		 * @mapping {Number} longitude
		 *   The longitude at which to locate a node
		 *   
		 * @mapping {Number} latitude
		 *   The latitude at which to locate a node
		 *
		 * @augments aperture.PlotLayer
		 * @constructs
		 * @factoryMade
		 */
		init: function(spec, mappings) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);

			// because we declare ourselves as an open layers canvas layer this will be 
			// the parenting open layers canvas, which holds the map reference. Note however that
			// since we are really a vector canvas layer we override that a ways below.
			var mapCanvas = this.canvas_;

			if (!mapCanvas.olMap_) {
				aperture.log.error('MapNodeLayer must be added to a map.');
				return;
			}

			// create the layer and parent it
			this._layer = new DivOpenLayer(spec.name || ('NodeLayer_' + this.uid), {});
			mapCanvas.olMap_.addLayer(this._layer);
			this._layer.setZIndex(999); // Change z as set by OpenLayers to be just under controls
			// Turn off pointer events on the divs/svg to allow click through to map layers below
			this._layer.div.style.pointerEvents = 'none';

			// because we parent vector graphics but render into a specialized open layers
			// canvas we need to help bridge the two by pre-creating this canvas with the
			// right parentage.
			var OpenLayersVectorCanvas = aperture.canvas.type(aperture.canvas.VECTOR_CANVAS);

			this.canvas_ = new OpenLayersVectorCanvas( this._layer.contentFrame );
			mapCanvas.canvases_.push( this.canvas_ );

			var that = this;
			this._canvasWidth = this.canvas_.root_.offsetWidth;
			this._canvasHeight = this.canvas_.root_.offsetHeight;
			this._layer.onFrameChange = function(newBounds) {
				// The OpenLayers layer has changed the canvas, must redraw all contents
				that._canvasWidth = that.canvas_.root_.offsetWidth;
				that._canvasHeight = that.canvas_.root_.offsetHeight;

				// This layer has changed, must rerender
				// TODO Pass in appropriate "change" hint so only translation need be updated
				that.all().redraw();
			};
		},

		/**
		 * @private
		 */
		canvasType : ol,

		/**
		 * @private
		 */
		render : function( changeSet ) {

			// just need to update positions
			aperture.util.forEach(changeSet.updates, function( node ) {
				// If lon,lat is specified pass the position to children
				// Otherwise let the children render at (x,y)=(0,0)
				var lat = this.valueFor('latitude', node.data, null);
				var lon = this.valueFor('longitude', node.data, null);

				// Find pixel x/y from lon/lat
				var px = {x:0,y:0};
				if (lat != null && lon != null) {
					px = this._layer.getContentPixelForLonLat(lon,lat);
				}

				// Update the given node in place with these values
				node.position = [px.x,px.y];

				// Update width/height
				node.userData.width = this._canvasWidth;
				node.userData.height = this._canvasHeight;

			}, this);
			
			
			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call(this, changeSet);

		},

		/**
		 * @private
		 */
		renderChild : function(layer, changeSet) {
			// Pass size information to children (so LineSeriesLayer can render correctly)
			aperture.util.forEach( changeSet.updates, function (node) {
				if (node) {
					node.width = node.parent.userData.width;
					node.height = node.parent.userData.height;
				}
			});
			layer.render( changeSet );
		},

		/**
		 * Given a location returns its pixel coordinates in the viewPort space
		 */
		getXY: function(lon,lat) {

			var pt = new OpenLayers.LonLat(lon, lat);
			
			// Reproject to map's projection
			if( this._layer.map.projection != apiProjection ) {
				pt.transform(apiProjection, this._layer.map.projection);
			}
			return this._layer.map.getViewPortPxFromLonLat(pt);
		},

		getExtent: function() {
			return this._layer.getLonLatExtent();
		}
	});

	ns.MapNodeLayer = MapNodeLayer;


	/************************************************************************************/



	/*
	 * The projection that the API expects unless instructed otherwise.  All layers
	 * and data are to be expressed in this projection.
	 */
	var apiProjection = new OpenLayers.Projection('EPSG:4326');


	/*
	 * Default map options
	 */
	var defaultMapConfig = {
		options : {
			projection : apiProjection,
			displayProjection : apiProjection
		}
	};

	/**
	 * Call on zoom completion.
	 */
	function notifyZoom() {
		this.trigger('zoom', {
			eventType : 'zoom',
			layer : this
		});
	}

	function notifyPan() {
		this.trigger('panend', {
			eventType : 'panend',
			layer : this
		});
	}
	
	var MapVizletLayer = aperture.PlotLayer.extend( 'aperture.geo.MapVizletLayer',
	// documented as Map, since it currently cannot function as a non-vizlet layer.
	/**
	 * @lends aperture.geo.Map#
	 */
	{
		/**
		 * @class A map vizlet is capable of showing geographic and geographically located data.  It
		 * contains a base map and additional child geo layers can be added. The base map is
		 * typically configured as a system-wide default, although can be overridden via the
		 * spec object passed into this constructor.  This layer does not require or support any
		 * mapped properties. 
		 *
		 *
		 * @constructs
		 * @augments aperture.PlotLayer
		 *
		 * @param {Object|String|Element} spec
		 *      A specification object detailing options for the map construction, or
		 *      a string specifying the id of the DOM element container for the vizlet, or
		 *      a DOM element itself. A
		 *      specification object, if provided, includes optional creation options for the
		 *      map layer.  These options can include base map configuration, map projection settings,
		 *      zoom level and visible area restrictions, and initial visible bounds.  Other than an id,
		 *      the following options do not need to be included if they are already configured via the 
		 *      aperture.config system.
		 * @param {String|Element} spec.id
		 *      If the spec parameter is an object, a string specifying the id of the DOM
		 *      element container for the vizlet or a DOM element itself.
		 * @param {Object} [spec.options]
		 *      Object containing options to pass directly to the Openlayers map.
		 * @param {String} [spec.options.projection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for the map.
		 * @param {String} [spec.options.displayProjection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for displaying map data to the user, for example mouse hover coordinate overlays.
		 * @param {String} [spec.options.units]
		 *      The units used by the projection set above
		 * @param {Array} [spec.options.maxExtent]
		 *      A four-element array containing the maximum allowed extent (expressed in units of projection
		 *      specified above) of the map given the limits of the projection.
		 * @param {Object} [spec.baseLayer]
		 *      Object containing information about the base map layer that should be created.
		 * @param {Object} spec.baseLayer.{TYPE}
		 *      The base layer specification where {TYPE} is the class of MapTileLayer 
		 *      (e.g. {@link aperture.geo.MapTileLayer.TMS TMS}) and
		 *      its value is the specification for it.
		 * @param {Object} [mappings]
		 *      An optional initial set of property mappings.
		 */
		init : function(spec, mappings) {

			// clone - we will be modifying, filling in defaults.
			this.spec = spec = util.extend({}, spec);

			// pass clone onto parent.
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);


			// PROCESS SPEC
			// Clone provided options and fill in defaults
			spec.options = util.extend({}, defaultMapConfig.options || {}, spec.options);

			// Ensure projections are in OpenLayers class format
			if( util.isString(spec.options.projection) ) {
				spec.options.projection = new OpenLayers.Projection(spec.options.projection);
			}
			if( util.isString(spec.options.displayProjection) ) {
				spec.options.displayProjection = new OpenLayers.Projection(spec.options.displayProjection);
			}

			// Ensure maxExtent is an OpenLayer bounds object
			if( util.isArray(spec.options.maxExtent) ) {
				spec.options.maxExtent = OpenLayers.Bounds.fromArray(spec.options.maxExtent);
			}
			
			// If map to have no controls, initialize with new empty array, not array from defaultMapConfig
			if(util.isString(spec.options.controls)||(util.isArray(spec.options.controls)&&(spec.options.controls.length==0))){
				spec.options.controls = [];  
			}

			// Clone provided base layer information and fill in defaults
			spec.baseLayer = util.extend({}, defaultMapConfig.baseLayer || {}, spec.baseLayer);

			// CREATE MAP
			// Create the map without a parent
			this.olMap_ = new OpenLayers.Map( spec.options );
			this.canvas_.canvases_.push(new OpenLayersCanvas( this.canvas_.root(), this.olMap_ ) );

			
			var type = '', config = null;
			
			for (type in spec.baseLayer) {
				if (spec.baseLayer.hasOwnProperty(type)) {
					config = spec.baseLayer[type];
					break;
				}
			}
 
			if (!config) {
				this.addLayer( BlankMapLayer, {}, spec );
				
			} else {
				config.options = config.options || {};
				config.options.isBaseLayer = true;
				
				var resolvedType = tileTypeAliases[type] || type;

				if (MapTileLayer[resolvedType]) {
					this.addLayer( MapTileLayer[resolvedType], {}, config );
				} else {
					aperture.log.warn('WARNING: unrecognized map base layer type: '+ type);
					this.addLayer( BlankMapLayer, {}, spec );
				}
			}
			
			// Add mouse event handlers that pass click and dblclick events
			// through to layer event handers
			var that = this,
				handler = function( event ) {
					that.trigger(event.type, {
						eventType: event.type
					});
				},
				mouseHandler_ = new OpenLayers.Handler.Click(
					this,
					{
						'click' : handler,
						'dblclick' : handler
					},
					{ map: this.olMap_ }
				);
			mouseHandler_.activate();

			// XXX Set an initial viewpoint so OpenLayers doesn't whine
			// If we don't do this OpenLayers dies on nearly all lat/lon and pixel operations
			this.zoomTo(0,0,1);

			this.olMap_.events.register('zoomend', this, notifyZoom);
			this.olMap_.events.register('moveend', this, notifyPan);
			this.olMap_.render(this.canvas_.root());
		},

		/**
		 * @private
		 * The map requires a DOM render context
		 */
		canvasType : aperture.canvas.DIV_CANVAS,

		/**
		 * Zooms to the max extent of the map.
		 */
		zoomToMaxExtent: function() {
			this.olMap_.zoomToMaxExtent();
		},

		/**
		 * Zooms in one zoom level, keeps center the same.
		 */
		zoomIn: function() {
			this.olMap_.zoomIn();
		},

		/**
		 * Zooms out one zoom level, keeps center the same (if possible).
		 */
		zoomOut: function() {
			this.olMap_.zoomOut();
		},

		/**
		 * Returns the zoom level as an integer.
		 */
		getZoom: function() {
			return this.olMap_.getZoom();
		},

		/**
		 * Sets the map extents give a center point in lon/lat and a zoom level
		 * Always accepts center as lon/lat, regardless of map's projection
		 * @param lat latitude to zoom to
		 * @param lon longitude to zoom to
		 * @param zoom zoom level (map setup dependent)
		 */
		zoomTo : function( lat, lon, zoom ) {
			var center = new OpenLayers.LonLat(lon,lat);
			if( this.olMap_.getProjection() !== apiProjection.projCode ) {
				center.transform(apiProjection, this.olMap_.projection);
			}
			this.olMap_.setCenter( center, zoom );
		},

		/**
         * Smoothly pans the map to a given center point in lat/lon.
         * @param lat latitude to pan to
         * @param lon longitude to pan to
         */
        panTo : function( lat, lon ) {
            var center = new OpenLayers.LonLat(lon,lat);
            if( this.olMap_.getProjection() !== apiProjection.projCode ) {
                center.transform(apiProjection, this.olMap_.projection);
            }
            this.olMap_.panTo( center );
        },

		/**
		 * Sets visible extents of the map in lat/lon (regardless of current coordinate
		 * system)
		 * @param left left longitude of extent
		 * @param top top latitude of extent
		 * @param right right longitude of extent
		 * @param bottom bottom latitude of extent
		 */
		setExtents : function( left, top, right, bottom ) {
			var bounds = new OpenLayers.Bounds(left,bottom,right,top);
			if( this.olMap_.getProjection() !== apiProjection.projCode ) {
				bounds.transform(apiProjection, this.olMap_.projection);
			}
			this.olMap_.zoomToExtent( bounds );
		}
	});

	/**
	 * @private
	 */
	// MapVizletLayer is currently documented as Map, since it does not currently function as a non-vizlet layer.
	var Map = aperture.vizlet.make( MapVizletLayer );
	ns.Map = Map;


	/*
	 * Register for config notification
	 */
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				// override local defaults with any configured defaults.
				util.extend( defaultMapConfig, config['aperture.map'].defaultMapConfig );
			}

			aperture.log.info('Map configuration set.');
		}
	});
}

	// load the default map implementation if the default mapType is unconfigured or configured to be openlayers.
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				var olMapType = 'openlayers';
				
				mapType = config['aperture.map'].defaultMapConfig.mapType || olMapType;
				
				if (mapType.toLowerCase() === olMapType) {
					openLayersMaps();
				}
			}
		}
	});
	
	return ns;
}(aperture.geo || {}));


return aperture;
}(aperture || {}));