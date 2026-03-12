import { collection, getDocs, addDoc, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const demoCategories = [
  { name: 'Streaming', icon: '📺' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Design', icon: '🎨' },
  { name: 'Software', icon: '💻' },
  { name: 'Education', icon: '📚' },
  { name: 'Social', icon: '📱' },
];

const demoProducts = [
  {
    title: 'Netflix Premium 1 Month',
    description: 'Ultra HD 4K streaming. 4 screens at a time. Private profile.',
    image: 'https://picsum.photos/seed/netflix/800/800',
    regularPrice: 1200,
    salePrice: 850,
    categories: ['Streaming'],
    featured: true,
    banner: true,
    rating: 4.9,
    reviewCount: 124,
    variants: [
      { id: 'v1', name: '1 Month Shared', regularPrice: 400, salePrice: 250 },
      { id: 'v2', name: '1 Month Private', regularPrice: 1200, salePrice: 850 },
      { id: 'v3', name: '6 Months Private', regularPrice: 6000, salePrice: 4500 },
    ]
  },
  {
    title: 'Spotify Premium',
    description: 'Ad-free music, offline play, unlimited skips. High quality audio.',
    image: 'https://picsum.photos/seed/spotify/800/800',
    regularPrice: 2500,
    salePrice: 1800,
    categories: ['Streaming'],
    featured: true,
    banner: false,
    rating: 4.8,
    reviewCount: 89,
    variants: [
      { id: 's1', name: '1 Month Individual', regularPrice: 300, salePrice: 199 },
      { id: 's2', name: '1 Year Individual', regularPrice: 2500, salePrice: 1800 },
      { id: 's3', name: '1 Year Family', regularPrice: 5000, salePrice: 3500 },
    ]
  },
  {
    title: 'Canva Pro Lifetime',
    description: 'Unlimited premium content, brand kit, magic resize, and more.',
    image: 'https://picsum.photos/seed/canva/800/800',
    regularPrice: 1500,
    salePrice: 999,
    categories: ['Design'],
    featured: false,
    banner: true,
    rating: 4.7,
    reviewCount: 256,
    variants: [
      { id: 'c1', name: 'Personal Account', regularPrice: 1500, salePrice: 999 },
      { id: 'c2', name: 'Team Account (5 Users)', regularPrice: 4000, salePrice: 2499 },
    ]
  },
  {
    title: 'Adobe Creative Cloud 1 Year',
    description: 'All Adobe apps including Photoshop, Illustrator, Premiere Pro.',
    image: 'https://picsum.photos/seed/adobe/800/800',
    regularPrice: 15000,
    salePrice: 12000,
    categories: ['Design', 'Software'],
    featured: true,
    banner: false,
    rating: 4.9,
    reviewCount: 45,
  },
  {
    title: 'PUBG Mobile 660 UC',
    description: 'Instant top-up for PUBG Mobile. Global region supported.',
    image: 'https://picsum.photos/seed/pubg/800/800',
    regularPrice: 950,
    salePrice: 820,
    categories: ['Gaming'],
    featured: false,
    banner: false,
    rating: 4.6,
    reviewCount: 512,
  },
  {
    title: 'Free Fire 1000 Diamonds',
    description: 'Fast diamond top-up for Free Fire. ID login required.',
    image: 'https://picsum.photos/seed/freefire/800/800',
    regularPrice: 800,
    salePrice: 750,
    categories: ['Gaming'],
    featured: true,
    banner: false,
    rating: 4.5,
    reviewCount: 320,
  },
];

const demoReviews = [
  { customerName: 'Ariful Islam', rating: 5, reviewText: 'Excellent service! Got my Netflix account within 10 minutes.' },
  { customerName: 'Sabbir Ahmed', rating: 5, reviewText: 'Very reliable. The Canva Pro lifetime deal is amazing.' },
  { customerName: 'Mehedi Hasan', rating: 4, reviewText: 'Good experience, but the WhatsApp response was a bit slow.' },
];

const demoFAQs = [
  { question: 'How long does delivery take?', answer: 'Most digital products are delivered within 5 to 30 minutes after payment confirmation.' },
  { question: 'Is it safe to buy from Pixi Marts?', answer: 'Yes, we are a trusted platform with thousands of satisfied customers. We provide full warranty for our products.' },
  { question: 'What payment methods do you accept?', answer: 'We currently accept bKash, Nagad, and Rocket for all transactions.' },
];

const defaultSettings = {
  whatsappNumber: '+8801887076101',
  email: 'moneymindryn@gmail.com',
  location: 'mymensingh',
  facebookPage: 'https://facebook.com/piximarts',
  paymentNumber: '01887076101'
};

const generateRandomReviews = (count: number) => {
  const maleNames = ['Ariful Islam', 'Sabbir Ahmed', 'Mehedi Hasan', 'Tanvir Rahman', 'Rakib Hossain', 'Sumon Ali', 'Fahad Khan', 'Jasim Uddin', 'Kamal Pasha', 'Nadim Mahmud', 'Rifat Ahmed', 'Sajid Khan', 'Tarek Aziz', 'Zahid Hasan', 'Anisur Rahman', 'Babul Akter', 'Dalim Hossain', 'Emon Ahmed', 'Faruk Hossain', 'Gias Uddin'];
  const femaleNames = ['Nusrat Jahan', 'Sadia Afrin', 'Mim Akter', 'Sumaiya Islam', 'Farhana Yasmin', 'Jannatul Ferdous', 'Riya Ahmed', 'Tasnim Sultana', 'Lamia Islam', 'Afsana Mimi'];
  const comments = [
    'Excellent service! Got my account within 10 minutes.',
    'Very reliable. Highly recommended!',
    'The best digital shop in Bangladesh.',
    'Amazing experience, very fast delivery.',
    'Trusted seller, I have bought many times.',
    'Great support team, helped me with my login.',
    'Price is very reasonable compared to others.',
    'Fastest delivery I have ever seen.',
    'Everything works perfectly. Thank you!',
    'Satisfied with the purchase. Will buy again.',
    'Genuine products and honest service.',
    'Very helpful and polite behavior.',
    'Smooth transaction, no issues at all.',
    'Instant delivery as promised.',
    'Best place for premium subscriptions.'
  ];

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() < 0.75;
    const name = isMale 
      ? maleNames[Math.floor(Math.random() * maleNames.length)] 
      : femaleNames[Math.floor(Math.random() * femaleNames.length)];
      
    reviews.push({
      customerName: name + ' 🇧🇩',
      rating: Math.random() > 0.2 ? 5 : 4,
      reviewText: comments[Math.floor(Math.random() * comments.length)],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)) // Random past dates
    });
  }
  return reviews;
};

export const seedDatabase = async () => {
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsSnap.exists()) {
      console.log('Seeding database...');
      
      // Seed Categories
      for (const cat of demoCategories) {
        await addDoc(collection(db, 'categories'), cat);
      }

      // Seed Products
      for (const prod of demoProducts) {
        const productRef = await addDoc(collection(db, 'products'), {
          ...prod,
          createdAt: serverTimestamp()
        });

        // Seed 10-15 reviews per product to reach 50-60 total across products
        const productReviews = generateRandomReviews(12);
        for (const rev of productReviews) {
          await addDoc(collection(db, productRef.path, 'reviews'), {
            ...rev,
            createdAt: serverTimestamp() // Use server timestamp for new ones, or the random date
          });
        }
      }

      // Seed Global Reviews (Optional, if needed)
      const globalReviews = generateRandomReviews(20);
      for (const rev of globalReviews) {
        await addDoc(collection(db, 'reviews'), rev);
      }

      // Seed FAQs
      for (const faq of demoFAQs) {
        await addDoc(collection(db, 'faqs'), faq);
      }

      // Seed Settings
      await setDoc(doc(db, 'settings', 'general'), defaultSettings);

      console.log('Database seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
