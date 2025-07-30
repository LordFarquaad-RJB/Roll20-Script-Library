# Roll20 MOD Scripts

This repository contains several Roll20 API scripts used to manage effects, lighting, shops and traps. Each script is located in the `Live Files` folder.

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