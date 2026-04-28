import { MenuItem } from '@/types'

export const MENU_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'S001',
    name: 'Paneer Tikka',
    description: 'Cottage cheese marinated in spices and grilled to perfection',
    price: 180,
    category: 'starters',
    available: true,
    imageEmoji: '🧆',
   // imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop'
  },
  {
    id: 'S002',
    name: 'Samosa (2 pcs)',
    description: 'Crispy pastry filled with spiced potatoes and peas',
    price: 40,
    category: 'starters',
    available: true,
    imageEmoji: '🥟',
    //imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'
  },
  {
    id: 'S003',
    name: 'Chicken 65',
    description: 'Spicy deep-fried chicken with curry leaves and green chillies',
    price: 220,
    category: 'starters',
    available: true,
    imageEmoji: '🍗',
    //imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop'
  },
  {
    id: 'S004',
    name: 'Veg Spring Roll',
    description: 'Crispy rolls stuffed with mixed vegetables and served with sweet chilli sauce',
    price: 120,
    category: 'starters',
    available: true,
    imageEmoji: '🌯',
   // imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop'
  },
  // Mains
  {
    id: 'M001',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato-butter gravy, served with naan',
    price: 280,
    category: 'mains',
    available: true,
    imageEmoji: '🍛',
    //imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop'
  },
  {
    id: 'M002',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese cubes in creamy tomato gravy with butter',
    price: 240,
    category: 'mains',
    available: true,
    imageEmoji: '🍲',
    //imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop'
  },
  {
    id: 'M003',
    name: 'Biryani (Chicken)',
    description: 'Fragrant basmati rice layered with spiced chicken, served with raita',
    price: 260,
    category: 'mains',
    available: true,
    imageEmoji: '🍚',
    //imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'
  },
  {
    id: 'M004',
    name: 'Dal Tadka',
    description: 'Yellow lentils tempered with cumin, garlic and ghee, served with rice',
    price: 180,
    category: 'mains',
    available: true,
    imageEmoji: '🥘',
    //imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
  },
  {
    id: 'M005',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry served with fluffy deep-fried bread',
    price: 160,
    category: 'mains',
    available: true,
    imageEmoji: '🫓',
   // imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&h=300&fit=crop'
  },
  {
    id: 'M006',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato, served with sambar and chutney',
    price: 120,
    category: 'mains',
    available: false,
    imageEmoji: '🥞',
    //imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop'
  },
  // Desserts
  {
    id: 'D001',
    name: 'Gulab Jamun (2 pcs)',
    description: 'Soft milk dumplings soaked in rose-flavored sugar syrup',
    price: 60,
    category: 'desserts',
    available: true,
    imageEmoji: '🍡',
    //imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop'
  },
  {
    id: 'D002',
    name: 'Rasmalai (2 pcs)',
    description: 'Cottage cheese patties in sweetened, thickened milk with cardamom',
    price: 80,
    category: 'desserts',
    available: true,
    imageEmoji: '🥛',
    //imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c30a5e3e8?w=400&h=300&fit=crop'
  },
  {
    id: 'D003',
    name: 'Kulfi',
    description: 'Traditional Indian ice cream with pistachios and cardamom',
    price: 70,
    category: 'desserts',
    available: true,
    imageEmoji: '🍦',
    //imageUrl: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&h=300&fit=crop'
  },
  // Drinks
  {
    id: 'DR001',
    name: 'Mango Lassi',
    description: 'Refreshing yogurt-based drink blended with sweet mango pulp',
    price: 80,
    category: 'drinks',
    available: true,
    imageEmoji: '🥭',
    //imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop'
  },
  {
    id: 'DR002',
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea with milk',
    price: 30,
    category: 'drinks',
    available: true,
    imageEmoji: '☕',
    //imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop'
  },
  {
    id: 'DR003',
    name: 'Fresh Lime Soda',
    description: 'Sparkling water with fresh lime and a hint of salt or sugar',
    price: 50,
    category: 'drinks',
    available: true,
    imageEmoji: '🍋',
    //imageUrl: 'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=400&h=300&fit=crop'
  },
  {
    id: 'DR004',
    name: 'Thums Up',
    description: '300ml bottle of India\'s favorite cola',
    price: 40,
    category: 'drinks',
    available: true,
    imageEmoji: '🥤',
    //imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop'
  }
]

export const TAX_RATE = 0.05 // 5% GST
export const DELIVERY_FEE = 40
export const FREE_DELIVERY_THRESHOLD = 500
