# Changelog

All notable changes to the Family Tree Application.

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
