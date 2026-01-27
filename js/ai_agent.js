// === 5. AI CHATBOT (GEMINI) ===
const GEMINI_API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : '';
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
let isChatOpen = false;

// === 5.1 DRAGGABLE WIDGET ===
let isChatDragging = false; // Global flag to prevent click when dragging

function makeDraggable(elementId) {
    const element = document.getElementById(elementId);
    const dragHandle = document.getElementById("chatLauncherBtn"); // Use specific ID
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    if (!element || !dragHandle) return;

    dragHandle.onmousedown = dragMouseDown;
    dragHandle.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        // e.preventDefault(); // allow default to support click
        isChatDragging = false;

        // Get initial mouse position
        pos3 = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        pos4 = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        // Calculate new cursor position
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        // Check if actually moved significant amount to count as drag
        if (Math.abs(pos3 - clientX) > 2 || Math.abs(pos4 - clientY) > 2) {
            isChatDragging = true;
        }

        if (!isChatDragging) return;

        e.preventDefault(); // Prevent scrolling if dragging

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // Set element new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";

        // Important: Override bottom/right to allow free movement via top/left
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // Reset flag after a short delay to allow onclick to checking it
        setTimeout(() => isChatDragging = false, 100);
    }
}

// Initialize Draggable
document.addEventListener('DOMContentLoaded', () => {
    makeDraggable("aiChatWidget");
});

function toggleChat() {
    if (isChatDragging) return; // Stop toggle if dragging

    const chatWindow = document.getElementById('chatWindow');
    const launcherBtn = document.getElementById('chatLauncherBtn');

    isChatOpen = !isChatOpen;

    if (isChatOpen) {
        // === SMART POSITIONING LOGIC ===
        const screenW = window.innerWidth;

        // Reset common styles
        chatWindow.style.top = 'auto';
        chatWindow.style.bottom = 'auto';
        chatWindow.style.left = 'auto';
        chatWindow.style.right = 'auto';

        if (screenW <= 768) {
            // === MOBILE: CENTER ON SCREEN ===
            chatWindow.style.top = '0';
            chatWindow.style.bottom = '0';
            chatWindow.style.left = '0';
            chatWindow.style.right = '0';
            chatWindow.style.margin = 'auto';
            chatWindow.style.transformOrigin = 'center';
        } else {
            // === DESKTOP: NEAR BUTTON (STRICT PROXIMITY) ===
            chatWindow.style.margin = '0'; // Reset margin

            const btnRect = launcherBtn.getBoundingClientRect();
            const winRect = { width: 300, height: 450 }; // Updated size
            const screenH = window.innerHeight;
            const gap = 2; // Very close

            let originY = 'bottom';
            let originX = 'right';

            // 1. HORIZONTAL: Left vs Right
            // If button is in the right half of screen -> Show Window on LEFT
            if (btnRect.left > screenW / 2) {
                chatWindow.style.right = (screenW - btnRect.left + gap) + 'px';
                chatWindow.style.left = 'auto'; // Clear left
                originX = 'right';
            } else {
                // Button is in left half -> Show Window on RIGHT
                chatWindow.style.left = (btnRect.right + gap) + 'px';
                chatWindow.style.right = 'auto'; // Clear right
                originX = 'left';
            }

            // 2. VERTICAL ALIGNMENT (LOWERING IT)
            // Instead of sitting "above", let's align the BOTTOM of the window with the BOTTOM of the icon
            // so they sit on the same baseline.

            // Calculate distance from bottom of screen to bottom of button
            const bottomDist = screenH - btnRect.bottom;

            // Check if window fits upwards from this baseline
            if (winRect.height < btnRect.bottom) {
                // Fits fine, align bottoms
                chatWindow.style.bottom = bottomDist + 'px';
                chatWindow.style.top = 'auto';
                originY = 'bottom';
            } else {
                // Window too tall, must align Top or push up
                chatWindow.style.top = gap + 'px';
                chatWindow.style.bottom = 'auto';
                originY = 'top';
            }

            // Special case: If user drags to Top edge, we still need to open "Below"
            // Override if button is very high up (top < 100px)
            if (btnRect.top < 100) {
                chatWindow.style.top = (btnRect.bottom + gap) + 'px';
                chatWindow.style.bottom = 'auto';
                originY = 'top';
            }

            chatWindow.style.transformOrigin = `${originY} ${originX}`;
        }

        chatWindow.classList.remove('scale-0');
        chatWindow.classList.add('scale-100');
        // setTimeout(() => document.getElementById('chatInput').focus(), 300); // Disabled auto-focus per user request
    } else {
        chatWindow.classList.remove('scale-100');
        chatWindow.classList.add('scale-0');
    }
}

function handleChatInput(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    addMessageToUI(message, 'user');
    input.value = '';

    const loadingId = addMessageToUI("...", 'ai', true);

    try {
        const reply = await callGeminiAPI(message);
        removeMessage(loadingId);
        addMessageToUI(reply || "Xin lỗi, tôi không thể trả lời lúc này.", 'ai');
    } catch (err) {
        removeMessage(loadingId);
        console.error("Lỗi:", err);
        addMessageToUI("Xin lỗi quý khách, hệ thống đang bận. Quý khách vui lòng thử lại sau giây lát ạ! 🥰", 'ai');
    }
}

async function callGeminiAPI(userMessage) {
    // SYSTEM PROMPT / INSTRUCTION
    const systemInstruction = `
    Bạn là Trợ lý AI của Shop Nhân Trần Đỗ Hiếu.
    THÔNG TIN CỐT LÕI:
    - Sản phẩm: Nhân trần khô tự nhiên vùng núi Tân Lạc, Hòa Bình.
    - Công dụng: Thanh nhiệt, mát gan, ngủ ngon, tốt cho phụ nữ sau sinh.
    - ĐẶC BIỆT: Nhân trần đã được rửa sạch và sấy khô kỹ lưỡng, khách hàng KHÔNG CẦN RỬA LẠI trước khi hãm/đun.
    - Giá bán: 25.000đ/gói (100g).
    - Ưu đãi: Mua 10 gói giảm 10k, Mua 20 gói giảm 20k.
    - Địa chỉ: xã Phong Phú, Huyện Tân Lạc, Tỉnh Hòa Bình.
    - Vận chuyển: Ship COD toàn quốc (Viettel Post/GHTK). Phí ship trung bình 25k-35k (tùy khu vực). Thời gian giao 2-4 ngày.

    PHONG CÁCH TRẢ LỜI:
    - Cực kỳ thân thiện, dễ thương, dùng nhiều emoji (🌱, 🍵, ✨, 🥰).
    - Xưng hô: "Em" (Trợ lý) và "Anh/Chị".
    - Luôn tích cực và nhiệt tình.

    QUY TẮC XỬ LÝ TÌNH HUỐNG (ƯU TIÊN TRẢ LỜI TRƯỚC):
    1. Về Giá/Mặc cả:
       - AI chào đúng giá niêm yết (25k/gói).
       - Nếu khách xin giảm giá lẻ: Từ chối khéo và mời mua combo 10 gói để được giảm.
       - CHỈ mời gọi Anh Nam nếu khách muốn nhập sỉ số lượng lớn (>50 gói) hoặc mặc cả quá nhiều lần.

    2. Về Ship hàng:
       - Tự tin trả lời phí ship (khoảng 30k) và thời gian (2-4 ngày). Không cần hỏi Anh Nam.
       - CHỈ mời gọi Anh Nam nếu khách cần ship Hỏa Tốc gấp trong ngày đi tỉnh lạ hoặc ship ra nước ngoài.

    3. Các câu hỏi khác:
       - Cố gắng trả lời dựa trên thông tin đã học.
       - CHỈ "đầu hàng" khi khách hỏi thông tin đời tư cá nhân, vấn đề nhạy cảm, hoặc chửi bới.

    KHI CẦN GỌI ANH NAM (Chỉ dùng cho các trường hợp đặc biệt trên):
    "Dạ vấn đề này hơi khó, để được hỗ trợ tốt nhất, anh/chị vui lòng ấn vào NÚT GỌI ĐIỆN, Hoặc nhắn tin Zalo ở GÓC TRÁI màn hình để gặp trực tiếp Anh Nam (Co-founder) nhé ạ! 🥰"

    4. Về Đặt Hàng Số Lượng Cụ Thể (Quan trọng):
       - Nếu khách nói muốn mua số lượng cụ thể (ví dụ: "cho 1 gói", "lấy 2 gói", "đặt 5 gói", ...), hãy hướng dẫn khách:
       "Dạ vâng, để đặt hàng nhanh nhất, anh/chị vui lòng điền thông tin vào PHẦN ĐẶT HÀNG ở bên dưới hoặc ấn nút ĐẶT HÀNG NGAY để bên em lên đơn cho mình nhé ạ! 🥰"

    Hãy trả lời ngắn gọn (dưới 3 câu nếu có thể).
    `;

    const payload = {
        contents: [{
            parts: [{ text: systemInstruction + `\n\nKhách hàng hỏi: ${userMessage}\nTrợ lý trả lời:` }]
        }]
    };

    const response = await fetch(API_URL + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
        console.error("LỖI TỪ GOOGLE:", data.error);
        return "Xin lỗi quý khách, hệ thống đang bận. Quý khách vui lòng thử lại sau giây lát ạ! 🥰";
    }

    if (!data.candidates || data.candidates.length === 0) {
        return "Xin lỗi, tôi không thể trả lời câu hỏi này.";
    }

    return data.candidates[0].content.parts[0].text;
}

function addMessageToUI(text, sender, isLoading = false) {
    const chatMessages = document.getElementById('chatMessages');
    const msgId = 'msg-' + Date.now();
    const isUser = sender === 'user';
    const align = isUser ? 'justify-end' : 'justify-start';
    const bg = isUser ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-800';

    let contentHtml = '';

    if (isUser) {
        contentHtml = `
            <div class="p-3 rounded-lg text-sm max-w-[80%] ${bg} shadow-sm">
                ${text}
            </div>`;
    } else {
        // AI Message with Avatar
        contentHtml = `
            <div class="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 mt-1 mr-2">
                <img src="img/chatbot_avatar.png" alt="AI" class="w-full h-full object-cover">
            </div>
            <div class="p-3 rounded-2xl rounded-tl-none text-sm max-w-[80%] ${bg} shadow-sm border border-gray-100">
                ${text}
            </div>`;
    }

    const html = `
        <div id="${msgId}" class="flex ${align} mb-3 ${isLoading ? 'animate-pulse' : ''} items-start">
            ${contentHtml}
        </div>`;
    chatMessages.insertAdjacentHTML('beforeend', html);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
