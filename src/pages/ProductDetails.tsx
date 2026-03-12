import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, limit, addDoc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { 
  ShoppingCart, 
  Zap, 
  MessageCircle, 
  Star, 
  ShieldCheck, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  User,
  Send
} from 'lucide-react';
import { formatPrice, cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  
  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribeProduct = onSnapshot(doc(db, 'products', id), (docSnap) => {
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(productData);
        
        // Automatically select the lowest price variant
        if (productData.variants && productData.variants.length > 0) {
          const lowestPriceVariant = [...productData.variants].sort((a, b) => a.salePrice - b.salePrice)[0];
          setSelectedVariant(lowestPriceVariant);
        }
      } else {
        console.error("Product not found:", id);
        navigate('/products');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching product:", error);
      setLoading(false);
    });

    // Fetch related products
    let unsubscribeRelated = () => {};
    const fetchRelated = async (categories: string[]) => {
      const qRelated = query(
        collection(db, 'products'), 
        where('categories', 'array-contains-any', categories),
        limit(5)
      );
      unsubscribeRelated = onSnapshot(qRelated, (snapshot) => {
        setRelatedProducts(snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => p.id !== id)
          .slice(0, 4)
        );
      });
    };

    // Fetch reviews
    const qReviews = query(
      collection(db, 'products', id, 'reviews'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });

    // We need to wait for product to get categories for related products
    // This is a bit tricky with onSnapshot. 
    // For now, let's just use the product state in another useEffect or handle it here.
    
    return () => {
      unsubscribeProduct();
      unsubscribeRelated();
      unsubscribeReviews();
      unsubscribeSettings();
    };
  }, [id, navigate]);

  // Handle related products when product changes
  useEffect(() => {
    if (!product || !id || !product.categories || product.categories.length === 0) {
      setRelatedProducts([]);
      return;
    }

    const qRelated = query(
      collection(db, 'products'), 
      where('categories', 'array-contains-any', product.categories),
      limit(5)
    );
    
    const unsubscribeRelated = onSnapshot(qRelated, (snapshot) => {
      setRelatedProducts(snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Product))
        .filter(p => p.id !== id)
        .slice(0, 4)
      );
    });

    return () => unsubscribeRelated();
  }, [product?.categories, id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewName || !reviewText) return;

    setIsSubmittingReview(true);
    try {
      // Add the new review
      await addDoc(collection(db, 'products', id, 'reviews'), {
        customerName: reviewName,
        rating: reviewRating,
        reviewText: reviewText,
        createdAt: serverTimestamp()
      });

      // Update product document with new rating and count for denormalization
      // This helps ProductCard and other list views show correct data
      const newTotalReviews = reviews.length + 1;
      const newTotalStars = reviews.reduce((acc, rev) => acc + rev.rating, 0) + reviewRating;
      const newAverageRating = Number((newTotalStars / newTotalReviews).toFixed(1));

      await updateDoc(doc(db, 'products', id), {
        rating: newAverageRating,
        reviewCount: newTotalReviews
      });

      setReviewName('');
      setReviewText('');
      setReviewRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentRegularPrice = selectedVariant ? selectedVariant.regularPrice : product?.regularPrice;
  const currentSalePrice = selectedVariant ? selectedVariant.salePrice : product?.salePrice;

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : "0";

  if (!product) return null;

  const handleBuyNow = () => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select an option first.');
      return;
    }
    addToCart(product!, selectedVariant);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select an option first.');
      return;
    }
    addToCart(product!, selectedVariant);
  };

  const handleWhatsAppChat = () => {
    const whatsappNumber = settings?.whatsappNumber?.replace(/\D/g, '') || '8801838192595';
    const variantInfo = selectedVariant ? ` (Option: ${selectedVariant.name})` : '';
    const price = selectedVariant ? selectedVariant.salePrice : product?.salePrice;
    const message = `Hello Pixi Marts! I'm interested in: ${product?.title}${variantInfo}\nPrice: ${formatPrice(price || 0)}\nLink: ${window.location.href}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const features = [
    'Instant Digital Delivery',
    'Lifetime Access & Updates',
    'Commercial Usage Rights',
    '24/7 Premium Support',
    'High-Quality Assets',
    'Secure Payment Guarantee'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800"
          >
            {product.image && (
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
            )}
            {currentRegularPrice && currentSalePrice && currentRegularPrice > currentSalePrice && (
              <div className={cn(
                "absolute top-8 left-8 bg-red-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-lg shadow-red-500/20",
                Math.round(((currentRegularPrice - currentSalePrice) / currentRegularPrice) * 100) >= 80 && "animate-discount-glow"
              )}>
                {Math.round(((currentRegularPrice - currentSalePrice) / currentRegularPrice) * 100)}% OFF
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {product.categories.map(cat => (
                <span key={cat} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 mb-4 leading-tight">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-4 gap-x-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-amber-400">
                  <div className="flex gap-0.5 mr-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg = parseFloat(averageRating);
                      return (
                        <Star 
                          key={star} 
                          className={cn(
                            "w-4 h-4",
                            star <= Math.round(avg) ? "text-amber-400 fill-current" : "text-slate-200 dark:text-slate-700"
                          )} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-slate-900 dark:text-slate-50 font-black">
                    {totalReviews > 0 ? averageRating : "No ratings yet"}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                <button 
                  onClick={() => {
                    setActiveTab('reviews');
                    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-slate-500 dark:text-slate-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                </button>
              </div>
              
              <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
              
              <div className="w-full sm:w-auto">
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> In Stock
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                {formatPrice(currentSalePrice || 0)}
              </span>
              {currentRegularPrice && currentSalePrice && currentRegularPrice > currentSalePrice && (
                <span className="text-2xl text-slate-400 dark:text-slate-500 line-through font-bold">{formatPrice(currentRegularPrice)}</span>
              )}
            </div>

            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-10">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Select Variation</label>
                <div className="space-y-3">
                  {product.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className={cn(
                        "flex items-center justify-between px-6 py-4 rounded-2xl cursor-pointer border-2 transition-all",
                        selectedVariant?.id === variant.id
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedVariant?.id === variant.id
                            ? "border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500"
                            : "border-slate-300 dark:border-slate-700"
                        )}>
                          {selectedVariant?.id === variant.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className={cn(
                          "font-bold transition-colors",
                          selectedVariant?.id === variant.id ? "text-indigo-900 dark:text-indigo-100" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {variant.name}
                        </span>
                      </div>
                      <span className={cn(
                        "font-black",
                        selectedVariant?.id === variant.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {formatPrice(variant.salePrice)}
                      </span>
                      <input 
                        type="radio" 
                        name="product-variant" 
                        className="hidden" 
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => setSelectedVariant(variant)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button 
                onClick={handleBuyNow}
                className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95"
              >
                <Zap className="w-6 h-6" /> Buy Now
              </button>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border-2 border-slate-100 dark:border-slate-800 py-5 rounded-[2rem] font-black text-lg hover:border-indigo-600 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <ShoppingCart className="w-6 h-6" /> Add to Cart
              </button>
            </div>

            <button 
              onClick={handleWhatsAppChat}
              className="w-full mt-4 bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" /> Chat on WhatsApp
            </button>

            <div id="product-tabs" className="mt-12 border-t border-slate-100 dark:border-slate-800 pt-8">
              <div className="flex gap-8 mb-8 border-b border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={cn(
                    "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
                    activeTab === 'description' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  Description
                  {activeTab === 'description' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={cn(
                    "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
                    activeTab === 'reviews' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  Reviews ({reviews.length})
                  {activeTab === 'reviews' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
              </div>

              <div className="min-h-[200px]">
                {activeTab === 'description' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {product.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold text-sm">
                          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {/* Review Form */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-6">Write a Review</h3>
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Your Name</label>
                            <input 
                              required
                              type="text"
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium text-slate-900 dark:text-slate-50"
                              placeholder="Enter your name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="p-1 transition-transform active:scale-90"
                                >
                                  <Star className={cn(
                                    "w-8 h-8 transition-colors",
                                    star <= reviewRating ? "text-amber-400 fill-current" : "text-slate-200 dark:text-slate-700"
                                  )} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Your Review</label>
                          <textarea 
                            required
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium resize-none text-slate-900 dark:text-slate-50"
                            placeholder="Share your experience with this product..."
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={isSubmittingReview}
                          className="bg-indigo-600 dark:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                          {isSubmittingReview ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><Send className="w-5 h-5" /> Submit Review</>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-8">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="flex gap-6 pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shrink-0">
                              <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-slate-900 dark:text-slate-50">{review.customerName}</h4>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={cn(
                                      "w-3 h-3",
                                      star <= (review.rating || 5) ? "text-amber-400 fill-current" : "text-slate-200 dark:text-slate-700"
                                    )} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                {review.reviewText}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                          <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400 font-bold">No reviews yet. Be the first to review!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-20 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50">Related Products</h2>
              <button 
                onClick={() => navigate('/products')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
