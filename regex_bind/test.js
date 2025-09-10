// 预设增强功能配置
// 将对应模块设置为 true 以启用该功能在菜单中显示
const SPresetSettings = {
  RegexBinding: true, // 绑定内置正则功能
  ChatSquash: false, // 聊天压缩功能（待开发）
  BetterWordbook: false, // 增强词典功能（待开发）
};

const menuDom = $(`
  <div class="s_preset_settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>
          预设增强功能
        </b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div id="s_preset_menu_sections" class="flex-container flexFlowColumn">
          <!-- 动态添加的功能模块将插入这里 -->
        </div>
      </div>
    </div>
  </div>
`);

$(() => {
  injectSPresetMenu();
  RegexBinding();
});

function injectSPresetMenu() {
  const menuButton = $(`
    <div id="open_s_preset_menu" class="menu_button menu_button_icon interactable" title="打开预设增强菜单" tabindex="0">
      <i class="fa-fw fa-solid fa-s" style="color: #ff0000;"></i>
    </div>
  `);
  $('#openai_preset_import_file').before(menuButton);

  // 添加菜单展开/收起功能
  menuDom.find('.inline-drawer-toggle').on('click', function () {
    const content = menuDom.find('.inline-drawer-content');
    const icon = menuDom.find('.inline-drawer-icon');

    if (content.is(':visible')) {
      content.hide();
      icon.removeClass('up').addClass('down');
    } else {
      content.show();
      icon.removeClass('down').addClass('up');
    }
  });

  // 绑定菜单按钮点击事件
  menuButton.on('click', openSPresetMenu);

  function openSPresetMenu() {
    // 确保展开状态
    const content = menuDom.find('.inline-drawer-content');
    const icon = menuDom.find('.inline-drawer-icon');
    content.show();
    icon.removeClass('down').addClass('up');

    SillyTavern.getContext().callGenericPopup(menuDom.get(0), SillyTavern.getContext().POPUP_TYPE.DISPLAY);
  }

  // 初始化所有功能模块
  initializeMenuSections();
}

// 添加功能模块到菜单的函数
function addMenuSection(sectionId, title, description, content) {
  const sectionHtml = $(`
    <div id="${sectionId}_section" class="padding5">
      <div>
        <strong>${title}</strong>
      </div>
      <small>${description}</small>
      <div class="flex-container">
        ${content}
      </div>
    </div>
    <hr />
  `);

  menuDom.find('#s_preset_menu_sections').append(sectionHtml);
}

// 初始化所有功能模块
function initializeMenuSections() {
  // 清空现有内容
  menuDom.find('#s_preset_menu_sections').empty();

  // 添加绑定内置正则模块
  if (SPresetSettings.RegexBinding) {
    addRegexBindingSection();
  }

  // 未来可以在这里添加更多模块
  // if (SPresetSettings.ChatSquash) {
  //   addChatSquashSection();
  // }
  // if (SPresetSettings.BetterWordbook) {
  //   addBetterWordbookSection();
  // }
}

// 示例：添加新功能模块的模板
// function addChatSquashSection() {
//   const buttons = `
//     <div class="menu_button menu_button_icon" id="chat_squash_settings" title="聊天压缩设置">
//       <i class="fa-solid fa-compress"></i>
//       <small>压缩设置</small>
//     </div>
//     <div class="menu_button menu_button_icon" id="chat_squash_help" title="聊天压缩帮助">
//       <i class="fa-solid fa-circle-question"></i>
//       <small>使用帮助</small>
//     </div>
//   `;
//
//   addMenuSection(
//     'chat_squash',
//     '聊天压缩',
//     '智能压缩长对话，节省上下文空间。',
//     buttons
//   );
//
//   // 绑定事件
//   menuDom.find('#chat_squash_settings').on('click', function() {
//     // 处理设置点击
//   });
//
//   menuDom.find('#chat_squash_help').on('click', function() {
//     // 显示帮助信息
//   });
// }

// 绑定内置正则模块的菜单项
function addRegexBindingSection() {
  const regexButtons = `
    <div class="menu_button menu_button_icon" id="manage_preset_regexes" title="管理预设绑定正则">
      <i class="fa-solid fa-cogs"></i>
      <small>管理正则</small>
    </div>
    <div class="menu_button menu_button_icon" id="regex_binding_help" title="绑定正则使用说明">
      <i class="fa-solid fa-circle-info"></i>
      <small>使用说明</small>
    </div>
  `;

  addMenuSection('regex_binding', '绑定内置正则', '将正则表达式绑定到预设中，影响所有使用此预设的角色。', regexButtons);

  // 绑定事件处理
  menuDom.find('#manage_preset_regexes').on('click', function () {
    // 关闭菜单并跳转到正则设置
    $('.popup-button-ok').click(); // 关闭当前弹窗

    // 展开正则设置面板
    const regexSettings = $('.regex_settings');
    if (regexSettings.length > 0) {
      const drawer = regexSettings.find('.inline-drawer-toggle');
      const content = regexSettings.find('.inline-drawer-content');
      const icon = regexSettings.find('.inline-drawer-icon');

      if (!content.is(':visible')) {
        drawer.click();
      }

      // 滚动到正则设置区域
      regexSettings[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  menuDom.find('#regex_binding_help').on('click', function () {
    showRegexBindingHelp();
  });
}

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

  SillyTavern.getContext().callGenericPopup(helpContent, SillyTavern.getContext().POPUP_TYPE.TEXT, '', {
    okButton: '我知道了',
  });
}

const RegexBinding = () => {
  // eslint-disable-next-line no-control-regex
  const sanitizeFileName = name => name.replace(/[\s.<>:"/\\|?*\x00-\x1f\x7f]/g, '_').toLowerCase();

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
  const extensions = SillyTavern.getContext().extensionSettings;
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
    const fileName = '预设正则-' + SillyTavern.getContext().chatCompletionSettings.preset_settings_openai + '.json';
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
    } catch (error) {
      const confirm = await SillyTavern.getContext().callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        SillyTavern.getContext().POPUP_TYPE.CONFIRM,
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
  updateSTRegexes();
  /*
  $('.regex_settings .collapse_regexes').on('click', function () {
    const icon = $(this).find('i');
    const scripts = $('#saved_preset_scripts');
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
    $('#saved_preset_scripts').sortable({
      delay: SillyTavern.getContext().isMobile() ? 750 : 50,
      start: window.regexBinding_onSortableStart,
      stop: window.regexBinding_onSortableStop,
    });
    $('#saved_preset_scripts').sortable('enable');
  } catch (error) {
    const confirm = SillyTavern.getContext().callGenericPopup(
      '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
      SillyTavern.getContext().POPUP_TYPE.CONFIRM,
    );
    if (confirm) {
      navigator.clipboard.writeText(JSON.stringify(error, null, 2));
      toastr.success('已复制错误信息到剪贴板');
    }
  }

  SillyTavern.getContext().eventSource.on('settings_updated', () => {
    try {
      const newPresetRegexes = getRegexesFromPreset();
      const oldIdOrder = presetRegexes.map(s => s.id);
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
      const confirm = SillyTavern.getContext().callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        SillyTavern.getContext().POPUP_TYPE.CONFIRM,
      );
      if (confirm) {
        navigator.clipboard.writeText(JSON.stringify(error, null, 2));
        toastr.success('已复制错误信息到剪贴板');
      }
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
      SillyTavern.getContext().reloadCurrentChat();
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
      script.id = SillyTavern.getContext().uuidv4();

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
          const chat = await SillyTavern.getContext().chat;
          if (chat.length >= 10) {
            const confirm = await SillyTavern.getContext().callGenericPopup(
              '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
              SillyTavern.getContext().POPUP_TYPE.CONFIRM,
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
    injectBindButtons();
    updateCss();
    const regex_settings = $('.regex_settings');
    let block = injectPresetBlock(regex_settings);

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
          if (SillyTavern.getContext().getCurrentChatId()) {
            SillyTavern.getContext().reloadCurrentChat();
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
        const chat = await SillyTavern.getContext().chat;
        if (chat.length >= 10) {
          const confirm = await SillyTavern.getContext().callGenericPopup(
            '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要继续吗？',
            SillyTavern.getContext().POPUP_TYPE.CONFIRM,
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
        const chat = await SillyTavern.getContext().chat;
        const confirm = await SillyTavern.getContext().callGenericPopup(
          chat.length >= 10
            ? '当前聊天界面消息较多，执行此操作可能耗时较长，建议关闭当前聊天后再执行。<br>确定要删除吗？'
            : '你确定要删除这个正则吗？',
          SillyTavern.getContext().POPUP_TYPE.CONFIRM,
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
        <div id="saved_preset_scripts" no-scripts-text="No scripts found" data-i18n="[no-scripts-text]No scripts found" class="flex-container regex-script-container flexFlowColumn"></div>
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
      const confirm = SillyTavern.getContext().callGenericPopup(
        '预设绑定正则出现错误：' + error.message + '<br>点击确定复制错误信息到剪贴板<br>请将错误信息发送到原贴',
        SillyTavern.getContext().POPUP_TYPE.CONFIRM,
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
      const subTrimString = SillyTavern.getContext().substituteParams(trimString, undefined, characterOverride);
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
          return SillyTavern.getContext().substituteParamsExtended(regexScript.findRegex);
        case substitute_find_regex.ESCAPED:
          return SillyTavern.getContext().substituteParamsExtended(regexScript.findRegex, {}, sanitizeRegexMacro);
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
      return SillyTavern.getContext().substituteParams(replaceWithGroups);
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
    const editorHtml = $(await SillyTavern.getContext().renderExtensionTemplateAsync('regex', 'editor'));
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
        id: SillyTavern.getContext().uuidv4(),
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

    const popupResult = await SillyTavern.getContext().callGenericPopup(
      editorHtml.get(0),
      SillyTavern.getContext().POPUP_TYPE.CONFIRM,
      '',
      {
        okButton: SillyTavern.getContext().t`Save`,
        cancelButton: SillyTavern.getContext().t`Cancel`,
        allowVerticalScrolling: true,
      },
    );
    if (popupResult) {
      const newRegexScript = {
        id: existingId ? String(existingId) : SillyTavern.getContext().uuidv4(),
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
      if (SillyTavern.getContext().getCurrentChatId()) {
        SillyTavern.getContext().reloadCurrentChat();
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
      SillyTavern.getContext().callGenericPopup(
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
        SillyTavern.getContext().POPUP_TYPE.TEXT,
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
    const popupResult = await SillyTavern.getContext().callGenericPopup(
      popupHtml.get(0),
      SillyTavern.getContext().POPUP_TYPE.CONFIRM,
      '',
      {
        okButton: '保存排序',
        cancelButton: '取消',
        allowVerticalScrolling: true,
      },
    );

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
      setInfoBlock(infoBlock, SillyTavern.getContext().t`Find Regex is empty`, 'info');
      return;
    }

    try {
      const regex = regexFromString(findRegex);
      if (!regex) {
        throw new Error(SillyTavern.getContext().t`Invalid Find Regex`);
      }

      const flagInfo = [];
      flagInfo.push(
        regex.flags.includes('g')
          ? SillyTavern.getContext().t`Applies to all matches`
          : SillyTavern.getContext().t`Applies to the first match`,
      );
      flagInfo.push(
        regex.flags.includes('i')
          ? SillyTavern.getContext().t`Case insensitive`
          : SillyTavern.getContext().t`Case sensitive`,
      );

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
      regexScript.id = SillyTavern.getContext().uuidv4();
    }
    // Is the script name undefined or empty?
    if (!regexScript.scriptName) {
      toastr.error(SillyTavern.getContext().t`Could not save regex script: The script name was undefined or empty!`);
      return;
    }

    // Is a find regex present?
    if (regexScript.findRegex.length === 0) {
      toastr.warning(
        SillyTavern.getContext().t`This regex script will not work, but was saved anyway: A find regex isn't present.`,
      );
    }

    // Is there someplace to place results?
    if (regexScript.placement.length === 0) {
      toastr.warning(
        SillyTavern.getContext()
          .t`This regex script will not work, but was saved anyway: One "Affects" checkbox must be selected!`,
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
    // SillyTavern.getContext().reloadCurrentChat();
  }

  function loadLockedRegexes() {
    const variables = TavernHelper.getVariables({
      type: 'script',
      script_id: SillyTavern.getContext().extensionSettings.regexBinding_scriptId,
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
    if (!regexes || regexes.length === 0) {
      TavernHelper.deleteVariable('locked-regexes', {
        type: 'script',
        script_id: SillyTavern.getContext().extensionSettings.regexBinding_scriptId,
      });
      return;
    }
    TavernHelper.insertOrAssignVariables(
      {
        'locked-regexes': regexes,
      },
      {
        type: 'script',
        script_id: SillyTavern.getContext().extensionSettings.regexBinding_scriptId,
      },
    );
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
    /*
    // 疑似有big会导致丢条目，先注释掉
    updatePresetWith('in_use', preset => {
      return getPreset('in_use');
    });
    */
  }

  function getPrompt(identifier) {
    const oai_settings = SillyTavern.getContext().chatCompletionSettings;
    const prompts = oai_settings.prompts;
    const prompt = prompts.find(p => p.identifier === identifier)?.content;
    return prompt || null;
  }

  function setPrompt(identifier, content) {
    const oai_settings = SillyTavern.getContext().chatCompletionSettings;
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
    const oai_settings = SillyTavern.getContext().chatCompletionSettings;
    const prompts = oai_settings.prompts;
    prompts.push(prompt);
  }
};
