import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const uploadPapers = (files) => {
  const fd = new FormData();
  files.forEach(f => fd.append('files', f));
  return api.post('/upload/papers', fd);
};

export const getPapers = () => api.get('/upload/papers');
export const clearPapers = () => api.delete('/upload/papers');
export const runAnalysis = () => api.get('/analysis/run');
export const getClusters = () => api.get('/analysis/clusters');
export const getTrends = () => api.get('/analysis/trends');
export const getGaps = () => api.get('/analysis/gaps');
export const getGraph = () => api.get('/graph/');
export const getSuggestions = () => api.get('/insights/suggestions');
export const getSummary = () => api.get('/insights/summary');
