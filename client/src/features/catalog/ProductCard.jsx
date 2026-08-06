import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { triggerToast } = useToast();

  const tenurePricesMap = product.tenurePrices instanceof Map
    ? Object.fromEntries(product.tenurePrices)
    : product.tenurePrices || {};

  const monthlyPrice = tenurePricesMap['12'] || product.monthlyRent || product.price || 799;
  const initialImage = product.images && product.images.length > 0 && product.images[0]
    ? product.images[0]
    : FALLBACK_IMAGE;

  const [imgSrc, setImgSrc] = useState(initialImage);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      
      {/* Product Image */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.title}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <span className="bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        {product.isFeatured && (
          <span className="absolute top-3 right-3 bg-red-500 text-white font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Top Rated
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating || 4.8}</span>
            <span className="text-slate-400 font-normal">({product.reviewCount || 18} reviews)</span>
          </div>
          <Link to={`/product/${product.id || product._id}`}>
            <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 hover:text-red-500 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {product.description || 'Premium sanitized rental unit with free maintenance.'}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Starts at</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">₹{monthlyPrice}</span>
              <span className="text-[11px] text-slate-500 font-semibold">/mo</span>
            </div>
          </div>

          <button
            onClick={() => {
              addToCart(product, 12);
              triggerToast(`Added "${product.title}" to cart!`);
            }}
            className="bg-slate-100 hover:bg-red-500 hover:text-white text-slate-900 p-2.5 rounded-full transition-all flex items-center justify-center shadow-xs"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
