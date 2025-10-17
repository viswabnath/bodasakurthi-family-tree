# Changelog

All notable changes to the Family Tree Application.

## [1.5.0] - 2025-10-17 - Advanced Marriage & Children Management

### Added
- **Multiple Marriage Support**: Complete redesign of marriage system
  - Support for divorced, widowed, and remarried individuals
  - Advanced marriage form with multiple marriage entries
  - Smart toggle between simple and advanced marriage modes
  - Marriage status tracking (Current, Divorced, Widowed)
  - Marriage and end date management

- **Enhanced Children Management**: Children-to-marriage assignment system
  - Individual child assignment to specific marriages
  - Intelligent auto-distribution based on birth dates and marriage periods
  - Visual child assignment interface with checkboxes per marriage
  - Real-time child count updates per marriage
  - Support for children from different relationships

- **Improved Person Display**: Enhanced visualization for complex families
  - Marriage history display with status badges
  - Children organized by marriage relationship
  - "0 children" display for married couples without children
  - Color-coded marriage status indicators
  - Support for multiple spouse relationships

### Enhanced
- **Person Cards**: Now show current spouse and total children count
- **Detailed Person View**: Complete marriage history with dates and children breakdown
- **Form Validation**: Context-aware validation for multiple marriages
- **Data Migration**: Automatic conversion of legacy single-marriage data

### Technical Improvements
- **Smart Data Distribution**: Algorithms for child-to-marriage assignment
- **Backward Compatibility**: Seamless handling of existing family data
- **Enhanced Helper Functions**: Marriage management utilities
- **Real-time Updates**: Dynamic form interactions and count updates

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
