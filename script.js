// --- PREMIUM ASMR SOUND ASSETS ---

const sounds = {

    unlock: new Audio('https://assets.mixkit.co/active_storage/sfx/2635/2635-preview.mp3'),

    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),

    close: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),

    heart: new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'),

    shuffle: new Audio('https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3')

};



sounds.unlock.volume = 0.5;

sounds.click.volume = 0.2;

sounds.close.volume = 0.15;

sounds.heart.volume = 0.2;

sounds.shuffle.volume = 0.3;



function playSound(audio) {

    audio.pause();

    audio.currentTime = 0;

    audio.play().catch(() => { });

}



// Global click sound logic

window.addEventListener('mousedown', (e) => {

    const isGridItem = e.target.closest('.grid-item');

    const isBtn = e.target.closest('button');

    if (!isGridItem && !isBtn) playSound(sounds.click);

});



let media = [];

const SECRET_KEY = "19042024";

const START_DATE = "2024-04-19T00:00:00";

let currentFilter = 'all';

let itemsLimit = 60; // NEW: Controls how many items load to prevent lag



// Selectors

const grid = document.getElementById('photo-grid');

const dot = document.querySelector('.cursor-dot');

const outline = document.querySelector('.cursor-outline');

const lightbox = document.getElementById('lightbox');

const lightboxImg = document.getElementById('lightbox-img');

const lbBox = document.getElementById('lightbox-video-box');

const lbCaption = document.getElementById('lightbox-caption');

const downloadBtn = document.getElementById('download-btn');

const loader = document.getElementById('loader');

const passInput = document.getElementById('pass-input');

const passScreen = document.getElementById('password-screen');

const errorMsg = document.getElementById('error-msg');



// --- SHUFFLE LOGIC ---

window.addEventListener('keydown', (e) => {

    if (e.key.toLowerCase() === 's') shuffleGallery(true);

});



function shuffleGallery(isManual = false) {

    if (isManual) {

        playSound(sounds.shuffle);

        grid.style.opacity = '0';

        grid.style.transform = 'translateY(10px)';

    }



    for (let i = media.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [media[i], media[j]] = [media[j], media[i]];

    }



    itemsLimit = 60; // Reset limit on shuffle



    if (isManual) {

        setTimeout(() => {

            renderGallery();

            grid.style.opacity = '1';

            grid.style.transform = 'translateY(0)';

        }, 300);

    } else {

        renderGallery();

    }

}



// --- PASSWORD & SESSION ---

if (sessionStorage.getItem('vault_unlocked') === 'true') {

    passScreen.style.display = 'none';

    setTimeout(() => {

        loader.classList.add('fade-out');

        loadMedia();

        updateCounter();

    }, 500);

}



passInput.addEventListener('keypress', (e) => {

    if (e.key === 'Enter') {

        if (passInput.value === SECRET_KEY) {

            playSound(sounds.unlock);

            sessionStorage.setItem('vault_unlocked', 'true');

            passScreen.classList.add('unlocked');

            setTimeout(() => {

                passScreen.style.display = 'none';

                loader.classList.add('fade-out');

                loadMedia();

                updateCounter();

            }, 1000);

        } else {

            errorMsg.style.display = 'block';

            passInput.value = '';

        }

    }

});



// --- REVEAL OBSERVER ---

const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add('reveal');

            revealObserver.unobserve(entry.target);

        }

    });

}, { rootMargin: '0px 0px 200px 0px' });



// --- CURSOR ---

window.addEventListener('mousemove', (e) => {

    dot.style.left = `${e.clientX}px`;

    dot.style.top = `${e.clientY}px`;

    outline.animate({

        left: `${e.clientX - 15}px`,

        top: `${e.clientY - 15}px`

    }, { duration: 500, fill: "forwards" });

});



// --- DATA HANDLING ---

async function loadMedia() {
    try {
        const response = await fetch('media.json');
        media = await response.json();

        // 1. Count types
        const photoTotal = media.filter(item => item.type === 'image').length;
        const videoTotal = media.filter(item => item.type === 'video').length;

        // 2. Estimate Size (Photos ~2MB, Videos ~15MB)
        const estimatedBytes = (photoTotal * 2 * 1024 * 1024) + (videoTotal * 15 * 1024 * 1024);
        const sizeInGB = (estimatedBytes / (1024 * 1024 * 1024)).toFixed(2);

        // 3. Update UI
        document.getElementById('photo-count').innerText = photoTotal;
        document.getElementById('video-count').innerText = videoTotal;
        document.getElementById('vault-size').innerText = sizeInGB;

        shuffleGallery(false);
    } catch (err) {
        console.error("Error loading media.json!", err);
    }
}



function filterMedia(type) {

    currentFilter = type;

    itemsLimit = 60; // Reset limit on filter change

    document.querySelectorAll('.tab-btn').forEach(btn => {

        btn.classList.remove('active');

        if (btn.getAttribute('onclick').includes(`'${type}'`)) btn.classList.add('active');

    });

    renderGallery();

}



// --- RENDER LOGIC (LAG-FREE VERSION) ---

function renderGallery() {

    const fragment = document.createDocumentFragment();

    const filteredMedia = currentFilter === 'all' ? media : media.filter(item => item.type === currentFilter);



    // ONLY build the items up to the current limit (Prevents Lag)

    const itemsToRender = filteredMedia.slice(0, itemsLimit);



    itemsToRender.forEach((item) => {

        const div = document.createElement('div');

        div.className = 'grid-item';

        const captionHTML = item.caption ? `<div class="item-caption">${item.caption}</div>` : '';



        if (item.type === 'video') {

            div.innerHTML = `

                <div class="video-window"><iframe src="${item.url}" frameborder="0" allow="autoplay"></iframe></div>

                <div class="video-overlay"></div>${captionHTML}`;

        } else {

            const img = document.createElement('img');

            img.src = item.url;

            img.loading = "lazy";

            img.setAttribute('decoding', 'async'); // Extra lag protection

            div.appendChild(img);

            div.innerHTML += captionHTML;

        }



        let pressTimer;

        div.addEventListener('mousedown', () => { pressTimer = setTimeout(() => { if (item.secret) alert("💌 Secret Note: " + item.secret); }, 800); });

        div.addEventListener('mouseup', () => clearTimeout(pressTimer));



        // --- YOUR ORIGINAL DOWNLOAD LOGIC (UNCHANGED) ---

        div.onclick = (e) => {

            playSound(sounds.click);

            lightbox.classList.add('active');

            if (lbCaption) lbCaption.innerText = item.caption || "";

            downloadBtn.innerHTML = `<span>SAVE TO DEVICE</span>`;



            if (item.type === 'video') {

                lightboxImg.style.display = 'none';

                lbBox.style.display = 'block';

                lbBox.innerHTML = `<iframe src="${item.url}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen"></iframe>`;



                downloadBtn.onclick = (evt) => {

                    evt.preventDefault();

                    downloadBtn.innerHTML = `<span>DOWNLOADING...</span>`;

                    let hiddenFrame = document.getElementById('hiddenDownloadFrame');

                    if (!hiddenFrame) {

                        hiddenFrame = document.createElement('iframe');

                        hiddenFrame.id = 'hiddenDownloadFrame';

                        hiddenFrame.style.display = 'none';

                        document.body.appendChild(hiddenFrame);

                    }

                    hiddenFrame.src = item.downloadUrl;

                    setTimeout(() => { downloadBtn.innerHTML = `<span>SAVE TO DEVICE</span>`; }, 5000);

                };

            } else {

                lbBox.style.display = 'none';

                lightboxImg.style.display = 'block';

                lightboxImg.src = item.url;



                downloadBtn.onclick = async (evt) => {

                    evt.preventDefault();

                    downloadBtn.innerHTML = `<span>DOWNLOADING...</span>`;

                    try {

                        const response = await fetch(item.url);

                        const blob = await response.blob();

                        const url = window.URL.createObjectURL(blob);

                        const a = document.createElement('a');

                        a.href = url;

                        const rawName = item.url.split('/').pop().split('?')[0];

                        a.download = rawName.includes('.') ? rawName : `memory_${Date.now()}.jpg`;

                        document.body.appendChild(a);

                        a.click();

                        window.URL.revokeObjectURL(url);

                        document.body.removeChild(a);

                        downloadBtn.innerHTML = `<span>SAVED!</span>`;

                        setTimeout(() => { downloadBtn.innerHTML = `<span>SAVE TO DEVICE</span>`; }, 3000);

                    } catch (err) {

                        window.open(item.url, '_blank');

                        downloadBtn.innerHTML = `<span>SAVE TO DEVICE</span>`;

                    }

                };

            }

        };



        div.ondblclick = () => {

            playSound(sounds.heart);

            const heart = document.createElement('div');

            heart.innerHTML = "❤️"; heart.className = "heart-pop animate";

            div.appendChild(heart);

            setTimeout(() => heart.remove(), 800);

        };



        fragment.appendChild(div);

        revealObserver.observe(div);

    });



    grid.innerHTML = "";

    grid.appendChild(fragment);

}



// Lightbox Controls

lightbox.onclick = (e) => {

    if (e.target === lightbox || e.target.id === 'close-hint') {

        playSound(sounds.close);

        lightbox.classList.remove('active');

        lbBox.innerHTML = "";

    }

};



// Counter Logic

function updateCounter() {

    const diff = new Date() - new Date(START_DATE);

    const d = Math.floor(diff / 86400000);

    const h = Math.floor((diff / 3600000) % 24);

    const m = Math.floor((diff / 60000) % 60);

    const s = Math.floor((diff / 1000) % 60);



    if (document.getElementById('days')) {

        document.getElementById('days').innerText = d.toString().padStart(2, '0');

        document.getElementById('hours').innerText = h.toString().padStart(2, '0');

        document.getElementById('mins').innerText = m.toString().padStart(2, '0');

        document.getElementById('secs').innerText = s.toString().padStart(2, '0');

    }

}

setInterval(updateCounter, 1000);



// --- SCROLL LOGIC: Load more + Progress Bar ---

window.addEventListener('scroll', () => {

    // 1. Progress Bar Logic

    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

    const progressBar = document.getElementById("progress-bar");

    if (progressBar) progressBar.style.width = scrolled + "%";



    // 2. Load More Logic (If near bottom, load 40 more items)

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1500) {

        if (itemsLimit < media.length) {

            itemsLimit += 40;

            renderGallery();

        }

    }

}, { passive: true });