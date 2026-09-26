/* for toggle*/





/*for body*/

document.addEventListener('DOMContentLoaded', function(){

    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    if(searchBtn && searchInput){
        searchBtn.addEventListener('click', toggleSearch);

        searchInput.addEventListener('input', function(){
            const query = this.value.toLowerCase();
            const cards = document.querySelectorAll('.cuisine-tile, .recipe-card');
            let matchFound = false;

            cards.forEach(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';

                if(title.includes(query) || desc.includes(query)){
                    card.style.display = 'block';
                    matchFound = true;
                } else {
                    card.style.display = 'none';
                }
            });

            const noResults = document.querySelector('.no-results');
            if(noResults) noResults.style.display = matchFound ? 'none' : 'block';
        });
    }

    const faders = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });
    faders.forEach(el => observer.observe(el));

});

function toggleSearch(){
    const input = document.querySelector('.search-input');
    if(!input) return;
    input.classList.toggle('active');
    if(input.classList.contains('active')){
        input.focus();
    }
}

function toggleSidebar(){
    const sidebar = document.getElementById('sidebarRight');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar) sidebar.classList.toggle('open');
    if(overlay) overlay.classList.toggle('show');
}

/* for backgroundmusic*/

function toggleMusic(){
    const music = document.getElementById('bgMusic');
    const btn = document.querySelector('.music-toggle');

    if(music.paused){
        music.play();
        btn.textContent = '🔊';
    } else {
        music.pause();
        btn.textContent = '🔇';
    }
}

/* funtion for comments to */

document.addEventListener('firebaseReady', function(){

    const form = document.getElementById('commentForm');
    if(!form) return;

    const list = document.getElementById('commentList');
    const { collection, addDoc, getDocs, query, orderBy } = window.dbFns;
    const pageId = window.location.pathname.replace(/\W/g, '_');
    const commentsRef = collection(window.db, 'comments_' + pageId);

    async function loadComments(){
        list.innerHTML = 'Loading...';
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const c = doc.data();
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `<strong>${c.name}</strong><p>${c.text}</p>`;
            list.appendChild(div);
        });
        if(snapshot.empty){
            list.innerHTML = '<p>No comments yet. Be the first!</p>';
        }
    }

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const name = document.getElementById('commentName').value.trim();
        const text = document.getElementById('commentText').value.trim();
        if(!name || !text) return;

        await addDoc(commentsRef, {
            name,
            text,
            createdAt: Date.now()
        });

        form.reset();
        loadComments();
    });

    loadComments();

});

/* functions for ratings*/

document.addEventListener('firebaseReady', function(){

    const starContainer = document.getElementById('starRating');
    if(!starContainer) return;

    const stars = starContainer.querySelectorAll('.star');
    const summary = document.getElementById('ratingSummary');
    const { collection, addDoc, getDocs } = window.dbFns;
    const pageId = window.location.pathname.replace(/\W/g, '_');
    const ratingsRef = collection(window.db, 'ratings_' + pageId);

    async function updateSummary(){
        const snapshot = await getDocs(ratingsRef);
        const values = [];
        snapshot.forEach(doc => values.push(doc.data().value));

        if(values.length === 0){
            summary.textContent = 'No ratings yet.';
            return;
        }
        const avg = (values.reduce((a,b) => a+b, 0) / values.length).toFixed(1);
        summary.textContent = `${avg} / 5 (${values.length} rating${values.length > 1 ? 's' : ''})`;
    }

    function highlightStars(value){
        stars.forEach(star => {
            star.classList.toggle('selected', star.dataset.value <= value);
        });
    }

    stars.forEach(star => {
        star.addEventListener('click', async function(){
            const value = parseInt(this.dataset.value);
            await addDoc(ratingsRef, { value, createdAt: Date.now() });
            highlightStars(value);
            updateSummary();
        });

        star.addEventListener('mouseenter', function(){
            highlightStars(parseInt(this.dataset.value));
        });
    });

    starContainer.addEventListener('mouseleave', updateSummary);

    updateSummary();

});

window.toggleSidebar = toggleSidebar;
window.toggleSearch = toggleSearch;
window.toggleMusic = toggleMusic;