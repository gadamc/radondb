var dbname = window.location.pathname.split("/")[1];
var appName = window.location.pathname.split("/")[3];
var db = $.couch.db(dbname);

var today = new Date();
var lastMonth = new Date();
lastMonth.setDate(today.getDate() - 30);
var now = new Date();
var someDaysInThePast=new Date();
someDaysInThePast.setDate(someDaysInThePast.getDate() - 2);

var timeResolution = 4*3600;
//var parseFloat($("#radonlowE").val()) = 2000.0;
//var parseFloat($("#radonhighE").val()) = 2350.0;
//var parseFloat($("#radonFactor").val()) = 98.7; //converts counts to Bq/cm^3

var histChart;
var trendChart;
var histArray;
var trendArray;
var trendTimeBinArray;

// ____________________________________________________________________________________
$(document).ready(function(){

 

 $( "#button-plot" ).button();
 $(".download-row").hide();
 // $( "#efficiencySlider" ).slider({
 //   animate: true,
 //   step: 0.1,
 //   min:90,
 //   max: 110,
 //   value: 98.7,
 //   slide: function( event, ui ) {
 //      $( "#efficienyValue" ).val( ui.value );
 //    }
 // });
 // $( "#efficienyValue" ).val( $( "#efficiencySlider" ).slider( "value"));
 // 
 // $( "#adcSlider" ).slider({
 //   range: true,
 //   min: 0,
 //   max: 4100,
 //   values: [ 2000, 2275 ],
 //   slide: function( event, ui ) {
 //     $( "#adcrange" ).val(  ui.values[ 0 ] + " - " + ui.values[ 1 ] );
 //   }
 // });
 // $( "#adcrange" ).val( $( "#adcSlider" ).slider( "values", 0 ) +
 // " -"  + $( "#adcSlider" ).slider( "values", 1 ) );

  $(function() {
    
        $('#idate').datetimepicker({
          numberOfMonths: 1,
          showButtonPanel: true,
          changeMonth: true,
          changeYear: true,
          defaultDate: lastMonth,
          addSliderAccess: true,
          sliderAccessArgs: { touchonly: false },
          onClose: function(dateText, inst) {
                var endDateTextBox = $('#fdate');
                if (endDateTextBox.val() != '') {
                    var testStartDate = new Date(dateText);
                    var testEndDate = new Date(endDateTextBox.val());
                    if (testStartDate > testEndDate)
                        endDateTextBox.val(dateText);
                }
                else {
                    endDateTextBox.val(dateText);
                }
            },
            onSelect: function (selectedDateTime){
                var start = $(this).datetimepicker('getDate');
                $('#fdate').datetimepicker('option', 'minDate', new Date(start.getTime()));
            }
        });
        
        $('#fdate').datetimepicker({
          numberOfMonths: 1,
          showButtonPanel: true,
          defaultDate: today,
          changeMonth: true,
          changeYear: true,
          addSliderAccess: true,
          sliderAccessArgs: { touchonly: false },
            onClose: function(dateText, inst) {
                var startDateTextBox = $('#idate');
                if (startDateTextBox.val() != '') {
                    var testStartDate = new Date(startDateTextBox.val());
                    var testEndDate = new Date(dateText);
                    if (testStartDate > testEndDate)
                        startDateTextBox.val(dateText);
                }
                else {
                    startDateTextBox.val(dateText);
                }
            },
            onSelect: function (selectedDateTime){
                var end = $(this).datetimepicker('getDate');
                $('#idate').datetimepicker('option', 'maxDate', new Date(end.getTime()) );
            }
        });
  
        $('#fdate').datetimepicker('setDate', now );
        $('#idate').datetimepicker('setDate', someDaysInThePast );
        
  });
   
  
 //the bootstrap documentation says $('.nav-tabs').button()... but this also seems to work
  //and seems like the correct way. perhaps this is a typo in the documentation.
  $('.btn').button()

  //connect the button to a function
  $('#button-plot').click(function(e) {
    $('#button-plot').button('loading');
    plot();
  });


  db.view(appName + '/bydate', {
    reduce:false,
    limit:1,
    descending:true,
    success: function(data){
      //console.log(data);
      //console.log( data.rows[0]['key']);
      var dateOfLastData =  new Date(data.rows[0]['key']*1000.0);
      //console.log(dateOfLastData);
      $('#lastDate').html('<p>Date of most recent data: &nbsp;  &nbsp;' + dateOfLastData + '</p>');
    }

  });

});

function getHistOptions()
{
  var options = { 
       chart: {
          renderTo: 'chart',
          zoomType: 'x',
          animation: true,
          defaultSeriesType: 'scatter'
          //spacingRight: 20
       },
        title: {
          text: 'Alpha Counter Histogram'
       },
       xAxis: {
          title: {
             enabled: true,
             text:'ADC bin'
          },
          endOnTick:true,
          startOnTick:true,
          showFirstLabel : false
       },
       yAxis: {
          title: {
             text: 'counts per bin'
          },
          //min: 0.6,
          //startOnTick: false,
          showFirstLabel: false,
          labels: {
                     align: 'left',
                     x: 3,
                     y: -2
                 }
       },
       tooltip: {
         enabled: false
       },
       plotOptions: {
          scatter: {
                      marker: {
                         radius: 1,
                         states: {
                            hover: {
                               enabled: true,
                               lineColor: 'rgb(100,100,100)'
                            }
                         }
                      },
                      states: {
                         hover: {
                            marker: {
                               enabled: false
                            }
                         }
                      },
                      point: {
                                      events: {
                                          mouseOver: function() {
                                              $('#reporting').html('bin: '+ this.x +', counts: '+ this.y);
                                          }
                                      }
                                  },
                                  events: {
                                      mouseOut: function() {                        
                                          $('#reporting').empty();
                                      }
                                  }
                   }
       },
       legend: {
         enabled: false
       },
       series: [{
         //type: 'series',
         linewidth:2,
         data: []
       }]
     };

     return options;
}

function getTrendOptions()
{
  var options = { 
       chart: {
          renderTo: 'radonVtime',
          zoomType: 'x',
          animation: true,
          defaultSeriesType: 'spline',
          type: 'spline'
          //spacingRight: 20
       },
        title: {
          text: 'Radon Level'
       },
       legend: {
         enabled: false
       },
       xAxis: {
         type: 'datetime',
         maxZoom: 1000.0* timeResolution, 
         title: {
             text: null
         },
         dateTimeLabelFormats: {
          day: '%e %b',
          hour: '%e %b %H:%M'   
         }
       },
       yAxis: {
          title: {
             useHTML: true,
             text: 'Bq/m<sup>3</sup>'
          },
          //min: 0.6,
          //startOnTick: false,
          showFirstLabel: false,
          labels: {
                     align: 'left',
                     x: 3,
                     y: -2
                 }
       },
       tooltip: {
        enabled: true,
        useHTML: true,
        formatter: function() {          
         return '<b>Low Bin Edge and level</b><br/><br/>'+
         Highcharts.dateFormat('%e %b %Y, %H:%M:%S', this.x) +'<br/>'+ this.y.toFixed(2) +' Bq/m<sup>3</sup>';
        }
       },
       plotOptions: {
          scatter: {
                      marker: {
                         radius: 5,
                         states: {
                            hover: {
                               enabled: true
                            }
                         }
                      },
                      states: {
                         hover: {
                            marker: {
                               enabled: true
                            }
                         }
                      },
                      point: {
                                      events: {
                                          mouseOver: function() {
                                              $('#reporting').html('bin: '+ this.x +', counts: '+ this.y);
                                          }
                                      }
                                  },
                                  events: {
                                      mouseOut: function() {                        
                                          $('#reporting').empty();
                                      }
                                  }
                   }
       },

       series: [{
         //type: 'series',
         linewidth:2, 
         data: []
       }]
     };

     return options;
}

// ____________________________________________________________________________________
function plot() {

    
  var startDate = Date.parse($("#idate").val())/1000.0;
  var endDate = Date.parse($("#fdate").val())/1000.0;
  
  //reset the local data variables...
  trendArray = null;
  histArray = null;
  console.log('initilize data')
  console.log(trendArray)
  console.log(histArray)
  

  var numTimeBins = parseInt((endDate - startDate)/timeResolution);
  console.log('date range: ' + startDate + ' -> ' + endDate)
  console.log('time resolution: ' + timeResolution);
  console.log('initial number of time bins: ' + numTimeBins);

  if( (endDate - startDate)/timeResolution % numTimeBins > 0){
    numTimeBins += 1;
    console.log('plus one for remaining time range');
  }
  console.log('total number of time bins: ' + numTimeBins);

  console.log('Radon count range (low E, high E): ' + parseFloat($("#radonlowE").val()) + ' , ' + parseFloat($("#radonhighE").val()));
  console.log('Radon calibration factor: ' + parseFloat($("#radonFactor").val()));

  var numReturns = 0;
  var subEndDate = startDate + timeResolution;
  var subStartDate = startDate;
  
  console.log();
  if(trendArray == null){
    trendArray = []
    for(var ll = 0; ll < numTimeBins; ll++){
      trendArray[ll] = [1000.0*(startDate + ll*timeResolution), 0.0]
    }
  }
  console.log('trend array created')
  console.log(trendArray)

  while(subStartDate < endDate){
    if(subEndDate > endDate)
      subEndDate = endDate;

    console.log(subStartDate + ' -> ' + subEndDate);
    console.log(new Date(subStartDate*1000.0) + ' -> ' + new Date(subEndDate*1000.0));


    db.list(appName+ "/hist", "bydate",
      {
        endkey:subEndDate, 
        startkey:subStartDate, 
        reduce:false,
        lowE: parseInt($("#lowE").val()),
        highE: parseInt($("#highE").val()),
        sendDates: "true"
      }, 
      {
        dataType: 'json',
        async: false, //does this do anything?
        success:function(theReturn){ 
          console.log(theReturn);
          var radonCnt = 0;
          var thisStartTime = theReturn['starttime']
          var thisEndTime = theReturn['endtime']
          var theHist = theReturn['hist']
          console.log('data successfully returned ' + theHist.length)
          numReturns += 1;
          console.log('returns/bins =  ' + numReturns + ' / ' + numTimeBins)

          if(histArray == null){
            histArray = [];
            //how do i initialize an array in javascript? 
            for(var ll = 0; ll < theHist.length; ll++)
              histArray[ll] = 0;
          }

                    
          for(var ll = 0; ll < theHist.length; ll++){
            var histVal = theHist[ll];
            histArray[ll] += histVal;
            
            if( (ll >= parseFloat($("#radonlowE").val())) && (ll < parseFloat($("#radonhighE").val())) && histVal > 0){
              radonCnt += histVal;
            }
            
          }
          // $.each(theHist, function(i, dd){
          //   histArray[i] += dd;
          //   if( dd >= parseFloat($("#radonlowE").val()) && dd < parseFloat($("#radonhighE").val())){
          //     radonCnt += dd;
          //   }
          // });
          
          console.log('number of radon counts in this time period ' + radonCnt);
          console.log('radon level in this time period ' + parseFloat($("#radonFactor").val())*radonCnt/(thisEndTime - thisStartTime));
          //find the right element of the trendArray
          for(var ll = 0; ll < numTimeBins-1; ll++){
            if(thisStartTime*1000.0 >= trendArray[ll][0] && thisStartTime*1000.0 < trendArray[ll+1][0] ){
              trendArray[ll][1] = parseFloat($("#radonFactor").val())*radonCnt/(thisEndTime - thisStartTime);
              console.log('Found trend bin ' + ll + ' low bin edge: ' + trendArray[ll][0] + ' -> ' + new Date(trendArray[ll][0]));
              break;
            }
          }
          if(thisStartTime*1000.0 >= trendArray[numTimeBins-1][0]){
            trendArray[numTimeBins-1][1] = parseFloat($("#radonFactor").val())*radonCnt/(thisEndTime - thisStartTime);
            console.log('Found trend bin ' + numTimeBins-1 + ' low bin edge: ' + trendArray[numTimeBins-1][0] + ' -> ' + new Date(trendArray[numTimeBins-1][0]));
          }
          //trendChart.series[0].data.push([ parseInt(thisStartTime + thisEndTime/2.), parseFloat($("#radonFactor").val())*radonCnt/(thisEndTime - thisStartTime)]);
          
          //histChart.redraw();
          //trendChart.redraw();

                 

          if(numReturns == numTimeBins){

            console.log('trend array filled')
            console.log(trendArray)

            var histOptions = getHistOptions();
            histOptions.series[0].data = histArray;
            histChart = new Highcharts.Chart(histOptions);

            var trendOptions = getTrendOptions();
            trendOptions.series[0].data = trendArray;
            trendChart = new Highcharts.Chart(trendOptions);

            $('#button-plot').button('reset');
            // $('#button-plot').removeAttr("disabled").removeClass( 'ui-state-disabled' );
            setUpDownloadLink(); 

          }  


        },
        error: function(req, textStatus, errorThrown){
          $("#chart").html("an error occurred...");
          console.log('an error was thrown:');
          console.log(errorThrown);
          $('#button-plot').button('reset');
          // $('#button-plot').removeAttr("disabled").removeClass( 'ui-state-disabled' ); 
        }
      }
    );

    subEndDate += timeResolution;
    subStartDate += timeResolution;
  }      

}


// ____________________________________________________________________________________
function setUpDownloadLink() {

   $(".download-row").show();
   
  var startDate =  Date.parse($("#idate").val())/1000.0;
  var endDate = Date.parse($("#fdate").val())/1000.0;
  var lowE = parseInt($("#lowE").val());
  var highE = parseInt($("#highE").val());
  document.getElementById("download-link").href = "_list/hist/bydate?reduce=false&startkey="+startDate+"&endkey="+endDate+"&download=true"+"&lowE="+lowE+"&highE="+highE;
     

}



