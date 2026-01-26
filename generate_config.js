const fs = require('fs');
const path = require('path');

// Lấy API Key từ biến môi trường (trên Vercel)
// Nếu không có (chạy local chưa setup env), đành dùng chuỗi rỗng hoặc giá trị mặc định
const apiKey = process.env.GEMINI_API_KEY || '';

const content = `const CONFIG = {
    GEMINI_API_KEY: "${apiKey}"
};`;

// Đảm bảo thư mục js tồn tại
const dir = path.join(__dirname, 'js');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Ghi file config.js
fs.writeFileSync(path.join(dir, 'config.js'), content);
console.log('✅ Created js/config.js from Environment Variable!');
