let map;

let temp_z = 0;
// https://stackoverflow.com/a/27943
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

function get_dist_in_km_given_xy(p1, p2, testing=false) {
    let R = 6371;
    let lat1 = Math.asin(p1.z / R)* 180 / Math.PI;
    let lat2 = Math.asin(p2.z / R)* 180 / Math.PI;
    let lng1 = Math.atan2(p1.y, p1.x)* 180 / Math.PI;
    let lng2 = Math.atan2(p2.y, p2.x)* 180 / Math.PI;
    if (testing) {
        console.log("lat1", lat1, "lng1", lng1, "lat2", lat2, "lng2", lng2);
    }

    return getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
}

function get_circle(points) {
    let n = points.length;
    if (n == 1) {
        return points[0], 0;
    }
    let min_radius = 1e9;
    let min_center = null;
    for (let i = 0; i < n; i++) {
        for (let j = i+1; j < n; j++) {
            let x1 = points[i].x
            let y1 = points[i].y
            let z1 = points[i].z
            let x2 = points[j].x
            let y2 = points[j].y
            let z2 = points[j].z
            let center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (z1 + z2) / 2 };
            let radius = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) / 2;
            if (radius < min_radius && points.every(p => Math.sqrt((p.x - center.x)**2 + (p.y-center.y)**2) <= radius)) {
                // console.log("found circle with radius", radius, "centered at", center);
                min_radius = radius;
                min_center = center;
            }
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = i+1; j < n; j++) {
            for (let k = j+1; k < n; k++) {
                let x1 = points[i].x
                let y1 = points[i].y
                let z1 = points[i].z
                let x2 = points[j].x
                let y2 = points[j].y
                let z2 = points[j].z
                let x3 = points[k].x
                let y3 = points[k].y
                let z3 = points[k].z
                let a = x2 - x1
                let b = y2 - y1
                let c = x3 - x1
                let d = y3 - y1
                let e = a*(x1 + x2) + b*(y1 + y2)
                let f = c*(x1 + x3) + d*(y1 + y3)
                let g = 2*(a*(y3 - y2) - b*(x3 - x2))
                
                if (g == 0) continue; // points are colinear, no circle exists
                
                let center = { x: (d*e - b*f) / g, y: (a*f - c*e) / g, z: (z1+z2+z3)/3 }; // todo: len points
                let radius = Math.sqrt((x1 - center.x) ** 2 + (y1 - center.y) ** 2);

                if (radius < min_radius && points.every(p => Math.sqrt((p.x - center.x)**2 + (p.y-center.y)**2) <= radius)) {
                    min_radius = radius;
                    min_center = center;
                }
            }
        }
    }
    return {min_center, min_radius};
}

function do_circles(k, points, r) { // r is range in km
    // dictionary that maps points to their index in the points array
    let point_to_index = {};
    for (let i = 0; i < points.length; i++) {
        point_to_index[JSON.stringify(points[i])] = i;
    }


    // generate all subsets of points

    let centers = [];
    for (let i = 0; i < k; i++) {
        let min_center = null;
        let min_radius = 1e9;
        let max_points_covered = 0;
        // let subset = [points[0], points[2], points[8]]
        let subsets = [];
        for (let i = 0; i < (1 << points.length); i++) {
            let subset = [];
            for (let j = 0; j < points.length; j++) {
                if (i & (1 << j)) {
                    subset.push(points[j]);
                }
            }
            subsets.push(subset);
        }
        for (let subset of subsets) {
            if (subset.length < max_points_covered) {
                continue;
            }
            let obj = get_circle(subset);
            if (obj.min_center && obj.min_radius <= r) {
                let points_covered = 0;
                for (let p of points) {
                    if (get_dist_in_km_given_xy(p, obj.min_center) <= r) {
                        points_covered++;
                    }
                }
                if (points_covered > max_points_covered || (points_covered == max_points_covered && obj.min_radius < min_radius)) {
                    max_points_covered = points_covered;
                    min_center = obj.min_center;
                }
            }
        }
        if (min_center) {
            centers.push(min_center);
            for (let p of points) {
                if (get_dist_in_km_given_xy(p, min_center) <= r) {
                    console.log(point_to_index[JSON.stringify(p)], "is covered by", JSON.stringify(min_center), 'with distance', get_dist_in_km_given_xy(p, min_center, true), '|', i);
                }
            }
            points = points.filter(p => get_dist_in_km_given_xy(p, min_center) > r);
        }
    }

    return centers;
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.1020, lng: -88.2272 },
        zoom: 10,
    });

    // create 10 random markers that are within 50 miles of UIUC
    const toy_lat_lng = [
        {lat: 40.091382619054095, lng: -88.20355570065745},
        {lat: 40.119465429980075, lng: -88.25631429231643},
        {lat: 40.0843671435526, lng: -88.17966413209922},
        {lat: 40.12074849817585, lng: -88.25780941212209},
        {lat: 40.06034974698892, lng: -88.26023937839072},
        {lat: 40.08929359365313, lng: -88.2293212571064},
        {lat: 40.10695518042118, lng: -88.20294633023903},
        {lat: 40.12205323776675, lng: -88.20281939120444},
        {lat: 40.07345054618992, lng: -88.20340377296542},
        {lat: 40.10195486689165, lng: -88.22314440118363},
        {lat: 40.08627578966312, lng: -88.24814482668927},
        {lat: 40.095659382411704, lng: -88.26933356741124},
        {lat: 40.14780641457074, lng: -88.18783449356478},
        {lat: 40.13708721330871, lng: -88.22599153082079},
        {lat: 40.14808287435217, lng: -88.23210089628816},
        {lat: 40.134018355628534, lng: -88.23616233564462},
        {lat: 40.10934560686244, lng: -88.18844015930223},
        {lat: 40.05700839339326, lng: -88.26322922204145},
        {lat: 40.08855865725717, lng: -88.2480154176881},
        {lat: 40.137259184864476, lng: -88.20867283496352}
    ];
    // let toy_lat_lng = [];
    // for (let i = 0; i < 20; i++) {
    //     let lat = uiuc_lat_lng.lat + (Math.random() - 0.5) * 0.25;
    //     let lng = uiuc_lat_lng.lng + (Math.random() - 0.5) * 0.25;
    //     toy_lat_lng.push({ lat: lat, lng: lng });
    // }

    // convert latitude and longitude to cartesian coordinates
    // https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    function toCartesian(lat, lng) {
        lat = lat * Math.PI / 180;
        lng = lng * Math.PI / 180;
        let R = 6371
        let x = R * Math.cos(lat) * Math.cos(lng);
        let y = R * Math.cos(lat) * Math.sin(lng);
        let z = R * Math.sin(lat);
        temp_z += z;
        return { x, y, z };
    }

    let points = []
    for (let point of toy_lat_lng) {
        points.push(toCartesian(point.lat, point.lng));
    }
    const r = 2;
    let centers = do_circles(10, points, r);
    let center_lat_lng = [];
    for (let center of centers) {
        // convert cartesian coordinates back to latitude and longitude
        let lat = Math.asin(center.z / 6371) * 180 / Math.PI;
        let lng = Math.atan2(center.y, center.x) * 180 / Math.PI;
        center_lat_lng.push({ lat, lng });
        // make a circle at the center

        var recycling_center = new google.maps.Marker({
            position: { lat, lng },
            map,
            label: 'Recycling Center' + centers.indexOf(center),
        });
        recycling_center.setIcon('center (1).png');
    }

    let markers = new Array(toy_lat_lng.length);
    let info_windows = new Array(toy_lat_lng.length);
    for (let i = 0; i < toy_lat_lng.length; i++) {
        let content = "";
        for (let center_ll of center_lat_lng) {
            let dist = getDistanceFromLatLonInKm(toy_lat_lng[i].lat, toy_lat_lng[i].lng, center_ll.lat, center_ll.lng);
            if (dist <= r) {
                content = 'Goes to center' + center_lat_lng.indexOf(center_ll);
            }
        }
        markers[i] = new google.maps.Marker({
            position: toy_lat_lng[i],
            map,
            label: content == "" ? 'x' : i.toString(),
        });

        info_windows[i] = new google.maps.InfoWindow({content});
        markers[i].addListener("click", () => {
            info_windows[i].open(map, markers[i]);
        });
        
    }
}

window.initMap = initMap;
