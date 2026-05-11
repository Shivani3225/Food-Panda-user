// export const restaurants = [
//   {
//     id: 'r1',
//     name: 'Cellar Door Restaurant',
//     coverImage: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
//     rating: 4.7,
//     totalRatings: '10.2k Ratings',
//     cuisines: ['Pizza', 'Italian', 'Fast Food'],
//     deliveryTime: '25-30 min',
//     distance: '1.8 km',
//     priceForTwo: 400,
//     isVeg: false,

//     offers: ['50% OFF up to ₹120', 'Free delivery above ₹199'],

//     categories: [
//       'Popular',
//       'Chicken Wings',
//       'Pizza',
//       'Burgers',
//       'Combos',
//       'Desserts',
//     ],

//     popularItems: [
//       {
//         id: 'p1',
//         name: '6 Pcs Crispy Chicken Wings',
//         price: 120,
//         image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086',
//         description: 'Extra crispy chicken wings served with spicy dip',
//         isBestSeller: true,
//       },
//       {
//         id: 'p2',
//         name: 'Classic Cheese Pizza',
//         price: 199,
//         image: 'https://images.unsplash.com/photo-1601924582975-87d8d09d2f5f',
//         description: 'Mozzarella cheese pizza with Italian seasoning',
//         isBestSeller: false,
//       },
//       {
//         id: 'p3',
//         name: 'Chicken Burger',
//         price: 149,
//         image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
//         description: 'Grilled chicken patty with lettuce & mayo',
//         isBestSeller: true,
//       },
//     ],

//     menu: [
//       {
//         category: 'Chicken Wings',
//         items: [
//           {
//             id: 'cw1',
//             name: '6 Pcs Chicken Wings',
//             price: 120,
//             image:
//               'https://images.unsplash.com/photo-1606755962773-d324e0a13086',
//             description: 'Crispy wings with spicy coating',
//           },
//           {
//             id: 'cw2',
//             name: '12 Pcs Chicken Wings',
//             price: 220,
//             image:
//               'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec',
//             description: 'Double portion crispy wings',
//           },
//         ],
//       },

//       {
//         category: 'Pizza',
//         items: [
//           {
//             id: 'pz1',
//             name: 'Margherita Pizza',
//             price: 159,
//             image:
//               'https://images.unsplash.com/photo-1601924582975-87d8d09d2f5f',
//             description: 'Classic pizza with fresh mozzarella',
//           },
//           {
//             id: 'pz2',
//             name: 'Pepperoni Pizza',
//             price: 229,
//             image: 'https://images.unsplash.com/photo-1548365328-9f547fb09590',
//             description: 'Loaded pepperoni & cheese',
//           },
//         ],
//       },
//     ],

//     reviews: [
//       {
//         id: 'rev1',
//         user: 'Avi Roy',
//         rating: 5,
//         comment: 'Best wings I have ever had. Must try!',
//         time: '1 day ago',
//       },
//       {
//         id: 'rev2',
//         user: 'Neha Sharma',
//         rating: 4,
//         comment: 'Pizza was cheesy and delicious',
//         time: '3 days ago',
//       },
//     ],
//   },

//   {
//     id: 'r2',
//     name: 'Spice Route Kitchen',
//     coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
//     rating: 4.4,
//     totalRatings: '6.4k Ratings',
//     cuisines: ['North Indian', 'Biryani', 'Kebabs'],
//     deliveryTime: '30-35 min',
//     distance: '2.4 km',
//     priceForTwo: 500,
//     isVeg: false,

//     offers: ['40% OFF up to ₹100', 'Free dessert on orders above ₹399'],

//     categories: [
//       'Popular',
//       'Biryani',
//       'Kebabs',
//       'Curries',
//       'Breads',
//       'Desserts',
//     ],

//     popularItems: [
//       {
//         id: 'srp1',
//         name: 'Hyderabadi Chicken Biryani',
//         price: 259,
//         image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
//         description: 'Aromatic basmati rice with tender chicken',
//         isBestSeller: true,
//       },
//       {
//         id: 'srp2',
//         name: 'Paneer Tikka',
//         price: 219,
//         image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
//         description: 'Char-grilled paneer with spices',
//         isBestSeller: false,
//       },
//       {
//         id: 'srp3',
//         name: 'Butter Chicken',
//         price: 279,
//         image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
//         description: 'Creamy tomato gravy with chicken',
//         isBestSeller: true,
//       },
//     ],

//     menu: [
//       {
//         category: 'Biryani',
//         items: [
//           {
//             id: 'srb1',
//             name: 'Chicken Biryani',
//             price: 259,
//             image:
//               'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
//             description: 'Classic spiced chicken biryani',
//           },
//           {
//             id: 'srb2',
//             name: 'Veg Biryani',
//             price: 219,
//             image:
//               'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
//             description: 'Mixed vegetable biryani',
//           },
//         ],
//       },
//       {
//         category: 'Curries',
//         items: [
//           {
//             id: 'src1',
//             name: 'Butter Chicken',
//             price: 279,
//             image:
//               'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
//             description: 'Rich creamy tomato gravy',
//           },
//           {
//             id: 'src2',
//             name: 'Dal Makhani',
//             price: 199,
//             image:
//               'https://images.unsplash.com/photo-1601050690597-df0568f70950',
//             description: 'Slow-cooked black lentils',
//           },
//         ],
//       },
//     ],

//     reviews: [
//       {
//         id: 'srr1',
//         user: 'Rohit Mehra',
//         rating: 5,
//         comment: 'Biryani was flavorful and portion was great.',
//         time: '2 days ago',
//       },
//       {
//         id: 'srr2',
//         user: 'Aditi Singh',
//         rating: 4,
//         comment: 'Butter chicken was creamy and delicious.',
//         time: '5 days ago',
//       },
//     ],
//   },

//   {
//     id: 'r3',
//     name: 'Green Bowl',
//     coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
//     rating: 4.6,
//     totalRatings: '4.8k Ratings',
//     cuisines: ['Healthy', 'Salads', 'Juices'],
//     deliveryTime: '20-25 min',
//     distance: '1.2 km',
//     priceForTwo: 350,
//     isVeg: true,

//     offers: ['30% OFF up to ₹90', 'Free smoothie on orders above ₹299'],

//     categories: ['Popular', 'Salads', 'Bowls', 'Smoothies', 'Juices', 'Snacks'],

//     popularItems: [
//       {
//         id: 'gbp1',
//         name: 'Avocado Power Bowl',
//         price: 199,
//         image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
//         description: 'Quinoa, avocado, chickpeas, and greens',
//         isBestSeller: true,
//       },
//       {
//         id: 'gbp2',
//         name: 'Berry Blast Smoothie',
//         price: 149,
//         image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e',
//         description: 'Mixed berries with yogurt and honey',
//         isBestSeller: false,
//       },
//       {
//         id: 'gbp3',
//         name: 'Mediterranean Salad',
//         price: 179,
//         image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
//         description: 'Feta, olives, cucumber, and olive oil',
//         isBestSeller: true,
//       },
//     ],

//     menu: [
//       {
//         category: 'Salads',
//         items: [
//           {
//             id: 'gbs1',
//             name: 'Mediterranean Salad',
//             price: 179,
//             image:
//               'https://images.unsplash.com/photo-1540420773420-3366772f4999',
//             description: 'Fresh veggies with feta & olives',
//           },
//           {
//             id: 'gbs2',
//             name: 'Caesar Salad',
//             price: 169,
//             image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
//             description: 'Classic caesar with parmesan',
//           },
//         ],
//       },

//       {
//         category: 'Smoothies',
//         items: [
//           {
//             id: 'gbs3',
//             name: 'Berry Blast Smoothie',
//             price: 149,
//             image:
//               'https://images.unsplash.com/photo-1497534446932-c925b458314e',
//             description: 'Berries, yogurt, and honey',
//           },
//           {
//             id: 'gbs4',
//             name: 'Green Detox Juice',
//             price: 129,
//             image:
//               'https://images.unsplash.com/photo-1497534446932-c925b458314e',
//             description: 'Spinach, apple, and ginger',
//           },
//         ],
//       },
//     ],

//     reviews: [
//       {
//         id: 'rev1',
//         user: 'Avi Roy',
//         rating: 5,
//         comment: 'Best wings I have ever had. Must try!',
//         time: '1 day ago',
//       },
//       {
//         id: 'rev2',
//         user: 'Neha Sharma',
//         rating: 4,
//         comment: 'Pizza was cheesy and delicious',
//         time: '3 days ago',
//       },
//     ],
//   },

//   {
//     id: 'r4',
//     name: 'Ocean Catch',
//     coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
//     rating: 4.5,
//     totalRatings: '3.2k Ratings',
//     cuisines: ['Seafood', 'Continental', 'Grill'],
//     deliveryTime: '35-40 min',
//     distance: '3.1 km',
//     priceForTwo: 650,
//     isVeg: false,

//     offers: ['25% OFF up to ₹150', 'Free delivery above ₹499'],

//     categories: ['Popular', 'Starters', 'Grill', 'Mains', 'Sides'],

//     popularItems: [
//       {
//         id: 'ocp1',
//         name: 'Grilled Salmon',
//         price: 399,
//         image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
//         description: 'Salmon fillet with lemon butter',
//         isBestSeller: true,
//       },
//       {
//         id: 'ocp2',
//         name: 'Prawn Tempura',
//         price: 329,
//         image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
//         description: 'Crispy battered prawns',
//         isBestSeller: false,
//       },
//       {
//         id: 'ocp3',
//         name: 'Fish & Chips',
//         price: 299,
//         image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
//         description: 'Classic fried fish with fries',
//         isBestSeller: true,
//       },
//     ],

//     menu: [
//       {
//         category: 'Starters',
//         items: [
//           {
//             id: 'ocs1',
//             name: 'Prawn Tempura',
//             price: 329,
//             image:
//               'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
//             description: 'Light and crispy prawns',
//           },
//           {
//             id: 'ocs2',
//             name: 'Calamari Rings',
//             price: 279,
//             image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
//             description: 'Fried calamari with dip',
//           },
//         ],
//       },
//       {
//         category: 'Mains',
//         items: [
//           {
//             id: 'ocm1',
//             name: 'Grilled Salmon',
//             price: 399,
//             image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
//             description: 'Served with seasonal veggies',
//           },
//           {
//             id: 'ocm2',
//             name: 'Fish & Chips',
//             price: 299,
//             image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
//             description: 'Golden fried fish and fries',
//           },
//         ],
//       },
//     ],

//     reviews: [
//       {
//         id: 'ocr1',
//         user: 'Vikram Das',
//         rating: 5,
//         comment: 'Fresh seafood and perfectly grilled salmon.',
//         time: '4 days ago',
//       },
//       {
//         id: 'ocr2',
//         user: 'Sneha Rao',
//         rating: 4,
//         comment: 'Crispy tempura and generous portions.',
//         time: '1 week ago',
//       },
//     ],
//   },
// ];
