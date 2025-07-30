/**
 * CommandMenu.js
 * Control panel style menu system for Roll20
 * Add notes about the experimental API test here.
 */

const CommandMenu = {
    // Configuration
    config: {
        LOG_LEVEL: "info",
        GM_ONLY: true,
        MENU_SECTIONS: {
            SHOP: "ShopSystem",
            AUDIO: "Audio",
            TRAP: "TrapSystem",
            COMBAT: "Combat",
            TRAP_ADVANCED: "TrapSystem Advanced",
            TOKEN_FX: "TokenFX",
            TOKEN_MOD: "TokenMod",
            LIGHTING: "LightControl",
            UTILITY: "Utility",
            SYSTEM: "System"
        },
        KNOWN_SYSTEMS: {
            'CommandMenu': { version: 'v1.1.0' },
            'TokenMod': { version: 'v0.8.84' },
            'Roll20AM': { version: 'v2.15' },
            'GroupCheck': { version: 'v1.15' },
            'GroupInitiative': { version: 'v0.9.41' },
            'APIHeartBeat': { version: 'v0.5.2' },
            'TokenFX': { version: 'v1.0.0' },
            'TrapSystem': { version: 'v1.0.0' },
            'ShopSystem': { version: 'v1.0.0' },
            'LightControl': { version: 'v1.1.0' },
            'TriggerControl': { version: 'v3.0.0' },
            'TrapMigrator': { version: 'v5.0.0' },
            'DataExporter': { version: 'v1.0.0' }
        },
        trapSystemSkillList: [
            "Flat Roll", 
            "Acrobatics", 
            "Animal Handling", 
            "Arcana", 
            "Athletics", 
            "Deception", 
            "History", 
            "Insight", 
            "Intimidation", 
            "Investigation", 
            "Medicine", 
            "Nature", 
            "Perception", 
            "Performance", 
            "Persuasion", 
            "Religion", 
            "Sleight of Hand", 
            "Stealth", 
            "Survival", 
            "Strength Check", 
            "Dexterity Check", 
            "Constitution Check", 
            "Intelligence Check", 
            "Wisdom Check", 
            "Charisma Check", 
            "Strength Saving Throw", 
            "Dexterity Saving Throw", 
            "Constitution Saving Throw", 
            "Intelligence Saving Throw", 
            "Wisdom Saving Throw", 
            "Charisma Saving Throw"
        ],
    },

    // State tracking
    state: {
        initializationStatus: {},
        errors: [],
        warnings: [],
        startTime: null,
        systemsReady: 0
    },

    // Utility functions
    utils: {
        log(message, type = 'info') {
            const prefix = {
                info: '📜',
                error: '❌',
                success: '✅',
                warning: '⚠️'
            }[type] || '📜';
            log(`${prefix} ${message}`);
        },

        isGM(msg) {
            // Check if the message has a 'who' field that ends with '(GM)'
            if (msg && msg.who && msg.who.endsWith('(GM)')) {
                CommandMenu.utils.log(`isGM Check: player=${msg.who}, Result=true`, "debug");
                return true;
            }
            return false;
        },

        addInitStatus(module, status, message = null, type = 'info') {
            const systemInfo = CommandMenu.config.KNOWN_SYSTEMS[module] || {};
            CommandMenu.state.initializationStatus[module] = {
                status: status,
                message: message,
                version: systemInfo.version || '',
                type: type
            };

            if (type === 'error' && message) {
                CommandMenu.state.errors.push(`${module}: ${message}`);
            } else if (type === 'warning' && message) {
                CommandMenu.state.warnings.push(`${module}: ${message}`);
            }

            if (status === 'success') {
                CommandMenu.state.systemsReady++;
            }
        }
    },

    // Menu Management
    menu: {
        showStartupMenu() {
            const initTime = (Date.now() - CommandMenu.state.startTime) / 1000;
            let menu = [
                "&{template:default} {{name=System Initialization}}",
                `{{Status=✅ System startup complete in ${initTime.toFixed(2)}s}}`
            ];

            // Group systems by status
            const systems = {
                success: [],
                warning: [],
                error: [],
                pending: []
            };

            Object.entries(CommandMenu.state.initializationStatus).forEach(([module, data]) => {
                const status = {
                    success: '✅',
                    error: '❌',
                    warning: '⚠️',
                    pending: '⏳'
                }[data.type] || '📜';
                const group = systems[data.type] || systems.pending;
                
                const version = data.version ? ` ${data.version}` : '';
                group.push(`${status} ${module}${version}`);
            });

            // Add systems by status
            if (systems.success.length > 0) {
                menu.push(`{{Ready=${systems.success.join('<br>')}}}`);
            }
            if (systems.warning.length > 0) {
                menu.push(`{{Warnings=${systems.warning.join('<br>')}}}`);
            }
            if (systems.error.length > 0) {
                menu.push(`{{Errors=${systems.error.join('<br>')}}}`);
            }
            if (systems.pending.length > 0) {
                menu.push(`{{Pending=${systems.pending.join('<br>')}}}`);
            }

            if (
                systems.success.length === 0 &&
                systems.warning.length === 0 &&
                systems.error.length === 0 &&
                systems.pending.length === 0
            ) {
                menu.push("{{Note=No systems have reported status.}}");
            }

            // Add quick access buttons
            menu.push("{{Quick Access=");
            Object.values(CommandMenu.config.MENU_SECTIONS).forEach(section => {
                menu.push(`[${this.getSectionEmoji(section)} ${section}](!menu ${section})`);
            });
            menu.push("}}");

            sendChat("API", `/w gm ${menu.join(" ")}`, null, {noarchive: true});
        },

        showQuickMenu(msg) {
            if (CommandMenu.config.GM_ONLY && !CommandMenu.utils.isGM(msg)) {
                sendChat("API", "/w gm ⚠️ This menu is only available to the GM.");
                return;
            }

            let menu = [
                "&{template:default} {{name=Quick Access}}",
                "{{Select Section="
            ];

            Object.values(CommandMenu.config.MENU_SECTIONS).forEach(section => {
                menu.push(`[${this.getSectionEmoji(section)} ${section}](!menu ${section})`);
            });

            menu.push("}}");

            sendChat("API", `/w gm ${menu.join(" ")}`, null, {noarchive: true});
        },

        getSectionEmoji(section) {
            const emojis = {
                "ShopSystem": "🏪",
                "TrapSystem": "🎯",
                "TrapSystem Advanced": "🎯⚙️",
                "TokenFX": "🎨",
                "TokenMod": "🪙",
                "Audio": "🎵",
                "Combat": "⚔️",
                "Utility": "🔧",
                "LightControl": "💡",
                "System": "⚙️"
            };
            return emojis[section] || "📋";
        },

        showMainMenu(msg, section = null) {
            if (CommandMenu.config.GM_ONLY && !CommandMenu.utils.isGM(msg)) {
                sendChat("API", "/w gm ⚠️ This menu is only available to the GM.");
                return;
            }

            let menu = [
                "&{template:default} {{name=Control Panel}}",
                "{{Reminder=⚠️ Select relevant token(s) before using commands!}}"
            ];

            // Add sections based on argument or show all
            if (section) {
                menu.push(this.getSectionContent(section));
            } else {
                Object.values(CommandMenu.config.MENU_SECTIONS).forEach(section => {
                    menu.push(this.getSectionContent(section));
                });
            }

            sendChat("API", `/w gm ${menu.join(" ")}`, null, {noarchive: true});
        },

        getSectionContent(section) {
            switch(section) {
                case CommandMenu.config.MENU_SECTIONS.SHOP:
                    return "{{Shop Controls=[" +
                           "🏪 Create Basic Shop](!shop create ?{Shop Name|New Shop}|?{Merchant Name|Unknown Merchant}|?{Shop Type|General Store|Blacksmith|Armorer|Alchemist|Magic Shop|Potion Shop|Scroll Shop|Tavern|Jeweler|Clothier|Adventuring Supplies|Exotic Goods})" +
                           "[🏬 Advanced Setup](!shop create_advanced ?{Shop Name|New Shop})" +
                           "[🛒 List Shops](!shop list)" +
                           "[📢 Display to Players](!shop display_to_players)" +
                           "[🛍️ Create Sample Shop](!shop sample)" +
                           "[📚 Item DB Init](!itemdb init)" +
                           "[📥 Start Bulk Import](!itemdb import)" +
                           "[➕ Add Item to DB](!itemdb add)" +
                           "[📋 List All DB Items](!itemdb list all all)" +
                           "[📖 Import Sample Items](!itemdb sample)" +
                           "[❓ Shop Help](!shop help)" +
                           "[❓ Database Help](!itemdb help)" +
                           "}}";
                
                case CommandMenu.config.MENU_SECTIONS.TRAP:
                const skillListQuery = CommandMenu.config.trapSystemSkillList.join('|');
                    return "{{Trap Controls (Basic)=[" +
                           "🎯 Setup Standard Trap](!trapsystem setup ?{Uses|1} ?{Main Macro - #MacroName, &quot;!cmd&quot;, &quot;Chat Text&quot;, &quot;^｛template｝&quot; - Note: remember to use quotes} ?{Optional Macro 2 - #MacroName, &quot;!Command&quot;, &quot;Chat Text&quot; - Note: remember to use quotes|None} ?{Optional Macro 3 - #MacroName, &quot;!Command&quot;, &quot;Chat Text&quot; - Note: remember to use quotes|None} ?{Movement - Note: If you select --Grid-- please adjust via the GM Notes|Intersection|Center|Grid} ?{Auto Trigger|false|true} ?{Auto Release Mode|off|timer|player|hybrid} ?{Auto Release Timer - seconds|30} ?{Auto Release Message - Use &quot;Message Here&quot;|&quot;Default release message&quot;})" +
                           `[🔍 Setup Interaction Trap](!trapsystem setupinteraction ?{Uses|1} ?{Primary Macro - #MacroName, &quot;!cmd&quot;, &quot;Chat Text&quot;, &quot;^｛template｝&quot; - Note: remember to use quotes|None} ?{Success Macro - #MacroName, &quot;!Command&quot;, &quot;Chat Text&quot; - Note: remember to use quotes|None} ?{Failure Macro - #MacroName, &quot;!Command&quot;, &quot;Chat Text&quot; - Note: remember to use quotes|None} ?{First Check Type|${skillListQuery}} ?{First Check DC|10} ?{Second Check Type|None|${skillListQuery}} ?{Second Check DC|10} ?{Movement Trigger Enabled|true|false} ?{Movement - Note: If you select --Grid-- please adjust via the GM Notes|Intersection|Center|Grid} ?{Auto Trigger|false|true} ?{Auto Release Mode|off|timer|player|hybrid} ?{Auto Release Timer - seconds|30} ?{Auto Release Message - Use &quot;Message Here&quot;|&quot;Default release message&quot;})` +
                           "[👥 Player Interaction](!trapsystem playerinteraction ?{Setting|on|off} ?{Proximity Range - feet|10})" +
                           "[🛠️ Setup Detection](!trapsystem passivemenu)" +
                           "[👁️ Set Detection Aura](!trapsystem setpassive showaura &#64;{selected|token_id} ?{Aura State?|On,true|Off,false})" +
                           "[🔄 Toggle Trap](!trapsystem toggle)" +
                           "[📊 Trap Status](!trapsystem status)" +
                           "[⚡ Trigger Trap](!trapsystem trigger)" +
                           "[💬 Show Interaction Menu](!trapsystem showmenu)" +
                           "[🚶‍♂️ Allow Movement](!trapsystem allowmovement selected)" +
                           "[🧑‍🤝‍🧑 Allow All Movement](!trapsystem allowall)" +
                           "[🧹 Reset Detection](!trapsystem resetdetection)" +
                           "[📋 Show Failed History](!trapsystem showfailedhistory)" +
                           "[🛡️ Toggle Immunity](!trapsystem ignoretraps)" +
                           "[✅ Enable System](!trapsystem enable)" +
                           "[❌ Disable System](!trapsystem disable)" +
                           "[❓ Help](!trapsystem help)" +
                           "}}";
                
                case "TrapSystem Advanced":
                    return "{{Trap Controls (Advanced)=[" +
                           "🙉 Hide Detections](!trapsystem hidedetection ?{Minutes - 0 for indefinitely|0})" +
                           "[🙈 Show Detections](!trapsystem showdetection)" +
                           "[💾 Export State & Macros](!trapsystem exportmacros)" +
                           "[⏮️ Reset Token States](!trapsystem resetstates)" +
                           "[📝 Reset Macro Actions](!trapsystem resetmacros)" +
                           "[💥 Reset - States & Macros](!trapsystem fullreset)" +
                           "[📊 Bulk Enable Token Bar](!trapsystem bulkenabletokenbar ?{Token Bar|bar1|bar2|bar3})" +
                           "[🚫 Bulk Disable Token Bar](!trapsystem bulkdisabletokenbar)" +
                           "[🎚️ Toggle Failed Detection](!trapsystem togglefaileddetection)" +
                           "[⚙️ Show Settings](!trapsystem showsettings)" +
                           "[🎯 Basic Trap Controls](!menu TrapSystem)" +
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.TOKEN_FX:
                    return "{{Token Effects (TokenFX)=[" +
                           "📊 Show Active FX](!fx-list)" +
                           "[📋 List Standard FX](!listStandardFx)" +
                           "[📋 List Custom FX](!listCustomFx)" +
                           "[🔍 Find by Tag](!fx-find-tag ?{Tag to find - no brackets})" +
                           "[❌ Stop ALL FX Loops](!stopAllFx)" +
                           "[🔗 Stop Chains](!stopChains)" +
                           "[🆔 Get IDs](!getSelectedIDs)" +
                           "[💡 TokenFX Help](!tokenfx help)" +
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.TOKEN_MOD:
                    return "{{Token Control (TokenMod)=[" +
                           "👁️ Toggle Name](!token-mod --flip showname)" +
                           "[👥 Toggle Player Name](!token-mod --flip showplayers_name)" +
                           "[📏 Aura1 R](!token-mod --set aura1_radius|?{Radius?|0})" +
                           "[🔴 Aura1](!token-mod --set aura1_color|#ff0000)" +
                           "[🟢 Aura1](!token-mod --set aura1_color|#00ff00)" +
                           "[🔵 Aura1](!token-mod --set aura1_color|#0000ff)" +
                           "[📏 Aura2 R](!token-mod --set aura2_radius|?{Radius?|0})" +
                           "[🔴 Aura2](!token-mod --set aura2_color|#ff0000)" +
                           "[🟢 Aura2](!token-mod --set aura2_color|#00ff00)" +
                           "[🔵 Aura2](!token-mod --set aura2_color|#0000ff)" +
                           "[🔄 Clear Auras](!token-mod --set aura1_radius| aura2_radius|)" +
                           "[🔦 Torch On](!token-mod --on light_hassight --set light_radius|?{Bright Radius|20} light_dimradius|?{Low Light Total|40})" +
                           "[⚫ Light Off](!token-mod --off light_hassight --set light_radius|0 light_dimradius|0)" +
                           "[🔄 Clear Statuses](!token-mod --set statusmarkers|=)" +
                           "[💀 Death Command](!token-mod --set statusmarkers|!dead --set layer|map --set bar1_value|0)" +
                           "[🔄 Set Default Token](!token-mod --set defaulttoken)" +
                           "[🔗 Unlink Character](!token-mod --set represents|)" +
                           "[❓ TokenMod Help](!token-mod --help)" +
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.AUDIO:
                    return "{{Audio Controls=[" +
                           "⚙️ Import Config](!roll20AM --config,import)" +
                           "[📋 Track Menu](!roll20AM --config)" +
                           "[🔑 Edit Access](!roll20AM --edit,access|?{Select Player|All Players,all|Current Player,player|GM Only,gm})" +
                           "[⏹️ Stop AM Audio](!roll20AM --audio,stop)" +
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.COMBAT:
                    return "{{Basic Combat=[" +
                           // Core Initiative
                           "⚔️ Roll Init](!group-init)" + // Roll Initiative: Roll initiative for selected tokens
                           "[🔄 Reroll Init](!group-init --reroll)" + // Reroll Init: Reroll initiative for current turn order
                           "[📊 Sort Init](!group-init --sort)" + // Sort Init: Sort current turn order
                           "[🗑️ Clear Init](!group-init --clear)" + // Clear Init: Remove all from turn order
                           "[📋 Turn Order](!group-init --toggle-turnorder)" + // Turn Order: Toggle turn order window
                           // Core Group Checks
                           "[🎲 Group Check](!group-check)" + // Group Check: Roll a check for all selected tokens
                           "[🎲 Multi-Roll](!group-check --multi ?{Times|2})" + // Multi-Roll: Roll multiple times for each token
                           "[📊 Show Average](!group-check --showaverage)" + // Show Average: Display average of all rolls
                           // Quick Adjustments
                           "[➕ Add Bonus](!group-init --bonus ?{Bonus|0})" + // Add Bonus: Add a bonus to initiative rolls
                           "[📊 Adjust All](!group-init --adjust ?{Adjustment|0} ?{Minimum|-10000})" + // Adjust All: Modify all initiatives by a value
                           // Menu Navigation
                           "[⚔️ Advanced Combat](!menu combat_advanced)" + // Advanced Combat: Open advanced combat menu
                           "[⚙️ Combat Config](!menu combat_config)" + // Combat Config: Open configuration menu
                           "[⚙️ Init Menu](!group-init --help)" + // Init Menu: Open GroupInitiative's native menu
                           "[⚙️ Check Menu](!group-check --help)" + // Check Menu: Open GroupCheck's native menu
                           "}}";

                case "combat_advanced":
                    return "{{Advanced Combat=[" +
                           // Stack Management
                           "💾 Save Order](!group-init --stack copy)" + // Save Order: Save current initiative order
                           "[📥 Load Order](!group-init --stack pop)" + // Load Order: Restore last saved order
                           "[🔄 Rotate Orders](!group-init --stack rotate)" + // Rotate Orders: Cycle through saved orders
                           "[🔄 Reverse Rotate](!group-init --stack reverse-rotate)" + // Reverse Rotate: Cycle backwards
                           "[🔄 Swap Orders](!group-init --stack swap)" + // Swap Orders: Exchange current with saved
                           "[📋 List Saved](!group-init --stack list)" + // List Saved: Show all saved orders
                           "[🗑️ Clear Saved](!group-init --stack clear)" + // Clear Saved: Remove all saved orders
                           // Advanced Stack Operations
                           "[📤 Push Order](!group-init --stack push)" + // Push Order: Save and clear turn order
                           "[📥 Apply Order](!group-init --stack apply)" + // Apply Order: Use saved without removing
                           "[🔄 Merge Orders](!group-init --stack merge)" + // Merge Orders: Combine with saved
                           "[🔄 Apply & Merge](!group-init --stack apply-merge)" + // Apply & Merge: Merge without removing
                           "[🔄 Tail Swap](!group-init --stack tail-swap)" + // Tail Swap: Swap with first saved
                           // Advanced Initiative
                           "[📊 Adjust Current](!group-init --adjust-current ?{Adjustment|0} ?{Minimum|-10000})" + // Adjust Current: Modify current turn
                           "[🎲 Roll Specific](!group-init --ids ?{Token IDs|})" + // Roll Specific: Roll for specific tokens
                           // Advanced Checks
                           "[🎲 Raw Rolls](!group-check --raw ?{Subheader|})" + // Raw Rolls: Show just the dice
                           "[🎲 Custom Button](!group-check --button ?{Button Name|} ?{Command|})" + // Custom Button: Add button to results
                           "[🎲 Send Command](!group-check --send ?{Command|})" + // Send Command: Send with results
                           "[🎲 Input Replace](!group-check --input ?{Inputs|})" + // Input Replace: Replace formula parts
                           // Menu Navigation
                           "[⚔️ Basic Combat](!menu combat)" + // Basic Combat: Return to basic menu
                           "[⚙️ Combat Config](!menu combat_config)" + // Combat Config: Open configuration menu
                           "}}";

                case "combat_config":
                    return "{{Combat Configuration=[" +
                           // Initiative Configuration
                           "🎲 Set Die Size](!group-init-config --set-die-size|?{Die Size|20})" + // Die Size: Change initiative die
                           "[🎲 Set Dice Count](!group-init-config --set-dice-count|?{Dice Count|1})" + // Dice Count: Set number of dice
                           "[🎲 Set Dice Mod](!group-init-config --set-dice-mod|?{Modifier|})" + // Dice Mod: Add modifiers
                           "[📊 Set Decimals](!group-init-config --set-max-decimal|?{Decimals|2})" + // Decimal: Set precision
                           "[⚙️ Toggle Auto Open](!group-init-config --toggle-auto-open-init)" + // Auto Open: Toggle auto-opening
                           "[⚙️ Toggle Replace](!group-init-config --toggle-replace-roll)" + // Replace Roll: Toggle replacing
                           "[⚙️ Toggle Preserve](!group-init-config --toggle-preserve-first)" + // Preserve First: Keep first turn
                           // Check Configuration
                           "[🎲 Import Checks](!group-check-config --import ?{Sheet Type|5E-Shaped|5E-OGL|Pathfinder-Official|Pathfinder-Community|3.5})" + // Import Checks: Import formulas
                           "[🎲 Add Custom Check](!group-check-config --add ?{JSON|})" + // Add Custom Check: Add formula
                           "[🎲 Delete Check](!group-check-config --delete ?{Check Name|})" + // Delete Check: Remove check
                           "[⚙️ Set Roll Option](!group-check-config --set ro ?{Option|roll1|roll2|adv|dis|rollsetting})" + // Set Roll Option: Configure rolls
                           "[⚙️ Set Global Mod](!group-check-config --set globalmod ?{Modifier|0})" + // Set Global Mod: Add modifier
                           "[⚙️ Toggle Dark Mode](!group-check-config --set darkmode)" + // Toggle Dark Mode: Switch theme
                           // Display Options
                           "[👤 Use Token Name](!group-check-config --set usetokenname)" + // Use Token Name: Display token name
                           "[👤 Use Char Name](!group-check-config --set usecharname)" + // Use Char Name: Display char name
                           "[👤 Show Name](!group-check-config --set showname)" + // Show Name: Display names
                           "[👤 Hide Name](!group-check-config --set hidename)" + // Hide Name: Hide names
                           "[🖼️ Show Picture](!group-check-config --set showpicture)" + // Show Picture: Display images
                           "[🖼️ Hide Picture](!group-check-config --set hidepicture)" + // Hide Picture: Hide images
                           "[📝 Show Formula](!group-check-config --set showformula)" + // Show Formula: Display formulas
                           "[📝 Hide Formula](!group-check-config --set hideformula)" + // Hide Formula: Hide formulas
                           // Menu Navigation
                           "[⚔️ Basic Combat](!menu combat)" + // Basic Combat: Return to basic menu
                           "[⚔️ Advanced Combat](!menu combat_advanced)" + // Advanced Combat: Open advanced menu
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.UTILITY:
                    return "{{Utility (GM Tools)=[" +
                           "📋 Export Macros](!exportmacros)<br>" +
                           "[🎯 Export Traps](!exporttraps)<br>" +
                           "[📤 Export All Data](!exportall)<br>" +
                           "[🔄 Migrate Traps](!migrate-traps)<br>" +
                           "[✈️ Migrate Selected Traps](!migrate-traps selected)<br>" +
                           "[🧪 Dry Run Migration](!migrate-traps --dry-run)<br>" +
                           "[🔍 Inspect Object](!getselprops)<br>" +
                           "[🚪 Inspect Doors](!getdoorprops)<br>" +
                           "[🔄 Reset Triggers](!tt-reset)<br>" +
                           "[🐞 Toggle Debug](!tt-debug)<br>" +
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.SYSTEM:
                    return "{{System Operations=[" +
                           "⚙️ Main Menu](!menu)" +                  // Returns to the full main menu
                           "[❓ CommandMenu Help](!menu help)" +     // Shows CommandMenu's own help
                           // APIHeartBeat Integration
                           "[💓 API Status Check](!api-heartbeat --check)" +        // Quick check if API is responsive
                           "[📊 API Latency Graph](!api-heartbeat --histogram)" +  // Shows latency graph (GM useful)
                           "[📜 API Run History](!api-heartbeat --history)" +      // Shows sandbox run history (GM useful)
                           "[⚙️ APIHeartBeat Config](!api-heartbeat --help)" +   // Access APIHeartBeat help & config
                           "}}";

                case CommandMenu.config.MENU_SECTIONS.LIGHTING:
                    return "{{Lighting Controls=[" +
                           // Wall Controls
                           "🧱 Wall: Hide](!wall ?{Wall ID} hide)" +
                           "[🧱 Wall: Reveal](!wall ?{Wall ID} reveal)" +
                           // Door Controls
                           "[🚪 Doors (Page): Action](!door all_on_page ?{Action|open|close|lock|unlock|reveal|set_secret_true})" +
                           "[🚪 Doors (Area): Action](!door area ?{Shape|square|circle} ?{Dimension - grids|3} ?{Action|open|close|lock|unlock})" +
                           // Darkness Toggle
                           "[💡 Toggle Darkness (Area)](!lc toggledarkness ?{Shape|square|circle} ?{Dimension - grids|5} --id ?{Switch Name - optional|default_toggle})" +
                           // Help
                           "[❓ LightControl Help](!lc help)" +
                           "}}";

                default:
                    return "";
            }
        },

        showHelpMenu(msg) {
            if (CommandMenu.config.GM_ONLY && !CommandMenu.utils.isGM(msg)) {
                sendChat("API", "/w gm ⚠️ This menu is only available to the GM.");
                return;
            }

            let help = [
                "&{template:default} {{name=Help Menu}}",
                "{{Shop System=" +
                "• Create Shop: Make a new shop handout<br>" +
                "• List Shops: Show all available shops<br>" +
                "• Manage Stock: Add/remove items<br>" +
                "• View Stock: See current inventory<br>" +
                "• Categories: weapons, armor, potions, scrolls, magic, equipment" +
                "}}",
                "{{Trap System (Basic)=" +
                "• Setup Standard Trap: Create a normal trap with macros<br>" +
                "• Setup Interaction Trap: Create a trap with skill checks<br>" +
                "• Toggle arms/disarms the selected trap<br>" +
                "• Status shows current trap configuration<br>" +
                "• Trigger opens the control panel<br>" +
                "• Allow Movement frees a trapped token<br>" +
                "• Player Interaction: Enable/disable player menus and proximity<br>" +
                "• Setup Detection: Configure passive detection systems<br>" +
                "• Enable/Disable System: Control trap triggers globally<br>" +
                "**- Standard Traps:**<br>" +
                "&nbsp;&nbsp;- Up to 3 macros can be set<br>" +
                "&nbsp;&nbsp;- Movement options: Default, Center, or Grid<br>" +
                "**- Interaction Traps:**<br>" +
                "&nbsp;&nbsp;- Success and failure macros<br>" +
                "&nbsp;&nbsp;- Up to 2 skill checks with DCs<br>" +
                "&nbsp;&nbsp;- Supports flat rolls (no modifiers)<br>" +
                "&nbsp;&nbsp;- Players can explain actions<br>" +
                "**- Auto-Release System:**<br>" +
                "&nbsp;&nbsp;- Timer Release: Automatically release tokens after a set time<br>" +
                "&nbsp;&nbsp;- Player Release: Allow players to request release via button<br>" +
                "&nbsp;&nbsp;- Hybrid Release: Both timer and player release options<br>" +
                "&nbsp;&nbsp;- Custom Messages: Set personalized release notifications<br>" +
                "&nbsp;&nbsp;- Safe Movement: Prevents re-triggering after auto-release" +
                "}}",
                "{{Trap System (Advanced)=" +
                "• Hide/Show Detections: Control detection aura visibility<br>" +
                "• Export State & Macros: Save current states and macro actions<br>" +
                "• Reset Functions: Restore saved states and macro actions<br>" +
                "• Bulk Token Bar: Enable/disable token bar fallback globally<br>" +
                "• Failed Detection Tracking: Monitor failed detection attempts<br>" +
                "• Show Settings: Display current system configuration<br>" +
                "**- State Management:**<br>" +
                "&nbsp;&nbsp;- Export State & Macros: Saves current token/object states and macro actions<br>" +
                "&nbsp;&nbsp;- Reset Token/Object States: Restores saved physical states of tokens and objects<br>" +
                "&nbsp;&nbsp;- Reset Macro Actions: Restores macro actions to their saved versions<br>" +
                "&nbsp;&nbsp;- Full Reset: Performs both state and macro action resets<br>" +
                "**- Bulk Token Bar Management:**<br>" +
                "&nbsp;&nbsp;- Bulk Enable Token Bar: Quickly enable token bar fallback for all traps (useful when experimental API is unavailable)<br>" +
                "&nbsp;&nbsp;- Bulk Disable Token Bar: Revert token bar fallback settings for all traps<br>" +
                "&nbsp;&nbsp;- Options: bar1, bar2, bar3 (defaults to bar1 if not specified)<br>" +
                "**- Failed Detection Tracking:**<br>" +
                "&nbsp;&nbsp;- Toggle Failed Detection: Enable/disable notifications when characters fail to spot traps<br>" +
                "&nbsp;&nbsp;- Show Failed History: View failed detection attempts for the current page<br>" +
                "&nbsp;&nbsp;- Show Settings: Display current system settings and configuration<br>" +
                "&nbsp;&nbsp;- Settings persist across API restarts via the 'TrapSystem Settings' handout" +
                "}}",
                "{{Lighting Controls (New!)=" +
                "• Wall Commands: Hide, reveal, move, or change layer of Dynamic Lighting walls.<br>" +
                "• Door Commands: Open, close, lock, unlock, reveal individual doors/windows, all on page, or in an area.<br>" +
                "• Toggle Darkness: Turn lights on/off in an area, remembering previous states (uses TokenMod).<br>" +
                "• GM Only: Page/Area door commands and Toggle Darkness require GM privileges.<br>" +
                "• Select Token: Area commands (doors, darkness) are centered on selected token(s).<br>" +
                "• Help: `!lc help` for detailed command syntax." +
                "}}",
                "{{Token Effects=" +
                "• Set Aura adds visible radius<br>" +
                "• List commands show available effects<br>" +
                "• Stop FX cancels all active effects<br>" +
                "• Stop All Audio ends all sounds" +
                "}}",
                "{{Audio Controls=" +
                "• Import: Load audio configuration<br>" +
                "• Track Menu: Manage available tracks<br>" +
                "• Edit Access: Set player permissions<br>" +
                "• Play/Stop: Basic audio controls" +
                "}}",
                "{{Combat Tools=" +
                "• Initiative: Roll for selected tokens<br>" +
                "• Reroll: New initiative for current order<br>" +
                "• Sort/Clear: Manage turn order<br>" +
                "• Config: Advanced settings" +
                "}}",
                "{{Token Controls=" +
                "• Set Aura: Add visible radius<br>" +
                "• Token Help: Show all token commands<br>" +
                "• List/Stop: Manage visual effects" +
                "}}",
                "{{Utility=" +
                "**- Table Controls (New!):**<br>" +
                "• Roll Table by Name: Rolls a specified rollable table and outputs the result to chat. Can whisper results." +
                "}}",
                "{{Note=Most commands work with selected tokens}}",
                "{{Direct Menu Commands=" +
                "Use these to open a specific menu:<br>" +
                "• `!menu ShopSystem`<br>" +
                "• `!menu TrapSystem` (Basic)<br>" +
                "• `!menu TrapSystem Advanced` (Advanced)<br>" +
                "• `!menu TokenFX`<br>" +
                "• `!menu TokenMod`<br>" +
                "• `!menu Audio`<br>" +
                "• `!menu Combat`<br>" +
                "• `!menu Utility`<br>" +
                "• `!menu LightControl`<br>" +
                "• `!menu System`" +
                "}}"
            ];

            sendChat("API", `/w gm ${help.join(" ")}`, null, {noarchive: true});
        }
    }
};

// Initialize on ready
on("ready", async function() {
    CommandMenu.state.startTime = Date.now();
    
    // Add status for core systems
    CommandMenu.utils.addInitStatus('CommandMenu', 'success', null, 'success');
    
    // Process TokenFX errors and warnings from startup
    if (typeof TokenFX !== 'undefined' && TokenFX.state && TokenFX.state.errors && TokenFX.state.errors.length > 0) { // Check if TokenFX and its state exist
        CommandMenu.utils.addInitStatus('TokenFX', 'warning', 'Some custom FX may have failed to load. Check API console.', 'warning');
    } else if (typeof TokenFX !== 'undefined') {
        CommandMenu.utils.addInitStatus('TokenFX', 'success', null, 'success');
    } else {
        CommandMenu.utils.addInitStatus('TokenFX', 'pending', 'TokenFX not detected or not yet initialized.', 'pending');
    }

    // [NEW] Check for Sandbox version directly
    try {
        const sandboxVersion = (Campaign() || {}).sandboxVersion || 'default';
        if (sandboxVersion.toLowerCase() === 'default') {
            CommandMenu.utils.addInitStatus(
                'Sandbox', 
                'warning', 
                'Running on Legacy Sandbox. Some features may be unavailable.', 
                'warning'
            );
        } else {
            const sandboxType = sandboxVersion.toLowerCase().includes('experimental') ? 'Experimental' : 'Standard';
            CommandMenu.utils.addInitStatus(
                `Sandbox (${sandboxType})`, 
                'success', 
                `Running on New Sandbox (v${sandboxVersion}).`, 
                'success'
            );
        }
    } catch (e) {
        CommandMenu.utils.addInitStatus(
            'Sandbox',
            'error',
            'Could not determine Sandbox version. Assume Legacy.',
            'error'
        );
        CommandMenu.utils.log(`Sandbox Check Error: ${e.message}`, 'error');
    }
    
    // Show startup menu after a short delay to allow other systems to initialize
    setTimeout(() => {
        CommandMenu.menu.showStartupMenu();
    }, 2000);
});

// Handle chat messages
on("chat:message", function(msg) {
    if (msg.type !== "api") return;
    
    let args = msg.content.split(" ");
    let command = args[0];

    if (command === "!menu") {
        // Log for debugging
        CommandMenu.utils.log(`Command received: ${msg.content}`, "info");
        CommandMenu.utils.log(`Parsed arguments: ${JSON.stringify(args)}`, "info");
        CommandMenu.utils.log(`Chat message: ${JSON.stringify(msg)}`, "debug");
        
        if (args[1] === "help") {
            CommandMenu.menu.showHelpMenu(msg);
        } else if (args[1] === "quick") {
            CommandMenu.menu.showQuickMenu(msg);
        } else {
            // Handle multi-word section names by joining args after the command
            const sectionName = args.slice(1).join(" ");
            if (sectionName && Object.values(CommandMenu.config.MENU_SECTIONS).includes(sectionName)) {
                CommandMenu.menu.showMainMenu(msg, sectionName);
            } else {
                CommandMenu.menu.showMainMenu(msg);
            }
        }
    }
});