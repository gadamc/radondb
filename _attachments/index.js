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
var radonLowE = 2000;
var radonHighE = 2350;
var radonFactor = 98.7; //converts counts to Bq/cm^3

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

       series: [{
         //type: 'series',
         linewidth:1,
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
          defaultSeriesType: 'scatter',
          type: 'scatter'
          //spacingRight: 20
       },
        title: {
          text: 'Radon Level'
       },
       xAxis: {
         type: 'datetime',
         // maxZoom: 1000.0* 60.0, // 1 minutes
         // title: {
         //    text: null
         // }
         dateTimeLabelFormats: {
          day: '%e %b',
          hour: '%e %b %H:%M'   
         }
       },
       yAxis: {
          title: {
             text: 'Bq/m^3'
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

       series: [{
         //type: 'series',
         linewidth:1, 
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
  

  var numTimeBins = parseInt((endDate - startDate)/timeResolution);
  console.log('date range: ' + startDate + ' -> ' + endDate)
  console.log('time resolution: ' + timeResolution);
  console.log('initial number of time bins: ' + numTimeBins);

  if( (endDate - startDate)/timeResolution % numTimeBins > 0){
    numTimeBins += 1;
    console.log('plus one for remaining time range');
  }
  console.log('total number of time bins: ' + numTimeBins);

  console.log('Radon count range (low E, high E): ' + radonLowE + ' , ' + radonHighE);
  console.log('Radon calibration factor: ' + radonFactor);

  var numReturns = 0;
  var subEndDate = startDate + timeResolution;
  var subStartDate = startDate;
  
  console.log();

  while(subStartDate < endDate){
    if(subEndDate > endDate)
      subEndDate = endDate;

    console.log(subStartDate + ' -> ' + subEndDate);

    db.list(appName+ "/hist", "bydate",
      {
        endkey:subEndDate, 
        startkey:subStartDate, 
        reduce:false,
        lowE: parseInt($("#lowE").val()),
        highE: parseInt($("#highE").val())
      }, 
      {
        dataType: 'json',
        async: false, //does this do anything?
        success:function(theData){ 
          //console.log(theData);
          var radonCnt = 0;
          console.log('data successfully returned ' + theData.length)
          numReturns += 1;
          console.log('returns/bins =  ' + numReturns + ' / ' + numTimeBins)

          if(histArray == null){
            histArray = [];
            //how do i initialize an array in javascript? 
            for(var ll = 0; ll < theData.length; ll++)
              histArray[ll] = 0;
          }

          if(trendArray == null){
            trendArray = []
            for(var ll = 0; ll < numTimeBins; ll++){
              trendArray[ll] = [startDate + ll*timeResolution, 0]
            }
          }
          
          $.each(theData, function(i, dd){
            histArray[i] += dd;
            if( dd >= radonLowE && dd < radonHighE){
              radonCnt += 1;
            }
          });
          
          //find the right element of the trendArray
          for(var ll = 0; ll < numTimeBins-1; ll++){
            if(subStartDate >= trendArray[ll][0] && subStartDate < trendArray[ll+1][0] ){
              trendArray[ll][1] = radonFactor*radonCnt/(subEndDate - subStartDate);
              break;
            }
          }
          if(subStartDate >= trendArray[numTimeBins-1][0]){
            trendArray[numTimeBins-1][1] = radonFactor*radonCnt/(subEndDate - subStartDate);
          }
          //trendChart.series[0].data.push([ parseInt(subStartDate + subEndDate/2.), radonFactor*radonCnt/(subEndDate - subStartDate)]);
          
          //histChart.redraw();
          //trendChart.redraw();

                 

          if(numReturns == numTimeBins){

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



