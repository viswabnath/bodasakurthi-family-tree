# Changelog

All notable changes to the Family Tree Application.

## [1.4.0] - 2025-10-16 - High Priority Improvements

### Added
- **Undo/Redo Functionality**: Complete undo/redo system with 10-action history
  - Undo button with visual feedback and tooltips
  - Redo button with state management
  - Saves state before every add/edit/delete operation
  - Keyboard shortcuts support (Cmd/Ctrl+Z for undo, Cmd/Ctrl+Y for redo)
  - Disabled state when no actions available
  
- **Recursive Generation Recalculation**: Automatic generation number updates
  - Recalculates entire family tree after relationship changes
  - Works with deep hierarchies (5+ generations)
  - Handles multiple independent root trees
  - Triggered after all add/edit/delete operations
  
- **Circular Relationship Prevention**: Prevents impossible family structures
  - Detects if setting parent would create circular reference
  - Blocks person from being their own ancestor
  - Shows clear error messages
  - Graph traversal with cycle detection algorithm
  
- **Validation Warnings**: Non-blocking data quality checks
  - Age validation (parent too young when child born)
  - Death date before birth date warnings
  - Child born before parent warnings
  - Duplicate name detection
  - Generation inconsistency alerts
  - Warnings don't block save operations
  
- **Error Handling with Rollback**: Automatic recovery from failures
  - Database save wrapped in try-catch blocks
  - Automatic UI rollback on save failure
  - Clear error notifications
  - Previous state restored seamlessly

### Changed
- Wrapped `saveToDatabase` in useCallback for performance
- Wrapped `showNotification` in useCallback for consistency
- All handler functions now include comprehensive error handling
- History saved before every mutation operation

### Technical
- Added `history`, `historyIndex`, `isUndoing` state variables
- Implemented `recalculateGenerations()` recursive function
- Implemented `recalculateAllGenerations()` for multi-root trees
- Implemented `detectCircularRelationship()` with visited set optimization
- Implemented `getValidationWarnings()` for data quality checks
- Implemented `saveToHistory()` for history management
- Implemented `handleUndo()` and `handleRedo()` functions
- Added undo/redo buttons to admin toolbar
- Enhanced all handlers with validation and error handling

### Performance
- Build size: 146.35 kB gzipped (+1.15 kB from v1.3.2)
- History limited to 10 entries (~500KB max memory)
- All algorithms optimized with O(n) complexity

## [1.3.2] - 2025-10-15

### Added
- **Root Member Children Linking**: Admin can link children to root members with automatic sibling detection
- **Parent-Child Swap Feature**: Ability to swap parent-child relationships with optional children transfer
- **Optional Children Transfer**: When swapping parent-child, user can choose which children to move
- **Tree Reorganization**: Can make existing roots children of new roots
- **Auto-Enable Fields**: Optional fields automatically enable when editing members with existing data
- **Reactive UI**: Children linking section shows/hides based on current form state
- **Visual Indicators**: Shows generation changes and relationship impacts before saving

### Fixed
- Null reference errors when adding members
- Children linking section not appearing when toggling root status
- Existing children not showing when editing root member
- Children section not hiding when parent is selected
- Generation calculations for parent-child swaps
- Filter logic for showing potential children to link

### Changed
- Simplified children filtering logic for consistency
- Always pre-select existing children when opening edit form
- Children stay with original parent by default during swaps
- Improved notification messages for complex operations

### Technical
- Added `childrenToMoveInSwap` state for swap scenarios
- Implemented 4-scenario handling in `handleEditPerson()`
- Enhanced `findPotentialChildren()` with form state awareness
- Added defensive null checks throughout the codebase

## [1.0.0] - Initial Release

### Added
- Basic family tree management
- Add/Edit/Delete family members
- Photo upload with cropping
- Gender and marital status tracking
- Birth and death date recording
- Supabase integration for data persistence
- Admin authentication system
- Initial setup wizard
