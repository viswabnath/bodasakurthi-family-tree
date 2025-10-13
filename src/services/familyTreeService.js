import { supabase } from '../supabaseClient';

// Public tree ID - everyone sees the same tree
const PUBLIC_TREE_ID = 'public_main_tree';

export const familyTreeService = {
  // Check if any admin exists in the system
  async checkAdminExists() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('is_active', true)
        .limit(1);
      
      if (error) {
        console.error('Error checking admin existence:', error);
        return { success: false, adminExists: false, error: error.message };
      }
      
      return { 
        success: true, 
        adminExists: data && data.length > 0 
      };
    } catch (error) {
      console.error('Error in checkAdminExists:', error);
      return { success: false, adminExists: false, error: error.message };
    }
  },

  // Create initial admin (only works if no admin exists)
  async createInitialAdmin({ username, password, email, familyName }) {
    try {
      const { data, error } = await supabase.rpc('create_initial_admin', {
        admin_username: username,
        admin_password: password,
        admin_email: email,
        family_surname: familyName
      });

      if (error) {
        console.error('Error creating initial admin:', error);
        return { success: false, message: error.message };
      }

      if (data && !data.success) {
        return { success: false, message: data.message };
      }

      return { success: true, message: 'Admin created successfully!' };
    } catch (error) {
      console.error('Error in createInitialAdmin:', error);
      return { success: false, message: 'Network error occurred' };
    }
  },
  // Save family tree data to database (admin only)
  saveFamilyTree: async (familyData) => {
    try {
      const payload = {
        tree_id: PUBLIC_TREE_ID,
        surname: familyData.surname,
        members: familyData.members,
        is_public: true
      };
      
      const { data, error } = await supabase
        .from('family_trees')
        .upsert(payload, {
          onConflict: 'tree_id'
        });

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

  // Load family tree data from database (public access)
  loadFamilyTree: async () => {
    try {
      const { data, error } = await supabase
        .from('family_trees')
        .select('*')
        .eq('tree_id', PUBLIC_TREE_ID)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, return default empty tree
          return { 
            success: true, 
            data: {
              surname: 'My Family',
              members: []
            }
          };
        }
        throw error;
      }

      return { 
        success: true, 
        data: {
          surname: data.surname,
          members: data.members || []
        }
      };
    } catch (error) {
      console.error('❌ Error loading family tree:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin login verification
  verifyAdminLogin: async (username, password) => {
    try {
      const { data, error } = await supabase
        .rpc('verify_admin_login', {
          input_username: username,
          input_password: password
        });

      if (error) throw error;
      
      if (data) {
        return { success: true, isAdmin: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('❌ Error verifying admin login:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current tree ID (always public)
  getCurrentTreeId: () => {
    return PUBLIC_TREE_ID;
  },

  // Share tree - get shareable link (same for everyone)
  getShareableLink: () => {
    return window.location.origin;
  },

  // Create initial admin user
  createAdminUser: async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          username: username,
          password_hash: password // Note: In production, hash this properly
        });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      return { success: false, error: error.message };
    }
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
  }
};

export default familyTreeService;