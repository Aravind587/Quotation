import React from 'react';
import categories from '../data/categories.json';
import CategoryCard from '../components/CategoryCard';

export default function CategoriesListPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Browse by Category</h1>
        <p className="text-stone-500 text-lg">
          Choose a space to start configuring products and building your quotation.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}
