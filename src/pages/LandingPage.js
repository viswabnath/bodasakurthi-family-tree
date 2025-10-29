import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Lock, Sparkles, ArrowRight, Search, LogIn } from 'lucide-react';

const LandingPage = ({ onAdminLoginClick }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleGetStarted = () => {
    window.location.href = '/register';
  };

  const handleAdminLoginClick = () => {
    if (onAdminLoginClick) {
      onAdminLoginClick();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');
    
    if (!searchInput.trim()) {
      setSearchError('Please enter a family name');
      return;
    }

    // Sanitize input
    const sanitized = searchInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (sanitized.length < 2) {
      setSearchError('Family name must be at least 2 characters');
      return;
    }

    // Navigate to the family subdomain
    window.location.href = `https://${sanitized}.familywall.in`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative">
      {/* Doodle Pattern Background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="landing-doodle" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
            {/* Family themed doodles */}
            <circle cx="80" cy="100" r="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.6" strokeDasharray="2,3"/>
            <path d="M 100,100 C 95,85 75,85 70,100 C 65,85 45,85 40,100 C 40,120 70,135 70,135 C 70,135 100,120 100,100 Z" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5"/>
            <path d="M 280,150 Q 290,160 280,170 Q 270,160 280,150" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5"/>
            <path d="M 150,300 L 152,306 L 158,308 L 152,310 L 150,316 L 148,310 L 142,308 L 148,306 Z" fill="#f59e0b" opacity="0.4"/>
            <circle cx="340" cy="160" r="18" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5" strokeDasharray="2,4"/>
            <path d="M 50,200 Q 100,150 150,180 T 250,160" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
            <path d="M 360,340 L 380,320 L 400,340 M 365,340 L 365,370 L 395,370 L 395,340" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#landing-doodle)"/>
      </svg>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center gap-4">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-amber-900">FamilyWall</span>
            </motion.div>
            
            <div className="flex items-center gap-3 ml-auto">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleAdminLoginClick}
                  type="button"
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline text-sm">Admin Login</span>
                </button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleGetStarted}
                  type="button"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg transition-all cursor-pointer"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden text-sm">Register</span>
                </button>
              </motion.div>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-amber-900 mb-6">
                Preserve Your Family
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  Heritage Forever
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-700 mb-8 max-w-2xl mx-auto">
                Create a beautiful, interactive family tree with your own custom URL. 
                Share your family's story with the world.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                Create Your Family Tree
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="text-amber-900 font-semibold">
                Get your custom URL: <code className="text-orange-600">yourfamily.familywall.in</code>
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search & Access Section */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-amber-900 text-center mb-10">
              Find or Manage Your Family Tree
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Search for existing family */}
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Search Family Tree</h3>
                </div>
                <p className="text-amber-700 mb-4">
                  Looking for a family tree? Search by surname to find and view publicly shared family trees.
                </p>
                <form onSubmit={handleSearchSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setSearchError('');
                    }}
                    placeholder="Enter family surname (e.g., Smith)"
                    className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-300 focus:outline-none"
                  />
                  {searchError && (
                    <p className="text-red-600 text-sm">{searchError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={20} />
                    Search
                  </button>
                </form>
              </motion.div>

              {/* Admin Login */}
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Admin Login</h3>
                </div>
                <p className="text-amber-700 mb-4">
                  Already have a family tree? Click to login with your credentials and manage your tree.
                </p>
                <button
                  onClick={handleAdminLoginClick}
                  type="button"
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={20} />
                  Admin Login
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-amber-900 mb-3">Custom URL</h3>
            <p className="text-amber-700">
              Each family gets their own unique subdomain. Easy to remember and share with relatives.
            </p>
          </motion.div>

          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-amber-900 mb-3">Beautiful Design</h3>
            <p className="text-amber-700">
              Scandinavian-inspired design with interactive family tree visualization and photo support.
            </p>
          </motion.div>

          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-amber-900 mb-3">Secure & Private</h3>
            <p className="text-amber-700">
              Your family data is isolated and secure. Only you can edit, everyone can view.
            </p>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-amber-100 to-orange-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-amber-900 text-center mb-12">
              How It Works
            </h2>
            <div className="space-y-6">
              <motion.div
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Register Your Family</h3>
                  <p className="text-amber-700">
                    Click "Create Your Family Tree" and fill in your family name and admin details.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Get Your Custom URL</h3>
                  <p className="text-amber-700">
                    Receive a unique URL like <code className="text-orange-600 font-mono">smith.familywall.in</code>
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Build Your Tree</h3>
                  <p className="text-amber-700">
                    Add family members, upload photos, and create your beautiful family tree.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Share With Family</h3>
                  <p className="text-amber-700">
                    Share your custom URL with relatives. They can view anytime, anywhere.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl"
              >
                Start Building Your Tree
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="font-semibold text-lg">FamilyWall</span>
            </div>
            
            <div className="text-center text-amber-200">
              <p className="text-sm">
                Preserving family heritage, one tree at a time
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-amber-200">
                Developed with ❤️ by{' '}
                <a 
                  href="https://onemark.co.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white font-semibold hover:text-amber-300 transition-colors underline"
                >
                  onemark.co.in
                </a>
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-amber-700 text-center text-sm text-amber-300">
            <p>&copy; 2025 FamilyWall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
