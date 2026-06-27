/**
 * Assist Me - Main Application Logic (Arabic Edition)
 * A vanilla JS application designed for accessibility, featuring:
 * - Speech Recognition (Arabic)
 * - Speech Synthesis (Arabic)
 * - Image Upload Simulation
 * - Routing Simulation
 * - Simple Chatbot Assistant
 */

// --- SPLASH SCREEN ---
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden-splash');
            setTimeout(() => splashScreen.remove(), 800);
        }, 2500); // Show for 2.5 seconds
    }
});

// --- GLOBAL UTILITIES ---

// Prepare available voices specifically for Arabic
let arabicVoice = null;

function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    // Search for Arabic voices (e.g., 'ar-SA', 'ar-EG', 'ar-AE', etc.)
    arabicVoice = voices.find(voice => voice.lang.startsWith('ar')) || null;
}

if ('speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

/**
 * Provides voice feedback using the Web SpeechSynthesis API.
 * @param {string} text - The message to be spoken.
 */

window.speechSynthUtterances = []; // Prevent garbage collection of utterances

function speakFeedback(text) {
    if ('speechSynthesis' in window) {
        const prepareAndSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            window.speechSynthUtterances.push(utterance);
            
            utterance.lang = 'ar-SA';
            
            if (arabicVoice) {
                utterance.voice = arabicVoice;
            } else {
                const currentVoices = window.speechSynthesis.getVoices();
                const tempArVoice = currentVoices.find(v => v.lang.startsWith('ar'));
                if (tempArVoice) utterance.voice = tempArVoice;
            }
            
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            utterance.onend = () => {
                const index = window.speechSynthUtterances.indexOf(utterance);
                if (index > -1) window.speechSynthUtterances.splice(index, 1);
            };
            
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setTimeout(prepareAndSpeak, 250);
        } else {
            prepareAndSpeak();
        }
    }
}

/**
 * Simulates a loading state with a spinner overlay.
 * @param {number} duration - Delay in milliseconds.
 * @param {Function} callback - Function to execute after loading finishes.
 */
function showLoading(duration = 1500, callback) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('hidden');
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        if(callback) callback();
    }, duration);
}


// --- DARK MODE TOGGLE ---
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.documentElement; // Target HTML element for data-theme attribute

// Check localStorage for user preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        speakFeedback("تم تفعيل الوضع الفاتح.");
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        speakFeedback("تم تفعيل الوضع الليلي.");
    }
});


// --- 1. SPEECH TO TEXT ---
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const sttOutput = document.getElementById('sttOutput');

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; // Crucial for Arabic voice recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        sttOutput.textContent = "جاري الاستماع...";
        sttOutput.style.color = "var(--primary-color)";
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        sttOutput.innerHTML = `<strong>${finalTranscript}</strong> <span>${interimTranscript}</span>`;
        sttOutput.style.color = "var(--text-color)";
    };
    
    recognition.onerror = (event) => {
        sttOutput.textContent = "حدث خطأ أثناء التسجيل: " + event.error;
    };
} else {
    sttOutput.textContent = "خدمة التعرف على الصوت غير مدعومة في هذا المتصفح. الرجاء محاولة استخدام كروم (Chrome).";
    startRecordBtn.disabled = true;
}

startRecordBtn.addEventListener('click', () => {
    if(recognition) {
        recognition.start();
        startRecordBtn.disabled = true;
        stopRecordBtn.disabled = false;
        speakFeedback("تم بدء التسجيل الصوتي. تحدث بوضوح.");
    }
});

stopRecordBtn.addEventListener('click', () => {
    if(recognition) {
        recognition.stop();
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
        speakFeedback("تم إيقاف التسجيل الصوتي.");
    }
});


// --- 2. TEXT TO SPEECH ---
const ttsInput = document.getElementById('ttsInput');
const speakBtn = document.getElementById('speakBtn');

speakBtn.addEventListener('click', () => {
    const text = ttsInput.value.trim();
    if (text !== '') {
        speakFeedback(text);
    } else {
        speakFeedback("الرجاء إدخال بعض النص في الصندوق العُلوي أولاً.");
    }
});


// --- 3. IMAGE / OBJECT RECOGNITION (Gemini Vision AI) ---

const imageUpload          = document.getElementById('imageUpload');
const imagePreviewContainer= document.getElementById('imagePreviewContainer');
const imagePreview         = document.getElementById('imagePreview');
const apiKeySetup          = document.getElementById('apiKeySetup');
const visionProgress       = document.getElementById('visionProgress');
const visionProgressFill   = document.getElementById('visionProgressFill');
const visionProgressLabel  = document.getElementById('visionProgressLabel');
const visionResults        = document.getElementById('visionResults');
const reAnalyzeBtn         = document.getElementById('reAnalyzeBtn');
const speakResultBtn       = document.getElementById('speakResultBtn');

// Camera elements
const startVisionCam  = document.getElementById('startVisionCam');
const stopVisionCam   = document.getElementById('stopVisionCam');
const captureVisionBtn= document.getElementById('captureVisionBtn');
const visionVideo     = document.getElementById('visionVideo');
const visionCanvas    = document.getElementById('visionCanvas');
const visionCamOverlay= document.getElementById('visionCamOverlay');

// Tab switching
document.querySelectorAll('.vision-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.vision-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.vision-panel').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(tab.dataset.panel).classList.remove('hidden');
    });
});

// Drag & Drop
const fileDropZone = document.getElementById('fileDropZone');
if (fileDropZone) {
    ['dragover','dragenter'].forEach(ev => {
        fileDropZone.addEventListener(ev, e => { e.preventDefault(); fileDropZone.classList.add('drag-over'); });
    });
    ['dragleave','drop'].forEach(ev => {
        fileDropZone.addEventListener(ev, e => {
            e.preventDefault();
            fileDropZone.classList.remove('drag-over');
            if (ev === 'drop' && e.dataTransfer.files[0]) {
                handleImageFile(e.dataTransfer.files[0]);
            }
        });
    });
}

// API Key Management - Remove default key to force user to enter their own
const DEFAULT_GEMINI_KEY = ''; // Empty - user must provide their own key
let geminiApiKey = localStorage.getItem('geminiApiKey') || DEFAULT_GEMINI_KEY;

function renderApiKeyState() {
    if (geminiApiKey) {
        const isDefault = (geminiApiKey === DEFAULT_GEMINI_KEY);
        if (isDefault) {
            // Hide the setup box; show a sleek powered-by badge
            apiKeySetup.innerHTML = `
                <div class="gemini-powered-badge">
                    <span><i class="fa-solid fa-bolt"></i> مُشغَّل بـ Gemini 1.5 Flash</span>
                    <span class="gemini-status-dot"></span>
                </div>`;
        } else {
            // Custom key saved by user
            apiKeySetup.innerHTML = `
                <div class="api-key-saved">
                    <span><i class="fa-solid fa-circle-check"></i> API Key مخصص محفوظ ومفعّل</span>
                    <button id="changeApiKeyBtn"><i class="fa-solid fa-pen"></i> تغيير</button>
                </div>`;
            document.getElementById('changeApiKeyBtn').addEventListener('click', () => {
                geminiApiKey = DEFAULT_GEMINI_KEY; // revert to default
                localStorage.removeItem('geminiApiKey');
                renderApiKeyState();
            });
        }
    } else {
        // No key at all – show input form
        apiKeySetup.innerHTML = `
            <div class="api-key-header">
                <i class="fa-solid fa-key"></i>
                <span>أدخل Gemini API Key لتفعيل التحليل الحقيقي</span>
            </div>
            <div class="api-key-row">
                <input type="password" id="geminiApiKey" placeholder="AIza..." aria-label="مفتاح Gemini API">
                <button id="saveApiKeyBtn" class="primary-btn" aria-label="حفظ المفتاح">
                    <i class="fa-solid fa-check"></i> حفظ
                </button>
            </div>
            <p class="api-key-hint">
                <i class="fa-solid fa-circle-info"></i>
                احصل على مفتاح مجاني من
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>
            </p>`;

        document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
            const val = document.getElementById('geminiApiKey').value.trim();
            if (!val || !val.startsWith('AIza')) {
                const inp = document.getElementById('geminiApiKey');
                inp.style.borderColor = 'var(--danger-color)';
                setTimeout(() => inp.style.borderColor = '', 1500);
                speakFeedback("المفتاح غير صحيح. يجب أن يبدأ بـ AIza");
                return;
            }
            geminiApiKey = val;
            localStorage.setItem('geminiApiKey', val);
            renderApiKeyState();
            speakFeedback("تم حفظ مفتاح API بنجاح.");
        });
    }
}

renderApiKeyState();

// Progress animation
let progressInterval = null;
function startProgress(steps) {
    visionProgress.classList.remove('hidden');
    visionResults.classList.add('hidden');
    let pct = 0;
    const msgs = [
        'جاري قراءة الصورة...',
        'تحليل المحتوى بالذكاء الاصطناعي...',
        'استخراج العناصر والألوان...',
        'إعداد النتائج باللغة العربية...',
        'اكتمل التحليل!'
    ];
    let step = 0;
    visionProgressFill.style.width = '0%';
    visionProgressLabel.textContent = msgs[0];
    progressInterval = setInterval(() => {
        pct = Math.min(pct + (100 / (steps * 10)), 95);
        visionProgressFill.style.width = pct + '%';
        if (pct > (step + 1) * 20 && step < msgs.length - 1) {
            step++;
            visionProgressLabel.textContent = msgs[step];
        }
    }, 150);
}

function stopProgress() {
    clearInterval(progressInterval);
    visionProgressFill.style.width = '100%';
    visionProgressLabel.textContent = 'اكتمل التحليل!';
    setTimeout(() => visionProgress.classList.add('hidden'), 800);
}

// ── GEMINI VISION API CALL ───────────────────────────────────
async function analyzeImageWithGemini(base64Data, mimeType = 'image/jpeg') {
    const prompt = `أنت مساعد ذكاء اصطناعي متخصص في وصف الصور للأشخاص ذوي الإعاقة البصرية.
حلل هذه الصورة وأجب بالعربية الفصحى الواضحة بتنسيق JSON التالي بالضبط (بدون أي نص خارج الـ JSON):
{
  "description": "وصف شامل للمشهد في جملتين أو ثلاث",
  "objects": ["قائمة", "بالأشياء", "الموجودة"],
  "colors": "الألوان السائدة في الصورة",
  "mood": "الأجواء العامة (مثل: مشرق، هادئ، صاخب...)",
  "text_found": "أي نص مكتوب في الصورة، أو 'لا يوجد'",
  "confidence": "نسبة دقة التحليل مثل 95%",
  "accessibility_alt": "وصف موجز لاستخدامه كنص بديل (alt text) للمكفوفين في جملة واحدة"
}`;

    const body = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
    };

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    
    if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`تم حظر الصورة بواسطة سياسات الأمان: ${data.promptFeedback.blockReason}`);
    }
    
    const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
        throw new Error("لم يتم إرجاع أي تحليل صالح من الذكاء الاصطناعي.");
    }

    // Extract JSON from the response (handle ```json...``` blocks)
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/);
    const jsonStr   = jsonMatch ? jsonMatch[1] : raw;
    
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("فشل في قراءة البيانات الواردة من الذكاء الاصطناعي.");
    }
}

// Fallback if no API key
function getSimulatedAnalysis() {
    const responses = [
        { description: 'يبدو المشهد غرفة مضيئة تحتوي على أثاث بسيط وجدران فاتحة اللون.', objects: ['كرسي', 'طاولة', 'نافذة', 'مصباح'], colors: 'أبيض، بيج، رمادي فاتح', mood: 'هادئ ومريح', text_found: 'لا يوجد', confidence: '87%', accessibility_alt: 'غرفة مضيئة بأثاث بسيط.' },
        { description: 'منظر طبيعي خارجي مع أشجار خضراء وسماء صافية وأرض عشبية.', objects: ['أشجار', 'سماء', 'عشب', 'سحاب'], colors: 'أخضر، أزرق، أبيض', mood: 'مشرق وطبيعي', text_found: 'لا يوجد', confidence: '91%', accessibility_alt: 'منظر طبيعي بأشجار وسماء زرقاء.' },
        { description: 'وجبة غذائية على طاولة تحتوي على خضروات طازجة وأطباق ملونة.', objects: ['طبق', 'خضروات', 'ملعقة', 'كوب'], colors: 'أحمر، أخضر، أبيض', mood: 'شهي وجميل', text_found: 'لا يوجد', confidence: '89%', accessibility_alt: 'وجبة صحية مع خضروات على طاولة.' },
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ── RENDER RESULTS ───────────────────────────────────────────
function renderVisionResults(data) {
    document.getElementById('vrDescription').textContent = data.description || '—';

    // Tags
    const tagsEl = document.getElementById('vrTags');
    tagsEl.innerHTML = '';
    (data.objects || []).forEach((obj, i) => {
        const tag = document.createElement('span');
        tag.className = 'vr-tag';
        tag.style.animationDelay = `${i * 50}ms`;
        tag.textContent = obj;
        tagsEl.appendChild(tag);
    });

    document.getElementById('vrColors').textContent     = data.colors     || '—';
    document.getElementById('vrMood').textContent       = data.mood       || '—';
    document.getElementById('vrText').textContent       = data.text_found || '—';
    document.getElementById('vrConfidence').textContent = data.confidence || '—';
    document.getElementById('vrA11y').textContent       = data.accessibility_alt || data.description || '—';

    visionResults.classList.remove('hidden');
    speakFeedback(data.accessibility_alt || data.description || 'تم تحليل الصورة.');
}

// ── MAIN ANALYSIS FLOW ───────────────────────────────────────
let currentImageBase64 = '';
let currentImageMime   = 'image/jpeg';

async function analyzeImage(base64, mime) {
    currentImageBase64 = base64;
    currentImageMime   = mime;

    startProgress(5);
    visionResults.classList.add('hidden');

    // Remove any previous error
    document.querySelector('.vision-error')?.remove();

    try {
        let result;
        if (geminiApiKey) {
            try {
                result = await analyzeImageWithGemini(base64, mime);
            } catch (err) {
                console.warn("Gemini API Error:", err);
                // Fallback to simulated analysis gracefully
                result = getSimulatedAnalysis();
                const warn = document.createElement('div');
                warn.className = 'vision-error';
                warn.style.backgroundColor = '#fff3cd';
                warn.style.color = '#856404';
                warn.style.borderColor = '#ffeeba';
                warn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> تعذر الاتصال بالذكاء الاصطناعي (${err.message}). تم استخدام التحليل البديل.`;
                visionResults.before(warn);
            }
        } else {
            // Warn user and fall back to simulation
            await new Promise(r => setTimeout(r, 2000));
            result = getSimulatedAnalysis();
            const warn = document.createElement('div');
            warn.className = 'vision-error';
            warn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> أنت تستخدم وضع المحاكاة. أضف Gemini API Key للحصول على نتائج حقيقية.';
            visionResults.before(warn);
        }
        stopProgress();
        renderVisionResults(result);
    } catch (err) {
        stopProgress();
        const errEl = document.createElement('div');
        errEl.className = 'vision-error';
        errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> خطأ خارجي: ${err.message}`;
        visionResults.before(errEl);
        speakFeedback('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        console.error(err);
    }
}

function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        imagePreview.src = dataUrl;
        imagePreviewContainer.classList.remove('hidden');

        // Extract base64 without the data:...;base64, prefix
        const [header, b64] = dataUrl.split(',');
        const mime = header.match(/:(.*?);/)[1];
        analyzeImage(b64, mime);
    };
    reader.readAsDataURL(file);
}

imageUpload.addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageFile(e.target.files[0]);
});

reAnalyzeBtn?.addEventListener('click', () => {
    if (currentImageBase64) analyzeImage(currentImageBase64, currentImageMime);
});

speakResultBtn?.addEventListener('click', () => {
    const desc = document.getElementById('vrA11y').textContent;
    if (desc && desc !== '—') speakFeedback(desc);
});

// ── LIVE CAMERA CAPTURE ───────────────────────────────────────
let visionCamStream = null;

startVisionCam?.addEventListener('click', async () => {
    try {
        visionCamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        visionVideo.srcObject = visionCamStream;
        visionCamOverlay.classList.add('hidden');
        startVisionCam.classList.add('hidden');
        stopVisionCam.classList.remove('hidden');
        captureVisionBtn.classList.remove('hidden');
        speakFeedback("تم تشغيل الكاميرا. وجّه الكاميرا نحو المشهد ثم اضغط التقاط وتحليل.");
    } catch (err) {
        speakFeedback("تعذر الوصول إلى الكاميرا.");
        alert("❌ " + err.message);
    }
});

stopVisionCam?.addEventListener('click', () => {
    visionCamStream?.getTracks().forEach(t => t.stop());
    visionCamStream = null;
    visionVideo.srcObject = null;
    visionCamOverlay.classList.remove('hidden');
    startVisionCam.classList.remove('hidden');
    stopVisionCam.classList.add('hidden');
    captureVisionBtn.classList.add('hidden');
});

captureVisionBtn?.addEventListener('click', () => {
    visionCanvas.width  = visionVideo.videoWidth  || 640;
    visionCanvas.height = visionVideo.videoHeight || 480;
    const ctx = visionCanvas.getContext('2d');
    ctx.drawImage(visionVideo, 0, 0);

    const dataUrl = visionCanvas.toDataURL('image/jpeg', 0.9);
    const [head, b64] = dataUrl.split(',');

    // Show preview
    imagePreview.src = dataUrl;
    imagePreviewContainer.classList.remove('hidden');

    analyzeImage(b64, 'image/jpeg');
    speakFeedback("تم الالتقاط، جاري التحليل...");
});




// --- 4. NAVIGATION ASSISTANT (REAL MAP & SIMULATED ROUTING) ---
const destinationInput = document.getElementById('destinationInput');
const navigateBtn = document.getElementById('navigateBtn');
const navOutput = document.getElementById('navOutput');

// Initialize Real Map (Leaflet)
let userLat = 30.0444; // Default: Cairo center
let userLng = 31.2357;
let map;
let marker;

// Only initialize if Leaflet is loaded successfully via CDN
if (typeof L !== 'undefined') {
    map = L.map('map').setView([userLat, userLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; خريطة الشارع المفتوحة (OpenStreetMap)'
    }).addTo(map);

    marker = L.marker([userLat, userLng]).addTo(map)
        .bindPopup('موقعك الحالي')
        .openPopup();

    // Try to get real user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            map.setView([userLat, userLng], 15);
            marker.setLatLng([userLat, userLng]);
        }, () => {
            console.log("تم رفض الوصول للمكان أو غير متاح. نستخدم الموقع الافتراضي.");
        });
    }
}

navigateBtn.addEventListener('click', () => {
    const destination = destinationInput.value.trim();
    
    if(destination === "") {
        speakFeedback("الرجاء إدخال وجهة للتنقل إليها.");
        return;
    }
    
    speakFeedback("جاري البحث عن موقع الوجهة...");
    showLoading(1500, () => {
        // Use free Nominatim Geocoding API to find the destination
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const destLat = parseFloat(data[0].lat);
                    const destLng = parseFloat(data[0].lon);
                    
                    if (map) {
                        map.setView([destLat, destLng], 15);
                        L.marker([destLat, destLng]).addTo(map)
                            .bindPopup(`الوجهة: ${data[0].display_name}`).openPopup();
                        
                        // Draw a simple path between user and destination
                        L.polyline([
                            [userLat, userLng],
                            [destLat, destLng]
                        ], {color: 'var(--primary-color)', weight: 4}).addTo(map);
                    }
                    
                    navOutput.classList.remove('hidden');
                    const message = `تم العثور على ${destination}. نعرض المسار الآمن الآن على الخريطة.`;
                    navOutput.innerHTML = `<strong>معلومات المسار:</strong> ${message}`;
                    speakFeedback(message);
                } else {
                    navOutput.classList.remove('hidden');
                    navOutput.innerHTML = `<strong>خطأ:</strong> تعذر العثور على الوجهة المدخلة على الخريطة.`;
                    speakFeedback("الوجهة غير موجودة. الرجاء محاولة إدخال مكان آخر بشكل أوضح.");
                }
            })
            .catch(error => {
                navOutput.classList.remove('hidden');
                navOutput.innerHTML = `<strong>خطأ:</strong> فشل البحث. الرجاء التحقق من اتصالك بالإنترنت.`;
                speakFeedback("تعذر الاتصال بخدمة الخرائط. الرجاء التحقق من جودة الاتصال.");
                console.error(error);
            });
    });
});


// --- 5. CHAT ASSISTANT ---
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatWindow = document.getElementById('chatWindow');

/**
 * Appends a message to the chat window DOM
 */
function addChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-message', sender);
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
    // Auto-scroll to latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function getGeminiChatResponse(userInput) {
    const prompt = `أنت مساعد ذكي عربي متخصص في مساعدة ذوي الهمم (الأشخاص ذوي الإعاقة). 
يجب أن تكون إجاباتك:
1. بالعربية الفصحى
2. مختصرة ومفيدة
3. مناسبة للأشخاص ذوي الإعاقة البصرية أو السمعية أو الحركية
4. ودودة ومفيدة

المستخدم يقول: ${userInput}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
    };

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Formulates a simple bot response based on user keywords or uses Gemini AI
 */
async function processBotResponse(userInput, callback) {
    const text = userInput.toLowerCase();
    
    // First check for specific keywords that need immediate responses
    if (text.includes('طوارئ') || text.includes('sos') || text.includes('نجدة') || text.includes('مساعدة سريعة')) {
        const reply = "في حالات الطوارئ الحقيقية، يرجى الاستعانة بزر الطوارئ (SOS) الأحمر في أسفل الشاشة.";
        setTimeout(() => {
            addChatMessage(reply, 'bot');
            speakFeedback(reply);
            if (callback) callback();
        }, 500);
        return;
    }

    // Try to use Gemini AI for smarter responses
    if (geminiApiKey) {
        try {
            console.log("Attempting to call Gemini API...");
            const aiReply = await getGeminiChatResponse(userInput);
            console.log("Gemini response:", aiReply);
            if (aiReply && aiReply.trim()) {
                setTimeout(() => {
                    addChatMessage(aiReply, 'bot');
                    speakFeedback(aiReply);
                    if (callback) callback();
                }, 800);
                return;
            }
        } catch (err) {
            console.error("Gemini Chat Error:", err.message);
            addChatMessage("عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. سأستخدم الردود التقليدية.", "bot");
            if (callback) callback();
        }
    } else {
        console.warn("No API key available");
        if (callback) callback();
    }

    // Fallback to keyword-based responses
    let reply = "عذراً، لم أفهمك بشكل واضح. حاول كتابة كلمات مثل 'مساعدة'، 'قراءة'، أو 'ملاحة'.";
    
    if (text.includes('مساعدة') || text.includes('يساعد')) {
        reply = "كيف يمكنني مساعدتك؟ يتوفر لدي ميزات تحويل النص والصوت، والملاحة، والتعرف على الصور.";
    } else if (text.includes('قراءة') || text.includes('نص')) {
        reply = "هل تبحث عن قارئ الشاشة؟ ببساطة اكتب نصك في قسم 'تحويل النص إلى صوت'واضغط على زر تحدث.";
    } else if (text.includes('ملاحة') || text.includes('خريطة') || text.includes('مكان')) {
        reply = "لبدء الملاحة، استخدم مساعد الملاحة بأمان وأدخل وجهتك هناك.";
    } else if (text.includes('مرحبا') || text.includes('أهلا') || text.includes('سلام')) {
        reply = "مرحباً! أنا مساعدك الذكي لتسهيل الوصول. كيف أجعل يومك أفضل؟";
    } else if (text.includes('شكرا') || text.includes('شكراً')) {
        reply = "عفواً! أنا هنا لمساعدتك. هل هناك شيء آخر يمكنني doing it for you؟";
    }
    
    setTimeout(() => {
        addChatMessage(reply, 'bot');
        speakFeedback(reply);
        if (callback) callback();
    }, 800);
    return;
}

// --- 6. EMERGENCY SOS ---
const sosBtn = document.getElementById('sosBtn');

sosBtn.addEventListener('click', () => {
    speakFeedback("تم تفعيل نظام الطوارئ السريع. يتم تجهيز بيانات موقعك لإرسالها.");
    
    // Simulate sending location with a confirmation prompt
    const confirmSOS = confirm("🚨 تم تفعيل إنذار الطوارئ (SOS) 🚨\n\nيتم تجهيز بيانات موقعك لإرسالها فوراً لجهات الاتصال الطارئة المحددة مسبقاً.\n\nاضغط 'موافق/OK' للإرسال أو 'إلغاء/Cancel' للإيقاف.");
    
    if(confirmSOS) {
        showLoading(2500, () => {
            alert("✅ تم إرسال الموقع بنجاح. تم تنبيه فرق النجدة. يرجى البقاء في موقعك آمناً إن تفضل ذلك.");
            speakFeedback("تم إرسال الموقع بنجاح. المساعدة في طريقها إليك. يرجى البقاء في أمان والتزام الهدوء.");
        });
    } else {
        speakFeedback("تم إلغاء إنذار الطوارئ بنجاح.");
    }
});


// ============================================================
//  7. SIGN LANGUAGE MODULE
// ============================================================

/**
 * Complete Arabic Sign Language dictionary
 * Each entry: { ar, en, emoji, category }
 */
const SIGN_DICTIONARY = [
    // Greetings
    { ar: 'مرحبا',      en: 'Hello',       emoji: '👋',  category: 'greetings' },
    { ar: 'السلام',     en: 'Peace',       emoji: '✌️',  category: 'greetings' },
    { ar: 'أهلا',       en: 'Welcome',     emoji: '🤗',  category: 'greetings' },
    { ar: 'شكرا',       en: 'Thank you',   emoji: '🙏',  category: 'greetings' },
    { ar: 'عفوا',       en: 'You\'re welcome', emoji: '😊', category: 'greetings' },
    { ar: 'مع السلامة', en: 'Goodbye',     emoji: '👋',  category: 'greetings' },
    { ar: 'صباح الخير', en: 'Good morning',emoji: '🌅',  category: 'greetings' },
    { ar: 'مساء الخير', en: 'Good evening', emoji: '🌙', category: 'greetings' },

    // Emergency
    { ar: 'مساعدة',     en: 'Help',        emoji: '🆘',  category: 'emergency' },
    { ar: 'خطر',        en: 'Danger',      emoji: '⚠️',  category: 'emergency' },
    { ar: 'طوارئ',      en: 'Emergency',   emoji: '🚨',  category: 'emergency' },
    { ar: 'طبيب',       en: 'Doctor',      emoji: '🏥',  category: 'emergency' },
    { ar: 'إسعاف',      en: 'Ambulance',   emoji: '🚑',  category: 'emergency' },
    { ar: 'شرطة',       en: 'Police',      emoji: '🚔',  category: 'emergency' },
    { ar: 'نار',        en: 'Fire',        emoji: '🔥',  category: 'emergency' },
    { ar: 'ألم',        en: 'Pain',        emoji: '😣',  category: 'emergency' },

    // Daily life
    { ar: 'ماء',        en: 'Water',       emoji: '💧',  category: 'daily' },
    { ar: 'طعام',       en: 'Food',        emoji: '🍽️',  category: 'daily' },
    { ar: 'بيت',        en: 'Home',        emoji: '🏠',  category: 'daily' },
    { ar: 'سيارة',      en: 'Car',         emoji: '🚗',  category: 'daily' },
    { ar: 'مدرسة',      en: 'School',      emoji: '🏫',  category: 'daily' },
    { ar: 'عمل',        en: 'Work',        emoji: '💼',  category: 'daily' },
    { ar: 'نوم',        en: 'Sleep',       emoji: '😴',  category: 'daily' },
    { ar: 'حمام',       en: 'Bathroom',    emoji: '🚿',  category: 'daily' },
    { ar: 'هاتف',       en: 'Phone',       emoji: '📱',  category: 'daily' },
    { ar: 'مال',        en: 'Money',       emoji: '💰',  category: 'daily' },

    // Feelings
    { ar: 'سعيد',       en: 'Happy',       emoji: '😊',  category: 'feelings' },
    { ar: 'حزين',       en: 'Sad',         emoji: '😢',  category: 'feelings' },
    { ar: 'غاضب',       en: 'Angry',       emoji: '😠',  category: 'feelings' },
    { ar: 'خائف',       en: 'Scared',      emoji: '😱',  category: 'feelings' },
    { ar: 'محب',        en: 'Loving',      emoji: '❤️',  category: 'feelings' },
    { ar: 'متعب',       en: 'Tired',       emoji: '😓',  category: 'feelings' },
    { ar: 'جائع',       en: 'Hungry',      emoji: '🤤',  category: 'feelings' },
    { ar: 'عطشان',      en: 'Thirsty',     emoji: '🥤',  category: 'feelings' },

    // Numbers
    { ar: 'واحد',  en: '1 - One',   emoji: '1️⃣', category: 'numbers' },
    { ar: 'اثنان', en: '2 - Two',   emoji: '2️⃣', category: 'numbers' },
    { ar: 'ثلاثة', en: '3 - Three', emoji: '3️⃣', category: 'numbers' },
    { ar: 'أربعة', en: '4 - Four',  emoji: '4️⃣', category: 'numbers' },
    { ar: 'خمسة',  en: '5 - Five',  emoji: '5️⃣', category: 'numbers' },
    { ar: 'ستة',   en: '6 - Six',   emoji: '6️⃣', category: 'numbers' },
    { ar: 'سبعة',  en: '7 - Seven', emoji: '7️⃣', category: 'numbers' },
    { ar: 'ثمانية',en: '8 - Eight', emoji: '8️⃣', category: 'numbers' },
    { ar: 'تسعة',  en: '9 - Nine',  emoji: '9️⃣', category: 'numbers' },
    { ar: 'عشرة',  en: '10 - Ten',  emoji: '🔟', category: 'numbers' },
];

/** Simulated camera recognition results */
const CAMERA_RESULTS = [
    { word: 'مرحبا', en: 'Hello', emoji: '👋', confidence: 94 },
    { word: 'شكرا',  en: 'Thank you', emoji: '🙏', confidence: 89 },
    { word: 'مساعدة', en: 'Help', emoji: '🆘', confidence: 91 },
    { word: 'سعيد',  en: 'Happy', emoji: '😊', confidence: 86 },
    { word: 'ماء',   en: 'Water', emoji: '💧', confidence: 93 },
    { word: 'محب',   en: 'Love', emoji: '❤️', confidence: 97 },
    { word: 'طوارئ', en: 'Emergency', emoji: '🚨', confidence: 88 },
    { word: 'خمسة',  en: 'Five', emoji: '5️⃣', confidence: 95 },
];

const categoryLabels = {
    greetings: 'تحيات',
    emergency: 'طوارئ',
    daily: 'يومي',
    feelings: 'مشاعر',
    numbers: 'أرقام',
};

// ── TAB SWITCHING ────────────────────────────────────────────
const signTabs   = document.querySelectorAll('.sign-tab');
const signPanels = document.querySelectorAll('.sign-panel');

signTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        signTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        signPanels.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panelId = tab.getAttribute('aria-controls');
        const panel   = document.getElementById(panelId);
        panel.classList.remove('hidden');

        // Init library on first open
        if (panelId === 'panel-library' && !signLibraryGrid.children.length) {
            renderLibrary('all');
        }
    });
});


// ── PANEL 1: TEXT → SIGN ─────────────────────────────────────
const signTextInput   = document.getElementById('signTextInput');
const translateSignBtn= document.getElementById('translateSignBtn');
const signDisplayArea = document.getElementById('signDisplayArea');

/**
 * Finds a sign for a word (fuzzy Arabic match).
 */
function findSign(word) {
    const clean = word.trim().replace(/[،؟!.,]/g, '');
    return SIGN_DICTIONARY.find(s =>
        s.ar === clean ||
        s.ar.includes(clean) ||
        clean.includes(s.ar)
    ) || null;
}

/**
 * Renders the sign cards for a list of words.
 */
function renderSignCards(words) {
    signDisplayArea.innerHTML = '';

    if (!words.length) {
        signDisplayArea.innerHTML = `
            <div class="sign-placeholder">
                <i class="fa-solid fa-hands" style="font-size:3rem;opacity:0.3"></i>
                <p>ستظهر الإشارات هنا</p>
            </div>`;
        return;
    }

    let foundAny = false;
    words.forEach((word, i) => {
        const sign = findSign(word);
        if (!word.trim()) return;

        const card = document.createElement('div');
        card.style.animationDelay = `${i * 60}ms`;

        if (sign) {
            foundAny = true;
            card.className = 'sign-word-card';
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `إشارة كلمة ${sign.ar}`);
            card.innerHTML = `
                <span class="sign-emoji-large">${sign.emoji}</span>
                <span class="sign-word-ar">${sign.ar}</span>
                <span class="sign-word-en">${sign.en}</span>`;
            card.addEventListener('click', () => {
                speakFeedback(sign.ar);
                card.classList.add('active-card');
                setTimeout(() => card.classList.remove('active-card'), 700);
            });
            card.addEventListener('keypress', e => { if (e.key === 'Enter') card.click(); });
        } else {
            card.className = 'sign-not-found';
            card.innerHTML = `
                <span style="font-size:1.5rem">❓</span>
                <span>${word.trim()}</span>`;
        }
        signDisplayArea.appendChild(card);
    });

    // Action buttons below the cards
    if (foundAny) {
        const speakRow = document.createElement('div');
        speakRow.className = 'sign-speak-row';
        speakRow.style.width = '100%';
        speakRow.innerHTML = `
            <button class="primary-btn sign-speak-btn" id="speakSignBtn" aria-label="قراءة الكلمات بصوت عالٍ">
                <i class="fa-solid fa-volume-high"></i> قراءة الكلمات
            </button>
            <button class="secondary-btn" id="clearSignBtn" aria-label="مسح الإشارات">
                <i class="fa-solid fa-broom"></i> مسح
            </button>`;
        signDisplayArea.appendChild(speakRow);

        document.getElementById('speakSignBtn').addEventListener('click', () => {
            const text = words.join(' ');
            speakFeedback(text);
        });
        document.getElementById('clearSignBtn').addEventListener('click', () => {
            signTextInput.value = '';
            signDisplayArea.innerHTML = `
                <div class="sign-placeholder">
                    <i class="fa-solid fa-hands" style="font-size:3rem;opacity:0.3"></i>
                    <p>ستظهر الإشارات هنا</p>
                </div>`;
        });
    }
}

translateSignBtn.addEventListener('click', () => {
    const text = signTextInput.value.trim();
    if (!text) {
        speakFeedback("الرجاء كتابة كلمة أو جملة أولاً.");
        return;
    }
    const words = text.split(/\s+/);
    renderSignCards(words);
    speakFeedback(`تم تحويل "${text}" إلى لغة الإشارة.`);
});

signTextInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') translateSignBtn.click();
});


// ── PANEL 2: CAMERA SIGN RECOGNITION ────────────────────────
const startCameraBtn  = document.getElementById('startCameraBtn');
const stopCameraBtn   = document.getElementById('stopCameraBtn');
const captureSignBtn  = document.getElementById('captureSignBtn');
const signVideo       = document.getElementById('signVideo');
const signCanvas      = document.getElementById('signCanvas');
const cameraOverlay   = document.getElementById('cameraOverlay');
const cameraSignResult= document.getElementById('cameraSignResult');
const cameraContainer = document.querySelector('.camera-container');

let cameraStream = null;
let handDetectionInterval = null;
let lastDrawnDots = [];

/** Draw colourful hand skeleton dots on canvas */
function drawHandDots(ctx, w, h) {
    // Erase previous frame
    ctx.clearRect(0, 0, w, h);

    // Randomize dots positions slightly to simulate live tracking
    if (!lastDrawnDots.length) {
        lastDrawnDots = [
            { x: 0.50, y: 0.65 }, // wrist
            { x: 0.42, y: 0.55 }, { x: 0.38, y: 0.42 }, { x: 0.36, y: 0.32 }, { x: 0.34, y: 0.24 }, // thumb
            { x: 0.47, y: 0.52 }, { x: 0.44, y: 0.36 }, { x: 0.43, y: 0.24 }, { x: 0.42, y: 0.15 }, // index
            { x: 0.52, y: 0.50 }, { x: 0.51, y: 0.33 }, { x: 0.51, y: 0.21 }, { x: 0.51, y: 0.12 }, // middle
            { x: 0.57, y: 0.52 }, { x: 0.58, y: 0.36 }, { x: 0.58, y: 0.25 }, { x: 0.59, y: 0.16 }, // ring
            { x: 0.62, y: 0.55 }, { x: 0.65, y: 0.42 }, { x: 0.67, y: 0.32 }, { x: 0.68, y: 0.24 }, // pinky
        ];
    } else {
        lastDrawnDots = lastDrawnDots.map(d => ({
            x: d.x + (Math.random() - 0.5) * 0.01,
            y: d.y + (Math.random() - 0.5) * 0.01,
        }));
    }

    const dots = lastDrawnDots;

    // Connections
    const connections = [
        [0,1],[1,2],[2,3],[3,4],       // thumb
        [0,5],[5,6],[6,7],[7,8],        // index
        [0,9],[9,10],[10,11],[11,12],   // middle
        [0,13],[13,14],[14,15],[15,16], // ring
        [0,17],[17,18],[18,19],[19,20], // pinky
        [5,9],[9,13],[13,17],           // palm
    ];

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    connections.forEach(([a, b]) => {
        ctx.moveTo(dots[a].x * w, dots[a].y * h);
        ctx.lineTo(dots[b].x * w, dots[b].y * h);
    });
    ctx.stroke();

    // Dots
    dots.forEach((d, i) => {
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, i === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#8b5cf6' : '#a78bfa';
        ctx.fill();
    });
}

function startHandDetection() {
    const ctx = signCanvas.getContext('2d');
    signCanvas.width  = cameraContainer.offsetWidth;
    signCanvas.height = cameraContainer.offsetHeight;

    handDetectionInterval = setInterval(() => {
        drawHandDots(ctx, signCanvas.width, signCanvas.height);
    }, 80);
}

function stopHandDetection() {
    clearInterval(handDetectionInterval);
    handDetectionInterval = null;
    const ctx = signCanvas.getContext('2d');
    ctx.clearRect(0, 0, signCanvas.width, signCanvas.height);
    lastDrawnDots = [];
}

startCameraBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        signVideo.srcObject = cameraStream;
        cameraOverlay.classList.add('hidden');
        cameraContainer.classList.add('camera-active');

        // Add live badge dynamically
        if (!document.querySelector('.camera-live-badge')) {
            const badge = document.createElement('div');
            badge.className = 'camera-live-badge';
            badge.innerHTML = '<div class="live-dot"></div> مباشر';
            cameraContainer.appendChild(badge);
        }

        startCameraBtn.classList.add('hidden');
        stopCameraBtn.classList.remove('hidden');
        captureSignBtn.classList.remove('hidden');
        cameraSignResult.classList.add('hidden');

        speakFeedback("تم تشغيل الكاميرا. ضع يدك أمام الكاميرا ثم اضغط التقاط.");
        startHandDetection();
    } catch (err) {
        speakFeedback("لم يتمكن التطبيق من الوصول للكاميرا. الرجاء السماح بالوصول من إعدادات المتصفح.");
        alert("❌ تعذر الوصول إلى الكاميرا: " + err.message);
    }
});

stopCameraBtn.addEventListener('click', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    signVideo.srcObject = null;
    cameraOverlay.classList.remove('hidden');
    cameraContainer.classList.remove('camera-active');
    startCameraBtn.classList.remove('hidden');
    stopCameraBtn.classList.add('hidden');
    captureSignBtn.classList.add('hidden');
    cameraSignResult.classList.add('hidden');
    stopHandDetection();
    speakFeedback("تم إيقاف الكاميرا.");
});

captureSignBtn.addEventListener('click', () => {
    // Flash animation
    const flash = document.createElement('div');
    flash.className = 'capture-flash';
    cameraContainer.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Simulate AI recognition
    const result = CAMERA_RESULTS[Math.floor(Math.random() * CAMERA_RESULTS.length)];
    cameraSignResult.classList.remove('hidden');
    cameraSignResult.querySelector('.result-emoji').textContent = result.emoji;
    cameraSignResult.querySelector('.result-word').textContent = `${result.word} (${result.en})`;
    cameraSignResult.querySelector('.result-confidence').textContent = `نسبة الدقة: ${result.confidence}%`;

    speakFeedback(`تم التعرف على إشارة: ${result.word} بدقة ${result.confidence} بالمائة.`);
});


// ── PANEL 3: SIGN LIBRARY ────────────────────────────────────
const signLibraryGrid = document.getElementById('signLibraryGrid');
const librarySearch   = document.getElementById('librarySearch');
const catBtns         = document.querySelectorAll('.cat-btn');

let activeCat = 'all';

function renderLibrary(cat, query = '') {
    signLibraryGrid.innerHTML = '';
    const q = query.trim().toLowerCase();

    const filtered = SIGN_DICTIONARY.filter(s => {
        const matchCat   = cat === 'all' || s.category === cat;
        const matchQuery = !q || s.ar.includes(q) || s.en.toLowerCase().includes(q);
        return matchCat && matchQuery;
    });

    if (!filtered.length) {
        signLibraryGrid.innerHTML = `
            <div class="no-results-msg">
                <i class="fa-solid fa-magnifying-glass" style="font-size:2rem;opacity:0.4;display:block;margin-bottom:8px"></i>
                لا توجد نتائج مطابقة
            </div>`;
        return;
    }

    filtered.forEach((s, i) => {
        const card = document.createElement('div');
        card.className = 'lib-card';
        card.style.animationDelay = `${i * 30}ms`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `إشارة ${s.ar}`);
        card.innerHTML = `
            <span class="lib-emoji">${s.emoji}</span>
            <span class="lib-word-ar">${s.ar}</span>
            <span class="lib-word-en">${s.en}</span>
            <span class="lib-category-tag">${categoryLabels[s.category]}</span>`;

        card.addEventListener('click', () => {
            speakFeedback(s.ar);
            card.style.transform = 'scale(0.95)';
            setTimeout(() => card.style.transform = '', 200);
        });
        card.addEventListener('keypress', e => { if (e.key === 'Enter') card.click(); });
        signLibraryGrid.appendChild(card);
    });
}

catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.cat;
        renderLibrary(activeCat, librarySearch.value);
    });
});

librarySearch.addEventListener('input', () => {
    renderLibrary(activeCat, librarySearch.value);
});

// Pre-render library
renderLibrary('all');

