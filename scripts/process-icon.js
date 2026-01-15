import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 定义输入和输出路径
// 输入：项目根目录下的 src/icons/icon.png
// 输出：直接覆盖原文件（或者你可以修改为其他文件名）
const inputPath = path.join(__dirname, '../src/icons/icon.png');
const outputPath = path.join(__dirname, '../src/icons/icon.png');

async function processIcon() {
  try {
    console.log('正在处理图标...');
    
    await sharp(inputPath)
      /**
       * .trim() 
       * 含义：自动裁剪。
       * 作用：它会检测图像边缘所有的透明区域（或背景色区域）并将其切除。
       * 解决您提到的“原图周围有很多空白”的问题。
       */
      .trim()

      /**
       * .resize(128, 128, { ... })
       * 含义：调整尺寸为 128x128 像素。
       * 参数解释：
       * - fit: 'contain' : 保持纵横比。如果原图裁剪后不是正方形，它会缩放到 128 宽或高，然后居中。
       * - background: { r: 0, g: 0, b: 0, alpha: 0 } : 背景设置为完全透明。
       *   如果原图不是正方形，'contain' 模式留下的空白处将填充为透明。
       */
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })

      /**
       * .png()
       * 含义：确保输出格式为 PNG。
       */
      .png()

      /**
       * .toFile(outputPath)
       * 含义：保存到指定路径。
       */
      .toFile(outputPath + '.tmp'); // 先保存到临时文件

    // 用处理后的文件覆盖原文件
    fs.renameSync(outputPath + '.tmp', outputPath);

    console.log('✅ 图标处理成功！');
    console.log('📍 路径:', outputPath);
    console.log('📏 尺寸: 128x128 (已裁剪空白)');
  } catch (err) {
    console.error('❌ 处理图标时出错:', err.message);
    if (err.message.includes('Input file is missing')) {
      console.error('错误：找不到源文件 src/icons/icon.png');
    }
  }
}

processIcon();
