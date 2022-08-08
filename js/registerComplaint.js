let API_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
let API_KEY = "AIzaSyB_SIPbiID5aJfuog8Mq0QmRS5szRqFVe8";
let BACKEND_HOST = "http://localhost:8282";
let COMPLAINTS_URI = "/complaints/api/v1/complaints";
let REGISTER_COMPLAINT_ENDPOINT = BACKEND_HOST + COMPLAINTS_URI;
let ADDRESS_COMPONENTS_TYPE = ["postal_code","locality","country"];
let map;
let marker;
let latitude;
let longitude;
let addressTemp,postalCodeTemp,localityTemp,countryTemp;

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
    let lat = marker.getPosition().lat();
    let lng = marker.getPosition().lng();
    console.log("lat=" + lat + ", lng=" + lng);
    setLatLng(lat, lng);
    setLatLngInForm(lat, lng);
    getAddressByLatLng(lat, lng);
    setAddressInForm();
}

function setLatLng(lat, lng){
    latitude = lat;
    longitude = lng;
}

function setLatLngInForm(lat, lng){
    $("#inputLatitude").val(lat);
    $("#inputLongitude").val(lng);
}

function setAddressInForm(){
    $("#inputAddress").val(addressTemp);
}

function getAddressByLatLng(latitud, longitud){
    let latlng = latitud + "," + longitud;

    $.ajax({
        type: "GET",
        url: API_GEOCODE_URL,
        data: {
            latlng: latlng,
            key: API_KEY
        },
        dataType: "json",
        success: function (result) {
            let json = JSON.stringify(result)
            let obj = JSON.parse(json);
            let addressComponents = obj.results[0].address_components;
            addressTemp = obj.results[0].formatted_address;

            _.filter(addressComponents, comp => {
                return _.some(comp.types, type => ADDRESS_COMPONENTS_TYPE.includes(type));
            }).map(comp => {
                return {name: comp.long_name, type: getAddressComponentType(comp.types)}
            }).forEach((item, index) => {
                    console.log(item.name, item.type)
                    if ( item.type === "postal_code" ) postalCodeTemp = item.name;
                    if ( item.type === "locality" ) localityTemp = item.name;
                    if ( item.type === "country" ) countryTemp = item.name;
            });
        }
    });
}

function getAddressComponentType(types){
    if (types.includes("postal_code")) return "postal_code";
    else if (types.includes("locality")) return "locality";
    else return "country";
}

function registerComplaint(){

    let complaint = {
        address : $("#inputAddress").val(),
        latitude : $("#inputLatitude").val(),
        longitude : $("#inputLongitude").val(),
        postalCode: postalCodeTemp,
        locality: localityTemp,
        country: countryTemp,
        complaintType : $("#inputComplaintType").val(),
        commentary : $("#inputCommentary").val(),
        citizenId: 1
    }

    let complaintJson = JSON.stringify(complaint);
    console.log("Data: " + complaintJson);

    //Modal
    let myModal = document.getElementById('registerComplaintModal');
    let bootstrapModal = new bootstrap.Modal(myModal, {backdrop: true})
    let modalTitle = myModal.querySelector('#registerComplaintModalTitle');
    let modalBody = myModal.querySelector('#registerComplaintModalBody');

    $.ajax({
        type: "POST",
        url: REGISTER_COMPLAINT_ENDPOINT,
        contentType: "application/json",
        accept: "application/json;",
        data: complaintJson,
        success: function (result) {
            var json = JSON.stringify(result);
            console.log("Respuesta="+json);
            modalTitle.textContent = "Éxito";
            modalBody.textContent = "Denuncia registrada satisfactoriamente.";
            bootstrapModal.show();
        },
        error: function (jqXHR, exception) {
            let msg = '';
            switch (jqXHR.status) {
                case 400:
                    let resp = JSON.parse(jqXHR.responseText);
                    msg = _.join(resp.errors, '. ');
                    break;
                case 500:
                    msg = "Error interno en el servidor";
                    break;
                default:
                    msg = "Error desconocido";
            }

            modalTitle.textContent = "Error al registrar la denuncia";
            modalBody.textContent = msg;
            bootstrapModal.show();
        }
    });
}

$("#registerComplaintButton").click(registerComplaint);

window.initMap = initMap;