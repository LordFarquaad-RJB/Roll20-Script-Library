# Roll20 Script Library

## Repository Structure & Rules

### Branch Strategy

**Main Branches:**
- `Live-Files-Personal-Use-Branch` - **STABLE VERSION** - Main working branch with debugging and development notes
- `Live-Files-Shared-Use-Branch` - **CLEAN VERSION** - Production-ready, debugging removed, notes cleaned
- `Modular-Re-Worked-Scripts` - **FUTURE PROJECT** - For modular system conversion

**Feature Branches (1-2 day features):**
- `feature/trap-system-[description]`
- `feature/shop-system-[description]`
- `feature/control-[description]`
- `feature/command-menu-[description]`
- `bugfix/cross-system-[description]`

### File Organization

```
Live Files/
├── Systems/           # Major system scripts
│   ├── TrapSystem.js
│   └── ShopSystem.js
├── Controls/          # Small control scripts
│   ├── LightingControl.js
│   ├── TokenFX.js
│   └── TriggerControl.js
├── CommandMenu.js     # Main command interface
└── README.md         # This file
```

### Development Workflow

#### Starting a New Feature:
1. Always start from stable branch: `git checkout Live-Files-Personal-Use-Branch`
2. Pull latest changes: `git pull`
3. Create feature branch: `git checkout -b feature/[system]-[description]`
4. Work on feature, test in Roll20 as you go
5. Commit logical chunks with descriptive messages
6. When complete and tested, merge back to stable

#### Bug Fixes:
1. Create bugfix branch: `git checkout -b bugfix/[description]`
2. Fix issues, test in Roll20
3. Merge back to stable branch

#### Moving to Clean Version:
1. Create clean version from stable: `git checkout -b Live-Files-Shared-Use-Branch`
2. Remove debugging code and development notes
3. Update version numbers in scripts
4. Test thoroughly in Roll20
5. Merge to shared branch

### Coding Standards

#### Script Structure:
```javascript
/**
 * Script Name
 * Version: X.X.X
 * Description: Brief description
 * 
 * [Long explainer section at top for small scripts]
 * 
 * CONFIGURATION
 * =============
 * [Configuration settings]
 * 
 * UTILS
 * =====
 * [Utility functions]
 * 
 * MAIN FUNCTIONS
 * ==============
 * [Main functionality]
 * 
 * ERROR HANDLING
 * ==============
 * [Error handling section]
 */
```

#### Version Management:
- Update version numbers in scripts when making changes
- Use semantic versioning: MAJOR.MINOR.PATCH
- Document version changes in commit messages

#### Error Handling:
- Include appropriate error handling in all functions
- Provide clear error messages
- Log errors for debugging

#### Code Comments:
- Add explanatory comments for complex sections
- Document function parameters and return values
- Include examples for important functions
- Document code removals with explanation

### AI Assistant Rules

#### When Editing Scripts:
1. **Always check current branch** before making changes
2. **Maintain backwards compatibility** for array-based and object-based structures
3. **Follow the script structure** (CONFIG, UTILS, MAIN FUNCTIONS, ERROR HANDLING)
4. **Add appropriate error handling** with clear messages
5. **Update version numbers** when making functional changes
6. **Test in Roll20** before committing changes
7. **Use descriptive commit messages** that explain what was changed and why

#### Branch Management:
1. **Never work directly on stable branches** - always use feature branches
2. **Delete feature branches** after successful merge
3. **Keep stable branch clean** - only merge tested, working code
4. **Use descriptive branch names** that indicate the purpose

#### File Organization:
1. **Maintain the established structure** (Systems/, Controls/, CommandMenu.js)
2. **Keep related functionality together**
3. **Use clear section headers** with consistent formatting
4. **Group similar functions together**

#### Documentation:
1. **Update README.md** when adding new features or changing structure
2. **Add comments** explaining complex logic
3. **Document function parameters** and return values
4. **Include examples** for important functions
5. **Keep documentation up to date** with code changes

#### Testing:
1. **Test each change in Roll20** before committing
2. **Verify existing functionality** isn't broken
3. **Test edge cases** and error conditions
4. **Document test results** in commit messages

### Roll20-Specific Standards

#### Character Sheet Integration:
- Use `getSheetItem()` for calculated attributes (strength_mod, passive_wisdom, ac)
- Use `getAttrByName('store')` for large data objects
- Merge calculated modifiers with attack metadata from store object

#### Error Handling:
- Include appropriate error checks for Roll20 API calls
- Provide meaningful error messages for users
- Handle edge cases gracefully
- Log errors for debugging

#### Performance:
- Optimize code for Roll20 environment
- Minimize API calls where possible
- Profile code when necessary
- Address performance bottlenecks

### Commit Message Format:
```
[type] [system]: Brief description

- Detailed list of changes
- Why changes were made
- Testing performed
- Version updated to X.X.X
```

Examples:
- `[feature] trap-system: Add new trap detection algorithm`
- `[bugfix] shop-system: Fix inventory display issue`
- `[refactor] controls: Improve lighting control performance`

### Testing Checklist:
- [ ] Test in Roll20 environment
- [ ] Verify existing functionality works
- [ ] Test error conditions
- [ ] Check performance impact
- [ ] Update version numbers
- [ ] Update documentation if needed
- [ ] Test with different character sheets if applicable

### Release Process:
1. Complete feature development and testing
2. Merge to stable branch (`Live-Files-Personal-Use-Branch`)
3. Test thoroughly in Roll20
4. Create clean version (`Live-Files-Shared-Use-Branch`)
5. Remove debugging code and development notes
6. Update version numbers
7. Final testing in Roll20
8. Tag release with version number

### Maintenance:
- Keep code clean and organized
- Remove unused code
- Update dependencies regularly
- Monitor for potential issues
- Maintain consistent formatting and style

---

## Installation

1. Open your Roll20 campaign's **API Scripts** page.
2. Copy the contents of any script file from this repository and paste it into the editor.
3. Save the script to restart the sandbox. Repeat for each script you wish to use.

## Scripts

### LightControl
Controls dynamic lighting walls, doors and toggling darkness. The help section lists commands such as:
```
!wall -Mxyz123 moveLeft 70 2
!door all_on_page lock
!lc toggledarkness circle 3 --id room_torch
```
These examples come from the built-in help menu.

### TokenFX
Spawns complex visual effects with timing and targeting options. Example usage from the documentation:
```
!spawnComplexFx FX[beam] ID[A] ID[B] TR[infinite] TI[0.4]
!spawnComplexFx FX[beam] CLR[fire] ID[source] TARGET[destination]
!delay 2 {command}
```
See the detailed comments for more options. Additional examples and commands are available in the script's help menu.

### TriggerControl
Automates actions from rollable tables and at the start of a token's turn. The header explains the format:
```
[TOT: once,gm] &{template:default} {{name=Secret Effect}} {{text=Hidden message}}
```
Available commands include `!tt-reset`, `!tt-debug` and `!rtm` as documented in the comment block.

### CommandMenu
Provides an in-game control panel. Use `!menu` followed by a section name or `help` to open different menus:
```
!menu traps
!menu help
```
Handling of the `!menu` command is shown around the chat handler.

### ShopSystem
A D&D 5e shop manager with item databases and haggling. The shop help menu lists quick commands:
```
!shop browse [category]
!shop basket view
!shop help
```
These lines appear in the shop help output.

### TrapSystem
Manages traps, detection auras and interaction menus. Its help menu provides setup and control commands such as:
```
!trapsystem setup
!trapsystem toggle
!trapsystem trigger
!trapsystem status
!trapsystem enable / !trapsystem disable
```
See the extensive help block for full details.

---

Each script includes additional options and configuration settings within the code comments.