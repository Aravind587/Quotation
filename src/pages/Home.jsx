import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Star, Shield, Clock } from 'lucide-react';
import categories from '../data/categories.json';
import CategoryCard from '../components/CategoryCard';
import settings from '../data/settings.json';

const FEATURES = [
  { icon: CheckCircle2, title: 'Instant Pricing',    desc: 'Get accurate price estimates in seconds — no waiting for a sales call.' },
  { icon: Star,         title: 'Quality Tiers',      desc: 'Compare Economy, Standard, Premium & Luxury options side by side.' },
  { icon: Shield,       title: 'No Surprises',       desc: 'All costs clearly itemised — materials, labour, add-ons, and GST.' },
  { icon: Clock,        title: 'Save & Download',    desc: 'Build your quote at your own pace and download it as a PDF.' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block badge bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-5 text-xs px-3 py-1.5">
              ✦ Instant Interior Quotation Tool
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Design Your Dream Home,{' '}
              <span className="gradient-text">Know the Price</span>{' '}
              Instantly
            </h1>
            <p className="text-stone-300 text-lg md:text-xl leading-relaxed mb-8">
              Build a detailed interior quotation for kitchens, wardrobes, living rooms and more.
              Choose quality tiers, customise dimensions, and get a print-ready quote — all in your browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/categories')}
                className="btn-primary text-base px-6 py-3"
              >
                Get a Free Quote <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="btn-secondary text-base px-6 py-3 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white"
              >
                View My Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-stone-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-3">
                  <Icon size={22} className="text-brand-500" />
                </div>
                <h3 className="font-semibold text-stone-800 text-sm">{title}</h3>
                <p className="text-stone-500 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title mb-3">What Are You Designing?</h2>
          <p className="text-stone-500 text-lg max-w-xl mx-auto">
            Select a space to explore products and build your custom quotation.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-brand-500 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Planning?
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Build a complete room-by-room quotation in minutes. Download it as a PDF or share it directly.
          </p>
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-600
                       font-bold text-base hover:bg-brand-50 transition-colors shadow-lg"
          >
            Start Your Quote <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-white text-lg">
              {settings.companyName}
            </p>
            <p className="text-sm mt-1">{settings.companyAddress}</p>
          </div>
          <div className="text-right text-sm space-y-1">
            <p>{settings.companyPhone}</p>
            <p>{settings.companyEmail}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-stone-800 text-xs text-center">
          © {new Date().getFullYear()} {settings.companyName}. All prices are indicative and subject to site survey.
        </div>
      </footer>
    </div>
  );
}
