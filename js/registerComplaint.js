let HOST = "http://localhost:8282";
let URI = "/complaints/api/v1/complaints";
let REGISTER_COMPLAINT_ENDPOINT = HOST + URI;
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
    setLatLngInForm(lat, lng);
    //callApiGeoAddress(lat, lng);
}

function setLatLng(lat, lng){
    latitude = lat;
    longitude = lng;
}

function setLatLngInForm(lat, lng){
    $("#inputLatitude").val(lat);
    $("#inputLongitude").val(lng);
}

function registerComplaint(){

    let complaint = {
        address : $("#inputAddress").val(),
        latitude : $("#inputLatitude").val(),
        longitude : $("#inputLongitude").val(),
        complaintType : $("#inputComplaintType").val(),
        commentary : $("#inputCommentary").val(),
        citizenId: 1
    }

    let complaintJson = JSON.stringify(complaint);
    console.log("Data: " + complaintJson);

    $.ajax({
        type: "POST",
        url: REGISTER_COMPLAINT_ENDPOINT,
        contentType: "application/json",
        accept: "application/json;",
        data: complaintJson,
        success: function (result) {
            console.log("Se recibió respuesta del servicio");

            var json = JSON.stringify(result);
            console.log("Respuesta="+json);

        },
        error: function (jqXHR, exception) {
            let msg = '';

            switch (jqXHR.status) {
                case 400:
                    let resp = JSON.parse(jqXHR.responseText);
                    msg = arrayToString(resp.errors);
                    break;
                case 500:
                    msg = "Error interno en el servidor";
                    break;
                default:
                    msg = "Error desconocido";
            }

            let myModal = document.getElementById('registerComplaintModal');
            let bootstrapModal = new bootstrap.Modal(myModal, {backdrop: true})
            let modalTitle = myModal.querySelector('#registerComplaintModalTitle');
            let modalBody = myModal.querySelector('#registerComplaintModalBody');
            modalTitle.textContent = "Error al registrar la denuncia";
            modalBody.textContent = msg;
            bootstrapModal.show();
        }
    });
}

function arrayToString(array) {
    let string = '';
    for (let value of array) {
        string += value + '. ';
    }
    return string;
}

$("#registerComplaintButton").click(registerComplaint);

window.initMap = initMap;