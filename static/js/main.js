// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loader = document.querySelector('.loader');
    const authButton = document.getElementById('auth-button'); // Simplified selector
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const topGamesList = document.getElementById('top-games-list');
    const topUsersList = document.getElementById('top-users-list');
    const searchBar = document.querySelector('.search-bar');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const scrollTopBtn = document.querySelector('.scroll-top');

    // --- Loading Screen ---
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500);

    // --- Modal Management ---
    const openModal = (modal) => modal.classList.add('active');
    const closeModal = (modal) => modal.classList.remove('active');

    // Event listener for the main login button (if it exists)
    if (authButton) {
        authButton.addEventListener('click', () => {
             // Reset to login form view
             document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
             document.getElementById('login-form').classList.add('active');
             openModal(authModalOverlay);
        });
    }

    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay || e.target.classList.contains('modal-close')) {
            closeModal(authModalOverlay);
        }
    });

    // --- Auth Modal Form Switching ---
    document.querySelectorAll('.form-switcher-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetFormId = e.target.dataset.form + '-form';
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            document.getElementById(targetFormId).classList.add('active');
        });
    });

    // --- NEW: Authentication using Fetch to connect to Python Backend ---

    // Registration Logic
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const errorDiv = document.getElementById('register-error');
        errorDiv.style.display = 'none'; // Hide previous errors

        if (!username || !password) {
            errorDiv.textContent = 'Username and password cannot be empty.';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Send data to the Flask backend
        fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Registration successful! Please log in.');
                // Switch to login form automatically
                document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
                document.getElementById('login-form').classList.add('active');
                registerForm.reset();
            } else {
                // Display error from the server
                errorDiv.textContent = data.error || 'An unknown error occurred.';
                errorDiv.style.display = 'block';
            }
        })
        .catch(err => {
            console.error('Registration fetch error:', err);
            errorDiv.textContent = 'Could not connect to the server.';
            errorDiv.style.display = 'block';
        });
    });

    // Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none'; // Hide previous errors

        // Send data to the Flask backend
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                // SUCCESS! Instead of redirecting, close the modal and reload the current page.
                alert('Login successful!');
                closeModal(authModalOverlay); // Close the pop-up
                window.location.reload();     // Reload index.html to update the header
            } else {
                // Display error from the server
                errorDiv.textContent = data.error || 'An unknown error occurred.';
                errorDiv.style.display = 'block';
            }
        })
        .catch(err => {
            console.error('Login fetch error:', err);
            errorDiv.textContent = 'Could not connect to the server.';
            errorDiv.style.display = 'block';
        });
    });
    
    // Forgot Password Logic (Demo) - This can remain as is since it's a demo
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('forgot-username').value.trim();
        if (username) {
            alert(`If an account for "${username}" exists, a reset link has been sent (demo).`);
            closeModal(authModalOverlay);
            forgotForm.reset();
        }
    });


    // --- Leaderboards ---
    const updateLeaderboards = () => {
        fetch('/api/leaderboards')
            .then(response => response.json())
            .then(data => {
                const ranks = ['🥇', '🥈', '🥉'];

                // Top Games
                topGamesList.innerHTML = '';
                data.top_games.forEach((game, i) => {
                    const rank = i < 3 ? `<span class="leaderboard-rank">${ranks[i]}</span>` : `<span class="leaderboard-rank">${i+1}</span>`;
                    const listItem = document.createElement('li');
                    listItem.className = 'leaderboard-item';
                    listItem.innerHTML = `${rank}<span class="leaderboard-name">${game._id}</span><span class="leaderboard-score">${game.totalPlays} plays</span>`;
                    topGamesList.appendChild(listItem);
                });

                // Top Users
                topUsersList.innerHTML = '';
                data.top_players.forEach((user, i) => {
                    const rank = i < 3 ? `<span class="leaderboard-rank">${ranks[i]}</span>` : `<span class="leaderboard-rank">${i+1}</span>`;
                    const listItem = document.createElement('li');
                    listItem.className = 'leaderboard-item';
                    listItem.innerHTML = `${rank}<span class="leaderboard-name">${user.username}</span><span class="leaderboard-score">${user.totalPlays} plays</span>`;
                    topUsersList.appendChild(listItem);
                });
            })
            .catch(err => console.error('Failed to load leaderboards:', err));
    };

    // --- Game Play Tracking ---
    const trackPlay = (gameTitle, duration) => {
        // Send play data to the server
        fetch('/api/track_play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameTitle: gameTitle, duration: duration })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log('Play tracked successfully for', gameTitle);
                updateLeaderboards(); // Refresh leaderboards after tracking a play
            } else {
                console.warn('Could not track play (user might not be logged in):', data.error);
            }
        })
        .catch(err => console.error('Track play error:', err));
    };

    // --- Game Launch ---
    const gameLaunchOverlay = document.querySelector('.game-launch-overlay');
    const launchGameTitle = document.getElementById('launch-game-title');
    const launchCountdown = document.getElementById('launch-countdown');
    const launchProgressBar = document.getElementById('launch-progress-bar');
    const cancelLaunchBtn = document.querySelector('.game-launch-cancel');
    let countdownInterval, progressInterval;

    const launchGame = (title, url) => {
        launchGameTitle.textContent = title;
        gameLaunchOverlay.classList.add('active');

        trackPlay(title, 0);

        let count = 3;
        launchCountdown.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            launchCountdown.textContent = count > 0 ? count : 'Go!';
            if (count < 0) {
                clearInterval(countdownInterval);
                window.location.href = url;
            }
        }, 1000);
        
        let progress = 0;
        launchProgressBar.style.width = '0%';
        progressInterval = setInterval(() => {
            progress += 1;
            launchProgressBar.style.width = `${progress}%`;
            if (progress >= 100) clearInterval(progressInterval);
        }, 30);
    };
    
    document.querySelectorAll('.game-card, .carousel-item').forEach(element => {
        element.addEventListener('click', function(e) {
            if(e.target.classList.contains('coming-soon-btn')) {
                e.preventDefault();
                return;
            }
            if (!e.target.closest('a') && !e.target.closest('button')) {
                e.preventDefault();
                const gameTitle = this.querySelector('.game-title, .carousel-item-title').textContent;
                const gameUrl = this.dataset.game || this.querySelector('.game-play-btn').href;
                if (gameUrl && !gameUrl.endsWith('#')) launchGame(gameTitle, gameUrl);
            }
        });
    });

    cancelLaunchBtn.addEventListener('click', () => {
        clearInterval(countdownInterval);
        clearInterval(progressInterval);
        gameLaunchOverlay.classList.remove('active');
    });

    // --- Search and Filter ---
    searchBar.addEventListener('input', e => {
        const searchTerm = e.target.value.toLowerCase();
        filterGames(searchTerm, document.querySelector('.category-btn.active').dataset.category);
    });
    searchBar.addEventListener('focus', () => document.querySelector('.search-container').classList.add('focused'));
    searchBar.addEventListener('blur', () => document.querySelector('.search-container').classList.remove('focused'));

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.animation = 'buttonPress 0.3s ease';
            setTimeout(() => this.style.animation = '', 300);
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            filterGames(searchBar.value.toLowerCase(), this.dataset.category);
        });
    });
    
    // --- Scroll to top ---
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Carousel ---
    const carousel = document.querySelector('.carousel-container');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const carouselDots = document.querySelectorAll('.carousel-dot');
    let currentSlide = 0;
    
    const goToSlide = index => {
        currentSlide = index;
        if (carouselItems.length === 0) return;
        const itemWidth = carouselItems[0].offsetWidth + 32;
        carousel.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
        carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    };
    
    carouselDots.forEach((dot, index) => dot.addEventListener('click', () => goToSlide(index)));
    setInterval(() => {
        if (carouselItems.length === 0) return;
        currentSlide = (currentSlide + 1) % carouselItems.length;
        goToSlide(currentSlide);
    }, 5000);

    // --- Initial Calls ---
    updateLeaderboards();
});

// --- Helper function to filter games ---
function filterGames(searchTerm, category) {
    const allGameGrids = document.querySelectorAll('.game-grid');
    let totalVisibleCount = 0;

    allGameGrids.forEach(grid => {
        const gameCards = grid.querySelectorAll('.game-card');
        let sectionVisibleCount = 0;
        
        gameCards.forEach(card => {
            const title = card.querySelector('.game-title').textContent.toLowerCase();
            const description = card.querySelector('.game-description').textContent.toLowerCase();
            const categories = card.dataset.categories.split(',');
            
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
            const matchesCategory = category === 'all' || categories.includes(category);
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                sectionVisibleCount++;
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });

        const section = grid.closest('section');
        if (section) {
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle) {
                if (sectionVisibleCount === 0 && searchTerm) {
                    section.style.display = 'none';
                } else {
                    section.style.display = 'block';
                }
            }
        }
        totalVisibleCount += sectionVisibleCount;
    });

    const gameGridContainer = document.querySelector('.featured .game-grid');
    if (!gameGridContainer) return;
    let noResultsMsg = gameGridContainer.querySelector('.no-results');

    if (totalVisibleCount === 0 && searchTerm) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-results';
            msg.textContent = 'No games found matching your search. Try a different term or category.';
            gameGridContainer.appendChild(msg);
        }
    } else {
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
}