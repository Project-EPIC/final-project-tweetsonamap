'use strict';

const {
  featureEach, coordAll, // @turf/meta
  point, polygon, featureCollection, // @turf/helpers
  centroid, // @turf/centroid
  convex,
  distance,
  clusterEach, clusterReduce, // @turf/clusters
  clustersDbscan // @turf/clusters-dbscan
} = turf

const UTCOffset   = -5;

function decimalDay(date, offset){
  var hours = date.getUTCHours()
  var day   = date.getUTCDay();

  if (hours+offset < 0){
    day = (((day-1)%6)+6)%6;
    hours = (((hours+UTCOffset)%23)+23)%23;
  }else{
    hours+=offset
  }

  return day + Math.floor(hours/3)/10;
}

var TweetClusterer = function(geojson, userName){

  //geojson is a feature collection of tweets
  this.geojson = geojson;
  this.userName = userName.toLowerCase();

  this.withGeometries    = []
  this.withoutGeometries = []
  this.otherTweets       = []
  this.otherUsers        = 0;

  this.clusterCenters    = {}
  this.metaGeoms         = []

  this.sortedFeatures    = []

  this.filterGeometries = function(){
    // Check that tweets only have the right usernames
    var that = this;

    that.geojson.features.map(function(f){
      //Don't count if the username doesn't match
      if (f.properties.user.toLowerCase() != that.userName){
        that.otherUsers++;
        that.otherTweets.push(f)
        return
      }

      if(f.geometry){
        that.withGeometries.push({
          type      : 'Feature',
          geometry  : f.geometry,
          properties: {
            tweetID: f.properties.tweetID || "",
            user: f.properties.user,
            text: f.properties.text,
            date: f.properties.date,
            speed: f.properties.speed || "",
            timeD: f.properties.time_delta || ""
          }
       })
     }else{
       that.withoutGeometries.push(f)
     }
    })
  }

  this.cluster = function(){
    var that = this;
    var distance  = 1; //kilometers
    var minPoints = 5;
    that.clustered = clustersDbscan({
      type:'FeatureCollection',
      features: that.withGeometries
    }, distance);//, {minPoints: minPoints});

    //Ensure that everything is sorted by date
    that.sortedFeatures = _.sortBy(that.withoutGeometries.concat(that.clustered.features), function(f){return f.properties.timestamp})
  }

  this.getMetaGeoms = function(){
    var that = this;

    var clusterGroups = _.groupBy(that.clustered.features,function(f){
      return f.properties.cluster}
    )

    Object.keys(clusterGroups).forEach(function(cID){
      if(Number(cID) > -1){
        var clusterCenter = centroid({type:'FeatureCollection',features:clusterGroups[cID]})
        that.clusterCenters[cID] = clusterCenter
        if (clusterCenter){
          var ts = clusterGroups[cID].map(function(f){return new Date(f.properties.date)})
          clusterCenter.properties.cluster = Number(cID)
          clusterCenter.properties.clusterCenter = true;
          clusterCenter.properties.tweetCount = clusterGroups[cID].length
          that.metaGeoms.push(clusterCenter)
        }
        var convHull = convex({type:'FeatureCollection',features:clusterGroups[cID]})
        if (convHull){
          convHull.properties.cluster = Number(cID)
          convHull.properties.tweetCount = clusterGroups[cID].length
          that.metaGeoms.push(convHull)
        }
      }
    })

  }
  /*
    Part II: Temporal Clustering
  */
  this.calculateHomeCluster = function(){
    var that = this;

    var gbDay = _.groupBy(that.sortedFeatures, function(f){
      return decimalDay(new Date(f.properties.date), UTCOffset)
    })

    /*
               Days
      0 = Sunday    3 = Wednesday     6 = Saturday
      1 = Monday    4 = Thursday
      2 = Tuesday   5 = Friday

               Hours
      .0 = 1am  - 4 am      .4 = 12-15 (1pm - 4pm)
      .1 = 4am  - 7 am      .5 = 15-18 (4pm - 7pm)
      .2 = 7am  - 10am      .6 = 18-21 (7pm - 10pm)
      .3 = 10am - 1pm       .7 = 21-24 (10pm - 1am) (next day :/)
    */

    var workHours = [
      1.2, 1.3, 1.4, 1.5,
      2.2, 2.3, 2.4, 2.5,
      3.2, 3.3, 3.4, 3.5,
      4.2, 4.3, 4.4, 4.5,
      5.2, 5.3, 5.4, 5.5,
    ]
    var homeHours = [
      0.6, 0.7,
      1.0, 1.1, 1.6, 1.7,
      2.0, 2.1, 2.6, 2.7,
      3.0, 3.1, 3.6, 3.7,
      4.0, 4.1, 4.6, 4.7,
      5.0, 5.1, 5.6, 5.7,
    ]

    var homeClusters = []
    var workClusters = []
    Object.keys(gbDay).forEach(function(key){
      if (homeHours.indexOf(Number(key))>-1){
        gbDay[key].map(function(f){
          if (f.properties.cluster){
            homeClusters.push(f.properties.cluster)
          }
        })
      }else if (workHours.indexOf(Number(key))>-1){
        gbDay[key].map(function(f){
          if (f.properties.cluster){
            workClusters.push(f.properties.cluster)
          }
        })
      }
    })
    var countedHome = _.countBy(homeClusters)
    var likelyHomeID = _.sortBy(Object.keys(countedHome), function(a){return -countedHome[a]})[0]

    var countedWork = _.countBy(workClusters)
    var likelyWorkID = _.sortBy(Object.keys(countedWork), function(a){return -countedWork[a]})[0]

    if (likelyHomeID){
      that.clusterCenters[likelyHomeID].properties.likelyHome = true
    }

    if (likelyWorkID){
      that.clusterCenters[likelyWorkID].properties.likelyWork = true
    }
  }
}


// }
