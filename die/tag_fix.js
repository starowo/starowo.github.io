$(() => {
  const id = window.frameElement.parentElement.parentElement.parentElement.parentElement.getAttribute('mesid');
  const previousMessages = getChatMessages(id - 2);
  if (previousMessages.length === 0) {
    return;
  }
  const previousMessage = previousMessages[0].message;
  const messages = getChatMessages(id);
  const currentMessage = messages[0].message;

  const expectedTags = parseTags(previousMessage);
  const currentTags = parseTags(currentMessage);

  console.log(JSON.stringify(expectedTags));
  console.log(JSON.stringify(currentTags));

  const fixResult = fixTags(expectedTags, currentTags, currentMessage);
  if (fixResult.fixedTags.length > 0 || fixResult.missingTags.length > 0) {
    console.log(JSON.stringify(fixResult));
  } else {
    console.log('no fix');
  }
  let suffix = '<tag_fixed />';
  if (fixResult.missingTags.length > 0) {
    suffix += '<hr /><p><small>检测到以下标签缺失：</small></p>';
    for (const missingTag of fixResult.missingTags) {
      suffix += `<p><small>${missingTag.tagName}</small></p>`;
    }
    suffix += '<hr />';
    suffix +=
      '<p><small>如果这是有意为之，请忽略此提示。如果这是错误，可以尝试打开左下角的菜单，点击“继续”</small></p>';
  }
  const fixedMessage = fixResult.fixedMessage + suffix;
  setChatMessages([
    {
      message_id: id,
      message: fixedMessage,
    },
  ]);
});

class XMLTagStructure {
  constructor(tag) {
    this.parent = null;
    this.children = [];
    // 提取标签名：去掉< >，如果是闭合标签去掉/，然后提取第一个单词作为标签名
    const tagContent = tag.slice(1, -1); // 去掉 < 和 >
    const isClosingTag = tagContent.startsWith('/');
    const cleanTagContent = isClosingTag ? tagContent.slice(1) : tagContent;
    // 提取标签名（第一个单词，去掉属性）
    this.tagName = cleanTagContent.split(/\s+/)[0];
    this.noClose = false;
  }
}

function parseTags(message) {
  /* parse all xml tags in message */
  // 更严格的XML标签正则：标签名必须以字母或下划线开头，只能包含字母、数字、连字符、点号、下划线
  const tags = message.match(/<\/?[a-zA-Z_][a-zA-Z0-9_\-.]*[^>]*>/g);
  const allTagStructures = [];
  const stack = []; // 用于跟踪标签层级关系

  // 定义常见的自闭合标签
  const selfClosingTags = new Set([
    'br',
    'hr',
    'img',
    'input',
    'meta',
    'link',
    'area',
    'base',
    'col',
    'embed',
    'keygen',
    'param',
    'source',
    'track',
    'wbr',
  ]);

  if (!tags) return [];

  for (const tag of tags) {
    if (tag.startsWith('</')) {
      // 闭合标签处理
      const tagContent = tag.slice(2, -1); // 去掉 </ 和 >
      const tagName = tagContent.split(/\s+/)[0]; // 提取标签名（第一个单词）

      // 从栈中找到对应的开始标签
      let found = false;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tagName === tagName) {
          stack.splice(i, 1); // 移除匹配的开始标签
          found = true;
          break;
        }
      }

      // 如果没有找到对应的开始标签，当作独立的noClose标签处理
      if (!found) {
        const tagStructure = new XMLTagStructure(tag);
        tagStructure.noClose = true;

        // 设置父子关系
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          tagStructure.parent = parent;
          parent.children.push(tagStructure);
        }

        allTagStructures.push(tagStructure);
      }
    } else {
      // 开始标签或自闭合标签处理
      const tagStructure = new XMLTagStructure(tag);

      // 检查是否为自闭合标签
      if (tag.endsWith('/>') || selfClosingTags.has(tagStructure.tagName.toLowerCase())) {
        tagStructure.noClose = true;
      }

      // 设置父子关系
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        tagStructure.parent = parent;
        parent.children.push(tagStructure);
      }

      allTagStructures.push(tagStructure);

      // 如果不是自闭合标签，加入栈中等待闭合
      if (!tagStructure.noClose) {
        stack.push(tagStructure);
      }
    }
  }

  // 处理未闭合的标签，将它们标记为noClose并重新分配子标签
  for (const unclosedTag of stack) {
    unclosedTag.noClose = true;

    // 将未闭合标签的子标签重新分配给它的父标签
    if (unclosedTag.children.length > 0) {
      const originalParent = unclosedTag.parent;

      for (const child of unclosedTag.children) {
        child.parent = originalParent;
        if (originalParent) {
          originalParent.children.push(child);
        }
      }

      // 清空原来的子标签列表
      unclosedTag.children = [];
    }
  }

  // 只返回最顶层的标签结构（没有父标签的）
  return allTagStructures.filter(tag => tag.parent === null);
}

function fixTags(expectedTags, currentTags, currentMessage) {
  const result = {
    missingTags: [], // 缺失的标签
    fixedTags: [], // 修复的标签
    fixedMessage: currentMessage, // 修复后的消息
  };

  // 获取所有标签的平铺列表（包括嵌套的子标签）
  function flattenTags(tags) {
    const flattened = [];
    function traverse(tagList) {
      for (const tag of tagList) {
        flattened.push(tag);
        if (tag.children.length > 0) {
          traverse(tag.children);
        }
      }
    }
    traverse(tags);
    return flattened;
  }

  const expectedFlat = flattenTags(expectedTags);
  const currentFlat = flattenTags(currentTags);
  let messageToFix = currentMessage;
  const fixedTagNames = new Set(); // 记录已修正的标签名

  // 特殊情况：如果两个消息的第一个标签都是noClose且不一致，直接修正
  if (expectedFlat.length > 0 && currentFlat.length > 0) {
    const expectedFirstTag = expectedFlat[0];
    const currentFirstTag = currentFlat[0];

    if (expectedFirstTag.noClose && currentFirstTag.noClose && expectedFirstTag.tagName !== currentFirstTag.tagName) {
      // 直接替换第一个标签
      const expectedTagPattern = `<${expectedFirstTag.tagName}>`;
      const currentTagPattern = `<${currentFirstTag.tagName}>`;

      messageToFix = messageToFix.replace(currentTagPattern, expectedTagPattern);

      result.fixedTags.push({
        original: currentTagPattern,
        fixed: expectedTagPattern,
        reason: `修正第一个标签：从 "${currentFirstTag.tagName}" 到 "${expectedFirstTag.tagName}"`,
      });

      // 记录已修正的标签，避免重复计入缺失标签
      fixedTagNames.add(expectedFirstTag.tagName);
    }
  }

  // 1. 找出缺失的标签（排除已在特殊情况中修正的标签）
  for (const expectedTag of expectedFlat) {
    // 如果这个标签已经在特殊情况中被修正了，跳过
    if (fixedTagNames.has(expectedTag.tagName)) {
      continue;
    }

    const found = currentFlat.find(
      currentTag => currentTag.tagName === expectedTag.tagName && currentTag.noClose === expectedTag.noClose,
    );

    if (!found) {
      result.missingTags.push({
        tagName: expectedTag.tagName,
        originalTag: expectedTag,
        noClose: expectedTag.noClose,
      });
    }
  }

  // 2. 找出错误的标签并修复
  const currentNoCloseTags = currentFlat.filter(tag => tag.noClose);

  for (const currentNoCloseTag of currentNoCloseTags) {
    // 检查这个noClose标签在expected中是否不是noClose
    const expectedMatch = expectedFlat.find(
      expectedTag => expectedTag.tagName === currentNoCloseTag.tagName && !expectedTag.noClose,
    );

    if (expectedMatch) {
      // 找到一个在expected中不是noClose，但在current中是noClose的标签
      // 现在找下一个不存在于expected中的noClose标签，可能是它的错误闭合标签

      const potentialClosingTags = currentNoCloseTags.filter(
        tag => tag !== currentNoCloseTag && !expectedFlat.some(expectedTag => expectedTag.tagName === tag.tagName),
      );

      if (potentialClosingTags.length > 0) {
        const closingTag = potentialClosingTags[0];

        // 检查是否可能是闭合标签的typo
        if (closingTag.tagName.startsWith('/') || isLikelyClosingTag(closingTag.tagName, currentNoCloseTag.tagName)) {
          // 修复：将错误的闭合标签替换为正确的闭合标签
          const correctClosingTag = `</${currentNoCloseTag.tagName}>`;
          const wrongTagPattern = new RegExp(`<${closingTag.tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'g');

          messageToFix = messageToFix.replace(wrongTagPattern, correctClosingTag);

          result.fixedTags.push({
            original: `<${closingTag.tagName}>`,
            fixed: correctClosingTag,
            reason: `修正 "${currentNoCloseTag.tagName}" 标签的闭合标签`,
          });
        }
      }
    }
  }

  result.fixedMessage = messageToFix;
  return result;
}

// 辅助函数：判断是否可能是闭合标签的拼写错误
function isLikelyClosingTag(suspiciousTag, openTagName) {
  // 移除可能的前导斜杠
  const cleanSuspicious = suspiciousTag.replace(/^\/+/, '');

  // 计算编辑距离（简单版本）
  const distance = getEditDistance(cleanSuspicious, openTagName);
  const maxAllowedDistance = Math.max(1, Math.floor(openTagName.length * 0.3));

  return distance <= maxAllowedDistance;
}

// 简单的编辑距离计算
function getEditDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}
