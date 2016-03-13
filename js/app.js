/*Author: Unnar Thor Bachmann */
/* Global variables*/
var map;
var markers = [];
var infowindow;
var locationBorgarnes =  {lat: 64.5440, lng: -21.9167};
/* Global variables*/

/* Main method */
function initMap() {
  

  /* 
  * JSON array of the inital places displayed on the screen.
  * Both on the list and also as marker on the map.
  */
  var initialPlaces = [
    {
      'name': "Deildartunguhver",
      'location': {lat: 64.6642538, lng:-21.4116669}
    },
    { 
      'name': "Kleppjárnsreykir", 
      'location': {lat: 64.65646940, lng: -21.40663430}
    },
    { 
      'name': "Borgarnes", 
      'location': {lat: 64.5440, lng: -21.9167}
    },
    { 
      'name': "Hvanneyri", 
      'location': {lat: 64.5650, lng: -21.7669}
    },
    { 
      'name': "Reykholt", 
      'location': {lat: 64.6667, lng: -21.3000}
    },
    { 
      'name': "Bifröst", 
      'location': {lat: 64.7667, lng: -21.5518}
    },
    {
      'name': "Borg á Mýrum", 
      'location': {lat: 64.5840, lng: -21.9467}
    },           
  ];
  /*
  * The google map created.
  */
  map = new google.maps.Map(document.getElementById('map'), {
    center: locationBorgarnes,
    zoom: 8
  });
  
  /*
  * The only infowindow in the program. Shared by the markers.
  * Its content is changed by an ajax call.
  */
  infowindow = new google.maps.InfoWindow({
    content: ''
  });

  google.maps.event.addListener(infowindow,'closeclick',function(){
    for (var i = 0; i < markers.length; i++) {
      markers[i].setAnimation(null);
    }
  });
  /*
  * The markers added to the map
  */
  for (var i = 0; i < initialPlaces.length; i++) {
    addMarker(initialPlaces[i].location,initialPlaces[i].name,i);
  }
  /*
  * New array for the inital places as the markers have been created.
  */
  newInitialPlaces = [];
  for (var i = 0; i < initialPlaces.length; i++) {
    newInitialPlaces.push(
      {
      'name': '', 
      'location': {lat: 64.5740, lng: -21.8767},
      'marker': null
    });
    newInitialPlaces[i].name = initialPlaces[i].name;
    newInitialPlaces[i].location = initialPlaces[i].location;
    newInitialPlaces[i].marker = markers[i];
  }
  /* The Knockout logic */
  /*
  * A model.
  */
  var Place = function(data) {
    this.name = data.name;
    this.position = data.position;
    this.marker = data.marker;
    this.fireMarker = function() {
      activateMarker(this.marker);
    } 
  }
  /*
  * A view model.
  */
  var ViewModel = function() {
    var self = this;
    self.filterText = ko.observable("");
    self.googleMap = map;
    self.placeList = ko.observableArray([]);
    newInitialPlaces.forEach(function(placeItem) {
     self.placeList.push(new Place(placeItem));
    });
    self.placeList = self.placeList.sort();
    self.placeList.sort(function (left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1) })
    /* 
    * The main method in the view model.
    * Allows filtering.
    */
    self.filteredPlaceList = ko.computed(function () {
      var placeArray = self.placeList;
        
      return ko.utils.arrayFilter(placeArray, function(place) {
        var filter = self.filterText().toLowerCase();
        var p = place.name.toLowerCase();
        var prefix = p.search(filter);
        if (prefix === 0) {
          place.marker.setVisible(true);
          return true;
        }
        else  {
          if ((infowindow.content).indexOf(place.name) != -1) {
            infowindow.close();
          }
          place.marker.setVisible(false);
          return false;
        }
      });
    },self);
  } 
  /*
  * Knockout activated by applying bindings.
  */
  ko.applyBindings(new ViewModel());
  /* The Knockout logic */
}
/*
* Markers added to the map and stored in the global array markers.
*/
function addMarker(location,lname,i) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    name: lname,
    draggable: true,
    id: i,
    animation: google.maps.Animation.DROP
  });

  /*
  * Event listener added to each marker to make them
  * clickable.
  */
  marker.addListener('click', function() {
    map.setZoom(8);
    /*
    * One marker allowed to be animated at the time.
    */
    activateMarker(marker)
  });
  /*
  * Each marker pushed to the global markers array.
  */
  markers.push(marker);
}

/*
* The Wikipedia articles fetched.
* Failed function invoked upon error.
*/
function activateMarker(marker) {
  for (var i = 0; i < markers.length; i++) {
      markers[i].setAnimation(null);
      if (markers[i].id === marker.id) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
  }
  $.ajax({
      url: 'http://en.wikipedia.org/w/api.php?&action=opensearch&search=' + marker.name + '&format=json&callback=wikiCallback',
      dataType: "jsonp", 
      timeout: 5000       
    }).done(function (response) {
      var cont = '<div class=wikipedia-container"> <h3 id="wikipedia-header">Most Relevant Wikipedia Articles ('+ marker.name +')</h3> <ul id="wikipedia-links">';
      var headers = response[2];
      var urls = response[3];
      items = [];
      for (var i = 0; i < Math.min(headers.length,3); i++) {
        var temp = '<li id="w' + i + '">'+ '<a href="' + urls[i] +'">' + headers[i] + '</a>' + '</li>';
        items.push(temp);
      }
      for (var i = 0; i < items.length; i++) {
        cont += items[i]; 
      }
      cont +='</ul></div>';
      infowindow.setContent(cont);
      infowindow.open(map, marker);
    }).fail(function(jqxhr) {
        alert("Connection problem with Wikipedia. Status: " + jqxhr.statusText);
  });
}

/*
* The map is made responsive with javascript.
*/
$(window).resize(function () {
    var h = $(window).height();
    var w = $(window).width();
    if (w > 750) {
      $('#map').css('float','left');
      $('#listView').css('float','right');
      var hm = h*0.6;
      var wm = w*0.7;
      $('#listView').css('width',$(window).width()-50-wm);
      $('#filter').css('float','none');
      $('#places').css('float','none');
    }
    else if (w <= 750 && w > 550) {
      $('#map').css('float','left');
      $('#listView').css('float','right');
      hm = h*0.6;
      wm = w*0.6;
      $('#listView').css('width',$(window).width()-50-wm);
      $('#filter').css('float','none');
      $('#places').css('float','none');

    }
    else {
      $('#map').css('float',"none");
      $('#listView').css('float','none');
      hm = h*0.6;
      wm = w*0.8;
      $('#listView').css('width',w*0.7);
      $('#filter').css('float','right');
      $('#places').css('float','none');
    }
    $('#map').css('height', hm);
    $('#map').css('width', wm);  
}).resize();