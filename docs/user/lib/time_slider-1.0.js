function pad0(t){
  if (t<10){
    return "0"+t
  }else{
    return ""+t
  }
}

var TimeSlider = function(config){

  var baseDate = config.min,
      lockedState = false,
      lockedSlider = false;
      units        = config.unit || 'hours'
      max_diff     = config.max_diff || (config.max - config.min)/3600000

  this.handle1Value = document.getElementById('handle1-span')
  this.handle2Value = document.getElementById('handle2-span')
  this.slider = document.getElementById('hoursSlider')

  if (units=='minutes'){
    max_diff = (config.max - config.min)/60000
  }

  console.log("Initializing Timeslider...")
  console.log("Max Diff: " + max_diff)
  console.log("Units: " + units)

  //Create the slider
  noUiSlider.create(this.slider, {
    start: [0,max_diff],
    animate: false,
    step: 1,
    margin: 1,
    behaviour: 'snap-drag',
    connect: [false,true,false],
    range: {
      min: [0,1],
      max: [max_diff-1,max_diff]
    }
  });

  this.convertHoursToDate = function(val){
    var date = new Date(baseDate + (Number(val) * 3600 * 1000))
    return pad0(date.getUTCMonth()+1) + '-' + pad0(date.getUTCDate()) + '-' + date.getUTCFullYear() + " " + pad0(date.getUTCHours())+ ":00"
  }

  this.convertMinutesToDate = function(val){
    var date = new Date(baseDate + (Number(val) * 60 * 1000))
    return pad0(date.getUTCMonth()+1) + '-' + pad0(date.getUTCDate()) + '-' + date.getUTCFullYear() + " " + pad0(date.getUTCHours()) + ":" + pad0(date.getUTCMinutes())
  }

  var that = this;

  var stepper = document.getElementById('stepValue')
  var stepValue = Number(stepper.value)
  stepper.addEventListener('change',function(){
    stepValue = Number(this.value)
  })

  var rangeLocker = document.getElementById('lockrange')
  var rangeLocked = rangeLocker.checked
  rangeLocker.addEventListener('change',function(){
    rangeLocked = rangeLocker.checked
  })

  document.getElementById('start-right').addEventListener('click',function(){
    that.slider.noUiSlider.set( [Number(that.slider.noUiSlider.get()[0]) + stepValue, null] )
    if(rangeLocked){
      that.slider.noUiSlider.set( [null, Number(that.slider.noUiSlider.get()[1]) + stepValue] )
    }
  })

  document.getElementById('start-left').addEventListener('click',function(){
    that.slider.noUiSlider.set( [Number(that.slider.noUiSlider.get()[0]) - stepValue, null] )
    if(rangeLocked){
      that.slider.noUiSlider.set( [null, Number(that.slider.noUiSlider.get()[1]) - stepValue] )
    }
  })

  document.getElementById('end-right').addEventListener('click',function(){
    that.slider.noUiSlider.set( [null, Number(that.slider.noUiSlider.get()[1]) + stepValue] )
    if(rangeLocked){
      that.slider.noUiSlider.set( [Number(that.slider.noUiSlider.get()[0]) + stepValue, null] )
    }
  })

  var notPlaying = true
  var i;
  document.getElementById('play').addEventListener('click',function(){
    if(notPlaying && (Number(that.slider.noUiSlider.get()[1]) < max_diff-1)){
      notPlaying = false
      this.innerHTML="Stop"
      i = setInterval(function(){
        if (Number(that.slider.noUiSlider.get()[1]) < max_diff) {
          document.getElementById('end-right').click()
        }else{
          notPlaying = true
          this.innerHTML = "Play"
          clearInterval(i)
        }
      }, 1500);
    }else{
      this.innerHTML="Play"
      notPlaying = true
      clearInterval(i)
    }
  })

  document.getElementById('end-left').addEventListener('click',function(){
    that.slider.noUiSlider.set( [null, Number(that.slider.noUiSlider.get()[1]) - stepValue] )
    if(rangeLocked){
      that.slider.noUiSlider.set( [Number(that.slider.noUiSlider.get()[0]) - stepValue, null] )
    }
  })
}
