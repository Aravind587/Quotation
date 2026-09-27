import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import categories from '../data/categories.json';
import products from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  const category = categories.find((c) => c.id === categoryId);
  const categoryProducts = products.filter((p) => p.categoryId === categoryId);

  const filtered = categoryProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-3">Category not found</h2>
        <button onClick={() => navigate('/categories')} className="btn-primary">
          Browse All Categories
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/categories')}
        className="btn-ghost mb-6 text-stone-500 hover:text-stone-700"
      >
        <ChevronLeft size={16} /> All Categories
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">{category.name}</h1>
        <p className="text-stone-500 text-lg">{category.description}</p>
      </div>

      {/* Search */}
      {categoryProducts.length > 4 && (
        <div className="relative mb-6 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-field pl-9"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg font-medium">No products found</p>
          <button onClick={() => setSearch('')} className="mt-4 btn-ghost">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
