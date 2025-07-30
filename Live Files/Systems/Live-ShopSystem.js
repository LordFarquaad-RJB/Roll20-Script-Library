/**
 * ShopSystem.js
 * D&D 5e Shop System for Roll20
 * Version: 1.0.0
 * 
 * This system handles shop management, item database, and transactions
 * for D&D 5e games in Roll20. It provides a complete interface for
 * both GMs and players to interact with shops and items.
 * 
 * [TAG: MG_DB_1_SHOP_1_Initialize_Database_System]
 * 
 * Not Required Tags from Tagged-LiveDatabaseSystem.js:
 * [TAG: DB_10_Normalize_All_Prices_in_the_Database] - Not Required (duplicate functionality)
 * [TAG: DB_14_Convert_Copper_Value_to_Standardized_Price_Object] - Not Required (duplicate of DB_8)
 * [TAG: DB_15_Normalize_Price_Data_in_an_Item] - Not Required (duplicate of DB_9)
 * [TAG: DB_16_Normalize_All_Prices_in_the_Database] - Not Required (duplicate of DB_10)
 * [TAG: DB_27_Normalize_All_Prices_in_the_Database] - Not Required (duplicate functionality)
 *
 * Configuration and Constants
 * [TAG: MG_DB_2_SHOP_2_Configuration_and_Constants]
 **/
const CONFIG = {
    version: '1.0.0',
    debug: false,
    
    // [TAG: DB_2_SHOP_11_12]
    HANDOUT: {
        DATABASE: "Item-Database",
        SHOP_PREFIX: "Shop-",
    },
    
    // [TAG: DB_4_SHOP_4]
    LOGGING: {
        LEVEL: "info",
        PREFIX: {
            info: '📜',
            error: '❌',
            success: '✅',
            warning: '⚠️'
        }
    },
    
    // [TAG: SHOP_157_128_DB_8_9]
    CURRENCY: {
        COPPER_PER_SILVER: 10,
        COPPER_PER_ELECTRUM: 50,
        COPPER_PER_GOLD: 100,
        COPPER_PER_PLATINUM: 1000,
        DEFAULT_FORMAT: "gp" // Default display format
    },
    
    // [TAG: SHOP_113_114]
    PRICING: {
        SELL_PRICE_MODIFIER: 0.5,
        HAGGLE_MAX_ADJUSTMENT: 0.2,
        MIN_PRICE_COPPER: 1 // Minimum price in copper
    },
    
    // [TAG: SHOP_44_45]
    HAGGLE: {
        BASE_DC: 15,
        ADVANTAGE_THRESHOLD: 5,
        DEFAULT_STORE_ATTEMPTS: 3,
        SKILLS: ["deception", "persuasion", "intimidation","Slight of Hand"]
    },
    
    // [TAG: DB_11_SHOP_11]
    ITEM: {
        DEFAULT_CATEGORY: "equipment",
        DEFAULT_RARITY: "common",
        CATEGORIES: ["weapons", "Armor & Attire", "equipment", "potions", "scrolls", "magic", "Mounts & Vehicles", "Services"],
        RARITIES: ["common", "uncommon", "rare", "very rare", "legendary"]
    },
    
    // [TAG: SHOP_7_13_282]
    DISPLAY: {
        ITEMS_PER_PAGE: 10, // check what this does
        USE_ROLL_TEMPLATES: true, // check what this does
        DEFAULT_TEMPLATE: "default", // check what this does
        // [TAG: CD_CONFIG_STOCK_THRESHOLD] Add threshold for stock display warning
        STOCK_DISPLAY_THRESHOLD: 30, 
        CURRENCY_SYMBOLS: {
            cp: "cp",
            sp: "sp",
            ep: "ep",
            gp: "gp",
            pp: "pp"
    },

    // [TAG: CD_BASKET_STATE]
    BASKET_STATE: {
        MERGE_TIMEOUT: 3600000, // 1 hour in milliseconds
        ERROR_MESSAGES: {
            ALREADY_MERGED: "❌ Baskets are already merged.",
            NEED_BOTH_BASKETS: "❌ Need items in both buy and sell baskets to merge.",
            BASKETS_LOCKED: "❌ Cannot modify baskets while merged. Unmerge first.",
            NOT_MERGED: "❌ Baskets are not merged.",
            NO_BASKETS_TO_UNMERGE: "❌ No merged baskets to unmerge."
        }
    },

    // Added category emoji configuration
    CATEGORY: {
        EMOJI: {
            weapons: "⚔️",
            "Armor & Attire": "🛡️",
            potions: "🧪",
            scrolls: "📜",
            magic: "✨",
            equipment: "🎒",
            "Mounts & Vehicles": "🐴🛞",
            Services: "🛎️"
        }
    },

    // [TAG: CD_SELL_CATEGORIES]
    SELL_CATEGORIES: {
        weapons: {
            emoji: "⚔️",
            name: "Weapons",
            priority: 1
        },
        "Armor & Attire": { // Corrected key
            emoji: "🛡️",
            name: "Armor & Attire",
            priority: 2,
            identifiers: ["armor", "shield", "cloak", "robe", "bracers", "gauntlets"]
        },
        scrolls: {
            emoji: "📜",
            name: "Scrolls",
            priority: 3
        },
        potions: {
            emoji: "🧪",
            name: "Potions",
            priority: 4
        },
        equipment: {
            emoji: "🎒",
            name: "Equipment & Gear",
            priority: 5
        },
        "Mounts & Vehicles": { // Corrected key
            emoji: "🐴", // Consider updating if you have a combined emoji like in CATEGORY.EMOJI
            name: "Mounts & Vehicles",
            priority: 6,
            identifiers: ["mount", "horse", "pony", "donkey", "mule", "cart", "wagon", "vehicle", "carriage"]
        },
        "Services": { // Corrected key
            emoji: "🛎️", // Consider updating if you have a combined emoji
            name: "Services",
            priority: 7,
            identifiers: ["service", "meal", "inn stay", "spellcasting", "hireling", "stabling", "wine", "ale"]
        },
    },

    // Added rarity display configuration
    RARITY: {
        EMOJI: {
            common: "⚪",
            uncommon: "🟢",
            rare: "🔵",
            "very rare": "🟣",
            legendary: "🟠"
        },
        ORDER: {
            common: 0,
            uncommon: 1,
            rare: 2,
            "very rare": 3,
            legendary: 4
        }
    }
},
    
    // [TAG: SHOP_103_157_DB_20]
    COMMANDS: {
        SHOP_PREFIX: "!shop",
        DB_PREFIX: "!itemdb",
        SUBCOMMANDS: {
            SHOP: ["open", "list", "add", "remove", "buy", "sell", "basket", "haggle"],
            DB: ["init", "import", "end", "list", "cancel", "add", "add_param", "add_save"]
        }
    },
    
    // [TAG: CD_SHOP_SETTINGS]
    SHOP_SETTINGS: {
        // Types of shops
        SHOP_TYPES: [
            "General Store", 
            "Blacksmith", 
            "Armorer", 
            "Alchemist", 
            "Magic Shop", 
            "Potion Shop",
            "Scroll Shop",
            "Tavern",
            "Jeweler",
            "Clothier",
            "Adventuring Supplies",
            "Exotic Goods"
        ],
        
    // [TAG: CD_SHOP_TYPE_WEIGHTS]
    // Category weights for each shop type.
    // Used by: Chance-Based Generator (to select category for each item).
    // Used by: Advanced Generator (to select category for each item).
    // Not used by: Basic Generator (uses explicit category parameter).
    SHOP_TYPE_WEIGHTS: {
        "General Store": {
            equipment: 30,
            weapons: 20,
            "Armor & Attire": 20,
            potions: 13,
            scrolls: 1,
            magic: 1,
            "Mounts & Vehicles": 5,
            Services: 10
        },
        "Blacksmith": {
            weapons: 45,
            "Armor & Attire": 35,
            equipment: 10,
            "Mounts & Vehicles": 5
        },
        "Armorer": {
            "Armor & Attire": 70,
            equipment: 20,
            weapons: 10
        },
        "Alchemist": {
            potions: 70,
            scrolls: 20,
            equipment: 10
        },
        "Magic Shop": {
            magic: 30,
            scrolls: 25,
            potions: 25,
            Services: 10
        },
        "Potion Shop": {
            potions: 80,
            equipment: 15,
            scrolls: 5
        },
        "Scroll Shop": {
            scrolls: 75,
            magic: 15,
            potions: 5,
            Services: 5
        },
        "Tavern": {
            equipment: 25,
            potions: 20,
            weapons: 5,
            Services: 60
        },
        "Jeweler": {
            magic: 20,
            "Armor & Attire": 40,
            equipment: 40
        },
        "Clothier": {
            equipment: 50,
            "Armor & Attire": 50
        },
        "Adventuring Supplies": {
            equipment: 45,
            weapons: 20,
            "Armor & Attire": 20,
            potions: 10,
            "Mounts & Vehicles": 10
        },
        "Exotic Goods": {
            magic: 30,
            equipment: 25,
            weapons: 15,
            "Armor & Attire": 15,
            "Mounts & Vehicles": 10,
            Services: 5
        }
    },
        
    // [TAG: CD_SHOP_LOCATIONS]
    // Locations affect inventory size and variety.
    // Used by: Advanced Generator (itemCount for total items, rarityBonus for rarity distribution).
    // Used by: Chance-Based Generator (rarityBonus for rarity distribution and legendary chance).
    // Not used by: Basic Generator.
    LOCATIONS: [
        {name: "Merchant District", itemCount: 40, rarityBonus: 10},
        {name: "City Center", itemCount: 30, rarityBonus: 5},
        {name: "Town", itemCount: 20, rarityBonus: 0},
        {name: "Village", itemCount: 15, rarityBonus: -5},
        {name: "Roadside", itemCount: 10, rarityBonus: -10},
        {name: "Traveling Merchant", itemCount: 8, rarityBonus: 0},
        {name: "Outpost", itemCount: 12, rarityBonus: -5},
        {name: "Dungeon Entrance", itemCount: 8, rarityBonus: 15},
        {name: "Festival", itemCount: 25, rarityBonus: 5},
        {name: "Harbor", itemCount: 20, rarityBonus: 10}
    ],
    
    // [TAG: CD_SHOP_STOCK_GENERATION]
    // Stock generation settings
    STOCK_GENERATION: {
        // [REMOVED: Original MODES section] Was unused in the code.
        // Base rarity chances.
        // Used by: Advanced Generator (as fallback distribution if items missing).
        // Used by: Basic Generator (internal logic uses similar concept).
        // Indirectly used by: Chance-Based Generator (as basis for rarityBonus adjustments).
        RARITY_CHANCES: {
            common: 70,
            uncommon: 20,
            rare: 8,
            "very rare": 1.5,
            legendary: 0.5
        },
        // [TAG: CD_CHANCE_GENERATOR_LEGENDARY] Base chance (percentage) for any legendary item to generate.
        // Used ONLY by: Chance-Based Generator (combined with rarityBonus to modify legendary quantity roll success rate).
        // Not used by: Basic or Advanced Generators.
        BASE_LEGENDARY_CHANCE: 5, // 50 = 50% chance
        // [REMOVED: Original QUANTITY_RANGES section] Duplicate of CONFIG.STOCK.DEFAULT_QUANTITY above.
        // [REMOVED: Original MIN_STOCK section] Was unused in the code.
    },
            
    // [TAG: CD_SHOP_DEFAULT_STOCK_QUANTITY]
    // Used ONLY by: Chance-Based Generator (to determine quantity of items to generate).
    STOCK: {
        DEFAULT_RANDOM_ITEMS: 10,
        DEFAULT_QUANTITY: {
            common: "3d6",       // Determines # of common items generated
            uncommon: "2d4",     // Determines # of uncommon items generated
            rare: "1d4",         // Determines # of rare items generated
            "very rare": "1d2",  // Determines # of very rare items generated
            legendary: "1d2-1"       // Base quantity if a legendary item is generated
        }
    },
    // Merchant personalities affect haggling
    MERCHANT_TYPES: [
        {name: "Honest", dcMod: -2, critSuccess: "Appreciates your fairness", critFailure: "Disappointed but understanding"},
        {name: "Greedy", dcMod: 3, critSuccess: "Reluctantly agrees", critFailure: "Throws you out"},
        {name: "Friendly", dcMod: -1, critSuccess: "Offers a bonus item", critFailure: "Looks sad but accepts"},
        {name: "Shrewd", dcMod: 2, critSuccess: "Impressed by your skills", critFailure: "Raises other prices"},
        {name: "Gullible", dcMod: -3, critSuccess: "Gives incredible discount", critFailure: "Doesn't realize they're losing money"},
        {name: "Suspicious", dcMod: 1, critSuccess: "Finally trusts you", critFailure: "Refuses to deal with you further"},
        {name: "Eccentric", dcMod: 0, critSuccess: "Gives you a strange bonus item", critFailure: "Changes the subject entirely"}
    ],
    
    // [TAG: CD_SHOP_SPECIAL_EVENTS]
    // Special event/promotion types
    SPECIAL_EVENTS: [
        {name: "None", description: "No special promotion"},
        {name: "Bulk Discount", description: "Buy X get Y free or discounted"},
        {name: "Category Sale", description: "All items in a category at discount"},
        {name: "Limited Time Sale", description: "Temporary price reductions"},
        {name: "Loyalty Program", description: "Return customers get special prices"}
    ],
    
    // Default shop properties
    DEFAULTS: {
        MERCHANT_NAME: "Unknown Merchant",
        SHOP_TYPE: "General Store",
        LOCATION: "Town",
        MERCHANT_TYPE: "Honest",
        BUY_MODIFIER: 1.0,
        SELL_MODIFIER: 0.5,
        DESCRIPTION: "A typical shop in a typical town.",
        WELCOME_MESSAGE: "Welcome to my shop! Take a look around.",
        MERCHANT_DESCRIPTION: "The merchant watches you browse their wares."
    }
}
};

// Main System Object
const ShopSystem = {
// [TAG: MG_DB_3_SHOP_3_State_Management]
state: {
    messageBuffer: [],
    isImporting: false,
    activeShop: null,
    pendingStock: null,
    playerBaskets: {},
    sellBaskets: {},
    haggleResults: {},
    pendingHaggleRolls: {},
    pendingItem: null
},

// [TAG: CD_ERROR_HANDLER]
errorHandler: {
    handleError(error, context) {
        ShopSystem.utils.log(`Error in ${context}: ${error.message}`, "error");
        if (error.stack) {
            ShopSystem.utils.log(error.stack, "error");
        }
        return false;
    },
    
    validateData(data, schema) {
        // Data validation logic
        return true;
    }
},

// [TAG: MG_DB_4_SHOP_4_Utility_Functions]
utils: {
    // [TAG: MG_DB_4_SHOP_4_LOG]
    log(message, type = 'info') {
        const prefix = CONFIG.LOGGING.PREFIX[type] || CONFIG.LOGGING.PREFIX.info;
        log(`${prefix} ${message}`);
    },

    // [TAG: MG_DB_5_SHOP_5_CHAT]
    chat(message, toPlayer = null) {
        if (toPlayer) {
            const player = getObj('player', toPlayer);
            if (player && player.get('_online')) { // Added check for player online status
                // Whisper using display name if player found and online
                sendChat("ShopSystem", `/w "${player.get('_displayname')}" ${message}`);
            } else {
                // If player object not found OR player is offline, log error and don't send (or maybe whisper ID as fallback?)
                ShopSystem.utils.log(`Could not send whisper to player ID ${toPlayer}. Player object not found or player offline. Message: ${message}`, 'warn');
                // Option: Try whispering by ID anyway? sendChat("ShopSystem", `/w "${toPlayer}" ${message}`);
                // Option: Just inform GM? sendChat("ShopSystem", `/w gm Could not whisper '${message}' to player ID ${toPlayer}`);
                // Current choice: Log and do not send.
            }
        } else {
            // Default whisper to GM if no target player specified
            sendChat("ShopSystem", `/w gm ${message}`);
        }
    },
    
    // [TAG: UTIL_PARSE_COMMAND_ARGS]
    parseCommandArgs: function(commandString) {
        const args = [];
        let inQuote = false;
        let currentArg = '';
        const trimmedCommandString = commandString.trim();

        for (let i = 0; i < trimmedCommandString.length; i++) {
            const char = trimmedCommandString[i];

            if (char === '\"') {
                inQuote = !inQuote;
                if (!inQuote) { 
                    args.push(currentArg); 
                    currentArg = '';
                } else { 
                    if (currentArg !== '') {
                        args.push(currentArg);
                        currentArg = '';
                    }
                }
                continue; 
            }

            if (char === ' ' && !inQuote) {
                if (currentArg !== '') {
                    args.push(currentArg);
                    currentArg = '';
                }
            } else {
                currentArg += char;
            }
        }
        if (currentArg !== '') {
            args.push(currentArg);
        }
        return args;
    },

    // [TAG: SHOP_6] - Fixed GM detection
    isGM(msg) { // Accept the full msg object
        // 1. Primary check: Use the 'who' string from the message object
        if (msg && msg.who && msg.who.endsWith('(GM)')) {
            ShopSystem.utils.log(`isGM Check (msg.who): player=${msg.who}, Result=true`, "debug");
            return true;
        }

        // 2. Fallback check: Use the player object if msg.who didn't work
        const playerID = msg ? msg.playerid : null;
        if (!playerID) return false; // Cannot check if no playerID
        
    },

    // [TAG: SHOP_7_showMenu_MODIFIED]
    showMenu(message, toPlayers = false, playerId = null) {
        if (toPlayers && playerId) {
            this.chat(message, playerId);
        } else if (toPlayers) {
            sendChat("ShopSystem", message);
        } else {
            this.chat(message);
        }
    },

    // [TAG: MG_DB_8_SHOP_11_CURRENCY_UTILS] 
    toCopper(currency) {
        let copper = 0;
        
        if (typeof currency === 'number') {
            return currency;
        }
        
        if (!currency) return 0;
        
        const { COPPER_PER_SILVER, COPPER_PER_ELECTRUM, COPPER_PER_GOLD, COPPER_PER_PLATINUM } = CONFIG.CURRENCY;
        
        if (currency.cp) copper += currency.cp;
        if (currency.sp) copper += currency.sp * COPPER_PER_SILVER;
        if (currency.ep) copper += currency.ep * COPPER_PER_ELECTRUM;
        if (currency.gp) copper += currency.gp * COPPER_PER_GOLD;
        if (currency.pp) copper += currency.pp * COPPER_PER_PLATINUM;
        
        return copper;
    },

    // [TAG: MG_DB_9_SHOP_12_CURRENCY_UTILS]
    fromCopper(copper) {
        if (!copper) return { cp: 0 };
        if (copper < 0) return { cp: 0 };
        
        const { COPPER_PER_SILVER, COPPER_PER_ELECTRUM, COPPER_PER_GOLD, COPPER_PER_PLATINUM } = CONFIG.CURRENCY;
        
        // Use platinum format only if value is 1000 gp or more
        const goldThreshold = 1000 * COPPER_PER_GOLD; // 100,000 copper
        
        if (copper >= goldThreshold) { 
            const currency = {
                pp: Math.floor(copper / COPPER_PER_PLATINUM)
            };
            
            copper %= COPPER_PER_PLATINUM;
            
            if (copper >= COPPER_PER_GOLD) {
                currency.gp = Math.floor(copper / COPPER_PER_GOLD);
                copper %= COPPER_PER_GOLD;
            }
            
            if (copper >= COPPER_PER_SILVER) {
                currency.sp = Math.floor(copper / COPPER_PER_SILVER);
                copper %= COPPER_PER_SILVER;
            }
            
            if (copper > 0) {
                currency.cp = copper;
            }
            
            return currency;
        } 
        // For medium value items, use gold-based format
        else if (copper >= 100) {
            const currency = {
                gp: Math.floor(copper / COPPER_PER_GOLD)
            };
            
            copper %= COPPER_PER_GOLD;
            
            if (copper >= COPPER_PER_SILVER) {
                currency.sp = Math.floor(copper / COPPER_PER_SILVER);
                copper %= COPPER_PER_SILVER;
            }
            
            if (copper > 0) {
                currency.cp = copper;
            }
            
            return currency;
        }
        // For low value items
        else {
            const currency = {};
            
            if (copper >= COPPER_PER_SILVER) {
                currency.sp = Math.floor(copper / COPPER_PER_SILVER);
                copper %= COPPER_PER_SILVER;
            }
            
            if (copper > 0 || Object.keys(currency).length === 0) {
                currency.cp = copper;
            }
            
            return currency;
        }
    },

    // [TAG: SHOP_10_formatCurrency_MODIFIED] // Assuming SHOP_10 was formatCurrency
    formatCurrency(currency) {
        if (!currency) return "0 gp";
        
        let copperValue = this.toCopper(currency);
        if (copperValue === 0) return "0 gp";
        
        const formatted = this.fromCopper(copperValue);
        const parts = [];
        const { CURRENCY_SYMBOLS } = CONFIG.DISPLAY;
        
        if (formatted.pp) parts.push(`${formatted.pp}${CURRENCY_SYMBOLS.pp}`);
        if (formatted.gp) parts.push(`${formatted.gp}${CURRENCY_SYMBOLS.gp}`);
        if (formatted.ep) parts.push(`${formatted.ep}${CURRENCY_SYMBOLS.ep}`);
        if (formatted.sp) parts.push(`${formatted.sp}${CURRENCY_SYMBOLS.sp}`);
        if (formatted.cp) parts.push(`${formatted.cp}${CURRENCY_SYMBOLS.cp}`);
        
        return parts.join(" ");
    },
    
    // [TAG: MG_DB_7_SHOP_69_HANDOUT_UTILS] // Merged DB_7 and SHOP_69?
    validateHandout(handout, expectedType) {
        if (!handout) return false;
        
        return new Promise((resolve, reject) => {
            handout.get("notes", function(notes) {
                try {
                    let cleanedNotes = notes;
                    let lastCleaned;
                    do {
                        lastCleaned = cleanedNotes;
                        cleanedNotes = cleanedNotes.replace(/<[^>]*>/g, '');
                    } while (cleanedNotes !== lastCleaned);
                    
                    cleanedNotes = cleanedNotes.replace(/&quot;/g, '"');
                    cleanedNotes = cleanedNotes.replace(/&amp;/g, '&');
                    cleanedNotes = cleanedNotes.replace(/&lt;/g, '<');
                    cleanedNotes = cleanedNotes.replace(/&gt;/g, '>');
                    cleanedNotes = cleanedNotes.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
                    
                    const data = JSON.parse(cleanedNotes);
                    resolve(data && (!expectedType || data.type === expectedType));
                } catch (e) {
                    reject(e);
                }
            });
        });
    },
    
    // [TAG: MG_DB_14_SHOP_71_HANDOUT_UTILS] // Merged DB_14 and SHOP_71?
    cleanHandoutNotes(notes) {
        if (!notes) return "";
        
        let cleanedNotes = notes;
        let lastCleaned;
        do {
            lastCleaned = cleanedNotes;
            cleanedNotes = cleanedNotes.replace(/<[^>]*>/g, '');
        } while (cleanedNotes !== lastCleaned);

        cleanedNotes = cleanedNotes.replace(/&quot;/g, '"');
        cleanedNotes = cleanedNotes.replace(/&amp;/g, '&');
        cleanedNotes = cleanedNotes.replace(/&lt;/g, '<');
        cleanedNotes = cleanedNotes.replace(/&gt;/g, '>');
        cleanedNotes = cleanedNotes.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
        
        return cleanedNotes;
    },
    
    // [TAG: MG_DB_6_SHOP_72_JSON_UTILS] // Merged DB_6 and SHOP_72?
    parseJSON(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            this.log(`Error parsing JSON: ${e.message}`, "error");
            return null;
        }
    },
    
    // [TAG: CD_SHOP_HANDOUT_UPDATE] // New function related to handout update
    updateShopHandout: function(handout, shopData) {
        try {
            if (!handout) {
                ShopSystem.utils.log("Cannot update handout: No handout provided", "error");
                return false;
            }
            
            // Update the handout's name if needed, using the correct prefix from config
            const handoutName = `${CONFIG.HANDOUT.SHOP_PREFIX}${shopData.name}`;
            if (handout.get("name") !== handoutName) {
                handout.set("name", handoutName);
            }
            
            // Store the updated shop data in the handout's gmnotes
            const shopJSON = JSON.stringify(shopData);
            handout.set("gmnotes", shopJSON);
            
            ShopSystem.utils.log(`Shop handout "${shopData.name}" updated successfully`, "info");
            return true;
        } catch (error) {
            ShopSystem.utils.log(`Error updating shop handout: ${error.message}`, "error");
            return false;
        }
    },
    
    // [TAG: CD_SHOP_REFRESH] // New function for refreshing
    refreshShops: function() {
        try {
            const shopHandouts = findObjs({
                _type: "handout",
                name: /^Shop - /
            });
            
            ShopSystem.utils.log(`Found ${shopHandouts.length} shop handouts to refresh`, "info");
            
            // Clear the existing shops array
            ShopSystem.shops = [];
            
            // Process each handout to extract shop data
            let loadedCount = 0;
            shopHandouts.forEach(handout => {
                ShopSystem.utils.log(`Processing handout: ${handout.get("name")}`, "debug");
                
                // update notes asynchronously
                handout.get("gmnotes", (notesContent) => {
                    try {
                        if (notesContent && notesContent.trim()) {
                            const cleanedNotes = ShopSystem.utils.cleanHandoutNotes(notesContent);
                            const shopData = JSON.parse(cleanedNotes);
                            
                            // Add ID to shop data
                            shopData.id = handout.id;
                            
                            // Add to shops array
                            ShopSystem.shops.push(shopData);
                            loadedCount++;
                            
                            ShopSystem.utils.log(`Successfully loaded shop data for "${shopData.name}"`, "debug");
                        } else {
                            ShopSystem.utils.log(`Empty notes content in handout: ${handout.get("name")}`, "warn");
                        }
                    } catch (parseError) {
                        ShopSystem.utils.log(`Error parsing shop data from handout "${handout.get("name")}": ${parseError.message}`, "error");
                    }
                });
            });
            
            // Save to state
            state.ShopSystem.shops = ShopSystem.shops;
            
            ShopSystem.utils.log(`Refreshed ${loadedCount} shops from handouts`, "info");
            return ShopSystem.shops;
        } catch (error) {
            ShopSystem.utils.log(`Error refreshing shops: ${error.message}`, "error");
            return [];
        }
    },
    
    // [TAG: CD_CHAT_UTILS]
    sendMessage: function(message, target = null) {
        // Unified chat prefix: ShopSystem
        if (target) {
            sendChat("ShopSystem", `/w "${target}" ${message}`);
        } else {
            sendChat("ShopSystem", message);
        }
    },
    
    // [TAG: CD_CHAT_UTILS] - Duplicate??
    sendGMMessage: function(message) {
        sendChat("ShopSystem", "/w gm " + message);
    },

    // [TAG: CD_UTILS_NORMALIZE_RARITY]
    normalizeRarity: function(rarity) {
        if (!rarity) return CONFIG.ITEM.DEFAULT_RARITY;
        
        // Convert to lowercase and trim
        const normalized = rarity.toLowerCase().trim();
        
        // Handle special case for "very rare"
        if (normalized === "very" || normalized === "very_rare" || normalized === "very-rare") {
            return "very rare";
        }
        
        return normalized;
    },

    // [TAG: CD_UTILS_ROLL_DICE]
    rollDice: function(notation) {
        // Handle fixed numbers
        if (!isNaN(notation)) {
            return parseInt(notation);
        }
        
        // Parse dice notation (e.g., "3d6" or "1d2-1")
        const match = notation.match(/^(\d+)d(\d+)(?:-(\d+))?$/);
        if (!match) {
             ShopSystem.utils.log(`Invalid dice notation: ${notation}. Defaulting to 1.`, 'warn');
            return 1; // Default to 1 if invalid notation
        }
        
        const [_, numDiceStr, numSidesStr, subtractStr] = match;
        const numDice = parseInt(numDiceStr);
        const numSides = parseInt(numSidesStr);
        const subtractValue = subtractStr ? parseInt(subtractStr) : 0;

        // Validate dice parameters
        if (numDice <= 0 || numSides <= 0) {
            ShopSystem.utils.log(`Invalid dice parameters in notation: ${notation}. Defaulting to 1.`, 'warn');
            return 1;
        }
        
        let total = 0;
        // Roll the dice
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * numSides) + 1;
        }

        // Apply subtraction if present, ensuring result is at least 0
        const result = Math.max(0, total - subtractValue);
        ShopSystem.utils.log(`Rolled ${notation}: ${result} (Raw: ${total}, Subtract: ${subtractValue})`, 'debug');
        
        return result;
    },

    // [TAG: CD_UTILS_ITEM_DISPLAY] - Move to Config?
    ITEM_DISPLAY: {
        PROPERTY_EMOJI: {
            damage: "⚔️",
            ac: "🛡️",
            weight: "⚖️",
            properties: "📋",
            attunement: "🔮",
            consumable: "📦",
            price: "💰"
        },

        formatItemDetails: function(item, format = 'inline') {
            const emoji = this.PROPERTY_EMOJI;
            
            if (format === 'menu') {
                const menu = [];
                if (item.weight) menu.push(`{{Weight=${item.weight}}}`);
                if (item.damage) menu.push(`{{Damage=${item.damage}${item.damage_type ? ` ${item.damage_type}` : ''}}}`);
                if (item.ac) menu.push(`{{AC=${item.ac}}}`);
                if (item.properties) menu.push(`{{Properties=${Array.isArray(item.properties) ? item.properties.join(', ') : item.properties}}}`);
                if (item.type) menu.push(`{{Type=${item.type.charAt(0).toUpperCase() + item.type.slice(1)}}}`);
                if (item.effect) menu.push(`{{Effect=${item.effect}}}`);
                if (item.description) menu.push(`{{Description=${item.description}}}`);
                if (item.attunement) menu.push(`{{Attunement=Required}}`);
                if (item.consumable) menu.push(`{{Consumable=Yes}}`);
                if (item.source) menu.push(`{{Source=${item.source}}}`);
                return menu;
            } else {
                const itemDetails = [];
                if (item.damage) {
                    itemDetails.push(`${emoji.damage} ${item.damage}${item.damage_type ? ` ${item.damage_type}` : ''}`);
                }
                if (item.ac) {
                    itemDetails.push(`${emoji.ac} AC ${item.ac}`);
                }
                if (item.weight) {
                    itemDetails.push(`${emoji.weight} ${item.weight} lb`);
                }
                if (item.properties) {
                    itemDetails.push(`${emoji.properties} ${Array.isArray(item.properties) ? item.properties.join(', ') : item.properties}`);
                }
                if (item.attunement) {
                    itemDetails.push(`${emoji.attunement} Requires Attunement`);
                }
                if (item.consumable) {
                    itemDetails.push(`${emoji.consumable} Consumable`);
                }
                return itemDetails;
            }
        }
    },

    // [TAG: UTIL_02_GET_RARITY_PERCENT] Compute percent chance for a given rarity between min/max with bonus
    getRarityPercent: function(targetRarity, minRarity, maxRarity, rarityBonus = 0) {
        const weights = CONFIG.SHOP_SETTINGS.STOCK_GENERATION.RARITY_CHANCES;
        const order = CONFIG.DISPLAY.RARITY.ORDER;
        let total = 0;
        let targetWeight = 0;
        Object.keys(order).forEach(rarity => {
            if (order[rarity] >= order[minRarity] && order[rarity] <= order[maxRarity]) {
                const w = Math.max(0.1, (weights[rarity] || 0) + rarityBonus);
                total += w;
                if (rarity === targetRarity) targetWeight = w;
            }
        });
        return total > 0 ? ((targetWeight / total) * 100).toFixed(1) : '0.0';
    },

    // [TAG: UTIL_03_GET_CHANCE_BASED_LEGENDARY] Compute chance-based legendary probability
    getChanceLegendaryPercent: function(rarityBonus = 0) {
        const base = CONFIG.SHOP_SETTINGS.STOCK_GENERATION.BASE_LEGENDARY_CHANCE || 0;
        // Effective chance combines base, bonus, and the 50% success rate of the 1d2-1 quantity roll
        const combinedConfigChance = Math.max(0, Math.min(100, base + rarityBonus)) / 100; // Chance from 0.0 to 1.0
        const baseQuantitySuccessRate = 0.5;
        const effectiveQuantitySuccessRate = baseQuantitySuccessRate * combinedConfigChance;
        return (effectiveQuantitySuccessRate * 100).toFixed(1); // Return as percentage string
    },

    // [TAG: UTIL_GET_CHAR_CURRENCY] Helper to get character currency, handling different sheet types
    // Updated to use async getSheetItem API
    getCharacterCurrency: async function(characterId) {
        const currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        const char = getObj('character', characterId);
        if (!char) {
            this.log(`Character not found for ID: ${characterId}`, 'error');
            return currency;
        }

        const charName = char.get('name');
        this.log(`💰 Getting currency for ${charName} (ID: ${characterId})`, 'debug');

        // --- Check for Standard D&D 5e Sheet Attributes First ---
        const standardAttrNames = ['pp', 'gp', 'ep', 'sp', 'cp'];
        try {
            const standardPromises = standardAttrNames.map(attr => getSheetItem(characterId, attr));
            const standardValues = await Promise.all(standardPromises);
            
            let foundStandard = false;
            standardValues.forEach((val, index) => {
                if (val !== undefined && val !== null && val !== "") {
                    const coin = standardAttrNames[index];
                    currency[coin] = parseInt(val) || 0;
                    if (currency[coin] > 0) foundStandard = true;
                }
            });

            if (foundStandard) {
                this.log(` -> Using standard attributes for ${charName}.`, 'debug');
                return currency;
            }
        } catch (e) {
            this.log(` -> Error checking standard currency attributes for ${charName}: ${e.message}`, 'warn');
        }

        // --- If not found, check for Beacon Sheet Attributes (money_*) ---
        const beaconAttrMapping = { pp: 'money_pp', gp: 'money_gp', ep: 'money_ep', sp: 'money_sp', cp: 'money_cp' };
        const beaconAttrNames = Object.values(beaconAttrMapping);
        try {
            const beaconPromises = beaconAttrNames.map(attr => getSheetItem(characterId, attr));
            const beaconValues = await Promise.all(beaconPromises);

            let foundBeacon = false;
            beaconValues.forEach((val, index) => {
                if (val !== undefined && val !== null && val !== "") {
                    const coin = Object.keys(beaconAttrMapping).find(key => beaconAttrMapping[key] === beaconAttrNames[index]);
                    if (coin) {
                        currency[coin] = parseInt(val) || 0;
                        if (currency[coin] > 0) foundBeacon = true;
                    }
                }
            });

            if (foundBeacon) {
                this.log(` -> Using Beacon attributes for ${charName}.`, 'debug');
                return currency;
            }
        } catch(e) {
            this.log(` -> Error checking Beacon currency attributes for ${charName}: ${e.message}`, 'warn');
        }
        
        // --- Fallback to Beacon Sheet Store Attribute ---
        const storeAttr = findObjs({
            _type: 'attribute',
            _characterid: characterId,
            name: 'store'
        })[0];

        if (storeAttr) {
            this.log(` -> Found Beacon 'store' attribute for ${charName}. Attempting parse...`, 'debug');
            try {
                let storeData = storeAttr.get('current');
                if (typeof storeData === 'string') {
                    if (storeData.trim() === '') {
                        this.log(` -> Beacon 'store' attribute is empty for ${charName}.`, 'debug');
                        throw new Error("Store attribute is empty");
                    }
                    storeData = JSON.parse(storeData);
                }

                if (typeof storeData === 'object' && storeData !== null) {
                    const storeCurrencies = {};
                    const searchForCurrency = (obj) => {
                        if (!obj) return;
                        if (Array.isArray(obj)) {
                            obj.forEach(item => searchForCurrency(item));
                        } else if (typeof obj === 'object') {
                            if (obj.name && obj.type === "Currency" && typeof obj.value === 'number') {
                                const coinName = obj.name.toLowerCase();
                                if (coinName === 'platinum') storeCurrencies.pp = obj.value;
                                else if (coinName === 'gold') storeCurrencies.gp = obj.value;
                                else if (coinName === 'electrum') storeCurrencies.ep = obj.value;
                                else if (coinName === 'silver') storeCurrencies.sp = obj.value;
                                else if (coinName === 'copper') storeCurrencies.cp = obj.value;
                            }
                            Object.values(obj).forEach(value => searchForCurrency(value));
                        }
                    };
                    searchForCurrency(storeData);

                    let foundInStore = false;
                    if (storeCurrencies.pp !== undefined) { currency.pp = storeCurrencies.pp; foundInStore = true; }
                    if (storeCurrencies.gp !== undefined) { currency.gp = storeCurrencies.gp; foundInStore = true; }
                    if (storeCurrencies.ep !== undefined) { currency.ep = storeCurrencies.ep; foundInStore = true; }
                    if (storeCurrencies.sp !== undefined) { currency.sp = storeCurrencies.sp; foundInStore = true; }
                    if (storeCurrencies.cp !== undefined) { currency.cp = storeCurrencies.cp; foundInStore = true; }

                    if (foundInStore) {
                        this.log(` -> Using Beacon 'store' attribute for ${charName}.`, 'debug');
                        return currency;
                    } else {
                        this.log(` -> No currency found within Beacon 'store' attribute for ${charName}.`, 'debug');
                    }
                }
            } catch (e) {
                this.log(` -> Error parsing Beacon 'store' attribute for ${charName}: ${e.message}`, 'warn');
            }
        }

        this.log(` -> No standard or Beacon currency attributes found for ${charName}. Returning zeroed currency.`, 'warn');
        return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    },

    // [TAG: UTIL_SET_CHAR_CURRENCY] Helper to set character currency, handling different sheet types
    // Updated to use async setSheetItem API
    setCharacterCurrency: async function(characterId, newCurrency) {
        const char = getObj('character', characterId);
        if (!char) {
            this.log(`Character not found for ID: ${characterId} when trying to set currency`, 'error');
            return false;
        }

        const charName = char.get('name');
        this.log(`💰 Setting currency for ${charName} (ID: ${characterId}) to: ` +
                `${newCurrency.pp || 0}pp, ${newCurrency.gp || 0}gp, ${newCurrency.ep || 0}ep, ${newCurrency.sp || 0}sp, ${newCurrency.cp || 0}cp`, 'debug');

        // --- Check for Standard D&D 5e Sheet Attributes ---
        try {
            const gpAttr = await getSheetItem(characterId, 'gp');
            // Check for existence of at least one attribute
            if (gpAttr !== undefined && gpAttr !== null) {
                this.log(` -> Found standard attributes for ${charName}. Updating...`, 'debug');
                const standardPromises = ['pp', 'gp', 'ep', 'sp', 'cp'].map(coin => 
                    setSheetItem(characterId, coin, newCurrency[coin] || 0)
                );
                await Promise.all(standardPromises);
                return true; // Success
            }
        } catch (e) {
            this.log(` -> Error checking/setting standard currency for ${charName}: ${e.message}`, 'warn');
        }

        // --- If not found, check for Beacon Sheet Attributes (money_*) ---
        try {
            const moneyGpAttr = await getSheetItem(characterId, 'money_gp');
            // Check for existence of at least one attribute
            if (moneyGpAttr !== undefined && moneyGpAttr !== null) {
                this.log(` -> Found Beacon attributes for ${charName}. Updating...`, 'debug');
                const beaconAttrMapping = { pp: 'money_pp', gp: 'money_gp', ep: 'money_ep', sp: 'money_sp', cp: 'money_cp' };
                const beaconPromises = Object.entries(beaconAttrMapping).map(([coin, attrName]) => 
                    setSheetItem(characterId, attrName, newCurrency[coin] || 0)
                );
                await Promise.all(beaconPromises);
                return true; // Success
            }
        } catch(e) {
            this.log(` -> Error checking/setting Beacon currency for ${charName}: ${e.message}`, 'warn');
        }

        // --- Fallback to Beacon Sheet Store Attribute ---
        const storeAttr = findObjs({ _type: 'attribute', _characterid: characterId, name: 'store' })[0];
        if (storeAttr) {
            this.log(` -> Attempting fallback update via Beacon 'store' attribute for ${charName}.`, 'debug');
            try {
                let storeData = storeAttr.get('current');
                if (typeof storeData === 'string') {
                    if (storeData.trim() === '') {
                        this.log(` -> Beacon 'store' attribute is empty, cannot update currency within it.`, 'debug');
                        throw new Error("Store attribute is empty");
                    }
                    storeData = JSON.parse(storeData || '{}');
                }
                if (typeof storeData === 'object' && storeData !== null) {
                    let storeUpdated = false;
                    const updateCurrencyInStore = (obj) => {
                        if (!obj) return;
                        if (Array.isArray(obj)) {
                            obj.forEach(item => updateCurrencyInStore(item));
                        } else if (typeof obj === 'object') {
                            if (obj.name && obj.type === "Currency") {
                                const coinName = obj.name.toLowerCase();
                                const newValue = newCurrency[coinName.substring(0, 2)] || 0;
                                if (obj.value !== newValue) {
                                    obj.value = newValue;
                                    storeUpdated = true;
                                    this.log(` -> Updated ${obj.name} in store to ${newValue}`, 'debug');
                                }
                            }
                            Object.values(obj).forEach(value => {
                                if (typeof value === 'object') {
                                    updateCurrencyInStore(value);
                                }
                            });
                        }
                    };
                    updateCurrencyInStore(storeData);
                    if (storeUpdated) {
                        storeAttr.set('current', JSON.stringify(storeData));
                        this.log(` -> Updated currency within Beacon 'store' attribute for ${charName}.`, 'debug');
                        return true; // Success
                    } else {
                        this.log(` -> No currency objects found to update within Beacon 'store' for ${charName}.`, 'debug');
                    }
                }
            } catch (e) {
                this.log(` -> Error updating Beacon 'store' attribute for ${charName}: ${e.message}`, 'warn');
            }
        }
        
        this.log(` -> Could not find any known currency attributes to update for ${charName}.`, 'error');
        return false; // Return false if no update method succeeded
    },

    // [TAG: UTIL_GET_TOKEN_IMAGE_ASYNC] Helper to get character token image tag asynchronously
    getCharacterTokenImgTagAsync: function(characterId, altText = 'Token', style = 'width: 25px; height: 25px; vertical-align: middle; margin-right: 5px; border-radius: 3px;', callback) {
        const char = getObj('character', characterId);
        if (!char) {
            ShopSystem.utils.log(`getCharacterTokenImgTagAsync: Character \'${characterId}\' not found.`, 'error');
            callback('👤 '); // Default icon
            return;
        }
        const charName = char.get('name') || 'Unnamed Character';

        char.get('defaulttoken', (defaultTokenJSON) => {
            let tokenImage = null;
            try {
                if (defaultTokenJSON && typeof defaultTokenJSON === 'string' && defaultTokenJSON.trim() !== '' && defaultTokenJSON.trim().toLowerCase() !== 'null') {
                    const decodedTokenJSON = decodeURIComponent(defaultTokenJSON);
                    const defaultTokenData = JSON.parse(decodedTokenJSON);
                    tokenImage = defaultTokenData ? defaultTokenData.imgsrc : null;
                }
            } catch (e) {
                ShopSystem.utils.log(`Error parsing defaulttoken for ${charName} (ID: ${characterId}): ${e.message}`, 'error');
            }

            if (!tokenImage || typeof tokenImage !== 'string' || tokenImage.trim() === '') {
                tokenImage = char.get('avatar');
            }
            if (!tokenImage || typeof tokenImage !== 'string' || tokenImage.trim() === '') {
                tokenImage = char.get('imgsrc');
            }

            if (tokenImage && typeof tokenImage === 'string' && tokenImage.trim() !== '') {
                let processedImageURL = tokenImage;
                if (!processedImageURL.startsWith('http')) {
                    if (processedImageURL.includes('/max.')) processedImageURL = processedImageURL.replace('/max.', '/thumb.');
                } else {
                    if (processedImageURL.includes('/max.')) processedImageURL = processedImageURL.replace('/max.', '/thumb.');
                    else if (processedImageURL.includes('/med.')) processedImageURL = processedImageURL.replace('/med.', '/thumb.');
                    if (processedImageURL.startsWith('http:')) processedImageURL = processedImageURL.replace('http:', 'https:');
                }
                
                if (processedImageURL.startsWith('https://') || processedImageURL.startsWith('http://')) {
                    callback(`<img src=\"${processedImageURL}\" style=\"${style}\" alt=\"${altText}\" onerror=\"this.style.display='none';this.onerror=null;\">`);
                } else {
                    ShopSystem.utils.log(`Potentially unsafe or relative image URL for ${charName}: ${processedImageURL}. Using default icon.`, 'warn');
                    callback('👤 ');
                }
            } else {
                callback('👤 ');
            }
        });
    },
},

// [TAG: MERGED_5]
database: {
    // [TAG: DB_11_SHOP_X_INIT] // Need to identify SHOP init tag if exists
    initialize: function() {
        let handout = findObjs({ _type: "handout", name: CONFIG.HANDOUT.DATABASE })[0];
        
        if (!handout) {
            // Create new handout if it doesn't exist
            handout = createObj("handout", {
                name: CONFIG.HANDOUT.DATABASE
            });
            
            // Initialize with empty database structure
            const initialData = {
                type: "item_database",
                version: CONFIG.version,
                items: {}
            };
            
            // Initialize categories and rarities from config
            CONFIG.ITEM.RARITIES.forEach(rarity => {
                initialData.items[rarity] = {};
                CONFIG.ITEM.CATEGORIES.forEach(category => {
                    initialData.items[rarity][category] = [];
                });
            });
            
            handout.set("gmnotes", JSON.stringify(initialData, null, 2));
            ShopSystem.utils.log(`Created new ${CONFIG.HANDOUT.DATABASE} handout.`, "success");
            ShopSystem.utils.chat(`✅ Item database initialized!`);
        } else {
            ShopSystem.utils.log(`Found existing ${CONFIG.HANDOUT.DATABASE} handout.`, "info");
            ShopSystem.utils.chat(`📚 Item database found!`);
        }
        
        return handout;
    },

    // [TAG: DB_13_SHOP_X_PROCESS_ITEM] // Need SHOP process item tag
    processItem: function(item) {
        // Ensure required fields
        if (!item.id) {
            item.id = item.name ? item.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') : 
                `item_${Date.now()}`;
        }
        
        // Ensure price is valid
        if (!item.price || Object.keys(item.price).length === 0) {
            item.price = { gp: 0 };
        }
        
        // Ensure rarity is valid
        if (!item.rarity || !CONFIG.ITEM.RARITIES.includes(item.rarity)) {
            item.rarity = CONFIG.ITEM.DEFAULT_RARITY;
        }
        
        // Ensure category is valid (case-insensitive check and assignment of canonical name)
        if (!item.category) {
            item.category = CONFIG.ITEM.DEFAULT_CATEGORY;
        } else {
            const lowerCaseItemCategory = item.category.toLowerCase();
            const foundCategory = CONFIG.ITEM.CATEGORIES.find(
                cfgCategory => cfgCategory.toLowerCase() === lowerCaseItemCategory
            );
            if (foundCategory) {
                item.category = foundCategory; // Assign the canonical name from CONFIG
            } else {
            item.category = CONFIG.ITEM.DEFAULT_CATEGORY;
            }
        }
        
        return item;
    },

    // [TAG: DB_17_SHOP_X_BATCH_IMPORT] // Need SHOP import tag
    batchImport: function(items) {
        const handout = findObjs({ _type: "handout", name: CONFIG.HANDOUT.DATABASE })[0];
        
        if (!handout) {
            ShopSystem.utils.log("Item-Database handout not found!", "error");
            return Promise.reject(new Error("Database not initialized"));
        }

        return new Promise((resolve, reject) => {
            handout.get("gmnotes", notes => {
                try {
                    // Initialize default database structure if notes are empty
                    const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes) || '{"items":{}}';
                    let data;
                    try {
                        data = JSON.parse(cleanNotes);
                    } catch (parseError) {
                        // If parsing fails, initialize with empty structure
                        data = { items: {} };
                    }

                    // Ensure data has required structure
                    if (!data.items) {
                        data.items = {};
                    }

                    let results = {
                        success: 0,
                        failed: 0,
                        skipped: 0,
                        errors: []
                    };

                    // Process each item
                    for (let item of items) {
                        try {
                            // Process and validate item
                            item = this.processItem(item);
                            
                            if (!item.rarity || !item.category) {
                                results.failed++;
                                results.errors.push(`Missing rarity or category for item: ${item.name || 'Unknown'}`);
                                continue;
                            }

                            // Ensure category exists for rarity
                            if (!data.items[item.rarity]) {
                                data.items[item.rarity] = {};
                            }
                            if (!data.items[item.rarity][item.category]) {
                                data.items[item.rarity][item.category] = [];
                            }

                            // Check for duplicates
                            const isDuplicate = data.items[item.rarity][item.category].some(
                                existingItem => existingItem.id === item.id
                            );

                            if (isDuplicate) {
                                results.skipped++;
                                continue;
                            }

                            // Add item
                            data.items[item.rarity][item.category].push(item);
                            results.success++;
                        } catch (itemError) {
                            results.failed++;
                            results.errors.push(`Error processing item ${item.name || 'Unknown'}: ${itemError.message}`);
                        }
                    }

                    // Save updated database
                    handout.get("gmnotes", (currentNotes) => {
                        const currentData = JSON.parse(ShopSystem.utils.cleanHandoutNotes(currentNotes));
                        const updatedData = { ...currentData, items: data.items };
                        handout.set("gmnotes", JSON.stringify(updatedData, null, 2));
                        resolve(results);
                    });
                } catch (error) {
                    ShopSystem.utils.log(`Error in batch import: ${error.message}`, "error");
                    reject(error);
                }
            });
        });
    },

    // [TAG: DB_19_SHOP_X_LIST_ITEMS] // Need SHOP list item tag
    listItems: function(category, rarity) { // category can be "Weapons", rarity can be "common"
        const handout = findObjs({ _type: "handout", name: CONFIG.HANDOUT.DATABASE })[0];
        
        if (!handout) {
            ShopSystem.utils.chat("❌ Item database not found! Initialize it with !itemdb init");
            return Promise.resolve([]); // Return a resolved promise with empty array
        }
        
        // Get handout data
        return new Promise((resolve, reject) => {
            handout.get("gmnotes", function(notes) {
                try {
                    const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes);
                    const data = JSON.parse(cleanNotes);
                    
                    if (!data || !data.items) {
                        ShopSystem.utils.chat("❌ Invalid database format!");
                        resolve([]);
                        return;
                    }

                    // Normalize category and rarity inputs to lowercase, unless they are 'all'
                    const effectiveCategory = (category && category.toLowerCase() !== 'all') ? category.toLowerCase() : 'all';
                    const effectiveRarity = (rarity && rarity.toLowerCase() !== 'all') ? rarity.toLowerCase() : 'all';
                    // Log what is being used for lookup
                    ShopSystem.utils.log(`listItems lookup: effectiveCategory='${effectiveCategory}', effectiveRarity='${effectiveRarity}' (Originals: category='${category}', rarity='${rarity}')`, 'debug');

                    // ... (after effectiveCategory and effectiveRarity are defined) ...
                    let items = [];
                    if (!data || !data.items) { // Added safety check for data.items
                        ShopSystem.utils.log(`listItems: Database structure (data.items) is missing or invalid.`, "error");
                    } else if (effectiveCategory === "all" && effectiveRarity === "all") {
                        Object.keys(data.items).forEach(rar => {
                            if (data.items[rar]) { 
                                Object.keys(data.items[rar]).forEach(cat => {
                                    if (data.items[rar][cat]) { 
                                        items = items.concat(data.items[rar][cat]);
                                    }
                                });
                            }
                        });
                    } else if (effectiveCategory === "all") {
                        // Filter by rarity only, across all categories
                        if (data.items[effectiveRarity]) {
                            Object.keys(data.items[effectiveRarity]).forEach(cat => {
                                if (data.items[effectiveRarity][cat]) { 
                                    items = items.concat(data.items[effectiveRarity][cat]);
                                }
                            });
                        }
                    } else if (effectiveRarity === "all") {
                        // Filter by category only, across all rarities
                        const canonicalCategoryToLookup = CONFIG.ITEM.CATEGORIES.find(c => c.toLowerCase() === effectiveCategory);
                        if (canonicalCategoryToLookup) {
                            Object.keys(data.items).forEach(rar => {
                                if (data.items[rar] && data.items[rar][canonicalCategoryToLookup]) {
                                    items = items.concat(data.items[rar][canonicalCategoryToLookup]);
                                }
                            });
                        } else if (effectiveCategory !== "all") { 
                            ShopSystem.utils.log(`listItems: Unknown category requested for filtering: ${category}`, "warn");
                        }
                    } else {
                        // Filter by specific category and rarity
                        const canonicalCategoryToLookup = CONFIG.ITEM.CATEGORIES.find(c => c.toLowerCase() === effectiveCategory);
                        if (canonicalCategoryToLookup) {
                            if (data.items[effectiveRarity] && data.items[effectiveRarity][canonicalCategoryToLookup]) {
                                items = data.items[effectiveRarity][canonicalCategoryToLookup] || []; 
                            } else {
                                items = []; 
                            }
                        } else if (effectiveCategory !== "all") { 
                            ShopSystem.utils.log(`listItems: Unknown category requested for filtering: ${category}`, "warn");
                            items = []; 
                        }
                    }

                    // Ensure items is always an array, even if nothing found or path was bad
                    if (!Array.isArray(items)) {
                        items = [];
                    }

                    // Use original category/rarity for logging the match, or effective ones if preferred for clarity
                    ShopSystem.utils.log(`Found ${items.length} items matching criteria (request: category=${category}, rarity=${rarity}; lookup: cat=${effectiveCategory}, rar=${effectiveRarity})`, 'info');
                    resolve(items);
                } catch (error) {
                    ShopSystem.utils.log(`Error parsing database in listItems: ${error.message}`, "error");
                    reject(`Error parsing database: ${error.message}`); // Keep reject for promise chain
                }
            });
        });
    },

    // [TAG: MG_DB_21_SHOP_X_CMD_HANDLER] // Need SHOP command handler tag
    handleDatabaseCommand: function(msg, args) {
        const playerID = msg.playerid;
        
        // Always allow access regardless of GM status for testing
        if (args.length === 0) {
            this.showHelp(playerID);
            return;
        }
        
        const command = args[0].toLowerCase();
        
        switch (command) {
            case "init":
                this.initialize();
                break;
            case "import":
                // Start import mode
                state.ShopSystem.messageBuffer = [];
                state.ShopSystem.isImporting = true;
                ShopSystem.utils.chat("📥 Import started. Paste your items and end with !itemdb end", playerID);
                break;
            case "end":
                // End import mode and process buffer
                if (state.ShopSystem.isImporting) {
                    this.processMessageBuffer();
                } else {
                    ShopSystem.utils.chat("❌ No import in progress!", playerID);
                }
                break;
            case "list":
                // Original args: e.g., ["list", "Armor", "&", "Attire", "All"] from !itemdb list Armor & Attire All
                // or ["list", "Weapons", "Common"] from !itemdb list Weapons Common
                // or ["list", "All", "All"] from !itemdb list All All

                let categoryArgIndex = 1;
                let categoryToValidate = "";
                let rarityArgIndex = -1; // Will be determined after category

                if (args.length > 1) {
                    let potentialCategory = args[categoryArgIndex]; // e.g., "Armor" or "Weapons" or "All"
                    
                    // Check if this could be a multi-word category
                    for (const knownCat of CONFIG.ITEM.CATEGORIES) {
                        const knownCatParts = knownCat.split(' ');
                        if (knownCatParts.length > 1 && knownCatParts[0].toLowerCase() === potentialCategory.toLowerCase()) {
                            // Potential multi-word category found
                            let assembledCategory = args.slice(categoryArgIndex, categoryArgIndex + knownCatParts.length).join(' ');
                            // Check if the assembled string matches a known multi-word category (case-insensitive)
                            if (assembledCategory.toLowerCase() === knownCat.toLowerCase()) {
                                potentialCategory = knownCat; // Use the canonical form
                                rarityArgIndex = categoryArgIndex + knownCatParts.length;
                                break;
                            }
                        }
                    }
                    // If it wasn't a multi-word category, or loop didn't break
                    if (rarityArgIndex === -1) {
                            rarityArgIndex = categoryArgIndex + 1; // Assume single word category
                    }
                    categoryToValidate = potentialCategory;
                } else {
                    categoryToValidate = 'all'; // No category arg provided
                }
                
                const category = categoryToValidate.toLowerCase(); // Now category should be "armor & attire" or "weapons" or "all"
                const rarity = args.length > rarityArgIndex && rarityArgIndex !== -1 ? ShopSystem.utils.normalizeRarity(args[rarityArgIndex]) : 'all';
                const forceDisplayFlag = args.length > rarityArgIndex + 1 && rarityArgIndex !== -1 && args[rarityArgIndex + 1].toLowerCase() === 'force';

                const validCategories = [...CONFIG.ITEM.CATEGORIES.map(c => c.toLowerCase()), 'all']; // Compare with lowercase
                const validRarities = [...CONFIG.ITEM.RARITIES.map(r => r.toLowerCase()), 'all'];
                
                if (!validCategories.includes(category)) {
                    // Get canonical names for error message
                    const displayValidCategories = [...CONFIG.ITEM.CATEGORIES, 'all'];
                    ShopSystem.utils.chat(`❌ Invalid category: ${categoryToValidate}. Valid categories are: ${displayValidCategories.join(', ')}`, playerID);
                    return;
                }
                
                if (!validRarities.includes(rarity.toLowerCase())) { // ensure rarity is lowercased for check
                        const displayValidRarities = [...CONFIG.ITEM.RARITIES, 'all'];
                    ShopSystem.utils.chat(`❌ Invalid rarity: ${args[rarityArgIndex]}. Valid rarities are: ${displayValidRarities.join(', ')}`, playerID);
                    return;
                }
                
                // Use the canonical category name for listItems if it was a multi-word one
                const canonicalCategoryToList = CONFIG.ITEM.CATEGORIES.find(c => c.toLowerCase() === category) || category;

                this.listItems(canonicalCategoryToList, rarity).then(items => {
                    if (items.length === 0) {
                        ShopSystem.utils.chat("No items found matching your criteria.", playerID);
                        return;
                    }
                    this.displayItemsList(items, canonicalCategoryToList, rarity, playerID, forceDisplayFlag);
                }).catch(error => {
                    ShopSystem.utils.chat(`❌ Error listing items: ${error}`, playerID);
                });
                break;
            case "sample":
                this.importSampleItems();
                break;
            case "help":
                this.showHelp(playerID);
                break;
            case "info":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Item ID required", playerID);
                    return;
                }
                this.showItemInfo(args[1], playerID);
                break;
            case "remove":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Item ID required", playerID);
                    return;
                }
                this.removeItem(args[1], playerID);
                break;
            case "add":
                this.showAddItemMenu(playerID);
                break;
            case "add_param":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Invalid usage: !itemdb add_param <param> <value>", playerID);
                    return;
                }
                // Pass all remaining arguments as the value array
                this.handleAddParam(args[1], args.slice(2), playerID);
                break;
            case "add_save":
                this.saveNewItem(playerID);
                break;
            case "update":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Item ID required", playerID);
                    return;
                }
                this.prefillAddItemMenu(args[1], playerID);
                break;
            default:
                ShopSystem.utils.chat(`❌ Unknown database command: ${command}. Use !itemdb help for available commands.`, playerID);
                break;
        }
    },
    
    // [TAG: CD_DB_22_HELP_MENU]
    showHelp: function(playerID) {
        const menu = [
            "&{template:default}",
            "{{name=📚 Item Database Help}}",
            "{{About=The Item Database system allows you to manage and organize items for your shops. Items are organized by category and rarity for easy access.}}",
            "{{Suggestions=It's recommended to import items to your item database on a separate test game/campaign as the import is via the chat and it looks messy, you can then copy the handout over to your live game/campaign.}}",
            "{{Categories=• Weapons\n• Armor & Attire\n• Equipment\n• Potions\n• Scrolls\n• Magic Items\n• Mounts & Vehicles\n• Services}}",
            "{{Rarities=• Common\n• Uncommon\n• Rare\n• Very Rare\n• Legendary}}",
            "{{Database Actions=",
            "[📥 Start Import](!itemdb import) [⛔ End Import](!itemdb end)",
            "[✏️ Add Single Item](!itemdb add)",
            "[📋 View All Items](!itemdb list all all)}}",
            "{{Import Format=Each item should follow this format:\n\nItem Name\n- category: type of item\n- rarity: item rarity\n- price: amount in gp\n- weight: number\n- damage: dice type (weapons)\n- properties: list\n- type: item type\n- effect: description\n- description: details\n- attunement: yes/no\n- consumable: yes/no\n- source: book}}",
            "{{Example=Dagger of Venom\n- category: weapons\n- rarity: rare\n- price: 250 gp\n- weight: 1\n- damage: 1d4 piercing\n- properties: finesse, light, thrown\n- type: simple\n- effect: Can use an action to coat the blade in poison\n- description: A magical dagger that can produce poison\n- attunement: yes\n- source: DMG}}",
            "{{Import Steps=1. Click Start Import above\n2. Paste your items in chat\n3. Type !itemdb end when finished}}",
            "{{Quick Add=Use the [✏️ Add Single Item] button above to add items through an interactive menu.}}"
        ].join(" ");
        
        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: CD_DB_29_DISPLAY_LIST] // Modified display logic
    displayItemsList: function(items, category, rarity, playerID, forceDisplay = false) {
        // Limit to 30 items to avoid message size limits
        const displayItems = items.slice(0, 30);
        const hasMore = items.length > 30;
        
        // Get category and rarity display settings from config
        const { EMOJI: rarityEmoji, ORDER: rarityOrder } = CONFIG.DISPLAY.RARITY;
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        // Define rarityEmojis here
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI; 
        // Get display threshold
        const displayThreshold = CONFIG.DISPLAY.STOCK_DISPLAY_THRESHOLD || 30;

        // --- Check if item count exceeds threshold and display is not forced ---
        if (items.length > displayThreshold && !forceDisplay) {
            ShopSystem.utils.log(`Warning: Item count (${items.length}) exceeds threshold (${displayThreshold}) for !itemdb list (Cat: '${category}', Rar: '${rarity}'). Showing warning menu.`, 'info');
            
            // Build category and rarity options for the filter prompt
            const categoryOptions = ['All', ...CONFIG.ITEM.CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))].join('|');
            const rarityOptions = ['All', ...CONFIG.ITEM.RARITIES.map(r => r === 'very rare' ? 'Very Rare' : r.charAt(0).toUpperCase() + r.slice(1))].join('|');

            // Ensure category and rarity for "Show These" button are quoted if they contain spaces
            const safeCategoryArgShowThese = category.includes(' ') ? `"${category}"` : category;
            const safeRarityArgShowThese = rarity.includes(' ') ? `"${rarity}"` : rarity;
            
            const menuWarning = [
                "&{template:default}",
                "{{name=⚠️ Large Item List Warning}}",
                `{{Message=Found ${items.length} items matching Category="${category}" and Rarity="${rarity}". Displaying all might be slow or incomplete.}}`,
                "{{Options=",
                // Button to trigger filter prompts
                `[🔍 Filter Further](!itemdb list ?{Category|${categoryOptions}} ?{Rarity|${rarityOptions}})`, 
                // Button to force display of the current filtered list
                `[➡️ Show These ${items.length} Items Anyway](!itemdb list ${category} ${rarity} force)`, 
                "[❓ Database Help](!itemdb help)", // Changed back button to help
                "}}"
            ].join(" ");
            ShopSystem.utils.chat(menuWarning, playerID);
            return; // Stop execution here, show only the warning
        }

        // --- Proceed with displaying the list ---
        // Sort items
        items.sort((a, b) => {
            if (category === 'all' && a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            if (a.rarity !== b.rarity) {
                return rarityOrder[a.rarity] - rarityOrder[b.rarity];
            }
            return a.name.localeCompare(b.name);
        });

        // Format the menu title
        const menu = [
            "&{template:default}",
            `{{name=${category === 'all' ? '📚 Item Database (All)' : `${categoryEmojis[category] || "📦"} ${category.charAt(0).toUpperCase() + category.slice(1)} Items`}}}`,
            "{{Filter System=Click on any category or rarity below to filter the items list}}",
        ];
        
        if (items.length === 0) {
            menu.push("{{Result=No items found matching criteria.}}");
        } else {
            if (category === 'all') {
                // Group by category first, then by rarity
                const itemsByCategory = {};
                items.forEach(item => {
                    if (!itemsByCategory[item.category]) {
                        itemsByCategory[item.category] = {};
                    }
                    if (!itemsByCategory[item.category][item.rarity]) {
                        itemsByCategory[item.category][item.rarity] = [];
                    }
                    itemsByCategory[item.category][item.rarity].push(item);
                });

                // Add each category
                Object.entries(itemsByCategory).forEach(([cat, rarityGroups]) => {
                    const categoryEmoji = categoryEmojis[cat] || "📦";
                    let categoryContent = [];

                    // Sort rarity groups by rarity order
                    const sortedRarityGroups = Object.entries(rarityGroups).sort(([rarA], [rarB]) => {
                        return rarityOrder[rarA] - rarityOrder[rarB];
                    });

                    // Add items grouped by rarity
                    sortedRarityGroups.forEach(([rar, rarityItems], rarIndex) => {
                        // Rarity Header - Apply blue color only when viewing ALL categories and ALL rarities
                        if (category === 'all' && rarity === 'all') {
                            // [TAG: CD_SHOP_RARITY_HEADER_COLOR_001] Add blue color to rarity headers in ALL view
                            categoryContent.push(`<span style="color:#3399FF;font-weight:bold;">${rarityEmoji[rar] || "⚪"} ${rar.charAt(0).toUpperCase() + rar.slice(1)}</span>`);
                        } else {
                            categoryContent.push(`${rarityEmoji[rar] || "⚪"} ${rar.charAt(0).toUpperCase() + rar.slice(1)}`);
                        }
                        
                        // Item Lines for this rarity - join without extra line breaks
                        const itemLines = rarityItems.map(item => {
                            const formattedPrice = ShopSystem.utils.formatCurrency(item.price);
                            // New format: Line 1: Name - 💰Price, Line 2: Buttons
                            return `• ${item.name} - 💰${formattedPrice}\n    [ℹ️ Info](!itemdb info ${item.id}) [❌ Remove](!itemdb remove ${item.id})`; 
                        }).join('\n'); 
                        
                        categoryContent.push(itemLines);
                    });

                    // Join the content for this category with newlines
                    menu.push(`{{${categoryEmoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}=${categoryContent.join('\n')}}}`);
                });
                } else {
                // Group only by rarity for specific category
                const itemsByRarity = {};
                items.forEach(item => {
                    if (!itemsByRarity[item.rarity]) {
                        itemsByRarity[item.rarity] = [];
                    }
                    itemsByRarity[item.rarity].push(item);
                });

                // Add each rarity group
                Object.entries(itemsByRarity).forEach(([rar, rarityItems]) => {
                    const itemLines = rarityItems.map(item => {
                        const formattedPrice = ShopSystem.utils.formatCurrency(item.price);
                        // New format: Line 1: Name - 💰Price, Line 2: Buttons
                        return `• ${item.name} - 💰${formattedPrice}\n    [ℹ️ Info](!itemdb info ${item.id}) [❌ Remove](!itemdb remove ${item.id})`;
                    }).join('\n');
                    
                    menu.push(`{{${rarityEmoji[rar] || "⚪"} ${rar.charAt(0).toUpperCase() + rar.slice(1)}=${itemLines}}}`);
                });
            }
        }
        
        // Add category and rarity navigation buttons
        menu.push("{{Filter Categories=");

        // Add line for current category
        const currentCategoryName = category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1);
        const currentCategoryEmoji = category === 'all' ? '📦' : (categoryEmojis[category] || '📦');
        menu.push(`Current: ${currentCategoryEmoji} ${currentCategoryName}`);

        // Generate buttons for *other* categories
        const categoryLinks = CONFIG.ITEM.CATEGORIES
            .filter(cat => cat !== category) // Filter out the current category
            .map(cat => {
                const emoji = categoryEmojis[cat] || "📦";
                // Use the correct command and variables for itemdb listing
                const categoryArg = cat.includes(' ') ? `"${cat}"` : cat; // Quote if space
                const rarityArg = rarity.includes(' ') ? `"${rarity}"` : rarity; // Quote if space (for safety)
                return `[${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}](!itemdb list ${categoryArg} ${rarityArg})`; 
            })
            .join(" ");
        menu.push(categoryLinks);

        // Add "All Categories" button only if it's not the current filter
        if (category !== 'all') {
            const rarityArg = rarity.includes(' ') ? `"${rarity}"` : rarity; // Quote if space
            menu.push(` [📦 All Categories](!itemdb list all ${rarityArg})`); 
        }
        menu.push("}}");
        
        // Add rarity filter buttons (always show, disable current)
        menu.push("{{Filter Rarities=");

        // Add line for current rarity
        const currentRarityName = rarity === 'all' ? 'All Rarities' : (rarity === 'very rare' ? 'Very Rare' : rarity.charAt(0).toUpperCase() + rarity.slice(1)); // Handle Very Rare capitalization
        const currentRarityEmoji = rarity === 'all' ? '🏳️‍🌈' : (rarityEmojis[rarity] || '⚪'); // Use updated emoji for all
        menu.push(`Current: ${currentRarityEmoji} ${currentRarityName}`);

        // Generate buttons for *other* rarities
        const rarityButtons = CONFIG.ITEM.RARITIES
            .filter(rar => rar !== rarity) // Filter out the current rarity
            .map(rar => {
                const emoji = rarityEmojis[rar] || "⚪";
                const rarityLabel = rar === 'very rare' ? 'Very Rare' : rar.charAt(0).toUpperCase() + rar.slice(1); // Handle Very Rare capitalization
                // Use the correct command and variables for itemdb listing
                const categoryArg = category.includes(' ') ? `"${category}"` : category; // Quote if space
                return `[${emoji} ${rarityLabel}](!itemdb list ${categoryArg} ${rar})`  
            })
            .join(" ");
        menu.push(rarityButtons);

        // Add "All Rarities" button only if it's not the current filter
        if (rarity !== 'all') {
            const categoryArg = category.includes(' ') ? `"${category}"` : category; // Quote if space
            menu.push(` [🏳️‍🌈 All Rarities](!itemdb list ${categoryArg} all)`); 
        }
        menu.push("}}");
        
        // Add back button and help with labels
        menu.push("{{Navigation=");
        menu.push("[📋 All Items](!itemdb list all all) [🏪 Shop](!shop) [❔ Help](!itemdb help)");
        menu.push("}}");
        
        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: CD_DB_6_SAMPLE_IMPORT] // Modified sample import
    importSampleItems: function() {
        const sampleItems = [
            {
                id: "longsword",
                name: "Longsword",
                price: { gp: 15 },
                weight: 3,
                damage: "1d8",
                damage_type: "slashing",
                properties: ["versatile"],
                category: "weapons",
                type: "martial",
                rarity: "common"
            },
            {
                id: "healing_potion",
                name: "Potion of Healing",
                price: { gp: 50 },
                weight: 0.5,
                effect: "Restores 2d4+2 hit points when consumed",
                category: "potions",
                rarity: "common",
                consumable: true
            },
            {
                id: "chainmail",
                name: "Chainmail",
                price: { gp: 75 },
                weight: 55,
                ac: 16,
                category: "Armor & Attire",
                type: "heavy",
                rarity: "common"
            }
        ];
        
        this.batchImport(sampleItems)
            .then(results => {
                if (results.skipped > 0) {
                    ShopSystem.utils.chat(`📦 Sample items imported: ${results.success} items added, ${results.skipped} duplicates skipped`);
                } else {
                    ShopSystem.utils.chat(`📦 Sample items imported: ${results.success} items added`);
                }
            })
            .catch(error => {
                ShopSystem.utils.log(`Error importing sample items: ${error.message}`, "error");
                ShopSystem.utils.chat(`❌ Error importing sample items`);
            });
    },

    // [TAG: DB_6_Parse_Text-Based_Item_Format] // Direct copy, keep as is - Why does it have a CD_ prefix if a direct copy?
    parseItemText: function(text) {
        try {
            // Remove any !itemdb end command if present
            text = text.replace(/!itemdb end/, '');
            
            const lines = text.split('\n').map(line => line.trim());
            const items = [];
            let currentItem = null;

            for (let line of lines) {
                // Skip empty lines
                if (!line) continue;

                // New item starts with a non-dash/bullet
                if (!line.startsWith('-') && !line.startsWith('•')) {
                    // Skip if it's just a number (line continuation marker)
                    if (!isNaN(line) && line.trim().length < 3) continue;

                    if (currentItem) {
                        items.push(currentItem);
                    }
                    // Generate a unique ID based on name
                    const id = line.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, '');
                    currentItem = {
                        id: id,
                        name: line,
                        price: {},
                        rarity: "common", // default rarity
                        category: "equipment" // default category
                    };
                    continue;
                }

                // Skip if no current item
                if (!currentItem) continue;

                // Parse property lines
                const propLine = line.replace(/^[-•]\s*/, '').trim();
                const [prop, ...valueParts] = propLine.split(':').map(p => p.trim());
                const value = valueParts.join(':').trim();

                switch (prop.toLowerCase()) {
                    case 'price':
                        const cleanedValue = value.replace(/,/g, '');
                        const priceMatch = cleanedValue.match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)/);
                        if (priceMatch) {
                            const [_, amount, currency] = priceMatch;
                            // Convert floating-point prices (e.g., "0.5 gp") correctly
                            if (amount.includes('.')) {
                                // Handle decimal values - convert to appropriate smaller units
                                const fullAmount = parseFloat(amount);
                                
                                if (currency === 'gp') {
                                    // 1 gp = 10 sp, so 0.5 gp = 5 sp
                                    const goldPart = Math.floor(fullAmount);
                                    const silverPart = Math.floor((fullAmount - goldPart) * 10);
                                    const copperPart = Math.floor(((fullAmount - goldPart) * 10 - silverPart) * 10);
                                    
                                    if (goldPart > 0) currentItem.price.gp = goldPart;
                                    if (silverPart > 0) currentItem.price.sp = silverPart;
                                    if (copperPart > 0) currentItem.price.cp = copperPart;
                                } else if (currency === 'pp') {
                                    // 1 pp = 10 gp, so 0.5 pp = 5 gp
                                    const platinumPart = Math.floor(fullAmount);
                                    const goldPart = Math.floor((fullAmount - platinumPart) * 10);
                                    const silverPart = Math.floor(((fullAmount - platinumPart) * 10 - goldPart) * 10);
                                    
                                    if (platinumPart > 0) currentItem.price.pp = platinumPart;
                                    if (goldPart > 0) currentItem.price.gp = goldPart;
                                    if (silverPart > 0) currentItem.price.sp = silverPart;
                                } else if (currency === 'sp') {
                                    // 1 sp = 10 cp, so 0.5 sp = 5 cp
                                    const silverPart = Math.floor(fullAmount);
                                    const copperPart = Math.floor((fullAmount - silverPart) * 10);
                                    
                                    if (silverPart > 0) currentItem.price.sp = silverPart;
                                    if (copperPart > 0) currentItem.price.cp = copperPart;
                                } else {
                                    // Just store integer value for cp and ep
                                    currentItem.price[currency] = Math.floor(fullAmount);
                                }
                            } else {
                                // Handle integer values
                                currentItem.price[currency] = parseInt(amount);
                            }
                        } else if (cleanedValue.toLowerCase() === 'free' || cleanedValue === '0') {
                            // Handle "free" or "0" items
                            currentItem.price = { gp: 0 };
                        } else {
                            // Try to parse a simple number as gold pieces
                            const simplePrice = parseFloat(cleanedValue);
                            if (!isNaN(simplePrice)) {
                                const goldPart = Math.floor(simplePrice);
                                const silverPart = Math.floor((simplePrice - goldPart) * 10);
                                const copperPart = Math.floor(((simplePrice - goldPart) * 10 - silverPart) * 10);
                                
                                if (goldPart > 0) currentItem.price.gp = goldPart;
                                if (silverPart > 0) currentItem.price.sp = silverPart;
                                if (copperPart > 0) currentItem.price.cp = copperPart;
                            }
                        }
                        break;
                    case 'weight':
                        currentItem.weight = parseFloat(value);
                        break;
                    case 'damage':
                        currentItem.damage = value.split(' ')[0];
                        currentItem.damage_type = value.split(' ')[1];
                        break;
                    case 'properties':
                        currentItem.properties = value.split(',').map(p => p.trim());
                        break;
                    case 'category':
                        currentItem.category = value.toLowerCase();
                        break;
                    case 'type':
                        currentItem.type = value.toLowerCase();
                        break;
                    case 'source':
                        currentItem.source = value;
                        break;
                    case 'rarity':
                        currentItem.rarity = value.toLowerCase();
                        break;
                    case 'ac':
                        currentItem.ac = parseInt(value);
                        break;
                    case 'description':
                        currentItem.description = value;
                        break;
                    case 'effect':
                        currentItem.effect = value;
                        break;
                    case 'attunement':
                        currentItem.attunement = value.toLowerCase() === 'yes';
                        break;
                    case 'consumable':
                        currentItem.consumable = value.toLowerCase() === 'yes';
                        break;
                    default:
                        // Store unknown properties as is
                        currentItem[prop.toLowerCase()] = value;
                }
            }

            // Add last item
            if (currentItem) {
                items.push(currentItem);
            }

            return items;
        } catch (error) {
            ShopSystem.utils.log(`Error parsing item text: ${error.message}`, "error");
            return null;
        }
    },

    // [TAG: DB_7_Process_Buffered_Messages]
    processMessageBuffer: function() {
        if (state.ShopSystem.messageBuffer.length === 0) return;

        // Combine all buffered messages
        const combinedText = state.ShopSystem.messageBuffer.join('\n');
        state.ShopSystem.messageBuffer = []; // Clear buffer
        state.ShopSystem.isImporting = false;

        // Parse and import items
        const items = this.parseItemText(combinedText);
        if (!items) {
            ShopSystem.utils.chat("❌ Error parsing items. Check format and try again.");
            return;
        }

        // Import items
        this.batchImport(items).then(results => {
            let message = `📦 Batch Import Results:\n`;
            message += `• ✅ Successfully added: ${results.success} items\n`;
            message += `• ⚠️ Skipped duplicates: ${results.skipped} items\n`;
            message += `• ❌ Failed to add: ${results.failed} items`;
            
            if (results.errors.length > 0) {
                message += `\n\n**Errors:**\n${results.errors.join('\n')}`;
            }
            
            ShopSystem.utils.chat(message);
        });
    },

    // [TAG: CD_DB_SHOW_ITEM_INFO]
    showItemInfo: function(itemId, playerID) {
        this.listItems('all', 'all').then(items => {
            const item = items.find(i => i.id === itemId);
            if (!item) {
                ShopSystem.utils.chat(`❌ Item not found: ${itemId}`, playerID);
                return;
            }

            // Get category and rarity emojis for display
            const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
            const categoryEmoji = categoryEmojis[item.category] || "📦";
            const rarityEmoji = CONFIG.DISPLAY.RARITY.EMOJI[item.rarity] || "⚪";
            const formattedPrice = ShopSystem.utils.formatCurrency(item.price);

            // Build detailed item information using our utility
            const itemDetails = ShopSystem.utils.ITEM_DISPLAY.formatItemDetails(item);
            itemDetails.unshift(`${categoryEmoji} ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`);
            itemDetails.unshift(`${rarityEmoji} ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}`);
            itemDetails.push(`${ShopSystem.utils.ITEM_DISPLAY.PROPERTY_EMOJI.price} ${formattedPrice}`);

            const menu = [
                "&{template:default}",
                `{{name=${categoryEmoji} ${item.name}}}`,
                `{{Item Details=${itemDetails.join('\n')}}}`,
                `{{Description=${item.description || 'No description available'}}}`,
                "{{Actions=",
                `[❌ Remove from Database](!itemdb remove ${item.id}) [✏️ Update Item](!itemdb update ${item.id})`,
                "}}",
                "{{Navigation=",
                `[📋 All Items](!itemdb list all all) [🏪 Shop](!shop)`,
                "}}"
            ];

            ShopSystem.utils.chat(menu.join(" "), playerID);
        }).catch(error => {
            ShopSystem.utils.chat(`❌ Error displaying item info: ${error}`, playerID);
        });
    },

    // [TAG: CD_DB_REMOVE_ITEM]
    removeItem: function(itemId, playerID) {
        let dbHandout = findObjs({ _type: "handout", name: CONFIG.HANDOUT.DATABASE })[0];
        if (!dbHandout) {
            ShopSystem.utils.chat("❌ Item database not found!", playerID);
            return; // Changed from Promise.reject for simplicity as original didn't return promise
        }

        let removedItemName = null; // To store the name for confirmation messages

        // Promise-like structure to handle asynchronous operations sequentially
        new Promise((resolveDb, rejectDb) => {
            // Step 1: Remove from DB
            dbHandout.get("gmnotes", function(notes) {
                try {
                    const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes);
                    let data = JSON.parse(cleanNotes);
                    let itemFound = false;
                    let removedItem = null;

                    // Search through all rarities and categories in DB
                    Object.keys(data.items).forEach(rarity => {
                        Object.keys(data.items[rarity]).forEach(category => {
                            if (Array.isArray(data.items[rarity][category])) {
                                const index = data.items[rarity][category].findIndex(item => item.id === itemId);
                                if (index !== -1) {
                                    removedItem = data.items[rarity][category][index];
                                    data.items[rarity][category].splice(index, 1);
                                    itemFound = true;
                                }
                            }
                        });
                    });

                    if (itemFound) {
                        removedItemName = removedItem.name; // Store the name
                        // Use dbHandout here instead of handout
                        dbHandout.set("gmnotes", JSON.stringify(data, null, 2));
                        ShopSystem.utils.log(`Removed ${removedItemName} from the database.`, "info");
                        resolveDb(true); // Indicate success
                    } else {
                        ShopSystem.utils.chat("❌ Item not found in database", playerID);
                        resolveDb(false); // Indicate item not found
                    }
                } catch (error) {
                    ShopSystem.utils.log(`Error removing item from database: ${error.message}`, "error");
                    rejectDb(error); // Reject on error
                }
            });
        }).then(dbRemovedSuccessfully => {
            // Step 2: If removed from DB, remove from shops
            if (!dbRemovedSuccessfully || !removedItemName) {
                return; // Stop if item wasn't in DB or name wasn't captured
            }

            ShopSystem.utils.log(`Attempting to find shops with prefix: ${CONFIG.HANDOUT.SHOP_PREFIX}`, 'debug');

            // Find *all* handouts first
            const allHandouts = findObjs({ 
                _type: "handout" 
            });
            ShopSystem.utils.log(`findObjs found ${allHandouts.length} total handouts.`, 'debug');

            // Filter using JavaScript startsWith
            const shopHandouts = allHandouts.filter(h => {
                const name = h.get('name');
                return name && name.startsWith(CONFIG.HANDOUT.SHOP_PREFIX);
            });

            ShopSystem.utils.log(`Filtered down to ${shopHandouts.length} handouts starting with the prefix.`, 'debug');
            // Log the names of found handouts for more detail
            if (shopHandouts.length > 0) {
                const foundNames = shopHandouts.map(h => h.get('name')).join(', ');
                ShopSystem.utils.log(`Found shop handouts: ${foundNames}`, 'debug');
            }

            if (shopHandouts.length === 0) {
                ShopSystem.utils.chat(`✅ Removed ${removedItemName} from the database. No shops found to update.`, playerID);
                return; // No shops to process
            }

            ShopSystem.utils.log(`Found ${shopHandouts.length} potential shops to update.`, "info");

            // Process each shop handout asynchronously
            const shopUpdatePromises = shopHandouts.map(shopHandout => {
                return new Promise((resolveShop) => { // Removed rejectShop for simplicity, just resolve false on error
                    shopHandout.get("gmnotes", function(shopNotes) {
                        try {
                            const cleanShopNotes = ShopSystem.utils.cleanHandoutNotes(shopNotes);
                            if (!cleanShopNotes) return resolveShop(false); // Skip empty notes

                            let shopData = JSON.parse(cleanShopNotes);
                            // Ensure it's a valid shop handout with an inventory
                            if (!shopData || shopData.type !== 'shop' || !shopData.inventory) { 
                                return resolveShop(false);
                            }

                            let shopModified = false;
                            // Search through shop inventory categories
                            for (const category in shopData.inventory) {
                                if (Array.isArray(shopData.inventory[category])) {
                                    const initialLength = shopData.inventory[category].length;
                                    // Filter out the item by ID
                                    shopData.inventory[category] = shopData.inventory[category].filter(item => item.id !== itemId);
                                    // Check if the length changed
                                    if (shopData.inventory[category].length < initialLength) {
                                        shopModified = true;
                                    }
                                }
                            }

                            if (shopModified) {
                                // Save updated shop data if modified
                                shopHandout.set("gmnotes", JSON.stringify(shopData, null, 2));
                                ShopSystem.utils.log(`Removed ${removedItemName} from shop: ${shopHandout.get('name')}`, 'debug');
                                resolveShop(true); // Indicate this shop was updated
                            } else {
                                resolveShop(false); // Indicate item not found or not removed from this shop
                            }
                        } catch (shopError) {
                            ShopSystem.utils.log(`Error processing shop ${shopHandout.get('name')}: ${shopError.message}`, "error");
                            resolveShop(false); // Resolve as false on error to not halt Promise.all
                        }
                    });
                });
            });

            // Step 3: Wait for all shops to be processed and report results
            return Promise.all(shopUpdatePromises).then(results => {
                const shopsUpdatedCount = results.filter(updated => updated).length;
                ShopSystem.utils.chat(`✅ Removed ${removedItemName} from the database and from ${shopsUpdatedCount} shop(s).`, playerID);
            });

        }).catch(error => {
            // Handle errors from DB removal or Promise.all itself
            ShopSystem.utils.log(`Error during item removal process: ${error.message}`, "error");
            ShopSystem.utils.chat(`❌ An error occurred while removing the item. Check logs.`, playerID);
        });
    },

    // [TAG: DB_35_show_add_item_menu]
    showAddItemMenu: function(playerID) {
        // Get config values for dropdowns
        const categories = CONFIG.ITEM.CATEGORIES.join('|');
        const rarities = CONFIG.ITEM.RARITIES.join('|');
        
        const menu = [
            "&{template:default}",
            "{{name=✏️ Add or Edit Item}}",
            "{{Basic Info=",
            "[📝 Item Name](!itemdb add_param name ?{Item Name})}}",
            "{{Category & Rarity=",
            `[📦 Category](!itemdb add_param category ?{Category|${categories}})`,
            `[💎 Rarity](!itemdb add_param rarity ?{Rarity|${rarities}})}}`,
            "{{Price & Properties=",
            "[💰 Price (gp)](!itemdb add_param price ?{Price in Gold Pieces|0})",
            "[⚖️ Weight](!itemdb add_param weight ?{Weight|1})",
            "[🏷️ Properties](!itemdb add_param properties ?{Properties|none})}}",
            "{{Details=",
            "[📖 Description](!itemdb add_param description ?{Description})",
            "[✨ Effect](!itemdb add_param effect ?{Effect|none})",
            "[🔮 Attunement](!itemdb add_param attunement ?{Requires Attunement|no|yes})",
            "[📦 Consumable](!itemdb add_param consumable ?{Is Consumable|no|yes})",
            "[📚 Source](!itemdb add_param source ?{Source|homebrew})}}",
            "{{Actions=",
            "[✅ Save Item](!itemdb add_save)",
            "[❌ Cancel](!itemdb help)}}",
        ].join(" ");
        
        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: DB_36_handle_add_param]
    handleAddParam: function(param, value, playerID) {
        if (!state.ShopSystem.pendingItem) {
            state.ShopSystem.pendingItem = {
                id: `item_${Date.now()}`,
                price: {}
            };
        }

        const pending = state.ShopSystem.pendingItem;

        // Get the full value by joining all parts after the parameter name
        const fullValue = Array.isArray(value) ? value.join(' ') : value;

        // Handle special cases
        switch(param) {
            case 'price':
                const goldValue = parseFloat(fullValue);
                if (!isNaN(goldValue)) {
                    pending.price = { gp: goldValue };
                }
                break;
            case 'properties':
                pending[param] = fullValue.toLowerCase() === 'none' ? [] : fullValue.split(',').map(p => p.trim());
                break;
            case 'attunement':
            case 'consumable':
                pending[param] = fullValue.toLowerCase() === 'yes';
                break;
            default:
                pending[param] = fullValue;
        }

        // Show confirmation and redisplay menu
        ShopSystem.utils.chat(`✅ Updated ${param} to: ${fullValue}`, playerID);
        this.showAddItemMenu(playerID);
    },

    // [TAG: DB_37_save_new_item]
    saveNewItem: function(playerID) {
        if (!state.ShopSystem.pendingItem) {
            ShopSystem.utils.chat("❌ No pending item to save!", playerID);
            return;
        }

        const item = state.ShopSystem.pendingItem;

        // Validate required fields
        if (!item.name || !item.category || !item.rarity) {
            ShopSystem.utils.chat("❌ Missing required fields (name, category, rarity)!", playerID);
            return;
        }

        // Process the item through database functions
        const processedItem = this.processItem(item);

        // Check if an item with the same ID exists
        this.listItems('all', 'all').then(items => {
            const existingItem = items.find(i => i.id === processedItem.id);
            if (existingItem) {
                // Update existing item
                this.updateItem(processedItem, playerID, true); // true = show info after update
            } else {
                // Add new item
                this.batchImport([processedItem])
                    .then(results => {
                        if (results.success > 0) {
                            ShopSystem.utils.chat(`✅ Successfully added item: ${item.name}`, playerID);
                            this.showItemInfo(processedItem.id, playerID);
                        } else {
                            ShopSystem.utils.chat(`❌ Failed to add item: ${results.errors.join(', ')}`, playerID);
                        }
                        delete state.ShopSystem.pendingItem;
                    })
                    .catch(error => {
                        ShopSystem.utils.chat(`❌ Error adding item: ${error.message}`, playerID);
                    });
            }
        }).catch(error => {
            ShopSystem.utils.chat(`❌ Error checking for existing item: ${error.message}`, playerID);
        });
    },

    // [TAG: DB_38_update_item]
    updateItem: function(item, playerID) {
        const dbHandout = findObjs({ _type: "handout", name: CONFIG.HANDOUT.DATABASE })[0];
        if (!dbHandout) {
            ShopSystem.utils.chat("❌ Item database not found!", playerID);
            return;
        }

        dbHandout.get("gmnotes", function(notes) {
            try {
                const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes);
                let data = JSON.parse(cleanNotes);
                let itemFound = false;

                // Search through all rarities and categories in DB
                Object.keys(data.items).forEach(rarity => {
                    Object.keys(data.items[rarity]).forEach(category => {
                        if (Array.isArray(data.items[rarity][category])) {
                            const index = data.items[rarity][category].findIndex(i => i.id === item.id);
                            if (index !== -1) {
                                data.items[rarity][category][index] = item;
                                itemFound = true;
                            }
                        }
                    });
                });

                if (itemFound) {
                    // Use dbHandout here instead of handout
                    dbHandout.set("gmnotes", JSON.stringify(data, null, 2));
                    ShopSystem.utils.log(`Updated ${item.name} in the database.`, "info");
                    ShopSystem.utils.chat(`✅ Successfully updated item: ${item.name}`, playerID);
                    this.showItemInfo(item.id, playerID);
                    delete state.ShopSystem.pendingItem; // <-- Add this line
                } else {
                    ShopSystem.utils.chat("❌ Item not found in database", playerID);
                }
            } catch (error) {
                ShopSystem.utils.log(`Error updating item in database: ${error.message}`, "error");
                ShopSystem.utils.chat(`❌ Error updating item: ${error.message}`, playerID);
            }
        });
    },

    // [TAG: DB_39_prefill_add_item_menu]
    prefillAddItemMenu: function(itemId, playerID) {
        this.listItems('all', 'all').then(items => {
            const item = items.find(i => i.id === itemId);
            if (!item) {
                ShopSystem.utils.chat(`❌ Item not found: ${itemId}`, playerID);
                return;
            }

            // Set pending item to a copy of the item
            state.ShopSystem.pendingItem = JSON.parse(JSON.stringify(item));

            // Open the add item menu
            this.showAddItemMenu(playerID);
        }).catch(error => {
            ShopSystem.utils.chat(`❌ Error prefilling add item menu: ${error}`, playerID);
        });
    },
},

// [TAG: MERGED_6]
shop: {
    // [TAG: SHOP_103_157]
    HNDL_CMD_HandleShopCommand: function(msg, args) {
        ShopSystem.utils.log(`HNDL_CMD_HandleShopCommand: Received args: ${JSON.stringify(args)}`, "debug");
        const playerID = msg.playerid;
        
        if (args.length === 0) {
            shopSystem.utils.log(`HNDL_CMD_HandleShopCommand: args.length is 0, showing help.`, "debug");
            this.SHPDIS_MD_ShowShopHelp(playerID);
            return;
        }
        
        const command = args[0].toLowerCase();
        ShopSystem.utils.log(`HNDL_CMD_HandleShopCommand: command set to: "${command}" (from args[0])`, "debug");

        // Handler for setting individual shop parameters
        const handleSetParameter = (encodedName, value, paramType) => {
            // [TAG: CD_SHOP_03_DECODE_SHOP_NAME]
            const shopName = encodedName.replace(/_SPACE_/g, " ");
            this.SET_LOG_HandleSetup(shopName, paramType, value, playerID);
        };
        
        switch (command) {
            case "list":
                this.SHPDIS_MD_ShowShopList(playerID);
                break;
                
            case "create":
                // Check if using pipe delimiter format
                if (msg.content.includes("|")) {
                    // Split the command content on pipes and remove the "!shop create" part
                    const createArgs = msg.content.split("|");
                    // Get the full create command part (before the first pipe)
                    const cmdPart = createArgs[0];
                    
                    // Extract the shop name from the command part by removing the "!shop create " prefix
                    const shopNameStartIndex = cmdPart.indexOf("create") + "create".length;
                    let newShopName = cmdPart.substring(shopNameStartIndex).trim();
                    
                    // If shop name is empty, check if it's in params
                    if (!newShopName && createArgs.length > 1) {
                        newShopName = createArgs[1].trim();
                    }
                    
                    // Get the rest of the parameters, skipping the empty ones
                    const params = createArgs.slice(1).filter(p => p.trim());
                    
                    // Extract parameters
                    const [merchantName = "", shopType = "", location = "", merchantType = "", priceModifier = "", sellModifier = "", ...descriptionParts] = params;
                    const description = descriptionParts.join(" ") || "A typical shop in a typical town";

                    if (!newShopName) {
                        ShopSystem.utils.chat('❌ Please specify a shop name!', playerID);
                        return;
                    }
                    
                    // Get defaults
                    const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
                    
                    // Create initial shop data structure
                    const initialShopData = {
                        type: 'shop',
                        name: newShopName.trim(),
                        merchant_name: merchantName?.trim() || defaults.MERCHANT_NAME,
                        shop_type: shopType?.trim() || defaults.SHOP_TYPE,
                        location: location?.trim() || defaults.LOCATION,
                        merchant_type: merchantType?.trim() || defaults.MERCHANT_TYPE,
                        price_modifiers: {
                            buy: parseFloat(priceModifier?.trim()) || defaults.BUY_MODIFIER,
                            sell: parseFloat(sellModifier?.trim()) || defaults.SELL_MODIFIER
                        },
                        haggle: {
                            max_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                            remaining_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                        },
                        description: description.trim(),
                        welcome_message: defaults.WELCOME_MESSAGE,
                        merchant_description: defaults.MERCHANT_DESCRIPTION,
                        special_event: {
                            type: "None",
                            details: "None"
                        },
                        inventory: {
                            weapons: [],
                            "Armor & Attire": [],
                            potions: [],
                            scrolls: [],
                            magic: [],
                            equipment: [],
                            "Mounts & Vehicles": [],
                            Services: []
                        }
                    };

                    const newShop = this.GEN_LOG_CreateShopHandout(newShopName.trim(), initialShopData);
                    if (newShop) {
                        ShopSystem.utils.chat(`✅ Created new shop: ${newShopName} (Merchant: ${initialShopData.merchant_name})`, playerID);
                        // Show the shop list after creation
                        this.SHPDIS_MD_ShowShopList(playerID);
                    }
                } else {
                    // Simple space-separated format
                    if (args.length < 2) {
                        ShopSystem.utils.chat('❌ Please specify a shop name!', playerID);
                        return;
                    }
                    
                    const shopName = args.slice(1).join(" ");
                    
                    // Create basic shop data using defaults
                    const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
                    const shopData = {
                        type: 'shop',
                        name: shopName,
                        merchant_name: defaults.MERCHANT_NAME,
                        shop_type: defaults.SHOP_TYPE,
                        location: defaults.LOCATION,
                        merchant_type: defaults.MERCHANT_TYPE,
                        price_modifiers: {
                            buy: defaults.BUY_MODIFIER,
                            sell: defaults.SELL_MODIFIER
                        },
                        description: defaults.DESCRIPTION,
                        welcome_message: defaults.WELCOME_MESSAGE,
                        merchant_description: defaults.MERCHANT_DESCRIPTION,
                        special_event: {
                            type: "None",
                            details: "None"
                        },
                        inventory: {
                            weapons: [],
                            "Armor & Attire": [],
                            potions: [],
                            scrolls: [],
                            magic: [],
                            equipment: [],
                            "Mounts & Vehicles": [],
                            Services: []
                        }
                    };
                    
                    const newShop = this.GEN_LOG_CreateShopHandout(shopName, shopData);
                    if (newShop) {
                        ShopSystem.utils.chat(`✅ Created new shop: ${shopName}`, playerID);
                        // Show the shop list after creation
                        this.SHPDIS_MD_ShowShopList(playerID);
                    }
                }
                break;
                
            case "create_advanced":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Shop name required: !shop create_advanced [name]", playerID);
                    return;
                }
                // Join remaining args to handle spaces in shop names
                const shopToSetup = args.slice(1).join(" ");
                this.SHPDIS_MD_ShowSetupMenu(shopToSetup, playerID);
                break;
            
            // New parameter setting commands
            case "set_merchant":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "merchant");
                break;
                
            case "set_type":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "type");
                break;
                
            case "set_location":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "location");
                break;

            case "set_haggle_attempts":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "haggle_attempts");
                break;
                
            case "set_personality":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "personality");
                break;
                
            case "set_merchant_desc":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "merchant_desc");
                break;
                
            case "set_welcome":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "welcome");
                break;
                
            case "set_buy_mod":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "buy_mod");
                break;
                
            case "set_sell_mod":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "sell_mod");
                break;
                
            case "set_event":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "event");
                break;
                
            case "set_event_details":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "event_details");
                break;
                
            case "set_description":
                if (args.length < 3) {
                    ShopSystem.utils.chat("❌ Missing parameters", playerID);
                    return;
                }
                handleSetParameter(args[1], args.slice(2).join(" "), "description");
                break;
                
            case "finish_setup":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Shop name required", playerID);
                    return;
                }
                this.SET_LOG_CompleteSetup(args[1], playerID);
                break;
                
            case "adv_setup":
                if (args.length < 4) {
                    ShopSystem.utils.chat("❌ Missing parameters for advanced setup", playerID);
                    return;
                }
                {
                    const fullCommand = msg.content;
                    let setupShopName, setupParam, setupValue;
                    
                    // Check for quoted shop name
                    const quoteMatch = fullCommand.match(/adv_setup\s+"([^"]+)"\s+(\w+)\s+(.+)/);
                    if (quoteMatch) {
                        setupShopName = quoteMatch[1];
                        setupParam = quoteMatch[2];
                        setupValue = quoteMatch[3];
                    } else {
                        // Fallback to basic args
                        setupShopName = args[1];
                        setupParam = args[2];
                        setupValue = args.slice(3).join(" ");
                    }
                    
                    this.SET_LOG_HandleSetup(setupShopName, setupParam, setupValue, playerID);
                }
                break;
                
            case "adv_complete":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Shop name required: !shop adv_complete [name]", playerID);
                    return;
                }
                
                // Process complete command with special handling for shop names with spaces
                {
                    const fullCommand = msg.content;
                    let completeShopName;
                    
                    // Check for quoted shop name
                    const quoteMatch = fullCommand.match(/adv_complete\s+"([^"]+)"/);
                    if (quoteMatch) {
                        completeShopName = quoteMatch[1];
                    } else {
                        // Fallback to joining args
                        completeShopName = args.slice(1).join(" ");
                    }
                    
                    this.SET_LOG_CompleteSetup(completeShopName, playerID);
                }
                break;
                
            case "open":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Shop name required: !shop open [name]", playerID);
                    return;
                }
                // Join remaining args to handle spaces in shop names
                const shopToOpen = args.slice(1).join(" ");
                // Call with forcePublicDisplay = false 
                this.SHPDIS_MD_ShowShopMenu(shopToOpen, msg.playerid, msg, false); 
                break;
                
            // [TAG: BROWSE_MULTIWORD_CATEGORY_FIX]
            case "browse":
                if (args.length < 2) { // Need at least "browse" + category part
                    ShopSystem.utils.chat("❌ Please specify a category to browse.", playerID);
                    return;
                }

                // Reconstruct category name from args, starting from index 1
                // Example args: ["browse", "Armor", "&", "Attire"] or ["browse", "Weapons"] or ["browse", "All"]
                let categoryToBrowse = "";
                let potentialCategoryParts = args.slice(1); // All parts after "browse"
                let matchedKnownCategory = false;

                // Try to match longest known category first (e.g. "Mounts & Vehicles" before "Mounts")
                // This loop assumes CONFIG.ITEM.CATEGORIES are the canonical names to match against
                for (const knownCat of CONFIG.ITEM.CATEGORIES.slice().sort((a,b) => b.length - a.length)) { // Sort by length desc
                    const knownCatParts = knownCat.split(' ');
                    if (potentialCategoryParts.length >= knownCatParts.length) {
                        let tempCategory = potentialCategoryParts.slice(0, knownCatParts.length).join(' ');
                        if (tempCategory.toLowerCase() === knownCat.toLowerCase()) {
                            categoryToBrowse = knownCat; // Use canonical (mixed-case) name
                            matchedKnownCategory = true;
                            break;
                        }
                    }
                }
                
                // If no multi-word known category matched, try to see if the first part is "all" or a single-word known category
                if (!matchedKnownCategory) {
                    let firstPart = potentialCategoryParts[0];
                    if (firstPart) {
                        if (firstPart.toLowerCase() === "all") {
                            categoryToBrowse = "all";
                } else {
                            // Check if the first part is a known single-word category
                            const foundSingle = CONFIG.ITEM.CATEGORIES.find(cfgCat => cfgCat.toLowerCase() === firstPart.toLowerCase());
                            if (foundSingle) {
                                categoryToBrowse = foundSingle; // Use canonical
                            } else {
                                // Fallback: join all parts, this might be a typo or an unknown category
                                categoryToBrowse = potentialCategoryParts.join(" ");
                            }
                        }
                    }
                }

                if (!categoryToBrowse) {
                    ShopSystem.utils.chat("❌ Could not determine category to browse.", playerID);
                    return;
                }

                ShopSystem.utils.log(`Browsing shop category: '${categoryToBrowse}' (Raw args after browse: ${JSON.stringify(args.slice(1))})`, "debug");
                
                // STKACT_MD_ShowShopCategoryItems should handle 'all' and validate known categories
                // It expects the canonical category name.
                this.STKACT_MD_ShowShopCategoryItems(categoryToBrowse, playerID);
                break;
                
            case "sample":
                this.GEN_LOG_CreateSampleShop();
                break;
                
            case "help":
                this.SHPDIS_MD_ShowShopHelp(playerID, false);
                break;
                
            case "update_complete":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ Shop name required", playerID);
            return;
                }
                this.SET_LOG_CompleteSetup(args[1], playerID, true);  // true flag indicates this is an update
                break;

            case "update_info":
                if (!ShopSystem.state.activeShop) {
                    ShopSystem.utils.chat("❌ No active shop to update", playerID);
            return;
                }
                // Call the advanced setup menu with the active shop name and update mode
                this.SHPDIS_MD_ShowSetupMenu(ShopSystem.state.activeShop.name, playerID, true);
                break;
            
            case "haggle_reset":
                if (!ShopSystem.utils.isGM(msg)) return;
                shop = ShopSystem.state.activeShop;
                if (shop?.haggle) {
                    shop.haggle.remaining_attempts = shop.haggle.max_attempts;
                    ShopSystem.utils.sendGMMessage(`✅ Reset haggle attempts for ${shop.name}`);
                    // Update the handout's gmnotes
                    const shopHandout = getObj("handout", shop.id);
                    if (shopHandout) {
                        shopHandout.set("gmnotes", JSON.stringify(shop));
                    }
                }
                break;

            case "stock":
                // Route to stock management, passing the full msg object
                this.STKACT_CMD_HandleStockCommand(args.slice(1), playerID, msg);
                break;
                
            case "manage":
                // Direct route to stock management menu
                this.STKMGM_MD_ShowStockManageMenu(playerID);
                break;
                
            case "display_to_players":
                if (!ShopSystem.utils.isGM(msg)) { // Pass the full msg object
                    ShopSystem.utils.chat("❌ Only the GM can display the shop publicly.", playerID);
                    return;
                }
                if (!ShopSystem.state.activeShop) {
                    ShopSystem.utils.chat("❌ No active shop to display.", playerID);
                    return;
                }
                // Show character selection menu to ALL players (including GM)
                this.SHPDIS_MD_ShowCharacterSelect(null, true); // Show to everyone
                break;

            case "select_character":
                if (args.length < 2) {
                    ShopSystem.utils.chat("❌ No character selected", playerID);
                    return;
                }
                const characterId = args[1];
                state.ShopSystem.activeCharacters[playerID] = characterId;
                
                // Get character name for confirmation
                const character = getObj('character', characterId);
                ShopSystem.utils.chat(`✅ Selected character: ${character.get('name')}`, playerID);

                // Show the shop menu to the player
                if (ShopSystem.state.activeShop) {
                    this.SHPDIS_MD_ShowShopMenu(ShopSystem.state.activeShop.name, playerID, msg, false);
                } else {
                    ShopSystem.utils.chat("❌ No active shop available.", playerID);
                }
                break;

            case "switch_character":
                this.SHPDIS_MD_ShowCharacterSelect(playerID);
                break;

            case "basket":
                const basketAction = args[1]?.toLowerCase();
                const basketItemId = args[2];
                const basketQty = parseInt(args[3] || "1");

                switch (basketAction) {
                    case "add":
                        if (!basketItemId) {
                            ShopSystem.utils.chat("❌ No item specified to add.", playerID);
                            break;
                        }
                        ShopSystem.basket.addToBasket(playerID, basketItemId, basketQty);
                        break;
                    case "remove":
                         if (!basketItemId) {
                            ShopSystem.utils.chat("❌ No item specified to remove.", playerID);
                            break;
                        }
                    // Pass only ID for remove, quantity is handled internally or defaults to all
                        ShopSystem.basket.removeFromBasket(playerID, basketItemId); 
                        break;
                    case "view":
                        ShopSystem.basket.viewBasket(playerID);
                        break;
                    case "clear":
                         ShopSystem.basket.clearBasket(playerID);
                         break;
                    case "checkout":
                    // Calls checkout, which may lead to confirmPurchase
                        ShopSystem.basket.checkout(playerID);
                        break;
                    case "haggle":
                    // GM Pre-selection prompt
                        ShopSystem.basket.initiateHaggle(playerID); // Call a new function to handle the prompt
                        break;
                    // Handles haggling from Sell Basket view
                    case "haggle_sell": 
                        // Calls initiateHaggle forcing the type to 'sell'
                        ShopSystem.basket.initiateHaggle(playerID, 'sell'); 
                        break;
                    // Add new cases for basket merging
                    case "merge":
                        ShopSystem.basket.mergeBaskets(playerID);
                        break;
                    case "unmerge":
                        ShopSystem.basket.unmergeBaskets(playerID);
                        break;
                    // [TAG: CHECKOUT_ROUTING_001] Add confirm and complete cases
                    case "confirm": // Handles !shop basket confirm [charId]
                        const confirmCharId = args[2]; // Character ID is the 3rd argument (index 2)
                        if (!confirmCharId) {
                            ShopSystem.utils.sendMessage("❌ Character ID missing for purchase confirmation.", playerID);
                            break;
                        }
                        ShopSystem.basket.confirmPurchase(playerID, confirmCharId);
                        break;
                    case "complete": // Handles !shop basket complete [charId]
                        const completeCharId = args[2]; // Character ID is the 3rd argument (index 2)
                        if (!completeCharId) {
                            ShopSystem.utils.sendMessage("❌ Character ID missing for purchase completion.", playerID);
                            break;
                        }
                        ShopSystem.basket.completePurchase(playerID, completeCharId);
                        break;
                    case "haggle_show_skills":
                        // Player ID should be the 3rd argument (index 2) from the GM prompt button
                        const showSkillsPlayerId = args[2];
                        if (!showSkillsPlayerId) {
                            ShopSystem.utils.sendGMMessage("❌ Player ID missing for haggle_show_skills command.");
                            break; 
                        }
                        const targetPlayerName = getObj('player', showSkillsPlayerId)?.get('_displayname') || `PlayerID ${showSkillsPlayerId}`;
                        ShopSystem.basket.showHaggleSkillsMenu(showSkillsPlayerId);
                        // Send confirmation to the GM who clicked the button
                        ShopSystem.utils.sendGMMessage(`✅ Skill selection menu sent to ${targetPlayerName} for haggling.`);
                        break;
                    case "haggle_check":
                        const playerId = args[2];
                        const skillType = args[3];
                        const dc = args[4];
                        ShopSystem.basket.handleHaggleCheck(playerId, skillType, dc);
                        break;
                    case "send_player_to_basket":
                        // Format: !shop basket send_player_to_basket [playerId] [basketType]
                        const targetPlayerId = args[2];
                        const basketType = args[3]; // 'sell' or 'buy'
                        if (!targetPlayerId) {
                            ShopSystem.utils.sendGMMessage("❌ No player ID provided for send_player_to_basket.");
                            break;
                        }
                        if (basketType === 'sell') {
                            ShopSystem.basket.viewSellBasket(targetPlayerId);
                        } else {
                            ShopSystem.basket.viewBasket(targetPlayerId);
                        }
                        break;
                    case "haggle_roll":
                        const hagglePlayerId = args[2]; // Note: This assumes playerID might differ if GM triggers
                        const haggleSkill = args[3];
                        const advantageState = args[4];
                        const haggleDC = args[5];
                        ShopSystem.basket.handleHaggleRoll(hagglePlayerId, haggleSkill, advantageState, haggleDC);
                        break;
                    case "haggle_manual":
                        // Format: !shop basket haggle_manual [playerId] [SkillType] [DC] [RollResult]
                        const manualPlayerId = args[2];
                        const manualSkill = args[3];
                        const manualDC = parseInt(args[4]);
                        const manualRoll = parseInt(args[5]);
                        if (!manualPlayerId || !manualSkill || isNaN(manualDC) || isNaN(manualRoll)) {
                            ShopSystem.utils.sendGMMessage("❌ Missing or invalid parameters for haggle_manual command.");
                            break;
                        }
                        // Reconstruct pending state if needed
                        if (!state.ShopSystem.pendingHaggleRolls) state.ShopSystem.pendingHaggleRolls = {};
                        if (!state.ShopSystem.pendingHaggleRolls[manualPlayerId]) {
                            const haggleState = state.ShopSystem.haggleResults?.[manualPlayerId];
                            if (haggleState) {
                                state.ShopSystem.pendingHaggleRolls[manualPlayerId] = {
                                    skillType: manualSkill,
                                    dc: manualDC,
                                    advantage: 'manual',
                                    haggleType: haggleState.tempHaggleType,
                                    originalBuyBasketPriceCopper: haggleState.originalBuyBasketPriceCopper,
                                    originalSellBasketPriceCopper: haggleState.originalSellBasketPriceCopper
                                };
                            } else {
                                ShopSystem.utils.sendGMMessage(`❌ No haggle state found for player ${manualPlayerId}. Cannot process manual roll.`);
                                break;
                            }
                        }
                        // Call handleHaggleRollResult with the manual roll value
                        ShopSystem.basket.handleHaggleRollResult(manualRoll, manualPlayerId, manualRoll === 1, manualRoll === 20);
                        break;
                     case "haggle_accept":
                        const acceptPlayerId = args[2]; // Note: Assumes playerID might differ
                        const acceptSkill = args[3];
                        const acceptDC = args[4];
                        ShopSystem.basket.handleHaggleAccept(acceptPlayerId, acceptSkill, acceptDC);
                        break;
                    case "haggle_deny":
                        const denyPlayerId = args[2]; // Note: Assumes playerID might differ
                        ShopSystem.basket.handleHaggleDeny(denyPlayerId);
                        break;
                    case "haggle_block": // Valid Command or (DE)?
                        if (!ShopSystem.utils.isGM(msg)) return;
                        var shop = ShopSystem.state.activeShop;
                        if (shop?.haggle) {
                            shop.haggle.remaining_attempts = 0;
                            ShopSystem.utils.sendGMMessage(`🚫 Haggling is now blocked for ${shop.name}.`);
                            // Update the handout's gmnotes
                            const shopHandout = getObj("handout", shop.id);
                            if (shopHandout) {
                                shopHandout.set("gmnotes", JSON.stringify(shop));
                            }
                            for (const playerId in state.ShopSystem.playerBaskets) {
                                ShopSystem.basket.viewBasket(playerId);
                            }
                        }
                        break;
                    // [TAG: HAGGLE_APPLY_ROUTING] Updated routing for apply command
                    case "haggle_apply":
                         // Expecting: !shop basket haggle_apply [playerId] [buyAdjustmentCopper] [sellAdjustmentCopper]
                         const applyPlayerId = args[2];
                         const buyAdjustmentCopperStr = args[3]; // Now the 4th argument (index 3)
                         const sellAdjustmentCopperStr = args[4]; // Now the 5th argument (index 4)

                         if (!applyPlayerId || buyAdjustmentCopperStr === undefined || sellAdjustmentCopperStr === undefined) {
                             ShopSystem.utils.sendGMMessage("❌ Missing parameters for haggle_apply command.");
                             break;
                         }
                         // Pass both adjustment strings to the handler function
                        ShopSystem.basket.handleHaggleApply(applyPlayerId, buyAdjustmentCopperStr, sellAdjustmentCopperStr);
                        break;
                    default:
                        // Default action is to view basket if subcommand is unrecognized or missing
                        ShopSystem.basket.viewBasket(playerID);
                        break;
                }
                break;
            case "sell":
                const sellAction = args[1]?.toLowerCase();
                
                switch (sellAction) {
                    case "from":
                        if (args.length < 3) {
                            ShopSystem.utils.chat("❌ Character ID required for selling", playerID);
                            break;
                        }
                        const sellCharId = args[2];
                        this.SELL_LOG_DisplayInventory(playerID, sellCharId);
                        break;
                    case "item":
                        if (args.length < 3) {
                            ShopSystem.utils.chat("❌ Item ID required", playerID);
                            break;
                        }
                        const itemPath = args[2];
                        const sellQty = parseInt(args[3] || "1");
                        ShopSystem.basket.addToSellBasket(playerID, itemPath, sellQty);
                        break;
                    case "remove":
                        if (args.length < 3) {
                            ShopSystem.utils.chat("❌ Item index required", playerID);
                            break;
                        }
                        const removeIndex = parseInt(args[2]);
                        ShopSystem.basket.removeFromSellBasket(playerID, removeIndex);
                        break;
                    case "view":
                        ShopSystem.basket.viewSellBasket(playerID);
                        break;
                    case "clear":
                        ShopSystem.basket.clearSellBasket(playerID);
                        break;
                    case "checkout":
                        ShopSystem.basket.checkoutSell(playerID);
                        break;
                    case "confirm":
                        if (args.length < 3) {
                            ShopSystem.utils.chat("❌ Character ID required for confirming sale", playerID);
                            break;
                        }
                        const confirmCharId = args[2];
                        ShopSystem.basket.completeSell(playerID, confirmCharId);
                        break;
                    default:
                        // No parameter, start the selling process
                        this.SELL_LOG_StartSellProcess(playerID);
                        break;
                }
                break;

            default:
                // If a shop is already open, or if this is the default !shop command, show the menu
                if (command === "" || ShopSystem.state.activeShop) {
                    const messageFromGM = msg && msg.who && msg.who.indexOf('(GM)') !== -1;
                    ShopSystem.utils.log(`Default handler GM check: messageFromGM=${messageFromGM}, who="${msg?.who}"`, "info");
                    
                    if (messageFromGM) {
                        // GM gets the GM view
                        this.SHPDIS_MD_ShowShopMenu(ShopSystem.state.activeShop?.name || "Unknown", msg.playerid, msg, false);
                    } else {
                        // Players get player view
                        this.SHPDIS_MD_ShowShopMenu(ShopSystem.state.activeShop?.name || "Unknown", msg.playerid, msg, false);
                    }
                } else {
                    ShopSystem.utils.chat(`❌ Unknown shop command: ${command}. Use !shop help for available commands.`, playerID);
                }
                break;
        }
    },

    // [TAG: SHOP_11_find_shop_handouts] // Direct copy
    HAND_LOG_FindShopHandout: function() {
        const handouts = findObjs({
            _type: "handout"
        }).filter(handout => 
            handout.get("name").indexOf(CONFIG.HANDOUT.SHOP_PREFIX) === 0
        );

        return handouts;
    },

    // [TAG: SHOP_12_create_shop_handout] // Direct copy
    GEN_LOG_CreateShopHandout: function(name, shopData) {
        if (!name) {
            ShopSystem.utils.chat("❌ Shop name is required");
            return null;
        }

        // Clean the shop name
        const cleanName = name.trim();
        const shopName = `${CONFIG.HANDOUT.SHOP_PREFIX}${cleanName}`;

        // Check if shop already exists
        const existingShop = findObjs({
            _type: "handout",
            name: shopName
        })[0];

        if (existingShop) {
            ShopSystem.utils.chat(`❌ Shop "${cleanName}" already exists`);
            return existingShop;
        }

        // Create new handout (hidden from players)
        const newShop = createObj("handout", {
            name: shopName
            // No inplayerjournals field means only GM can see it
        });

        if (newShop) {
            // Ensure the shop data has the correct name
            shopData.name = cleanName;
            
            // Add the shop type marker to GM notes along with shop data
            const gmNotes = JSON.stringify({
                type: 'shop',
                ...shopData
            });
            newShop.set("gmnotes", gmNotes);
            ShopSystem.utils.log(`Created new shop: ${cleanName}`, "success");
            ShopSystem.utils.chat(`✅ Shop "${cleanName}" created!`);
            return newShop;
        }
        return null;
    },

    // [TAG: SHOP_SAMPLE]
    GEN_LOG_CreateSampleShop: function() {
        const shopName = "Sample Shop";
        
        // Set default values from config
        const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
        
        // Create initial shop data structure with a bit more flavor than defaults
        const initialShopData = {
            type: 'shop',
            name: shopName,
            merchant_name: "Gwendolyn the Merchant",
            shop_type: "General Store",
            location: "Town Square",
            merchant_type: "Friendly",
            description: "A cozy shop with a variety of wares.",
            welcome_message: "Welcome to my shop! I have all sorts of goods for adventurers.",
            merchant_description: "Gwendolyn smiles warmly as you browse her selection of goods.",
            price_modifiers: {
                buy: 1.0,
                sell: 0.5
            },
            haggle: {
                max_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                remaining_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
            },
            special_event: {
                type: "Bulk Discount",
                details: "Buy 3 items, get the cheapest free!"
            },
            inventory: {
                weapons: [],
                "Armor & Attire": [],
                potions: [],
                scrolls: [],
                magic: [],
                equipment: [],
                "Mounts & Vehicles": [],
                Services: []
            }
        };
        
        const shop = this.GEN_LOG_CreateShopHandout(shopName, initialShopData);
        
        if (!shop) return;

        // Add sample items to inventory if we have them in database
        ShopSystem.database.listItems('weapons', 'common').then(items => {
            if (items && items.length > 0) {
                // We found items, so add some to the shop
                shop.get("gmnotes", (notes) => {
                    try {
                        const shopData = JSON.parse(ShopSystem.utils.cleanHandoutNotes(notes));
                        
                        // Add a sample item from each available category
                        const addSampleItems = async () => {
                            // Try to add weapon
                            const weapons = await ShopSystem.database.listItems('weapons', 'common');
                            if (weapons.length > 0) {
                                shopData.inventory.weapons.push({
                                    id: weapons[0].id,
                                    name: weapons[0].name,
                                    quantity: 2,
                                    maxStock: 2, // Added maxStock
                                    price: weapons[0].price
                                });
                            }
                            
                            // Try to add potion
                            const potions = await ShopSystem.database.listItems('potions', 'common');
                            if (potions.length > 0) {
                                shopData.inventory.potions.push({
                                    id: potions[0].id,
                                    name: potions[0].name,
                                    quantity: 3,
                                    maxStock: 3, // Added maxStock
                                    price: potions[0].price
                                });
                            }
                            
                            // Try to add armor
                            const armorItems = await ShopSystem.database.listItems('Armor & Attire', 'common');
                            if (armorItems.length > 0) {
                                shopData.inventory["Armor & Attire"].push({
                                    id: armorItems[0].id,
                                    name: armorItems[0].name,
                                    quantity: 1,
                                    maxStock: 1, // Added maxStock
                                    price: armorItems[0].price
                                });
                            }
                            
                            // Save the shop data
                            shop.set("gmnotes", JSON.stringify(shopData, null, 2));
                            ShopSystem.utils.chat(`✅ Sample shop "${shopName}" created with stock!`);
                            
                            // Show the shop list after creating the sample shop
                            this.SHPDIS_MD_ShowShopList();
                        };
                        
                        addSampleItems();
                    } catch (error) {
                        ShopSystem.utils.log(`Error adding stock to sample shop: ${error.message}`, "error");
                    }
                });
            } else {
                // No items in database, create shop without items
                ShopSystem.utils.chat(`✅ Sample shop "${shopName}" created! No items found in database to add as stock.`);
                
                // Show the shop list
                this.SHPDIS_MD_ShowShopList();
            }
        }).catch(error => {
            ShopSystem.utils.log(`Error checking database: ${error.message}`, "error");
            ShopSystem.utils.chat(`✅ Sample shop "${shopName}" created! (Error checking database for stock items)`);
            
            // Show the shop list
            this.SHPDIS_MD_ShowShopList();
        });
    },

    // [TAG: SHOP_13_show_shop_list]
    SHPDIS_MD_ShowShopList: function(playerID) {
        const shops = this.HAND_LOG_FindShopHandout();

        // Format as a menu
        const menu = [
            "&{template:default}",
            "{{name=🏪 Available Shops}}"
        ];

        // Add shops section
        if (shops.length === 0) {
            menu.push("{{No Shops Found=No shops are currently available. Create one using the commands below.}}");
        } else {
            menu.push("{{Shops=");
            shops.forEach((shop, index) => {
                const shopName = shop.get("name").replace(CONFIG.HANDOUT.SHOP_PREFIX, "");
                menu.push(`[${index + 1}. ${shopName}](!shop open ${shopName})<br>`);
            });
            menu.push("}}");
        }

        // Generate dropdown options for shop creation
        const shopTypeOptions = CONFIG.SHOP_SETTINGS.SHOP_TYPES.map(type => `${type}`).join('|');
        const locationOptions = CONFIG.SHOP_SETTINGS.LOCATIONS.map(loc => `${loc.name}`).join('|');
        const merchantTypeOptions = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.map(type => `${type.name}`).join('|');
        const specialEventOptions = CONFIG.SHOP_SETTINGS.SPECIAL_EVENTS.map(event => `${event.name}`).join('|');
        
        // Default values
        const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;

        // Always show command buttons regardless of whether shops exist
        menu.push("{{Create New Shop=");
        menu.push(`[➕ Basic Shop](!shop create ?{Shop Name|New Shop}|?{Merchant Name|${defaults.MERCHANT_NAME}}|?{Shop Type|${shopTypeOptions}}) `);
        menu.push("}}");
        
        menu.push("{{Advanced Shop=");
        // Advanced shop creation with all options
        menu.push(`[🔧 Advanced Setup](!shop create_advanced ?{Shop Name|New Shop})`);
        menu.push("}}");
        
        menu.push("{{Quick Setup=");
        menu.push(`[🛒 Sample Shop](!shop sample) `);
        menu.push(`[📚 Item Database](!itemdb init) [📋 List Items](!itemdb list all all)`);
        menu.push("}}");
        
        menu.push("{{Help=");
        menu.push(`[❓ Shop Commands](!shop help) `);
        menu.push(`[❓ Database Commands](!itemdb help)`);
        menu.push("}}");

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: SHOP_HELP]
    SHPDIS_MD_ShowShopHelp: function(playerID, isGM = false) {
        if (isGM) {
            // [TAG: CD_SHOP_HELP_GM_VIEW]
            const menu = [
                "&{template:default}",
                "{{name=🏪 Shop Help (GM)}}",
                "{{About=The Shop System allows you to create and manage shops. Use the commands below to interact.}}",
                "{{Basic Commands=• !shop list - Show all available shops\n• !shop open [name] - Open a shop menu\n• !shop browse [category] - Browse items in a category (weapons, 'Armor & Attire', potions, scrolls, magic, equipment, 'Mounts & Vehicles', Services)\n• !shop sample - Create a sample shop with stock}}",
                "{{Advanced Setup=• !shop create_advanced [name] - Start interactive setup\n• !shop adv_setup [name] [param] [value] - Set a specific parameter\n• !shop adv_complete [name] - Complete the advanced setup}}",
                "{{Special Events=• Bulk Discount - Buy X get Y free\n• Category Sale - Discount on a category\n• Limited Time Sale - Temporary price reduction\n• Loyalty Program - Return customer benefits}}",
                "{{Shop Management=• !shop edit [name] - Edit shop details\n• !shop stock [name] - Manage inventory\n• !shop random [name] - Generate random stock}}",
                "{{Navigation=[❓ Item Database Help](!itemdb help) [🏪 Shop List](!shop list)}}"
            ].join(" ");
            ShopSystem.utils.chat(menu, playerID);
            return;
        }
        // [TAG: CD_SHOP_HELP_PLAYER_VIEW]
        const menu = [
            "&{template:default}",
            "{{name=🏪 Shop Help (Player)}}",
            "{{About=Browse, buy, and sell items in shops. Use the menu or commands below.}}",
            "{{How to Buy=Browse categories, add items to your basket, then checkout. You'll get a receipt after purchase.}}",
            "{{How to Sell=Click 'Sell Items', select your character and items, and confirm the sale.}}",
            "{{Events=Watch for special events like discounts or loyalty rewards, shown in the shop menu.}}",
            "{{Haggling=At checkout, you may try to haggle using skills like Persuasion or Deception. Success can lower your price!}}",
            "{{Menu Buttons=• 🧺 View Basket: See your selected items\n• 💰 Sell Items: Sell from your inventory\n• ❓ Help: Show this menu}}",
            "{{Receipts=After buying or selling, you'll get a receipt in chat listing all items and totals.}}",
            "{{Troubleshooting=If you see an error, contact your GM or try again later.}}",
            "{{Quick Commands=• !shop browse [category]\n• !shop basket view\n• !shop help}}",
            "{{Navigation=[🏪 Back to Shop](!shop)}}"
        ].join(" ");
        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: CD_SHOP_14_show_shop_menu]
    SHPDIS_MD_ShowShopMenu: function(shopName, playerID, msg, forcePublicDisplay = false) {
        // Check for character selection first (unless it's the GM and they're not forcing public display)
        const isCallerGM = msg && ShopSystem.utils.isGM(msg);
        if (!isCallerGM && !state.ShopSystem.activeCharacters[playerID]) {
            this.SHPDIS_MD_ShowCharacterSelect(playerID, `open ${shopName}`);
            return;
        }

        const fullShopName = `${CONFIG.HANDOUT.SHOP_PREFIX}${shopName}`;
        const shopHandout = findObjs({
            _type: "handout",
            name: fullShopName
        })[0];

        if (!shopHandout) {
            ShopSystem.utils.chat(`❌ Shop "${shopName}" not found`, playerID);
            return;
        }

        // Log detailed message info to help debug
        if (msg) {
            ShopSystem.utils.log(`Message details: who="${msg.who}", playerid=${msg.playerid}`, "info");
        }

        shopHandout.get("gmnotes", (notes) => {
            try {
                const shopData = JSON.parse(ShopSystem.utils.cleanHandoutNotes(notes));
                
                if (!shopData || shopData.type !== "shop") {
                    ShopSystem.utils.chat(`❌ Invalid shop data for "${shopName}"`, playerID);
                    return;
                }

                // Set as active shop
                ShopSystem.state.activeShop = shopData;
                ShopSystem.state.activeShop.id = shopHandout.id;

                // Determine if the command was issued by a GM
                const isCallerGM = msg && ShopSystem.utils.isGM(msg); // Pass the full msg object
                
                // Determine target audience and menu type
                let targetIsPublic = forcePublicDisplay && isCallerGM;
                let showGMView = isCallerGM && !forcePublicDisplay;
                
                ShopSystem.utils.log(`ShowShopMenu: CallerGM=${isCallerGM}, ForcePublic=${forcePublicDisplay}, TargetPublic=${targetIsPublic}, ShowGMView=${showGMView}`, "info");

                // Construct Player Menu (Needed for both player view and public display)
                const playerMenu = [
                    "&{template:default}",
                    `{{name=🏪 ${shopData.name} (Player View)}}`,
                    `{{Merchant=${shopData.merchant_name || "Unknown"}}}`,
                    shopData.description ? `{{Description=${shopData.description}}}` : "",
                    shopData.merchant_description ? `{{Merchant Description=${shopData.merchant_description}}}` : "",
                    shopData.welcome_message ? `{{Welcome=${shopData.welcome_message}}}` : "",
                    shopData.special_event?.type !== "None" ? `{{Special Event=${shopData.special_event.type}: ${shopData.special_event.details}}}` : "",
                    "{{Categories=",
                    `[📦 All Items](!shop browse all)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.weapons} Weapons](!shop browse weapons)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI["Armor & Attire"]} Armor & Attire](!shop browse Armor & Attire)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.potions} Potions](!shop browse potions)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.scrolls} Scrolls](!shop browse scrolls)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.magic} Magic Items](!shop browse magic)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.equipment} Equipment](!shop browse equipment)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI["Mounts & Vehicles"]} Mounts & Vehicles](!shop browse Mounts & Vehicles)`,
                    `[${CONFIG.DISPLAY.CATEGORY.EMOJI.Services} Services](!shop browse Services)`,
                    "}}",
                    "{{Actions=",
                    "[🧺 View Basket](!shop basket view) ",
                    "[💰 Sell Items](!shop sell) ",
                    "[👤 Switch Character](!shop switch_character) ",  // Add this line
                    ((ShopSystem.basket?.basketState?.canMergeBaskets && typeof ShopSystem.basket.basketState.canMergeBaskets === 'function') ? 
                        (ShopSystem.basket.basketState.canMergeBaskets(playerID || '') ? "[🔄 Merge Baskets](!shop basket merge) " : "") 
                        : ""),
                    "}}",
                    "{{Navigation=[❓ Help](!shop help)",
                    "}}"
                ].filter(line => line !== "").join(" ");

                if (targetIsPublic) {
                     ShopSystem.utils.log(`Displaying Shop Publicly: ${shopName}`, "info");
                     sendChat("ShopSystem", playerMenu);
                     // Confirmation to GM removed, public display is sufficient
                 } else if (showGMView) {
                    ShopSystem.utils.log(`Showing GM View for shop "${shopName}"`, "info");
                    // GM View
                    const menu = [
                        "&{template:default}",
                        `{{name=🏪 ${shopData.name} (GM View)}}`,
                        `{{Merchant=${shopData.merchant_name || "Unknown"}}}`,
                        shopData.description ? `{{Description=${shopData.description}}}` : "",
                        shopData.welcome_message ? `{{Welcome=${shopData.welcome_message}}}` : "",
                        shopData.merchant_description ? `{{Merchant Description=${shopData.merchant_description}}}` : "",
                        shopData.location ? `{{Location=${shopData.location}}}` : "",
                        shopData.shop_type ? `{{Type=${shopData.shop_type}}}` : "",
                        `{{Merchant Type=${shopData.merchant_type}}}`,
                        // Show Haggle Attempts if available
                        (shopData.haggle && typeof shopData.haggle.remaining_attempts !== 'undefined'
                            ? `{{Haggle Attempts=${shopData.haggle.remaining_attempts}${typeof shopData.haggle.max_attempts !== 'undefined' ? ' / ' + shopData.haggle.max_attempts : ''}}}`
                            : ""),
                        `{{Price Modifiers=Buy: ${shopData.price_modifiers?.buy || 1.0}x | Sell: ${shopData.price_modifiers?.sell || 0.5}x}}`,
                        shopData.special_event?.type !== "None" ? `{{Special Event=${shopData.special_event.type}: ${shopData.special_event.details}}}` : "",
                        `{{Inventory Overview=\n${this.STAT_LOG_FormatInventoryView(shopData)}}}`,
                        "{{Shop Management=",
                        "[📋 Stock Management](!shop stock manage) ",
                        "[✏️ Update Info](!shop update_info) ",
                        "[🔄 Reset Haggles](!shop haggle_reset) ",
                        "[🎲 Random Stock](!shop stock random) ",
                        "[👥 Display to Players](!shop display_to_players)",
                        "}}",
                        "{{Navigation=",
                        "[📜 Shop List](!shop list) ",
                        "[❓ Help](!shop help)",
                        "}}"
                    ].filter(line => line !== "").join(" ");

                    ShopSystem.utils.chat(menu, playerID); // Whisper GM menu to the GM
                } else {
                    ShopSystem.utils.log(`Showing Player View for shop "${shopName}"`, "info");
                    // Whisper Player menu to the Player
                    ShopSystem.utils.chat(playerMenu, playerID);
                }
            } catch (error) {
                ShopSystem.utils.log(`Error parsing shop data: ${error.message}`, "error");
                ShopSystem.utils.chat(`❌ Error loading shop "${shopName}"`, playerID);
            }
        });
    },

    /**
     * Show advanced shop setup menu for both creating new shops and updating existing ones
     * @param {string} shopName - The name of the shop to setup or update
     * @param {string} playerID - The player ID of the user
     * @param {boolean} isUpdate - Whether this is an update to an existing shop
     */

    // [TAG: SHOP_CHARACTER_SELECTION]
    SHPDIS_MD_ShowCharacterSelect: function(playerID, showToAll = false) {
        ShopSystem.utils.log(`SHPDIS_MD_ShowCharacterSelect called for playerID: ${playerID}, showToAll: ${showToAll}`, 'debug');

        const processPlayer = (pId, pName) => {
            let characters = findObjs({ _type: 'character' }).filter(char => {
                const controlledBy = char.get('controlledby');
                return controlledBy && (controlledBy === 'all' || controlledBy.split(',').includes(pId));
            });

            if (!characters.length) {
                ShopSystem.utils.chat("❌ No characters available to select.", pId);
                return;
            }

            let characterEntries = []; // Store each character's full entry
            let charactersProcessed = 0;
            const totalCharacters = characters.length;

            if (totalCharacters === 0) { // Should be caught by !characters.length but as a safeguard
                let finalMenu = `&{template:default} {{name=Select Character}} {{Info=No characters for ${pName}}}`;
                ShopSystem.utils.chat(finalMenu, pId);
                return;
            }

            characters.forEach(char => {
                const charId = char.get('_id');
                const charName = char.get('name') || 'Unnamed Character';

                ShopSystem.utils.getCharacterTokenImgTagAsync(charId, charName, 'width: 25px; height: 25px; vertical-align: middle; margin-right: 5px; border-radius: 3px;', (imgTag) => {
                    // Create a new template field for each character, combining image, name, and button
                    characterEntries.push(`{{${charName}=${imgTag} [Select](!shop select_character ${charId})}}`);
                    charactersProcessed++;
                    if (charactersProcessed === totalCharacters) {
                        let finalMenu = `&{template:default} {{name=Select Character}}` + characterEntries.join('');
                        ShopSystem.utils.chat(finalMenu, pId);
                    }
                });
            });
        };

        if (showToAll) {
            let players = findObjs({ _type: 'player' });
            players.forEach(player => {
                processPlayer(player.get('_id'), player.get('_displayname'));
            });
        } else {
            const player = getObj('player', playerID);
            if (player) {
                processPlayer(playerID, player.get('_displayname'));
            } else {
                ShopSystem.utils.log(`Player not found for ID: ${playerID} in SHPDIS_MD_ShowCharacterSelect`, 'error');
            }
        }
    },

    // [TAG: CD_ADVANCED_SETUP_MENU] // New feature
    SHPDIS_MD_ShowSetupMenu: function(shopName, playerID, isUpdate = false) {
        // Debug logging
        ShopSystem.utils.log(`SHPDIS_MD_ShowSetupMenu called: shopName=${shopName}, isUpdate=${isUpdate}`, "info");
        
        // Initialize pendingAdvancedSetup if necessary
        if (!state.ShopSystem.pendingAdvancedSetup) {
            state.ShopSystem.pendingAdvancedSetup = {};
        }
        
        // Get reference to config values
        const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
        const shopTypes = CONFIG.SHOP_SETTINGS.SHOP_TYPES;
        const locations = CONFIG.SHOP_SETTINGS.LOCATIONS;
        const merchantTypes = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES;
        const specialEvents = CONFIG.SHOP_SETTINGS.SPECIAL_EVENTS;
        
        // Only initialize from activeShop if we are updating AND the pending setup doesn't exist yet
        if (isUpdate && ShopSystem.state.activeShop && !state.ShopSystem.pendingAdvancedSetup[shopName]) {
            const activeShop = ShopSystem.state.activeShop;
            ShopSystem.utils.log(`Initializing pending setup from active shop: ${JSON.stringify(activeShop, null, 2)}`, "info");
            
            // Extract special event type and details
            let eventType = "None";
            let eventDetails = "None";
            if (activeShop.special_event) {
                eventType = activeShop.special_event.type || "None";
                eventDetails = activeShop.special_event.details || "None";
            }
            
            // Initialize with current values from the active shop
            state.ShopSystem.pendingAdvancedSetup[shopName] = {
            name: shopName,
                merchant_name: activeShop.merchant_name || defaults.MERCHANT_NAME,
                shop_type: activeShop.shop_type || defaults.SHOP_TYPE,
                location: activeShop.location || defaults.LOCATION,
                merchant_type: activeShop.merchant_type || defaults.MERCHANT_TYPE,
                buy_modifier: activeShop.price_modifiers?.buy || defaults.BUY_MODIFIER,
                sell_modifier: activeShop.price_modifiers?.sell || defaults.SELL_MODIFIER,
                description: activeShop.description || defaults.DESCRIPTION,
                welcome_message: activeShop.welcome_message || defaults.WELCOME_MESSAGE,
                merchant_description: activeShop.merchant_description || defaults.MERCHANT_DESCRIPTION,
                special_event: eventType,
                special_event_details: eventDetails,
                handoutId: activeShop.id
            };
            
            ShopSystem.utils.log(`Initialized pendingSetup from active shop: ${JSON.stringify(state.ShopSystem.pendingAdvancedSetup[shopName], null, 2)}`, "info");
        } 
        // For new shops or if not initialized yet
        else if (!state.ShopSystem.pendingAdvancedSetup[shopName]) {
            // Initialize with defaults
            state.ShopSystem.pendingAdvancedSetup[shopName] = {
                name: shopName,
                merchant_name: defaults.MERCHANT_NAME,
                shop_type: defaults.SHOP_TYPE,
                location: defaults.LOCATION,
                merchant_type: defaults.MERCHANT_TYPE,
                buy_modifier: defaults.BUY_MODIFIER,
                sell_modifier: defaults.SELL_MODIFIER,
                description: defaults.DESCRIPTION,
                welcome_message: defaults.WELCOME_MESSAGE,
                merchant_description: defaults.MERCHANT_DESCRIPTION,
                special_event: "None",
                special_event_details: "None"
            };
        }
        
        // Get current settings from the pending state
        const current = state.ShopSystem.pendingAdvancedSetup[shopName];
        
        // Log current data
        ShopSystem.utils.log(`Current shop setup data: ${JSON.stringify(current, null, 2)}`, "info");
        
        // [TAG: CD_SHOP_NAME_ENCODE]
        // Create encoded shopName for passing to commands
        const encodedName = shopName.replace(/ /g, "_SPACE_");
        
        // Extract the merchant type name for display
        let currentMerchantType = current.merchant_type;
        
        // Build Shop Type prompt options: current first, then the rest (no duplicates)
        const shopTypeOptions = [
            current.shop_type,
            ...shopTypes.filter(type => type !== current.shop_type)
        ].join('|');
        
        // Build Location prompt options: current first, then the rest (no duplicates)
        const locationNames = locations.map(loc => typeof loc === 'string' ? loc : (loc.name || ''));
        const locationOptions = [
            current.location,
            ...locationNames.filter(name => name !== current.location)
        ].join('|');
        
        // Remove duplicate merchant personality options
        const uniqueMerchantTypes = [...new Set(merchantTypes.map(type => typeof type === 'string' ? type : (type.name || '')))];
        const merchantTypeOptions = [
            current.merchant_type,
            ...uniqueMerchantTypes.filter(name => name !== current.merchant_type)
        ].join('|');
        
        const specialEventOptions = specialEvents.map(event => {
            const name = typeof event === 'string' ? event : (event.name || '');
            return name === current.special_event ? `${name}|${name}` : name;
        }).join('|');
        
        // Format advanced setup menu with all parameters on separate lines
        const lines = [
            "&{template:default}",
            `{{name=🔧 ${isUpdate ? 'Update Shop: ' : 'Advanced Shop Setup: '}${shopName}}}`,
            "{{Basic Info=",
            `• Merchant Name: [Set](!shop set_merchant ${encodedName} ?{Merchant Name|${current.merchant_name}})`,
            `<br>• Shop Type: [Set](!shop set_type ${encodedName} ?{Shop Type|${shopTypeOptions}})`,
            `<br>• Location: [Set](!shop set_location ${encodedName} ?{Location|${locationOptions}})`,
            `<br>• Haggle Attempts: [Set](!shop set_haggle_attempts ${encodedName} ?{Max Haggle Attempts|${current.haggle?.max_attempts ?? CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS}})`,
            "}}",
            "{{Merchant Details=",
            `• Personality: [Set](!shop set_personality ${encodedName} ?{Merchant Personality|${merchantTypeOptions}})`,
            `<br>• Description: [Set](!shop set_merchant_desc ${encodedName} ?{Merchant Description|${current.merchant_description}})`,
            `<br>• Welcome Msg: [Set](!shop set_welcome ${encodedName} ?{Welcome Message|${current.welcome_message}})`,
            "}}",
            "{{Pricing=",
            `• Buy Modifier: [Set](!shop set_buy_mod ${encodedName} ?{Buy Modifier|${current.buy_modifier}})`,
            `<br>• Sell Modifier: [Set](!shop set_sell_mod ${encodedName} ?{Sell Modifier|${current.sell_modifier}})`,
            "}}",
            "{{Special Events=",
            `• Event Type: [Set](!shop set_event ${encodedName} ?{Special Event|${specialEventOptions}})`,
            `<br>• Event Details: [Set](!shop set_event_details ${encodedName} ?{Event Details|${current.special_event_details}})`,
            "}}",
            "{{Shop Description=",
            `[Set Description](!shop set_description ${encodedName} ?{Shop Description|${current.description}})`,
            "}}",
            "{{Actions=",
            isUpdate ? 
                `[✅ Save Changes](!shop update_complete ${encodedName})` :
            `[✅ Complete Setup](!shop finish_setup ${encodedName})`,
            `<br>[🔙 ${isUpdate ? 'Cancel' : 'Back to Shop List'}](!shop ${isUpdate ? '' : 'list'})`,
            "}}"
        ];
        
        // Join with spaces for Roll20 template format
        const menu = lines.join(" ");
        
        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: CD_SHOP_02_ADVANCED_SETUP_PARAMS]
    SET_LOG_HandleSetup: function(shopName, param, value, playerID) {
        // [TAG: CD_SHOP_NAME_DECODE] // New sub-feature
        const decodedName = shopName.replace(/_SPACE_/g, " ");
        
        // Debug logging
        ShopSystem.utils.log(`SET_LOG_HandleSetup: shop=${decodedName}, param=${param}, value=${value}`, "info");
        
        // Store the parameter in the state temporarily
        if (!state.ShopSystem.pendingAdvancedSetup) {
            state.ShopSystem.pendingAdvancedSetup = {};
        }
        
        // Get defaults for fallbacks
        const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
        
        if (!state.ShopSystem.pendingAdvancedSetup[decodedName]) {
            // Initialize with defaults
            state.ShopSystem.pendingAdvancedSetup[decodedName] = {
                name: decodedName,
                merchant_name: defaults.MERCHANT_NAME,
                shop_type: defaults.SHOP_TYPE,
                location: defaults.LOCATION,
                merchant_type: defaults.MERCHANT_TYPE,
                buy_modifier: defaults.BUY_MODIFIER,
                sell_modifier: defaults.SELL_MODIFIER,
                description: defaults.DESCRIPTION,
                welcome_message: defaults.WELCOME_MESSAGE,
                merchant_description: defaults.MERCHANT_DESCRIPTION,
                special_event: "None",
                special_event_details: "None"
            };
            
            // If updating an existing shop, mark this as an update
            if (ShopSystem.state.activeShop && ShopSystem.state.activeShop.name === decodedName) {
                state.ShopSystem.pendingAdvancedSetup[decodedName].handoutId = ShopSystem.state.activeShop.id;
            }
        }
        
        // Get the previous value for comparison
        const pending = state.ShopSystem.pendingAdvancedSetup[decodedName];
        const oldValue = pending[param === 'personality' ? 'merchant_type' : param];
        
        // Update the parameter
        switch(param) {
            case "merchant":
                pending.merchant_name = value || defaults.MERCHANT_NAME;
                break;
            case "type":
                pending.shop_type = value || defaults.SHOP_TYPE;
                break;
            case "location":
                pending.location = value || defaults.LOCATION;
                break;
            case "personality":
                // Store personality in merchant_type property
                pending.merchant_type = value || defaults.MERCHANT_TYPE;
                ShopSystem.utils.log(`Updating merchant_type from "${oldValue}" to "${value}"`, "info");
                break;
            case "merchant_desc":
                pending.merchant_description = value || defaults.MERCHANT_DESCRIPTION;
                break;
            case "welcome":
                pending.welcome_message = value || defaults.WELCOME_MESSAGE;
                break;
            case "buy_mod":
                pending.buy_modifier = parseFloat(value) || defaults.BUY_MODIFIER;
                break;
            case "sell_mod":
                pending.sell_modifier = parseFloat(value) || defaults.SELL_MODIFIER;
                break;
            case "event":
                pending.special_event = value || "None";
                break;
            case "event_details":
                pending.special_event_details = value || "None";
                break;
            case "description":
                pending.description = value || defaults.DESCRIPTION;
                break;
            case "haggle_attempts":
                // Update max_attempts and reset remaining_attempts
                if (!pending.haggle) {
                    pending.haggle = {
                        max_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                        remaining_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                    };
                }
                pending.haggle.max_attempts = parseInt(value) || CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS;
                pending.haggle.remaining_attempts = pending.haggle.max_attempts;
                break;
            default:
                ShopSystem.utils.chat(`⚠️ Unknown parameter: ${param}`, playerID);
                break;
        }
        
        // Get the updated parameter for logging
        const updatedParamName = param === 'personality' ? 'merchant_type' : param;
        const updatedValue = pending[updatedParamName];
        
        // Log the parameter update
        ShopSystem.utils.log(`Updated ${updatedParamName} from "${oldValue}" to "${updatedValue}"`, "info");
        
        // Show a confirmation message
        ShopSystem.utils.chat(`✅ Updated ${param} to: ${value}`, playerID);
        
        // Check if this is an update or a new shop
        const isUpdate = !!pending.handoutId;
        
        // Show the setup menu again
        this.SHPDIS_MD_ShowSetupMenu(decodedName, playerID, isUpdate);
    },
    
    // [TAG: CD_SHOP_04_ADVANCED_COMPLETE]
    SET_LOG_CompleteSetup: function(shopName, playerID, isUpdate = false) {
        // [TAG: CD_SHOP_06_INITIALIZE_SETUP]
        const defaults = CONFIG.SHOP_SETTINGS.DEFAULTS;
        const decodedName = shopName.replace(/_SPACE_/g, " ");
        
        if (!state.ShopSystem.pendingAdvancedSetup || !state.ShopSystem.pendingAdvancedSetup[decodedName]) {
            ShopSystem.utils.chat(`⚠️ No pending setup found for shop: ${decodedName}`, playerID);
            return;
        }
        
        const pendingSetup = state.ShopSystem.pendingAdvancedSetup[decodedName];
        
        // Debug log the pending setup
        ShopSystem.utils.log(`Completing advanced setup for ${decodedName}:`, "info");
        ShopSystem.utils.log(JSON.stringify(pendingSetup), "info");
        
        // Create a data object with defaults for all required fields
        const shopData = {
            type: 'shop',
                name: decodedName,
            merchant_name: pendingSetup.merchant_name || defaults.MERCHANT_NAME,
            shop_type: pendingSetup.shop_type || defaults.SHOP_TYPE,
            location: pendingSetup.location || defaults.LOCATION,
            merchant_type: pendingSetup.merchant_type || defaults.MERCHANT_TYPE,
            price_modifiers: {
                buy: parseFloat(pendingSetup.buy_modifier) || defaults.BUY_MODIFIER,
                sell: parseFloat(pendingSetup.sell_modifier) || defaults.SELL_MODIFIER
            },
            description: pendingSetup.description || defaults.DESCRIPTION,
            welcome_message: pendingSetup.welcome_message || defaults.WELCOME_MESSAGE,
            merchant_description: pendingSetup.merchant_description || defaults.MERCHANT_DESCRIPTION,
            special_event: {
                type: pendingSetup.special_event || "None",
                details: pendingSetup.special_event_details || "None"
            },
            haggle: pendingSetup.haggle || {
                max_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
                remaining_attempts: CONFIG.HAGGLE.DEFAULT_STORE_ATTEMPTS,
            }
        };
        
        // Log the shop data we're about to save
        ShopSystem.utils.log(`Shop data being saved: ${JSON.stringify(shopData, null, 2)}`, "info");
        
        try {
            // [TAG: CD_SHOP_07_CREATING_HANDOUT]
            let handoutId = pendingSetup.handoutId;
            
            if (isUpdate && handoutId) {
                // Update existing shop
                const shopHandout = getObj("handout", handoutId);
                
                if (shopHandout) {
                    // If updating, preserve the existing inventory
                    shopHandout.get("gmnotes", (notes) => {
                try {
                    const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes);
                            const existingData = JSON.parse(cleanNotes);
                            
                            // Keep the existing inventory
                            if (existingData && existingData.inventory) {
                                shopData.inventory = existingData.inventory;
                            } else {
                                // Initialize empty inventory
                                shopData.inventory = {
                                    weapons: [],
                                    "Armor & Attire": [],
                                    potions: [],
                                    scrolls: [],
                                    magic: [],
                                    equipment: [],
                                    "Mounts & Vehicles": [],
                                    Services: []
                                };
                            }
                            
                            // Log the final shop data with inventory
                            ShopSystem.utils.log(`Final shop data before saving: ${JSON.stringify(shopData, null, 2)}`, "info");
                            
                            // Save the updated shop data
                            shopHandout.set("gmnotes", JSON.stringify(shopData, null, 2));
                            
                            // Update active shop state if this is the active shop
                            if (ShopSystem.state.activeShop && ShopSystem.state.activeShop.id === handoutId) {
                                ShopSystem.state.activeShop = shopData;
                                ShopSystem.state.activeShop.id = handoutId;
                                ShopSystem.utils.log(`Updated active shop: ${decodedName}`, "info");
                            }
                            
                            // Refresh shops data
                            ShopSystem.utils.refreshShops();
                            
                            ShopSystem.utils.chat(`✅ Shop "${decodedName}" updated successfully!`, playerID);
                            
                            // Clean up the pending data
                            delete state.ShopSystem.pendingAdvancedSetup[decodedName];
                            
                            // Show the updated shop menu
                            this.SHPDIS_MD_ShowShopMenu(decodedName, playerID, {
                                who: getObj('player', playerID).get('_displayname') + " (GM)",
                                playerid: playerID
                            });
                        } catch (error) {
                            ShopSystem.utils.log(`Error updating shop: ${error.message}`, "error");
                            ShopSystem.utils.chat(`❌ Error updating shop: ${error.message}`, playerID);
                        }
                    });
                } else {
                    ShopSystem.utils.chat(`❌ Error: Shop handout not found for "${decodedName}"`, playerID);
                }
            } else {
                // Create a new shop with empty inventory
                shopData.inventory = {
                weapons: [],
                "Armor & Attire": [],
                potions: [],
                scrolls: [],
                magic: [],
                equipment: [],
                "Mounts & Vehicles": [],
                Services: []
        };
        
                // Create new shop
        const newShop = this.GEN_LOG_CreateShopHandout(decodedName, shopData);
        
        if (newShop) {
                    // Refresh shops data
                    ShopSystem.utils.refreshShops();
                    
                    ShopSystem.utils.chat(`✅ Shop "${decodedName}" created successfully!`, playerID);
            
            // Clean up the pending data
            delete state.ShopSystem.pendingAdvancedSetup[decodedName];
            
                    // Show shop list after creation
            this.SHPDIS_MD_ShowShopList(playerID);
                }
            }
        } catch (err) {
            // [TAG: CD_SHOP_08_ERROR_HANDLING]
            ShopSystem.utils.log(`Error in SET_LOG_CompleteSetup: ${err}`, "error");
            ShopSystem.utils.chat(`⚠️ Error creating/updating shop: ${err}`, playerID);
        }
    },

    // [TAG: CD_SHOP_STOCK_MANAGEMENT]
    STKMGM_MD_ShowStockManageMenu: function(playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;

        // Build category filter buttons
        // Define custom order for display
        const categoryOrder = ['weapons', 'Armor & Attire', 'equipment', 'magic', 'potions', 'scrolls', 'Mounts & Vehicles', 'Services'];
        let categoryButtons = categoryOrder.map(cat => {
            const emoji = categoryEmojis[cat] || "📦";
            return `[${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}](!shop stock filter_add ${cat} all)`; 
        }).join(" ");
        // Add 'All Categories' button
        categoryButtons += ` [📦 All Categories](!shop stock filter_add all all)`;

        // Build rarity filter buttons
        let rarityButtons = CONFIG.ITEM.RARITIES.map(rar => {
            const emoji = rarityEmojis[rar] || "⚪";
            // Special capitalization for "Very Rare"
            const rarityLabel = rar === 'very rare' ? 'Very Rare' : rar.charAt(0).toUpperCase() + rar.slice(1);
            return `[${emoji} ${rarityLabel}](!shop stock filter_add all ${rar})`; 
        }).join(" ");
        // Add 'All Rarities' button with new emoji
        rarityButtons += ` [🏳️‍🌈 All Rarities](!shop stock filter_add all all)`; 

        // Build advanced filter prompt options
        const categoryOptions = ['All', ...categoryOrder.map(c => c.charAt(0).toUpperCase() + c.slice(1))].join('|'); 
        const rarityOptions = ['All', ...CONFIG.ITEM.RARITIES.map(r => r === 'very rare' ? 'Very Rare' : r.charAt(0).toUpperCase() + r.slice(1))].join('|');
        const advancedFilterButton = `[🔍 Filter Items](!shop stock filter_add ?{Category|${categoryOptions}} ?{Rarity|${rarityOptions}})`;

        const menu = [
            "&{template:default}",
            `{{name=${shop.name} Stock Management}}`,
            // New Filter Sections
            `{{Filter by Category=${categoryButtons}}}`, 
            `{{Filter by Rarity=${rarityButtons}}}`, 
            `{{Advanced Filter=${advancedFilterButton}}}`, 
            // Existing sections
            "{{Stock Actions=",
            "[🎲 Generate Random Stock](!shop stock random)",
            "[🔄 Restock Shop](!shop stock restock)", // Added restock button
            "[🗑️ Clear All Stock](!shop stock clear)",
            "}}",
            "{{Current Stock=",
            this.STKACT_LOG_FormatInventory(shop),
            "}}",
            "{{Navigation=",
            "[🔙 Back to Shop](!shop)",
            "[📜 Shop List](!shop list)",
            "}}"
        ];

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: MD_CD_SHOP_17_36_69_SHOW_ITEMS]
    // Added rarityToShow parameter and forceDisplay flag
    STKMGM_MD_ShowItemToAdd: function(categoryToShow, playerID, forceDisplay = false, rarityToShow = 'all') { 
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;
        const rarityOrder = CONFIG.DISPLAY.RARITY.ORDER;
        const displayThreshold = CONFIG.DISPLAY.STOCK_DISPLAY_THRESHOLD || 30; // Max items before showing warning

        // Use both category and rarity filters
        ShopSystem.database.listItems(categoryToShow, rarityToShow).then(items => {
            if (!items || items.length === 0) {
                ShopSystem.utils.chat(`No items found in the database matching: Category="${categoryToShow}", Rarity="${rarityToShow}"`, playerID);
                return;
            }

            // --- Check if item count exceeds threshold and display is not forced ---
            if (items.length > displayThreshold && !forceDisplay) {
                ShopSystem.utils.log(`Warning: Item count (${items.length}) exceeds threshold (${displayThreshold}) for filter (Cat: '${categoryToShow}', Rar: '${rarityToShow}'). Showing warning menu.`, 'info');
                const categoryOptions = ['All', ...CONFIG.ITEM.CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))].join('|');
                const rarityOptions = ['All', ...CONFIG.ITEM.RARITIES.map(r => r.charAt(0).toUpperCase() + r.slice(1))].join('|');

                // Ensure category and rarity for "Show These" button are quoted if they contain spaces
                const safeCategoryArgShowThese = categoryToShow.includes(' ') ? `"${categoryToShow}"` : categoryToShow;
                const safeRarityArgShowThese = rarityToShow.includes(' ') ? `"${rarityToShow}"` : rarityToShow;
                
                const menuWarning = [
                    "&{template:default}",
                    "{{name=⚠️ Large Item List Warning}}",
                    `{{Message=Found ${items.length} items matching Category="${categoryToShow}" and Rarity="${rarityToShow}". Displaying all might be slow or incomplete.}}`,
                    "{{Options=",
                    `[🔍 Filter Further](!shop stock filter_add ?{Category|${categoryOptions}} ?{Rarity|${rarityOptions}})`, // Stays the same
                    // Updated button text and command to force display of the *current* filtered view
                    `[➡️ Show These ${items.length} Items Anyway](!shop stock filter_add ${categoryToShow} ${rarityToShow} force)`, 
                    "[🔙 Back to Stock Mgmt](!shop stock manage)",
                    "}}"
                ].join(" ");
                ShopSystem.utils.chat(menuWarning, playerID);
                return; 
            }

            // --- Proceed with displaying the list ---
            const menuTitleCategory = categoryToShow === 'all' ? 'All Categories' : categoryToShow.charAt(0).toUpperCase() + categoryToShow.slice(1);
            const menuTitleRarity = rarityToShow === 'all' ? 'All Rarities' : rarityToShow.charAt(0).toUpperCase() + rarityToShow.slice(1);
            const menu = [
                "&{template:default}",
                `{{name=${categoryEmojis[categoryToShow] || '📦'} Add Items to Stock (${menuTitleCategory} / ${menuTitleRarity})}}`
            ];

            // Group items first by category (if showing all), then by rarity
                const itemsByCategory = {};
                items.forEach(item => {
                const cat = item.category || CONFIG.ITEM.DEFAULT_CATEGORY;
                const rar = item.rarity || CONFIG.ITEM.DEFAULT_RARITY;
                if (!itemsByCategory[cat]) itemsByCategory[cat] = {};
                if (!itemsByCategory[cat][rar]) itemsByCategory[cat][rar] = [];
                itemsByCategory[cat][rar].push(item);
            });

            const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
                return CONFIG.ITEM.CATEGORIES.indexOf(a) - CONFIG.ITEM.CATEGORIES.indexOf(b);
            });

            sortedCategories.forEach(category => {
                const categoryEmoji = categoryEmojis[category] || "📦";
                    let categoryContent = [];
                const rarityGroups = itemsByCategory[category];
                const sortedRarities = Object.keys(rarityGroups).sort((a, b) => rarityOrder[a] - rarityOrder[b]);

                sortedRarities.forEach(rarity => {
                    const rarityEmoji = rarityEmojis[rarity] || "⚪";
                        categoryContent.push(`${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`);
                    const itemsInRarity = rarityGroups[rarity].sort((a, b) => a.name.localeCompare(b.name));

                    itemsInRarity.forEach(item => {
                        const formattedPrice = `💰${ShopSystem.utils.formatCurrency(item.price)}`;
                        categoryContent.push(`• ${item.name} - ${formattedPrice}`);
                        categoryContent.push(`    [➕ Add 1](!shop stock add_item ${item.id} 1) [⚙️ Details](!shop stock view_item ${item.id} ${categoryToShow} ${rarityToShow})`); 
                        });
                    });
                menu.push(`{{${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)}=${categoryContent.join('\n')}}}`);
            });

            // Always add category filter buttons, disable current
            menu.push("{{Filter Categories=");

            // Add line for current category
            const currentCategoryName = categoryToShow === 'all' ? 'All Categories' : categoryToShow.charAt(0).toUpperCase() + categoryToShow.slice(1);
            const currentCategoryEmoji = categoryToShow === 'all' ? '📦' : (categoryEmojis[categoryToShow] || '📦');
            menu.push(`Current: ${currentCategoryEmoji} ${currentCategoryName}`);

            // Generate buttons for *other* categories
            const categoryLinks = CONFIG.ITEM.CATEGORIES
                .filter(cat => cat !== categoryToShow) // Filter out the current category
                .map(cat => {
                    const emoji = categoryEmojis[cat] || "📦";
                    // Use filter_add command, passing current rarity filter
                    return `[${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}](!shop stock filter_add ${cat} ${rarityToShow})`; 
                })
                .join(" ");
            menu.push(categoryLinks);

            // Add "All Categories" button only if it's not the current filter
            if (categoryToShow !== 'all') {
                menu.push(` [📦 All Categories](!shop stock filter_add all ${rarityToShow})`); 
            }
            menu.push("}}");

            // Add rarity filter buttons (always show, disable current)
            menu.push("{{Filter Rarities=");

            // Add line for current rarity
            const currentRarityName = rarityToShow === 'all' ? 'All Rarities' : rarityToShow.charAt(0).toUpperCase() + rarityToShow.slice(1);
            const currentRarityEmoji = rarityToShow === 'all' ? '⚪' : (rarityEmojis[rarityToShow] || '⚪');
            menu.push(`Current: ${currentRarityEmoji} ${currentRarityName}`);

            // Generate buttons for *other* rarities
            const rarityButtons = CONFIG.ITEM.RARITIES
                .filter(rar => rar !== rarityToShow) // Filter out the current rarity
                .map(rar => {
                    const emoji = rarityEmojis[rar] || "⚪";
                    return `[${emoji} ${rar.charAt(0).toUpperCase() + rar.slice(1)}](!shop stock filter_add ${categoryToShow} ${rar})` 
                })
                .join(" ");
            menu.push(rarityButtons);

            // Add "All Rarities" button only if it's not the current filter
            if (rarityToShow !== 'all') {
                menu.push(` [All Rarities](!shop stock filter_add ${categoryToShow} all)`); 
            }
            menu.push("}}");

            // Add back button
            menu.push("{{Navigation=");
            menu.push("[🔙 Back to Stock Management](!shop stock manage)");
            menu.push("}}");

            ShopSystem.utils.chat(menu.join(" "), playerID);

        }).catch(error => {
            ShopSystem.utils.log(`Error listing items for add menu: ${error}`, 'error');
            ShopSystem.utils.chat(`❌ Error loading items. Check logs.`, playerID);
        });
    },

    // [TAG: CD_SHOP_ITEM_EDIT_MENU] // New function for editing item stock/price
    STKMGM_MD_ShowEditMenu: function(itemId, playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop selected!', playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        let item = null;
        let itemCategory = '';

        // Find the item across all categories
        for (const category in shop.inventory) {
            if (Array.isArray(shop.inventory[category])) {
                const foundItem = shop.inventory[category].find(i => i.id === itemId);
                if (foundItem) {
                    item = foundItem;
                    itemCategory = category;
                    break;
                }
            }
        }

        if (!item) {
            ShopSystem.utils.chat('❌ Item not found!', playerID);
            return;
        }

        // Get category and rarity emojis for display
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const categoryEmoji = categoryEmojis[itemCategory] || "📦";
        const rarityEmoji = CONFIG.DISPLAY.RARITY.EMOJI[item.rarity] || "⚪";
        const formattedPrice = ShopSystem.utils.formatCurrency(item.price);

        // Build detailed item information using our utility
        const itemDetails = ShopSystem.utils.ITEM_DISPLAY.formatItemDetails(item);
        itemDetails.unshift(`${categoryEmoji} ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`);
        itemDetails.unshift(`${rarityEmoji} ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}`);
        itemDetails.push(`${ShopSystem.utils.ITEM_DISPLAY.PROPERTY_EMOJI.price} ${formattedPrice}`);

        const currentQuantity = item.quantity || 0; // Default to 0 if undefined
        const maxQuantity = item.maxStock || currentQuantity; // Default maxStock to current if missing

        const menu = [
            '&{template:default}',
            `{{name=📝 Edit Item: ${item.name}}}`,
            `{{Item Details=${itemDetails.join('\n')}}}`,
            `{{Description=${item.description || 'No description available'}}}`,
            // Display Current and Max
            `{{Current Quantity=${currentQuantity}}}`,
            `{{Max Stock=${maxQuantity}}}`,
            // Relabel Quantity Actions to Max Stock Actions and update commands
            "{{Max Stock Actions=",
            `[➕ Add 1](!shop stock set_max_stock ${itemId} ${maxQuantity + 1})`,
            `[➕ Add 5](!shop stock set_max_stock ${itemId} ${maxQuantity + 5})`,
            `[➖ Remove 1](!shop stock set_max_stock ${itemId} ${Math.max(0, maxQuantity - 1)})`,
            `[➖ Remove 5](!shop stock set_max_stock ${itemId} ${Math.max(0, maxQuantity - 5)})`,
            `[✏️ Set Custom Max](!shop stock set_max_stock ${itemId} ?{New Max Stock|${maxQuantity}})`,
            "}}",
            // Add section for Current Quantity
            "{{Current Quantity Actions=",
            `[✏️ Set Current Qty](!shop stock set_current_qty ${itemId} ?{New Current Qty|${currentQuantity}})`,
            "}}",
            "{{Price Actions=",
            `[💰 Set Price](!shop stock set_item_price ${itemId} ?{New Price in GP|${(ShopSystem.utils.toCopper(item.price) / CONFIG.CURRENCY.COPPER_PER_GOLD).toFixed(2)}})`,
            "}}",
            "{{Navigation=",
            "[🔙 Back to Stock Management](!shop stock manage)",
            "}}",
            // Update note to reflect maxStock=0 removes item
            "{{Note=Setting Max Stock to 0 will remove the item. Current Qty cannot exceed Max Stock.}}"
        ].join(' ');

        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: CD_SHOP_60_FORMAT_STOCK] // Modified from SHOP_60
    STKACT_LOG_FormatInventory: function(shop) { // Added playerID parameter
        if (!shop || !shop.inventory || Object.values(shop.inventory).every(arr => !arr || arr.length === 0)) {
            return "No items in stock.";
        }

        let stockLines = [];
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;
        const qtyColor = '#FF8C00';
        const newItemColor = '#28a745'; // Bootstrap green

        // [TAG: CD_STOCK_LAST_MODIFIED_TRACKING] Get last modified stock item ID for highlight
        const lastModifiedId = state.ShopSystem.lastModifiedStockItem ? state.ShopSystem.lastModifiedStockItem[shop.id] : null;
        // DEBUG LOGGING
        ShopSystem.utils.log(`[DEBUG] Formatting inventory for shop ${shop.id}. LastModifiedId: ${lastModifiedId}`, 'debug');

        // [TAG: CD_STOCK_HIGHLIGHT_BATCH] Get list of IDs to highlight from this batch add/confirm
        const idsToHighlight = state.ShopSystem.justAddedStockIds ? (state.ShopSystem.justAddedStockIds[shop.id] || []) : [];
        // Use the old single-item tracker as a fallback if the batch list isn't set (e.g., from manual add/edit)
        const singleModifiedId = state.ShopSystem.lastModifiedStockItem ? state.ShopSystem.lastModifiedStockItem[shop.id] : null;

        ShopSystem.utils.log(`[DEBUG FORMAT STOCK] Highlighting batch IDs: ${idsToHighlight.join(', ') || 'None'}. Fallback ID: ${singleModifiedId || 'None'}`, 'debug');

        Object.entries(shop.inventory).forEach(([category, items]) => {
            if (items && items.length > 0) {
                const categoryEmoji = categoryEmojis[category] || "📦";
                // [TAG: CD_SHOP_CATEGORY_HEADER_COLOR_001] Add blue color to category header
                stockLines.push(`<span style="color:#3399FF;font-weight:bold;">${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)}:</span>`);
                
                items.forEach(item => {
                    // [TAG: CD_SHOP_QTY_DISPLAY_UPDATE_002] Out of stock: show (0/2) Out of Stock in orange before name
                    const rarityEmoji = rarityEmojis[item.rarity] || '⚪';
                    let prefix = '';
                    let isHighlighted = idsToHighlight.includes(item.id) || item.id === singleModifiedId;
                    const categoryEmoji = categoryEmojis[category] || "📦";
                    let nameAndPriceSection;
                    if (item.quantity === 0) {
                        // Out of stock: (🔴/2) Out of Stock in orange before name
                        const maxStockDisplay = item.maxStock !== undefined ? item.maxStock : '?';
                        const outOfStockStr = `<span style="color:${qtyColor};font-weight:bold;">(🔴/${maxStockDisplay}) Out of Stock</span>`;
                        nameAndPriceSection = `${rarityEmoji} ${outOfStockStr} - ${item.name} - <span style="color:inherit;">💰${ShopSystem.utils.formatCurrency(item.price)}</span>`;
                    } else {
                        // In stock: show qty badge
                        const qtyDisplay = `<span style="color:${qtyColor};font-weight:bold;">(${item.quantity}/${item.maxStock ?? item.quantity})</span>`;
                        nameAndPriceSection = `${rarityEmoji} ${qtyDisplay} ${item.name} - <span style="color:inherit;">💰${ShopSystem.utils.formatCurrency(item.price)}</span>`;
                    }
                    if (isHighlighted) {
                        prefix = '🔄 ';
                        nameAndPriceSection = `<span style="color:${newItemColor};">${nameAndPriceSection}</span>`;
                    }
                    const itemDisplay = `${prefix}${nameAndPriceSection}`;
                    stockLines.push(
                        `• ${itemDisplay}`,
                        // Ensure Edit/Remove buttons are properly indented and formatted
                        `[📝 Edit](!shop stock qty ${item.id}) [❌ Remove](!shop stock removeitem ${item.id})` 
                    );
                });
            }
        });

        // [TAG: CD_STOCK_HIGHLIGHT_BATCH] Clear the batch highlight list after displaying
        if (state.ShopSystem.justAddedStockIds && state.ShopSystem.justAddedStockIds[shop.id]) {
            delete state.ShopSystem.justAddedStockIds[shop.id];
            ShopSystem.utils.log(`[DEBUG FORMAT STOCK] Cleared batch highlight IDs for shop ${shop.id}`, 'debug');
        }
        // Also clear the single item tracker if it was used
        if (singleModifiedId) {
             delete state.ShopSystem.lastModifiedStockItem[shop.id];
             ShopSystem.utils.log(`[DEBUG FORMAT STOCK] Cleared single highlight ID for shop ${shop.id}`, 'debug');
        }

        return stockLines.length > 0 ? stockLines.join('\n') : 'No items in stock.';
    },

    // [TAG: CD_SHOP_23_76_ADD_STOCK]
    STKACT_LOG_AddItemToStock: function(itemId, quantity = 1, customPrice = null) { // Add customPrice parameter
        if (!ShopSystem.state.activeShop) {
            return { success: false, error: "No active shop selected" };
        }

        // Get the item from database
        return new Promise((resolve, reject) => {
            const shop = ShopSystem.state.activeShop;
            // Ensure shop and shop.id exist
            if (!shop || !shop.id) {
                ShopSystem.utils.log("Error in AddItemToStock: Active shop or shop ID is missing.", "error");
                reject(new Error("Active shop is not properly set."));
                return;
            }
            
            ShopSystem.database.listItems('all', 'all').then(items => {
                const item = items.find(i => i.id === itemId);
                
                if (!item) {
                    reject(new Error(`Item ${itemId} not found in database`));
                    return;
                }

                // Ensure shop inventory structure is initialized
                if (!shop.inventory) shop.inventory = {};
                if (!shop.inventory[item.category]) {
                     shop.inventory[item.category] = [];
                }

                // Check if item already exists in shop inventory
                const existingItemIndex = shop.inventory[item.category].findIndex(i => i.id === itemId);
                
                if (existingItemIndex !== -1) {
                    // Item exists, update quantity and optionally price
                     const existingItem = shop.inventory[item.category][existingItemIndex];
                    if (customPrice) {
                        existingItem.price = customPrice;
                        ShopSystem.utils.log(`Updated price of ${item.name} to ${ShopSystem.utils.formatCurrency(customPrice)}`, "info");
                    }
                    existingItem.quantity += quantity;
                    existingItem.maxStock = (existingItem.maxStock || 0) + quantity;
                    ShopSystem.utils.log(`Updated quantity of ${item.name} to ${existingItem.quantity}`, "info");
                } else {
                    // Add new item to inventory
                    shop.inventory[item.category].push({
                        id: item.id,
                        name: item.name,
                        quantity: quantity,
                        maxStock: quantity, // Set maxStock equal to initial quantity
                        price: customPrice || item.price, // Use custom price if provided
                        category: item.category,
                        rarity: item.rarity
                    });
                    const logPrice = customPrice ? ShopSystem.utils.formatCurrency(customPrice) : 'default';
                    ShopSystem.utils.log(`Added ${quantity} ${item.name} (Price: ${logPrice}, MaxStock: ${quantity}) to shop inventory`, "info"); // Log maxStock
                }

                // [TAG: CD_STOCK_LAST_MODIFIED_TRACKING] Track last modified stock item *AFTER* modification
                if (!state.ShopSystem.lastModifiedStockItem) state.ShopSystem.lastModifiedStockItem = {};
                state.ShopSystem.lastModifiedStockItem[shop.id] = itemId; 
                // DEBUG LOGGING
                ShopSystem.utils.log(`[DEBUG] Set lastModifiedStockItem for shop ${shop.id} to item ${itemId}`, 'debug');

                // Save the updated shop
                const shopHandout = getObj("handout", shop.id);
                if (shopHandout) {
                    shopHandout.set("gmnotes", JSON.stringify(shop, null, 2));
                    resolve({ success: true, item: item, quantity: quantity, priceUsed: customPrice || item.price });
                } else {
                    reject(new Error("Could not save shop data"));
                }
            }).catch(error => {
                reject(error);
            });
        });
    },

    // [TAG: CD_STOCK_COMMAND_HANDLER] // New command handler structure
    STKACT_CMD_HandleStockCommand: function(args, playerID, msg) {
        const subCommand = args[0]?.toLowerCase();
        
        switch (subCommand) {
            case "manage":
                this.STKMGM_MD_ShowStockManageMenu(playerID);
                break;
                
            case "add":
                const category = args[1]?.toLowerCase();
                const forceDisplay = args[2]?.toLowerCase() === 'force'; 
                if (category === 'all' || CONFIG.ITEM.CATEGORIES.includes(category)) {
                    // Always pass 'all' for rarity here, forceDisplay controls threshold bypass
                    this.STKMGM_MD_ShowItemToAdd(category, playerID, forceDisplay, 'all'); 
                } else {
                    ShopSystem.utils.chat("❌ Invalid category. Use: weapons, 'Armor & Attire', potions, scrolls, magic, equipment, 'Mounts & Vehicles', or Services", playerID);
                }
                break;
                
            case "add_item":
                const itemId = args[1];
                // [TAG: CD_STOCK_ADD_ITEM_QTY] Read quantity from args[2], default to 1
                const addItemQuantity = parseInt(args[2]) || 1;
                if (isNaN(addItemQuantity) || addItemQuantity <= 0) {
                    ShopSystem.utils.chat("❌ Invalid quantity specified. Must be a positive number.", playerID);
                    return;
                }
                
                if (!itemId) {
                    ShopSystem.utils.chat("❌ No item ID provided", playerID);
                    return;
                }
                
                this.STKACT_LOG_AddItemToStock(itemId, addItemQuantity)
                    .then(result => {
                        ShopSystem.utils.chat(`✅ Added ${addItemQuantity}x ${result.item.name} to shop inventory`, playerID);
                        // Show the stock management menu again
                        this.STKMGM_MD_ShowStockManageMenu(playerID);
                    })
                    .catch(error => {
                        ShopSystem.utils.chat(`❌ Error adding item: ${error.message}`, playerID);
                    });
                break;

            // [TAG: CD_STOCK_REMOVE_ITEM_CALL] // Added case for removeitem
            case "removeitem": // Matches the button link in STKACT_LOG_FormatInventory
                const removeItemId = args[1];
                if (!removeItemId) {
                    ShopSystem.utils.chat("❌ No item ID provided", playerID);
                    return;
                }
                // Call SetMaxStock with 0 to effectively remove the item
                this.STKACT_LOG_SetMaxStock(removeItemId, 0, playerID);
                break;

            // [TAG: CD_STOCK_EDIT_ITEM_CALL] // Added case for qty
            case "qty":
                const editItemId = args[1];
                if (!editItemId) {
                    ShopSystem.utils.chat("❌ No item ID specified for edit", playerID);
                    return;
                }
                this.STKMGM_MD_ShowEditMenu(editItemId, playerID);
                break;

            // [TAG: CD_STOCK_SET_PRICE_CALL] // Added case for set_item_price
            case "set_item_price": // Keep this case
                const setPriceItemId = args[1];
                const setPriceValue = args[2];
                if (!setPriceItemId || setPriceValue === undefined) {
                    ShopSystem.utils.chat("❌ Missing parameters for setting price", playerID);
                    return;
                }
                this.STKACT_LOG_SetItemPrice(setPriceItemId, setPriceValue, playerID);
                break;

            // [TAG: CD_STOCK_SET_MAX_STOCK_CALL] // New case for set_max_stock
            case "set_max_stock":
                const setMaxStockItemId = args[1];
                const setMaxStockValue = args[2];
                if (!setMaxStockItemId || setMaxStockValue === undefined) {
                    ShopSystem.utils.chat("❌ Missing parameters for setting max stock", playerID);
                    return;
                }
                this.STKACT_LOG_SetMaxStock(setMaxStockItemId, setMaxStockValue, playerID);
                break;

            // [TAG: CD_STOCK_SET_CURRENT_QTY_CALL] // New case for set_current_qty
            case "set_current_qty":
                const setCurrentQtyItemId = args[1];
                const setCurrentQtyValue = args[2];
                if (!setCurrentQtyItemId || setCurrentQtyValue === undefined) {
                    ShopSystem.utils.chat("❌ Missing parameters for setting current quantity", playerID);
                    return;
                }
                this.STKACT_LOG_SetCurrentQuantity(setCurrentQtyItemId, setCurrentQtyValue, playerID);
                break;
            // [TAG: STOCK_FILTER_HANDLING]
            case "filter_add":
            case "filter_remove":
                // Args: [subCommand, categoryWord1, categoryWord2, ..., rarity, (optional)force]
                // Example: !shop stock filter_add Armor & Attire common force
                // Example: !shop stock filter_remove Weapons all

                if (args.length < 2) { // subcommand + at least a category
                    ShopSystem.utils.chat("❌ Category and optionally rarity required for filter.", playerID);
                    return;
                }

                let categoryParts = [];
                let rarityArg = "all"; // Default rarity
                let forceArg = false;
                let argIndex = 1; // Start after subCommand

                // Consume arguments for category until a rarity or 'force' is found
                while(argIndex < args.length) {
                    const currentArgOriginal = args[argIndex]; // Keep original case for categoryParts
                    const currentArgLower = currentArgOriginal.toLowerCase();
                    const nextArgLower = (argIndex + 1 < args.length) ? args[argIndex+1].toLowerCase() : null;

                    // Check if currentArgLower is a rarity
                    if (CONFIG.ITEM.RARITIES.includes(currentArgLower) || currentArgLower === "all") {
                        rarityArg = currentArgLower;
                        argIndex++;
                        // Check if next arg is 'force'
                        if (argIndex < args.length && args[argIndex].toLowerCase() === 'force') {
                            forceArg = true;
                            argIndex++;
                        }
                        break; // Rarity (and possibly force) found
                    }
                    // Check if currentArgLower combined with nextArgLower is "very rare"
                    else if (currentArgLower === "very" && nextArgLower === "rare") {
                        rarityArg = "very rare";
                        argIndex += 2;
                        // Check if next arg is 'force'
                        if (argIndex < args.length && args[argIndex].toLowerCase() === 'force') {
                            forceArg = true;
                            argIndex++;
                        }
                        break; // Rarity (and possibly force) found
                    }
                    // Check if currentArgLower is 'force' (can appear after category if rarity is default 'all')
                    else if (currentArgLower === 'force' && categoryParts.length > 0) {
                        forceArg = true;
                        argIndex++;
                        // If 'force' is found, the preceding parts were category, and rarity remains 'all'
                        break; 
                    }
                    categoryParts.push(currentArgOriginal); // Add the original case part
                    argIndex++;
                }

                let categoryToFilter = categoryParts.join(" ").trim();

                if (!categoryToFilter) {
                    // This case should ideally be rare if parseCommandArgs correctly quotes multi-word args from buttons.
                    // If it happens, it means the command was likely typed without quotes for a multi-word category
                    // and only rarity/force was provided, or the command is malformed.
                    // We could try to infer category from remaining args if any, but it's safer to error.
                    ShopSystem.utils.chat("❌ Category not specified or improperly formatted for filter.", playerID);
                    return;
                }
                
                const categoryToFilterLower = categoryToFilter.toLowerCase();

                ShopSystem.utils.log(`Stock Filter: cmd='${subCommand}', cat='${categoryToFilter}', rar='${rarityArg}', force='${forceArg}'`, "debug");

                // Validate category
                if (categoryToFilterLower !== "all" && !CONFIG.ITEM.CATEGORIES.map(c => c.toLowerCase()).includes(categoryToFilterLower)) {
                    const validCats = CONFIG.ITEM.CATEGORIES.map(c => `"${c}"`).join(", ") + ", \"all\"";
                    ShopSystem.utils.chat(`❌ Invalid category: "${categoryToFilter}". Valid categories are: ${validCats}`, playerID);
                    return;
                }
                // Validate rarity
                if (!CONFIG.ITEM.RARITIES.includes(rarityArg) && rarityArg !== "all") {
                    const validRars = CONFIG.ITEM.RARITIES.join(", ") + ", \"all\"";
                    ShopSystem.utils.chat(`❌ Invalid rarity: "${rarityArg}". Valid rarities are: ${validRars}`, playerID);
                    return;
                }

                if (subCommand === "filter_add") {
                    this.STKMGM_MD_ShowItemToAdd(categoryToFilter, playerID, forceArg, rarityArg);
                } else { // filter_remove
                    this.STKMGM_MD_ShowItemToRemove(categoryToFilter, playerID, rarityArg);
                }
                break;
            // Random stock generation commands
            case "random":
                this.RDM_MD_ShowRandomStockMenu(playerID);
                break;

            case "random_basic":
                this.RDM_MD_ShowBasicRandomMenu(playerID);
                break;

            case "random_smart":
                this.RDM_MD_ShowAdvancedRandomMenu(playerID);
                break;

            // [TAG: CD_CHANCE_GENERATOR_CALL]
            case "random_chance": // Add case for the new generator
                this.RDML_LOG_GenerateChanceBasedStock(playerID);
                break;

            case "random_generate": // Handles generation from Basic menu
                // Basic validation
                if (args.length < 5) { // Need at least !shop stock random_generate category quantity minRarity maxRarity
                    ShopSystem.utils.chat("❌ Invalid random generation command. Format: !shop stock random_generate [category] [qty] [min_rarity] [max_rarity]", playerID);
                    return;
                }
                
                const genCategory = args[1].toLowerCase();
                const quantity = parseInt(args[2]);
                
                if (isNaN(quantity) || quantity < 1) {
                    ShopSystem.utils.chat("❌ Invalid quantity specified. Must be a positive number.", playerID);
                    return;
                }
                
                // Determine min and max rarity, handling multi-word rarities
                let minRarityStr;
                let maxRarityStr;
                let maxRarityStartIndex;

                if (args[3].toLowerCase() === 'very' && args.length > 5 && args[4].toLowerCase() === 'rare') {
                    minRarityStr = 'very rare';
                    maxRarityStartIndex = 5;
                } else {
                    minRarityStr = args[3].toLowerCase();
                    maxRarityStartIndex = 4;
                }

                if (maxRarityStartIndex >= args.length) {
                     ShopSystem.utils.chat("❌ Invalid command format: Missing maximum rarity.", playerID);
                     return;
                }

                maxRarityStr = args.slice(maxRarityStartIndex).join(' ').toLowerCase();
                
                // Normalize "very rare"
                if (maxRarityStr === 'very') maxRarityStr = 'very rare'; 

                // Validate rarities
                const validRarities = Object.keys(CONFIG.DISPLAY.RARITY.ORDER);
                if (!validRarities.includes(minRarityStr) || !validRarities.includes(maxRarityStr)) {
                     ShopSystem.utils.chat(`❌ Invalid rarity specified. Use: ${validRarities.join(', ')}`, playerID);
                     return;
                }

                ShopSystem.utils.log(`[DEBUG CMD PARSE] Category: ${genCategory}, Qty: ${quantity}, Min: ${minRarityStr}, Max: ${maxRarityStr}`, 'debug');
                
                this.RDML_LOG_GenerateRandomStock(genCategory, quantity, minRarityStr, maxRarityStr, playerID);
                break;

            case "reroll":
                const itemIndex = parseInt(args[1]);
                const rerollQuantity = parseInt(args[2]);
                if (isNaN(itemIndex)) {
                    ShopSystem.utils.chat("❌ Invalid item index", playerID);
                    return;
                }
                this.RDML_LOG_RerollRandomItem(itemIndex, rerollQuantity || null, playerID);
                break;

            case "reroll_qty":
                const rerollIndex = parseInt(args[1]);
                if (isNaN(rerollIndex)) {
                    ShopSystem.utils.chat("❌ Invalid item index", playerID);
                    return;
                }
                this.RDM_MD_ShowRandomQtyStkAdjMenu(rerollIndex, playerID);
                break;

            case "adjust_qty":
                const adjustIndex = parseInt(args[1]);
                // Rename newQuantity to avoid conflict
                const adjustedQty = parseInt(args[2]); 
                if (isNaN(adjustIndex) || isNaN(adjustedQty)) {
                    ShopSystem.utils.chat("❌ Invalid parameters for quantity adjustment", playerID);
                    return;
                }
                this.RDML_LOG_AdjustItemQuantity(adjustIndex, adjustedQty, playerID);
                break;

            case "reroll_all":
                // Regenerate based on the method used previously
                if (ShopSystem.state.pendingStock) {
                    const { category, quantity, minRarity, maxRarity, generationMethod } = ShopSystem.state.pendingStock;

                    ShopSystem.utils.log(`Reroll All: Detected generation method: ${generationMethod}`, 'info');

                    if (generationMethod === 'advanced') {
                        ShopSystem.utils.log("Rerolling all using Advanced (Item Count) method...", 'info');
                        // Call advanced generator, passing the original quantity
                        this.RDML_LOG_GenerateAdvancedStock(playerID, quantity); 
                    } else if (generationMethod === 'chance') { // <-- Add this check
                        ShopSystem.utils.log("Rerolling all using Chance-Based method...", 'info');
                        // Call chance-based generator again
                        this.RDML_LOG_GenerateChanceBasedStock(playerID); 
                    } else {
                        // Default to basic generation if method is 'basic' or missing/unknown
                        ShopSystem.utils.log("Rerolling all using Basic method...", 'info');
                    this.RDML_LOG_GenerateRandomStock(category, quantity, minRarity, maxRarity, playerID);
                    }
                } else {
                    ShopSystem.utils.chat("❌ No pending stock to reroll", playerID);
                }
                break;

            case "confirm":
                this.RDML_LOG_ConfirmRandomStock(playerID);
                break;

            case "clear_confirm":
                if (!ShopSystem.state.pendingStock || !ShopSystem.state.pendingStock.items) {
                    ShopSystem.utils.chat("❌ No pending stock to confirm", playerID);
                    return;
                }
                if (!ShopSystem.state.activeShop) {
                    ShopSystem.utils.chat("❌ No active shop selected", playerID);
                    return;
                }

                // Rename variable to avoid conflict with other cases
                const shopToClear = ShopSystem.state.activeShop;

                // Clear existing inventory
                ShopSystem.utils.log(`Clearing inventory for shop: ${shopToClear.name}`, 'info');
                shopToClear.inventory = {}; // Reset the inventory object
                // Ensure all standard categories exist as empty arrays after clearing
                CONFIG.ITEM.CATEGORIES.forEach(cat => {
                    shopToClear.inventory[cat] = [];
                });

                // Now add the pending stock (which will add to the empty inventory)
                this.RDML_LOG_ConfirmRandomStock(playerID);
                // The confirmation message and menu refresh are handled within RDML_LOG_ConfirmRandomStock
                break;

            case "cancel":
                ShopSystem.state.pendingStock = null;
                ShopSystem.utils.chat("❌ Random stock generation cancelled", playerID);
                this.STKMGM_MD_ShowStockManageMenu(playerID);
                break;

            case "random_type_location":
                const customCount = args[1] ? parseInt(args[1]) : null;
                if (args[1] && (isNaN(customCount) || customCount < 1)) {
                    ShopSystem.utils.chat("❌ Invalid item count specified", playerID);
                    return;
                }
                this.RDML_LOG_GenerateAdvancedStock(playerID, customCount);
                break;
                
            // Clear stock commands
            case "clear":
                if (!ShopSystem.state.activeShop) {
                    ShopSystem.utils.chat("❌ No active shop selected", playerID);
                    return;
                }
                const menu = [
                    "&{template:default}",
                    `{{name=Clear All Stock from ${ShopSystem.state.activeShop.name}}}`, 
                    "{{Warning=This will remove ALL items from the shop inventory. This action cannot be undone.}}", 
                    "{{Actions=", 
                    "[✅ Yes, Clear All Stock](!shop stock clearconfirm)", 
                    "[❌ No, Cancel](!shop stock manage)", 
                    "}}"
                ].join(" ");
                ShopSystem.utils.chat(menu, playerID);
                break;

            case "clearconfirm":
        if (!ShopSystem.state.activeShop) {
                    ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }
        const shop = ShopSystem.state.activeShop;
                // Clear all categories
                Object.keys(shop.inventory).forEach(category => {
                    shop.inventory[category] = [];
                });
                // Save shop data
        const handout = getObj("handout", shop.id);
        if (handout) {
            handout.set("gmnotes", JSON.stringify(shop, null, 2));
                    // [TAG: CD_STOCK_LAST_MODIFIED_TRACKING] Clear last modified on stock clear
                    if (state.ShopSystem.lastModifiedStockItem) {
                        delete state.ShopSystem.lastModifiedStockItem[shop.id];
                    }
                    ShopSystem.utils.chat("✅ All stock has been cleared!", playerID);
                    this.STKMGM_MD_ShowStockManageMenu(playerID);
                } else {
                    ShopSystem.utils.chat("❌ Error: Shop handout not found!", playerID);
                }
                break;

            // [TAG: CD_STOCK_VIEW_ITEM_CALL] // New case to view item details before adding
            case "view_item":
                const viewItemId = args[1];
                const viewItemCategory = args[2] || 'all'; // Category needed for back button
                if (!viewItemId) {
                    ShopSystem.utils.chat("❌ No item ID specified for view", playerID);
            return;
        }
                // Pass the full msg object for GM check inside the menu
                this.STKMGM_MD_ShowViewItemMenu(viewItemId, viewItemCategory, playerID, msg); 
                break;
                
            // [TAG: CD_STOCK_ADD_CUSTOM_PRICE_CALL] // Handle adding item with custom price and quantity
            case "add_item_custom_price":
                const customItemId = args[1];
                const customPriceGP = args[2];
                const customQuantity = args[3];
                if (!customItemId || customPriceGP === undefined || customQuantity === undefined) {
                    ShopSystem.utils.chat("❌ Missing parameters for custom add", playerID);
            return;
        }
                // Convert price to copper and then to a price object
                const priceFlt = parseFloat(customPriceGP);
                if (isNaN(priceFlt) || priceFlt < 0) {
                    ShopSystem.utils.chat("❌ Invalid custom price specified.", playerID);
            return;
        }
                const priceCp = Math.round(priceFlt * CONFIG.CURRENCY.COPPER_PER_GOLD);
                const customPriceObj = ShopSystem.utils.fromCopper(priceCp);

                // Parse quantity
                const quantityInt = parseInt(customQuantity) || 1;
                 if (isNaN(quantityInt) || quantityInt <= 0) {
                    ShopSystem.utils.chat("❌ Invalid quantity specified. Must be a positive number.", playerID);
                    return;
                }

                this.STKACT_LOG_AddItemToStock(customItemId, quantityInt, customPriceObj)
                    .then(result => {
                        ShopSystem.utils.chat(`✅ Added ${quantityInt}x ${result.item.name} (Price: ${ShopSystem.utils.formatCurrency(customPriceObj)}) to shop inventory`, playerID);
            this.STKMGM_MD_ShowStockManageMenu(playerID);
                    })
                    .catch(error => {
                        ShopSystem.utils.chat(`❌ Error adding custom item: ${error.message}`, playerID);
                    });
                break;
                
            // [TAG: CD_STOCK_FILTER_ADD] New case to handle filtering from warning menu
            case "filter_add":
                const filterCategory = args[1]?.toLowerCase() || 'all';
                const filterRarity = args[2] ? ShopSystem.utils.normalizeRarity(args[2]) : 'all';
                // Check for force flag at the end
                const filterForceDisplay = args[3]?.toLowerCase() === 'force'; 
                
                ShopSystem.utils.log(`Filtering Add Items view. Category: ${filterCategory}, Rarity: ${filterRarity}, Force: ${filterForceDisplay}`, 'debug');
                
                // Pass category, rarity, and force flag to the display function
                this.STKMGM_MD_ShowItemToAdd(filterCategory, playerID, filterForceDisplay, filterRarity); 
                break;

                // [TAG: CD_RESTOCK_COMMAND_CASE]
            case "restock":
                this.RESTOCK_LOGIC_RestockShop(playerID);
                break;
                
            case "review":
                this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
                break;
                
            default:
                ShopSystem.utils.chat(`❌ Unknown stock command: ${subCommand}. Use !shop help for available commands.`, playerID);
                break;
        }
    },

    // [TAG: CD_SHOP_SET_ITEM_PRICE] // New function to handle setting price
    STKACT_LOG_SetItemPrice: function(itemId, newPriceGP, playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop selected!', playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        let item = null;

        // Find the item
         for (const category in shop.inventory) {
            if (Array.isArray(shop.inventory[category])) {
                const foundItem = shop.inventory[category].find(i => i.id === itemId);
                if (foundItem) {
                    item = foundItem;
                    break;
                }
            }
        }

        if (!item) {
            ShopSystem.utils.chat('❌ Item not found!', playerID);
            return;
        }

        // Validate and parse price
        const priceFlt = parseFloat(newPriceGP);
        if (isNaN(priceFlt) || priceFlt < 0) {
            ShopSystem.utils.chat('❌ Invalid price! Please enter a non-negative number.', playerID);
            this.STKMGM_MD_ShowEditMenu(itemId, playerID); // Show menu again
            return;
        }

        // Convert GP price to copper
        const priceCp = Math.round(priceFlt * CONFIG.CURRENCY.COPPER_PER_GOLD);

        // Update item price using the standard currency structure
        item.price = ShopSystem.utils.fromCopper(priceCp);

        // Save shop data
        const handout = getObj('handout', shop.id);
        if (handout) {
            handout.set('gmnotes', JSON.stringify(shop, null, 2));
            ShopSystem.utils.chat(`✅ Updated price of ${item.name} to ${ShopSystem.utils.formatCurrency(item.price)}.`, playerID);
            this.STKMGM_MD_ShowEditMenu(itemId, playerID); // Show menu again
        } else {
            ShopSystem.utils.chat('❌ Error: Shop handout not found!', playerID);
        }
    },

    // [TAG: CD_SHOP_RANDOM_MENU]
    RDM_MD_ShowRandomStockMenu: function(playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        // Get shop location to calculate rarity bonus
        const shop = ShopSystem.state.activeShop;
        const location = shop.location || CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION;
        const locationConfig = CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === location) || {};
        const rarityBonus = locationConfig.rarityBonus || 0;
        const chanceLegendaryPercent = ShopSystem.utils.getChanceLegendaryPercent(rarityBonus);
        const legendaryEmoji = CONFIG.DISPLAY.RARITY.EMOJI.legendary || '🟠'; // Get legendary emoji

        const menu = [
            "&{template:default}",
            "{{name=🎲 Generate Random Stock}}",
            "{{Generation Methods=",
            "[📦 Basic](!shop stock random_basic)",
            // Updated button text
            "[🏪 Type & Location](!shop stock random_smart)",
            // Re-added color formatting to percentage
            `[🎲 Roll-Based\n(<span style=\"color:#FF8C00;font-weight:bold;\">${chanceLegendaryPercent}%</span> for 1 ${legendaryEmoji})](!shop stock random_chance)`,
            "}}",
            "{{Note=After generation, review items to Add to Current Stock or Clear & Confirm Stock.}}",
            "{{Navigation=[🔙 Back to Shop](!shop)}}"
        ];

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: CD_SHOP_RANDOM_BASIC] // This is not a few feature?
    RDM_MD_ShowBasicRandomMenu: function(playerID) {
        const categoryButtons = CONFIG.ITEM.CATEGORIES.map(cat => {
            const emoji = CONFIG.DISPLAY.CATEGORY.EMOJI[cat] || "📦";
            return `[${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}](!shop stock random_generate ${cat} ?{How many items?|5} ?{Minimum Rarity|Common|Uncommon|Rare|Very Rare|Legendary} ?{Maximum Rarity|Common|Uncommon|Rare|Very Rare|Legendary})`;
        }).join(" ");

        // [TAG: UTIL_06_CALC_BASIC_LEG_CHANCES] Pre-calculate legendary chances for common ranges
        const legChance_ComL = ShopSystem.utils.getRarityPercent('legendary','common','legendary', 0);
        const legChance_UncL = ShopSystem.utils.getRarityPercent('legendary','uncommon','legendary', 0);
        const legChance_RarL = ShopSystem.utils.getRarityPercent('legendary','rare','legendary', 0);
        const legChance_VrL = ShopSystem.utils.getRarityPercent('legendary','very rare','legendary', 0);

        // Build the detailed note string
        // [TAG: CD_SHOP_RANDOM_BASIC_QTY_COLORED] Color legendary chance percentages
        const noteText = `Est. Legendary % by Range:\n` +
            `• Com-Leg: <span style=\"color:#FF8C00;font-weight:bold;\">${legChance_ComL}%</span>\n` +
            `• Unc-Leg: <span style=\"color:#FF8C00;font-weight:bold;\">${legChance_UncL}%</span>\n` +
            `• Rare-Leg: <span style=\"color:#FF8C00;font-weight:bold;\">${legChance_RarL}%</span>\n` +
            `• V.Rare-Leg: <span style=\"color:#FF8C00;font-weight:bold;\">${legChance_VrL}%</span>`;

        const menu = [
            "&{template:default}",
            "{{name=📦 Basic Random Stock Generator}}",
            // Remove the separate legendary chance display
            // `{{Legendary Chance=${legChance_ComL}%}}`,
            `{{Categories=${categoryButtons}}}`,
            "{{Generate All=",
            "[🎲 Generate Items Across All Categories](!shop stock random_generate all ?{Total number of items to generate|3} ?{Minimum Rarity|Common|Uncommon|Rare|Very Rare|Legendary} ?{Maximum Rarity|Common|Uncommon|Rare|Very Rare|Legendary})",
            "}}",
            // Replace the old note with the detailed chances
            `{{Note=${noteText}}}`,
            "{{Navigation=",
            "[🔙 Back to Generation Methods](!shop stock random)",
            "}}"
        ];

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: CD_SHOP_RANDOM_TYPE_LOCATION] // This is not a few feature?
    RDM_MD_ShowAdvancedRandomMenu: function(playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        const shopType = shop.shop_type || CONFIG.SHOP_SETTINGS.DEFAULTS.SHOP_TYPE;
        const location = shop.location || CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION;
        const locationConfig = CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === location) || {};

        const menu = [
            "&{template:default}",
            "{{name=🏪 Shop-Based Random Stock Generator}}",
            `{{Current Settings=`,
            `• Shop Type: ${shopType}`,
            `• Location: ${location}`,
            `• Base Item Count: ${locationConfig.itemCount}`,
            `• Rarity Bonus: ${locationConfig.rarityBonus >= 0 ? '+' + locationConfig.rarityBonus : locationConfig.rarityBonus}`,
            // [TAG: UTIL_05_DISPLAY_LEGENDARY_ADV] Show legendary percent including rarity bonus
            `• Legendary Chance: <span style=\"color:#FF8C00;font-weight:bold;\">${ShopSystem.utils.getRarityPercent('legendary','common','legendary', locationConfig.rarityBonus)}%</span>`,
            "}}",
            "{{Generate=",
            `[🎲 Generate Based on Settings](!shop stock random_type_location)`,
            `<br>[🎯 Adjust Item Count](!shop stock random_type_location ?{Adjust item count|${locationConfig.itemCount}})`,
            "}}",
            "{{Note=Generation will use weights based on shop type and rarity chances based on location.}}",
            "{{Navigation=",
            "[🔙 Back to Generation Methods](!shop stock random)",
            "}}"
        ];

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: SHOP_73_show_confirmation_menu_for_random_stock]
    RDM_MD_ShowRandomStkConfirmMenu: function(playerID) {
        if (!ShopSystem.state.pendingStock) {
            ShopSystem.utils.chat('❌ No pending stock to confirm!', playerID);
            return;
        }

        const pending = ShopSystem.state.pendingStock;
        const totalUniqueItems = pending.items.length;
        const totalUnits = pending.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

        const menu = [];
        menu.push('&{template:default}');
        menu.push('{{name=🎲 Review Generated Stock}}');
        menu.push(`{{Category=${pending.category}}}`);
        menu.push(`{{Total Items=${totalUniqueItems} unique items (${totalUnits} total units)}}`);

        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityOrder = CONFIG.DISPLAY.RARITY.ORDER;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;
        const newItemColor = '#28a745'; // Bootstrap green
        const qtyColor = '#FF8C00';

        // [TAG: CD_REROLL_HIGHLIGHT] Get IDs to highlight from this reroll action
        const idsToHighlight = pending.justRerolledIds || [];
        // DEBUG LOGGING: Check the IDs read from state
        ShopSystem.utils.log(`[DEBUG CONFIRM READ] Highlighting IDs in confirm menu: ${idsToHighlight.join(', ') || 'None'}`, 'debug');

        const sortedItems = [...pending.items].sort((a, b) => {
            if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
                return rarityOrder[a.rarity] - rarityOrder[b.rarity]; // Sort ascending by rarity
            }
            return a.name.localeCompare(b.name);
        });

        const itemsByRarity = {};
        sortedItems.forEach(item => {
            if (!itemsByRarity[item.rarity]) itemsByRarity[item.rarity] = [];
            itemsByRarity[item.rarity].push(item);
        });

        Object.keys(itemsByRarity).sort((a, b) => rarityOrder[a] - rarityOrder[b]).forEach(rarity => {
            const itemsInRarity = itemsByRarity[rarity];
            const rarityEmoji = rarityEmojis[rarity] || "⚪";
            let raritySectionContent = [];

            // Further group items within this rarity by category
            const itemsByCategory = {};
            itemsInRarity.forEach(item => {
                const category = item.category || CONFIG.ITEM.DEFAULT_CATEGORY;
                if (!itemsByCategory[category]) itemsByCategory[category] = [];
                itemsByCategory[category].push(item);
            });

            // Sort categories based on config order
            const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
                return CONFIG.ITEM.CATEGORIES.indexOf(a) - CONFIG.ITEM.CATEGORIES.indexOf(b);
            });

            // Add category headers and items
            sortedCategories.forEach(category => {
                const categoryItems = itemsByCategory[category];
                const categoryEmoji = categoryEmojis[category] || "📦";
                const categoryHeader = `${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                // [TAG: CD_REVIEW_STOCK_CAT_HEADER_COLOR_001] Add blue color to category header
                raritySectionContent.push(`<span style="color:#3399FF;font-weight:bold;">${categoryHeader}</span>`);

                // Add item lines for this category
                categoryItems.forEach((item) => {
                    const quantityStr = item.quantity > 1
                        ? `<span style="color:${qtyColor};font-weight:bold;">(x${item.quantity})</span> `
                        : '';
                    // REMOVED categoryEmoji from here
                    const formattedPrice = `💰${ShopSystem.utils.formatCurrency(item.price)}`;
                    const itemIndex = pending.items.findIndex(i => i.id === item.id);
                    let prefix = '';
                    let isHighlighted = idsToHighlight.includes(item.id);

                    let itemDetails = `${quantityStr}${item.name} - ${formattedPrice}`; // Item line starts with quantity (if >1)

                    if (isHighlighted) {
                        prefix = '🔄 ';
                        itemDetails = `<span style="color:${newItemColor};">${itemDetails}</span>`;
                    }

                    let itemLine = `• ${prefix}${itemDetails}`;
                    raritySectionContent.push(itemLine);

                    // Add buttons on a new line
                    let buttonLine = '    '; // Indentation
                    if (item.quantity > 1) {
                        buttonLine += `[🎲 Reroll](!shop stock reroll ${itemIndex} ?{How many to reroll|${item.quantity}}) `;
                    } else {
                        buttonLine += `[🎲 Reroll](!shop stock reroll ${itemIndex} 1) `;
                    }
                    buttonLine += `[📝 Qty & Info](!shop stock reroll_qty ${itemIndex})`;
                    raritySectionContent.push(buttonLine);
                });
            });

            // Add the rarity section to the main menu
            menu.push(`{{${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}=${raritySectionContent.join('\n')}}}`);
        });

        menu.push('{{Actions=');
        menu.push('[✅ Add to Current Stock](!shop stock confirm)\n');
        menu.push('[🗑️ Clear & Confirm Stock](!shop stock clear_confirm)\n');
        menu.push('[🔄 Reroll All](!shop stock reroll_all)\n');
        menu.push('[❌ Cancel](!shop stock cancel)');
        menu.push('}}');
        menu.push('{{Note=Review the generated items and use the reroll options to adjust as needed before confirming.}}');

        // Clear the highlight list AFTER generating the menu
        delete pending.justRerolledIds;

        ShopSystem.utils.chat(menu.join(' '), playerID);
    },

    // [TAG: CD_SHOP_QUANTITY_ADJUST] // This is not a few feature?
    RDM_MD_ShowRandomQtyStkAdjMenu: function(index, playerID) {
        if (!ShopSystem.state.pendingStock || !ShopSystem.state.pendingStock.items) {
            ShopSystem.utils.chat("❌ No pending stock to adjust", playerID);
            return;
        }

        const item = ShopSystem.state.pendingStock.items[index];
        if (!item) {
            ShopSystem.utils.chat("❌ Invalid item index", playerID);
            return;
        }

        // Get category and rarity emojis for display
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const categoryEmoji = categoryEmojis[item.category] || "📦";
        const rarityEmoji = CONFIG.DISPLAY.RARITY.EMOJI[item.rarity] || "⚪";
        const formattedPrice = ShopSystem.utils.formatCurrency(item.price);

        // Build detailed item information
        const itemDetails = ShopSystem.utils.ITEM_DISPLAY.formatItemDetails(item);
        itemDetails.unshift(`${categoryEmoji} ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`);
        itemDetails.unshift(`${rarityEmoji} ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}`);
        itemDetails.push(`${ShopSystem.utils.ITEM_DISPLAY.PROPERTY_EMOJI.price} ${formattedPrice}`);

        const menu = [
            "&{template:default}",
            `{{name=📝 Adjust Quantity: ${item.name}}}`,
            `{{Item Details=${itemDetails.join('\n')}}}`,
            `{{Current Quantity=${item.quantity}}}`,
            "{{Adjust=",
            `[➕ Add 1](!shop stock adjust_qty ${index} ${item.quantity + 1})`,
            `[➖ Remove 1](!shop stock adjust_qty ${index} ${Math.max(1, item.quantity - 1)})`,
            // Only show quantity prompt if quantity > 1
            item.quantity > 1 ?
                `[🎲 Reroll Item](!shop stock reroll ${index} ?{How many to reroll|${item.quantity}})` :
                `[🎲 Reroll Item](!shop stock reroll ${index} 1)`,
            "}}",
            "{{Custom=",
            `[Set Custom](!shop stock adjust_qty ${index} ?{New Quantity|${item.quantity}})`,
            "}}",
            "{{Navigation=",
            "[🔙 Back to Review](!shop stock review)",
            "}}",
            item.quantity > 1 ?
                "{{Note=Minimum quantity is 1. Reroll will generate new items while preserving any unselected quantity.}}" :
                "{{Note=Minimum quantity is 1. Reroll will generate a new item.}}"
        ];

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: SHOP_72_generate_random_stock]
    RDML_LOG_GenerateRandomStock: function(category, quantity, minRarity, maxRarity, playerID) {
        const shop = ShopSystem.state.activeShop;
        if (!shop) {
            ShopSystem.utils.chat('❌ No active shop!', playerID);
            return;
        }

        const rarityLevels = ['common', 'uncommon', 'rare', 'very rare', 'legendary'];
        const minRarityLevel = String(minRarity).toLowerCase();
        const maxRarityLevel = String(maxRarity).toLowerCase();
        const minIndex = rarityLevels.indexOf(minRarityLevel);
        const maxIndex = rarityLevels.indexOf(maxRarityLevel);

        // TODO: Add proper range validation for min/max rarity indices

        // DEBUG LOGGING: Check the rarity strings being stored
        ShopSystem.utils.log(`[DEBUG GENERATE STATE] Storing minRarity: '${minRarityLevel}', maxRarity: '${maxRarityLevel}'`, 'debug');

        ShopSystem.state.pendingStock = {
            category,
            quantity,
            minRarity: minRarityLevel,
            maxRarity: maxRarityLevel,
            items: [],
            generationMethod: 'basic'
        };

        ShopSystem.database.listItems(category, 'all').then(items => {
            if (!items.length) { ShopSystem.utils.chat('❌ No items found matching criteria!', playerID); return; }

            const selectedItems = [];
            let attempts = 0;
            const maxAttempts = quantity * 3; // Increased attempts

            while (selectedItems.length < quantity && attempts++ < maxAttempts) {
                const selectedCategory = category === 'all' ? this.RDM_HELP_getRandomCategory() : category.toLowerCase();
                // For basic generation, we don't use location bonus, pass 0
                const selectedRarity = this.RDML_LOG_GetRandomRarity(minRarityLevel, maxRarityLevel, null, 0);
                const availableItems = this.RDM_HELP_getAvailableItems(items, selectedCategory, selectedRarity);

                if (availableItems.length) {
                    const pick = availableItems[Math.floor(Math.random() * availableItems.length)];
                    selectedItems.push({ ...pick, rarity: selectedRarity, category: selectedCategory, quantity: 1, maxStock: 1 });
                } else {
                    // Fallback: Try any rarity within range for the selected category
                    const alt = this.RDM_HELP_tryGetItemFromAnyRarity(items, selectedCategory, rarityLevels, minIndex, maxIndex);
                    if (alt) {
                        selectedItems.push(alt);
                        ShopSystem.utils.log(`Basic Gen: Fallback used for category ${selectedCategory}, picked ${alt.name} (${alt.rarity})`, 'debug');
                     }
                }
            }

            if (selectedItems.length < quantity) {
                ShopSystem.utils.log(`Basic Gen: Warning - Only generated ${selectedItems.length}/${quantity} items after ${maxAttempts} attempts. Database might be sparse for these criteria.`, 'warn');
            }

            if (selectedItems.length === 0) {
                ShopSystem.utils.chat('❌ Could not generate any items based on current settings and database contents.', playerID);
                ShopSystem.state.pendingStock = null; // Clear pending if nothing generated
                return;
            }

            // Combine duplicates and store in pendingStock
            ShopSystem.state.pendingStock.items = selectedItems.reduce((acc, item) => {
                const exist = acc.find(x => x.id === item.id);
                // [FIX]: Update maxStock when combining duplicates
                if (exist) {
                    exist.quantity++;
                    // Increment maxStock when combining
                    exist.maxStock = (exist.maxStock || 0) + 1; 
                } else {
                    // Ensure item added has quantity and maxStock 1 if not already set
                    acc.push({ ...item, quantity: item.quantity || 1, maxStock: item.maxStock || 1 });
                }
                return acc;
            }, []);

            this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
        }).catch(err => {
            ShopSystem.utils.log(`Error generating basic random stock: ${err}`, 'error');
            ShopSystem.utils.chat('❌ Error generating basic random stock.', playerID);
            ShopSystem.state.pendingStock = null; // Clear pending on error
        });
    },

    // [TAG: CD_SHOP_QUANTITY_UPDATE] // This is not a few feature?
    RDML_LOG_AdjustItemQuantity: function(index, newQuantity, playerID) {
        if (!ShopSystem.state.pendingStock || !ShopSystem.state.pendingStock.items) {
            ShopSystem.utils.chat("❌ No pending stock to adjust", playerID);
            return;
        }

        const item = ShopSystem.state.pendingStock.items[index];
        if (!item) {
            ShopSystem.utils.chat("❌ Invalid item index", playerID);
            return;
        }

        // Validate new quantity
        // Rename newQuantity to avoid conflict
        const updatedQty = parseInt(newQuantity); 
        if (isNaN(updatedQty) || updatedQty < 1) {
            ShopSystem.utils.chat("❌ Invalid quantity. Minimum is 1.", playerID);
            return;
        }

        // Update quantity
        ShopSystem.state.pendingStock.items[index].quantity = updatedQty;
        ShopSystem.utils.chat(`✅ Updated quantity of ${item.name} to ${updatedQty}`, playerID);
        
        // Show updated confirmation menu
        this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
    },

    // [TAG: CD_SHOP_STOCK_CONFIRM] // This is not a few feature?
    RDML_LOG_ConfirmRandomStock: function(playerID) {
        if (!ShopSystem.state.pendingStock || !ShopSystem.state.pendingStock.items) {
            ShopSystem.utils.chat("❌ No pending stock to confirm", playerID);
            return;
        }
        if (!ShopSystem.state.activeShop || !ShopSystem.state.activeShop.id) {
            ShopSystem.utils.chat("❌ No active shop selected or shop ID missing", playerID);
            // Clear pending stock even if shop is missing to avoid stale state
            ShopSystem.state.pendingStock = null; 
            return;
        }

        const shop = ShopSystem.state.activeShop;
        const pendingItems = ShopSystem.state.pendingStock.items;
        // [TAG: CD_STOCK_HIGHLIGHT_BATCH] Initialize array to store IDs of modified items
        let modifiedItemIds = [];

        // Ensure inventory object exists on the shop object
        if (!shop.inventory) shop.inventory = {};
        
        // Add items to the shop inventory
        pendingItems.forEach(item => {
            const category = item.category || CONFIG.ITEM.DEFAULT_CATEGORY;
            
            // Ensure the category array exists before trying to access it
            if (!shop.inventory[category]) shop.inventory[category] = [];

            // Find if item already exists in the target category
            const existingItemIndex = shop.inventory[category].findIndex(i => i.id === item.id);

            // ... inside RDML_LOG_ConfirmRandomStock function, within the forEach loop ...
            if (existingItemIndex !== -1) {
                // Item exists, update quantity
                shop.inventory[category][existingItemIndex].quantity += (item.quantity || 1);
                // Add this line to update maxStock as well
                shop.inventory[category][existingItemIndex].maxStock = (shop.inventory[category][existingItemIndex].maxStock || 0) + (item.maxStock || 1); 
            } else {
                // Item doesn't exist, add it (with correct quantity AND maxStock)
                // Ensure the item being pushed includes the maxStock property from the pending item
                shop.inventory[category].push({ 
                    ...item, 
                    quantity: item.quantity || 1, 
                    maxStock: item.maxStock || 1 // Ensure maxStock is copied
                });
            }
            // [TAG: CD_STOCK_HIGHLIGHT_BATCH] Add ID to list for highlighting (unique)
            if (!modifiedItemIds.includes(item.id)) {
                 modifiedItemIds.push(item.id);
            }
            // Remove the old single-item tracking logic if present
            // delete state.ShopSystem.lastModifiedStockItem[shop.id]; 
        });

        // Save shop data
        const shopHandout = getObj("handout", shop.id);
        if (shopHandout) {
            shopHandout.set("gmnotes", JSON.stringify(shop, null, 2));
            ShopSystem.utils.chat("✅ Random stock generation complete!", playerID);
            
            // [TAG: CD_STOCK_HIGHLIGHT_BATCH] Store the list of modified IDs in state
            if (!state.ShopSystem.justAddedStockIds) state.ShopSystem.justAddedStockIds = {};
            state.ShopSystem.justAddedStockIds[shop.id] = modifiedItemIds;
            ShopSystem.utils.log(`[DEBUG STOCK CONFIRM] Stored IDs to highlight: ${modifiedItemIds.join(', ') || 'None'}`, 'debug');

            // Clear pending stock *after* processing and storing IDs
            ShopSystem.state.pendingStock = null;

            // Show the stock management menu (which will use the stored IDs for highlighting)
            this.STKMGM_MD_ShowStockManageMenu(playerID);
        } else {
             ShopSystem.utils.chat("❌ Error saving shop data!", playerID);
             // Clear pending stock even if save fails to avoid stale state
             ShopSystem.state.pendingStock = null;
        }
    },

    // [TAG: CD_SHOP_RANDOM_TYPE_LOCATION_GENERATE]
    RDML_LOG_GenerateAdvancedStock: function(playerID, customItemCount = null) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        const shopType = shop.shop_type || CONFIG.SHOP_SETTINGS.DEFAULTS.SHOP_TYPE;
        const location = shop.location || CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION;

        // Get location settings
        const locationConfig = CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === location) || 
                             CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION);

        // Get shop type weights
        const typeWeights = CONFIG.SHOP_SETTINGS.SHOP_TYPE_WEIGHTS[shopType] || CONFIG.SHOP_SETTINGS.SHOP_TYPE_WEIGHTS["General Store"];

        // Get location rarity bonus
        const rarityBonus = locationConfig.rarityBonus || 0;

        // Calculate total items to generate
        const itemCount = customItemCount || locationConfig.itemCount;
        if (itemCount <= 0) {
            ShopSystem.utils.chat("❌ Invalid item count for generation.", playerID);
            return;
        }

        // Fetch all items from the database once
        ShopSystem.database.listItems('all', 'all').then(allItems => {
            if (!allItems || allItems.length === 0) {
                ShopSystem.utils.chat('❌ No items found in the database!', playerID);
                return;
            }

            const selectedItems = [];
        const totalWeight = Object.values(typeWeights).reduce((sum, weight) => sum + weight, 0);

            let attempts = 0;
            const maxAttempts = itemCount * 3; // Allow more attempts

            // Generate the required number of items
            while (selectedItems.length < itemCount && attempts++ < maxAttempts) {
                // 1. Select category based on shop type weights
                let categoryRoll = Math.random() * totalWeight;
                let selectedCategory = '';
                for (const [cat, weight] of Object.entries(typeWeights)) {
                    categoryRoll -= weight;
                    if (categoryRoll <= 0) {
                        selectedCategory = cat;
                        break;
                    }
                }
                // Fallback if weights are weird
                if (!selectedCategory) {
                    selectedCategory = Object.keys(typeWeights)[0] || CONFIG.ITEM.DEFAULT_CATEGORY;
                }

                // 2. Select rarity based on base chances + location bonus
                // Using full range ('common' to 'legendary') for advanced generation
                const selectedRarity = this.RDML_LOG_GetRandomRarity('common', 'legendary', null, rarityBonus);

                // 3. Find available items matching category and rarity
                const availableItems = this.RDM_HELP_getAvailableItems(allItems, selectedCategory, selectedRarity);

                let pick = null;
                if (availableItems.length > 0) {
                    pick = availableItems[Math.floor(Math.random() * availableItems.length)];
                } else {
                    // Fallback: try any rarity in the same category (within 'common' to 'legendary')
                     const rarityLevels = Object.keys(CONFIG.DISPLAY.RARITY.ORDER);
                     const alt = this.RDM_HELP_tryGetItemFromAnyRarity(allItems, selectedCategory, rarityLevels, 0, rarityLevels.length -1);
                    if (alt) {
                         pick = alt; // Assign the fallback item
                         ShopSystem.utils.log(`Advanced Gen: Fallback used for category ${selectedCategory}, picked ${pick.name} (${pick.rarity})`, 'debug');
                    }
                }

                // Add the picked item if found
                if (pick) {
                    // Ensure the picked item has the correct category/rarity from the selection process
                    // [FIX]: Explicitly add quantity: 1 and maxStock: 1
                    selectedItems.push({ ...pick, category: selectedCategory, rarity: pick.rarity || selectedRarity, quantity: 1, maxStock: 1 });
                }
            }

            if (selectedItems.length < itemCount) {
                 ShopSystem.utils.log(`Advanced Gen: Warning - Only generated ${selectedItems.length}/${itemCount} items after ${maxAttempts} attempts. Database might be sparse for this shop type/location combination.`, 'warn');
            }

            if (selectedItems.length === 0) {
                 ShopSystem.utils.chat('❌ Could not generate any items based on current settings and database contents.', playerID);
                 ShopSystem.state.pendingStock = null; // Clear pending if nothing generated
                 return;
            }

            // Prepare pending stock with generation method
            ShopSystem.state.pendingStock = {
                category: 'all', // Generated across categories
                quantity: itemCount, // Use the target item count
                minRarity: 'common', // Full range was used
                maxRarity: 'legendary',
                generationMethod: 'advanced', // <-- Add this
                items: selectedItems.reduce((acc, item) => {
                    const exist = acc.find(x => x.id === item.id);
                    if (exist) {
                        exist.quantity++;
                        // [FIX]: Update maxStock when combining duplicates
                        exist.maxStock = (exist.maxStock || 0) + 1;
                    } else {
                        // Ensure item has quantity 1 when first added
                        // [FIX]: Ensure maxStock is also set to 1
                        acc.push({ ...item, quantity: 1, maxStock: 1 });
                    }
                    return acc;
                }, [])
            };

            // Show confirmation menu
            this.RDM_MD_ShowRandomStkConfirmMenu(playerID);

        }).catch(err => {
            ShopSystem.utils.log(`Error generating advanced random stock: ${err}`, 'error');
            ShopSystem.utils.chat('❌ Error generating advanced random stock.', playerID);
            ShopSystem.state.pendingStock = null; // Clear pending on error
        });
    },

    // [TAG: SHOP_75_reroll_item]
    RDML_LOG_RerollRandomItem: function(index, rerollQuantity = null, playerID) {
        ShopSystem.utils.log(`--- Reroll Start: Index ${index}, Quantity ${rerollQuantity} ---`, 'debug');
        try { // Add outer try block for better error catching
            if (!ShopSystem.state.pendingStock || !ShopSystem.state.pendingStock.items || index >= ShopSystem.state.pendingStock.items.length || index < 0) {
                ShopSystem.utils.log(`Error: Invalid index or no pending stock. Index: ${index}, Items: ${ShopSystem.state.pendingStock?.items?.length}`, 'error');
                ShopSystem.utils.chat('❌ Invalid item index or no pending stock!', playerID);
                return;
            }
            if (!ShopSystem.state.activeShop) {
                ShopSystem.utils.log('Error: No active shop for reroll.', 'error');
                ShopSystem.utils.chat('❌ No active shop selected!', playerID);
            return;
        }

        const pending = ShopSystem.state.pendingStock;
            const shop = ShopSystem.state.activeShop;
            const oldItem = {...pending.items[index]};
        const originalQuantity = oldItem.quantity || 1;

            const location = shop.location || CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION;
            const locationConfig = CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === location) || {};
            const rarityBonus = locationConfig.rarityBonus || 0;

            rerollQuantity = Math.min(Math.max(1, parseInt(rerollQuantity) || 1), originalQuantity);
        const remainingQuantity = originalQuantity - rerollQuantity;

            ShopSystem.utils.log(`Rerolling ${rerollQuantity} of ${oldItem.name} (Index ${index}). Keeping ${remainingQuantity}. Bonus: ${rarityBonus}`, 'debug');

        const preservedItems = [];
        pending.items.forEach((item, i) => {
            if (i === index) {
                    if (remainingQuantity > 0) preservedItems.push({...item, quantity: remainingQuantity});
            } else {
                preservedItems.push({...item});
            }
        });

            ShopSystem.utils.log(`Fetching items for category: ${oldItem.category}`, 'debug');
        ShopSystem.database.listItems(oldItem.category, 'all').then(items => {
                ShopSystem.utils.log(`Database returned ${items?.length || 0} items for category ${oldItem.category}.`, 'debug');
            if (!items || items.length === 0) {
                     ShopSystem.utils.chat(`❌ No items found in database for category: ${oldItem.category}!`, playerID);
                     // Restore state slightly differently
                     pending.items = preservedItems.concat(remainingQuantity > 0 ? [] : [{...oldItem, quantity: originalQuantity}]);
                     this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
                return;
            }

                const rarityLevels = Object.keys(CONFIG.DISPLAY.RARITY.ORDER);
            const minIndex = rarityLevels.indexOf(pending.minRarity);
            const maxIndex = rarityLevels.indexOf(pending.maxRarity);
                ShopSystem.utils.log(`Filtering alternatives between rarity ${pending.minRarity}(${minIndex}) and ${pending.maxRarity}(${maxIndex})`, 'debug');
            
            let availableItems = [];
            for (let i = minIndex; i <= maxIndex; i++) {
                const rarity = rarityLevels[i];
                const rarityItems = items.filter(item => 
                        item.rarity?.toLowerCase() === rarity && item.id !== oldItem.id
                    );
                     if(rarityItems.length > 0) {
                        ShopSystem.utils.log(`Found ${rarityItems.length} alternatives of rarity ${rarity}`, 'debug');
                        availableItems = availableItems.concat(rarityItems.map(item => ({...item, rarity})));
                    }
                }
                ShopSystem.utils.log(`Total alternatives found: ${availableItems.length}`, 'debug');

            if (availableItems.length === 0) {
                    ShopSystem.utils.chat(`❌ No other items available in category '${oldItem.category}' within the rarity range to reroll into!`, playerID);
                    pending.items = preservedItems.concat(remainingQuantity > 0 ? [] : [{...oldItem, quantity: originalQuantity}]);
                    this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
                return;
            }

                const newlyGeneratedItems = [];
                for (let i = 0; i < rerollQuantity; i++) {
                    ShopSystem.utils.log(`Reroll #${i+1}: Selecting rarity...`, 'debug');
                    const newRarity = this.RDML_LOG_GetRandomRarity(pending.minRarity, pending.maxRarity, null, rarityBonus);
                    ShopSystem.utils.log(`Reroll #${i+1}: Selected rarity ${newRarity}`, 'debug');
                    
                    const itemsOfNewRarity = availableItems.filter(item => item.rarity === newRarity);
                    ShopSystem.utils.log(`Reroll #${i+1}: Found ${itemsOfNewRarity.length} items of rarity ${newRarity}`, 'debug');
                    
                    const newItemPool = itemsOfNewRarity.length > 0 ? itemsOfNewRarity : availableItems;
                    ShopSystem.utils.log(`Reroll #${i+1}: Using pool of ${newItemPool.length} items`, 'debug');
                    
                    if (newItemPool.length > 0) {
                        const newItemIndex = Math.floor(Math.random() * newItemPool.length);
                        const newItem = {...newItemPool[newItemIndex]}; // Make a copy
                        // ADDED maxStock: 1
                        newlyGeneratedItems.push({ ...newItem, quantity: 1, maxStock: 1 }); 
                        ShopSystem.utils.log(`Reroll #${i + 1}: Generated ${newItem.name} (${newItem.rarity})`, 'debug');
                    } else {
                         ShopSystem.utils.log(`Reroll #${i + 1}: Could not find suitable item, skipping.`, 'warn');
                    }
                }

                const newlyGeneratedIds = [...new Set(newlyGeneratedItems.map(item => item.id))];
                // DEBUG LOGGING: Check the generated IDs before assignment
                ShopSystem.utils.log(`[DEBUG REROLL SET] IDs generated by reroll: ${newlyGeneratedIds.join(', ') || 'None'}`, 'debug');

                const combinedItems = [...preservedItems, ...newlyGeneratedItems];
                const finalItems = combinedItems.reduce((acc, item) => {
                    const existingIndex = acc.findIndex(i => i.id === item.id);
                    if (existingIndex !== -1) {
                        acc[existingIndex].quantity = (acc[existingIndex].quantity || 0) + (item.quantity || 1);
                        // [FIX]: Update maxStock when combining duplicates after reroll
                        acc[existingIndex].maxStock = (acc[existingIndex].maxStock || 0) + (item.maxStock || 1);
                    } else {
                        // Ensure item added has quantity and maxStock if not already set (should have it from generation)
                        acc.push({ ...item, quantity: item.quantity || 1, maxStock: item.maxStock || 1 });
                    }
                    return acc;
                }, []);
                
                ShopSystem.utils.log(`Final item list size before update: ${finalItems.length}`, 'debug');

                pending.items = finalItems;
                pending.justRerolledIds = newlyGeneratedIds;
                // DEBUG LOGGING: Confirm state assignment
                ShopSystem.utils.log(`[DEBUG REROLL SET] Assigned to pending.justRerolledIds: ${pending.justRerolledIds?.join(', ') || 'None'}`, 'debug');

            pending.items.sort(this.RDML_LOG_SortByRandomRarity);
                ShopSystem.utils.log('=== Individual Reroll Complete ===', 'debug');
                this.RDM_MD_ShowRandomStkConfirmMenu(playerID); // Call display AFTER setting state

        }).catch(error => {
                 ShopSystem.utils.log(`Error during database fetch or processing in reroll: ${error.message}`, 'error');
                 ShopSystem.utils.log(error.stack, 'error'); // Log stack trace
            ShopSystem.utils.chat('❌ Error rerolling item. Check the logs for details.', playerID);
                 pending.items = preservedItems.concat(remainingQuantity > 0 ? [] : [{...oldItem, quantity: originalQuantity}]); // Restore original
                 delete pending.lastRerolledItemId;
            this.RDM_MD_ShowRandomStkConfirmMenu(playerID);
            });
        } catch (outerError) { // Catch errors before the promise
             ShopSystem.utils.log(`Error setting up reroll: ${outerError.message}`, 'error');
             ShopSystem.utils.log(outerError.stack, 'error'); // Log stack trace
             ShopSystem.utils.chat('❌ Error initiating reroll. Check the logs for details.', playerID);
             // Attempt to restore original state if possible
             if(ShopSystem.state.pendingStock && ShopSystem.state.pendingStock.items && index < ShopSystem.state.pendingStock.items.length) {
                 const pending = ShopSystem.state.pendingStock;
                 this.RDM_MD_ShowRandomStkConfirmMenu(playerID); // Show menu again with original items
             }
        }
    },

    // [TAG: SHOP_3300_get_random_rarity] // Unified random rarity helper
    // Accepts an optional rarityWeightsOverride for shop-type weighting and rarityBonus for location adjustment
    RDML_LOG_GetRandomRarity: function(minRarity, maxRarity, rarityWeightsOverride = null, rarityBonus = 0) {
        const rarityOrder = CONFIG.DISPLAY.RARITY.ORDER;
        // Use override if provided, otherwise fall back to global stock-generation chances
        const baseWeights = rarityWeightsOverride || CONFIG.SHOP_SETTINGS.STOCK_GENERATION.RARITY_CHANCES;
        const adjustedWeights = {};
        let totalAdjustedWeight = 0;

        // Get valid rarities in range
        const validRarities = Object.keys(rarityOrder).filter(rarity =>
            rarityOrder[rarity] >= rarityOrder[minRarity] &&
            rarityOrder[rarity] <= rarityOrder[maxRarity]
        );

        // Calculate adjusted weights based on bonus
        validRarities.forEach(rarity => {
            const baseWeight = baseWeights[rarity] || 0;
            // Simple adjustment: Add bonus/penalty directly to the weight
            // Ensure weight doesn't drop below a minimum (e.g., 0.1) to allow rare items a chance even with penalties
            adjustedWeights[rarity] = Math.max(0.1, baseWeight + rarityBonus);
            totalAdjustedWeight += adjustedWeights[rarity];
        });

        // If total weight is somehow zero, fallback to equal chance
        if (totalAdjustedWeight <= 0) {
            ShopSystem.utils.log("Warning: Total adjusted rarity weight is zero. Falling back to equal chance.", "warn");
            return validRarities[Math.floor(Math.random() * validRarities.length)] || minRarity;
        }

        // Roll for rarity based on adjusted weights
        let roll = Math.random() * totalAdjustedWeight;
        for (const rarity of validRarities) {
            roll -= adjustedWeights[rarity];
            if (roll <= 0) {
                return rarity;
            }
        }

        // Fallback to minimum if something went wrong
        return minRarity;
    },

    // [TAG: SHOP_RANDOM_HELPERS_01] Helper: pick a random category
    RDM_HELP_getRandomCategory: function() {
        const cats = CONFIG.ITEM.CATEGORIES;
        return cats[Math.floor(Math.random() * cats.length)];
    },

    // [TAG: SHOP_RANDOM_HELPERS_02] Helper: filter items by category and rarity
    RDM_HELP_getAvailableItems: function(items, category, rarity) {
        return items.filter(item => item.category === category && item.rarity.toLowerCase() === rarity);
    },

    // [TAG: SHOP_RANDOM_HELPERS_03] Helper: fallback find any item from valid rarity range
    RDM_HELP_tryGetItemFromAnyRarity: function(items, category, rarityLevels, minIndex, maxIndex) {
        const validRarities = rarityLevels.slice(minIndex, maxIndex + 1).sort(() => Math.random() - 0.5);
        for (let rar of validRarities) {
            const list = this.RDM_HELP_getAvailableItems(items, category, rar);
            if (list.length) {
                // ADDED maxStock: 1
                return { ...list[Math.floor(Math.random() * list.length)], rarity: rar, category: category, quantity: 1, maxStock: 1 }; 
            }
        }
        return null;
    },

    // [TAG: SHOP_3338_sort_by_rarity] // These numbers are not linked to anything
    RDML_LOG_SortByRandomRarity: function(a, b) {
        const rarityOrder = CONFIG.DISPLAY.RARITY.ORDER;
        if (a.rarity !== b.rarity) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return a.name.localeCompare(b.name);
    },

    // [TAG: CD_SHOP_INVENTORY_STATS]
    STAT_LOG_CalcInventoryStats: function(shopData) {
        if (!shopData.inventory) return null;
        
        const stats = {
            totalItems: 0,
            categories: {}
        };
        
        // Initialize categories with empty stats
        Object.keys(shopData.inventory).forEach(category => {
            stats.categories[category] = {
                total: 0,
                inStock: 0,
                outOfStock: 0,
                byRarity: {},
                valueRange: { min: Infinity, max: -Infinity }
            };
        });
        
        // Process each category
        Object.entries(shopData.inventory).forEach(([category, items]) => {
            if (!Array.isArray(items)) return;
            
            items.forEach(item => {
                // Get item quantity, default to 1 if missing or invalid
                const quantity = Math.max(1, parseInt(item.quantity) || 1); 
                
                // Count total UNITS (items * quantity)
                stats.totalItems += quantity;
                
                // Update category stats
                const catStats = stats.categories[category];
                catStats.total += quantity; // Count total UNITS per category
                
                // Track stock status based on quantity > 0
                if (quantity > 0) {
                    // For inStock/outOfStock, we still count unique item entries
                    catStats.inStock++;
                } else {
                    catStats.outOfStock++;
                }
                
                // Track rarity distribution based on UNITS
                const rarity = item.rarity || 'common';
                catStats.byRarity[rarity] = (catStats.byRarity[rarity] || 0) + quantity; // Count total UNITS per rarity
                
                // Track value range (based on item price, not quantity)
                const itemValue = ShopSystem.utils.toCopper(item.price);
                if (itemValue < catStats.valueRange.min) catStats.valueRange.min = itemValue;
                if (itemValue > catStats.valueRange.max) catStats.valueRange.max = itemValue;
            });
        });
        
        return stats;
    },

    // [TAG: CD_SHOP_FORMAT_INVENTORY_OVERVIEW]
    STAT_LOG_FormatInventoryView: function(shopData) {
        const stats = this.STAT_LOG_CalcInventoryStats(shopData);
        if (!stats) return "No inventory data available.";
        
        // category emojis as config? - come back to this
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        
        let overview = [`📦 Total Items: ${stats.totalItems}`];
        
        // Add separator
        overview.push("-------------------");
        
        // Process each category
        Object.entries(stats.categories).forEach(([category, catStats]) => {
            if (catStats.total === 0) return; // Skip empty categories
            
            const emoji = categoryEmojis[category] || "📦";
            overview.push(`${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} (${catStats.total})`);
            
            // Add rarity breakdown
            Object.entries(catStats.byRarity)
                .sort(([a], [b]) => CONFIG.DISPLAY.RARITY.ORDER[a] - CONFIG.DISPLAY.RARITY.ORDER[b])
                .forEach(([rarity, count]) => {
                    const rarityEmoji = CONFIG.DISPLAY.RARITY.EMOJI[rarity] || "⚪";
                    overview.push(`  ${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${count}`);
                });
            
            // Add value range if items exist
            if (catStats.total > 0 && catStats.valueRange.max >= 0) {
                const minPrice = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(catStats.valueRange.min));
                const maxPrice = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(catStats.valueRange.max));
                overview.push(`  💰 Value Range: ${minPrice} - ${maxPrice}`);
            }
            
            // Add stock status
            if (catStats.outOfStock > 0) {
                overview.push(`  📊 Stock: ${catStats.inStock} in stock, ${catStats.outOfStock} out of stock`);
            }
            
            // Add browse link
            overview.push(`  [📋 Browse ${category}](!shop browse ${category})`);
            overview.push(""); // Add blank line between categories
        });
        
        return overview.join("\n");
    },

    // [TAG: CD_CHANCE_GENERATOR_FN]
    RDML_LOG_GenerateChanceBasedStock: function(playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        const shopType = shop.shop_type || CONFIG.SHOP_SETTINGS.DEFAULTS.SHOP_TYPE;
        const location = shop.location || CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION;

        ShopSystem.utils.log(`Starting Chance-Based Generation for ${shop.name} (Type: ${shopType}, Location: ${location})`, 'info');

        // --- Get Configuration ---
        const locationConfig = CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === location) || 
                             CONFIG.SHOP_SETTINGS.LOCATIONS.find(loc => loc.name === CONFIG.SHOP_SETTINGS.DEFAULTS.LOCATION);
        const typeWeights = CONFIG.SHOP_SETTINGS.SHOP_TYPE_WEIGHTS[shopType] || CONFIG.SHOP_SETTINGS.SHOP_TYPE_WEIGHTS["General Store"];
        const rarityBonus = locationConfig?.rarityBonus || 0;
        const baseLegendaryChance = CONFIG.SHOP_SETTINGS.STOCK_GENERATION.BASE_LEGENDARY_CHANCE || 0;
        // Path corrected based on current config structure
        const quantityDiceConfig = CONFIG.SHOP_SETTINGS.STOCK.DEFAULT_QUANTITY || {}; // Corrected path again
        const raritiesToGenerate = ["common", "uncommon", "rare", "very rare"];

        // Fetch all items from the database once
        ShopSystem.database.listItems('all', 'all').then(allItems => {
            if (!allItems || allItems.length === 0) {
                ShopSystem.utils.chat('❌ No items found in the database!', playerID);
                return;
            }

            const generatedItems = [];
            const totalWeight = Object.values(typeWeights).reduce((sum, weight) => sum + weight, 0);

            // --- Legendary Item Check (Modified Logic) ---
            // 1. Pick category based on weights
            let categoryRoll = Math.random() * totalWeight;
            let selectedCategory = '';
            for (const [cat, weight] of Object.entries(typeWeights)) {
                categoryRoll -= weight;
                if (categoryRoll <= 0) {
                    selectedCategory = cat;
                    break;
                }
            }
            selectedCategory = selectedCategory || Object.keys(typeWeights)[0] || CONFIG.ITEM.DEFAULT_CATEGORY;

            // 2. Find a legendary item in that category
            const legendaryItemsInCategory = allItems.filter(item => item.rarity === 'legendary' && item.category === selectedCategory);
            
            if (legendaryItemsInCategory.length > 0) {
                const legendaryItem = legendaryItemsInCategory[Math.floor(Math.random() * legendaryItemsInCategory.length)];
                
                // 3. Calculate effective chance of quantity being 1
                const combinedConfigChance = Math.max(0, Math.min(100, baseLegendaryChance + rarityBonus)) / 100; // Chance from 0.0 to 1.0
                const baseQuantitySuccessRate = 0.5; // Base 50% chance from "1d2-1"
                const effectiveQuantitySuccessRate = baseQuantitySuccessRate * combinedConfigChance;
                
                ShopSystem.utils.log(`Legendary Check: BaseChance=${baseLegendaryChance}, Bonus=${rarityBonus}, Combined=${(combinedConfigChance*100).toFixed(1)}%`, 'debug');
                ShopSystem.utils.log(`Legendary Quantity: BaseSuccess=50%, EffectiveSuccess=${(effectiveQuantitySuccessRate*100).toFixed(1)}%`, 'debug');

                // 4. Roll against the effective rate
                let legendaryQuantity = 0;
                if (Math.random() < effectiveQuantitySuccessRate) {
                    legendaryQuantity = 1;
                    ShopSystem.utils.log(` -> Quantity Roll Succeeded (Rolled < ${effectiveQuantitySuccessRate.toFixed(3)}), Quantity = 1`, 'debug');
                } else {
                    ShopSystem.utils.log(` -> Quantity Roll Failed (Rolled >= ${effectiveQuantitySuccessRate.toFixed(3)}), Quantity = 0`, 'debug');
                }
                
                // 5. Add item if quantity is > 0
                if (legendaryQuantity > 0) {
                    generatedItems.push({ ...legendaryItem, quantity: legendaryQuantity, maxStock: legendaryQuantity, category: selectedCategory, rarity: 'legendary' }); 
                    ShopSystem.utils.log(`   -> Added Legendary: ${legendaryItem.name} (Category: ${selectedCategory}, MaxStock: ${legendaryQuantity})`, 'debug'); 
                } else {
                    ShopSystem.utils.log(`   -> Legendary item ${legendaryItem.name} resulted in quantity 0, not adding.`, 'debug');
                }
            } else {
                ShopSystem.utils.log(`Legendary Check: No legendary items found in selected category: ${selectedCategory}.`, 'warn');
            }
            // --- End Legendary Item Check ---

            // --- Generate Items for Other Rarities ---
            raritiesToGenerate.forEach(rarity => {
                const quantityNotation = quantityDiceConfig[rarity];
                if (!quantityNotation) {
                    ShopSystem.utils.log(`No quantity dice notation found for rarity: ${rarity}`, 'warn');
                    return; // Skip this rarity if no config
                }
                
                const numberOfItemsToGenerate = ShopSystem.utils.rollDice(quantityNotation);
                ShopSystem.utils.log(`Generating ${numberOfItemsToGenerate} items for rarity: ${rarity} (Dice: ${quantityNotation})`, 'debug');

                for (let i = 0; i < numberOfItemsToGenerate; i++) {
                    // Select category based on weights
                    let categoryRoll = Math.random() * totalWeight;
                    let selectedCategory = '';
                    for (const [cat, weight] of Object.entries(typeWeights)) {
                        categoryRoll -= weight;
                        if (categoryRoll <= 0) {
                            selectedCategory = cat;
                            break;
                        }
                    }
                    selectedCategory = selectedCategory || Object.keys(typeWeights)[0] || CONFIG.ITEM.DEFAULT_CATEGORY;

                    // Find available items matching category and rarity
                    const availableItems = allItems.filter(item => item.rarity === rarity && item.category === selectedCategory);

                    if (availableItems.length > 0) {
                        const pickedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                         ShopSystem.utils.log(` -> Picked (${rarity}/${selectedCategory}): ${pickedItem.name}`, 'debug');
                        // Add with quantity 1 initially, duplicates will be combined later
                        generatedItems.push({ ...pickedItem, quantity: 1, maxStock: 1, category: selectedCategory, rarity: rarity }); 
                    } else {
                        // Optional: Add fallback logic here if needed (e.g., try another category)
                        ShopSystem.utils.log(` -> No items found for ${rarity}/${selectedCategory}. Skipping this slot.`, 'debug');
                    }
                }
            });

            // --- Combine Duplicates ---
            const combinedItems = generatedItems.reduce((acc, item) => {
                const existing = acc.find(i => i.id === item.id);
                if (existing) {
                    existing.quantity += item.quantity;
                    // If combining, also add to the maxStock?
                    // Decision: Let's assume combining duplicates *does* increase maxStock target.
                    existing.maxStock = (existing.maxStock || 0) + (item.maxStock || 1);
                } else {
                    // Ensure maxStock is present when adding new item
                    acc.push({ ...item, maxStock: item.maxStock || 1 }); 
                }
                return acc;
            }, []);

            if (combinedItems.length === 0) {
                ShopSystem.utils.chat('❌ Could not generate any items based on current settings and database contents.', playerID);
                ShopSystem.state.pendingStock = null; // Clear pending if nothing generated
                return;
            }

            // --- Store Pending Stock ---
            ShopSystem.state.pendingStock = {
                category: 'all', // Indicate generated across multiple categories/rarities
                quantity: combinedItems.reduce((sum, item) => sum + item.quantity, 0), // Total units
                minRarity: 'common', // Reflects potential range generated
                maxRarity: 'legendary',
                generationMethod: 'chance', // Mark the method used
                items: combinedItems
            };

            ShopSystem.utils.log('Chance-Based Generation Complete. Showing Confirmation Menu.', 'info');
            // Show confirmation menu
            this.RDM_MD_ShowRandomStkConfirmMenu(playerID);

        }).catch(err => {
            ShopSystem.utils.log(`Error generating chance-based stock: ${err}`, 'error');
            ShopSystem.utils.chat('❌ Error generating chance-based stock.', playerID);
            ShopSystem.state.pendingStock = null; // Clear pending on error
        });
    },

    // [TAG: CD_SHOP_BROWSE_CATEGORY_ITEMS]
    STKACT_MD_ShowShopCategoryItems: function(category, playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }
        const shop = ShopSystem.state.activeShop;
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;
        const rarityOrder = CONFIG.DISPLAY.RARITY.ORDER;
        const categoryDisplayName = category.charAt(0).toUpperCase() + category.slice(1);

        let itemsToShow = [];
        if (category === 'all') {
            // Combine items from all categories
            Object.values(shop.inventory).forEach(catItems => {
                if (Array.isArray(catItems)) {
                    itemsToShow = itemsToShow.concat(catItems);
                }
            });
        } else if (shop.inventory[category] && Array.isArray(shop.inventory[category])) {
            itemsToShow = shop.inventory[category];
        } else {
            itemsToShow = []; // Ensure it's an empty array if category doesn't exist
        }

        const menu = [
            "&{template:default}",
            `{{name=${category === 'all' ? '📦 All Items' : `${categoryEmojis[category] || '📦'} ${categoryDisplayName}`}}} ` // Add space for title
        ];

        if (itemsToShow.length === 0) {
            menu.push(`{{No items found in ${categoryDisplayName}.}}`);
        } else {
            // Sort items by rarity, then name
            itemsToShow.sort((a, b) => {
                const orderA = rarityOrder[a.rarity] ?? -1;
                const orderB = rarityOrder[b.rarity] ?? -1;
                if (orderA !== orderB) return orderA - orderB;
                return a.name.localeCompare(b.name);
            });

            // Group by rarity
            const itemsByRarity = {};
            itemsToShow.forEach(item => {
                const rarity = item.rarity || 'common';
                if (!itemsByRarity[rarity]) {
                    itemsByRarity[rarity] = [];
                }
                itemsByRarity[rarity].push(item);
            });

            // Display items grouped by rarity
            Object.keys(itemsByRarity).sort((a, b) => rarityOrder[a] - rarityOrder[b]).forEach(rarity => {
                const itemsInRarity = itemsByRarity[rarity];
                const rarityEmoji = rarityEmojis[rarity] || "⚪";
                const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
                let raritySection = [];

                // [TAG: CD_SHOP_BROWSE_GROUP_BY_CATEGORY_001] Group items within rarity by category
                const itemsByCategory = {};
                itemsInRarity.forEach(item => {
                    const itemCategory = item.category || CONFIG.ITEM.DEFAULT_CATEGORY;
                    if (!itemsByCategory[itemCategory]) itemsByCategory[itemCategory] = [];
                    itemsByCategory[itemCategory].push(item);
                });

                // Sort categories based on config order
                const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
                    return CONFIG.ITEM.CATEGORIES.indexOf(a) - CONFIG.ITEM.CATEGORIES.indexOf(b);
                });

                // Add category headers and items
                sortedCategories.forEach(cat => {
                    const categoryItems = itemsByCategory[cat];
                    const categoryEmoji = categoryEmojis[cat] || "📦";
                    const categoryHeader = `${categoryEmoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
                    // [TAG: CD_SHOP_BROWSE_CAT_HEADER_COLOR_001] Add blue color to category header
                    raritySection.push(`<span style="color:#3399FF;font-weight:bold;">${categoryHeader}</span>`);

                    // Add item lines for this category
                    categoryItems.forEach(item => {
                        const priceStr = ShopSystem.utils.formatCurrency(item.price);
                        const qtyColor = '#FF8C00'; // Orange color for quantity/stock status
                        let stockDisplay;

                        if (item.quantity === 0) {
                            // Out of stock: show (🔴/max) Out of Stock in orange
                            const maxStockDisplay = item.maxStock !== undefined ? item.maxStock : '?';
                            stockDisplay = `<span style="color:${qtyColor};font-weight:bold;">(🔴/${maxStockDisplay}) Out of Stock</span>`;
                        } else {
                            // In stock: show (current/max) in orange
                            stockDisplay = `<span style="color:${qtyColor};font-weight:bold;">(${item.quantity}/${item.maxStock ?? item.quantity})</span>`;
                        }

                        // Line 1: Stock Status, Name, Price
                        raritySection.push(`• ${stockDisplay} ${item.name} - 💰${priceStr}`);
                        // Line 2: Buttons (Add and Info)
                        // Pass item's actual category for the View Item back button
                        raritySection.push(`  [🛒 Add](!shop basket add ${item.id} 1) [ℹ️ Info](!shop stock view_item ${item.id} ${item.category || 'all'})`); 
                    });
                });

                menu.push(`{{${rarityEmoji} ${rarityName}=${raritySection.join('\n')}}}`);
            });
        }

        // Navigation
        menu.push("{{Navigation=");
        menu.push("[🧺 View Basket](!shop basket view) ");
        menu.push("[🔙 Back to Shop](!shop)");
        menu.push("}}");

        ShopSystem.utils.chat(menu.join(" "), playerID);
    },

    // [TAG: CD_SHOP_VIEW_ITEM_MENU] // New function for viewing item details before adding to stock
    STKMGM_MD_ShowViewItemMenu: function(itemId, category, playerID, msg) { 
        // Fetch item details from the database
        ShopSystem.database.listItems('all', 'all').then(items => {
            const item = items.find(i => i.id === itemId);
            if (!item) {
                ShopSystem.utils.chat(`❌ Item not found in database: ${itemId}`, playerID);
                return;
            }

            // Get current quantity from active shop inventory
            let currentShopQuantity = 0;
            if (ShopSystem.state.activeShop && ShopSystem.state.activeShop.inventory) {
                const shop = ShopSystem.state.activeShop;
                const itemCategory = item.category || CONFIG.ITEM.DEFAULT_CATEGORY; // Use item's category
                if (shop.inventory[itemCategory]) {
                    const shopItem = shop.inventory[itemCategory].find(i => i.id === itemId);
                    if (shopItem) {
                        currentShopQuantity = shopItem.quantity || 0;
                    }
                }
            }

            // Get category and rarity emojis for display
            const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
            const categoryEmoji = categoryEmojis[item.category] || "📦";
            const rarityEmoji = CONFIG.DISPLAY.RARITY.EMOJI[item.rarity] || "⚪";
            const formattedPrice = ShopSystem.utils.formatCurrency(item.price);

            // Determine if the viewer is a GM
            const isGM = msg && ShopSystem.utils.isGM(msg); 

            // Build detailed item information using our utility
            const itemDetails = ShopSystem.utils.ITEM_DISPLAY.formatItemDetails(item);
            itemDetails.unshift(`${categoryEmoji} ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`);
            itemDetails.unshift(`${rarityEmoji} ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}`);
            itemDetails.push(`${ShopSystem.utils.ITEM_DISPLAY.PROPERTY_EMOJI.price} ${formattedPrice}`);

            const menu = [
                '&{template:default}',
                `{{name=🔎 View Item: ${item.name}}}`, 
                `{{Item Details=${itemDetails.join('\n')}}}`, 
                `{{Description=${item.description || 'No description available'}}}`, 
                // Add Current Stock display with color
                `{{Quantity in Stock=<span style="color:#FF8C00;font-weight:bold;">${currentShopQuantity}</span>}}`, 
                "{{Actions=",
                ...(isGM ? [
                    // GM Add Actions (add directly to stock) - Always available for GMs
                        `[➕ Add 1 to Stock](!shop stock add_item ${itemId} 1)`,
                        `[➕ Add 5 to Stock](!shop stock add_item ${itemId} 5)`,
                        `[➕ Add Custom to Stock](!shop stock add_item ${itemId} ?{Quantity|1})`,
                        `[💰&➕ Set Price & Add Custom](!shop stock add_item_custom_price ${itemId} ?{Price GP|${(ShopSystem.utils.toCopper(item.price) / CONFIG.CURRENCY.COPPER_PER_GOLD).toFixed(2)}} ?{Quantity|1})`
                    ] : (
                    // Player Add Actions (add to basket) - Only show if in stock
                    currentShopQuantity > 0 ? [
                        `[🛒 Add 1 to Basket](!shop basket add ${itemId} 1)`,
                        `[🛒 Add 5 to Basket](!shop basket add ${itemId} 5)`,
                        `[🛒 Add Custom to Basket](!shop basket add ${itemId} ?{Quantity|1})`
                    ] : [
                        '<span style="color:#FF3333;font-weight:bold;">-- Out of Stock --</span>' // Message when out of stock, now in red
                    ]
                )),
                "}}", // Close Actions section
                "{{Navigation=",
                // Use !shop browse all for players, !shop stock add [category] for GMs
                isGM
                    ? `[🔙 Back to Add Items (${category})](!shop stock add ${category})`
                    : `[🧺 Back to Basket](!shop basket view) [🔙 Back to Browse All](!shop browse all)`,
                "}}",
                // Update note based on viewer
                isGM ? "{{Note=Select an action to add this item to the shop stock.}}" : "{{Note=Select an action to add this item to your basket.}}"
            ].filter(line => line).join(' '); // Filter out empty strings from conditional button

            ShopSystem.utils.chat(menu, playerID);
        }).catch(error => {
            ShopSystem.utils.log(`Error fetching item details: ${error.message}`, 'error');
            ShopSystem.utils.chat('❌ Error viewing item details.', playerID);
        });
    },

    // [TAG: CD_SHOP_SET_MAX_STOCK] // New function to handle setting max stock
    STKACT_LOG_SetMaxStock: function(itemId, newMaxStockStr, playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop selected!', playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        let item = null;
        let itemCategory = '';
        let itemIndex = -1;

        // Find the item
        for (const category in shop.inventory) {
            if (Array.isArray(shop.inventory[category])) {
                const index = shop.inventory[category].findIndex(i => i.id === itemId);
                if (index !== -1) {
                    item = shop.inventory[category][index];
                    itemCategory = category;
                    itemIndex = index;
                    break;
                }
            }
        }

        if (!item) {
            ShopSystem.utils.chat('❌ Item not found!', playerID);
            return;
        }

        // Validate new max stock
        const newMaxStock = parseInt(newMaxStockStr);
        if (isNaN(newMaxStock) || newMaxStock < 0) {
            ShopSystem.utils.chat('❌ Invalid max stock. Please enter 0 or a positive number.', playerID);
            this.STKMGM_MD_ShowEditMenu(itemId, playerID); // Show menu again
            return;
        }

        // Update or remove item
        if (newMaxStock === 0) {
            // Remove the item entirely
            shop.inventory[itemCategory].splice(itemIndex, 1);
            ShopSystem.utils.chat(`✅ Removed ${item.name} from stock as max stock was set to 0.`, playerID);
        } else {
            item.maxStock = newMaxStock;
            // Ensure current quantity doesn't exceed new max stock
            if (item.quantity > newMaxStock) {
                item.quantity = newMaxStock;
                ShopSystem.utils.chat(`✅ Updated max stock of ${item.name} to ${newMaxStock}. Current quantity adjusted to match.`, playerID);
            } else {
                ShopSystem.utils.chat(`✅ Updated max stock of ${item.name} to ${newMaxStock}.`, playerID);
            }
        }

        // Save shop data
        const handout = getObj('handout', shop.id);
        if (handout) {
            handout.set('gmnotes', JSON.stringify(shop, null, 2));
            // If item still exists, show edit menu again, otherwise show main stock menu
            if (newMaxStock > 0) {
                this.STKMGM_MD_ShowEditMenu(itemId, playerID);
            } else {
                this.STKMGM_MD_ShowStockManageMenu(playerID);
            }
        } else {
            ShopSystem.utils.chat('❌ Error: Shop handout not found!', playerID);
        }
    },

    // [TAG: CD_SHOP_SET_CURRENT_QTY] // New function to handle setting current quantity
    STKACT_LOG_SetCurrentQuantity: function(itemId, newCurrentQtyStr, playerID) {
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop selected!', playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        let item = null;

        // Find the item
        for (const category in shop.inventory) {
            if (Array.isArray(shop.inventory[category])) {
                const foundItem = shop.inventory[category].find(i => i.id === itemId);
                if (foundItem) {
                    item = foundItem;
                    break;
                }
            }
        }

        if (!item) {
            ShopSystem.utils.chat('❌ Item not found!', playerID);
            return;
        }

        // Validate new current quantity
        const newCurrentQty = parseInt(newCurrentQtyStr);
        if (isNaN(newCurrentQty) || newCurrentQty < 0) {
            ShopSystem.utils.chat('❌ Invalid quantity. Please enter 0 or a positive number.', playerID);
            this.STKMGM_MD_ShowEditMenu(itemId, playerID); // Show menu again
            return;
        }

        // Get max stock, default to new quantity if missing (should ideally not happen now)
        const maxStock = item.maxStock || newCurrentQty;
        if (item.maxStock === undefined) {
            ShopSystem.utils.log(`Warning: Item ${item.name} (${itemId}) missing maxStock. Setting to ${newCurrentQty}.`, 'warn');
            item.maxStock = newCurrentQty; // Ensure maxStock exists
        }


        // Cap quantity at maxStock
        const cappedQuantity = Math.min(newCurrentQty, maxStock);
        let message = `✅ Updated current quantity of ${item.name} to ${cappedQuantity}.`;
        if (newCurrentQty > maxStock) {
             message += ` (Note: Input ${newCurrentQty} exceeded Max Stock of ${maxStock})`;
        }

        item.quantity = cappedQuantity;
        ShopSystem.utils.chat(message, playerID);


        // Save shop data
        const handout = getObj('handout', shop.id);
        if (handout) {
            handout.set('gmnotes', JSON.stringify(shop, null, 2));
            this.STKMGM_MD_ShowEditMenu(itemId, playerID); // Refresh edit menu
        } else {
            ShopSystem.utils.chat('❌ Error: Shop handout not found!', playerID);
        }
    },

    // [TAG: SELL_01_START_PROCESS] // Updated to use active character if available
    SELL_LOG_StartSellProcess: function(playerID) {
        ShopSystem.utils.log(`Starting sell process for player ${playerID}`, "info");

        // --- CHECK FOR ACTIVE CHARACTER FIRST ---
        const activeCharId = state.ShopSystem.activeCharacters?.[playerID];
        if (activeCharId) {
            const activeChar = getObj('character', activeCharId);
            if (activeChar) {
                ShopSystem.utils.log(`Using active character ${activeChar.get('name')} (${activeCharId}) for selling.`, "debug");
                this.SELL_LOG_DisplayInventory(playerID, activeCharId);
                return; // Skip the rest of the selection process
            } else {
                ShopSystem.utils.log(`Active character ID ${activeCharId} not found. Proceeding to selection.`, "warn");
                // Clear the invalid active character? Optional, might be safer.
                // delete state.ShopSystem.activeCharacters[playerID]; 
            }
        }
        // --- END ACTIVE CHARACTER CHECK ---

        // --- Fallback to original logic if no active character ---
        ShopSystem.utils.log(`No active character found for player ${playerID}. Finding controlled characters...`, "debug");
        const player = getObj('player', playerID);
        if (!player) {
            ShopSystem.utils.chat("❌ Player not found", playerID);
            return;
        }
        
        // Get all character sheets
        const allCharacters = findObjs({
            _type: 'character'
        });
        
        // Filter for controlled characters
        const controlledCharacters = allCharacters.filter(char => {
            const controlledBy = char.get('controlledby');
            return controlledBy && (
                controlledBy.split(',').includes(playerID) || 
                controlledBy.includes('all')
            );
        });
        
        ShopSystem.utils.log(`Found ${controlledCharacters.length} controlled characters for player ${playerID}`, "debug");
        
        // Handle character selection
        if (controlledCharacters.length === 0) {
            ShopSystem.utils.chat("❌ You don't have any characters to sell from", playerID);
            return;
        } else if (controlledCharacters.length === 1) {
            // Only one character, show inventory directly
            const charId = controlledCharacters[0].id;
            // Store this as the active character for selling now
            state.ShopSystem.activeCharacters[playerID] = charId;
            this.SELL_LOG_DisplayInventory(playerID, charId);
        // ... (if (controlledCharacters.length === 0) and else if (controlledCharacters.length === 1) blocks remain the same) ...
        } else {
            // Multiple characters, show selection menu
            ShopSystem.utils.log(`Multiple characters found for ${playerID} to sell from. Building selection menu.`, 'debug');
            let menuPreamble = `&{template:default} {{name=Select Character For Selling}}`;
            let characterEntries = []; // Store each character's full entry
            let charactersProcessed = 0;
            const totalCharacters = controlledCharacters.length;

            if (totalCharacters === 0) {
                ShopSystem.utils.chat(menuPreamble + "{{Info=No characters to sell from.}}", playerID);
                return;
            }

            controlledCharacters.forEach(char => {
                const charId = char.get('_id');
                const charName = char.get('name') || 'Unnamed Character';

                ShopSystem.utils.getCharacterTokenImgTagAsync(charId, charName, 'width: 25px; height: 25px; vertical-align: middle; margin-right: 5px; border-radius: 3px;', (imgTag) => {
                    characterEntries.push(`{{${charName}=${imgTag} [Sell From This Character](!shop sell from ${charId})}}`);
                    charactersProcessed++;

                    if (charactersProcessed === totalCharacters) {
                        let finalMenu = menuPreamble + characterEntries.join('');
                        ShopSystem.utils.chat(finalMenu, playerID);
                    }
                });
            });
        }
    },
    
    // [TAG: SELL_LOG_CATEGORY]
    SELL_LOG_DetermineCategory: function(item) {
        const name = (item.name || '').toLowerCase();

        // Check for weapons
        if (item.weaponData && (
            item.weaponData.category === "Melee" || 
            item.weaponData.category === "Ranged"
        )) {
            return 'weapons';
        }

        // Check for armor and wearables
        if (item.armorData || 
            (item.description && item.description.includes("Armor Class")) ||
            (CONFIG.DISPLAY.SELL_CATEGORIES["Armor & Attire"].identifiers && 
             CONFIG.DISPLAY.SELL_CATEGORIES["Armor & Attire"].identifiers.some(type => name.includes(type)))) {
            return 'Armor & Attire';
        }

        // Check for scrolls
        if (name.includes('scroll')) {
            return 'scrolls';
        }

        // Check for potions
        if (name.includes('potion')) {
            return 'potions';
        }

        // Check for Mounts & Vehicles
        if (name.includes('mount') || 
            name.includes('horse') || 
            name.includes('pony') || 
            name.includes('donkey') || 
            name.includes('mule') || 
            name.includes('cart') || 
            name.includes('wagon') || 
            name.includes('vehicle') ||
            name.includes('carriage')) {
            return 'Mounts & Vehicles';
        }

        // Check for Services
        if (name.includes('service') || 
            name.includes('meal') || 
            name.includes('inn stay') || 
            name.includes('spellcasting') || 
            name.includes('hireling') ||
            name.includes('stabling') ||
            name.includes('wine') ||
            name.includes('ale')) {
            return 'Services';
        }

        // Default to equipment
        return 'equipment';
    },

    // [TAG: SELL_LOG_MAGICAL] // Updated based on analyzer testing
    SELL_LOG_CheckMagical: function(item, storeData) {
        // Potions and Scrolls are inherently magical, so skip the ✨ emoji check for them
        const category = this.SELL_LOG_DetermineCategory(item);
        if (category.category === 'potions' || category.category === 'scrolls') {
            return false; // Don't mark potions/scrolls with the emoji
        }

        // 1. Check for direct attunement properties on the item itself (flexible)
        if (item._attuned === true ||
            item.attunement === true ||
            item.attunable === true ||
            item.requires_attunement === true ||
            item.attunement === 'required') {
            ShopSystem.utils.log(`[Magical Check - ${item.name}]: Direct attunement property found.`, 'debug');
            return true;
        }

        // 2. Check the item's direct 'type' against the list of magical types
        const magicalTypes = [
            'Attunement', // Keep Attunement here for direct checks if structure differs
            'Defense',
            'Resource',
            'Sense',
            'Hit Points',
            'Ability Score',
            'Skill Bonus', // Added from user modification in analyzer
            'Roll Bonus'
        ];
        if (item.type && magicalTypes.includes(item.type)) {
             ShopSystem.utils.log(`[Magical Check - ${item.name}]: Direct type matched magicalTypes (${item.type}).`, 'debug');
             return true;
        }
        
        // 3. Check if the item's name contains "Magical"
        if (item.name && item.name.toLowerCase().includes('magical')) {
             ShopSystem.utils.log(`[Magical Check - ${item.name}]: Name contains 'magical'.`, 'debug');
             return true;
        }

        // 4. Check for valueFormula (stat modifications) directly on the item
        if (item.valueFormula) {
            ShopSystem.utils.log(`[Magical Check - ${item.name}]: Found valueFormula.`, 'debug');
            return true;
        }

        // 5. Check for specific keywords in the item's description
        if (item.description && (
            item.description.toLowerCase().includes('magic') || // General 'magic' keyword
            item.description.includes('%Critical Hit%') || // Specific marker for crit immunity
            item.description.includes('%magic%') || // Another marker
            item.description.toLowerCase().includes('spell') // General 'spell' keyword
        )) {
             ShopSystem.utils.log(`[Magical Check - ${item.name}]: Found keyword in description.`, 'debug');
             return true;
        }

        // 6. Check child relationships for linked magical types/effects/names
        if (item.childIDs) {
            try {
                const childIds = JSON.parse(item.childIDs);
                 ShopSystem.utils.log(`[Magical Check - ${item.name}]: Checking child IDs: ${JSON.stringify(childIds)}`, 'debug');
                for (const childId of childIds) {
                    // Correct lookup path using optional chaining
                    const childItem = storeData?.integrants?.integrants?.[childId];
                    ShopSystem.utils.log(`  - Child ID: ${childId}, Found: ${!!childItem}, Type: ${childItem?.type}, Name: ${childItem?.name}`, 'debug'); // Log name too
                    // Check linked item's type, description, or name
                    if (childItem && (
                        (childItem.type && magicalTypes.includes(childItem.type)) || // Check type against list
                        (childItem.description && childItem.description.toLowerCase().includes('spell')) || // Check description for 'spell'
                        (childItem.name && childItem.name.toLowerCase().includes('magical')) // Check name for 'magical'
                    )) {
                        ShopSystem.utils.log(`  -> MATCH via child ${childId} (Type: ${childItem.type}, Name: ${childItem.name})`, 'debug');
                        return true;
                    }
                }
            } catch (e) {
                ShopSystem.utils.log(`Error parsing childIDs for item ${item.name}: ${e}`, 'error');
            }
        }

        // 7. Check relations for linked magical types/effects/names
        if (item.relations) {
            ShopSystem.utils.log(`[Magical Check - ${item.name}]: Checking relations`, 'debug');
            for (const [relatedId, relationType] of Object.entries(item.relations)) {
                 // Correct lookup path using optional chaining
                const relatedItem = storeData?.integrants?.integrants?.[relatedId];
                 ShopSystem.utils.log(`  - Related ID: ${relatedId}, Found: ${!!relatedItem}, Type: ${relatedItem?.type}, Name: ${relatedItem?.name}`, 'debug'); // Log name too
                 // Check linked item's type, description, or name
                if (relatedItem && (
                    (relatedItem.type && magicalTypes.includes(relatedItem.type)) || // Check type against list
                    (relatedItem.description && relatedItem.description.toLowerCase().includes('spell')) || // Check description for 'spell'
                    (relatedItem.name && relatedItem.name.toLowerCase().includes('magical')) // Check name for 'magical'
                )) {
                     ShopSystem.utils.log(`  -> MATCH via relation ${relatedId} (Type: ${relatedItem.type}, Name: ${relatedItem.name})`, 'debug');
                    return true;
                }
            }
        }

         ShopSystem.utils.log(`[Magical Check - ${item.name}]: No magical properties found.`, 'debug');
        return false; // No magical properties found
    },

    // [TAG: SELL_LOG_DISPLAY_INVENTORY]
    SELL_LOG_DisplayInventory: function(playerID, characterId) {
        const character = getObj('character', characterId);
        if (!character) {
            ShopSystem.utils.chat("❌ Character not found", playerID);
            return;
        }
        
        // Initialize sell basket character tracking
        if (!state.ShopSystem.sellBasketCharacter) {
            state.ShopSystem.sellBasketCharacter = {};
        }
        state.ShopSystem.sellBasketCharacter[playerID] = characterId;
        
        ShopSystem.utils.log(`Displaying inventory for character ${character.get('name')} (${characterId})`, "debug");
        
        // Get character's inventory
        this.SELL_LOG_ExtractInventory(characterId, playerID)
            .then(result => {
                const { items, stats } = result;
                if (!items || items.length === 0) {
                    ShopSystem.utils.chat(`${character.get('name')} has no items to sell.${stats.excluded > 0 ? ` (${stats.excluded} items excluded due to no price)` : ''}`, playerID);
                    return;
                }
                
                // Display items directly using our new categorization system
                this.SELL_LOG_DisplayInventoryForSale(items, character.get('name'), playerID, characterId, stats.excluded);
            })
            .catch(error => {
                ShopSystem.utils.log(`Error reading inventory: ${error}`, "error");
                ShopSystem.utils.chat(`❌ Error reading inventory: ${error.message}`, playerID);
            });
    },

    // [TAG: SELL_03_EXTRACT_INVENTORY]
    SELL_LOG_ExtractInventory: function(characterId, playerID) {
        return new Promise((resolve, reject) => {
            try {
                const character = getObj('character', characterId);
                if (!character) {
                    reject(new Error("Character not found"));
                    return;
                }
                
                // Look for Beacon sheet 'store' attribute first
                const storeAttr = findObjs({
                    _type: 'attribute',
                    _characterid: characterId,
                    name: 'store'
                })[0];
                
                if (storeAttr) {
                    ShopSystem.utils.log(`Found Beacon 'store' attribute for ${character.get('name')}`, "debug");
                    try {
                        let storeData = storeAttr.get('current');
                        if (typeof storeData === 'string') {
                            // Parse the JSON data
                            storeData = JSON.parse(storeData);
                        }
                        
                        if (typeof storeData === 'object' && storeData !== null) {
                            // Extract items from the store data with stats
                            const items = [];
                            const stats = { excluded: 0 };
                            // Pass the full storeData as the first argument now
                            const result = this.SELL_LOG_ExtractItemsFromStore(storeData, storeData, items, "", stats);
                            ShopSystem.utils.log(`Found ${result.items.length} items in Beacon store data (${result.stats.excluded} excluded)`, "debug");
                            resolve(result);
                            return;
                        }
                    } catch (e) {
                        ShopSystem.utils.log(`Error parsing Beacon store: ${e.message}`, "warn");
                    }
                }
                
                // If no Beacon store or parsing failed, try other sheet types
                // This is a simplified placeholder - actual implementation would vary based on sheet
                ShopSystem.utils.chat("⚠️ Your character sheet type is not fully supported for selling. Only Beacon sheets are currently supported for inventory reading.", playerID);
                resolve({ items: [], stats: { excluded: 0 } });
            } catch (error) {
                reject(error);
            }
        });
    },

    // [TAG: SELL_LOG_EXTRACT_ITEMS]
    SELL_LOG_ExtractItemsFromStore: function(data, storeData, items = [], path = "", stats = { excluded: 0 }) {
        if (!data) return { items, stats };
        
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                this.SELL_LOG_ExtractItemsFromStore(item, storeData, items, path ? `${path}.${index}` : `${index}`, stats);
            });
        } else if (typeof data === 'object' && data !== null) {
            // Check if this is a sellable item
            if (data.name && data.type === 'Item') {
                const itemPath = path;
                // Extract price from data if available
                let price = null;
                
                // Try to find value or cost property
                if (typeof data.value === 'number') {
                    price = { gp: data.value };
                } else if (data.cost) {
                    price = this.SELL_LOG_ParseItemCost(data.cost);
                }
                
                // Only add items that have a non-zero price
                const hasPrice = price && ShopSystem.utils.toCopper(price) > 0;
                if (hasPrice) {
                    // Determine category and magical properties
                    const category = this.SELL_LOG_DetermineCategory(data);
                    const isMagical = this.SELL_LOG_CheckMagical(data, storeData);

                    const item = {
                        id: itemPath,
                        name: data.name,
                        type: data.type,
                        category: category,
                        magical: isMagical,
                        description: data.description || "",
                        quantity: data.quantity || 1,
                        price: price,
                        data: data  // Original data reference for later
                    };
                    
                    items.push(item);
                } else {
                    // Track excluded items that had no price
                    stats.excluded++;
                }
            }
            
            // Recursively process object properties
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object' && data[key] !== null) {
                    this.SELL_LOG_ExtractItemsFromStore(data[key], storeData, items, path ? `${path}.${key}` : key, stats);
                }
            });
        }
        
        return { items, stats };
    },

    // [TAG: SELL_05_PARSE_ITEM_COST]
    SELL_LOG_ParseItemCost: function(cost) {
        if (!cost) return null;
        
        // Handle string cost like "15 gp" or "50 sp"
        if (typeof cost === 'string') {
            const match = cost.match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)/i);
            if (match) {
                const amount = parseFloat(match[1]);
                const currency = match[2].toLowerCase();
                const result = {};
                result[currency] = amount;
                return result;
            }
            
            // Try to parse just a number
            const numMatch = cost.match(/^(\d+(?:\.\d+)?)$/);
            if (numMatch) {
                return { gp: parseFloat(numMatch[1]) };
            }
        } else if (typeof cost === 'number') {
            // Direct number value
            return { gp: cost };
        } else if (typeof cost === 'object') {
            // Already a currency object
            return cost;
        }
        
        return null;
    },

    // [TAG: SELL_06_GROUP_ITEMS_BY_TYPE]
    SELL_LOG_GroupItemsByType: function(items) {
        const groups = {};
        
        items.forEach(item => {
            const type = item.type || "Other";
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
        });
        
        return groups;
    },

    // [TAG: SELL_LOG_DISPLAY]
    SELL_LOG_DisplayInventoryForSale: function(items, charName, playerID, characterId, excludedCount = 0) {
        if (!items || items.length === 0) {
            ShopSystem.utils.chat(`${charName} has no items to sell.${excludedCount > 0 ? ` (${excludedCount} items excluded due to no price)` : ''}`, playerID);
            return;
        }
        
        const shop = ShopSystem.state.activeShop;
        if (!shop) {
            ShopSystem.utils.chat("❌ No active shop selected", playerID);
            return;
        }
        
        const sellModifier = shop.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
        
        let menu = `&{template:default} {{name=${charName}'s Inventory}}`;
        menu += `{{Shop=${shop.name}}}`;
        if (excludedCount > 0) {
            menu += `{{Note=${excludedCount} items excluded due to no price}}`;
        }
        
        // Group items by category
        const categorizedItems = {};
        Object.keys(CONFIG.DISPLAY.SELL_CATEGORIES).forEach(category => {
            categorizedItems[category] = [];
        });

        // Sort items into categories
        items.forEach(item => {
            const category = item.category || 'equipment';
            if (categorizedItems[category]) {
                categorizedItems[category].push(item);
            }
        });

        // Display items by category
        Object.entries(CONFIG.DISPLAY.SELL_CATEGORIES)
            .sort(([,a], [,b]) => a.priority - b.priority)
            .forEach(([category, config]) => {
                const categoryItems = categorizedItems[category];
                if (categoryItems && categoryItems.length > 0) {
                    let categoryContent = [];

                    categoryItems.forEach(item => {
                        // Calculate original and sell prices
                        const itemCopper = ShopSystem.utils.toCopper(item.price);
                        const sellCopper = Math.floor(itemCopper * sellModifier);
                        const sellPrice = ShopSystem.utils.fromCopper(sellCopper);

                        // Format prices
                        const originalValue = ShopSystem.utils.formatCurrency(item.price);
                        const sellValue = ShopSystem.utils.formatCurrency(sellPrice);

                        // Add magical indicator if applicable
                        const magicalIcon = item.magical ? '✨ ' : '';
                        const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : '';

                        // Item name and prices
                        categoryContent.push(`• ${magicalIcon}${item.name}${qtyStr}`);
                        categoryContent.push(`   Value: ${originalValue} | Sell: ${sellValue}`);

                        // Sell buttons
                        categoryContent.push(`   [🛒 Sell 1](!shop sell item ${item.id} 1)${item.quantity > 1 ? ` [🛒 Sell All](!shop sell item ${item.id} ${item.quantity})` : ''}`);
                    });

                    menu += `{{${config.emoji} ${config.name}=${categoryContent.join('\n')}}}`;
                }
            });

        // Add navigation buttons
        menu += `{{Actions=`;
        menu += `[🧺 View Sell Basket](!shop sell view) `;
        menu += `[🔙 Back to Shop](!shop)`;
        menu += `}}`;

        ShopSystem.utils.chat(menu, playerID);
    },

    // [TAG: SELL_08_FIND_ITEM_BY_PATH]
    SELL_LOG_FindItemByPath: function(data, path) {
        if (!path || !data) return null;
        
        const parts = path.split('.');
        let current = data;
        
        for (const part of parts) {
            if (current === null || current === undefined) return null;
            
            if (Array.isArray(current)) {
                const index = parseInt(part);
                if (isNaN(index) || index < 0 || index >= current.length) return null;
                current = current[index];
            } else if (typeof current === 'object') {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    },

    // [TAG: CD_RESTOCK_LOGIC]
    RESTOCK_LOGIC_RestockShop: function(playerID) {
        if (!ShopSystem.state.activeShop || !ShopSystem.state.activeShop.id) {
            ShopSystem.utils.chat('❌ No active shop selected or shop ID missing!', playerID);
            return;
        }

        const shop = ShopSystem.state.activeShop;
        ShopSystem.utils.log(`Starting restock for shop: ${shop.name} (ID: ${shop.id})`, 'info');
        let itemsRestocked = 0;
        let itemsWithDefaultMaxStock = 0;

        // Ensure inventory exists
        if (!shop.inventory) {
            shop.inventory = {}; // Initialize if completely missing
        }

        // Iterate through all categories in the inventory
        Object.keys(shop.inventory).forEach(category => {
            if (!Array.isArray(shop.inventory[category])) {
                ShopSystem.utils.log(`Warning: Inventory category '${category}' is not an array. Skipping.`, 'warn');
                return; // Skip non-array categories
            }

            shop.inventory[category].forEach(item => {
                let maxStock = item.maxStock;

                // Validate maxStock: must be a number greater than 0
                if (typeof maxStock !== 'number' || isNaN(maxStock) || maxStock <= 0) {
                    ShopSystem.utils.log(`Warning: Item '${item.name}' (ID: ${item.id}) in category '${category}' has invalid or missing maxStock (${maxStock}). Defaulting to 1.`, 'warn');
                    maxStock = 1;
                    item.maxStock = 1; // Set the default maxStock on the item
                    itemsWithDefaultMaxStock++;
                }

                // Set current quantity to the validated maxStock
                item.quantity = maxStock;
                itemsRestocked++;
            });
        });

        // Save the updated shop data
        const handout = getObj("handout", shop.id);
        if (handout) {
            handout.set("gmnotes", JSON.stringify(shop, null, 2));
            ShopSystem.utils.log(`Restock complete for ${shop.name}. ${itemsRestocked} item entries processed. ${itemsWithDefaultMaxStock} items defaulted to maxStock=1.`, 'info');
            ShopSystem.utils.chat(`✅ Shop "${shop.name}" has been restocked!`, playerID);

            // Refresh the stock management menu to show updated quantities
            this.STKMGM_MD_ShowStockManageMenu(playerID);
        } else {
            ShopSystem.utils.log(`Error: Could not find handout for shop ID ${shop.id} during restock.`, 'error');
            ShopSystem.utils.chat('❌ Error saving restocked shop data!', playerID);
        }
    },
}, // Closing brace for ShopSystem.shop

// [TAG: MERGED_7] // This tag needs to be fixed
basket: {
    addToBasket(playerId, itemId, quantity=1) {
        // Check if baskets are merged
        if (this.basketState.isMerged(playerId)) {
            // Correctly access CONFIG.DISPLAY.BASKET_STATE
            ShopSystem.utils.chat(CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.BASKETS_LOCKED, playerId); 
            return;
        }

        // Rest of the function remains the same...
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop!', playerId);
            return;
        }
        
        // Initialize basket for this player if it doesn't exist
        if (!state.ShopSystem.playerBaskets) {
            state.ShopSystem.playerBaskets = {};
        }
        
        if (!state.ShopSystem.playerBaskets[playerId]) {
            state.ShopSystem.playerBaskets[playerId] = [];
        }
        
        // Find the item in any category of the active shop
        const shop = ShopSystem.state.activeShop;
        let foundItem = null;
        let foundInCategory = '';
        let foundAtIndex = -1;
        let inventoryArray = []; // Consolidated inventory array

        // Consolidate inventory regardless of structure
        if (Array.isArray(shop.inventory)) {
            inventoryArray = shop.inventory;
        } else {
            Object.keys(shop.inventory).forEach(cat => {
                if (Array.isArray(shop.inventory[cat])) {
                    shop.inventory[cat].forEach(item => inventoryArray.push({...item, category: cat }));
                }
            });
        }

        // Find the item in the consolidated array
        foundAtIndex = inventoryArray.findIndex(item => item.id === itemId);
        if (foundAtIndex !== -1) {
            // Create a copy to avoid modifying the original shop state directly here
            foundItem = { ...inventoryArray[foundAtIndex] }; 
            foundInCategory = foundItem.category; // Category was added during consolidation
        }
        
        if (!foundItem) {
            ShopSystem.utils.chat('❌ Item not found in shop!', playerId);
            return;
        }

        // Find original item in shop structure to check quantity
        let shopItemRef = null;
         if (Array.isArray(shop.inventory)) {
            const idx = shop.inventory.findIndex(i => i.id === itemId);
            if (idx !== -1) shopItemRef = shop.inventory[idx];
        } else {
            const cat = foundItem.category || CONFIG.ITEM.DEFAULT_CATEGORY;
            const idx = shop.inventory[cat]?.findIndex(i => i.id === itemId);
             if (idx !== -1 && idx !== undefined) shopItemRef = shop.inventory[cat][idx];
        }
        
        if (!shopItemRef || shopItemRef.quantity < quantity) {
            ShopSystem.utils.chat(`❌ Not enough stock! Only ${shopItemRef?.quantity || 0} available.`, playerId);
            return;
        }
        
        // Ensure item has needed properties 
        if (!foundItem.rarity) foundItem.rarity = "common";
        if (!foundItem.category) foundItem.category = CONFIG.ITEM.DEFAULT_CATEGORY;
        
        // Check if item already in basket, then update quantity
        const existingItemIndex = state.ShopSystem.playerBaskets[playerId].findIndex(item => item.id === itemId);
        
        if (existingItemIndex !== -1) {
            // Item already in basket, update quantity
            state.ShopSystem.playerBaskets[playerId][existingItemIndex].quantity += quantity;
        } else {
            // Add new item to basket with all needed properties
            state.ShopSystem.playerBaskets[playerId].push({
                id: foundItem.id,
                name: foundItem.name,
                price: foundItem.price,
                quantity: quantity,
                category: foundItem.category,
                rarity: foundItem.rarity,
                description: foundItem.description,
                effect: foundItem.effect
            });
        }
        
        // Reduce the shop inventory immediately
        shopItemRef.quantity -= quantity;
        if (shopItemRef.quantity <= 0) {
            // Instead of removing the item, set quantity to 0 to display as "Out of Stock"
            shopItemRef.quantity = 0;
            
            // Ensure maxStock is set for proper display in the UI
            if (shopItemRef.maxStock === undefined) {
                shopItemRef.maxStock = quantity; // Set initial quantity as maxStock if not defined
            }
            
            ShopSystem.utils.log(`Item ${foundItem.name} is now out of stock (0/${shopItemRef.maxStock || '?'})`, "info");
        }

        // [TAG: CD_BASKET_STATE_UPDATE_001] Update the activeShop state directly after modification
        ShopSystem.state.activeShop = shop; 
        // Save updated shop state
        ShopSystem.utils.updateShopHandout(getObj('handout', shop.id), shop);

        ShopSystem.utils.chat(`✅ Added ${quantity} ${foundItem.name} to your basket`, playerId);

        // [TAG: CD_BASKET_LAST_MODIFIED_TRACKING] Update last modified item ID *before* saving/viewing basket
        if (!state.ShopSystem.lastModifiedBasketItem) state.ShopSystem.lastModifiedBasketItem = {};
        state.ShopSystem.lastModifiedBasketItem[playerId] = itemId;

        ShopSystem.basket.saveBasketState();
        ShopSystem.basket.viewBasket(playerId); // Call viewBasket using ShopSystem.basket
    },
    
    // [TAG: SHOP_159_remove_from_basket]
    removeFromBasket(playerId, itemId, quantity = null) {
        // Check if baskets are merged
        if (this.basketState.isMerged(playerId)) {
            ShopSystem.utils.chat(CONFIG.BASKET_STATE.ERROR_MESSAGES.BASKETS_LOCKED, playerId);
            return;
        }
    
        if (!state.ShopSystem.playerBaskets || !state.ShopSystem.playerBaskets[playerId]) {
            ShopSystem.utils.chat('❌ Your basket is empty!', playerId);
            return;
        }
    
        const itemIndex = state.ShopSystem.playerBaskets[playerId].findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            ShopSystem.utils.chat('❌ Item not found in your basket!', playerId);
            return;
        }
        
        const basketItem = state.ShopSystem.playerBaskets[playerId][itemIndex];
        const currentBasketQty = basketItem.quantity;
        
        // Determine how many to remove
        let removedQuantity = quantity ? parseInt(quantity) : currentBasketQty;
        if (isNaN(removedQuantity) || removedQuantity <= 0) {
             ShopSystem.utils.chat('❌ Invalid quantity to remove.', playerId);
            return;
        }
        removedQuantity = Math.min(removedQuantity, currentBasketQty); // Can't remove more than what's in basket

        // Update basket
        if (removedQuantity >= currentBasketQty) {
            state.ShopSystem.playerBaskets[playerId].splice(itemIndex, 1);
        } else {
            state.ShopSystem.playerBaskets[playerId][itemIndex].quantity -= removedQuantity;
        }

        // Restore the inventory in the shop
        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ Error: No active shop found to return items to!', playerId);
            return; // Cannot proceed without active shop
        }
        const shop = ShopSystem.state.activeShop;
        const category = basketItem.category || CONFIG.ITEM.DEFAULT_CATEGORY;

         // Find item in shop inventory
        let shopItemRef = null;
        if (Array.isArray(shop.inventory)) {
            const idx = shop.inventory.findIndex(i => i.id === itemId);
            if (idx !== -1) shopItemRef = shop.inventory[idx];
        } else {
            if (!shop.inventory[category]) shop.inventory[category] = []; // Ensure category exists
            const idx = shop.inventory[category].findIndex(i => i.id === itemId);
             if (idx !== -1 && idx !== undefined) shopItemRef = shop.inventory[category][idx];
        }

        if (shopItemRef) {
            // Item exists in shop, increase quantity
            shopItemRef.quantity += removedQuantity;
        } else {
            // Item doesn't exist, add it back
            const newItem = { ...basketItem, quantity: removedQuantity }; // Use full basket item details
             if (Array.isArray(shop.inventory)) {
                shop.inventory.push(newItem);
            } else {
                 if (!shop.inventory[category]) shop.inventory[category] = [];
                 shop.inventory[category].push(newItem);
            }
        }
        
        ShopSystem.utils.updateShopHandout(getObj('handout', shop.id), shop);
        ShopSystem.utils.chat(`✅ Removed ${removedQuantity} ${basketItem.name} from your basket`, playerId);
        ShopSystem.basket.saveBasketState(); 
        ShopSystem.basket.viewBasket(playerId); // Call viewBasket using ShopSystem.basket
        // [TAG: CD_BASKET_LAST_MODIFIED_TRACKING] Clear last modified if removed item matches
        if (state.ShopSystem.lastModifiedBasketItem && state.ShopSystem.lastModifiedBasketItem[playerId] === itemId) {
            delete state.ShopSystem.lastModifiedBasketItem[playerId];
        }
    },

    // [TAG: SHOP_160_view_basket]
    viewBasket(playerId) {
        if (!state.ShopSystem.playerBaskets || 
            !state.ShopSystem.playerBaskets[playerId] || 
            state.ShopSystem.playerBaskets[playerId].length === 0) {
            sendChat('ShopSystem', `/w ${getObj('player', playerId).get('_displayname')} 📭 Your basket is empty!`);
            return;
        }
        
        const basket = state.ShopSystem.playerBaskets[playerId];
        let totalPrice = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        
        // Calculate total price
        basket.forEach(item => {
            for (const currency in item.price) {
                if (typeof item.price[currency] === 'number') {
                    totalPrice[currency] = (totalPrice[currency] || 0) + 
                                          (item.price[currency] * item.quantity);
                }
            }
        });
        
        // Get emoji configs
        const categoryEmojis = CONFIG.DISPLAY.CATEGORY.EMOJI;
        const rarityEmojis = CONFIG.DISPLAY.RARITY.EMOJI;
        const qtyColor = '#FF8C00';
        const newItemColor = '#28a745'; // Bootstrap green
        
        // [TAG: CD_BASKET_LAST_MODIFIED_TRACKING] Get last modified item ID *before* mapping
        const lastModifiedId = state.ShopSystem.lastModifiedBasketItem ? state.ShopSystem.lastModifiedBasketItem[playerId] : null;

        // Create basket content display with emoji and colored qty
        let itemsList = basket.map(item => {
            const categoryEmoji = categoryEmojis[item.category] || '🎒';
            const rarityEmoji = rarityEmojis[item.rarity] || '⚪';
            const qtyStr = `<span style=\"color:${qtyColor};font-weight:bold;\">(x${item.quantity})</span>`;
            let prefix = '';
            let isLastModified = (item.id === lastModifiedId);
            let nameAndPriceSection = `${categoryEmoji} ${rarityEmoji} ${qtyStr} ${item.name} - <span style=\"color:inherit;\">💰${ShopSystem.utils.formatCurrency(item.price)}</span>`;
            
            if (isLastModified) {
                prefix = '🔄 ';
                nameAndPriceSection = `<span style=\"color:${newItemColor};\">${nameAndPriceSection}</span>`;
            }
            
            const itemDisplay = `${prefix}${nameAndPriceSection}`;

            // Check shop stock for this item
            let shopStockQty = 0;
            const shop = ShopSystem.state.activeShop; 
            if (shop && shop.inventory) {
                const itemCategory = item.category || CONFIG.ITEM.DEFAULT_CATEGORY;
                if(shop.inventory[itemCategory]) {
                    const shopItem = shop.inventory[itemCategory].find(i => i.id === item.id);
                    if (shopItem) {
                        shopStockQty = shopItem.quantity || 0;
                    }
                }
            }

            // Add buttons
            let buttons = `[ℹ️ Info](!shop stock view_item ${item.id} ${item.category || 'all'}) [❌ Remove](!shop basket remove ${item.id})`;
            // Add "Add More" button only if shop has stock
            if (shopStockQty > 0) {
                // Change button text to just "Add"
                buttons += ` [➕ Add](!shop basket add ${item.id} 1)`;
            }
            
            // Return item line with buttons on new line
            return `• ${itemDisplay}<br/>    ${buttons}`;
        }).join('<br/>');
        
        // Clear the highlight *after* using it to generate the list, before sending chat
        if (lastModifiedId) {
            delete state.ShopSystem.lastModifiedBasketItem[playerId];
            ShopSystem.utils.log(`Cleared last modified highlight for player ${playerId} basket.`, 'debug');
        }

        // Add merge button check before creating menu
        const canMerge = this.basketState?.canMergeBaskets?.(playerId) || false;
        
        let menu = `&{template:default} {{name=🧺 Your Shopping Basket}}` +
                   `{{Items=<br/>${itemsList}}}` +
                   `{{Total=💰${ShopSystem.utils.formatCurrency(totalPrice)}}}`;

        // Add haggle discount if it exists
        if (ShopSystem.state.haggleResults && ShopSystem.state.haggleResults[playerId] && ShopSystem.state.haggleResults[playerId].applied) {
            const result = ShopSystem.state.haggleResults[playerId];
            const discountedPrice = ShopSystem.utils.fromCopper(result.newPrice);
            const discountAmount = result.originalPrice - result.newPrice;
            const discountPercent = Math.round((discountAmount / result.originalPrice) * 100);
            
            menu += `{{Discount=${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(discountAmount))} (${discountPercent}%)}}` +
                    `{{Final Total=${ShopSystem.utils.formatCurrency(discountedPrice)}}}`;
        }

        // Show Haggle button only if shop has attempts left
        const shop = ShopSystem.state.activeShop;
        const haggleBtn = (shop && shop.haggle && shop.haggle.remaining_attempts > 0)
            ? `[🔊 Haggle](!shop basket haggle) `
            : ''; // No button if attempts are 0
        
        // Modify the Actions section to include merge when available
        menu += `{{Actions=` +
                `[💰 Checkout](!shop basket checkout) ` +
                `[🗑️ Clear Basket](!shop basket clear) ` +
                haggleBtn +
                (canMerge ? `[🔄 Merge Baskets](!shop basket merge) ` : '') +
                `[🏪 Back to Shop](!shop)}}`;
        
        sendChat('ShopSystem', `/w ${getObj('player', playerId).get('_displayname')} ${menu}`);
    },
    
    // [TAG: SHOP_161_clear_basket]
    clearBasket(playerId) {
        if (!state.ShopSystem.playerBaskets || !state.ShopSystem.playerBaskets[playerId] || state.ShopSystem.playerBaskets[playerId].length === 0) {
            ShopSystem.utils.chat('❌ Your basket is already empty!', playerId);
            return;
        }
        if (!ShopSystem.state.activeShop) {
             ShopSystem.utils.chat('❌ Error: No active shop found to return items to!', playerId);
            return; 
        }
        const shop = ShopSystem.state.activeShop;
        
        // Return all items to inventory
        for (const basketItem of state.ShopSystem.playerBaskets[playerId]) {
            const category = basketItem.category || CONFIG.ITEM.DEFAULT_CATEGORY;
            let shopItemRef = null;

            if (Array.isArray(shop.inventory)) {
                const idx = shop.inventory.findIndex(i => i.id === basketItem.id);
                if (idx !== -1) shopItemRef = shop.inventory[idx];
            } else {
                 if (!shop.inventory[category]) shop.inventory[category] = [];
                const idx = shop.inventory[category].findIndex(i => i.id === basketItem.id);
                 if (idx !== -1 && idx !== undefined) shopItemRef = shop.inventory[category][idx];
            }

            if (shopItemRef) {
                shopItemRef.quantity += basketItem.quantity;
            } else {
                 const newItem = { ...basketItem }; // Use full basket item details
                 if (Array.isArray(shop.inventory)) {
                    shop.inventory.push(newItem);
                } else {
                    if (!shop.inventory[category]) shop.inventory[category] = [];
                    shop.inventory[category].push(newItem);
                }
            }
        }
        
        ShopSystem.utils.updateShopHandout(getObj('handout', shop.id), shop);
        state.ShopSystem.playerBaskets[playerId] = []; // Clear the basket
        // Also clear any haggle results when clearing basket
         if (state.ShopSystem.haggleResults?.[playerId]) {
             delete state.ShopSystem.haggleResults[playerId];
             ShopSystem.utils.log(`Cleared haggle results for player ${playerId} due to basket clear.`, 'debug');
        }

        ShopSystem.basket.saveBasketState();
        ShopSystem.utils.chat('✅ Your basket has been cleared', playerId);
        // [TAG: CD_BASKET_LAST_MODIFIED_TRACKING] Clear last modified on basket clear
        if (state.ShopSystem.lastModifiedBasketItem) {
            delete state.ShopSystem.lastModifiedBasketItem[playerId];
        }
        // Redisplay shop menu if active
        if (ShopSystem.state.activeShop) {
             // Need msg object to call ShowShopMenu, attempt to reconstruct minimally
             const player = getObj('player', playerId);
             const mockMsg = { playerid: playerId, who: player?.get('_displayname') || 'Player' };
             ShopSystem.shop.SHPDIS_MD_ShowShopMenu(ShopSystem.state.activeShop.name, playerId, mockMsg, false);
        }
    },

    // [TAG: SHOP_84_checkout]
    checkout(playerId) {
        // Check if basket exists and has items
        if (!state.ShopSystem.playerBaskets ||
            !state.ShopSystem.playerBaskets[playerId] ||
            state.ShopSystem.playerBaskets[playerId].length === 0) {
            ShopSystem.utils.sendMessage('📭 Your basket is empty!', getObj('player', playerId)?.get('_displayname'));
            return;
        }

        // Get the pre-selected character
        const charId = state.ShopSystem.activeCharacters[playerId];
        if (!charId) {
            ShopSystem.utils.chat("❌ No character selected for shopping. Use !shop to select a character.", playerId);
            return;
        }

        // Proceed directly to purchase confirmation
        this.confirmPurchase(playerId, charId);
    },

    // [TAG: SHOP_85_confirm_purchase] // Updated for Buy/Sell Haggle Display & Net Transaction
    async confirmPurchase(playerId, charId) {
        const character = getObj('character', charId);
        if (!character) {
            ShopSystem.utils.sendMessage('❌ Character not found!', getObj('player', playerId)?.get('_displayname'));
            return;
        }

        const buyBasket = state.ShopSystem.playerBaskets?.[playerId] || [];
        const sellBasket = state.ShopSystem.sellBaskets?.[playerId] || []; // Get sell basket too

        if (buyBasket.length === 0 && sellBasket.length === 0) {
            ShopSystem.utils.sendMessage('❌ Your buy and sell baskets are empty!', getObj('player', playerId)?.get('_displayname'));
            return;
        }

        // --- Calculate Original Totals ---
        let buyTotalCopper = 0;
        buyBasket.forEach(item => {
            buyTotalCopper += ShopSystem.utils.toCopper(item.price) * item.quantity;
        });

        let sellTotalCopper = 0;
        if (sellBasket.length > 0) {
             const shop = ShopSystem.state.activeShop; // Need shop for sell modifier
             const sellModifier = shop?.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
             sellBasket.forEach(item => {
                 // Use baseValue if available (e.g., from character inventory), otherwise use item.price (which might already be adjusted if sold to shop)
                 const basePriceCopper = ShopSystem.utils.toCopper(item.baseValue || item.price);
                 sellTotalCopper += Math.floor(basePriceCopper * sellModifier) * item.quantity;
             });
        }

        // --- Apply Haggle Adjustments (if any) ---
        let finalBuyCopper = buyTotalCopper;
        let finalSellCopper = sellTotalCopper;
        let buyAdjustmentCopper = 0;
        let sellAdjustmentCopper = 0;
        let originalBuyForDisplay = buyTotalCopper; // For calculating percentage
        let originalSellForDisplay = sellTotalCopper; // For calculating percentage

        // Check the *main* haggleResults state, which is set by handleHaggleApply
        if (state.ShopSystem.haggleResults && state.ShopSystem.haggleResults[playerId]?.applied) {
            const haggleResult = state.ShopSystem.haggleResults[playerId];
            buyAdjustmentCopper = haggleResult.buyAdjustmentCopper || 0;
            sellAdjustmentCopper = haggleResult.sellAdjustmentCopper || 0;
            // Use original totals stored during haggle if available
            originalBuyForDisplay = haggleResult.originalBuyBasketPriceCopper ?? buyTotalCopper;
            originalSellForDisplay = haggleResult.originalSellBasketPriceCopper ?? sellTotalCopper;

            // Calculate final prices based on ORIGINAL values and ADJUSTMENTS
            finalBuyCopper = originalBuyForDisplay + buyAdjustmentCopper;
            finalSellCopper = originalSellForDisplay + sellAdjustmentCopper; // Positive adjustment increases sell value

            ShopSystem.utils.log(`Confirm Purchase: Haggle applied. BuyAdj=${buyAdjustmentCopper}, SellAdj=${sellAdjustmentCopper}, FinalBuy=${finalBuyCopper}, FinalSell=${finalSellCopper}`, 'debug');
        } else {
             ShopSystem.utils.log(`Confirm Purchase: No haggle applied. FinalBuy=${finalBuyCopper}, FinalSell=${finalSellCopper}`, 'debug');
        }

        // Ensure non-negative totals after adjustment
        finalBuyCopper = Math.max(0, finalBuyCopper);
        finalSellCopper = Math.max(0, finalSellCopper);

        const netTransactionCopper = finalSellCopper - finalBuyCopper; // Positive = player receives, Negative = player pays
        const netTransactionPrice = ShopSystem.utils.fromCopper(Math.abs(netTransactionCopper));
        const transactionLabel = netTransactionCopper >= 0 ? "You Receive" : "You Pay";
        // --- End Price Calculation ---

        // Get character currency
        const charCurrency = await ShopSystem.utils.getCharacterCurrency(charId);
        const charCopper = ShopSystem.utils.toCopper(charCurrency);

        // Check if character has enough funds if they need to pay
        if (netTransactionCopper < 0 && charCopper < Math.abs(netTransactionCopper)) {
            ShopSystem.utils.sendMessage(`❌ Not enough funds! You need to pay ${ShopSystem.utils.formatCurrency(netTransactionPrice)} but only have ${ShopSystem.utils.formatCurrency(charCurrency)}.`, getObj('player', playerId)?.get('_displayname'));
             // Clear haggle state if purchase fails
             if (state.ShopSystem.haggleResults?.[playerId]) {
                 delete state.ShopSystem.haggleResults[playerId];
             }
            return;
        }

        // --- Build Confirmation Message ---
        let message = `&{template:default} {{name=Confirm Transaction}}`;
        message += `{{Character=${character.get('name')}}}`;

        // Display Buy/Sell sections only if items exist
        if (buyBasket.length > 0) {
            // Show the ORIGINAL buy total before haggle
            message += `{{Items Buying (Subtotal)=💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(originalBuyForDisplay))}}}`; 
            // Show Buy Adjustment if applicable
            if (buyAdjustmentCopper !== 0) {
                const buyAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(buyAdjustmentCopper)));
                const buyAdjLabel = buyAdjustmentCopper < 0 ? "Discount" : "Markup";
                const buyPercentLabel = originalBuyForDisplay > 0 ? ` (${Math.round(Math.abs(buyAdjustmentCopper / originalBuyForDisplay) * 100)}%)` : '';
                message += `{{Buy Haggle=${buyAdjLabel}: ${buyAdjFormatted}${buyPercentLabel}}}`;
                // Optionally, show the price after discount if a discount was applied
                if (buyAdjustmentCopper < 0) {
                    message += `{{Price After Haggle=💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(finalBuyCopper))}}}`;
                }
            }
       }
        if (sellBasket.length > 0) {
             // Show the ORIGINAL sell total before haggle
             message += `{{Items Selling (Subtotal)=💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(originalSellForDisplay))}}}`;
             // Show Sell Adjustment if applicable
             if (sellAdjustmentCopper !== 0) {
                 const sellAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(sellAdjustmentCopper)));
                 const sellAdjLabel = sellAdjustmentCopper > 0 ? "Bonus" : "Penalty";
                 const sellPercentLabel = originalSellForDisplay > 0 ? ` (${Math.round(Math.abs(sellAdjustmentCopper / originalSellForDisplay) * 100)}%)` : '';
                 message += `{{Sell Haggle=${sellAdjLabel}: ${sellAdjFormatted}${sellPercentLabel}}}`;
                 // Optionally, show the value after bonus/penalty if an adjustment was applied
                 if (sellAdjustmentCopper !== 0) { // Could be >0 for bonus or <0 for penalty
                    message += `{{Value After Haggle=💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(finalSellCopper))}}}`;
                 }
             }
        }

        // Net Transaction should reflect the FINAL costs/gains
        message += `{{Net Transaction=${transactionLabel}: 💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(netTransactionCopper)))}}}`;
        message += `{{Current Funds=💰${ShopSystem.utils.formatCurrency(charCurrency)}}}`;
         // Calculate final funds after transaction
         const finalFundsCopper = charCopper + netTransactionCopper;
        message += `{{Funds After=💰${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(finalFundsCopper))}}}`;

        message += `{{Confirmation=`;
        message += `[✅ Confirm Transaction](!shop basket complete ${charId}) | `; // Use the same complete command
        message += `[❌ Cancel](!shop basket view)`; // View basket might need adjustment for merged view? Let's keep it simple for now.
        message += `}}`;

        ShopSystem.utils.sendMessage(message, getObj('player', playerId)?.get('_displayname'));
    },

    // [TAG: DUP_SHOP_86(43)_complete_purchase] // Updated for Buy/Sell Haggle & Net Transaction
    async completePurchase(playerId, charId) {
        const character = getObj('character', charId);
        if (!character) {
            ShopSystem.utils.sendMessage('❌ Character not found!', getObj('player', playerId)?.get('_displayname'));
            return;
        }

        const buyBasket = state.ShopSystem.playerBaskets?.[playerId] || [];
        const sellBasket = state.ShopSystem.sellBaskets?.[playerId] || [];

        if (buyBasket.length === 0 && sellBasket.length === 0) {
             ShopSystem.utils.sendMessage('❌ Baskets are empty!', getObj('player', playerId)?.get('_displayname'));
            return;
        }

        // --- Calculate Original and Adjusted Totals ---
        let buyTotalCopper = 0;
        buyBasket.forEach(item => {
            buyTotalCopper += ShopSystem.utils.toCopper(item.price) * item.quantity;
        });

        let sellTotalCopper = 0;
        let originalSellCopperForReceipt = 0; // Need original for receipt
         if (sellBasket.length > 0) {
             const shop = ShopSystem.state.activeShop;
             const sellModifier = shop?.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
             sellBasket.forEach(item => {
                 const basePriceCopper = ShopSystem.utils.toCopper(item.baseValue || item.price);
                 const itemSellValue = Math.floor(basePriceCopper * sellModifier) * item.quantity;
                 sellTotalCopper += itemSellValue;
                 originalSellCopperForReceipt += itemSellValue; // Store pre-haggle sell total
             });
        }


        let finalBuyCopper = buyTotalCopper;
        let finalSellCopper = sellTotalCopper;
        let buyAdjustmentCopper = 0;
        let sellAdjustmentCopper = 0;
         let originalBuyForReceipt = buyTotalCopper; // Keep pre-haggle buy total for receipt
         let originalSellForReceipt = sellTotalCopper; // Default to pre-haggle sell total

        // Apply haggle adjustments stored in state
        if (state.ShopSystem.haggleResults && state.ShopSystem.haggleResults[playerId]?.applied) {
            const haggleResult = state.ShopSystem.haggleResults[playerId];
            buyAdjustmentCopper = haggleResult.buyAdjustmentCopper || 0;
            sellAdjustmentCopper = haggleResult.sellAdjustmentCopper || 0;
            // Use originals stored during haggle for final calculation base
            originalBuyForReceipt = haggleResult.originalBuyBasketPriceCopper ?? buyTotalCopper;
            originalSellForReceipt = haggleResult.originalSellBasketPriceCopper ?? sellTotalCopper;

            finalBuyCopper = originalBuyForReceipt + buyAdjustmentCopper;
            finalSellCopper = originalSellForReceipt + sellAdjustmentCopper;

            ShopSystem.utils.log(`Complete Tx: Haggle applied. BuyAdj=${buyAdjustmentCopper}, SellAdj=${sellAdjustmentCopper}, FinalBuy=${finalBuyCopper}, FinalSell=${finalSellCopper}`, 'debug');
        } else {
             ShopSystem.utils.log(`Complete Tx: No haggle applied. FinalBuy=${finalBuyCopper}, FinalSell=${finalSellCopper}`, 'debug');
        }

        finalBuyCopper = Math.max(0, finalBuyCopper); // Ensure non-negative
        finalSellCopper = Math.max(0, finalSellCopper); // Ensure non-negative

        const netTransactionCopper = finalSellCopper - finalBuyCopper; // Final net change
        const netTransactionPrice = ShopSystem.utils.fromCopper(Math.abs(netTransactionCopper));
        const transactionLabel = netTransactionCopper >= 0 ? "Received" : "Paid";
        // --- End Price Calculation ---


        // Get character currency
        const charCurrency = await ShopSystem.utils.getCharacterCurrency(charId);
        const charCopper = ShopSystem.utils.toCopper(charCurrency);

        // Verify funds again (safety check)
        if (netTransactionCopper < 0 && charCopper < Math.abs(netTransactionCopper)) {
            ShopSystem.utils.sendMessage(`❌ Not enough funds! You need to pay ${ShopSystem.utils.formatCurrency(netTransactionPrice)} but only have ${ShopSystem.utils.formatCurrency(charCurrency)}.`, getObj('player', playerId)?.get('_displayname'));
             if (state.ShopSystem.haggleResults?.[playerId]) {
                  delete state.ShopSystem.haggleResults[playerId];
             }
            return;
        }

        // Calculate final currency
        const finalFundsCopper = charCopper + netTransactionCopper; // Add the net change
        const newCurrency = ShopSystem.utils.fromCopper(finalFundsCopper);

        // --- Update Character Currency ---
        const currencyUpdated = await ShopSystem.utils.setCharacterCurrency(charId, newCurrency);
        let currencyUpdateMessage = currencyUpdated ? "Yes" : "**Manual Update Needed!**";
        if (!currencyUpdated) {
            ShopSystem.utils.sendMessage(`⚠️ Could not automatically update currency for ${character.get('name')}. Please update manually. New balance: ${ShopSystem.utils.formatCurrency(newCurrency)}`, getObj('player', playerId)?.get('_displayname'));
            ShopSystem.utils.sendGMMessage(`⚠️ Failed to update currency for ${character.get('name')} (ID: ${charId}). ${currencyUpdateMessage}`);
        }

        // --- Update Shop Inventory (Remove Bought, Add Sold) ---
        const shop = ShopSystem.state.activeShop;
        if (!shop || !shop.id) {
            ShopSystem.utils.sendMessage('❌ Error: Shop not found or missing ID during final purchase step!', getObj('player', playerId)?.get('_displayname'));
            ShopSystem.utils.log(`Critical Error: Shop object missing or invalid during Tx finalization for player ${playerId}, char ${charId}. Currency might be changed without inventory update.`, 'error');
            return;
        }

        let itemsPurchasedDetails = []; // For receipt - BUY basket
        let itemsSoldDetails = []; // For receipt - SELL basket

        // Process Buy Basket (Items removed from shop)
        buyBasket.forEach(basketItem => {
            itemsPurchasedDetails.push({ ...basketItem }); // Store details for receipt
            let itemFound = false;
            const category = basketItem.category || CONFIG.ITEM.DEFAULT_CATEGORY;
             if (shop.inventory && shop.inventory[category] && Array.isArray(shop.inventory[category])) {
                 const itemIndex = shop.inventory[category].findIndex(i => i.id === basketItem.id);
                if (itemIndex !== -1) {
                     const shopItem = shop.inventory[category][itemIndex];
                     shopItem.quantity -= basketItem.quantity; // Decrease shop quantity
                    if (shopItem.quantity <= 0) {
                         shopItem.quantity = 0; // Set to 0 instead of removing
                         ShopSystem.utils.log(`Item ${shopItem.name} quantity set to 0 in shop ${shop.name}.`, 'debug');
                    }
                    itemFound = true;
                }
             }
             // Check array structure if category object failed
             else if (Array.isArray(shop.inventory)) {
                 const itemIndex = shop.inventory.findIndex(i => i.id === basketItem.id);
                 if (itemIndex !== -1) {
                     shop.inventory[itemIndex].quantity -= basketItem.quantity;
                     if (shop.inventory[itemIndex].quantity <= 0) shop.inventory[itemIndex].quantity = 0;
                     itemFound = true;
                 }
             }
            if (!itemFound) {
                ShopSystem.utils.log(`Warning: Bought item ${basketItem.name} not found in shop during final update.`, 'warn');
            }
        });

        // Process Sell Basket (Items added to shop)
        const playerLabel = "👤";
        sellBasket.forEach(soldItem => {
             itemsSoldDetails.push({ ...soldItem }); // Store details for receipt
             // Use the category determined earlier, or default
             const category = soldItem.category || ShopSystem.shop.SELL_LOG_DetermineCategory(soldItem.data) || CONFIG.ITEM.DEFAULT_CATEGORY;

             // Check if item already exists in shop (by ID or Name - prefer ID if possible)
             let existingShopItem = null;
             if (shop.inventory && shop.inventory[category]) {
                 // Prioritize ID match, then name match
                 existingShopItem = shop.inventory[category].find(i => i.id === soldItem.id);
                 if (!existingShopItem) {
                      existingShopItem = shop.inventory[category].find(i => i.name === soldItem.name);
                 }
             }

             if (existingShopItem) {
                 existingShopItem.quantity += soldItem.quantity;
                 existingShopItem.maxStock = (existingShopItem.maxStock || 0) + soldItem.quantity;
                 ShopSystem.utils.log(`Added ${soldItem.quantity} of sold item '${soldItem.name}' to existing shop stock.`, 'debug');
             } else {
                 // Add as new item
                 if (!shop.inventory[category]) shop.inventory[category] = [];
                  // Use original base value for the price when adding to shop
                 const priceToAdd = soldItem.baseValue || {gp: 0};
                 shop.inventory[category].push({
                     id: soldItem.id + '_playersold_' + Date.now().toString(36),
                     name: `${playerLabel} ${soldItem.name}`,
                     price: priceToAdd,
                     quantity: soldItem.quantity,
                     maxStock: soldItem.quantity,
                     category: category,
                     rarity: soldItem.rarity || "common",
                     description: soldItem.description || "",
                     playerSold: true
                 });
                  ShopSystem.utils.log(`Added ${soldItem.quantity} of new player-sold item '${soldItem.name}' to shop.`, 'debug');
             }
        });


        // --- Save Shop State ---
        ShopSystem.utils.updateShopHandout(getObj('handout', shop.id), shop);

        // --- Generate Combined Receipt ---
         this.generateCombinedReceipt(playerId, charId, itemsPurchasedDetails, itemsSoldDetails, finalBuyCopper, finalSellCopper, buyAdjustmentCopper, sellAdjustmentCopper, originalBuyForReceipt, originalSellForReceipt, charCurrency, newCurrency);

        // --- Clear Baskets and State ---
        this.basketState.unlockBaskets(playerId); // Unlocks if merged
        delete state.ShopSystem.playerBaskets[playerId]; // Clear buy basket
        delete state.ShopSystem.sellBaskets?.[playerId]; // Clear sell basket
        delete state.ShopSystem.sellBasketCharacter?.[playerId]; // Clear character link
        if (state.ShopSystem.haggleResults?.[playerId]) {
            delete state.ShopSystem.haggleResults[playerId];
            ShopSystem.utils.log(`Cleared haggle results for player ${playerId} after purchase.`, 'debug');
        }
        ShopSystem.basket.saveBasketState(); // Save cleared buy basket state

        // --- Send Confirmations ---
         const netTransactionLabel = netTransactionCopper >= 0 ? `received ${ShopSystem.utils.formatCurrency(netTransactionPrice)}` : `spent ${ShopSystem.utils.formatCurrency(netTransactionPrice)}`;
        ShopSystem.utils.sendMessage(`✅ Transaction complete! You ${netTransactionLabel}. A receipt has been added to your journal.`, getObj('player', playerId)?.get('_displayname'));

        // Notify GM
        const gmNotification = `&{template:default} {{name=💰 Transaction Completed}}` +
                               `{{Player=${getObj('player', playerId)?.get('_displayname')} (${character.get('name')})}}` +
                               `{{Shop=${shop.name}}}` +
                               (itemsPurchasedDetails.length > 0 ? `{{Items Bought=${itemsPurchasedDetails.length} types}}` : "") +
                               (itemsSoldDetails.length > 0 ? `{{Items Sold=${itemsSoldDetails.length} types}}` : "") +
                               `{{Net Total=💰 ${transactionLabel}: ${ShopSystem.utils.formatCurrency(netTransactionPrice)}}}` +
                               `{{Currency Updated=${currencyUpdateMessage}}}` +
                               `{{Note=Receipt added to player journal.}}`;
        ShopSystem.utils.sendGMMessage(gmNotification);
    },

    // [TAG: BASKET_SELL_01]
    addToSellBasket(playerId, itemPath, quantity=1) {
        // Check if baskets are merged
        if (this.basketState.isMerged(playerId)) {
            ShopSystem.utils.chat(CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.BASKETS_LOCKED, playerId);
            return;
        }

        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop!', playerId);
            return;
        }
        
        // Initialize sellBaskets if needed
        if (!state.ShopSystem.sellBaskets) {
            state.ShopSystem.sellBaskets = {};
        }
        
        if (!state.ShopSystem.sellBaskets[playerId]) {
            state.ShopSystem.sellBaskets[playerId] = [];
        }
        
        // Get character ID from sellBasketCharacter state
        let characterId = state.ShopSystem.sellBasketCharacter?.[playerId];
        
        if (!characterId) {
            ShopSystem.utils.chat('❌ Character not identified for sell basket. Please use "!shop sell from [character]" first.', playerId);
            return;
        }
        
        const character = getObj('character', characterId);
        if (!character) {
            ShopSystem.utils.chat('❌ Character not found', playerId);
            return;
        }
        
        // Extract inventory
        ShopSystem.shop.SELL_LOG_ExtractInventory(characterId, playerId).then(result => {
            const { items } = result;
            // Find the item by path in the inventory
            const foundItem = items.find(item => item.id === itemPath);
            
            if (!foundItem) {
                ShopSystem.utils.chat('❌ Item not found in inventory!', playerId);
                return;
            }
            
            // Make sure we don't sell more than we have
            const availableQty = foundItem.quantity || 1;
            quantity = Math.min(quantity, availableQty);
            
            if (quantity <= 0) {
                ShopSystem.utils.chat('❌ Invalid quantity', playerId);
                return;
            }
            
            // Check if item already in basket
            const existingItemIndex = state.ShopSystem.sellBaskets[playerId].findIndex(item => item.id === itemPath);
            
            // Apply sell price modifier
            const shop = ShopSystem.state.activeShop;
            const sellModifier = shop.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
            
            // Calculate sell price
            let sellPrice = { gp: 0 };
            if (foundItem.price) {
                const itemCopper = ShopSystem.utils.toCopper(foundItem.price);
                const sellCopper = Math.floor(itemCopper * sellModifier);
                sellPrice = ShopSystem.utils.fromCopper(sellCopper);
            }
            
            if (existingItemIndex !== -1) {
                // Update existing item in basket
                const currentQty = state.ShopSystem.sellBaskets[playerId][existingItemIndex].quantity;
                const newQty = currentQty + quantity;
                
                // Check against originally available quantity from inventory
                if (newQty > availableQty) {
                     ShopSystem.utils.chat(`❌ Cannot add more than available in inventory (${availableQty})`, playerId);
                    return;
                }
                
                state.ShopSystem.sellBaskets[playerId][existingItemIndex].quantity = newQty;
            } else {
                // Add new item to basket, INCLUDING THE ORIGINAL DATA
                state.ShopSystem.sellBaskets[playerId].push({
                    id: foundItem.id,
                    name: foundItem.name,
                    type: foundItem.type || "Item",
                    description: foundItem.description || "",
                    quantity: quantity,
                    price: sellPrice,         // Calculated sell price per item
                    baseValue: foundItem.price, // Original price from inventory
                    data: foundItem.data,       // <-- ADD THIS LINE: Store original item data
                    category: foundItem.category, // Store determined category
                    characterId: characterId    // Track source character
                });
            }
            
            // Track which character this sell basket belongs to (redundant assignment, but safe)
            if (!state.ShopSystem.sellBasketCharacter) {
                state.ShopSystem.sellBasketCharacter = {};
            }
            state.ShopSystem.sellBasketCharacter[playerId] = characterId;
            
            ShopSystem.utils.chat(`✅ Added ${quantity} ${foundItem.name} to your sell basket`, playerId);
            
            // Show the updated basket
            this.viewSellBasket(playerId);
        }).catch(error => {
            ShopSystem.utils.log(`Error adding to sell basket: ${error}`, 'error');
            ShopSystem.utils.chat(`❌ Error adding to sell basket: ${error.message}`, playerId);
        });
    },

    // [TAG: BASKET_SELL_02]
    removeFromSellBasket(playerId, index) {
        // Check if baskets are merged
        if (this.basketState.isMerged(playerId)) {
            ShopSystem.utils.chat(CONFIG.BASKET_STATE.ERROR_MESSAGES.BASKETS_LOCKED, playerId);
            return;
        }

        if (!state.ShopSystem.sellBaskets || 
            !state.ShopSystem.sellBaskets[playerId] || 
            index >= state.ShopSystem.sellBaskets[playerId].length || 
            index < 0) {
            ShopSystem.utils.chat('❌ Item not found in your sell basket!', playerId);
            return;
        }
        
        const removedItem = state.ShopSystem.sellBaskets[playerId][index];
        state.ShopSystem.sellBaskets[playerId].splice(index, 1);
        
        ShopSystem.utils.chat(`✅ Removed ${removedItem.name} from your sell basket`, playerId);
        this.viewSellBasket(playerId);
    },

    // [TAG: BASKET_SELL_03]
    viewSellBasket(playerId) {
        if (!state.ShopSystem.sellBaskets ||
            !state.ShopSystem.sellBaskets[playerId] ||
            state.ShopSystem.sellBaskets[playerId].length === 0) {
            ShopSystem.utils.chat('📭 Your sell basket is empty!', playerId);
            return;
        }

        const basket = state.ShopSystem.sellBaskets[playerId];
        let totalPrice = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

        // Calculate total price
        basket.forEach(item => {
            for (const currency in item.price) {
                if (typeof item.price[currency] === 'number') {
                    totalPrice[currency] = (totalPrice[currency] || 0) +
                                        (item.price[currency] * item.quantity);
                }
            }
        });

        // Create basket content display
        let itemsList = basket.map((item, index) => {
            const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `• ${item.name}${qtyStr} - ${ShopSystem.utils.formatCurrency(item.price)} each<br/>` +
                `   [❌ Remove](!shop sell remove ${index})`;
        }).join('<br/>');

        // Add merge button check before creating menu
        const canMerge = this.basketState?.canMergeBaskets?.(playerId) || false;

        let menu = `&{template:default} {{name=🧺 Items to Sell}}` +
                `{{Items=<br/>${itemsList}}}` +
                `{{Total Value=💰${ShopSystem.utils.formatCurrency(totalPrice)}}}`;

        // Get character info if available
        if (state.ShopSystem.sellBasketCharacter && state.ShopSystem.sellBasketCharacter[playerId]) {
            const characterId = state.ShopSystem.sellBasketCharacter[playerId];
            const character = getObj('character', characterId);
            if (character) {
                menu += `{{Character=${character.get('name')}}}`;
            }
        }

        // Modify the Actions section to include merge and the CORRECT haggle command
        menu += `{{Actions=` +
                `[💰 Complete Sale](!shop sell checkout)` +
                ` [🗑️ Clear Basket](!shop sell clear)` +
                ` [🔊 Haggle](!shop basket haggle_sell)` + // <-- USE haggle_sell command
                (canMerge ? ` [🔄 Merge Baskets](!shop basket merge)` : '') +
                ` [🏪 Back to Shop](!shop)}}`;

        ShopSystem.utils.chat(menu, playerId);
    },

    // [TAG: BASKET_SELL_04]
    clearSellBasket(playerId) {
        if (!state.ShopSystem.sellBaskets || 
            !state.ShopSystem.sellBaskets[playerId] || 
            state.ShopSystem.sellBaskets[playerId].length === 0) {
            ShopSystem.utils.chat('❌ Your sell basket is already empty!', playerId);
            return;
        }
        
        // Clear the basket
        state.ShopSystem.sellBaskets[playerId] = [];

        // Also clear any associated haggle results
        if (state.ShopSystem.haggleResults?.[playerId]) {
             delete state.ShopSystem.haggleResults[playerId];
             ShopSystem.utils.log(`Cleared haggle results for player ${playerId} due to sell basket clear.`, 'debug');
        }
        // Also clear character tracking for sell basket
         if (state.ShopSystem.sellBasketCharacter?.[playerId]) {
             delete state.ShopSystem.sellBasketCharacter[playerId];
        }
        
        ShopSystem.utils.chat('✅ Your sell basket has been cleared', playerId);
        // No need to call viewSellBasket here, as it's empty. Maybe show shop menu?
        // Let's keep it simple for now.
    },

    // [TAG: BASKET_SELL_05]
    async checkoutSell(playerId) {
        if (!state.ShopSystem.sellBaskets || 
            !state.ShopSystem.sellBaskets[playerId] || 
            state.ShopSystem.sellBaskets[playerId].length === 0) {
            ShopSystem.utils.chat('❌ Your sell basket is empty!', playerId);
            return;
        }
        
        // Get character ID
        if (!state.ShopSystem.sellBasketCharacter || !state.ShopSystem.sellBasketCharacter[playerId]) {
            ShopSystem.utils.chat('❌ Character not found for sell basket', playerId);
            return;
        }
        
        const characterId = state.ShopSystem.sellBasketCharacter[playerId];
        const character = getObj('character', characterId);
        
        if (!character) {
            ShopSystem.utils.chat('❌ Character not found', playerId);
            return;
        }
        
        // Calculate total sell value
        const basket = state.ShopSystem.sellBaskets[playerId];
        let totalPrice = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        
        basket.forEach(item => {
            for (const currency in item.price) {
                if (typeof item.price[currency] === 'number') {
                    totalPrice[currency] = (totalPrice[currency] || 0) + 
                                        (item.price[currency] * item.quantity);
                }
            }
        });
        
        // Get character's current currency
        const charCurrency = await ShopSystem.utils.getCharacterCurrency(characterId);
        const totalCopper = ShopSystem.utils.toCopper(totalPrice);
        
        // Calculate new total
        const newTotal = ShopSystem.utils.fromCopper(ShopSystem.utils.toCopper(charCurrency) + totalCopper);
        
        // Show confirmation message
        let message = `&{template:default} {{name=Confirm Sale}}`;
        message += `{{Character=${character.get('name')}}}`;
        message += `{{Items for Sale=${basket.length} different items}}`;
        message += `{{Total Sale Value=💰${ShopSystem.utils.formatCurrency(totalPrice)}}}`;
        message += `{{Current Funds=💰${ShopSystem.utils.formatCurrency(charCurrency)}}}`;
        message += `{{After Sale=💰${ShopSystem.utils.formatCurrency(newTotal)}}}`;
        message += `{{Warning=You will need to manually remove sold items from your character sheet after the sale is complete.}}`;
        message += `{{Confirmation=`;
        message += `[✅ Confirm Sale](!shop sell confirm ${characterId}) | `;
        message += `[❌ Cancel](!shop sell view)`;
        message += `}}`;
        
        ShopSystem.utils.chat(message, playerId);
    },

    // [TAG: BASKET_SELL_06]
    async completeSell(playerId, characterId) {
        if (!state.ShopSystem.sellBaskets || 
            !state.ShopSystem.sellBaskets[playerId] || 
            state.ShopSystem.sellBaskets[playerId].length === 0) {
            ShopSystem.utils.chat('❌ Your sell basket is empty!', playerId);
            return;
        }
        
        const character = getObj('character', characterId);
        if (!character) {
            ShopSystem.utils.chat('❌ Character not found', playerId);
            return;
        }
        
        const shop = ShopSystem.state.activeShop;
        if (!shop) {
            ShopSystem.utils.chat('❌ No active shop!', playerId);
            return;
        }
        
        // Calculate total sell value
        const basket = state.ShopSystem.sellBaskets[playerId];
        let totalPrice = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        
        basket.forEach(item => {
            for (const currency in item.price) {
                if (typeof item.price[currency] === 'number') {
                    totalPrice[currency] = (totalPrice[currency] || 0) + 
                                        (item.price[currency] * item.quantity);
                }
            }
        });
        
        const totalCopper = ShopSystem.utils.toCopper(totalPrice);
        
        // Get character's current currency
        const charCurrency = await ShopSystem.utils.getCharacterCurrency(characterId);
        const charCopper = ShopSystem.utils.toCopper(charCurrency);
        
        // Calculate new currency
        const newCurrency = ShopSystem.utils.fromCopper(charCopper + totalCopper);
        
        // Update character's currency
        const currencyUpdated = await ShopSystem.utils.setCharacterCurrency(characterId, newCurrency);
        if (!currencyUpdated) {
            ShopSystem.utils.chat(`⚠️ Could not automatically update currency for ${character.get('name')}. Please update manually to add ${ShopSystem.utils.formatCurrency(totalPrice)}.`, playerId);
        }
        
        // Add sold items to the shop's inventory with player tag
        const playerLabel = "👤"; // Emoji tag for player-sold items
        const itemsSold = [];
        
        basket.forEach(item => {
            itemsSold.push({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                type: item.type,
                description: item.description
            });
            
            // Try to find the item in the database first
            ShopSystem.database.listItems('all', 'all').then(dbItems => {
                const dbItem = dbItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                
                if (dbItem) {
                    // Found in database, add using existing item data
                    ShopSystem.shop.STKACT_LOG_AddItemToStock(dbItem.id, item.quantity)
                        .then(result => {
                            ShopSystem.utils.log(`Added sold item ${item.name} to shop inventory from database record`, "info");
                        })
                        .catch(error => {
                            ShopSystem.utils.log(`Error adding sold item to stock: ${error.message}`, "error");
                        });
                } else {
                    // Not found in database, create new entry in shop inventory
                    const category = item.type?.toLowerCase() || "equipment";
                    
                    // Create a shop inventory entry
                    if (!shop.inventory[category]) {
                        shop.inventory[category] = [];
                    }
                    
                    // Generate a unique ID for the item
                    const itemId = item.name.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, '') + '_player_' + Date.now().toString(36);
                    
                    // Add item to shop inventory with player tag
                    shop.inventory[category].push({
                        id: itemId,
                        name: `${playerLabel} ${item.name}`, // Add player tag emoji
                        price: item.baseValue || item.price, // Use original value if available
                        quantity: item.quantity,
                        maxStock: item.quantity,
                        category: category,
                        rarity: "common", // Default rarity
                        description: item.description || "",
                        playerSold: true // Flag to identify player-sold items
                    });
                    
                    ShopSystem.utils.log(`Added player-sold item ${item.name} directly to shop inventory`, "info");
                }
            }).catch(error => {
                ShopSystem.utils.log(`Error checking database for sold item: ${error.message}`, "error");
            });
        });
        
        // Save the updated shop
        const handout = getObj("handout", shop.id);
        if (handout) {
            handout.set("gmnotes", JSON.stringify(shop, null, 2));
        }
        
        // Generate sale receipt
        this.generateSaleReceipt(playerId, character, itemsSold, totalPrice, charCurrency, newCurrency);
        
        // --- Clear Baskets and State ---
        this.basketState.unlockBaskets(playerId); // Unlocks if merged
        delete state.ShopSystem.sellBaskets[playerId]; // Clear sell basket
        delete state.ShopSystem.sellBasketCharacter?.[playerId]; // Clear character link
        if (state.ShopSystem.haggleResults?.[playerId]) { // <<< ADD THIS CHECK & DELETE
            delete state.ShopSystem.haggleResults[playerId]; 
            ShopSystem.utils.log(`Cleared haggle results for player ${playerId} after sell completion.`, 'debug');
        }
        // Note: We don't call saveBasketState here as sell baskets aren't saved to the handout currently
        
        ShopSystem.utils.chat(`✅ Sale complete! You received ${ShopSystem.utils.formatCurrency(totalPrice)}. Don't forget to remove the sold items from your character sheet.`, playerId);
        
        // Notify GM
        const gmNotification = `&{template:default} {{name=💰 Sale Completed}}` +
                            `{{Player=${getObj('player', playerId)?.get('_displayname')} (${character.get('name')})}}` +
                            `{{Shop=${shop.name}}}` +
                            `{{Items=${itemsSold.length} types}}` +
                            `{{Total Value=💰${ShopSystem.utils.formatCurrency(totalPrice)}}}` +
                            `{{Currency Updated=${currencyUpdated ? "Yes" : "No - Manual update needed"}}}` +
                            `{{Note=Receipt added to player journal. Items added to shop inventory.}}`;
        ShopSystem.utils.sendGMMessage(gmNotification);
    },

    // [TAG: BASKET_SELL_07]
    generateSaleReceipt(playerId, character, itemsSold, totalPrice, oldCurrency, newCurrency) {
        if (!character || !itemsSold || itemsSold.length === 0) return;
        
        const player = getObj('player', playerId);
        if (!player) return;
        
        const playerName = player.get('_displayname');
        const charName = character.get('name');
        const shop = ShopSystem.state.activeShop;
        const shopName = shop?.name || "Shop";
        const merchantName = shop?.merchant_name || "Merchant";
        const receiptDate = new Date().toLocaleString();
        const receiptTitle = `Sale Receipt: ${charName} - ${shopName} - ${receiptDate}`;
        
        // Create receipt content
        let receiptContent = `<div style="font-family: sans-serif; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">`;
        receiptContent += `<h3 style="margin-top: 0;">${shopName}</h3>`;
        receiptContent += `<p><strong>Merchant:</strong> ${merchantName}</p>`;
        receiptContent += `<p><strong>Date:</strong> ${receiptDate}</p>`;
        receiptContent += `<p><strong>Seller:</strong> ${charName}</p>`;
        receiptContent += `<hr>`;
        
        // List sold items
        receiptContent += `<h4>Items Sold:</h4><ul>`;
        itemsSold.forEach(item => {
            const itemTotalPrice = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(
                ShopSystem.utils.toCopper(item.price) * item.quantity
            ));
            
            receiptContent += `<li style="margin-bottom: 5px;">`;
            receiptContent += `<strong>${item.name}</strong> (x${item.quantity}) - ${ShopSystem.utils.formatCurrency(item.price)} each`;
            receiptContent += `<br><em>Item Total: ${itemTotalPrice}</em>`;
            receiptContent += `</li>`;
        });
        receiptContent += `</ul><hr>`;
        
        // Payment details
        receiptContent += `<h4>Payment Details:</h4>`;
        receiptContent += `<p><strong>Total Sale Value:</strong> ${ShopSystem.utils.formatCurrency(totalPrice)}</p>`;
        
        // Format currency display helper
        const formatCurrencyDetail = (currencyObj) => {
            let parts = [];
            if (currencyObj.pp) parts.push(`${currencyObj.pp} Platinum`);
            if (currencyObj.gp) parts.push(`${currencyObj.gp} Gold`);
            if (currencyObj.ep) parts.push(`${currencyObj.ep} Electrum`);
            if (currencyObj.sp) parts.push(`${currencyObj.sp} Silver`);
            if (currencyObj.cp) parts.push(`${currencyObj.cp} Copper`);
            return parts.length > 0 ? parts.join(', ') : '0 Gold';
        };
        
        receiptContent += `<p><strong>Previous Funds:</strong> ${formatCurrencyDetail(oldCurrency)}</p>`;
        receiptContent += `<p><strong>Funds After Sale:</strong> ${formatCurrencyDetail(newCurrency)}</p>`;
        receiptContent += `<hr>`;
        
        receiptContent += `<p><em>Thank you for your business!</em></p>`;
        receiptContent += `<p><strong>IMPORTANT:</strong> <em style="color: red;">Please manually remove the sold items from your character sheet.</em></p>`;
        receiptContent += `</div>`;
        
        // Create handout
        const receiptHandout = createObj('handout', {
            name: receiptTitle,
            inplayerjournals: playerId,
            controlledby: playerId, 
            archived: false
        });
        
        if (receiptHandout) {
            setTimeout(() => {
                receiptHandout.set('notes', receiptContent);
                ShopSystem.utils.log(`Generated sale receipt handout: ${receiptTitle} for player ${playerName}`, 'info');
            }, 100);
        } else {
            ShopSystem.utils.log(`Failed to create sale receipt handout for player ${playerName}`, 'error');
        }
    },

    // [TAG: CD_RECEIPT_GENERATION] // New helper function for generating receipts
    // Added originalPriceCopper parameter
    generatePurchaseReceipt: async function(playerId, charId, purchasedItems, totalPrice, oldCurrency, newCurrency, originalPriceCopper = null) {
        const character = getObj('character', charId);
        const player = getObj('player', playerId);
        if (!character || !player) return; // Should not happen if called from completePurchase

        const playerName = player.get('_displayname');
        const charName = character.get('name');
        const shop = ShopSystem.state.activeShop;
        const shopName = shop?.name || "Shop";
        const merchantName = shop?.merchant_name || "Merchant";
        const receiptDate = new Date().toLocaleString();
        // Make receipt title slightly more specific if possible
        const receiptTitle = `Receipt: ${charName} - ${shopName} - ${receiptDate}`;


        // --- Create Receipt Content ---
        let receiptContent = `<div style="font-family: sans-serif; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">`; // Basic styling
        receiptContent += `<h3 style="margin-top: 0;">${shopName}</h3>`;
        receiptContent += `<p><strong>Merchant:</strong> ${merchantName}</p>`;
        receiptContent += `<p><strong>Date:</strong> ${receiptDate}</p>`;
        receiptContent += `<p><strong>Customer:</strong> ${charName}</p>`;
        receiptContent += `<hr>`; // Separator

        // Detailed list of purchased items
        receiptContent += `<h4>Items Purchased:</h4><ul>`;
         let calculatedSubTotalCopper = 0; // To verify against totalPrice
        purchasedItems.forEach(item => {
             const itemSinglePriceCopper = ShopSystem.utils.toCopper(item.price);
            const itemTotalPriceCopper = itemSinglePriceCopper * item.quantity;
             calculatedSubTotalCopper += itemTotalPriceCopper; // Add to running total
            const itemTotalPrice = ShopSystem.utils.fromCopper(itemTotalPriceCopper);

            receiptContent += `<li style="margin-bottom: 5px;">`;
            receiptContent += `<strong>${item.name}</strong> (x${item.quantity}) - ${ShopSystem.utils.formatCurrency(item.price)} each`;
            if (item.rarity) receiptContent += ` (${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)})`;
            receiptContent += `<br><em>Item Total: ${ShopSystem.utils.formatCurrency(itemTotalPrice)}</em>`;
            // Optionally add description/effect if needed - might make receipt too long
            // if (item.description) receiptContent += `<br><small>Desc: ${item.description}</small>`;
            // if (item.effect) receiptContent += `<br><small>Effect: ${item.effect}</small>`;
            receiptContent += `</li>`;
        });
        receiptContent += `</ul><hr>`; // Separator

        // Payment details
        receiptContent += `<h4>Payment Details:</h4>`;

         // Display Haggle Information if it occurred
         const finalTotalCopper = ShopSystem.utils.toCopper(totalPrice);
         if (originalPriceCopper !== null && originalPriceCopper !== finalTotalCopper) {
             const originalPriceFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(originalPriceCopper));
             const discountAmountCopper = originalPriceCopper - finalTotalCopper;
             const discountAmountFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(discountAmountCopper)));
             const discountPercent = originalPriceCopper > 0 ? Math.round((discountAmountCopper / originalPriceCopper) * 100) : 0;

             receiptContent += `<p><strong>Subtotal:</strong> ${originalPriceFormatted}</p>`;
             if (discountAmountCopper > 0) {
                 receiptContent += `<p><strong style="color: green;">Haggle Discount:</strong> -${discountAmountFormatted} (${discountPercent}%)</p>`;
             } else {
                 receiptContent += `<p><strong style="color: red;">Haggle Markup:</strong> +${discountAmountFormatted} (${Math.abs(discountPercent)}%)</p>`;
             }
         }

        receiptContent += `<p><strong>Total Cost:</strong> ${ShopSystem.utils.formatCurrency(totalPrice)}</p>`;

        // Format currency display helper
        const formatCurrencyDetail = (currencyObj) => {
            let parts = [];
             // Ensure pp, gp, ep, sp, cp order
            if (currencyObj.pp) parts.push(`${currencyObj.pp} Platinum`);
            if (currencyObj.gp) parts.push(`${currencyObj.gp} Gold`);
            if (currencyObj.ep) parts.push(`${currencyObj.ep} Electrum`);
            if (currencyObj.sp) parts.push(`${currencyObj.sp} Silver`);
            if (currencyObj.cp) parts.push(`${currencyObj.cp} Copper`);
            return parts.length > 0 ? parts.join(', ') : '0 Gold';
        };

        receiptContent += `<p><strong>Previous Funds:</strong> ${formatCurrencyDetail(oldCurrency)}</p>`;
        receiptContent += `<p><strong>Funds After Purchase:</strong> ${formatCurrencyDetail(newCurrency)}</p>`;
        receiptContent += `<hr>`; // Separator

        receiptContent += `<p><em>Thank you for your purchase!</em></p>`;
        // Add note about manual currency update only if automatic update failed
        // Check if update *actually* failed using the return value of setCharacterCurrency
        const currencySetSuccessfully = await ShopSystem.utils.setCharacterCurrency(charId, newCurrency); // Check again, or pass the result down
        if (!currencySetSuccessfully) {
            receiptContent += `<p><strong>IMPORTANT:</strong> <em style="color: red;">Could not automatically update character sheet currency. Please update manually.</em></p>`;
        } else {
            receiptContent += `<p><em>Your character sheet currency should be updated automatically.</em></p>`;
        }

        receiptContent += `</div>`; // Close styling div

        // --- Create Handout ---
        const receiptHandout = createObj('handout', {
            name: receiptTitle,
            inplayerjournals: playerId, // Assign to the specific player
            controlledby: playerId,     // Ensure player can see it
            archived: false
        });

        if (receiptHandout) {
            // Set notes content asynchronously
             // Wait a short moment before setting notes to ensure handout exists
             setTimeout(() => {
                receiptHandout.set('notes', receiptContent);
                 ShopSystem.utils.log(`Generated receipt handout: ${receiptTitle} for player ${playerName}`, 'info');
             }, 100); // 100ms delay
        } else {
             ShopSystem.utils.log(`Failed to create receipt handout for player ${playerName}`, 'error');
        }
    },

    // [TAG: CD_COMBINED_RECEIPT] Generates a receipt for combined buy/sell transactions
    generateCombinedReceipt: function(playerId, charId, purchasedItems, soldItems, finalBuyCopper, finalSellCopper, buyAdjustmentCopper, sellAdjustmentCopper, originalBuyCopper, originalSellCopper, oldCurrency, newCurrency) {
        const character = getObj('character', charId);
        const player = getObj('player', playerId);
        if (!character || !player) return;

        const playerName = player.get('_displayname');
        const charName = character.get('name');
        const shop = ShopSystem.state.activeShop;
        const shopName = shop?.name || "Shop";
        const merchantName = shop?.merchant_name || "Merchant";
        const receiptDate = new Date().toLocaleString();
        const receiptTitle = `Transaction Receipt: ${charName} - ${shopName} - ${receiptDate}`;

        // --- Create Receipt Content ---
        let receiptContent = `<div style="font-family: sans-serif; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">`;
        receiptContent += `<h3 style="margin-top: 0;">${shopName}</h3>`;
        receiptContent += `<p><strong>Merchant:</strong> ${merchantName}</p>`;
        receiptContent += `<p><strong>Date:</strong> ${receiptDate}</p>`;
        receiptContent += `<p><strong>Customer:</strong> ${charName}</p>`;
        receiptContent += `<hr>`;

        // --- Items Purchased ---
        if (purchasedItems.length > 0) {
            receiptContent += `<h4>Items Purchased:</h4><ul>`;
            purchasedItems.forEach(item => {
                const itemTotalPrice = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(ShopSystem.utils.toCopper(item.price) * item.quantity));
                receiptContent += `<li style="margin-bottom: 5px;"><strong>${item.name}</strong> (x${item.quantity}) - ${ShopSystem.utils.formatCurrency(item.price)} each<br><em>Item Total: ${itemTotalPrice}</em></li>`;
            });
            receiptContent += `</ul>`;
            const buySubtotalFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(originalBuyCopper));
            receiptContent += `<p><strong>Purchase Subtotal:</strong> ${buySubtotalFormatted}</p>`;
            if (buyAdjustmentCopper !== 0) {
                const buyAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(buyAdjustmentCopper)));
                const buyAdjLabel = buyAdjustmentCopper < 0 ? "Discount" : "Markup";
                const buyPercentLabel = originalBuyCopper > 0 ? ` (${Math.round(Math.abs(buyAdjustmentCopper / originalBuyCopper) * 100)}%)` : '';
                receiptContent += `<p><strong style="${buyAdjustmentCopper < 0 ? 'color: green;' : 'color: red;'}">Haggle ${buyAdjLabel}:</strong> ${buyAdjustmentCopper < 0 ? '-' : '+'}${buyAdjFormatted}${buyPercentLabel}</p>`;
            }
            receiptContent += `<p><strong>Final Purchase Cost:</strong> ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(finalBuyCopper))}</p>`;
            receiptContent += `<hr>`;
        }

        // --- Items Sold ---
        if (soldItems.length > 0) {
            receiptContent += `<h4>Items Sold:</h4><ul>`;
            soldItems.forEach(item => {
                const itemSellPrice = ShopSystem.utils.formatCurrency(item.price); // Price already reflects sell value per item
                const itemTotalSellValue = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(ShopSystem.utils.toCopper(item.price) * item.quantity));
                receiptContent += `<li style="margin-bottom: 5px;"><strong>${item.name}</strong> (x${item.quantity}) - ${itemSellPrice} each<br><em>Item Total Value: ${itemTotalSellValue}</em></li>`;
            });
            receiptContent += `</ul>`;
            const sellSubtotalFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(originalSellCopper));
            receiptContent += `<p><strong>Sale Subtotal:</strong> ${sellSubtotalFormatted}</p>`;
                if (sellAdjustmentCopper !== 0) {
                const sellAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(sellAdjustmentCopper)));
                const sellAdjLabel = sellAdjustmentCopper > 0 ? "Bonus" : "Penalty";
                const sellPercentLabel = originalSellCopper > 0 ? ` (${Math.round(Math.abs(sellAdjustmentCopper / originalSellCopper) * 100)}%)` : '';
                receiptContent += `<p><strong style="${sellAdjustmentCopper > 0 ? 'color: green;' : 'color: red;'}">Haggle ${sellAdjLabel}:</strong> ${sellAdjustmentCopper > 0 ? '+' : '-'}${sellAdjFormatted}${sellPercentLabel}</p>`;
            }
            receiptContent += `<p><strong>Final Sale Value:</strong> ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(finalSellCopper))}</p>`;
            receiptContent += `<hr>`;
        }

        // --- Net Transaction ---
        receiptContent += `<h4>Net Transaction:</h4>`;
        const netTransactionCopper = finalSellCopper - finalBuyCopper;
        const netTransactionFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(netTransactionCopper)));
        const netLabel = netTransactionCopper >= 0 ? "Received by Player" : "Paid by Player";
        receiptContent += `<p><strong>${netLabel}: ${netTransactionFormatted}</strong></p>`;

        // --- Currency Balance ---
        const formatCurrencyDetail = (currencyObj) => {
            let parts = [];
            if (currencyObj.pp) parts.push(`${currencyObj.pp} Platinum`);
            if (currencyObj.gp) parts.push(`${currencyObj.gp} Gold`);
            if (currencyObj.ep) parts.push(`${currencyObj.ep} Electrum`);
            if (currencyObj.sp) parts.push(`${currencyObj.sp} Silver`);
            if (currencyObj.cp) parts.push(`${currencyObj.cp} Copper`);
            return parts.length > 0 ? parts.join(', ') : '0 Gold';
        };
        receiptContent += `<p><strong>Previous Funds:</strong> ${formatCurrencyDetail(oldCurrency)}</p>`;
        receiptContent += `<p><strong>Funds After Transaction:</strong> ${formatCurrencyDetail(newCurrency)}</p>`;
        receiptContent += `<hr>`;

        receiptContent += `<p><em>Thank you for your business!</em></p>`;
            // Add note about manual currency update only if automatic update failed
        const currencySetSuccessfully = ShopSystem.utils.setCharacterCurrency(charId, newCurrency); // Check again
        if (!currencySetSuccessfully) {
            receiptContent += `<p><strong>IMPORTANT:</strong> <em style="color: red;">Could not automatically update character sheet currency. Please update manually.</em></p>`;
        }
        if (soldItems.length > 0) {
            receiptContent += `<p><strong>IMPORTANT:</strong> <em style="color: red;">Please manually remove sold items from your character sheet.</em></p>`;
        }
        receiptContent += `</div>`; // Close styling div

        // --- Create Handout ---
        const receiptHandout = createObj('handout', {
            name: receiptTitle,
            inplayerjournals: playerId,
            controlledby: playerId,
            archived: false
        });

        if (receiptHandout) {
            setTimeout(() => {
                receiptHandout.set('notes', receiptContent);
                ShopSystem.utils.log(`Generated combined receipt handout: ${receiptTitle} for player ${playerName}`, 'info');
            }, 150); // Slightly longer delay
        } else {
            ShopSystem.utils.log(`Failed to create combined receipt handout for player ${playerName}`, 'error');
        }
    },

    // [TAG: HAGGLE_GM_PROMPT] // Updated for Buy/Sell context & Explicit Haggle Type
    initiateHaggle(playerId, forcedHaggleType = null) { // Add forcedHaggleType parameter
        ShopSystem.utils.log(`initiateHaggle called for player: ${playerId}, ForcedType: ${forcedHaggleType}`, 'debug');

        const buyBasket = state.ShopSystem.playerBaskets?.[playerId] || [];
        const sellBasket = state.ShopSystem.sellBaskets?.[playerId] || [];
        const isMerged = this.basketState.isMerged(playerId); // Check if currently merged

        // --- Calculate Individual Totals ---
        let buyTotalCopper = 0;
        buyBasket.forEach(item => {
            buyTotalCopper += ShopSystem.utils.toCopper(item.price) * item.quantity;
        });

        let sellTotalCopper = 0;
        if (sellBasket.length > 0) {
             const shop = ShopSystem.state.activeShop;
             const sellModifier = shop?.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
             sellBasket.forEach(item => {
                 const basePriceCopper = ShopSystem.utils.toCopper(item.baseValue || item.price); // Use baseValue if available
                 sellTotalCopper += Math.floor(basePriceCopper * sellModifier) * item.quantity;
             });
        }

        // --- Determine Haggle Context & Format Basket Total for Prompt ---
        let haggleType = 'buy'; // Default
        let basketTotalFormatted = "N/A";

        if (forcedHaggleType === 'sell') {
            haggleType = 'sell';
            if (sellBasket.length === 0) {
                ShopSystem.utils.chat('📭 Cannot haggle on sell value with an empty sell basket!', playerId);
                return;
            }
            basketTotalFormatted = `Sell Value: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(sellTotalCopper))}`;
        } else if (isMerged) {
             // Explicitly merged: Calculate net difference and determine type
             const netCopper = sellTotalCopper - buyTotalCopper;
             haggleType = (buyTotalCopper >= sellTotalCopper) ? 'buy' : 'sell'; // Focus on larger value or buy if equal
             basketTotalFormatted = `${netCopper >= 0 ? 'Net Gain' : 'Net Cost'}: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(netCopper)))} (Merged)`;
        } else {
             // Not merged, not forced sell -> Default to 'buy' context (from !shop basket haggle)
             haggleType = 'buy';
             if (buyBasket.length === 0) {
                 ShopSystem.utils.chat('📭 Cannot haggle on buy price with an empty buy basket!', playerId);
                 return;
             }
             basketTotalFormatted = `Buy Cost: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(buyTotalCopper))}`;
        }

        // Final check if *any* relevant basket is empty for the determined type
         if ((haggleType === 'buy' && buyBasket.length === 0) || (haggleType === 'sell' && sellBasket.length === 0 && !isMerged /* allow merged haggle even if sell is 0 */ )) {
             ShopSystem.utils.chat(`📭 Cannot haggle - relevant basket is empty (Type: ${haggleType})!`, playerId);
             return;
        }

         ShopSystem.utils.log(`Haggle Context Determined: Type=${haggleType}, BuyTotal=${buyTotalCopper}, SellTotal=${sellTotalCopper}, Merged=${isMerged}`, 'debug');

        // Replace the old haggle check code in initiateHaggle with:
        const shop = ShopSystem.state.activeShop;
            
        // Check if haggling is available
        if (!shop.haggle || shop.haggle.remaining_attempts <= 0) {
            ShopSystem.utils.chat('❌ The merchant is no longer interested in haggling.', playerId);
            if (isMerged) this.viewMergedBasket(playerId);
            else if (forcedHaggleType === 'sell') this.viewSellBasket(playerId);
            else this.viewBasket(playerId);
            return;
        }

        // Deduct one attempt
        shop.haggle.remaining_attempts--;
        const shopHandout = getObj("handout", shop.id);
        if (shopHandout) {
            shopHandout.set("gmnotes", JSON.stringify(shop));
        }
        ShopSystem.utils.log(`Store haggle attempts: ${shop.haggle.remaining_attempts}/${shop.haggle.max_attempts} remaining`, 'debug');

        // Initialize haggle results state if needed
        if (!state.ShopSystem.haggleResults) state.ShopSystem.haggleResults = {};
        if (!state.ShopSystem.haggleResults[playerId]) {
            state.ShopSystem.haggleResults[playerId] = { 
                applied: false, 
                originalBuyBasketPriceCopper: 0, 
                originalSellBasketPriceCopper: 0 
            };
        }
        const haggleState = state.ShopSystem.haggleResults[playerId];

        if (haggleState.applied) {
            ShopSystem.utils.chat('❌ Haggle result already applied for this transaction.', playerId);
            // Determine which basket view to show based on current state
            if (isMerged) this.viewMergedBasket(playerId);
            else if (forcedHaggleType === 'sell') this.viewSellBasket(playerId);
            else this.viewBasket(playerId);
            return;
        }

        if (!shop.haggle || shop.haggle.remaining_attempts <= 0) {
            ShopSystem.utils.chat('❌ The merchant is no longer interested in haggling.', playerId);
            if (isMerged) this.viewMergedBasket(playerId);
            else if (forcedHaggleType === 'sell') this.viewSellBasket(playerId);
            else this.viewBasket(playerId);
            return;
        }

        // --- Store Original Prices & Determined Haggle Type Temporarily ---
        // These are used by handleHaggleRoll and handleHaggleApply if needed
        haggleState.originalBuyBasketPriceCopper = buyTotalCopper; 
        haggleState.originalSellBasketPriceCopper = sellTotalCopper;
        haggleState.tempHaggleType = haggleType; // Store the determined type for handleHaggleRoll

        // --- Show GM Prompt ---
        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';
        const allowCmd = `!shop basket haggle_show_skills ${playerId}`;
        const denyCmd = `!shop basket haggle_deny ${playerId}`;

        const gmMenu = `&{template:default} {{name=Haggle Attempt (${shop.haggle.max_attempts - shop.haggle.remaining_attempts + 1}/${shop.haggle.max_attempts})}}` +
                       `{{Player=${playerName} (ID: ${playerId})}}` +
                       `{{Basket=${basketTotalFormatted}}}` + // Use the formatted total
                       `{{Haggle Focus=${haggleType}}}` + // Show the haggle focus
                       `{{Prompt=${playerName} wants to haggle. Allow skill check?}}` +
                       `{{Actions=[💬 Allow Skill Check](${allowCmd}) | [❌ Deny Attempt](${denyCmd})}}`;

        ShopSystem.utils.sendGMMessage(gmMenu);
        ShopSystem.utils.chat('You attempt to haggle... The GM is considering your request.', playerId);
    },

    // [TAG: HAGGLE_SHOW_SKILLS] Display haggle skill options to the player
    showHaggleSkillsMenu(playerId) {
        ShopSystem.utils.log(`showHaggleSkillsMenu called for playerId: ${playerId}`, 'debug'); 
        ShopSystem.utils.log(`Inspecting basket state for ${playerId}: ${JSON.stringify(state.ShopSystem.playerBaskets?.[playerId])}`, 'debug');

        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.chat('❌ No active shop available for haggling.', playerId);
            return;
        }
        // Check if haggle already applied
        if (state.ShopSystem.haggleResults && state.ShopSystem.haggleResults[playerId]?.applied) {
            ShopSystem.utils.chat('❌ Haggle result already applied for this transaction.', playerId);
            this.viewBasket(playerId); // Show basket with applied haggle
            return;
        }
        // TODO: Add check for MAX_ATTEMPTS

        // Merchant DC calculation
        const shop = ShopSystem.state.activeShop;
        const merchantType = shop.merchant_type || CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE;
        const merchantConfig = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === merchantType) ||
                            CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE);
        const dcMod = merchantConfig?.dcMod || 0;
        const baseDC = CONFIG.HAGGLE.BASE_DC || 15;
        let finalDC = baseDC + dcMod;

        // Use skills from CONFIG, ensuring "Sleight of Hand" is treated case-insensitively if present
        const skills = CONFIG.HAGGLE.SKILLS.map(s => s.toLowerCase()) || ["persuasion", "deception", "intimidation"];
        const skillEmojis = {
            persuasion: "💬",
            deception: "🎭",
            intimidation: "😠",
            "sleight of hand": "🎯" // Key is lowercase
        };

        let skillButtons = skills.map(skill => {
            // Capitalize skill name for display (handle multi-word like Sleight of Hand)
            const skillName = skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const emoji = skillEmojis[skill] || "🎲"; // Use lowercase skill for emoji lookup
            const command = `!shop basket haggle_check ${playerId} ${skillName} ${finalDC}`; // Pass capitalized skill name
            const isSleightOfHand = skill === 'sleight of hand';
            const label = `${emoji} ${skillName}${isSleightOfHand ? ' (DE)' : ''}`; // Add (DE) for Sleight of Hand
            return `[${label}](${command})`;
        }).join(' | ');

        // Before building the menu:
        const haggleType = state.ShopSystem.haggleResults?.[playerId]?.tempHaggleType;
        const isSellFlow = (typeof haggleType !== 'undefined') ? (haggleType === 'sell') : false;
        const backToBasketCmd = isSellFlow ? '!shop sell view' : '!shop basket view';

        // Then in your menu string:
        const menu = `&{template:default} {{name=Attempt to Haggle}}` +
            `{{Shop=${shop.name || "Shop"} - ${shop.merchant_name || "Merchant"}}}` +
            `{{Instructions=Select a skill to attempt to haggle for a better price:}}` +
            `{{Skills=${skillButtons}}}` +
            `{{Note=Success is not guaranteed! (Sleight of Hand DE: Not Implemented)}}` +
            `{{Actions=[↩️ Back to Basket](${backToBasketCmd})}}`;

        ShopSystem.utils.chat(menu, playerId); // Whisper to the player
    },

    // [TAG: HAGGLE_HANDLE_CHECK] GM receives player's skill choice and sets up roll expectation
    handleHaggleCheck(playerId, skillType, dc) {
        if (!state.ShopSystem.haggleResults) state.ShopSystem.haggleResults = {};
        if (!state.ShopSystem.haggleResults[playerId]) state.ShopSystem.haggleResults[playerId] = {};

        // Merchant DC calculation
        const shop = ShopSystem.state.activeShop;
        const merchantType = shop.merchant_type || CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE;
        const merchantConfig = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === merchantType) ||
                            CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE);
        const dcMod = merchantConfig?.dcMod || 0;
        const baseDC = CONFIG.HAGGLE.BASE_DC || 15;
        const calculatedDC = baseDC + dcMod;

        // If the DC passed in matches the calculated value, recalculate in case merchant type changed
        if (!dc || parseInt(dc, 10) === baseDC) {
            state.ShopSystem.haggleResults[playerId].dc = calculatedDC;
        } else {
            state.ShopSystem.haggleResults[playerId].dc = parseInt(dc, 10);
        }

        // Check if haggle already applied
        if (state.ShopSystem.haggleResults && state.ShopSystem.haggleResults[playerId]?.applied) {
            ShopSystem.utils.sendGMMessage(`Haggle attempt by Player ID ${playerId} ignored: Haggle already applied.`);
            ShopSystem.utils.chat('❌ Haggle result already applied for this transaction.', playerId);
            return;
        }
        // TODO: Add check for MAX_ATTEMPTS

        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';

        // Handle Sleight of Hand (DE)
        if (skillType.toLowerCase() === 'sleight of hand') {
            ShopSystem.utils.sendGMMessage(`Player ${playerName} attempted Sleight of Hand haggle (DE - Not Implemented).`);
            ShopSystem.utils.chat('😅 Shoplifting mechanic (Sleight of Hand) is not yet implemented.', playerId);
            this.handleHaggleDeny(playerId); // Deny for now
            return;
        }

        if (!ShopSystem.state.activeShop) {
            ShopSystem.utils.sendGMMessage(`❌ Error: No active shop for ${playerName}'s haggle check.`);
            ShopSystem.utils.chat('❌ Error: No active shop to haggle with!', playerId);
            return;
        }

        // Use the DC from state if set, otherwise calculate as before
        let finalDC = state.ShopSystem.haggleResults?.[playerId]?.dc;
        if (typeof finalDC === 'undefined' || finalDC === null) {
            finalDC = calculatedDC;
        }

        const skillEmojis = {
            Persuasion: "💬", Deception: "🎭", Intimidation: "😠", "Sleight of Hand": "🎯"
        };
        const emoji = skillEmojis[skillType] || "🎲";

        // Prompt GM for roll handling
        const gmMenu = `&{template:default} {{name=${emoji} ${skillType} Check (DC ${finalDC})}}` +
            `{{Player=${playerName} (ID: ${playerId})}}` +
            `{{Merchant Type=${merchantType} (DC Mod: ${dcMod > 0 ? '+' + dcMod : dcMod})}}` +
            `{{Instructions=Select how to handle the roll:}}` +
            `{{Roll Options=` +
            `[Normal](!shop basket haggle_roll ${playerId} ${skillType} normal ${finalDC}) | ` +
            `[Advantage](!shop basket haggle_roll ${playerId} ${skillType} advantage ${finalDC}) | ` +
            `[Disadvantage](!shop basket haggle_roll ${playerId} ${skillType} disadvantage ${finalDC})` +
            `}}` +
            `{{Manual/Edit=` +
            `[Accept Player Roll](!shop basket haggle_manual ${playerId} ${skillType} ${finalDC} ?{Enter Roll Result|10}) | ` +
            `[✏️ Edit DC](!shop basket haggle_check ${playerId} ${skillType} ?{New DC|${finalDC}})` +
            `}}` +
            `{{Actions=[❌ Deny Attempt](!shop basket haggle_deny ${playerId})}}`;

        ShopSystem.utils.sendGMMessage(gmMenu);

        // Notify player to wait
        ShopSystem.utils.chat(`The merchant considers your approach... Waiting for GM to proceed with your ${skillType} check.`, playerId);
    },

    // [TAG: HAGGLE_ACCEPT_PLAYER_ROLL] Instruct player to roll manually
    handleHaggleAccept(playerId, skillType, dc) {
        // Get player display name
       const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';
       const finalDC = parseInt(dc); // Ensure DC is a number

       // Get skill check emoji
       const skillEmojis = { Persuasion: "💬", Deception: "🎭", Intimidation: "😠", "Sleight of Hand": "🎯" };
       const emoji = skillEmojis[skillType] || "🎲";

       // Notify the player to make their roll
       const playerMessage = `&{template:default} {{name=${emoji} ${skillType} Check (DC ${finalDC})}}` +
                             `{{Instructions=The GM allows your attempt! Make your ${skillType} check vs DC ${finalDC} using your character sheet.}}` +
                             `{{Note=The GM will determine the outcome based on your roll.}}`;

       ShopSystem.utils.chat(playerMessage, playerId);

       // Reminder for GM
       const gmMessage = `&{template:default} {{name=Haggle Check Accepted}}` +
                         `{{Player=${playerName}}} ` +
                         `{{Action=Instructed to make a ${skillType} check vs DC ${finalDC}.}} ` +
                         `{{Next Step=Observe player's roll in chat and determine haggle outcome manually.}}`;

       ShopSystem.utils.sendGMMessage(gmMessage);

        // Clear any pending roll state, as the roll is now manual
       if (state.ShopSystem.pendingHaggleRolls?.[playerId]) {
           delete state.ShopSystem.pendingHaggleRolls[playerId];
            ShopSystem.utils.log(`Cleared pending haggle roll state for ${playerId} due to manual roll acceptance.`, 'debug');
       }
   },

    // [TAG: HAGGLE_DENY] Handle GM denying the haggle attempt
    handleHaggleDeny(playerId) {
        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';

        // Notify the player that their haggle attempt was rejected
         // Use merchant personality for flavor
        const shop = ShopSystem.state.activeShop;
        const merchantType = shop?.merchant_type || CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE;
        const merchantConfig = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === merchantType) ||
                                 CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE); // Default personality
        const denialMessage = merchantConfig?.critFailure || "The merchant refuses to negotiate on the price."; // Use critFailure for flavor

        // Before building the playerMessage:
        const haggleType = state.ShopSystem.haggleResults?.[playerId]?.tempHaggleType; // or however you track it
        const isSellFlow = (typeof haggleType !== 'undefined') ? (haggleType === 'sell') : false;
        const backToBasketCmd = isSellFlow ? '!shop sell view' : '!shop basket view';

        // Then in your playerMessage string:
        const playerMessage = `&{template:default} {{name=Haggle Attempt Denied}}` +
            `{{Result=${denialMessage}}}` +
            `{{Actions=[↩️ View Basket](${backToBasketCmd})}}`;

        ShopSystem.utils.chat(playerMessage, playerId);

        // Notify GM
        ShopSystem.utils.sendGMMessage(`Haggle attempt for ${playerName} was denied.`);

         // Clear any pending roll state
        if (state.ShopSystem.pendingHaggleRolls?.[playerId]) {
            delete state.ShopSystem.pendingHaggleRolls[playerId];
             ShopSystem.utils.log(`Cleared pending haggle roll state for ${playerId} due to denial.`, 'debug');
        }
         // Clear any applied haggle results if the GM denies after applying (unlikely but possible)
         if (state.ShopSystem.haggleResults?.[playerId]) {
             delete state.ShopSystem.haggleResults[playerId];
             ShopSystem.utils.log(`Cleared applied haggle result for ${playerId} due to denial.`, 'debug');
         }
    },

    handleHaggleRoll(playerId, skillType, advantage, dc) {
        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';
        const finalDC = parseInt(dc); // Ensure DC is a number

        // --- Retrieve original prices and haggle type stored by initiateHaggle ---
        const haggleState = state.ShopSystem.haggleResults?.[playerId];
        
        // Ensure haggleState and its necessary properties exist
        if (!haggleState || 
            haggleState.originalBuyBasketPriceCopper === undefined || 
            haggleState.originalSellBasketPriceCopper === undefined || 
            haggleState.tempHaggleType === undefined) {
            ShopSystem.utils.log(`Error: Could not retrieve complete haggle state for player ${playerId} in handleHaggleRoll. HaggleState: ${JSON.stringify(haggleState)}`, 'error');
            ShopSystem.utils.sendGMMessage(`❌ Error initiating haggle roll for ${playerName}. Haggle state missing critical info.`);
            return;
        }

        const originalBuyCopperPrice = haggleState.originalBuyBasketPriceCopper;
        const originalSellCopperPrice = haggleState.originalSellBasketPriceCopper;
        const haggleTypeToStore = haggleState.tempHaggleType;

        // Store pending roll information
        if (!state.ShopSystem.pendingHaggleRolls) {
            state.ShopSystem.pendingHaggleRolls = {};
        }
        state.ShopSystem.pendingHaggleRolls[playerId] = {
            skillType: skillType, 
            dc: finalDC,
            advantage: advantage, 
            haggleType: haggleTypeToStore, // Uses the correctly scoped variable
            originalBuyBasketPriceCopper: originalBuyCopperPrice,
            originalSellBasketPriceCopper: originalSellCopperPrice
        };
        ShopSystem.utils.log(`Stored pending haggle roll: ${JSON.stringify(state.ShopSystem.pendingHaggleRolls[playerId])}`, 'debug');

        // --- Notify player to roll (remains the same) ---
        let rollInstructions = '';
        if (advantage === 'advantage') {
            rollInstructions = `Roll ${skillType} *with advantage*`;
        } else if (advantage === 'disadvantage') {
            rollInstructions = `Roll ${skillType} *with disadvantage*`;
        } else {
            rollInstructions = `Roll ${skillType}`;
        }

        const skillEmojis = { Persuasion: "💬", Deception: "🎭", Intimidation: "😠" };
        const emoji = skillEmojis[skillType] || "🎲";

        const playerMessage = `&{template:default} {{name=${emoji} ${skillType} Check (DC ${finalDC})}}` +
                              `{{Instructions=${rollInstructions} using your character sheet.}}`;

        ShopSystem.utils.chat(playerMessage, playerId);

        // --- Notify GM (remains the same) ---
        const gmMessage = `&{template:default} {{name=Haggle Roll Instruction}}` +
                          `{{Player=${playerName}}}` +
                          `{{Action=Instructed to roll ${skillType} (${advantage}) vs DC ${finalDC}}}`+
                           // Clarify which value the haggle type is based on
                          `{{Haggle Type=${haggleTypeToStore}}}`; // CORRECTED TO USE haggleTypeToStore

        ShopSystem.utils.sendGMMessage(gmMessage);
    },

    // [TAG: HAGGLE_HANDLE_ROLL_RESULT] // Updated for Buy/Sell Context
    handleHaggleRollResult(finalRollValue, playerId, isNat1, isNat20) {
        const pending = state.ShopSystem.pendingHaggleRolls?.[playerId];
        ShopSystem.utils.log(`DEBUG handleHaggleRollResult: Pending object = ${JSON.stringify(pending)}`, 'debug'); // ADD THIS LINE
        if (!pending) {
            ShopSystem.utils.log(`Received haggle roll result for ${playerId}, but no pending haggle found. Ignoring.`, 'debug');
            return;
        }

        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';
        // Destructure all necessary values from the pending state
        const { skillType, dc, haggleType, originalBuyBasketPriceCopper, originalSellBasketPriceCopper } = pending;
        const advantageThreshold = CONFIG.HAGGLE.ADVANTAGE_THRESHOLD || 5;
        ShopSystem.utils.log(`DEBUG handleHaggleRollResult pending values: originalBuyBasketPriceCopper=${originalBuyBasketPriceCopper} (type: ${typeof originalBuyBasketPriceCopper}), originalSellBasketPriceCopper=${originalSellBasketPriceCopper} (type: ${typeof originalSellBasketPriceCopper}), haggleType=${haggleType}`, 'debug');
        const maxAdjustment = CONFIG.PRICING.HAGGLE_MAX_ADJUSTMENT || 0.2; // Max adjustment (e.g., 20%)

        ShopSystem.utils.log(`Processing haggle result for ${playerName}: Roll=${finalRollValue}, DC=${dc}, Type=${haggleType}, BuyOrig=${originalBuyBasketPriceCopper}, SellOrig=${originalSellBasketPriceCopper}`, 'debug');

        // --- Get Merchant Personality Flavor ---
        const shop = ShopSystem.state.activeShop;
        const merchantType = shop?.merchant_type || CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE;
        const merchantConfig = CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === merchantType) ||
                                CONFIG.SHOP_SETTINGS.MERCHANT_TYPES.find(m => m.name === CONFIG.SHOP_SETTINGS.DEFAULTS.MERCHANT_TYPE);
        const successFlavor = merchantConfig?.critSuccess || "The merchant seems impressed.";
        const failureFlavor = merchantConfig?.critFailure || "The merchant doesn't seem convinced.";

        // --- Determine Success Level & Base Adjustment Percentage ---
        let priceAdjustmentPercent = 0; // Base percent (negative for discount, positive for markup/bonus)
        let resultMessage = '';
        let successLevel = 'failure';

        if (isNat1) {
            priceAdjustmentPercent = 0.10; // 10% penalty (higher buy price OR lower sell price)
            resultMessage = `❌ Critical Failure! ${failureFlavor}`;
            successLevel = 'crit_failure';
        } else if (isNat20) {
            priceAdjustmentPercent = -0.20; // 20% bonus (lower buy price OR higher sell price)
            resultMessage = `🎯 Critical Success! ${successFlavor}`;
            successLevel = 'crit_success';
        } else if (finalRollValue >= dc + advantageThreshold) {
            priceAdjustmentPercent = -0.15; // 15% bonus
            resultMessage = `✅ Great Success! The merchant is clearly impressed.`;
            successLevel = 'great_success';
        } else if (finalRollValue >= dc) {
            priceAdjustmentPercent = -0.10; // 10% bonus
            resultMessage = `✅ Success! The merchant nods, willing to adjust the price slightly.`;
            successLevel = 'success';
        } else {
            priceAdjustmentPercent = 0; // No change
            resultMessage = `❌ Failure. ${failureFlavor}`;
            successLevel = 'failure';
        }

        // --- Calculate Specific Adjustments based on Haggle Type ---
        let buyAdjustmentCopper = 0;
        let sellAdjustmentCopper = 0;
        let buyAdjustmentLabel = "No Change";
        let sellAdjustmentLabel = "No Change";
        let buyAdjustmentPercentLabel = "";
        let sellAdjustmentPercentLabel = "";

        // If haggle focuses on BUYING (lower price is better)
        if (haggleType === 'buy') {
            // Negative adjustmentPercent means discount (good), positive means markup (bad)
            buyAdjustmentCopper = Math.floor(originalBuyBasketPriceCopper * priceAdjustmentPercent);
            // Cap adjustment
            const maxBuyAdjustment = Math.floor(originalBuyBasketPriceCopper * maxAdjustment);
            buyAdjustmentCopper = Math.max(-maxBuyAdjustment, Math.min(maxBuyAdjustment, buyAdjustmentCopper));

            if (buyAdjustmentCopper < 0) {
                buyAdjustmentLabel = `Discount: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(buyAdjustmentCopper)))}`;
                buyAdjustmentPercentLabel = ` (${Math.round(Math.abs(buyAdjustmentCopper / originalBuyBasketPriceCopper) * 100)}%)`;
            } else if (buyAdjustmentCopper > 0) {
                buyAdjustmentLabel = `Markup: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(buyAdjustmentCopper))}`;
                buyAdjustmentPercentLabel = ` (+${Math.round(Math.abs(buyAdjustmentCopper / originalBuyBasketPriceCopper) * 100)}%)`;
            }
             ShopSystem.utils.log(`Haggle Type 'buy': Adjustment = ${buyAdjustmentCopper}cp`, 'debug');

        }
        // If haggle focuses on SELLING (higher price is better)
        else if (haggleType === 'sell') {
            // Negative adjustmentPercent means bonus (good), positive means penalty (bad)
            // So we FLIP the sign of priceAdjustmentPercent for calculation
            sellAdjustmentCopper = Math.floor(originalSellBasketPriceCopper * (-priceAdjustmentPercent));
            // Cap adjustment
            const maxSellAdjustment = Math.floor(originalSellBasketPriceCopper * maxAdjustment);
            sellAdjustmentCopper = Math.max(-maxSellAdjustment, Math.min(maxSellAdjustment, sellAdjustmentCopper));

             if (sellAdjustmentCopper > 0) {
                sellAdjustmentLabel = `Bonus: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(sellAdjustmentCopper))}`;
                 sellAdjustmentPercentLabel = ` (+${Math.round(Math.abs(sellAdjustmentCopper / originalSellBasketPriceCopper) * 100)}%)`;
            } else if (sellAdjustmentCopper < 0) {
                 sellAdjustmentLabel = `Penalty: ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(sellAdjustmentCopper)))}`;
                 sellAdjustmentPercentLabel = ` (${Math.round(Math.abs(sellAdjustmentCopper / originalSellBasketPriceCopper) * 100)}%)`;
             }
             ShopSystem.utils.log(`Haggle Type 'sell': Adjustment = ${sellAdjustmentCopper}cp`, 'debug');
        }

        // --- Present Results to GM ---
        const skillEmojis = { Persuasion: "💬", Deception: "🎭", Intimidation: "😠" };
        const emoji = skillEmojis[skillType] || "🎲";

        let gmResultMessage = `&{template:default} {{name=${emoji} Haggle Result}}` +
                            `{{Player=${playerName}}}` +
                            `{{Skill=${skillType}}}` +
                            `{{Roll=${finalRollValue} vs DC ${dc} (Nat1:${isNat1}, Nat20:${isNat20})}}}` +
                            `{{Outcome=${resultMessage}}}`;

        // Show relevant original price(s) and calculated adjustment(s)
         if (originalBuyBasketPriceCopper > 0) {
             gmResultMessage += `{{Buy Price Adjustment=${buyAdjustmentLabel}${buyAdjustmentPercentLabel}}}`;
         }
         if (originalSellBasketPriceCopper > 0) {
             gmResultMessage += `{{Sell Value Adjustment=${sellAdjustmentLabel}${sellAdjustmentPercentLabel}}}`;
         }

        // Determine GM actions based on success level
        if (successLevel === 'failure' || successLevel === 'crit_failure') {
            // Failure or Crit Failure
            const shopId = ShopSystem.state.activeShop?.id || 'UNKNOWN_SHOP';
            const blockCmd = `!shop haggle_block`;
            const sendToBasketCmd = `!shop basket haggle_deny ${playerId}`; // This sends player to basket, allows retry if attempts left & not blocked.

            const isSellFlow = (typeof haggleType !== 'undefined') ? (haggleType === 'sell') : false;
            const backToBasketCmd = `!shop basket send_player_to_basket ${playerId} ${isSellFlow ? 'sell' : 'buy'}`;
            
            gmResultMessage += `{{Actions=[🚫 Block Haggling](${blockCmd}) | [↩️ Send to Basket](${backToBasketCmd})}}`;

        } else {
            // Success, Great Success, or Crit Success
            const manualAdjustCmd = `!shop basket haggle_manual_adjust ${playerId}`; // (DE)
            gmResultMessage += `{{Actions=[✅ Apply Adjustments](!shop basket haggle_apply ${playerId} ${buyAdjustmentCopper} ${sellAdjustmentCopper}) [✏️ Manual Adjustment (DE)](${manualAdjustCmd}) [❌ Ignore/Deny](!shop basket haggle_deny ${playerId})}}`;
        }

        ShopSystem.utils.sendGMMessage(gmResultMessage);

        // --- Notify Player (Simpler) ---
        const playerResultMessage = `&{template:default} {{name=${emoji} Haggle Result}}` +
                                    `{{Roll Result=You rolled ${finalRollValue} vs DC ${dc}}}` +
                                    `{{Outcome=${resultMessage}}}` +
                                    `{{Status=The GM is reviewing the outcome...}}`;

        ShopSystem.utils.chat(playerResultMessage, playerId);

        // --- IMPORTANT: Clear the pending state AFTER processing ---
        delete state.ShopSystem.pendingHaggleRolls[playerId];
        ShopSystem.utils.log(`Haggle result processed for ${playerName}. Cleared pending roll state.`, 'info');
    },

    // [TAG: HAGGLE_APPLY] // Updated for Buy/Sell Context & Direct Confirmation
    handleHaggleApply(playerId, buyAdjustmentCopperStr, sellAdjustmentCopperStr) {
        const playerName = getObj('player', playerId)?.get('_displayname') || 'Unknown Player';
        const buyAdjustmentCopper = parseInt(buyAdjustmentCopperStr);
        const sellAdjustmentCopper = parseInt(sellAdjustmentCopperStr);

        if (isNaN(buyAdjustmentCopper) || isNaN(sellAdjustmentCopper)) {
                ShopSystem.utils.log(`Invalid haggle adjustment values received for ${playerId}: Buy=${buyAdjustmentCopperStr}, Sell=${sellAdjustmentCopperStr}`, 'error');
                ShopSystem.utils.sendGMMessage(`❌ Error applying haggle for ${playerName}: Invalid adjustment values.`);
                return;
        }

        // --- Retrieve Original Prices (Important for Receipt/Confirmation Display) ---
        // Get originals from haggle state if available (should be from initiateHaggle)
        const haggleState = state.ShopSystem.haggleResults?.[playerId];
        let originalBuyCopper = haggleState?.tempOriginalBuyCopper; // Use temp values if still available
        let originalSellCopper = haggleState?.tempOriginalSellCopper;

        // Recalculate if missing (fallback, less ideal but necessary)
        if (originalBuyCopper === undefined || originalSellCopper === undefined) {
                ShopSystem.utils.log(`Original prices missing in haggleState for ${playerId}. Recalculating...`, 'warn');
                const buyBasket = (this.basketState.isMerged(playerId) ? state.ShopSystem.mergedBaskets?.[playerId]?.originalBuyBasket : state.ShopSystem.playerBaskets?.[playerId]) || [];
                const sellBasket = (this.basketState.isMerged(playerId) ? state.ShopSystem.mergedBaskets?.[playerId]?.originalSellBasket : state.ShopSystem.sellBaskets?.[playerId]) || [];
                originalBuyCopper = 0;
                originalSellCopper = 0;
                buyBasket.forEach(item => { originalBuyCopper += ShopSystem.utils.toCopper(item.price) * item.quantity; });
                if (sellBasket.length > 0) {
                    const shop = ShopSystem.state.activeShop;
                    const sellModifier = shop?.price_modifiers?.sell || CONFIG.PRICING.SELL_PRICE_MODIFIER;
                    sellBasket.forEach(item => {
                        const basePrice = ShopSystem.utils.toCopper(item.baseValue || item.price);
                        originalSellCopper += Math.floor(basePrice * sellModifier) * item.quantity;
                    });
                }
                // Store recalculated values back into haggleState if it exists
                if (haggleState) {
                haggleState.originalBuyBasketPriceCopper = originalBuyCopper;
                haggleState.originalSellBasketPriceCopper = originalSellCopper;
                }
        }
        // --- End Original Price Retrieval ---


        // Store haggle result in state for checkout
        if (!state.ShopSystem.haggleResults) {
            state.ShopSystem.haggleResults = {};
        }

        state.ShopSystem.haggleResults[playerId] = {
            originalBuyBasketPriceCopper: originalBuyCopper, // Store original BUY total
            originalSellBasketPriceCopper: originalSellCopper, // Store original SELL total
            buyAdjustmentCopper: buyAdjustmentCopper,         // Store BUY adjustment (+/-)
            sellAdjustmentCopper: sellAdjustmentCopper,       // Store SELL adjustment (+/-)
            applied: true,
        };
            ShopSystem.utils.log(`Stored haggle results for ${playerId}: ${JSON.stringify(state.ShopSystem.haggleResults[playerId])}`, 'debug');


        // --- Notify Player and GM ---
        let resultsText = [];
        if (buyAdjustmentCopper !== 0) {
                const buyAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(buyAdjustmentCopper)));
                const buyAdjLabel = buyAdjustmentCopper < 0 ? 'Buy Discount' : 'Buy Markup';
                const buyPercentLabel = originalBuyCopper > 0 ? ` (${Math.round(Math.abs(buyAdjustmentCopper / originalBuyCopper) * 100)}%)` : '';
                resultsText.push(`${buyAdjLabel}: ${buyAdjFormatted}${buyPercentLabel}`);
        }
        if (sellAdjustmentCopper !== 0) {
                const sellAdjFormatted = ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(sellAdjustmentCopper)));
                const sellAdjLabel = sellAdjustmentCopper > 0 ? 'Sell Bonus' : 'Sell Penalty';
                const sellPercentLabel = originalSellCopper > 0 ? ` (${Math.round(Math.abs(sellAdjustmentCopper / originalSellCopper) * 100)}%)` : '';
                resultsText.push(`${sellAdjLabel}: ${sellAdjFormatted}${sellPercentLabel}`);
        }
        if (resultsText.length === 0) {
                resultsText.push("No price change applied.");
        }

        // Send confirmation to player
        let playerMessage = `&{template:default} {{name=Haggle Result Applied}}` +
                            `{{Result=${resultsText.join('<br>')}}}` + // Show both results
                            `{{Note=The price adjustment will be reflected at checkout.}}`+
                            `{{Actions=[↩️ Proceed to Confirm Purchase](!shop basket checkout)}}`; // Changed button to proceed

        ShopSystem.utils.chat(playerMessage, playerId);

        // Notify GM
        ShopSystem.utils.sendGMMessage(`✅ Haggle adjustments applied for ${playerName}: Buy Adj=${buyAdjustmentCopper}cp, Sell Adj=${sellAdjustmentCopper}cp.`);

        // --- CHANGE HERE: Proceed directly to purchase confirmation ---
            const charId = state.ShopSystem.activeCharacters[playerId];
            if (charId) {
                ShopSystem.utils.log(`Haggle applied for ${playerName}. Calling confirmPurchase for charId: ${charId}`, 'debug');
                this.confirmPurchase(playerId, charId); // Call confirmPurchase directly
            } else {
                ShopSystem.utils.log(`Error: Could not find active character ID for player ${playerId} after applying haggle. Cannot proceed to confirmation.`, 'error');
                ShopSystem.utils.chat('❌ Error: Could not find your selected character to confirm purchase.', playerId);
                // Show basket as fallback
                this.viewBasket(playerId);
            }
    },

    // [TAG: SHOP_87_save_basket_state] - Using state directly
    saveBasketState() {
        if (!state.ShopSystem.playerBaskets || Object.keys(state.ShopSystem.playerBaskets).length === 0) {
            return; 
        }
        let handout = findObjs({ _type: 'handout', name: 'ShopSystem-Baskets' })[0];
        if (!handout) {
            handout = createObj('handout', { name: 'ShopSystem-Baskets' });
        }
        const basketData = { baskets: state.ShopSystem.playerBaskets, timestamp: Date.now() };
        handout.set('gmnotes', JSON.stringify(basketData, null, 2));
        ShopSystem.utils.log('✅ Saved basket state to handout', 'debug');
    },

    // [TAG: SHOP_88_load_basket_state] - Using state directly
    loadBasketState() {
        const handout = findObjs({ _type: 'handout', name: 'ShopSystem-Baskets' })[0];
        if (!handout) {
            ShopSystem.utils.log('ℹ️ No saved basket state found', 'info');
            return;
        }
        handout.get('gmnotes', function(notes) {
            if (!notes) {
                ShopSystem.utils.log('ℹ️ No basket data in handout', 'info');
                return;
            }
            try {
                const cleanNotes = ShopSystem.utils.cleanHandoutNotes(notes);
                const basketData = JSON.parse(cleanNotes);
                if (basketData && basketData.baskets) {
                    state.ShopSystem.playerBaskets = basketData.baskets;
                    ShopSystem.utils.log(`✅ Loaded basket state for ${Object.keys(basketData.baskets).length} players`, 'info');
                    // Validation might be needed here if shops change significantly
                }
            } catch (e) {
                ShopSystem.utils.log(`❌ Error loading basket state: ${e.message}`, 'error');
            }
        });
    },

// [TAG: BASKET_STATE_MANAGEMENT]
basketState: {
    isMerged: function(playerID) {
        const mergeState = state.ShopSystem.mergedBaskets?.[playerID];
        ShopSystem.utils.log(`Merge Check for ${playerID}: State = ${JSON.stringify(mergeState)}`, 'debug');
        return mergeState?.isMerged || false;
    },

    lockBaskets: function(playerID) {
        if (!state.ShopSystem.mergedBaskets) {
            state.ShopSystem.mergedBaskets = {};
        }
        state.ShopSystem.mergedBaskets[playerID] = {
            isMerged: true,
            mergedTime: Date.now(),
            // Correctly reference playerBaskets
            originalBuyBasket: [...(state.ShopSystem.playerBaskets?.[playerID] || [])], 
            originalSellBasket: [...(state.ShopSystem.sellBaskets?.[playerID] || [])]
        };
    },

    unlockBaskets: function(playerID) {
        if (state.ShopSystem.mergedBaskets?.[playerID]) {
            ShopSystem.utils.log(`Unlocking baskets for ${playerID}. Deleting entry...`, 'debug');
            delete state.ShopSystem.mergedBaskets[playerID];
            ShopSystem.utils.log(`Entry deleted for ${playerID}. Current mergedBaskets: ${JSON.stringify(state.ShopSystem.mergedBaskets)}`, 'debug');
        } else {
             ShopSystem.utils.log(`No merged basket entry found to unlock for ${playerID}.`, 'debug');
        }
    },

    validateBasketState: function(playerID) {
        // Check for expired merges
        if (this.isMerged(playerID)) {
            const mergedTime = state.ShopSystem.mergedBaskets[playerID].mergedTime;
            if (Date.now() - mergedTime > CONFIG.BASKET_STATE.MERGE_TIMEOUT) {
                this.unlockBaskets(playerID);
                return false;
            }
        }
        return true;
    },

    canMergeBaskets: function(playerID) {
        // Correctly check playerBaskets and sellBaskets
        const buyBasket = state.ShopSystem.playerBaskets?.[playerID] || []; 
        const sellBasket = state.ShopSystem.sellBaskets?.[playerID] || [];
        ShopSystem.utils.log(`Merge Check for ${playerID}: Buy Basket Length=${buyBasket.length}, Sell Basket Length=${sellBasket.length}`, 'debug'); // Added debug log
        return buyBasket.length > 0 && sellBasket.length > 0;
    }
},

    // [TAG: BASKET_MERGE_COMMANDS]
    mergeBaskets: function(playerID) {
        // Validate current state
        this.basketState.validateBasketState(playerID);
        
        // Correctly check playerBaskets and sellBaskets
        const buyBasket = state.ShopSystem.playerBaskets?.[playerID] || []; 
        const sellBasket = state.ShopSystem.sellBaskets?.[playerID] || [];

        // Check if merge is possible
        if (buyBasket.length === 0 || sellBasket.length === 0) {
            // Use ShopSystem.CONFIG to access error messages
            ShopSystem.utils.chat(ShopSystem.CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.NEED_BOTH_BASKETS, playerID); 
            return;
        }
        if (this.basketState.isMerged(playerID)) {
            // Use ShopSystem.CONFIG to access error messages
            ShopSystem.utils.chat(ShopSystem.CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.ALREADY_MERGED, playerID); 
            return;
        }

        // Lock baskets
        this.basketState.lockBaskets(playerID);

        // Show merged basket view
        this.viewMergedBasket(playerID);
    },

    unmergeBaskets: function(playerID) {
        if (!this.basketState.isMerged(playerID)) {
             // Use CONFIG directly for error message
            ShopSystem.utils.chat(CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.NO_BASKETS_TO_UNMERGE, playerID);
            return;
        }
        
        ShopSystem.utils.log(`Attempting to unmerge baskets for ${playerID}. Current state: ${JSON.stringify(state.ShopSystem.mergedBaskets?.[playerID])}`, 'debug');
        this.basketState.unlockBaskets(playerID); // unlockBaskets handles the deletion
        ShopSystem.utils.log(`Baskets unmerged for ${playerID}. New state: ${JSON.stringify(state.ShopSystem.mergedBaskets?.[playerID])}`, 'debug');
        ShopSystem.utils.chat("✅ Baskets unmerged. You can modify them separately again.", playerID);
    },

    // [TAG: BASKET_MERGE_VIEW]
    viewMergedBasket: function(playerID) {
        if (!this.basketState.isMerged(playerID)) {
            // Use CONFIG directly to access error messages
            ShopSystem.utils.chat(CONFIG.DISPLAY.BASKET_STATE.ERROR_MESSAGES.NOT_MERGED, playerID); 
            return;
        }

        // Correctly reference playerBaskets and sellBaskets
        const buyBasket = state.ShopSystem.playerBaskets?.[playerID] || []; 
        const sellBasket = state.ShopSystem.sellBaskets?.[playerID] || [];
        
        let totalBuyCopper = 0;
        let totalSellCopper = 0;
        
        let output = "&{template:default} {{name=📝 Combined Transaction}}";
        
        // Display Buy Items
        if (buyBasket.length > 0) {
            output += " {{Buying=";
            buyBasket.forEach(item => {
                const itemTotalCopper = ShopSystem.utils.toCopper(item.price) * item.quantity;
                totalBuyCopper += itemTotalCopper;
                // Display price for the total quantity of this item
                output += `\n${item.name} (x${item.quantity}) - 💰 ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(itemTotalCopper))}`; 
            });
            output += "}}";
        }
        
        // Display Sell Items
        if (sellBasket.length > 0) {
            output += " {{Selling=";
            // Access CONFIG directly
            const sellModifier = CONFIG.PRICING.SELL_PRICE_MODIFIER; 
            sellBasket.forEach(item => {
                // Use baseValue if available (for player-sold items), otherwise use item.price
                const basePriceCopper = ShopSystem.utils.toCopper(item.baseValue || item.price); 
                const sellItemTotalCopper = Math.floor(basePriceCopper * sellModifier) * item.quantity;
                totalSellCopper += sellItemTotalCopper;
                 // Display price for the total quantity of this item
                output += `\n${item.name} (x${item.quantity}) - 💰 ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(sellItemTotalCopper))}`;
            });
            output += "}}";
        }
        
        // Display Total Balance
        const finalBalanceCopper = totalSellCopper - totalBuyCopper;
        output += ` {{Total=${finalBalanceCopper >= 0 ? "You receive: " : "You pay: "} 💰 ${ShopSystem.utils.formatCurrency(ShopSystem.utils.fromCopper(Math.abs(finalBalanceCopper)))}}}`;
        
        // Add Actions
        output += ` {{Actions=[Haggle](!shop basket haggle) [Checkout](!shop basket checkout) [Unmerge](!shop basket unmerge)}}`;
        
        ShopSystem.utils.chat(output, playerID); // Whisper the menu
    },
},

// [TAG: MERGED_8] // This tag needs to be fixed (You can update this tag later if needed)
commands: {
    // [TAG: MERGED_9] - Fixed command routing
    handleCommand: function(msg) {
        if (msg.type !== "api" && (!state.ShopSystem.isImporting || msg.type !== "general")) return;
        
        // Handle API commands
        if (msg.type === "api") {
            // Parse arguments respecting quotes
            const allArgs = ShopSystem.utils.parseCommandArgs(msg.content);
            if (!allArgs || allArgs.length === 0) { // Handle empty or malformed command string
                ShopSystem.utils.log("Empty or malformed command received after parsing.", "warn");
                return;
            }
            const command = allArgs[0].toLowerCase(); // This is !shop or !itemdb etc.
            const args = allArgs.slice(1); // These are the arguments *after* the main command particle

        // Debug log the command
        ShopSystem.utils.log(`Command received: ${command}`, "info");
            ShopSystem.utils.log(`Parsed arguments: ${JSON.stringify(args)}`, "debug"); 
            
            // Route commands correctly based on the main command particle
            if (command === CONFIG.COMMANDS.SHOP_PREFIX) { // CONFIG.COMMANDS.SHOP_PREFIX is likely "!shop"
                // Special case for just "!shop" with no further arguments
                if (args.length === 0) { 
                    if (!ShopSystem.state.activeShop) {
                        ShopSystem.shop.SHPDIS_MD_ShowShopList(msg.playerid);
                    } else {
                        ShopSystem.shop.SHPDIS_MD_ShowShopMenu(ShopSystem.state.activeShop.name, msg.playerid, msg);
                    }
                    return; // Command handled
                }
                // Route to shop command handler for other !shop sub-commands
                ShopSystem.shop.HNDL_CMD_HandleShopCommand(msg, args); // Pass the already sliced 'args'
            } else if (command === CONFIG.COMMANDS.DB_PREFIX) { // CONFIG.COMMANDS.DB_PREFIX is likely "!itemdb"
            // Route to database command handler
                ShopSystem.database.handleDatabaseCommand(msg, args); // Pass the already sliced 'args'
            }
        }
        // Handle general messages during import
        else if (msg.type === "general" && state.ShopSystem.isImporting) {
            state.ShopSystem.messageBuffer.push(msg.content);
        }
    }
},

    // [TAG: MERGED_13]
    init: function() {
        ShopSystem.utils.log("Initializing ShopSystem...", "info");
        
        // Load basket state early
        try {
            ShopSystem.basket.loadBasketState();
        } catch (error) {
            ShopSystem.utils.log(`Error loading basket state on init: ${error.message}`, "error");
        }
        
        // Save a reference to state
        if (!state.ShopSystem) {
            state.ShopSystem = {
                version: CONFIG.version,
                messageBuffer: [],
                isImporting: false,
                activeShop: null,
                pendingStock: null,
                playerBaskets: {},
                sellBaskets: {},
                    sellBasketCharacter: {}, // Track which character each sell basket belongs to
                haggleResults: {},
                pendingHaggleRolls: {},
                pendingAdvancedSetup: {},
                shops: []
            };
        }
            
            // Ensure sellBasketCharacter exists
            if (!state.ShopSystem.sellBasketCharacter) {
                state.ShopSystem.sellBasketCharacter = {};
        }
        
        // Make sure pendingAdvancedSetup exists
        if (!state.ShopSystem.pendingAdvancedSetup) {
            state.ShopSystem.pendingAdvancedSetup = {};
        }
        
        // Make sure shops array exists
        if (!state.ShopSystem.shops) {
            state.ShopSystem.shops = [];
        }
        
        // Initialize the shops array in the object as well
        ShopSystem.shops = state.ShopSystem.shops;
        
        // Refresh the shops from handouts
        try {
            ShopSystem.utils.refreshShops();
            ShopSystem.utils.log("Refreshed shops from handouts", "info");
        } catch (error) {
            ShopSystem.utils.log(`Error refreshing shops: ${error.message}`, "error");
        }
        
        // Log successful initialization
        ShopSystem.utils.log(`ShopSystem v${CONFIG.version} initialized successfully!`, "success");
        // [TAG: CD_BASKET_LAST_MODIFIED_TRACKING] Ensure lastModifiedBasketItem state exists on system init
        if (!state.ShopSystem.lastModifiedBasketItem) {
            state.ShopSystem.lastModifiedBasketItem = {};
        }
        // Initialize basket state
        if (!state.ShopSystem.mergedBaskets) {
            state.ShopSystem.mergedBaskets = {};
        }
        // Initialize baskets if they don't exist
        if (!state.ShopSystem.baskets) {
            state.ShopSystem.baskets = {};
        }
        if (!state.ShopSystem.sellBaskets) {
            state.ShopSystem.sellBaskets = {};
        }
        // Initialize active characters tracking
        if (!state.ShopSystem.activeCharacters) {
            state.ShopSystem.activeCharacters = {};
        }
        // [TAG: HAGGLE_BLOCK_STATE] For blocking haggle per player per shop
        if (!state.ShopSystem.blockedHaggles) {
            state.ShopSystem.blockedHaggles = {}; // Structure: { shopId: { playerId: true } }
        }
    }
};

// [TAG: MERGED_12_DB_35_SHOP_168] // This tag needs to be fixed
on('ready', function() {
ShopSystem.init();
if (typeof CommandMenu !== 'undefined' && CommandMenu.utils && CommandMenu.utils.addInitStatus) {
    CommandMenu.utils.addInitStatus('ShopSystem', 'success', null, 'success');
}
});

// [TAG: DB_36_SHOP_169] // This tag needs to be fixed
on('chat:message', function(msg) {
// [TAG: HAGGLE_ROLL_DETECTION] - Intercept roll messages if a haggle is pending
if (state.ShopSystem.pendingHaggleRolls && state.ShopSystem.pendingHaggleRolls[msg.playerid]) {
    let finalRollValue = null;
    let isNat1 = false;
    let isNat20 = false;
    let rollSkill = null;
    let detectedMode = 'normal'; // Default for simple rolls or if detection fails
    const pending = state.ShopSystem.pendingHaggleRolls[msg.playerid];
    const playerId = msg.playerid; // Use consistent variable name

    try {
        // --- Parse advanced roll template ---
        if (msg.type === "advancedroll" && msg.content) {
            ShopSystem.utils.log(`Detected advancedroll from player ${playerId} while haggle pending.`, 'debug');

            // Extract skill name
            const titleMatch = msg.content.match(/<div class="header__title">([^<]+)<\/div>/);
            if (titleMatch && titleMatch[1]) {
                rollSkill = titleMatch[1].replace(/ Check$/i, '').toLowerCase().trim();
                ShopSystem.utils.log(`  - Extracted Skill: ${rollSkill}`, 'debug');
            }

            // Detect Roll Mode (Advantage/Disadvantage/Normal)
            if (msg.content.includes("dnd-2024__header--Advantage")) detectedMode = 'advantage';
            else if (msg.content.includes("dnd-2024__header--Disadvantage")) detectedMode = 'disadvantage';
            else detectedMode = 'normal';
             ShopSystem.utils.log(`  - Detected Mode: ${detectedMode}`, 'debug');


            // --- Check for Mismatch: Expect Normal, Got Adv/DisAdv ---
            if (pending.advantage === 'normal' && (detectedMode === 'advantage' || detectedMode === 'disadvantage')) {
                ShopSystem.utils.log(`  - MISMATCH: Expected 'normal', got '${detectedMode}'. Calculating from first die.`, 'warn');

                // Extract first raw die roll
                const firstDieMatch = msg.content.match(/<span class="rt-formula__evaluated-string">\s*(\d+)\s*(?:[+-]\s*\d+)?\s*<\/span>/);
                const firstDieResult = firstDieMatch ? parseInt(firstDieMatch[1]) : null;

                if (firstDieResult === null) {
                    ShopSystem.utils.log(`  - ERROR: Could not parse first die roll for mismatch handling. Ignoring roll.`, 'error');
                    return; // Cannot proceed without first die
                }
                 ShopSystem.utils.log(`  - Parsed First Die: ${firstDieResult}`, 'debug');


                // Extract Modifiers from details
                let abilityMod = 0;
                let profBonus = 0;
                const abilityModMatch = msg.content.match(/<span class="bonus__label">\s*.*?Bonus\s*<\/span>\s*<span class="bonus__value">\s*([+-]?\d+)\s*<\/span>/);
                const profMatch = msg.content.match(/<span class="bonus__label">\s*Proficiency:\s*<\/span>\s*<span class="bonus__value">\s*([+-]?\d+)\s*<\/span>/);

                if (abilityModMatch && abilityModMatch[1]) abilityMod = parseInt(abilityModMatch[1]);
                if (profMatch && profMatch[1]) profBonus = parseInt(profMatch[1]);
                 ShopSystem.utils.log(`  - Parsed Modifiers: Ability=${abilityMod}, Proficiency=${profBonus}`, 'debug');

                // Calculate the effective roll value from the first die + modifiers
                finalRollValue = firstDieResult + abilityMod + profBonus;
                isNat1 = (firstDieResult === 1);
                isNat20 = (firstDieResult === 20);
                 ShopSystem.utils.log(`  - Calculated Value (First Die + Mods): ${finalRollValue}, Nat1=${isNat1}, Nat20=${isNat20}`, 'debug');

            } else {
                 // --- Extract Preferred Result (Normal path or Expect Adv/Disadv and Got Adv/Disadv) ---
                const preferredRollMatch = msg.content.match(/<span class="die__total die__total--preferred(?:[^>]*)"\s*data-result="(\d+)"/);
                if (preferredRollMatch && preferredRollMatch[1]) {
                    finalRollValue = parseInt(preferredRollMatch[1]);
                     ShopSystem.utils.log(`  - Extracted Preferred Roll: ${finalRollValue}`, 'debug');

                    // Check for Nat 1/20 on the underlying dice rolls
                    const diceResultsMatch = msg.content.matchAll(/<span class="rt-formula__evaluated-string">\s*(\d+)\s*(?:[+-]\s*\d+)?\s*<\/span>/g);
                    let rawDice = [];
                    for (const match of diceResultsMatch) {
                        rawDice.push(parseInt(match[1]));
                        if (parseInt(match[1]) === 1) isNat1 = true;
                        if (parseInt(match[1]) === 20) isNat20 = true;
                    }
                     ShopSystem.utils.log(`  - Raw Dice: [${rawDice.join(', ')}], Nat1=${isNat1}, Nat20=${isNat20}`, 'debug');

                } else {
                    ShopSystem.utils.log(`  - Could not find preferred roll result in advanced roll content. Ignoring.`, 'warn');
                     return; // Ignore if we can't parse the main result
                }
            }

        // --- Parse simple roll result ---
        } else if (msg.type === "rollresult") {
             ShopSystem.utils.log(`Detected rollresult from player ${playerId} while haggle pending.`, 'debug');
            const rollData = JSON.parse(msg.content);
            rollSkill = pending.skillType.toLowerCase(); // Assume it's the right skill for simple rolls
            finalRollValue = rollData.total;
            detectedMode = 'normal'; // Simple rolls are treated as normal
             ShopSystem.utils.log(`  - Extracted Total: ${finalRollValue}, Mode: ${detectedMode}`, 'debug');
             // Check for Nat 1/20 on simple d20 rolls
             if (rollData.rolls?.[0]?.sides === 20 && rollData.rolls?.[0]?.results?.[0]?.v === 1) isNat1 = true;
             if (rollData.rolls?.[0]?.sides === 20 && rollData.rolls?.[0]?.results?.[0]?.v === 20) isNat20 = true;
             ShopSystem.utils.log(`  - Dice Checks: Nat1=${isNat1}, Nat20=${isNat20}`, 'debug');
        }

        // --- Process the extracted roll ---
        if (finalRollValue !== null) {
            // Check Skill Match
            if (!rollSkill || rollSkill !== pending.skillType.toLowerCase()) {
                 ShopSystem.utils.log(`  - Skill mismatch: Roll was for '${rollSkill}', expected '${pending.skillType}'. Ignoring for haggle.`, 'debug');
                return; // Ignore if skill doesn't match
            }

            // Check if Waiting for Second Roll (for expected Adv/Disadv, got simple/normal first)
             if (pending.firstRollValue !== undefined && pending.firstRollValue !== null) {
                 ShopSystem.utils.log(`  - Second roll detected: ${finalRollValue}. First was: ${pending.firstRollValue}. Expecting: ${pending.advantage}`, 'debug');
                const firstRoll = pending.firstRollValue;
                const secondRoll = finalRollValue; // The current roll is the second one
                 const firstNat1 = pending.isNat1;
                 const firstNat20 = pending.isNat20;

                // Determine final value based on expected advantage state
                let combinedFinalValue;
                if (pending.advantage === 'advantage') {
                    combinedFinalValue = Math.max(firstRoll, secondRoll);
                } else if (pending.advantage === 'disadvantage') {
                    combinedFinalValue = Math.min(firstRoll, secondRoll);
                } else {
                     ShopSystem.utils.log(`  - ERROR: Was waiting for second roll, but pending state was '${pending.advantage}'. Using second roll value.`, 'error');
                     combinedFinalValue = secondRoll; // Fallback
                }

                // Combine Nat1/Nat20 status
                const combinedNat1 = firstNat1 || isNat1;
                const combinedNat20 = firstNat20 || isNat20;

                 ShopSystem.utils.log(`  - Combined Result: ${combinedFinalValue}, Nat1=${combinedNat1}, Nat20=${combinedNat20}`, 'debug');
                ShopSystem.basket.handleHaggleRollResult(combinedFinalValue, playerId, combinedNat1, combinedNat20);
                // Clear pending state fully after processing second roll (handleHaggleRollResult also clears)
                delete state.ShopSystem.pendingHaggleRolls[playerId];
                return;
            }

             // Check for Mismatch: Expect Adv/DisAdv, Got Normal/Simple
             if ((pending.advantage === 'advantage' || pending.advantage === 'disadvantage') && detectedMode === 'normal') {
                 ShopSystem.utils.log(`  - MISMATCH: Expected '${pending.advantage}', got 'normal'. Waiting for second roll.`, 'warn');
                 // Store first roll details and wait
                 pending.firstRollValue = finalRollValue;
                 pending.isNat1 = isNat1;
                 pending.isNat20 = isNat20;
                 ShopSystem.utils.chat(`Waiting for your second roll for ${pending.advantage}...`, playerId);
                 // DO NOT clear pending state here
                 return;
             }

             // --- If modes match OR (Expected Normal and Got Adv/Disadv - handled above by calculating from first die) ---
             ShopSystem.utils.log(`  - Roll skill and type match pending state (or mismatch handled). Processing result: ${finalRollValue}`, 'debug');
            ShopSystem.basket.handleHaggleRollResult(finalRollValue, playerId, isNat1, isNat20);
            // handleHaggleRollResult now clears the pending state
            return; // Stop processing this message further
        }

    } catch (e) {
        ShopSystem.utils.log(`Error processing potential haggle roll message: ${e}`, 'error');
         // Clear potentially stuck pending state on error?
         if (state.ShopSystem.pendingHaggleRolls?.[playerId]) {
              ShopSystem.utils.log(`Clearing pending haggle for ${playerId} due to error.`, 'warn');
              delete state.ShopSystem.pendingHaggleRolls[playerId];
         }
    }
}

// Existing command handler call (will only be reached if the message wasn't a handled haggle roll):
ShopSystem.commands.handleCommand(msg);
});