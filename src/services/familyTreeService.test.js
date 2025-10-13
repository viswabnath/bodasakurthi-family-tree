import { familyTreeService } from './familyTreeService';

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('familyTreeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentTreeId', () => {
    test('returns public tree ID', () => {
      const treeId = familyTreeService.getCurrentTreeId();
      expect(treeId).toBe('public_main_tree');
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

  describe('saveFamilyTree', () => {
    test('returns error when not admin', async () => {
      const mockFamilyData = {
        surname: 'Test Family',
        members: [],
      };

      const result = await familyTreeService.saveFamilyTree(mockFamilyData);
      
      // Should fail because admin check is not implemented in this test
      expect(result.success).toBe(false);
    });
  });

  describe('loadFamilyTree', () => {
    test('handles no data gracefully', async () => {
      const { supabase } = require('../supabaseClient');
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No data found
              }),
            }),
          }),
        }),
      });

      const result = await familyTreeService.loadFamilyTree();
      
      expect(result.success).toBe(true);
      expect(result.data.surname).toBe('My Family');
      expect(result.data.members).toEqual([]);
    });
  });
});