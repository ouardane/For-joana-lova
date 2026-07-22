// Decryption
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256'}, keyMaterial, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
}

async function decrypt(encData, password) {
    const salt = Uint8Array.from(atob(encData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encData.iv), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(encData.tag), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(encData.data), c => c.charCodeAt(0));
    const combined = new Uint8Array(data.length + tag.length);
    combined.set(data); combined.set(tag, data.length);
    const key = await deriveKey(password.toLowerCase().trim(), salt);
    const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, combined);
    return new TextDecoder().decode(decrypted);
}

// Password
const passwordInput = document.getElementById('password-input');
const passwordBtn = document.getElementById('password-btn');
const passwordHint = document.getElementById('password-hint');
let attempts = 0;

const messages = [
    "❤️ Not quite... but I love that you're trying",
    "🌙 Wrong again... but you're still my moon",
    "💕 Nope... think deeper, ya 9amari",
    "✨ Not this one... but you know the answer",
    "🦋 Try again my love... you'll get it",
    "💫 Still not right... but I'd wait forever for you",
    "🌟 One more try... I believe in you",
    "❤️ You know the answer... it's in your heart",
];

async function tryPassword() {
    const pw = passwordInput.value;
    try {
        const html = await decrypt(ENCRYPTED_CONTENT, pw);
        // Success
        document.getElementById('password-screen').classList.add('hidden');
        const main = document.getElementById('main-site');
        main.style.display = 'block';
        main.innerHTML = html;
        // Load images
        const gallery = document.getElementById('gallery');
        if (gallery && typeof IMG !== 'undefined') {
            const keys = Object.keys(IMG);
            const emojis = ['❤️','🦋','✨','🌙','💕','🦢','💫','🌟','💝','🏍️','🎨','😴','✏️','🏕️','💓','🌍','🔥','💙','🌄','♾️','🌺'];
            keys.forEach((key, i) => {
                const item = document.createElement('div');
                item.className = 'gallery-item' + (i % 5 === 0 ? ' large' : '');
                item.innerHTML = `<img src="${IMG[key]}" alt="" loading="lazy"><div class="gallery-overlay"><span>${emojis[i % emojis.length]}</span></div>`;
                gallery.appendChild(item);
            });
        }
        // Init all interactive features
        setTimeout(() => { document.getElementById('preloader')?.classList.add('hidden'); }, 3500);
        initSite();
    } catch(e) {
        attempts++;
        passwordInput.value = '';
        passwordInput.style.borderColor = '#e74c3c';
        passwordHint.textContent = messages[(attempts - 1) % messages.length];
        setTimeout(() => { passwordInput.style.borderColor = ''; }, 2000);
    }
}

passwordBtn.addEventListener('click', tryPassword);
passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') tryPassword(); });

// Site initialization (after decrypt)
function initSite() {
    // Particles
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    const particles = [];
    class Particle {
        constructor() { this.reset(); }
        reset() { this.x = Math.random()*canvas.width; this.y = canvas.height+20; this.size = Math.random()*3+1; this.speedY = -(Math.random()*0.5+0.2); this.speedX = (Math.random()-0.5)*0.3; this.opacity = Math.random()*0.5+0.2; this.color = `hsla(${Math.random()*60+330},80%,60%,${this.opacity})`; }
        update() { this.y += this.speedY; this.x += this.speedX; this.opacity -= 0.001; if (this.y < -10 || this.opacity <= 0) this.reset(); }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fillStyle = this.color; ctx.fill(); }
    }
    for (let i = 0; i < 50; i++) { const p = new Particle(); p.y = Math.random()*canvas.height; particles.push(p); }
    (function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); })();

    // Nav
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => { nav.classList.toggle('visible', window.pageYOffset > 100); });

    // Counter
    const startDate = new Date('2026-03-17T00:00:00');
    function updateCounter() {
        const diff = Date.now() - startDate;
        const d = document.getElementById('days'), h = document.getElementById('hours'), m = document.getElementById('minutes'), s = document.getElementById('seconds');
        if (d) d.textContent = Math.floor(diff/86400000);
        if (h) h.textContent = Math.floor((diff%86400000)/3600000);
        if (m) m.textContent = Math.floor((diff%3600000)/60000);
        if (s) s.textContent = Math.floor((diff%60000)/1000);
    }
    updateCounter(); setInterval(updateCounter, 1000);

    // Scroll animations
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.2 });
    document.querySelectorAll('.timeline-content,.gallery-item,.wisdom-card').forEach(el => obs.observe(el));

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const imgs = Array.from(document.querySelectorAll('.gallery-item img'));
    let idx = 0;
    imgs.forEach((img, i) => { img.addEventListener('click', () => { idx = i; lightboxImg.src = img.src; lightbox.classList.add('active'); }); });
    document.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.classList.remove('active'));
    document.querySelector('.lightbox-prev')?.addEventListener('click', () => { idx = (idx-1+imgs.length)%imgs.length; lightboxImg.src = imgs[idx].src; });
    document.querySelector('.lightbox-next')?.addEventListener('click', () => { idx = (idx+1)%imgs.length; lightboxImg.src = imgs[idx].src; });
    lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (!lightbox?.classList.contains('active')) return; if (e.key==='Escape') lightbox.classList.remove('active'); if (e.key==='ArrowLeft') { idx=(idx-1+imgs.length)%imgs.length; lightboxImg.src=imgs[idx].src; } if (e.key==='ArrowRight') { idx=(idx+1)%imgs.length; lightboxImg.src=imgs[idx].src; } });

    // Letter
    const letterText = document.getElementById('letter-text');
    const letterCursor = document.getElementById('letter-cursor');
    const letterPaper = document.querySelector('.letter-paper');
    const startLetterBtn = document.getElementById('start-letter');
    const letterContent = "Dear Joana, ya 9amari \u{1F319}\n\nYou are my moon, my everything, my \u0642\u0645\u0631.\n\nDo you remember Chefchaouen? The blue city, March 17th, 2026. The day my life changed forever. The day I looked into your eyes and knew \u2014 this is where my heart belongs.\n\nThose blue walls have nothing on the blue of your soul. That city will forever be OUR city. Our beginning.\n\nI remember when you said \"I'm going with you on a date\" \u2014 my heart skipped a beat. That evening was the most beautiful dance \u{1F9A2}\n\nThank you for reading Quran and understanding what truly matters. Thank you for your kindness, your honesty, and for every lesson our journey has taught me.\n\nI built this corner of the internet just for you \u2014 where our memories live and my love is written in code forever.\n\nAlways believe in Allah, be yourself, listen to your heart, act out of love and remember to be \u2728in the moment\u2728\n\nWhatever Allah has written for us will always arrive at the right time.\n\nWith all my love, always,\nAymane \u2764\uFE0F\n\n\u0627\u062D\u0628\u0643 \u064A\u0627 \u0642\u0645\u0631\u064A \u{1F495}";
    let lIdx = 0, typing = false;
    startLetterBtn?.addEventListener('click', () => { if (typing) return; typing = true; startLetterBtn.classList.add('hidden'); letterPaper.classList.add('visible'); letterText.innerHTML = ''; typeLetter(); });
    function typeLetter() { if (lIdx < letterContent.length) { const c = letterContent[lIdx]; letterText.innerHTML += c==='\n'?'<br>':c; lIdx++; setTimeout(typeLetter, c==='.'||c==='?'?200:c===','?100:c==='\n'?150:30+Math.random()*30); } else { letterCursor.style.display = 'none'; } }

    // Chest
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.dataset.answer === 'correct') { opt.classList.add('correct'); setTimeout(() => { document.getElementById('chest')?.classList.add('opened'); setTimeout(() => { document.getElementById('chest-quiz').style.display='none'; document.getElementById('chest').style.display='none'; document.getElementById('chest-secret').style.display='block'; confetti(); }, 800); }, 500); }
            else { opt.classList.add('wrong'); setTimeout(() => opt.classList.remove('wrong'), 1000); }
        });
    });

    function confetti() {
        const colors = ['#e74c6f','#f39c12','#8e44ad','#2ecc71','#3498db'];
        if (!document.getElementById('cf-style')) { const s=document.createElement('style'); s.id='cf-style'; s.textContent='@keyframes cFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}'; document.head.appendChild(s); }
        for (let i=0;i<80;i++) { const c=document.createElement('div'); c.style.cssText=`position:fixed;top:-10px;left:${Math.random()*100}%;width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;background:${colors[Math.floor(Math.random()*5)]};border-radius:${Math.random()>.5?'50%':'0'};z-index:9999;pointer-events:none;animation:cFall ${Math.random()*3+2}s linear forwards;animation-delay:${Math.random()*.5}s;`; document.body.appendChild(c); setTimeout(()=>c.remove(),5000); }
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', (e) => { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'}); }); });

    // Easter egg
    let buf=''; const hearts=['❤️','💕','💗','✨','🦋','💫','🌟'];
    document.addEventListener('keypress', (e) => { buf+=e.key; if(buf.includes('love')){buf='';for(let i=0;i<30;i++){const h=document.createElement('div');h.textContent=hearts[Math.floor(Math.random()*7)];h.style.cssText=`position:fixed;top:-50px;left:${Math.random()*100}%;font-size:${Math.random()*30+20}px;z-index:9999;pointer-events:none;animation:cFall ${Math.random()*3+2}s linear forwards;`;document.body.appendChild(h);setTimeout(()=>h.remove(),5000);}} if(buf.length>10)buf=buf.slice(-10); });
}
