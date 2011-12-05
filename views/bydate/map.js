function(doc) {
  if(doc.data && doc.type == "radondatafile"){
    for (var i = 0; i < doc.data.length; i++) {
      emit(doc.data[i][0], doc.data[i][1]);
    } 
  }
}