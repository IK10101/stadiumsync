const socket = io(window.location.origin, {
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

// Chart setup
const ctx = document.getElementById('occupancyChart').getContext('2d');
let occupancyData = [];
let timeLabels = [];

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      label: 'Average Occupancy %',
      data: occupancyData,
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#fff' }
      },
      x: {
        ticks: { color: '#fff' }
      }
    }
  }
});

// Render zones
function renderZones(zones) {
  const map = document.getElementById('stadium-map');
  map.innerHTML = '';
  
  let totalOccupancy = 0;
  let totalCapacity = 0;
  
  zones.forEach(zone => {
    let percentage = (zone.occupancy / zone.capacity) * 100;
    let statusClass = percentage > 85 ? 'zone-critical' : 
                     percentage > 60 ? 'zone-warning' : 'zone-safe';
    
    totalOccupancy += zone.occupancy;
    totalCapacity += zone.capacity;
    
    map.innerHTML += `
      <div class="zone ${statusClass}">
        <h5>${zone.name}</h5>
        <p style="font-size: 1.5rem; font-weight: bold;">${percentage.toFixed(0)}%</p>
        <p style="font-size: 0.9rem;">${zone.occupancy} / ${zone.capacity}</p>
        <small>${percentage > 85 ? '🚨 Critical' : percentage > 60 ? '⚠️ Busy' : '✅ Normal'}</small>
      </div>
    `;
  });
  
  // Update stats
  document.getElementById('current-occupancy').textContent = totalOccupancy.toLocaleString();
  
  // Update chart
  let avgPercentage = (totalOccupancy / totalCapacity) * 100;
  if(occupancyData.length > 20) {
    occupancyData.shift();
    timeLabels.shift();
  }
  occupancyData.push(avgPercentage.toFixed(1));
  timeLabels.push(new Date().toLocaleTimeString());
  chart.update();
}

// Render gates
function renderGates(gates) {
  const container = document.getElementById('gates-status');
  container.innerHTML = '';
  
  let totalWait = 0;
  
  gates.forEach(gate => {
    totalWait += gate.waitTime;
    let statusColor = gate.waitTime > 10 ? 'danger' : gate.waitTime > 5 ? 'warning' : 'success';
    
    container.innerHTML += `
      <div class="col-6 col-md-3 mb-2">
        <div class="gate-card">
          <h6>${gate.name}</h6>
          <h4 class="text-${statusColor}">${gate.waitTime} min</h4>
          <small>${gate.waitTime > 10 ? '🔴 High' : '🟢 Normal'}</small>
        </div>
      </div>
    `;
  });
  
  document.getElementById('avg-wait').textContent = (totalWait / gates.length).toFixed(1) + ' min';
}

// Handle alerts
socket.on('alert', (alert) => {
  const container = document.getElementById('alerts-container');
  
  let alertClass = alert.type === 'critical' ? 'alert-danger' : 'alert-warning';
  
  let alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass} alert-dismissible fade show alert-item m-2`;
  alertDiv.innerHTML = `
    <strong>${alert.timestamp}</strong><br>
    ${alert.message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  container.insertBefore(alertDiv, container.firstChild);
  
  // Auto remove after 15 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 15000);
});

// Update crowd data
socket.on('updateCrowd', (zones) => {
  renderZones(zones);
});

// Update gates data
socket.on('updateGates', (gates) => {
  renderGates(gates);
});

// Connection status
socket.on('connect', () => {
  console.log('✅ Connected to StadiumSync server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Connection debugging
socket.on('connect', () => {
  console.log('✅ Socket connected!');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Disconnected:', reason);
});
