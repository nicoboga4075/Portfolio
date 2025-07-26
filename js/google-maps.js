// For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
let google;

function init() {
    let myLatlng = new google.maps.LatLng(40.69847032728747, -73.9514422416687);
	
    const mapElement = document.getElementById('map');
    const mapOptions = {
        zoom: 7,
        center: myLatlng,
        scrollwheel: false,
        styles: [
            {
                "featureType": "administrative.country",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "simplified"
                    },
                    {
                        "hue": "#ff0000"
                    }
                ]
            }
        ]
    };
	
    let map = new google.maps.Map(mapElement, mapOptions);
	
    const addresses = ['New York'];
	
    for (const address of addresses) {
        $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&sensor=false', null, function (data) {
            let p = data.results[0].geometry.location;
            let latlng = new google.maps.LatLng(p.lat, p.lng);
            let marker = new google.maps.Marker({
                position: latlng,
                map: map,
                icon: 'images/loc.png'
            });
        });
    }
}

if (window.google?.maps?.event) {
  google.maps.event.addDomListener(window, 'load', init);
}