import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, Users, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { familyTreeService } from '../services/familyTreeService';
import { redirectToSubdomain } from '../utils/subdomain';

const InitialSetup = ({ onSetupComplete }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    familyName: '',
    familyNameFormat: '' // '', 'possessive', 'ji', or 'simple'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [familyUrl, setFamilyUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if form is complete
  const isFormComplete = () => {
    return (
      formData.username.trim().length >= 3 &&
      formData.email.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.password.length >= 6 &&
      formData.confirmPassword.length >= 6 &&
      formData.password === formData.confirmPassword &&
      formData.familyName.trim().length > 0
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.familyName.trim()) {
      newErrors.familyName = 'Family name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(familyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToFamily = (subdomain) => {
    if (!subdomain && familyUrl) {
      // Extract subdomain from familyUrl if not provided
      const urlParts = familyUrl.split('://');
      if (urlParts.length > 1) {
        subdomain = urlParts[1].split('.')[0];
      }
    }
    
    if (subdomain) {
      redirectToSubdomain(subdomain);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // Format the family name based on user selection FOR DISPLAY
      let formattedFamilyName;
      switch (formData.familyNameFormat) {
        case 'possessive':
          formattedFamilyName = `${formData.familyName}'s`;
          break;
        case 'ji':
          formattedFamilyName = `${formData.familyName}ji`;
          break;
        case 'simple':
          formattedFamilyName = `${formData.familyName}`;
          break;
        default:
          // No suffix selected, use simple format
          formattedFamilyName = `${formData.familyName}`;
          break;
      }

      // For subdomain generation, always use the base family name without suffix
      // The database will clean it (remove spaces, special chars, etc.)
      const result = await familyTreeService.createInitialAdmin({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        familyName: formData.familyName.trim(), // Use base name for subdomain
        displayName: formattedFamilyName // Send formatted name for display
      });

      if (result.success) {
        // Show success screen with custom URL
        // Use http for localhost, https for production
        const protocol = window.location.hostname === 'localhost' ? 'http' : 'https';
        const fullUrl = `${protocol}://${result.url}`;
        
        setFamilyUrl(fullUrl);
        setRegistrationSuccess(true);
        
        // Optional: Auto-redirect after 5 seconds
        setTimeout(() => {
          handleGoToFamily(result.subdomain);
        }, 5000);
      } else {
        setErrors({ submit: result.message || 'Setup failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 relative">
        {/* Doodle Pattern Background for Success */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="success-doodle" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              {/* Celebration themed doodles */}
              <path d="M 150,300 L 152,306 L 158,308 L 152,310 L 150,316 L 148,310 L 142,308 L 148,306 Z" fill="#10b981" opacity="0.5"/>
              <path d="M 330,50 L 332,55 L 337,57 L 332,59 L 330,64 L 328,59 L 323,57 L 328,55 Z" fill="#10b981" opacity="0.5"/>
              <path d="M 60,350 L 62,354 L 66,356 L 62,358 L 60,362 L 58,358 L 54,356 L 58,354 Z" fill="#10b981" opacity="0.4"/>
              <circle cx="80" cy="100" r="15" fill="none" stroke="#10b981" strokeWidth="2.5" opacity="0.6" strokeDasharray="2,3"/>
              <circle cx="340" cy="160" r="18" fill="none" stroke="#10b981" strokeWidth="2.5" opacity="0.5" strokeDasharray="2,4"/>
              <path d="M 100,100 C 95,85 75,85 70,100 C 65,85 45,85 40,100 C 40,120 70,135 70,135 C 70,135 100,120 100,100 Z" fill="none" stroke="#10b981" strokeWidth="2.5" opacity="0.5"/>
              <path d="M 280,350 Q 290,340 295,330 Q 300,320 290,315" fill="none" stroke="#10b981" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#success-doodle)"/>
        </svg>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-green-200">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-green-900 mb-2">
                Family Created! 🎉
              </h1>
              <p className="text-green-700">
                Your family tree is ready to go
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-200"
            >
              <p className="text-green-800 font-semibold mb-3 text-center">
                Your Custom Family URL
              </p>
              <div className="flex items-center gap-2 bg-white rounded-lg p-4 border border-green-300">
                <ExternalLink className="w-5 h-5 text-green-600 flex-shrink-0" />
                <code className="flex-1 text-green-700 font-mono text-sm break-all">
                  {familyUrl}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="flex-shrink-0 p-2 hover:bg-green-50 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-green-600" />
                  )}
                </button>
              </div>
              {copied && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600 text-sm text-center mt-2"
                >
                  ✓ URL copied to clipboard!
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">📌 Important:</h3>
                <ul className="text-amber-800 text-sm space-y-1">
                  <li>• Share this URL with your family members</li>
                  <li>• Bookmark it for easy access</li>
                  <li>• Use your credentials to manage the tree</li>
                </ul>
              </div>

              <button
                onClick={handleGoToFamily}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Go to Your Family Tree
              </button>

              <p className="text-center text-green-600 text-sm">
                Redirecting in 5 seconds...
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative">
      {/* Doodle Pattern Background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="register-doodle" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
            {/* Registration themed doodles */}
            <circle cx="80" cy="100" r="15" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.6" strokeDasharray="2,3"/>
            <path d="M 100,100 C 95,85 75,85 70,100 C 65,85 45,85 40,100 C 40,120 70,135 70,135 C 70,135 100,120 100,100 Z" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5"/>
            <path d="M 280,150 Q 290,160 280,170 Q 270,160 280,150" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5"/>
            <path d="M 150,300 L 152,306 L 158,308 L 152,310 L 150,316 L 148,310 L 142,308 L 148,306 Z" fill="#f59e0b" opacity="0.4"/>
            <circle cx="340" cy="160" r="18" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.5" strokeDasharray="2,4"/>
            <path d="M 50,200 Q 100,150 150,180 T 250,160" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
            <path d="M 330,50 L 332,55 L 337,57 L 332,59 L 330,64 L 328,59 L 323,57 L 328,55 Z" fill="#f59e0b" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#register-doodle)"/>
      </svg>
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-amber-200">
          <div className="text-center mb-8">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-amber-900 mb-3">
              Welcome!
            </h1>
            <p className="text-amber-700 text-lg">
              Let's set up your family tree
            </p>
            <p className="text-amber-600 text-sm mt-2">
              Create your admin account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Family Name *
              </label>
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) => setFormData({...formData, familyName: e.target.value})}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  errors.familyName ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                }`}
                placeholder="e.g., Smith, Johnson, Garcia..."
              />
              {errors.familyName && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.familyName}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Family Name Format
              </label>
              <select
                value={formData.familyNameFormat}
                onChange={(e) => setFormData({...formData, familyNameFormat: e.target.value})}
                className="w-full px-4 py-3 border-2 border-amber-300 bg-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Select Suffix</option>
                <option value="possessive">
                  {formData.familyName ? `${formData.familyName}'s` : "Smith's"}
                </option>
                <option value="ji">
                  {formData.familyName ? `${formData.familyName}ji` : "Smithji"}
                </option>
                <option value="simple">
                  {formData.familyName ? `${formData.familyName}` : "Smith"}
                </option>
              </select>
              <p className="text-amber-600 text-xs mt-1">
                Choose how your family name will appear (optional)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Admin Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  errors.username ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                }`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.username}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all pr-12 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                  }`}
                  placeholder="Choose a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </motion.div>

            {errors.submit && (
              <motion.div 
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !isFormComplete()}
              whileHover={isFormComplete() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={isFormComplete() && !isLoading ? { scale: 0.98 } : {}}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                isFormComplete() && !isLoading
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Family Tree
                </div>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-amber-600 text-sm">
              🔒 Your data is secure and private
            </p>
            
            {/* Back to Home Link */}
            <div className="pt-4">
              <a
                href="/"
                className="text-amber-700 hover:text-amber-900 text-sm font-medium hover:underline transition-colors"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InitialSetup;