import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../features/catalog/ProductCard';
import { useCity } from '../context/CityContext';

export const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCity();

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [categoryFilter, setCategoryFilter] = useState(categoryParam);
  const [searchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState('recommended');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProducts({
      category: categoryFilter,
      search: searchQuery,
      sort: sortBy,
      city: selectedCity
    })
      .then((res) => {
        setProducts(res.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryFilter, searchQuery, sortBy, selectedCity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Catalog Title & Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Serviceable in {selectedCity}</span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Explore Rental Catalog</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200">
            {['all', 'furniture', 'appliances', 'packages'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setSearchParams({ category: cat, search: searchQuery });
                }}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  categoryFilter === cat ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-2 rounded-2xl outline-none border border-slate-200"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Rent: Low to High</option>
            <option value="price_desc">Rent: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-white rounded-3xl h-80 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <h3 className="font-extrabold text-slate-900 text-lg">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or category filter to discover available items in {selectedCity}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};

export default CatalogPage;
