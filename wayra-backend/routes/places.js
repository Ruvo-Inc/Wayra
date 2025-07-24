const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Places API proxy endpoints
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAH8nlVZG1eT_gJ2vJ4LVHdUWXzsHGGXVw';

// Places Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { input, types = '(cities)', language = 'en' } = req.query;
    
    if (!input) {
      return res.status(400).json({ error: 'Input parameter is required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: GOOGLE_MAPS_API_KEY,
        types,
        language
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Places autocomplete error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch places',
      details: error.response?.data || error.message 
    });
  }
});

// Place Details endpoint
router.get('/details', async (req, res) => {
  try {
    const { place_id, fields = 'geometry,formatted_address' } = req.query;
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id parameter is required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id,
        key: GOOGLE_MAPS_API_KEY,
        fields
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch place details',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
