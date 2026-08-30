let SPresetSettings = {
  RegexBinding: {},
  ChatSquash: {
    enabled: false,
    conditional_enabled: false,
    conditional_tag: '',
    separate_chat_history: false,
    parse_clewd: true,
    user_role_system: false,
    role: 'assistant',
    enable_stop_string: false,
    stop_string: 'User:',
    user_prefix: '\n\nUser:',
    user_suffix: '',
    char_prefix: '\n\nAssistant:',
    char_suffix: '',
    prefix_system: '',
    suffix_system: '',
    enable_squashed_separator: false,
    squashed_separator_regex: false,
    squashed_separator_string: '',
    squashed_post_script_enable: false,
    squashed_post_script: '',
    re_split: false,
  },
  MacroNest: false,
  ToolBindings: {},
  MessageInjections: {},
  OutputPreprocessing: {
    enabled: false,
    script: '',
    consumeToolCalls: false,
  },
  FixedPresetName: '',
};

window.SPresetTempData = {};

// Tool binding management state
const spresetRegisteredTools = new Map(); // toolId -> uuid
const SPRESET_EMPTY_MESSAGE_PLACEHOLDER = '\u200b';

window.versionNumber = 10000;

let oldST = false;

let SGlobalSettings = {
  RegexBinding: {},
};

const ctx = SillyTavern.getContext();

for (const prompt of ctx.chatCompletionSettings.prompts) {
  if (prompt.role === 'model') {
    prompt.role = 'assistant';
  }
}

const settingsDom = $(`
  <div id="s_preset_settings">
  </div>
`);

let loadSettingsToChatSquashForm = null;
let loadSettingsToMacroNestForm = null;
let syncLegacySPresetRegexesToCurrentST = null;
const spresetImportRenameMarker = Symbol('SPresetImportRename');
let pendingSPresetImportRename = null;
let spresetImportRenameRunning = false;

(() => {
  const _originalObjectValues = Object.values;
  window.__regexScriptOrder = [2, 0, 1]; // preset(2) -> global(0) -> character(1)

  Object.values = function (target) {
    const stack = new Error().stack;

    const result = _originalObjectValues.call(Object, target);

    const regexForRegex = /regex\/[^/]+\.js/;
    if (regexForRegex.test(stack) && stack.includes('getRegexScripts')) {
      if (result.length === 3 && [0, 1, 2].every(v => result.includes(v))) {
        return [...window.__regexScriptOrder];
      }
    }

    return result;
  };
})();

function injectScriptRaw(id, content) {
  const script = document.createElement('script');
  script.id = id;
  script.type = 'module';
  script.textContent = content;
  document.body.appendChild(script);
}

function importFromModule(container, imports) {
  let injectContent = ``;
  for (const importItem of imports) {
    injectContent += `import { ${importItem.items.join(', ')} } from "${importItem.from}.js";\n`;
  }
  injectContent += `\nconst ${container} = {};`;
  for (const importItem of imports) {
    for (const item of importItem.items) {
      // Keep module exports live. This matters for mutable exports such as
      // script.js' streamingProcessor, which is replaced for every generation.
      injectContent += `\nObject.defineProperty(${container}, '${item}', { enumerable: true, get: () => ${item} });`;
    }
  }
  injectContent += `\n`;
  injectContent += `\nwindow.${container} = ${container};\n`;
  injectContent += `
  const data = {
    'id': '${container}',
    'imports': ${container},
  }
  `;
  injectContent += `ctx.eventSource.emit('module_imported', data);\n`;

  injectScriptRaw(container + '_imports', injectContent);
}

function persistSPresetSettings() {
  if (!ctx.chatCompletionSettings.extensions) {
    ctx.chatCompletionSettings.extensions = {};
  }
  ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
  const serialized = JSON.stringify(SPresetSettings);
  if (getPrompt('SPresetSettings')) {
    setPrompt('SPresetSettings', serialized);
  } else {
    addPrompt('SPresetSettings', 'SPreset配置', serialized);
  }
  ctx.saveSettingsDebounced();
}

function cloneSPresetData(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

const SPRESET_CHAT_SQUASH_DEFAULT = Object.freeze({
  enabled: false,
  conditional_enabled: false,
  conditional_tag: '',
  separate_chat_history: false,
  parse_clewd: true,
  user_role_system: false,
  role: 'assistant',
  enable_stop_string: false,
  stop_string: 'User:',
  user_prefix: '\n\nUser:',
  user_suffix: '',
  char_prefix: '\n\nAssistant:',
  char_suffix: '',
  prefix_system: '',
  suffix_system: '',
  enable_squashed_separator: false,
  squashed_separator_regex: false,
  squashed_separator_string: '',
  squashed_post_script_enable: false,
  squashed_post_script: '',
  re_split: false,
});

const SPRESET_REGEX_BINDING_DEFAULT = Object.freeze({
  regexes: Object.freeze([]),
});

const SPRESET_OUTPUT_PREPROCESSING_DEFAULT = Object.freeze({
  enabled: false,
  script: '',
  consumeToolCalls: false,
});

const SPRESET_FIXED_PRESET_NAME_DEFAULT = '';

function isSPresetPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSPresetChatSquash(value, fallback = SPRESET_CHAT_SQUASH_DEFAULT) {
  const fallbackSource = isSPresetPlainObject(fallback) ? fallback : SPRESET_CHAT_SQUASH_DEFAULT;
  const source = isSPresetPlainObject(value) ? value : {};
  const merged = { ...cloneSPresetData(fallbackSource), ...cloneSPresetData(source) };
  const readBoolean = key => merged[key] === undefined
    ? SPRESET_CHAT_SQUASH_DEFAULT[key]
    : Boolean(merged[key]);
  const readString = key => merged[key] == null
    ? SPRESET_CHAT_SQUASH_DEFAULT[key]
    : String(merged[key]);
  const role = ['system', 'user', 'assistant', 'follow'].includes(String(merged.role))
    ? String(merged.role)
    : SPRESET_CHAT_SQUASH_DEFAULT.role;

  return {
    ...merged,
    enabled: readBoolean('enabled'),
    conditional_enabled: readBoolean('conditional_enabled'),
    conditional_tag: readString('conditional_tag'),
    separate_chat_history: readBoolean('separate_chat_history'),
    parse_clewd: readBoolean('parse_clewd'),
    user_role_system: readBoolean('user_role_system'),
    role,
    enable_stop_string: readBoolean('enable_stop_string'),
    stop_string: readString('stop_string'),
    user_prefix: readString('user_prefix'),
    user_suffix: readString('user_suffix'),
    char_prefix: readString('char_prefix'),
    char_suffix: readString('char_suffix'),
    prefix_system: readString('prefix_system'),
    suffix_system: readString('suffix_system'),
    enable_squashed_separator: readBoolean('enable_squashed_separator'),
    squashed_separator_regex: readBoolean('squashed_separator_regex'),
    squashed_separator_string: readString('squashed_separator_string'),
    squashed_post_script_enable: readBoolean('squashed_post_script_enable'),
    squashed_post_script: readString('squashed_post_script'),
    re_split: readBoolean('re_split'),
  };
}

function normalizeSPresetRegexBinding(value, fallback = SPRESET_REGEX_BINDING_DEFAULT) {
  const fallbackSource = isSPresetPlainObject(fallback) ? fallback : SPRESET_REGEX_BINDING_DEFAULT;
  const source = isSPresetPlainObject(value) ? value : {};
  const merged = { ...cloneSPresetData(fallbackSource), ...cloneSPresetData(source) };
  return {
    ...merged,
    regexes: Array.isArray(merged.regexes) ? cloneSPresetData(merged.regexes) : [],
  };
}

function normalizeSPresetMacroNest(value, fallback = false) {
  return value === undefined ? Boolean(fallback) : Boolean(value);
}

function normalizeSPresetOutputPreprocessing(value, fallback = SPRESET_OUTPUT_PREPROCESSING_DEFAULT) {
  const fallbackSource = isSPresetPlainObject(fallback) ? fallback : SPRESET_OUTPUT_PREPROCESSING_DEFAULT;
  const source = isSPresetPlainObject(value) ? value : {};
  const merged = { ...cloneSPresetData(fallbackSource), ...cloneSPresetData(source) };
  return {
    ...merged,
    enabled: merged.enabled === undefined ? SPRESET_OUTPUT_PREPROCESSING_DEFAULT.enabled : Boolean(merged.enabled),
    script: merged.script == null ? SPRESET_OUTPUT_PREPROCESSING_DEFAULT.script : String(merged.script),
    consumeToolCalls: merged.consumeToolCalls === undefined
      ? SPRESET_OUTPUT_PREPROCESSING_DEFAULT.consumeToolCalls
      : Boolean(merged.consumeToolCalls),
  };
}

function normalizeSPresetFixedPresetName(value, fallback = SPRESET_FIXED_PRESET_NAME_DEFAULT) {
  return value === undefined || value === null ? String(fallback || '') : String(value).trim();
}

function normalizeSPresetSettings(value) {
  const source = isSPresetPlainObject(value) ? value : {};
  return {
    ...cloneSPresetData(source),
    RegexBinding: normalizeSPresetRegexBinding(source.RegexBinding),
    ChatSquash: normalizeSPresetChatSquash(source.ChatSquash),
    MacroNest: normalizeSPresetMacroNest(source.MacroNest),
    ToolBindings: isSPresetPlainObject(source.ToolBindings) ? cloneSPresetData(source.ToolBindings) : {},
    MessageInjections: isSPresetPlainObject(source.MessageInjections) ? cloneSPresetData(source.MessageInjections) : {},
    OutputPreprocessing: normalizeSPresetOutputPreprocessing(source.OutputPreprocessing),
    FixedPresetName: normalizeSPresetFixedPresetName(source.FixedPresetName),
  };
}

function getSPresetFeatures() {
  let regexBinding = normalizeSPresetRegexBinding(SPresetSettings.RegexBinding);
  const nativeRegexes = ctx.chatCompletionSettings?.extensions?.regex_scripts;
  if (versionNumber >= 11305 && Array.isArray(nativeRegexes)) {
    regexBinding = normalizeSPresetRegexBinding({
      ...regexBinding,
      regexes: nativeRegexes,
    });
  }
  return {
    chatSquash: normalizeSPresetChatSquash(SPresetSettings.ChatSquash),
    macroNest: normalizeSPresetMacroNest(SPresetSettings.MacroNest),
    regexBinding,
    outputPreprocessing: normalizeSPresetOutputPreprocessing(SPresetSettings.OutputPreprocessing),
    fixedPresetName: normalizeSPresetFixedPresetName(SPresetSettings.FixedPresetName),
  };
}

function normalizeSPresetFeatures(value, fallbackSettings = SPresetSettings) {
  const source = isSPresetPlainObject(value) ? value : {};
  const fallback = isSPresetPlainObject(fallbackSettings) ? fallbackSettings : {};
  const readFeature = (camelKey, persistedKey) => {
    if (Object.prototype.hasOwnProperty.call(source, camelKey)) return source[camelKey];
    if (Object.prototype.hasOwnProperty.call(source, persistedKey)) return source[persistedKey];
    return fallback[persistedKey];
  };
  const mergeObjects = (base, update) => ({
    ...(isSPresetPlainObject(base) ? cloneSPresetData(base) : {}),
    ...(isSPresetPlainObject(update) ? cloneSPresetData(update) : {}),
  });
  const chatSquash = readFeature('chatSquash', 'ChatSquash');
  const regexBinding = readFeature('regexBinding', 'RegexBinding');
  const outputPreprocessing = readFeature('outputPreprocessing', 'OutputPreprocessing');
  const fixedPresetName = readFeature('fixedPresetName', 'FixedPresetName');

  return {
    chatSquash: normalizeSPresetChatSquash(
      mergeObjects(fallback.ChatSquash, chatSquash),
      fallback.ChatSquash,
    ),
    macroNest: normalizeSPresetMacroNest(readFeature('macroNest', 'MacroNest'), fallback.MacroNest),
    regexBinding: normalizeSPresetRegexBinding(
      mergeObjects(fallback.RegexBinding, regexBinding),
      fallback.RegexBinding,
    ),
    outputPreprocessing: normalizeSPresetOutputPreprocessing(
      mergeObjects(fallback.OutputPreprocessing, outputPreprocessing),
    ),
    fixedPresetName: normalizeSPresetFixedPresetName(fixedPresetName, fallback.FixedPresetName),
  };
}

function compileSPresetFunctionExpression(script, label) {
  const source = String(script || '').trim().replace(/;+\s*$/, '');
  if (!source) throw new TypeError(`${label}脚本不能为空`);
  let processor;
  try {
    processor = Function(`"use strict"; return (\n${source}\n);`)();
  } catch (error) {
    throw new SyntaxError(`${label}脚本无法解析：${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof processor !== 'function') throw new TypeError(`${label}脚本必须是函数表达式`);
  return processor;
}

function validateSPresetFeatures(value, fallbackSettings = SPresetSettings) {
  const features = normalizeSPresetFeatures(value, fallbackSettings);
  const errors = [];
  if (!isSPresetPlainObject(value)) {
    errors.push('附加功能配置必须是对象');
  } else {
    const rawFeature = (camelKey, persistedKey) => {
      if (Object.prototype.hasOwnProperty.call(value, camelKey)) return value[camelKey];
      if (Object.prototype.hasOwnProperty.call(value, persistedKey)) return value[persistedKey];
      return undefined;
    };
    const rawChatSquash = rawFeature('chatSquash', 'ChatSquash');
    const rawRegexBinding = rawFeature('regexBinding', 'RegexBinding');
    const rawOutputPreprocessing = rawFeature('outputPreprocessing', 'OutputPreprocessing');
    const rawFixedPresetName = rawFeature('fixedPresetName', 'FixedPresetName');
    if (rawChatSquash !== undefined && !isSPresetPlainObject(rawChatSquash)) {
      errors.push('聊天记录合并配置必须是对象');
    }
    if (rawRegexBinding !== undefined) {
      if (!isSPresetPlainObject(rawRegexBinding)) {
        errors.push('预设正则绑定配置必须是对象');
      } else if (Object.prototype.hasOwnProperty.call(rawRegexBinding, 'regexes')
        && !Array.isArray(rawRegexBinding.regexes)) {
        errors.push('预设正则绑定的 regexes 必须是数组');
      }
    }
    if (rawOutputPreprocessing !== undefined && !isSPresetPlainObject(rawOutputPreprocessing)) {
      errors.push('输出预处理配置必须是对象');
    }
    if (rawFixedPresetName !== undefined && typeof rawFixedPresetName !== 'string') {
      errors.push('固定预设名必须是字符串');
    }
  }

  if (features.chatSquash.squashed_post_script_enable) {
    try {
      // Only compile the expression. Never invoke a post-processing script while validating Editor data.
      compileSPresetFunctionExpression(features.chatSquash.squashed_post_script, '聊天记录后处理');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const ids = new Set();
  features.regexBinding.regexes.forEach((regex, index) => {
    const label = `预设正则 #${index + 1}`;
    if (!isSPresetPlainObject(regex)) {
      errors.push(`${label} 必须是对象`);
      return;
    }
    const id = String(regex.id || '').trim();
    if (!id) errors.push(`${label} 缺少 id`);
    if (id && ids.has(id)) errors.push(`预设正则 id 重复：${id}`);
    if (id) ids.add(id);
    if (!String(regex.scriptName || '').trim()) errors.push(`${label} 缺少名称`);
    if (!String(regex.findRegex || '').trim()) errors.push(`${label} 缺少查找表达式`);
    if (!Array.isArray(regex.placement) || regex.placement.length === 0) {
      errors.push(`${label} 至少需要一个作用位置`);
    }
  });

  if (features.outputPreprocessing.enabled) {
    const validation = validateSPresetOutputPreprocessing(features.outputPreprocessing.script);
    if (!validation.valid) errors.push(`输出预处理：${validation.error}`);
  }

  return { valid: errors.length === 0, errors, features };
}

function applySPresetFeaturesToSettings(settings, features) {
  settings.ChatSquash = cloneSPresetData(features.chatSquash);
  settings.MacroNest = normalizeSPresetMacroNest(features.macroNest);
  settings.RegexBinding = cloneSPresetData(features.regexBinding);
  settings.OutputPreprocessing = cloneSPresetData(features.outputPreprocessing);
  settings.FixedPresetName = normalizeSPresetFixedPresetName(features.fixedPresetName);
  return settings;
}

function readFixedPresetNameFromImportedPreset(preset) {
  if (!isSPresetPlainObject(preset)) return '';
  const directSettings = preset.extensions?.SPreset;
  if (isSPresetPlainObject(directSettings)) {
    const directName = normalizeSPresetFixedPresetName(
      directSettings.FixedPresetName ?? directSettings.fixedPresetName,
    );
    if (directName) return directName;
  }

  const settingsPrompt = Array.isArray(preset.prompts)
    ? preset.prompts.find(prompt => prompt?.identifier === 'SPresetSettings')
    : null;
  if (typeof settingsPrompt?.content !== 'string') return '';
  try {
    const promptSettings = JSON.parse(settingsPrompt.content);
    return normalizeSPresetFixedPresetName(
      promptSettings?.FixedPresetName ?? promptSettings?.fixedPresetName,
    );
  } catch {
    return '';
  }
}

function clearFixedPresetNameInImportedPreset(preset) {
  if (!isSPresetPlainObject(preset)) return preset;
  const directSettings = preset.extensions?.SPreset;
  if (isSPresetPlainObject(directSettings)) {
    directSettings.FixedPresetName = '';
    if (Object.prototype.hasOwnProperty.call(directSettings, 'fixedPresetName')) {
      directSettings.fixedPresetName = '';
    }
  }

  const settingsPrompt = Array.isArray(preset.prompts)
    ? preset.prompts.find(prompt => prompt?.identifier === 'SPresetSettings')
    : null;
  if (typeof settingsPrompt?.content === 'string') {
    try {
      const promptSettings = JSON.parse(settingsPrompt.content);
      if (isSPresetPlainObject(promptSettings)) {
        promptSettings.FixedPresetName = '';
        if (Object.prototype.hasOwnProperty.call(promptSettings, 'fixedPresetName')) {
          promptSettings.fixedPresetName = '';
        }
        settingsPrompt.content = JSON.stringify(promptSettings);
      }
    } catch {
      // An invalid legacy settings prompt is left untouched.
    }
  }
  return preset;
}

function installSPresetFixedPresetNameImportHook() {
  const importReadyEvent = ctx.eventTypes.OAI_PRESET_IMPORT_READY || 'oai_preset_import_ready';
  const presetChangedEvent = ctx.eventTypes.PRESET_CHANGED || 'preset_changed';

  const armRename = async result => {
    const targetName = readFixedPresetNameFromImportedPreset(result?.data);
    if (!targetName || !isSPresetPlainObject(result?.data)) {
      pendingSPresetImportRename = null;
      return;
    }

    const token = Symbol('SPresetImportRenameTransaction');
    Object.defineProperty(result.data, spresetImportRenameMarker, {
      value: token,
      enumerable: true,
      configurable: true,
    });

    const sanitize = globalThis.SPresetImports?.getSanitizedFilename;
    let sourceName = normalizeSPresetFixedPresetName(result.presetName);
    let normalizedTargetName = targetName;
    if (typeof sanitize === 'function') {
      try {
        [sourceName, normalizedTargetName] = await Promise.all([
          sanitize(sourceName),
          sanitize(normalizedTargetName),
        ]);
      } catch (error) {
        console.warn('[SPreset] 固定预设名净化失败，本次导入不会自动改名:', error);
        pendingSPresetImportRename = null;
        return;
      }
    }

    if (!sourceName || !normalizedTargetName) {
      pendingSPresetImportRename = null;
      return;
    }
    pendingSPresetImportRename = {
      sourceName,
      targetName: normalizedTargetName,
      token,
    };
  };

  const finishRename = async event => {
    if (spresetImportRenameRunning || !pendingSPresetImportRename || event?.apiId !== 'openai') return;
    const manager = globalThis.SPresetImports?.getPresetManager?.('openai');
    if (!manager) return;

    const transaction = pendingSPresetImportRename;
    const importedPreset = manager.getCompletionPresetByName?.(event.name);
    if (!importedPreset || importedPreset[spresetImportRenameMarker] !== transaction.token) return;

    spresetImportRenameRunning = true;
    try {
      const oldName = String(event.name || manager.getSelectedPresetName?.() || transaction.sourceName);
      let targetName = transaction.targetName;
      const equalsName = globalThis.SPresetImports?.equalsIgnoreCaseAndAccents;
      const namesEqual = (left, right) => typeof equalsName === 'function'
        ? equalsName(left, right)
        : left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
      const sameName = namesEqual(oldName, targetName);
      const renamedPreset = clearFixedPresetNameInImportedPreset(cloneSPresetData(importedPreset));

      if (sameName) {
        await manager.savePreset(oldName, renamedPreset, { skipUpdate: true });
        clearFixedPresetNameInImportedPreset(importedPreset);
        reloadSettings();
        SPresetSettings.FixedPresetName = '';
        persistSPresetSettings();
        pendingSPresetImportRename = null;
        globalThis.toastr?.success?.(`已应用固定预设名：${oldName}`);
        return;
      }

      const conflictingName = manager.getAllPresets?.().find(name => (
        namesEqual(String(name), targetName) && !namesEqual(String(name), oldName)
      ));
      if (conflictingName) {
        const overwrite = await ctx.callGenericPopup(
          '固定预设名对应的预设已经存在。是否用本次导入的预设覆盖它？',
          ctx.POPUP_TYPE.CONFIRM,
          '',
          { okButton: '覆盖并改名', cancelButton: '取消' },
        );
        if (!overwrite) {
          pendingSPresetImportRename = null;
          globalThis.toastr?.info?.('已取消自动改名，固定预设名仍保留在导入的预设中');
          return;
        }
        targetName = String(conflictingName);
      }

      await ctx.eventSource.emit(ctx.eventTypes.PRESET_RENAMED_BEFORE || 'preset_renamed_before', {
        apiId: 'openai',
        oldName,
        newName: targetName,
      });
      const targetApplied = new Promise(resolve => {
        let settled = false;
        function listener(changed) {
          if (changed?.apiId !== 'openai' || !namesEqual(String(changed.name || ''), targetName)) return;
          settled = true;
          clearTimeout(timeoutId);
          ctx.eventSource.removeListener(presetChangedEvent, listener);
          resolve(String(changed.name || targetName));
        }
        const timeoutId = setTimeout(() => {
          if (settled) return;
          ctx.eventSource.removeListener(presetChangedEvent, listener);
          resolve(null);
        }, 10000);
        ctx.eventSource.on(presetChangedEvent, listener);
      });
      await manager.savePreset(targetName, renamedPreset);
      const appliedName = await targetApplied;
      if (!appliedName) throw new Error(`等待新预设“${targetName}”载入超时`);
      const actualNewName = String(appliedName || manager.getSelectedPresetName?.() || targetName);
      const deleted = await manager.deletePreset(oldName);
      if (!deleted) {
        Object.defineProperty(importedPreset, spresetImportRenameMarker, {
          value: transaction.token,
          enumerable: true,
          configurable: true,
        });
        manager.updateList?.(oldName, importedPreset);
        throw new Error(`旧预设“${oldName}”删除失败`);
      }
      await ctx.eventSource.emit(ctx.eventTypes.PRESET_RENAMED || 'preset_renamed', {
        apiId: 'openai',
        oldName,
        newName: actualNewName,
      });
      reloadSettings();
      pendingSPresetImportRename = null;
      globalThis.toastr?.success?.(`预设已自动改名为“${actualNewName}”，固定预设名已清除`);
    } catch (error) {
      // The persisted marker remains in the imported source preset on failure.
      // Disarm only this runtime transaction so an unrelated preset switch cannot consume it.
      pendingSPresetImportRename = null;
      console.error('[SPreset] 导入后自动改名失败:', error);
      globalThis.toastr?.error?.(
        `自动改名失败，固定预设名已保留：${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      spresetImportRenameRunning = false;
    }
  };

  if (typeof ctx.eventSource.makeFirst === 'function') {
    ctx.eventSource.makeFirst(importReadyEvent, armRename);
  } else {
    ctx.eventSource.on(importReadyEvent, armRename);
  }
  ctx.eventSource.on(presetChangedEvent, finishRename);
}

function syncSPresetRegexesToCurrentST() {
  const regexes = normalizeSPresetRegexBinding(SPresetSettings.RegexBinding).regexes;
  if (versionNumber >= 11305) {
    if (!ctx.chatCompletionSettings.extensions) ctx.chatCompletionSettings.extensions = {};
    ctx.chatCompletionSettings.extensions.regex_scripts = cloneSPresetData(regexes);
    if (!ctx.extensionSettings.preset_allowed_regex) ctx.extensionSettings.preset_allowed_regex = {};
    if (!Array.isArray(ctx.extensionSettings.preset_allowed_regex.openai)) {
      ctx.extensionSettings.preset_allowed_regex.openai = [];
    }
    const presetName = ctx.chatCompletionSettings.preset_settings_openai;
    if (presetName && !ctx.extensionSettings.preset_allowed_regex.openai.includes(presetName)) {
      ctx.extensionSettings.preset_allowed_regex.openai.push(presetName);
    }
    return;
  }
  if (typeof syncLegacySPresetRegexesToCurrentST === 'function') {
    syncLegacySPresetRegexesToCurrentST(cloneSPresetData(regexes));
  }
}


function compileSPresetOutputPreprocessor(script) {
  const source = String(script || '').trim().replace(/;\s*$/, '');
  if (!source) {
    throw new TypeError('输出预处理脚本不能为空');
  }

  let processor;
  try {
    processor = Function(`"use strict"; return (\n${source}\n);`)();
  } catch (error) {
    throw new SyntaxError(`输出预处理脚本无法解析：${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof processor !== 'function') {
    throw new TypeError('输出预处理脚本必须求值为函数');
  }
  return processor;
}

function validateSPresetOutputPreprocessing(script) {
  try {
    compileSPresetOutputPreprocessor(script);
    return { valid: true, error: '' };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function normalizeSPresetOutputProcessorResult(result) {
  if (typeof result === 'string') {
    return { output: result, hold: '', state: undefined };
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new TypeError('输出预处理脚本必须返回字符串或 { output, hold }');
  }

  const hasOutput = Object.prototype.hasOwnProperty.call(result, 'output')
    || Object.prototype.hasOwnProperty.call(result, 'emit')
    || Object.prototype.hasOwnProperty.call(result, 'text')
    || Object.prototype.hasOwnProperty.call(result, 'content');
  if (!hasOutput) {
    throw new TypeError('输出预处理结果缺少 output');
  }
  const output = Object.prototype.hasOwnProperty.call(result, 'output')
    ? result.output
    : Object.prototype.hasOwnProperty.call(result, 'emit')
      ? result.emit
      : Object.prototype.hasOwnProperty.call(result, 'text')
        ? result.text
        : result.content;
  return {
    output: output == null ? '' : String(output),
    hold: result.hold == null ? '' : String(result.hold),
    state: result.state,
  };
}

function createSPresetOutputPreprocessingSession(script, options = {}) {
  let processor = compileSPresetOutputPreprocessor(script);
  let raw = '';
  let output = '';
  let hold = '';
  let state = {};
  let failed = false;
  const stream = Boolean(options.stream);
  const channel = String(options.channel || 'main');

  const snapshot = (emitted = '') => ({ raw, output, hold, emitted, failed });
  const reset = () => {
    processor = compileSPresetOutputPreprocessor(script);
    raw = '';
    output = '';
    hold = '';
    state = {};
    failed = false;
  };

  const push = async (chunk, final = false) => {
    const incoming = chunk == null ? '' : String(chunk);
    raw += incoming;
    if (failed) {
      output = raw;
      return snapshot(incoming);
    }

    const previousHold = hold;
    const buffer = previousHold + incoming;
    try {
      const rawResult = await processor({
        buffer,
        chunk: incoming,
        hold: previousHold,
        output,
        raw,
        final: Boolean(final),
        stream,
        state,
        channel,
      });
      const result = normalizeSPresetOutputProcessorResult(rawResult);
      let emitted = result.output;
      hold = result.hold;
      if (result.state !== undefined) state = result.state;

      // hold is temporary by contract. Never silently lose it at EOF even if
      // a user script forgets to release it in its final call.
      if (final && hold) {
        emitted += hold;
        hold = '';
      }
      output += emitted;
      return snapshot(emitted);
    } catch (error) {
      failed = true;
      hold = '';
      output = raw;
      console.error(`[SPreset Output Preprocessing] ${channel} 处理失败，已回退为原始输出：`, error);
      return snapshot(incoming);
    }
  };

  return {
    async updateCumulative(value, final = false) {
      const cumulative = value == null ? '' : String(value);
      if (!cumulative.startsWith(raw)) {
        // Some providers can revise an already yielded prefix. Replay the new
        // cumulative value in a fresh session so state and hold stay coherent.
        reset();
        return push(cumulative, final);
      }
      const delta = cumulative.slice(raw.length);
      if (!delta && !final) return snapshot();
      return push(delta, final);
    },
    async finish() {
      return push('', true);
    },
    snapshot,
  };
}

async function previewSPresetOutputPreprocessing(script, chunks) {
  const sourceChunks = Array.isArray(chunks) ? chunks.map(value => String(value ?? '')) : [String(chunks ?? '')];
  const stream = sourceChunks.length > 1;
  const session = createSPresetOutputPreprocessingSession(script, { stream, channel: 'preview' });
  const steps = [];
  let cumulativeRaw = '';
  for (const chunk of sourceChunks) {
    cumulativeRaw += chunk;
    const previousHold = session.snapshot().hold;
    const result = await session.updateCumulative(cumulativeRaw, !stream);
    steps.push({
      index: steps.length,
      chunk,
      buffer: previousHold + chunk,
      output: result.emitted,
      hold: result.hold,
      accumulated: result.output,
      final: !stream,
    });
  }
  let finalResult = session.snapshot();
  if (stream) {
    const finalBuffer = finalResult.hold;
    finalResult = await session.finish();
    steps.push({
      index: steps.length,
      chunk: '',
      buffer: finalBuffer,
      output: finalResult.emitted,
      hold: finalResult.hold,
      accumulated: finalResult.output,
      final: true,
    });
  }
  return { valid: true, output: finalResult.output, hold: finalResult.hold, steps };
}

const SPRESET_TOOL_ARGUMENT_TEXT_KEYS = new Set([
  'content',
  'text',
  'output',
  'answer',
  'message',
  'response',
]);

function collectSPresetToolCallArguments(value) {
  const argumentsList = [];
  const visited = new WeakSet();
  const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

  const visit = target => {
    if (Array.isArray(target)) {
      target.forEach(visit);
      return;
    }
    if (!target || typeof target !== 'object' || visited.has(target)) return;
    visited.add(target);

    // OpenAI/DeepSeek normalized call (also SillyTavern's normalized stream form).
    if (target.function && typeof target.function === 'object' && hasOwn(target.function, 'arguments')) {
      argumentsList.push(target.function.arguments);
      return;
    }

    // Gemini may appear either as a part wrapper or as the functionCall itself.
    if (target.functionCall && typeof target.functionCall === 'object') {
      visit(target.functionCall);
      return;
    }
    if (hasOwn(target, 'args') && (hasOwn(target, 'name') || hasOwn(target, 'id'))) {
      argumentsList.push(target.args);
      return;
    }

    // Claude tool_use blocks keep their arguments in input.
    if (hasOwn(target, 'input')
      && (target.type === 'tool_use' || hasOwn(target, 'name') || hasOwn(target, 'id'))) {
      argumentsList.push(target.input);
      return;
    }

    // Legacy OpenAI function_call.
    if (hasOwn(target, 'arguments') && hasOwn(target, 'name')) {
      argumentsList.push(target.arguments);
      return;
    }
    if (target.function_call && typeof target.function_call === 'object') {
      visit(target.function_call);
      return;
    }

    // Known containers only: do not mistake an arbitrary argument object for a call.
    for (const key of ['tool_calls', 'toolCalls', 'calls']) {
      if (hasOwn(target, key)) visit(target[key]);
    }
  };

  visit(value);
  return argumentsList;
}

function parseSPresetToolCallArgument(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Standard function.arguments is JSON text. Plain strings used by a few
  // compatible providers remain valid, but malformed object/array JSON must
  // fail closed so the original tool call can still be executed by ST.
  const looksStructured = /^[[{"]/.test(trimmed);
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    if (looksStructured) throw error;
    return value;
  }
}

function stringifySPresetToolCallArgument(value) {
  const parsed = parseSPresetToolCallArgument(value);
  if (typeof parsed === 'string') return parsed;

  if (isSPresetPlainObject(parsed)) {
    const keys = Object.keys(parsed);
    if (keys.length === 1) {
      const onlyKey = keys[0];
      const onlyValue = parsed[onlyKey];
      if (SPRESET_TOOL_ARGUMENT_TEXT_KEYS.has(onlyKey) || typeof onlyValue === 'string') {
        const unwrapped = typeof onlyValue === 'string' ? onlyValue : JSON.stringify(onlyValue);
        if (unwrapped === undefined) throw new TypeError('工具调用参数内容无法转换为文本');
        return unwrapped;
      }
    }
  }

  const serialized = JSON.stringify(parsed);
  if (serialized === undefined) throw new TypeError('工具调用参数无法转换为文本');
  return serialized;
}

function formatSPresetToolCallArguments(toolCalls) {
  const argumentsList = collectSPresetToolCallArguments(toolCalls);
  if (argumentsList.length === 0) throw new TypeError('没有找到可消费的工具调用参数');
  return argumentsList.map(stringifySPresetToolCallArgument).join('\n');
}

function appendSPresetToolArgumentText(source, toolText) {
  const current = source == null ? '' : String(source);
  const addition = toolText == null ? '' : String(toolText);
  if (!current) return addition;
  if (!addition) return current;
  return `${current}${current.endsWith('\n') ? '' : '\n'}${addition}`;
}

function appendSPresetResponseText(content, addition) {
  if (content == null || typeof content === 'string') {
    return appendSPresetToolArgumentText(content, addition);
  }
  if (Array.isArray(content)) {
    const nextContent = content.map(part => (
      part && typeof part === 'object' ? { ...part } : part
    ));
    for (let index = nextContent.length - 1; index >= 0; index -= 1) {
      const part = nextContent[index];
      const isVisibleTextPart = part
        && typeof part === 'object'
        && typeof part.text === 'string'
        && (!part.type || part.type === 'text' || part.type === 'output_text');
      if (isVisibleTextPart) {
        part.text = appendSPresetToolArgumentText(part.text, addition);
        return nextContent;
      }
      if (typeof part === 'string') {
        nextContent[index] = appendSPresetToolArgumentText(part, addition);
        return nextContent;
      }
    }
    return [...nextContent, { type: 'text', text: addition }];
  }
  if (typeof content === 'object' && typeof content.text === 'string') {
    return { ...content, text: appendSPresetToolArgumentText(content.text, addition) };
  }
  throw new TypeError('无法安全地把工具参数写入响应正文');
}

function stripSPresetGeminiFunctionParts(parts) {
  return parts.map(part => {
    if (!part || typeof part !== 'object' || !part.functionCall) return part;
    const nextPart = { ...part };
    delete nextPart.functionCall;
    delete nextPart.thoughtSignature;
    return Object.keys(nextPart).length > 0 ? nextPart : null;
  }).filter(Boolean);
}

function stripSPresetChoiceToolCalls(choice) {
  if (!choice || typeof choice !== 'object') return;
  const message = choice.message;
  if (message && typeof message === 'object') {
    delete message.tool_calls;
    delete message.function_call;
  }
  delete choice.tool_calls;
  delete choice.function_call;
  if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call') {
    choice.finish_reason = 'stop';
  }
}

/**
 * Consume tool calls in a non-streaming chat-completions response clone.
 * Returns null when the response contains no supported call. Any unsafe or
 * malformed shape throws, allowing the fetch wrapper to return the untouched
 * original JSON and preserve normal SillyTavern tool execution.
 */
function consumeSPresetToolCallsFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const nextData = typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));

  // Native Gemini responses are wrapped by ST as responseContent plus an OAI
  // choice. Remove the functionCall source ToolManager reads and mirror the
  // resulting parameter text into both visible response representations.
  const geminiParts = nextData?.responseContent?.parts;
  const geminiCalls = Array.isArray(geminiParts)
    ? geminiParts.filter(part => part?.functionCall)
    : [];
  if (geminiCalls.length > 0) {
    const toolText = formatSPresetToolCallArguments(geminiCalls);
    nextData.responseContent.parts = [
      ...stripSPresetGeminiFunctionParts(geminiParts),
      { text: toolText },
    ];
    if (Array.isArray(nextData.choices)) {
      nextData.choices.forEach(stripSPresetChoiceToolCalls);
      const mainChoice = nextData.choices.find(choice => choice?.index === 0) || nextData.choices[0];
      if (!mainChoice || !mainChoice.message || typeof mainChoice.message !== 'object') {
        throw new TypeError('Gemini 响应缺少可写入的正文位置');
      }
      mainChoice.message.content = appendSPresetResponseText(mainChoice.message.content, toolText);
    }
    return nextData;
  }

  // Native Claude response: preserve thinking/text blocks, remove tool_use,
  // and add one ordinary text block containing all tool arguments.
  if (Array.isArray(nextData.content)) {
    const claudeCalls = nextData.content.filter(block => block?.type === 'tool_use');
    if (claudeCalls.length > 0) {
      const toolText = formatSPresetToolCallArguments(claudeCalls);
      nextData.content = [
        ...nextData.content.filter(block => block?.type !== 'tool_use'),
        { type: 'text', text: toolText },
      ];
      if (nextData.stop_reason === 'tool_use') nextData.stop_reason = 'end_turn';
      return nextData;
    }
  }

  // OAI/DeepSeek-compatible responses. Each choice remains independent so
  // multi-swipe text, logprobs and all unrelated provider metadata survive.
  if (Array.isArray(nextData.choices)) {
    let consumed = false;
    for (const choice of nextData.choices) {
      const message = choice?.message;
      if (!message || typeof message !== 'object') continue;
      const calls = [];
      if (Array.isArray(message.tool_calls)) calls.push(...message.tool_calls);
      else if (message.tool_calls && typeof message.tool_calls === 'object') calls.push(message.tool_calls);
      if (message.function_call && typeof message.function_call === 'object') calls.push(message.function_call);
      if (calls.length === 0) continue;

      const toolText = formatSPresetToolCallArguments(calls);
      message.content = appendSPresetResponseText(message.content, toolText);
      stripSPresetChoiceToolCalls(choice);
      consumed = true;
    }
    if (consumed) return nextData;
  }

  // Direct Gemini candidate shape (used by a few compatible proxies).
  if (Array.isArray(nextData.candidates)) {
    let consumed = false;
    for (const candidate of nextData.candidates) {
      const parts = candidate?.content?.parts;
      if (!Array.isArray(parts)) continue;
      const calls = parts.filter(part => part?.functionCall);
      if (calls.length === 0) continue;
      const toolText = formatSPresetToolCallArguments(calls);
      candidate.content.parts = [
        ...stripSPresetGeminiFunctionParts(parts),
        { text: toolText },
      ];
      consumed = true;
    }
    if (consumed) return nextData;
  }

  // Cohere-compatible message shape. Not required for provider selection, but
  // it is safe to support because ToolManager recognizes this exact field.
  const directCalls = nextData?.message?.tool_calls;
  if (directCalls && typeof directCalls === 'object') {
    const toolText = formatSPresetToolCallArguments(directCalls);
    const currentContent = nextData.message.content;
    if (Array.isArray(currentContent)) {
      const textBlock = currentContent.find(block => block && typeof block.text === 'string');
      if (textBlock) textBlock.text = appendSPresetToolArgumentText(textBlock.text, toolText);
      else currentContent.unshift({ type: 'text', text: toolText });
    } else {
      nextData.message.content = [{ type: 'text', text: toolText }];
    }
    delete nextData.message.tool_calls;
    return nextData;
  }

  return null;
}

function wrapSPresetOutputGenerator(originalGenerator, settings) {
  return async function* (...args) {
    const mainSession = createSPresetOutputPreprocessingSession(settings.script, { stream: true, channel: 'main' });
    const swipeSessions = new Map();
    let lastPacket = null;
    let lastRawText = '';
    let lastText = '';
    let lastSwipes = [];
    let lastToolCalls = null;

    for await (const packet of originalGenerator.apply(this, args)) {
      const sourcePacket = packet && typeof packet === 'object' ? packet : { text: String(packet ?? '') };
      const mainResult = await mainSession.updateCumulative(sourcePacket.text);
      const swipes = Array.isArray(sourcePacket.swipes) ? [] : sourcePacket.swipes;
      if (Array.isArray(sourcePacket.swipes)) {
        for (let index = 0; index < sourcePacket.swipes.length; index += 1) {
          if (!swipeSessions.has(index)) {
            swipeSessions.set(index, createSPresetOutputPreprocessingSession(settings.script, {
              stream: true,
              channel: `swipe:${index}`,
            }));
          }
          const result = await swipeSessions.get(index).updateCumulative(sourcePacket.swipes[index]);
          swipes.push(result.output);
        }
      }

      lastPacket = sourcePacket;
      lastRawText = sourcePacket.text == null ? '' : String(sourcePacket.text);
      lastText = mainResult.output;
      lastSwipes = Array.isArray(swipes) ? swipes : [];
      const packetToolCalls = sourcePacket.toolCalls;
      const hasPacketToolCalls = (Array.isArray(packetToolCalls) && packetToolCalls.length > 0)
        || (packetToolCalls && typeof packetToolCalls === 'object' && Object.keys(packetToolCalls).length > 0);
      if (settings.consumeToolCalls && hasPacketToolCalls) {
        // ST yields the same cumulative structure while deltas fill it in. Keep
        // the latest reference for EOF formatting, but never expose it to the
        // StreamingProcessor where it would trigger ToolManager execution.
        lastToolCalls = packetToolCalls;
      }
      yield {
        ...sourcePacket,
        text: mainResult.output,
        ...(Array.isArray(swipes) ? { swipes } : {}),
        ...(settings.consumeToolCalls ? { toolCalls: [] } : {}),
      };
    }

    let toolConsumptionFailed = false;
    if (settings.consumeToolCalls && lastToolCalls) {
      if (mainSession.snapshot().failed) {
        toolConsumptionFailed = true;
      } else {
        try {
          const toolText = formatSPresetToolCallArguments(lastToolCalls);
          // Feed argument text into the same session before EOF. Stateful scripts
          // (notably a Unicode decoder holding a trailing "\\u") therefore see
          // one continuous stream and retain their existing hold/state behavior.
          const result = await mainSession.updateCumulative(appendSPresetToolArgumentText(lastRawText, toolText));
          toolConsumptionFailed = result.failed;
        } catch (error) {
          toolConsumptionFailed = true;
          console.error('[SPreset Output Preprocessing] 工具调用参数消费失败，已恢复酒馆原工具调用：', error);
        }
      }
    }

    const finalMain = await mainSession.finish();
    if (settings.consumeToolCalls && lastToolCalls && finalMain.failed) {
      toolConsumptionFailed = true;
    }
    const finalSwipes = [...lastSwipes];
    for (const [index, session] of swipeSessions) {
      finalSwipes[index] = (await session.finish()).output;
    }

    const swipesChanged = finalSwipes.some((value, index) => value !== lastSwipes[index]);
    if (lastPacket && (finalMain.output !== lastText || swipesChanged || toolConsumptionFailed)) {
      // A synthetic last packet flushes held tails before ST finalizes the
      // message. Do not replay token logprobs for this bookkeeping packet.
      yield {
        ...lastPacket,
        text: toolConsumptionFailed ? lastText : finalMain.output,
        ...(Array.isArray(lastPacket.swipes) ? { swipes: finalSwipes } : {}),
        ...(settings.consumeToolCalls
          ? { toolCalls: toolConsumptionFailed ? lastToolCalls : [] }
          : {}),
        logprobs: null,
      };
    }
  };
}

function getSPresetStreamingProcessor() {
  try {
    return globalThis.SPresetImports?.streamingProcessor || SillyTavern.getContext()?.streamingProcessor || null;
  } catch {
    return null;
  }
}

function hookSPresetStreamingOutputPreprocessing() {
  const settings = normalizeSPresetOutputPreprocessing(SPresetSettings.OutputPreprocessing);
  if (!settings.enabled) return;
  const validation = validateSPresetOutputPreprocessing(settings.script);
  if (!validation.valid) {
    console.warn('[SPreset Output Preprocessing] 已跳过无效脚本：', validation.error);
    return;
  }

  const streamingProcessor = getSPresetStreamingProcessor();
  if (!streamingProcessor || streamingProcessor.__spresetOutputPreprocessingHooked) return;
  const originalGenerate = streamingProcessor.generate;
  if (typeof originalGenerate !== 'function') return;

  Object.defineProperty(streamingProcessor, '__spresetOutputPreprocessingHooked', { value: true, configurable: true });
  Object.defineProperty(streamingProcessor, '__spresetOutputPreprocessingActive', { value: true, configurable: true });
  streamingProcessor.generate = async function (...args) {
    if (!this.__spresetOutputGeneratorWrapped && typeof this.generator === 'function') {
      this.generator = wrapSPresetOutputGenerator(this.generator, settings);
      Object.defineProperty(this, '__spresetOutputGeneratorWrapped', { value: true, configurable: true });
    }
    return originalGenerate.apply(this, args);
  };
}

let spresetOutputGenerationContext = null;
const spresetOutputProcessedMessages = new WeakMap();

function beginSPresetOutputGeneration(type, _options, dryRun) {
  if (dryRun) return;
  const currentContext = SillyTavern.getContext();
  const lastMessage = currentContext.chat?.[currentContext.chat.length - 1];
  const shouldPreservePrefix = ['continue', 'append', 'appendFinal'].includes(String(type));
  spresetOutputGenerationContext = {
    type: String(type || ''),
    prefix: shouldPreservePrefix && typeof lastMessage?.mes === 'string' ? lastMessage.mes : '',
  };
}

async function preprocessSPresetNonStreamingMessage(messageId, type) {
  const settings = normalizeSPresetOutputPreprocessing(SPresetSettings.OutputPreprocessing);
  if (!settings.enabled || !['normal', 'swipe', 'continue', 'append', 'appendFinal', 'regenerate'].includes(String(type))) return;

  // Streaming output already passed through the generator wrapper. Its final
  // MESSAGE_RECEIVED event must not run the same script a second time.
  if (getSPresetStreamingProcessor()?.__spresetOutputPreprocessingActive) return;

  const currentContext = SillyTavern.getContext();
  const message = currentContext.chat?.[Number(messageId)];
  if (!message || message.is_user || message.is_system || typeof message.mes !== 'string') return;
  const swipeKey = String(message.swipe_id ?? 'message');
  const processedBySwipe = spresetOutputProcessedMessages.get(message);
  if (processedBySwipe?.get(swipeKey) === message.mes) return;

  const validation = validateSPresetOutputPreprocessing(settings.script);
  if (!validation.valid) {
    console.warn('[SPreset Output Preprocessing] 已跳过无效脚本：', validation.error);
    return;
  }

  const context = spresetOutputGenerationContext;
  const prefix = context && ['continue', 'append', 'appendFinal'].includes(String(type))
    && message.mes.startsWith(context.prefix)
    ? context.prefix
    : '';
  const source = message.mes.slice(prefix.length);
  const session = createSPresetOutputPreprocessingSession(settings.script, { stream: false, channel: 'main' });
  const result = await session.updateCumulative(source, true);
  message.mes = prefix + result.output;

  const nextProcessedBySwipe = processedBySwipe || new Map();
  nextProcessedBySwipe.set(swipeKey, message.mes);
  if (!processedBySwipe) spresetOutputProcessedMessages.set(message, nextProcessedBySwipe);
}

function isSPresetChatCompletionGenerateRequest(input, init) {
  const rawUrl = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
  if (!rawUrl) return false;
  try {
    const baseUrl = globalThis.location?.href || 'http://localhost/';
    const requestUrl = new URL(rawUrl, baseUrl);
    const pageUrl = new URL(baseUrl);
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    return method === 'POST'
      && requestUrl.origin === pageUrl.origin
      && requestUrl.pathname === '/api/backends/chat-completions/generate';
  } catch {
    return false;
  }
}

async function isSPresetStreamingFetchRequest(input, init) {
  let body = init?.body;
  if (typeof body !== 'string' && input && typeof input.clone === 'function') {
    try {
      body = await input.clone().text();
    } catch {
      return false;
    }
  }
  if (typeof body !== 'string') return false;
  try {
    return JSON.parse(body)?.stream === true;
  } catch {
    return false;
  }
}

let spresetOutputFetchHookInstalled = false;
function installSPresetOutputFetchHook() {
  if (spresetOutputFetchHookInstalled || typeof globalThis.fetch !== 'function') return;
  spresetOutputFetchHookInstalled = true;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function (...args) {
    const [input, init] = args;
    const isTargetRequest = isSPresetChatCompletionGenerateRequest(input, init);
    // Start the network request immediately. Reading a cloned Request body in
    // parallel covers callers that pass `new Request(...)` without delaying it.
    const streamingRequest = isTargetRequest
      ? isSPresetStreamingFetchRequest(input, init)
      : Promise.resolve(false);
    const responsePromise = originalFetch.apply(this, args);
    const [response, isStreamingRequest] = await Promise.all([responsePromise, streamingRequest]);
    if (!isTargetRequest || isStreamingRequest || !response?.ok) return response;

    // SSE is handled by wrapSPresetOutputGenerator. Requiring a JSON content
    // type also prevents this narrowly-scoped hook from consuming an unusual
    // streaming/proxy response whose request body could not be inspected.
    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    if (contentType.includes('text/event-stream')
      || (!contentType.includes('application/json') && !contentType.includes('+json'))) {
      return response;
    }

    const originalJson = response.json.bind(response);
    try {
      Object.defineProperty(response, 'json', {
        configurable: true,
        value: async () => {
          const data = await originalJson();
          const settings = normalizeSPresetOutputPreprocessing(SPresetSettings.OutputPreprocessing);
          if (!settings.enabled || !settings.consumeToolCalls) return data;

          const validation = validateSPresetOutputPreprocessing(settings.script);
          if (!validation.valid) return data;

          try {
            return consumeSPresetToolCallsFromResponse(data) || data;
          } catch (error) {
            // The parsed data object has never been modified; transformation
            // happens on a clone, so returning it restores normal ST behavior.
            console.error('[SPreset Output Preprocessing] 非流式工具调用参数消费失败，已返回原响应：', error);
            return data;
          }
        },
      });
    } catch (error) {
      // A locked-down Response implementation is rare, but must not break the
      // request or accidentally consume a tool call when wrapping is unsafe.
      console.warn('[SPreset Output Preprocessing] 无法包装非流式响应，已保持原行为：', error);
    }
    return response;
  };
}

let spresetOutputHooksInstalled = false;
function installSPresetOutputPreprocessingHooks() {
  installSPresetOutputFetchHook();
  if (spresetOutputHooksInstalled) return;
  spresetOutputHooksInstalled = true;
  ctx.eventSource.makeFirst(ctx.eventTypes.GENERATION_STARTED, beginSPresetOutputGeneration);
  ctx.eventSource.makeFirst(ctx.eventTypes.MESSAGE_RECEIVED, preprocessSPresetNonStreamingMessage);
  ctx.eventSource.on(ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY, hookSPresetStreamingOutputPreprocessing);
  ctx.eventSource.on(ctx.eventTypes.TEXT_COMPLETION_SETTINGS_READY, hookSPresetStreamingOutputPreprocessing);
}

function getSPresetCurrentProvider() {
  const settings = ctx.chatCompletionSettings || {};
  const source = String(settings.chat_completion_source || 'openai').toLowerCase();
  const modelKeys = {
    claude: 'claude_model',
    openai: 'openai_model',
    makersuite: 'google_model',
    vertexai: 'vertexai_model',
    openrouter: 'openrouter_model',
    deepseek: 'deepseek_model',
    custom: 'custom_model',
    xai: 'xai_model',
    mistralai: 'mistralai_model',
    groq: 'groq_model',
    electronhub: 'electronhub_model',
    chutes: 'chutes_model',
    nanogpt: 'nanogpt_model',
    aimlapi: 'aimlapi_model',
    siliconflow: 'siliconflow_model',
    moonshot: 'moonshot_model',
    zai: 'zai_model',
  };
  const model = String(settings[modelKeys[source]] || '');

  if (source === 'makersuite' || source === 'vertexai') {
    return {
      adapter: 'gemini', source, model,
      label: `Gemini 原生${model ? ` · ${model}` : ''}`,
      detail: '签名转为 thoughtSignature，调用/返回转为 functionCall/functionResponse；当前酒馆转换器不会把手写 reasoning 文本标记为 thought part。',
    };
  }
  if (source === 'claude') {
    return {
      adapter: 'claude', source, model,
      label: `Claude 原生${model ? ` · ${model}` : ''}`,
      detail: 'reasoning + 签名成对转换为 thinking block，工具转换为 tool_use / tool_result。',
    };
  }
  if (source === 'openrouter') {
    return {
      adapter: 'openrouter', source, model,
      label: `OpenRouter${model ? ` · ${model}` : ''}`,
      detail: '使用 reasoning、tool_calls / tool，并让酒馆按具体模型把签名转换为 reasoning_details。',
    };
  }
  if (source === 'deepseek') {
    return {
      adapter: 'deepseek', source, model,
      label: `DeepSeek${model ? ` · ${model}` : ''}`,
      detail: '思维链转换为 reasoning_content，工具使用 OpenAI tool_calls / tool 格式；签名字段省略。',
    };
  }
  return {
    adapter: 'openai', source, model,
    label: `${source || 'OpenAI-compatible'}${model ? ` · ${model}` : ''}`,
    detail: '使用 OpenAI tool_calls / tool 格式；为避免 provider 拒绝未知字段，思维链和签名只保存、不发送。',
  };
}

function validateSPresetMessageInjection(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['结构化消息必须是对象'] };
  }
  if (!Array.isArray(data.toolCalls)) errors.push('工具调用必须是数组');
  if (!Array.isArray(data.toolResults)) errors.push('工具返回必须是数组');

  const ids = new Set();
  if (Array.isArray(data.toolCalls)) {
    data.toolCalls.forEach((call, index) => {
      if (!call || typeof call !== 'object' || Array.isArray(call)) {
        errors.push(`工具调用 #${index + 1} 必须是对象`);
        return;
      }
      const id = String(call.id || '').trim();
      const name = String(call.name || call.function?.name || '').trim();
      if (!id) errors.push(`工具调用 #${index + 1} 缺少 id`);
      if (id && ids.has(id)) errors.push(`工具调用 id 重复：${id}`);
      if (id) ids.add(id);
      if (!name) errors.push(`工具调用 #${index + 1} 缺少 name`);
      try {
        const args = call.arguments ?? call.function?.arguments ?? {};
        const parsed = typeof args === 'string' ? JSON.parse(args || '{}') : args;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          errors.push(`工具调用 #${index + 1} 的 arguments 必须是 JSON 对象`);
        }
      } catch (error) {
        errors.push(`工具调用 #${index + 1} 的 arguments 不是合法 JSON：${error.message}`);
      }
    });
  }

  if (Array.isArray(data.toolResults)) {
    data.toolResults.forEach((result, index) => {
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        errors.push(`工具返回 #${index + 1} 必须是对象`);
        return;
      }
      if (!String(result.toolCallId || result.tool_call_id || '').trim()) {
        errors.push(`工具返回 #${index + 1} 缺少 toolCallId`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

function normalizeSPresetMessageInjection(data) {
  const toArgumentsObject = call => {
    const args = call.arguments ?? call.function?.arguments ?? {};
    return typeof args === 'string' ? JSON.parse(args || '{}') : cloneSPresetData(args);
  };
  return {
    enabled: Boolean(data.enabled),
    editorMode: data.editorMode === 'json' ? 'json' : 'form',
    reasoning: String(data.reasoning ?? ''),
    signature: String(data.signature ?? ''),
    toolCalls: data.toolCalls.map(call => ({
      id: String(call.id).trim(),
      name: String(call.name || call.function?.name).trim(),
      arguments: toArgumentsObject(call),
      signature: String(call.signature ?? ''),
    })),
    toolResults: data.toolResults.map(result => ({
      toolCallId: String(result.toolCallId || result.tool_call_id).trim(),
      name: String(result.name ?? '').trim(),
      content: cloneSPresetData(Object.prototype.hasOwnProperty.call(result, 'content') ? result.content : ''),
      isError: Boolean(result.isError ?? result.is_error),
    })),
  };
}

function stringifySPresetMessageValue(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value === undefined ? '' : value);
  } catch {
    return String(value === undefined ? '' : value);
  }
}

function ensureSPresetStructuredMessageContent(prompt) {
  const binding = SPresetSettings.MessageInjections?.[prompt?.identifier];
  const hasStructuredData = binding?.enabled && Boolean(
    binding.reasoning
    || binding.signature
    || binding.toolCalls?.length
    || binding.toolResults?.length,
  );
  if (hasStructuredData && !prompt.content) prompt.content = SPRESET_EMPTY_MESSAGE_PLACEHOLDER;
  return prompt;
}

function buildSPresetGenericToolCalls(config, provider) {
  const canUseTopLevelToolSignature = provider.adapter === 'gemini'
    || (provider.adapter === 'openrouter' && /google\/gemini/i.test(provider.model || ''));
  return config.toolCalls.map((call, index) => {
    const signature = call.signature || (canUseTopLevelToolSignature && index === 0 ? config.signature : '');
    return {
      id: call.id,
      type: 'function',
      function: {
        name: call.name,
        arguments: JSON.stringify(call.arguments ?? {}),
      },
      ...(signature ? { signature } : {}),
    };
  });
}

function buildSPresetGeminiContentParts(baseMessage, injectedToolCalls, hadEmptyPlaceholder) {
  const sourceParts = Array.isArray(baseMessage.content)
    ? cloneSPresetData(baseMessage.content)
    : (!hadEmptyPlaceholder
      && baseMessage.content !== undefined
      && baseMessage.content !== null
      && String(baseMessage.content).length > 0
        ? [{ type: 'text', text: String(baseMessage.content) }]
        : []);
  const parts = [];
  const toolCalls = [];
  const seenToolCalls = new Set();
  let toolCallPartIndex = -1;

  const appendToolCall = call => {
    if (!call || typeof call !== 'object') return;
    const id = String(call.id || '').trim();
    let fallbackKey = '';
    try {
      fallbackKey = JSON.stringify(call);
    } catch {
      fallbackKey = String(toolCalls.length);
    }
    const key = id ? `id:${id}` : `value:${fallbackKey}`;
    if (seenToolCalls.has(key)) return;
    seenToolCalls.add(key);
    toolCalls.push(cloneSPresetData(call));
  };

  for (const part of sourceParts) {
    if (part && typeof part === 'object' && part.type === 'tool_calls' && Array.isArray(part.tool_calls)) {
      if (toolCallPartIndex < 0) toolCallPartIndex = parts.length;
      part.tool_calls.forEach(appendToolCall);
      continue;
    }
    parts.push(typeof part === 'string' ? { type: 'text', text: part } : part);
  }
  if (Array.isArray(baseMessage.tool_calls)) baseMessage.tool_calls.forEach(appendToolCall);
  injectedToolCalls.forEach(appendToolCall);

  if (toolCalls.length > 0) {
    const toolCallPart = { type: 'tool_calls', tool_calls: toolCalls };
    if (toolCallPartIndex < 0) parts.push(toolCallPart);
    else parts.splice(Math.min(toolCallPartIndex, parts.length), 0, toolCallPart);
  }
  return parts;
}

function applySPresetMessageInjection(baseMessage, config, provider = getSPresetCurrentProvider()) {
  const result = [];
  const toolCalls = buildSPresetGenericToolCalls(config, provider);
  const hasBaseToolCalls = Array.isArray(baseMessage.tool_calls) && baseMessage.tool_calls.length > 0;
  const message = { ...baseMessage };
  const hadEmptyPlaceholder = baseMessage.content === SPRESET_EMPTY_MESSAGE_PLACEHOLDER;
  if (hadEmptyPlaceholder) message.content = '';
  const hasClaudeThinking = provider.adapter === 'claude' && Boolean(config.reasoning && config.signature);
  const hasAssistantMetadata = toolCalls.length > 0
    || (provider.adapter === 'gemini' && hasBaseToolCalls)
    || (provider.adapter === 'claude' && hasClaudeThinking)
    || (provider.adapter === 'gemini' && Boolean(config.reasoning || config.signature))
    || (provider.adapter === 'openrouter' && Boolean(config.reasoning || config.signature))
    || (provider.adapter === 'deepseek' && Boolean(config.reasoning));

  if (hasAssistantMetadata) message.role = 'assistant';

  if (provider.adapter === 'claude' && (hasClaudeThinking || toolCalls.length > 0)) {
    const blocks = [];
    if (hasClaudeThinking) {
      blocks.push({ type: 'thinking', thinking: config.reasoning, signature: config.signature });
    }
    if (Array.isArray(baseMessage.content)) {
      blocks.push(...cloneSPresetData(baseMessage.content));
    } else if (!hadEmptyPlaceholder && baseMessage.content !== undefined && baseMessage.content !== null && String(baseMessage.content).length > 0) {
      blocks.push({ type: 'text', text: String(baseMessage.content) });
    }
    config.toolCalls.forEach(call => {
      blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: cloneSPresetData(call.arguments) });
    });
    message.content = blocks.length ? blocks : [{ type: 'text', text: '\u200b' }];
    delete message.tool_calls;
    delete message.tool_call_id;
    delete message.reasoning;
    delete message.reasoning_content;
    delete message.signature;
  } else {
    if (provider.adapter === 'gemini') {
      if (toolCalls.length > 0 || hasBaseToolCalls) {
        // Gemini's converter only reads tool calls from content when content is
        // already an array. Its scalar-content branch otherwise replaces the
        // text with tool_calls, so normalize both into one parts array here.
        message.content = buildSPresetGeminiContentParts(baseMessage, toolCalls, hadEmptyPlaceholder);
        delete message.tool_calls;
      }
      if (config.reasoning) message.reasoning = config.reasoning;
      const signatureMovedToFirstTool = toolCalls.length > 0
        && !config.toolCalls[0]?.signature
        && toolCalls[0].signature === config.signature;
      if (config.signature && !signatureMovedToFirstTool) message.signature = config.signature;
    } else if (provider.adapter === 'openrouter') {
      if (toolCalls.length > 0) message.tool_calls = toolCalls;
      if (config.reasoning) message.reasoning = config.reasoning;
      const signatureMovedToFirstTool = toolCalls.length > 0
        && !config.toolCalls[0]?.signature
        && toolCalls[0].signature === config.signature;
      if (config.signature && !signatureMovedToFirstTool) message.signature = config.signature;
    } else if (provider.adapter === 'deepseek') {
      if (toolCalls.length > 0) message.tool_calls = toolCalls;
      if (config.reasoning) message.reasoning_content = config.reasoning;
      delete message.signature;
    } else if (toolCalls.length > 0) {
      message.tool_calls = toolCalls;
    }
  }
  if (!(hadEmptyPlaceholder && !hasAssistantMetadata && config.toolResults.length > 0)) {
    result.push(message);
  }

  if (config.toolResults.length > 0) {
    if (provider.adapter === 'claude') {
      result.push({
        role: 'user',
        content: config.toolResults.map(toolResult => ({
          type: 'tool_result',
          tool_use_id: toolResult.toolCallId,
          content: stringifySPresetMessageValue(toolResult.content),
          ...(toolResult.isError ? { is_error: true } : {}),
        })),
      });
    } else {
      config.toolResults.forEach(toolResult => {
        result.push({
          role: 'tool',
          tool_call_id: toolResult.toolCallId,
          content: stringifySPresetMessageValue(toolResult.content),
        });
      });
    }
  }
  return result;
}

function getSPresetFlattenedMessageSources(messageCollection) {
  const sources = [];
  for (const item of messageCollection?.collection || []) {
    if (item instanceof SPresetImports.MessageCollection) {
      for (const message of item.collection || []) {
        if (message?.content || message?.tool_calls) sources.push(message);
      }
    } else if (item instanceof SPresetImports.Message && (item.content || item.tool_calls)) {
      sources.push(item);
    }
  }
  return sources;
}

function serializeSPresetSourceMessage(message) {
  return {
    role: message.role,
    content: cloneSPresetData(message.content),
    ...(message.name ? { name: message.name } : {}),
    ...(message.tool_calls ? { tool_calls: cloneSPresetData(message.tool_calls) } : {}),
    ...(message.role === 'tool' ? { tool_call_id: message.identifier } : {}),
    ...(message.signature ? { signature: message.signature } : {}),
    ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    __spresetIdentifier: message.identifier,
  };
}

function squashSPresetSnapshotMessages(messages) {
  const excludeList = ['newMainChat', 'newChat', 'groupNudge'];
  const squashed = [];
  for (const sourceMessage of messages) {
    const message = { ...sourceMessage };
    const identifier = message.__spresetIdentifier;
    delete message.__spresetIdentifier;
    if (message.role === 'system' && !message.content) continue;
    const shouldSquash = message.role === 'system' && !message.name && !excludeList.includes(identifier);
    const previous = squashed.at(-1);
    const previousShouldSquash = previous?.role === 'system'
      && !previous?.name
      && !excludeList.includes(previous?.__spresetSourceIdentifier);
    if (shouldSquash && previousShouldSquash) {
      previous.content += `\n${message.content}`;
      continue;
    }
    Object.defineProperty(message, '__spresetSourceIdentifier', { value: identifier, configurable: true });
    squashed.push(message);
  }
  squashed.forEach(message => delete message.__spresetSourceIdentifier);
  return squashed;
}

function applySPresetMessageInjections(chat, messageCollectionOrSources) {
  if (!Array.isArray(chat) || !SPresetSettings.MessageInjections) return chat;
  const sources = Array.isArray(messageCollectionOrSources)
    ? messageCollectionOrSources
    : getSPresetFlattenedMessageSources(messageCollectionOrSources);
  if (sources.length !== chat.length) {
    console.warn('[SPreset-MessageInjection] 消息映射数量不一致，已跳过注入。', sources.length, chat.length);
    return chat;
  }
  const provider = getSPresetCurrentProvider();
  return chat.flatMap((message, index) => {
    const binding = SPresetSettings.MessageInjections?.[sources[index]?.identifier];
    if (!binding?.enabled) return [message];
    const validation = validateSPresetMessageInjection(binding);
    if (!validation.valid) {
      console.warn(`[SPreset-MessageInjection] ${sources[index]?.identifier} 配置无效，已跳过：`, validation.errors);
      return [message];
    }
    return applySPresetMessageInjection(message, normalizeSPresetMessageInjection(binding), provider);
  });
}

function installSPresetMessageInjectionHook() {
  const promptManager = SPresetImports?.promptManager;
  if (!promptManager || promptManager.__spresetMessageInjectionHooked) return;
  const originalSetChatCompletion = promptManager.setChatCompletion;
  if (typeof originalSetChatCompletion !== 'function') {
    console.warn('[SPreset-MessageInjection] 当前酒馆版本没有 setChatCompletion，无法安装结构化消息注入。');
    return;
  }
  promptManager.setChatCompletion = function (chatCompletion) {
    if (chatCompletion && typeof chatCompletion.getChat === 'function' && !chatCompletion.__spresetMessageInjectionHooked) {
      const snapshotSources = getSPresetFlattenedMessageSources(chatCompletion.messages);
      const hasActiveInjection = snapshotSources.some(message => SPresetSettings.MessageInjections?.[message.identifier]?.enabled);
      const snapshot = hasActiveInjection ? {
        sources: snapshotSources.map(message => ({ identifier: message.identifier })),
        chat: snapshotSources.map(serializeSPresetSourceMessage),
      } : null;
      const originalGetChat = chatCompletion.getChat;
      chatCompletion.getChat = function (...args) {
        const chat = originalGetChat.apply(this, args);
        const currentSources = getSPresetFlattenedMessageSources(this.messages);
        if (snapshot && currentSources.length !== snapshot.sources.length) {
          const injectedSnapshot = applySPresetMessageInjections(snapshot.chat, snapshot.sources);
          return squashSPresetSnapshotMessages(injectedSnapshot);
        }
        return applySPresetMessageInjections(chat, this.messages);
      };
      Object.defineProperty(chatCompletion, '__spresetMessageInjectionHooked', { value: true });
    }
    return originalSetChatCompletion.apply(this, arguments);
  };
  Object.defineProperty(promptManager, '__spresetMessageInjectionHooked', { value: true });
}

// inject SPresetEditor
if (true) {
  // fetch html file
  fetch('https://jnai2d9kgnbs6xzx5c.com/regex_bind/bundled.html')
    .then(res => res.text())
    .then(htmlText => {
      // create iframe with text as same-origin iframe
      const iframe = document.createElement('iframe');
      iframe.srcdoc = htmlText;
      iframe.sandbox.add('allow-same-origin');
      iframe.sandbox.add('allow-scripts');
      iframe.sandbox.add('allow-popups');
      iframe.sandbox.add('allow-popups-to-escape-sandbox');
      iframe.sandbox.add('allow-top-navigation');
      iframe.sandbox.add('allow-top-navigation-by-user-activation');
      iframe.sandbox.add('allow-pointer-lock');
      iframe.sandbox.add('allow-storage-access-by-user-activation');
      iframe.sandbox.add('allow-modals'); // 添加这个权限以允许 alert/prompt/confirm
      // inject SPresetButton styles
      if (!document.getElementById('spreset-button-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'spreset-button-styles';
        styleSheet.textContent = `
        .spreset-button-container {
          position: relative;
          margin: 12px 0;
          width: 100%;
        }
        
        .spreset-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 50%, #e8f4f8 100%);
          border: 1px solid #b3d9e6;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(100, 180, 255, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        
        .spreset-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(135, 206, 250, 0.4),
            rgba(173, 216, 230, 0.6),
            rgba(135, 206, 250, 0.4),
            transparent
          );
          transition: left 0.5s ease;
        }
        
        .spreset-btn:hover::before {
          left: 100%;
        }
        
        .spreset-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(135, 206, 250, 0.15) 60deg,
            transparent 120deg,
            rgba(173, 216, 230, 0.2) 180deg,
            transparent 240deg,
            rgba(135, 206, 250, 0.15) 300deg,
            transparent 360deg
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: rotate-glow 4s linear infinite;
          pointer-events: none;
        }
        
        .spreset-btn:hover::after {
          opacity: 1;
        }
        
        @keyframes rotate-glow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spreset-btn:hover {
          border-color: #87ceeb;
          box-shadow: 0 6px 25px rgba(100, 180, 255, 0.4),
                      0 0 30px rgba(135, 206, 250, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }
        
        .spreset-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(100, 180, 255, 0.3);
        }
        
        .spreset-btn-logo {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          z-index: 1;
          filter: drop-shadow(0 0 8px rgba(100, 180, 255, 0.6));
          transition: filter 0.3s ease, transform 0.3s ease;
        }
        
        .spreset-btn:hover .spreset-btn-logo {
          filter: drop-shadow(0 0 12px rgba(135, 206, 250, 0.8));
          transform: scale(1.1) rotate(5deg);
        }
        
        .spreset-btn-text {
          font-family: 'Segoe UI', 'SF Pro Display', -apple-system, sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #4a90e2 0%, #2c5aa0 50%, #4a90e2 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          z-index: 1;
          transition: all 0.3s ease;
        }
        
        .spreset-btn:hover .spreset-btn-text {
          animation: shimmer-text 1.5s ease infinite;
        }
        
        @keyframes shimmer-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .spreset-btn-arrow {
          margin-left: auto;
          font-size: 18px;
          color: #6bb6ff;
          z-index: 1;
          transition: transform 0.3s ease, color 0.3s ease;
        }
        
        .spreset-btn:hover .spreset-btn-arrow {
          transform: translateX(5px);
          color: #4a90e2;
        }
        
        /* Particle effect on hover */
        .spreset-btn-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          overflow: hidden;
        }
        
        .spreset-btn-particles span {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(135, 206, 250, 0.9) 0%, transparent 70%);
          border-radius: 50%;
          opacity: 0;
        }
        
        .spreset-btn:hover .spreset-btn-particles span {
          animation: float-particle 2s ease-in-out infinite;
        }
        
        .spreset-btn:hover .spreset-btn-particles span:nth-child(1) { left: 10%; animation-delay: 0s; }
        .spreset-btn:hover .spreset-btn-particles span:nth-child(2) { left: 30%; animation-delay: 0.3s; }
        .spreset-btn:hover .spreset-btn-particles span:nth-child(3) { left: 50%; animation-delay: 0.6s; }
        .spreset-btn:hover .spreset-btn-particles span:nth-child(4) { left: 70%; animation-delay: 0.9s; }
        .spreset-btn:hover .spreset-btn-particles span:nth-child(5) { left: 90%; animation-delay: 1.2s; }
        
        @keyframes float-particle {
          0% {
            bottom: 0;
            opacity: 0;
            transform: scale(0);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            bottom: 100%;
            opacity: 0;
            transform: scale(0.5);
          }
        }
        
        /* Border glow animation */
        .spreset-btn-border-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 10px;
          background: linear-gradient(45deg, 
            #87ceeb, #b0e0e6, #87ceeb, #b0e0e6, #87ceeb
          );
          background-size: 400% 400%;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: border-flow 3s ease infinite;
        }
        
        .spreset-btn:hover .spreset-btn-border-glow {
          opacity: 0.7;
        }
        
        @keyframes border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `;
        document.head.appendChild(styleSheet);
      }

      // inject SPresetButton
      const spresetButton = $(`
        <div class="spreset-button-container">
          <button class="spreset-btn">
            <div class="spreset-btn-border-glow"></div>
            <img class="spreset-btn-logo" src="data:image/png;base64,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" alt="S" />
            <span class="spreset-btn-text">SPreset Editor</span>
            <span class="spreset-btn-arrow">→</span>
            <div class="spreset-btn-particles">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </button>
        </div>
      `);
      spresetButton.on('click', () => {
        document.body.appendChild(iframe);
      });
      $('#completion_prompt_manager').before(spresetButton);
    });
}

$(async () => {
  await fetch('/version')
    .then(res => res.json())
    .then(data => {
      const version = data.pkgVersion.split('.');
      window.versionNumber = parseInt(version[0]) * 10000 + parseInt(version[1]) * 100 + parseInt(version[2]);
    })
    .catch(() => {
      window.versionNumber = 10000;
    });
  importFromModule('SPresetImports', [
    {
      items: ['promptManager', 'MessageCollection', 'Message', 'sendOpenAIRequest'],
      from: './scripts/openai',
    },
    {
      items: ['streamingProcessor'],
      from: './script',
    },
    {
      items: ['getPresetManager'],
      from: './scripts/preset-manager',
    },
    {
      items: ['equalsIgnoreCaseAndAccents', 'getSanitizedFilename'],
      from: './scripts/utils',
    },
  ]);

  importFromModule('STVersionImports', [
    {
      items: ['displayVersion'],
      from: './script',
    },
  ]);

  ctx.eventSource.on('module_imported', data => {
    if (data.id === 'STVersionImports') {
      console.log('displayVersion', STVersionImports.displayVersion);
      const versionRegex = /1\.13\.[0-1]/;
      if (versionRegex.test(STVersionImports.displayVersion)) {
        oldST = true;
      }
    }
    if (data.id === 'SPresetImports') {
      const originalFunction = SPresetImports.promptManager.preparePrompt;
      let PromptClass = null;
      SPresetImports.promptManager.preparePrompt = function (prompt, original = null) {
        if (!SPresetSettings.MacroNest || !prompt.content) {
          const result = originalFunction.apply(this, [prompt, original]);
          return ensureSPresetStructuredMessageContent(result);
        }
        try {
          if (!PromptClass) {
            const originalResult = originalFunction.apply(this, [prompt, original]);
            PromptClass = originalResult.constructor;
          }

          const groupMembers = this.getActiveGroupCharacters();
          const preparedPrompt = Reflect.construct(PromptClass, [prompt]);

          if (typeof original === 'string') {
            /* eslint-disable-next-line */
            if (0 < groupMembers.length) {
              preparedPrompt.content = substituteParamsRecursive(
                prompt.content ?? '',
                null,
                null,
                original,
                groupMembers.join(', '),
              );
            } else {
              preparedPrompt.content = substituteParamsRecursive(prompt.content, null, null, original);
            }
          } else {
            /* eslint-disable-next-line */
            if (0 < groupMembers.length) {
              preparedPrompt.content = substituteParamsRecursive(
                prompt.content ?? '',
                null,
                null,
                null,
                groupMembers.join(', '),
              );
            } else {
              preparedPrompt.content = substituteParamsRecursive(prompt.content);
            }
          }
          return ensureSPresetStructuredMessageContent(preparedPrompt);
        } catch (error) {
          console.error('preparePrompt error', error);
          throw error;
        }
      };
      installSPresetMessageInjectionHook();
    }
  });

  reloadSettings();
  installSPresetFixedPresetNameImportHook();
  installSPresetOutputPreprocessingHooks();
  injectSPresetMenu();
  RegexBinding();
  loadSettingsToChatSquashForm = ChatSquash();
  loadSettingsToMacroNestForm = MacroNest();
  syncSPresetToolRegistrations();

  // 暴露工具绑定 API 供 iframe 编辑器调用
  window.SPresetToolBinding = {
    validateToolCode: validateSPresetToolCode,
    parseToolCodeToForm: parseSPresetToolCodeToForm,
    saveToolBinding(identifier, data) {
      const { uuidv4 } = SillyTavern.getContext();
      const shouldValidate = data.validate !== false;
      const validation = shouldValidate && data.code.trim() ? validateSPresetToolCode(data.code) : { valid: true, error: '' };

      if (!SPresetSettings.ToolBindings) {
        SPresetSettings.ToolBindings = {};
      }

      SPresetSettings.ToolBindings[identifier] = {
        enabled: data.enabled,
        code: data.code,
        valid: shouldValidate ? validation.valid : Boolean(data.valid),
        uuid: uuidv4(),
        resolvedName: validation.name || data.resolvedName || '',
        editorMode: data.editorMode === 'form' ? 'form' : 'code',
        form: data.form ? cloneSPresetData(data.form) : null,
      };

      // 持久化
      if (!ctx.chatCompletionSettings.extensions) {
        ctx.chatCompletionSettings.extensions = {};
      }
      ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
      if (getPrompt('SPresetSettings')) {
        setPrompt('SPresetSettings', JSON.stringify(SPresetSettings));
      } else {
        addPrompt('SPresetSettings', 'SPreset配置', JSON.stringify(SPresetSettings));
      }
      ctx.saveSettingsDebounced();

      // 重新同步注册
      syncSPresetToolRegistrations();

      return validation;
    },
    getToolBinding(identifier) {
      return SPresetSettings.ToolBindings?.[identifier] || null;
    },
    deleteToolBinding(identifier) {
      if (SPresetSettings.ToolBindings?.[identifier]) {
        delete SPresetSettings.ToolBindings[identifier];
        if (!ctx.chatCompletionSettings.extensions) {
          ctx.chatCompletionSettings.extensions = {};
        }
        ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
        if (getPrompt('SPresetSettings')) {
          setPrompt('SPresetSettings', JSON.stringify(SPresetSettings));
        } else {
          addPrompt('SPresetSettings', 'SPreset配置', JSON.stringify(SPresetSettings));
        }
        ctx.saveSettingsDebounced();
        syncSPresetToolRegistrations();
      }
    },
  };

  // 结构化消息编辑器桥接：配置随预设保存，发送时才读取当前 provider。
  window.SPresetMessageInjection = {
    validateMessageInjection: validateSPresetMessageInjection,
    getCurrentProvider: getSPresetCurrentProvider,
    getMessageInjection(identifier) {
      return cloneSPresetData(SPresetSettings.MessageInjections?.[identifier] || null);
    },
    saveMessageInjection(identifier, data) {
      const validation = data.validate === false ? { valid: true, errors: [] } : validateSPresetMessageInjection(data);
      if (!validation.valid) return validation;
      if (!SPresetSettings.MessageInjections) SPresetSettings.MessageInjections = {};
      SPresetSettings.MessageInjections[identifier] = normalizeSPresetMessageInjection(data);
      persistSPresetSettings();
      return { valid: true, errors: [] };
    },
    deleteMessageInjection(identifier) {
      if (!SPresetSettings.MessageInjections?.[identifier]) return;
      delete SPresetSettings.MessageInjections[identifier];
      persistSPresetSettings();
    },
    previewMessageInjection(identifier, baseMessage = { role: 'assistant', content: '' }) {
      const binding = SPresetSettings.MessageInjections?.[identifier];
      return binding ? cloneSPresetData(applySPresetMessageInjection(baseMessage, binding)) : [cloneSPresetData(baseMessage)];
    },
    previewMessageInjectionData(data, baseMessage = { role: 'assistant', content: '' }) {
      const validation = validateSPresetMessageInjection(data);
      if (!validation.valid) throw new Error(validation.errors.join('；'));
      const normalized = normalizeSPresetMessageInjection(data);
      return cloneSPresetData(applySPresetMessageInjection(baseMessage, normalized));
    },
  };

  // Editor aggregate commit: stage every binding first, then persist and
  // refresh registrations once. This avoids partial saves and repeated
  // execution of tool-definition code when the Editor saves a workspace.
  window.SPresetEditorBridge = {
    getPresetFeatures() {
      return cloneSPresetData(getSPresetFeatures());
    },
    validatePresetFeatures(features) {
      return cloneSPresetData(validateSPresetFeatures(features));
    },
    getOutputPreprocessing() {
      return cloneSPresetData(normalizeSPresetOutputPreprocessing(SPresetSettings.OutputPreprocessing));
    },
    validateOutputPreprocessing(script) {
      return validateSPresetOutputPreprocessing(script);
    },
    async previewOutputPreprocessing(script, chunks) {
      return cloneSPresetData(await previewSPresetOutputPreprocessing(script, chunks));
    },
    commitBindings(data = {}) {
      // On 1.13.5+, the native preset regex array is authoritative and may have
      // been edited since SPreset's compatibility copy was last refreshed.
      // Include it in both the staged baseline and a possible rollback snapshot.
      const previousSettings = normalizeSPresetSettings(SPresetSettings);
      const nativeRegexes = ctx.chatCompletionSettings?.extensions?.regex_scripts;
      if (versionNumber >= 11305 && Array.isArray(nativeRegexes)) {
        previousSettings.RegexBinding = normalizeSPresetRegexBinding({
          ...previousSettings.RegexBinding,
          regexes: nativeRegexes,
        });
      }
      const nextSettings = cloneSPresetData(previousSettings);
      const { uuidv4 } = SillyTavern.getContext();
      let shouldSyncRegexes = false;
      if (!nextSettings.ToolBindings) nextSettings.ToolBindings = {};
      if (!nextSettings.MessageInjections) nextSettings.MessageInjections = {};

      for (const [identifier, binding] of Object.entries(data.toolBindings || {})) {
        if (!binding) {
          delete nextSettings.ToolBindings[identifier];
          continue;
        }
        nextSettings.ToolBindings[identifier] = {
          enabled: Boolean(binding.enabled),
          code: String(binding.code || ''),
          valid: Boolean(binding.valid),
          // A fresh UUID forces the live registry to replace edited code/schema.
          uuid: uuidv4(),
          resolvedName: String(binding.resolvedName || ''),
          editorMode: binding.editorMode === 'form' ? 'form' : 'code',
          form: binding.form ? cloneSPresetData(binding.form) : null,
        };
      }
      for (const [identifier, injection] of Object.entries(data.messageInjections || {})) {
        if (!injection) {
          delete nextSettings.MessageInjections[identifier];
          continue;
        }
        nextSettings.MessageInjections[identifier] = normalizeSPresetMessageInjection(injection);
      }
      for (const identifier of data.deletedIdentifiers || []) {
        delete nextSettings.ToolBindings[identifier];
        delete nextSettings.MessageInjections[identifier];
      }

      const hasFeatures = Object.prototype.hasOwnProperty.call(data, 'features');
      const featurePayload = isSPresetPlainObject(data.features) ? data.features : {};
      const featuresHaveOutputPreprocessing = Object.prototype.hasOwnProperty.call(featurePayload, 'outputPreprocessing')
        || Object.prototype.hasOwnProperty.call(featurePayload, 'OutputPreprocessing');
      if (hasFeatures) {
        const validation = validateSPresetFeatures(data.features, nextSettings);
        if (!validation.valid) return { valid: false, errors: validation.errors };
        applySPresetFeaturesToSettings(nextSettings, validation.features);
        shouldSyncRegexes = Object.prototype.hasOwnProperty.call(featurePayload, 'regexBinding')
          || Object.prototype.hasOwnProperty.call(featurePayload, 'RegexBinding');
      }

      // Backward compatibility for Editors that still commit this field at the root.
      if (Object.prototype.hasOwnProperty.call(data, 'outputPreprocessing') && !featuresHaveOutputPreprocessing) {
        const outputPreprocessing = normalizeSPresetOutputPreprocessing({
          ...normalizeSPresetOutputPreprocessing(nextSettings.OutputPreprocessing),
          ...(isSPresetPlainObject(data.outputPreprocessing) ? data.outputPreprocessing : {}),
        });
        if (outputPreprocessing.enabled) {
          const validation = validateSPresetOutputPreprocessing(outputPreprocessing.script);
          if (!validation.valid) return { valid: false, errors: [validation.error] };
        }
        nextSettings.OutputPreprocessing = outputPreprocessing;
      }

      try {
        SPresetSettings = nextSettings;
        if (shouldSyncRegexes) syncSPresetRegexesToCurrentST();
        persistSPresetSettings();
        syncSPresetToolRegistrations();
        return { valid: true, errors: [] };
      } catch (error) {
        SPresetSettings = previousSettings;
        try {
          if (shouldSyncRegexes) syncSPresetRegexesToCurrentST();
          persistSPresetSettings();
          syncSPresetToolRegistrations();
        } catch (rollbackError) {
          console.error('[SPreset Editor] 回滚绑定配置失败:', rollbackError);
        }
        throw error;
      }
    },
  };
});

function substituteParamsRecursive(
  content,
  _name1,
  _name2,
  _original,
  _group,
  _replaceCharacterCard = true,
  additionalMacro = {},
  postProcessFn = x => x,
) {
  let s = String(content);

  // 统一的解析调用 + 花括号保护，防止解析后的文本再被当作宏
  const resolveOne = inner => {
    const replaced = ctx
      .substituteParams(
        `{{${inner}}}`,
        _name1,
        _name2,
        _original,
        _group,
        _replaceCharacterCard,
        additionalMacro,
        postProcessFn,
      )
      .replaceAll('{', '<|lb|>')
      .replaceAll('}', '<|rb|>');
    return String(replaced);
  };

  // 使用栈进行由左到右扫描；遇到 }} 立即解析最近的 {{...}}
  // 顺序会是：先解最早遇到的外层里的最内层，再回到外层 —— 即你要的 1-3-4-2-6-5
  const MAX_STEPS = 1_000_000; // 防御型上限
  let steps = 0;

  while (true) {
    let i = 0;
    const stack = [];
    let replacedThisRound = false;

    while (i < s.length) {
      if (++steps > MAX_STEPS) {
        throw new Error('resolveMacrosSync: exceeded MAX_STEPS (可能存在未闭合的大括号或异常增长)');
      }

      // 命中 {{ 入栈
      if (s[i] === '{' && s[i + 1] === '{') {
        stack.push(i);
        i += 2;
        continue;
      }

      // 命中 }} 出栈并立刻解析替换
      if (s[i] === '}' && s[i + 1] === '}') {
        if (stack.length > 0) {
          const start = stack.pop();
          const inner = s.slice(start + 2, i);
          const replacement = resolveOne(inner.replaceAll('{', '<|lb|>').replaceAll('}', '<|rb|>'));

          // 原位替换： [0,start) + replacement + (i+2,end)
          s = s.slice(0, start) + replacement + s.slice(i + 2);

          // 将扫描指针放到替换后片段的末尾，继续向右扫
          i = start + replacement.length;
          replacedThisRound = true;
          continue;
        } else {
          // 孤立的 }}，跳过
          i += 2;
          continue;
        }
      }

      i += 1;
    }

    // 本轮没有任何替换则结束
    if (!replacedThisRound) break;
  }

  // 还原之前对花括号的保护
  return s.replaceAll('<|lb|>', '{').replaceAll('<|rb|>', '}');
}

function reloadSettings() {
  const defaultPresetSettings = normalizeSPresetSettings({});
  const defaultGlobalSettings = {
    RegexBinding: {},
  };
  if (oldST || !ctx.chatCompletionSettings.extensions || !ctx.chatCompletionSettings.extensions.SPreset) {
    if (!ctx.chatCompletionSettings.extensions) {
      ctx.chatCompletionSettings.extensions = {};
    }
    const settingsFromPrompt = getPrompt('SPresetSettings');
    if (settingsFromPrompt) {
      ctx.chatCompletionSettings.extensions.SPreset = JSON.parse(settingsFromPrompt);
    }
  }
  const temp1 = ctx.chatCompletionSettings.extensions.SPreset;
  const temp2 = ctx.extensionSettings.SPreset;
  SPresetSettings = normalizeSPresetSettings(temp1 || defaultPresetSettings);
  ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
  SGlobalSettings = isSPresetPlainObject(temp2) ? temp2 : defaultGlobalSettings;
  if (!isSPresetPlainObject(SGlobalSettings.RegexBinding)) {
    SGlobalSettings.RegexBinding = {};
  }
}

function injectSPresetMenu() {
  const menuButton = $(`
    <div id="open_s_preset_menu" class="menu_button menu_button_icon interactable" title="打开预设增强菜单" tabindex="0">
      <i class="fa-fw fa-solid fa-s" style="color: #ff0000;"></i>
    </div>
  `);
  $('#openai_preset_import_file').before(menuButton);

  // 绑定菜单按钮点击事件
  menuButton.on('click', openSPresetMenu);

  function openSPresetMenu() {
    reloadSettings();
    loadSettingsToChatSquashForm();
    loadSettingsToMacroNestForm();
    ctx.callGenericPopup(settingsDom.get(0), ctx.POPUP_TYPE.DISPLAY);
  }

  // 初始化所有功能模块
  initializeMenuSections();
}

// 添加功能模块到菜单的函数
function addMenuSection(sectionId, title, content, css = null) {
  if (css) {
    injectCssStyles(`styles_${sectionId}`, css);
  }
  const sectionHtml = $(`
    <div id="${sectionId}_section" class="${sectionId.replace('_', '-')}">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>${title}</b>
            <div class="inline-drawer-icon fa-solid interactable up fa-circle-chevron-up" tabindex="0"></div>
        </div>
        <div class="inline-drawer-content" style="display: none">
          ${content}
        </div>
      </div>
    </div>
    <hr />
  `);

  settingsDom.append(sectionHtml);
  return sectionHtml;
}

function injectCssStyles(id, css) {
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
}

// 初始化所有功能模块
function initializeMenuSections() {
  // 清空现有内容
  console.log('initializeMenuSections');
  console.log(settingsDom);
  settingsDom.empty();
  settingsDom.append($(`<h3><strong>预设增强功能</strong></h3>`));
  injectCssStyles(
    's_preset_settings_css',
    `
  #s_preset_settings {
    max-height: 600px;
    overflow-y: auto;
  }
  `,
  );
}

const MacroNest = () => {
  const macroNestMenuItems = `
    <div class="inline-drawer-content" style="display: block;">
      <label class="flex-container">
        <input type="checkbox" id="macro_nest_enabled"><span>启用宏嵌套</span>
      </label>
    </div>
  `;
  const menu = addMenuSection('macro_nest', '宏嵌套', macroNestMenuItems);
  menu.find('#macro_nest_enabled').on('change', function () {
    SPresetSettings.MacroNest = this.checked;
    if (!ctx.chatCompletionSettings.extensions) {
      ctx.chatCompletionSettings.extensions = {};
    }
    ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
    if (getPrompt('SPresetSettings')) {
      setPrompt('SPresetSettings', JSON.stringify(SPresetSettings));
    } else {
      addPrompt('SPresetSettings', 'SPreset配置', JSON.stringify(SPresetSettings));
    }
    ctx.saveSettingsDebounced();
  });
  function loadSettingsToForm() {
    menu.find('#macro_nest_enabled').prop('checked', SPresetSettings.MacroNest);
  }
  return loadSettingsToForm;
};

const ChatSquash = () => {
  const chatSquashMenuItems = `
    <div class="inline-drawer-content" style="display: block;">
			<label class="flex-container">
				<input type="checkbox" id="squash_enabled"><span>启用提示词合并</span>
			</label>
      <div id="squash_enabled_content" style="display: none;">

            <div class="flex-container" title="仅当提示词中包含目标 Tag 时启用合并，并从提示词中删除该 Tag">
                <input type="checkbox" id="squash_conditional_enabled"><span>按 Tag 条件启用</span>
            </div>
            <div class="flex-container flexFlowColumn" title="用于触发提示词合并的 Tag（按原样匹配）">
                <label for="squash_conditional_tag">目标 Tag</label>
                <input id="squash_conditional_tag" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off" placeholder="例如：<merge>">
            </div>

            <hr>

            <div class="flex-container" title="仅合并聊天记录">
                <input type="checkbox" id="separate_chat_history"><span>仅合并聊天记录</span>
            </div>
            <div class="flex-container" title="解析clewd标记">
                <input type="checkbox" id="parse_clewd"><span>解析clewd标记</span>
            </div>
            <div class="flex-container" title="系统消息用户角色">
                <input type="checkbox" id="user_role_system"><span>系统消息用户角色</span>
            </div>

            <hr>

            <div class="flex-container flexFlowColumn">
                <label for="squash_role">
                     合并至角色
                </label>
                <select id="squash_role" class="text_pole">
                    <option value="system">系统</option>
                    <option value="user">用户</option>
                    <option value="assistant">模型</option>
                    <option value="follow">上一个角色</option>
                </select>
            </div>

            <hr>

            <div class="flex-container flexFlowColumn" title="停止字符">
                <label for="stop_string">
                    停止字符
                </label>
                <div class="flex-container" title="Enable stop string">
                    <input type="checkbox" id="enable_stop_string"><span>启用停止字符</span>
                </div>
                <div class="flex-container">
                    <input id="stop_string" name="stop_string" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off">
                </div>
            </div>

            <hr>

            <div class="flex-container flexFlowColumn" title="用户消息前缀">
                <label for="user_prefix">用户消息前缀</label>
                <div class="flex-container">
                    <textarea id="user_prefix" name="user_prefix" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            <div class="flex-container flexFlowColumn" title="用户消息后缀">
                <label for="user_suffix">用户消息后缀</label>
                <div class="flex-container">
                    <textarea id="user_suffix" name="user_suffix" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            <div class="flex-container flexFlowColumn" title="角色消息前缀">
                <label for="char_prefix">
                    角色消息前缀
                </label>
                <div class="flex-container">
                    <textarea id="char_prefix" name="char_prefix" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            <div class="flex-container flexFlowColumn" title="角色消息后缀">
                <label for="char_suffix">
                    角色消息后缀
                </label>
                <div class="flex-container">
                    <textarea id="char_suffix" name="char_suffix" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            <div class="flex-container flexFlowColumn" title="系统消息前缀">
                <label for="prefix_system">
                    系统消息前缀
                </label>
                <div class="flex-container">
                    <textarea id="prefix_system" name="prefix_system" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            <div class="flex-container flexFlowColumn" title="系统消息后缀">
                <label for="suffix_system">
                    系统消息后缀
                </label>
                <div class="flex-container">
                    <textarea id="suffix_system" name="suffix_system" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>

            
            <hr>
            <strong class="noass-center-text">后处理</strong>

            <div class="flex-container flexFlowColumn" title="不压缩部分">
                <label for="squashed_separator_string">
                    <strong>不压缩标记</strong>
                </label>
                <div class="flex-container" title="启用不压缩标记">
                    <input type="checkbox" id="enable_squashed_separator"><span>启用不压缩标记</span>
                </div>
                <div class="flex-container" title="Regex mode for squashed history separator.">
                    <input type="checkbox" id="squashed_separator_regex"><span>正则模式</span>
                </div>
                <div class="flex-container">
                    <input id="squashed_separator_string" class="text_pole flex1 wide100p" maxlength="500" size="35" type="text" autocomplete="off">
                </div>

                <hr>
            </div>
            <div class="flex-container" title="合并后处理后，将提示词按前后缀重新拆分回不同角色的独立消息">
                <input type="checkbox" id="re_split"><span>重新拆分提示词</span>
            </div>
            <hr>
        </div>
        <div id="chat_post_script_content" class="flex-container flexFlowColumn">
            <strong>聊天记录后处理脚本</strong>
            <div class="flex-container" title="启用后处理脚本">
                <input type="checkbox" id="squashed_post_script_enable"><span>启用后处理脚本</span>
            </div>
            <small class="notes">
                开启合并时，脚本参数为合并后的字符串并应返回字符串；关闭合并时，参数为原始消息对象数组，可原地修改或返回新数组。
            </small>
            <div class="flex-container flexFlowColumn">
                <label for="squashed_post_script">
                    脚本内容
                </label>
                <div class="flex-container">
                    <textarea id="squashed_post_script" class="text_pole flex1 wide100p" size="35" type="text" autocomplete="off"></textarea>
                </div>
            </div>
        </div>
    </div>
  `;
  const menu = addMenuSection('chat_squash', '聊天记录合并与后处理', chatSquashMenuItems);
  menu.find('#squash_enabled').on('change', function () {
    $('#squash_enabled_content').css({
      display: $(this).prop('checked') ? 'block' : 'none',
    });
    saveSettingsFromForm();
  });

  menu.find('#squash_enabled_content').on('change', function () {
    saveSettingsFromForm();
  });

  menu.find('#chat_post_script_content').on('change', function () {
    saveSettingsFromForm();
  });

  loadSettingsToForm();

  function loadSettingsToForm() {
    console.debug('loadSettingsToForm');
    menu.find('#squash_enabled').prop('checked', SPresetSettings.ChatSquash.enabled);
    menu.find('#squash_conditional_enabled').prop('checked', SPresetSettings.ChatSquash.conditional_enabled);
    menu.find('#squash_conditional_tag').val(SPresetSettings.ChatSquash.conditional_tag);
    menu.find('#separate_chat_history').prop('checked', SPresetSettings.ChatSquash.separate_chat_history);
    menu.find('#parse_clewd').prop('checked', SPresetSettings.ChatSquash.parse_clewd);
    menu.find('#user_role_system').prop('checked', SPresetSettings.ChatSquash.user_role_system);
    menu.find('#squash_role').val(SPresetSettings.ChatSquash.role);
    menu.find('#stop_string').val(SPresetSettings.ChatSquash.stop_string);
    menu.find('#enable_stop_string').prop('checked', SPresetSettings.ChatSquash.enable_stop_string);
    menu.find('#user_prefix').val(SPresetSettings.ChatSquash.user_prefix);
    menu.find('#user_suffix').val(SPresetSettings.ChatSquash.user_suffix);
    menu.find('#char_prefix').val(SPresetSettings.ChatSquash.char_prefix);
    menu.find('#char_suffix').val(SPresetSettings.ChatSquash.char_suffix);
    menu.find('#prefix_system').val(SPresetSettings.ChatSquash.prefix_system);
    menu.find('#suffix_system').val(SPresetSettings.ChatSquash.suffix_system);
    menu.find('#enable_squashed_separator').prop('checked', SPresetSettings.ChatSquash.enable_squashed_separator);
    menu.find('#squashed_separator_regex').prop('checked', SPresetSettings.ChatSquash.squashed_separator_regex);
    menu.find('#squashed_separator_string').val(SPresetSettings.ChatSquash.squashed_separator_string);
    menu.find('#squashed_post_script_enable').prop('checked', SPresetSettings.ChatSquash.squashed_post_script_enable);
    menu.find('#squashed_post_script').val(SPresetSettings.ChatSquash.squashed_post_script);
    menu.find('#re_split').prop('checked', SPresetSettings.ChatSquash.re_split);
    menu.find('#squash_enabled_content').css({
      display: menu.find('#squash_enabled').prop('checked') ? 'block' : 'none',
    });
  }

  function saveSettingsFromForm() {
    console.debug('saveSettingsFromForm');
    SPresetSettings.ChatSquash.enabled = menu.find('#squash_enabled').prop('checked');
    SPresetSettings.ChatSquash.conditional_enabled = menu.find('#squash_conditional_enabled').prop('checked');
    SPresetSettings.ChatSquash.conditional_tag = menu.find('#squash_conditional_tag').val();
    SPresetSettings.ChatSquash.separate_chat_history = menu.find('#separate_chat_history').prop('checked');
    SPresetSettings.ChatSquash.parse_clewd = menu.find('#parse_clewd').prop('checked');
    SPresetSettings.ChatSquash.user_role_system = menu.find('#user_role_system').prop('checked');
    SPresetSettings.ChatSquash.role = menu.find('#squash_role').val();
    SPresetSettings.ChatSquash.stop_string = menu.find('#stop_string').val();
    SPresetSettings.ChatSquash.enable_stop_string = menu.find('#enable_stop_string').prop('checked');
    SPresetSettings.ChatSquash.user_prefix = menu.find('#user_prefix').val();
    SPresetSettings.ChatSquash.user_suffix = menu.find('#user_suffix').val();
    SPresetSettings.ChatSquash.char_prefix = menu.find('#char_prefix').val();
    SPresetSettings.ChatSquash.char_suffix = menu.find('#char_suffix').val();
    SPresetSettings.ChatSquash.prefix_system = menu.find('#prefix_system').val();
    SPresetSettings.ChatSquash.suffix_system = menu.find('#suffix_system').val();
    SPresetSettings.ChatSquash.enable_squashed_separator = menu.find('#enable_squashed_separator').prop('checked');
    SPresetSettings.ChatSquash.squashed_separator_regex = menu.find('#squashed_separator_regex').prop('checked');
    SPresetSettings.ChatSquash.squashed_separator_string = menu.find('#squashed_separator_string').val();
    SPresetSettings.ChatSquash.squashed_post_script_enable = menu.find('#squashed_post_script_enable').prop('checked');
    SPresetSettings.ChatSquash.squashed_post_script = menu.find('#squashed_post_script').val();
    SPresetSettings.ChatSquash.re_split = menu.find('#re_split').prop('checked');
    if (!ctx.chatCompletionSettings.extensions) {
      ctx.chatCompletionSettings.extensions = {};
    }
    ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
    if (getPrompt('SPresetSettings')) {
      setPrompt('SPresetSettings', JSON.stringify(SPresetSettings));
    } else {
      addPrompt('SPresetSettings', 'SPreset配置', JSON.stringify(SPresetSettings));
    }
    ctx.saveSettingsDebounced();
  }

  const listenerList = ctx.eventSource.events[ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY];
  if (listenerList) {
    for (let i = 0; i < listenerList.length; i++) {
      if (listenerList[i].toString().includes('merge config >>>>>>>>>>>>> Final Message Structure <<<<<<<<<<<<<<<<<')) {
        const originalListener = listenerList[i];
        listenerList[i] = data1 => {
          if (!SPresetSettings.ChatSquash.enabled) {
            return originalListener(data1);
          }
          return;
        };
      }
    }
  }

  const originalOn = ctx.eventSource.on;
  ctx.eventSource.on = function (event, listener) {
    // 都他妈别跟我抢
    if (event === ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY) {
      if (listener.toString().includes('merge config >>>>>>>>>>>>> Final Message Structure <<<<<<<<<<<<<<<<<')) {
        return originalOn.apply(this, [
          event,
          data => {
            if (!SPresetSettings.ChatSquash.enabled) {
              return listener(data);
            }
            return;
          },
        ]);
      }
      return originalOn.apply(this, [event, listener]);
    }
    return originalOn.apply(this, [event, listener]);
  };

  const handleChatCompletionPromptReady = data => {
    if (!Array.isArray(data?.prompt)) {
      return;
    }

    const settings = SPresetSettings.ChatSquash;
    if (!settings.enabled) {
      postProcessOriginalMessages(data.prompt);
      globalThis.SToolBookPromptCompat?.applySeamlessPromptInjection?.(data.prompt, 'SPreset/GENERATE_AFTER_DATA/bypass');
      return;
    }

    if (!consumeConditionalTag(data.prompt)) {
      globalThis.SToolBookPromptCompat?.applySeamlessPromptInjection?.(
        data.prompt,
        'SPreset/GENERATE_AFTER_DATA/conditional-bypass',
      );
      return;
    }

    const restoreSeamlessTail = () => {
      globalThis.SToolBookPromptCompat?.applySeamlessPromptInjection?.(data.prompt, 'SPreset/GENERATE_AFTER_DATA');
    };
    console.log('data', data);
    const promptManager = SPresetImports.promptManager;
    if (settings.separate_chat_history) {
      data.prompt.length = 0;
      data.prompt.push(...getChat(promptManager));
      consumeConditionalTag(data.prompt);
      console.log('data.prompt', data.prompt);
    } else {
      squashPrompts(data.prompt);
    }

    function getChat(chatData) {
      const chat = [];
      const toSquash = [];
      for (const item of chatData.messages.collection) {
        if (item instanceof SPresetImports.MessageCollection) {
          if (item.identifier === 'chatHistory') {
            chat.push(...squashPrompts(item.getChat()));
          } else {
            chat.push(...item.getChat());
          }
        } else if (item instanceof SPresetImports.Message && (item.content || item.tool_calls)) {
          const message = {
            role: item.role,
            content: item.content,
            ...(item.name ? { name: item.name } : {}),
            ...(item.tool_calls ? { tool_calls: item.tool_calls } : {}),
            ...(item.role === 'tool' ? { tool_call_id: item.identifier } : {}),
          };
          if (item.identifier.startsWith('chatHistory')) {
            toSquash.push(message);
          } else {
            if (toSquash.length > 0) {
              chat.push(...squashPrompts(toSquash));
              toSquash.length = 0;
            }
            chat.push(message);
          }
        } else {
          console.warn(`Skipping invalid or empty message in collection: ${JSON.stringify(item)}`);
        }
      }
      return chat;
    }
  };

  function consumeConditionalTag(prompts) {
    const settings = SPresetSettings.ChatSquash;
    if (!settings.conditional_enabled) {
      return true;
    }

    const tag = String(settings.conditional_tag || '');
    if (!tag) {
      return false;
    }

    let matched = false;
    const removeTag = value => {
      if (typeof value === 'string') {
        if (!value.includes(tag)) return value;
        matched = true;
        return value.split(tag).join('');
      }
      if (Array.isArray(value)) {
        return value.map(removeTag);
      }
      if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
          value[key] = removeTag(value[key]);
        }
      }
      return value;
    };

    for (const prompt of prompts) {
      if (prompt && Object.prototype.hasOwnProperty.call(prompt, 'content')) {
        prompt.content = removeTag(prompt.content);
      }
    }
    return matched;
  }

  ctx.eventSource.on(ctx.eventTypes.APP_READY, data => {
    console.log('APP_READY', data);
    ctx.eventSource.makeLast(ctx.eventTypes.GENERATE_AFTER_DATA, handleChatCompletionPromptReady);
    const listenerList = ctx.eventSource.events[ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY];
    if (listenerList) {
      for (let i = 0; i < listenerList.length; i++) {
        if (
          listenerList[i].toString().includes('merge config >>>>>>>>>>>>> Final Message Structure <<<<<<<<<<<<<<<<<')
        ) {
          const originalListener = listenerList[i];
          listenerList[i] = data1 => {
            if (!SPresetSettings.ChatSquash.enabled) {
              return originalListener(data1);
            }
            return;
          };
        }
      }
    }
  });
  ctx.eventSource.on(ctx.eventTypes.SETTINGS_UPDATED, data => {
    console.log('APP_READY', data);
    ctx.eventSource.makeLast(ctx.eventTypes.GENERATE_AFTER_DATA, handleChatCompletionPromptReady);
  });

  ctx.eventSource.on(ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY, data => {
    if (SPresetSettings.ChatSquash.enable_stop_string && SPresetSettings.ChatSquash.stop_string && SPresetSettings.ChatSquash.enabled) {
      let custom_stopping_strings = [];
      try {
        custom_stopping_strings = JSON.parse(SPresetSettings.ChatSquash.stop_string);
      } catch (e) {
        custom_stopping_strings = [SPresetSettings.ChatSquash.stop_string];
      }
      if (data.stop) {
        data.stop = data.stop.filter(item => !custom_stopping_strings.includes(item));
        data.stop.push(...custom_stopping_strings);
      } else {
        data.stop = custom_stopping_strings;
      }
    }
  });

  // 在生成前同步工具注册
  ctx.eventSource.on(ctx.eventTypes.CHAT_COMPLETION_SETTINGS_READY, () => {
    syncSPresetToolRegistrations();
  });

  function runPostScript(target, messageArrayMode = false) {
    const settings = SPresetSettings.ChatSquash;
    if (!settings.squashed_post_script_enable) {
      return target;
    }

    const backup = messageArrayMode ? cloneSPresetData(target) : target;
    try {
      const processor = eval(settings.squashed_post_script);
      if (typeof processor !== 'function') {
        throw new TypeError('后处理脚本必须求值为函数');
      }

      const processed = processor(target);
      if (!messageArrayMode) {
        return processed;
      }

      // 返回 undefined 表示脚本已经原地修改；返回数组则替换内容但保留原数组引用。
      if (processed === undefined || processed === target) {
        return target;
      }
      if (!Array.isArray(processed)) {
        throw new TypeError('关闭合并时，后处理脚本只能返回消息数组或 undefined');
      }

      target.splice(0, target.length, ...processed);
      return target;
    } catch (e) {
      console.warn(messageArrayMode ? 'Message post script processing error:' : 'Squashed post script processing error:', e);
      if (messageArrayMode) {
        target.splice(0, target.length, ...backup);
        return target;
      }
      return backup;
    }
  }

  function postProcessOriginalMessages(messages) {
    return runPostScript(messages, true);
  }

  function squashPrompts(prompts) {
    const settings = SPresetSettings.ChatSquash;
    let squashRole = settings.role;
    if (settings.role === 'follow') {
      squashRole = prompts[0]?.role || 'user';
    }
    const newPrompts = [...prompts];
    prompts.length = 0;
    let lastRole = '';
    let mergedContent = '';

    const attachments = [];

    // 预先解析前后缀，用于合并和可能的重新拆分
    const resolveAffix = (prefix, suffix) => ({
      prefix: ctx.substituteParams(prefix),
      suffix: ctx.substituteParams(suffix),
    });
    const affix = {
      user: resolveAffix(settings.user_prefix, settings.user_suffix),
      assistant: resolveAffix(settings.char_prefix, settings.char_suffix),
      system: resolveAffix(settings.prefix_system, settings.suffix_system),
    };
    const segmentRoles = [];

    function pushMergedContent() {
      const processed = postProcess(mergedContent);
      if (settings.re_split && segmentRoles.length > 0) {
        const splitMsgs = reSplitContent(processed, affix);
        for (const msg of splitMsgs) {
          prompts.push({
            role: msg.role,
            content: restoreAttachments(msg.content, attachments),
          });
        }
      } else {
        prompts.push({
          role: squashRole,
          content: restoreAttachments(processed, attachments),
        });
      }
      mergedContent = '';
      segmentRoles.length = 0;
    }

    function reSplitContent(content, affix) {
      const result = [];
      let remaining = content;
      const roles = ['user', 'assistant', 'system'];

      while (remaining.length > 0) {
        let matchedRole = null;

        for (const role of roles) {
          const { prefix } = affix[role];
          if (prefix && remaining.startsWith(prefix)) {
            matchedRole = role;
            remaining = remaining.slice(prefix.length);
            break;
          }
        }

        if (!matchedRole) {
          break;
        }

        const { suffix } = affix[matchedRole];
        let endIdx = remaining.length;

        for (const role of roles) {
          const nextPrefix = affix[role].prefix;
          if (nextPrefix) {
            const idx = remaining.indexOf(nextPrefix);
            if (idx !== -1 && idx < endIdx) {
              endIdx = idx;
            }
          }
        }

        let segmentContent = remaining.slice(0, endIdx);

        if (suffix && segmentContent.endsWith(suffix)) {
          segmentContent = segmentContent.slice(0, -suffix.length);
        }

        segmentContent = segmentContent.trim();
        if (segmentContent) {
          result.push({ role: matchedRole, content: segmentContent });
        }

        remaining = remaining.slice(endIdx);
      }

      return result;
    }

    for (const prompt of newPrompts) {
      if (!prompt.content && !prompt.tool_calls) {
        continue;
      }
      if (Array.isArray(prompt.content)) {
        let textContent = '';
        for (const item of prompt.content) {
          if (item.type === 'text') {
            textContent += item.text;
          } else {
            textContent += `<｜attachment｜${attachments.length}｜>`;
            attachments.push(item);
          }
        }
        prompt.content = textContent;
      }
      if (settings.user_role_system && prompt.role === 'system') {
        prompt.role = 'user';
      }
      let separate = false;
      if (settings.enable_squashed_separator && settings.squashed_separator_string) {
        if (settings.squashed_separator_regex) {
          const regex = new RegExp(settings.squashed_separator_string);
          if (regex.test(prompt.content)) {
            separate = true;
            prompt.content = prompt.content.replace(regex, '');
          }
        } else if (prompt.content.includes(settings.squashed_separator_string)) {
          prompt.content = prompt.content.replace(settings.squashed_separator_string, '');
          separate = true;
        }
      }
      if (!separate && settings.parse_clewd) {
        const marker = '<|no-trans|>';
        if (prompt.content.includes(marker)) {
          separate = true;
          prompt.content = prompt.content.replace(marker, '');
        }
      }
      if (prompt.tool_calls || prompt.role === 'tool') {
        separate = true;
      }
      if (separate) {
        if (mergedContent) {
          pushMergedContent();
        }
        if (settings.role === 'follow') {
          squashRole = prompt.role;
        }
        lastRole = '';
        prompts.push(prompt);
        continue;
      }
      if (prompt.role !== lastRole) {
        if (lastRole) {
          mergedContent += affix[lastRole].suffix;
        }
        mergedContent += affix[prompt.role].prefix;
        segmentRoles.push(prompt.role);
      } else {
        mergedContent += '\n';
      }
      mergedContent += prompt.content;
      lastRole = prompt.role;
    }
    if (mergedContent) {
      if (lastRole) {
        mergedContent += affix[lastRole].suffix;
      }
      pushMergedContent();
    }
    return prompts;
  }

  function restoreAttachments(content, attachments) {
    if (attachments.length === 0) {
      return content;
    }
    const contentParts = [];
    const matchPattern = /<｜attachment｜(\d+)｜>/g;
    let match;
    while ((match = matchPattern.exec(content)) !== null) {
      contentParts.push({ type: 'text', text: content.slice(0, match.index) });
      contentParts.push(attachments[match[1]]);
      content = content.slice(match.index + match[0].length);
    }
    contentParts.push({ type: 'text', text: content });
    return contentParts;
  }

  function postProcess(prompt) {
    const hyperRegex = function (content, order) {
      const regexPattern =
        '<regex(?: +order *= *' +
        order +
        ')' +
        (order === 2 ? '?' : '') +
        '> *"(/?)(.*)\\1(.*?)" *: *"(.*?)" *</regex>';
      const matches = content.match(new RegExp(regexPattern, 'gm'));

      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          try {
            const reg = /<regex(?: +order *= *\d)?> *"(\/?)(.*)\1(.*?)" *: *"(.*?)" *<\/regex>/.exec(match);
            const replacePattern = new RegExp(reg[2], reg[3]);
            const replacement = JSON.parse('"' + reg[4].replace(/\\?"/g, '\\"') + '"');
            content = content.replace(replacePattern, replacement);
            console.debug('regex - \n' + content);
          } catch (e) {
            console.warn('Regex processing error:', e);
          }
        }
      }
      return content;
    };

    const HyperPmtProcess = function (content) {
      const regex1 = hyperRegex(content, 1);
      content = regex1;

      const regex2 = hyperRegex(content, 2);
      content = regex2;

      const regex3 = hyperRegex(content, 3);
      content = regex3;

      content = content
        .replace(/<regex( +order *= *\d)?>.*?<\/regex>/gm, '')
        .replace(/\r\n|\r/gm, '\n')
        .replace(/\s*<\|curtail\|>\s*/g, '\n')
        .replace(/\s*<\|join\|>\s*/g, '')
        .replace(/\s*<\|space\|>\s*/g, ' ')
        .replace(/<\|(\\.*?)\|>/g, function (match, p1) {
          try {
            return JSON.parse('"' + p1 + '"');
          } catch {
            return match;
          }
        });

      return content
        .replace(/\s*<\|.*?\|>\s*/g, '\n\n')
        .trim()
        .replace(/^.+:/, '\n\n$&')
        .replace(/(?<=\n)\n(?=\n)/g, '');
    };
    if (SPresetSettings.ChatSquash.parse_clewd) {
      console.debug('HyperPmtProcess - \n' + prompt);
      prompt = HyperPmtProcess(prompt);
    }
    return runPostScript(prompt);
  }

  return loadSettingsToForm;
};

const RegexBinding = () => {
  const regexMenuItems = `
    <div class="flex-container">
      <div class="menu_button menu_button_icon" id="manage_preset_regexes" title="管理预设绑定正则">
        <i class="fa-solid fa-cogs"></i>
        <small>管理正则</small>
      </div>
      <div class="menu_button menu_button_icon" id="regex_binding_help" title="绑定正则使用说明">
        <i class="fa-solid fa-circle-info"></i>
        <small>使用说明</small>
      </div>
    </div>
  `;

  addMenuSection('regex_binding', '绑定内置正则', regexMenuItems);

  // 绑定事件处理
  settingsDom.find('#manage_preset_regexes').on('click', function () {
    // 关闭菜单并跳转到正则设置
    $('.popup-button-ok').click(); // 关闭当前弹窗

    $('#extensions-settings-button .drawer-toggle').click();
    $('.regex_settings .inline-drawer-toggle').click();
  });

  settingsDom.find('#regex_binding_help').on('click', function () {
    showRegexBindingHelp();
  });

  // 显示绑定正则使用说明
  function showRegexBindingHelp() {
    const helpContent = `
    <div style="text-align: left; max-height: 400px; overflow-y: auto;">
      <h4>预设绑定正则功能说明</h4>
      
      <h5>🎯 主要功能</h5>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>预设绑定：</strong> 将正则表达式直接保存在预设中，而不是全局设置</li>
        <li><strong>角色无关：</strong> 绑定的正则会影响所有使用此预设的角色</li>
        <li><strong>正则锁定：</strong> 可以锁定重要的正则，防止预设切换时丢失</li>
        <li><strong>批量管理：</strong> 支持批量启用、禁用和导出正则</li>
      </ul>
      
      <h5>📝 使用步骤</h5>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li><strong>创建正则：</strong> 点击"新建预设正则"创建新的正则规则</li>
        <li><strong>绑定现有：</strong> 在全局正则列表中点击"↑"按钮将正则绑定到当前预设</li>
        <li><strong>管理顺序：</strong> 使用"预设正则排序"调整正则执行顺序</li>
        <li><strong>锁定保护：</strong> 点击🔒按钮锁定重要正则，防止丢失</li>
        <li><strong>保存预设：</strong> 记得保存预设以防正则丢失</li>
      </ol>
      
      <h5>⚠️ 重要提示</h5>
      <ul style="margin: 10px 0; padding-left: 20px; color: #ff6b6b;">
        <li>预设绑定的正则保存在预设文件中，切换预设时会自动加载对应的正则</li>
        <li>修改后请及时保存预设，否则可能丢失更改</li>
        <li>正则执行顺序很重要，排序靠前的正则会先执行</li>
        <li>锁定的正则不会因预设切换而丢失，适用于通用规则</li>
      </ul>
      
      <h5>🔧 高级功能</h5>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>批量操作：</strong> 选中多个正则后可以批量启用、禁用或导出</li>
        <li><strong>排序功能：</strong> 支持拖拽排序、批量移动、反转顺序等</li>
        <li><strong>导入导出：</strong> 可以导出正则配置与他人分享</li>
        <li><strong>实时预览：</strong> 编辑正则时可以实时测试效果</li>
      </ul>
    </div>
  `;

    ctx.callGenericPopup(helpContent, ctx.POPUP_TYPE.TEXT, '', {
      okButton: '我知道了',
    });
  }
  // eslint-disable-next-line no-control-regex
  const sanitizeFileName = name => name.replace(/[\s.<>:"/\\|?*\x00-\x1f\x7f]/g, '_').toLowerCase();

  function getFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function () {
        resolve(String(reader.result));
      };
      reader.onerror = function (error) {
        reject(error);
      };
    });
  }
  const extensions = ctx.extensionSettings;
  const presetRegexes = getRegexesFromPreset();
  const lockedRegexes = loadLockedRegexes();

  // The legacy regex extension executes preset scripts through its global list.
  // Keep a closure-backed synchronizer so the modern Editor can update that list
  // without duplicating the old-version compatibility rules outside this module.
  syncLegacySPresetRegexesToCurrentST = regexes => {
    const nextRegexes = Array.isArray(regexes) ? cloneSPresetData(regexes) : [];
    const lockedToPrepend = [];
    for (const lockedRegex of lockedRegexes) {
      const index = nextRegexes.findIndex(regex => regex.id === lockedRegex.id);
      if (index === -1) lockedToPrepend.push(cloneSPresetData(lockedRegex));
      else nextRegexes[index] = cloneSPresetData(lockedRegex);
    }
    nextRegexes.unshift(...lockedToPrepend);
    presetRegexes.length = 0;
    presetRegexes.push(...nextRegexes);
    updateSTRegexes();
    Promise.resolve(renderPresetRegexesSafely()).catch(error => {
      console.warn('[SPreset RegexBinding] 刷新旧版正则列表失败:', error);
    });
  };

  // Load saved activation order if available
  if (SGlobalSettings.RegexBinding && SGlobalSettings.RegexBinding.activationOrder) {
    window.__regexScriptOrder = SGlobalSettings.RegexBinding.activationOrder;
  }

  if (versionNumber >= 11305) {
    // 11305+ has built-in regex binding; ST is source of truth, only sync FROM ST
    const stHasRegexScripts =
      ctx.chatCompletionSettings.extensions.regex_scripts &&
      ctx.chatCompletionSettings.extensions.regex_scripts.length > 0;

    // Migrate old xiaobai_ext format if present
    if (
      ctx.chatCompletionSettings.prompt_order[1] &&
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext &&
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings
    ) {
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings.scripts
        .filter(s => !presetRegexes.find(s2 => s2.id === s.id))
        .forEach(s => presetRegexes.push(s));
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings = null;
    }

    if (stHasRegexScripts) {
      // ST already has regex_scripts (built-in system is authoritative), sync FROM ST
      presetRegexes.length = 0;
      presetRegexes.push(...ctx.chatCompletionSettings.extensions.regex_scripts);
      saveRegexesToPreset(presetRegexes);
    } else if (presetRegexes.length > 0) {
      // ST has no regex_scripts but we have old data, migrate TO ST
      syncToST();
    }

    // Clean up legacy preset_ entries from global regex list
    const originalLength = extensions.regex.length;
    extensions.regex = extensions.regex.filter(
      s => !s.id.startsWith('preset_') && !s.scriptName?.startsWith('[s]') && !s['preset-regex'],
    );
    if (extensions.regex.length !== originalLength) {
      ctx.reloadCurrentChat();
    }

    // Inject activation order sort button into regex settings button area
    const activationSortButton = $(`
      <div id="sort_activation_order" class="menu_button menu_button_icon interactable" title="排序正则类型执行顺序" tabindex="0">
        <i class="fa-solid fa-arrow-down-1-9"></i>
        <small>执行顺序</small>
      </div>
    `);
    activationSortButton.on('click', async () => {
      await popupActivationSortPanel();
    });
    const targetButton = $('#import_regex');
    if (targetButton.length) {
      targetButton.parent().append(activationSortButton);
    }

    let presetLoaded11305 = ctx.chatCompletionSettings.preset_settings_openai;
    ctx.eventSource.on('oai_preset_changed_after', () => {
      if (ctx.chatCompletionSettings.preset_settings_openai !== presetLoaded11305) {
        presetLoaded11305 = ctx.chatCompletionSettings.preset_settings_openai;
        reloadSettings();
        unregisterAllSPresetTools();
        syncSPresetToolRegistrations();
        const stHasScripts =
          ctx.chatCompletionSettings.extensions.regex_scripts &&
          ctx.chatCompletionSettings.extensions.regex_scripts.length > 0;
        if (stHasScripts) {
          syncFromST();
        } else if (SPresetSettings.RegexBinding.regexes && SPresetSettings.RegexBinding.regexes.length > 0) {
          syncToST();
        }
      }
    });

    async function popupActivationSortPanel() {
      const typeNames = {
        0: '全局正则',
        1: '角色卡正则',
        2: '预设正则',
      };
      let currentOrder = [...window.__regexScriptOrder];

      const popupHtml = $(`
        <div id="activation_order_sort_panel">
          <div class="regex_editor">
            <h3 class="flex-container justifyCenter">
              <strong>正则执行顺序</strong>
            </h3>
            <small class="flex-container extensions_info">
              调整不同类型正则的执行顺序。排在前面的类型优先执行。
            </small>
            <hr />
            <div id="activation_order_list" class="flex-container flexFlowColumn" style="gap: 4px;">
            </div>
          </div>
        </div>
      `);

      function renderOrderList() {
        const container = popupHtml.find('#activation_order_list');
        container.empty();
        currentOrder.forEach((type, index) => {
          const item = $(`
            <div class="flex-container alignItemsCenter padding5" data-index="${index}" style="border: 1px solid #333; border-radius: 4px; background: rgba(42, 42, 42, 0.3);">
              <div class="flex1" style="font-weight: bold; padding: 4px 8px;">
                ${index + 1}. ${typeNames[type]}
              </div>
              <div class="flex-container flexNoGap">
                <div class="menu_button menu_button_icon activation-up ${index === 0 ? 'disabled' : ''}" data-index="${index}" title="上移">
                  <i class="fa-solid fa-chevron-up"></i>
                </div>
                <div class="menu_button menu_button_icon activation-down ${index === currentOrder.length - 1 ? 'disabled' : ''}" data-index="${index}" title="下移">
                  <i class="fa-solid fa-chevron-down"></i>
                </div>
              </div>
            </div>
          `);
          container.append(item);
        });
      }

      popupHtml.on('click', '.activation-up:not(.disabled)', function (e) {
        e.stopPropagation();
        const idx = parseInt($(this).data('index'));
        if (idx > 0) {
          [currentOrder[idx], currentOrder[idx - 1]] = [currentOrder[idx - 1], currentOrder[idx]];
          renderOrderList();
        }
      });

      popupHtml.on('click', '.activation-down:not(.disabled)', function (e) {
        e.stopPropagation();
        const idx = parseInt($(this).data('index'));
        if (idx < currentOrder.length - 1) {
          [currentOrder[idx], currentOrder[idx + 1]] = [currentOrder[idx + 1], currentOrder[idx]];
          renderOrderList();
        }
      });

      renderOrderList();

      const result = await ctx.callGenericPopup(popupHtml.get(0), ctx.POPUP_TYPE.CONFIRM, '', {
        okButton: '保存',
        cancelButton: '取消',
      });

      if (result) {
        window.__regexScriptOrder = currentOrder;
        if (!SGlobalSettings.RegexBinding) {
          SGlobalSettings.RegexBinding = {};
        }
        SGlobalSettings.RegexBinding.activationOrder = currentOrder;
        ctx.extensionSettings.SPreset = SGlobalSettings;
        ctx.saveSettingsDebounced();
        toastr.success('正则执行顺序已保存');
      }
    }

    return;
  }

  const regexButtons = $('#open_preset_editor');
  if (regexButtons.length !== 0) {
    // 如果存在，则删除
    regexButtons.remove();
  }
  const oldImportButton = $('#import_regex_preset');
  if (oldImportButton.length !== 0) {
    oldImportButton.remove();
    $('#import_regex_preset_file').remove();
  }
  const oldSortButton = $('#sort_regexes');
  if (oldSortButton.length !== 0) {
    oldSortButton.remove();
  }
  const newRegexButton = $(`
    <div id="open_preset_editor" class="menu_button menu_button_icon interactable" title="新的预设正则脚本" tabindex="0">
      <i class="fa-solid fa-file-circle-plus"></i>
      <small>新建预设正则</small>
    </div>
  `);
  newRegexButton.on('click', () => {
    onRegexEditorOpenClick(false);
  });
  const importButton = $(`
    <div id="import_regex_preset" class="menu_button menu_button_icon">
      <i class="fa-solid fa-file-import"></i>
      <small>导入预设正则</small>
    </div>
    <input type="file" id="import_regex_preset_file" hidden accept="*.json" multiple />
  `);

  const cssStyles = `
    <style id="regex-binding-css">
      #saved_regex_scripts [id^="preset_"] {
        display: none;
      }
    </style>
  `;
  if ($('#regex-binding-css').length === 0) {
    $('head').append(cssStyles);
  }
  $('#import_regex').before(importButton);
  const sortButton = $(`
    <div id="sort_regexes" class="menu_button menu_button_icon">
      <i class="fa-solid fa-sort"></i>
      <small>预设正则排序</small>
    </div>
  `);
  sortButton.on('click', async () => {
    await popupSortPanel();
  });
  $('#import_regex').parent().append(sortButton);
  $('#import_regex_preset').on('click', () => {
    $('#import_regex_preset_file').click();
  });
  $('#import_regex_preset_file').on('change', async function (event) {
    const inputElement = event.target;
    for (const file of inputElement.files) {
      await onImportFile(file);
    }
    inputElement.value = '';
  });
  $('#open_regex_editor').before(newRegexButton);

  function getSelectedScripts() {
    const scripts = presetRegexes;
    const selector = '#saved_spreset_scripts .regex-script-label:has(.regex_bulk_checkbox:checked)';
    const selectedIds = $(selector)
      .map(function () {
        return $(this).attr('id');
      })
      .get()
      .filter(id => id);
    return scripts.filter(script => selectedIds.includes(script.id));
  }
  $('#bulk_enable_regex').on('click', async function () {
    const scripts = getSelectedScripts();
    if (scripts.length === 0) {
      return;
    }
    for (const script of scripts) {
      script.disabled = false;
    }
    await renderPresetRegexes();
    saveRegexesToPreset(presetRegexes);
    updateSTRegexes();
  });

  $('#bulk_disable_regex').on('click', async function () {
    const scripts = getSelectedScripts();
    if (scripts.length === 0) {
      return;
    }
    for (const script of scripts) {
      script.disabled = true;
    }
    await renderPresetRegexes();
    saveRegexesToPreset(presetRegexes);
    updateSTRegexes();
  });

  $('#bulk_delete_regex').on('click', async function () {
    const scripts = getSelectedScripts();
    if (scripts.length !== 0) {
      toastr.warning(`预设绑定正则不支持批量删除`);
      return;
    }
  });

  $('#bulk_export_regex').on('click', async function () {
    const scripts = getSelectedScripts();
    if (scripts.length === 0) {
      return;
    }
    const json = JSON.stringify(scripts);
    const fileName = '预设正则-' + ctx.chatCompletionSettings.preset_settings_openai + '.json';
    download(json, fileName, 'application/json');
  });

  window.regexBinding_onSortableStop = async function () {
    try {
      if (window.__regexBinding_isSorting === 99) {
        window.__regexBinding_isSorting = 0;
        await renderPresetRegexes();
        return;
      }
      window.__regexBinding_isSorting = 0;
      // 深拷贝
      const oldScripts = JSON.parse(JSON.stringify(presetRegexes));
      presetRegexes.length = 0;
      $('#saved_spreset_scripts')
        .children()
        .each(function () {
          const id = $(this).attr('id');
          const script = oldScripts.find(s => s.id === id);
          if (script) {
            presetRegexes.push(script);
          }
        });
      saveRegexesToPreset(presetRegexes);
      await renderPresetRegexes();
    } catch (error) {
      const confirm = await ctx.callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        ctx.POPUP_TYPE.CONFIRM,
      );
      if (confirm) {
        navigator.clipboard.writeText(JSON.stringify(error, null, 2));
        toastr.success('已复制错误信息到剪贴板');
      }
    }
  };

  window.regexBinding_onSortableStart = function () {
    window.__regexBinding_isSorting = 1;
  };

  const observer = new MutationObserver(function () {
    injectBindButtons();
  });
  const observerTarget = $('#saved_regex_scripts');
  observer.observe(observerTarget[0], {
    childList: true,
    subtree: true,
  });

  renderPresetRegexes();
  syncRegexes();
  updateSTRegexes();
  /*
  $('.regex_settings .collapse_regexes').on('click', function () {
    const icon = $(this).find('i');
    const scripts = $('#saved_spreset_scripts');
    $('.regex_settings .collapse_regexes small').text(icon.hasClass('fa-chevron-up') ? '展开' : '收起');
    if (icon.hasClass('fa-chevron-up')) {
      scripts.hide();
      icon.removeClass('fa-chevron-up');
      icon.addClass('fa-chevron-down');
    } else {
      scripts.show();
      icon.removeClass('fa-chevron-down');
      icon.addClass('fa-chevron-up');
    }
  });
  */
  try {
    $('#saved_spreset_scripts').sortable({
      delay: ctx.isMobile() ? 750 : 50,
      start: window.regexBinding_onSortableStart,
      stop: window.regexBinding_onSortableStop,
    });
    $('#saved_spreset_scripts').sortable('enable');
  } catch (error) {
    const confirm = ctx.callGenericPopup(
      '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
      ctx.POPUP_TYPE.CONFIRM,
    );
    if (confirm) {
      navigator.clipboard.writeText(JSON.stringify(error, null, 2));
      toastr.success('已复制错误信息到剪贴板');
    }
  }

  let presetLoaded = SillyTavern.getContext().chatCompletionSettings.preset_settings_openai;

  ctx.eventSource.on('oai_preset_changed_after', () => {
    if (SillyTavern.getContext().chatCompletionSettings.preset_settings_openai !== presetLoaded) {
      presetLoaded = SillyTavern.getContext().chatCompletionSettings.preset_settings_openai;
      reloadSettings();
      unregisterAllSPresetTools();
      syncSPresetToolRegistrations();
      if (SPresetSettings.RegexBinding.regexes) {
        syncToST();
      } else {
        syncFromST();
      }
    } else if (versionNumber < 11305) {
      return;
    }
    try {
      const newPresetRegexes = getRegexesFromPreset();
      const oldIdOrder = presetRegexes.map(s => s.id);
      // check if newPresetRegexes is different from presetRegexes
      const changed = !_.isEqual(newPresetRegexes, presetRegexes);

      /*
      if (!extensions.regex[MARK]) {
        reproxy(extensions, 'regex', presetRegexes);
      }
      */
      if (changed || lockedRegexes.length > 0) {
        presetRegexes.length = 0;
        presetRegexes.push(...newPresetRegexes);
        if (lockedRegexes.length > 0) {
          const toAdd = [];
          for (const regex of lockedRegexes) {
            const index = presetRegexes.findIndex(s => s.id === regex.id);
            if (index === -1) {
              toAdd.push(regex);
            } else {
              presetRegexes[index] = regex;
            }
          }
          presetRegexes.unshift(...toAdd);
        }
        saveRegexesToPreset(presetRegexes);
      }
      if (
        !_.isEqual(
          oldIdOrder,
          presetRegexes.map(s => s.id),
        )
      ) {
        renderPresetRegexesSafely();
      }
      if (changed) {
        updateSTRegexes();
      }
    } catch (error) {
      const confirm = ctx.callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        ctx.POPUP_TYPE.CONFIRM,
      );
      if (confirm) {
        navigator.clipboard.writeText(JSON.stringify(error, null, 2));
        toastr.success('已复制错误信息到剪贴板');
      }
    }
  });

  function updateSTRegexes() {
    syncToST();
    if (versionNumber >= 11305) {
      const originalLength = extensions.regex.length;
      extensions.regex = extensions.regex.filter(
        s => !s.id.startsWith('preset_') && !s.scriptName.startsWith('[s]') && !s['preset-regex'],
      );
      if (extensions.regex.length !== originalLength) {
        ctx.reloadCurrentChat();
      }
      return;
    }
    const stRegexes = extensions.regex.slice();
    updateCss();
    let presetRegexCount = 0;
    for (const script of stRegexes) {
      if (script.id.startsWith('preset_')) {
        presetRegexCount++;
      }
    }
    if (presetRegexCount !== presetRegexes.length) {
      const newPresetRegexes = presetRegexes.map(s => ({
        ...s,
        id: 'preset_' + s.id,
      }));
      extensions.regex = newPresetRegexes.concat(
        stRegexes.filter(s => !s.id.startsWith('preset_') && !s.scriptName.startsWith('[s]') && !s['preset-regex']),
      );
      ctx.reloadCurrentChat();
    } else {
      presetRegexes.forEach((s, i) => {
        extensions.regex[i] = {
          ...s,
          id: 'preset_' + s.id,
        };
      });
    }
  }

  function syncToST() {
    if (versionNumber >= 11305) {
      ctx.chatCompletionSettings.extensions.regex_scripts = presetRegexes;
      if (!extensions.preset_allowed_regex) {
        extensions.preset_allowed_regex = {};
      }
      if (!extensions.preset_allowed_regex.openai) {
        extensions.preset_allowed_regex.openai = [];
      }
      if (!extensions.preset_allowed_regex.openai.includes(ctx.chatCompletionSettings.preset_settings_openai)) {
        extensions.preset_allowed_regex.openai.push(ctx.chatCompletionSettings.preset_settings_openai);
      }
    }
  }

  function syncFromST() {
    if (versionNumber >= 11305) {
      if (!SPresetSettings.RegexBinding.regexes) {
        SPresetSettings.RegexBinding.regexes = [];
      }
      ctx.chatCompletionSettings.extensions.regex_scripts.forEach(s => {
        if (!SPresetSettings.RegexBinding.regexes.find(s2 => s2.id === s.id)) {
          SPresetSettings.RegexBinding.regexes.push(s);
        }
      });
      renderPresetRegexes();
    }
  }

  function syncRegexes() {
    if (
      ctx.chatCompletionSettings.prompt_order[1] &&
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext &&
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings
    ) {
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings.scripts
        .filter(s => {
          return !SPresetSettings.RegexBinding.regexes.find(s2 => s2.id === s.id);
        })
        .forEach(s => {
          presetRegexes.push(s);
        });
      ctx.chatCompletionSettings.prompt_order[1].xiaobai_ext.regexBindings = null;
    }
    if (ctx.chatCompletionSettings.extensions.regex_scripts) {
      ctx.chatCompletionSettings.extensions.regex_scripts
        .filter(s => {
          return !presetRegexes.find(s2 => s2.id === s.id);
        })
        .forEach(s => {
          presetRegexes.push(s);
        });
    }
    if (versionNumber >= 11305) {
      ctx.chatCompletionSettings.extensions.regex_scripts = presetRegexes;
    }

    renderPresetRegexes();
    saveRegexesToPreset(presetRegexes);
  }

  function updateCss() {
    /*const css = `
    #${presetRegexes.map(s => `#preset_${s.id}`).join(', ')} {
      display: none;
    }
    `;
    injectedCss.html(css);*/
    // pass
  }

  async function onImportFile(file) {
    if (!file) {
      toastr.error('No file provided');
      return;
    }
    try {
      const regexScripts = JSON.parse(await getFileText(file));
      if (Array.isArray(regexScripts)) {
        for (const script of regexScripts) {
          await onImportScript(script);
        }
      } else {
        await onImportScript(regexScripts);
      }
      toastr.success('记得保存预设以防正则丢失喵');
    } catch (error) {
      toastr.error('Failed to import file');
      console.error(error);
    }
  }

  async function onImportScript(script) {
    try {
      if (!script.scriptName) {
        throw new Error('Script name is required');
      }

      // assign a new id
      script.id = ctx.uuidv4();

      presetRegexes.push(script);
      await renderPresetRegexes();

      saveRegexesToPreset(presetRegexes);
      toastr.success('Imported script: ' + script.scriptName);
      updateSTRegexes();
    } catch (error) {
      toastr.error('Failed to import script: ' + error.message);
      console.error(error);
    }
  }

  function injectBindButtons() {
    const globalScriptBlock = $('.regex_settings').find('#saved_regex_scripts');
    const bindButtonTemplate = `
      <div class="move_to_preset menu_button interactable" data-i18n="[title]ext_regex_move_to_preset" title="绑定到预设" tabindex="0">
        <i class="fa-solid fa-arrow-up"></i>
      </div>
    `;
    globalScriptBlock.children().each(function () {
      const scriptDiv = $(this);
      const scriptId = scriptDiv.attr('id');
      const existingButton = scriptDiv.find('.move_to_preset');
      if (existingButton.length === 0) {
        const bindButton = $(bindButtonTemplate);
        bindButton.on('click', async function () {
          const chat = await ctx.chat;
          if (chat.length >= 10) {
            const confirm = await ctx.callGenericPopup(
              '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
              ctx.POPUP_TYPE.CONFIRM,
            );
            if (!confirm) {
              return;
            }
          }
          const script = _.remove(extensions.regex, s => s.id === scriptId)[0];
          if (!script) {
            toastr.error('Script not found');
            return;
          }
          scriptDiv.remove();
          presetRegexes.push(script);
          await renderPresetRegexes();
          saveRegexesToPreset(presetRegexes);
          toastr.success('已绑定到预设，记得保存预设以防正则丢失喵');
          updateSTRegexes();
        });
        scriptDiv.find('.move_to_global').before(bindButton);
      }
    });
  }

  async function renderPresetRegexesSafely() {
    if (window.__regexBinding_isSorting) {
      window.__regexBinding_isSorting = 99;
      return;
    }
    await renderPresetRegexes();
  }

  async function renderPresetRegexes() {
    if (versionNumber >= 11305) {
      return;
    }
    injectBindButtons();
    updateCss();
    if ($('#preset_scripts_block').length > 0) {
      $('#preset_scripts_block').remove();
    }
    const regex_settings = $('.regex_settings');
    let block = injectPresetBlock(regex_settings);

    block = block.find('#saved_spreset_scripts');
    block.empty();
    presetRegexes.forEach((script, index) => renderScript(block, script, index));

    function renderScript(container, script, index) {
      const scriptHTML = `
      <div class="regex-script-label flex-container flexnowrap">
          <input type="checkbox" class="regex_bulk_checkbox" />
          <span class="drag-handle menu-handle">&#9776;</span>
          <div class="regex_script_name flexGrow overflow-hidden"></div>
          <div class="flex-container flexnowrap">
              <label class="checkbox flex-container" for="regex_disable">
                  <input type="checkbox" name="regex_disable" class="disable_regex" />
                  <span class="regex-toggle-on fa-solid fa-toggle-on" data-i18n="[title]ext_regex_disable_script" title="Disable script"></span>
                  <span class="regex-toggle-off fa-solid fa-toggle-off" data-i18n="[title]ext_regex_enable_script" title="Enable script"></span>
              </label>
              <div class="lock_regex menu_button" data-i18n="[title]ext_regex_lock_regex" title="锁定正则">
                  <i class="fa-solid fa-unlock"></i>
              </div>
              <div class="unlock_regex menu_button" data-i18n="[title]ext_regex_unlock_regex" title="解锁正则">
                  <i class="fa-solid fa-lock"></i>
              </div>
              <div class="edit_existing_regex menu_button" data-i18n="[title]ext_regex_edit_script" title="Edit script">
                  <i class="fa-solid fa-pencil"></i>
              </div>
              <div class="move_to_global menu_button" data-i18n="[title]ext_regex_move_to_global" title="Move to global scripts">
                  <i class="fa-solid fa-arrow-down"></i>
              </div>
              <div class="export_regex menu_button" data-i18n="[title]ext_regex_export_script" title="Export script">
                  <i class="fa-solid fa-file-export"></i>
              </div>
              <div class="delete_regex menu_button" data-i18n="[title]ext_regex_delete_script" title="Delete script">
                  <i class="fa-solid fa-trash"></i>
              </div>
          </div>
      </div>
      `;
      const scriptDiv = $(scriptHTML);

      const save = () => saveRegexScript(script, index);

      scriptDiv.attr('id', script.id);
      scriptDiv.find('.regex_script_name').text(script.scriptName);
      scriptDiv
        .find('.disable_regex')
        .prop('checked', script.disabled ?? false)
        .on('input', async function () {
          script.disabled = !!$(this).prop('checked');
          await save();
          updateSTRegexes();
          if (ctx.getCurrentChatId()) {
            ctx.reloadCurrentChat();
          }
        });
      scriptDiv.find('.regex-toggle-on').on('click', function () {
        scriptDiv.find('.disable_regex').prop('checked', true).trigger('input');
      });
      scriptDiv.find('.regex-toggle-off').on('click', function () {
        scriptDiv.find('.disable_regex').prop('checked', false).trigger('input');
      });
      scriptDiv.find('.edit_existing_regex').on('click', async function () {
        await onRegexEditorOpenClick(scriptDiv.attr('id'));
      });
      if (lockedRegexes.findIndex(s => s.id === script.id) !== -1) {
        scriptDiv.find('.lock_regex').hide();
        scriptDiv.find('.unlock_regex').show();
        scriptDiv.find('.regex_script_name').text(`[锁定]${script.scriptName}`);
      } else {
        scriptDiv.find('.lock_regex').show();
        scriptDiv.find('.unlock_regex').hide();
      }
      scriptDiv.find('.lock_regex').on('click', async function () {
        lockedRegexes.push(script);
        await renderPresetRegexes();
        saveLockedRegexes(lockedRegexes);
      });
      scriptDiv.find('.unlock_regex').on('click', async function () {
        _.remove(lockedRegexes, s => s.id === script.id);
        await renderPresetRegexes();
        saveLockedRegexes(lockedRegexes);
        saveRegexesToPreset(presetRegexes);
      });
      scriptDiv.find('.export_regex').on('click', async function () {
        const fileName = `regex-${sanitizeFileName(script.scriptName)}.json`;
        const fileData = JSON.stringify(script, null, 4);
        download(fileData, fileName, 'application/json');
      });
      scriptDiv.find('.move_to_global').on('click', async function () {
        const chat = await ctx.chat;
        if (chat.length >= 10) {
          const confirm = await ctx.callGenericPopup(
            '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
            ctx.POPUP_TYPE.CONFIRM,
          );
          if (!confirm) {
            return;
          }
        }
        presetRegexes.splice(index, 1);
        if (versionNumber >= 11305) {
          ctx.chatCompletionSettings.extensions.regex_scripts =
            ctx.chatCompletionSettings.extensions.regex_scripts.filter(s => s.id !== script.id);
        }
        const i = _.findLastIndex(extensions.regex, s => s.id.startsWith('preset_'));
        if (i !== -1) {
          extensions.regex.splice(i, 0, script);
        } else {
          extensions.regex.unshift(script);
        }
        await renderPresetRegexes();
        saveRegexesToPreset(presetRegexes);
        updateSTRegexes();
        if (versionNumber >= 11305) {
          ctx.reloadCurrentChat();
        }
      });
      scriptDiv.find('.delete_regex').on('click', async function () {
        const chat = await ctx.chat;
        const confirm = await ctx.callGenericPopup(
          chat.length >= 10
            ? '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要删除吗？'
            : '你确定要删除这个正则吗？',
          ctx.POPUP_TYPE.CONFIRM,
        );
        if (!confirm) {
          return;
        }
        presetRegexes.splice(index, 1);
        const i = lockedRegexes.findIndex(s => s.id === script.id);
        if (i !== -1) {
          lockedRegexes.splice(i, 1);
          saveLockedRegexes(lockedRegexes);
        }
        if (versionNumber >= 11305) {
          ctx.chatCompletionSettings.extensions.regex_scripts =
            ctx.chatCompletionSettings.extensions.regex_scripts.filter(s => s.id !== script.id);
        }
        await renderPresetRegexes();
        saveRegexesToPreset(presetRegexes);
        updateSTRegexes();
      });
      scriptDiv.find('.regex_bulk_checkbox').on('change', function () {
        const checkboxes = $('#regex_container .regex_bulk_checkbox');
        const allAreChecked = checkboxes.length === checkboxes.filter(':checked').length;
        setToggleAllIcon(allAreChecked);
      });
      container.append(scriptDiv);
    }
  }
  function addScriptToGlobal(script) {
    const globalScriptBlock = $('.regex_settings').find('#saved_regex_scripts');
    const scriptHTML = `
      <div class="regex-script-label flex-container flexnowrap">
          <input type="checkbox" class="regex_bulk_checkbox" />
          <span class="drag-handle menu-handle">&#9776;</span>
          <div class="regex_script_name flexGrow overflow-hidden"></div>
          <div class="flex-container flexnowrap">
              <label class="checkbox flex-container" for="regex_disable">
                  <input type="checkbox" name="regex_disable" class="disable_regex" />
                  <span class="regex-toggle-on fa-solid fa-toggle-on" data-i18n="[title]ext_regex_disable_script" title="Disable script"></span>
                  <span class="regex-toggle-off fa-solid fa-toggle-off" data-i18n="[title]ext_regex_enable_script" title="Enable script"></span>
              </label>
              <div class="edit_existing_regex menu_button" data-i18n="[title]ext_regex_edit_script" title="Edit script">
                  <i class="fa-solid fa-pencil"></i>
              </div>
              <div class="move_to_global menu_button" data-i18n="[title]ext_regex_move_to_global" title="Move to global scripts">
                  <i class="fa-solid fa-arrow-down"></i>
              </div>
              <div class="export_regex menu_button" data-i18n="[title]ext_regex_export_script" title="Export script">
                  <i class="fa-solid fa-file-export"></i>
              </div>
              <div class="delete_regex menu_button" data-i18n="[title]ext_regex_delete_script" title="Delete script">
                  <i class="fa-solid fa-trash"></i>
              </div>
          </div>
      </div>
      `;
    const scriptDiv = $(scriptHTML);
    scriptDiv.attr('id', script.id);
    scriptDiv.find('.regex_script_name').text(script.scriptName);
    scriptDiv.find('.disable_regex').prop('checked', script.disabled ?? false);

    const first = globalScriptBlock.children().first();
    first.before(scriptDiv);
  }

  function download(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function setToggleAllIcon(allAreChecked) {
    const selectAllIcon = $('#bulk_select_all_toggle').find('i');
    selectAllIcon.toggleClass('fa-check-double', !allAreChecked);
    selectAllIcon.toggleClass('fa-minus', allAreChecked);
  }
  function injectPresetBlock(regex_settings) {
    try {
      const htmlTemplate = `
      <div id="preset_regexes_block" class="padding5">
        <div>
          <strong data-i18n="ext_regex_preset_regexes">预设绑定正则</strong>
        </div>
        <small data-i18n="ext_regex_preset_regexes_desc">
          影响所有角色，保存在预设中。
        </small>
        <div id="saved_spreset_scripts" no-scripts-text="No scripts found" data-i18n="[no-scripts-text]No scripts found" class="flex-container regex-script-container flexFlowColumn"></div>
      </div>
      <hr />
      `;
      let block = regex_settings.find('#preset_regexes_block');
      if (block.length === 0) {
        block = $(htmlTemplate);
        const global_scripts_block = regex_settings.find('#global_scripts_block');
        global_scripts_block.before(block);
      }
      return regex_settings.find('#preset_regexes_block');
    } catch (error) {
      const confirm = ctx.callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        ctx.POPUP_TYPE.CONFIRM,
      );
      if (confirm) {
        navigator.clipboard.writeText(JSON.stringify(error, null, 2));
        toastr.success('已复制错误信息到剪贴板');
      }
      return null;
    }
  }

  const substitute_find_regex = {
    NONE: 0,
    RAW: 1,
    ESCAPED: 2,
  };
  function sanitizeRegexMacro(x) {
    return x && typeof x === 'string'
      ? x.replaceAll(/[\n\r\t\v\f\0.^$*+?{}[\]\\/|()]/gs, function (s) {
          switch (s) {
            case '\n':
              return '\\n';
            case '\r':
              return '\\r';
            case '\t':
              return '\\t';
            case '\v':
              return '\\v';
            case '\f':
              return '\\f';
            case '\0':
              return '\\0';
            default:
              return '\\' + s;
          }
        })
      : x;
  }
  /**
   * Filters anything to trim from the regex match
   * @param {string} rawString The raw string to filter
   * @param {string[]} trimStrings The strings to trim
   * @param {RegexScriptParams} params The parameters to use for the regex filter
   * @returns {string} The filtered string
   */
  function filterString(rawString, trimStrings, { characterOverride } = {}) {
    let finalString = rawString;
    trimStrings.forEach(trimString => {
      const subTrimString = ctx.substituteParams(trimString, undefined, characterOverride);
      finalString = finalString.replaceAll(subTrimString, '');
    });

    return finalString;
  }
  /**
   * Runs the provided regex script on the given string
   * @param {import('./index.js').RegexScript} regexScript The regex script to run
   * @param {string} rawString The string to run the regex script on
   * @param {RegexScriptParams} params The parameters to use for the regex script
   * @returns {string} The new string
   * @typedef {{characterOverride?: string}} RegexScriptParams The parameters to use for the regex script
   */
  function runRegexScript(regexScript, rawString, { characterOverride } = {}) {
    let newString = rawString;
    if (!regexScript || !!regexScript.disabled || !regexScript?.findRegex || !rawString) {
      return newString;
    }

    const getRegexString = () => {
      switch (Number(regexScript.substituteRegex)) {
        case substitute_find_regex.NONE:
          return regexScript.findRegex;
        case substitute_find_regex.RAW:
          return ctx.substituteParamsExtended(regexScript.findRegex);
        case substitute_find_regex.ESCAPED:
          return ctx.substituteParamsExtended(regexScript.findRegex, {}, sanitizeRegexMacro);
        default:
          console.warn(
            `runRegexScript: Unknown substituteRegex value ${regexScript.substituteRegex}. Using raw regex.`,
          );
          return regexScript.findRegex;
      }
    };
    const regexString = getRegexString();
    const findRegex = regexFromString(regexString);

    // The user skill issued. Return with nothing.
    if (!findRegex) {
      return newString;
    }

    // Run replacement. Currently does not support the Overlay strategy
    newString = rawString.replace(findRegex, function (match) {
      const args = [...arguments];
      const replaceString = regexScript.replaceString.replace(/{{match}}/gi, '$0');
      const replaceWithGroups = replaceString.replaceAll(/\$(\d+)/g, (_, num) => {
        // Get a full match or a capture group
        const captureGroup = args[Number(num)];

        // No match found - return the empty string
        if (!captureGroup) {
          return '';
        }

        // Remove trim strings from the match
        const filteredMatch = filterString(captureGroup, regexScript.trimStrings, { characterOverride });

        // TODO: Handle overlay here

        return filteredMatch;
      });

      // Substitute at the end
      return ctx.substituteParams(replaceWithGroups);
    });

    return newString;
  }

  /**
   * Opens the regex editor.
   * @param {string|boolean} existingId Existing ID
   * @param {boolean} isScoped Is the script scoped to a character?
   * @returns {Promise<void>}
   */
  async function onRegexEditorOpenClick(existingId) {
    const editorHtml = $(await ctx.renderExtensionTemplateAsync('regex', 'editor'));
    const array = presetRegexes;

    // If an ID exists, fill in all the values
    let existingScriptIndex = -1;
    if (existingId) {
      existingScriptIndex = array.findIndex(script => script.id === existingId);
      if (existingScriptIndex !== -1) {
        const existingScript = array[existingScriptIndex];
        if (existingScript.scriptName) {
          editorHtml.find('.regex_script_name').val(existingScript.scriptName);
        } else {
          toastr.error("This script doesn't have a name! Please delete it.");
          return;
        }

        editorHtml.find('.find_regex').val(existingScript.findRegex || '');
        editorHtml.find('.regex_replace_string').val(existingScript.replaceString || '');
        editorHtml.find('.regex_trim_strings').val(existingScript.trimStrings?.join('\n') || []);
        editorHtml.find('input[name="disabled"]').prop('checked', existingScript.disabled ?? false);
        editorHtml.find('input[name="only_format_display"]').prop('checked', existingScript.markdownOnly ?? false);
        editorHtml.find('input[name="only_format_prompt"]').prop('checked', existingScript.promptOnly ?? false);
        editorHtml.find('input[name="run_on_edit"]').prop('checked', existingScript.runOnEdit ?? false);
        editorHtml
          .find('select[name="substitute_regex"]')
          .val(existingScript.substituteRegex ?? substitute_find_regex.NONE);
        editorHtml.find('input[name="min_depth"]').val(existingScript.minDepth ?? '');
        editorHtml.find('input[name="max_depth"]').val(existingScript.maxDepth ?? '');

        existingScript.placement.forEach(element => {
          editorHtml.find(`input[name="replace_position"][value="${element}"]`).prop('checked', true);
        });
      }
    } else {
      editorHtml.find('input[name="only_format_display"]').prop('checked', true);

      editorHtml.find('input[name="run_on_edit"]').prop('checked', true);

      editorHtml.find('input[name="replace_position"][value="1"]').prop('checked', true);
    }

    editorHtml.find('#regex_test_mode_toggle').on('click', function () {
      editorHtml.find('#regex_test_mode').toggleClass('displayNone');
      updateTestResult();
    });

    function updateTestResult() {
      updateInfoBlock(editorHtml);

      if (!editorHtml.find('#regex_test_mode').is(':visible')) {
        return;
      }

      const testScript = {
        id: ctx.uuidv4(),
        scriptName: editorHtml.find('.regex_script_name').val().toString(),
        findRegex: editorHtml.find('.find_regex').val().toString(),
        replaceString: editorHtml.find('.regex_replace_string').val().toString(),
        trimStrings:
          String(editorHtml.find('.regex_trim_strings').val())
            .split('\n')
            .filter(e => e.length !== 0) || [],
        substituteRegex: Number(editorHtml.find('select[name="substitute_regex"]').val()),
        disabled: false,
        promptOnly: false,
        markdownOnly: false,
        runOnEdit: false,
        minDepth: null,
        maxDepth: null,
        placement: null,
      };
      const rawTestString = String(editorHtml.find('#regex_test_input').val());
      const result = runRegexScript(testScript, rawTestString);
      editorHtml.find('#regex_test_output').text(result);
    }

    editorHtml.find('input, textarea, select').on('input', updateTestResult);
    updateInfoBlock(editorHtml);

    const popupResult = await ctx.callGenericPopup(editorHtml.get(0), ctx.POPUP_TYPE.CONFIRM, '', {
      okButton: ctx.t`Save`,
      cancelButton: ctx.t`Cancel`,
      allowVerticalScrolling: true,
    });
    if (popupResult) {
      const newRegexScript = {
        id: existingId ? String(existingId) : ctx.uuidv4(),
        scriptName: String(editorHtml.find('.regex_script_name').val()),
        findRegex: String(editorHtml.find('.find_regex').val()),
        replaceString: String(editorHtml.find('.regex_replace_string').val()),
        trimStrings:
          String(editorHtml.find('.regex_trim_strings').val())
            .split('\n')
            .filter(e => e.length !== 0) || [],
        placement:
          editorHtml
            .find('input[name="replace_position"]')
            .filter(':checked')
            .map(function () {
              return parseInt($(this).val().toString());
            })
            .get()
            .filter(e => !isNaN(e)) || [],
        disabled: editorHtml.find('input[name="disabled"]').prop('checked'),
        markdownOnly: editorHtml.find('input[name="only_format_display"]').prop('checked'),
        promptOnly: editorHtml.find('input[name="only_format_prompt"]').prop('checked'),
        runOnEdit: editorHtml.find('input[name="run_on_edit"]').prop('checked'),
        substituteRegex: Number(editorHtml.find('select[name="substitute_regex"]').val()),
        minDepth: parseInt(String(editorHtml.find('input[name="min_depth"]').val())),
        maxDepth: parseInt(String(editorHtml.find('input[name="max_depth"]').val())),
      };

      saveRegexScript(newRegexScript, existingScriptIndex);
      if (ctx.getCurrentChatId()) {
        ctx.reloadCurrentChat();
      }
    }
  }

  async function popupSortPanel() {
    const popupHtml = $(`
      <div id="preset_regex_sort_panel">
        <div class="regex_editor">
          <h3 class="flex-container justifyCenter alignItemsBaseline">
            <strong data-i18n="预设正则排序">预设正则排序</strong>
            <div class="menu_button menu_button_icon" id="sort_help_button">
              <i class="fa-solid fa-circle-info fa-sm"></i>
              <span class="menu_button_text">使用说明</span>
            </div>
          </h3>

          <small class="flex-container extensions_info">
            通过上移/下移按钮调整预设正则的执行顺序。排序越靠前的正则执行优先级越高。
          </small>
          <hr />

          <div class="flex-container flexFlowColumn" style="max-height: 400px; overflow-y: auto;">
            <div id="sort_regex_list" class="flex-container flexFlowColumn">
              <!-- 动态生成的正则列表 -->
            </div>
          </div>

          <hr />
          
          <div class="flex-container justifySpaceEvenly flexWrap" style="gap: 5px;">
            <div class="menu_button menu_button_icon" id="sort_select_all">
              <i class="fa-solid fa-check-double"></i>
              <span class="menu_button_text">全选</span>
            </div>
            <div class="menu_button menu_button_icon" id="sort_batch_up">
              <i class="fa-solid fa-chevron-up"></i>
              <span class="menu_button_text">批量上移</span>
            </div>
            <div class="menu_button menu_button_icon" id="sort_batch_down">
              <i class="fa-solid fa-chevron-down"></i>
              <span class="menu_button_text">批量下移</span>
            </div>
            <div class="menu_button menu_button_icon" id="sort_reverse_order">
              <i class="fa-solid fa-arrow-rotate-left"></i>
              <span class="menu_button_text">反转顺序</span>
            </div>
            <div class="menu_button menu_button_icon" id="sort_reset_order">
              <i class="fa-solid fa-undo"></i>
              <span class="menu_button_text">重置顺序</span>
            </div>
          </div>
        </div>
      </div>
    `);

    // 渲染正则列表
    function renderSortList() {
      const listContainer = popupHtml.find('#sort_regex_list');
      listContainer.empty();

      if (presetRegexes.length === 0) {
        listContainer.append(`
          <div class="flex-container justifyCenter padding10">
            <small style="color: #888;">暂无预设正则</small>
          </div>
        `);
        return;
      }

      presetRegexes.forEach((regex, index) => {
        const isLocked = lockedRegexes.findIndex(s => s.id === regex.id) !== -1;
        const itemHtml = $(`
          <div class="sort-item flex-container alignItemsCenter padding5" data-index="${index}" style="border: 1px solid #333; margin: 2px 0; border-radius: 4px; background: rgba(42, 42, 42, 0.3);">
            <div class="flex1 flex-container alignItemsCenter">
              <input type="checkbox" class="sort-checkbox" style="margin-right: 8px;" />
              <div class="sort-handle" style="margin-right: 8px; cursor: grab; color: #666;">
                <i class="fa-solid fa-grip-vertical"></i>
              </div>
              <div class="flex1" style="min-width: 0;">
                <div class="sort-name" style="font-weight: bold; color: ${
                  regex.disabled ? '#888' : '#fff'
                }; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  ${isLocked ? '[锁定] ' : ''}${regex.scriptName || '未命名'}
                </div>
                <div class="sort-status" style="font-size: 12px; color: #888;">
                  ${regex.disabled ? '已禁用' : '已启用'} | 优先级: ${index + 1}
                </div>
              </div>
            </div>
            <div class="flex-container flexNoGap">
              <div class="menu_button menu_button_icon sort-up ${
                index === 0 ? 'disabled' : ''
              }" data-index="${index}" title="上移">
                <i class="fa-solid fa-chevron-up"></i>
              </div>
              <div class="menu_button menu_button_icon sort-down ${
                index === presetRegexes.length - 1 ? 'disabled' : ''
              }" data-index="${index}" title="下移">
                <i class="fa-solid fa-chevron-down"></i>
              </div>
            </div>
          </div>
        `);
        listContainer.append(itemHtml);
      });

      // 更新按钮状态
      updateButtonStates();
    }

    // 更新按钮状态
    function updateButtonStates() {
      popupHtml.find('.sort-up').each(function (index) {
        $(this).toggleClass('disabled', index === 0);
      });
      popupHtml.find('.sort-down').each(function (index) {
        $(this).toggleClass('disabled', index === presetRegexes.length - 1);
      });
    }

    // 上移操作
    function moveUp(index) {
      if (index > 0) {
        const temp = presetRegexes[index];
        presetRegexes[index] = presetRegexes[index - 1];
        presetRegexes[index - 1] = temp;
        renderSortList();
      }
    }

    // 下移操作
    function moveDown(index) {
      if (index < presetRegexes.length - 1) {
        const temp = presetRegexes[index];
        presetRegexes[index] = presetRegexes[index + 1];
        presetRegexes[index + 1] = temp;
        renderSortList();
      }
    }

    // 批量上移选中项
    function moveSelectedUp() {
      const selectedItems = [];
      popupHtml.find('.sort-checkbox:checked').each(function () {
        const index = parseInt($(this).closest('.sort-item').data('index'));
        selectedItems.push({ index, regex: presetRegexes[index] });
      });

      if (selectedItems.length === 0) {
        toastr.warning('请先选择要移动的项目');
        return;
      }

      selectedItems.sort((a, b) => a.index - b.index); // 从小到大排序

      // 检查最前面的项目是否已经在顶部
      if (selectedItems[0].index === 0) {
        toastr.info('选中的项目已经在最顶部');
        return;
      }

      // 从前往后移动，避免索引混乱
      let moved = false;
      for (let i = 0; i < selectedItems.length; i++) {
        const currentIndex = selectedItems[i].index - i; // 考虑前面已经移动的偏移
        if (currentIndex > 0) {
          const temp = presetRegexes[currentIndex];
          presetRegexes[currentIndex] = presetRegexes[currentIndex - 1];
          presetRegexes[currentIndex - 1] = temp;
          moved = true;
        }
      }

      if (moved) {
        renderSortList();
        // 重新选中移动后的项目
        setTimeout(() => {
          selectedItems.forEach(item => {
            const newIndex = Math.max(0, item.index - 1);
            popupHtml.find(`.sort-item[data-index="${newIndex}"] .sort-checkbox`).prop('checked', true);
          });
        }, 50);
      }
    }

    // 批量下移选中项
    function moveSelectedDown() {
      const selectedItems = [];
      popupHtml.find('.sort-checkbox:checked').each(function () {
        const index = parseInt($(this).closest('.sort-item').data('index'));
        selectedItems.push({ index, regex: presetRegexes[index] });
      });

      if (selectedItems.length === 0) {
        toastr.warning('请先选择要移动的项目');
        return;
      }

      selectedItems.sort((a, b) => b.index - a.index); // 从大到小排序

      // 检查最后面的项目是否已经在底部
      if (selectedItems[0].index === presetRegexes.length - 1) {
        toastr.info('选中的项目已经在最底部');
        return;
      }

      // 从后往前移动，避免索引混乱
      let moved = false;
      for (let i = 0; i < selectedItems.length; i++) {
        const currentIndex = selectedItems[i].index + i; // 考虑前面已经移动的偏移
        if (currentIndex < presetRegexes.length - 1) {
          const temp = presetRegexes[currentIndex];
          presetRegexes[currentIndex] = presetRegexes[currentIndex + 1];
          presetRegexes[currentIndex + 1] = temp;
          moved = true;
        }
      }

      if (moved) {
        renderSortList();
        // 重新选中移动后的项目
        setTimeout(() => {
          selectedItems.forEach(item => {
            const newIndex = Math.min(presetRegexes.length - 1, item.index + 1);
            popupHtml.find(`.sort-item[data-index="${newIndex}"] .sort-checkbox`).prop('checked', true);
          });
        }, 50);
      }
    }

    // 事件绑定
    popupHtml.on('click', '.sort-up:not(.disabled)', function (e) {
      e.stopPropagation();
      const index = parseInt($(this).data('index'));
      moveUp(index);
    });

    popupHtml.on('click', '.sort-down:not(.disabled)', function (e) {
      e.stopPropagation();
      const index = parseInt($(this).data('index'));
      moveDown(index);
    });

    // 全选/取消全选
    popupHtml.on('click', '#sort_select_all', function () {
      const checkboxes = popupHtml.find('.sort-checkbox');
      const allChecked = checkboxes.length === checkboxes.filter(':checked').length;
      checkboxes.prop('checked', !allChecked);
      $(this).find('i').toggleClass('fa-check-double', !allChecked).toggleClass('fa-minus', allChecked);
      $(this)
        .find('.menu_button_text')
        .text(allChecked ? '全选' : '取消全选');
    });

    // 批量上移
    popupHtml.on('click', '#sort_batch_up', function () {
      moveSelectedUp();
    });

    // 批量下移
    popupHtml.on('click', '#sort_batch_down', function () {
      moveSelectedDown();
    });

    // 反转顺序
    popupHtml.on('click', '#sort_reverse_order', function () {
      presetRegexes.reverse();
      renderSortList();
    });

    // 重置顺序（按名称排序）
    popupHtml.on('click', '#sort_reset_order', function () {
      presetRegexes.sort((a, b) => {
        return (a.scriptName || '').localeCompare(b.scriptName || '');
      });
      renderSortList();
    });

    // 帮助说明
    popupHtml.on('click', '#sort_help_button', function () {
      ctx.callGenericPopup(
        `
        <div style="text-align: left;">
          <h4>排序功能说明</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>单项操作：</strong> 点击单个项目右侧的上移/下移按钮调整位置</li>
            <li><strong>批量选择：</strong> 勾选多个项目的复选框，然后使用"批量上移"或"批量下移"按钮</li>
            <li><strong>全选：</strong> 一键选择或取消选择所有项目</li>
            <li><strong>反转顺序：</strong> 将当前列表完全颠倒</li>
            <li><strong>重置顺序：</strong> 按照正则名称字母顺序重新排列</li>
          </ul>
          <h4>键盘快捷键</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Ctrl+A：</strong> 全选/取消全选</li>
            <li><strong>Ctrl+↑：</strong> 批量上移选中项目</li>
            <li><strong>Ctrl+↓：</strong> 批量下移选中项目</li>
          </ul>
          <p><strong>重要提示：</strong> 排序越靠前的正则执行优先级越高，会先于后面的正则处理文本。合理安排正则顺序可以避免冲突并提高处理效果。</p>
        </div>
      `,
        ctx.POPUP_TYPE.TEXT,
      );
    });

    // 键盘快捷键
    popupHtml.on('keydown', function (e) {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            popupHtml.find('#sort_select_all').click();
            break;
          case 'ArrowUp':
            e.preventDefault();
            moveSelectedUp();
            break;
          case 'ArrowDown':
            e.preventDefault();
            moveSelectedDown();
            break;
        }
      }
    });

    // 初始渲染
    renderSortList();

    // 显示弹窗
    const popupResult = await ctx.callGenericPopup(popupHtml.get(0), ctx.POPUP_TYPE.CONFIRM, '', {
      okButton: '保存排序',
      cancelButton: '取消',
      allowVerticalScrolling: true,
    });

    if (popupResult) {
      // 保存新的排序
      saveRegexesToPreset(presetRegexes);
      await renderPresetRegexes();
      updateSTRegexes();
      toastr.success('预设正则排序已保存');
    } else {
      // 取消时恢复原始顺序
      const originalRegexes = getRegexesFromPreset();
      presetRegexes.length = 0;
      presetRegexes.push(...originalRegexes);
      toastr.info('已取消排序操作');
    }
  }

  function regexFromString(input) {
    try {
      // Parse input
      const m = input.match(/(\/?)(.+)\1([a-z]*)/i);

      // Invalid flags
      if (m[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(m[3])) {
        return RegExp(input);
      }

      // Create the regular expression
      return new RegExp(m[2], m[3]);
    } catch {
      return;
    }
  }

  /**
   * Updates the info block in the regex editor with hints regarding the find regex.
   * @param {JQuery<HTMLElement>} editorHtml The editor HTML
   */
  function updateInfoBlock(editorHtml) {
    const infoBlock = editorHtml.find('.info-block').get(0);
    const infoBlockFlagsHint = editorHtml.find('#regex_info_block_flags_hint');
    const findRegex = String(editorHtml.find('.find_regex').val());

    infoBlockFlagsHint.hide();

    // Clear the info block if the find regex is empty
    if (!findRegex) {
      setInfoBlock(infoBlock, ctx.t`Find Regex is empty`, 'info');
      return;
    }

    try {
      const regex = regexFromString(findRegex);
      if (!regex) {
        throw new Error(ctx.t`Invalid Find Regex`);
      }

      const flagInfo = [];
      flagInfo.push(regex.flags.includes('g') ? ctx.t`Applies to all matches` : ctx.t`Applies to the first match`);
      flagInfo.push(regex.flags.includes('i') ? ctx.t`Case insensitive` : ctx.t`Case sensitive`);

      setInfoBlock(infoBlock, flagInfo.join('. '), 'hint');
      infoBlockFlagsHint.show();
    } catch (error) {
      setInfoBlock(infoBlock, error.message, 'error');
    }
  }
  /**
   * Updates the content and style of an information block
   * @param {string | HTMLElement} target - The CSS selector or the HTML element of the information block
   * @param {string | HTMLElement?} content - The message to display inside the information block (supports HTML) or an HTML element
   * @param {'hint' | 'info' | 'warning' | 'error'} [type='info'] - The type of message, which determines the styling of the information block
   */
  function setInfoBlock(target, content, type = 'info') {
    if (!content) {
      clearInfoBlock(target);
      return;
    }

    const infoBlock = typeof target === 'string' ? document.querySelector(target) : target;
    if (infoBlock) {
      infoBlock.className = `info-block ${type}`;
      if (typeof content === 'string') {
        infoBlock.innerHTML = content;
      } else {
        infoBlock.innerHTML = '';
        infoBlock.appendChild(content);
      }
    }
  }

  /**
   * Clears the content and style of an information block.
   * @param {string | HTMLElement} target - The CSS selector or the HTML element of the information block
   */
  function clearInfoBlock(target) {
    const infoBlock = typeof target === 'string' ? document.querySelector(target) : target;
    if (infoBlock && infoBlock.classList.contains('info-block')) {
      infoBlock.className = '';
      infoBlock.innerHTML = '';
    }
  }
  async function saveRegexScript(regexScript, existingScriptIndex) {
    const array = presetRegexes;
    if (!regexScript.id) {
      regexScript.id = ctx.uuidv4();
    }
    // Is the script name undefined or empty?
    if (!regexScript.scriptName) {
      toastr.error(ctx.t`Could not save regex script: The script name was undefined or empty!`);
      return;
    }

    // Is a find regex present?
    if (regexScript.findRegex.length === 0) {
      toastr.warning(ctx.t`This regex script will not work, but was saved anyway: A find regex isn't present.`);
    }

    // Is there someplace to place results?
    if (regexScript.placement.length === 0) {
      toastr.warning(
        ctx.t`This regex script will not work, but was saved anyway: One "Affects" checkbox must be selected!`,
      );
    }

    if (existingScriptIndex !== -1) {
      array[existingScriptIndex] = regexScript;
    } else {
      array.push(regexScript);
    }
    await renderPresetRegexes();
    saveRegexesToPreset(presetRegexes);
    updateSTRegexes();
    // ctx.reloadCurrentChat();
  }

  function loadLockedRegexes() {
    if (
      SGlobalSettings.RegexBinding &&
      SGlobalSettings.RegexBinding.lockedRegexes &&
      SGlobalSettings.RegexBinding.lockedRegexes.length > 0
    ) {
      return SGlobalSettings.RegexBinding.lockedRegexes;
    }
    if (!ctx.extensionSettings.regexBinding_scriptId) {
      return [];
    }
    if (typeof TavernHelper !== 'object') {
      return [];
    }
    const variables = TavernHelper.getVariables({
      type: 'script',
      script_id: ctx.extensionSettings.regexBinding_scriptId,
    });
    if (variables && variables['locked-regexes']) {
      const json = JSON.stringify(variables['locked-regexes']);
      if (json) {
        const result = JSON.parse(json);
        // if not array, return []
        if (!Array.isArray(result)) {
          toastr.error('加载锁定正则时出错，请尝试更新酒馆助手');
          return [];
        }
        return result;
      } else {
        return [];
      }
    }
    return [];
  }

  function saveLockedRegexes(regexes) {
    if (!SGlobalSettings.RegexBinding) {
      SGlobalSettings.RegexBinding = {};
    }
    SGlobalSettings.RegexBinding.lockedRegexes = regexes;
    ctx.extensionSettings.SPreset = SGlobalSettings;
    ctx.saveSettingsDebounced();
  }

  function getRegexesFromPreset() {
    if (SPresetSettings.RegexBinding.regexes && SPresetSettings.RegexBinding.regexes.length > 0) {
      return SPresetSettings.RegexBinding.regexes;
    }
    const json = getPrompt('regexes-bindings') || '';
    return json ? JSON.parse(json) : [];
  }

  function saveRegexesToPreset(regexes) {
    const currentRegexes = getRegexesFromPreset();
    // if regex in locked and not in currentRegexes, do not save it
    const newRegexes = regexes.filter(
      s => !lockedRegexes.find(l => l.id === s.id) || currentRegexes.find(c => c.id === s.id),
    );
    SPresetSettings.RegexBinding.regexes = newRegexes;
    if (!ctx.chatCompletionSettings.extensions) {
      ctx.chatCompletionSettings.extensions = {};
    }
    ctx.chatCompletionSettings.extensions.SPreset = SPresetSettings;
    if (getPrompt('SPresetSettings')) {
      setPrompt('SPresetSettings', JSON.stringify(SPresetSettings));
    } else {
      addPrompt('SPresetSettings', 'SPreset配置', JSON.stringify(SPresetSettings));
    }
    deletePrompt('regexes-bindings');
    ctx.saveSettingsDebounced();
  }
};

const promptTemplate = {
  identifier: '',
  system_prompt: false,
  enabled: false,
  marker: false,
  name: '',
  role: 'system',
  content: '',
  injection_position: 0,
  injection_depth: 4,
  injection_order: 100,
  injection_trigger: null,
  forbid_overrides: false,
};

// ============================================================
// 工具绑定 —— SPreset Tool Binding (类似 SToolBook)
// ============================================================

const SPRESET_TOOL_REQUIRED_KEYS = ['name', 'description', 'parameters', 'action'];
const spresetToolEvaluationCache = new Map();
const spresetToolDefinitionCache = new Map();

function evaluateSPresetToolCode(code) {
  if (!code || !code.trim()) {
    return { valid: false, error: '代码不能为空', tool: null };
  }
  const cached = spresetToolEvaluationCache.get(code);
  if (cached && cached.expires > Date.now()) return cached.result;
  if (cached) spresetToolEvaluationCache.delete(code);
  try {
    const tool = new Function(code)();
    if (tool === null || tool === undefined || typeof tool !== 'object') {
      return { valid: false, error: '代码必须返回一个对象', tool: null };
    }
    const missing = SPRESET_TOOL_REQUIRED_KEYS.filter(k => !(k in tool));
    if (missing.length > 0) {
      return { valid: false, error: '缺少必要属性: ' + missing.join(', '), tool: null };
    }
    if (typeof tool.name !== 'string' || !tool.name.trim()) {
      return { valid: false, error: 'name 必须是非空字符串', tool: null };
    }
    if (typeof tool.description !== 'string') {
      return { valid: false, error: 'description 必须是字符串', tool: null };
    }
    if (typeof tool.parameters !== 'object') {
      return { valid: false, error: 'parameters 必须是对象', tool: null };
    }
    if (typeof tool.action !== 'function') {
      return { valid: false, error: 'action 必须是函数', tool: null };
    }
    const result = { valid: true, tool };
    spresetToolEvaluationCache.set(code, { expires: Date.now() + 1000, result });
    if (spresetToolEvaluationCache.size > 512) {
      spresetToolEvaluationCache.delete(spresetToolEvaluationCache.keys().next().value);
    }
    return result;
  } catch (e) {
    return { valid: false, error: e.message || String(e), tool: null };
  }
}

/**
 * 验证工具代码是否返回包含必要属性的对象
 * @param {string} code
 * @returns {{ valid: boolean, error?: string }}
 */
function validateSPresetToolCode(code) {
  const { valid, error, tool } = evaluateSPresetToolCode(code);
  return valid ? { valid: true, name: tool.name } : { valid: false, error };
}

/**
 * 执行用户工具代码，返回工具定义对象
 * @param {string} code
 * @returns {object|null}
 */
function executeSPresetToolCode(code) {
  const result = evaluateSPresetToolCode(code);
  if (result.valid) return result.tool;
  if (result.error) console.warn('[SPreset-ToolBinding] 执行工具代码失败:', result.error);
  return null;
}

function extractSPresetFunctionBody(fn) {
  if (typeof fn !== 'function') return '';
  const source = Function.prototype.toString.call(fn).trim();
  const arrowIndex = source.indexOf('=>');
  const functionOrMethod = /^(?:async\s+)?function\b/.test(source)
    || /^(?:async\s+)?[\w$]+\s*\(/.test(source);
  if (!functionOrMethod && arrowIndex !== -1) {
    const expression = source.slice(arrowIndex + 2).trim();
    if (expression.startsWith('{') && expression.endsWith('}')) {
      return expression.slice(1, -1).trim();
    }
    return expression ? `return ${expression};` : '';
  }
  const firstBrace = source.indexOf('{');
  const lastBrace = source.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return source.slice(firstBrace + 1, lastBrace).trim();
  }
  return '';
}

function parseSPresetToolCodeToForm(code) {
  const evaluation = evaluateSPresetToolCode(code);
  if (!evaluation.valid) return { valid: false, error: evaluation.error || '工具代码无效' };
  const tool = evaluation.tool;

  const properties = tool.parameters?.properties && typeof tool.parameters.properties === 'object'
    ? tool.parameters.properties
    : {};
  const supportedToolKeys = new Set([
    'name', 'displayName', 'description', 'parameters', 'action', 'formatMessage', 'stealth',
  ]);
  const supportedParameterKeys = new Set(['type', 'properties', 'required']);
  const supportedPropertyKeys = new Set(['type', 'description']);
  const supportedTypes = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object']);
  const unsupported = [];
  Object.keys(tool).filter(key => !supportedToolKeys.has(key)).forEach(key => unsupported.push(`工具字段 ${key}`));
  Object.keys(tool.parameters || {}).filter(key => !supportedParameterKeys.has(key))
    .forEach(key => unsupported.push(`parameters.${key}`));
  if (tool.parameters?.type !== 'object') unsupported.push('parameters.type');
  if (Array.isArray(tool.parameters?.properties)) unsupported.push('parameters.properties');
  if (tool.parameters?.required !== undefined && !Array.isArray(tool.parameters.required)) {
    unsupported.push('parameters.required');
  }
  if (tool.displayName !== undefined && typeof tool.displayName !== 'string') unsupported.push('displayName');
  if (tool.formatMessage !== undefined && typeof tool.formatMessage !== 'function') unsupported.push('formatMessage');
  if (tool.stealth !== undefined && typeof tool.stealth !== 'boolean') unsupported.push('stealth');
  if (Array.isArray(tool.parameters?.required)) {
    tool.parameters.required.filter(name => !Object.prototype.hasOwnProperty.call(properties, name))
      .forEach(name => unsupported.push(`required 中不存在的参数 ${name}`));
  }
  Object.entries(properties).forEach(([name, schema]) => {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      unsupported.push(`参数 ${name} 的 schema`);
      return;
    }
    Object.keys(schema).filter(key => !supportedPropertyKeys.has(key))
      .forEach(key => unsupported.push(`参数 ${name}.${key}`));
    if (typeof schema.type !== 'string' || !supportedTypes.has(schema.type)) {
      unsupported.push(`参数 ${name}.type`);
    }
    if (schema.description !== undefined && typeof schema.description !== 'string') {
      unsupported.push(`参数 ${name}.description`);
    }
  });
  if (unsupported.length) {
    return {
      valid: false,
      error: `包含表单模式暂不支持的高级定义（${unsupported.slice(0, 4).join('、')}），请保留代码模式`,
    };
  }
  const required = new Set(Array.isArray(tool.parameters?.required) ? tool.parameters.required : []);
  const parameters = Object.entries(properties).map(([name, schema]) => ({
    name,
    type: Array.isArray(schema?.type) ? schema.type[0] : schema?.type || 'string',
    description: String(schema?.description ?? ''),
    required: required.has(name),
  }));

  return {
    valid: true,
    form: {
      name: String(tool.name ?? ''),
      displayName: String(tool.displayName ?? ''),
      description: String(tool.description ?? ''),
      parameters,
      actionBody: extractSPresetFunctionBody(tool.action),
      formatMessageBody: extractSPresetFunctionBody(tool.formatMessage),
      stealth: Boolean(tool.stealth),
    },
  };
}

/**
 * 获取当前 prompt_order 中已启用的 identifier 集合
 * @returns {Set<string>}
 */
function getActiveEntryIdentifiers() {
  const settings = ctx.chatCompletionSettings;
  const promptOrder = settings.prompt_order || [];
  const activeOrderEntry = promptOrder.find(po => po.character_id === 100001);
  if (!activeOrderEntry) return new Set();
  const enabled = new Set();
  for (const item of activeOrderEntry.order) {
    if (item.enabled !== false) {
      enabled.add(item.identifier);
    }
  }
  return enabled;
}

/**
 * 注销所有已注册的 SPreset 工具
 */
function unregisterAllSPresetTools() {
  const { unregisterFunctionTool } = SillyTavern.getContext();
  for (const [toolId] of spresetRegisteredTools) {
    try { unregisterFunctionTool(toolId); } catch (e) { /* ignore */ }
  }
  spresetRegisteredTools.clear();
  spresetToolDefinitionCache.clear();
  console.log('[SPreset-ToolBinding] 已注销所有工具');
}

/**
 * 根据 ToolBindings + 激活条目重新同步工具注册
 */
function syncSPresetToolRegistrations() {
  const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
  const toolBindings = SPresetSettings.ToolBindings || {};
  const activeIdentifiers = getActiveEntryIdentifiers();
  const usedDefinitionUuids = new Set();

  // 收集应注册的工具
  const shouldRegister = new Map();
  for (const [identifier, binding] of Object.entries(toolBindings)) {
    if (!binding.valid || !binding.enabled) continue;
    if (!activeIdentifiers.has(identifier)) continue;

    const cachedDefinition = binding.uuid ? spresetToolDefinitionCache.get(binding.uuid) : null;
    const toolDef = cachedDefinition?.code === binding.code
      ? cachedDefinition.toolDef
      : executeSPresetToolCode(binding.code);
    if (!toolDef) continue;
    if (binding.uuid) {
      spresetToolDefinitionCache.set(binding.uuid, { code: binding.code, toolDef });
      usedDefinitionUuids.add(binding.uuid);
    }

    const toolId = `${toolDef.name}`;
    if (shouldRegister.has(toolId)) {
      console.error(`[SPreset-ToolBinding] 工具名称冲突: ${toolId}，已保留第一个启用绑定`);
      continue;
    }
    shouldRegister.set(toolId, { toolDef, identifier, uuid: binding.uuid });
  }
  for (const uuid of spresetToolDefinitionCache.keys()) {
    if (!usedDefinitionUuids.has(uuid)) spresetToolDefinitionCache.delete(uuid);
  }

  // 注销不再需要的工具
  for (const [toolId, uuid] of spresetRegisteredTools) {
    if (!shouldRegister.has(toolId) || shouldRegister.get(toolId).uuid !== uuid) {
      try { unregisterFunctionTool(toolId); } catch (e) { /* ignore */ }
      spresetRegisteredTools.delete(toolId);
    }
  }

  // 注册新的 / uuid 变化的工具
  for (const [toolId, { toolDef, identifier, uuid }] of shouldRegister) {
    if (spresetRegisteredTools.has(toolId) && spresetRegisteredTools.get(toolId) === uuid) {
      continue;
    }
    try {
      if (spresetRegisteredTools.has(toolId)) {
        unregisterFunctionTool(toolId);
      }
      registerFunctionTool({
        name: toolId,
        displayName: toolDef.displayName || toolDef.name,
        description: toolDef.description,
        parameters: toolDef.parameters,
        action: toolDef.action,
        formatMessage: toolDef.formatMessage,
        stealth: toolDef.stealth ?? false,
        shouldRegister: () => getActiveEntryIdentifiers().has(identifier),
      });
      spresetRegisteredTools.set(toolId, uuid);
      console.log(`[SPreset-ToolBinding] 已注册工具: ${toolId} (来自 ${identifier})`);
    } catch (e) {
      console.error(`[SPreset-ToolBinding] 注册工具 ${toolId} 失败:`, e);
    }
  }
}

function getPrompt(identifier) {
  const oai_settings = ctx.chatCompletionSettings;
  const prompts = oai_settings.prompts;
  const prompt = prompts.find(p => p.identifier === identifier)?.content;
  return prompt || null;
}

function setPrompt(identifier, content) {
  const oai_settings = ctx.chatCompletionSettings;
  const prompts = oai_settings.prompts;
  const prompt = prompts.find(p => p.identifier === identifier);
  if (prompt) {
    prompt.content = content;
  }
}

function addPrompt(id, name, content, extras = {}) {
  const prompt = { ...promptTemplate };
  prompt.identifier = id;
  prompt.name = name;
  prompt.content = content;
  prompt.role = extras.role || 'system';
  prompt.system_prompt = extras.system_prompt || false;
  prompt.enabled = extras.enabled || false;
  prompt.marker = extras.marker || false;
  prompt.injection_position = extras.injection_position || 0;
  prompt.injection_depth = extras.injection_depth || 4;
  prompt.injection_order = extras.injection_order || 100;
  prompt.injection_trigger = extras.injection_trigger;
  prompt.forbid_overrides = extras.forbid_overrides || false;
  const oai_settings = ctx.chatCompletionSettings;
  const prompts = oai_settings.prompts;
  prompts.push(prompt);
}
function deletePrompt(identifier) {
  const oai_settings = ctx.chatCompletionSettings;
  const prompts = oai_settings.prompts;
  const prompt = prompts.find(p => p.identifier === identifier);
  if (prompt) {
    prompts.splice(prompts.indexOf(prompt), 1);
  }
}
