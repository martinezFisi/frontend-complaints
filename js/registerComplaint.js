let map;
let marker;
let latitude;
let longitude;

function initMap(){
    loadMap(-12.053816,-77.084556);
}

function loadMap(lat, lng) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: lat, lng: lng },
        zoom: 17,
    });

    marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: {lat: lat, lng: lng}
    });

    marker.addListener("click", toggleBounce);
    marker.addListener("dragend", dragEnd);
}

function toggleBounce() {
    console.log("clickaste")
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function dragEnd(){
    var lat = marker.getPosition().lat();
    var lng = marker.getPosition().lng();
    console.log("lat=" + lat + ", lng=" + lng);
    setLatLng(lat, lng);
    //callApiGeoAddress(lat, lng);
}

function setLatLng(lat, lng){
    latitude = lat;
    longitude = lng;
}

window.initMap = initMap;