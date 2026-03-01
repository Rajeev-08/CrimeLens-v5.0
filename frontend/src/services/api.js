// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
});

export const uploadFile = (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    });
};

export const getHotspots = (filters, n_clusters) => {
    return apiClient.post('/hotspots', { ...filters, n_clusters });
};

export const getTimeSeries = (filters) => {
    return apiClient.post('/time-series', filters);
};

export const getSeverityBreakdown = (filters) => {
    return apiClient.post('/severity-breakdown', filters);
};

export const trainModel = (filters) => {
    return apiClient.post('/train-model', filters);
};

// --- New Function ---
export const getSafetyTip = (message, crime_context) => {
    return apiClient.post('/safety-assistant', { message, crime_context });
};

export const getStgatPrediction = (filters) => {
    return apiClient.post('/predict-stgat', filters);
};