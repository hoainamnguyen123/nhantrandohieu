const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Build Process...");

// 1. Định nghĩa thư mục đầu ra (Vercel cần thư mục này)
const publicDir = path.join(__dirname, 'public');

// Xóa thư mục cũ nếu có để sạch sẽ
if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.mkdirSync(publicDir);

// 2. Hàm copy File/Folder
function copy(item) {
    const srcPath = path.join(__dirname, item);
    const destPath = path.join(publicDir, item);

    if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath, { recursive: true });
        console.log(`✅ Copied: ${item}`);
    } else {
        console.warn(`⚠️  Warning: Source not found: ${item}`);
    }
}

// 3. Copy các file tĩnh vào thư mục public
copy('index.html');
copy('css');
copy('img');
copy('js');

// 4. TẠO FILE CONFIG TỪ BIẾN MÔI TRƯỜNG
// Đây là bước quan trọng để lấy Key từ Vercel Settings
const apiKey = process.env.GEMINI_API_KEY || ''; // Nếu chạy local không có env thì thành chuỗi rỗng

const configContent = `const CONFIG = {
    GEMINI_API_KEY: "${apiKey}"
};`;

// Ghi đè file config.js trong thư mục public (không ảnh hưởng file gốc)
const publicJsDir = path.join(publicDir, 'js');
if (!fs.existsSync(publicJsDir)) {
    fs.mkdirSync(publicJsDir, { recursive: true });
}

fs.writeFileSync(path.join(publicJsDir, 'config.js'), configContent);
console.log('✅ Generated public/js/config.js with Environment Key');

console.log("🎉 Build Completed Successfully!");
