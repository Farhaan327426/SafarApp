const axios = require('axios');
const OSRM_URL = process.env.OSRM_URL || 'http://router.project-osrm.org';

async function getRouteETA(originLng, originLat, destLng, destLat) {
    const coords = `${originLng},${originLat};${destLng},${destLat}`;
    const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=false`;
    const response = await axios.get(url);
    return response.data.routes[0].duration;
}

async function snapToRoad(lat, lng) {
    const url = `${OSRM_URL}/nearest/v1/driving/${lng},${lat}`;
    const response = await axios.get(url);
    return {
        lat: response.data.waypoints[0].location[1],
        lng: response.data.waypoints[0].location[0]
    };
}

module.exports = { getRouteETA, snapToRoad };
