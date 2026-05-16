const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin requests
app.use(cors());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for dashboard
const mockMetrics = {
  current: {
    percentage: 87,
    violations: 12,
    exceptions: 8,
    developers: 25
  },
  lastUpdated: new Date().toISOString(),
  weekTrend: [
    { week: 'Week 1', percentage: 75 },
    { week: 'Week 2', percentage: 78 },
    { week: 'Week 3', percentage: 82 },
    { week: 'Week 4', percentage: 87 }
  ]
};

// API endpoint for metrics
app.get('/api/metrics/compliance', (req, res) => {
  res.json(mockMetrics);
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 Dashboard running at http://localhost:${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api/metrics/compliance`);
  console.log(`⚠️  Using MOCK DATA (not real database yet)`);
});