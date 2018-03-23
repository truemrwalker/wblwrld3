// This part is adapted from TimothyGu/utm
// https://github.com/TimothyGu/utm

var K0 = 0.9996;

var E = 0.00669438;
var E2 = Math.pow(E, 2);
var E3 = Math.pow(E, 3);
var E_P2 = E / (1 - E);

var SQRT_E = Math.sqrt(1 - E);
var _E = (1 - SQRT_E) / (1 + SQRT_E);
var _E2 = Math.pow(_E, 2);
var _E3 = Math.pow(_E, 3);
var _E4 = Math.pow(_E, 4);
var _E5 = Math.pow(_E, 5);

var M1 = 1 - E / 4 - 3 * E2 / 64 - 5 * E3 / 256;
var M2 = 3 * E / 8 + 3 * E2 / 32 + 45 * E3 / 1024;
var M3 = 15 * E2 / 256 + 45 * E3 / 1024;
var M4 = 35 * E3 / 3072;

var P2 = 3 / 2 * _E - 27 / 32 * _E3 + 269 / 512 * _E5;
var P3 = 21 / 16 * _E2 - 55 / 32 * _E4;
var P4 = 151 / 96 * _E3 - 417 / 128 * _E5;
var P5 = 1097 / 512 * _E4;

var R = 6378137;

function convertLatLngToUtm(lat, lon) {
	var latitude = lat; // * 180 / Math.PI;
	var longitude = lon; // * 180 / Math.PI;

	latitude = Math.min(84, Math.max(-80, latitude)); // truncate to allowed range, TODO: do this better later

	if (latitude > 84 || latitude < -80) {
		throw new RangeError('latitude out of range (must be between 80 deg S and 84 deg N)');
	}
	while(longitude < -180) {
		longitude += 360;
	}
	while(longitude > 180) {
		longitude -= 360;
	}

	var latRad = latitude / 180 * Math.PI;
	var latSin = Math.sin(latRad);
	var latCos = Math.cos(latRad);

	var latTan = Math.tan(latRad);
	var latTan2 = Math.pow(latTan, 2);
	var latTan4 = Math.pow(latTan, 4);

	var zoneNum = latLonToZoneNumber(latitude, longitude);

	var lonRad = longitude / 180 * Math.PI;
	var centralLon = zoneNumberToCentralLongitude(zoneNum);
	var centralLonRad = centralLon / 180 * Math.PI;

	var n = R / Math.sqrt(1 - E * latSin * latSin);
	var c = E_P2 * latCos * latCos;

	var a = latCos * (lonRad - centralLonRad);
	var a2 = Math.pow(a, 2);
	var a3 = Math.pow(a, 3);
	var a4 = Math.pow(a, 4);
	var a5 = Math.pow(a, 5);
	var a6 = Math.pow(a, 6);

	var m = R * (M1 * latRad -
		M2 * Math.sin(2 * latRad) +
		M3 * Math.sin(4 * latRad) -
		M4 * Math.sin(6 * latRad));
	var easting = K0 * n * (a +
		a3 / 6 * (1 - latTan2 + c) +
		a5 / 120 * (5 - 18 * latTan2 + latTan4 + 72 * c - 58 * E_P2)) + 500000;
	var northing = K0 * (m + n * latTan * (a2 / 2 +
		a4 / 24 * (5 - latTan2 + 9 * c + 4 * c * c) +
		a6 / 720 * (61 - 58 * latTan2 + latTan4 + 600 * c - 330 * E_P2)));

	// if (latitude < 0) {
	//     northing += 1e7;
	// }

	easting += zoneNum * 668000; // scale to size of largest zone (stretches things near the poles a lot

	return [easting, northing];
}


function latLonToZoneNumber(latitude, longitude) {
	if (56 <= latitude && latitude < 64 && 3 <= longitude && longitude < 12) return 32;

	if (72 <= latitude && latitude <= 84 && longitude >= 0) {
		if (longitude <  9) return 31;
		if (longitude < 21) return 33;
		if (longitude < 33) return 35;
		if (longitude < 42) return 37;
	}

	return Math.floor((longitude + 180) / 6) + 1;
}


function zoneNumberToCentralLongitude(zoneNum) {
	return (zoneNum - 1) * 6 - 180 + 3;
}
