import { familyTreeService } from './familyTreeService';

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock subdomain utils
jest.mock('../utils/subdomain', () => ({
  getSubdomain: jest.fn(),
}));

describe('familyTreeService', () => {
  const { supabase } = require('../supabaseClient');
  const { getSubdomain } = require('../utils/subdomain');

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    getSubdomain.mockReturnValue('testfamily');
  });

  describe('getCurrentFamilyId', () => {
    test('returns family ID from sessionStorage', () => {
      sessionStorage.setItem('currentFamilyId', 'test-family-id');
      const familyId = familyTreeService.getCurrentFamilyId();
      expect(familyId).toBe('test-family-id');
    });

    test('returns null when no family ID in storage', () => {
      const familyId = familyTreeService.getCurrentFamilyId();
      expect(familyId).toBeNull();
    });
  });

  describe('getShareableLink', () => {
    test('returns current origin', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true,
      });

      const link = familyTreeService.getShareableLink();
      expect(link).toBe('https://example.com');
    });
  });

  describe('createInitialAdmin', () => {
    test('successfully creates admin and family', async () => {
      supabase.rpc.mockResolvedValue({
        data: {
          success: true,
          subdomain: 'testfamily',
          url: 'https://testfamily.example.com',
          family_id: 'test-family-id'
        },
        error: null,
      });

      const result = await familyTreeService.createInitialAdmin({
        username: 'admin',
        password: 'password123',
        email: 'admin@test.com',
        familyName: 'Test Family',
        displayName: 'Test Family'
      });

      expect(result.success).toBe(true);
      expect(result.subdomain).toBe('testfamily');
      expect(supabase.rpc).toHaveBeenCalledWith('create_initial_admin', expect.any(Object));
    });

    test('handles error when creation fails', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Username already exists' },
      });

      const result = await familyTreeService.createInitialAdmin({
        username: 'admin',
        password: 'password123',
        email: 'admin@test.com',
        familyName: 'Test Family',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
    });
  });

  describe('saveFamilyTree', () => {
    test('saves tree data successfully', async () => {
      const mockFamilyData = {
        surname: 'Test Family',
        members: [{ id: 1, name: 'John Doe' }],
      };

      // Mock getFamilyBySubdomain
      supabase.rpc.mockResolvedValue({
        data: {
          success: true,
          family: { id: 'test-family-id', surname: 'Test' }
        },
        error: null,
      });

      // Mock update
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockFamilyData,
            error: null,
          }),
        }),
      });

      const result = await familyTreeService.saveFamilyTree(mockFamilyData);
      
      expect(result.success).toBe(true);
    });

    test('returns error when no subdomain', async () => {
      getSubdomain.mockReturnValue(null);

      const result = await familyTreeService.saveFamilyTree({ members: [] });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No family context found');
    });
  });

  describe('loadFamilyTree', () => {
    test('loads tree data successfully', async () => {
      // Mock getFamilyBySubdomain
      supabase.rpc.mockResolvedValue({
        data: {
          success: true,
          family: { 
            id: 'test-family-id', 
            surname: 'Test',
            displayName: 'Test Family'
          }
        },
        error: null,
      });

      // Mock select
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                members: [{ id: 1, name: 'John' }]
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await familyTreeService.loadFamilyTree();
      
      expect(result.success).toBe(true);
      expect(result.data.surname).toBe('Test Family');
      expect(result.data.members).toHaveLength(1);
    });

    test('handles no data gracefully', async () => {
      // Mock getFamilyBySubdomain
      supabase.rpc.mockResolvedValue({
        data: {
          success: true,
          family: { 
            id: 'test-family-id', 
            surname: 'Test',
            displayName: 'Test Family'
          }
        },
        error: null,
      });

      // Mock select with no data
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await familyTreeService.loadFamilyTree();
      
      expect(result.success).toBe(true);
      expect(result.data.surname).toBe('Test Family');
      expect(result.data.members).toEqual([]);
    });

    test('returns error when no subdomain', async () => {
      getSubdomain.mockReturnValue(null);

      const result = await familyTreeService.loadFamilyTree();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No family selected');
      expect(result.isRoot).toBe(true);
    });
  });
});