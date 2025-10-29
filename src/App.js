import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Users, Home, Upload, Heart, Star, LogOut, Save, Check, Lock, User, Camera, AlertCircle, LogIn, Sparkles, Palette, Menu } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { familyTreeService } from './services/familyTreeService';
import InitialSetup from './components/InitialSetup';
import LandingPage from './pages/LandingPage';
import { isRootDomain, getSubdomain, getRootDomainUrl, generateSubdomainUrl } from './utils/subdomain';
const FamilyTreeApp = () => {
  const [scene, setScene] = useState('entry');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [familyNotFound, setFamilyNotFound] = useState(false);
  const [attemptedSubdomain, setAttemptedSubdomain] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [familyData, setFamilyData] = useState({
    surname: '',
    members: []
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [zoom, setZoom] = useState(0.8); // Start with slightly zoomed out
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showSurnameEdit, setShowSurnameEdit] = useState(false);
  const [tempSurname, setTempSurname] = useState('');
  const [tempSurnameFormat, setTempSurnameFormat] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState({
    birthDate: false,
    birthStar: false,
    deathDate: false,
    nicknames: false,
    parent: false
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1, width: 150, height: 150 });
  const [croppedImage, setCroppedImage] = useState(null);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [selectedChildrenToLink, setSelectedChildrenToLink] = useState([]);
  const [childrenToMoveInSwap, setChildrenToMoveInSwap] = useState([]); // For parent-child swap scenario
  const [showAdvancedMarriages, setShowAdvancedMarriages] = useState(false);
  // History management for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);
  
  // Theme system
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [currentDoodlePattern, setCurrentDoodlePattern] = useState('family'); // Doodle pattern selector

  const [formData, setFormData] = useState({
    id: Date.now(),
    fullName: '',
    gender: 'male', // Add gender field
    dateOfBirth: '',
    dateOfDeath: '',
    isLiving: true,
    maritalStatus: 'single',
    spouseName: '', // Keep for backward compatibility
    dateOfMarriage: '', // Keep for backward compatibility
    marriages: [], // New: Array of marriage objects
    children: [],
    birthStar: '',
    nicknames: '',
    parentId: null,
    generation: 0,
    photo: null, // Add photo field
    selectedMarriageForChild: null // For linking child to specific marriage when father has multiple marriages
  });

  // Theme definitions with complete color palettes and canvas patterns
  const themes = {
    classic: {
      name: 'Classic Amber',
      header: 'from-amber-900 via-orange-900 to-amber-900',
      headerBorder: 'border-amber-700',
      headerText: 'text-amber-50',
      background: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
      cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      cardBorder: 'border-amber-200',
      primary: 'from-amber-600 to-orange-600',
      primaryHover: 'from-amber-700 to-orange-700',
      text: 'text-amber-900',
      textLight: 'text-amber-700',
      accent: 'amber',
      connection: '#78350f',
      canvasBg: '#fef3c7',
      canvasPattern: '#fbbf24'
    },
    ocean: {
      name: 'Ocean Blue',
      header: 'from-blue-900 via-cyan-900 to-blue-900',
      headerBorder: 'border-blue-700',
      headerText: 'text-blue-50',
      background: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50',
      cardBg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      cardBorder: 'border-blue-200',
      primary: 'from-blue-600 to-cyan-600',
      primaryHover: 'from-blue-700 to-cyan-700',
      text: 'text-blue-900',
      textLight: 'text-blue-700',
      accent: 'blue',
      connection: '#1e3a8a',
      canvasBg: '#dbeafe',
      canvasPattern: '#3b82f6'
    },
    forest: {
      name: 'Forest Green',
      header: 'from-green-900 via-emerald-900 to-green-900',
      headerBorder: 'border-green-700',
      headerText: 'text-green-50',
      background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
      cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      cardBorder: 'border-green-200',
      primary: 'from-green-600 to-emerald-600',
      primaryHover: 'from-green-700 to-emerald-700',
      text: 'text-green-900',
      textLight: 'text-green-700',
      accent: 'green',
      connection: '#14532d',
      canvasBg: '#d1fae5',
      canvasPattern: '#10b981'
    },
    royal: {
      name: 'Royal Purple',
      header: 'from-purple-900 via-violet-900 to-purple-900',
      headerBorder: 'border-purple-700',
      headerText: 'text-purple-50',
      background: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50',
      cardBg: 'bg-gradient-to-br from-purple-50 to-violet-50',
      cardBorder: 'border-purple-200',
      primary: 'from-purple-600 to-violet-600',
      primaryHover: 'from-purple-700 to-violet-700',
      text: 'text-purple-900',
      textLight: 'text-purple-700',
      accent: 'purple',
      connection: '#581c87',
      canvasBg: '#f3e8ff',
      canvasPattern: '#a855f7'
    },
    sunset: {
      name: 'Sunset Rose',
      header: 'from-rose-900 via-pink-900 to-rose-900',
      headerBorder: 'border-rose-700',
      headerText: 'text-rose-50',
      background: 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50',
      cardBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
      cardBorder: 'border-rose-200',
      primary: 'from-rose-600 to-pink-600',
      primaryHover: 'from-rose-700 to-pink-700',
      text: 'text-rose-900',
      textLight: 'text-rose-700',
      accent: 'rose',
      connection: '#881337',
      canvasBg: '#ffe4e6',
      canvasPattern: '#f43f5e'
    },
    slate: {
      name: 'Modern Slate',
      header: 'from-slate-900 via-gray-900 to-slate-900',
      headerBorder: 'border-slate-700',
      headerText: 'text-slate-50',
      background: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      cardBg: 'bg-gradient-to-br from-slate-50 to-gray-50',
      cardBorder: 'border-slate-200',
      primary: 'from-slate-600 to-gray-600',
      primaryHover: 'from-slate-700 to-gray-700',
      text: 'text-slate-900',
      textLight: 'text-slate-700',
      accent: 'slate',
      connection: '#1e293b',
      canvasBg: '#f1f5f9',
      canvasPattern: '#64748b'
    }
  };

  const theme = themes[currentTheme];

  // Load theme from database when component mounts or family data changes
  useEffect(() => {
    const familyDataStr = sessionStorage.getItem('currentFamilyData');
    if (familyDataStr) {
      try {
        const family = JSON.parse(familyDataStr);
        if (family.theme && themes[family.theme]) {
          setCurrentTheme(family.theme);
        }
      } catch (error) {
        console.error('Error loading family theme:', error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Save theme to database when admin changes it (admin only)
  const handleThemeChange = async (newTheme) => {
    if (!isAdmin) {
      console.warn('Only admin can change theme');
      return;
    }

    setCurrentTheme(newTheme);
    
    try {
      const familyId = familyTreeService.getCurrentFamilyId();
      if (familyId) {
        const result = await familyTreeService.updateFamilyTheme(familyId, newTheme);
        if (result.success) {
          // Update cached family data
          const familyDataStr = sessionStorage.getItem('currentFamilyData');
          if (familyDataStr) {
            const family = JSON.parse(familyDataStr);
            family.theme = newTheme;
            sessionStorage.setItem('currentFamilyData', JSON.stringify(family));
          }
        } else {
          console.error('Failed to save theme:', result.error);
        }
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const subdomain = getSubdomain();
      const isRoot = isRootDomain();
      const currentPath = window.location.pathname;
      
      // Check for existing admin session
      const checkAdminSession = () => {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
          try {
            const { isAdmin, timestamp, subdomain: sessionSubdomain } = JSON.parse(sessionData);
            const currentSubdomain = getSubdomain();
            
            // Session valid for 24 hours and same subdomain
            const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
            const isSameSubdomain = sessionSubdomain === currentSubdomain;
            
            if (isAdmin && !isExpired && isSameSubdomain) {
              setIsAdmin(true);
              return true;
            } else {
              // Clear expired or invalid session
              localStorage.removeItem('adminSession');
            }
          } catch (e) {
            localStorage.removeItem('adminSession');
          }
        }
        return false;
      };
      
      // Root domain - check route
      if (isRoot) {
        if (currentPath === '/register') {
          // Show registration page
          setNeedsInitialSetup(true);
          setCheckingSetup(false);
          document.title = 'Register Your Family - FamilyWall';
          return;
        } else {
          // Show landing page (will be handled separately)
          setCheckingSetup(false);
          document.title = 'FamilyWall - Preserve Your Family Heritage';
          return;
        }
      }
      
      // Check admin session first (and set isAdmin state if valid)
      checkAdminSession();
      
      // Subdomain with /register path - redirect to root
      if (!isRoot && currentPath === '/register') {
        window.location.replace('/');
        return;
      }
      
      // Subdomain - load family tree for this subdomain
      const familyResult = await familyTreeService.getFamilyBySubdomain(subdomain);
      
      if (!familyResult.success) {
        // Family not found - show professional error page
        console.error('Family not found for subdomain:', subdomain);
        setFamilyNotFound(true);
        setAttemptedSubdomain(subdomain);
        setCheckingSetup(false);
        document.title = 'Family Not Found - FamilyWall';
        return;
      }
      
      // Family found - reset the not found flag
      setFamilyNotFound(false);
      
      // Load the family tree data
      const result = await familyTreeService.loadFamilyTree();
      
      if (result.success && result.data) {
        setFamilyData(result.data);
        document.title = `${result.data.surname} - FamilyWall`;
        
        // Data integrity will be checked in separate useEffect
      } else {
        // No family tree exists yet, show empty state with family surname
        const emptyData = {
          surname: familyResult.family.displayName || familyResult.family.surname || 'Family',
          members: []
        };
        setFamilyData(emptyData);
        document.title = `${emptyData.surname} - FamilyWall`;
      }
      
      setCheckingSetup(false);
    };
    
    initializeApp();
    
    // Detect if this is a touch device for better mobile experience  
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
  }, []);

  // Update title when family data changes
  useEffect(() => {
    if (familyData.surname) {
      document.title = `${familyData.surname} Family Tree`;
    }
  }, [familyData.surname]);

  // Handle pending admin login after redirect from homepage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const processPendingLogin = async () => {
      // Check URL query parameters for auth credentials (passed from homepage login)
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      
      if (!authParam) {
        return;
      }
      
      const isRoot = isRootDomain();
      if (isRoot) {
        return;
      }
      
      try {
        // Decode the credentials from URL parameter
        const decodedAuth = JSON.parse(atob(decodeURIComponent(authParam)));
        const { username, password, timestamp } = decodedAuth;
        
        // Check if pending login is fresh (less than 2 minutes old)
        const age = Date.now() - timestamp;
        
        if (age > 2 * 60 * 1000) {
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Process the login
        const result = await familyTreeService.verifyAdminLogin(username, password);
        
        if (result.success) {
          setIsAdmin(true);
          setShowAdminLogin(false);
          setLoginError('');
          
          // Store admin session for future visits
          const subdomain = getSubdomain();
          const sessionData = {
            isAdmin: true,
            timestamp: Date.now(),
            subdomain: subdomain
          };
          localStorage.setItem('adminSession', JSON.stringify(sessionData));
          
          // Clean up URL (remove auth parameter from history)
          window.history.replaceState({}, document.title, window.location.pathname);
          
          showNotification('✅ Successfully logged in as admin', 'success');
        } else {
          console.error('❌ ADMIN LOGIN FAILED:', result.error);
          setLoginError(result.error || 'Login failed');
          setShowAdminLogin(true);
          window.history.replaceState({}, document.title, window.location.pathname);
          showNotification(`❌ ${result.error || 'Login failed'}`, 'error');
        }
      } catch (error) {
        console.error('❌ Error processing pending login:', error);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    processPendingLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data integrity repair function
  const repairFamilyDataIntegrity = useCallback(() => {
    if (!familyData.members || familyData.members.length === 0) return false;
    
    const updatedMembers = familyData.members.map(member => {
      // Find all children who have this member as their parent
      const actualChildren = familyData.members
        .filter(m => m.parentId === member.id)
        .map(m => m.id);
      
      // Check if children array matches actual parent-child relationships
      const currentChildren = member.children || [];
      const missingChildren = actualChildren.filter(childId => !currentChildren.includes(childId));
      
      if (missingChildren.length > 0) {
        return {
          ...member,
          children: [...currentChildren, ...missingChildren]
        };
      }
      
      return member;
    });

    if (JSON.stringify(updatedMembers) !== JSON.stringify(familyData.members)) {
      const repairedData = {
        ...familyData,
        members: updatedMembers
      };
      setFamilyData(repairedData);
      
      // Auto-save the repaired data if admin is logged in
      if (isAdmin) {
        familyTreeService.saveFamilyTree(repairedData);
      }
      
      return true;
    }
    
    return false;
  }, [familyData, isAdmin]);

  // Check data integrity when family data changes
  useEffect(() => {
    if (familyData.members && familyData.members.length > 0) {
      repairFamilyDataIntegrity();
    }
  }, [familyData.members, repairFamilyDataIntegrity]); // Include all dependencies

  const enterHouse = () => {
    setScene('interior');
  };

  const exitHouse = () => {
    setScene('entry');
    setSelectedPerson(null);
  };

  // Handle family search with validation
  const handleFamilySearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a family name');
      return;
    }

    // Sanitize input - remove special characters, convert to lowercase
    const sanitized = searchQuery.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (sanitized.length < 2) {
      setSearchError('Family name must be at least 2 characters');
      return;
    }

    setIsSearching(true);

    // Check if family exists before redirecting
    try {
      const result = await familyTreeService.getFamilyBySubdomain(sanitized);
      
      if (result.success) {
        // Family exists, redirect to it using proper URL generation
        const url = generateSubdomainUrl(sanitized);
        if (url) {
          window.location.href = url;
        } else {
          setSearchError('Unable to generate URL. Please try again.');
          setIsSearching(false);
        }
      } else {
        setSearchError(`Family "${searchQuery}" not found. Please check the name and try again.`);
        setIsSearching(false);
      }
    } catch (error) {
      setSearchError('Unable to search at this time. Please try again later.');
      setIsSearching(false);
    }
  };

  const validateForm = (data = formData) => {
    const errors = {};
    
    // Required field validation
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    // Parent/Mother validation - if father has multiple marriages, mother selection is required
    if (data.parentId) {
      const father = familyData.members.find(m => m.id === data.parentId);
      const fatherMarriages = father ? getMarriages(father) : [];
      
      if (fatherMarriages.length > 1 && data.selectedMarriageForChild === null) {
        errors.selectedMarriageForChild = 'Please select the mother (father has multiple marriages)';
      }
    }
    
    // Parent is no longer required - users can create root members at any time
    
    // Date validation - only if date is provided
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        errors.dateOfBirth = 'Birth date cannot be in the future';
      }
    }
    
    // Death date validation - only if provided
    if (!data.isLiving && data.dateOfDeath) {
      const birthDate = new Date(data.dateOfBirth);
      const deathDate = new Date(data.dateOfDeath);
      
      if (birthDate && deathDate <= birthDate) {
        errors.dateOfDeath = 'Death date must be after birth date';
      }
      
      const today = new Date();
      if (deathDate > today) {
        errors.dateOfDeath = 'Death date cannot be in the future';
      }
    }
    
    // Marriage validation - for married/divorced/widowed persons
    if (data.maritalStatus !== 'single') {
      // Validate simple marriage mode
      if (!showAdvancedMarriages) {
        if (!data.spouseName.trim()) {
          errors.spouseName = 'Spouse name is required';
        }
      } else {
        // Validate advanced marriages mode
        if (data.marriages && data.marriages.length > 0) {
          data.marriages.forEach((marriage, index) => {
            if (!marriage.spouseName || !marriage.spouseName.trim()) {
              errors[`marriage_${index}_spouse`] = `Spouse name is required for marriage ${index + 1}`;
            }
          });
        }
      }
      
      if (!showAdvancedMarriages && data.dateOfMarriage) {
        const birthDate = new Date(data.dateOfBirth);
        const marriageDate = new Date(data.dateOfMarriage);
        
        if (birthDate && marriageDate <= birthDate) {
          errors.dateOfMarriage = 'Marriage date must be after birth date';
        }
      }
    }
    
    // Parent-child age validation - only if both dates provided
    if (data.parentId && data.dateOfBirth) {
      const parent = familyData.members.find(m => m.id === data.parentId);
      if (parent && parent.dateOfBirth) {
        const parentBirthDate = new Date(parent.dateOfBirth);
        const childBirthDate = new Date(data.dateOfBirth);
        
        if (childBirthDate <= parentBirthDate) {
          errors.dateOfBirth = 'Child birth date must be after parent birth date';
        }
        
        // Check minimum parent age (10 years when child is born - historically accurate)
        const parentAgeAtChildBirth = (childBirthDate - parentBirthDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (parentAgeAtChildBirth < 10) {
          errors.dateOfBirth = 'Parent must be at least 10 years old when child is born';
        }
      }
    }
    
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };
  
  // Real-time validation when form data changes
  const updateFormData = (newData) => {
    setFormData(newData);
    validateForm(newData);
  };

  const handleAddPerson = async () => {
    if (!validateForm()) {
      showNotification('Please fix the validation errors before submitting', 'warning', 4000);
      return;
    }
    
    // Process marriage data based on mode
    const processedMarriageData = showAdvancedMarriages ? {
      marriages: formData.marriages || [],
      // Update marital status based on current marriages
      maritalStatus: (() => {
        const currentMarriages = (formData.marriages || []).filter(m => m.status === 'current');
        if (currentMarriages.length > 0) return 'married';
        const divorced = (formData.marriages || []).filter(m => m.status === 'divorced');
        const widowed = (formData.marriages || []).filter(m => m.status === 'widowed');
        if (widowed.length > 0) return 'widowed';
        if (divorced.length > 0) return 'divorced';
        return 'single';
      })(),
      // Keep legacy fields for backward compatibility
      spouseName: (() => {
        const currentMarriage = (formData.marriages || []).find(m => m.status === 'current');
        return currentMarriage ? currentMarriage.spouseName : '';
      })(),
      dateOfMarriage: (() => {
        const currentMarriage = (formData.marriages || []).find(m => m.status === 'current');
        return currentMarriage ? currentMarriage.dateOfMarriage : '';
      })()
    } : {
      marriages: formData.spouseName ? [{
        id: Date.now(),
        spouseName: formData.spouseName,
        status: formData.maritalStatus === 'married' ? 'current' : formData.maritalStatus,
        dateOfMarriage: formData.dateOfMarriage,
        endDate: null,
        children: formData.children || []
      }] : [],
      maritalStatus: formData.maritalStatus,
      spouseName: formData.spouseName,
      dateOfMarriage: formData.dateOfMarriage
    };

    const newPerson = {
      ...formData,
      ...processedMarriageData,
      id: Date.now(),
      children: []
    };

    // Circular relationship detection
    if (formData.parentId && detectCircularRelationship(familyData.members || [], newPerson.id, formData.parentId)) {
      showNotification('❌ Cannot create circular relationship - this would make a person their own ancestor!', 'error', 5000);
      return;
    }

    // Validation warnings (non-blocking)
    const warnings = getValidationWarnings(newPerson, familyData.members || []);
    if (warnings.length > 0) {
      warnings.forEach(warning => showNotification(warning, 'warning', 5000));
    }

    let updatedMembers = (familyData.members || []).map(member => {
      if (member && member.id === formData.parentId) {
        const updatedMember = {
          ...member,
          children: [...(member.children || []), newPerson.id]
        };
        
        // If father has marriages and a specific marriage was selected, add child to that marriage
        if (member.marriages && member.marriages.length > 0) {
          const marriageIndex = formData.selectedMarriageForChild !== null 
            ? formData.selectedMarriageForChild 
            : 0; // Default to first marriage if only one
          
          const updatedMarriages = [...member.marriages];
          if (updatedMarriages[marriageIndex]) {
            updatedMarriages[marriageIndex] = {
              ...updatedMarriages[marriageIndex],
              children: [...(updatedMarriages[marriageIndex].children || []), newPerson.id]
            };
            updatedMember.marriages = updatedMarriages;
          }
        }
        
        return updatedMember;
      }
      return member;
    });

    // Handle children linking for new root members
    if (!formData.parentId && selectedChildrenToLink.length > 0) {
      // This is a new root member with selected children to link
      const allChildrenToLink = new Set(selectedChildrenToLink);
      
      // Find siblings of selected children and add them
      selectedChildrenToLink.forEach(childId => {
        const child = (familyData.members || []).find(m => m && m.id === childId);
        if (child && child.parentId) {
          // Find siblings - members who share the same parent
          const siblings = (familyData.members || []).filter(member =>
            member &&
            member.parentId === child.parentId && 
            member.id !== childId
          );
          
          // Add all siblings to the link list
          siblings.forEach(sibling => allChildrenToLink.add(sibling.id));
        }
      });
      
      // Update the new person with all selected children (including auto-linked siblings)
      newPerson.children = Array.from(allChildrenToLink);
      
      // Update all linked children to have this new root member as their parent
      updatedMembers = updatedMembers.map(member => {
        if (allChildrenToLink.has(member.id)) {
          return {
            ...member,
            parentId: newPerson.id,
            generation: 1 // Children of root are generation 1
          };
        }
        return member;
      });
      
      const autoLinkedCount = allChildrenToLink.size - selectedChildrenToLink.length;
      if (autoLinkedCount > 0) {
        showNotification(
          `✅ ${newPerson.fullName} added! ${autoLinkedCount} sibling(s) automatically linked.`,
          'success',
          4000
        );
      } else if (selectedChildrenToLink.length > 0) {
        showNotification(`✅ ${newPerson.fullName} added with ${selectedChildrenToLink.length} child${selectedChildrenToLink.length > 1 ? 'ren' : ''}`, 'success', 4000);
      } else {
        showNotification(`✅ ${newPerson.fullName} added to family tree`, 'success', 4000);
      }
    } else {
      showNotification(`✅ ${newPerson.fullName} added to family tree`, 'success', 4000);
    }

    let updatedData = {
      ...familyData,
      members: [...updatedMembers, newPerson]
    };

    // Recalculate generations if parent was added/changed
    if (formData.parentId || selectedChildrenToLink.length > 0) {
      updatedData.members = recalculateAllGenerations(updatedData.members);
    }

    // Save to history for undo
    saveToHistory(familyData, `Added ${newPerson.fullName}`);

    setFamilyData(updatedData);
    
    // Refresh selectedPerson if they're the parent or a linked child
    if (selectedPerson) {
      if (selectedPerson.id === formData.parentId) {
        // Parent's view - update to show new child
        const updatedParent = updatedData.members.find(m => m.id === selectedPerson.id);
        if (updatedParent) setSelectedPerson(updatedParent);
      } else if (selectedChildrenToLink.includes(selectedPerson.id)) {
        // Linked child's view - update to show new parent
        const updatedChild = updatedData.members.find(m => m.id === selectedPerson.id);
        if (updatedChild) setSelectedPerson(updatedChild);
      }
    }
    
    setShowAddForm(false);
    setSelectedChildrenToLink([]);
    setChildrenToMoveInSwap([]);
    resetForm();
    
    // Auto-save to database with error handling
    try {
      await saveToDatabase(updatedData);
    } catch (error) {
      // Rollback on error
      setFamilyData(familyData);
      showNotification('❌ Failed to save to database. Changes reverted.', 'error', 5000);
      console.error('Database save error:', error);
    }
  };

  const handleEditPerson = async () => {
    if (!validateForm()) {
      showNotification('Please fix the validation errors before submitting', 'warning', 4000);
      return;
    }
    
    // Circular relationship detection
    if (formData.parentId && formData.parentId !== editingPerson.parentId) {
      if (detectCircularRelationship(familyData.members || [], editingPerson.id, formData.parentId)) {
        showNotification('❌ Cannot create circular relationship - this would make a person their own ancestor!', 'error', 5000);
        return;
      }
    }

    // Process marriage data based on mode for editing
    const processedEditMarriageData = showAdvancedMarriages ? {
      marriages: formData.marriages || [],
      // Update marital status based on current marriages
      maritalStatus: (() => {
        const currentMarriages = (formData.marriages || []).filter(m => m.status === 'current');
        if (currentMarriages.length > 0) return 'married';
        const divorced = (formData.marriages || []).filter(m => m.status === 'divorced');
        const widowed = (formData.marriages || []).filter(m => m.status === 'widowed');
        if (widowed.length > 0) return 'widowed';
        if (divorced.length > 0) return 'divorced';
        return 'single';
      })(),
      // Keep legacy fields for backward compatibility
      spouseName: (() => {
        const currentMarriage = (formData.marriages || []).find(m => m.status === 'current');
        return currentMarriage ? currentMarriage.spouseName : '';
      })(),
      dateOfMarriage: (() => {
        const currentMarriage = (formData.marriages || []).find(m => m.status === 'current');
        return currentMarriage ? currentMarriage.dateOfMarriage : '';
      })()
    } : {
      marriages: formData.spouseName ? [{
        id: Date.now(),
        spouseName: formData.spouseName,
        status: formData.maritalStatus === 'married' ? 'current' : formData.maritalStatus,
        dateOfMarriage: formData.dateOfMarriage,
        endDate: null,
        children: formData.children || []
      }] : [],
      maritalStatus: formData.maritalStatus,
      spouseName: formData.spouseName,
      dateOfMarriage: formData.dateOfMarriage
    };

    // Validation warnings (non-blocking)
    const updatedPerson = { ...formData, ...processedEditMarriageData, id: editingPerson.id };
    const warnings = getValidationWarnings(updatedPerson, familyData.members || []);
    if (warnings.length > 0) {
      warnings.forEach(warning => showNotification(warning, 'warning', 5000));
    }
    
    let updatedMembers = [...familyData.members];
    const wasRoot = isRootMember(editingPerson);
    const willBeRoot = !formData.parentId;
    
    // SCENARIO 1: Root member being changed to have a parent (parent-child swap)
    if (wasRoot && !willBeRoot && formData.parentId) {
      const oldParent = editingPerson; // The current root (e.g., Dorayya)
      const newParentId = formData.parentId;
      const newParent = familyData.members.find(m => m.id === newParentId);
      
      // Get old parent's existing children (excluding the new parent)
      const oldParentChildren = (oldParent.children || []).filter(id => id !== newParentId);
      
      // Determine which children to move to new root vs keep with old parent
      const childrenToMove = childrenToMoveInSwap; // User-selected children to move
      const childrenToKeep = oldParentChildren.filter(id => !childrenToMove.includes(id));
      
      // New parent's children: existing + old parent + selected children to move
      const newParentExistingChildren = newParent?.children || [];
      const allChildrenForNewParent = [...new Set([
        ...newParentExistingChildren,
        oldParent.id,
        ...childrenToMove
      ])];
      
      // Update the old parent (now becomes child, keeps non-moved children)
      updatedMembers = updatedMembers.map(member => {
        if (member.id === editingPerson.id) {
          return { 
            ...formData, 
            id: editingPerson.id,
            parentId: newParentId,
            generation: 1, // Now a child of the new root
            children: childrenToKeep // Keep children that weren't moved
          };
        }
        return member;
      });
      
      // Update the new parent (now becomes root)
      updatedMembers = updatedMembers.map(member => {
        if (member.id === newParentId) {
          return {
            ...member,
            parentId: null,
            generation: 0, // Now root
            children: allChildrenForNewParent
          };
        }
        return member;
      });
      
      // Update children that were moved (become direct children of new root)
      updatedMembers = updatedMembers.map(member => {
        if (childrenToMove.includes(member.id)) {
          return {
            ...member,
            parentId: newParentId,
            generation: 1 // Direct children of new root
          };
        }
        return member;
      });
      
      // Update children that were kept (update their generation to 2 now)
      updatedMembers = updatedMembers.map(member => {
        if (childrenToKeep.includes(member.id)) {
          return {
            ...member,
            parentId: oldParent.id, // Still children of old parent
            generation: 2 // Now grandchildren of new root
          };
        }
        return member;
      });
      
      const movedCount = childrenToMove.length;
      const keptCount = childrenToKeep.length;
      let message = `✅ Family structure reorganized! ${newParent.fullName} is now root.`;
      if (movedCount > 0) {
        message += ` ${movedCount} child(ren) moved to new root.`;
      }
      if (keptCount > 0) {
        message += ` ${keptCount} child(ren) kept with ${oldParent.fullName}.`;
      }
      
      showNotification(message, 'success', 5000);
    }
    // SCENARIO 2: Editing existing root member (staying as root)
    else if (wasRoot && willBeRoot) {
      // Handle children linking for root member
      const currentChildren = editingPerson.children || [];
      const newlyLinkedChildren = selectedChildrenToLink.filter(childId => !currentChildren.includes(childId));
      
      if (newlyLinkedChildren.length > 0) {
        // For each newly linked child, also link all their siblings
        const allChildrenToLink = new Set(selectedChildrenToLink);
        
        newlyLinkedChildren.forEach(childId => {
          const child = familyData.members.find(m => m.id === childId);
          if (child && child.parentId) {
            // Find siblings - members who share the same parent
            const siblings = familyData.members.filter(member =>
              member.parentId === child.parentId && 
              member.id !== childId
            );
            
            // Add all siblings to the link list
            siblings.forEach(sibling => allChildrenToLink.add(sibling.id));
          }
        });
        
        // Update the root member with all selected children (including auto-linked siblings)
        updatedMembers = updatedMembers.map(member => {
          if (member.id === editingPerson.id) {
            return { 
              ...formData, 
              id: editingPerson.id,
              children: Array.from(allChildrenToLink)
            };
          }
          return member;
        });
        
        // Update all linked children to have this root member as their parent
        updatedMembers = updatedMembers.map(member => {
          if (allChildrenToLink.has(member.id)) {
            return {
              ...member,
              parentId: editingPerson.id,
              generation: 1 // Children of root are generation 1
            };
          }
          return member;
        });
        
        // Handle unlinked children (children that were removed from selection)
        const unlinkedChildren = currentChildren.filter(childId => !selectedChildrenToLink.includes(childId));
        if (unlinkedChildren.length > 0) {
          updatedMembers = updatedMembers.map(member => {
            if (unlinkedChildren.includes(member.id)) {
              return {
                ...member,
                parentId: null, // Make them orphans/roots
                generation: 0
              };
            }
            return member;
          });
        }
        
        const autoLinkedCount = allChildrenToLink.size - selectedChildrenToLink.length;
        if (autoLinkedCount > 0) {
          showNotification(
            `✅ ${editingPerson.fullName} updated! ${autoLinkedCount} sibling(s) automatically linked.`,
            'success',
            4000
          );
        } else {
          showNotification(`✅ ${editingPerson.fullName} updated successfully`, 'success', 4000);
        }
      } else {
        // No new children linked, just update the member normally
        updatedMembers = updatedMembers.map(member => 
          member.id === editingPerson.id ? { ...formData, id: editingPerson.id, children: selectedChildrenToLink } : member
        );
        
        // Handle unlinked children
        const currentChildren = editingPerson.children || [];
        const unlinkedChildren = currentChildren.filter(childId => !selectedChildrenToLink.includes(childId));
        if (unlinkedChildren.length > 0) {
          updatedMembers = updatedMembers.map(member => {
            if (unlinkedChildren.includes(member.id)) {
              return {
                ...member,
                parentId: null,
                generation: 0
              };
            }
            return member;
          });
        }
        
        showNotification(`✅ ${editingPerson.fullName} updated successfully`, 'success');
      }
    }
    // SCENARIO 3: Non-root member being changed to root
    else if (!wasRoot && willBeRoot) {
      // Handle children linking
      const allChildrenToLink = new Set(selectedChildrenToLink);
      
      // Update this member to be root with selected children
      updatedMembers = updatedMembers.map(member => {
        if (member.id === editingPerson.id) {
          return {
            ...formData,
            id: editingPerson.id,
            parentId: null,
            generation: 0,
            children: Array.from(allChildrenToLink)
          };
        }
        return member;
      });
      
      // Update all linked children
      updatedMembers = updatedMembers.map(member => {
        if (allChildrenToLink.has(member.id)) {
          return {
            ...member,
            parentId: editingPerson.id,
            generation: 1
          };
        }
        return member;
      });
      
      showNotification(`✅ ${editingPerson.fullName} is now a root member`, 'success', 4000);
    }
    // SCENARIO 4: Regular edit (not involving root changes)
    else {
      // Check if parent has changed
      const parentChanged = editingPerson.parentId !== formData.parentId;
      
      if (parentChanged) {
        // Parent has changed - need to update both old and new parent's children arrays
        const oldParentId = editingPerson.parentId;
        const newParentId = formData.parentId;
        
        // Remove from old parent's children array (both main array and from any marriages)
        if (oldParentId) {
          updatedMembers = updatedMembers.map(member => {
            if (member.id === oldParentId) {
              const updatedMember = {
                ...member,
                children: (member.children || []).filter(id => id !== editingPerson.id)
              };
              
              // Also remove from any marriage's children array
              if (updatedMember.marriages && updatedMember.marriages.length > 0) {
                updatedMember.marriages = updatedMember.marriages.map(marriage => ({
                  ...marriage,
                  children: (marriage.children || []).filter(id => id !== editingPerson.id)
                }));
              }
              
              return updatedMember;
            }
            return member;
          });
        }
        
        // Add to new parent's children array
        if (newParentId) {
          updatedMembers = updatedMembers.map(member => {
            if (member.id === newParentId) {
              const existingChildren = member.children || [];
              if (!existingChildren.includes(editingPerson.id)) {
                const updatedMember = {
                  ...member,
                  children: [...existingChildren, editingPerson.id]
                };
                
                // Determine which marriage to add child to
                let selectedMarriageIdx = formData.selectedMarriageForChild;
                
                // If no marriage selected, auto-detect based on birth dates
                if (selectedMarriageIdx === null && updatedMember.marriages && updatedMember.marriages.length > 0) {
                  const childBirthDate = editingPerson.dateOfBirth ? new Date(editingPerson.dateOfBirth) : null;
                  
                  if (childBirthDate) {
                    // Find the marriage that the child was born into
                    selectedMarriageIdx = updatedMember.marriages.findIndex((marriage, idx) => {
                      const marriageDate = marriage.dateOfMarriage ? new Date(marriage.dateOfMarriage) : null;
                      const nextMarriage = updatedMember.marriages[idx + 1];
                      const nextMarriageDate = nextMarriage?.dateOfMarriage ? new Date(nextMarriage.dateOfMarriage) : null;
                      
                      // Child born after this marriage started
                      if (marriageDate && childBirthDate < marriageDate) return false;
                      
                      // Child born before next marriage
                      if (nextMarriageDate && childBirthDate >= nextMarriageDate) return false;
                      
                      return true;
                    });
                  }
                  
                  // If no marriage found by birth date, use first marriage
                  if (selectedMarriageIdx === -1) {
                    selectedMarriageIdx = 0;
                  }
                }
                
                // Add to the appropriate marriage's children array
                if (selectedMarriageIdx !== null && updatedMember.marriages && updatedMember.marriages[selectedMarriageIdx]) {
                  updatedMember.marriages = updatedMember.marriages.map((marriage, idx) => {
                    if (idx === selectedMarriageIdx) {
                      const marriageChildren = marriage.children || [];
                      if (!marriageChildren.includes(editingPerson.id)) {
                        return {
                          ...marriage,
                          children: [...marriageChildren, editingPerson.id]
                        };
                      }
                    }
                    return marriage;
                  });
                }
                
                return updatedMember;
              }
            }
            return member;
          });
        }
      }
      
      // Update the member itself
      updatedMembers = updatedMembers.map(member => 
        member.id === editingPerson.id ? { ...formData, id: editingPerson.id } : member
      );
      showNotification(`✅ ${editingPerson.fullName} updated successfully`, 'success', 4000);
    }

    let updatedData = {
      ...familyData,
      members: updatedMembers
    };

    // Recalculate generations after any parent/root changes
    updatedData.members = recalculateAllGenerations(updatedData.members);

    // Save to history for undo
    saveToHistory(familyData, `Edited ${editingPerson.fullName}`);

    setFamilyData(updatedData);
    
    // Refresh selectedPerson if they're currently being viewed (keep the modal open with updated data)
    if (selectedPerson && selectedPerson.id === editingPerson.id) {
      const updatedSelectedPerson = updatedData.members.find(m => m.id === editingPerson.id);
      if (updatedSelectedPerson) {
        setSelectedPerson(updatedSelectedPerson);
      }
    } else if (selectedPerson) {
      // If viewing a parent/child of the edited person, refresh their data too
      const updatedSelected = updatedData.members.find(m => m.id === selectedPerson.id);
      if (updatedSelected) {
        setSelectedPerson(updatedSelected);
      }
    }
    
    setShowAddForm(false);
    setEditingPerson(null);
    setSelectedChildrenToLink([]);
    setChildrenToMoveInSwap([]);
    resetForm();
    
    // Auto-save to database with error handling
    try {
      await saveToDatabase(updatedData);
    } catch (error) {
      // Rollback on error
      setFamilyData(familyData);
      showNotification('❌ Failed to save to database. Changes reverted.', 'error', 5000);
      console.error('Database save error:', error);
    }
  };  const handleDeletePerson = async () => {
    if (!personToDelete) return;

    // Remove the person and update any references
    const updatedMembers = familyData.members
      .filter(member => member.id !== personToDelete.id)
      .map(member => ({
        ...member,
        children: member.children.filter(childId => childId !== personToDelete.id),
        parentId: member.parentId === personToDelete.id ? null : member.parentId
      }));

    let updatedData = {
      ...familyData,
      members: updatedMembers
    };

    // Recalculate generations after deletion
    updatedData.members = recalculateAllGenerations(updatedData.members);

    // Save to history for undo
    saveToHistory(familyData, `Deleted ${personToDelete.fullName}`);

    setFamilyData(updatedData);
    setShowAddForm(false);
    setEditingPerson(null);
    setShowDeleteConfirmation(false);
    showNotification(`🗑️ ${personToDelete.fullName} removed from family tree`, 'info', 4000);
    setPersonToDelete(null);
    resetForm();
    
    // Auto-save to database with error handling
    try {
      await saveToDatabase(updatedData);
    } catch (error) {
      // Rollback on error
      setFamilyData(familyData);
      showNotification('❌ Failed to save to database. Changes reverted.', 'error', 5000);
      console.error('Database save error:', error);
    }
  };

  const confirmDelete = (person) => {
    setPersonToDelete(person);
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPersonToDelete(null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('⚠️ Please select an image file', 'error', 4000);
        return;
      }
      
      // Validate file size (max 500KB for small files)
      const MAX_SIZE = 500 * 1024; // 500KB
      if (file.size > MAX_SIZE) {
        showNotification('⚠️ Image must be less than 500KB. Please compress or use a smaller image.', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target.result);
        // Initialize crop with a visible default
        setCrop({
          unit: '%',
          width: 80,
          height: 80,
          x: 10,
          y: 10,
          aspect: 1
        });
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate pixel crop values
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };
    
    // Ensure output is always at least 300x300px for good visibility
    const minSize = 300;
    const outputSize = Math.max(minSize, pixelCrop.width, pixelCrop.height);
    
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    // Fill with white background first
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);
    
    // Calculate scaling to fit image in canvas while maintaining aspect ratio
    const scale = outputSize / Math.max(pixelCrop.width, pixelCrop.height);
    const scaledWidth = pixelCrop.width * scale;
    const scaledHeight = pixelCrop.height * scale;
    const offsetX = (outputSize - scaledWidth) / 2;
    const offsetY = (outputSize - scaledHeight) / 2;
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );
    
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleCropComplete = () => {
    if (imageToCrop && crop.width && crop.height) {
      const img = new Image();
      img.onload = () => {
        const croppedImageUrl = getCroppedImg(img, crop);
        setCroppedImage(croppedImageUrl);
        updateFormData({ ...formData, photo: croppedImageUrl });
        setShowImageCrop(false);
        setImageToCrop(null);
      };
      img.src = imageToCrop;
    }
  };

  const handleSetupComplete = (adminInfo) => {
    setNeedsInitialSetup(false);
    setFamilyNotFound(false); // Reset family not found flag
    setFamilyData({
      surname: adminInfo.familyName,
      members: []
    });
    document.title = `${adminInfo.familyName} Family Tree`;
    
    // Show success message
    showNotification('🎉 Setup completed! You are now logged in as admin', 'success', 5000);
  };

  const resetForm = () => {
    setFormData({
      id: Date.now(),
      fullName: '',
      gender: 'male',
      dateOfBirth: '',
      dateOfDeath: '',
      isLiving: true,
      maritalStatus: 'single',
      spouseName: '',
      dateOfMarriage: '',
      marriages: [],
      children: [],
      birthStar: '',
      nicknames: '',
      parentId: null,
      isAdopted: false,
      generation: 0,
      photo: null,
      selectedMarriageForChild: null
    });
    setFormErrors({});
    setIsFormValid(false);
    setCroppedImage(null);
    setSelectedChildrenToLink([]);
    setChildrenToMoveInSwap([]);
    setShowOptionalFields({
      birthDate: false,
      birthStar: false,
      deathDate: false,
      nicknames: false,
      parent: false
    });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setLoginError('');
    
    // Validate inputs before sending
    if (!adminCredentials.username || adminCredentials.username.trim().length === 0) {
      const errorMsg = 'Please enter your username';
      setLoginError(errorMsg);
      showNotification(`⚠️ ${errorMsg}`, 'error');
      return;
    }
    
    if (!adminCredentials.password || adminCredentials.password.length === 0) {
      const errorMsg = 'Please enter your password';
      setLoginError(errorMsg);
      showNotification(`⚠️ ${errorMsg}`, 'error');
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      // Check if we're on root domain or subdomain
      const currentIsRoot = isRootDomain();
      
      if (currentIsRoot) {
        // On root domain - verify across all families and redirect to subdomain
        const result = await familyTreeService.verifyAdminLoginAndGetFamily(
          adminCredentials.username.trim(), 
          adminCredentials.password
        );
        
        if (!result.success) {
          // Credentials are wrong - don't redirect
          const errorMsg = result.error || 'Invalid username or password';
          setLoginError(errorMsg);
          showNotification(`❌ ${errorMsg}`, 'error');
          setAdminCredentials(prev => ({ ...prev, password: '' }));
          setIsLoggingIn(false);
          return;
        }
        
        // Credentials are valid - get the family subdomain and redirect
        const sanitizedSubdomain = result.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        // Determine the family URL based on environment
        let familyUrl;
        const currentHost = window.location.hostname;
        
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
          // Development environment - use localhost with port
          const port = window.location.port ? `:${window.location.port}` : '';
          familyUrl = `http://${sanitizedSubdomain}.localhost${port}`;
        } else {
          // Production environment - use familywall.in domain
          familyUrl = `https://${sanitizedSubdomain}.familywall.in`;
        }
        
        // Encode credentials in URL to pass across subdomains
        const credentialsParam = btoa(JSON.stringify({
          username: adminCredentials.username.trim(),
          password: adminCredentials.password,
          timestamp: Date.now()
        }));
        
        // Redirect to the family subdomain with credentials in URL
        window.location.href = `${familyUrl}?auth=${encodeURIComponent(credentialsParam)}`;
      } else {
        // On subdomain - verify locally without redirect
        const result = await familyTreeService.verifyAdminLogin(
          adminCredentials.username.trim(), 
          adminCredentials.password
        );
        
        if (!result.success) {
          const errorMsg = result.error || 'Invalid username or password';
          setLoginError(errorMsg);
          showNotification(`❌ ${errorMsg}`, 'error');
          setAdminCredentials(prev => ({ ...prev, password: '' }));
          setIsLoggingIn(false);
          return;
        }
        
        // Login successful on subdomain
        setIsAdmin(true);
        setShowAdminLogin(false);
        setLoginError('');
        
        // Store admin session
        const subdomain = getSubdomain();
        const sessionData = {
          isAdmin: true,
          timestamp: Date.now(),
          subdomain: subdomain
        };
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        
        showNotification('✅ Successfully logged in as admin', 'success');
        setAdminCredentials({ username: '', password: '' });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 'Connection error. Please try again.';
      setLoginError(errorMsg);
      showNotification(`❌ ${errorMsg}`, 'error');
      setAdminCredentials(prev => ({ ...prev, password: '' }));
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    setAdminCredentials({ username: '', password: '' });
    setLoginError('');
    
    // Clear admin session from localStorage
    localStorage.removeItem('adminSession');
    
    // Show logout notification
    showNotification('✅ You have been logged out', 'success');
    
    // Stay on current page (show public view) instead of reloading
    // This gives better UX as user can see the family tree in public mode
  };

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, [removeNotification]);
    const saveToDatabase = useCallback(async (data = familyData) => {
    if (!isAdmin) {
      console.warn('Save attempt by non-admin user');
      showNotification('Only admins can save changes. Please use Admin Login in the header', 'warning');
      return;
    }
    
    showNotification('Saving...', 'info', 1000);
    
    const result = await familyTreeService.saveFamilyTree(data);
    
    if (result.success) {
      showNotification('✅ Saved successfully', 'success');
    } else {
      showNotification(`❌ Save failed: ${result.error || 'Unknown error'}`, 'error');
    }
  }, [familyData, isAdmin, showNotification]);



  const handleSurnameEdit = () => {
    // Extract base family name from current surname (remove various suffixes)
    const currentSurname = familyData.surname;
    let baseName = currentSurname;
    let currentFormat = '';
    
    if (currentSurname.endsWith("'s")) {
      baseName = currentSurname.replace("'s", "");
      currentFormat = 'possessive';
    } else if (currentSurname.endsWith("ji")) {
      baseName = currentSurname.replace("ji", "");
      currentFormat = 'ji';
    } else {
      baseName = currentSurname;
      currentFormat = 'simple';
    }
    
    setTempSurname(baseName);
    setTempSurnameFormat(currentFormat);
    setShowSurnameEdit(true);
  };

  const saveSurname = async () => {
    if (tempSurname.trim()) {
      // Format the surname based on selection
      let formattedSurname;
      switch (tempSurnameFormat) {
        case 'possessive':
          formattedSurname = `${tempSurname.trim()}'s`;
          break;
        case 'ji':
          formattedSurname = `${tempSurname.trim()}ji`;
          break;
        case 'simple':
          formattedSurname = `${tempSurname.trim()}`;
          break;
        default:
          // No suffix selected, use simple format
          formattedSurname = `${tempSurname.trim()}`;
          break;
      }
        
      const updatedData = {
        ...familyData,
        surname: formattedSurname
      };
      setFamilyData(updatedData);
      setShowSurnameEdit(false);
      await saveToDatabase(updatedData);
    }
  };

  const cancelSurnameEdit = () => {
    setTempSurname('');
    setShowSurnameEdit(false);
  };

  // Floating notification system
  // ============================================================================
  // UTILITY FUNCTIONS - Generation, Validation, History
  // ============================================================================

  // Recursive generation recalculation for deep hierarchies
  const recalculateGenerations = useCallback((members, rootId, generation = 0) => {
    const updatedMembers = [...members];
    
    // Find the root member
    const rootMember = updatedMembers.find(m => m.id === rootId);
    if (!rootMember) return updatedMembers;
    
    // Update root's generation
    const rootIndex = updatedMembers.findIndex(m => m.id === rootId);
    updatedMembers[rootIndex] = { ...rootMember, generation };
    
    // Recursively update all children
    const children = rootMember.children || [];
    children.forEach(childId => {
      updatedMembers.forEach((member, index) => {
        if (member.id === childId) {
          updatedMembers[index] = { ...member, generation: generation + 1 };
          // Recursively update this child's descendants
          const updated = recalculateGenerations(updatedMembers, childId, generation + 1);
          updatedMembers.splice(0, updatedMembers.length, ...updated);
        }
      });
    });
    
    return updatedMembers;
  }, []);

  // Recalculate all generations in the tree
  const recalculateAllGenerations = useCallback((members) => {
    let updatedMembers = [...members];
    
    // Find all root members (no parent)
    const roots = updatedMembers.filter(m => !m.parentId);
    
    // Recalculate generations for each root tree
    roots.forEach(root => {
      updatedMembers = recalculateGenerations(updatedMembers, root.id, 0);
    });
    
    return updatedMembers;
  }, [recalculateGenerations]);

  // Detect circular relationships
  const detectCircularRelationship = useCallback((members, childId, parentId) => {
    // Check if parentId is already a descendant of childId
    const isDescendant = (ancestorId, descendantId, visited = new Set()) => {
      if (ancestorId === descendantId) return true;
      if (visited.has(ancestorId)) return false; // Prevent infinite loops
      
      visited.add(ancestorId);
      
      const ancestor = members.find(m => m.id === ancestorId);
      if (!ancestor || !ancestor.children || ancestor.children.length === 0) return false;
      
      // Check all children
      return ancestor.children.some(childId => isDescendant(childId, descendantId, visited));
    };
    
    return isDescendant(childId, parentId);
  }, []);

  // Validation warnings (non-blocking)
  const getValidationWarnings = useCallback((member, members) => {
    const warnings = [];
    
    // Age validation - child born before parent
    if (member.parentId && member.dateOfBirth) {
      const parent = members.find(m => m.id === member.parentId);
      if (parent && parent.dateOfBirth) {
        const childBirth = new Date(member.dateOfBirth);
        const parentBirth = new Date(parent.dateOfBirth);
        const ageDiff = (childBirth - parentBirth) / (1000 * 60 * 60 * 24 * 365); // years
        
        if (ageDiff < 13) {
          warnings.push(`⚠️ Parent was only ${Math.floor(ageDiff)} years old when child was born`);
        }
        if (childBirth < parentBirth) {
          warnings.push('⚠️ Child born before parent');
        }
      }
    }
    
    // Death date before birth date
    if (member.dateOfBirth && member.dateOfDeath) {
      const birth = new Date(member.dateOfBirth);
      const death = new Date(member.dateOfDeath);
      if (death < birth) {
        warnings.push('⚠️ Death date is before birth date');
      }
    }
    
    // Duplicate name warning
    const duplicates = members.filter(m => 
      m.id !== member.id && 
      m.fullName.toLowerCase() === member.fullName.toLowerCase()
    );
    if (duplicates.length > 0) {
      warnings.push(`⚠️ Another member with name "${member.fullName}" already exists`);
    }
    
    // Generation inconsistency
    if (member.parentId) {
      const parent = members.find(m => m.id === member.parentId);
      if (parent && member.generation !== parent.generation + 1) {
        warnings.push(`⚠️ Generation mismatch (Parent: Gen ${parent.generation}, Child: Gen ${member.generation})`);
      }
    }
    
    return warnings;
  }, []);

  // Save state to history for undo
  const saveToHistory = useCallback((data, action) => {
    if (isUndoing) return; // Don't save history during undo operations
    
    const newHistoryEntry = {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      action,
      timestamp: Date.now()
    };
    
    // Remove any history after current index (when user makes new change after undo)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);
    
    // Keep only last 10 entries
    const trimmedHistory = newHistory.slice(-10);
    
    setHistory(trimmedHistory);
    setHistoryIndex(trimmedHistory.length - 1);
  }, [history, historyIndex, isUndoing]);

  // Undo last action
  const handleUndo = useCallback(async () => {
    if (historyIndex <= 0) {
      showNotification('Nothing to undo', 'info');
      return;
    }
    
    setIsUndoing(true);
    const previousState = history[historyIndex - 1];
    
    setFamilyData(previousState.data);
    setHistoryIndex(historyIndex - 1);
    
    // Save to database
    await saveToDatabase(previousState.data);
    
    showNotification(`↶ Undone: ${previousState.action}`, 'success', 3000);
    setIsUndoing(false);
  }, [historyIndex, history, saveToDatabase, showNotification]);

  // Redo action
  const handleRedo = useCallback(async () => {
    if (historyIndex >= history.length - 1) {
      showNotification('Nothing to redo', 'info');
      return;
    }
    
    setIsUndoing(true);
    const nextState = history[historyIndex + 1];
    
    setFamilyData(nextState.data);
    setHistoryIndex(historyIndex + 1);
    
    // Save to database
    await saveToDatabase(nextState.data);
    
    showNotification(`↷ Redone: ${nextState.action}`, 'success', 3000);
    setIsUndoing(false);
  }, [historyIndex, history, saveToDatabase, showNotification]);

  // ============================================================================
  // EXISTING HELPER FUNCTIONS
  // ============================================================================

    // Helper function to check if a person is the root member
  const isRootMember = (person) => {
    return !person.parentId || person.generation === 0;
  };

  // Helper function to find potential children for root member
  const findPotentialChildren = (rootMember) => {
    if (!rootMember || !isRootMember(rootMember)) return [];
    if (!familyData.members || familyData.members.length === 0) return [];
    
    // When editing a root member, they can link:
    // 1. Other root members (to reorganize tree - make them children)
    // 2. Members without a parent
    // 3. Members who already have this root as their parent (existing children)
    // But NOT themselves
    return familyData.members.filter(member => {
      if (!member || member.id === rootMember.id) return false;
      
      // Include members without a parent (including other roots)
      // OR members who already have this root as their parent (existing children)
      return !member.parentId || member.parentId === rootMember.id;
    });
  };

  // Helper function to get all siblings of a person
  const getSiblings = (personId) => {
    if (!familyData.members || familyData.members.length === 0) return [];
    
    const person = familyData.members.find(m => m && m.id === personId);
    if (!person || !person.parentId) return [];
    
    // Find all members with the same parent (excluding the person themselves)
    return familyData.members.filter(member => 
      member &&
      member.id !== personId && 
      member.parentId === person.parentId
    );
  };

  const openEditForm = (person) => {
    setEditingPerson(person);
    
    // Ensure marriages array exists for compatibility
    let personWithMarriages = {
      ...person,
      marriages: person.marriages || (person.spouseName ? [{
        id: Date.now(),
        spouseName: person.spouseName,
        status: person.maritalStatus === 'married' ? 'current' : person.maritalStatus,
        dateOfMarriage: person.dateOfMarriage,
        endDate: null,
        children: person.children || [] // Initially assign all children to first marriage
      }] : [])
    };
    
    // If person has multiple marriages but children aren't distributed, do smart distribution
    if (personWithMarriages.marriages.length > 1) {
      personWithMarriages = distributeChildrenToMarriages(personWithMarriages);
    }
    
    setFormData(personWithMarriages);
    setCroppedImage(person.photo); // Set cropped image to existing photo
    setShowAddForm(true);
    
    // Set advanced marriages mode if person has multiple marriages
    setShowAdvancedMarriages((person.marriages && person.marriages.length > 1) || false);
    
    // Automatically enable toggles for fields that have data
    setShowOptionalFields({
      birthDate: !!person.dateOfBirth,
      birthStar: !!person.birthStar,
      deathDate: !person.isLiving || !!person.dateOfDeath,
      nicknames: !!person.nicknames,
      parent: true // Always show parent option for editing
    });
    
    // Always initialize with existing children (if any)
    // This ensures that when a non-root member with children is changed to root,
    // their existing children are pre-selected and will remain linked
    setSelectedChildrenToLink(person.children || []);
  };





  const handleMouseDown = (e) => {
    if (e.target.closest('.person-card') || e.target.closest('.control-btn')) return;
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
    
    // Prevent default scrolling on touch devices
    if (e.touches) {
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
    
    // Prevent default scrolling on touch devices while dragging
    if (e.touches) {
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getChildrenInfo = (childrenIds) => {
    return childrenIds.map(childId => {
      const child = familyData.members.find(m => m.id === childId);
      return child ? { name: child.fullName, dob: child.dateOfBirth } : null;
    }).filter(Boolean);
  };

  // Marriage helper functions
  const getMarriages = (person) => {
    // Return marriages array, or create from legacy data
    if (person.marriages && person.marriages.length > 0) {
      return person.marriages;
    }
    // Convert legacy single marriage data
    if (person.maritalStatus === 'married' && person.spouseName) {
      return [{
        id: 1,
        spouseName: person.spouseName,
        dateOfMarriage: person.dateOfMarriage,
        status: 'current', // current, divorced, widowed
        endDate: null,
        children: person.children || []
      }];
    }
    return [];
  };

  const getCurrentSpouse = (person) => {
    const marriages = getMarriages(person);
    const currentMarriage = marriages.find(m => m.status === 'current');
    return currentMarriage ? currentMarriage.spouseName : null;
  };



  const getChildrenByMarriage = (person) => {
    const marriages = getMarriages(person);
    return marriages.map(marriage => ({
      marriage,
      children: getChildrenInfo(marriage.children || [])
    }));
  };

  const getTotalChildren = (person) => {
    const marriages = getMarriages(person);
    const allChildrenIds = new Set();
    marriages.forEach(marriage => {
      (marriage.children || []).forEach(childId => allChildrenIds.add(childId));
    });
    // Also include any children not assigned to marriages (legacy data)
    (person.children || []).forEach(childId => allChildrenIds.add(childId));
    return allChildrenIds.size;
  };

  const isMarriedOrHasBeenMarried = (person) => {
    const marriages = getMarriages(person);
    return marriages.length > 0 || person.maritalStatus === 'married';
  };

  // Intelligently distribute children to marriages based on birth dates
  const distributeChildrenToMarriages = (person) => {
    if (!person.marriages || person.marriages.length <= 1) return person;
    
    const allChildren = (person.children || []).map(childId => {
      const child = familyData.members.find(m => m.id === childId);
      return child ? { id: childId, dateOfBirth: child.dateOfBirth } : null;
    }).filter(Boolean);
    
    if (allChildren.length === 0) return person;
    
    // Sort marriages by marriage date
    const sortedMarriages = [...person.marriages].sort((a, b) => {
      if (!a.dateOfMarriage && !b.dateOfMarriage) return 0;
      if (!a.dateOfMarriage) return 1;
      if (!b.dateOfMarriage) return -1;
      return new Date(a.dateOfMarriage) - new Date(b.dateOfMarriage);
    });
    
    // Assign children to marriages based on birth dates
    const updatedMarriages = sortedMarriages.map((marriage, index) => {
      const marriageDate = marriage.dateOfMarriage ? new Date(marriage.dateOfMarriage) : null;
      const nextMarriageDate = sortedMarriages[index + 1]?.dateOfMarriage ? 
        new Date(sortedMarriages[index + 1].dateOfMarriage) : null;
      
      const childrenForThisMarriage = allChildren.filter(child => {
        if (!child.dateOfBirth) return false;
        const childBirthDate = new Date(child.dateOfBirth);
        
        // Child must be born after this marriage started
        if (marriageDate && childBirthDate < marriageDate) return false;
        
        // Child must be born before next marriage (if exists)
        if (nextMarriageDate && childBirthDate >= nextMarriageDate) return false;
        
        return true;
      }).map(child => child.id);
      
      return {
        ...marriage,
        children: childrenForThisMarriage
      };
    });
    
    return {
      ...person,
      marriages: updatedMarriages
    };
  };

  const renderPersonCard = (person, index) => {
    // IMPROVED FAMILY-BASED POSITIONING ALGORITHM
    // First, identify all parents in the previous generation who have children in this generation
    const parentsInPreviousGen = familyData.members.filter(member => 
      member.generation === person.generation - 1 && 
      member.children && member.children.length > 0 &&
      familyData.members.some(child => 
        member.children.includes(child.id) && child.generation === person.generation
      )
    );
    
    // Sort parents by their birth date (or position)
    parentsInPreviousGen.sort((a, b) => {
      if (!a.dateOfBirth && !b.dateOfBirth) return 0;
      if (!a.dateOfBirth) return 1;
      if (!b.dateOfBirth) return -1;
      return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
    });
    
    // Build the generation layout by family groups
    const generationLayout = [];
    
    if (person.generation === 1) {
      // For root generation, just sort by birth date
      const rootMembers = familyData.members
        .filter(member => member.generation === 1)
        .sort((a, b) => {
          if (!a.dateOfBirth && !b.dateOfBirth) return 0;
          if (!a.dateOfBirth) return 1;
          if (!b.dateOfBirth) return -1;
          return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
        });
      generationLayout.push(...rootMembers);
    } else {
      // For subsequent generations, group children by their parents
      const processedChildren = new Set();
      
      parentsInPreviousGen.forEach(parent => {
        // Get this parent's children in the current generation
        const parentChildren = familyData.members
          .filter(member => 
            member.generation === person.generation && 
            member.parentId === parent.id
          )
          .sort((a, b) => {
            // Sort children by birth date (oldest first)
            if (!a.dateOfBirth && !b.dateOfBirth) return 0;
            if (!a.dateOfBirth) return 1;
            if (!b.dateOfBirth) return -1;
            return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
          });
        
        // Add these children to the layout
        parentChildren.forEach(child => {
          if (!processedChildren.has(child.id)) {
            generationLayout.push(child);
            processedChildren.add(child.id);
          }
        });
      });
      
      // Add any remaining members who don't have parents in the previous generation
      const orphanMembers = familyData.members
        .filter(member => 
          member.generation === person.generation && 
          !processedChildren.has(member.id)
        )
        .sort((a, b) => {
          if (!a.dateOfBirth && !b.dateOfBirth) return 0;
          if (!a.dateOfBirth) return 1;
          if (!b.dateOfBirth) return -1;
          return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
        });
      
      generationLayout.push(...orphanMembers);
    }
    
    // Find this person's position in the organized layout
    const positionInGeneration = generationLayout.findIndex(m => m.id === person.id);
    const totalInGeneration = generationLayout.length;
    
    // Calculate responsive layout for mobile and desktop
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 200 : 280; // Updated to match new card width
    const cardSpacing = isMobile ? 60 : 80; // Increased spacing for better card separation
    const startX = isMobile ? 20 : 50;
    const generationY = isMobile ? 80 + person.generation * 340 : 100 + person.generation * 380; // Increased vertical spacing between generations
    
    // Simple horizontal positioning - arrange people in each generation side by side
    // but keep family groups together and sort children within families by birth date
    let horizontalPosition;
    
    // Calculate horizontal position based on generation size
    if (totalInGeneration === 1) {
      // Center single person
      horizontalPosition = isMobile ? startX + 200 : startX + 400;
    } else {
      // Distribute multiple people evenly across the screen
      const totalWidth = totalInGeneration * cardWidth;
      const containerWidth = isMobile ? window.innerWidth - 40 : 1600; // Wider container for new cards
      const spacingAdjustment = Math.max(0, (containerWidth - totalWidth) / (totalInGeneration + 1));
      horizontalPosition = startX + spacingAdjustment + (positionInGeneration * (cardWidth + cardSpacing));
    }

    // Gender-based styling
    const isMale = person.gender === 'male';
    const cardWidthPx = isMobile ? '200px' : '280px'; // Wider for better info display

    // Calculate age if applicable
    const calculateAge = () => {
      if (!person.dateOfBirth) return null;
      const birthDate = new Date(person.dateOfBirth);
      const endDate = person.isLiving ? new Date() : (person.dateOfDeath ? new Date(person.dateOfDeath) : new Date());
      let age = endDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = endDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge();

    return (
      <motion.div
        key={person.id}
        className="person-card absolute transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          left: `${horizontalPosition}px`,
          top: `${generationY}px`,
          width: cardWidthPx,
          minHeight: isMobile ? '180px' : '200px',
          zIndex: 10
        }}
        onClick={() => setSelectedPerson(person)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Professional Timeline Card Layout */}
        <div className={`${theme.cardBg} border-l-4 ${isMale ? 'border-blue-500' : 'border-pink-500'} rounded-lg shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] h-full flex flex-col backdrop-blur-sm relative overflow-hidden transition-all duration-300`}>
          {/* Header with Gender Indicator & Edit Button */}
          <div className={`${isMale ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-pink-500 to-pink-600'} px-4 py-2 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${isMale ? 'bg-blue-700' : 'bg-pink-700'} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {isMale ? '♂' : '♀'}
              </div>
              {person.isLiving && (
                <span className="px-2 py-0.5 bg-white/90 text-green-600 text-[10px] rounded-full font-bold shadow-sm">
                  LIVING
                </span>
              )}
            </div>
            {isAdmin && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditForm(person);
                }}
                className="p-1.5 bg-white/90 rounded-lg shadow-md hover:shadow-lg hover:bg-white transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit2 size={14} className="text-gray-700" />
              </motion.button>
            )}
          </div>

          {/* Card Body with Timeline Info */}
          <div className="p-4 flex-1 relative z-10 space-y-2">
            {/* Name */}
            <h3 className={`text-base font-bold ${theme.text} leading-tight line-clamp-2`} title={person.fullName}>
              {person.fullName}
            </h3>
            
            {/* Timeline Info */}
            <div className="space-y-1.5 text-xs">
              {/* Birth Date */}
              {person.dateOfBirth && (
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'} mt-1 flex-shrink-0`}></div>
                  <div className="flex-1">
                    <p className="text-gray-600 font-semibold">Born</p>
                    <p className={`${theme.text} font-medium`}>
                      {new Date(person.dateOfBirth).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Death Date or Current Age */}
              {!person.isLiving && person.dateOfDeath ? (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mt-1 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-600 font-semibold">Died</p>
                    <p className={`${theme.text} font-medium`}>
                      {new Date(person.dateOfDeath).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {age && <span className="text-gray-500 ml-1">({age} yrs)</span>}
                    </p>
                  </div>
                </div>
              ) : person.isLiving && age !== null && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1 flex-shrink-0 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-gray-600 font-semibold">Age</p>
                    <p className={`${theme.text} font-medium`}>
                      {age} years old
                    </p>
                  </div>
                </div>
              )}
              
              {/* Marriage Info */}
              {getCurrentSpouse(person) && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-200">
                  <Heart size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-600 font-semibold">Spouse</p>
                    <p className="text-red-700 font-medium truncate">
                      {getCurrentSpouse(person)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Children Count */}
              {getTotalChildren(person) > 0 && (
                <div className="flex items-start gap-2">
                  <Users size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-600 font-semibold">Children</p>
                    <p className="text-blue-700 font-medium">
                      {getTotalChildren(person)} {getTotalChildren(person) === 1 ? 'child' : 'children'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation Indicator */}
          <div className="px-4 pb-2">
            <div className={`text-[10px] ${theme.text} opacity-60 font-medium text-center`}>
              Generation {person.generation}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderConnections = () => {
    // Group children by their parent
    const parentChildMap = new Map();
    
    familyData.members.forEach(person => {
      if (person.parentId) {
        if (!parentChildMap.has(person.parentId)) {
          parentChildMap.set(person.parentId, []);
        }
        parentChildMap.get(person.parentId).push(person);
      }
    });
    
    const connections = [];
    
    // For each parent with children, render the connection structure
    parentChildMap.forEach((children, parentId) => {
      const parent = familyData.members.find(m => m.id === parentId);
      if (!parent) return;
      
      const calculatePositionForPerson = (targetPerson) => {
        // First, identify all parents in the previous generation who have children in target generation
        const parentsInPreviousGen = familyData.members.filter(member => 
          member.generation === targetPerson.generation - 1 && 
          member.children && member.children.length > 0 &&
          familyData.members.some(child => 
            member.children.includes(child.id) && child.generation === targetPerson.generation
          )
        );
        
        // Sort parents by their birth date
        parentsInPreviousGen.sort((a, b) => {
          if (!a.dateOfBirth && !b.dateOfBirth) return 0;
          if (!a.dateOfBirth) return 1;
          if (!b.dateOfBirth) return -1;
          return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
        });
        
        // Build the generation layout by family groups
        const generationLayout = [];
        
        if (targetPerson.generation === 1) {
          // For root generation, just sort by birth date
          const rootMembers = familyData.members
            .filter(member => member.generation === 1)
            .sort((a, b) => {
              if (!a.dateOfBirth && !b.dateOfBirth) return 0;
              if (!a.dateOfBirth) return 1;
              if (!b.dateOfBirth) return -1;
              return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
            });
          generationLayout.push(...rootMembers);
        } else {
          // For subsequent generations, group children by their parents
          const processedChildren = new Set();
          
          parentsInPreviousGen.forEach(parent => {
            // Get this parent's children in the current generation
            const parentChildren = familyData.members
              .filter(member => 
                member.generation === targetPerson.generation && 
                member.parentId === parent.id
              )
              .sort((a, b) => {
                // Sort children by birth date (oldest first)
                if (!a.dateOfBirth && !b.dateOfBirth) return 0;
                if (!a.dateOfBirth) return 1;
                if (!b.dateOfBirth) return -1;
                return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
              });
            
            // Add these children to the layout
            parentChildren.forEach(child => {
              if (!processedChildren.has(child.id)) {
                generationLayout.push(child);
                processedChildren.add(child.id);
              }
            });
          });
          
          // Add any remaining members who don't have parents in the previous generation
          const orphanMembers = familyData.members
            .filter(member => 
              member.generation === targetPerson.generation && 
              !processedChildren.has(member.id)
            )
            .sort((a, b) => {
              if (!a.dateOfBirth && !b.dateOfBirth) return 0;
              if (!a.dateOfBirth) return 1;
              if (!b.dateOfBirth) return -1;
              return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
            });
          
          generationLayout.push(...orphanMembers);
        }
        
        // Find position and calculate coordinates
        const positionInGeneration = generationLayout.findIndex(m => m.id === targetPerson.id);
        const totalInGeneration = generationLayout.length;
        
        const isMobile = window.innerWidth < 768;
        const cardWidth = isMobile ? 200 : 280;
        const cardSpacing = isMobile ? 60 : 80;
        const startX = isMobile ? 20 : 50;
        
        let horizontalPosition;
        if (totalInGeneration === 1) {
          horizontalPosition = isMobile ? startX + 200 : startX + 400;
        } else {
          const totalWidth = totalInGeneration * cardWidth;
          const containerWidth = isMobile ? window.innerWidth - 40 : 1600;
          const spacingAdjustment = Math.max(0, (containerWidth - totalWidth) / (totalInGeneration + 1));
          horizontalPosition = startX + spacingAdjustment + (positionInGeneration * (cardWidth + cardSpacing));
        }
        
        return horizontalPosition;
      };
      
      const isMobile = window.innerWidth < 768;
      const cardWidth = isMobile ? 200 : 280;
      const cardHeight = isMobile ? 180 : 200;
      const gap = 15;
      
      // Get parent position (center bottom of card)
      const parentX = calculatePositionForPerson(parent) + cardWidth / 2;
      const parentY = (isMobile ? 80 + parent.generation * 340 : 100 + parent.generation * 380) + cardHeight;
      const adjustedParentY = parentY + gap;
      
      if (children.length === 1) {
        // Single child - direct connection
        const child = children[0];
        const childX = calculatePositionForPerson(child) + cardWidth / 2;
        const childY = isMobile ? 80 + child.generation * 240 : 100 + child.generation * 260;
        const adjustedChildY = childY - gap;
        const midY = (adjustedParentY + adjustedChildY) / 2;
        
        connections.push(
          <g key={`${parent.id}-to-${child.id}`}>
            {/* Vertical line from parent */}
            <line
              x1={parentX}
              y1={adjustedParentY}
              x2={parentX}
              y2={midY}
              stroke={theme.connection}
              strokeWidth="3"
              opacity="0.9"
              strokeLinecap="round"
            />
            {/* Horizontal line */}
            <line
              x1={parentX}
              y1={midY}
              x2={childX}
              y2={midY}
              stroke={theme.connection}
              strokeWidth="3"
              opacity="0.9"
              strokeLinecap="round"
            />
            {/* Vertical line to child with arrow */}
            <line
              x1={childX}
              y1={midY}
              x2={childX}
              y2={adjustedChildY}
              stroke={theme.connection}
              strokeWidth="3"
              opacity="0.9"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      } else {
        // Multiple children - branching structure
        const childPositions = children.map(child => ({
          child,
          x: calculatePositionForPerson(child) + cardWidth / 2,
          y: isMobile ? 80 + child.generation * 340 : 100 + child.generation * 380
        }));
        
        // Find leftmost and rightmost children
        const minX = Math.min(...childPositions.map(cp => cp.x));
        const maxX = Math.max(...childPositions.map(cp => cp.x));
        const branchY = adjustedParentY + 30; // Horizontal branch line Y position
        
        // Vertical line from parent down to branch line
        connections.push(
          <line
            key={`${parent.id}-trunk`}
            x1={parentX}
            y1={adjustedParentY}
            x2={parentX}
            y2={branchY}
            stroke={theme.connection}
            strokeWidth="3"
            opacity="0.9"
            strokeLinecap="round"
          />
        );
        
        // Horizontal branch line connecting all children
        connections.push(
          <line
            key={`${parent.id}-branch`}
            x1={minX}
            y1={branchY}
            x2={maxX}
            y2={branchY}
            stroke={theme.connection}
            strokeWidth="3"
            opacity="0.9"
            strokeLinecap="round"
          />
        );
        
        // Individual lines from branch to each child
        childPositions.forEach(({ child, x, y }) => {
          const adjustedChildY = y - gap;
          
          connections.push(
            <g key={`${parent.id}-to-${child.id}`}>
              {/* Vertical line from branch down to child with arrow */}
              <line
                x1={x}
                y1={branchY}
                x2={x}
                y2={adjustedChildY}
                stroke={theme.connection}
                strokeWidth="3"
                opacity="0.9"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        });
      }
    });
    
    return connections;
  };

  // Show loading screen while checking setup
  if (checkingSetup) {
    return (
      <div className={`w-full h-screen ${theme.background} flex items-center justify-center`}>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className={`w-16 h-16 bg-gradient-to-br ${theme.primary} rounded-full flex items-center justify-center mx-auto mb-4`}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Users className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Loading Family Tree</h2>
          <p className={`${theme.textLight}`}>Setting up your experience...</p>
        </motion.div>
      </div>
    );
  }

  // Show "Family Not Found" page when subdomain doesn't exist
  if (familyNotFound) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4 overflow-auto relative">
        {/* Doodle Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="notfound-doodle" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              {/* Error/search themed doodles */}
              <circle cx="80" cy="100" r="15" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.6" strokeDasharray="2,3"/>
              <circle cx="340" cy="160" r="18" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.5" strokeDasharray="2,4"/>
              <path d="M 50,200 Q 100,150 150,180 T 250,160" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
              <path d="M 360,340 L 380,320 L 400,340 M 365,340 L 365,370 L 395,370 L 395,340" fill="none" stroke="#6b7280" strokeWidth="3" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="200" cy="200" r="30" fill="none" stroke="#6b7280" strokeWidth="2.5" opacity="0.5"/>
              <path d="M 220,220 L 240,240" stroke="#6b7280" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#notfound-doodle)"/>
        </svg>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <motion.div 
          className="max-w-2xl w-full relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header with icon */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Home size={40} className="text-white" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Family Tree Not Found</h1>
              <p className="text-gray-300 text-lg">The family tree you're looking for doesn't exist</p>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-10">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-gray-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <p className="text-gray-700 font-medium mb-2">Subdomain Not Registered</p>
                    <p className="text-gray-600 text-sm mb-1">
                      The subdomain <span className="font-mono font-semibold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{attemptedSubdomain}.familywall.in</span> hasn't been registered yet.
                    </p>
                    <p className="text-gray-500 text-sm">
                      This could mean:
                    </p>
                    <ul className="text-gray-600 text-sm mt-2 space-y-1 ml-4 list-disc">
                      <li>The family name was typed incorrectly</li>
                      <li>This family hasn't created their tree yet</li>
                      <li>The family tree was removed or deactivated</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-lg px-4 py-2 text-sm text-amber-900 font-medium">
                    <Sparkles size={16} className="text-amber-600" />
                    Create your own family tree in minutes!
                  </div>
                </div>

                <button
                  onClick={() => window.location.href = getRootDomainUrl() + '/register'}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  <Users size={20} />
                  <span>Create Your Free Family Tree</span>
                  <motion.span
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    →
                  </motion.span>
                </button>

                <button
                  onClick={() => window.location.href = getRootDomainUrl()}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2"
                >
                  <Home size={20} />
                  <span>Go to Homepage</span>
                </button>
              </div>

              {/* Footer info */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@familywall.in" className="text-amber-600 hover:text-amber-700 font-medium">
                    support@familywall.in
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Additional info below card */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have a family tree?{' '}
              <button
                onClick={() => setShowSearchModal(true)}
                className="text-amber-600 hover:text-amber-700 font-semibold underline"
              >
                Search for your family
              </button>
            </p>
          </div>
        </motion.div>

        {/* Search Modal */}
        <AnimatePresence>
          {showSearchModal && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchError('');
              }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">Search Family Tree</h3>
                    <button
                      onClick={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                        setSearchError('');
                      }}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className="text-amber-50 text-sm">Enter the family name to find their tree</p>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleFamilySearch} className="p-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchError('');
                      }}
                      placeholder="e.g., Smith, Johnson, Patel"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none transition-colors text-lg"
                      autoFocus
                      disabled={isSearching}
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      This will search for: <span className="font-mono font-semibold">{searchQuery.trim().toLowerCase() || 'familyname'}.familywall.in</span>
                    </p>
                  </div>

                  {/* Error Message */}
                  {searchError && (
                    <motion.div
                      className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{searchError}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                        setSearchError('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                      disabled={isSearching}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Users size={18} />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <p className="text-gray-600 text-xs text-center">
                    Don't have a family tree yet?{' '}
                    <a
                      href={getRootDomainUrl() + '/register'}
                      className="text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      Create one for free
                    </a>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Admin Login Modal - Check this BEFORE landing page
  if (showAdminLogin) {
    return (
      <div className={`w-full min-h-screen h-screen bg-gradient-to-b ${theme.header} flex items-center justify-center overflow-auto p-4 relative`}>
        {/* Doodle Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-doodle" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              {/* Admin/security themed doodles */}
              <circle cx="80" cy="100" r="15" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.6" strokeDasharray="2,3"/>
              <path d="M 150,300 L 152,306 L 158,308 L 152,310 L 150,316 L 148,310 L 142,308 L 148,306 Z" fill="#ffffff" opacity="0.5"/>
              <circle cx="340" cy="160" r="18" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.5" strokeDasharray="2,4"/>
              <path d="M 50,200 Q 100,150 150,180 T 250,160" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
              <rect x="280" y="280" width="30" height="40" rx="5" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.5"/>
              <circle cx="295" cy="295" r="5" fill="#ffffff" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-doodle)"/>
        </svg>
        
        <div className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border-t-4 ${theme.headerBorder} relative z-10`}>
          <div className="text-center mb-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${theme.primary} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Lock size={28} className="sm:w-9 sm:h-9 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Admin Access</h2>
            <p className="text-gray-600">Enter your credentials to manage the family tree</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-semibold text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-username"
                type="text"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
                disabled={isLoggingIn}
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={isLoggingIn}
                autoComplete="current-password"
              />
            </div>
            
            {/* Inline Error Display */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Login Failed</p>
                    <p className="text-sm text-red-700 mt-1">{loginError}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base ${
                isLoggingIn 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : `bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover.replace('from-', '').replace('to-', '')} active:scale-95`
              }`}
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  <User size={20} />
                  Login as Admin
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowAdminLogin(false);
                setAdminCredentials({ username: '', password: '' });
                setLoginError('');
              }}
              disabled={isLoggingIn}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium block w-full text-center transition-colors"
            >
              ← Back to Public View
            </button>
            <div className="text-gray-500 text-xs mt-3 text-center">
              Don't have admin access? <a href={getRootDomainUrl()} className="text-amber-600 hover:text-amber-800 font-semibold hover:underline">Create New Family Tree</a>
            </div>
          </div>
        </div>

        {/* Floating Notifications for Login Modal */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`
                  relative max-w-sm p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-sm
                  ${notification.type === 'success' ? 'bg-green-50/95 border-green-500 text-green-800' : ''}
                  ${notification.type === 'error' ? 'bg-red-50/95 border-red-500 text-red-800' : ''}
                  ${notification.type === 'info' ? 'bg-blue-50/95 border-blue-500 text-blue-800' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-50/95 border-yellow-500 text-yellow-800' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${notification.type === 'success' ? 'bg-green-500' : ''}
                      ${notification.type === 'error' ? 'bg-red-500' : ''}
                      ${notification.type === 'info' ? 'bg-blue-500' : ''}
                      ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                    `}></div>
                    <span className="text-sm font-medium">{notification.message}</span>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Show landing page on root domain
  if (isRootDomain() && window.location.pathname !== '/register') {
    return <LandingPage onAdminLoginClick={() => setShowAdminLogin(true)} />;
  }

  // Show registration page on /register route
  if (needsInitialSetup) {
    return <InitialSetup onSetupComplete={handleSetupComplete} />;
  }

  if (scene === 'entry') {
    return (
      <div className={`w-full min-h-screen h-screen bg-gradient-to-br ${theme.header} flex items-center justify-center overflow-auto relative p-4`}>
        {/* Enhanced background with textures */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`
        }}></div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), 
                           linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), 
                           linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
        }}></div>
        
        <div className="text-center animate-fade-in relative z-10 px-4 w-full max-w-2xl">
          <div className="mb-6 sm:mb-8">
            <div className="relative">
              <Home size={60} className={`mx-auto ${theme.headerText} animate-pulse drop-shadow-2xl sm:w-20 sm:h-20`} />
              <div className="absolute inset-0 mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full blur-xl" style={{ backgroundColor: `${theme.canvasPattern}20` }}></div>
            </div>
          </div>
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-bold ${theme.headerText} mb-3 sm:mb-4 font-serif drop-shadow-2xl leading-tight`}>
            The {familyData.surname}
          </h1>
          <p className={`text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 italic drop-shadow-lg px-4`} style={{ color: `${theme.canvasBg}` }}>A Living House of Memories</p>
          
          <button
            onClick={enterHouse}
            className={`group relative px-8 py-4 sm:px-12 sm:py-5 bg-white ${theme.text} text-lg sm:text-xl font-bold rounded-xl shadow-2xl transition-all duration-500 transform hover:scale-110 border-4 ${theme.headerBorder} backdrop-blur-sm`}
            style={{ boxShadow: `0 20px 50px -12px ${theme.connection}80` }}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              Open the Door
              <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${theme.canvasPattern}30, ${theme.canvasBg}30)` }}></div>
          </button>
        </div>
      </div>
    );
  }

  // Generate doodle pattern SVG based on selected pattern type
  const getDoodlePattern = (patternType, color) => {
    const patterns = {
      none: null,
      family: (
        <>
          {/* Tree branches - organic curved lines */}
          <path d="M 50,200 Q 100,150 150,180 T 250,160" fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" strokeLinecap="round"/>
          <path d="M 200,50 Q 180,100 200,150 T 220,250" fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" strokeLinecap="round"/>
          <path d="M 350,100 Q 300,120 280,180 T 250,280" fill="none" stroke={color} strokeWidth="2" opacity="0.35" strokeLinecap="round"/>
          
          {/* Doodle hearts - family love */}
          <path d="M 100,100 C 95,85 75,85 70,100 C 65,85 45,85 40,100 C 40,120 70,135 70,135 C 70,135 100,120 100,100 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.3"/>
          <path d="M 320,260 C 315,250 305,250 300,260 C 295,250 285,250 280,260 C 280,272 300,282 300,282 C 300,282 320,272 320,260 Z" fill="none" stroke={color} strokeWidth="1.8" opacity="0.25"/>
          
          {/* Sketchy circles - family members */}
          <circle cx="80" cy="240" r="15" fill="none" stroke={color} strokeWidth="2" opacity="0.35" strokeDasharray="2,3"/>
          <circle cx="180" cy="80" r="20" fill="none" stroke={color} strokeWidth="2.5" opacity="0.4" strokeDasharray="3,2"/>
          <circle cx="340" cy="160" r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeDasharray="2,4"/>
          
          {/* Stars and sparkles */}
          <path d="M 150,300 L 152,306 L 158,308 L 152,310 L 150,316 L 148,310 L 142,308 L 148,306 Z" fill={color} opacity="0.25"/>
          <path d="M 330,50 L 332,55 L 337,57 L 332,59 L 330,64 L 328,59 L 323,57 L 328,55 Z" fill={color} opacity="0.3"/>
          <path d="M 60,350 L 62,354 L 66,356 L 62,358 L 60,362 L 58,358 L 54,356 L 58,354 Z" fill={color} opacity="0.2"/>
          
          {/* Simple house/home icon */}
          <path d="M 360,340 L 380,320 L 400,340 M 365,340 L 365,370 L 395,370 L 395,340" fill="none" stroke={color} strokeWidth="2.5" opacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="375" y="352" width="10" height="18" fill="none" stroke={color} strokeWidth="2" opacity="0.3"/>
          
          {/* Wavy decorative lines */}
          <path d="M 10,300 Q 30,290 50,300 T 90,300" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
          <path d="M 200,380 Q 220,375 240,380 T 280,380" fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
        </>
      ),
      minimal: (
        <>
          {/* Simple dots */}
          <circle cx="100" cy="100" r="3" fill={color} opacity="0.2"/>
          <circle cx="300" cy="200" r="3" fill={color} opacity="0.2"/>
          <circle cx="150" cy="350" r="3" fill={color} opacity="0.2"/>
          <circle cx="350" cy="100" r="3" fill={color} opacity="0.2"/>
          
          {/* Subtle lines */}
          <path d="M 50,50 L 350,50" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="5,10"/>
          <path d="M 50,200 L 350,200" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="5,10"/>
          <path d="M 50,350 L 350,350" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="5,10"/>
        </>
      ),
      geometric: (
        <>
          {/* Triangles */}
          <path d="M 100,80 L 120,120 L 80,120 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.25"/>
          <path d="M 300,180 L 320,220 L 280,220 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.25"/>
          
          {/* Squares */}
          <rect x="150" y="100" width="40" height="40" fill="none" stroke={color} strokeWidth="2" opacity="0.2" transform="rotate(15 170 120)"/>
          <rect x="50" y="280" width="30" height="30" fill="none" stroke={color} strokeWidth="2" opacity="0.25" transform="rotate(25 65 295)"/>
          
          {/* Hexagons */}
          <path d="M 340,100 L 360,115 L 360,145 L 340,160 L 320,145 L 320,115 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.2"/>
          
          {/* Circles */}
          <circle cx="250" cy="320" r="25" fill="none" stroke={color} strokeWidth="2" opacity="0.2"/>
          <circle cx="180" cy="250" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.25"/>
        </>
      ),
      floral: (
        <>
          {/* Flowers */}
          <g opacity="0.25">
            <circle cx="100" cy="100" r="8" fill="none" stroke={color} strokeWidth="2"/>
            <circle cx="92" cy="100" r="5" fill="none" stroke={color} strokeWidth="1.5"/>
            <circle cx="108" cy="100" r="5" fill="none" stroke={color} strokeWidth="1.5"/>
            <circle cx="100" cy="92" r="5" fill="none" stroke={color} strokeWidth="1.5"/>
            <circle cx="100" cy="108" r="5" fill="none" stroke={color} strokeWidth="1.5"/>
          </g>
          
          {/* Leaves */}
          <path d="M 280,150 Q 290,160 280,170 Q 270,160 280,150" fill="none" stroke={color} strokeWidth="2" opacity="0.3"/>
          <path d="M 150,300 Q 160,310 150,320 Q 140,310 150,300" fill="none" stroke={color} strokeWidth="2" opacity="0.25"/>
          
          {/* Vines */}
          <path d="M 50,200 Q 80,180 100,200 T 150,200" fill="none" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round"/>
          <path d="M 250,350 Q 280,330 300,350 T 350,350" fill="none" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round"/>
          
          {/* Small decorative petals */}
          <circle cx="320" cy="250" r="4" fill={color} opacity="0.2"/>
          <circle cx="60" cy="340" r="4" fill={color} opacity="0.2"/>
        </>
      ),
      stars: (
        <>
          {/* Various sized stars */}
          <path d="M 100,100 L 105,115 L 120,118 L 108,128 L 110,143 L 100,135 L 90,143 L 92,128 L 80,118 L 95,115 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.3"/>
          <path d="M 300,200 L 303,210 L 313,212 L 305,219 L 307,229 L 300,223 L 293,229 L 295,219 L 287,212 L 297,210 Z" fill="none" stroke={color} strokeWidth="1.8" opacity="0.25"/>
          <path d="M 180,320 L 182,327 L 189,329 L 183,334 L 185,341 L 180,337 L 175,341 L 177,334 L 171,329 L 178,327 Z" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2"/>
          
          {/* Sparkles */}
          <path d="M 350,120 L 352,125 L 357,127 L 352,129 L 350,134 L 348,129 L 343,127 L 348,125 Z" fill={color} opacity="0.3"/>
          <path d="M 60,250 L 62,254 L 66,256 L 62,258 L 60,262 L 58,258 L 54,256 L 58,254 Z" fill={color} opacity="0.25"/>
          <path d="M 250,80 L 252,83 L 255,85 L 252,87 L 250,90 L 248,87 L 245,85 L 248,83 Z" fill={color} opacity="0.2"/>
          
          {/* Shooting stars */}
          <path d="M 120,50 L 130,55 M 120,50 L 118,60 M 120,50 L 128,48" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"/>
          <path d="M 340,330 L 350,335 M 340,330 L 338,340 M 340,330 L 348,328" stroke={color} strokeWidth="1.5" opacity="0.2" strokeLinecap="round"/>
        </>
      )
    };
    
    return patterns[patternType];
  };

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ touchAction: 'none' }}>
      {/* Doodle-style patterned background */}
      <div className="absolute inset-0" style={{ backgroundColor: theme.canvasBg }}>
        {/* Main decorative doodle pattern - zooms with canvas */}
        {currentDoodlePattern !== 'none' && (
          <svg 
            className="absolute inset-0 w-full h-full opacity-[0.35]" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern 
                id="doodle-pattern" 
                x="0" 
                y="0" 
                width={400 / zoom} 
                height={400 / zoom} 
                patternUnits="userSpaceOnUse"
                patternTransform={`scale(${zoom})`}
              >
                {getDoodlePattern(currentDoodlePattern, theme.canvasPattern)}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#doodle-pattern)"/>
          </svg>
        )}
        
        {/* Soft gradient overlays for depth */}
        <div className="absolute inset-0 opacity-40" style={{
          background: `
            radial-gradient(circle at 15% 25%, ${theme.canvasPattern}25 0%, transparent 40%),
            radial-gradient(circle at 85% 75%, ${theme.canvasPattern}20 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, ${theme.canvasPattern}12 0%, transparent 60%)`
        }}></div>
      </div>

      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-r ${theme.header} ${theme.headerText} p-2 sm:p-4 lg:p-6 shadow-2xl z-30 border-b-4 ${theme.headerBorder} backdrop-blur-sm`}>
        {/* Header with enhanced styling */}
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.header.replace('900', '800')}/50`}></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {showSurnameEdit ? (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <input
                  type="text"
                  value={tempSurname}
                  onChange={(e) => setTempSurname(e.target.value)}
                  className="text-base sm:text-xl font-bold bg-white text-amber-900 border border-amber-300 rounded px-2 py-1 w-32 sm:w-auto"
                  placeholder="Family Name"
                  onKeyPress={(e) => e.key === 'Enter' && saveSurname()}
                  autoFocus
                />
                <select
                  value={tempSurnameFormat}
                  onChange={(e) => setTempSurnameFormat(e.target.value)}
                  className="bg-white text-amber-900 border border-amber-300 rounded px-1.5 sm:px-2 py-1 text-xs sm:text-sm"
                >
                  <option value="">Select Suffix</option>
                  <option value="possessive">
                    {tempSurname ? `${tempSurname}'s Family Tree` : "Smith's Family Tree"}
                  </option>
                  <option value="ji">
                    {tempSurname ? `${tempSurname}ji Family Tree` : "Smithji Family Tree"}
                  </option>
                  <option value="simple">
                    {tempSurname ? `${tempSurname} Family Tree` : "Smith Family Tree"}
                  </option>
                </select>
                <button
                  onClick={saveSurname}
                  className="p-1 text-green-400 hover:text-green-300"
                  title="Save"
                >
                  <Check size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={cancelSurnameEdit}
                  className="p-1 text-red-400 hover:text-red-300"
                  title="Cancel"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif truncate">{familyData.surname}</h2>
                {isAdmin && (
                  <button
                    onClick={handleSurnameEdit}
                    className="p-1 text-amber-300 hover:text-amber-100"
                    title="Edit family name"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-start sm:justify-end w-full sm:w-auto">

            {/* Mobile Menu Button */}
            {!isAdmin && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-all ml-auto"
                title="Menu"
              >
                <Menu size={24} />
              </button>
            )}

            {/* Desktop View - Show Login and Get Started Free buttons */}
            {!isAdmin && (
              <>
                <motion.button
                  onClick={() => setShowAdminLogin(true)}
                  className="hidden md:flex px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-300 items-center gap-2 border border-white/30 hover:border-white/50 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn size={18} />
                  <span>Admin Login</span>
                </motion.button>
                
                <motion.a
                  href={getRootDomainUrl()}
                  className="hidden md:flex px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-300 items-center gap-2 shadow-lg border border-green-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles size={18} />
                  <span>Get Started Free</span>
                </motion.a>
              </>
            )}

            {/* All action buttons moved to bottom-right floating controls for better accessibility */}

          </div>

          {/* Mobile Menu Dropdown */}
          {!isAdmin && showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="md:hidden w-full mt-3 p-4 bg-white/15 backdrop-blur-md rounded-xl border border-white/30 space-y-3 shadow-xl"
            >
              <button
                onClick={() => {
                  setShowAdminLogin(true);
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 bg-white/25 hover:bg-white/35 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn size={18} />
                Admin Login
              </button>
              <a
                href={getRootDomainUrl()}
                className="w-full block px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all text-center shadow-lg"
              >
                Get Started Free
              </a>
            </motion.div>
          )}
        </div>
      </div>

      {/* Google Maps Style Zoom Controls - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {/* Zoom In/Out Controls */}
        <motion.div 
          className="bg-white/98 backdrop-blur-sm rounded-lg shadow-xl border border-gray-300 overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="group relative">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
              className="flex items-center justify-center w-12 h-12 hover:bg-gray-50 active:bg-gray-100 transition-all border-b border-gray-200 text-gray-600 hover:text-gray-800 font-bold"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
            <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Zoom In
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
          <div className="group relative">
            <button
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.2))}
              className="flex items-center justify-center w-12 h-12 hover:bg-gray-50 active:bg-gray-100 transition-all text-gray-600 hover:text-gray-800"
            >
              <span className="text-lg font-bold leading-none select-none">−</span>
            </button>
            <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Zoom Out
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Floating action group (Add Member, Undo/Redo, Home, Exit/Logout) */}
        <div className="flex flex-col gap-2 mt-2 items-end">
          {isAdmin && (
            <div className="group relative">
              <button
                onClick={() => {
                  resetForm();
                  setEditingPerson(null);
                  setShowAddForm(true);
                }}
                className="bg-green-600 hover:bg-green-500 text-white w-12 h-12 rounded-lg shadow-lg flex items-center justify-center transition-transform hover:scale-105"
              >
                <Plus size={18} />
              </button>
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                  Add Member
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <>
              <div className="group relative">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`w-12 h-12 rounded-lg shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${
                    historyIndex <= 0 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <span className="text-lg">↶</span>
                </button>
                <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                    {historyIndex <= 0 ? "Nothing to undo" : "Undo"}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className={`w-12 h-12 rounded-lg shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${
                    historyIndex >= history.length - 1 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <span className="text-lg">↷</span>
                </button>
                <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                    {historyIndex >= history.length - 1 ? "Nothing to redo" : "Redo"}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Theme Selector - Admin only */}
          {isAdmin && (
            <div className="group relative">
              <button
                className="bg-white/98 backdrop-blur-sm border border-gray-300 w-12 h-12 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-transform hover:scale-105 text-gray-600"
              >
                <Palette size={16} strokeWidth={2.5} />
              </button>
              {/* Theme dropdown */}
              <div className="absolute right-14 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-2 min-w-[180px]">
                  <div className="text-xs font-semibold text-gray-700 px-2 py-1 mb-1">Choose Theme</div>
                  {Object.entries(themes).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-all flex items-center gap-2 ${
                        currentTheme === key 
                          ? 'bg-gradient-to-r ' + t.primary + ' text-white font-semibold' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.primary}`}></div>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                  Change Theme
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            </div>
          )}

          {/* Doodle Pattern Selector - Admin only */}
          {isAdmin && (
            <div className="group relative">
              <button
                className="bg-white/98 backdrop-blur-sm border border-gray-300 w-12 h-12 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-transform hover:scale-105 text-gray-600"
              >
                <Sparkles size={16} strokeWidth={2.5} />
              </button>
              {/* Doodle pattern dropdown */}
              <div className="absolute right-14 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-2 min-w-[180px]">
                  <div className="text-xs font-semibold text-gray-700 px-2 py-1 mb-1">Background Pattern</div>
                  {[
                    { key: 'none', name: 'None', icon: '○' },
                    { key: 'family', name: 'Family Doodles', icon: '♥' },
                    { key: 'minimal', name: 'Minimal Dots', icon: '·' },
                    { key: 'geometric', name: 'Geometric', icon: '◇' },
                    { key: 'floral', name: 'Floral', icon: '✿' },
                    { key: 'stars', name: 'Stars', icon: '★' }
                  ].map(({ key, name, icon }) => (
                    <button
                      key={key}
                      onClick={() => setCurrentDoodlePattern(key)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-all flex items-center gap-2 ${
                        currentDoodlePattern === key 
                          ? 'bg-gradient-to-r ' + theme.primary + ' text-white font-semibold' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-base">{icon}</span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                  Background Pattern
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            </div>
          )}

          {/* Reset View button */}
          <div className="group relative">
            <button
              onClick={() => {
                setZoom(0.8);
                setPan({ x: 0, y: 0 });
                if (isTouchDevice) {
                  const container = document.querySelector('.family-tree-container');
                  if (container) {
                    container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }
                }
              }}
              className="bg-white/98 backdrop-blur-sm border border-gray-300 w-12 h-12 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-transform hover:scale-105 text-gray-600"
            >
              <Home size={16} strokeWidth={2.5} />
            </button>
            <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                Reset View
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Exit/Logout Button */}
          <div className="group relative">
            <button
              onClick={isAdmin ? handleAdminLogout : exitHouse}
              className="bg-red-600 hover:bg-red-500 text-white w-12 h-12 rounded-lg shadow-lg flex items-center justify-center transition-transform hover:scale-105"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
            <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
                {isAdmin ? "Logout" : "Exit"}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Zoom Level Indicator */}
        <motion.div 
          className="bg-white/98 backdrop-blur-sm rounded-lg shadow-xl border border-gray-300 w-12 h-12 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-gray-700 text-xs font-semibold select-none">
            {Math.round(zoom * 100)}%
          </span>
        </motion.div>
      </div>

      <div
        className="absolute inset-0 pt-24 family-tree-container cursor-move overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          WebkitOverflowScrolling: 'auto',
          touchAction: 'none'
        }}
      >
        {familyData.members.length === 0 ? (
          // Empty state - different view for admin vs public
          <div className="flex items-center justify-center h-full">
            {isAdmin ? (
              // Admin view - ready to add members
              <motion.div 
                className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-amber-800 max-w-md mx-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Users className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-amber-900 mb-4">
                  Ready to Build Your Tree! 🌳
                </h2>
                <p className="text-amber-700 text-lg mb-6">
                  You're logged in as admin. Click the <strong>➕ Add Member</strong> button above to start adding family members.
                </p>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-blue-800 text-sm font-semibold mb-2">💡 Quick Tips:</p>
                  <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                    <li>Add the oldest family member first</li>
                    <li>Then add their children and link them</li>
                    <li>Use the zoom controls to navigate</li>
                    <li>Changes are auto-saved</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              // Public view - clean minimal view with footer
              <div className="flex flex-col items-center justify-center h-full w-full">
                <motion.div 
                  className={`text-center p-8 ${theme.cardBg} backdrop-blur-sm rounded-3xl shadow-2xl border-4 ${theme.cardBorder} max-w-md mx-4`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className={`w-24 h-24 bg-gradient-to-br ${theme.primary} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Users className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>
                    Family Tree Private
                  </h2>
                  <p className={`${theme.textLight} text-lg mb-6`}>
                    This family tree is being set up by the admin. Please check back later!
                  </p>
                  
                  <p className={`${theme.textLight} text-sm`}>
                    Are you the admin? <button onClick={() => setShowAdminLogin(true)} className={`${theme.text} font-semibold hover:underline`}>Login here</button>
                  </p>
                </motion.div>

                {/* Footer for public users */}
                <motion.div 
                  className="mt-8 text-center max-w-md mx-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className={`${theme.background} rounded-2xl p-6 shadow-lg border-2 ${theme.cardBorder}`}>
                    <h3 className={`text-xl font-bold ${theme.text} mb-3`}>
                      Create Your Own Family Tree! 🌳
                    </h3>
                    <p className={`${theme.textLight} text-sm mb-4`}>
                      Preserve your family heritage with your own personalized family tree website.
                    </p>
                    <a 
                      href={getRootDomainUrl()}
                      className={`inline-block bg-gradient-to-r ${theme.primary} text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all duration-300 shadow-md`}
                    >
                      Get Started Free
                    </a>
                    <p className="text-xs text-gray-500 mt-4">
                      Developed with ❤️ by <a href="https://onemark.co.in" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-semibold hover:underline">OneMark.co.in</a>
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        ) : (
          // Normal family tree view with mobile-friendly scrolling
          <div className="w-full h-full relative">
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                width: '3000px',
                height: '2500px',
                minWidth: '3000px',
                minHeight: '2500px',
                padding: '0'
              }}
              className="relative"
            >
              <svg 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  minWidth: 'auto',
                  minHeight: 'auto'
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <polygon
                      points="0 1, 4 7, 8 1"
                      fill={theme.connection}
                      opacity="0.9"
                    />
                  </marker>
                </defs>
                {renderConnections()}
              </svg>
              
              {familyData.members.map((person, index) => renderPersonCard(person, index))}
            </div>
          </div>
        )}
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 animate-fade-in p-4">
          <div className={`${theme.cardBg} rounded-2xl shadow-2xl max-w-2xl w-full border-4 ${theme.cardBorder} max-h-[85vh] flex flex-col`}>
            <div className={`bg-gradient-to-r ${theme.header} ${theme.headerText} p-4 rounded-t-xl flex justify-between items-center border-b-4 ${theme.headerBorder} flex-shrink-0`}>
              <h3 className="text-xl font-bold">{selectedPerson.fullName}</h3>
              <button
                onClick={() => setSelectedPerson(null)}
                className={`hover:bg-opacity-80 p-2 rounded-lg transition-all`}
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex justify-center mb-4">
                <div className={`relative w-24 h-24 ${theme.background} rounded-full overflow-hidden border-4 ${theme.cardBorder} shadow-xl shrink-0`} style={{ borderColor: theme.connection }}>
                  {selectedPerson.photo ? (
                    <img
                      src={selectedPerson.photo}
                      alt={selectedPerson.fullName}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${theme.text}`}>
                      {selectedPerson.fullName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedPerson.dateOfBirth && (
                  <div className={`bg-white p-3 rounded-lg border-2 ${theme.cardBorder}`}>
                    <p className={`text-sm ${theme.textLight} font-semibold mb-1`}>Date of Birth</p>
                    <p className={`${theme.text} font-bold`}>{new Date(selectedPerson.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                )}

                {!selectedPerson.isLiving && (
                  <div className={`bg-white p-3 rounded-lg border-2 ${theme.cardBorder}`}>
                    <p className={`text-sm ${theme.textLight} font-semibold mb-1`}>Date of Death</p>
                    <p className={`${theme.text} font-bold`}>{new Date(selectedPerson.dateOfDeath).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedPerson.isLiving && (
                  <div className="bg-green-100 p-3 rounded-lg border-2 border-green-400">
                    <p className="text-sm text-green-700 font-semibold mb-1">Status</p>
                    <p className="text-green-900 font-bold">Living</p>
                  </div>
                )}

                {selectedPerson.birthStar && (
                  <div className={`bg-white p-3 rounded-lg border-2 ${theme.cardBorder}`}>
                    <p className={`text-sm ${theme.textLight} font-semibold mb-1`}>Birth Star</p>
                    <p className={`${theme.text} font-bold flex items-center gap-2`}>
                      <Star size={16} className="text-yellow-600" />
                      {selectedPerson.birthStar}
                    </p>
                  </div>
                )}

                {selectedPerson.nicknames && (
                  <div className={`bg-white p-3 rounded-lg border-2 ${theme.cardBorder}`}>
                    <p className={`text-sm ${theme.textLight} font-semibold mb-1`}>Nicknames</p>
                    <p className={`${theme.text} font-bold`}>{selectedPerson.nicknames}</p>
                  </div>
                )}

                {/* Parent Info - Show if not root member */}
                {selectedPerson.parentId ? (
                  (() => {
                    const parent = familyData.members.find(m => m.id === selectedPerson.parentId);
                    if (parent) {
                      return (
                        <div className={`bg-blue-50 p-3 rounded-lg border-2 border-blue-300`}>
                          <p className={`text-sm text-blue-700 font-semibold mb-1`}>Parent</p>
                          <p className={`${theme.text} font-bold`}>{parent.fullName}</p>
                        </div>
                      );
                    }
                    return null;
                  })()
                ) : (
                  familyData.members.length > 0 && (
                    <div className={`bg-purple-50 p-3 rounded-lg border-2 border-purple-300`}>
                      <p className={`text-sm text-purple-700 font-semibold mb-1`}>Status</p>
                      <p className={`text-purple-900 font-bold`}>🌳 Root Member (Family Head)</p>
                    </div>
                  )
                )}
              </div>

              {getMarriages(selectedPerson).length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h4 className="text-base font-bold text-red-900 mb-3 flex items-center gap-2">
                    <Heart size={18} className="text-red-500" />
                    Marriage{getMarriages(selectedPerson).length > 1 ? 's' : ''} ({getMarriages(selectedPerson).length})
                  </h4>
                  <div className="space-y-3">
                    {getMarriages(selectedPerson).map((marriage, idx) => (
                      <div key={marriage.id || idx} className="bg-white p-3 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-red-900 text-sm">
                            {getMarriages(selectedPerson).length > 1 && `${idx + 1}. `}
                            {marriage.spouseName}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            marriage.status === 'current' ? 'bg-green-100 text-green-800' :
                            marriage.status === 'divorced' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {marriage.status === 'current' ? 'Current' : 
                             marriage.status === 'divorced' ? 'Divorced' : 'Widowed'}
                          </span>
                        </div>
                        {marriage.dateOfMarriage && (
                          <p className="text-xs text-red-700 mb-1">
                            Married: {new Date(marriage.dateOfMarriage).toLocaleDateString()}
                          </p>
                        )}
                        {marriage.endDate && (
                          <p className="text-xs text-red-700 mb-1">
                            {marriage.status === 'divorced' ? 'Divorced' : 'Widowed'}: {new Date(marriage.endDate).toLocaleDateString()}
                          </p>
                        )}
                        {marriage.children && marriage.children.length > 0 && (
                          <p className="text-xs text-blue-700">
                            Children together: {marriage.children.length}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(getTotalChildren(selectedPerson) > 0 || isMarriedOrHasBeenMarried(selectedPerson)) && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Users size={18} />
                    Children ({getTotalChildren(selectedPerson)})
                  </h4>
                  {getTotalChildren(selectedPerson) > 0 ? (
                    <div className="space-y-3">
                      {getChildrenByMarriage(selectedPerson).map((marriageGroup, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                          {getMarriages(selectedPerson).length > 1 && (
                            <p className="font-semibold text-blue-800 text-sm mb-2">
                              With {marriageGroup.marriage.spouseName}:
                            </p>
                          )}
                          {marriageGroup.children.length > 0 ? (
                            <div className="space-y-2">
                              {marriageGroup.children.map((child, childIdx) => (
                                <div key={childIdx} className="pl-3 border-l-2 border-blue-300">
                                  <p className="font-medium text-blue-900 text-sm">{child.name}</p>
                                  {child.dob && (
                                    <p className="text-xs text-blue-700">Born: {new Date(child.dob).toLocaleDateString()}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-blue-600 italic pl-3">No children together</p>
                          )}
                        </div>
                      ))}
                      
                      {/* Show any unassigned children (no parent assigned) */}
                      {(() => {
                        // Children WITH parents should not appear here
                        const childrenWithoutParents = (selectedPerson.children || [])
                          .map(childId => familyData.members.find(m => m.id === childId))
                          .filter(child => child && !child.parentId) // Only children WITHOUT a parent
                          .map(child => ({ name: child.fullName, dob: child.dateOfBirth }));
                        
                        if (childrenWithoutParents.length > 0) {
                          return (
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                              <p className="font-semibold text-yellow-800 text-sm mb-2">⚠️ Unassigned Children (no parent set):</p>
                              <div className="space-y-2">
                                {childrenWithoutParents.map((child, childIdx) => (
                                  <div key={childIdx} className="pl-3 border-l-2 border-yellow-300">
                                    <p className="font-medium text-yellow-900 text-sm">{child.name}</p>
                                    {child.dob && (
                                      <p className="text-xs text-yellow-700">Born: {new Date(child.dob).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-sm text-blue-600 italic">No children</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddForm && isAdmin && (
        <AnimatePresence>
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`${theme.cardBg} rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full border-4 ${theme.headerBorder} my-8`}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className={`bg-gradient-to-r ${theme.header} ${theme.headerText} p-4 sm:p-6 rounded-t-2xl flex justify-between items-center border-b-4 ${theme.headerBorder}`}>
                <h3 className="text-xl sm:text-2xl font-bold">{editingPerson ? 'Edit' : 'Add'} Family Member</h3>
                <motion.button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPerson(null);
                    resetForm();
                  }}
                  className={`${theme.primaryHover} p-2 rounded-lg transition-all`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Photo Upload Section */}
                <motion.div 
                  className={`${theme.cardBg} p-4 sm:p-6 rounded-2xl border-2 ${theme.cardBorder}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h4 className={`${theme.text} font-semibold mb-4 flex items-center gap-2`}>
                    <Camera size={20} />
                    Profile Photo
                  </h4>
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full overflow-hidden border-4 ${theme.cardBorder} shadow-lg shrink-0`}>
                      {croppedImage || formData.photo ? (
                        <img 
                          src={croppedImage || formData.photo} 
                          alt="Profile" 
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Camera size={24} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 sm:gap-3 items-start flex-wrap">
                        <label className="cursor-pointer inline-block">
                          <motion.div 
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg sm:rounded-xl transition-all flex items-center gap-2 shadow-lg font-bold text-xs sm:text-sm whitespace-nowrap hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Upload size={18} />
                            Upload
                          </motion.div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {(croppedImage || formData.photo) && (
                          <motion.button
                            onClick={() => {
                              setCroppedImage(null);
                              updateFormData({ ...formData, photo: null });
                            }}
                            className="px-3 sm:px-4 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl transition-all flex items-center gap-2 shadow-lg font-bold text-xs sm:text-sm hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X size={16} />
                            Remove
                          </motion.button>
                        )}
                      </div>
                      <p className={`${theme.textLight} text-xs mt-3 leading-relaxed`}>
                        📸 Recommended: 300x300px to 500x500px, Square format, Max 500KB
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Required Fields */}
                <motion.div 
                  className={`${theme.cardBg} p-4 sm:p-6 rounded-2xl border-2 ${theme.cardBorder}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className={`${theme.text} font-semibold mb-4`}>Required Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className={`block ${theme.text} font-semibold mb-2`}>Full Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateFormData({ ...formData, fullName: e.target.value })}
                        className={`w-full p-3 sm:p-4 border-2 rounded-xl focus:outline-none transition-all ${
                          formErrors.fullName 
                            ? 'border-red-500 focus:border-red-600 bg-red-50' 
                            : `${theme.cardBorder} focus:ring-2 focus:ring-opacity-50 bg-white`
                        }`}
                        placeholder="Enter full name"
                      />
                      {formErrors.fullName && (
                        <motion.p 
                          className="text-red-500 text-sm mt-1"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {formErrors.fullName}
                        </motion.p>
                      )}
                    </div>

                    {/* Adopted Checkbox */}
                    {familyData.members.length > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                        <input
                          type="checkbox"
                          id="isAdopted"
                          checked={formData.isAdopted}
                          onChange={(e) => updateFormData({ ...formData, isAdopted: e.target.checked })}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor="isAdopted" className={`${theme.text} font-semibold cursor-pointer flex-1`}>
                          Adopted?
                        </label>
                        <span className={`text-xs ${formData.isAdopted ? 'text-green-600' : 'text-gray-600'} font-medium`}>
                          {formData.isAdopted ? '✓ Yes' : 'No'}
                        </span>
                      </div>
                    )}

                    {/* Parent Selection - First Thing After Name */}
                    <div>
                      <label className={`block ${theme.text} font-semibold mb-2`}>
                        Parent {familyData.members.length > 0 ? '*' : '(Optional for first member)'}
                      </label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => {
                          const parentId = e.target.value ? parseInt(e.target.value) : null;
                          const parent = familyData.members.find(m => m.id === parentId);
                          
                          // Automatically set generation and potentially spouse
                          updateFormData({ 
                            ...formData, 
                            parentId,
                            generation: parent ? parent.generation + 1 : 1,
                            selectedMarriageForChild: null // Reset marriage selection
                          });
                        }}
                        className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                      >
                        <option value="">No parent (Root member)</option>
                        {familyData.members
                          .filter(member => {
                            // Don't show the person being edited
                            if (member.id === editingPerson?.id) return false;
                            
                            // If adopted, show ALL members as potential parents
                            if (formData.isAdopted) return true;
                            
                            // If NOT adopted (biological), show members with:
                            // - Marriages (coupled) OR
                            // - Marital status of 'married' OR
                            // - Spouse name set
                            const hasMarriages = (member.marriages && member.marriages.length > 0);
                            const isMarried = member.maritalStatus === 'married';
                            const hasSpouseName = member.spouseName && member.spouseName.trim().length > 0;
                            
                            return hasMarriages || isMarried || hasSpouseName;
                          })
                          .map(member => (
                            <option key={member.id} value={member.id}>
                              {member.fullName} (Gen {member.generation})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Spouse Selection - Only if parent has multiple marriages */}
                    {formData.parentId && (() => {
                      const parent = familyData.members.find(m => m.id === formData.parentId);
                      const parentMarriages = parent ? getMarriages(parent) : [];
                      
                      if (parentMarriages.length > 1) {
                        return (
                          <div>
                            <label className={`block ${theme.text} font-semibold mb-2`}>
                              Spouse * ({parent.fullName} has {parentMarriages.length} marriages)
                            </label>
                            <select
                              value={formData.selectedMarriageForChild || ''}
                              onChange={(e) => {
                                const marriageIndex = e.target.value ? parseInt(e.target.value) : null;
                                updateFormData({ 
                                  ...formData, 
                                  selectedMarriageForChild: marriageIndex
                                });
                              }}
                              className={`w-full p-3 sm:p-4 border-2 rounded-xl focus:outline-none ${
                                formErrors.selectedMarriageForChild 
                                  ? 'border-red-500 focus:border-red-600 bg-red-50' 
                                  : `${theme.cardBorder} focus:ring-2 focus:ring-opacity-50 bg-white`
                              }`}
                            >
                              <option value="">Select Spouse</option>
                              {parentMarriages.map((marriage, idx) => (
                                <option key={idx} value={idx}>
                                  {marriage.spouseName} (Married: {marriage.dateOfMarriage ? new Date(marriage.dateOfMarriage).getFullYear() : 'Unknown'})
                                </option>
                              ))}
                            </select>
                            {formErrors.selectedMarriageForChild && (
                              <motion.p 
                                className="text-red-500 text-sm mt-1"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                {formErrors.selectedMarriageForChild}
                              </motion.p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block ${theme.text} font-semibold mb-2`}>Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => updateFormData({ ...formData, gender: e.target.value })}
                          className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                        >
                          <option value="male">Male (Blue)</option>
                          <option value="female">Female (Pink)</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block ${theme.text} font-semibold mb-2`}>Marital Status</label>
                        <select
                          value={formData.maritalStatus}
                          onChange={(e) => updateFormData({ 
                            ...formData, 
                            maritalStatus: e.target.value,
                            spouseName: e.target.value !== 'married' ? '' : formData.spouseName,
                            dateOfMarriage: e.target.value !== 'married' ? '' : formData.dateOfMarriage
                          })}
                          className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                        >
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                    </div>

                    {(formData.maritalStatus !== 'single') && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {/* Simple Mode for single marriage */}
                        {!showAdvancedMarriages && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={`block ${theme.text} font-semibold mb-2`}>Spouse Name *</label>
                              <input
                                type="text"
                                value={formData.spouseName}
                                onChange={(e) => updateFormData({ ...formData, spouseName: e.target.value })}
                                className={`w-full p-3 sm:p-4 border-2 rounded-xl focus:outline-none transition-all ${
                                  formErrors.spouseName 
                                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                                    : `${theme.cardBorder} focus:ring-2 focus:ring-opacity-50 bg-white`
                                }`}
                                placeholder="Enter spouse's name"
                              />
                              {formErrors.spouseName && (
                                <motion.p 
                                  className="text-red-500 text-sm mt-1"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                >
                                  {formErrors.spouseName}
                                </motion.p>
                              )}
                            </div>
                            <div>
                              <label className={`block ${theme.text} font-semibold mb-2`}>Marriage Date</label>
                              <input
                                type="date"
                                value={formData.dateOfMarriage}
                                onChange={(e) => updateFormData({ ...formData, dateOfMarriage: e.target.value })}
                                className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Advanced Mode for multiple marriages */}
                        {showAdvancedMarriages && (
                          <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                            <h5 className="text-red-900 font-semibold mb-3 flex items-center gap-2">
                              <Heart size={16} className="text-red-500" />
                              Marriage History
                            </h5>
                            
                            {(formData.marriages || []).length === 0 && (
                              <p className="text-red-700 text-sm italic mb-3">No marriages added yet. Click "Add Marriage" to start.</p>
                            )}
                            
                            {(formData.marriages || []).map((marriage, index) => (
                              <div key={marriage.id || index} className="bg-white p-4 rounded-lg border border-red-300 mb-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h6 className="font-semibold text-red-900">Marriage {index + 1}</h6>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedMarriages = formData.marriages.filter((_, i) => i !== index);
                                      updateFormData({ ...formData, marriages: updatedMarriages });
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Remove this marriage"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-sm font-medium text-red-800 mb-1">Spouse Name *</label>
                                    <input
                                      type="text"
                                      value={marriage.spouseName || ''}
                                      onChange={(e) => {
                                        const updatedMarriages = [...(formData.marriages || [])];
                                        updatedMarriages[index] = { ...marriage, spouseName: e.target.value };
                                        updateFormData({ ...formData, marriages: updatedMarriages });
                                      }}
                                      className="w-full p-2 border border-red-300 rounded focus:border-red-500 focus:outline-none text-sm"
                                      placeholder="Spouse name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-red-800 mb-1">Status</label>
                                    <select
                                      value={marriage.status || 'current'}
                                      onChange={(e) => {
                                        const updatedMarriages = [...(formData.marriages || [])];
                                        updatedMarriages[index] = { ...marriage, status: e.target.value };
                                        updateFormData({ ...formData, marriages: updatedMarriages });
                                      }}
                                      className="w-full p-2 border border-red-300 rounded focus:border-red-500 focus:outline-none text-sm"
                                    >
                                      <option value="current">Current</option>
                                      <option value="divorced">Divorced</option>
                                      <option value="widowed">Widowed</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-sm font-medium text-red-800 mb-1">Marriage Date</label>
                                    <input
                                      type="date"
                                      value={marriage.dateOfMarriage || ''}
                                      onChange={(e) => {
                                        const updatedMarriages = [...(formData.marriages || [])];
                                        updatedMarriages[index] = { ...marriage, dateOfMarriage: e.target.value };
                                        updateFormData({ ...formData, marriages: updatedMarriages });
                                      }}
                                      className="w-full p-2 border border-red-300 rounded focus:border-red-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  {marriage.status !== 'current' && (
                                    <div>
                                      <label className="block text-sm font-medium text-red-800 mb-1">
                                        {marriage.status === 'divorced' ? 'Divorce Date' : 'Death Date'}
                                      </label>
                                      <input
                                        type="date"
                                        value={marriage.endDate || ''}
                                        onChange={(e) => {
                                          const updatedMarriages = [...(formData.marriages || [])];
                                          updatedMarriages[index] = { ...marriage, endDate: e.target.value };
                                          updateFormData({ ...formData, marriages: updatedMarriages });
                                        }}
                                        className="w-full p-2 border border-red-300 rounded focus:border-red-500 focus:outline-none text-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Children Assignment Section */}
                                <div className="border-t border-red-200 pt-3">
                                  <label className="block text-sm font-medium text-red-800 mb-2">
                                    Children from this marriage ({(marriage.children || []).length})
                                  </label>
                                  {(() => {
                                    // Get all children of this person (only from next generation)
                                    const currentGeneration = editingPerson ? editingPerson.generation : (formData.generation || 1);
                                    const allChildren = familyData.members.filter(member => 
                                      member.generation === currentGeneration + 1 && (
                                        member.parentId === (editingPerson ? editingPerson.id : null) ||
                                        (formData.children || []).includes(member.id)
                                      )
                                    );
                                    
                                    if (allChildren.length === 0) {
                                      return (
                                        <p className="text-xs text-gray-600 italic">No children to assign</p>
                                      );
                                    }
                                    
                                    return (
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {allChildren.map(child => {
                                          const isAssigned = (marriage.children || []).includes(child.id);
                                          return (
                                            <div key={child.id} className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={isAssigned}
                                                onChange={(e) => {
                                                  const updatedMarriages = [...(formData.marriages || [])];
                                                  const currentChildren = marriage.children || [];
                                                  
                                                  if (e.target.checked) {
                                                    // Add child to this marriage
                                                    updatedMarriages[index] = { 
                                                      ...marriage, 
                                                      children: [...currentChildren, child.id] 
                                                    };
                                                    
                                                    // Remove child from other marriages
                                                    updatedMarriages.forEach((otherMarriage, otherIndex) => {
                                                      if (otherIndex !== index && otherMarriage.children) {
                                                        otherMarriage.children = otherMarriage.children.filter(childId => childId !== child.id);
                                                      }
                                                    });
                                                  } else {
                                                    // Remove child from this marriage
                                                    updatedMarriages[index] = { 
                                                      ...marriage, 
                                                      children: currentChildren.filter(childId => childId !== child.id)
                                                    };
                                                  }
                                                  
                                                  updateFormData({ ...formData, marriages: updatedMarriages });
                                                }}
                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                              />
                                              <label className="text-sm text-gray-700 flex-1">
                                                {child.fullName}
                                                {child.dateOfBirth && (
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    (Born: {new Date(child.dateOfBirth).toLocaleDateString()})
                                                  </span>
                                                )}
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => {
                                const newMarriage = {
                                  id: Date.now(),
                                  spouseName: '',
                                  status: 'current',
                                  dateOfMarriage: '',
                                  endDate: null,
                                  children: []
                                };
                                updateFormData({ 
                                  ...formData, 
                                  marriages: [...(formData.marriages || []), newMarriage] 
                                });
                              }}
                              className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              Add Marriage
                            </button>
                          </div>
                        )}

                        {/* Toggle between simple and advanced mode */}
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAdvancedMarriages(!showAdvancedMarriages);
                              // Convert simple marriage to advanced format when switching
                              if (!showAdvancedMarriages && formData.spouseName) {
                                const existingMarriage = {
                                  id: Date.now(),
                                  spouseName: formData.spouseName,
                                  status: formData.maritalStatus === 'married' ? 'current' : formData.maritalStatus,
                                  dateOfMarriage: formData.dateOfMarriage,
                                  endDate: null,
                                  children: formData.children || []
                                };
                                updateFormData({ 
                                  ...formData, 
                                  marriages: [existingMarriage] 
                                });
                              }
                            }}
                            className="text-red-600 text-sm hover:text-red-800 underline"
                          >
                            {showAdvancedMarriages ? 'Switch to Simple Mode' : 'Add Multiple Marriages'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Optional Fields with improved switches */}
                <motion.div 
                  className={`${theme.cardBg} p-4 sm:p-6 rounded-2xl border-2 ${theme.cardBorder}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className={`${theme.text} font-semibold mb-4`}>Optional Information</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                    {Object.entries({
                      birthDate: 'Add Birth Date',
                      birthStar: 'Add Birth Star',
                      nicknames: 'Add Nicknames',
                    }).map(([key, label]) => (
                      <div key={key} className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.cardBorder}`}>
                        <span className={`${theme.text} font-medium text-sm sm:text-base`}>{label}</span>
                        <Switch
                          checked={showOptionalFields[key]}
                          onChange={(checked) => setShowOptionalFields({...showOptionalFields, [key]: checked})}
                          className={`${
                            showOptionalFields[key] ? 'bg-green-600' : 'bg-gray-300'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                        >
                          <span
                            className={`${
                              showOptionalFields[key] ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    ))}
                    
                    <div className={`flex items-center justify-between p-3 bg-white rounded-xl border ${theme.cardBorder}`}>
                      <span className={`${theme.text} font-medium text-sm sm:text-base`}>Person is deceased</span>
                      <Switch
                        checked={!formData.isLiving}
                        onChange={(checked) => {
                          updateFormData({ ...formData, isLiving: !checked, dateOfDeath: checked ? formData.dateOfDeath : '' });
                          setShowOptionalFields({...showOptionalFields, deathDate: checked});
                        }}
                        className={`${
                          !formData.isLiving ? 'bg-red-600' : 'bg-gray-300'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                      >
                        <span
                          className={`${
                            !formData.isLiving ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>

                  {/* Dynamic optional fields */}
                  <AnimatePresence>
                    {showOptionalFields.birthDate && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className={`block ${theme.text} font-semibold mb-2`}>Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => updateFormData({ ...formData, dateOfBirth: e.target.value })}
                          className={`w-full p-3 sm:p-4 border-2 rounded-xl focus:outline-none transition-all ${
                            formErrors.dateOfBirth 
                              ? 'border-red-500 focus:border-red-600 bg-red-50' 
                              : `${theme.cardBorder} focus:ring-2 focus:ring-opacity-50 bg-white`
                          }`}
                        />
                        {formErrors.dateOfBirth && (
                          <motion.p 
                            className="text-red-500 text-sm mt-1"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {formErrors.dateOfBirth}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {showOptionalFields.birthStar && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className={`block ${theme.text} font-semibold mb-2`}>Birth Star</label>
                        <input
                          type="text"
                          value={formData.birthStar}
                          onChange={(e) => updateFormData({ ...formData, birthStar: e.target.value })}
                          className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                          placeholder="e.g., Ashwini, Bharani"
                        />
                      </motion.div>
                    )}

                    {showOptionalFields.nicknames && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className={`block ${theme.text} font-semibold mb-2`}>Nicknames</label>
                        <input
                          type="text"
                          value={formData.nicknames}
                          onChange={(e) => updateFormData({ ...formData, nicknames: e.target.value })}
                          className={`w-full p-3 sm:p-4 border-2 ${theme.cardBorder} rounded-xl focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white`}
                          placeholder="Any nicknames or pet names"
                        />
                      </motion.div>
                    )}

                    {/* Parent-Child Swap Section - When root member gets a parent */}
                    {editingPerson && isRootMember(editingPerson) && formData.parentId && showOptionalFields.parent && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-xl border-2 border-orange-300">
                          <label className="block text-orange-900 font-semibold mb-2 flex items-center gap-2">
                            <AlertCircle size={20} />
                            Children Transfer Options (Optional)
                          </label>
                          <p className="text-sm text-orange-700 mb-3">
                            {editingPerson.fullName} has {(editingPerson.children || []).length} child(ren). 
                            By default, they will remain with {editingPerson.fullName} (become grandchildren). 
                            You can optionally select children to move to {familyData.members.find(m => m.id === formData.parentId)?.fullName || 'the new root'}.
                          </p>
                          
                          {(() => {
                            const oldParentChildren = (editingPerson.children || []).filter(id => id !== formData.parentId);
                            
                            if (oldParentChildren.length === 0) {
                              return (
                                <p className="text-sm text-gray-600 italic">
                                  No children to transfer.
                                </p>
                              );
                            }
                            
                            return (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {oldParentChildren.map(childId => {
                                  const child = familyData.members.find(m => m.id === childId);
                                  if (!child) return null;
                                  
                                  const isSelected = childrenToMoveInSwap.includes(childId);
                                  
                                  return (
                                    <div 
                                      key={childId}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        isSelected 
                                          ? 'bg-orange-100 border-orange-400' 
                                          : 'bg-white border-gray-200 hover:border-orange-300'
                                      }`}
                                    >
                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setChildrenToMoveInSwap(prev => [...prev, childId]);
                                            } else {
                                              setChildrenToMoveInSwap(prev => prev.filter(id => id !== childId));
                                            }
                                          }}
                                          className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-800">
                                            {child.fullName}
                                            {child.gender === 'male' ? ' ♂' : ' ♀'}
                                          </div>
                                          {child.dateOfBirth && (
                                            <div className="text-sm text-gray-600">
                                              Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                                            </div>
                                          )}
                                          {isSelected && (
                                            <div className="text-xs text-orange-700 mt-1 bg-orange-50 px-2 py-1 rounded">
                                              Will be moved to {familyData.members.find(m => m.id === formData.parentId)?.fullName || 'new root'} (Gen 1)
                                            </div>
                                          )}
                                          {!isSelected && (
                                            <div className="text-xs text-gray-600 mt-1">
                                              Will stay with {editingPerson.fullName} (Gen 2 - grandchild)
                                            </div>
                                          )}
                                        </div>
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          
                          <div className="mt-3 text-sm text-orange-800 bg-orange-100 p-2 rounded">
                            ℹ️ {childrenToMoveInSwap.length} child(ren) will move to new root. 
                            {(editingPerson.children || []).length - childrenToMoveInSwap.length - (editingPerson.children?.includes(formData.parentId) ? 1 : 0)} will stay with {editingPerson.fullName}.
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Children linking section - for root members (editing or adding new with no parent) */}
                    {/* Show ONLY if form state has no parent - reactive to current form selection */}
                    {((editingPerson && !formData.parentId && showOptionalFields.parent) || (!editingPerson && !formData.parentId && showOptionalFields.parent)) && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                          <label className="block text-blue-900 font-semibold mb-2 flex items-center gap-2">
                            <Users size={20} />
                            Link Children to Root Member {!editingPerson && "(Optional)"}
                          </label>
                          <p className="text-sm text-blue-700 mb-3">
                            {editingPerson 
                              ? "Select children to link. When you select a child who has siblings, all siblings will be automatically linked."
                              : "You can optionally link existing children to this root member. When you select a child who has siblings, all siblings will be automatically linked."
                            }
                          </p>
                          
                          {(() => {
                            // Create a temporary root member object based on current form state
                            // This allows us to show potential children even when changing someone to a root
                            const currentRootMember = editingPerson 
                              ? { ...editingPerson, parentId: formData.parentId || null }  // Use form's parent state
                              : null;
                            
                            // Find potential children based on whether we're editing or adding new
                            const potentialChildren = currentRootMember 
                              ? findPotentialChildren(currentRootMember)
                              : (familyData.members || []).filter(member => {
                                  if (!member) return false;
                                  
                                  // When adding new root, show all members without a parent
                                  // (including other roots, for tree reorganization)
                                  return !member.parentId;
                                });
                            
                            if (potentialChildren.length === 0) {
                              return (
                                <p className="text-sm text-gray-600 italic">
                                  No potential children available to link. {!editingPerson && "You can add children later."}
                                </p>
                              );
                            }
                            
                            return (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {potentialChildren.map(child => {
                                  const isSelected = selectedChildrenToLink.includes(child.id);
                                  const siblings = child.parentId ? getSiblings(child.id) : [];
                                  const hasOtherParent = child.parentId && editingPerson && child.parentId !== editingPerson.id;
                                  
                                  return (
                                    <div 
                                      key={child.id}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        isSelected 
                                          ? 'bg-blue-100 border-blue-400' 
                                          : 'bg-white border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedChildrenToLink(prev => [...prev, child.id]);
                                            } else {
                                              setSelectedChildrenToLink(prev => prev.filter(id => id !== child.id));
                                            }
                                          }}
                                          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-800">
                                            {child.fullName}
                                            {child.gender === 'male' ? ' ♂' : ' ♀'}
                                          </div>
                                          {child.dateOfBirth && (
                                            <div className="text-sm text-gray-600">
                                              Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                                            </div>
                                          )}
                                          {siblings.length > 0 && (
                                            <div className="text-xs text-blue-700 mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
                                              ℹ️ Has {siblings.length} sibling{siblings.length > 1 ? 's' : ''} - will be auto-linked
                                            </div>
                                          )}
                                          {hasOtherParent && (
                                            <div className="text-xs text-orange-700 mt-1 bg-orange-50 px-2 py-1 rounded inline-block">
                                              ⚠️ Currently linked to another parent - will be updated
                                            </div>
                                          )}
                                        </div>
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          
                          {selectedChildrenToLink.length > 0 && (
                            <motion.div 
                              className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <p className="text-sm text-green-800 font-semibold">
                                ✅ {selectedChildrenToLink.length} child{selectedChildrenToLink.length > 1 ? 'ren' : ''} selected
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {!formData.isLiving && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-red-900 font-semibold mb-2">Date of Death</label>
                        <input
                          type="date"
                          value={formData.dateOfDeath}
                          onChange={(e) => updateFormData({ ...formData, dateOfDeath: e.target.value })}
                          className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                            formErrors.dateOfDeath 
                              ? 'border-red-500 focus:border-red-600 bg-red-50' 
                              : 'border-red-300 focus:border-red-600 bg-white'
                          }`}
                        />
                        {formErrors.dateOfDeath && (
                          <motion.p 
                            className="text-red-500 text-sm mt-1"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {formErrors.dateOfDeath}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Validation Summary */}
                <AnimatePresence>
                  {Object.keys(formErrors).length > 0 && (
                    <motion.div 
                      className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <h4 className="text-red-800 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        Please fix the following errors:
                      </h4>
                      <ul className="text-red-600 space-y-1">
                        {Object.values(formErrors).map((error, index) => (
                          <motion.li 
                            key={index}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <span className="text-red-500">•</span>
                            {error}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={editingPerson ? handleEditPerson : handleAddPerson}
                    disabled={!isFormValid}
                    className={`flex-1 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isFormValid 
                        ? `bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white` 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    whileHover={isFormValid ? { scale: 1.05 } : {}}
                    whileTap={isFormValid ? { scale: 0.95 } : {}}
                  >
                    <Save size={20} />
                    {editingPerson ? 'Save Changes' : 'Add Person'}
                  </motion.button>
                  {editingPerson && (
                    <motion.button
                      onClick={() => confirmDelete(editingPerson)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-xl">🗑️</span>
                      Delete
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPerson(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                    Cancel
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Image Crop Modal */}
      <AnimatePresence>
        {showImageCrop && imageToCrop && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-blue-300 bg-gradient-to-r from-blue-600 to-blue-700">
                <div>
                  <h3 className="text-xl font-bold text-white">📸 Crop Your Photo</h3>
                  <p className="text-sm text-blue-100 mt-1">Drag the selection to frame the face/head area</p>
                </div>
                <button
                  onClick={() => {
                    setShowImageCrop(false);
                    setImageToCrop(null);
                  }}
                  className="text-blue-100 hover:text-white p-2 hover:bg-blue-500 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Crop Area */}
              <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <ReactCrop
                      crop={crop}
                      onChange={(newCrop) => setCrop(newCrop)}
                      aspect={1}
                      circularCrop={false}
                      minWidth={100}
                      minHeight={100}
                      keepSelection
                    >
                      <img 
                        src={imageToCrop} 
                        alt="Crop preview" 
                        className="max-w-full max-h-[calc(90vh-300px)] w-auto h-auto rounded-lg shadow-md border-4 border-blue-200"
                        style={{ display: 'block', margin: '0 auto' }}
                      />
                    </ReactCrop>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    <p>✂️ Select a square area that captures face/shoulders</p>
                  </div>
                </div>
              </div>
              
              {/* Info and Actions */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900 font-medium flex items-center gap-2 mb-2">
                    <Check size={16} className="text-green-600" />
                    <span>Pro Tips:</span>
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1 ml-6">
                    <li>• Center the face in the square</li>
                    <li>• Include shoulders for better framing</li>
                    <li>• Avoid too much background</li>
                    <li>• The circle will auto-center your cropped image</li>
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowImageCrop(false);
                      setImageToCrop(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleCropComplete}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Check size={18} />
                    ✓ Apply & Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirmation && personToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4 border-red-800">
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-50 p-6 rounded-t-xl border-b-4 border-red-700">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-red-800 text-xl">⚠</span>
                </div>
                Confirm Deletion
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto border-4 border-red-300">
                    <span className="text-3xl text-red-600">👤</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-red-900 mb-2">
                  Delete {personToDelete.fullName}?
                </h4>
                <p className="text-red-700 mb-4">
                  This action will permanently remove <strong>{personToDelete.fullName}</strong> from the family tree.
                </p>
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-sm">
                  <p className="text-red-800 font-semibold mb-2">⚠️ Warning:</p>
                  <ul className="text-red-700 space-y-1 text-left">
                    <li>• This action cannot be undone</li>
                    <li>• All family connections will be removed</li>
                    <li>• Children will become orphaned records</li>
                    <li>• Marriage information will be lost</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleDeletePerson}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🗑️</span>
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`
                relative max-w-sm p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-sm
                ${notification.type === 'success' ? 'bg-green-50/95 border-green-500 text-green-800' : ''}
                ${notification.type === 'error' ? 'bg-red-50/95 border-red-500 text-red-800' : ''}
                ${notification.type === 'info' ? 'bg-blue-50/95 border-blue-500 text-blue-800' : ''}
                ${notification.type === 'warning' ? 'bg-yellow-50/95 border-yellow-500 text-yellow-800' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${notification.type === 'success' ? 'bg-green-500' : ''}
                    ${notification.type === 'error' ? 'bg-red-500' : ''}
                    ${notification.type === 'info' ? 'bg-blue-500' : ''}
                    ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                  `}></div>
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FamilyTreeApp;