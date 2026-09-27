import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import FloatingCartBar from './components/FloatingCartBar';
import Home from './pages/Home';
import CategoriesListPage from './pages/CategoriesListPage';
import CategoryPage from './pages/CategoryPage';
import ProductConfigPage from './pages/ProductConfigPage';
import CartPage from './pages/CartPage';
import QuotationPage from './pages/QuotationPage';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <BrowserRouter>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <FloatingCartBar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<CategoriesListPage />} />
          <Route path="/categories/:categoryId" element={<CategoryPage />} />
          <Route path="/configure/:productId" element={<ProductConfigPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/quotation" element={<QuotationPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
