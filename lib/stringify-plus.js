/**
 * Enhanced JSON stringifier with support for special values, circular references, and custom options.
 * Uses a defaults pattern for options: defaults are defined and merged with incoming options, with options taking precedence.
 * Handles functions, symbols, BigInts, Dates, and Eleventy-specific quirks.
 *
 * @module stringify-plus
 * @param {any} data - The data to stringify
 * @param {Object} [options] - Optional configuration options
 * @param {number} [options.maxCircularDepth=1] - Maximum depth for circular references
 * @param {Array} [options.removeKeys=[]] - Array of keys to remove/replace (strings or {keyName, replaceString} objects)
 * @param {boolean} [options.showTemplate=false] - If true, shows 'template' keys; if false, replaces them with performance message
 * @returns {Promise<string>} The compact stringified data
 */
export async function stringifyPlus(data, options = {}) {
    // Define default options
    const defaults = {
        maxCircularDepth: 1,
        removeKeys: [], // Array of { keyName, replaceString }
        showTemplate: false // Special option to show template keys
    };
    // Merge defaults with incoming options (options take precedence)
    options = Object.assign({}, defaults, options);

    // Helper to find a replacement string for a key, if any
    function getReplacementForKey(key) {
        // Special case: if key is 'template' and showTemplate is true, never replace it
        if (key === 'template' && options.showTemplate) {
            return null;
        }
        
        // Check if there's a specific removeKeys entry for this key
        if (Array.isArray(options.removeKeys)) {
            // First check for object entries (they take precedence)
            for (const entry of options.removeKeys) {
                if (typeof entry === 'object' && entry !== null) {
                    // Handle both formats: {keyName, replaceString} and {key: value}
                    if (entry.keyName === key || entry[key] !== undefined) {
                        return entry.replaceString || entry[key];
                    }
                }
            }
            // Then check for string entries
            for (const entry of options.removeKeys) {
                if (typeof entry === 'string' && entry === key) {
                    // Special case: template key gets default template replacement message
                    if (key === 'template') {
                        return 'Removed for performance reasons. Use { showTemplate: true } to show it';
                    }
                    return 'Replaced as key was in supplied removeKeys';
                }
            }
        }
        
        // Special case: if key is 'template' and showTemplate is false, replace with default message
        if (key === 'template' && !options.showTemplate) {
            return 'Removed for performance reasons. Use { showTemplate: true } to show it';
        }
        
        return null;
    }

    // Tracks the first path where each object is seen (for circular reference reporting)
    const seen = new WeakMap();
    // Tracks how many times each object has been stringified in a circular context
    const circularDepths = new WeakMap();

    /**
     * Helper to stringify a value, handling all special cases and recursion.
     * @param {any} value - The value to stringify
     * @param {string} path - The current path in the object tree
     * @param {boolean} parentIsRoot - True if the parent is the root object
     * @param {boolean} inArray - True if the value is inside an array
     * @param {Set<object>} ancestors - Set of ancestor objects for circular detection
     * @param {string|null} parentKey - The key of the parent property
     * @returns {string} - The stringified value
     */
    function stringifyPlusInner(value, path = 'root', parentIsRoot = true, inArray = false, ancestors = new Set(), parentKey = null) {
        // Remove/replace keys if requested
        if (parentKey) {
            const replacement = getReplacementForKey(parentKey);
            if (replacement !== null) {
                return JSON.stringify(replacement);
            }
        }
        // If the root object itself is a single key that matches a replacement
        if (parentIsRoot && typeof value === 'object' && value !== null && Object.keys(value).length === 1) {
            const onlyKey = Object.keys(value)[0];
            const replacement = getReplacementForKey(onlyKey);
            if (replacement !== null) {
                return `{${JSON.stringify(onlyKey)}:${JSON.stringify(replacement)}}`;
            }
        }

        // Handle special primitive values
        if (value === undefined) return '"[ undefined ]"';
        if (value === null) return 'null';
        if (typeof value === 'function') {
            // Name functions if possible
            const name = value.name && value.name !== 'anonymousFunction' ? value.name : 'anonymous';
            return `"[function ${name}]"`;
        }
        if (typeof value === 'symbol') {
            return `"[Symbol ${value.description || ''}]"`;
        }
        if (typeof value === 'bigint') {
            return `"${value.toString()}"`;
        }
        if (value instanceof Date) {
            return JSON.stringify(value);
        }

        // Handle objects and arrays
        if (typeof value === 'object') {
            // Detect circular references
            if (ancestors.has(value)) {
                // Count how many times we've seen this object in a circular context
                const count = circularDepths.get(value) || 0;
                if (count < options.maxCircularDepth) {
                    circularDepths.set(value, count + 1);
                    // Recursively output the object/array again
                    return Array.isArray(value)
                        ? stringifyArray(value, path, ancestors)
                        : stringifyObject(value, path, ancestors);
                } else {
                    // Output the path where the reference originated (first seen)
                    return `"[Circular Ref: ${seen.get(value) || path}]"`;
                }
            }
            // Not a circular reference, track first seen path
            if (!seen.has(value)) seen.set(value, path);
            // Eleventy-specific: set needsCheck to false if present
            if (Object.prototype.hasOwnProperty.call(value, 'needsCheck')) {
                value.needsCheck = false;
            }
            // Handle arrays and objects
            return Array.isArray(value)
                ? stringifyArray(value, path, ancestors)
                : stringifyObject(value, path, ancestors);
        }

        // Handle primitive values
        if (typeof value === 'number') {
            // JSON.stringify outputs null for non-finite numbers
            return Number.isFinite(value) ? value.toString() : 'null';
        }
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'boolean') return value.toString();

        // Fallback for unknown types
        return `"[${typeof value} ${value?.constructor?.name || ''}]"`;
    }

    /**
     * Helper to stringify arrays, handling circular references and special values.
     * @param {Array} arr - The array to stringify
     * @param {string} path - The current path in the object tree
     * @param {Set<object>} ancestors - Set of ancestor objects for circular detection
     * @returns {string}
     */
    function stringifyArray(arr, path, ancestors) {
        const nextAncestors = new Set([...ancestors, arr]);
        const elements = arr.map((item, index) =>
            stringifyPlusInner(item, `${path}[${index}]`, false, true, nextAncestors, null)
        );
        return `[${elements.join(',')}]`;
    }

    /**
     * Helper to stringify objects, handling circular references and special values.
     * @param {Object} obj - The object to stringify
     * @param {string} path - The current path in the object tree
     * @param {Set<object>} ancestors - Set of ancestor objects for circular detection
     * @returns {string}
     */
    function stringifyObject(obj, path, ancestors) {
        const nextAncestors = new Set([...ancestors, obj]);
        const keys = Object.keys(obj);
        const pairs = keys.map(key => {
            // Remove/replace keys if requested
            const replacement = getReplacementForKey(key);
            if (replacement !== null) {
                return `${JSON.stringify(key)}:${JSON.stringify(replacement)}`;
            }
            let val = obj[key];
            // Handle special values for object properties
            if (val === undefined) {
                return `${JSON.stringify(key)}:"[ undefined ]"`;
            }
            if (val === null) {
                return `${JSON.stringify(key)}:null`;
            }
            if (typeof val === 'function') {
                const name = val.name && val.name !== 'anonymousFunction' ? val.name : 'anonymous';
                return `${JSON.stringify(key)}:"[function ${name}]"`;
            }
            if (typeof val === 'symbol') {
                return `${JSON.stringify(key)}:"[Symbol ${val.description || ''}]"`;
            }
            if (typeof val === 'bigint') {
                return `${JSON.stringify(key)}:"${val.toString()}"`;
            }
            // Recursively stringify property
            return `${JSON.stringify(key)}:${stringifyPlusInner(val, `${path}.${key}`, false, false, nextAncestors, key)}`;
        });
        return `{${pairs.join(',')}}`;
    }

    // Start the stringification process
    return stringifyPlusInner(data);
} 