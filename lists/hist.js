function(head, req){
  
  
  var hist = [];
  hist.length = 4100;  //assume that this doesn't change...?? (i've written worse code.)
  for(var i = 0; i < 4100; i++){
    hist[i] = 0;
  }
  var highE = 4100;
  if(req.query.highE){
    highE = parseInt(req.query.highE);  //parseInt -- just in case the user sent in a string
  }
  
  var lowE = 0;
  if(req.query.lowE){
    lowE = parseInt(req.query.lowE);  //parseInt -- just in case the user sent in a string
  }
  
  while(row = getRow()){
      if(row.value < 4100 && row.value<highE && row.value>=lowE){
        hist[row.value] += 1;
      }
  }
  
  if(req.query.download == "true"){
    
    var fileName = "radondata.csv";
    var attName = "attachment;filename=\""+fileName+"\"";
    start({
      "headers": {
        "Content-Type": "text/csv;charset=utf-8;header=present",
        "Content-disposition" : attName
      }
    });
    for(var i = 0; i < hist.length; i++){
      send(i + ',' + hist[i] + '\n');
    }
    // send( {
    //         headers: {
    //           "Content-Type": "text/csv",
    //           "Content-disposition" : attName
    //         },
    //         body:theBody
    //     });
    //send(theBody);
    
  }
  
  else{
    //return toJSON(hist);
    send(toJSON(hist));
  }
  
}