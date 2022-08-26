let API_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
let API_KEY = "AIzaSyB_SIPbiID5aJfuog8Mq0QmRS5szRqFVe8";
let BACKEND_HOST = "http://localhost:8282";
let COMPLAINTS_URI = "/complaints/api/v1/complaints";
let COMPLAINTS_ENDPOINT = BACKEND_HOST + COMPLAINTS_URI;
let CITIZENS_URI = "/complaints/api/v1/citizens";
let CITIZENS_ENDPOINT = BACKEND_HOST + CITIZENS_URI;
let AUTHENTICATION_URI = "/complaints/api/v1/authentication";
let AUTHENTICATION_ENDPOINT = BACKEND_HOST + AUTHENTICATION_URI;
let ADDRESS_COMPONENTS_TYPE = ["postal_code","locality","country"];
let mapIcons = new Map([
    ['ARMED_ROBBERY', './imgs/ARMED_ROBBERY.png'],
    ['ROBBERY_ON_THE_GO', './imgs/ROBBERY_ON_THE_GO.png'],
    ['ROBBERY_TO_VEHICLE', './imgs/ROBBERY_TO_VEHICLE.png'],
    ['VANDALISM', './imgs/VANDALISM.png']
]);
let map;
let marker;
let complaintMarkers = [];
let latitude;
let longitude;
let addressTemp,postalCodeTemp,localityTemp,countryTemp;

//registerComplaintModal
let myModal = document.getElementById('registerComplaintModal');
let bootstrapModal = new bootstrap.Modal(myModal, {backdrop: true})
let modalTitle = myModal.querySelector('#registerComplaintModalTitle');
let modalBody = myModal.querySelector('#registerComplaintModalBody');

//editProfileModal
let editProfileModal = document.getElementById('editProfileModal');
let editProfileBootstrapModal = new bootstrap.Modal(editProfileModal, {backdrop: true})

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

    marker.addListener("dragend", processPosition);
    addListenersToMap();
    showComplaintsBy("country", "Perú");
}

function addListenersToMap(){
    map.addListener("click", (mapsMouseEvent) => {
        marker.setPosition(mapsMouseEvent.latLng);
        processPosition();
    });
}

function processPosition(){
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
        citizenId:  getCookie("citizenId")
    }

    let complaintJson = JSON.stringify(complaint);
    console.log("Data: " + complaintJson);

    $.ajax({
        type: "POST",
        url: COMPLAINTS_ENDPOINT,
        contentType: "application/json",
        accept: "application/json;",
        data: complaintJson,
        success: function (result) {
            var json = JSON.stringify(result);
            console.log("Respuesta="+json);
            modalTitle.textContent = "Éxito";
            modalBody.textContent = "Denuncia registrada satisfactoriamente.";
            bootstrapModal.show();
            deleteMarkers();
            showComplaintsBy("country", countryTemp);
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

function showComplaintsBy(filter, value){
    //initMap(latitud, longitud);

    $.ajax({
        type: "GET",
        url: COMPLAINTS_ENDPOINT + "?searchCriterias=" + filter + ":" + value,
        accept: "application/json",
        success: function (complaints) {
            setMarkers(complaints);
        }
    });

}

function setMarkers(complaints) {

    complaints.forEach((complaint, index) => {
        let resume = "Codigo: "+ complaint.id +"\n" +
            "Direccion: "+ complaint.address +"\n" +
            "Tipo: "+ complaint.complaintType +"\n" +
            "Latitud: "+ complaint.latitude +"\n" +
            "Longitud: "+ complaint.longitude +"\n" +
            "Comentario: "+ complaint.commentary +"\n" +
            "Fecha de Registro: "+ complaint.creationTime ;

        let image = {
            url: mapIcons.get(complaint.complaintType),
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(0, 32)
        };

        let shape = {
            coords: [1, 1, 1, 20, 18, 20, 18, 1],
            type: 'poly'
        };

        complaintMarkers.push(new google.maps.Marker({
            position: {lat: complaint.latitude, lng: complaint.longitude},
            map: map,
            icon: image,
            shape: shape,
            title: resume,
            zIndex: index
        }));
    })
}

function deleteMarkers() {
    for (let complaintMarker of complaintMarkers) {
        complaintMarker.setMap(null);
    }
    complaintMarkers = [];
}

window.handleCredentialResponse = (idToken) => {
    authenticateIdToken(idToken);
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function authenticateIdToken(response){
    $.ajax({
        type: "POST",
        url: AUTHENTICATION_ENDPOINT + "/" + response.credential,
        accept: "application/json;",
        success: function (result) {
            var json = JSON.stringify(result);
            let obj = JSON.parse(json);
            console.log("Respuesta="+json);

            let responsePayload = parseJwt(response.credential);

            if ( obj.citizenId !== getCookie("citizenId") ) {
                setCookie("citizenId", obj.citizenId, 90);
                setCookie("email", responsePayload.email, 90);
            }

            $("#profile-image").attr("src", responsePayload.picture);
            $("#profile-username").html(responsePayload.name);
            $("#not-authenticated").css("display","none");
            $("#authenticated").css("display","flex");
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
            modalTitle.textContent = "Error durante la autenticación";
            modalBody.textContent = msg;
            bootstrapModal.show();
        }
    });
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var c of ca) {
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteCookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function signOut(){
    google.accounts.id.revoke(getCookie("email"), done => {
        console.log('consent revoked');
        deleteCookie('citizenId');
        deleteCookie('email');
        $("#profile-image").attr("src", "");
        $("#profile-username").html("");
        $("#not-authenticated").css("display","flex");
        $("#authenticated").css("display","none");
    });
}

function showEditProfileModal(){
    fillEditProfileForm();
    editProfileBootstrapModal.show();
}

function fillEditProfileForm(){
    $.ajax({
        type: "GET",
        url: CITIZENS_ENDPOINT + "/" + getCookie("citizenId"),
        accept: "application/json;",
        success: function (result) {
            var json = JSON.stringify(result);
            let obj = JSON.parse(json);
            console.log("Respuesta="+json);

            $("#inputEmail").val(obj.email);
            $("#inputPhoneNumber").val(obj.phoneNumber);
            $("#inputDocumentType").val(obj.documentType);
            $("#inputDocumentNumber").val(obj.documentNumber);
            $("#inputFirstName").val(obj.firstName);
            $("#inputLastName").val(obj.lastName);
            $("#inputAge").val(obj.age);
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
            modalTitle.textContent = "Error al obtener los datos del usuario";
            modalBody.textContent = msg;
            bootstrapModal.show();
        }
    });
}

function updateUserProfile(){

    let citizen = {
        id : getCookie("citizenId"),
        email: $("#inputEmail").val(),
        documentType : $("#inputDocumentType").val(),
        documentNumber : $("#inputDocumentNumber").val(),
        phoneNumber: $("#inputPhoneNumber").val(),
        firstName: $("#inputFirstName").val(),
        lastName: $("#inputLastName").val(),
        age : $("#inputAge").val()
    }

    let citizenJson = JSON.stringify(citizen);
    console.log("Data: " + citizenJson);

    $.ajax({
        type: "PUT",
        url: CITIZENS_ENDPOINT + "/" + citizen.id,
        contentType: "application/json",
        data: citizenJson,
        success: function (result) {
            modalTitle.textContent = "Éxito";
            modalBody.textContent = "Datos actualizados correctamente.";
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
            modalTitle.textContent = "Error al intentar actualizar los datos";
            modalBody.textContent = msg;
            bootstrapModal.show();
        }
    });

}

function autenticateUser(){
    deleteCookie("g_state");
    location.reload();
}

$("#registerComplaintButton").click(registerComplaint);
$("#signOut").click(signOut);
$("#editProfile").click(showEditProfileModal);
$("#editProfileButton").click(updateUserProfile);
$("#autenticate-user").click(autenticateUser);

window.initMap = initMap;