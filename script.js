// map options
var options = {
  center: [33, -93.5],
  zoom: 5,
  zoomControl: false
}

// create a Leaflet map in our division container with id of 'map'
var map = L.map('map', options);

// Leaflet providers base map URL
var basemap_source =
  'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'

// Leaflet providers attributes
var basemap_options = {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 10,
  minZoom: 1
};

map.addControl(L.control.zoom({
  position: 'topright'
}));

// request some basemap tiles and add to the map
var tiles = L.tileLayer(basemap_source, basemap_options).addTo(map);

var attributeValue = "cost_total";
console.log(attributeValue)

function getRadius(area) {
  var radius = Math.sqrt(area / Math.PI);
  return radius * .12;
}

// draw rosenwald school layer
var schoolsLayer = $.getJSON("data/rosenwald-short.geojson", function(data) {
  var dataLayer = L.geoJson(data, {
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
        color: 'black',
        weight: 1,
        fillOpacity: 0.8,
        opacity: 0.9,
        radius: 5
      });
    },
    filter: function(feature) {
      if ((feature.properties.cost_total) > 0) {
        return feature;
      }
    },
    style: function(feature) {
      return {
        radius: getRadius(feature.properties.cost_total)
      }
    },
    onEachFeature: function(feature, layer) {

      var props = feature.properties

      var tooltip =
        "<h4>" + props.name_hist + "</h4><b>Location:</b> " +
        props.county + ", " + props.state + "<br><b>Funded by</b>" +
        "<ul><li>African Americans: $" + props.cost_black.toLocaleString() + "</li>" +
        "<li>Rosenwald: $" + props.cost_rwald.toLocaleString() + "</li>" +
        "<li>Public: $" + props.cost_pub.toLocaleString() + "</li>" +
        "<li>Whites: $" + props.cost_white.toLocaleString() + "</li></ul>" +
        "<b>Total cost: </b>$" + props.cost_total.toLocaleString()

      layer.bindTooltip(tooltip);
      layer.on('mouseover', function() {
        this.openTooltip();
      });
      layer.on('mouseout', function() {
        this.closeTooltip();
      });
      // layer.on('click', function(
      // e) { // zoom to point function -- giving me some trouble, though -- when you are zoomed out very far, it will zoom to where you clicked on the point, rather than its centroid -- which many times doesn't actually bring the point into frame...
      //   map.setView(e.latlng, 10); // updated to flyTo as opposed to setView -- better? kind of...
      // });
    }
  })
  console.log(schoolsLayer)
  // Get breaks to style sumbol on mouseout
  var breaks = getClassBreaks(dataLayer);

  // Apply the styles to each layer
  dataLayer.eachLayer(function(layer) {
    layer.on('mouseover', function() {
      layer.setStyle({
        fillColor: '#e83e8d'
      });
    });

    layer.on('mouseout', function() {
      layer.setStyle({
        fillColor: getColor(layer.feature.properties[attributeValue], breaks)
      });
    });
  });

  dataLayer.addTo(map)
  drawMap(dataLayer);

});

// draw state overlay for boundaries
$.when(schoolsLayer).done(function() {
  // load, filter, and style the state outline
  $.getJSON("data/states-short.geojson", function(data) {

    var stateLayer = L.geoJson(data, {
      style: function(feature) {
        return {
          color: '#bdbbb7',
          weight: 1,
          fillOpacity: 0.1,
          interactive: false
        };
      },
    });
    console.log(stateLayer)

    // Add layer to map
    stateLayer.addTo(map).bringToBack();
    map.setMaxBounds(map.getBounds(stateLayer));

  });
});

// *********** Functions below here *********** //

// define function for coloring points
function drawMap(dataLayer) {
  var breaks = getClassBreaks(dataLayer);
  // after you get the class breaks, call the legend function
  drawLegend(breaks)
  dataLayer.eachLayer(function(layer) {
    var props = layer.feature.properties;
    layer.setStyle({
      fillColor: getColor(props[attributeValue], breaks)
    });
  });
}

// define function for getting class breaks
function getClassBreaks(dataLayer) {
  // create empty Array for storing values
  var values = [];
  // loop through all the counties
  dataLayer.eachLayer(function(layer) {
    var props = layer.feature.properties;
    var value = props[attributeValue];
    if (value != 0) { // Check for 0 values
      values.push(Number(value)); // Add as number
    }
  });;
  console.log(values) // verify in the Console
  // determine similar clusters

  var clusters = ss.ckmeans(values, 5);

  // create an array of the lowest value within each cluster
  var breaks = clusters.map(function(cluster) {
    // console.log(cluster)
    return [cluster[0], cluster.pop()];
  });
  // console.log(breaks); // verify your break values
  return breaks; // return Array of class breaks
} // end getClassBreaks function

function drawLegend(breaks) {

  // create the Leaflet control and position
  var legend = L.control({
    position: 'topleft'
  });

  // when it's added to the map
  legend.onAdd = function() {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML = "<h4>" + 'Construction Cost' + "</h4>" + "<br>";
    for (var i = 0; i < breaks.length; i++) { // keep all breaks
      var color = getColor(breaks[i][0], breaks);
      div.innerHTML +=
        '<span style="background:' + color + '"></span> ' +
        '<label>' + "$" + (breaks[i][0]).toLocaleString() + ' - ' + "$" +
        (breaks[i][1]).toLocaleString() + '</label><br>';
    }
    return div;
  }; // end onAdd method
  // add the legend to the map
  legend.addTo(map);
}

// define get color function
function getColor(d, breaks) {
  if (d <= breaks[0][1]) {
    return '#f0f9e8';
  } else if (d <= breaks[1][1]) {
    return '#bae4bc';
  } else if (d <= breaks[2][1]) {
    return '#7bccc4';
  } else if (d <= breaks[3][1]) {
    return '#43a2ca';
  } else if (d <= breaks[4][1]) {
    return '#0868ac'
  }
} // end getColor

const about = document.getElementById("about");
const methods = document.getElementById("methods");

function ab(){
  about.style.display = "block";
  methods.style.display = "none";
}

function meth(){
  about.style.display = "none";
  methods.style.display = "block";
}

function data(){
  window.open("data/rosenwald-schools-031819.geojson")
}