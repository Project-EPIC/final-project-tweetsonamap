var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup({})

var featureLevels = [
  {'name' : 'xxl-polygon', filter: ['>', 'area', 40000],
                                                   maxzoom: 4.5,
                                                   minzoom: 2  },
  {'name' : 'xl-polygon',  filter: ['all',
                                                  ['>', 'area', 20000],
                                                  ['<=','area', 40000]
                                                ], maxzoom: 8.5,
                                                   minzoom: 4  },
  {'name' : 'l-polygon',   filter: ['all',
                                                  ['>', 'area', 10000],
                                                  ['<=','area', 20000]
                                                ], maxzoom: 8.5,
                                                   minzoom: 4  },
  {'name' : 'm-polygon',   filter: ['all',
                                                  ['>', 'area', 1000],
                                                  ['<=','area',10000]
                                                ], maxzoom: 9.5,
                                                   minzoom: 5  },

  {'name' : 's-polygon',   filter:  ['<=', 'area', 1000],
                                                   maxzoom: 22,
                                                   minzoom: 6  }]

module.exports = function(config){

  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.title      = 'geolocated-tweets'
  this.queryLayers = []

  this.on         = true;

  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addPolyPoints = function(map){
    this.on=true;
    var that = this;

    featureLevels.forEach(function(level){

      //these are the queryable layers
      that.queryLayers.push(level.name + "-circle-layer")

      map.addLayer({
        'id': level.name + "-circle-layer",
        'type': "circle",
        'source': that.title,
        'paint':{
          'circle-opacity':0.15,
          'circle-color': 'green',
          'circle-radius' : {
            'property': 'area',
            'stops' : [[0,4],[9999999,100]]
          }
        },
        'filter': level.filter,
        'maxzoom': level.maxzoom,
        'minzoom': level.minzoom
      })
    })

    var that = this;
    that.polyPopup = new mapboxgl.Popup({closeOnClick:false}).addTo(map);
    featureLevels.forEach(function(layer){
      map.on('click',layer.name+"-circle-layer",function(e){
        that.polygonClick(e, map)
      })
    });
  }

  this.getVisibleFeatures = function(map){
    var features = map.queryRenderedFeatures( {layers:this.queryLayers} )
    if (!features.length) return [0,[]]

    var uniqueTweetIDs = []
    var uniqueTweets = []

    var uniqueFeatures = util.getUniqueFeatures(features.slice(0,this.load_lim+25), 'id')

    return [uniqueFeatures.length, uniqueFeatures.slice(0,this.load_lim)]
  }

  this.hide = function(map){
    console.log("Turning off geolocated features")
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','none')
    })
    this.on = false;
  }

  this.show = function(map){
    console.log("Turnign on geolocated features")
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','visible')
    })
    this.on = true;
  }
}