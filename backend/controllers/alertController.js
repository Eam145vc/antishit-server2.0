// controllers/alertController.js
const mongoose = require('mongoose');
const Alert = require('../models/Alert');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    // Get limit from query or default to 20
    const limit = parseInt(req.query.limit) || 20;
    
    // Get optional filters
    const severityFilter = req.query.severity ? { severity: req.query.severity } : {};
    const typeFilter = req.query.type ? { type: req.query.type } : {};
    
    // Combinar todos los filtros
    const combinedFilter = {
      ...severityFilter,
      ...typeFilter
    };
    
    // Query alerts with pagination and sorting
    const alerts = await Alert.find(combinedFilter)
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get alert by ID
// @route   GET /api/alerts/:id
// @access  Private
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new alert
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res) => {
  try {
    const { 
      type, 
      playerId, 
      activisionId, 
      channelId, 
      message, 
      details, 
      severity,
      deviceId,
      trustLevel
    } = req.body;
    
    // Validate required fields
    if (!type || !message || !severity) {
      return res.status(400).json({ message: 'Campos requeridos faltantes' });
    }
    
    const alert = await Alert.create({
      type,
      playerId,
      activisionId,
      channelId,
      message,
      details,
      severity,
      deviceId,
      trustLevel,
      timestamp: new Date()
    });
    
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  createAlert
};
