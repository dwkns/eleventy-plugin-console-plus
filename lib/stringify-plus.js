/**
 * Default options for stringifyPlus
 * @property {number} maxCircularDepth - Maximum depth for circular references
 * @property {Array} removeKeys - Keys to remove/replace (strings or {keyName, replaceString} objects)
 * @property {boolean} showTemplate - If true, shows 'template' keys; if false, replaces them with a message
 */
export const STRINGIFY_PLUS_DEFAULTS = {
  maxCircularDepth: 1,
  removeKeys: [],
  showTemplate: false
};

/**
 * Enhanced JSON stringifier with support for special values, circular references, and custom options.
 * Handles functions, symbols, BigInts, Dates, and Eleventy-specific quirks.
 *
 * @param {any} data - The data to stringify
 * @param {Object} [options] - Optional configuration options
 * @returns {Promise<string>} The compact stringified data
 */
export async function stringifyPlus(data, options = {}) {
  options = Object.assign({}, STRINGIFY_PLUS_DEFAULTS, options);

  function getReplacementForKey(key) {
    if (key === 'template' && options.showTemplate) return null;
    if (Array.isArray(options.removeKeys)) {
      for (const entry of options.removeKeys) {
        if (typeof entry === 'object' && entry !== null) {
          if (entry.keyName === key || entry[key] !== undefined) {
            return entry.replaceString || entry[key];
          }
        }
      }
      for (const entry of options.removeKeys) {
        if (typeof entry === 'string' && entry === key) {
          if (key === 'template') {
            return 'Removed for performance reasons. Use { showTemplate: true } to show it';
          }
          return 'Replaced as key was in supplied removeKeys';
        }
      }
    }
    if (key === 'template' && !options.showTemplate) {
      return 'Removed for performance reasons. Use { showTemplate: true } to show it';
    }
    return null;
  }

  const seen = new WeakMap();
  const circularDepths = new WeakMap();

  function stringifyPlusInner(value, path = 'root', parentIsRoot = true, inArray = false, ancestors = new Set(), parentKey = null) {
    if (parentKey) {
      const replacement = getReplacementForKey(parentKey);
      if (replacement !== null) return JSON.stringify(replacement);
    }
    if (parentIsRoot && typeof value === 'object' && value !== null && Object.keys(value).length === 1) {
      const onlyKey = Object.keys(value)[0];
      const replacement = getReplacementForKey(onlyKey);
      if (replacement !== null) {
        return `{${JSON.stringify(onlyKey)}:${JSON.stringify(replacement)}}`;
      }
    }
    if (value === undefined) return '"[ undefined ]"';
    if (value === null) return 'null';
    if (typeof value === 'function') {
      const name = value.name && value.name !== 'anonymousFunction' ? value.name : 'anonymous';
      return `"[function ${name}]"`;
    }
    if (typeof value === 'symbol') return `"[Symbol ${value.description || ''}]"`;
    if (typeof value === 'bigint') return `"${value.toString()}"`;
    if (value instanceof Date) return JSON.stringify(value);
    if (typeof value === 'object') {
      if (ancestors.has(value)) {
        const count = circularDepths.get(value) || 0;
        if (count < options.maxCircularDepth) {
          circularDepths.set(value, count + 1);
          return Array.isArray(value)
            ? stringifyArray(value, path, ancestors)
            : stringifyObject(value, path, ancestors);
        } else {
          return `"[Circular Ref: ${seen.get(value) || path}]"`;
        }
      }
      if (!seen.has(value)) seen.set(value, path);
      if (Object.prototype.hasOwnProperty.call(value, 'needsCheck')) {
        value.needsCheck = false;
      }
      return Array.isArray(value)
        ? stringifyArray(value, path, ancestors)
        : stringifyObject(value, path, ancestors);
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'boolean') return value.toString();
    return `"[${typeof value} ${value?.constructor?.name || ''}]"`;
  }

  function stringifyArray(arr, path, ancestors) {
    const nextAncestors = new Set([...ancestors, arr]);
    const elements = arr.map((item, index) =>
      stringifyPlusInner(item, `${path}[${index}]`, false, true, nextAncestors, null)
    );
    return `[${elements.join(',')}]`;
  }

  function stringifyObject(obj, path, ancestors) {
    const nextAncestors = new Set([...ancestors, obj]);
    const keys = Object.keys(obj);
    const pairs = keys.map(key => {
      const replacement = getReplacementForKey(key);
      if (replacement !== null) return `${JSON.stringify(key)}:${JSON.stringify(replacement)}`;
      let val = obj[key];
      if (val === undefined) return `${JSON.stringify(key)}:"[ undefined ]"`;
      if (val === null) return `${JSON.stringify(key)}:null`;
      if (typeof val === 'function') {
        const name = val.name && val.name !== 'anonymousFunction' ? val.name : 'anonymous';
        return `${JSON.stringify(key)}:"[function ${name}]"`;
      }
      if (typeof val === 'symbol') return `${JSON.stringify(key)}:"[Symbol ${val.description || ''}]"`;
      if (typeof val === 'bigint') return `${JSON.stringify(key)}:"${val.toString()}"`;
      return `${JSON.stringify(key)}:${stringifyPlusInner(val, `${path}.${key}`, false, false, nextAncestors, key)}`;
    });
    return `{${pairs.join(',')}}`;
  }

  return stringifyPlusInner(data);
} 