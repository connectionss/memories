// Start with an empty array. Data will be loaded from media.json
let media = [];

const SECRET_KEY = "19042024";
const START_DATE = "2024-04-19T00:00:00"; 
let currentFilter = 'all';

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

// CHECK SESSION ON LOAD: If already unlocked, skip password
if (sessionStorage.getItem('vault_unlocked') === 'true') {
    passScreen.style.display = 'none';
    setTimeout(() => {
        loader.classList.add('fade-out');
        loadMedia();
        updateCounter();
    }, 500);
}

function updateCounter() {
    const start = new Date(START_DATE);
    const now = new Date();
    const diff = now - start;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if(document.getElementById('days')) {
        document.getElementById('days').innerText = d.toString().padStart(2, '0');
        document.getElementById('hours').innerText = h.toString().padStart(2, '0');
        document.getElementById('mins').innerText = m.toString().padStart(2, '0');
        document.getElementById('secs').innerText = s.toString().padStart(2, '0');
    }
}
setInterval(updateCounter, 1000);

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
        }
    });
}, { threshold: 0.1 });

window.addEventListener('mousemove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    outline.animate({
        left: `${e.clientX - 15}px`,
        top: `${e.clientY - 15}px`
    }, { duration: 500, fill: "forwards" });
});

function filterMedia(type) {
    currentFilter = type;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${type}'`)) {
            btn.classList.add('active');
        }
    });
    renderGallery();
}

async function loadMedia() {
    try {
        const response = await fetch('media.json');
        media = await response.json();
        renderGallery();
    } catch (err) {
        console.error("Error loading media.json. Make sure the file exists!", err);
    }
}

function renderGallery() {
    grid.innerHTML = "";
    const filteredMedia = currentFilter === 'all' ? media : media.filter(item => item.type === currentFilter);

    filteredMedia.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        const captionHTML = item.caption ? `<div class="item-caption">${item.caption}</div>` : '';

        if (item.type === 'video') {
            div.innerHTML = `
                <div class="video-window">
                    <iframe src="${item.url}" frameborder="0" allow="autoplay"></iframe>
                </div>
                <div class="video-overlay"></div>
                ${captionHTML}
            `;
        } else {
            const img = document.createElement('img');
            img.src = item.url;
            img.onload = () => img.classList.add('loaded');
            if (img.complete) img.classList.add('loaded'); 
            div.appendChild(img);
            div.innerHTML += captionHTML;
        }

        div.onclick = (e) => {
            e.stopPropagation();
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
                        const urlParts = item.url.split('/');
                        const rawName = urlParts[urlParts.length - 1].split('?')[0];
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
        grid.appendChild(div);
        revealObserver.observe(div); 
    });
}

lightbox.onclick = (e) => {
    if (e.target === lightbox || e.target.id === 'lightbox' || e.target.id === 'close-hint') {
        lightbox.classList.remove('active');
        lbBox.innerHTML = ""; 
    }
};

passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (passInput.value === SECRET_KEY) {
            // SET SESSION STORAGE
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
