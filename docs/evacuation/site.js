function getURLVars(urlString) {
  var vars = {};
  var parts = urlString.substring(0,urlString.indexOf("#")).replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  return vars;
}

function getUserFiles(urlString){

  var urlVars = getURLVars(urlString)
  console.warn(urlVars)

  var rootP = urlVars['root'] || 'sample/';
  var uName = urlVars['user'] || 'noneck'

  return [rootP, uName+'.geojson',uName+'-meta.geojson',uName]

}
