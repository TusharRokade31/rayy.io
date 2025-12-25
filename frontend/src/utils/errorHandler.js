/**
 * Utility function to extract error messages from API responses
 * Handles FastAPI validation errors (arrays), string errors, and object errors
 */
export const getErrorMessage = (error, fallbackMessage = 'An error occurred') => {
  // No response data
  if (!error.response?.data) {
    return error.message || fallbackMessage;
  }
  
  const detail = error.response.data.detail;
  
  // FastAPI validation errors - array of error objects
  if (Array.isArray(detail)) {
    return detail.map(err => {
      if (typeof err === 'string') return err;
      return err.msg || err.message || JSON.stringify(err);
    }).join('; ');
  }
  
  // String error
  if (typeof detail === 'string') {
    return detail;
  }
  
  // Object error
  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  
  return fallbackMessage;
};
