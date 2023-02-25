let map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.1020, lng: -88.2272 },
        zoom: 10,
    });

    uiuc_lat_lng = { lat: 40.1020, lng: -88.2272 };

    // create 10 random markers that are within 50 miles of UIUC
    let toy_lat_lng = []
    for (let i = 0; i < 20; i++) {
        let lat = uiuc_lat_lng.lat + (Math.random() - 0.50) * 1/10;
        let lng = uiuc_lat_lng.lng + (Math.random() - 0.50) * 1/10;
        toy_lat_lng.push({ lat, lng });
    }

    for (let i = 0; i < toy_lat_lng.length; i++) {
        new google.maps.Marker({
            position: toy_lat_lng[i],
            map,
            title: "Hello World!",
        });
    }
}

window.initMap = initMap;
