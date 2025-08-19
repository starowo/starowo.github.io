// 全局唯一标记（页面内多次加载复用同一个 Symbol）
const MARK = Symbol.for('plugin.regexPrefixProxyInfo');
const sanitizeFileName = name => name.replace(/[\s.<>:"/\\|?*\x00-\x1F\x7F]/g, '_').toLowerCase();
function isOurs(val) {
  try {
    return !!(val && val[MARK] && val[MARK].isOurProxy);
  } catch {
    return false;
  }
}

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

/* deprecated
function reproxy(settings, prop, prefixExtras) {
  let cur = settings[prop];

  if (isOurs(cur)) {
    const info = cur[MARK];
    try {
      info.revoke?.();
    } catch {
      console.error('[RegexProxy] revoke error', cur);
    }
    cur = info.raw; // 原始数组本体
  }

  if (!Array.isArray(cur)) {
    return false;
  }
  const base = cur;

  const handler = createPrefixHandler(base, prefixExtras);
  const { proxy, revoke } = Proxy.revocable(base, handler);

  Object.defineProperty(base, MARK, {
    configurable: true,
    enumerable: false,
    value: {
      isOurProxy: true,
      raw: base,
      revoke,
      version: (base[MARK]?.version ?? 0) + 1,
      ts: Date.now(),
    },
  });

  settings[prop] = proxy;
  return true;
}

function createPrefixHandler(base, prefix) {
  // remove all elements with duplicate ids from base
  prefix.forEach(p => {
    const index = base.findIndex(b => b.id === p.id);
    if (index !== -1) {
      base.splice(index, 1);
    }
  });
  const isIndex = p => typeof p === 'string' && String(+p) === p && +p >= 0;

  const toFull = () => prefix.concat(base);

  const BYPASS_TOKEN = '#saved_regex_scripts';
  const isSavedRendererCb = cb => {
    try {
      return typeof cb === 'function' && cb.toString().includes(BYPASS_TOKEN);
    } catch {
      return false;
    }
  };

  return {
    get(target, prop, recv) {
      const P = prefix.length;
      if (prop === Symbol.iterator) {
        const full = toFull();
        return full[Symbol.iterator].bind(full);
      }

      if (prop === 'length') return P + target.length;

      if (isIndex(prop)) {
        const i = +prop;
        return i < P ? prefix[i] : target[i - P];
      }

      // fuck saveSettings
      if (prop === 'toJSON') {
        return function () {
          return target.slice();
        };
      }

      const val = Reflect.get(target, prop, recv);
      if (typeof val === 'function') {
        const name = prop;

        // fuck SillyTavern
        if (name === 'forEach') {
          return function forEach(cb, thisArg) {
            if (isSavedRendererCb(cb)) {
              const arr = target;
              return Array.prototype.forEach.call(arr, (obj, i) => cb(obj, i + P), thisArg);
            } else {
              const arr = toFull();
              return Array.prototype.forEach.call(arr, cb, thisArg);
            }
          };
        }

        // fuck 提示词模板和酒馆助手
        if (name === 'filter') {
          return function filter(cb, thisArg) {
            return Array.prototype.filter.call(target, cb, thisArg);
          };
        }

        const readOnly = [
          'slice',
          'map',
          'find',
          'findIndex',
          'some',
          'every',
          'includes',
          'indexOf',
          'join',
          'toString',
          'entries',
          'keys',
          'values',
          'flat',
          'flatMap',
        ];
        if (readOnly.includes(name)) {
          return Function.prototype.call.bind(Array.prototype[name], toFull());
        }

        if (name === 'splice') {
          return function splice(start, deleteCount, ...items) {
            const s = start - P;
            if (s < 0) {
              // do nothing
              return;
            }
            return Array.prototype.splice.call(target, s, deleteCount, ...items);
          };
        }
        if (['unshift', 'push', 'pop', 'shift', 'sort', 'reverse', 'copyWithin', 'fill'].includes(name)) {
          return (...args) => Array.prototype[name].apply(target, args);
        }
      }
      return val;
    },

    set(target, prop, value, recv) {
      const P = prefix.length;
      if (prop === 'length') {
        const L = Number(value);
        target.length = Math.max(0, L - P);
        return true;
      }
      if (isIndex(prop)) {
        const i = +prop - P;
        target[i] = value;
        return true;
      }
      return Reflect.set(target, prop, value, recv);
    },

    deleteProperty(target, prop) {
      const P = prefix.length;
      if (isIndex(prop)) {
        const i = +prop - P;
        return delete target[i];
      }
      return Reflect.deleteProperty(target, prop);
    },
  };
}
 */
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

(() => {
  const extensions = SillyTavern.extensionSettings;
  const presetRegexes = getRegexesFromPreset();
  const lockedRegexes = loadLockedRegexes();

  const injectCssStyles = `
    <style id="regex-binding-css">
      #saved_regex_scripts [id^="preset_"] {
        display: none;
      }
    </style>
  `;
  if ($('#regex-binding-css').length === 0) {
    $('head').append(injectCssStyles);
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

  $('#import_regex').before(importButton);
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
    const selector = '#saved_preset_scripts .regex-script-label:has(.regex_bulk_checkbox:checked)';
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
  });

  $('#bulk_delete_regex').on('click', async function () {
    const scripts = getSelectedScripts();
    if (scripts.length !== 0) {
      toastr.warning(`预设绑定正则不支持批量删除`);
      return;
    }
  });

  window.regexBinding_onSortableStop = async function () {
    // 深拷贝
    const oldScripts = JSON.parse(JSON.stringify(presetRegexes));
    presetRegexes.length = 0;
    $('#saved_preset_scripts')
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
  };

  $('#saved_preset_scripts').sortable({
    delay: SillyTavern.isMobile() ? 750 : 50,
    stop: window.regexBinding_onSortableStop,
  });
  $('#saved_preset_scripts').sortable('enable');

  const observer = new MutationObserver(function () {
    injectBindButtons();
  });
  const observerTarget = $('#saved_regex_scripts');
  observer.observe(observerTarget[0], {
    childList: true,
    subtree: true,
  });

  updateSTRegexes();
  renderPresetRegexes();

  eventOn('settings_updated', () => {
    const newPresetRegexes = getRegexesFromPreset();
    // check if newPresetRegexes is different from presetRegexes
    let changed = false;
    if (newPresetRegexes.length !== presetRegexes.length) {
      changed = true;
    } else {
      for (let i = 0; i < presetRegexes.length; i++) {
        if (newPresetRegexes[i].id !== presetRegexes[i].id) {
          changed = true;
          break;
        }
      }
    }
    /*
    if (!extensions.regex[MARK]) {
      reproxy(extensions, 'regex', presetRegexes);
    }
    */
    if (changed || lockedRegexes.length > 0) {
      presetRegexes.length = 0;
      presetRegexes.push(...newPresetRegexes);
      if (lockedRegexes.length > 0) {
        for (const regex of lockedRegexes) {
          const index = presetRegexes.findIndex(s => s.id === regex.id);
          if (index === -1) {
            presetRegexes.unshift(regex);
          } else {
            presetRegexes[index] = regex;
          }
        }
      }
      saveRegexesToPreset(presetRegexes);
    }
    renderPresetRegexes();
    if (changed) {
      updateSTRegexes();
    }
  });

  function updateSTRegexes() {
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
      extensions.regex = newPresetRegexes.concat(stRegexes.filter(s => !s.id.startsWith('preset_')));
      SillyTavern.reloadCurrentChat();
    } else {
      presetRegexes.forEach((s, i) => {
        extensions.regex[i] = {
          ...s,
          id: 'preset_' + s.id,
        };
      });
    }
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
      script.id = SillyTavern.uuidv4();

      presetRegexes.push(script);
      await renderPresetRegexes();

      saveRegexesToPreset(presetRegexes);
      toastr.success('Imported script: ' + script.scriptName);
      if (SillyTavern.getCurrentChatId()) {
        SillyTavern.reloadCurrentChat();
      }
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
          const chat = await SillyTavern.chat;
          if (chat.length >= 10) {
            const confirm = await SillyTavern.callGenericPopup(
              '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
              SillyTavern.POPUP_TYPE.CONFIRM,
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

  async function renderPresetRegexes() {
    injectBindButtons();
    updateCss();
    const regex_settings = $('.regex_settings');
    let block = regex_settings.find('#preset_regexes_block');
    if (block.length === 0) {
      block = injectPresetBlock(regex_settings);
    }

    block = block.find('#saved_preset_scripts');
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
          if (SillyTavern.getCurrentChatId()) {
            SillyTavern.reloadCurrentChat();
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
        const chat = await SillyTavern.chat;
        if (chat.length >= 10) {
          const confirm = await SillyTavern.callGenericPopup(
            '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
            SillyTavern.POPUP_TYPE.CONFIRM,
          );
          if (!confirm) {
            return;
          }
        }
        presetRegexes.splice(index, 1);
        const i = _.findLastIndex(extensions.regex, s => s.id.startsWith('preset_'));
        if (i !== -1) {
          extensions.regex.splice(i, 0, script);
        } else {
          extensions.regex.unshift(script);
        }
        await renderPresetRegexes();
        saveRegexesToPreset(presetRegexes);
        updateSTRegexes();
      });
      scriptDiv.find('.delete_regex').on('click', async function () {
        const chat = await SillyTavern.chat;
        const confirm = await SillyTavern.callGenericPopup(
          chat.length >= 10
            ? '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要删除吗？'
            : '你确定要删除这个正则吗？',
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (!confirm) {
          return;
        }
        presetRegexes.splice(index, 1);
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
    const htmlTemplate = `
    <div id="preset_regexes_block" class="padding5">
      <div>
        <strong data-i18n="ext_regex_preset_regexes">预设绑定正则</strong>
      </div>
      <small data-i18n="ext_regex_preset_regexes_desc">
        影响所有角色，保存在预设中。
      </small>
      <div id="saved_preset_scripts" no-scripts-text="No scripts found" data-i18n="[no-scripts-text]No scripts found" class="flex-container regex-script-container flexFlowColumn"></div>
    </div>
    <hr />
    `;
    const global_scripts_block = regex_settings.find('#global_scripts_block');
    global_scripts_block.before(htmlTemplate);
    $('#saved_preset_scripts').sortable({
      delay: SillyTavern.isMobile ? 750 : 50,
      stop: window.regexBinding_onSortableStop,
    });
    $('#saved_preset_scripts').sortable('enable');
    return regex_settings.find('#preset_regexes_block');
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
      const subTrimString = SillyTavern.substituteParams(trimString, undefined, characterOverride);
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
          return SillyTavern.substituteParamsExtended(regexScript.findRegex);
        case substitute_find_regex.ESCAPED:
          return SillyTavern.substituteParamsExtended(regexScript.findRegex, {}, sanitizeRegexMacro);
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
        const match = args[Number(num)];

        // No match found - return the empty string
        if (!match) {
          return '';
        }

        // Remove trim strings from the match
        const filteredMatch = filterString(match, regexScript.trimStrings, { characterOverride });

        // TODO: Handle overlay here

        return filteredMatch;
      });

      // Substitute at the end
      return SillyTavern.substituteParams(replaceWithGroups);
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
    const editorHtml = $(await SillyTavern.renderExtensionTemplateAsync('regex', 'editor'));
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
        id: SillyTavern.uuidv4(),
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

    const popupResult = await SillyTavern.callGenericPopup(editorHtml.get(0), SillyTavern.POPUP_TYPE.CONFIRM, '', {
      okButton: SillyTavern.t`Save`,
      cancelButton: SillyTavern.t`Cancel`,
      allowVerticalScrolling: true,
    });
    if (popupResult) {
      const newRegexScript = {
        id: existingId ? String(existingId) : SillyTavern.uuidv4(),
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
      if (SillyTavern.getCurrentChatId()) {
        SillyTavern.reloadCurrentChat();
      }
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
      setInfoBlock(infoBlock, SillyTavern.t`Find Regex is empty`, 'info');
      return;
    }

    try {
      const regex = regexFromString(findRegex);
      if (!regex) {
        throw new Error(SillyTavern.t`Invalid Find Regex`);
      }

      const flagInfo = [];
      flagInfo.push(
        regex.flags.includes('g') ? SillyTavern.t`Applies to all matches` : SillyTavern.t`Applies to the first match`,
      );
      flagInfo.push(regex.flags.includes('i') ? SillyTavern.t`Case insensitive` : SillyTavern.t`Case sensitive`);

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
      regexScript.id = SillyTavern.uuidv4();
    }
    // Is the script name undefined or empty?
    if (!regexScript.scriptName) {
      toastr.error(SillyTavern.t`Could not save regex script: The script name was undefined or empty!`);
      return;
    }

    // Is a find regex present?
    if (regexScript.findRegex.length === 0) {
      toastr.warning(SillyTavern.t`This regex script will not work, but was saved anyway: A find regex isn't present.`);
    }

    // Is there someplace to place results?
    if (regexScript.placement.length === 0) {
      toastr.warning(
        SillyTavern.t`This regex script will not work, but was saved anyway: One "Affects" checkbox must be selected!`,
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
    // SillyTavern.reloadCurrentChat();
  }

  function loadLockedRegexes() {
    const variables = getVariables({
      type: 'script',
      script_id: getScriptId(),
    });
    if (variables && variables['locked-regexes']) {
      const json = JSON.stringify(variables['locked-regexes']);
      if (json) {
        return JSON.parse(json);
      } else {
        return [];
      }
    }
    return [];
  }

  function saveLockedRegexes(regexes) {
    const json = JSON.stringify(regexes);
    insertOrAssignVariables({
      'locked-regexes': json,
    }, {
      type: 'script',
      script_id: getScriptId(),
    });
  }

  function getRegexesFromPreset() {
    const json = getPrompt('regexes-bindings') || '';
    return json ? JSON.parse(json) : [];
  }

  function saveRegexesToPreset(regexes) {
    const currentRegexes = getRegexesFromPreset();
    // if regex in locked and not in currentRegexes, do not save it
    const newRegexes = regexes.filter(
      s => !lockedRegexes.find(l => l.id === s.id) || currentRegexes.find(c => c.id === s.id),
    );
    const json = JSON.stringify(newRegexes);
    if (!getPrompt('regexes-bindings')) {
      addPrompt('regexes-bindings', '【勿删】绑定正则', json);
    } else {
      setPrompt('regexes-bindings', json);
    }
    updatePresetWith('in_use', preset => {
      return getPreset('in_use');
    });
  }

  function getPrompt(identifier) {
    const oai_settings = SillyTavern.chatCompletionSettings;
    const prompts = oai_settings.prompts;
    const prompt = prompts.find(p => p.identifier === identifier)?.content;
    return prompt || null;
  }

  function setPrompt(identifier, content) {
    const oai_settings = SillyTavern.chatCompletionSettings;
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
    const oai_settings = SillyTavern.chatCompletionSettings;
    const prompts = oai_settings.prompts;
    prompts.push(prompt);
  }
})();
