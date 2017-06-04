var monthNames = [
  "Jan", "Feb", "Mar",
  "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct",
  "Nov", "Dec"
];

var clusterColorStops = [
 [-1,'grey'],   [0,'#b20000'],  [1,'#dae639'],  [2,'#79caf2'],  [3,'#cc00ff'],  [4,'#e57373'],  [5,'#738040'],
 [6,'#46758c'], [7,'#502d59'],  [8,'#592816'],  [9,'#1f4d00'],  [10,'#003380'], [11,'#f200c2'], [12,'#ffd0bf'],
 [13,'#00bf1a'],[14,'#408cff'], [15,'#e6acda'], [16,'#e57e39'], [17,'#208053'], [18,'#000e33'], [19,'#990052'],
 [20,'#734b1d'],[21,'#80ffc3'], [22,'#8f9cbf'], [23,'#ff0066'], [24,'#ffbf40'], [25,'#003322'], [26,'#4059ff'],
 [27,'#ff80b3'],[28,'#332b1a'], [29,'#2db3aa'], [30,'#5f00b3'], [31,'#331a24'], [32,'#998c73'], [33,'#30403f'],
 [34,'#300059'],[35,'#4c0014'], [36,'#fffbbf'], [37,'#002b40'], [38,'#bf73e6'], [39,'#b3868c']
]

/*
  PAGE FUNCTIONS
*/

function getURLVars(urlString) {
  var vars = {};
  var parts = urlString.substring(0,urlString.indexOf("#")).replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  return vars;
}

function extractLink(text){
  if(text.search("http")>=0){
    var out = []
    text.split(" ").forEach(function(word){
      if (word.startsWith("http")){
        out.push(`<a class="link" href="${word}" target="_blank">${word}</a>`)
      }else{
        out.push(word)
      }
    })
    return out.join(" ")
  }else{
    return text
  }
}

function addGeoJSONLayerToMap(geojson_source, stripped){
  console.log('loading: '+geojson_source)
  map.addSource('geojson-source',{
    data: geojson_source,
    type: 'geojson'
  })

  var cColor;
  if (stripped){
    cColor = {
      'property':'c',
      'stops':clusterColorStops
    }
  }else{
    cColor = {
      'property':'cluster',
      'stops':clusterColorStops
    }
  }

  map.addLayer({
    "id": "geojson-circle-layer",
    "type": "circle",
    "source": "geojson-source",
    "paint":{
      "circle-radius": {
        'stops':[[0,3],[12,8]]
      },
      "circle-color": cColor,
      "circle-opacity":0.8
    }
  })
}

function loadGeoJSONTweets(geojson_source_URI, stripped){
  var table = document.getElementById('tweet-table-body')
  var globalPopUp = new mapboxgl.Popup()
  var oReq = new XMLHttpRequest();

  var c1,c2,c3

  oReq.onload = function (e) {
    var tweets = e.target.response.features
    loaded_geojson = e.target.response
    var uName = document.getElementById('this_user').innerHTML = tweets[0].properties.user
    document.getElementById('homeLocationbutton').addEventListener('click',function(){
      toggleHomeLocation(uName.toLowerCase())
    })

    var count = document.getElementById('tCount').innerHTML = tweets.length;

    tweets.forEach(function(t){
      var row = table.insertRow(-1);
      row.className = "tweet-row bg-gray-dark-on-hover"

      var d;
      if(stripped){
        d = new Date(Date.parse(t.properties.time))
      }else{
        d = new Date(Date.parse(t.properties.date))
      }

      var dateString = d.toLocaleString("en-US", {timeZone: "America/New_York"}).replace(",","<br>")

      // // row.insertCell(0).innerHTML = monthNames[d.getUTCMonth()] + " " +d.getUTCDate() + ", " + d.getUTCFullYear() + "<br>" +
      //   d.getUTCHours() + ":" +d.getUTCMinutes() + ":" + d.getUTCSeconds()

      var speed;
      if(stripped){
        speed = t.properties.s
      }else{
        speed = t.properties.speed
      }
      if(speed){
        speed *= (3600.0/1609.4)
        speed = speed.toFixed(2)
      }

      c1 = row.insertCell(0)
        c1.innerHTML = dateString
        c1.style = "min-width:100px !important;";

      c2 = row.insertCell(1)
        c2.innerHTML = extractLink(t.properties.text);
        c2.style     = "min-width:250px; max-width:250px;";

      c3 = row.insertCell(2)
        c3.innerHTML = speed;
        c3.style     = "min-width:100px !important;";

      if (t.geometry){
        geoTweets.push(t)
        row.className = "tweet-row bg-red-dark bg-gray-dark-on-hover"
        row.addEventListener('click',function(e){
          // map.getSource('selected').setData({"type":"FeatureCollection","features":[t]})
          globalPopUp.remove()
            .setLngLat(t.geometry.coordinates)
            .setHTML(`${t.properties.user}<br>${t.properties.time}<br>${extractLink(t.properties.text)}<br>${t.properties.h},${t.properties.m},${t.properties.s},${t.properties.c}`)
            .addTo(map);
          var zoom = map.getZoom() > 10 ? map.getZoom() : 12

          map.flyTo({"center": t.geometry.coordinates,
                     "zoom": zoom,
                     "speed": 5,
                     "curve": 1,
                      easing(t) {
                        return t;
                      }});
        })
      }
      row.id = "minute-"+t.properties.m
      allMinutes.push(t.properties.m)
    })

    if(stripped){
      start = Date.parse(tweets[0].properties.time )
      end   = Date.parse(tweets[tweets.length-1].properties.time)
    }

    else{
      start = Date.parse(tweets[0].properties.date )
      end   = Date.parse(tweets[tweets.length-1].properties.date)
    }

    if(stripped){
      startInteraction(start, end)
    }

  };
  oReq.open('GET', geojson_source_URI, true);
  oReq.responseType = 'json';
  oReq.send();
}

function startInteraction(start, end){
  map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['geojson-circle-layer'] });
    if (!features.length) {return;}
    var feature = features[0];

    var popup = new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`${feature.properties.user}<br>${feature.properties.time}<br>${extractLink(feature.properties.text)}<br>${feature.properties.h},${feature.properties.m},${feature.properties.s},${feature.properties.c}`)
        .addTo(map);
  });

  map.on('mousemove', function (e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['geojson-circle-layer'] });
      map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
  });

  if(start){

    config = {
      min: start,  //Start always needs to be the date of the earliest tweet!
      max: end
    }
    if (unit=='minutes'){
      config['unit'] = 'minutes'
    }

    ts = new TimeSlider( config )

    if (unit=='minutes'){
      ts.slider.noUiSlider.on('update', function( values, handle ){
        ts.handle1Value.innerHTML = ts.convertMinutesToDate(values[0]);
        ts.handle2Value.innerHTML = ts.convertMinutesToDate(values[1]);
        map.setFilter('geojson-circle-layer',
         [ 'all',
            [">=",'m', Number(values[0]) ],
            ["<=",'m', Number(values[1]) ]
          ] )
        scrollTweetTable(Number(values[0]))
        if(movementLines){
          map.setFilter('movement-lines',
           [ 'all',
              [">=",'m', Number(values[0]) ],
              ["<=",'m', Number(values[1]) ]
            ] )
        }
      });
    }else{
      ts.slider.noUiSlider.on('update', function( values, handle ){
        ts.handle1Value.innerHTML = ts.convertHoursToDate(values[0]);
        ts.handle2Value.innerHTML = ts.convertHoursToDate(values[1]);
        map.setFilter('geojson-circle-layer',
         [ 'all',
            [">=",'h', Number(values[0]) ],
            ["<=",'h', Number(values[1]) ]
          ] )
      });
    }
  }
}
