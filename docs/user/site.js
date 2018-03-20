var listPopUp = new mapboxgl.Popup({'closeOnClick':true})

function getURLVars(urlString) {
  var vars = {};
  var parts = urlString.substring(0,urlString.indexOf("#")).replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  return vars;
}

function getUserGeoJSON(urlString){
  var urlVars = getURLVars(urlString)
  var geojson = urlVars['geojson'] || 'sample/noneck.geojson'
  var parts = geojson.split('/');
  var uName = parts[parts.length-1]
  return [geojson, uName.substring(0, uName.indexOf('.geojson'))]
}

function linkify(text){
  var parts = text.split(" ");

  for(var idx in parts){
    if (parts[idx].startsWith("http://") || parts[idx].startsWith("https://")){
      parts[idx] = "<a class='link' target='_blank' href='"+parts[idx]+"'>"+parts[idx]+"</a>"
    }
  }

  return parts.join(" ");
}

function tweetToHTMLString(props){
    console.log(props)
    var speed = ""
    if (props.speed){
      try{
        speed = props.speed.toFixed(2) + " mph"
      }catch(e){
        speed = ""
      }
    }

    var html = "<table>"
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">User</span></td><td>${props.user}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Time (EST)</span></td><td>${(new Date(props.date)).toLocaleString("en-US",{'timeZone':'America/New_York'})}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Text</span></td><td>${linkify(decodeURIComponent( props.text.replace(/\+/g,' ')))}</td></tr>`
//    html += `<tr><td><span style="margin-right:10px; font-weight:700;">TimeDelta</span></td><td>${props.timeDelta}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Time (UTC)</span></td><td>${props.date}</td></tr>`
//    html += `<tr><td><span style="margin-right:10px; font-weight:700;">timestamp</span></td><td>${props.timestamp}</td></tr>
    html += `<tr><td></td><td>Cluster: ${props.cluster}, Speed: ${ speed }</td></tr>`

    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Link</span></td><td><a class="link" target="_blank" href="http://twitter.com/statuses/${props.tweetID}">twitter.com/statuses/${props.tweetID}</a></td></tr></table>`

    return html
}

function tweetToTRElement(f){
  var tr = document.createElement('tr')
  tr.setAttribute('id','timestamp-'+f.properties.timestamp)

  if (f.geometry){
    tr.classList.add('hasGeo')
    tr.addEventListener('click',function(e){
      listPopUp.setLngLat(f.geometry.coordinates)
        .setHTML(tweetToHTMLString(f.properties))
        .addTo(map);
      map.flyTo({zoom: 14, center: f.geometry.coordinates})
    })
  }
  tr.dataset.tweetid = f.properties.tweetID;

  tr.innerHTML += `<td class="date">${(new Date(f.properties.date)).toLocaleString("en-US",{'timeZone':'America/New_York'})}</td>`
  tr.innerHTML += `<td class="date">${f.properties.user}<br><a target="_blank" href="http://twitter.com/statuses/${f.properties.tweetID}" class="btn btn--xs cursor-pointer">Link</a></td>`
  tr.innerHTML += `<td class="text">${linkify(f.properties.text)}</td>`
  tr.innerHTML += `<td class="speed">${(f.properties.speed)? f.properties.speed.toFixed(2) : ""}</td>`
  tr.innerHTML += "</td>"
  return tr;
}


function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function(el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            return true;
        }
    });

    return uniqueFeatures;
}
