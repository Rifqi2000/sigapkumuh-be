const express = require('express');
const cors = require('cors');
const app = express();

const heroRoutes = require('./routes/HeroSectionRoutes');
const filterRoutes = require('./routes/FilterRoutes');
const barchartRoutes = require('./routes/BarChartRoutes');
const donutchartcipRoutes = require('./routes/DonutChartCipRoutes');
const tableCipRoute = require('./routes/TableCIPRoutes');


app.use(cors());
app.use(express.json());

app.use('/api/data', heroRoutes);    
app.use('/api/data', filterRoutes);
app.use('/api/data', barchartRoutes);   
app.use('/api/data', donutchartcipRoutes);
app.use('/api/data', tableCipRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
