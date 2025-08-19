<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>SillyTavern 预设绑定正则 · 功能介绍</title>
<meta name="color-scheme" content="light dark" />
<style>
  :root{
    --bg: #0b0c10;
    --panel: #111218;
    --text: #e9e9ee;
    --muted: #a4a6b0;
    --brand: #7c5cff;
    --brand-2: #46c2ff;
    --ok: #2ecc71;
    --warn: #ffb020;
    --danger: #ff5b5b;
    --border: #262733;
    --code-bg: #0f1016;
    --shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  @media (prefers-color-scheme: light){
    :root{
      --bg: #f7f7fb;
      --panel: #ffffff;
      --text: #1a1b22;
      --muted: #5a5d70;
      --brand: #6a5cff;
      --brand-2: #00aaff;
      --ok: #1f9b5f;
      --warn: #b78000;
      --danger: #ce3b3b;
      --border: #e9e9f0;
      --code-bg: #f2f3f8;
      --shadow: 0 10px 24px rgba(0,0,0,.08);
    }
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
      "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", Arial, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
    background: radial-gradient(1200px 600px at 20% 0%, rgba(124,92,255,.10), transparent),
                radial-gradient(1000px 500px at 80% 0%, rgba(70,194,255,.10), transparent),
                var(--bg);
    color: var(--text);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .wrap{max-width:1100px;margin:0 auto;padding:32px 20px 80px}
  .hero{
    display:grid; gap:16px; padding:28px 24px; border:1px solid var(--border);
    background: linear-gradient(180deg, rgba(124,92,255,.12), rgba(124,92,255,0) 60%) , var(--panel);
    border-radius:18px; box-shadow: var(--shadow);
  }
  .badge{
    width:max-content; padding:6px 10px; border-radius:999px; font-size:12px; letter-spacing:.4px;
    background: linear-gradient(90deg, rgba(124,92,255,.25), rgba(70,194,255,.25));
    color:#fff; border:1px solid rgba(255,255,255,.18);
    text-transform: uppercase;
  }
  h1{font-size:32px; margin:0 0 6px; line-height:1.25}
  p.lead{margin:0;color:var(--muted);font-size:15px}
  .grid{
    display:grid; gap:16px; margin-top:22px;
    grid-template-columns: repeat(12, 1fr);
  }
  .col-4{grid-column: span 12}
  .col-6{grid-column: span 12}
  @media (min-width: 820px){
    .col-4{grid-column: span 4}
    .col-6{grid-column: span 6}
  }
  .card{
    height:100%;
    padding:18px 16px;
    background: var(--panel);
    border:1px solid var(--border);
    border-radius:14px;
  }
  .card h3{margin:0 0 6px;font-size:18px}
  .muted{color:var(--muted)}
  .icon{
    display:inline-flex; align-items:center; justify-content:center;
    width:28px; height:28px; border-radius:8px; margin-right:8px;
    background: linear-gradient(180deg, rgba(124,92,255,.22), rgba(124,92,255,.08));
    border:1px solid rgba(124,92,255,.35);
  }
  .kbar{
    display:flex; gap:10px; flex-wrap:wrap; margin-top:8px
  }
  .kbtn{
    display:inline-flex; align-items:center; gap:8px;
    padding:8px 12px; border-radius:999px; font-size:13px;
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0));
    border:1px solid var(--border);
    cursor:default;
  }
  .kbtn .dot{width:8px;height:8px;border-radius:999px;background:var(--ok)}
  .section{margin-top:28px;
      display:grid; gap:16px; padding:28px 24px; border:1px solid var(--border);
    background: linear-gradient(180deg, rgba(124,92,255,.12), rgba(124,92,255,0) 60%) , var(--panel);
    border-radius:18px; box-shadow: var(--shadow);}
  .section h2{font-size:22px;margin:0 0 8px}
  ul.check{padding-left:0;list-style:none;margin:10px 0 0}
  ul.check li{display:flex;gap:10px;align-items:flex-start;margin:8px 0}
  ul.check svg{flex:none;margin-top:4px}
  .code{
    margin-top:12px; border:1px solid var(--border); border-radius:14px; overflow:auto;
    background: var(--code-bg); padding:14px;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
  }
  .tip{font-size:13px;color:var(--muted);margin-top:6px}
  .footer{
    margin-top:36px; padding-top:16px; border-top:1px dashed var(--border); color:var(--muted); font-size:13px
  }
  a{color:var(--brand-2); text-decoration:none}
  a:hover{text-decoration:underline}
  .pill{padding:3px 8px;border-radius:999px;border:1px solid var(--border);font-size:12px;background:rgba(255,255,255,.04)}
</style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <span class="badge">SillyTavern · Regex Preset Binder</span>
      <h1>预设绑定正则（Regex Preset Binder）</h1>
      <p class="lead">为 SillyTavern 带来“把正则脚本内置到预设”的能力，并提供与原生一致的管理体验与一键切换。</p>

      <div class="grid">
        <div class="col-4">
          <div class="card">
            <div class="icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 7L9 18l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>预设内置正则</h3>
            <p class="muted">原版不支持“正则随预设一并加载”。本插件让预设作者可在预设中内置配套正则，用户载入预设即自动可用。</p>
          </div>
        </div>
        <div class="col-4">
          <div class="card">
            <div class="icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 7L9 18l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>完整 UI 控制</h3>
            <p class="muted">和原生正则面板一致的体验：启用/禁用、编辑、导入/导出、排序、批量选择等，一应俱全。</p>
          </div>
        </div>
        <div class="col-4">
          <div class="card">
            <div class="icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 7L9 18l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>一键快速切换</h3>
            <p class="muted">点击按钮即可在“全局 &lt;→ 预设”之间移动脚本，随时绑定或解绑。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>快速上手</h2>
      <ol class="muted" style="margin:6px 0 0;padding-left:20px">
        <li>安装此脚本（你已经完成了）</li>
        <li>打开 <b>设置 → Regex</b>，你会看到新增的 <b>“预设绑定正则”</b> 区域。</li>
        <li>使用 <b>导入预设正则</b> 或 <b>新建预设正则</b> 配置配套规则。</li>
        <li>通过“⬆ 绑定到预设 / ⬇ 移回全局”按钮在两域快速切换。</li>
        <li>拖拽排序，保存即可。</li>
      </ol>

      <div class="code" role="region" aria-label="示例：在预设与全局间切换">
<pre><code>// 在“全局脚本”项中会出现“绑定到预设”按钮：
// 点击后 -> 从 extensions.regex 移除，加入预设列表（并持久化至 prompts）。
// 反向操作“移回全局”同理。
</code></pre>
      </div>
      <div class="tip">提示：预设数据以 JSON 字符串形式保存在 <code>chatCompletionSettings.prompts</code> 的标识 <code>regexes-bindings</code> 下。</div>
    </div>

    <div class="section">
      <h2>FAQ</h2>
      <div class="card col-6" style="padding:16px">
        <h3 style="margin:0 0 4px">预设绑定正则突然无法拖动了怎么办？</h3>
        <p class="muted" style="margin:0">关掉此脚本再打开即可。</p>
      </div>
      <div class="card col-6" style="padding:16px; margin-top:10px">
        <h3 style="margin:0 0 4px">能否批量删除预设绑定项？</h3>
        <p class="muted" style="margin:0">由于酒馆前端代码的硬性限制，目前不支持批删。可单条删除或移回全局后再批量处理。</p>
      </div>
    </div>

    <div class="footer">
      <span>© 2025 Regex Preset Binder · 为创作者与玩家提供更顺滑的正则工作流</span>
    </div>
  </div>
</body>
</html>
