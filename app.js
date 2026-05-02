// ==========================================
// 1. FIREBASE KÜTÜPHANELERİ (ES MODULE) VE AYARLAR
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// !!! KENDİ FIREBASE YAPILANDIRMANI BURAYA GİR !!!
const firebaseConfig = {
    apiKey: "AIzaSyBdcbY5tq3fgT8gte5REOgqgY9Euwpf0VM",
    authDomain: "beldostum-b4a12.firebaseapp.com",
    projectId: "beldostum-b4a12",
    storageBucket: "beldostum-b4a12.firebasestorage.app",
    messagingSenderId: "447140624771",
    appId: "1:447140624771:web:c2ab9e8bed4a8845409eb6",
    measurementId: "G-HGS52HMPJP"
};

// Firebase Başlatma
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Veritabanı Döküman Referansı (Global veri alanı)
const userDocRef = null;

// Bellekte tutacağımız güncel veriler
let dbData = {
    progress: {}, 
    stats: { workoutsThisMonth: 0, currentMonth: "", leveledUpExercises: [], workoutDays: [] }
};


// ==========================================
// 2. ÇOKLU PROGRAM VERİTABANI               
// ==========================================
const workoutPrograms = {
    "itis": {
        name: "İtiş Günü",
        exercises: [
            { id: "incline_pushup", isim: "Eğimli Şınav", tip: "tekrar", varsayilanHedef: 10, aciklama: "Masa veya yatak kenarında. Göğüs (Chest)." },
            { id: "triceps_dips", isim: "Sandalye Dips", tip: "tekrar", varsayilanHedef: 10, aciklama: "Arka Kol / Üst Kol Arkası (Triceps)." },
            { id: "iso_shoulder_press", isim: "İzometrik Omuz İtişi", tip: "sure", varsayilanHedef: 15, aciklama: "Kapı pervazına kollarını iki yandan bastırarak." },
            { id: "wall_angels", isim: "Duvar Melekleri", tip: "tekrar", varsayilanHedef: 10, aciklama: "Arka Omuz ve Postür." },
            { id: "mcgill_curlup", isim: "McGill Yarım Mekik", tip: "tekrar", varsayilanHedef: 10, aciklama: "Klasik mekik yerine fıtık dostu versiyon." },
            { id: "plank", isim: "Plank (Yarım veya Tam)", tip: "sure", varsayilanHedef: 20, aciklama: "Tüm Merkez Bölge (Core)." },
            { id: "bird_dog", isim: "Kuş-Köpek (Bird-Dog)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Bel ve Omurga Destek Kasları." },
            { id: "glute_bridge", isim: "Kalça Köprüsü (Glute Bridge)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Kalça ve Alt Bel." }
        ]
    },
    "alt_vucut": {
        name: "Alt Vücut Günü",
        exercises: [
            { id: "box_squat", isim: "Sandalye Squat", tip: "tekrar", varsayilanHedef: 12, aciklama: "Üst Bacak (Quads)." },
            { id: "reverse_lunge", isim: "Ters Adım (Reverse Lunge)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Her bacak için 5 tekrar. Tüm Bacak ve Kalça." },
            { id: "clamshells", isim: "İstiridye (Clamshells)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Yan Kalça (Gluteus Medius)." },
            { id: "calf_raises", isim: "Parmak Ucu Yükselme", tip: "tekrar", varsayilanHedef: 15, aciklama: "Ayakta durup parmak ucuna yükselme. Baldır (Calves)." },
            { id: "dead_bug", isim: "Ölü Böcek (Dead Bug)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Alt Karın (Lower Abs)." },
            { id: "plank", isim: "Plank (Yarım veya Tam)", tip: "sure", varsayilanHedef: 20, aciklama: "Tüm Merkez Bölge (Core)." },
            { id: "bird_dog", isim: "Kuş-Köpek (Bird-Dog)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Bel ve Omurga Destek Kasları." },
            { id: "glute_bridge", isim: "Kalça Köprüsü (Glute Bridge)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Kalça ve Alt Bel." }
        ]
    },
    "cekis": {
        name: "Çekiş Günü",
        exercises: [
            { id: "towel_pullapart", isim: "Havlu Çekme", tip: "tekrar", varsayilanHedef: 12, aciklama: "Havluyu iki yandan yırtacakmış gibi çekip göğse getirme. Sırt (Back)." },
            { id: "prone_towel_pulldown", isim: "Yüzüstü Havlu Kaydırma", tip: "tekrar", varsayilanHedef: 10, aciklama: "Yüzüstü yatıp ellerindeki havluyu ensene doğru çekme. Kanat (Lats)." },
            { id: "leg_bicep_curl", isim: "Bacağa Karşı Pazı Bükme", tip: "tekrar", varsayilanHedef: 10, aciklama: "Kendi bacağına direnç uygulayarak. Ön Kol (Biceps)." },
            { id: "towel_wring", isim: "Havlu Sıkma", tip: "sure", varsayilanHedef: 15, aciklama: "Kalın bir havluyu suyunu sıkarmış gibi var gücünle ters yönlere çevirip bekleme." },
            { id: "reverse_snow_angel", isim: "Ters Kar Meleği", tip: "tekrar", varsayilanHedef: 10, aciklama: "Kürek Kemikleri ve Sırt." },
            { id: "plank", isim: "Plank (Yarım veya Tam)", tip: "sure", varsayilanHedef: 20, aciklama: "Tüm Merkez Bölge (Core)." },
            { id: "bird_dog", isim: "Kuş-Köpek (Bird-Dog)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Bel ve Omurga Destek Kasları." },
            { id: "glute_bridge", isim: "Kalça Köprüsü (Glute Bridge)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Kalça ve Alt Bel." }
        ]
    },
    "kondisyon": {
        name: "Kondisyon Günü",
        exercises: [
            { id: "wide_wall_pushup", isim: "Geniş Tutuş Duvar Şınavı", tip: "tekrar", varsayilanHedef: 12, aciklama: "Dış Göğüs (Outer Chest)." },
            { id: "wall_sit", isim: "Duvar Oturuşu", tip: "sure", varsayilanHedef: 30, aciklama: "Bacak (Legs)." },
            { id: "side_plank", isim: "Yan Plank", tip: "sure", varsayilanHedef: 15, aciklama: "Sağ ve Sol. Yan Karın (Obliques)." },
            { id: "bear_hold", isim: "Ayı Duruşu", tip: "sure", varsayilanHedef: 20, aciklama: "Tüm Core, Omuz ve Bacak." },
            { id: "iso_front_raise", isim: "İzometrik Ön Omuz", tip: "sure", varsayilanHedef: 15, aciklama: "Yumruklarını duvara önden bastırarak direnç uygulama." },
            { id: "plank", isim: "Plank (Yarım veya Tam)", tip: "sure", varsayilanHedef: 20, aciklama: "Tüm Merkez Bölge (Core)." },
            { id: "bird_dog", isim: "Kuş-Köpek (Bird-Dog)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Bel ve Omurga Destek Kasları." },
            { id: "glute_bridge", isim: "Kalça Köprüsü (Glute Bridge)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Kalça ve Alt Bel." }
        ]
    },
    "full_body": {
        name: "Full Body",
        exercises: [
            { id: "incline_pushup", isim: "Eğimli Şınav", tip: "tekrar", varsayilanHedef: 10, aciklama: "Göğüs ve Arka Kol." },
            { id: "box_squat", isim: "Sandalye Squat", tip: "tekrar", varsayilanHedef: 12, aciklama: "Bacak ve Kalça." },
            { id: "leg_bicep_curl", isim: "Bacağa Karşı Pazı Bükme", tip: "tekrar", varsayilanHedef: 10, aciklama: "Ön Kol (Biceps)." },
            { id: "towel_pullapart", isim: "Havlu Çekme", tip: "tekrar", varsayilanHedef: 12, aciklama: "Sırt ve Kanat." },
            { id: "triceps_dips", isim: "Sandalye Dips", tip: "tekrar", varsayilanHedef: 10, aciklama: "Arka Kol (Triceps)." },
            { id: "plank", isim: "Plank (Yarım veya Tam)", tip: "sure", varsayilanHedef: 30, aciklama: "Tüm Merkez Bölge (Core)." },
            { id: "bird_dog", isim: "Kuş-Köpek (Bird-Dog)", tip: "tekrar", varsayilanHedef: 10, aciklama: "Bel ve Omurga Destek Kasları." },
            { id: "glute_bridge", isim: "Kalça Köprüsü (Glute Bridge)", tip: "tekrar", varsayilanHedef: 12, aciklama: "Kalça ve Alt Bel." }
        ]
    }
};

// ==========================================
// 3. DEĞİŞKENLER VE DOM SEÇİCİLER
// ==========================================
let activeExercises = []; 
let currentIndex = 0;
let timerInterval = null;
let sessionCompleted = [];
let sessionLeveledUp = [];
let pendingLevelUpExercise = null;

const loginScreen = document.getElementById('login-screen');
const loadingScreen = document.getElementById('loading-screen');
const programSelectionScreen = document.getElementById('program-selection-screen');
const appContainer = document.getElementById('app-container');

const btnLogin = document.getElementById('btn-login');
const btnPrograms = document.querySelectorAll('.btn-program');

const elName = document.getElementById('exercise-name');
const elDesc = document.getElementById('exercise-desc');
const elTarget = document.getElementById('exercise-target-value');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const card = document.getElementById('exercise-card');
const actionArea = document.getElementById('action-area');
const navButtons = document.querySelector('.nav-buttons');

const elProgressText = document.getElementById('progress-text');
const elMainProgressBar = document.getElementById('main-progress-bar');
const progressContainer = document.getElementById('workout-progress-container');

const summaryCard = document.getElementById('summary-card');
const listCompleted = document.getElementById('summary-completed-list');
const listLeveledUp = document.getElementById('summary-leveled-up-list');
const levelUpSection = document.getElementById('level-up-section');
const btnRestart = document.getElementById('btn-restart');

const btnStats = document.getElementById('btn-stats');
const statsModal = document.getElementById('stats-modal');
const btnCloseStats = document.getElementById('btn-close-stats');
const statMonthCount = document.getElementById('stat-month-count');
const statLeveledUpList = document.getElementById('stat-leveled-up-list');

const levelUpModal = document.getElementById('levelup-modal');
const btnLevelupYes = document.getElementById('btn-levelup-yes');
const btnLevelupNo = document.getElementById('btn-levelup-no');

const programConfirmModal = document.getElementById('program-confirm-modal');
const confirmProgramTitle = document.getElementById('confirm-program-title');
const confirmExerciseList = document.getElementById('confirm-exercise-list');
const btnConfirmYes = document.getElementById('btn-confirm-yes');
const btnConfirmNo = document.getElementById('btn-confirm-no');
let pendingProgramKey = null; 

const btnToggleCalendar = document.getElementById('btn-toggle-calendar');
const calendarContainer = document.getElementById('calendar-container');
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthName = document.getElementById('calendar-month-name');


// ==========================================
// 4. AUTH (GİRİŞ) VE FİREBASE VERİ İŞLEMLERİ
// ==========================================
btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("Giriş hatası:", error));
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        
        // Artık veritabanı yolu sabit değil, giriş yapan kullanıcının benzersiz ID'si (user.uid)
        userDocRef = doc(db, "workoutApp", user.uid);
        
        loadDataFromFirebase();
    } else {
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'none';
        programSelectionScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
        
        // Çıkış yapıldığında bellekteki veriyi sıfırla ki başkasının ekranında görünmesin
        dbData = {
            progress: {}, 
            stats: { workoutsThisMonth: 0, currentMonth: "", leveledUpExercises: [], workoutDays: [] }
        };
    }
});

async function loadDataFromFirebase() {
    try {
        loadingScreen.style.display = 'flex';
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            dbData = docSnap.data();
        } else {
            await setDoc(userDocRef, dbData);
        }
        
        // Veri yapısı eski versiyonsa güncelleyelim
        if (!dbData.stats.workoutDays) dbData.stats.workoutDays = [];

        // Yeni aya geçilmişse verileri sıfırla
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        if (dbData.stats.currentMonth !== currentMonthStr) {
            dbData.stats.currentMonth = currentMonthStr;
            dbData.stats.workoutsThisMonth = 0;
            dbData.stats.workoutDays = []; // YENİ: Yeni ayda takvimi sıfırla
            saveDataToFirebase();
        }

        loadingScreen.style.display = 'none';
        appContainer.style.display = 'none'; 
        programSelectionScreen.style.display = 'block';
        btnStats.style.display = 'block';
        
    } catch (error) {
        console.error("Firebase'den veri çekilirken hata:", error);
        loadingScreen.innerHTML = "<h2>Veri çekilemedi. Lütfen bağlantınızı kontrol edin.</h2>";
    }
}

async function saveDataToFirebase() {
    try {
        await setDoc(userDocRef, dbData);
    } catch (error) {
        console.error("Firebase'e veri kaydedilemedi:", error);
    }
}


// ==========================================
// 5. PROGRAM SEÇİMİ VE GELİŞİM MANTIĞI
// ==========================================
function switchScreen(hideElement, showElement, callback) {
    hideElement.classList.add('fade-out');
    
    setTimeout(() => {
        hideElement.style.display = 'none';
        hideElement.classList.remove('fade-out');
        
        showElement.style.display = 'block';
        showElement.classList.add('fade-in');
        
        if(callback) callback();
        
        setTimeout(() => {
            showElement.classList.remove('fade-in');
        }, 300);
    }, 300); 
}

btnPrograms.forEach(btn => {
    btn.addEventListener('click', (e) => {
        pendingProgramKey = btn.getAttribute('data-program');
        
        const prog = workoutPrograms[pendingProgramKey];
        confirmProgramTitle.textContent = prog.name;
        confirmExerciseList.innerHTML = ''; 
        
        prog.exercises.forEach(ex => {
            const li = document.createElement('li');
            li.textContent = ex.isim;
            confirmExerciseList.appendChild(li);
        });
        
        programConfirmModal.style.display = 'flex';
    });
});

btnConfirmNo.addEventListener('click', () => {
    programConfirmModal.style.display = 'none';
    pendingProgramKey = null;
});

btnConfirmYes.addEventListener('click', () => {
    programConfirmModal.style.display = 'none';
    if(pendingProgramKey) {
        startProgram(pendingProgramKey);
    }
});

function startProgram(programKey) {
    activeExercises = workoutPrograms[programKey].exercises;
    currentIndex = 0;
    sessionCompleted = [];
    sessionLeveledUp = [];
    
    switchScreen(programSelectionScreen, appContainer, () => {
        renderExercise();
    });
}

function getCurrentTarget(exercise) {
    return dbData.progress[exercise.id] ? dbData.progress[exercise.id].currentTarget : exercise.varsayilanHedef;
}

function updateProgressBar() {
    const total = activeExercises.length;
    const current = currentIndex + 1;
    elProgressText.textContent = `${current} / ${total}`;
    elMainProgressBar.style.width = `${(current / total) * 100}%`;
}

function handleCompletion() {
    const currentEx = activeExercises[currentIndex];
    
    if (!dbData.progress[currentEx.id]) {
        dbData.progress[currentEx.id] = { streak: 0, currentTarget: currentEx.varsayilanHedef };
    }

    dbData.progress[currentEx.id].streak += 1;

    if (dbData.progress[currentEx.id].streak >= 3) {
        pendingLevelUpExercise = currentEx;
        levelUpModal.style.display = 'flex';
        return; 
    }

    finishExerciseProcess(currentEx, false);
}

btnLevelupYes.addEventListener('click', () => {
    levelUpModal.style.display = 'none';
    dbData.progress[pendingLevelUpExercise.id].streak = 0; 
    finishExerciseProcess(pendingLevelUpExercise, false);
});

btnLevelupNo.addEventListener('click', () => {
    levelUpModal.style.display = 'none';
    const currentEx = pendingLevelUpExercise;
    
    if (currentEx.tip === 'sure') {
        dbData.progress[currentEx.id].currentTarget += 5; 
    } else {
        dbData.progress[currentEx.id].currentTarget += 2; 
    }
    
    dbData.progress[currentEx.id].streak = 0; 

    if (!dbData.stats.leveledUpExercises.includes(currentEx.isim)) {
        dbData.stats.leveledUpExercises.push(currentEx.isim);
    }
    
    finishExerciseProcess(currentEx, true);
});

function finishExerciseProcess(currentEx, leveledUp) {
    saveDataToFirebase();
    
    if (!sessionCompleted.includes(currentEx.isim)) {
        sessionCompleted.push(currentEx.isim);
    }
    if (leveledUp && !sessionLeveledUp.includes(currentEx.isim)) {
        sessionLeveledUp.push(currentEx.isim);
    }

    if (currentIndex === activeExercises.length - 1) {
        showSummary();
    } else {
        showRestUI(); // YENİ: Direkt render yerine molaya geç
    }
}


// ==========================================
// 6. ARAYÜZ (UI) FONKSİYONLARI VE MOLA
// ==========================================

// YENİ: Dinlenme Molası Ekranı
function showRestUI() {
    let restTime = 10;
    
    card.style.opacity = 0;
    clearInterval(timerInterval); 
    
    setTimeout(() => {
        elName.textContent = "Dinlenme Molası ☕";
        elDesc.textContent = "Sıradaki Hareket: " + activeExercises[currentIndex + 1].isim;
        elTarget.textContent = "--";
        
        actionArea.innerHTML = `
            <div id="rest-timer-display" class="timer-display">${restTime}</div>
            <div class="nav-buttons" style="margin-top: 15px; gap: 10px;">
                <button id="btn-add-time" class="btn btn-secondary">+10 Saniye</button>
                <button id="btn-skip-rest" class="btn btn-action">Molayı Atla</button>
            </div>
        `;

        const restTimerDisplay = document.getElementById('rest-timer-display');
        const btnAddTime = document.getElementById('btn-add-time');
        const btnSkipRest = document.getElementById('btn-skip-rest');

        // Mola sırasında kafa karışmasın diye alttaki ileri/geri butonlarını gizleyelim veya pasif yapalım
        btnPrev.disabled = true;
        btnNext.disabled = true;
        
        card.style.opacity = 1;

        timerInterval = setInterval(() => {
            restTime--;
            restTimerDisplay.textContent = restTime;
            
            if (restTime <= 0) {
                endRest();
            }
        }, 1000);

        btnAddTime.addEventListener('click', () => {
            restTime += 10;
            restTimerDisplay.textContent = restTime;
        });

        btnSkipRest.addEventListener('click', () => {
            endRest();
        });
        
    }, 150);
}

// YENİ: Mola Bitimi İşlemleri
function endRest() {
    clearInterval(timerInterval);
    currentIndex++;
    renderExercise();
}

function showSummary() {
    card.style.display = 'none';
    navButtons.style.display = 'none';
    progressContainer.style.display = 'none'; 
    
    // Antrenman bittiğinde bugünün gününü kaydet (Takvim için)
    const today = new Date().getDate(); 
    if (!dbData.stats.workoutDays) dbData.stats.workoutDays = [];
    if (!dbData.stats.workoutDays.includes(today)) {
        dbData.stats.workoutDays.push(today);
    }

    dbData.stats.workoutsThisMonth += 1;
    saveDataToFirebase();

    listCompleted.innerHTML = '';
    sessionCompleted.forEach(exName => {
        const li = document.createElement('li');
        li.textContent = exName;
        listCompleted.appendChild(li);
    });

    if (sessionLeveledUp.length > 0) {
        levelUpSection.style.display = 'block';
        listLeveledUp.innerHTML = '';
        sessionLeveledUp.forEach(exName => {
            const li = document.createElement('li');
            li.textContent = `${exName} (Hedef Arttı!)`;
            listLeveledUp.appendChild(li);
        });
    }

    summaryCard.style.display = 'block';
}

function renderExercise() {
    const currentEx = activeExercises[currentIndex];
    const currentTarget = getCurrentTarget(currentEx); 
    
    card.style.opacity = 0;
    clearInterval(timerInterval); 
    updateProgressBar(); 
    
    setTimeout(() => {
        elName.textContent = currentEx.isim;
        elDesc.textContent = currentEx.aciklama;
        
        if (currentEx.tip === 'sure') {
            elTarget.textContent = currentTarget + " Saniye";
            setupTimerUI(currentTarget);
        } else {
            elTarget.textContent = currentTarget + " Tekrar";
            setupRepUI();
        }
        
        card.style.opacity = 1;
    }, 150);

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === activeExercises.length - 1;
}

function setupTimerUI(duration) {
    actionArea.innerHTML = `
        <div id="timer-display" class="timer-display">${duration}</div>
        <div class="timer-track" id="timer-track-container" style="display:none;">
            <div id="timer-fill" class="timer-fill"></div>
        </div>
        <button id="btn-start-timer" class="btn btn-start">Başlat</button>
        <button id="btn-complete" class="btn btn-action" style="display: none;">Tamamlandı</button>
    `;

    const btnStart = document.getElementById('btn-start-timer');
    const btnComplete = document.getElementById('btn-complete');
    const timerDisplay = document.getElementById('timer-display');
    const timerTrackContainer = document.getElementById('timer-track-container');
    const timerFill = document.getElementById('timer-fill');
    
    let timeLeft = duration;
    timerDisplay.style.display = "block";

    btnStart.addEventListener('click', () => {
        btnStart.style.display = "none"; 
        timerTrackContainer.style.display = "block"; 
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            const percent = (timeLeft / duration) * 100;
            timerFill.style.width = `${percent}%`;

            if (timeLeft <= 3 && timeLeft > 0) {
                timerDisplay.classList.add('pulse-animation');
            }
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.classList.remove('pulse-animation'); 
                timerDisplay.textContent = "Bitti!";
                timerTrackContainer.style.display = "none"; 
                btnComplete.style.display = "block"; 
            }
        }, 1000); 
    });

    btnComplete.addEventListener('click', handleCompletion);
}

function setupRepUI() {
    actionArea.innerHTML = `
        <button id="btn-complete" class="btn btn-action">Seti Bitirdim</button>
    `;
    document.getElementById('btn-complete').addEventListener('click', handleCompletion);
}


// ==========================================
// 7. TAKVİM OLUŞTURUCU VE DİĞER OLAYLAR
// ==========================================

function generateCalendar() {
    calendarGrid.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    calendarMonthName.textContent = `${monthNames[month]} ${year}`;

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    dayNames.forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar-day-header';
        el.textContent = day;
        calendarGrid.appendChild(el);
    });

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; 

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const workoutDays = dbData.stats.workoutDays || [];

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDiv);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = i;
        
        if (workoutDays.includes(i)) {
            dayDiv.classList.add('workout-done');
        }
        calendarGrid.appendChild(dayDiv);
    }
}

btnToggleCalendar.addEventListener('click', () => {
    if (calendarContainer.style.display === 'none') {
        calendarContainer.style.display = 'block';
        btnToggleCalendar.textContent = "Takvimi Gizle";
        generateCalendar();
    } else {
        calendarContainer.style.display = 'none';
        btnToggleCalendar.textContent = "📅 Takvimi Göster";
    }
});

btnNext.addEventListener('click', () => {
    if (currentIndex < activeExercises.length - 1) {
        currentIndex++;
        renderExercise();
    }
});

btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderExercise();
    }
});

btnRestart.addEventListener('click', () => {
    summaryCard.style.display = 'none';
    levelUpSection.style.display = 'none';
    progressContainer.style.display = 'block'; 
    card.style.display = 'block';
    navButtons.style.display = 'flex';
    switchScreen(appContainer, programSelectionScreen);
});

btnStats.addEventListener('click', () => {
    statMonthCount.textContent = dbData.stats.workoutsThisMonth;
    
    if (dbData.stats.leveledUpExercises.length > 0) {
        statLeveledUpList.innerHTML = '';
        dbData.stats.leveledUpExercises.forEach(ex => {
            const li = document.createElement('li');
            li.textContent = ex;
            statLeveledUpList.appendChild(li);
        });
    } else {
        statLeveledUpList.innerHTML = '<li>Henüz seviye atlayan hareket yok.</li>';
    }
    
    calendarContainer.style.display = 'none'; 
    btnToggleCalendar.textContent = "📅 Takvimi Göster";
    statsModal.style.display = 'flex';
});

btnCloseStats.addEventListener('click', () => {
    statsModal.style.display = 'none';
});