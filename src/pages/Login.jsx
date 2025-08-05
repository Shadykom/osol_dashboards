import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiUser, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiMail,
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
  FiShield,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiArrowRight
} from 'react-icons/fi';
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

  // Floating shapes animation
  const floatingShapes = [
    { size: 300, duration: 25, delay: 0, initialX: 10, initialY: 10 },
    { size: 200, duration: 30, delay: 5, initialX: 80, initialY: 60 },
    { size: 250, duration: 35, delay: 10, initialX: 50, initialY: 80 },
    { size: 150, duration: 20, delay: 15, initialX: 20, initialY: 50 },
    { size: 180, duration: 28, delay: 8, initialX: 70, initialY: 20 },
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
    <div className="min-h-screen w-full flex relative overflow-hidden bg-gradient-to-br from-osoul-light via-white to-osoul-gray-100">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingShapes.map((shape, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-gradient-to-br from-osoul-primary/10 to-osoul-accent/10"
            style={{
              width: shape.size,
              height: shape.size,
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
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo and Welcome */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-block mb-6 p-4 bg-white rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={osolLogo}
                alt="OSOL"
                className="h-16 w-auto"
              />
            </motion.div>
            <h1 className="text-4xl font-bold text-osoul-dark mb-2">
              {isRTL ? t('login.title') : t('login.welcomeArabic')}
            </h1>
            <h2 className="text-3xl font-bold text-osoul-secondary mb-2">
              {isRTL ? 'Welcome Back' : t('login.title')}
            </h2>
            <p className="text-osoul-gray-600">
              {isRTL ? `${t('login.subtitle')} | Modern Finance` : `الحديثة للتمويل | ${t('login.subtitle')}`}
            </p>
          </motion.div>

          {/* Login Form Card */}
          <motion.div
            className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-osoul-gray-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="bg-osoul-primary/10 border border-osoul-primary/30 text-osoul-dark px-4 py-3 rounded-xl flex items-center"
                  >
                    <FiCheck className={`${isRTL ? 'ml-2' : 'mr-2'} text-osoul-primary`} size={20} />
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
                    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center"
                  >
                    <FiAlertCircle className={`${isRTL ? 'ml-2' : 'mr-2'}`} size={20} />
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-osoul-dark mb-2">
                  {t('login.email')}
                </label>
                <motion.div 
                  className={`relative ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <FiMail className={`h-5 w-5 transition-colors ${
                      focusedField === 'email' ? 'text-osoul-primary' : 'text-osoul-gray-400'
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
                    className={`block w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 border-2 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'email'
                        ? 'border-osoul-primary'
                        : 'border-osoul-gray-200 focus:border-osoul-primary'
                    } rounded-xl focus:outline-none focus:ring-4 focus:ring-osoul-primary/20 transition-all bg-white`}
                    placeholder={t('login.emailPlaceholder')}
                    dir="ltr"
                  />
                </motion.div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-osoul-dark mb-2">
                  {t('login.password')}
                </label>
                <motion.div 
                  className={`relative ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <FiLock className={`h-5 w-5 transition-colors ${
                      focusedField === 'password' ? 'text-osoul-primary' : 'text-osoul-gray-400'
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
                    className={`block w-full ${isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'} py-4 border-2 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'password'
                        ? 'border-osoul-primary'
                        : 'border-osoul-gray-200 focus:border-osoul-primary'
                    } rounded-xl focus:outline-none focus:ring-4 focus:ring-osoul-primary/20 transition-all bg-white`}
                    placeholder={t('login.passwordPlaceholder')}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-osoul-gray-500 hover:text-osoul-primary transition-colors" />
                      ) : (
                        <FiEye className="h-5 w-5 text-osoul-gray-500 hover:text-osoul-primary transition-colors" />
                      )}
                    </motion.div>
                  </button>
                </motion.div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
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
                    className="h-4 w-4 text-osoul-primary focus:ring-osoul-primary/50 border-osoul-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className={`${isRTL ? 'mr-2' : 'ml-2'} block text-sm text-osoul-gray-700 cursor-pointer`}>
                    {t('login.rememberMe')}
                  </label>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-osoul-primary hover:text-osoul-accent font-semibold transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || authLoading}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-osoul-primary to-osoul-accent text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-osoul-accent to-osoul-primary"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center justify-center">
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      {t('login.signIn')}
                      <FiArrowRight className={`${isRTL ? 'mr-2 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1'} transition-transform`} />
                    </>
                  )}
                </span>
              </motion.button>

              {/* Demo Credentials */}
              <motion.div 
                className="mt-6 p-4 bg-osoul-light rounded-xl border border-osoul-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-osoul-secondary font-semibold mb-2">{t('login.demoCredentials')}</p>
                <div className="space-y-1 text-sm text-osoul-gray-700">
                  <p><span className="font-medium">{t('login.admin')}:</span> admin@osol.sa / Password123!</p>
                  <p><span className="font-medium">{t('login.manager')}:</span> manager@osol.sa / Password123!</p>
                  <p><span className="font-medium">{t('login.officer')}:</span> officer1@osol.sa / Password123!</p>
                </div>
              </motion.div>
            </form>
          </motion.div>

          {/* Sign Up Link */}
          <motion.p 
            className="mt-6 text-center text-sm text-osoul-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('login.dontHaveAccount')}{' '}
            <Link to="/signup" className="font-semibold text-osoul-primary hover:text-osoul-accent transition-colors">
              {t('login.signUp')}
            </Link>
          </motion.p>

          {/* Bottom Decoration */}
          <motion.div 
            className="mt-8 text-center"
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

      {/* Feature Highlights - Hidden on mobile */}
      <motion.div 
        className={`hidden lg:flex fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}
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
            className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <feature.icon className="text-osoul-primary" size={16} />
            <span className="text-sm font-medium text-osoul-dark">{feature.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Login;