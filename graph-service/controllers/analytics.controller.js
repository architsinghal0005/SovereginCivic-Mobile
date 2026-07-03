// graph-service/controllers/analytics.controller.js
import * as AnalyticsService from '../services/analytics.service.js';

export const getAnalytics = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const data = await AnalyticsService.getClusterAnalytics(parseFloat(lat), parseFloat(lng), parseFloat(radius));
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAnalyticsSummary = async (req, res) => {
    try {
        const metrics = await AnalyticsService.getGlobalMetrics();
        const insights = await AnalyticsService.getOperationalInsights();
        res.status(200).json({ success: true, metrics, insights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHeatmap = async (req, res) => {
    try {
        const data = await AnalyticsService.getHeatmapPoints();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};