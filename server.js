const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Stadium zones data
let zones = [
  {id: 1, name: 'North Stand', capacity: 5000, occupancy: 3200},
  {id: 2, name: 'South Stand', capacity: 5000, occupancy: 4500},
  {id: 3, name: 'East Stand', capacity: 4000, occupancy: 2800},
  {id: 4, name: 'West Stand', capacity: 4000, occupancy: 3900},
  {id: 5, name: 'VIP Section', capacity: 1000, occupancy: 750},
  {id: 6, name: 'Corporate Box', capacity: 500, occupancy: 450},
];

// Gates data
let gates = [
  {id: 1, name: 'Gate A', waitTime: 5},
  {id: 2, name: 'Gate B', waitTime: 12},
  {id: 3, name: 'Gate C', waitTime: 8},
  {id: 4, name: 'Gate D', waitTime: 15},
];

// Simulate real time updates every 3 seconds
setInterval(() => {
  // Update crowd
  zones.forEach(zone => {
    let change = Math.floor(Math.random() * 300) - 150;
    zone.occupancy = Math.max(0, Math.min(zone.occupancy + change, zone.capacity));
    
    let percentage = (zone.occupancy / zone.capacity) * 100;
    
    // Send alerts
    if(percentage > 85 && percentage < 87) {
      io.emit('alert', {
        type: 'warning',
        message: `⚠️ ${zone.name} is ${percentage.toFixed(0)}% full - Consider crowd control`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    if(percentage > 95) {
      io.emit('alert', {
        type: 'critical',
        message: `🚨 CRITICAL: ${zone.name} at ${percentage.toFixed(0)}% capacity - Immediate action required!`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });
  
  // Update gates
  gates.forEach(gate => {
    gate.waitTime = Math.max(2, gate.waitTime + Math.floor(Math.random() * 5) - 2);
  });
  
  io.emit('updateCrowd', zones);
  io.emit('updateGates', gates);
}, 3000);

// Client connection
io.on('connection', (socket) => {
  console.log('✅ Dashboard connected');
  socket.emit('updateCrowd', zones);
  socket.emit('updateGates', gates);
});

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`🏟️  StadiumSync running on http://localhost:${PORT}`);
});