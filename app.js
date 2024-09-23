const memberList = document.getElementById('member-list');
const dateFilter = document.getElementById('date-filter');

// Initialize Google Map
let map;
let markers = [];
let polylines = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.774929, lng: -122.419416 },
        zoom: 8
    });
}

// Fetch members from the backend API
async function fetchMembers(date = '') {
    try {
        const response = await fetch(`http://localhost:5000/api/members?date=${date}`);
        const members = await response.json();
        loadMembers(members);
    } catch (error) {
        console.error('Error fetching members:', error);
    }
}

// Display member list and handle member selection
function loadMembers(members) {
    memberList.innerHTML = '';  // Clear existing list
    members.forEach(member => {
        const listItem = document.createElement('li');
        listItem.textContent = member.name;
        listItem.addEventListener('click', () => {
            showMemberLocation(member);
        });
        memberList.appendChild(listItem);
    });
}

// Show the member's location on the map
function showMemberLocation(member) {
    // Clear existing markers and polylines
    clearMap();

    // Add marker for the member's current location
    const marker = new google.maps.Marker({
        position: member.location,
        map: map,
        title: member.name
    });
    markers.push(marker);

    // Center the map to the member's location
    map.setCenter(member.location);

    // Draw route if available
    if (member.route.length > 1) {
        const memberRoute = new google.maps.Polyline({
            path: member.route,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        memberRoute.setMap(map);
        polylines.push(memberRoute);
    }
}

// Clear all markers and polylines from the map
function clearMap() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    polylines.forEach(polyline => polyline.setMap(null));
    polylines = [];
}

// Initialize the map and load member data
window.onload = () => {
    initMap();
    fetchMembers();  // Fetch members on page load

    // Handle date filter change
    dateFilter.addEventListener('change', (event) => {
        const selectedDate = event.target.value;
        fetchMembers(selectedDate);  // Fetch members based on selected date
    });
};
// Connect to the backend via Socket.IO
const socket = io('http://localhost:5000');

// Listen for location updates
socket.on('locationUpdate', function(location) {
    console.log('New location received:', location);

    // Update the map with the new location
    updateMapWithNewLocation(location);

    // Calculate total distance and duration if needed
    updateRouteDetails(location);
});
function updateMapWithNewLocation(location) {
    // Use Google Maps API or another map service to add the location
    // and draw a route
    const newLatLng = new google.maps.LatLng(location.lat, location.lng);
    map.setCenter(newLatLng); // Center the map to the new location

    // Add a marker for the new location
    new google.maps.Marker({
        position: newLatLng,
        map: map,
        title: 'Current Location'
    });

    // Draw route on the map (you can store the previous locations
    // in an array to draw the full route)
}
// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon))/2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

// Example usage to update route details
function updateRouteDetails(newLocation) {
    if (previousLocation) {
        const distance = calculateDistance(previousLocation.lat, previousLocation.lng, newLocation.lat, newLocation.lng);
        totalDistance += distance;
        // Display updated total distance and duration
        document.getElementById('totalDistance').innerText = `Total Distance: ${totalDistance.toFixed(2)} km`;
    }
    previousLocation = newLocation; // Update previous location to the new one
}
let stopStartTime = null;

function trackStopTime(newLocation) {
    if (previousLocation && calculateDistance(previousLocation.lat, previousLocation.lng, newLocation.lat, newLocation.lng) < 0.01) {
        if (!stopStartTime) {
            stopStartTime = new Date();
        } else {
            const now = new Date();
            const stopDuration = (now - stopStartTime) / 60000; // in minutes
            if (stopDuration > 10) {
                console.log('User has stopped for more than 10 minutes');
                // Handle stop time (e.g., show stop time on map, mark red dot)
            }
        }
    } else {
        stopStartTime = null; // Reset stop time if user moves
    }
}
