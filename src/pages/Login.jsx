import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  User as FiUser,
  Lock as FiLock,
  Eye as FiEye,
  EyeOff as FiEyeOff,
  Mail as FiMail,
  AlertCircle as FiAlertCircle,
  Check as FiCheck,
  ChevronRight as FiChevronRight,
  Shield as FiShield,
  Activity as FiActivity,
  TrendingUp as FiTrendingUp,
  Users as FiUsers,
  ArrowRight as FiArrowRight,
  ArrowLeft as FiArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import osolLogo from '../assets/osol-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Floating shapes animation - responsive sizes
  const floatingShapes = [
    { size: { mobile: 150, desktop: 300 }, duration: 25, delay: 0, initialX: 10, initialY: 10 },
    { size: { mobile: 100, desktop: 200 }, duration: 30, delay: 5, initialX: 80, initialY: 60 },
    { size: { mobile: 125, desktop: 250 }, duration: 35, delay: 10, initialX: 50, initialY: 80 },
    { size: { mobile: 75, desktop: 150 }, duration: 20, delay: 15, initialX: 20, initialY: 50 },
    { size: { mobile: 90, desktop: 180 }, duration: 28, delay: 8, initialX: 70, initialY: 20 },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('login.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('login.errors.passwordLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setLoginError('');
    
    try {
      const { data, error } = await signIn({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        setLoginError(error.message || t('login.errors.invalidCredentials'));
      } else {
        setSuccessMessage(t('login.success.loginSuccess'));
        
        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberEmail', formData.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setLoginError(t('login.errors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex relative overflow-auto bg-gradient-to-br from-osoul-golden-100 via-white to-osoul-golden-50">
      {/* Language Switcher */}
      <div className={`fixed top-2 sm:top-4 ${isRTL ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} z-20`}>
        <LanguageSwitcher />
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-gradient-to-br from-osoul-golden-200/20 to-osoul-golden-300/20"
            style={{
              width: window.innerWidth < 640 ? shape.size.mobile : shape.size.desktop,
              height: window.innerWidth < 640 ? shape.size.mobile : shape.size.desktop,
              left: `${shape.initialX}%`,
              top: `${shape.initialY}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: shape.duration,
              delay: shape.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm sm:max-w-md my-auto"
        >
          {/* Logo and Welcome */}
          <motion.div 
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-block mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={osolLogo}
                alt="OSOL"
                className="h-12 sm:h-16 w-auto"
              />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-osoul-dark mb-1 sm:mb-2">
              {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-osoul-secondary mb-1 sm:mb-2">
              {isRTL ? 'Welcome Back' : 'مرحباً بعودتك'}
            </h2>
            <p className="text-sm sm:text-base text-osoul-gray-600">
              {isRTL ? 'الحديثة للتمويل | Modern Finance' : 'Modern Finance | الحديثة للتمويل'}
            </p>
          </motion.div>

          {/* Login Form Card */}
          <motion.div
            className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-osoul-gray-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Success Message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="bg-osoul-golden-100 border border-osoul-golden-300 text-osoul-golden-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center text-sm sm:text-base"
                  >
                    <FiCheck className={`${isRTL ? 'ml-2' : 'mr-2'} text-osoul-golden-600`} size={16} />
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center text-sm sm:text-base"
                  >
                    <FiAlertCircle className={`${isRTL ? 'ml-2' : 'mr-2'}`} size={16} />
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-osoul-dark mb-1.5 sm:mb-2">
                  {t('login.email')}
                </label>
                <motion.div 
                  className={`relative ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3 sm:pr-4' : 'left-0 pl-3 sm:pl-4'} flex items-center pointer-events-none`}>
                    <FiMail className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                      focusedField === 'email' ? 'text-osoul-golden-500' : 'text-osoul-gray-400'
                    }`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full ${isRTL ? 'pr-10 sm:pr-12 pl-3 sm:pl-4' : 'pl-10 sm:pl-12 pr-3 sm:pr-4'} py-3 sm:py-4 text-sm sm:text-base border-2 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'email'
                        ? 'border-osoul-golden-500'
                        : 'border-osoul-gray-200 focus:border-osoul-golden-500'
                    } rounded-lg sm:rounded-xl focus:outline-none focus:ring-4 focus:ring-osoul-golden-300/30 transition-all bg-white`}
                    placeholder={t('login.emailPlaceholder')}
                    dir="ltr"
                  />
                </motion.div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-osoul-dark mb-1.5 sm:mb-2">
                  {t('login.password')}
                </label>
                <motion.div 
                  className={`relative ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3 sm:pr-4' : 'left-0 pl-3 sm:pl-4'} flex items-center pointer-events-none`}>
                    <FiLock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                      focusedField === 'password' ? 'text-osoul-golden-500' : 'text-osoul-gray-400'
                    }`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full ${isRTL ? 'pr-10 sm:pr-12 pl-10 sm:pl-12' : 'pl-10 sm:pl-12 pr-10 sm:pr-12'} py-3 sm:py-4 text-sm sm:text-base border-2 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'password'
                        ? 'border-osoul-golden-500'
                        : 'border-osoul-gray-200 focus:border-osoul-golden-500'
                    } rounded-lg sm:rounded-xl focus:outline-none focus:ring-4 focus:ring-osoul-golden-300/30 transition-all bg-white`}
                    placeholder={t('login.passwordPlaceholder')}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3 sm:pl-4' : 'right-0 pr-3 sm:pr-4'} flex items-center`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-osoul-gray-500 hover:text-osoul-golden-500 transition-colors" />
                      ) : (
                        <FiEye className="h-4 w-4 sm:h-5 sm:w-5 text-osoul-gray-500 hover:text-osoul-golden-500 transition-colors" />
                      )}
                    </motion.div>
                  </button>
                </motion.div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <motion.div 
                  className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-osoul-golden-500 focus:ring-osoul-golden-300 border-osoul-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className={`${isRTL ? 'mr-2' : 'ml-2'} block text-sm text-osoul-gray-700 cursor-pointer`}>
                    {t('login.rememberMe')}
                  </label>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-osoul-golden-500 hover:text-osoul-golden-600 font-semibold transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || authLoading}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-osoul-golden-500 to-osoul-golden-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-osoul-golden-600 to-osoul-golden-700"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center justify-center">
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      {isRTL && (
                        <FiArrowLeft className="ml-2 group-hover:-translate-x-1 transition-transform" />
                      )}
                      {t('login.signIn')}
                      {!isRTL && (
                        <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      )}
                    </>
                  )}
                </span>
              </motion.button>

              {/* Demo Credentials */}
              <motion.div 
                className="mt-4 sm:mt-6 p-3 sm:p-4 bg-osoul-golden-50 rounded-lg sm:rounded-xl border border-osoul-golden-300/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs sm:text-sm text-osoul-secondary font-semibold mb-1.5 sm:mb-2">{t('login.demoCredentials')}</p>
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-osoul-gray-700">
                  <p className="break-all"><span className="font-medium">{t('login.admin')}:</span> admin@osol.sa / Password123!</p>
                  <p className="break-all"><span className="font-medium">{t('login.manager')}:</span> manager@osol.sa / Password123!</p>
                  <p className="break-all"><span className="font-medium">{t('login.officer')}:</span> officer1@osol.sa / Password123!</p>
                </div>
              </motion.div>
            </form>
          </motion.div>

          {/* Sign Up Link */}
          <motion.p 
            className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-osoul-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('login.dontHaveAccount')}{' '}
            <Link to="/signup" className="font-semibold text-osoul-golden-500 hover:text-osoul-golden-600 transition-colors">
              {t('login.signUp')}
            </Link>
          </motion.p>

          {/* Bottom Decoration */}
          <motion.div 
            className="mt-6 sm:mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-xs text-osoul-gray-500">
              {t('login.copyright')}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Feature Highlights - Responsive positioning */}
      <motion.div 
        className={`fixed bottom-4 sm:bottom-6 lg:bottom-8 ${isRTL ? 'left-4 sm:left-6 lg:left-8' : 'right-4 sm:right-6 lg:right-8'} flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4`}
        initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {[
          { icon: FiShield, text: t('login.secure') },
          { icon: FiActivity, text: t('login.realtime') },
          { icon: FiTrendingUp, text: t('login.analytics') },
        ].map((feature, index) => (
          <motion.div
            key={index}
            className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1.5 sm:space-x-2' : 'space-x-1.5 sm:space-x-2'} bg-white/80 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <feature.icon className="text-osoul-golden-500" size={14} />
            <span className="text-xs sm:text-sm font-medium text-osoul-dark">{feature.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Login;