// =================================================================================
// Enhanced TriggerControl Script v3.0.0 (Refactored)
// =================================================================================
// This script provides a modular and robust system for handling various triggers in Roll20.
//
// 1. TABLE TRIGGER SYSTEM
//    - Automatically executes commands when rolling on rollable tables.
//    - Usage: Wrap any command, macro, or text in { } in your table items.
//    - Example: {&{template:default} {{name=Trap}} {{text=You triggered something!}} }
//    - Example: { #MyMacro }
//    - Example: { !token-mod --set statusmarkers|=red; !some-other-command }
//
// 2. TURN ORDER TRIGGER SYSTEM
//    - Executes commands when a token's turn begins in combat.
//    - Usage: Add [TOT: settings] command to a token's GM Notes.
//    - Format: [TOT: settings] command
//    - Settings (comma-separated):
//      - once or 1: Command only fires once per combat.
//      - #: Number of times to trigger (e.g., "3" for 3 times).
//      - round>#: Only trigger after this round number (e.g., "round>3").
//      - gm: Only visible to GM (whisper).
//      - player: Only visible to the token's controlling player.
//      - all: Visible to everyone (default).
//    - Examples:
//      - [TOT: 1] #StartOfTurnMacro
//      - [TOT: 2,gm] &{template:default} {{name=Secret Message}}
//      - [TOT: round>2,once] &{template:default} {{name=Lair Action}} {{text=The ground shakes!}}
//
// 3. CRITICAL HIT/FAIL TRIGGER
//    - Automatically rolls on a designated table when a player rolls a natural 20 or 1.
//    - This feature is active only when the turn tracker is open.
//    - It supports both D&D 2024 and legacy 2014 character sheets automatically.
//    - Configuration: Table names can be changed in the CONFIG section below.
//
// 4. NPC ATTACK TEMPLATES
//    - A powerful system for generating NPC attacks from character sheets.
//    - Full Support for D&D 2024 sheets (using 'store' and 'integrants').
//    - Full backward compatibility for legacy 2014 sheets (using repeating sections).
//    - Simplified Format: $npc{CharacterName|AttackName|options}
//    - Examples:
//      - $npc{Goblin|Scimitar}
//      - $npc{Goblin|Scimitar|attack}
//      - $npc{Goblin|Scimitar|attack+damage}
//      - $npc{Goblin|Scimitar|full} (shows attack, damage, description, save)
//
// 5. COMMANDS
//    - !tt-reset: Manually resets all trigger counts and the round number.
//    - !tt-debug: Toggles extra debug logging to the API console.
//    - !rtm [TableName]: Manually rolls on the specified table.
//    - !npc [CharacterName]|[AttackName]|[options]: Creates an NPC attack template in chat.
//    - !npc-debug-attrs [CharacterName]: Whispers a list of key attributes for a character,
//      useful for debugging issues with attack calculations.
//
// =================================================================================

var TriggerControl = (() => {
    'use strict';

    // [MODULE] CONFIGURATION
    const CONFIG = {
        DEBUG: true,
        ENABLE_CRITICAL_ROLL_TRIGGER: true,
        SHOW_CRITICAL_MESSAGES: false, // Show "Detected a NAT 20/1" messages
        CRITICAL_HIT_TABLE_NAME: "Critical-Hit",
        CRITICAL_FAIL_TABLE_NAME: "Critical-Failure",
        CRITICAL_HIT_VALUE: 20,
        CRITICAL_FAIL_VALUE: 1,
        SHOW_TOKEN_IMAGES: true,
        VERSION: "3.0.0"
    };

    // [MODULE] STATE MANAGEMENT
    const StateManager = {
        initialize: () => {
            if (!state.TurnOrderTrigger) state.TurnOrderTrigger = {};
            const defaults = {
                triggeredCount: {},
                roundNumber: 1,
                topOfRoundTokenId: null
            };
            Object.keys(defaults).forEach(key => {
                if (typeof state.TurnOrderTrigger[key] === 'undefined') {
                    log(`⚙️ Initializing state property: TurnOrderTrigger.${key}`);
                    state.TurnOrderTrigger[key] = defaults[key];
                }
            });
            if (state.TurnOrderTrigger.triggeredOnce) {
                log("⚙️ Migrating state: removing old 'triggeredOnce' property.");
                delete state.TurnOrderTrigger.triggeredOnce;
            }
        },
        reset: () => {
            state.TurnOrderTrigger.triggeredCount = {};
            state.TurnOrderTrigger.roundNumber = 1;
            state.TurnOrderTrigger.topOfRoundTokenId = null;
            log('🔄 TriggerControl counts and round number have been reset.');
            sendChat('TriggerControl', '/w gm Trigger counts and round number have been reset.');
        },
        getState: () => state.TurnOrderTrigger,
        getRoundNumber: () => state.TurnOrderTrigger.roundNumber,
        setRoundNumber: (num) => { state.TurnOrderTrigger.roundNumber = num; },
        getTopOfRoundTokenId: () => state.TurnOrderTrigger.topOfRoundTokenId,
        setTopOfRoundTokenId: (id) => { state.TurnOrderTrigger.topOfRoundTokenId = id; },
        getTriggerCount: (tokenId) => state.TurnOrderTrigger.triggeredCount[tokenId] || 0,
        incrementTriggerCount: (tokenId) => {
            const count = StateManager.getTriggerCount(tokenId) + 1;
            state.TurnOrderTrigger.triggeredCount[tokenId] = count;
            return count;
        }
    };

    // [MODULE] SHEET INTERACTION
    // Handles all communication with character sheets, supporting both legacy and D&D 2024.
    const SheetManager = {
        // Cache to store sheet type results for performance.
        _sheetTypeCache: {},
        _storeDataCache: {},
        
        /**
         * Checks if a character is using the D&D 2024 sheet.
         * @param {string} charId - The character ID.
         * @returns {boolean}
         */
        isD2024Sheet: (charId) => {
            if (SheetManager._sheetTypeCache[charId] !== undefined) {
                return SheetManager._sheetTypeCache[charId];
            }
            const sheetVersion = getAttrByName(charId, 'sheetVersion');
            const appState = getAttrByName(charId, 'appState');
            const is2024 = sheetVersion === '5' || appState === 'npc';
            SheetManager._sheetTypeCache[charId] = is2024;
            return is2024;
        },

        /**
         * A unified, ASYNCHRONOUS function to get any attribute value.
         * IMPORTANT: This function is async and must be awaited.
         * @param {string} charId - The character ID.
         * @param {string} attrName - The name of the attribute to retrieve.
         * @returns {Promise<string|number|undefined>}
         */
        getAttrAsync: (charId, attrName) => {
            return new Promise(resolve => {
                if (SheetManager.isD2024Sheet(charId)) {
                    // For D&D 2024 sheets, ONLY use getSheetItem, as it handles calculated attributes.
                    getSheetItem(charId, attrName, (value) => {
                        if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] D2024 getSheetItem for '${attrName}': ${value}`);
                        resolve(value);
                    });
                } else {
                    // For legacy sheets, getAttrByName is sufficient.
                    if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] Legacy getAttrByName for '${attrName}'`);
                    resolve(getAttrByName(charId, attrName));
                }
            });
        },
        
        /**
         * Gets the 'store' data object from a D&D 2024 sheet.
         * @param {string} charId - The character ID.
         * @returns {Promise<object|null>}
         */
        getStoreDataAsync: (charId) => {
            return new Promise(resolve => {
                getSheetItem(charId, "store", (value) => {
                    if (!value) {
                         if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ 'store' attribute not found.`);
                        resolve(null);
                        return;
                    }
                    try {
                        const data = typeof value === 'string' ? JSON.parse(value) : value;
                        resolve(data);
                    } catch (e) {
                        if (CONFIG.DEBUG) log(`[DEBUG] Failed to parse store data for ${charId}: ${e.message}`);
                        resolve(null);
                    }
                });
            });
        },
        
        /**
         * Gets the 'store' data object from a D&D 2024 sheet.
         * @param {string} charId - The character ID.
         * @returns {object|null}
         */
        getStoreData: (charId) => {
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] Attempting to get 'store' attribute via getAttrByName.`);
            const storeValue = getAttrByName(charId, 'store');
            
            if (!storeValue) {
                if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ 'store' attribute not found via getAttrByName.`);
                return null;
            }
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ 'store' attribute found. Type: ${typeof storeValue}`);

            try {
                // The attribute can be a stringified JSON or a direct object.
                const data = typeof storeValue === 'string' ? JSON.parse(storeValue) : storeValue;
                return data;
            } catch (e) {
                if (CONFIG.DEBUG) log(`[DEBUG] Failed to parse store data for ${charId}: ${e.message}`);
                return null;
            }
        },
        
        /**
         * Gets the modifier for a specific ability (e.g., 'Strength').
         * This MUST use getSheetItem for D&D 2024 sheets as _mod attributes are calculated.
         * @param {string} charId - The character ID.
         * @param {string} abilityName - The full name of the ability (e.g., "Strength").
         * @returns {Promise<number>}
         */
        getAbilityModifierAsync: async (charId, abilityName) => {
            if (!abilityName || abilityName === 'none') return 0;
            const modAttrName = `${abilityName.toLowerCase()}_mod`;

            // Your test tool proves getSheetItem returns a promise that resolves correctly.
            // Awaiting it directly is the correct pattern.
            try {
                const mod = await getSheetItem(charId, modAttrName);
                const parsedMod = parseInt(mod || '0', 10);

                if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ getSheetItem for '${modAttrName}' resolved to: ${parsedMod}`);
                return isNaN(parsedMod) ? 0 : parsedMod;
            } catch (err) {
                if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ getSheetItem for '${modAttrName}' rejected: ${err.message}`);
                return 0;
            }
        },

        /**
         * Gets the character's proficiency bonus.
         * For D&D 2024 NPCs, calculates from CR if 'pb' attribute is not found.
         * @param {string} charId - The character ID.
         * @returns {Promise<number>}
         */
        getProficiencyBonusAsync: async (charId) => {
            const profAttrNames = ['pb', 'proficiency_bonus'];
            for (const attrName of profAttrNames) {
                const pb = getAttrByName(charId, attrName);
                if (pb) {
                    const parsed = parseInt(pb, 10);
                    if (!isNaN(parsed)) {
                        if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] Found PB ${parsed} from '${attrName}'`);
                        return parsed;
                    }
                }
            }

            if (SheetManager.isD2024Sheet(charId)) {
                const cr = SheetManager.getChallengeRating(charId);
                if (cr !== null) {
                    const pbFromCr = SheetManager.calculateProficiencyFromCR(cr);
                    if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Calculated PB ${pbFromCr} from CR ${cr}`);
                    return pbFromCr;
                }
            }
            
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ⚠️ Could not find PB for char ${charId}, defaulting to 2.`);
            return 2; // Default if nothing else is found
        },

        /**
         * Gets the challenge rating for an NPC. This is synchronous.
         * @param {string} charId - The character ID.
         * @returns {number|null}
         */
        getChallengeRating: (charId) => {
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] --- Getting Challenge Rating ---`);
            const crAttr = getAttrByName(charId, 'npc_challenge');
            if (crAttr) {
                 const parsed = parseFloat(crAttr);
                 if (!isNaN(parsed)) {
                     if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Found CR ${parsed} from 'npc_challenge' attribute.`);
                     return parsed;
                 }
            }
            
            const storeData = SheetManager.getStoreData(charId);
            if (storeData && storeData.npc && storeData.npc.challengeRating) {
                const parsed = parseFloat(storeData.npc.challengeRating);
                if (!isNaN(parsed)) {
                    if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Found CR ${parsed} from 'store.npc.challengeRating'.`);
                    return parsed;
                }
            }

            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ CR not found.`);
            return null;
        },

        /**
         * Calculates proficiency bonus from a challenge rating.
         * @param {number} cr - The challenge rating.
         * @returns {number}
         */
        calculateProficiencyFromCR: (cr) => {
            if (cr >= 29) return 9;
            if (cr >= 25) return 8;
            if (cr >= 21) return 7;
            if (cr >= 17) return 6;
            if (cr >= 13) return 5;
            if (cr >= 9) return 4;
            if (cr >= 5) return 3;
            return 2;
        },

        /**
         * Finds a D&D 2024 attack integrant by name.
         * @param {object} storeData - The parsed store data object.
         * @param {string} attackName - The name of the attack to find.
         * @returns {object|null}
         */
        _findD2024AttackIntegrant: (storeData, attackName) => {
            if (!storeData || !storeData.integrants || !storeData.integrants.integrants) return null;
            const integrants = storeData.integrants.integrants;
            const lowerAttackName = attackName.toLowerCase().trim();

            for (const integrant of Object.values(integrants)) {
                if (integrant.type === 'Attack' && integrant._enabled && integrant.name &&
                    integrant.name.toLowerCase().trim() === lowerAttackName) {
                    if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Found D2024 attack integrant: "${integrant.name}"`);
                    return integrant;
                }
            }
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ No D2024 attack integrant found for "${attackName}"`);
            return null;
        },
        
        /**
         * Gets damage components for a D&D 2024 attack integrant.
         * @param {object} storeData - The parsed store data object.
         * @param {object} attackIntegrant - The attack integrant object.
         * @returns {Array<object>}
         */
        _getD2024DamageComponents: (storeData, attackIntegrant) => {
             const damageComponents = [];
             if (!attackIntegrant.childIDs || !storeData.integrants || !storeData.integrants.integrants) {
                 return damageComponents;
             }
             
             let childIds;
             try {
                childIds = typeof attackIntegrant.childIDs === 'string' ? JSON.parse(attackIntegrant.childIDs) : attackIntegrant.childIDs;
             } catch (e) {
                 if (CONFIG.DEBUG) log(`[DEBUG] Failed to parse childIDs: ${e.message}`);
                 return damageComponents;
             }
             
             for (const childId of childIds) {
                 const child = storeData.integrants.integrants[childId];
                 if (child && child.type === 'Damage' && child._enabled) {
                     damageComponents.push(child);
                 }
             }
             return damageComponents;
        },

        /**
         * Finds a D&D 2024 Action (e.g., Legendary Action) integrant by name.
         * @param {object} storeData - The parsed store data object.
         * @param {string} attackName - The name of the attack to find.
         * @returns {object|null}
         */
        _findD2024ActionIntegrant: (storeData, attackName) => {
            if (!storeData || !storeData.integrants || !storeData.integrants.integrants) return null;
            const integrants = storeData.integrants.integrants;
            const lowerAttackName = attackName.toLowerCase().trim();

            for (const integrant of Object.values(integrants)) {
                if ((integrant.type === 'Attack' || integrant.type === 'Action') && 
                    integrant._enabled && integrant.name &&
                    integrant.name.toLowerCase().trim() === lowerAttackName) {
                    if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Found D2024 integrant: "${integrant.name}" (Type: ${integrant.type})`);
                    return integrant;
                }
            }
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ No D2024 integrant found for "${attackName}"`);
            return null;
        },
        
        /**
         * Gets damage components for a D&D 2024 attack integrant.
         * @param {object} storeData - The parsed store data object.
         * @param {object} attackIntegrant - The attack integrant object.
         * @returns {Array<object>}
         */
        _getD2024DamageComponents: (storeData, attackIntegrant) => {
             const damageComponents = [];
             if (!attackIntegrant.childIDs || !storeData.integrants || !storeData.integrants.integrants) {
                 return damageComponents;
             }
             
             let childIds;
             try {
                childIds = typeof attackIntegrant.childIDs === 'string' ? JSON.parse(attackIntegrant.childIDs) : attackIntegrant.childIDs;
             } catch (e) {
                 if (CONFIG.DEBUG) log(`[DEBUG] Failed to parse childIDs: ${e.message}`);
                 return damageComponents;
             }
             
             for (const childId of childIds) {
                 const child = storeData.integrants.integrants[childId];
                 if (child && child.type === 'Damage' && child._enabled) {
                     damageComponents.push(child);
                 }
             }
             return damageComponents;
        },

        /**
         * The main unified function to get all data for a specific attack or action.
         * It auto-detects the sheet type and calls the appropriate parser.
         * @param {string} charId - The character ID.
         * @param {string} actionName - The name of the attack or action.
         * @returns {Promise<object|null>} A standardized data object.
         */
        getActionDataAsync: async (charId, actionName) => {
            if (SheetManager.isD2024Sheet(charId)) {
                const storeData = SheetManager.getStoreData(charId);
                if (!storeData) return null;
                
                const integrant = SheetManager._findD2024ActionIntegrant(storeData, actionName);
                if (!integrant) return null;

                if (integrant.type === 'Attack') {
                    // Pass the already found data to the parser to be more efficient
                    return SheetManager._getD2024AttackDataAsync(charId, storeData, integrant);
                } else if (integrant.type === 'Action') {
                    return SheetManager._getD2024GenericActionData(integrant);
                }
            } else {
                // Legacy sheets only support finding attacks by name
                return SheetManager._getLegacyAttackDataAsync(charId, actionName);
            }
            return null;
        },

        /**
         * Parses a D&D 2024 attack and returns a standardized data object.
         * @private
         */
        _getD2024AttackDataAsync: async (charId, storeData, attackIntegrant) => {
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] --- Starting D&D 2024 Attack Parse for "${attackIntegrant.name}" ---`);

            const damageComponents = SheetManager._getD2024DamageComponents(storeData, attackIntegrant);
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Found ${damageComponents.length} damage components.`);

            // --- Determine Attack Ability (with Finesse support) ---
            let attackAbility = 'Strength'; // Default for melee
            if (attackIntegrant.attack) {
                attackAbility = attackIntegrant.attack.abilityBonus;
                if (!attackAbility || attackAbility === 'none') {
                    attackAbility = attackIntegrant.attack.type === 'Ranged' ? 'Dexterity' : 'Strength';
                }
                
                // Handle Finesse property
                if (attackIntegrant.attack.isFinesse) {
                    if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Finesse property detected. Checking STR/DEX...`);
                    const strMod = await SheetManager.getAbilityModifierAsync(charId, 'Strength');
                    const dexMod = await SheetManager.getAbilityModifierAsync(charId, 'Dexterity');
                    attackAbility = dexMod > strMod ? 'Dexterity' : 'Strength';
                    if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ⚔️ Finesse determined ability: ${attackAbility} (STR: ${strMod}, DEX: ${dexMod})`);
                }
            }
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Final attack ability: ${attackAbility}`);

            // --- Calculate Attack Bonus ---
            let totalAttackBonus = 0;
            if (attackIntegrant.attack) {
                const baseBonus = attackIntegrant.attack.bonus || 0;
                totalAttackBonus += baseBonus;
                if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Base attack bonus: +${baseBonus}`);

                const abilityMod = await SheetManager.getAbilityModifierAsync(charId, attackAbility);
                totalAttackBonus += abilityMod;
                if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ ${attackAbility} modifier: +${abilityMod}`);

                if (attackIntegrant.attack.proficiencyLevel === 'Proficient') {
                    const profBonus = await SheetManager.getProficiencyBonusAsync(charId);
                    totalAttackBonus += profBonus;
                    if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Proficiency bonus: +${profBonus}`);
                }
            }
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ✅ Total Attack Bonus calculated: ${totalAttackBonus}`);
            
            const attackData = {
                name: attackIntegrant.name || 'Attack',
                description: attackIntegrant.description || '',
                toHit: totalAttackBonus.toString(),
                damage: '1d4', 
                damageType: 'bludgeoning',
                damage2: '',
                damageType2: '',
                range: (attackIntegrant.attack && attackIntegrant.attack.type) ? attackIntegrant.attack.type : '',
                saveDC: (attackIntegrant.save && attackIntegrant.save.dc) ? attackIntegrant.save.dc.toString() : '',
                saveAbility: (attackIntegrant.save && attackIntegrant.save.saveAbility) ? attackIntegrant.save.saveAbility : ''
            };

            // --- Process Damage Components ---
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] --- Processing Damage Components ---`);
            const processDamage = async (damageComponent, isPrimary) => {
                if (!damageComponent) return;
                if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Processing ${isPrimary ? 'Primary' : 'Secondary'} Damage...`);

                let damageFormula = '';
                if (damageComponent.diceCount && damageComponent.diceSize) {
                    damageFormula = `${damageComponent.diceCount}${damageComponent.diceSize}`;
                }

                let totalDamageBonus = damageComponent._bonus || 0;
                let damageAbility = damageComponent.ability;
                if (damageAbility === 'auto') {
                    damageAbility = attackAbility;
                }

                if (damageAbility && damageAbility !== 'none') {
                    const abilityMod = await SheetManager.getAbilityModifierAsync(charId, damageAbility);
                    totalDamageBonus += abilityMod;
                    if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ℹ️ Damage ability mod (${damageAbility}): +${abilityMod}`);
                }

                if (totalDamageBonus > 0) damageFormula += `+${totalDamageBonus}`;
                else if (totalDamageBonus < 0) damageFormula += totalDamageBonus;

                if (isPrimary) {
                    attackData.damage = damageFormula || '1d4';
                    attackData.damageType = (damageComponent.damageType || 'bludgeoning').toLowerCase();
                } else {
                    attackData.damage2 = damageFormula || '';
                    attackData.damageType2 = (damageComponent.damageType || '').toLowerCase();
                }
                if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] ✅ ${isPrimary ? 'Primary' : 'Secondary'} Damage Formula: ${damageFormula} ${attackData[isPrimary ? 'damageType' : 'damageType2']}`);
            };
            
            await processDamage(damageComponents[0], true);
            await processDamage(damageComponents[1], false);
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] --- Finished D&D 2024 Attack Parse ---`);

            return { ...attackData, dataType: 'Attack' };
        },
        
        /**
         * Parses a generic D&D 2024 Action (e.g. Legendary Action)
         * @private
         */
        _getD2024GenericActionData: (integrant) => {
            if (CONFIG.DEBUG) log(`[DEBUG][D2024Parser] --- Parsing Generic Action: "${integrant.name}" ---`);
            return {
                dataType: 'Action',
                name: integrant.name,
                description: integrant.description || 'No description provided.',
                actionType: integrant.actionType || 'Action'
            };
        },
        
        /**
         * Parses a legacy 2014 sheet attack and returns a standardized data object.
         * @private
         */
        _getLegacyAttackDataAsync: async (charId, attackName) => {
            const allAttrs = findObjs({ _type: "attribute", _characterid: charId });
            const lowerAttackName = attackName.toLowerCase().trim();
            
            let sectionId = null;
            for (const attr of allAttrs) {
                const attrName = attr.get('name');
                if (attrName.startsWith('repeating_npcaction_') && attrName.endsWith('_name')) {
                    const currentVal = attr.get('current');
                    if (currentVal && currentVal.toLowerCase().trim() === lowerAttackName) {
                        sectionId = attrName.split('_')[2];
                        break;
                    }
                }
            }

            if (!sectionId) {
                 if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ❌ No legacy attack section found for "${attackName}"`);
                return null;
            }
            if (CONFIG.DEBUG) log(`[DEBUG][SheetManager] ✅ Found legacy attack section "${sectionId}" for "${attackName}"`);

            const getAttr = (name) => {
                 const attr = allAttrs.find(a => a.get('name') === `repeating_npcaction_${sectionId}_${name}`);
                 return attr ? attr.get('current') : '';
            };

            return {
                dataType: 'Attack',
                name: getAttr('name') || attackName,
                description: getAttr('description') || '',
                toHit: getAttr('attack_tohit') || '0',
                damage: getAttr('attack_damage') || '1d4',
                damageType: getAttr('attack_damagetype') || 'bludgeoning',
                damage2: getAttr('attack_damage2') || '',
                damageType2: getAttr('attack_damagetype2') || '',
                range: getAttr('attack_range') || '',
                saveDC: getAttr('saving_throw_dc') || '',
                saveAbility: getAttr('saving_throw_ability') || ''
            };
        }
    };

    // [MODULE] TEMPLATE MANAGER
    // Responsible for building all chat message templates.
    const TemplateManager = {
        /**
         * Gets a character's token image URL.
         * @param {string} charName - The name of the character.
         * @returns {string} The URL or a fallback emoji.
         */
        getCharacterTokenImageURL: (charName) => {
            const character = findObjs({ _type: "character", name: charName })[0];
            if (!character) return '👤';

            const sanitize = (url) => {
                if (!url) return null;
                return url.replace(/(thumb|max)(?=\.[^/]+$)/, 'med')
                         .replace(/\(/g, '%28').replace(/\)/g, '%29');
            };

            let img = character.get('avatar') || character.get('imgsrc');
            if (!img) {
                const token = findObjs({ _type: "graphic", represents: character.id })[0];
                if (token) img = token.get('imgsrc');
            }
            return sanitize(img) || '👤';
        },

        /**
         * Builds the HTML for an NPC attack template.
         * @param {string} charName - The name of the character.
         * @param {object} attackData - The standardized attack data from SheetManager.
         * @param {string} options - The user-defined display options (e.g., 'attack', 'damage').
         * @returns {string} The complete roll template string.
         */
        buildNPCAttackTemplate: (charName, attackData, options) => {
            let templateName;
            if (CONFIG.SHOW_TOKEN_IMAGES) {
                const tokenImage = TemplateManager.getCharacterTokenImageURL(charName);
                templateName = `<img src="${tokenImage}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px;">${charName} - ${attackData.name}`;
            } else {
                templateName = `${charName} - ${attackData.name}`;
            }

            let rollTemplate = `&{template:default} {{name=${templateName}}}`;
            const optionList = options.toLowerCase().split(',').map(opt => opt.trim());
            const show = (type) => optionList.includes(type) || optionList.includes('full');

            if (show('attack') || show('attack+damage')) {
                rollTemplate += ` {{Attack Roll=[[1d20+${attackData.toHit}]]}}`;
                if (attackData.range) rollTemplate += ` {{Range=${attackData.range}}}`;
            }

            if (show('damage') || show('attack+damage') || options === 'damage') {
                rollTemplate += ` {{Damage=[[${attackData.damage}]] ${attackData.damageType}}}`;
                if (attackData.damage2) {
                    rollTemplate += ` {{Add. Damage=[[${attackData.damage2}]] ${attackData.damageType2}}}`;
                }
            }

            if ((show('description') || show('desc')) && attackData.description) {
                rollTemplate += ` {{Description=${attackData.description}}}`;
            }

            if (show('save') && attackData.saveDC) {
                rollTemplate += ` {{Save DC=${attackData.saveDC} ${attackData.saveAbility}}}`;
            }
            
            // --- Add Interactive Buttons ---
            let buttons = [];
            const showDamage = show('damage') || show('attack+damage') || options === 'damage';
            const showDesc = show('description') || show('desc');

            if (!showDamage && attackData.damage) {
                 buttons.push(`[Roll Damage](!npc-damage ${charName}|${attackData.name})`);
            }
            if (!showDesc && attackData.description) {
                buttons.push(`[Show Description](!npc-desc ${charName}|${attackData.name})`);
            }
            if (!showDamage && !showDesc && attackData.damage && attackData.description) {
                buttons.push(`[Damage & Desc](!npc-dmg-desc ${charName}|${attackData.name})`);
            }

            if (buttons.length > 0) {
                rollTemplate += `{{Actions=${buttons.join(' ')}}}`;
            }
            
            return rollTemplate;
        },

        /**
         * Builds the HTML for a generic action template.
         * @param {string} charName - The name of the character.
         * @param {object} actionData - The standardized action data.
         * @returns {string} The complete roll template string.
         */
        buildGenericActionTemplate: (charName, actionData) => {
            const tokenImage = TemplateManager.getCharacterTokenImageURL(charName);
            const title = `<img src="${tokenImage}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px;">${charName} - ${actionData.name}`;
            
            let rollTemplate = `&{template:default} {{name=${title}}}`;
            rollTemplate += `{{${actionData.actionType}=${actionData.description}}}`;
            
            return rollTemplate;
        }
    };

    // [MODULE] COMMAND MANAGER
    // Parses and executes commands from chat and triggers.
    const CommandManager = {
        /**
         * The main command execution function.
         * @param {string} commandString - The full command string to execute.
         * @param {object} placeholders - A map of placeholders to replace (e.g., { token: tokenId }).
         * @param {string} sender - The name to appear as the sender in chat.
         * @param {string} visibility - 'all', 'gm', or 'player'.
         * @param {string} playerId - The ID of the player for '/w' commands.
         */
        execute: async (commandString, placeholders = {}, sender = 'TriggerControl', visibility = 'all', playerId = null) => {
            if (!commandString) return;

            // Handle multiple commands separated by semicolons
            for (const singleCommand of commandString.split(';')) {
                let cmd = singleCommand.trim();
                if (!cmd) continue;
                
                // Handle macros
                if (cmd.startsWith('#')) {
                    const macroName = cmd.substring(1);
                    const macro = findObjs({ _type: "macro", name: macroName })[0];
                    if (macro) {
                        cmd = macro.get("action");
                    } else {
                        log(`❌ Macro not found: ${macroName}`);
                        sendChat(sender, `/w gm Error: Macro named '${macroName}' not found.`);
                        continue;
                    }
                }
                
                // Replace placeholders like <&token>
                for (const [tag, value] of Object.entries(placeholders)) {
                    if (value) cmd = cmd.replace(new RegExp(`<&${tag}>`, 'g'), value);
                }
                 if (placeholders.token) {
                    cmd = cmd.replace(/@\{selected\|token_id\}/g, placeholders.token);
                    cmd = cmd.replace(/@\{target\|token_id\}/g, placeholders.token);
                }

                // Handle special commands ($npc, etc.) before sending to chat
                const npcMatch = cmd.match(/\$npc\{([^|]+)\|([^|]+)(?:\|([^}]+))?\}/);
                if (npcMatch) {
                    const charName = npcMatch[1].trim();
                    const attackName = npcMatch[2].trim();
                    const options = npcMatch[3] ? npcMatch[3].trim() : 'damage';
                    const npcTemplate = await CommandManager.getNpcActionTemplate(charName, attackName, options);
                    cmd = cmd.replace(npcMatch[0], npcTemplate);
                }

                // Send the final processed command to chat
                let whisperPrefix = '';
                if (visibility === 'gm') whisperPrefix = '/w gm ';
                else if (visibility === 'player' && playerId) whisperPrefix = `/w "${getObj('player', playerId).get('displayname')}" `;
                
                sendChat(sender, whisperPrefix + cmd);
            }
        },

        /**
         * Helper to generate an NPC template for use in execute().
         */
        getNpcActionTemplate: async (charName, actionName, options) => {
            if(CONFIG.DEBUG) log(`[DEBUG][CommandManager] getNpcActionTemplate for: Character="${charName}", Action="${actionName}", Options="${options}"`);
            
            const character = findObjs({ _type: "character", name: charName })[0];
            if (!character) {
                if(CONFIG.DEBUG) log(`[DEBUG][CommandManager] ❌ Character not found: "${charName}"`);
                return `Error: Character "${charName}" not found.`;
            }
            if(CONFIG.DEBUG) log(`[DEBUG][CommandManager] ✅ Found character: ${character.id}`);
            
            const actionData = await SheetManager.getActionDataAsync(character.id, actionName);
            if (!actionData) {
                if(CONFIG.DEBUG) log(`[DEBUG][CommandManager] ❌ Action data not found for "${actionName}" on char "${charName}"`);
                return `Error: Action "${actionName}" not found for ${charName}.`;
            }
            if(CONFIG.DEBUG) log(`[DEBUG][CommandManager] ✅ Found action data`);

            if (actionData.dataType === 'Attack') {
                return TemplateManager.buildNPCAttackTemplate(charName, actionData, options);
            } else if (actionData.dataType === 'Action') {
                return TemplateManager.buildGenericActionTemplate(charName, actionData);
            }
            return `Error: Unknown action data type for ${actionName}.`;
        },

        /**
         * Handles the !npc API command.
         */
        handleNpcCommand: async (args) => {
            const parts = args.join(' ').split('|');
            if (parts.length < 2) {
                sendChat('TriggerControl', '/w gm Invalid format. Use: !npc CharacterName|AttackName|options');
                return;
            }
            const charName = parts[0].trim();
            const attackName = parts[1].trim();
            const options = parts.length > 2 ? parts[2].trim() : 'damage';

            const npcTemplate = await CommandManager.getNpcActionTemplate(charName, attackName, options);
            sendChat('NPCAttack', npcTemplate);
        },
        
        /**
         * Handles the new !npc-damage API command.
         */
        handleNpcDamageCommand: async (args, msg) => {
            const parts = args.join(' ').split('|');
            if (parts.length < 2) return; // Fail silently
            const charName = parts[0].trim();
            const actionName = parts[1].trim();

            const character = findObjs({ _type: 'character', name: charName })[0];
            if (!character) return;

            const actionData = await SheetManager.getActionDataAsync(character.id, actionName);
            if (!actionData || actionData.dataType !== 'Attack') return;

            let damageRoll = `[[${actionData.damage}]] ${actionData.damageType}`;
            if (actionData.damage2) {
                damageRoll += ` + [[${actionData.damage2}]] ${actionData.damageType2}`;
            }

            const template = `&{template:default} {{name=${actionData.name} Damage}} {{roll=${damageRoll}}}`;
            sendChat('NPCAttack', template);
        },
        
        /**
         * Handles the new !npc-desc API command.
         */
        handleNpcDescCommand: async (args, msg) => {
            const parts = args.join(' ').split('|');
            if (parts.length < 2) return;
            const charName = parts[0].trim();
            const actionName = parts[1].trim();
            
            const character = findObjs({ _type: 'character', name: charName })[0];
            if (!character) return;
            
            const actionData = await SheetManager.getActionDataAsync(character.id, actionName);
            if (!actionData || !actionData.description) return;

            const template = `&{template:default} {{name=${actionData.name} Description}} {{desc=${actionData.description}}}`;
            sendChat('NPCAttack', template);
        },
        
        /**
         * Handles the new !npc-dmg-desc API command.
         */
        handleNpcDmgDescCommand: async (args, msg) => {
            const parts = args.join(' ').split('|');
            if (parts.length < 2) return;
            const charName = parts[0].trim();
            const actionName = parts[1].trim();

            const character = findObjs({ _type: 'character', name: charName })[0];
            if (!character) return;

            const actionData = await SheetManager.getActionDataAsync(character.id, actionName);
            if (!actionData || actionData.dataType !== 'Attack') return;

            let template = `&{template:default} {{name=${actionData.name}}}`;

            let damageRoll = `[[${actionData.damage}]] ${actionData.damageType}`;
            if (actionData.damage2) {
                damageRoll += ` + [[${actionData.damage2}]] ${actionData.damageType2}`;
            }
            template += `{{Damage=${damageRoll}}}`;

            if (actionData.description) {
                template += `{{Description=${actionData.description}}}`;
            }

            sendChat('NPCAttack', template);
        },

        /**
         * Handles the !rtm API command.
         */
        handleRtmCommand: (args, msg) => {
             if (args.length < 1) {
                sendChat('TableTrigger', '/w gm Please provide a table name.');
                return;
            }
            const tableName = args.join(' ');
            const player = getObj('player', msg.playerid);
            const msgFrom = player ? player.get('displayname') : 'API';
            
            const table = findObjs({ type: 'rollabletable', name: tableName }, { caseInsensitive: true })[0];
             if (!table) {
                sendChat('TableTrigger', `/w "${msgFrom}" No such table exists: "${tableName}"`);
                return;
            }

            // Manually roll the table to get the item object, which respects weighting
            // and allows us to get the item's avatar for the new feature request.
            const items = findObjs({ type: 'tableitem', rollabletableid: table.id });
            if (!items.length) {
                sendChat('TableTrigger', `/w "${msgFrom}" Table "${tableName}" has no items.`);
                return;
            }
            
            let weightedList = [];
            items.forEach(item => {
                const weight = parseInt(item.get('weight')) || 1;
                for (let i = 0; i < weight; i++) {
                    weightedList.push(item);
                }
            });

            const chosenItem = weightedList[randomInteger(weightedList.length) - 1];
            if (chosenItem) {
                TriggerHandlers.handleTableTrigger(chosenItem, 'Table Result');
            }
        },
        
        /**
         * Handles the !npc-debug-attrs API command.
         */
        handleNpcDebugAttrsCommand: async (args) => {
            if (CONFIG.DEBUG) log(`[DEBUG] handleNpcDebugAttrsCommand called with args: ${JSON.stringify(args)}`);
            
            const charName = args.join(' ');
            if (!charName) {
                sendChat('TriggerControl', '/w gm Please provide a character name.');
                return;
            }
            
            if (CONFIG.DEBUG) log(`[DEBUG] Looking for character: "${charName}"`);
            const character = findObjs({ _type: "character", name: charName })[0];
            if (!character) {
                sendChat('TriggerControl', `/w gm Character not found: ${charName}`);
                return;
            }
            
            if (CONFIG.DEBUG) log(`[DEBUG] Found character: ${character.id}`);
            
            const allAttrs = findObjs({ _type: "attribute", _characterid: character.id });
            const relevantAttrs = allAttrs.filter(attr => {
                const name = attr.get('name').toLowerCase();
                // Expanded filter to find more useful attributes
                return name.includes('mod') || name.includes('prof') || name.includes('bonus') || 
                       name.includes('sheet') || name.includes('app') || name.includes('version') ||
                       name.includes('strength') || name.includes('dexterity') || name.includes('constitution') ||
                       name.includes('intelligence') || name.includes('wisdom') || name.includes('charisma') ||
                       name.includes('ac') || name.includes('hp') || name.includes('speed') ||
                       name === 'pb' || name === 'challenge';
            });
            
            if (CONFIG.DEBUG) log(`[DEBUG] Found ${allAttrs.length} total attributes, ${relevantAttrs.length} relevant`);
            
            let result = `&{template:default} {{name=Debug Attributes for ${charName}}}`;
            result += `{{Total Attributes=${allAttrs.length}}}`;
            result += `{{Relevant Attributes=${relevantAttrs.length}}}`;
            
            let attrText = '';
            relevantAttrs.forEach(attr => {
                attrText += `• ${attr.get('name')}: "${attr.get('current')}"\n`;
            });

            // Specifically check for the D&D 2024 store object
            try {
                const storeData = await SheetManager.getStoreDataAsync(character.id);
                if (storeData) {
                    attrText += `\n**D&D 2024 'store' object found!** This character uses the new system.`;
                }
            } catch (e) {
                if (CONFIG.DEBUG) log(`[DEBUG] Error getting store data: ${e.message}`);
            }

            result += `{{Attributes=${attrText}}}`;
            
            if (CONFIG.DEBUG) log(`[DEBUG] Sending result: ${result}`);
            sendChat('TriggerControl', `/w gm ${result}`);
        }
    };

    // [MODULE] TRIGGER HANDLERS
    // Contains the logic for all trigger types.
    const TriggerHandlers = {
        /**
         * Handles results from rollable tables.
         * @param {object} tableItem - The full tableItem object that was rolled.
         * @param {string} templateName - The name to use for the chat template if no command is found.
         */
        handleTableTrigger: (tableItem, templateName = 'Table Result') => {
            const itemName = tableItem.get('name');
            if (CONFIG.DEBUG) log(`[DEBUG][Triggers] Processing table item: "${itemName}"`);
            
            // Use indexOf/lastIndexOf to correctly handle nested curly braces.
            const startIndex = itemName.indexOf('{');
            const endIndex = itemName.lastIndexOf('}');

            if (startIndex !== -1 && endIndex > startIndex) {
                const commandToExecute = itemName.substring(startIndex + 1, endIndex).trim();
                if (commandToExecute) {
                    if (CONFIG.DEBUG) log(`[DEBUG][Triggers] ⚡ Executing wrapped command: "${commandToExecute}"`);
                    CommandManager.execute(commandToExecute, {}, 'TableTrigger');
                }
            } else {
                if (CONFIG.DEBUG) log(`[DEBUG][Triggers] 💬 Displaying plain text result: "${itemName}"`);
                
                let title = templateName;
                const itemImage = tableItem.get('avatar');
                if(itemImage) {
                    title = `<img src="${itemImage}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px;">` + title;
                }

                const template = `&{template:default} {{name=${title}}} {{text=${itemName}}}`;
                sendChat('TableTrigger', template);
            }
        },

        /**
         * Checks a chat message for critical hit or fumble rolls.
         * @param {object} msg - The chat message object from Roll20.
         */
        handleCritFailTrigger: (msg) => {
            if (!CONFIG.ENABLE_CRITICAL_ROLL_TRIGGER) return;

            const campaign = Campaign();
            const turnorder = campaign.get('turnorder');
            if (!turnorder || turnorder === "[]") {
                if (CONFIG.DEBUG) log(`[DEBUG][Triggers] Crit/Fumble check skipped: No active combat.`);
                return;
            }

            let foundCrit = false;
            let foundFumble = false;

            // D&D 2024 sheets use msg.rolls
            if (msg.rolls) {
                for (const rollData of Object.values(msg.rolls)) {
                    if (rollData.results && rollData.results.rolls) {
                        for (const roll of rollData.results.rolls) {
                            if (roll.type === 'R' && roll.sides === 20 && roll.results) {
                                for (const result of roll.results) {
                                    if (result.isCrit || result.v === CONFIG.CRITICAL_HIT_VALUE) foundCrit = true;
                                    if (result.isFumble || result.v === CONFIG.CRITICAL_FAIL_VALUE) foundFumble = true;
                                }
                            }
                        }
                    }
                }
            }
            // Legacy sheets use msg.inlinerolls
            else if (msg.inlinerolls) {
                 for (const inlineRoll of msg.inlinerolls) {
                    if (inlineRoll.results && inlineRoll.results.rolls) {
                        for (const roll of inlineRoll.results.rolls) {
                            if (roll.type === 'R' && roll.sides === 20 && roll.results) {
                                for (const result of roll.results) {
                                    if (result.v === CONFIG.CRITICAL_HIT_VALUE) foundCrit = true;
                                    if (result.v === CONFIG.CRITICAL_FAIL_VALUE) foundFumble = true;
                                }
                            }
                        }
                    }
                }
            }

            const player = getObj('player', msg.playerid);
            const msgFrom = player ? player.get('displayname') : (msg.who || 'API');

            if (foundCrit) {
                log(`🎲 Critical Hit by ${msgFrom}! Rolling on table: "${CONFIG.CRITICAL_HIT_TABLE_NAME}"`);
                if (CONFIG.SHOW_CRITICAL_MESSAGES) {
                    sendChat('TriggerControl', `/w gm Detected a NAT 20 by ${msgFrom}.`);
                }
                CommandManager.handleRtmCommand([CONFIG.CRITICAL_HIT_TABLE_NAME], msg);
            } else if (foundFumble) {
                log(`🎲 Critical Fumble by ${msgFrom}! Rolling on table: "${CONFIG.CRITICAL_FAIL_TABLE_NAME}"`);
                if (CONFIG.SHOW_CRITICAL_MESSAGES) {
                    sendChat('TriggerControl', `/w gm Detected a NAT 1 by ${msgFrom}.`);
                }
                CommandManager.handleRtmCommand([CONFIG.CRITICAL_FAIL_TABLE_NAME], msg);
            }
        },

        /**
         * Handles changes to the turn order.
         * @param {object} obj - The campaign object.
         * @param {object} prev - The previous state of the campaign object.
         */
        handleTurnOrderTrigger: (obj, prev) => {
            const newTurnOrderStr = obj.get('turnorder');
            const prevTurnOrderStr = prev.turnorder || "[]";

            if (newTurnOrderStr === "" || newTurnOrderStr === "[]") {
                StateManager.reset();
                return;
            }
            
            const newTurnOrder = JSON.parse(newTurnOrderStr);
            const prevTurnOrder = JSON.parse(prevTurnOrderStr);
            if (newTurnOrder.length === 0) return;

            const currentTurn = newTurnOrder[0];
            const prevTurn = prevTurnOrder[0];
            
            // Extract token IDs to match old script logic exactly
            const currentTurnTokenId = currentTurn.id;
            const prevTurnTokenId = (prevTurnOrder.length > 0) ? prevTurnOrder[0].id : null;
            
            if (currentTurnTokenId === prevTurnTokenId || currentTurnTokenId === "-1") return;

            // --- Round Advancement Logic ---
            let topTokenId = StateManager.getTopOfRoundTokenId();
            if (!topTokenId || !newTurnOrder.some(t => t.id === topTokenId)) {
                topTokenId = newTurnOrder.reduce((top, turn) => (parseFloat(turn.pr) > parseFloat(top.pr) ? turn : top), newTurnOrder[0]).id;
                StateManager.setTopOfRoundTokenId(topTokenId);
                log(`👑 New top of round set to Token ID: ${topTokenId}`);
            }

            // Increment round number only when the current token is the one that started the round
            // and it's not the very first turn of the combat.
            if (currentTurnTokenId === topTokenId && prevTurnTokenId !== null) {
                StateManager.setRoundNumber(StateManager.getRoundNumber() + 1);
                log(`🔄 Round ${StateManager.getRoundNumber()} begins.`);
            }
            
            log(`▶️ New turn for token: ${currentTurnTokenId} (Round: ${StateManager.getRoundNumber()})`);
            const token = getObj('graphic', currentTurnTokenId);
            if (!token) return;

            let gmNotes = token.get('gmnotes');
            if (!gmNotes) return;
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - Raw GM Notes: "${gmNotes}"`);
            }
            
            // Custom decoding function to handle both URL encoding and JavaScript Unicode escapes
            const customDecode = (str) => {
                // Remove quotes if present
                str = str.replace(/^"(.*)"$/, '$1');
                
                // First handle JavaScript Unicode escape sequences (%uXXXX)
                str = str.replace(/%u([0-9A-Fa-f]{4})/g, (match, hex) => {
                    return String.fromCharCode(parseInt(hex, 16));
                });
                
                // Then handle standard URL encoding
                try {
                    str = decodeURIComponent(str);
                } catch (e) {
                    if (CONFIG.DEBUG) {
                        log(`[DEBUG] Token ${currentTurnTokenId} - DecodeURIComponent failed: ${e.message}`);
                    }
                    // If decoding fails, manually decode common URL entities
                    str = str
                        .replace(/%20/g, ' ')
                        .replace(/%3C/g, '<')
                        .replace(/%3E/g, '>')
                        .replace(/%22/g, '"')
                        .replace(/%3A/g, ':')
                        .replace(/%2F/g, '/')
                        .replace(/%21/g, '!');
                }
                
                return str;
            };
            
            let cleanNotes = customDecode(gmNotes);
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - After custom decode: "${cleanNotes}"`);
            }
            
            // Manually decode common HTML entities that might be in the notes
            cleanNotes = cleanNotes
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&')
                .replace(/&nbsp;/g, ' ');
            
            cleanNotes = cleanNotes.replace(/(<([^>]+)>)/ig, '').trim();
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - Cleaned GM Notes: "${cleanNotes}"`);
            }
            
            const match = cleanNotes.match(/\[TOT(?::\s*([^\]]+))?\]\s*(.*)/);
            if (!match) {
                if (CONFIG.DEBUG) {
                    log(`[DEBUG] Token ${currentTurnTokenId} - No TOT match found in cleaned notes`);
                }
                return;
            }
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - TOT match found: Settings="${match[1] || ''}", Command="${match[2] || ''}"`);
            }

            const settingsStr = match[1] || '';
            const command = match[2].trim();
            
            // Decode HTML entities in the settings string
            const decodedSettingsStr = settingsStr
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&')
                .replace(/&nbsp;/g, ' ');
            
            const settings = decodedSettingsStr.split(',').map(s => s.trim().toLowerCase());
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - Raw settings: "${settingsStr}", Decoded: "${decodedSettingsStr}", Command: "${command}"`);
                log(`[DEBUG] Token ${currentTurnTokenId} - Parsed settings: ${JSON.stringify(settings)}`);
            }

            let maxTriggers = Infinity, minRound = 0, visibility = 'all';
            settings.forEach(setting => {
                const roundMatch = setting.match(/^round\s*>\s*(\d+)$/);
                if (setting === 'once') maxTriggers = 1;
                else if (setting === 'gm') visibility = 'gm';
                else if (setting === 'player') visibility = 'player';
                else if (roundMatch) {
                    minRound = parseInt(roundMatch[1]);
                    if (CONFIG.DEBUG) log(`[DEBUG] Parsed round condition: round > ${minRound}`);
                }
                else if (!isNaN(parseInt(setting))) maxTriggers = parseInt(setting);
            });
            
            if (CONFIG.DEBUG) {
                log(`[DEBUG] Token ${currentTurnTokenId} - Current round: ${StateManager.getRoundNumber()}, Min round: ${minRound}, Should fire: ${StateManager.getRoundNumber() > minRound}`);
            }
            
            if (StateManager.getRoundNumber() <= minRound) {
                log(`➡️ TOT skipped: Round condition not met (Current: ${StateManager.getRoundNumber()}, Required > ${minRound})`);
                return;
            }

            const currentCount = StateManager.getTriggerCount(token.id);
            if (currentCount >= maxTriggers) {
                 log(`➡️ TOT skipped: Max triggers reached (${maxTriggers})`);
                return;
            }

            StateManager.incrementTriggerCount(token.id);
            const playerId = token.get('controlledby').split(',')[0];
            log(`⚡ Firing TOT command for token ${currentTurnTokenId}: ${command}`);
            CommandManager.execute(command, { token: currentTurnTokenId }, 'TurnOrderTrigger', visibility, playerId);
        }
    };

    /**
     * Toggles debug mode on and off.
     */
    const toggleDebug = () => {
        CONFIG.DEBUG = !CONFIG.DEBUG;
        const status = CONFIG.DEBUG ? 'ON' : 'OFF';
        log(`🐞 Debug mode is now ${status}.`);
        sendChat('TriggerControl', `/w gm Debug mode is now ${status}.`);
    };

    // [MODULE] EVENT LISTENERS
    const registerEventHandlers = () => {
        on('chat:message', (msg) => {
            if (CONFIG.DEBUG) log(`[DEBUG] Received message - Type: ${msg.type}`);

            // API Command Handler
            if (msg.type === 'api' && msg.content) {
                const args = msg.content.split(' ');
                const command = args.shift().toLowerCase();
                switch (command) {
                    case '!tt-reset': return StateManager.reset();
                    case '!tt-debug': return toggleDebug();
                    case '!npc': return CommandManager.handleNpcCommand(args);
                    case '!npc-damage': return CommandManager.handleNpcDamageCommand(args, msg);
                    case '!npc-desc': return CommandManager.handleNpcDescCommand(args, msg);
                    case '!npc-dmg-desc': return CommandManager.handleNpcDmgDescCommand(args, msg);
                    case '!rtm': return CommandManager.handleRtmCommand(args, msg);
                    case '!npc-debug-attrs': return CommandManager.handleNpcDebugAttrsCommand(args);
                }
            }

            // Handle table rolls from various message types
            if ((msg.type === "general" || msg.type === "whisper" || msg.type === "advancedroll") && msg.inlinerolls) {
                 msg.inlinerolls.forEach(ir => {
                    let firstRoll = ir.results && ir.results.rolls && ir.results.rolls[0];
                    if (firstRoll && firstRoll.table && firstRoll.results && firstRoll.results[0]) {
                        const tableItem = getObj('tableitem', firstRoll.results[0].tableItem.id);
                        if (tableItem) TriggerHandlers.handleTableTrigger(tableItem);
                    }
                });
            } else if (msg.type === "rollresult" && msg.content) {
                try {
                    const rollData = JSON.parse(msg.content);
                    const firstRoll = rollData.rolls && rollData.rolls[0];
                    if (firstRoll && firstRoll.table && firstRoll.results && firstRoll.results[0]) {
                         const tableItem = getObj('tableitem', firstRoll.results[0].tableItem.id);
                         if (tableItem) TriggerHandlers.handleTableTrigger(tableItem);
                    }
                } catch(e) { /* ignore parse error */ }
            }
            
            // Critical Hit/Fumble Handler
            TriggerHandlers.handleCritFailTrigger(msg);
        });
        
        on('change:campaign:turnorder', TriggerHandlers.handleTurnOrderTrigger);
    };

    /**
     * Initializes the entire script.
     */
    const init = () => {
        StateManager.initialize();
        registerEventHandlers();
    };

    // Public API for the script
    return {
        init
    };
})();

// Make TriggerControl available globally for CommandMenu detection
var TriggerControl = TriggerControl;

on('ready', () => {
    TriggerControl.init();
    log(`✅ Enhanced TriggerControl Script v3.0.0 Loaded & Ready.`);
    if (typeof CommandMenu !== 'undefined' && CommandMenu.utils && CommandMenu.utils.addInitStatus) {
        CommandMenu.utils.addInitStatus('TriggerControl', 'success', null, 'success');
    }
});