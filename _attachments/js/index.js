var dbname = window.location.pathname.split("/")[1];
var appName = window.location.pathname.split("/")[3];
var db = $.couch.db(dbname);
var hist = new Array();
var today = new Date();
var lastMonth = new Date();
lastMonth.setDate(today.getDate() - 30);

// ____________________________________________________________________________________
$(document).ready(function(){

 

 $( "#button-plot" ).button();
 $(".download-row").hide();
 
  $(function() {
    
        $('#idate').datetimepicker({
          numberOfMonths: 2,
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
          numberOfMonths: 2,
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
        
  });
   
   
});

// ____________________________________________________________________________________
function plot() {

    
   var startDate = Date.parse($("#idate").val())/1000.0;
   var endDate = Date.parse($("#fdate").val())/1000.0;
  
   var chart;
    var options = { 
       chart: {
          renderTo: 'chart',
          zoomType: 'xy',
          animation: false,
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
                                          $reporting.empty();
                                      }
                                  }
                   }
       },

       series: [{
         //type: 'series',
         linewidth:1
       }]
     };

   
    $("#chart").html("getting your data...");
    $('#button-plot').attr("disabled", "disabled").addClass( 'ui-state-disabled' );
    
     //need to set up the histogram
     db.list(appName+ "/hist", "bydate",
       {
         endkey:endDate, 
         startkey:startDate, 
         reduce:false,
         lowE: parseInt($("#lowE").val()),
         highE: parseInt($("#highE").val())
       }, 
       {
         dataType: 'json',
         async: false,
          success:function(theData){ 
              options.series[0].data = theData;
              chart = new Highcharts.Chart(options);
              $('#button-plot').removeAttr("disabled").removeClass( 'ui-state-disabled' );
              setUpDownloadLink(); 
          },
          error: function(req, textStatus, errorThrown){
            alert('Error '+ textStatus);
            $("#chart").html("woops...");
            $('#button-plot').removeAttr("disabled").removeClass( 'ui-state-disabled' );
            
          }
        }
      );
      
    

}

// ____________________________________________________________________________________
function setUpDownloadLink() {

   $(".download-row").show();
   
  var startDate =  Date.parse($("#idate").val())/1000.0;
  var endDate = Date.parse($("#fdate").val())/1000.0;
  var lowE = parseInt($("#lowE").val());
  var highE = parseInt($("#highE").val());
  document.getElementById("download-link").href = "_list/hist/bydate?reduce=false&startkey="+startDate+"&endkey="+endDate+"&download=true"+"&lowE="+lowE+"&highE"+highE;
     

}



