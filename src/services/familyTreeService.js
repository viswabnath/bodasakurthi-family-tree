import { supabase } from '../supabaseClient';
import { getSubdomain } from '../utils/subdomain';

export const familyTreeService = {
  // Get current family context from subdomain
  getCurrentFamilyId() {
    // Store in sessionStorage for performance
    return sessionStorage.getItem('currentFamilyId');
  },

  // Get family info by subdomain
  async getFamilyBySubdomain(subdomain) {
    try {
      const { data, error } = await supabase.rpc('get_family_by_subdomain', {
        lookup_subdomain: subdomain
      });

      if (error) {
        console.error('Error fetching family:', error);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        // Cache the family ID
        sessionStorage.setItem('currentFamilyId', data.family.id);
        sessionStorage.setItem('currentFamilyData', JSON.stringify(data.family));
        return { success: true, family: data.family };
      }

      return { success: false, error: data?.message || 'Family not found' };
    } catch (error) {
      console.error('Error in getFamilyBySubdomain:', error);
      return { success: false, error: error.message };
    }
  },

  // Create initial admin and family (multi-tenant)
  async createInitialAdmin({ username, password, email, familyName, displayName }) {
    try {
      const { data, error } = await supabase.rpc('create_initial_admin', {
        admin_username: username,
        admin_password: password,
        admin_email: email,
        family_surname: familyName,
        display_name: displayName || familyName // Use displayName if provided, otherwise familyName
      });

      if (error) {
        console.error('Error creating initial admin:', error);
        return { success: false, message: error.message };
      }

      if (data && !data.success) {
        return { success: false, message: data.message };
      }

      // Return the full data including subdomain and URL
      return { 
        success: true, 
        message: 'Family created successfully!',
        subdomain: data.subdomain,
        url: data.url,
        familyId: data.family_id
      };
    } catch (error) {
      console.error('Error in createInitialAdmin:', error);
      return { success: false, message: 'Network error occurred' };
    }
  },
  // Save family tree data to database (admin only, family-specific)
  saveFamilyTree: async (familyData) => {
    try {
      const subdomain = getSubdomain();
      if (!subdomain) {
        return { success: false, error: 'No family context found' };
      }

      // Get family info first
      const familyResult = await familyTreeService.getFamilyBySubdomain(subdomain);
      if (!familyResult.success) {
        return { success: false, error: 'Family not found' };
      }

      const familyId = familyResult.family.id;

      const { data, error } = await supabase
        .from('family_trees')
        .update({ 
          members: familyData.members,
          updated_at: new Date().toISOString()
        })
        .eq('family_id', familyId);

      if (error) {
        console.error('💥 Supabase error:', error);
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving family tree:', error);
      return { success: false, error: error.message };
    }
  },

  // Load family tree data from database (family-specific)
  loadFamilyTree: async () => {
    try {
      const subdomain = getSubdomain();
      if (!subdomain) {
        // Root domain - no tree to load
        return { 
          success: false, 
          error: 'No family selected',
          isRoot: true 
        };
      }

      // Get family info
      const familyResult = await familyTreeService.getFamilyBySubdomain(subdomain);
      if (!familyResult.success) {
        return { success: false, error: 'Family not found' };
      }

      const familyId = familyResult.family.id;
      const familySurname = familyResult.family.displayName || familyResult.family.surname || 'Family';

      // Load the family tree
      const { data, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('family_id', familyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, return default empty tree
          return { 
            success: true, 
            data: {
              surname: familySurname,
              members: []
            }
          };
        }
        throw error;
      }

      return { 
        success: true, 
        data: {
          surname: familySurname,
          members: data.members || []
        }
      };
    } catch (error) {
      console.error('❌ Error loading family tree:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin login verification (family-specific)
  verifyAdminLogin: async (username, password) => {
    try {
      const subdomain = getSubdomain();
      if (!subdomain) {
        return { success: false, error: 'Not on a family subdomain' };
      }

      const { data, error } = await supabase
        .rpc('verify_admin_login', {
          login_subdomain: subdomain,
          login_username: username,
          login_password: password
        });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
      
      if (data && data.success) {
        // Store user info in session
        sessionStorage.setItem('adminUser', JSON.stringify(data.user));
        sessionStorage.setItem('currentFamilyId', data.family.id);
        return { success: true, isAdmin: true, user: data.user, family: data.family };
      } else {
        return { success: false, error: data?.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('❌ Error verifying admin login:', error);
      return { success: false, error: error.message };
    }
  },

  // Get shareable link for current family
  getShareableLink: () => {
    return window.location.origin;
  },



  // Test database connection
  testConnection: async () => {
    try {
      const { data, error } = await supabase
        .from('family_trees')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('💥 Database connection failed:', error);
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Update family theme (admin only)
  async updateFamilyTheme(familyId, theme) {
    try {
      const { data, error } = await supabase.rpc('update_family_theme', {
        p_family_id: familyId,
        p_theme: theme
      });

      if (error) {
        console.error('Error updating theme:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error in updateFamilyTheme:', error);
      return { success: false, error: error.message };
    }
  }
};

export default familyTreeService;