const { getAllApplications } = require('./_lib/googleSheets');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const applications = await getAllApplications();
    
    // Return debug info
    const debugInfo = {
      totalApplications: applications.length,
      firstApplication: applications[0] || null,
      allColumnNames: applications[0] ? Object.keys(applications[0]) : [],
      sampleData: applications.slice(0, 2)
    };

    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};
