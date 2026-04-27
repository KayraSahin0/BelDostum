// --- YENİ: FIREBASE KÜTÜPHANELERİ (ES MODULE) ---
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

// Veritabanı Döküman Referansı (Şimdilik tek kullanıcılı global bir alan kullanıyoruz)
const userDocRef = doc(db, "workoutApp", "userData");

// Bellekte tutacağımız güncel veriler
let dbData = {
    progress: {}, 
    stats: { workoutsThisMonth: 0, currentMonth: "", leveledUpExercises: [] }
};

// ==========================================
// EGZERSİZ VERİLERİ VE DEĞİŞKENLER
// ==========================================
const exercises = [
    { id: 1, isim: "Bird-Dog", tip: "tekrar", varsayilanHedef: 10, aciklama: "Eller ve dizler üzerinde dururken, sağ kolu ve sol bacağı aynı anda yere paralel uzatın. Sırtın düzlüğünü koruyun." },
    { id: 2, isim: "Kalça Köprüsü / Glute Bridge", tip: "tekrar", varsayilanHedef: 12, aciklama: "Sırtüstü yatın, dizleri bükün. Bel kavisini bozmadan kalçanızı sıkarak yukarı kaldırın." },
    { id: 3, isim: "McGill Yarım Mekik", tip: "tekrar", varsayilanHedef: 8, aciklama: "Sırtüstü yatın. Bir bacak düz, diğeri bükülü. Ellerinizi bel boşluğunuza yerleştirin ve sadece baş/omuzlarınızı hafifçe kaldırın." },
    { id: 4, isim: "Yarım Plank - Dizler Üzerinde", tip: "sure", varsayilanHedef: 20, aciklama: "Dirsekler ve dizler üzerinde durun. Karın ve kalça kaslarınızı sıkarak gövdenizi düz bir çizgide tutun." },
    { id: 5, isim: "Duvar Şınavı", tip: "tekrar", varsayilanHedef: 10, aciklama: "Duvara bir kol mesafesinde durun, ellerinizi omuz genişliğinde duvara dayayarak kontrollü şınav çekin." },
    { id: 6, isim: "Sandalye Dips", tip: "tekrar", varsayilanHedef: 8, aciklama: "Sabit bir sandalyenin ucuna oturun, ellerle destek alarak kalçanızı sandalyeden ayırın ve kolları bükerek aşağı inin." },
    { id: 7, isim: "İzometrik Biceps Sıkıştırma", tip: "sure", varsayilanHedef: 15, aciklama: "Bir elinizle diğer bileğinizi tutup yukarı doğru çekerken, diğer elinizle aşağı doğru direnç uygulayın." }
];

let currentIndex = 0;
let timerInterval = null;
let sessionCompleted = [];
let sessionLeveledUp = [];
let pendingLevelUpExercise = null; // Modaldan dönen cevabı bekleyen egzersiz

// DOM Seçicileri
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

// Yeni Modallar ve Butonlar
const btnStats = document.getElementById('btn-stats');
const statsModal = document.getElementById('stats-modal');
const btnCloseStats = document.getElementById('btn-close-stats');
const statMonthCount = document.getElementById('stat-month-count');
const statLeveledUpList = document.getElementById('stat-leveled-up-list');

const levelUpModal = document.getElementById('levelup-modal');
const btnLevelupYes = document.getElementById('btn-levelup-yes');
const btnLevelupNo = document.getElementById('btn-levelup-no');

const loadingScreen = document.getElementById('loading-screen');
const appContainer = document.getElementById('app-container');

// Auth İşlemleri
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Seçiciler
const loginScreen = document.getElementById('login-screen');
const btnLogin = document.getElementById('btn-login');

// Giriş Butonu Olayı
btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("Giriş hatası:", error));
});

// Oturum Durumunu Dinle (Uygulamanın ana giriş noktası burası olmalı)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı giriş yaptıysa:
        loginScreen.style.display = 'none';
        loadDataFromFirebase(); // Mevcut fonksiyonun
    } else {
        // Kullanıcı giriş yapmadıysa:
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'none';
        loginScreen.style.display = 'flex';
    }
});

// ==========================================
// FİREBASE VERİ İŞLEMLERİ
// ==========================================
async function loadDataFromFirebase() {
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            dbData = docSnap.data();
        } else {
            // İlk kez giriyorsa yapıyı oluştur
            await setDoc(userDocRef, dbData);
        }
        
        // Ay kontrolü (Eğer yeni bir aya geçildiyse sayacı sıfırla)
        const currentMonthStr = new Date().toISOString().slice(0, 7); // Örn: "2026-04"
        if (dbData.stats.currentMonth !== currentMonthStr) {
            dbData.stats.currentMonth = currentMonthStr;
            dbData.stats.workoutsThisMonth = 0;
            saveDataToFirebase();
        }

        // Yükleme ekranını kapat, uygulamayı aç
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'block';
        btnStats.style.display = 'block';
        
        renderExercise();
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
// GELİŞİM MANTIĞI VE MODALLAR
// ==========================================
function getCurrentTarget(exercise) {
    return dbData.progress[exercise.id] ? dbData.progress[exercise.id].currentTarget : exercise.varsayilanHedef;
}

function updateProgressBar() {
    const total = exercises.length;
    const current = currentIndex + 1;
    elProgressText.textContent = `${current} / ${total}`;
    elMainProgressBar.style.width = `${(current / total) * 100}%`;
}

function handleCompletion() {
    const currentEx = exercises[currentIndex];
    
    if (!dbData.progress[currentEx.id]) {
        dbData.progress[currentEx.id] = { streak: 0, currentTarget: currentEx.varsayilanHedef };
    }

    // 1. Önce seriyi artır
    dbData.progress[currentEx.id].streak += 1;

    // 2. Eğer seri 3 olduysa Modal'ı aç ve işlemi beklet
    if (dbData.progress[currentEx.id].streak >= 3) {
        pendingLevelUpExercise = currentEx;
        levelUpModal.style.display = 'flex';
        return; // İşlem burada kesilir, modal butonlarına tıklanması beklenir
    }

    // Eğer seviye atlama yoksa standart tamamlanma sürecine devam et
    finishExerciseProcess(currentEx, false);
}

// Modal: "Evet, Zorlanıyorum" (Seviye Atlatma, Seriyi Sıfırla)
btnLevelupYes.addEventListener('click', () => {
    levelUpModal.style.display = 'none';
    dbData.progress[pendingLevelUpExercise.id].streak = 0; // Seriyi sıfırla
    finishExerciseProcess(pendingLevelUpExercise, false);
});

// Modal: "Hayır, Zorlanmıyorum" (Yükselt!)
btnLevelupNo.addEventListener('click', () => {
    levelUpModal.style.display = 'none';
    const currentEx = pendingLevelUpExercise;
    
    // Hedefi artır
    if (currentEx.tip === 'sure') {
        dbData.progress[currentEx.id].currentTarget += 5; 
    } else {
        dbData.progress[currentEx.id].currentTarget += 2; 
    }
    
    dbData.progress[currentEx.id].streak = 0; // Seriyi sıfırla

    // Global istatistiklere ekle (Eğer daha önce eklenmediyse)
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

    if (currentIndex === exercises.length - 1) {
        showSummary();
    } else {
        currentIndex++;
        renderExercise();
    }
}

// ==========================================
// ARAYÜZ (UI) FONKSİYONLARI
// ==========================================
function showSummary() {
    card.style.display = 'none';
    navButtons.style.display = 'none';
    progressContainer.style.display = 'none'; 
    
    // Antrenman bittiğinde bu ayki sayacı 1 artır ve Firebase'e yaz
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
    const currentEx = exercises[currentIndex];
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
    btnNext.disabled = currentIndex === exercises.length - 1;
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
// OLAY DİNLEYİCİLER (EVENT LISTENERS)
// ==========================================
btnNext.addEventListener('click', () => {
    if (currentIndex < exercises.length - 1) {
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
    currentIndex = 0;
    sessionCompleted = [];
    sessionLeveledUp = [];
    summaryCard.style.display = 'none';
    levelUpSection.style.display = 'none';
    progressContainer.style.display = 'block'; 
    card.style.display = 'block';
    navButtons.style.display = 'flex';
    renderExercise();
});

// İstatistik Modalı Aç/Kapat
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
    
    statsModal.style.display = 'flex';
});

btnCloseStats.addEventListener('click', () => {
    statsModal.style.display = 'none';
});