var listPopUp = new mapboxgl.Popup({'closeOnClick':true})

function getURLVars(urlString) {
  var vars = {};
  var parts = urlString.substring(0,urlString.indexOf("#")).replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  return vars;
}

function getUserFiles(urlString){

  var urlVars = getURLVars(urlString)
//  console.warn(urlVars)

  var rootP = urlVars['root'] || 'sample/';
  var uName = urlVars['user'] || 'noneck'

  return [rootP, uName+'.geojson',uName+'-meta.geojson',uName]
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
    var html = "<table>"
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">User</span></td><td>${props.user}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Time (EST)</span></td><td>${(new Date(props.date)).toLocaleString("en-US",{'timeZone':'America/New_York'})}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Text</span></td><td>${linkify(decodeURIComponent( props.text.replace(/\+/g,' ')))}</td></tr>`
//    html += `<tr><td><span style="margin-right:10px; font-weight:700;">TimeDelta</span></td><td>${props.timeDelta}</td></tr>`
    html += `<tr><td><span style="margin-right:10px; font-weight:700;">Time (UTC)</span></td><td>${props.date}</td></tr>`
//    html += `<tr><td><span style="margin-right:10px; font-weight:700;">timestamp</span></td><td>${props.timestamp}</td></tr>
    html += `<tr><td></td><td>Cluster: ${props.cluster}, Speed: ${props.speed.toFixed(2)} mph</td></tr>`
    
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
  tr.innerHTML += `<td class="date">${f.properties.user}</td>`
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
