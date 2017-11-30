console.log("HI")

mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
    center: [-76.56, 34.02],
    zoom: 4,
    hash: true
});

map.on('load',function(){

    
    map.addSource('homeLoc',{
        type: 'geojson',
        data: homeLocations
    })
    
    map.addLayer({
        id: 'homeLocationsLayer',
        type: 'circle',
        source: 'homeLoc',
        paint:{
            'circle-radius':{
                'property':'totalClusteredTweets',
                'stops':[
                     [0,0],
                     [10,10],
                     [100,25],
                     [1000,30]
                ]
            },
            'circle-color':{
                'property':'totalClusters',
                'stops':[
                    [1,'white'],
                    [10,'orange'],
                    [100,'darkred']
                ]
            },
            'circle-opacity':0.9
        }
    })                        

    map.on('mouseenter', 'homeLocationsLayer', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'homeLocationsLayer', function() {
        map.getCanvas().style.cursor = '';
    });
    
    map.on('click', 'homeLocationsLayer', function(e) {
        
        console.log(e.features);

        // Populate the popup and set its coordinates
        // based on the feature found.
        
        var feat = e.features[0]
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: true
        }).setLngLat(feat.geometry.coordinates)
            .setHTML("<strong>"+feat.properties.handle+"</strong><br>"+
                     "<a class='link' target='_blank' href='"+feat.properties.link+"'>Open User's Tweets</a><br>"+
                     "<p>Clusters: "+feat.properties.totalClusters + "</p>"+
                     "<p>Clustered Tweets: "+feat.properties.totalClusteredTweets+"</p>")
            .addTo(map);
    });

});
