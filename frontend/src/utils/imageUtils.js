/**
 * Resolve relative or absolute image URLs
 * Converts backend-relative paths to full URLs
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:')) return url; // Base64 images
  
  // Relative path from backend
  return `${API_BASE}${url}`;
}

export function resolveImageUrls(images) {
  if (!Array.isArray(images)) return [];
  return images.map(img => ({
    ...img,
    url: resolveImageUrl(img.url)
  }));
}
