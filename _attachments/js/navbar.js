var dbname = window.location.pathname.split("/")[1];

// ____________________________________________________________________________________
$(document).ready(function(){

$.couch.db("webinterface").openDoc("navbar", {
    success: function(data) {
      var items = [];

      for (var link in data['list']){
        items.push('<li ><a href="' + link + '">' + data['list'][link] + '</a></li>');
      }
      $('#navbarList').append( items.join('') );

    }
  });
});

