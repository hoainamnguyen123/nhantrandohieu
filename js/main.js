// === 1. API ĐỊA CHÍNH (PROVINCES API) ===
const host = "https://provinces.open-api.vn/api/";

var callAPI = (api) => {
    return fetch(api)
        .then((response) => response.json())
        .then((rows) => {
            renderData(rows, "province");
        });
}

callAPI('https://provinces.open-api.vn/api/?depth=1');

var callApiDistrict = (api) => {
    return fetch(api)
        .then((response) => response.json())
        .then((rows) => {
            renderData(rows.districts, "district");
        });
}
var callApiWard = (api) => {
    return fetch(api)
        .then((response) => response.json())
        .then((rows) => {
            renderData(rows.wards, "ward");
        });
}

var renderData = (array, select) => {
    let row = ' <option disable value="">' + (select === 'province' ? 'Chọn Tỉnh/Thành' : (select === 'district' ? 'Chọn Quận/Huyện' : 'Chọn Phường/Xã')) + '</option>';
    array.forEach(element => {
        row += `<option data-id="${element.code}" value="${element.name}">${element.name}</option>`
    });
    document.querySelector("#" + select).innerHTML = row;
}

document.querySelector("#province").addEventListener("change", () => {
    let selectedOption = document.querySelector("#province").options[document.querySelector("#province").selectedIndex];
    let provinceCode = selectedOption.dataset.id;
    callApiDistrict(host + "p/" + provinceCode + "?depth=2");
    document.querySelector("#district").innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    document.querySelector("#ward").innerHTML = '<option value="">Chọn Phường/Xã</option>';
});

document.querySelector("#district").addEventListener("change", () => {
    let selectedOption = document.querySelector("#district").options[document.querySelector("#district").selectedIndex];
    let districtCode = selectedOption.dataset.id;
    callApiWard(host + "d/" + districtCode + "?depth=2");
    document.querySelector("#ward").innerHTML = '<option value="">Chọn Phường/Xã</option>';
});

// === 2. MOBILE MENU & UI LOGIC ===
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-icon');

    if (menu.classList.contains('menu-closed')) {
        menu.classList.remove('menu-closed');
        menu.classList.add('menu-open');
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        menu.classList.add('menu-closed');
        menu.classList.remove('menu-open');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

const slides = document.querySelectorAll('.slide');
let currentSlide = 0;
function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}
setInterval(nextSlide, 5000);

// PARTICLES EFFECT
function createParticles() {
    const container = document.getElementById('particles');
    // Check if container exists to prevent errors
    if (!container) return;

    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random properties
        const size = Math.random() * 5 + 2; // 2px to 7px
        const left = Math.random() * 100; // 0% to 100%
        const duration = Math.random() * 10 + 10; // 10s to 20s
        const delay = Math.random() * 5; // 0s to 5s

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.bottom = `-20px`; // Start below
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}
document.addEventListener('DOMContentLoaded', createParticles);

// === 3. TRANSLATION & CART LOGIC ===
let currentLang = 'vi';
const UNIT_PRICE = 25000;

function toggleLanguage() {
    currentLang = currentLang === 'vi' ? 'en' : 'vi';
    document.getElementById('current-lang-display').innerText = currentLang.toUpperCase();
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[currentLang][key]) el.innerHTML = translations[currentLang][key];
    });
    // Update placeholders
    document.querySelectorAll('[data-placeholder]').forEach(el => {
        const key = el.getAttribute('data-placeholder');
        if (translations[currentLang][key]) el.placeholder = translations[currentLang][key];
    });
    updateTotal();
}

function changeQty(amount) {
    const input = document.getElementById('quantity');
    let newValue = parseInt(input.value) + amount;
    if (newValue < 1) newValue = 1;
    input.value = newValue;
    updateTotal();
}

function updateTotal() {
    const qty = parseInt(document.getElementById('quantity').value) || 0;
    let subtotal = qty * UNIT_PRICE;
    let discount = Math.floor(qty / 10) * 10000;
    let finalTotal = subtotal - discount;
    if (finalTotal < 0) finalTotal = 0;

    const totalPriceEl = document.getElementById('totalPrice');
    const discountRow = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');

    if (discount > 0) {
        discountRow.classList.remove('hidden');
        discountAmountEl.innerText = `-${formatCurrency(discount)}`;
    } else {
        discountRow.classList.add('hidden');
    }
    totalPriceEl.innerText = formatCurrency(finalTotal);
}

function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + (currentLang === 'vi' ? 'đ' : ' VND');
}

// === 4. GOOGLE FORM SUBMIT (WITH ADDRESS COMBINATION) ===
const GOOGLE_FORM_CONFIG = {
    formURL: "https://docs.google.com/forms/d/e/1FAIpQLSeXdEilR1SjmJrwsLzqfNA5j6MrC_GPG7j-3WJ7AHJUh31Jzw/formResponse",
    entryIDs: {
        name: "entry.335929754",
        phone: "entry.963974311",
        address: "entry.1626455781",
        quantity: "entry.1760436127",
        total: "entry.207976968"
    }
};

function submitOrder() {
    // 1. SPAM PREVENTION: Honeypot Check
    const honeypot = document.getElementById('honey_website');
    if (honeypot && honeypot.value) {
        console.warn("Spam bot detected!");
        alert(translations[currentLang]['alert_spam'] || "Spam detected!");
        return;
    }

    // 2. SPAM PREVENTION: Rate Limiting (2 attempts / 5 mins lock)
    const SPAM_KEY = 'spamProtection';
    const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes
    const RESET_WINDOW = 10 * 60 * 1000; // Reset count if no activity for 10 mins

    let spamState = JSON.parse(localStorage.getItem(SPAM_KEY)) || { count: 0, lockUntil: 0, lastTime: 0 };
    const now = Date.now();

    // Check Lock
    if (spamState.lockUntil > now) {
        const remaining = Math.ceil((spamState.lockUntil - now) / 60000);
        alert((translations[currentLang]['alert_rate_limit'] || "Too fast!").replace("5", remaining));
        return;
    }

    // Reset count if idle for too long
    if (now - spamState.lastTime > RESET_WINDOW) {
        spamState.count = 0;
    }


    // 3. SPAM PREVENTION: Cloudflare Turnstile Check (Client Side Only)
    const turnstileToken = turnstile.getResponse();
    if (!turnstileToken) {
        alert(translations[currentLang]['alert_captcha'] || "Please verify Captcha!");
        return;
    }

    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const quantity = document.getElementById('quantity').value;
    const total = document.getElementById('totalPrice').innerText;

    // Get Address Parts
    const houseNumber = document.getElementById('houseNumber').value;
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const ward = document.getElementById('ward').value;

    if (!name || !phone || !houseNumber || !province || !district || !ward) {
        alert(currentLang === 'vi' ? "Vui lòng điền đầy đủ thông tin!" : "Please fill in all fields!");
        return;
    }

    // Combine Address
    const fullAddress = `${houseNumber}, ${ward}, ${district}, ${province}`;

    const btn = document.getElementById('submitBtn');
    const originalText = document.getElementById('btnText').innerText;
    const originalIconClass = document.getElementById('btnIcon').className;

    btn.disabled = true;
    btn.innerHTML = `<div class="loader"></div> ${currentLang === 'vi' ? 'Đang gửi...' : 'Sending...'}`;

    const formData = new FormData();
    formData.append(GOOGLE_FORM_CONFIG.entryIDs.name, name);
    formData.append(GOOGLE_FORM_CONFIG.entryIDs.phone, phone);
    formData.append(GOOGLE_FORM_CONFIG.entryIDs.address, fullAddress); // Send combined address
    formData.append(GOOGLE_FORM_CONFIG.entryIDs.quantity, quantity);
    formData.append(GOOGLE_FORM_CONFIG.entryIDs.total, total);

    fetch(GOOGLE_FORM_CONFIG.formURL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
    }).then(() => {
        // Update Spam State
        spamState.count++;
        spamState.lastTime = Date.now();
        if (spamState.count >= 2) {
            spamState.lockUntil = Date.now() + LOCK_DURATION;
        }
        localStorage.setItem(SPAM_KEY, JSON.stringify(spamState));

        // Reset Turnstile
        turnstile.reset();

        showSuccess(name);
        resetForm(btn, originalText, originalIconClass);
    }).catch((err) => {
        showSuccess(name); // Google Forms no-cors often throws or returns opaque, we assume success or handle generic error
        resetForm(btn, originalText, originalIconClass);
    });
}

function showSuccess(name) {
    document.getElementById('successName').innerText = name;
    // Trigger Confetti
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2F5233', '#C5A059', '#D9534F']
        });
    }
    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    document.getElementById('orderForm').reset();
    updateTotal();
}

function resetForm(btn, text, iconClass) {
    btn.disabled = false;
    btn.innerHTML = `<span id="btnText">${text}</span> <i id="btnIcon" class="${iconClass}"></i>`;
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('visible');
    modal.classList.add('hidden');
}

// Init
if (document.getElementById('quantity')) {
    updateTotal();
}

// === 5. NEW FEATURES LOGIC ===

// FAQ Accordion
function toggleFAQ(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');

    // Toggle current
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.classList.remove('rotate-45');
        icon.classList.remove('text-brand-accent');
        icon.classList.add('text-brand-gold');
    } else {
        // Close others (Optional - keep open for better UX or close for cleaner UI? Let's close others for cleaner UI)
        document.querySelectorAll('#faq .max-h-0').forEach(el => {
            if (el !== content && el.style.maxHeight) {
                el.style.maxHeight = null;
                el.previousElementSibling.querySelector('i').classList.remove('rotate-45');
                el.previousElementSibling.querySelector('i').classList.remove('text-brand-accent');
            }
        });

        content.style.maxHeight = content.scrollHeight + "px";
        icon.classList.add('rotate-45');
        icon.classList.add('text-brand-accent');
        icon.classList.remove('text-brand-gold');
    }
}

// Back To Top Scroll
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('translate-y-20', 'opacity-0');
        } else {
            backToTopBtn.classList.add('translate-y-20', 'opacity-0');
        }
    });
}
// === 5. AI CHATBOT (GEMINI) ===
// === 5. AI CHATBOT (GEMINI) ===
const GEMINI_API_KEY = "AIzaSyBKTm_loT3FAdcAj5Ezq8egGj362zlJLI0";
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
        // === SMART POSITIONING LOGIC (STRICT PROXIMITY) ===
        const btnRect = launcherBtn.getBoundingClientRect();
        const winRect = { width: 300, height: 450 }; // Updated size
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const gap = 2; // Very close

        // Reset all positioning styles first
        chatWindow.style.top = 'auto';
        chatWindow.style.bottom = 'auto';
        chatWindow.style.left = 'auto';
        chatWindow.style.right = 'auto';

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

        chatWindow.classList.remove('scale-0');
        chatWindow.classList.add('scale-100');
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
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
        addMessageToUI("Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau. (Lỗi: " + err.message + ")", 'ai');
    }
}

async function callGeminiAPI(userMessage) {
    // SYSTEM PROMPT / INSTRUCTION
    const systemInstruction = `
    Bạn là Trợ lý AI của Shop Nhân Trần Đỗ Hiếu.
    THÔNG TIN CỐT LÕI:
    - Sản phẩm: Nhân trần khô tự nhiên vùng núi Tân Lạc, Hòa Bình.
    - Công dụng: Thanh nhiệt, mát gan, ngủ ngon, tốt cho phụ nữ sau sinh.
    - Giá bán: 25.000đ/gói (100g).
    - Ưu đãi: Mua 10 giảm 10k, Mua 20 giảm 20k, Ship COD toàn quốc.

    PHONG CÁCH TRẢ LỜI:
    - Cực kỳ thân thiện, dễ thương, dùng nhiều emoji (🌱, 🍵, ✨, 🥰).
    - Xưng hô: "Em" (Trợ lý) và "Anh/Chị".
    - Luôn tích cực và nhiệt tình.

    QUY TẮC ĐIỀU HƯỚNG (QUAN TRỌNG):
    - Nếu khách hỏi về Nhân Trần/Sức khỏe: Trả lời chi tiết, khen sản phẩm tốt lắm.
    - Nếu khách hỏi chuyện phím (thời tiết, tình yêu...): Trả lời ngắn gọn, vui vẻ rồi khéo léo lái về uống nhân trần.
      Ví dụ: "Hôm nay trời nắng đẹp thế này mà có ly nhân trần đá mát lạnh thì tuyệt vời lắm ạ! 😎"
    - Nếu khách hỏi vấn đề tiêu cực/nhạy cảm: Từ chối khéo léo và mời uống trà cho hạ hỏa.

    Hãy trả lời ngắn gọn (dưới 3 câu nếu có thể) trừ khi cần giải thích chi tiết.
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
        return "Lỗi từ Google: " + data.error.message;
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

    const html = `
        <div id="${msgId}" class="flex ${align} mb-3 ${isLoading ? 'animate-pulse' : ''}">
            <div class="p-3 rounded-lg text-sm max-w-[80%] ${bg} shadow-sm">
                ${text}
            </div>
        </div>`;
    chatMessages.insertAdjacentHTML('beforeend', html);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}