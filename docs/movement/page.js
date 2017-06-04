/*
  PAGE FUNCTIONS
*/

function getUrlVars(k) {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  if(vars[k]){
    return decodeURI(vars[k])
  }else{
    return false;
  }
}

function extractLink(text){
  if(text.search("http")>0){
    var out = []
    text.split(" ").forEach(function(word){
      if (word.startsWith("http")){
        out.push(`<a href="${word}" target="_blank">${word}</a>`)
      }else{
        out.push(word)
      }
    })
    return out.join(" ")
  }else{
    return text
  }
}

var monthNames = [
  "Jan", "Feb", "Mar",
  "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct",
  "Nov", "Dec"
];
