

// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let userGEO = {"geometry": {"type": "Point", "coordinates": defaultLocation}, "type": "Feature", "properties": {}};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat;
let userLon;
let pointsOfInterest;

// update user location by watching its position
navigator.geolocation.watchPosition(function(pos) {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    userGEO = {"geometry": {"type": "Point", "coordinates": [userLon, userLat]}, "type": "Feature", "properties": {}};
    console.log('position updated')
});

// load map
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/ingmarvdg/cjz12ef7l00oy1cro517z0nzl',
    center: defaultLocation, // starting position
    zoom: defaultZoom // starting zoom
});

map.on('load', function () {
    // periodical events
    window.setInterval(function() {
        map.getSource('user').setData(userGEO);
        //map.flyTo({center: [userLon, userLat] , zoom: defaultZoom})

        // radius in kilometers
        let radius = 0.5;

        let bbox = calculateBBox(userLat, userLon, radius);

        let relevantLocations = map.queryRenderedFeatures(bbox, {layers: ['locations']});
        console.log(relevantLocations);
        let filter = relevantLocations.reduce(function(memo, relevantLocations) {
            memo.push(relevantLocations.properties.Location);
            return memo;
        }, ['in', 'Location']);
        map.setFilter("locations-highlighted", filter);
    }, 250);

    // markers
    let size = 100;
    let checkDot = newDot(size);
    map.addImage('pulsing-dot', checkDot, { pixelRatio: 2 });

    // map layers
    map.addSource('user', { type: 'geojson', data: userGEO });
    map.addLayer({
        "id": "user",
        "type": "symbol",
        "source": "user",
        "layout": {
            "icon-image": "pulsing-dot"
        }
    });

    // add source and layers for points of interest.
    map.loadImage('./fine.png', function(error, image){
        if (error) throw error;
        map.addImage('fine', image)
    });

    map.loadImage('./module.png', function(error, image){
        if (error) throw error;
        map.addImage('module', image)
    });

    map.loadImage('./loi.png', function(error, image){
        if (error) throw error;
        map.addImage('loi', image)
    });

    map.loadImage('./event2.png', function(error, image){
        if (error) throw error;
        map.addImage('event', image)
    });

    map.addSource('locationpoints', {
        type: 'geojson',
        data: './GeoJason.geojson'
    });

    map.addLayer({
        'id': 'locations-highlighted',
        'type': 'symbol',
        'source': 'locationpoints',
        'layout': {
            'icon-image': "fine"
        },
        "filter": ["in", "Location", ""]
    })


    map.on('click', function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['data-police'] // replace this with the name of the layer
        });

        if (!features.length) {
            return;
        }

        let feature = features[0];

        let popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(feature.geometry.coordinates)
            .setHTML('<h3>' + feature.properties.title + '</h3><p>' + feature.properties.description + '</p>')
            .addTo(map);


    });

})








// takes user location+radius and returns pixel values of bound box coordinates
function calculateBBox(userLat, userLon, radius){
    const latLngKilometers = 111.2;
    let latLngOffset = radius/latLngKilometers;
    let northEast = map.project([userLon + latLngOffset, userLat - latLngOffset]);
    let southWest = map.project([userLon - latLngOffset, userLat - latLngOffset]);
    return [southWest, northEast];
}

