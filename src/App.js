import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Users, Home, Upload, Heart, Star, LogOut, Save, Check, Lock, User, Camera, AlertCircle } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { familyTreeService } from './services/familyTreeService';
import InitialSetup from './components/InitialSetup';
const FamilyTreeApp = () => {
  const [scene, setScene] = useState('entry');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
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

  const [formData, setFormData] = useState({
    id: Date.now(),
    fullName: '',
    gender: 'male', // Add gender field
    dateOfBirth: '',
    dateOfDeath: '',
    isLiving: true,
    maritalStatus: 'single',
    spouseName: '',
    dateOfMarriage: '',
    children: [],
    birthStar: '',
    nicknames: '',
    parentId: null,
    generation: 0,
    photo: null // Add photo field
  });

  useEffect(() => {
    const initializeApp = async () => {
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath === '/admin';
      const isRegisterRoute = currentPath === '/register';
      
      // Handle /register route - show registration for new family trees
      if (isRegisterRoute) {
        setNeedsInitialSetup(true);
        setCheckingSetup(false);
        return;
      }
      
      // Handle /admin route - show admin login
      if (isAdminRoute) {
        setShowAdminLogin(true);
        setCheckingSetup(false);
        return;
      }
      
      // For root route (/), always try to load and show public family tree
      const result = await familyTreeService.loadFamilyTree();
      if (result.success && result.data) {
        setFamilyData(result.data);
        document.title = `${result.data.surname} `;
        
        // Data integrity will be checked in separate useEffect
      } else {
        // No family tree exists yet, show empty state with register option
        const emptyData = {
          surname: 'Family',
          members: []
        };
        setFamilyData(emptyData);
        document.title = 'Family Tree';
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

  const validateForm = (data = formData) => {
    const errors = {};
    
    // Required field validation
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required';
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
    
    // Marriage validation - only if married
    if (data.maritalStatus === 'married') {
      if (!data.spouseName.trim()) {
        errors.spouseName = 'Spouse name is required for married persons';
      }
      
      if (!data.dateOfMarriage) {
        errors.dateOfMarriage = 'Marriage date is required for married persons';
      } else {
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
      showNotification('Please fix the validation errors before submitting', 'warning');
      return;
    }
    
    const newPerson = {
      ...formData,
      id: Date.now(),
      children: []
    };

    let updatedMembers = (familyData.members || []).map(member => {
      if (member && member.id === formData.parentId) {
        return {
          ...member,
          children: [...(member.children || []), newPerson.id]
        };
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
        showNotification(`✅ ${newPerson.fullName} added with ${selectedChildrenToLink.length} child${selectedChildrenToLink.length > 1 ? 'ren' : ''}`, 'success');
      } else {
        showNotification(`✅ ${newPerson.fullName} added to family tree`, 'success');
      }
    } else {
      showNotification(`✅ ${newPerson.fullName} added to family tree`, 'success');
    }

    const updatedData = {
      ...familyData,
      members: [...updatedMembers, newPerson]
    };

    setFamilyData(updatedData);
    setShowAddForm(false);
    setSelectedChildrenToLink([]);
    setChildrenToMoveInSwap([]);
    resetForm();
    
    // Auto-save to database
    await saveToDatabase(updatedData);
  };

  const handleEditPerson = async () => {
    if (!validateForm()) {
      showNotification('Please fix the validation errors before submitting', 'warning');
      return;
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
          showNotification(`✅ ${editingPerson.fullName} updated successfully`, 'success');
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
      
      showNotification(`✅ ${editingPerson.fullName} is now a root member`, 'success');
    }
    // SCENARIO 4: Regular edit (not involving root changes)
    else {
      // Not editing root member, update normally
      updatedMembers = updatedMembers.map(member => 
        member.id === editingPerson.id ? { ...formData, id: editingPerson.id } : member
      );
      showNotification(`✅ ${editingPerson.fullName} updated successfully`, 'success');
    }

    const updatedData = {
      ...familyData,
      members: updatedMembers
    };

    setFamilyData(updatedData);
    setShowAddForm(false);
    setEditingPerson(null);
    setSelectedChildrenToLink([]);
    setChildrenToMoveInSwap([]);
    resetForm();
    
    // Auto-save to database
    await saveToDatabase(updatedData);
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

    const updatedData = {
      ...familyData,
      members: updatedMembers
    };

    setFamilyData(updatedData);
    setShowAddForm(false);
    setEditingPerson(null);
    setShowDeleteConfirmation(false);
    showNotification(`🗑️ ${personToDelete.fullName} removed from family tree`, 'info');
    setPersonToDelete(null);
    resetForm();
    
    // Auto-save to database
    await saveToDatabase(updatedData);
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target.result);
        // Initialize crop with a proper default
        setCrop({
          unit: '%',
          width: 50,
          height: 50,
          x: 25,
          y: 25,
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
    
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    
    return canvas.toDataURL('image/jpeg', 0.8);
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
    setFamilyData({
      surname: adminInfo.familyName,
      members: []
    });
    document.title = `${adminInfo.familyName} Family Tree`;
    
    // Show success message
    showNotification('🎉 Setup completed! You can now access /admin to manage your tree', 'success', 5000);
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
      children: [],
      birthStar: '',
      nicknames: '',
      parentId: null,
      generation: 0,
      photo: null
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
    
    const result = await familyTreeService.verifyAdminLogin(
      adminCredentials.username, 
      adminCredentials.password
    );
    
    if (result.success) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      // Load the family tree data after successful login
      const treeResult = await familyTreeService.loadFamilyTree();
      if (treeResult.success && treeResult.data) {
        setFamilyData(treeResult.data);
      }
      showNotification('✅ Admin logged in', 'success');
    } else {
      showNotification('Invalid admin credentials. Please try again.', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    // Redirect to public view
    window.history.pushState({}, '', '/');
    window.location.reload();
  };

  const saveToDatabase = async (data = familyData) => {
    if (!isAdmin) {
      showNotification('Only admins can save changes. Please log in at /admin', 'warning');
      return;
    }
    
    showNotification('Saving...', 'info', 1000);
    
    const result = await familyTreeService.saveFamilyTree(data);
    
    if (result.success) {
      showNotification('✅ Saved successfully', 'success');
    } else {
      showNotification('❌ Save failed', 'error');
    }
  };



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
  const showNotification = (message, type = 'success', duration = 3000) => {
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
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

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
    setFormData(person);
    setCroppedImage(person.photo); // Set cropped image to existing photo
    setShowAddForm(true);
    
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

  const renderPersonCard = (person, index) => {
    const childrenInfo = getChildrenInfo(person.children);
    
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
    const cardWidth = isMobile ? 180 : 240;
    const cardSpacing = isMobile ? 20 : 30; // Spacing between cards
    const startX = isMobile ? 20 : 50;
    const generationY = isMobile ? 80 + person.generation * 240 : 100 + person.generation * 260;
    
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
      const containerWidth = isMobile ? window.innerWidth - 40 : 1400;
      const spacingAdjustment = Math.max(0, (containerWidth - totalWidth) / (totalInGeneration + 1));
      horizontalPosition = startX + spacingAdjustment + (positionInGeneration * (cardWidth + cardSpacing));
    }

    // Gender-based styling
    const isMale = person.gender === 'male';
    const cardWidthPx = isMobile ? '180px' : '240px'; // Match positioning logic
    const cardHeight = isMobile ? '200px' : '240px';

    return (
      <motion.div
        key={person.id}
        className="person-card absolute transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          left: `${horizontalPosition}px`,
          top: `${generationY}px`,
          width: cardWidthPx,
          height: cardHeight,
          zIndex: 10
        }}
        onClick={() => setSelectedPerson(person)}
        whileHover={{ scale: 1.05, rotateY: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-br from-white via-amber-50 to-orange-50 border-4 border-amber-800 rounded-2xl p-3 shadow-2xl hover:shadow-amber-900/50 h-full flex flex-col backdrop-blur-sm relative overflow-hidden">
          {/* Enhanced background texture */}
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg"></div>
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 69, 19, 0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            {/* Photo or Gender Symbol */}
            <div className={`w-12 h-12 flex items-center justify-center font-bold border-3 shadow-lg overflow-hidden ${
              isMale 
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-800 text-white rounded-lg' 
                : 'bg-gradient-to-br from-pink-400 to-pink-600 border-pink-800 text-white rounded-full'
              }`}
            >
              {person.photo ? (
                <img 
                  src={person.photo} 
                  alt={person.fullName}
                  className={`w-full h-full object-cover ${isMale ? 'rounded-sm' : 'rounded-full'}`}
                />
              ) : (
                <div className="text-lg font-bold">
                  {isMale ? '♂' : '♀'}
                </div>
              )}
            </div>
            {isAdmin && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditForm(person);
                }}
                className="control-btn text-amber-700 hover:text-amber-900 transition-colors p-2 bg-white/80 rounded-xl shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit2 size={16} />
              </motion.button>
            )}
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="text-base font-bold text-amber-900 mb-1 leading-tight line-clamp-2">
              {person.fullName}
            </h3>
            <div className="space-y-0.5 text-xs">
              {person.dateOfBirth && (
                <p className="text-amber-700 font-medium">
                  Born: {new Date(person.dateOfBirth).toLocaleDateString()}
                </p>
              )}
              {!person.isLiving && person.dateOfDeath && (
                <p className="text-amber-700 font-medium">
                  Died: {new Date(person.dateOfDeath).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="mt-auto pt-2 relative z-10">
            {/* Compact info badges - stacked vertically to prevent wrapping */}
            <div className="space-y-1">
              {/* First row: Living status and marriage */}
              <div className="flex items-center gap-1">
                {person.isLiving && (
                  <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs rounded-full font-medium shadow-sm">
                    Living
                  </span>
                )}
                {person.maritalStatus === 'married' && (
                  <div className="flex items-center gap-1 text-xs text-red-700 bg-red-50/80 rounded-full px-2 py-0.5 border border-red-200 flex-1 min-w-0">
                    <Heart size={8} className="text-red-500 flex-shrink-0" />
                    <span className="truncate font-medium">♥ {person.spouseName}</span>
                  </div>
                )}
              </div>
              {/* Second row: Children count */}
              {childrenInfo.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50/80 rounded-full px-2 py-0.5 border border-blue-200 w-fit">
                  <Users size={8} className="text-blue-600" />
                  <span className="font-medium">{childrenInfo.length} {childrenInfo.length === 1 ? 'child' : 'children'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderConnections = () => {
    return familyData.members.map(person => {
      if (person.parentId) {
        const parent = familyData.members.find(m => m.id === person.parentId);
        if (parent) {
          // Use the same family-based positioning logic as in renderPersonCard
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
            const cardWidth = isMobile ? 180 : 240;
            const cardSpacing = isMobile ? 20 : 30;
            const startX = isMobile ? 20 : 50;
            
            let horizontalPosition;
            if (totalInGeneration === 1) {
              horizontalPosition = isMobile ? startX + 200 : startX + 400;
            } else {
              const totalWidth = totalInGeneration * cardWidth;
              const containerWidth = isMobile ? window.innerWidth - 40 : 1400;
              const spacingAdjustment = Math.max(0, (containerWidth - totalWidth) / (totalInGeneration + 1));
              horizontalPosition = startX + spacingAdjustment + (positionInGeneration * (cardWidth + cardSpacing));
            }
            
            return horizontalPosition;
          };
          
          // Calculate positions for parent and child
          const isMobile = window.innerWidth < 768;
          const parentX = calculatePositionForPerson(parent);
          const parentY = isMobile ? 80 + parent.generation * 240 + 100 : 100 + parent.generation * 260 + 120;
          
          const childX = calculatePositionForPerson(person);
          const childY = isMobile ? 80 + person.generation * 240 + 100 : 100 + person.generation * 260 + 120;

          return (
            <line
              key={`${person.id}-connection`}
              x1={parentX}
              y1={parentY}
              x2={childX}
              y2={childY}
              stroke="#92400e"
              strokeWidth="3"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          );
        }
      }
      return null;
    }).filter(Boolean);
  };

  // Show loading screen while checking setup
  if (checkingSetup) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Users className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-amber-900 mb-2">Loading Family Tree</h2>
          <p className="text-amber-700">Setting up your experience...</p>
        </motion.div>
      </div>
    );
  }

  // Show initial setup if no admin exists
  if (needsInitialSetup) {
    return <InitialSetup onSetupComplete={handleSetupComplete} />;
  }

  // Admin Login Modal
  if (showAdminLogin) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-amber-900 via-orange-800 to-amber-700 flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock size={48} className="mx-auto text-amber-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Admin Access</h2>
            <p className="text-gray-600 mt-2">Enter your credentials to edit the family tree</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <User size={20} />
              Login as Admin
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => {
                setShowAdminLogin(false);
                window.history.pushState({}, '', '/');
                window.location.reload();
              }}
              className="text-amber-600 hover:text-amber-800 text-sm block w-full"
            >
              ← Back to Public View
            </button>
            <div className="text-gray-500 text-xs">
              Don't have admin access? <a href="/register" className="text-amber-600 hover:text-amber-800 font-semibold">Create New Family Tree</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scene === 'entry') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center overflow-hidden relative">
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
        
        <div className="text-center animate-fade-in relative z-10">
          <div className="mb-8">
            <div className="relative">
              <Home size={80} className="mx-auto text-amber-100 animate-pulse drop-shadow-2xl" />
              <div className="absolute inset-0 mx-auto w-20 h-20 bg-amber-100/20 rounded-full blur-xl"></div>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-amber-50 mb-4 font-serif drop-shadow-2xl">
            The {familyData.surname}
          </h1>
          <p className="text-2xl text-amber-200 mb-12 italic drop-shadow-lg">A Living House of Memories</p>
          
          <button
            onClick={enterHouse}
            className="group relative px-12 py-5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 text-xl font-bold rounded-xl shadow-2xl hover:shadow-amber-900/50 transition-all duration-500 transform hover:scale-110 border-4 border-amber-800 backdrop-blur-sm"
          >
            <span className="flex items-center gap-3">
              Open the Door
              <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 to-amber-200/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 overflow-hidden relative" style={{ touchAction: 'none' }}>
      {/* Enhanced background textures with brick wall pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(251, 191, 36, 0.3) 0%, transparent 50%), 
                         radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
                         radial-gradient(circle at 40% 40%, rgba(217, 119, 6, 0.2) 0%, transparent 50%)`
      }}></div>
      
      {/* Brick Wall Pattern Background */}
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(139, 69, 19, 0.4) 1px, transparent 1px),
          linear-gradient(180deg, rgba(139, 69, 19, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(160, 82, 45, 0.3) 1px, transparent 1px),
          linear-gradient(180deg, rgba(160, 82, 45, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '120px 40px, 120px 40px, 60px 20px, 60px 20px',
        backgroundPosition: '0 0, 0 0, 60px 20px, 60px 20px'
      }}></div>
      
      {/* Brick texture overlay */}
      <div className="absolute inset-0 opacity-8" style={{
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            rgba(139, 69, 19, 0.1) 0px,
            rgba(139, 69, 19, 0.1) 2px,
            transparent 2px,
            transparent 40px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(160, 82, 45, 0.1) 0px,
            rgba(160, 82, 45, 0.1) 2px,
            transparent 2px,
            transparent 120px
          )
        `
      }}></div>
      
      {/* Mortar lines for realistic brick effect */}
      <div className="absolute inset-0 opacity-12" style={{
        backgroundImage: `
          linear-gradient(0deg, rgba(139, 69, 19, 0.3) 0%, rgba(139, 69, 19, 0.3) 100%),
          linear-gradient(90deg, rgba(139, 69, 19, 0.3) 0%, rgba(139, 69, 19, 0.3) 100%)
        `,
        backgroundSize: '1px 40px, 120px 1px',
        backgroundPosition: '0 0, 0 0'
      }}></div>
      
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 12px)`,
      }}></div>

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-900 via-orange-900 to-amber-900 text-amber-50 p-6 shadow-2xl z-30 border-b-4 border-amber-700 backdrop-blur-sm">
        {/* Header with enhanced styling */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-800/50 to-orange-800/50"></div>
        <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4">
            {showSurnameEdit ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={tempSurname}
                  onChange={(e) => setTempSurname(e.target.value)}
                  className="text-xl font-bold bg-white text-amber-900 border border-amber-300 rounded px-2 py-1"
                  placeholder="Family Name"
                  onKeyPress={(e) => e.key === 'Enter' && saveSurname()}
                  autoFocus
                />
                <select
                  value={tempSurnameFormat}
                  onChange={(e) => setTempSurnameFormat(e.target.value)}
                  className="bg-white text-amber-900 border border-amber-300 rounded px-2 py-1 text-sm"
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
                  <Check size={20} />
                </button>
                <button
                  onClick={cancelSurnameEdit}
                  className="p-1 text-red-400 hover:text-red-300"
                  title="Cancel"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold font-serif">{familyData.surname}</h2>
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
          
          <div className="flex items-center gap-3">

            {isAdmin && (
              <button
                onClick={() => {
                  resetForm();
                  setEditingPerson(null);
                  setShowAddForm(true);
                }}
                className="control-btn bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Add Member
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={handleAdminLogout}
                className="control-btn bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            )}
            {!isAdmin && (
              <button
                onClick={exitHouse}
                className="control-btn hover:bg-amber-800 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut size={20} />
                Exit
              </button>
            )}
            

          </div>
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
          <button
            onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
            className="flex items-center justify-center w-12 h-12 hover:bg-gray-50 active:bg-gray-100 transition-all border-b border-gray-200 text-gray-600 hover:text-gray-800 font-bold"
            title="Zoom In"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.2))}
            className="flex items-center justify-center w-12 h-12 hover:bg-gray-50 active:bg-gray-100 transition-all text-gray-600 hover:text-gray-800"
            title="Zoom Out"
          >
            <span className="text-lg font-bold leading-none select-none">−</span>
          </button>
        </motion.div>
        
        {/* Reset View Button */}
        <motion.button
          onClick={() => {
            setZoom(0.8);
            setPan({ x: 0, y: 0 });
            // On mobile, also scroll to top
            if (isTouchDevice) {
              const container = document.querySelector('.family-tree-container');
              if (container) {
                container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }
            }
          }}
          className="bg-white/98 backdrop-blur-sm rounded-lg shadow-xl border border-gray-300 w-12 h-12 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-all text-gray-600 hover:text-gray-800"
          title="Reset View"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Home size={16} strokeWidth={2.5} />
        </motion.button>
        
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
        className={`absolute inset-0 pt-24 family-tree-container ${isTouchDevice ? 'overflow-auto' : 'cursor-move overflow-hidden'}`}
        onMouseDown={!isTouchDevice ? handleMouseDown : undefined}
        onMouseMove={!isTouchDevice ? handleMouseMove : undefined}
        onMouseUp={!isTouchDevice ? handleMouseUp : undefined}
        onMouseLeave={!isTouchDevice ? handleMouseUp : undefined}
        onTouchStart={!isTouchDevice ? handleMouseDown : undefined}
        onTouchMove={!isTouchDevice ? handleMouseMove : undefined}
        onTouchEnd={!isTouchDevice ? handleMouseUp : undefined}
        style={{
          WebkitOverflowScrolling: isTouchDevice ? 'touch' : 'auto',
          touchAction: isTouchDevice ? 'pan-x pan-y' : 'none'
        }}
      >
        {familyData.members.length === 0 ? (
          // Empty state when no family tree exists
          <div className="flex items-center justify-center h-full">
            <motion.div 
              className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-amber-800 max-w-md mx-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Users className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-amber-900 mb-4">
                No Family Tree Yet
              </h2>
              <p className="text-amber-700 text-lg mb-6">
                This family tree hasn't been created yet. Would you like to start building one?
              </p>
              
              <motion.button
                onClick={() => window.location.href = '/register'}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Family Tree
                </div>
              </motion.button>
              
              <p className="text-amber-600 text-sm mt-4">
                Already have access? <a href="/admin" className="text-amber-800 font-semibold hover:underline">Login as Admin</a>
              </p>
            </motion.div>
          </div>
        ) : (
          // Normal family tree view with mobile-friendly scrolling
          <div className="w-full h-full relative">
            <div
              style={{
                transform: isTouchDevice ? `scale(${zoom})` : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                width: isTouchDevice ? 'max-content' : '3000px',
                height: isTouchDevice ? 'max-content' : '2500px',
                minWidth: isTouchDevice ? `${100 * zoom}vw` : '3000px',
                minHeight: isTouchDevice ? `${100 * zoom}vh` : '2500px',
                padding: isTouchDevice ? '20px' : '0'
              }}
              className="relative"
            >
              <svg 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  minWidth: isTouchDevice ? `${200 * zoom}vw` : 'auto',
                  minHeight: isTouchDevice ? `${150 * zoom}vh` : 'auto'
                }}
              >
                {renderConnections()}
              </svg>
              
              {familyData.members.map((person, index) => renderPersonCard(person, index))}
            </div>
          </div>
        )}
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 animate-fade-in p-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-amber-800 max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-amber-50 p-4 rounded-t-xl flex justify-between items-center border-b-4 border-amber-700 flex-shrink-0">
              <h3 className="text-xl font-bold">{selectedPerson.fullName}</h3>
              <button
                onClick={() => setSelectedPerson(null)}
                className="hover:bg-amber-800 p-2 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-amber-200 rounded-full flex items-center justify-center text-4xl font-bold text-amber-900 border-4 border-amber-700 shadow-xl">
                  {selectedPerson.fullName.charAt(0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                  <p className="text-sm text-amber-700 font-semibold mb-1">Date of Birth</p>
                  <p className="text-amber-900 font-bold">{new Date(selectedPerson.dateOfBirth).toLocaleDateString()}</p>
                </div>

                {!selectedPerson.isLiving && (
                  <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                    <p className="text-sm text-amber-700 font-semibold mb-1">Date of Death</p>
                    <p className="text-amber-900 font-bold">{new Date(selectedPerson.dateOfDeath).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedPerson.isLiving && (
                  <div className="bg-green-100 p-3 rounded-lg border-2 border-green-400">
                    <p className="text-sm text-green-700 font-semibold mb-1">Status</p>
                    <p className="text-green-900 font-bold">Living</p>
                  </div>
                )}

                <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                  <p className="text-sm text-amber-700 font-semibold mb-1">Birth Star</p>
                  <p className="text-amber-900 font-bold flex items-center gap-2">
                    <Star size={16} className="text-yellow-600" />
                    {selectedPerson.birthStar || 'Not specified'}
                  </p>
                </div>

                {selectedPerson.nicknames && (
                  <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                    <p className="text-sm text-amber-700 font-semibold mb-1">Nicknames</p>
                    <p className="text-amber-900 font-bold">{selectedPerson.nicknames}</p>
                  </div>
                )}
              </div>

              {selectedPerson.maritalStatus === 'married' && (
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h4 className="text-base font-bold text-red-900 mb-2 flex items-center gap-2">
                    <Heart size={18} className="text-red-500" />
                    Marriage Details
                  </h4>
                  <p className="text-amber-900 mb-1 text-sm"><span className="font-semibold">Spouse:</span> {selectedPerson.spouseName}</p>
                  <p className="text-amber-900 text-sm"><span className="font-semibold">Married on:</span> {new Date(selectedPerson.dateOfMarriage).toLocaleDateString()}</p>
                </div>
              )}

              {getChildrenInfo(selectedPerson.children).length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Users size={18} />
                    Children ({getChildrenInfo(selectedPerson.children).length})
                  </h4>
                  <div className="space-y-2">
                    {getChildrenInfo(selectedPerson.children).map((child, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                        <p className="font-semibold text-blue-900 text-sm">{child.name}</p>
                        {child.dob && (
                          <p className="text-xs text-blue-700">Born: {new Date(child.dob).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
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
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-amber-800 my-8"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-amber-50 p-6 rounded-t-2xl flex justify-between items-center border-b-4 border-amber-700">
                <h3 className="text-2xl font-bold">{editingPerson ? 'Edit' : 'Add'} Family Member</h3>
                <motion.button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPerson(null);
                    resetForm();
                  }}
                  className="hover:bg-amber-800 p-2 rounded-lg transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Photo Upload Section */}
                <motion.div 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h4 className="text-blue-900 font-semibold mb-4 flex items-center gap-2">
                    <Camera size={20} />
                    Profile Photo
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg">
                      {croppedImage || formData.photo ? (
                        <img 
                          src={croppedImage || formData.photo} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Camera size={32} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <label className="cursor-pointer inline-block">
                          <motion.div 
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Upload size={20} />
                            {croppedImage || formData.photo ? 'Change Photo' : 'Upload Photo'}
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
                            className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X size={20} />
                            Remove
                          </motion.button>
                        )}
                      </div>
                      <p className="text-blue-700 text-sm mt-2">Upload a photo to personalize the profile. It will be automatically cropped to fit.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Required Fields */}
                <motion.div 
                  className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-amber-900 font-semibold mb-4">Required Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-amber-900 font-semibold mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateFormData({ ...formData, fullName: e.target.value })}
                        className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                          formErrors.fullName 
                            ? 'border-red-500 focus:border-red-600 bg-red-50' 
                            : 'border-amber-300 focus:border-amber-600 bg-white'
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-amber-900 font-semibold mb-2">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => updateFormData({ ...formData, gender: e.target.value })}
                          className="w-full p-4 border-2 border-amber-300 rounded-xl focus:border-amber-600 focus:outline-none bg-white"
                        >
                          <option value="male">Male (Blue Square)</option>
                          <option value="female">Female (Pink Circle)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-amber-900 font-semibold mb-2">Marital Status</label>
                        <select
                          value={formData.maritalStatus}
                          onChange={(e) => updateFormData({ 
                            ...formData, 
                            maritalStatus: e.target.value,
                            spouseName: e.target.value !== 'married' ? '' : formData.spouseName,
                            dateOfMarriage: e.target.value !== 'married' ? '' : formData.dateOfMarriage
                          })}
                          className="w-full p-4 border-2 border-amber-300 rounded-xl focus:border-amber-600 focus:outline-none bg-white"
                        >
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                    </div>

                    {formData.maritalStatus === 'married' && (
                      <motion.div 
                        className="grid grid-cols-2 gap-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div>
                          <label className="block text-amber-900 font-semibold mb-2">Spouse Name *</label>
                          <input
                            type="text"
                            value={formData.spouseName}
                            onChange={(e) => updateFormData({ ...formData, spouseName: e.target.value })}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                              formErrors.spouseName 
                                ? 'border-red-500 focus:border-red-600 bg-red-50' 
                                : 'border-amber-300 focus:border-amber-600 bg-white'
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
                          <label className="block text-amber-900 font-semibold mb-2">Marriage Date *</label>
                          <input
                            type="date"
                            value={formData.dateOfMarriage}
                            onChange={(e) => updateFormData({ ...formData, dateOfMarriage: e.target.value })}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                              formErrors.dateOfMarriage 
                                ? 'border-red-500 focus:border-red-600 bg-red-50' 
                                : 'border-amber-300 focus:border-amber-600 bg-white'
                            }`}
                          />
                          {formErrors.dateOfMarriage && (
                            <motion.p 
                              className="text-red-500 text-sm mt-1"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {formErrors.dateOfMarriage}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Optional Fields with improved switches */}
                <motion.div 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="text-green-900 font-semibold mb-4">Optional Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {Object.entries({
                      birthDate: 'Add Birth Date',
                      birthStar: 'Add Birth Star',
                      nicknames: 'Add Nicknames',
                      parent: 'Add Parent / Make Root',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-200">
                        <span className="text-green-800 font-medium">{label}</span>
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
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-200">
                      <span className="text-green-800 font-medium">Person is deceased</span>
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
                        <label className="block text-green-900 font-semibold mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => updateFormData({ ...formData, dateOfBirth: e.target.value })}
                          className={`w-full p-4 border-2 rounded-xl focus:outline-none transition-all ${
                            formErrors.dateOfBirth 
                              ? 'border-red-500 focus:border-red-600 bg-red-50' 
                              : 'border-green-300 focus:border-green-600 bg-white'
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
                        <label className="block text-green-900 font-semibold mb-2">Birth Star</label>
                        <input
                          type="text"
                          value={formData.birthStar}
                          onChange={(e) => updateFormData({ ...formData, birthStar: e.target.value })}
                          className="w-full p-4 border-2 border-green-300 rounded-xl focus:border-green-600 focus:outline-none bg-white"
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
                        <label className="block text-green-900 font-semibold mb-2">Nicknames</label>
                        <input
                          type="text"
                          value={formData.nicknames}
                          onChange={(e) => updateFormData({ ...formData, nicknames: e.target.value })}
                          className="w-full p-4 border-2 border-green-300 rounded-xl focus:border-green-600 focus:outline-none bg-white"
                          placeholder="Any nicknames or pet names"
                        />
                      </motion.div>
                    )}

                    {/* Parent selection - always optional now */}
                    {showOptionalFields.parent && (
                      <motion.div 
                        className="mb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-green-900 font-semibold mb-2">Parent</label>
                        <select
                          value={formData.parentId || ''}
                          onChange={(e) => {
                            const parentId = e.target.value ? parseInt(e.target.value) : null;
                            const parent = familyData.members.find(m => m.id === parentId);
                            updateFormData({ 
                              ...formData, 
                              parentId,
                              generation: parent ? parent.generation + 1 : 0
                            });
                          }}
                          className="w-full p-4 border-2 border-green-300 rounded-xl focus:border-green-600 focus:outline-none bg-white"
                        >
                          <option value="">No parent (root member)</option>
                          {familyData.members.filter(member => member.id !== editingPerson?.id).map(member => (
                            <option key={member.id} value={member.id}>{member.fullName}</option>
                          ))}
                        </select>
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
                  className="flex gap-4 pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={editingPerson ? handleEditPerson : handleAddPerson}
                    disabled={!isFormValid}
                    className={`flex-1 font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isFormValid 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
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
                    <X size={20} />
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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative z-[101]"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Crop Your Photo</h3>
              <div className="mb-6">
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  aspect={1}
                  circularCrop={false}
                  className="max-w-full"
                >
                  <img src={imageToCrop} alt="Crop preview" className="max-w-full h-auto" />
                </ReactCrop>
              </div>
              <div className="flex gap-4">
                <motion.button
                  onClick={() => {
                    setShowImageCrop(false);
                    setImageToCrop(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCropComplete}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Apply Crop
                </motion.button>
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
                  <X size={20} />
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