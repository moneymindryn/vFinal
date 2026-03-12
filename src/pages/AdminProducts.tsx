import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Product, Category } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Star, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatPrice, cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [banner, setBanner] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [variants, setVariants] = useState<{ id: string; name: string; regularPrice: string; salePrice: string }[]>([]);
  const [freeLink, setFreeLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Custom Review Generation State
  const [generateReviews, setGenerateReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState('10');
  const [positivePercent, setPositivePercent] = useState('90');
  const [avgRating, setAvgRating] = useState('4.8');

  const maleNames = ['Ariful Islam', 'Sabbir Ahmed', 'Mehedi Hasan', 'Tanvir Rahman', 'Rakib Hossain', 'Sumon Ali', 'Fahad Khan', 'Jasim Uddin', 'Kamal Pasha', 'Nadim Mahmud', 'Rifat Ahmed', 'Sajid Khan', 'Tarek Aziz', 'Zahid Hasan', 'Anisur Rahman', 'Babul Akter', 'Dalim Hossain', 'Emon Ahmed', 'Faruk Hossain', 'Gias Uddin', 'Abir Hasan', 'Siam Ahmed', 'Noyon Ali', 'Sujon Mahmud', 'Habib Wahid', 'Imran Hossain', 'Tahsan Khan', 'Arefin Shuvo', 'Mosharraf Karim', 'Chanchal Chowdhury'];
  const femaleNames = ['Nusrat Jahan', 'Sadia Afrin', 'Mim Akter', 'Sumaiya Islam', 'Farhana Yasmin', 'Jannatul Ferdous', 'Riya Ahmed', 'Tasnim Sultana', 'Lamia Islam', 'Afsana Mimi', 'Sultana Razia', 'Tania Ahmed', 'Mitu Akter', 'Sonia Akter', 'Priya Das', 'Anika Tabassum', 'Fariha Islam', 'Nadia Ahmed', 'Sabrina Khan', 'Ishrat Jahan'];
  
  const positivePhrases = [
    'Khub bhalo service, dhonnobad!', 'Fast delivery, product o bhalo.', 'Trusted seller, recommended.',
    'Account peyechi, sob thik ache.', 'Best digital shop in BD.', 'Service khub fast, 5 min e peyechi.',
    'Valo product, dam o kom.', 'Everything works perfectly.', 'Highly recommended for everyone.',
    'Abar kinbo, inshaAllah.', 'Excellent service, thank you!', 'Very fast delivery, product is great.',
    'খুব ভালো সার্ভিস, ধন্যবাদ!', 'অনেক তাড়াতাড়ি ডেলিভারি পেয়েছি।', 'প্রোডাক্টটি অনেক ভালো।',
    'অসাধারণ সার্ভিস, ৫ মিনিটেই পেয়েছি।', 'বিশ্বাসযোগ্য সেলার, সবাই নিতে পারেন।', 'দাম অনুযায়ী অনেক ভালো সার্ভিস।'
  ];

  const neutralPhrases = [
    'Delivery ektu deri hoyeche.', 'Service motamoti bhalo.', 'Thik ache, kintu arektu fast hole bhalo hoto.',
    'Delivery was a bit slow.', 'Service is okay.', 'মোটামুটি ভালো সার্ভিস।', 'ডেলিভারি একটু দেরি হয়েছে।'
  ];

  const generateReviewsData = (count: number, positivePerc: number, targetRating: number) => {
    const generated = [];
    // Randomly pick a male ratio between 60% and 75%
    const maleRatio = (Math.random() * (0.75 - 0.60) + 0.60);
    
    for (let i = 0; i < count; i++) {
      const isPositive = Math.random() * 100 < positivePerc;
      const rating = isPositive ? (Math.random() > 0.3 ? 5 : 4) : (Math.floor(Math.random() * 3) + 1);
      const phrases = isPositive ? positivePhrases : neutralPhrases;
      
      let reviewText = '';
      const targetWords = Math.floor(Math.random() * (40 - 15 + 1)) + 15;
      const phraseCount = Math.max(1, Math.floor(targetWords / 5));
      for (let j = 0; j < phraseCount; j++) {
        reviewText += phrases[Math.floor(Math.random() * phrases.length)] + ' ';
      }

      generated.push({
        customerName: (Math.random() < maleRatio 
          ? maleNames[Math.floor(Math.random() * maleNames.length)] 
          : femaleNames[Math.floor(Math.random() * femaleNames.length)]) + ' 🇧🇩',
        rating,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp()
      });
    }
    return generated;
  };

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setTitle(product.title);
      setDescription(product.description);
      setSelectedCategories(product.categories);
      setFeatured(product.featured);
      setBanner(product.banner);
      setImagePreview(product.image);
      setFreeLink(product.freeLink || '');
      setVariants(product.variants?.map(v => ({ ...v, regularPrice: v.regularPrice.toString(), salePrice: v.salePrice.toString() })) || []);
    } else {
      setEditingProduct(null);
      setTitle('');
      setDescription('');
      setSelectedCategories([]);
      setFeatured(false);
      setBanner(false);
      setImageFile(null);
      setImagePreview('');
      setFreeLink('');
      setVariants([]);
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Increased for better quality
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(compressedBase64);

          // Convert base64 to Blob for storage upload
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              setImageFile(compressedFile);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), name: '', regularPrice: '', salePrice: '' }]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleVariantChange = (id: string, field: 'name' | 'regularPrice' | 'salePrice', value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        try {
          const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
          
          // Increased timeout to 30 seconds and added retry logic
          const uploadPromise = uploadBytes(storageRef, imageFile);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout')), 30000);
          });
          
          const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any;
          imageUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.error("Image upload failed or timed out", uploadError);
          // If it's a timeout, we still have the base64 preview as fallback
          // but we'll try to warn the user if it's too large
          if (imagePreview.length > 800000) { // ~800KB
            alert("Image is too large and upload timed out. Please try a smaller image.");
            setIsSubmitting(false);
            return;
          }
          imageUrl = imagePreview; 
        }
      }

      const processedVariants = variants.length > 0 
        ? variants.map(v => ({ 
            id: v.id, 
            name: v.name, 
            regularPrice: Number(v.regularPrice), 
            salePrice: Number(v.salePrice) 
          })) 
        : null;

      // Calculate main prices from variants if they exist
      let finalRegularPrice = 0;
      let finalSalePrice = 0;

      if (processedVariants && processedVariants.length > 0) {
        // Find variant with lowest sale price
        const lowestSaleVariant = [...processedVariants].sort((a, b) => a.salePrice - b.salePrice)[0];
        finalRegularPrice = lowestSaleVariant.regularPrice;
        finalSalePrice = lowestSaleVariant.salePrice;
      }

      // Calculate reviews data if generating
      let calculatedRating = editingProduct ? Number(editingProduct.rating) : Number((Math.random() * (5 - 4.5) + 4.5).toFixed(1));
      let calculatedReviewCount = editingProduct ? Number(editingProduct.reviewCount) : Math.floor(Math.random() * (500 - 10) + 10);

      let reviewsToCreate: any[] = [];
      if (generateReviews) {
        reviewsToCreate = generateReviewsData(
          Number(reviewCount),
          Number(positivePercent),
          Number(avgRating)
        );
        
        const totalNewStars = reviewsToCreate.reduce((acc, rev) => acc + rev.rating, 0);
        const newCount = reviewsToCreate.length;
        
        if (editingProduct) {
          // If editing, we should ideally fetch existing reviews to be perfect, 
          // but for this "Generate" feature, we'll just add to the current stats
          const currentTotalStars = (Number(editingProduct.rating) || 0) * (Number(editingProduct.reviewCount) || 0);
          calculatedReviewCount = (Number(editingProduct.reviewCount) || 0) + newCount;
          calculatedRating = Number(((currentTotalStars + totalNewStars) / calculatedReviewCount).toFixed(1));
        } else {
          calculatedReviewCount = newCount;
          calculatedRating = Number((totalNewStars / newCount).toFixed(1));
        }
      }

      const productData = {
        title,
        description,
        regularPrice: finalRegularPrice,
        salePrice: finalSalePrice,
        categories: selectedCategories,
        featured,
        banner,
        image: imageUrl,
        variants: processedVariants,
        freeLink: selectedCategories.includes('Free') ? freeLink : null,
        rating: calculatedRating,
        reviewCount: calculatedReviewCount,
        createdAt: editingProduct?.createdAt || serverTimestamp(),
      };

      let productRef;
      if (editingProduct) {
        productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        productRef = docRef;
      }

      // Generate Custom Reviews if requested
      if (generateReviews && reviewsToCreate.length > 0) {
        for (const review of reviewsToCreate) {
          await addDoc(collection(db, productRef.path, 'reviews'), review);
        }
      }

      setIsModalOpen(false);
      setGenerateReviews(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-500">Manage Products</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">Add, edit, or remove products from your store.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors duration-500 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 ml-2" />
        <input 
          type="text"
          placeholder="Search products by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white w-full placeholder:text-slate-400 dark:placeholder:text-slate-600"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-500 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-8 py-6">Product</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6">Price</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        {product.image && (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{product.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {product.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map(cat => (
                        <span key={cat} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md uppercase">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{formatPrice(product.salePrice)}</span>
                      {product.regularPrice > product.salePrice && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 line-through">{formatPrice(product.regularPrice)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-lg", product.featured ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600")}>
                        <Star className="w-4 h-4" />
                      </div>
                      <div className={cn("p-2 rounded-lg", product.banner ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600")}>
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button 
                        onClick={() => setProductToDelete(product)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col transition-colors duration-500"
            >
              <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-500">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Title</label>
                      <input 
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Premium Digital Asset Pack"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        placeholder="Describe your product features and benefits..."
                      />
                    </div>

                    {/* Variants Section */}
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Product Variations</label>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 ml-1">Add options like Size, Color, or License Type with specific prices.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={handleAddVariant}
                          className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600/20 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Variation
                        </button>
                      </div>
                      
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {variants.map((variant, index) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={variant.id} 
                            className="flex gap-3 items-start p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl group/variant transition-colors duration-500"
                          >
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-1">Name</label>
                              <input 
                                type="text"
                                value={variant.name}
                                onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder="e.g. 1 Month License"
                              />
                            </div>
                            <div className="w-24 space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-1">Reg (৳)</label>
                              <input 
                                type="number"
                                value={variant.regularPrice}
                                onChange={(e) => handleVariantChange(variant.id, 'regularPrice', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder="0"
                              />
                            </div>
                            <div className="w-24 space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-1">Sale (৳)</label>
                              <input 
                                type="number"
                                value={variant.salePrice}
                                onChange={(e) => handleVariantChange(variant.id, 'salePrice', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder="0"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveVariant(variant.id)}
                              className="mt-8 p-3 text-slate-400 dark:text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                        {variants.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">No variations added yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Media & Categories */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Image</label>
                      <div className="relative group">
                        <div className={cn(
                          "w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col items-center justify-center transition-all",
                          !imagePreview && "hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        )}>
                          {imagePreview ? (
                            <>
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">
                                  Change Image
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                              <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">Click to upload image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Categories</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              if (selectedCategories.includes(cat.name)) {
                                setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                              } else {
                                setSelectedCategories([...selectedCategories, cat.name]);
                              }
                            }}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all",
                              selectedCategories.includes(cat.name)
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                          >
                            {cat.name}
                            {selectedCategories.includes(cat.name) && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedCategories.includes('Free') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 ml-1">Product Download/Access Link</label>
                        <input 
                          type="url"
                          required
                          value={freeLink}
                          onChange={(e) => setFreeLink(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-indigo-500/30 rounded-2xl py-4 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="https://example.com/download-link"
                        />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 italic">This link will be provided to users immediately after they click "Get for Free".</p>
                      </motion.div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setFeatured(!featured)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border font-bold transition-all",
                          featured 
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500" 
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                        )}
                      >
                        <Star className={cn("w-5 h-5", featured && "fill-current")} />
                        Featured
                      </button>
                      <button
                        type="button"
                        onClick={() => setBanner(!banner)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border font-bold transition-all",
                          banner 
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" 
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                        )}
                      >
                        <ImageIcon className="w-5 h-5" />
                        Banner
                      </button>
                    </div>

                    {/* Custom Review Generation Section */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <label className="flex items-center gap-3 cursor-pointer group mb-4">
                        <div 
                          onClick={() => setGenerateReviews(!generateReviews)}
                          className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            generateReviews ? "bg-indigo-600 border-indigo-600" : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                          )}
                        >
                          {generateReviews && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Generate Custom Reviews</span>
                      </label>

                      <AnimatePresence>
                        {generateReviews && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">How Many?</label>
                                <input 
                                  type="number"
                                  value={reviewCount}
                                  onChange={(e) => setReviewCount(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Positive %</label>
                                <input 
                                  type="number"
                                  value={positivePercent}
                                  onChange={(e) => setPositivePercent(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Avg Rate (1-5)</label>
                                <input 
                                  type="number"
                                  step="0.1"
                                  value={avgRating}
                                  onChange={(e) => setAvgRating(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">
                              * Reviews will be generated with random Bangladeshi names and a mix of Bangla/English/Banglish.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-2xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Product'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-8 text-center transition-colors duration-500"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-500">Delete Product?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 transition-colors duration-500">Are you sure you want to delete "{productToDelete.title}"? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
