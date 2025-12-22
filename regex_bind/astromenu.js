const ST = SillyTavern.chatCompletionSettings ? SillyTavern : SillyTavern.getContext();

$(() => {
  /**
   * css 样式
   */

  // --------------------------------------------------------------

  // 死兆星主题样式
  const deathStarStyles = `
    <style id="death-star-menu-styles">
      .death-star-button {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #2a2a2a, #0d0d0d);
        border: 2px solid #444;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 
          0 0 20px rgba(220, 38, 38, 0.3),
          inset 0 0 10px rgba(0, 0, 0, 0.8),
          inset 2px 2px 4px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .death-star-button.dragging {
        transition: none;
        cursor: grabbing;
        transform: scale(1.05);
        box-shadow: 
          0 0 35px rgba(220, 38, 38, 0.6),
          inset 0 0 20px rgba(0, 0, 0, 0.9),
          inset 2px 2px 8px rgba(255, 255, 255, 0.2);
      }

      .death-star-button::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #dc2626, #7f1d1d);
        border-radius: 50%;
        top: 12px;
        right: 12px;
        box-shadow: 
          0 0 8px #dc2626,
          inset 0 0 4px rgba(0, 0, 0, 0.5);
        animation: deathStarPulse 2s infinite;
      }

      .death-star-button::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          rgba(220, 38, 38, 0.1) 45deg,
          transparent 90deg,
          rgba(220, 38, 38, 0.1) 135deg,
          transparent 180deg,
          rgba(220, 38, 38, 0.1) 225deg,
          transparent 270deg,
          rgba(220, 38, 38, 0.1) 315deg,
          transparent 360deg
        );
        animation: deathStarRotate 8s linear infinite;
      }

      .death-star-button:hover {
        transform: scale(1.1);
        box-shadow: 
          0 0 30px rgba(220, 38, 38, 0.5),
          inset 0 0 15px rgba(0, 0, 0, 0.9),
          inset 2px 2px 6px rgba(255, 255, 255, 0.15);
      }

      .death-star-button:active {
        transform: scale(0.95);
      }

      .death-star-icon {
        color: #dc2626;
        font-size: 20px;
        text-shadow: 0 0 10px #dc2626;
        z-index: 1;
        position: relative;
      }

      .death-star-menu {
        position: fixed;
        width: 300px;
        min-height: 200px;
        background: linear-gradient(135deg, 
          rgba(13, 13, 13, 0.95) 0%,
          rgba(42, 42, 42, 0.95) 50%,
          rgba(13, 13, 13, 0.95) 100%);
        border: 1px solid #444;
        border-radius: 12px;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.8),
          inset 0 1px 2px rgba(255, 255, 255, 0.1),
          0 0 30px rgba(220, 38, 38, 0.2);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        z-index: 9998;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        pointer-events: none;
        overflow: hidden;
      }

      .death-star-menu.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }

      .death-star-menu::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, 
          transparent 0%,
          #dc2626 50%,
          transparent 100%);
        animation: deathStarScan 3s ease-in-out infinite;
      }

      .death-star-menu-header {
        padding: 15px 20px;
        border-bottom: 1px solid #333;
        background: linear-gradient(90deg, 
          rgba(220, 38, 38, 0.1) 0%,
          rgba(220, 38, 38, 0.05) 50%,
          rgba(220, 38, 38, 0.1) 100%);
      }

      .death-star-menu-title {
        color: #dc2626;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
        margin: 0;
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
      }

      .death-star-menu-content {
        padding: 20px;
      }

      .death-star-menu-item {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        margin: 8px 0;
        background: rgba(42, 42, 42, 0.3);
        border: 1px solid #333;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #ccc;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
      }

      .death-star-menu-item:hover {
        background: rgba(220, 38, 38, 0.1);
        border-color: #dc2626;
        color: #fff;
        box-shadow: 
          0 0 15px rgba(220, 38, 38, 0.3),
          inset 0 0 10px rgba(220, 38, 38, 0.1);
        transform: translateX(5px);
      }

      .death-star-menu-item-icon {
        margin-right: 12px;
        font-size: 18px;
        color: #dc2626;
        text-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
        min-width: 20px;
      }

      .death-star-menu-item-text {
        flex: 1;
        font-size: 14px;
      }

      .death-star-menu-item-arrow {
        margin-left: 10px;
        font-size: 12px;
        color: #666;
        transition: all 0.3s ease;
      }

      .death-star-menu-item:hover .death-star-menu-item-arrow {
        color: #dc2626;
        transform: translateX(3px);
      }

      @keyframes deathStarPulse {
        0%, 100% { 
          opacity: 0.8;
          box-shadow: 0 0 8px #dc2626, inset 0 0 4px rgba(0, 0, 0, 0.5);
        }
        50% { 
          opacity: 1;
          box-shadow: 0 0 15px #dc2626, inset 0 0 6px rgba(0, 0, 0, 0.7);
        }
      }

      @keyframes deathStarRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes deathStarScan {
        0%, 100% { transform: translateX(-100%); }
        50% { transform: translateX(400px); }
      }

      .death-star-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 9997;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      .death-star-overlay.show {
        opacity: 1;
        pointer-events: all;
      }

      /* 次级菜单样式 */
      .death-star-submenu {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
        background: rgba(13, 13, 13, 0.8);
        border-radius: 0 0 8px 8px;
        margin-top: 8px;
        border: 1px solid #333;
        border-top: none;
      }

      .death-star-submenu.expanded {
        max-height: 300px; /* 固定最大高度 */
        padding: 15px;
        overflow-y: auto; /* 垂直滚动 */
        overflow-x: hidden; /* 隐藏水平滚动 */
      }

      /* 自定义滚动条样式 */
      .death-star-submenu::-webkit-scrollbar {
        width: 6px;
      }

      .death-star-submenu::-webkit-scrollbar-track {
        background: rgba(42, 42, 42, 0.3);
        border-radius: 3px;
      }

      .death-star-submenu::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #dc2626, #b91c1c);
        border-radius: 3px;
        box-shadow: 0 0 3px rgba(220, 38, 38, 0.3);
      }

      .death-star-submenu::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #ef4444, #dc2626);
        box-shadow: 0 0 5px rgba(220, 38, 38, 0.5);
      }

      /* Firefox 滚动条样式 */
      .death-star-submenu {
        scrollbar-width: thin;
        scrollbar-color: #dc2626 rgba(42, 42, 42, 0.3);
      }

      .death-star-submenu-title {
        color: #dc2626;
        font-size: 14px;
        font-weight: bold;
        margin: 15px 0 8px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #444;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        text-shadow: 0 0 5px rgba(220, 38, 38, 0.3);
      }

      .death-star-submenu-title:first-child {
        margin-top: 0;
      }

      .death-star-submenu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        margin: 5px 0;
        background: rgba(42, 42, 42, 0.2);
        border: 1px solid #333;
        border-radius: 6px;
        color: #ccc;
        font-size: 13px;
        transition: all 0.2s ease;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
      }

      /* 包含选项组的条目改为垂直布局 */
      .death-star-submenu-item.has-option-group {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px;
      }

      .death-star-submenu-item.has-option-group .death-star-submenu-item-label {
        margin-bottom: 8px;
        width: 100%;
      }

      .death-star-submenu-item:hover {
        background: rgba(220, 38, 38, 0.05);
        border-color: #dc2626;
        color: #fff;
      }

      .death-star-submenu-item-label {
        flex: 1;
        display: flex;
        align-items: center;
      }

      .death-star-submenu-item-icon {
        margin-right: 8px;
        font-size: 14px;
        color: #dc2626;
        min-width: 16px;
      }

      /* 开关按钮样式 */
      .death-star-toggle {
        position: relative;
        width: 40px;
        height: 20px;
        background: #333;
        border-radius: 10px;
        border: 1px solid #555;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .death-star-toggle.active {
        background: linear-gradient(45deg, #dc2626, #b91c1c);
        border-color: #dc2626;
        box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
      }

      .death-star-toggle::before {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .death-star-toggle.active::before {
        transform: translateX(20px);
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }

      /* 选择框样式 */
      .death-star-select {
        background: rgba(42, 42, 42, 0.5);
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
      }

      .death-star-select:hover,
      .death-star-select:focus {
        border-color: #dc2626;
        background: rgba(220, 38, 38, 0.1);
        outline: none;
        box-shadow: 0 0 5px rgba(220, 38, 38, 0.3);
      }

      .death-star-select option {
        background: #2a2a2a;
        color: #fff;
      }

      /* 单行选项组样式 */
      .death-star-option-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .death-star-option-item {
        padding: 4px 12px;
        background: rgba(42, 42, 42, 0.3);
        border: 1px solid #555;
        border-radius: 16px;
        color: #ccc;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        user-select: none;
      }

      .death-star-option-item:hover {
        border-color: #dc2626;
        color: #fff;
        background: rgba(220, 38, 38, 0.1);
      }

      .death-star-option-item.active {
        background: linear-gradient(45deg, #dc2626, #b91c1c);
        border-color: #dc2626;
        color: #fff;
        box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
      }

      .death-star-option-item.active:hover {
        background: linear-gradient(45deg, #ef4444, #dc2626);
        box-shadow: 0 0 12px rgba(220, 38, 38, 0.5);
      }

      /* 按钮样式 */
      .death-star-button-item {
        padding: 8px 16px;
        background: linear-gradient(135deg, rgba(42, 42, 42, 0.8), rgba(13, 13, 13, 0.8));
        border: 1px solid #555;
        border-radius: 6px;
        color: #ccc;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        text-align: center;
        position: relative;
        overflow: hidden;
        user-select: none;
      }

      .death-star-button-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .death-star-button-item:hover {
        border-color: #dc2626;
        color: #fff;
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(42, 42, 42, 0.8));
        transform: translateY(-1px);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 0 15px rgba(220, 38, 38, 0.2);
      }

      .death-star-button-item:hover::before {
        left: 100%;
      }

      .death-star-button-item:active {
        transform: translateY(0);
        box-shadow: 
          0 2px 6px rgba(0, 0, 0, 0.3),
          inset 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .death-star-button-item.danger {
        border-color: #dc2626;
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(127, 29, 29, 0.3));
      }

      .death-star-button-item.danger:hover {
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.4), rgba(127, 29, 29, 0.5));
        box-shadow: 
          0 4px 12px rgba(220, 38, 38, 0.3),
          0 0 20px rgba(220, 38, 38, 0.4);
      }

      .death-star-button-item.success {
        border-color: #16a34a;
        background: linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(21, 128, 61, 0.3));
      }

      .death-star-button-item.success:hover {
        background: linear-gradient(135deg, rgba(22, 163, 74, 0.4), rgba(21, 128, 61, 0.5));
        box-shadow: 
          0 4px 12px rgba(22, 163, 74, 0.3),
          0 0 20px rgba(22, 163, 74, 0.4);
      }

      .death-star-button-item.clicked {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }

      /* 主菜单项展开状态 */
      .death-star-menu-item.expanded {
        background: rgba(220, 38, 38, 0.15);
        border-color: #dc2626;
        border-radius: 8px 8px 0 0;
      }

      .death-star-menu-item.expanded .death-star-menu-item-arrow {
        transform: rotate(90deg);
        color: #dc2626;
      }

      /* 信息图标样式 */
      .death-star-info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid #666;
        color: #888;
        font-size: 10px;
        margin-left: 8px;
        cursor: help;
        transition: all 0.2s ease;
      }

      .death-star-info-icon:hover {
        color: #dc2626;
        border-color: #dc2626;
        transform: scale(1.1);
      }

      /* 输入框样式 */
      .death-star-input {
        background: rgba(42, 42, 42, 0.5);
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        width: 100px;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        transition: all 0.2s ease;
        text-align: center;
      }

      .death-star-input:focus {
        border-color: #dc2626;
        background: rgba(220, 38, 38, 0.1);
        outline: none;
        box-shadow: 0 0 5px rgba(220, 38, 38, 0.3);
      }

      /* 信息图标样式 */
      .death-star-info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid #666;
        color: #888;
        font-size: 10px;
        margin-left: 8px;
        cursor: help;
        transition: all 0.2s ease;
      }

      .death-star-info-icon:hover {
        color: #dc2626;
        border-color: #dc2626;
        transform: scale(1.1);
      }

      /* 输入框样式 */
      .death-star-input {
        background: rgba(42, 42, 42, 0.5);
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        width: 100px;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        transition: all 0.2s ease;
        text-align: center;
      }

      .death-star-input:focus {
        border-color: #dc2626;
        background: rgba(220, 38, 38, 0.1);
        outline: none;
        box-shadow: 0 0 5px rgba(220, 38, 38, 0.3);
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .death-star-menu {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
        }
        
        .death-star-button {
          top: 15px;
          right: 15px;
          width: 45px;
          height: 45px;
        }

        .death-star-submenu.expanded {
          max-height: 200px; /* 移动设备上的次级菜单高度更小 */
        }

        .death-star-submenu-item {
          font-size: 12px;
          padding: 6px 10px;
        }

        .death-star-submenu-item.has-option-group {
          padding: 10px;
        }

        .death-star-submenu-item.has-option-group .death-star-submenu-item-label {
          margin-bottom: 6px;
        }

        .death-star-toggle {
          width: 35px;
          height: 18px;
        }

        .death-star-toggle::before {
          width: 14px;
          height: 14px;
        }

        .death-star-toggle.active::before {
          transform: translateX(17px);
        }

        .death-star-option-item {
          font-size: 11px;
          padding: 3px 8px;
        }

        .death-star-button-item {
          font-size: 12px;
          padding: 6px 12px;
        }
      }

      /* 输入框样式 */
      .death-star-input {
        background: rgba(42, 42, 42, 0.5);
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        width: 80px;
        transition: all 0.2s ease;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        text-align: right;
      }

      .death-star-input:focus {
        border-color: #dc2626;
        background: rgba(220, 38, 38, 0.1);
        outline: none;
        box-shadow: 0 0 5px rgba(220, 38, 38, 0.3);
      }

      /* 信息图标/注释样式 */
      .death-star-info {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid #666;
        color: #888;
        font-size: 10px;
        margin-left: 6px;
        cursor: help;
        position: relative;
        transition: all 0.2s ease;
      }

      .death-star-info:hover {
        border-color: #dc2626;
        color: #dc2626;
      }

      /* Tooltip 样式 */
      .death-star-info::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-5px);
        background: rgba(13, 13, 13, 0.95);
        border: 1px solid #444;
        color: #ccc;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        min-width: 100px;
        text-align: center;
      }

      .death-star-info:hover::after,
      .death-star-info.active::after {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-10px);
      }
      
      /* 移动端 tooltip 适配 */
      @media (max-width: 768px) {
        .death-star-info::after {
          position: fixed;
          top: 50%;
          left: 50%;
          bottom: auto;
          transform: translate(-50%, -50%);
          width: 80%;
          white-space: normal;
          padding: 15px;
          background: rgba(20, 20, 20, 0.98);
          border: 1px solid #dc2626;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        }

        .death-star-info:hover::after,
        .death-star-info.active::after {
          transform: translate(-50%, -50%);
        }
      }
    </style>
  `;

  // --------------------------------------------------------------

  /**
   * html 结构
   */

  // --------------------------------------------------------------

  // 注入样式
  if (!$('#death-star-menu-styles').length) {
    $('head').append(deathStarStyles);
  }

  // 创建死兆星按钮
  function createDeathStarButton() {
    if ($('.death-star-button').length) return $('.death-star-button');

    const $button = $(`
      <div class="death-star-button" title="死兆星控制面板">
        <div class="death-star-icon">⬢</div>
      </div>
    `);

    $('body').append($button);
    return $button;
  }

  // 获取菜单配置（后续从外部读取）
  function getMenuConfig() {
    const prompt = getPrompt("menu");
    return prompt ? prompt.content : "";
  }

  // 解析菜单配置
  function parseMenuConfig(text) {
    const match = text.match(/\|MENU\|([\s\S]*?)\|\/MENU\|/);
    if (!match) return [];
    
    const lines = match[1].split('\n');
    const structure = [];
    let currentSection = null;
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      
      const parts = line.split(/\s+/);
      const type = parts[0];
      
      // 过滤空部分
      const validParts = parts.filter(p => p.length > 0);
      if (validParts.length < 2 && type !== 'section') return;

      if (type === 'section') {
        currentSection = {
          type: 'section',
          title: line.replace(/^section\s+/, '').trim(),
          items: []
        };
        structure.push(currentSection);
      } else if (currentSection) {
        if (type === 'subsection') {
          // subsection Title [Comment]
          const title = validParts[1];
          const comment = validParts.slice(2).join(' ');
          currentSection.items.push({ type: 'subsection', title, comment });
        } else if (type === 'toggle') {
          // toggle Name Default [Comment]
          const key = validParts[1];
          const def = validParts[2];
          const comment = validParts.slice(3).join(' ');
          currentSection.items.push({ type: 'toggle', key, default: def, comment });
        } else if (type === 'value') {
          // value Name Default [Comment]
          const key = validParts[1];
          const def = validParts[2];
          const comment = validParts.slice(3).join(' ');
          currentSection.items.push({ type: 'value', key, default: def, comment });
        }
      }
    });
    return structure;
  }

  // 渲染菜单项
  function renderMenuFromConfig(structure) {
    let html = '';
    
    structure.forEach((section, index) => {
      const actionId = `section-${index}`;
      
      // 渲染一级分类
      html += `
        <div class="death-star-menu-item" data-action="${actionId}">
          <div class="death-star-menu-item-text">${section.title}</div>
          <div class="death-star-menu-item-arrow">▶</div>
        </div>
        <div class="death-star-submenu" data-submenu="${actionId}">
      `;
      
      // 渲染子项
      section.items.forEach(item => {
        if (item.type === 'subsection') {
          html += `<div class="death-star-submenu-title">
            ${item.title}
            ${item.comment ? `<div class="death-star-info-icon" title="${item.comment}" data-comment="${item.comment}">i</div>` : ''}
          </div>`;
        } else {
          html += `
            <div class="death-star-submenu-item">
              <div class="death-star-submenu-item-label">
                <div class="death-star-submenu-item-icon">▪</div>
                <span>${item.key}</span>
                ${item.comment ? `<div class="death-star-info-icon" title="${item.comment}" data-comment="${item.comment}">i</div>` : ''}
              </div>
          `;
          
          if (item.type === 'toggle') {
            const isActive = item.default === 'true' ? 'active' : '';
            html += `<div class="death-star-toggle ${isActive}" data-toggle="${item.key}"></div>`;
          } else if (item.type === 'value') {
            html += `<input type="text" class="death-star-input" data-value="${item.key}" value="${item.default}">`;
          }
          
          html += `</div>`;
        }
      });
      
      html += `</div>`; // Close submenu
    });
    
    return html;
  }

  // 创建菜单
  function createDeathStarMenu() {
    if ($('.death-star-menu').length) {
      return {
        $menu: $('.death-star-menu'),
        $overlay: $('.death-star-overlay'),
      };
    }

    const config = getMenuConfig();
    const structure = parseMenuConfig(config);
    const menuContent = renderMenuFromConfig(structure);

    const $menu = $(`
      <div class="death-star-menu">
        <div class="death-star-menu-header">
          <h3 class="death-star-menu-title">DIE Astro 控制面板</h3>
        </div>
        <div class="death-star-menu-content">
          ${menuContent}
        </div>
      </div>
    `);

    const $overlay = $('<div class="death-star-overlay"></div>');

    $('body').append($overlay).append($menu);
    return { $menu, $overlay };
  }

  // --------------------------------------------------------------

  /**
   * html 脚本
   */

  // --------------------------------------------------------------

  // 初始化死兆星控制系统
  function initDeathStarSystem() {
    if (!getPrompt("menu")) {
      removeDeathStarSystem();
      return;
    }
    const $button = createDeathStarButton();
    const { $menu, $overlay } = createDeathStarMenu();

    // 初始化扩展设置
    if (!ST.extensionSettings.Astro) {
      ST.extensionSettings.Astro = {};
    }

    // 清理可能存在的旧事件监听器
    $('body').off('click.deathstar keydown.deathstar');

    let isMenuOpen = false;
    let isDragging = false;
    let currentButtonPos = { top: 20, right: 20 }; // 当前按钮位置

    // 切换菜单显示状态
    function toggleMenu() {
      isMenuOpen = !isMenuOpen;

      if (isMenuOpen) {
        // 根据按钮位置动态设置菜单位置
        updateMenuPosition();
        $menu.addClass('show');
        $overlay.addClass('show');
      } else {
        // 关闭菜单时收起所有展开的次级菜单
        $('.death-star-menu-item.expanded').removeClass('expanded');
        $('.death-star-submenu.expanded').removeClass('expanded');
        $menu.removeClass('show');
        $overlay.removeClass('show');
      }
    }

    // 更新菜单位置
    function updateMenuPosition() {
      const windowWidth = $('body').innerWidth();
      const windowHeight = $('body').innerHeight();
      const menuWidth = 300;

      // 计算菜单最大可能高度（基础菜单 + 展开的次级菜单）
      const baseMenuHeight = 350; // 基础菜单高度
      const isMobile = windowWidth <= 768;
      const submenuHeight = isMobile ? 200 : 300; // 移动设备和桌面设备的次级菜单高度不同
      const hasExpandedSubmenu = $('.death-star-submenu.expanded').length > 0;
      const menuHeight = hasExpandedSubmenu ? baseMenuHeight + submenuHeight : baseMenuHeight;

      const buttonHeight = 50;

      // 计算菜单应该出现的位置
      let menuTop = currentButtonPos.top + buttonHeight + 10; // 按钮下方10px
      let menuRight = currentButtonPos.right;

      // 边界检查 - 确保菜单不会超出屏幕
      if (menuTop + menuHeight > windowHeight) {
        // 如果菜单会超出底部，显示在按钮上方
        menuTop = currentButtonPos.top - menuHeight - 10;
      }

      if (menuTop < 0) {
        // 如果还是会超出顶部，就显示在屏幕顶部
        menuTop = 10;
      }

      // 检查菜单是否会超出左边界（right值太大会导致菜单超出左边）
      if (windowWidth - menuWidth - menuRight < 10) {
        // 如果菜单会超出左边，调整right值
        menuRight = Math.max(10, windowWidth - menuWidth - 10);
      }

      // 设置菜单位置
      $menu.css({
        top: menuTop + 'px',
        right: menuRight + 'px',
      });
    }

    // 拖动功能实现
    function initDragFunctionality() {
      let startMousePos = { x: 0, y: 0 };
      let startButtonPos = { top: 20, right: 20 }; // 使用top/right坐标系
      let buttonPos = { top: 20, right: 20 };

      // 先清理可能存在的旧事件监听器
      $button.off('mousedown touchstart dragstart');
      $('body').off('mousemove.deathstar mouseup.deathstar touchmove.deathstar touchend.deathstar');

      // 获取按钮当前的top/right位置
      function getCurrentPosition() {
        return buttonPos;
      }

      // 设置按钮位置（使用top/right定位）
      function setButtonPosition(top, right) {
        const windowWidth = $('body').innerWidth();
        const windowHeight = $('body').innerHeight();
        const buttonWidth = 50;
        const buttonHeight = 50;

        // 边界限制
        top = Math.max(0, Math.min(windowHeight - buttonHeight, top));
        right = Math.max(0, Math.min(windowWidth - buttonWidth, right));

        $button.css({
          top: `${top}px`,
          right: `${right}px`,
        });

        buttonPos = { top, right };
        currentButtonPos = { top, right }; // 同步更新全局按钮位置

        return buttonPos;
      }

      // 鼠标事件处理
      function handleMouseDown(e) {
        if (e.which !== 1) return; // 只处理左键

        // 获取当前位置（top/right坐标系）
        const pos = getCurrentPosition();
        startButtonPos = {
          top: pos.top,
          right: pos.right,
        };

        isDragging = true;
        $button.addClass('dragging');

        // 记录起始位置
        startMousePos = { x: e.clientX, y: e.clientY };

        e.preventDefault();
        e.stopPropagation();
      }

      function handleMouseMove(e) {
        if (!isDragging) return;

        // 计算鼠标移动的距离
        const deltaX = e.clientX - startMousePos.x;
        const deltaY = e.clientY - startMousePos.y;

        // 计算按钮的新位置（top/right坐标系）
        const newTop = startButtonPos.top + deltaY;
        const newRight = startButtonPos.right - deltaX; // right向左移动时值增大

        setButtonPosition(newTop, newRight);
        e.preventDefault();
      }

      function handleMouseUp(e) {
        if (!isDragging) return;

        isDragging = false;
        $button.removeClass('dragging');

        // 判断是否为点击（移动距离很小）
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - startMousePos.x, 2) + Math.pow(e.clientY - startMousePos.y, 2),
        );

        if (isMenuOpen) {
          updateMenuPosition();
        }

        // 如果移动距离小于5像素，认为是点击
        if (moveDistance < 5) {
          setTimeout(() => toggleMenu(), 0);
        }

        e.preventDefault();
        e.stopPropagation();
      }

      // 触摸事件处理（移动设备支持）
      function handleTouchStart(e) {
        if (e.originalEvent.touches.length !== 1) return;

        const touch = e.originalEvent.touches[0];

        // 获取当前位置（top/right坐标系）
        const pos = getCurrentPosition();

        isDragging = true;
        $button.addClass('dragging');

        // 记录起始位置
        startMousePos = { x: touch.clientX, y: touch.clientY };
        startButtonPos = {
          top: pos.top,
          right: pos.right,
        };

        e.preventDefault();
        e.stopPropagation();
      }

      function handleTouchMove(e) {
        if (!isDragging || e.originalEvent.touches.length !== 1) return;

        const touch = e.originalEvent.touches[0];

        // 计算触摸移动的距离
        const deltaX = touch.clientX - startMousePos.x;
        const deltaY = touch.clientY - startMousePos.y;

        // 计算按钮的新位置（top/right坐标系）
        const newTop = startButtonPos.top + deltaY;
        const newRight = startButtonPos.right - deltaX; // right向左移动时值增大

        setButtonPosition(newTop, newRight);
        e.preventDefault();
      }

      function handleTouchEnd(e) {
        if (!isDragging) return;

        isDragging = false;
        $button.removeClass('dragging');

        // 获取最后的触摸位置
        const touch = e.originalEvent.changedTouches[0];
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - startMousePos.x, 2) + Math.pow(touch.clientY - startMousePos.y, 2),
        );

        if (isMenuOpen) {
          updateMenuPosition();
        }

        // 如果移动距离小于5像素，认为是点击
        if (moveDistance < 5) {
          setTimeout(() => toggleMenu(), 0);
        }

        e.preventDefault();
        e.stopPropagation();
      }

      // 绑定事件 - 使用命名空间避免冲突
      $button.on('mousedown', handleMouseDown);
      $('body').on('mousemove.deathstar', handleMouseMove);
      $('body').on('mouseup.deathstar', handleMouseUp);

      // 触摸事件
      $button.on('touchstart', handleTouchStart);
      $('body').on('touchmove.deathstar', handleTouchMove);
      $('body').on('touchend.deathstar', handleTouchEnd);

      // 防止默认的拖拽行为
      $button.on('dragstart', e => e.preventDefault());
    }

    // 确保按钮使用正确的定位方式
    $button.css({
      top: '20px',
      right: '20px',
      left: 'auto',
      bottom: 'auto',
    });

    // 同步设置全局按钮位置
    currentButtonPos = { top: 20, right: 20 };

    // 初始化拖动功能
    initDragFunctionality();

    // 点击遮罩层关闭菜单
    $overlay.on('click', () => {
      toggleMenu();
    });

    // 菜单项点击事件 - 展开/收起次级菜单
    $('body').on('click.deathstar', '.death-star-menu-item', function (e) {
      e.stopPropagation();
      const $item = $(this);
      const action = $item.data('action');
      const $submenu = $(`.death-star-submenu[data-submenu="${action}"]`);

      // 检查是否有次级菜单
      if ($submenu.length > 0) {
        // 关闭其他展开的菜单项
        $('.death-star-menu-item.expanded').not($item).removeClass('expanded');
        $('.death-star-submenu.expanded').not($submenu).removeClass('expanded');

        // 切换当前菜单项的展开状态
        $item.toggleClass('expanded');
        $submenu.toggleClass('expanded');

        // 如果展开了菜单，调整菜单位置以适应新高度
        if ($submenu.hasClass('expanded')) {
          setTimeout(() => {
            updateMenuPosition();
          }, 300); // 等待展开动画完成
        }
      } else {
        // 执行动作后关闭菜单
        toggleMenu();
      }
    });

    // 开关按钮点击事件
    $('body').on('click.deathstar', '.death-star-toggle', function (e) {
      e.stopPropagation();
      const $toggle = $(this);
      const toggleKey = $toggle.data('toggle');

      // 切换开关状态
      $toggle.toggleClass('active');

      // 保存设置到 ST.extensionSettings.Astro
      const isActive = $toggle.hasClass('active');
      ST.extensionSettings.Astro[toggleKey] = isActive;
      saveExtensionSettings();

      // 显示状态提示
      const toggleName = $toggle.closest('.death-star-submenu-item').find('span').text();
      const status = isActive ? '已启用' : '已禁用';
      toastr.info(`${toggleName} ${status}`, 'DIE Astro');
    });

    // 选择框变化事件
    $('body').on('change.deathstar', '.death-star-select', function (e) {
      e.stopPropagation();
      const $select = $(this);
      const selectKey = $select.data('select');
      const selectedValue = $select.val();
      const selectedText = $select.find('option:selected').text();

      // 保存设置到 ST.extensionSettings.Astro
      ST.extensionSettings.Astro[selectKey] = selectedValue;
      saveExtensionSettings();

      // 显示选择提示
      const selectName = $select.closest('.death-star-submenu-item').find('span').text();
      toastr.info(`${selectName}: ${selectedText}`, 'DIE Astro');
    });

    // 输入框变化事件
    $('body').on('change.deathstar', '.death-star-input', function (e) {
      e.stopPropagation();
      const $input = $(this);
      const valueKey = $input.data('value');
      const value = $input.val();
      
      // 保存设置到 ST.extensionSettings.Astro
      ST.extensionSettings.Astro[valueKey] = value;
      saveExtensionSettings();
    });

    // 信息图标点击事件（主要用于移动端）
    $('body').on('click.deathstar', '.death-star-info-icon', function (e) {
      e.stopPropagation();
      const comment = $(this).data('comment');
      toastr.info(comment, '说明');
    });

    // 加载保存的设置
    function loadSavedSettings() {
      const config = getMenuConfig();
      const structure = parseMenuConfig(config);
      
      // 构建默认值映射
      const defaults = {};
      structure.forEach(section => {
        section.items.forEach(item => {
          if (item.type === 'toggle') {
            defaults[item.key] = item.default === 'true';
          } else if (item.type === 'value') {
            defaults[item.key] = item.default;
          }
        });
      });

      // 加载开关状态
      $('.death-star-toggle').each(function () {
        const $toggle = $(this);
        const toggleKey = $toggle.data('toggle');
        // 优先从 extensionSettings 读取，没有则使用默认值
        let isActive = ST.extensionSettings.Astro[toggleKey];
        if (isActive === undefined) {
          isActive = defaults[toggleKey];
          ST.extensionSettings.Astro[toggleKey] = isActive;
        }

        if (isActive !== undefined) {
          $toggle.toggleClass('active', !!isActive);
        }
      });

      // 加载选择框状态
      $('.death-star-select').each(function () {
        const $select = $(this);
        const selectKey = $select.data('select');
        const savedValue = ST.extensionSettings.Astro[selectKey];

        if (savedValue !== undefined) {
          $select.val(savedValue);
        }
      });

      // 加载输入框状态
      $('.death-star-input').each(function () {
        const $input = $(this);
        const valueKey = $input.data('value');
        let savedValue = ST.extensionSettings.Astro[valueKey];
        if (savedValue === undefined) {
          savedValue = defaults[valueKey];
          ST.extensionSettings.Astro[valueKey] = savedValue;
        }
        
        if (savedValue !== undefined) {
          $input.val(savedValue);
        }
      });
      saveExtensionSettings();
    }

    // 单行选项组点击事件
    $('body').on('click.deathstar', '.death-star-option-item', function (e) {
      e.stopPropagation();
      const $option = $(this);
      const $group = $option.closest('.death-star-option-group');
      const groupKey = $group.data('option-group');
      const optionValue = $option.data('option');

      // 同组中只能选择一个选项
      $group.find('.death-star-option-item').removeClass('active');
      $option.addClass('active');

      // 保存设置到 ST.extensionSettings.Astro
      ST.extensionSettings.Astro[`option_${groupKey}`] = optionValue;
      saveExtensionSettings();

      // 显示选择提示
      const optionText = $option.text();
      const groupName = $group.closest('.death-star-submenu-item').find('span').text();
      toastr.info(`${groupName}: ${optionText}`, 'DIE Astro');
    });

    // 按钮点击事件
    $('body').on('click.deathstar', '.death-star-button-item', function (e) {
      e.stopPropagation();
      const $clickedButton = $(this);
      const buttonKey = $clickedButton.data('button');
      const buttonText = $clickedButton.text().trim();

      // 添加点击动画效果
      $clickedButton.addClass('clicked');
      setTimeout(() => {
        $clickedButton.removeClass('clicked');
      }, 200);

      // 根据按钮类型执行不同的功能
      switch (buttonKey) {
        default:
          toastr.info(`执行操作: ${buttonText}`, 'DIE Astro');
      }
    });

    // 加载单行选项组的保存状态
    function loadOptionGroupSettings() {
      $('.death-star-option-group').each(function () {
        const $group = $(this);
        const groupKey = $group.data('option-group');
        const savedValue = ST.extensionSettings.Astro[`option_${groupKey}`];

        if (savedValue !== undefined) {
          $group.find('.death-star-option-item').removeClass('active');
          $group.find(`[data-option="${savedValue}"]`).addClass('active');
        }
      });
    }

    // 在菜单创建后加载设置
    setTimeout(() => {
      loadSavedSettings();
      loadOptionGroupSettings();
    }, 100);

    // ESC键关闭菜单
    $('body').on('keydown.deathstar', e => {
      if (e.keyCode === 27 && isMenuOpen) {
        // ESC
        toggleMenu();
      }
    });

    // 防止菜单内点击冒泡
    $('body').on('click.deathstar', '.death-star-menu', e => {
      e.stopPropagation();
    });

    // 显示加载成功消息
    toastr.success('控制面板加载成功', 'Astro 4');
  }

  function removeDeathStarSystem() {
    $('.death-star-button').remove();
    $('.death-star-menu').remove();
    $('.death-star-overlay').remove();
    $('body').off('click.deathstar keydown.deathstar');
  }

  function saveExtensionSettings() {
    ST.saveSettingsDebounced();
    if (window.SPresetTempData) {
      if (!window.SPresetTempData.Astro) {
        window.SPresetTempData.Astro = {};
      }
      Object.entries(ST.extensionSettings.Astro).forEach(([key, value]) => {
        window.SPresetTempData.Astro[key] = value;
      });
    }
  }

  // 确保在 #chat 元素存在后再初始化
  function waitForChatElement() {
    if ($('#chat').length > 0) {
      initDeathStarSystem();
    } else {
      // 如果 #chat 还未加载，等待一段时间后重试
      setTimeout(waitForChatElement, 100);
    }
  }

  // 开始初始化
  waitForChatElement();

  ST.eventSource.on(ST.event_types.OAI_PRESET_CHANGED_AFTER, () => {
    initDeathStarSystem();
  });

  // --------------------------------------------------------------

  /**
   * 酒馆api包装
   */

  // --------------------------------------------------------------

  function getPrompt(identifier) {
    const oai_settings = ST.chatCompletionSettings;
    const prompts = oai_settings.prompts;
    const prompt = prompts.find(p => p.identifier === identifier);
    return prompt || null;
  }

  function setPrompt(identifier, content) {
    const oai_settings = ST.chatCompletionSettings;
    const prompts = oai_settings.prompts;
    const prompt = prompts.find(p => p.identifier === identifier);
    if (prompt) {
      prompt.content = content;
    }
  }
});
