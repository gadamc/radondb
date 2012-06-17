function(doc) {
  if(doc.data && doc.type == "radondatafile"){
    var run = doc._id.split('.')[0]
    var majorRun = parseFloat(run.split("_")[0]);
    var minorRun = parseFloat(run.split("_")[1]);
    emit([majorRun, minorRun], 1);
  }
}