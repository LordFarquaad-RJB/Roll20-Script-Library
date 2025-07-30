/**
 * TokenFX.js
 * ToDo: Fix Rocket and Missile FX to work with targets. Wait for roll20 dev update. use custom FX for these.
 * Consolidated token effects, triggers, and delay system for Roll20
 */

/**
 * -----------------------------------------------------------------------------
 * DETAILED FX PROCESSING, LOOPING, AND SYNCHRONIZATION EXPLANATION
 * -----------------------------------------------------------------------------
 *
 * Understanding how !spawnComplexFx processes commands and manages FX loops,
 * especially the SYNC vs. DESYNC modes, is crucial for complex effects.
 *
 * I. COMMAND PARSING & INITIAL SETUP (`TokenFX.fx.spawnComplexFx`):
 *
 *  1. Parameter Extraction:
 *     The command `!spawnComplexFx FX[...] CLR[...] ID[...] TD[...] TR[...] TI[...] TARGET[...] GR[...] GD[...] SYNC[...]`
 *     is parsed into key-value pairs.
 *     - FX: The base name of the effect (e.g., "beam", "myCustomMissile").
 *     - CLR: Color for standard FX (e.g., "fire"). Ignored for custom FX.
 *     - ID: Token ID(s) for the source of the FX. Can be multiple.
 *     - TD: Token Delay (seconds) before this specific token starts its FX sequence.
 *           Defaults to 0. Applied individually per token.
 *     - TR: Token Repeats for this specific token. How many times its FX will spawn.
 *           Can be a number or "infinite". Defaults to 1.
 *           Example: TR[infinite] means this token's FX will repeat forever.
 *     - TI: Token Interval (seconds) between each repeat for this specific token.
 *           Can be a number or "auto". "auto" tries to estimate based on the FX's
 *           visual duration. Defaults to `config.defaultTokenInterval`.
 *           Example: TI[0.4] means this token waits 0.4s between its own repeats.
 *     - TARGET: Token ID(s) for the target of the FX. Used by FX types listed
 *               in `config.FX_TYPES_REQUIRING_TARGET` (e.g., "beam").
 *     - GR: Global Repeats. How many times the entire sequence (all specified
 *           tokens and their individual repeats) will run. Defaults to 1.
 *           Example: GR[infinite] means the entire sequence of all tokens will repeat forever.
 *     - GD: Global Delay (seconds). The delay *between* each Global Repeat cycle.
 *           Defaults to 0.
 *           Example: GD[0.4] means after all tokens finish, wait 0.4s before starting the whole sequence again.
 *     - SYNC: Synchronization mode ("sync" or "desync"). Defaults to "desync".
 *             This is a critical parameter determining timing.
 * 
 *  2. Key Differences Between TR/TI and GR/GD:
 *     - TR/TI control individual token behavior:
 *       Example: !spawnComplexFx FX[beam] ID[A] ID[B] TR[infinite] TI[0.4]
 *       → Both tokens A and B will continuously spawn beams every 0.4s
 *     - GR/GD control the entire sequence:
 *       Example: !spawnComplexFx FX[beam] ID[A] ID[B] GR[infinite] GD[0.4]
 *       → After both A and B finish their beams, wait 0.4s before starting again
 *     - Using both:
 *       Example: !spawnComplexFx FX[beam] ID[A] ID[B] TR[2] TI[0.4] GR[infinite] GD[1]
 *       → Each token spawns 2 beams (0.4s apart), then waits 1s before the whole sequence repeats
 *
 *  3. Targeting System:
 *     - Standard FX Targeting:
 *       • Some standard FX (like "beam") require targets
 *       • Use TARGET[tokenID] to specify where the FX should go
 *       • Multiple targets can be specified: TARGET[A] TARGET[B]
 *       • Example: !spawnComplexFx FX[beam] CLR[fire] ID[source] TARGET[destination]
 *
 *     - Custom FX Targeting:
 *       • Custom FX can be designed to work with or without targets
 *       • If a custom FX requires targets, it must be listed in config.FX_TYPES_REQUIRING_TARGET
 *       • Example: !spawnComplexFx FX[myCustomMissile] ID[source] TARGET[destination]
 *
 *     - Pairing Mode (New!):
 *       • When ID and TARGET counts match, enters pairing mode
 *       • Each ID is paired with its corresponding TARGET
 *       • Global settings (TR, TI, TD) apply to all pairs unless overridden
 *       • Example: !spawnComplexFx FX[beam] CLR[fire] ID[A] TARGET[X] ID[B] TARGET[Y] TR[infinite] TI[0.4]
 *         → A→X and B→Y beams, both continuous with 0.4s interval
 *
 *  4. Recent Updates:
 *     - Added Pairing Mode for easier multi-token targeting
 *     - Global settings (TR, TI, TD) now work in pairing mode
 *     - Improved targeting validation and error messages
 *     - Added support for "auto" interval timing based on FX duration
 *     - Enhanced documentation and examples
 *
 *  5. Best Practices:
 *     - Use pairing mode for multiple source-target pairs
 *     - Use TR/TI for continuous effects (like beams)
 *     - Use GR/GD for pulsing effects (like explosions)
 *     - Always specify TARGET for FX types that require it
 *     - Use SYNC[sync] when you want all tokens to start together
 *     - Use SYNC[desync] when you want independent timing
 * 
 * - [IMPORTANT] **When using !spawnComplexFx (in chat or macros), you must use one ID per ID[...] argument. Do NOT put multiple IDs in a single ID[...] with spaces.**
 * - Example (correct): !spawnComplexFx FX[smoke] ID[-ID1] ID[-ID2] TR[1] TI[1]
 * - Example (incorrect): !spawnComplexFx FX[smoke] ID[-ID1 -ID2] TR[1] TI[1]  ← This will NOT work in Roll20 chat or macros, as Roll20 splits on spaces before the script sees the command.
 *
 *  6. FX Identification:
 *     - If FX[...] matches a name in `TokenFX.config.customFxDefinitions`, it's treated
 *       as a custom FX, and its ID is used.
 *     - Otherwise, it's treated as a standard FX, combined with CLR[...] (e.g., "beam-fire").
 *
 *  7. Loop Data Structure (`loopData`):
 *     A unique `loopID` is generated. All data for this specific command invocation
 *     is stored in `TokenFX.state.activeFxLoops[loopID]`. This `loopData` includes:
 *     - `fxType`: The actual FX string/ID to spawn (e.g., "beam-fire", "-MyCustomFxID").
 *     - `fxDisplayName`: User-friendly name for logging.
 *     - `isCustom`: Boolean.
 *     - `tokens`: An object where each key is a source `ID` from the command.
 *                 Its value is an object: `{ TDelay, TRrepeats, TInterval, internalTimeouts:[], currentRepeat:0 }`.
 *     - `targets`: An object similar to `tokens` for `TARGET` IDs (though TD, TR, TI aren't typically varied for targets in the current design).
 *     - `globalTimeouts`: Array to hold `setTimeout` handles for managing GR and GD.
 *     - `globalCounter`: Tracks current global repeat.
 *     - `globalDelay`, `globalRepeats`, `syncMode`: Copied from parsed parameters.
 *
 *  8. Token-Specific Parameter Processing:
 *     For each source `ID[...]`:
 *     - TD, TR, TI are assigned.
 *     - If TI is "auto", the script estimates the FX's visual duration:
 *       - For custom FX: from `config.customFxDurationOverrides` (if ID matches) or by
 *         parsing the FX definition's `duration` and `lifeSpan` against `config.assumedFxSystemFPS`.
 *       - For standard FX: from `config.standardFxVisualDurations` (if type matches).
 *       - If no duration found, `config.defaultTokenInterval` is used.
 *     - Warnings for potential TI/duration overlap are issued.
 *     - FXs with infinite emitters (e.g., custom FX definition duration -1) or those in
 *       `config.disallowedLoopingFx` will have their TR (Token Repeats) forced to 1,
 *       as script-based looping is redundant or disallowed.
 *
 *  9. Dispatching the Loop:
 *     Based on `syncMode`, either `TokenFX.fx.applyFxLoop_sync(loopID)` or
 *     `TokenFX.fx.applyFxLoop_desync(loopID)` is called to start the FX.
 *
 * II. DESYNCHRONIZED MODE (`SYNC[desync]` or default):
 *     (`TokenFX.fx.applyFxLoop_desync`)
 *
 *  - Philosophy: "Fire and forget" for each token's full sequence, then repeat globally.
 *  - Global Cycle: The `applyFxLoop_desync` function is called initially and then re-scheduled
 *    by `setTimeout` using `loopData.globalDelay` until `loopData.globalCounter`
 *    reaches `loopData.globalRepeats`.
 *
 *  - Token Behavior within a Global Cycle:
 *    - For *each* token ID specified in the command:
 *      - A `setTimeout` is scheduled using its individual `tokenData.TDelay`.
 *      - When this initial delay expires, the FX is spawned for that token.
 *      - `tokenData.currentRepeat` is incremented.
 *      - If `tokenData.TRrepeats` is not met (or is "infinite"), another `setTimeout`
 *        is scheduled for this *same token* using `tokenData.TInterval` to spawn its next FX.
 *      - This continues until the token has completed all its `TRrepeats`.
 *
 *  - Key Characteristics:
 *    - Each token runs its full set of delays and repeats independently of other tokens
 *      defined in the same command.
 *    - The `loopData.globalDelay` only takes effect *after* all tokens have been
 *      *scheduled* for their first set of operations in the current global cycle. It does
 *      not wait for them to complete their individual `TRrepeats` sequences.
 *
 *  - Example: `!spawnComplexFx FX[burn] ID[A] TD[0] TR[2] TI[1] ID[B] TD[3] TR[1] TI[1] GR[1] GD[0] SYNC[desync]`
 *    - Token A: Spawns FX at 0s. Spawns FX again at 1s. (Completes its 2 repeats)
 *    - Token B: Spawns FX at 3s. (Completes its 1 repeat)
 *    - There's no waiting for A to finish before B starts its delay, or vice-versa.
 *    - If GR was 2 and GD was 5s: After A & B are *initially scheduled*, the script waits 5s,
 *      then re-schedules A (to start at 5s from global cycle start) and B (to start at 8s from global cycle start).
 *
 * III. SYNCHRONIZED MODE (`SYNC[sync]`):
 *      (`TokenFX.fx.applyFxLoop_sync`)
 *
 *  - Philosophy: Attempt to make global cycles more coordinated, especially when `GD[0]`.
 *    The script waits for all tokens to complete their *entire individual sequence*
 *    (all their TRrepeats) within the current global cycle before starting the GD countdown
 *    for the *next* global cycle.
 *
 *  - Global Cycle & Token Behavior:
 *    1. The `applyFxLoop_sync` function is called.
 *    2. For *each* token ID:
 *       - An initial `setTimeout` is scheduled using its `tokenData.TDelay`.
 *       - When this delay expires, its first FX is spawned.
 *       - It then continues its own `TRrepeats` using its `TInterval`, similar to desync.
 *    3. Tracking Completion:
 *       - The script tracks `longestTokenCycleDurationThisGlobalLoop`. This is roughly the
 *         time from the start of the global cycle until the token that takes the longest
 *         (considering its TD, TR, and TI) finishes all its individual repeats.
 *       - It also counts `completedTokenCycles`.
 *    4. Starting Next Global Cycle:
 *       - Once *all* tokens have finished their full `TRrepeats` sequence for the *current* global cycle:
 *         - The `loopData.globalCounter` is incremented.
 *         - If `loopData.globalRepeats` is not met:
 *           - A `nextGlobalSyncDelay` is calculated:
 *             - It's primarily based on the command's `loopData.globalDelay` (GD).
 *             - **Crucial for `GD[0]` (or very small GD):** If GD is 0 (or minimal),
 *               the `nextGlobalSyncDelay` effectively becomes the `longestTokenCycleDurationThisGlobalLoop`.
 *               This ensures that a GD of 0 in sync mode means "start the next global cycle
 *               immediately after everyone in the current cycle is truly finished."
 *             - If GD > 0, the `nextGlobalSyncDelay` is that explicit GD value, and this delay
 *               starts *after* the longest token sequence has finished.
 *           - A `setTimeout` schedules the *next call* to `applyFxLoop_sync` using this
 *             `nextGlobalSyncDelay`.
 *
 *  - Key Characteristics:
 *    - The start of the *next* global cycle (if GR > 1) is generally gated by the completion
 *      of *all* token sequences in the *current* global cycle.
 *    - Useful for creating "waves" of effects where one full wave must complete before the
 *      next wave (and its Global Delay) begins.
 *
 *  - Example 1: `!spawnComplexFx FX[burn] ID[A] TD[0] TR[2] TI[1] ID[B] TD[0.5] TR[1] TI[1] GR[2] GD[0] SYNC[sync]`
 *    - Global Cycle 1:
 *      - Token A: Spawns FX at 0s. Spawns FX again at 1s. (A's sequence takes ~2s)
 *      - Token B: Spawns FX at 0.5s. (B's sequence takes ~1s from its start, or ~1.5s from global start)
 *      - Longest path for this cycle is A, finishing around 2s.
 *      - Since GD is 0, Global Cycle 2 starts immediately after ~2s.
 *    - Global Cycle 2:
 *      - Repeats the above timing, relative to the start of Global Cycle 2.
 *
 *  - Example 2: `!spawnComplexFx FX[burn] ID[A] TD[0] TR[1] TI[1] ID[B] TD[0] TR[1] TI[1] GR[2] GD[5] SYNC[sync]`
 *    - Global Cycle 1:
 *      - Token A: Spawns FX at 0s (takes ~1s total).
 *      - Token B: Spawns FX at 0s (takes ~1s total).
 *      - Both finish around 1s. Longest path is ~1s.
 *      - The script now waits for `GD[5]` seconds.
 *    - Global Cycle 2:
 *      - Starts 5 seconds *after* both A and B finished in Global Cycle 1.
 *      - Token A & B spawn their FX again.
 *
 * IV. STOPPING FX (`!stopFxLoop [LoopID]` and `!stopAllFx`):
 *
 *  - `!stopFxLoop [LoopID]`: Clears all `setTimeout` handles (both global and
 *    individual token internal timeouts) associated with the given `loopID` and
 *    removes the loop data from `TokenFX.state.activeFxLoops`.
 *  - `!stopAllFx`: Iterates through all `loopID`s in `activeFxLoops` and stops each one.
 *
 * V. AREA TRIGGERS & CHAIN REACTIONS (`TokenFX.trigger`):
 *    Commands: `!triggerByTag`, `!triggerByTagChain`, `!stopChains`
 *
 *  - Purpose: Allows an FX or other macro to be triggered on tokens within a radius
 *    of a selected token, based on a "tag" in their GM Notes. Can also create
 *    chain reactions where triggered tokens then trigger others.
 *
 *  1. `!triggerByTag [tag] [radius_ft] [action_macro]`
 *     - `[tag]`: A keyword (e.g., "explosiveBarrel", "magicMine") that must be present
 *       in the GM Notes of nearby tokens (case-insensitive, enclosed in curly braces like `{tag}`).
 *     - `[radius_ft]`: The radius in feet to search for other tokens around the selected token.
 *     - `[action_macro]`: The API command or chat message to execute if matching tokens are found.
 *       - Use the special placeholder `@TOKENID@` to refer to the token that was found by the trigger.
 *       - Example: `!spawnComplexFx FX[burn] ID[@TOKENID@]` will run the burn effect on the found token.
 *
 *  2. Modular Overrides (NEW):
 *     - You can override the `[action_macro]` on a per-token basis by adding `Macro:[MacroName]` to its GM Notes.
 *     - The script processes each line of a found token's GM notes independently.
 *     - Example GM Notes for a token:
 *       `{flammable} Macro:[CustomExplosion]`
 *       `{flammable}`
 *       This will cause the token to both run the `CustomExplosion` macro AND the default `[action_macro]` from the `!triggerByTag` command.
 *
 *  3. How it Works (`TokenFX.trigger.processTrigger`):
 *     - The script gets the selected origin token.
 *     - It calculates the search radius in pixels based on page settings.
 *     - It finds all tokens on the same page within the radius.
 *     - For each found token, it reads its GM Notes and processes each line:
 *       - If a line contains the `{tag}` and a `Macro:[MacroName]` definition, it runs that macro (with the found token as context for placeholders).
 *       - If a line contains just the `{tag}`, it runs the default `[action_macro]` from the `!triggerByTag` command.
 *
 *  4. Chain Reactions (`runChainReaction`):
 *     - After a token is acted upon, the script checks its GM Notes again for a specific chain reaction pattern:
 *       `chain:newTag[maxTriggers][chainRadiusFt]` (e.g., `chain:secondaryExplosion[1][10ft]`)
 *       - `newTag`: The tag to use for the next link in the chain.
 *       - `[maxTriggers]` (optional, default 1): How many times *this specific token* can propagate
 *         this chain link. Prevents infinite loops.
 *       - `[chainRadiusFt]` (optional, default original radius): The radius for this next chain link.
 *     - If a chain pattern is found and the token hasn't exceeded its `maxTriggers`, it constructs and sends a new `!triggerByTagChain` command.
 *
 *  5. `!triggerByTagChain ...`:
 *     - This is an internal command primarily used by the script itself to continue a chain.
 *
 *  6. `!stopChains`:
 *     - Manually stops any ongoing chain reaction sequence.
 *
 * VI. DELAYED COMMAND EXECUTION (`TokenFX.delay`):
 *     Command: `!Delay [seconds] {command_to_run}` or `!delay [seconds] {command_to_run}`
 *
 *  - Purpose: Simple utility to delay the execution of any chat message or API command.
 *  - `[seconds]`: The number of seconds to wait.
 *  - `{command_to_run}`: The full command or message, enclosed in curly braces.
 *  - How it Works:
 *    - Parses the seconds and the command.
 *    - Uses `setTimeout` to schedule the `command_to_run` to be sent to `sendChat`
 *      after the specified delay.
 *
 *
 * VII. UTILITY & LISTING COMMANDS:
 *
 *  1. `!listStandardFx`:
 *     - Whispers to the GM a list of all `FX_TYPES` and `FX_COLORS` defined in
 *       `TokenFX.config`. Useful for knowing available built-in effect options.
 *
 *  2. `!listCustomFx`:
 *     - Whispers to the GM a list of all custom FX that were successfully loaded by the
 *       script on startup. It shows the `name` (used in `FX[name]`) and the Roll20 `ID`
 *       of each custom FX.
 *     - If no custom FX are found, it informs the GM.
 *
 *  3. `!getSelectedIDs`:
 *     - If one or more tokens are selected on the VTT, this command will whisper to the GM
 *       a space-separated list of their token IDs.
 *     - Useful for quickly grabbing IDs to use in other API commands or script parameters.
 *
 * This system allows for a range of effects, from simple, single FX spawns to
 * complex, multi-token, repeating, and synchronized/desynchronized waves of effects.
 * Understanding the interplay of TD, TR, TI with GR, GD, and SYNC is key.
 */

const thePlayerIsGM = (playerid) => {
    const player = getObj('player', playerid);
    if (!player) return false;
    return player.get('_online') && player.get('_type') === 'player' && player.get('_isGM');
};

const TokenFX = {
    // Configuration
    config: {
        CHAIN_TIMEOUT_SECONDS: 30,
        DEFAULT_GRID_SIZE: 70,
        DEFAULT_SCALE: 5,
        FX_TYPES: [
            'beam', 'bomb', 'breath', 'bubbling', 'burn', 'burst', 'explode', 'glow', 
            'missile', 'nova', 'splatter', 'rocket', 'sparkle', 'shield', 'pooling'
        ],
        FX_COLORS: [
            'acid', 'blood', 'charm', 'death', 'fire', 'frost', 'holy', 'magic', 
            'slime', 'smoke', 'water'
        ],
        customFxDefinitions: {}, // Will be populated on ready by name->ID mapping
        originalCustomFxNames: {}, // Will be populated on ready by ID->name mapping for warnings

        // New configurations for FX behavior control
        disallowedLoopingFx: [ // Lowercase custom FX *names* that should only be TR[1]
            // e.g., "myforevereffect", "anothernonloopingfx"
        ],
        customFxDurationOverrides: { // Custom FX *IDs* to user-defined visual duration in seconds
            // e.g., "-KasdFGH123": 10,
            //       "-LmnOPQ456": 3.5
        },
        standardFxVisualDurations: { // Lowercase "type" strings of standard FX to visual duration in seconds
            // e.g., "beam": 1.5, // Changed from type-color to just type
            //       "explode": 2.0
        },
        assumedFxSystemFPS: 30, // For estimating duration from custom FX definition's frame counts
        defaultTokenInterval: 1, // seconds, used if TI[auto] can't find a duration
        overlapWarningThreshold: 0.8, // e.g., warn if TI < visualDuration * 0.8
        THROTTLE_COOLDOWN_SECONDS: 5, // Cooldown in seconds for repeated warning messages
        FX_TYPES_REQUIRING_TARGET: ['beam', 'breath', 'splatter', 'missile', 'rocket'],

        // New configuration for other script commands to display in FX menu
        otherScriptCommands: [
            // Example format:
            // { name: "Stop Status FX", command: "!stopStatusFX" },
            // { name: "Clear Auras", command: "!clearAuras" }
            {name: "🔊 Stop All Audio", command: "!roll20AM --audio,stop"},
            {name: "⛔ Stop All FXs", command: "!stopAllFx"},
        ],

        // Template for FX menu messages
        fxMenuTemplate: {
            header: "🎭 **TokenFX Menu**",
            stopButton: "[⏹️ Stop FX](!stopFxLoop {loopID})",
            otherCommands: "**Other Commands:**\n{otherCommands}",
            footer: "---"
        },
        
        validateFxTargets(fxType, hasTargets) {
            if (this.FX_TYPES_REQUIRING_TARGET.includes(fxType) && !hasTargets) {
                return {
                    valid: false,
                    message: `FX type '${fxType}' requires at least one target token.`
                };
            }
            return { valid: true };
        },
        // Debug mode toggle (set to true for verbose logging)
        DEBUG: false, // Set to true to enable debug/info logs
        INFO_MESSAGES_ENABLED: true, // Set to false to hide messages like "Delaying command..." and "Triggered on..."
        MENU_CONSOLIDATION_ENABLED: true, // Set to false to have each FX command generate its own menu
        MENU_CONSOLIDATION_DELAY_MS: 250, // How long to wait (in ms) to gather up FX for one menu
    },

    // State management
    state: {
        activeFxLoops: {}, // Will store { loopID: [timeoutHandles], ... }
                           // Consider enhancing to: { loopID: { tokenID: tokenId, fx: fxTypeOrId, timeouts: [...] } } for overlap management
        throttledMessages: {}, // Stores timestamps of recent messages to prevent spam
        chainReaction: {
            tokenTriggerCounts: {},
            chainStartTime: null
        },
        chainResetTimeout: null,
        fxMenuTimeout: null,
    },

    // Utility functions
    utils: {
        getTokenImageURL(token, size = 'thumb') {
            if (!token) return '👤';

            const sanitize = (url) => {
                if (!url) return null;
                let processed = url.replace(/(thumb|max)(?=\.[^/]+$)/, size);
                processed = processed.replace(/\(/g, '%28')
                                 .replace(/\)/g, '%29')
                                 .replace(/'/g, '%27')
                                 .replace(/"/g, '%22');
                return processed;
            };

            let img = token.get('imgsrc');
            if (!img) {
                const charId = token.get('represents');
                if (charId) {
                    const char = getObj('character', charId);
                    if (char) {
                        img = char.get('avatar');
                        if (!img) img = char.get('imgsrc');
                    }
                }
            }

            const sanitized = sanitize(img);
            return sanitized || '👤';
        },
        
        parsePrefixedParams(argsArray) {
            const params = {};
            const multiParams = ['ID', 'TD', 'TR', 'TI', 'TARGET'];
            argsArray.forEach(arg => {
                let match = arg.match(/^([A-Z]{2,6})\[(.*?)\]$/i);
                if (match) {
                    const key = match[1].toUpperCase();
                    let value = match[2].trim();
                    if (multiParams.includes(key)) {
                        if (!params[key]) params[key] = [];
                        // For ID and TARGET, split on space or comma for multi-token support
                        if ((key === 'ID' || key === 'TARGET') && /[ ,]/.test(value)) {
                            // Check if this is likely from Roll20 chat (where spaces might be split)
                            if (argsArray.length > 1 && argsArray.some(a => a.startsWith(key + '['))) {
                                TokenFX.utils.log(`Warning: Multiple ${key} parameters detected. In Roll20 chat/macros, use separate ${key}[...] parameters instead of space-separated values.`, 'warning');
                                sendChat("TokenFX", `/w gm ⚠️ **Warning:** For multiple ${key} values in Roll20 chat/macros, use separate ${key}[...] parameters instead of space-separated values. Example: ${key}[id1] ${key}[id2] instead of ${key}[id1 id2]`);
                            }
                            value.split(/[ ,]+/).filter(Boolean).forEach(v => params[key].push(v));
                        } else {
                            params[key].push(value);
                        }
                    } else {
                        params[key] = value;
                    }
                } else {
                    TokenFX.utils.log(`Failed to parse argument: ${arg}`, 'debug');
                }
            });
            TokenFX.utils.log(`Parsed parameters: ${JSON.stringify(params)}`, 'debug');
            return params;
        },

        parseDelay(text) {
            let re = /!delay\s*:?\s*(\d+)/i; // Note: escaped backslash for regex in string
            let m = text.match(re);
            return m ? parseInt(m[1], 10) * 1000 : 0;
        },

        decodeAndStrip(raw) {
            let decoded = decodeURIComponent(raw || "");
            // First, replace common line-break tags with a newline character
            decoded = decoded.replace(/<\/p>|<br\s*\/?>/gi, '\n');
            // Then, repeatedly strip any remaining HTML tags until no more matches are found
            let previous;
            do {
                previous = decoded;
                decoded = decoded.replace(/<[^>]*>/g, "");
            } while (decoded !== previous);
            return decoded;
        },

        hasTag(text, tag) {
            let regex = /\{([^}]+)\}/g; // Note: escaped backslashes for regex in string
            let match;
            while((match = regex.exec(text.toLowerCase())) !== null) {
                if(match[1].trim() === tag) return true;
            }
            return false;
        },

        log(message, type = 'info') {
            // Only print debug/info logs if debug mode is enabled
            if ((type === 'debug' || type === 'info') && !TokenFX.config.DEBUG) return;
            const prefix = {
                info: '📜',
                error: '❌',
                success: '✅',
                warning: '⚠️',
                debug: '🐛' 
            }[type] || '📜';
            log(`${prefix} TokenFX: ${message}`);
        },

        estimateCustomFxDuration(customFxId) {
            const result = { estimatedSeconds: null, isInfiniteEmitter: false, error: null };
            if (!customFxId) {
                result.error = "No Custom FX ID provided.";
                return result;
            }

            const custFxObj = getObj("custfx", customFxId);
            if (!custFxObj) {
                result.error = `Custom FX with ID ${customFxId} not found.`;
                return result;
            }

            const definitionValue = custFxObj.get('definition'); // Get the value
            let definition; // This will hold the parsed object

            // Log the raw definition string for debugging, regardless of type initially
            // TokenFX.utils.log(`Raw Definition Value for FX ID ${customFxId}: ${definitionValue} (Type: ${typeof definitionValue})`, 'debug');


            if (typeof definitionValue === 'string') {
                //TokenFX.utils.log(`Definition for FX ID ${customFxId} is a string. Attempting JSON.parse. Content: '${definitionValue}'`, 'debug');
                if (definitionValue === '[object Object]') {
                    result.error = `Definition for FX ID ${customFxId} is the string "[object Object]", which is not valid JSON. This suggests the original object was improperly stringified.`;
                    TokenFX.utils.log(result.error, 'error');
                    return result; // Cannot parse "[object Object]"
                }
                try {
                    definition = JSON.parse(definitionValue);
                } catch (e) {
                    result.error = `Error parsing definition string for Custom FX ID ${customFxId}: ${e.message}. Original string was: '${definitionValue}'`;
                    TokenFX.utils.log(result.error, 'error');
                    return result; 
                }
            } else if (typeof definitionValue === 'object' && definitionValue !== null) {
                //TokenFX.utils.log(`Definition for FX ID ${customFxId} is already an object. Using directly.`, 'debug');
                definition = definitionValue; // Use the object directly
            } else {
                result.error = `No valid definition (string or object) found for Custom FX ID ${customFxId}. Received type: ${typeof definitionValue}, Value: ${definitionValue}`;
                TokenFX.utils.log(result.error, 'warning');
                return result;
            }
            
            // Ensure definition is not null or undefined before proceeding
            if (!definition) {
                 result.error = `Definition became null/undefined after type check for FX ID ${customFxId}. This should not happen.`;
                 TokenFX.utils.log(result.error, 'error');
                 return result;
            }


            try {
                const fps = TokenFX.config.assumedFxSystemFPS || 30;

                let emitterDuration = definition.duration;
                if (typeof emitterDuration !== 'number') {
                    emitterDuration = 0; // Default if not specified or invalid
                }

                if (emitterDuration === -1) {
                    result.isInfiniteEmitter = true;
                    result.estimatedSeconds = Infinity;
                    return result;
                }

                const emitterSecs = emitterDuration / fps;

                let particleLifeSpan = definition.lifeSpan || 0;
                let particleLifeSpanRandom = definition.lifeSpanRandom || 0;
                const maxParticleLifeSecs = (particleLifeSpan + particleLifeSpanRandom) / fps;

                result.estimatedSeconds = emitterSecs + maxParticleLifeSecs;
                if (result.estimatedSeconds <= 0) result.estimatedSeconds = TokenFX.config.defaultTokenInterval; // Ensure some positive duration

            } catch (e) {
                // This catch block handles errors if 'definition' is an object but doesn't have expected properties like 'duration' or 'lifeSpan'
                result.error = `Error accessing properties (e.g., duration, lifeSpan) from the definition object for Custom FX ID ${customFxId}: ${e.message}. Definition was: ${typeof definition === 'object' ? JSON.stringify(definition) : definition}`;
                TokenFX.utils.log(result.error, 'error');
            }
            return result;
        },
        // --- Utility: Robust aimed FX detection for custom FX ---
        isAimedFxType(fxNameOrStdType) { // Parameter renamed for clarity
            // Standard check: fxNameOrStdType could be "beam", "fire", etc.
            if (TokenFX.config.FX_TYPES_REQUIRING_TARGET.includes(fxNameOrStdType)) {
                TokenFX.utils.log(`isAimedFxType: Standard FX '${fxNameOrStdType}' is in FX_TYPES_REQUIRING_TARGET. Result: true`, 'debug');
                return true;
            }

            // Custom FX check: fxNameOrStdType would be the custom FX's lowercase name (e.g., "firewall")
            if (TokenFX.config.customFxDefinitions && TokenFX.config.customFxDefinitions[fxNameOrStdType]) {
                const customFxId = TokenFX.config.customFxDefinitions[fxNameOrStdType]; // Get the ID from the name
                if (!customFxId) {
                     TokenFX.utils.log(`isAimedFxType: Custom FX name '${fxNameOrStdType}' found in customFxDefinitions but mapped to a falsy ID ('${customFxId}'). Result: false`, 'warn');
                     return false;
                }

                const custFxObj = getObj("custfx", customFxId);
                if (!custFxObj) {
                    TokenFX.utils.log(`isAimedFxType: Custom FX object not found for ID '${customFxId}' (from name '${fxNameOrStdType}'). Result: false`, 'warn');
                    return false;
                }

                const definitionValue = custFxObj.get('definition');
                let definition;

                if (typeof definitionValue === 'string') {
                    if (definitionValue === '[object Object]') { // Handle common stringification error
                        TokenFX.utils.log(`isAimedFxType: Custom FX ID '${customFxId}' definition is string "[object Object]". Cannot parse. Result: false`, 'error');
                        return false;
                    }
                    try {
                        definition = JSON.parse(definitionValue);
                    } catch (e) {
                        TokenFX.utils.log(`isAimedFxType: Error parsing definition string for Custom FX ID '${customFxId}': ${e.message}. Def: '${definitionValue}'. Result: false`, 'error');
                        return false;
                    }
                } else if (typeof definitionValue === 'object' && definitionValue !== null) {
                    definition = definitionValue;
                } else {
                    TokenFX.utils.log(`isAimedFxType: No valid definition (string or object) for Custom FX ID '${customFxId}'. Type: ${typeof definitionValue}. Result: false`, 'warn');
                    return false;
                }

                if (definition && (definition.angle === -1 || (Array.isArray(definition.systems) && definition.systems.some(sys => sys.angle === -1)))) {
                    TokenFX.utils.log(`isAimedFxType: Custom FX '${fxNameOrStdType}' (ID: ${customFxId}) has angle: -1 in definition. Result: true. Definition sample: angle=${definition.angle}`, 'debug');
                    return true;
                } else {
                    TokenFX.utils.log(`isAimedFxType: Custom FX '${fxNameOrStdType}' (ID: ${customFxId}) does NOT have angle: -1. Result: false. Definition sample: angle=${definition ? definition.angle : 'N/A'}`, 'debug');
                    return false;
                }
            }
            TokenFX.utils.log(`isAimedFxType: FX '${fxNameOrStdType}' is not a standard aimed type and not a recognized custom FX name. Result: false`, 'debug');
            return false;
        },

        // --- Utility: Send a chat message, but only if a similar message (by key) hasn't been sent within a cooldown period ---
        sendThrottledChat(from, message, key) {
            const now = Date.now();
            const cooldown = (TokenFX.config.THROTTLE_COOLDOWN_SECONDS || 5) * 1000;
            const lastSent = TokenFX.state.throttledMessages[key] || 0;

            if (now - lastSent > cooldown) {
                TokenFX.state.throttledMessages[key] = now;
                sendChat(from, message);
                TokenFX.utils.log(`Sent throttled message with key '${key}'.`, 'debug');
            } else {
                TokenFX.utils.log(`Suppressed throttled message for key '${key}'.`, 'debug');
            }
        },

        // New utility to find and execute a macro by name
        executeMacroByName(macroName, contextTokenId) {
            if (!macroName) return false;
            const macro = findObjs({ _type: "macro", name: macroName })[0];
            if (!macro) {
                TokenFX.utils.log(`executeMacroByName: Macro named '${macroName}' not found.`, 'error');
                sendChat("TokenFX", `/w gm ❌ Macro not found: ${macroName}`);
                return false;
            }

            let action = macro.get("action");
            if (!action) {
                TokenFX.utils.log(`executeMacroByName: Macro '${macroName}' has no action.`, 'warning');
                return true; // Still "success" in that we found it, but nothing to do.
            }

            // Replace placeholders with the context token's ID
            if (contextTokenId) {
                // IMPORTANT CHANGE: ONLY replace the Roll20-style placeholders.
                // Leave @TOKENID@ alone, as it's meant for downstream processing by !triggerByTag.
                action = action.replace(/@\{selected\|token_id\}/g, contextTokenId)
                               .replace(/@\{target\|token_id\}/g, contextTokenId);
            }

            // Process macro line by line to avoid sending blank lines to chat
            const lines = action.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) { // Only send non-empty lines
                    TokenFX.utils.log(`Executing from macro '${macroName}': ${trimmedLine}`, 'debug');
                    sendChat("API", trimmedLine);
                }
            });
            return true;
        },

        stopFxLoop(loopID) {
            if (!loopID) {
                TokenFX.utils.log("stopFxLoop: No loopID provided.", 'warning');
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", "/w gm ⚠️ No loopID provided to stop.");
                return;
            }

            const loopData = TokenFX.state.activeFxLoops[loopID];
            if (loopData) {
                TokenFX.utils.log(`Stopping FX Loop ID: ${loopID}`, 'info');
                // Clear global timeouts for this loop
                if (loopData.globalTimeouts && loopData.globalTimeouts.length > 0) {
                    loopData.globalTimeouts.forEach(timeout => clearTimeout(timeout));
                    loopData.globalTimeouts = [];
                }
                // Clear internal timeouts for each token in this loop
                if (loopData.tokens) {
                    Object.values(loopData.tokens).forEach(tokenData => {
                        if (tokenData.internalTimeouts && tokenData.internalTimeouts.length > 0) {
                            tokenData.internalTimeouts.forEach(timeout => clearTimeout(timeout));
                            tokenData.internalTimeouts = [];
                        }
                    });
                }
                delete TokenFX.state.activeFxLoops[loopID];
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ✅ FX Loop **${loopID}** stopped.`);
                
                // After stopping a loop, refresh the menu if it was persistent
                const isPersistent = (loopData.globalRepeats === "infinite" || loopData.globalRepeats > 1) || Object.values(loopData.tokens || {}).some(t => t.TRrepeats === "infinite" || t.TRrepeats > 1);
                if (isPersistent && TokenFX.config.MENU_CONSOLIDATION_ENABLED) {
                    if (TokenFX.state.fxMenuTimeout) clearTimeout(TokenFX.state.fxMenuTimeout);
                    TokenFX.state.fxMenuTimeout = setTimeout(() => TokenFX.utils.buildAndSendConsolidatedMenu(false), TokenFX.config.MENU_CONSOLIDATION_DELAY_MS || 250);
                }

            } else {
                TokenFX.utils.log(`stopFxLoop: LoopID ${loopID} not found in activeFxLoops.`, 'warning');
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ⚠️ FX Loop **${loopID}** not found or already stopped.`);
            }
        },

        buildAndSendConsolidatedMenu(isManualRequest = false) {
            if (TokenFX.state.fxMenuTimeout) {
                clearTimeout(TokenFX.state.fxMenuTimeout);
                TokenFX.state.fxMenuTimeout = null;
            }

            const isLoopPersistent = (loopData) => {
                if (!loopData) return false;
                const isGloballyRepeating = loopData.globalRepeats === "infinite" || loopData.globalRepeats > 1;
                const hasRepeatingTokens = Object.values(loopData.tokens).some(t => t.TRrepeats === "infinite" || t.TRrepeats > 1);
                return isGloballyRepeating || hasRepeatingTokens;
            };
            
            const groups = {};
            Object.keys(TokenFX.state.activeFxLoops).forEach(loopID => {
                const loopData = TokenFX.state.activeFxLoops[loopID];

                if (isLoopPersistent(loopData)) {
                    // A single loop can affect multiple tokens. We must treat the entire loop as one logical unit.
                    // We will group loops if they affect tokens with the same name and use the same effect.
                    const tokenDatas = Object.values(loopData.tokens);
                    if (tokenDatas.length === 0) return;

                    const representativeToken = tokenDatas[0];
                    const tokenName = representativeToken.name || 'Unnamed Token';
                    const fxDisplayName = loopData.fxDisplayName;
                    const imgURL = representativeToken.imgURL || '👤';

                    // Group by a composite key of the primary token's name, its image, and the effect name.
                    const groupKey = `${tokenName}-${fxDisplayName}-${imgURL}`;

                    if (!groups[groupKey]) {
                        groups[groupKey] = {
                            tokenName: tokenName,
                            fxDisplayName: fxDisplayName,
                            imgURL: imgURL,
                            loopIDs: [],
                            // If a loop has multiple tokens, display their names.
                            fullDisplayName: tokenDatas.map(t => t.name || 'Unnamed').join(', ')
                        };
                    }
                    groups[groupKey].loopIDs.push(loopID);
                }
            });

            if (Object.keys(groups).length === 0) {
                if (isManualRequest) {
                    sendChat("TokenFX", `/w gm &{template:default} {{name=🎭 Active FX Dashboard}} {{Status=✅ No persistent FX loops are currently running.}}`);
                }
                return;
            }
            
            let menu = `&{template:default} {{name=🎭 Active FX Dashboard}}`;
            let fxCounter = 0;

            Object.values(groups).forEach(group => {
                fxCounter++;
                const loopCount = group.loopIDs.length;
                const tokenImage = group.imgURL === '👤' ? '👤' : `<img src="${group.imgURL}" style="width: 40px; height: 40px; vertical-align: middle; border-radius: 4px;">`;
                
                let stopButton;
                let title;

                if (loopCount > 1) {
                    const ids = group.loopIDs.join(',');
                    stopButton = `[⏹️ Stop All (${loopCount})](!stopFxLoops ${ids})`;
                    title = `${loopCount}x ${group.tokenName}`;
                } else {
                    stopButton = `[⏹️ Stop](!stopFxLoop ${group.loopIDs[0]})`;
                    // If the single loop had multiple tokens, show all their names.
                    title = group.fullDisplayName;
                }

                const rowKey = `FX ${fxCounter}<br>${group.fxDisplayName}`;

                const rowContent = `<table style="width:100%; border:none; border-collapse: collapse; margin-left: -7px;">` +
                                       `<tr style="vertical-align: middle;">` +
                                           `<td style="width: 48px; padding: 0 8px 0 0;">${tokenImage}</td>` +
                                           `<td style="line-height: 1.2;">` +
                                               `<span style="font-weight:bold;">${title}</span>` +
                                           `</td>` +
                                           `<td style="text-align: right; padding-left: 8px;">${stopButton}</td>` +
                                       `</tr>` +
                                   `</table>`;

                menu += `{{${rowKey}=${rowContent}}}`;
            });

            let otherCommands = "";
            if (TokenFX.config.otherScriptCommands && TokenFX.config.otherScriptCommands.length > 0) {
                otherCommands = TokenFX.config.otherScriptCommands
                    .map(cmd => `[${cmd.name}](${cmd.command})`)
                    .join(" | ");
                menu += `{{Other Actions=${otherCommands}}}`;
            }

            sendChat("TokenFX", `/w gm ${menu}`);
        },
    },

    // FX Management
    fx: {
        listStandardFx() {
            const types = TokenFX.config.FX_TYPES.map(t => `• ${t}`).join('<br>');
            const colors = TokenFX.config.FX_COLORS.map(c => `• ${c}`).join('<br>');
            const menu = `&{template:default} {{name=🎨 Standard FX Types}}` +
                `{{Types=${types}}}` +
                `{{Colors=${colors}}}`;
            sendChat("TokenFX", `/w gm ${menu}`);
        },

        listCustomFx() {
            let customNames = Object.keys(TokenFX.config.customFxDefinitions);
            if (!customNames.length) {
                sendChat("TokenFX", `&{template:default} {{name=Custom FX}} {{Note=❌ No Custom FX definitions found in config.}}`);
            } else {
                let output = customNames.map(name => `• ${name} <br> (ID: ${TokenFX.config.customFxDefinitions[name]})`).join('<br>');
                const menu = `&{template:default} {{name=Custom FX}} {{FX List=${output}}}`;
                sendChat("TokenFX", `/w gm ${menu}`);
            }
        },

        showHelpMenu() {
            const helpMenu = [
                "&{template:default} {{name=💡 TokenFX Help}}",
                "{{About=TokenFX spawns visual effects on tokens with advanced timing, repetition, targeting, and area triggers.}}",
                "{{Cmd=!spawnComplexFx FX[...] ID[...] [other options]}}",
                "{{Params=",
                "• **FX**: Custom FX name or standard type (e.g., beam)<br>",
                "• **CLR**: Color for standard FX (e.g., fire). Ignored for custom FX.<br>",
                "• **ID**: Source token ID. For multiple tokens, use separate ID[...] parameters.<br>",
                "• **TARGET**: Target token ID (for beam, missile, rocket). For multiple targets, use separate TARGET[...] parameters.<br>",
                "• **TD**: Token Delay (seconds before FX starts). Default: 0<br>",
                "• **TR**: Token Repeats (number or `infinite`). Default: 1<br>",
                "• **TI**: Token Interval (seconds or `auto`). Default: 1s or auto<br>",
                "• **GR**: Global Repeats (number or `infinite`). Default: 1<br>",
                "• **GD**: Global Delay (seconds between global repeats). Default: 0<br>",
                "• **SYNC**: `sync` or `desync` (timing mode). Default: desync",
                "}}",
                "{{Exmpls=",
                "• Simple (Roll20 Native Placeholder): !spawnComplexFx FX[beam] CLR[fire] ID[&#64;&#123;selected&#124;token_id&#125;]<br>",
                "• Repeat (Roll20 Native Placeholder): !spawnComplexFx FX[nova] CLR[magic] ID[&#64;&#123;selected&#124;token_id&#125;] TR[3] TI[2]<br>",
                "• Simple (Script Placeholder): !spawnComplexFx FX[beam] CLR[fire] ID[@TOKENID@]<br>",
                "• Repeat (Script Placeholder): !spawnComplexFx FX[nova] CLR[magic] ID[@TOKENID@] TR[3] TI[2]<br>",
                "• Targeted: !spawnComplexFx FX[beam] CLR[holy] ID[@TOKENID@] TARGET[&#64;&#123;target&#124;token_id&#125;]<br>",
                "• Multi-Token: !spawnComplexFx FX[smoke] ID[id1] ID[id2] TD[0] TR[2] TI[1]<br>",
                "• Multi-Target: !spawnComplexFx FX[beam] CLR[fire] ID[id1] TARGET[t1] TARGET[t2]<br>",
                "• Synced: !spawnComplexFx FX[burn] ID[id1] ID[id2] TR[1] GR[3] GD[0] SYNC[sync]<br>",
                "}}",
                "{{Other Cmds=",
                "• !listStandardFx — List standard FX types/colors<br>",
                "• !listCustomFx — List custom FX<br>",
                "• !stopFxLoop [LoopID] — Stop a specific FX<br>",
                "• !stopAllFx — Stop all FX<br>",
                "• !triggerByTag [tag] [radius] [action] — Area trigger (see docs)<br>",
                "• !stopChains — Stop chain reactions<br>",
                "• !delay [seconds] {command} — Delay any command<br>",
                "• !getSelectedIDs — List selected token IDs",
                "}}",
                "{{Tips=",
                "• Use `@TOKENID@` as a universal placeholder for the selected token.<br>",
                "• For multiple tokens/targets, use separate ID[...] or TARGET[...] parameters.<br>",
                "• Example: ID[id1] ID[id2] instead of ID[id1 id2]<br>",
                "• For most commands, select a token first.",
                "}}"
            ].join(" ");
            sendChat("TokenFX", `/w gm ${helpMenu}`);
        },

        stopAllFx() {
            Object.keys(TokenFX.state.activeFxLoops).forEach(loopID => {
                if (TokenFX.state.activeFxLoops[loopID] && TokenFX.state.activeFxLoops[loopID].timeouts) {
                    TokenFX.state.activeFxLoops[loopID].timeouts.forEach(timeout => clearTimeout(timeout));
                }
            });
            TokenFX.state.activeFxLoops = {}; // Clear all tracked loops
            sendChat("TokenFX", `/w gm ❌ All FX loops stopped.`);
            TokenFX.utils.log("All active FX loops stopped.", 'info');
        },
        
        stopFxLoop(loopID) {
            if (!loopID) {
                TokenFX.utils.log("stopFxLoop: No loopID provided.", 'warning');
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", "/w gm ⚠️ No loopID provided to stop.");
                return;
            }

            const loopData = TokenFX.state.activeFxLoops[loopID];
            if (loopData) {
                TokenFX.utils.log(`Stopping FX Loop ID: ${loopID}`, 'info');
                // Clear global timeouts for this loop
                if (loopData.globalTimeouts && loopData.globalTimeouts.length > 0) {
                    loopData.globalTimeouts.forEach(timeout => clearTimeout(timeout));
                    loopData.globalTimeouts = [];
                }
                // Clear internal timeouts for each token in this loop
                if (loopData.tokens) {
                    Object.values(loopData.tokens).forEach(tokenData => {
                        if (tokenData.internalTimeouts && tokenData.internalTimeouts.length > 0) {
                            tokenData.internalTimeouts.forEach(timeout => clearTimeout(timeout));
                            tokenData.internalTimeouts = [];
                        }
                    });
                }
                delete TokenFX.state.activeFxLoops[loopID];
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ✅ FX Loop **${loopID}** stopped.`);
            } else {
                TokenFX.utils.log(`stopFxLoop: LoopID ${loopID} not found in activeFxLoops.`, 'warning');
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ⚠️ FX Loop **${loopID}** not found or already stopped.`);
            }
        },

        spawnComplexFx(args) {
            // Command structure example:
            // !spawnComplexFx FX[beam] CLR[fire] ID[tokA] TD[0] TR[3] TI[1] ID[tokB] TD[0.5] TR[inf] TI[auto] GR[2] GD[10] SYNC[sync]

            if (args.length < 3) { // Minimum: !spawnComplexFx FX[name] (plus more for actual effect)
                sendChat("TokenFX", "/w gm ❌ Insufficient arguments for !spawnComplexFx. Use prefixed parameters like FX[name] ID[token] TR[repeats] etc.");
                return;
            }

            // TokenFX.utils.log(`Raw arguments received: ${JSON.stringify(args)}`, 'debug'); // Reduced verbosity
            const parsedArgs = TokenFX.utils.parsePrefixedParams(args.slice(1));
            // TokenFX.utils.log(`Arguments after slice(1): ${JSON.stringify(args.slice(1))}`, 'debug'); // Reduced verbosity

            if (!parsedArgs.FX) {
                sendChat("TokenFX", "/w gm ❌ Missing FX[nameOrType] parameter."); return;
            }

            const fxNameOrType = parsedArgs.FX.trim().toLowerCase(); // Trim before use
            const fxColorOrPlaceholder = (parsedArgs.CLR || '-').trim().toLowerCase(); // Trim before use

            let finalFxToSpawn;
            let isCustom = false;
            let customFxDisplayName = "";
            const lookupFxName = parsedArgs.FX.toLowerCase(); // Already lowercased from parsedArgs.FX

            if (TokenFX.config.customFxDefinitions[lookupFxName]) {
                finalFxToSpawn = String(TokenFX.config.customFxDefinitions[lookupFxName]);
                isCustom = true;
                customFxDisplayName = parsedArgs.FX; // Keep original casing for display
                TokenFX.utils.log(`Identified custom FX: ${customFxDisplayName} (ID: ${finalFxToSpawn})`, 'debug');
            } else if (TokenFX.config.FX_TYPES.includes(fxNameOrType)) {
                if (fxColorOrPlaceholder === '-' || !TokenFX.config.FX_COLORS.includes(fxColorOrPlaceholder)) {
                    sendChat("TokenFX", `/w gm ❌ Error: Invalid or missing CLR[color] ('${fxColorOrPlaceholder}') for standard FX type '${fxNameOrType}'.`); return;
                }
                // Use the standard Roll20 FX format (type-color)
                finalFxToSpawn = `${fxNameOrType}-${fxColorOrPlaceholder}`;
                TokenFX.utils.log(`Identified standard FX: ${finalFxToSpawn}`, 'debug');

                // Add warning for problematic standard FX types when targets are likely involved
                if ((fxNameOrType === 'rocket' || fxNameOrType === 'missile') && (parsedArgs.TARGET && parsedArgs.TARGET.length > 0)) {
                    sendChat("TokenFX", `/w gm ⚠️ **Warning:** The standard FX type '${fxNameOrType}' may not travel to targets correctly. Consider using a Custom FX for reliable projectile effects.`);
                    TokenFX.utils.log(`User warned about potential issues with standard '${fxNameOrType}' FX and targets.`, 'warning');
                }
            } else {
                sendChat("TokenFX", `/w gm ❌ Error: FX '${parsedArgs.FX}' is not a recognized standard type or defined custom FX name.`);
                TokenFX.utils.log(`Unknown FX: ${parsedArgs.FX}`, 'error'); return;
            }

            // Global parameters - with defaults
            const globalRepeatsStr = parsedArgs.GR || "1";
            const globalRepeats = (globalRepeatsStr.toLowerCase() === "infinite" || globalRepeatsStr.toLowerCase() === "inf") ? "infinite" : parseInt(globalRepeatsStr, 10);
            const globalDelay = parseFloat(parsedArgs.GD || "0") * 1000; // Default 0s, convert to ms
            const syncMode = (parsedArgs.SYNC || "desync").toLowerCase();

            if (!["sync", "desync"].includes(syncMode)) {
                sendChat("TokenFX", `/w gm ❌ Invalid SYNC mode '${parsedArgs.SYNC}'. Use sync or desync.`); return;
            }
            if (isNaN(globalRepeats) && globalRepeats !== "infinite") {
                 sendChat("TokenFX", `/w gm ❌ Invalid GR[GlobalRepeats] value '${parsedArgs.GR}'. Must be a number or 'infinite'.`); return;
            }
            if (isNaN(globalDelay)) {
                 sendChat("TokenFX", `/w gm ❌ Invalid GD[GlobalDelay] value '${parsedArgs.GD}'. Must be a number.`); return;
            }

            // Token-specific parameters
            const tokenIDs = Array.isArray(parsedArgs.ID) ? parsedArgs.ID : (parsedArgs.ID ? [parsedArgs.ID] : []);
            const tokenDelays = Array.isArray(parsedArgs.TD) ? parsedArgs.TD : (parsedArgs.TD ? [parsedArgs.TD] : []);
            const tokenRepeatsArr = Array.isArray(parsedArgs.TR) ? parsedArgs.TR : (parsedArgs.TR ? [parsedArgs.TR] : []);
            const tokenIntervalsArr = Array.isArray(parsedArgs.TI) ? parsedArgs.TI : (parsedArgs.TI ? [parsedArgs.TI] : []);

            // Add target token handling
            const targetIDs = Array.isArray(parsedArgs.TARGET) ? parsedArgs.TARGET : (parsedArgs.TARGET ? [parsedArgs.TARGET] : []);
            TokenFX.utils.log(`Target token processing - Raw TARGET param: ${JSON.stringify(parsedArgs.TARGET)}, Processed targetIDs: ${JSON.stringify(targetIDs)}`, 'debug');
            
            // Validate if this FX type requires targets
            const requiresTarget = TokenFX.config.FX_TYPES_REQUIRING_TARGET.includes(fxNameOrType);
            TokenFX.utils.log(`FX type ${fxNameOrType} requires target: ${requiresTarget}`, 'debug');
            
            if (requiresTarget && targetIDs.length === 0) {
                sendChat("TokenFX", `/w gm ❌ Error: FX type '${fxNameOrType}' requires at least one target token.`);
                return;
            }

            if (tokenIDs.length === 0) {
                sendChat("TokenFX", "/w gm ❌ No ID[TokenID] parameters found. At least one token must be specified."); return;
            }

            // --- IMPROVEMENT: In pairing mode, if only one TR, TI, or TD is specified, apply it to all pairs unless overridden per-token ---
            const pairingMode = (tokenIDs.length === targetIDs.length && tokenIDs.length > 0);
            let pairingTR = null, pairingTI = null, pairingTD = null;
            if (pairingMode) {
                if (tokenRepeatsArr.length === 1) pairingTR = tokenRepeatsArr[0];
                if (tokenIntervalsArr.length === 1) pairingTI = tokenIntervalsArr[0];
                if (tokenDelays.length === 1) pairingTD = tokenDelays[0];
            }

            const loopID = `${isCustom ? 'c' : 's'}fx-${finalFxToSpawn.replace(/[^a-zA-Z0-9-_]/g, '')}-${Date.now()}`;
            const loopData = {
                fxType: String(finalFxToSpawn), // Ensure fxType is always a string
                fxDisplayName: isCustom ? customFxDisplayName : finalFxToSpawn, // Corrected for standard FX
                isCustom: isCustom,
                tokens: {}, // { tokenID: { TDelay, TRrepeats, TInterval, internalTimeouts:[], currentRepeat:0 } }
                targets: {}, // { tokenID: { TDelay, TRrepeats, TInterval, internalTimeouts:[], currentRepeat:0 } }
                globalTimeouts: [],
                globalCounter: 0,
                globalDelay: globalDelay, 
                globalRepeats: globalRepeats,
                syncMode: syncMode,
                loopID: loopID
            };

            // Process target tokens
            if (targetIDs.length > 0) {
                TokenFX.utils.log(`Processing ${targetIDs.length} target tokens for FX ${fxNameOrType}`, 'debug');
                targetIDs.forEach(targetID => {
                    const targetObj = getObj("graphic", targetID);
                    if (!targetObj) {
                        sendChat("TokenFX", `/w gm ❌ Error: Target token ${targetID} not found.`);
                        return;
                    }
                    loopData.targets[targetID] = {
                        TDelay: 0,
                        TRrepeats: 1,
                        TInterval: 0,
                        internalTimeouts: [],
                        currentRepeat: 0
                    };
                    TokenFX.utils.log(`Added target token ${targetID} to loop ${loopID}`, 'debug');
                });
            }

            // Process source tokens
            for (let i = 0; i < tokenIDs.length; i++) {
                const id = tokenIDs[i];
                // Use pairingMode global if present, else per-token, else default
                let td = parseFloat((pairingMode && pairingTD !== null ? pairingTD : (tokenDelays[i] || "0"))) * 1000;
                let trStr = (pairingMode && pairingTR !== null ? pairingTR : (tokenRepeatsArr[i] || "1")).toLowerCase();
                let tr = (trStr === "infinite" || trStr === "inf") ? "infinite" : parseInt(trStr, 10);
                let tiStr = (pairingMode && pairingTI !== null ? pairingTI : (tokenIntervalsArr[i] || TokenFX.config.defaultTokenInterval.toString())).toLowerCase();
                let ti; // ms // Will be determined based on TI[auto], overrides, or estimation

                let effectiveDuration = null;
                let sourceOfDuration = "none";
                let isFxInfiniteEmitter = false;

                // Check disallowedLoopingFx first (uses lowercase name)
                if (isCustom && TokenFX.config.disallowedLoopingFx.includes(lookupFxName) && (tr > 1 || tr === "infinite")) {
                    sendChat("TokenFX", `/w gm WARNING: Custom FX '${customFxDisplayName}' is in disallowedLoopingFx. Forcing TR to 1 for token ${id}.`);
                    TokenFX.utils.log(`Loop ${loopID}: Custom FX ${customFxDisplayName} on ${id} is disallowed for looping. TR forced to 1.`, 'warning');
                    tr = 1;
                }

                if (isCustom) {
                    if (TokenFX.config.customFxDurationOverrides[finalFxToSpawn]) { // finalFxToSpawn is the ID for custom
                        effectiveDuration = TokenFX.config.customFxDurationOverrides[finalFxToSpawn];
                        sourceOfDuration = "override";
                        TokenFX.utils.log(`Loop ${loopID}: Duration for custom FX ${customFxDisplayName} (${finalFxToSpawn}) from override: ${effectiveDuration}s`, 'debug');
                    } else {
                        const estimation = TokenFX.utils.estimateCustomFxDuration(finalFxToSpawn);
                        if (estimation.error) {
                            TokenFX.utils.log(`Loop ${loopID}: Failed to estimate duration for ${customFxDisplayName} (${finalFxToSpawn}): ${estimation.error}`, 'warning');
                            sourceOfDuration = "estimation_failed";
                        } else if (estimation.isInfiniteEmitter) {
                            effectiveDuration = Infinity;
                            isFxInfiniteEmitter = true;
                            sourceOfDuration = "estimated_infinite_emitter";
                            TokenFX.utils.log(`Loop ${loopID}: Custom FX ${customFxDisplayName} (${finalFxToSpawn}) estimated as infinite emitter.`, 'debug');
                            if (tr === "infinite" || tr > 1) {
                                sendChat("TokenFX", `/w gm INFO: FX '${customFxDisplayName}' has an infinite emitter. TR for token ${id} set to 1 as script looping is redundant.`);
                                tr = 1; // Script looping is redundant if emitter is infinite
                            }
                        } else {
                            effectiveDuration = estimation.estimatedSeconds;
                            sourceOfDuration = "estimated_definition";
                            TokenFX.utils.log(`Loop ${loopID}: Duration for custom FX ${customFxDisplayName} (${finalFxToSpawn}) from estimation: ${effectiveDuration}s`, 'debug');
                        }
                    }
                } else { // Standard FX
                    // Lookup duration using only the type (fxNameOrType), not the full fxType (type-color)
                    if (TokenFX.config.standardFxVisualDurations[fxNameOrType]) {
                        effectiveDuration = TokenFX.config.standardFxVisualDurations[fxNameOrType];
                        sourceOfDuration = "standard_config";
                        TokenFX.utils.log(`Loop ${loopID}: Duration for standard FX type '${fxNameOrType}' (full: ${finalFxToSpawn}) from config: ${effectiveDuration}s`, 'debug');
                    } else {
                        TokenFX.utils.log(`Loop ${loopID}: No configured duration for standard FX type '${fxNameOrType}' (full: ${finalFxToSpawn}). TI[auto] will use default.`, 'debug');
                    }
                }

                if (isNaN(td)) { sendChat("TokenFX", `/w gm ⚠️ Invalid TD for token ${id}. Defaulting to 0s.`); td = 0; }
                if (isNaN(tr) && tr !== "infinite") { sendChat("TokenFX", `/w gm ⚠️ Invalid TR for token ${id}. Defaulting to 1.`); tr = 1; }

                // Determine TI (Token Interval)
                if (tiStr === "auto" || tiStr === "next") {
                    if (effectiveDuration === Infinity) {
                        ti = TokenFX.config.defaultTokenInterval * 1000;
                        if (tr > 1) { // Only warn if script was trying to pulse an infinite emitter
                             sendChat("TokenFX", `/w gm INFO: TI[auto] for infinite emitter FX '${customFxDisplayName || fxNameOrType}' on token ${id} defaulted to ${ti/1000}s, but TR already set to 1.`);
                        }
                    } else if (typeof effectiveDuration === 'number' && effectiveDuration > 0) {
                        ti = (effectiveDuration * 1000) - 100; // ms, subtract 0.1s to allow restart just before old one visually ends
                        if (ti < 100) ti = 100; // Min 0.1s interval
                        sendChat("TokenFX", `/w gm INFO: TI[auto] for FX on token ${id} set to ${ti / 1000}s (source: ${sourceOfDuration}).`);
                        TokenFX.utils.log(`Loop ${loopID}: TI[auto] for ${id} resolved to ${ti / 1000}s (source: ${sourceOfDuration}).`, 'info');
                    } else {
                        ti = TokenFX.config.defaultTokenInterval * 1000;
                        sendChat("TokenFX", `/w gm ⚠️ TI[auto] for FX on token ${id}: No duration found/estimable (source: ${sourceOfDuration}). Defaulting to ${ti / 1000}s interval.`);
                        TokenFX.utils.log(`Loop ${loopID}: TI[auto] for ${id} - no duration, defaulted to ${ti / 1000}s.`, 'warning');
                    }
                } else {
                    ti = parseFloat(tiStr) * 1000; // User-provided TI in ms
                    if (isNaN(ti)) {
                        sendChat("TokenFX", `/w gm ⚠️ Invalid TI value '${tiStr}' for token ${id}. Defaulting to ${TokenFX.config.defaultTokenInterval}s.`);
                        ti = TokenFX.config.defaultTokenInterval * 1000;
                    } else if (typeof effectiveDuration === 'number' && effectiveDuration > 0 && (tr > 1 || tr === "infinite")) {
                        // Overlap warning for user-set TI
                        if (ti < effectiveDuration * 1000 * TokenFX.config.overlapWarningThreshold) {
                            const warningKey = `overlap-warning-${customFxDisplayName || finalFxToSpawn}`;
                            const warningMessage = `/w gm WARNING: FX '${customFxDisplayName || finalFxToSpawn}' has an estimated duration of ~${effectiveDuration.toFixed(1)}s. The current Token Interval (TI) of ${(ti/1000).toFixed(1)}s may cause significant visual overlap for one or more tokens. (This message is throttled and will not repeat for ${TokenFX.config.THROTTLE_COOLDOWN_SECONDS}s).`;
                            TokenFX.utils.sendThrottledChat("TokenFX", warningMessage, warningKey);
                            TokenFX.utils.log(`Loop ${loopID}: Potential overlap for ${customFxDisplayName || finalFxToSpawn} on ${id}. Duration: ${effectiveDuration.toFixed(1)}s, Interval: ${(ti/1000).toFixed(1)}s`, 'warning');
                        }
                    }
                }

                // Final check for TR with infinite emitter (could have been user-set TR with an estimated infinite emitter)
                if (isCustom && isFxInfiniteEmitter && (tr > 1 || tr === "infinite")){
                    if(tr !== 1) { // Avoid redundant message if already forced by disallowedLoopingFx
                       sendChat("TokenFX", `/w gm INFO: FX '${customFxDisplayName}' has an infinite emitter. TR for token ${id} set to 1 as script looping is redundant.`);
                       TokenFX.utils.log(`Loop ${loopID}: FX ${customFxDisplayName} on ${id} confirmed as infinite emitter. TR forced to 1.`, 'info');
                    }
                    tr = 1;
                }

                const tokenObj = getObj("graphic", id);
                if (!tokenObj) {
                    TokenFX.utils.log(`Source token with ID ${id} not found. Skipping from this loop.`, 'warning');
                    sendChat("TokenFX", `/w gm ⚠️ **Warning:** Source token with ID \`${id}\` was not found and has been skipped.`);
                    continue; 
                }

                loopData.tokens[id] = {
                    TDelay: td,
                    TRrepeats: tr,
                    TInterval: ti,
                    internalTimeouts: [],
                    currentRepeat: 0,
                    name: tokenObj.get('name'),
                    imgURL: TokenFX.utils.getTokenImageURL(tokenObj, 'thumb')
                };
            }
            
            // Store the unique target IDs in the loopData for use in apply functions
            const uniqueTargetIDs = [...new Set(parsedArgs.TARGET || [])];
            loopData.uniqueTargetIDs = uniqueTargetIDs;
            // Store the target order from the command for 1:1 pairing
            const targetOrder = parsedArgs.TARGET || [];
            loopData.targetOrder = targetOrder;
            TokenFX.state.activeFxLoops[loopID] = loopData;
            TokenFX.utils.log(`Starting FX loop: ID=${loopID}, FX=${loopData.fxDisplayName}, Tokens=${Object.keys(loopData.tokens).length}, GR=${globalRepeats}, GD=${globalDelay/1000}s, SYNC=${syncMode}`, 'info');

            // New check: Ensure valid targets were actually found if required
            if (requiresTarget && Object.keys(loopData.targets).length === 0 && targetIDs.length > 0) { // targetIDs.length > 0 means user *intended* to provide targets
                sendChat("TokenFX", `/w gm ❌ Error: FX type '${fxNameOrType}' requires at least one *valid* target token, but none of the provided target IDs (Original Input: ${JSON.stringify(targetIDs)}) could be found. Loop ${loopID} aborted.`);
                TokenFX.utils.log(`Loop ${loopID} aborted: FX type ${fxNameOrType} requires valid targets, but none were found/validated from input list: ${JSON.stringify(targetIDs)}`, 'error');
                delete TokenFX.state.activeFxLoops[loopID]; // Clean up the partially created loop
                return; // Stop processing this command
            }

            // --- Menu Generation Logic ---
            const isPersistent = (loopData.globalRepeats === "infinite" || loopData.globalRepeats > 1) || 
                                 Object.values(loopData.tokens).some(t => t.TRrepeats === "infinite" || t.TRrepeats > 1);

            if (isPersistent) {
            if (TokenFX.config.MENU_CONSOLIDATION_ENABLED) {
                if (TokenFX.state.fxMenuTimeout) clearTimeout(TokenFX.state.fxMenuTimeout);
                    // Pass `false` to indicate this is an automatic, not manual, request
                    TokenFX.state.fxMenuTimeout = setTimeout(() => TokenFX.utils.buildAndSendConsolidatedMenu(false), TokenFX.config.MENU_CONSOLIDATION_DELAY_MS || 250);
            } else {
                    // Legacy behavior for non-consolidated menus, but only for persistent effects
            let stopButton = TokenFX.config.fxMenuTemplate.stopButton.replace("{loopID}", loopID);
            let otherCommands = "";
            if (TokenFX.config.otherScriptCommands && TokenFX.config.otherScriptCommands.length > 0) {
                otherCommands = TokenFX.config.otherScriptCommands
                    .map(cmd => `[${cmd.name}](${cmd.command})`)
                    .join(" | ");
            }
            let menuMessage = `&{template:default} {{name=🎭 TokenFX Menu}}` +
                `{{FX=${loopData.fxDisplayName}}}` +
                `{{Loop ID=${loopID}}}` +
                `{{Actions=${stopButton}${otherCommands ? '<br>' + otherCommands : ''}}}`;
                sendChat("TokenFX", `/w gm ${menuMessage}`);
                }
            }

            if (syncMode === "sync") {
                TokenFX.fx.applyFxLoop_sync(loopID);
            } else { // desync
                TokenFX.fx.applyFxLoop_desync(loopID);
            }
        },
        
        applyFxLoop_desync(loopID) {
            const loopData = TokenFX.state.activeFxLoops[loopID];
            if (!loopData) {
                TokenFX.utils.log(`Loop ${loopID} not found for desync. Stopping.`, 'warn'); return;
            }

            if (loopData.globalRepeats !== "infinite" && loopData.globalCounter >= loopData.globalRepeats) {
                TokenFX.utils.log(`Loop ${loopID} (desync) reached global repeat limit. Cleaning up.`, 'debug');
                delete TokenFX.state.activeFxLoops[loopID]; return;
            }
            
            TokenFX.utils.log(`APPLY_FX_LOOP_DESYNC CALLED: LoopID=${loopID}, FX_Type=${loopData.fxType}, Num_Tokens=${Object.keys(loopData.tokens).length}, Num_Targets=${Object.keys(loopData.targets).length}`, 'info');

            // --- Pairing logic for sources and targets ---
            const sourceIDs = Object.keys(loopData.tokens);
            const targetIDs = Object.keys(loopData.targets);
            // Use the original target order from the command
            const targetOrder = loopData.targetOrder || [];
            const pairingMode = (sourceIDs.length === targetOrder.length && sourceIDs.length > 0);
            // If pairingMode, pair by order; else, cross-multiply all

            sourceIDs.forEach((tokenID, idx) => {
                const tokenData = loopData.tokens[tokenID];
                function spawnAndRepeatIndividual(currentTokenID, tokenData) {
                    if (!TokenFX.state.activeFxLoops[loopID]) return;
                    let tokenObj = getObj("graphic", currentTokenID);
                    if (tokenObj) {
                        if (targetIDs.length > 0) {
                            if (pairingMode) {
                                // Pairing mode: only spawn for matching index
                                const pairIdx = sourceIDs.indexOf(currentTokenID);
                                if (pairIdx !== -1 && pairIdx < targetOrder.length) {
                                    const targetID = targetOrder[pairIdx];
                                    let targetObj = getObj("graphic", targetID);
                                    if (targetObj && tokenObj) {
                                        TokenFX.utils.log(`Loop ${loopID} (desync) - Spawning paired FX from ${currentTokenID} to ${targetID}`, 'debug');
                                        let sX = tokenObj.get("left");
                                        let sY = tokenObj.get("top");
                                        let tX = targetObj.get("left"); // Corrected from tokenObj
                                        let tY = targetObj.get("top");  // Corrected from tokenObj
                                        let type = loopData.fxType; 
                                        let pageId = tokenObj.get("_pageid");
                                        if (typeof sX === 'number' && typeof sY === 'number' && 
                                            typeof tX === 'number' && typeof tY === 'number' &&
                                            typeof type === 'string' && typeof pageId === 'string') {
                                            spawnFxBetweenPoints({x: sX, y: sY}, {x: tX, y: tY}, type, pageId);
                                        } else {
                                            TokenFX.utils.log(`spawnFxBetweenPoints (desync, paired) ABORTED due to invalid arg types.`, 'error');
                                        }
                                    }
                                }
                            } else {
                                // Cross-multiplied (all-to-all)
                                targetIDs.forEach(targetID => {
                                    let targetObj = getObj("graphic", targetID);
                                    if (targetObj && tokenObj) {
                                        TokenFX.utils.log(`Loop ${loopID} (desync) - Spawning target-based FX from ${currentTokenID} to ${targetID}`, 'debug');
                                        let sX = tokenObj.get("left");
                                        let sY = tokenObj.get("top");
                                        let tX = targetObj.get("left"); // Corrected from tokenObj
                                        let tY = targetObj.get("top");  // Corrected from tokenObj
                                        let type = loopData.fxType; 
                                        let pageId = tokenObj.get("_pageid");
                                        if (typeof sX === 'number' && typeof sY === 'number' && 
                                            typeof tX === 'number' && typeof tY === 'number' &&
                                            typeof type === 'string' && typeof pageId === 'string') {
                                            spawnFxBetweenPoints({x: sX, y: sY}, {x: tX, y: tY}, type, pageId);
                                        } else {
                                            TokenFX.utils.log(`spawnFxBetweenPoints (desync, target) ABORTED due to invalid arg types.`, 'error');
                                        }
                                    } else {
                                        TokenFX.utils.log(`Loop ${loopID} (desync) - Target token ${targetID} not found or source token missing.`, 'warn');
                                    }
                                });
                            }
                        } else if (tokenObj) { // Non-targeted or FX type doesn't require target
                            TokenFX.utils.log(`Loop ${loopID} (desync) - Spawning single-token FX for ${currentTokenID}`, 'debug');
                            let sX = tokenObj.get("left");
                            let sY = tokenObj.get("top");
                            let type = loopData.fxType;
                            let pageId = tokenObj.get("_pageid");
                            if (typeof sX === 'number' && typeof sY === 'number' &&
                                typeof type === 'string' && typeof pageId === 'string') {
                                spawnFx(sX, sY, type, pageId);
                            } else {
                                TokenFX.utils.log(`spawnFx (desync, single) ABORTED due to invalid arg types.`, 'error');
                            }
                        }
                        TokenFX.utils.log(`Loop ${loopID} (desync) - Token ${currentTokenID} spawned FX (Repeat ${tokenData.currentRepeat + 1}/${tokenData.TRrepeats})`, 'debug');
                    } else {
                        TokenFX.utils.log(`Loop ${loopID} (desync) - Token ${currentTokenID} not found.`, 'warn'); return;
                    }

                    tokenData.currentRepeat++;
                    if (tokenData.TRrepeats === "infinite" || tokenData.currentRepeat < tokenData.TRrepeats) {
                        let timeoutHandle = setTimeout(() => spawnAndRepeatIndividual(currentTokenID, tokenData), tokenData.TInterval);
                        tokenData.internalTimeouts.push(timeoutHandle);
                    } else {
                        TokenFX.utils.log(`Loop ${loopID} (desync) - Token ${currentTokenID} finished its TRrepeats.`, 'debug');
                    }
                }

                if (tokenData.TRrepeats > 0 || tokenData.TRrepeats === "infinite") {
                    let initialTimeoutHandle = setTimeout(() => spawnAndRepeatIndividual(tokenID, tokenData), tokenData.TDelay);
                    tokenData.internalTimeouts.push(initialTimeoutHandle);
                }
            });

            loopData.globalCounter++;
            if (loopData.globalRepeats === "infinite" || loopData.globalCounter < loopData.globalRepeats) {
                loopData.globalTimeouts.forEach(clearTimeout);
                loopData.globalTimeouts = [];
                let nextGlobalCycleTimeout = setTimeout(() => TokenFX.fx.applyFxLoop_desync(loopID), loopData.globalDelay);
                loopData.globalTimeouts.push(nextGlobalCycleTimeout);
            } else {
                TokenFX.utils.log(`Loop ${loopID} (desync) finished all global repeats. Will be cleaned up.`, 'debug');
                // The loop is not deleted here, it's deleted at the top of the function on the next theoretical call
            }
        },
        
        applyFxLoop_sync(loopID) {
            const loopData = TokenFX.state.activeFxLoops[loopID];
            if (!loopData) {
                TokenFX.utils.log(`Loop ${loopID} not found for sync. Stopping.`, 'warn'); return;
            }

            if (loopData.globalRepeats !== "infinite" && loopData.globalCounter >= loopData.globalRepeats) {
                TokenFX.utils.log(`Loop ${loopID} (sync) reached global repeat limit. Cleaning up.`, 'debug');
                delete TokenFX.state.activeFxLoops[loopID]; return;
            }
            
            TokenFX.utils.log(`APPLY_FX_LOOP_SYNC CALLED: LoopID=${loopID}, FX_Type=${loopData.fxType}, Num_Tokens=${Object.keys(loopData.tokens).length}, Num_Targets=${Object.keys(loopData.targets).length}`, 'info');

            let longestTokenCycleDurationThisGlobalLoop = 0;
            let allTokensInThisCycleAreInfinite = true; // Assume true, set to false if any finite token found
            Object.values(loopData.tokens).forEach(td => {
                if (td.TRrepeats !== "infinite") allTokensInThisCycleAreInfinite = false;
            });
            
            let activeTokenCycles = Object.keys(loopData.tokens).length;
            let completedTokenCycles = 0;

            function checkAllTokensCompleteForSyncGlobalCycle() {
                completedTokenCycles++;
                if (completedTokenCycles >= activeTokenCycles) {
                    loopData.globalCounter++;
                    if (loopData.globalRepeats === "infinite" || loopData.globalCounter < loopData.globalRepeats) {
                        let nextGlobalSyncDelay = loopData.globalDelay; 
                        if (loopData.globalDelay <= 0 && !allTokensInThisCycleAreInfinite) { 
                             nextGlobalSyncDelay = longestTokenCycleDurationThisGlobalLoop > 0 ? longestTokenCycleDurationThisGlobalLoop : 0; // Ensure non-negative
                        }
                        
                        TokenFX.utils.log(`Loop ${loopID} (sync) - All tokens in GlobalCycle ${loopData.globalCounter-1} complete. Next cycle (${loopData.globalCounter}) in ${nextGlobalSyncDelay/1000}s. Longest path was ${longestTokenCycleDurationThisGlobalLoop/1000}s.`, 'debug');
                        loopData.globalTimeouts.forEach(clearTimeout);
                        loopData.globalTimeouts = [];
                        // Reset currentRepeat for all tokens before starting the next global cycle
                        Object.values(loopData.tokens).forEach(tokenData => tokenData.currentRepeat = 0);

                        let nextGlobalTimeout = setTimeout(() => TokenFX.fx.applyFxLoop_sync(loopID), nextGlobalSyncDelay);
                        loopData.globalTimeouts.push(nextGlobalTimeout);
                    } else {
                        TokenFX.utils.log(`Loop ${loopID} (sync) finished all global repeats. Will be cleaned up.`, 'debug');
                    }
                }
            }

            // --- Pairing logic for sources and targets ---
            const sourceIDs = Object.keys(loopData.tokens);
            const targetIDs = Object.keys(loopData.targets);
            // Use the original target order from the command
            const targetOrder = loopData.targetOrder || [];
            const pairingMode = (sourceIDs.length === targetOrder.length && sourceIDs.length > 0);
            // If pairingMode, pair by order; else, cross-multiply all

            sourceIDs.forEach((tokenID) => { // Removed idx as it wasn't used in this scope
                const tokenData = loopData.tokens[tokenID];
                tokenData.currentRepeat = 0; // Ensure currentRepeat is reset at the start of a global cycle for this token

                function spawnAndRepeatIndividualSync(currentTokenID, tkData) {
                    if (!TokenFX.state.activeFxLoops[loopID] || !tkData) return; // Added !tkData check
                    
                    let tokenObj = getObj("graphic", currentTokenID);
                    if (tokenObj) {
                        // Corrected condition for aimed FX in sync mode
                        if (targetIDs.length > 0 && TokenFX.utils.isAimedFxType(loopData.isCustom ? loopData.fxDisplayName.toLowerCase() : loopData.fxType.split('-')[0])) {
                            if (pairingMode) {
                                // Pairing mode: only spawn for matching index
                                const pairIdx = sourceIDs.indexOf(currentTokenID);
                                if (pairIdx !== -1 && pairIdx < targetOrder.length) {
                                    const targetID = targetOrder[pairIdx];
                                    let targetObj = getObj("graphic", targetID);
                                    if (targetObj && tokenObj) {
                                        TokenFX.utils.log(`Loop ${loopID} (sync) - Spawning paired FX from ${currentTokenID} to ${targetID}`, 'debug');
                                        let sX = tokenObj.get("left");
                                        let sY = tokenObj.get("top");
                                        let tX = targetObj.get("left"); // Corrected from tokenObj
                                        let tY = targetObj.get("top");  // Corrected from tokenObj
                                        let type = loopData.fxType; 
                                        let pageId = tokenObj.get("_pageid");
                                        if (typeof sX === 'number' && typeof sY === 'number' && 
                                            typeof tX === 'number' && typeof tY === 'number' &&
                                            typeof type === 'string' && typeof pageId === 'string') {
                                            spawnFxBetweenPoints({x: sX, y: sY}, {x: tX, y: tY}, type, pageId);
                                        } else {
                                            TokenFX.utils.log(`spawnFxBetweenPoints (sync, paired) ABORTED due to invalid arg types.`, 'error');
                                        }
                                    }
                                }
                            } else {
                                // Cross-multiplied (all-to-all)
                                targetIDs.forEach(targetID => {
                                    let targetObj = getObj("graphic", targetID);
                                    if (targetObj && tokenObj) {
                                        TokenFX.utils.log(`Loop ${loopID} (sync) - Spawning target-based FX from ${currentTokenID} to ${targetID}`, 'debug');
                                        let sX = tokenObj.get("left");
                                        let sY = tokenObj.get("top");
                                        let tX = targetObj.get("left"); // Corrected from tokenObj
                                        let tY = targetObj.get("top");  // Corrected from tokenObj
                                        let type = loopData.fxType; 
                                        let pageId = tokenObj.get("_pageid");
                                        if (typeof sX === 'number' && typeof sY === 'number' && 
                                            typeof tX === 'number' && typeof tY === 'number' &&
                                            typeof type === 'string' && typeof pageId === 'string') {
                                            spawnFxBetweenPoints({x: sX, y: sY}, {x: tX, y: tY}, type, pageId);
                                        } else {
                                            TokenFX.utils.log(`spawnFxBetweenPoints (sync, target) ABORTED due to invalid arg types.`, 'error');
                                        }
                                    } else {
                                        TokenFX.utils.log(`Loop ${loopID} (sync) - Target token ${targetID} not found or source token missing.`, 'warn');
                                    }
                                });
                            }
                        } else if (tokenObj) { // Non-targeted or FX type doesn't require target
                            TokenFX.utils.log(`Loop ${loopID} (sync) - Spawning single-token FX for ${currentTokenID}`, 'debug');
                            let sX = tokenObj.get("left");
                            let sY = tokenObj.get("top");
                            let type = loopData.fxType;
                            let pageId = tokenObj.get("_pageid");
                            if (typeof sX === 'number' && typeof sY === 'number' &&
                                typeof type === 'string' && typeof pageId === 'string') {
                                spawnFx(sX, sY, type, pageId);
                            } else {
                                TokenFX.utils.log(`spawnFx (sync, single) ABORTED due to invalid arg types.`, 'error');
                            }
                        }
                        TokenFX.utils.log(`Loop ${loopID} (sync) - Token ${currentTokenID} spawned FX (Repeat ${tkData.currentRepeat + 1}/${tkData.TRrepeats})`, 'debug');
                    } else {
                        TokenFX.utils.log(`Loop ${loopID} (sync) - Token ${currentTokenID} not found.`, 'warn');
                        if (tkData.TRrepeats !== "infinite") { // Only count as 'complete' for sync logic if it wasn't an infinite one that vanished
                             checkAllTokensCompleteForSyncGlobalCycle();
                        }
                        return; // Stop processing this vanished token
                    }

                    tkData.currentRepeat++;
                    if (tkData.TRrepeats === "infinite" || tkData.currentRepeat < tkData.TRrepeats) {
                        let timeoutHandle = setTimeout(() => spawnAndRepeatIndividualSync(currentTokenID, tkData), tkData.TInterval);
                        if(tkData.internalTimeouts){ tkData.internalTimeouts.push(timeoutHandle); } else { tkData.internalTimeouts = [timeoutHandle];}
                    } else { // Token finished its repeats for this global cycle
                        let thisTokenTotalDuration = tkData.TDelay + (tkData.TRrepeats === "infinite" ? 0 : (tkData.TRrepeats * tkData.TInterval));
                        if (thisTokenTotalDuration > longestTokenCycleDurationThisGlobalLoop) {
                            longestTokenCycleDurationThisGlobalLoop = thisTokenTotalDuration;
                        }
                        TokenFX.utils.log(`Loop ${loopID} (sync) - Token ${currentTokenID} finished its TRrepeats for this global cycle. Duration: ${thisTokenTotalDuration/1000}s`, 'debug');
                        checkAllTokensCompleteForSyncGlobalCycle();
                    }
                } // End of spawnAndRepeatIndividualSync

                // Initial call for this token in the current global cycle
                if (tokenData.TRrepeats > 0 || tokenData.TRrepeats === "infinite") {
                    // Clear previous internal timeouts for this token before starting its sequence in a new global cycle
                    if(tokenData.internalTimeouts && tokenData.internalTimeouts.length > 0){
                        tokenData.internalTimeouts.forEach(clearTimeout);
                        tokenData.internalTimeouts = [];
                    }
                    let initialTimeoutHandle = setTimeout(() => spawnAndRepeatIndividualSync(tokenID, tokenData), tokenData.TDelay);
                    if(tokenData.internalTimeouts){ tokenData.internalTimeouts.push(initialTimeoutHandle); } else { tokenData.internalTimeouts = [initialTimeoutHandle];}
                } else { // Token has 0 repeats, effectively completes immediately
                    checkAllTokensCompleteForSyncGlobalCycle();
                }
            });
        }
    },

    // Area Trigger Management (Copied from original, to be reviewed later)
    trigger: {
        stopChains() {
            if(TokenFX.state.chainReaction && TokenFX.state.chainReaction.chainStartTime) {
                let timeSinceStart = (Date.now() - TokenFX.state.chainReaction.chainStartTime) / 1000;
                TokenFX.utils.log(`Chain reaction sequence forcefully stopped after ${timeSinceStart.toFixed(1)} seconds`);
                // TokenFX.utils.log(`Final trigger counts:`, TokenFX.state.chainReaction.tokenTriggerCounts); // Needs JSON.stringify for object
                
                if(TokenFX.state.chainResetTimeout) {
                    clearTimeout(TokenFX.state.chainResetTimeout);
                    TokenFX.state.chainResetTimeout = null;
                }
                
                TokenFX.state.chainReaction.tokenTriggerCounts = {};
                TokenFX.state.chainReaction.chainStartTime = null;
                
                sendChat("TokenFX", "/w gm ⛔ Chain reactions stopped.");
            } else {
                sendChat("TokenFX", "/w gm ℹ️ No active chain reactions to stop.");
            }
        },

        triggerByTag(args, msg) {
            if (args.length < 4) {
                sendChat("TokenFX", "/w gm ❌ **Usage:** !triggerByTag [tag] [radius ft] [action macro] [--originId optional_token_id]");
                return;
            }

            TokenFX.state.chainReaction.chainStartTime = Date.now();
            TokenFX.state.chainReaction.tokenTriggerCounts = {};
            if (TokenFX.state.chainResetTimeout) {
                clearTimeout(TokenFX.state.chainResetTimeout);
                TokenFX.state.chainResetTimeout = null;
            }

            let originToken;
            const originIdIndex = args.findIndex(arg => arg.toLowerCase() === '--originid');

            if (originIdIndex > -1 && args[originIdIndex + 1]) {
                const originId = args[originIdIndex + 1];
                originToken = getObj("graphic", originId);
                if (!originToken) {
                    sendChat("TokenFX", `/w gm ❌ **Error:** Origin token with ID ${originId} not found.`);
                    return;
                }
                // Remove --originId and its value from args so it doesn't mess with actionMacro parsing
                args.splice(originIdIndex, 2);
            } else if (msg.selected && msg.selected.length > 0) {
                originToken = getObj("graphic", msg.selected[0]._id);
            } else {
                sendChat("TokenFX", "/w gm ❌ **Error:** No token selected and no --originId provided! Please select an origin token.");
                return;
            }

            if (!originToken) {
                sendChat("TokenFX", "/w gm ❌ **Error:** Could not establish an origin token for the trigger.");
                return;
            }
            
            let tagToFind = args[1].toLowerCase();
            let radiusFt = parseFloat(args[2]);
            if (isNaN(radiusFt)) {
                sendChat("TokenFX", "/w gm ❌ **Error:** Radius must be a number (in feet).");
                return;
            }
            let actionMacro = args.slice(3).join(" ");
            let isPerToken = actionMacro.includes("@{selected|token_id}") || actionMacro.includes("@{target|token_id}") || actionMacro.includes("@TOKENID@");

            let originX = originToken.get("left");
            let originY = originToken.get("top");
            let pageID = originToken.get("pageid");

            TokenFX.trigger.processTrigger(tagToFind, radiusFt, actionMacro, isPerToken, originX, originY, pageID);
        },

        triggerByTagChain(args) {
            if(args.length < 7) {
                sendChat("TokenFX", "/w gm ❌ **Usage:** !triggerByTagChain [tag] [radius ft] [encodedMacro] [originX] [originY] [pageID]");
                return;
            }

            let tagToFind = args[1].toLowerCase();
            let radiusFt = parseFloat(args[2]);
            if(isNaN(radiusFt)) { sendChat("TokenFX", "/w gm ❌ **Error:** Radius must be a number (in feet)."); return; }

            let originXArg = parseFloat(args[args.length - 3]);
            let originYArg = parseFloat(args[args.length - 2]);
            let pageID = args[args.length - 1];

            let encodedMacroParts = args.slice(3, args.length - 3);
            let encodedMacro = encodedMacroParts.join(" ");
            let actionMacro = decodeURIComponent(encodedMacro);
            let isPerToken = actionMacro.includes("@{selected|token_id}") || actionMacro.includes("@{target|token_id}") || actionMacro.includes("@TOKENID@");

            TokenFX.trigger.processTrigger(tagToFind, radiusFt, actionMacro, isPerToken, originXArg, originYArg, pageID);
        },

        processTrigger(tagToFind, radiusFt, actionMacro, isPerToken, originX, originY, pageID) {
            let page = getObj("page", pageID);
            let gridPixelSize = page ? parseFloat(page.get("snapping_increment")) : TokenFX.config.DEFAULT_GRID_SIZE;
            if (!gridPixelSize || gridPixelSize < 10) {
                gridPixelSize = TokenFX.config.DEFAULT_GRID_SIZE;
            }
            let scaleNumber = page ? parseFloat(page.get("scale_number")) : TokenFX.config.DEFAULT_SCALE;
            if (!scaleNumber || scaleNumber < 1) {
                scaleNumber = TokenFX.config.DEFAULT_SCALE;
            }
            let radiusPx = (radiusFt / scaleNumber) * gridPixelSize;

            let allTokens = findObjs({
                _type: "graphic",
                pageid: pageID
            });

            const notePromises = allTokens
                .filter(token => {
                    if (token.get("left") === originX && token.get("top") === originY) return false;
                    let dx = token.get("left") - originX;
                    let dy = token.get("top") - originY;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    return dist <= radiusPx;
                })
                .map(token => {
                    return new Promise((resolve) => {
                        const tokenNotes = token.get("gmnotes") || "";
                        const charID = token.get("represents");

                        if (charID) {
                            let ch = getObj("character", charID);
                            if (ch) {
                                ch.get("gmnotes", charNotes => {
                                    const combinedNotes = `${tokenNotes}\n${charNotes || ""}`;
                                    resolve({ token: token, notes: combinedNotes });
                                });
                            } else {
                                resolve({ token: token, notes: tokenNotes });
                            }
                        } else {
                            resolve({ token: token, notes: tokenNotes });
                        }
                    });
                });

            Promise.all(notePromises)
                .then(results => {
                    const matchedTokens = results.filter(res => {
                        const cleanedNotes = TokenFX.utils.decodeAndStrip(res.notes);
                        return TokenFX.utils.hasTag(cleanedNotes, tagToFind);
                    }).map(res => res.token);

                    executeAction(matchedTokens);
                })
                .catch(err => {
                    TokenFX.utils.log(`Error processing token notes with promises: ${err}`, 'error');
                });


            function executeAction(matchedTokens) {
                TokenFX.utils.log(`executeAction: Matched ${matchedTokens.length} tokens for tag '{${tagToFind}}' within ${radiusFt}ft.`, 'info');
                if (matchedTokens.length === 0) {
                    if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ℹ️ No tokens with "{${tagToFind}}" found within ${radiusFt}ft (${Math.round(radiusPx)}px).`);
                    return;
                }
                if (isPerToken) {
                    matchedTokens.forEach(token => {
                         let charID = token.get("represents");
                         if(charID) {
                            let ch = getObj("character", charID);
                            if(ch) { 
                                ch.get("gmnotes", gm => {
                                    const combinedNotes = `${token.get("gmnotes") || ""}\n${gm || ""}`;
                                    doActionWithNotes(token, TokenFX.utils.decodeAndStrip(combinedNotes));
                                });
                            }
                            else { 
                                doActionWithNotes(token, TokenFX.utils.decodeAndStrip(token.get("gmnotes") || "")); 
                            }
                        } else {
                            doActionWithNotes(token, TokenFX.utils.decodeAndStrip(token.get("gmnotes") || ""));
                        }
                    });
                } else {
                    let ids = matchedTokens.map(t => t.id).join(" ");
                    let parts = actionMacro.split(" ");
                    if (parts.length === 0) {
                        sendChat("TokenFX", "/w gm ❌ Error: Action macro is empty.");
                        return;
                    }
                    let cmdName = parts[0];
                    let remainder = parts.slice(1).join(" ");
                    let finalCmd = cmdName + " --ids " + ids;
                    if (remainder) finalCmd += " " + remainder;
                    TokenFX.utils.log(`Global action: Cmd='${finalCmd}'`, 'debug');
                    sendChat("API", finalCmd);
                }
                if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ✅ Triggered on ${matchedTokens.length} token(s) for "{${tagToFind}}" within ${radiusFt}ft.`);
            }

            function doActionWithNotes(token, gmText) {
                const lines = gmText.split(/\n|<br\s*\/?>/i);
                let macroOverrideFound = false;
                let macroNameToRun = null;
                let totalDelay = 0;

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    const macroOverrideMatch = trimmedLine.match(/Macro:\s*\[([^\]]+)\]/i);
                    if (macroOverrideMatch && macroOverrideMatch[1]) {
                        macroNameToRun = macroOverrideMatch[1];
                        macroOverrideFound = true;
                        
                        const simpleDelay = TokenFX.utils.parseDelay(trimmedLine);
                        const delayMatch = trimmedLine.match(/^!delay\s+\[?(\d+)\]?\s+\{([\s\S]+)\}$/i);
                        if (delayMatch) {
                            totalDelay += parseInt(delayMatch[1], 10) * 1000;
                        } else {
                             totalDelay += simpleDelay;
                        }
                        break; 
                    }
                }
                
                if (macroOverrideFound) {
                    TokenFX.utils.log(`Macro override found for token ${token.id}: '${macroNameToRun}'. Executing.`, 'info');
                    const execute = () => TokenFX.utils.executeMacroByName(macroNameToRun, token.id);
                    if (totalDelay > 0) {
                        setTimeout(execute, totalDelay);
                    } else {
                        execute();
                    }
                } else {
                    TokenFX.utils.log(`No macro override found for token ${token.id}. Running default action.`, 'info');
                    let cmd = actionMacro
                        .replace(/@TOKENID@/g, token.id)
                        .replace(/@{selected\|token_id}/g, token.id)
                        .replace(/@{target\|token_id}/g, token.id);
                    sendChat("API", cmd);
                }
                
                runChainReaction(token, gmText);
            }

            function runChainReaction(token, gmText) {
                let chainRe = /chain\s*:\s*([\w\-]+)(?:\s*\[(\d+)\])?(?:\s*\[(\d+)ft\])?/i;
                let cMatch = gmText.match(chainRe);
                
                if(cMatch && cMatch[1]) {
                    let chainTag = cMatch[1].toLowerCase();
                    let maxTriggers = cMatch[2] ? parseInt(cMatch[2]) : 1;
                    let chainRadius = cMatch[3] ? parseInt(cMatch[3]) : radiusFt;

                    TokenFX.state.chainReaction.tokenTriggerCounts[token.id] = TokenFX.state.chainReaction.tokenTriggerCounts[token.id] || 0;
                    
                    if(TokenFX.state.chainReaction.tokenTriggerCounts[token.id] >= maxTriggers) {
                        TokenFX.utils.log(`Token "${token.get("name") || token.id}" (ID: ${token.id}) reached chain trigger limit (${maxTriggers}) for tag '${chainTag}'.`, 'info');
                        return;
                    }
                    
                    TokenFX.state.chainReaction.tokenTriggerCounts[token.id]++;

                    if(TokenFX.state.chainResetTimeout) clearTimeout(TokenFX.state.chainResetTimeout);
                    
                    TokenFX.state.chainResetTimeout = setTimeout(() => {
                        if (TokenFX.state.chainReaction.chainStartTime) {
                            let timeSinceStart = (Date.now() - TokenFX.state.chainReaction.chainStartTime) / 1000;
                            TokenFX.utils.log(`Chain reaction sequence auto-ended after ${timeSinceStart.toFixed(1)}s. Final counts: ${JSON.stringify(TokenFX.state.chainReaction.tokenTriggerCounts)}`, 'info');
                            TokenFX.state.chainReaction.tokenTriggerCounts = {};
                            TokenFX.state.chainReaction.chainStartTime = null;
                            TokenFX.state.chainResetTimeout = null;
                        }
                    }, TokenFX.config.CHAIN_TIMEOUT_SECONDS * 1000);

                    let chainDelay = 500 + Math.floor(Math.random() * 500);
                    TokenFX.utils.log(`Token "${token.get("name") || token.id}" (ID: ${token.id}) starting chain:\n- New Tag: ${chainTag}\n- Triggers used: ${TokenFX.state.chainReaction.tokenTriggerCounts[token.id]}/${maxTriggers}\n- Radius: ${chainRadius}ft\n- Delay: ${chainDelay}ms`, 'info');
                    
                    let encodedMacroForChain = encodeURIComponent(actionMacro);
                    setTimeout(() => {
                        let cmd = `!triggerByTagChain ${chainTag} ${chainRadius} ${encodedMacroForChain} ${token.get("left")} ${token.get("top")} ${pageID}`;
                        sendChat("API", cmd);
                    }, chainDelay);
                }
            }
        }
    },

    // Delay Management (Copied from original)
    delay: {
        processDelay(msg) {
            // !Delay uses capital D, ensure command check is case-sensitive or adjust
            if(msg.content.indexOf("!Delay") !== 0 && msg.content.indexOf("!delay") !== 0) return; 
            
            let pattern = /^!Delay\s+\[?(\d+)\]?\s+\{([\s\S]+)\}$/i; // Handles seconds with or without brackets
            let match = msg.content.match(pattern);
            
            if(!match) {
                sendChat("TokenFX", "/w gm ❌ Usage: !Delay [seconds] {command/message}");
                return;
            }
            
            let seconds = parseInt(match[1], 10);
            let command = match[2].trim();
            
            if (TokenFX.config.INFO_MESSAGES_ENABLED) sendChat("TokenFX", `/w gm ⏳ Delaying command by ${seconds} seconds: {${command}}`);
            TokenFX.utils.log(`Delaying command '${command}' by ${seconds}s.`, 'info');
            
            setTimeout(function(){
                TokenFX.utils.log(`Executing delayed command: ${command}`, 'info');
                sendChat("TokenFX", command); // Originating from TokenFX for clarity
            }, seconds * 1000);
        }
    }
};

// Initialize on ready
on("ready", function() {
    TokenFX.utils.log("TokenFX System Refactored Initializing...", 'info');
    if (typeof CommandMenu !== 'undefined' && CommandMenu.utils && CommandMenu.utils.addInitStatus) {
        CommandMenu.utils.addInitStatus('TokenFX', 'success', null, 'success');
    }
    
    // Dynamically load custom FX definitions (name -> ID and ID -> name for warnings)
    TokenFX.config.customFxDefinitions = {}; // Reset for fresh load
    TokenFX.config.originalCustomFxNames = {}; // Reset for fresh load
    let infiniteEmitterFxNames = [];

    try {
        const custFxObjects = findObjs({ _type: "custfx" });
        let loadedCount = 0;
        let duplicateNames = {};
        
        custFxObjects.forEach(fx => {
            const name = fx.get("name");
            const id = fx.get("_id");
            // const definitionStr = fx.get('definition'); // Get the definition string

            // Log the name, ID, and the raw definition string
            // TokenFX.utils.log(`Loading Custom FX: Name='${name}', ID='${id}', Raw Definition='${definitionStr}'`, 'info'); 
            // Reverted to simpler/less verbose logging for startup, or remove if not needed for general startup.
            TokenFX.utils.log(`Loading Custom FX: Name='${name}', ID='${id}'`, 'debug'); 

            const lowercaseName = name.toLowerCase();

            TokenFX.config.originalCustomFxNames[id] = name; // Store original name by ID for warnings

            if (TokenFX.config.customFxDefinitions[lowercaseName]) {
                // Name collision (after converting to lowercase)
                if (!duplicateNames[lowercaseName]) {
                    duplicateNames[lowercaseName] = [TokenFX.config.customFxDefinitions[lowercaseName]]; // Store the first ID
                }
                duplicateNames[lowercaseName].push(id); // Add the new conflicting ID
                TokenFX.utils.log(`Custom FX name collision (case-insensitive): '${name}' (ID: ${id}) conflicts with existing entry for '${lowercaseName}'. The first one loaded will be used.`, 'warning');
            } else {
                TokenFX.config.customFxDefinitions[lowercaseName] = id;
                loadedCount++;
            }
            
            // Estimate duration for startup warning about infinite emitters
            const estimation = TokenFX.utils.estimateCustomFxDuration(id);
            if (estimation.isInfiniteEmitter) {
                infiniteEmitterFxNames.push(name); // Use original name for user-facing warning
            }
        });

        if (loadedCount > 0) {
            TokenFX.utils.log(`Dynamically loaded ${loadedCount} unique custom FX definitions.`, 'success');
        }
        Object.keys(duplicateNames).forEach(name => {
            const usedId = TokenFX.config.customFxDefinitions[name];
            const allIds = duplicateNames[name].map(id => id === usedId ? `${id} (in use)` : id).join('<br>');
            const warningMenu = `&{template:default} {{name=⚠️ Custom FX Name Collision}}` +
                `{{FX Name=${name}}}` +
                `{{IDs=${allIds}<br>}}` +
                `{{Note=Please ensure unique names (case-insensitive) for predictable behavior.}}`;
            TokenFX.utils.log(`WARNING: Custom FX name collision for '${name}'. IDs: ${duplicateNames[name].join(', ')}. Using: ${usedId}`, 'warning');
            sendChat("TokenFX", `/w gm ${warningMenu}`);
        });

        if (Object.keys(TokenFX.config.customFxDefinitions).length === 0) {
            TokenFX.utils.log("No custom FX definitions found or loaded. Custom FX by name will not be available.", "warning");
        }
        
        if (infiniteEmitterFxNames.length > 0) {
            TokenFX.utils.log(`INFO: The following custom FX appear to have infinite emitters (e.g., duration: -1 from their definition): ${infiniteEmitterFxNames.join(", ")}. ` +
                              `For these, TR[1] is usually sufficient in commands. Consider adding their lowercase names to 'disallowedLoopingFx' in the script config if you never want the script to attempt to re-trigger them.`, 'info');
        }

    } catch (e) {
        TokenFX.utils.log("Error dynamically loading custom FX definitions: " + e.message, "error");
    }

    TokenFX.utils.log("✅ TokenFX System Refactored Ready!", 'success');
});

// Handle chat messages
on("chat:message", function(msg) {
    if (msg.type !== "api") return;
    
    let args = msg.content.split(" ");
    let command = args[0];

    // Pre-process msg.content for @TOKENID@, but NOT for commands that handle it internally.
    const commandsToIgnore = ['!triggerbytag', '!delay'];
    if (!commandsToIgnore.includes(command.toLowerCase()) && msg.content.includes("@TOKENID@")) {
        if (msg.selected && msg.selected.length > 0) {
            const selectedId = msg.selected[0]._id;
            msg.content = msg.content.replace(/@TOKENID@/g, selectedId);
            TokenFX.utils.log(`Replaced @TOKENID@ with selected token ID: ${selectedId}`, 'debug');

            // Update args and command after modification
            args = msg.content.split(" ");
            command = args[0];
        } else {
            // If @TOKENID@ is used but nothing is selected, stop and warn the user.
            sendChat("TokenFX", "/w gm ⚠️ A command using `@TOKENID@` was run, but no token was selected.");
            TokenFX.utils.log("Command with @TOKENID@ received, but no token was selected. Aborting.", 'warning');
            return;
        }
    }

    // FX Commands
    if (command === "!listStandardFx") {
        TokenFX.fx.listStandardFx();
    }
    else if (command === "!listCustomFx") {
        TokenFX.fx.listCustomFx();
    }
    else if (command === "!spawnComplexFx") { // New combined command
        TokenFX.fx.spawnComplexFx(args);
    }
    else if (command === "!stopFxLoop") { // Command to stop a specific FX loop
        if (args.length > 1) {
            TokenFX.fx.stopFxLoop(args[1]); // Pass the loopID
        } else {
            sendChat("TokenFX", "/w gm Usage: !stopFxLoop [LoopID]");
        }
    }
    else if (command === "!stopFxLoops") { // New command to stop multiple loops
        if (args.length > 1) {
            const loopIDs = args[1].split(',');
            loopIDs.forEach(id => TokenFX.utils.stopFxLoop(id.trim()));
        } else {
            sendChat("TokenFX", "/w gm Usage: !stopFxLoops [LoopID1,LoopID2,...]");
        }
    }
    else if (command === "!stopAllFx" || command === "!stopMultiTokenFx") { // Keep old stop command for compatibility during transition
        TokenFX.fx.stopAllFx();
    }
    // Area Trigger Commands (ensure these are distinct from general FX commands)
    else if (command === "!triggerByTag") { // Explicitly make it 'else if'
        TokenFX.trigger.triggerByTag(args, msg);
    }
    else if (command === "!triggerByTagChain") {
        TokenFX.trigger.triggerByTagChain(args);
    }
    else if (command === "!stopChains") {
        TokenFX.trigger.stopChains();
    }
    // Delay Command
    else if (command.toLowerCase() === "!delay") { // Allow !delay
        TokenFX.delay.processDelay(msg);
    }
    // Utility Command
    else if (command === "!getSelectedIDs") {
        if (!msg.selected || msg.selected.length === 0) {
            sendChat("TokenFX", `&{template:default} {{name=Selected Token IDs}} {{Note=❌ Please select at least 1 token!}}`);
            return;
        }
        let tokenIDs = msg.selected.map(sel => `• ${sel._id}`).join('<br>');
        const menu = `&{template:default} {{name=Selected Token IDs}} {{IDs=${tokenIDs}}}`;
        sendChat("TokenFX", `/w gm ${menu}`);
    }
    // New command to show the active FX dashboard
    else if (command.toLowerCase() === "!fx-list") {
        TokenFX.utils.buildAndSendConsolidatedMenu(true); // Pass true for manual request
    }
    // New diagnostic command to find tokens with a specific tag
    else if (command === "!fx-find-tag") {
        if (!(msg && msg.who && msg.who.endsWith('(GM)'))) {
            sendChat("TokenFX", "/w gm ❌ You are not authorized to use this command.");
            return;
        }
        if (args.length < 2) {
            sendChat("TokenFX", "/w gm Usage: !fx-find-tag [tag]");
            return;
        }
        const tagToFind = args[1].toLowerCase();
        const playerPageId = getObj('player', msg.playerid).get('_lastpage');

        if (!playerPageId) {
            sendChat("TokenFX", "/w gm Could not determine your current page. Please ensure you are on a page.");
            return;
        }

        const allTokensOnPage = findObjs({ _type: 'graphic', _pageid: playerPageId });
        let report = `&{template:default} {{name=🔍 Tag Report: {${tagToFind}}}}`;
        let foundCount = 0;

        const notePromises = allTokensOnPage.map(token => {
            return new Promise((resolve) => {
                const charID = token.get("represents");
                if (charID) {
                    const char = getObj("character", charID);
                    if (char) {
                        char.get("gmnotes", gm => resolve({ token: token, notes: gm || "" }));
                    } else {
                        resolve({ token: token, notes: token.get("gmnotes") || "" });
                    }
                } else {
                    resolve({ token: token, notes: token.get("gmnotes") || "" });
                }
            });
        });

        Promise.all(notePromises)
            .then(results => {
                results.forEach(res => {
                    const cleanedNotes = TokenFX.utils.decodeAndStrip(res.notes);
                    if (TokenFX.utils.hasTag(cleanedNotes, tagToFind)) {
                        foundCount++;
                        const token = res.token;
                        report += `{{Token ${foundCount}=**${token.get('name') || 'Unnamed'}**<br>ID: \`${token.id}\`<br>Layer: \`${token.get('layer')}\`}}`;
                        
                        // --- Temporary Aura Ping ---
                        const originalAura = {
                            radius: token.get('aura1_radius'),
                            color: token.get('aura1_color'),
                            square: token.get('aura1_square'),
                            show: token.get('showplayers_aura1')
                        };
                        const originalLayer = token.get('layer');

                        token.set({
                            layer: 'objects', // Move to token layer for visibility
                            aura1_radius: 0.7,
                            aura1_color: '#FF00FF', // Bright magenta for high visibility
                            aura1_square: true,
                            showplayers_aura1: false
                        });

                        setTimeout(() => {
                            const currentToken = getObj('graphic', token.id);
                            if (currentToken) {
                                currentToken.set({
                                    aura1_radius: originalAura.radius,
                                    aura1_color: originalAura.color,
                                    aura1_square: originalAura.square,
                                    showplayers_aura1: originalAura.show,
                                    layer: originalLayer // Restore original layer
                                });
                            }
                        }, 3000); // Aura lasts for 3 seconds
                    }
                });

                if (foundCount === 0) {
                    report += `{{Result=No tokens with the tag {${tagToFind}} were found on your current page.}}`;
                }
                
                sendChat("TokenFX", `/w gm ${report}`);
            });
    }
    // Help Command
    else if (command.toLowerCase() === "!tokenfx" && args.length > 1 && args[1].toLowerCase() === "help") {
        TokenFX.fx.showHelpMenu();
    }
    // Simple !tokenfx command could also show help or a basic menu
    else if (command.toLowerCase() === "!tokenfx" && args.length === 1) {
         TokenFX.fx.showHelpMenu(); // Default to help if just !tokenfx is typed
    }
});