/**
 * Utility function to get dish image path based on dish name
 * 
 * Images are served from backend: /backend/public/images/
 * Available images: biryani, burger, desert, dosa, pasta, pizza, rolls, salad, sushi, tacos
 * 
 * Naming Convention:
 * - All lowercase
 * - No spaces, hyphens, or special characters
 * - Examples:
 *   - 'Chicken Biryani' → biryani.png
 *   - 'Margherita Pizza' → pizza.png
 *   - 'Masala Dosa' → dosa.png
 */

const API_BASE = 'http://localhost:3000';

// Default fallback image
const DEFAULT_IMAGE = `${API_BASE}/images/pizza.png`;

// Available images in backend/public/images
const AVAILABLE_IMAGES = ['biryani', 'burger', 'desert', 'dosa', 'pasta', 'pizza', 'rolls', 'salad', 'sushi', 'tacos'];

// Keyword mapping for dish names to image files
const KEYWORD_MAP = {
  biryani: ['biryani', 'pulao', 'rice'],
  burger: ['burger', 'sandwich'],
  desert: ['dessert', 'desert', 'cake', 'ice cream', 'gulab', 'sweet', 'kheer', 'halwa'],
  dosa: ['dosa', 'idli', 'uttapam', 'vada', 'south indian'],
  pasta: ['pasta', 'noodles', 'chowmein', 'hakka', 'spaghetti', 'macaroni'],
  pizza: ['pizza', 'paneer', 'butter', 'masala', 'tikka', 'curry', 'dal', 'naan', 'roti', 'paratha'],
  rolls: ['roll', 'wrap', 'kathi', 'frankie', 'shawarma', 'kebab'],
  salad: ['salad', 'soup', 'healthy', 'vegan'],
  sushi: ['sushi', 'japanese', 'ramen', 'miso'],
  tacos: ['taco', 'mexican', 'burrito', 'nachos', 'quesadilla']
};

/**
 * Normalizes a dish name to match image filename format
 * @param {string} name - The dish name to normalize
 * @returns {string} - Normalized filename (without extension)
 */
const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Finds the best matching image for a dish name
 * @param {string} dishName - The name of the dish
 * @returns {string} - Image filename (without extension)
 */
const findBestMatch = (dishName) => {
  if (!dishName) return 'pizza';
  
  const lowerName = dishName.toLowerCase();
  
  // Check each keyword mapping
  for (const [image, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return image;
      }
    }
  }
  
  // Check if normalized name directly matches an available image
  const normalized = normalizeName(dishName);
  for (const img of AVAILABLE_IMAGES) {
    if (normalized.includes(img)) {
      return img;
    }
  }
  
  // Default fallback
  return 'pizza';
};

/**
 * Gets the image URL for a dish name (served from backend)
 * @param {string} dishName - The name of the dish
 * @param {string} [extension='png'] - Image file extension (png, jpg, webp)
 * @returns {string} - Full URL to the dish image
 * 
 * @example
 * getDishImage('Chicken Biryani')       // → 'http://localhost:3000/images/biryani.png'
 * getDishImage('Margherita Pizza')      // → 'http://localhost:3000/images/pizza.png'
 * getDishImage('Masala Dosa')           // → 'http://localhost:3000/images/dosa.png'
 * getDishImage('')                      // → 'http://localhost:3000/images/pizza.png'
 */
export const getDishImage = (dishName, extension = 'png') => {
  const imageName = findBestMatch(dishName);
  return `${API_BASE}/images/${imageName}.${extension}`;
};

/**
 * Gets image path with error handling - returns default on image load error
 * Use this with onError handler in img tags
 * @param {Event} event - The error event from img onError
 */
export const handleImageError = (event) => {
  event.target.onerror = null; // Prevent infinite loop
  event.target.src = DEFAULT_IMAGE;
};

/**
 * Creates image props object for easy spreading on img elements
 * @param {string} dishName - The name of the dish
 * @param {string} [alt] - Alt text (defaults to dish name)
 * @returns {object} - Props object with src, alt, and onError
 * 
 * @example
 * <img {...getDishImageProps('Butter Chicken')} />
 */
export const getDishImageProps = (dishName, alt) => {
  return {
    src: getDishImage(dishName),
    alt: alt || dishName || 'Dish image',
    onError: handleImageError,
  };
};

export default getDishImage;
