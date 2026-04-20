/**
 * Landing Page - Interactive Script
 * Storytelling sequence with split-flap display animation
 */

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        modalShowDelay: 200,          // Delay after image loads before showing modal
        headerShowDelay: 300,         // Delay after modal before showing header
        bodyStartDelay: 400,          // Delay after header before starting body text
        splitFlapDuration: 2425,       // Total time for all body text (~2.425 seconds, 25% increase)
        charsPerFlip: 8,              // Characters to flip through before settling (longer cycling)
        flipInterval: 16,             // Ms between character flips (~60fps, was 1ms causing excessive callbacks)
        lookaheadChars: 7,             // Number of characters ahead that are also flipping
        prismaticEnticeDelay: 6000,   // Delay before prismatic entice effect (6 seconds)
        parallaxIntensity: 0.03
    };

    // Characters to cycle through for split-flap effect (letters only)
    const FLIP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    // X (Twitter) Configuration
    const X_HANDLE = 'h_woopark';

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        loader: document.getElementById('loader'),
        landing: document.getElementById('landing'),
        bgBlur: document.getElementById('bg-blur'),
        parallaxBg: document.getElementById('parallax-bg'),
        bgImage: document.getElementById('bg-image'),
        emailIcon: document.getElementById('email-icon'),
        emailNotification: document.getElementById('email-notification'),
        letterOverlay: document.getElementById('letter-overlay'),
        glassLetter: document.getElementById('glass-letter'),
        emailMeta: document.getElementById('email-meta'),
        emailBody: document.getElementById('email-body'),
        emailSignature: document.getElementById('email-signature'),
        emailTimestamp: document.getElementById('email-timestamp'),
        letterContinue: document.getElementById('letter-continue'),
        // X Feed Modal elements
        xFeedOverlay: document.getElementById('x-feed-overlay'),
        xFeedModal: document.getElementById('x-feed-modal'),
        xFeedClose: document.getElementById('x-feed-close'),
        xFeedContainer: document.getElementById('x-feed-container')
    };

    // ========================================
    // State
    // ========================================
    let state = {
        imageLoaded: false,
        letterVisible: false,
        transitionTriggered: false,
        splitFlapRunning: false,
        twitterScriptLoaded: false,
        twitterScriptLoading: null, // Promise for script loading
        xFeedVisible: false
    };

    // ========================================
    // Timestamp Generation
    // ========================================
    function setEmailTimestamp() {
        if (!elements.emailTimestamp) return;
        
        const now = new Date();
        const options = {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        elements.emailTimestamp.textContent = now.toLocaleString('en-US', options);
    }

    // ========================================
    // Image Loading
    // ========================================
    function initImageLoading() {
        if (elements.bgImage.complete && elements.bgImage.naturalHeight !== 0) {
            onImageLoaded();
            return;
        }

        elements.bgImage.addEventListener('load', onImageLoaded);
        elements.bgImage.addEventListener('error', onImageError);
    }

    function onImageLoaded() {
        state.imageLoaded = true;
        elements.loader.classList.add('hidden');
        
        // Show email icon - user must click to open
        // Don't auto-start the storytelling sequence
    }

    function onImageError() {
        console.error('Failed to load background image');
        onImageLoaded();
    }

    // ========================================
    // Storytelling Sequence
    // ========================================
    function startStorySequence() {
        // Step 1: Show the glass modal (empty)
        setTimeout(() => {
            showModal();
            
            // Step 2: Show the header
            setTimeout(() => {
                showHeader();
                
                // Step 3: Start split-flap body text
                setTimeout(() => {
                    startSplitFlapAnimation();
                }, CONFIG.bodyStartDelay);
                
            }, CONFIG.headerShowDelay);
            
        }, CONFIG.modalShowDelay);
    }

    function showModal(expandFromIcon = false) {
        state.letterVisible = true;
        
        if (expandFromIcon) {
            // Calculate expansion origin from icon position
            const iconRect = elements.emailIcon.getBoundingClientRect();
            const iconCenterX = iconRect.left + iconRect.width / 2;
            const iconCenterY = iconRect.top + iconRect.height / 2;
            
            // Get viewport center for modal
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            
            // Calculate percentage offset from center
            const offsetX = ((iconCenterX - viewportCenterX) / window.innerWidth) * 100;
            const offsetY = ((iconCenterY - viewportCenterY) / window.innerHeight) * 100;
            
            // Set transform origin (50% is center, so add offset)
            const originX = 50 + offsetX;
            const originY = 50 + offsetY;
            
            elements.glassLetter.style.setProperty('--expand-origin-x', `${originX}%`);
            elements.glassLetter.style.setProperty('--expand-origin-y', `${originY}%`);
            elements.glassLetter.classList.add('expanding');
            elements.letterOverlay.classList.add('expanding');
        }
        
        elements.letterOverlay.classList.add('visible');
        
        // Hide email icon and notification with animation
        if (elements.emailIcon) {
            elements.emailIcon.classList.add('hidden');
        }
        if (elements.emailNotification) {
            elements.emailNotification.style.opacity = '0';
            elements.emailNotification.style.transform = 'scale(0)';
        }
        
        // Remove expanding class after animation completes
        if (expandFromIcon) {
            setTimeout(() => {
                elements.glassLetter.classList.remove('expanding');
                elements.letterOverlay.classList.remove('expanding');
            }, 600);
        }
    }

    function showHeader() {
        elements.emailMeta.classList.add('visible');
    }

    // ========================================
    // Split-Flap Display Animation
    // ========================================
    function startSplitFlapAnimation() {
        state.splitFlapRunning = true;
        
        const lines = elements.emailBody.querySelectorAll('.split-flap-line');
        const signatureLine = elements.emailSignature.querySelector('.split-flap-line');
        
        // Collect all text content
        const allLines = [];
        lines.forEach(line => {
            allLines.push({
                element: line,
                text: line.dataset.text,
                isSignature: false
            });
        });
        
        if (signatureLine) {
            allLines.push({
                element: signatureLine,
                text: signatureLine.dataset.text,
                isSignature: true
            });
        }
        
        // Calculate total characters
        let totalChars = 0;
        allLines.forEach(line => totalChars += line.text.length);
        
        // Time per character (to fit within splitFlapDuration)
        const timePerChar = CONFIG.splitFlapDuration / totalChars;
        
        // Animate each line sequentially
        let currentDelay = 0;
        let lineIndex = 0;
        
        function animateNextLine() {
            if (lineIndex >= allLines.length) {
                // All done - show continue button
                finishAnimation();
                return;
            }
            
            const lineData = allLines[lineIndex];
            
            // Show signature container if this is the signature
            if (lineData.isSignature) {
                elements.emailSignature.classList.add('visible');
            }
            
            animateLine(lineData.element, lineData.text, timePerChar, () => {
                // Apply formatting (bold, line breaks) after animation completes
                processTextFormatting(lineData.element, lineData.text);
                lineIndex++;
                animateNextLine();
            });
        }
        
        animateNextLine();
    }

    // Process text to convert ** markers to bold and handle line breaks
    function processTextFormatting(element, text) {
        // Replace **text** with <strong>text</strong>
        let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Replace line break markers with <br>
        processed = processed.replace(/\|NEWLINE\|/g, '<br>');
        processed = processed.replace(/&#10;/g, '<br>');
        processed = processed.replace(/\\n/g, '<br>');
        element.innerHTML = processed;
    }

    function animateLine(element, targetText, timePerChar, onComplete) {
        element.textContent = '';
        
        // Store original text for post-processing
        const originalText = targetText;
        
        // Remove ** markers and line breaks for animation
        const cleanText = targetText.replace(/\*\*/g, '').replace(/\|NEWLINE\|/g, ' ').replace(/&#10;/g, ' ').replace(/\\n/g, ' ');
        const targetChars = cleanText.split('');
        const charSpans = new Array(targetChars.length).fill(null);
        const settled = new Array(targetChars.length).fill(false);
        const created = new Array(targetChars.length).fill(false);
        
        // Add cursor
        const cursor = document.createElement('span');
        cursor.className = 'split-flap-cursor';
        element.appendChild(cursor);
        
        let currentIndex = 0;
        
        // Function to create a character span if it doesn't exist
        function ensureCharSpan(index) {
            if (created[index] || index >= targetChars.length) {
                return charSpans[index];
            }
            
            const targetChar = targetChars[index];
            const charSpan = document.createElement('span');
            charSpan.className = 'split-flap-char';
            charSpan.dataset.targetChar = targetChar;
            charSpan.dataset.index = index;
            
            // Handle spaces and punctuation
            if (targetChar === ' ') {
                charSpan.innerHTML = '&nbsp;';
                charSpan.dataset.isSpace = 'true';
            } else if (/[.,!?']/.test(targetChar)) {
                charSpan.textContent = targetChar;
                charSpan.dataset.isPunct = 'true';
            } else {
                // Start with random character
                charSpan.textContent = FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)];
            }
            
            // Insert before cursor
            element.insertBefore(charSpan, cursor);
            charSpans[index] = charSpan;
            created[index] = true;
            
            return charSpan;
        }
        
        // Continuous flipping interval for lookahead characters
        const flipInterval = setInterval(() => {
            const maxIndex = Math.min(currentIndex + CONFIG.lookaheadChars, targetChars.length - 1);
            
            for (let i = currentIndex; i <= maxIndex; i++) {
                if (!settled[i] && !created[i]) {
                    // Create character span if it doesn't exist yet
                    ensureCharSpan(i);
                }
                
                if (!settled[i]) {
                    const charSpan = charSpans[i];
                    if (!charSpan) continue;
                    
                    // Skip spaces and punctuation
                    if (charSpan.dataset.isSpace === 'true' || charSpan.dataset.isPunct === 'true') {
                        continue;
                    }
                    
                    // Flip to random character
                    const randomChar = FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)];
                    charSpan.textContent = randomChar;
                    charSpan.classList.add('flipping');
                    
                    setTimeout(() => {
                        charSpan.classList.remove('flipping');
                    }, CONFIG.flipInterval);
                }
            }
        }, CONFIG.flipInterval);
        
        // Main animation - settle characters one by one
        function settleNextChar() {
            if (currentIndex >= targetChars.length) {
                clearInterval(flipInterval);
                cursor.remove();
                onComplete();
                return;
            }
            
            // Ensure character exists
            if (!created[currentIndex]) {
                ensureCharSpan(currentIndex);
            }
            
            const charSpan = charSpans[currentIndex];
            const targetChar = targetChars[currentIndex]; // Use clean text character
            
            // Settle this character
            if (charSpan.dataset.isSpace !== 'true' && charSpan.dataset.isPunct !== 'true') {
                charSpan.textContent = targetChar;
                charSpan.classList.add('flipping');
                setTimeout(() => {
                    charSpan.classList.remove('flipping');
                }, 80);
            }
            
            settled[currentIndex] = true;
            currentIndex++;
            
            // Schedule next settlement
            setTimeout(settleNextChar, timePerChar);
        }
        
        // Start settling characters
        setTimeout(settleNextChar, CONFIG.flipInterval * 3);
    }

    function finishAnimation() {
        state.splitFlapRunning = false;

        // Show continue button
        setTimeout(() => {
            elements.letterContinue.classList.add('visible');

            // Start prismatic entice effect after delay
            setTimeout(() => {
                if (!state.transitionTriggered) {
                    elements.letterContinue.classList.add('prismatic-entice');
                }
            }, CONFIG.prismaticEnticeDelay);
        }, 300);
    }

    // ========================================
    // Edge-Proximity Lighting Effect
    // ========================================
    const EDGE_CONFIG = {
        threshold: 80,      // Distance in px to start glow
        maxOpacity: 0.85,   // Maximum glow intensity
        blurSize: 20        // Blur radius in px
    };

    function initButtonEffects() {
        const btn = elements.letterContinue;
        if (!btn) return;

        // Fireworks on hover for continue button
        btn.addEventListener('mouseenter', () => {
            startContinueFireworks(btn);
        });

        btn.addEventListener('mouseleave', () => {
            stopContinueFireworks();
        });

        let rafId = null;
        let lastX = 0, lastY = 0;

        function onPointerMove(e) {
            lastX = e.clientX;
            lastY = e.clientY;

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    updateEdgeGlow(btn, lastX, lastY);
                    rafId = null;
                });
            }
        }

        document.addEventListener('pointermove', onPointerMove, { passive: true });
        
        // Also handle when mouse leaves the document
        document.addEventListener('pointerleave', () => {
            btn.style.setProperty('--glow', '0');
        });
    }

    function updateEdgeGlow(btn, mouseX, mouseY) {
        const rect = btn.getBoundingClientRect();

        // Mouse position relative to button
        const px = mouseX - rect.left;
        const py = mouseY - rect.top;
        
        // Find nearest point on the border
        const nearestX = Math.max(0, Math.min(rect.width, px));
        const nearestY = Math.max(0, Math.min(rect.height, py));
        
        // Clamp to actual border
        let edgeX = nearestX;
        let edgeY = nearestY;
        
        // If inside the button, find the closest edge
        if (px >= 0 && px <= rect.width && py >= 0 && py <= rect.height) {
            const distLeft = px;
            const distRight = rect.width - px;
            const distTop = py;
            const distBottom = rect.height - py;
            
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            
            if (minDist === distLeft) {
                edgeX = 0;
                edgeY = py;
            } else if (minDist === distRight) {
                edgeX = rect.width;
                edgeY = py;
            } else if (minDist === distTop) {
                edgeX = px;
                edgeY = 0;
            } else {
                edgeX = px;
                edgeY = rect.height;
            }
        } else {
            // Outside - clamp to border
            edgeX = Math.max(0, Math.min(rect.width, px));
            edgeY = Math.max(0, Math.min(rect.height, py));
            
            // Handle corners - find closest point on perimeter
            if (px < 0) edgeX = 0;
            else if (px > rect.width) edgeX = rect.width;
            
            if (py < 0) edgeY = 0;
            else if (py > rect.height) edgeY = rect.height;
        }
        
        // Calculate distance from mouse to nearest edge point
        const dx = px - edgeX;
        const dy = py - edgeY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate glow intensity based on distance
        let glow = 0;
        if (distance < EDGE_CONFIG.threshold) {
            glow = 1 - (distance / EDGE_CONFIG.threshold);
            glow = Math.pow(glow, 0.7); // Ease curve for smoother falloff
        }
        
        // Convert edge position to percentage
        const edgeXPercent = (edgeX / rect.width) * 100;
        const edgeYPercent = (edgeY / rect.height) * 100;
        
        // Update CSS variables
        btn.style.setProperty('--edge-x', `${edgeXPercent}%`);
        btn.style.setProperty('--edge-y', `${edgeYPercent}%`);
        btn.style.setProperty('--glow', glow.toFixed(3));
        
        // Calculate shadow offset - direction from center to edge point
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (edgeX - centerX) * 0.15; // Scale down for subtle offset
        const offsetY = (edgeY - centerY) * 0.3;
        btn.style.setProperty('--shadow-x', `${offsetX.toFixed(1)}px`);
        btn.style.setProperty('--shadow-y', `${offsetY.toFixed(1)}px`);
        
        // Toggle glow-active class for animation
        if (glow > 0.1) {
            btn.classList.add('glow-active');
        } else {
            btn.classList.remove('glow-active');
        }
    }

    // ========================================
    // Parallax Effect
    // ========================================
    function initParallax() {
        let ticking = false;
        let lastScrollY = 0;

        window.addEventListener('scroll', () => {
            lastScrollY = window.scrollY;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateParallax(lastScrollY);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function updateParallax(scrollY) {
        const landingHeight = elements.landing.offsetHeight;
        if (scrollY > landingHeight) return;

        const translateY = scrollY * CONFIG.parallaxIntensity * 100;
        elements.parallaxBg.style.transform = `translate3d(0, ${translateY}px, 0)`;
        elements.bgBlur.style.transform = `translate3d(0, ${translateY * 0.5}px, 0) scale(1.1)`;
    }

    // ========================================
    // Click/Transition Handling
    // ========================================
    function initClickHandler() {
        elements.letterContinue.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerTransition();
        });

        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && 
                state.letterVisible && 
                !state.transitionTriggered &&
                !state.splitFlapRunning) {
                e.preventDefault();
                triggerTransition();
            }
        });
    }

    function triggerTransition() {
        if (state.splitFlapRunning) return;
        
        // If X feed is already visible, do nothing
        if (state.xFeedVisible) return;
        
        // If this is the first transition, hide the letter
        if (!state.transitionTriggered) {
            state.transitionTriggered = true;
            hideLetter();
            
            // Show X feed modal after letter fades out
            setTimeout(() => {
                showXFeedModal();
            }, 500);
        } else {
            // Subsequent clicks (after letter is hidden) - just show X feed
            showXFeedModal();
        }
    }

    function hideLetter() {
        elements.letterOverlay.classList.add('fade-out');
        elements.letterOverlay.classList.remove('visible');
    }

    // ========================================
    // X Feed Modal
    // ========================================
    
    /**
     * Fetches posts from the RSS feed API (Vercel serverless function)
     * Falls back to demo data on error
     */
    let cachedFeedData = null;
    let feedFetchPromise = null;

    // Demo posts shown when API isn't reachable (local dev)
    const DEMO_POSTS = [
        { text: "Weekly updates can be long when everyone shipping so much @trynationgraph", link: "https://x.com/h_woopark", date: new Date().toISOString(), image: "https://pbs.twimg.com/media/HGIsXyXakAAKfau.jpg", type: "post", author: "h_woopark", rtAuthor: null },
        { text: "CAD $2.58 plz @h_woopark", link: "https://x.com/h_woopark", date: new Date(Date.now() - 21600000).toISOString(), image: "https://pbs.twimg.com/media/HGLRHfFaYAA3xvP.jpg", type: "repost", author: "h_woopark", rtAuthor: { name: "Miles 2", handle: "milesFF007F" } },
        { text: "we're growing fast and hiring for an account manager and senior swe at @trynationgraph in toronto this role is probably not for 90% of folks, it's long hours, tough problems to solve but HEAVILY rewarding. Dms are open if you want to join the rocketship", link: "https://x.com/h_woopark", date: new Date(Date.now() - 43200000).toISOString(), image: "https://pbs.twimg.com/media/HGIsXyXakAAKfau.jpg", type: "repost", author: "h_woopark", rtAuthor: { name: "NationGraph", handle: "trynationgraph" } },
        { text: "Goated ML Leader- literally an honour to work alongside her\u2026 every word that comes out of her mouth is alpha", link: "https://x.com/h_woopark", date: new Date(Date.now() - 86400000).toISOString(), image: null, type: "post", author: "h_woopark", rtAuthor: null },
        { text: "@milesFF007F haha appreciate you bro, next dinner on me", link: "https://x.com/h_woopark", date: new Date(Date.now() - 129600000).toISOString(), image: null, type: "reply", author: "h_woopark", rtAuthor: null },
        { text: "U should've seen how crazy my sr Eng was going with his hands after we got the first successful stamp in during lunch time", link: "https://x.com/h_woopark", date: new Date(Date.now() - 172800000).toISOString(), image: "https://pbs.twimg.com/media/HGICMV7aEAAXrTY.jpg", type: "post", author: "h_woopark", rtAuthor: null },
        { text: "Justin Bieber spotted using @trynationgraph at Coachella?", link: "https://x.com/h_woopark", date: new Date(Date.now() - 259200000).toISOString(), image: "https://pbs.twimg.com/media/HF4gUc7W0AAhLs7.jpg", type: "repost", author: "h_woopark", rtAuthor: { name: "NationGraph", handle: "trynationgraph" } },
        { text: "Anyone got tix to the masters? (Will drop everything and do anything for em)", link: "https://x.com/h_woopark", date: new Date(Date.now() - 345600000).toISOString(), image: null, type: "post", author: "h_woopark", rtAuthor: null }
    ];

    // Current filter state
    let currentFilter = 'all';

    function fetchFeedData() {
        if (cachedFeedData) return Promise.resolve(cachedFeedData);
        if (feedFetchPromise) return feedFetchPromise;

        feedFetchPromise = fetch('/api/feed')
            .then(res => {
                if (!res.ok) throw new Error('Feed API returned ' + res.status);
                return res.json();
            })
            .then(data => {
                cachedFeedData = data;
                return data;
            })
            .catch(err => {
                console.warn('Feed API unavailable, using demo posts:', err.message);
                // Return demo data so tweet cards still render locally
                const demoData = { posts: DEMO_POSTS, source: 'demo' };
                cachedFeedData = demoData;
                return demoData;
            });

        return feedFetchPromise;
    }

    /**
     * Formats a date string into a relative time (e.g., "2h", "3d")
     */
    function formatRelativeTime(dateStr) {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHr = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHr / 24);

            if (diffMin < 1) return 'now';
            if (diffMin < 60) return diffMin + 'm';
            if (diffHr < 24) return diffHr + 'h';
            if (diffDay < 7) return diffDay + 'd';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    }

    /**
     * Renders a single tweet card HTML string
     */
    function renderTweetCard(post) {
        const isRT = post.type === 'repost';
        const isReply = post.type === 'reply';

        // Type indicator above the card
        const typeLabel = isRT
            ? '<div class="tweet-card-type-label"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V19.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11V4.5h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 16.12V8.75c0-.97-.784-1.75-1.75-1.75z"/></svg> Reposted</div>'
            : isReply
            ? '<div class="tweet-card-type-label"><svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.32-2.383 5.83l-4.685 4.69c-.29.29-.677.44-1.061.44-.384 0-.768-.15-1.061-.44-.586-.58-.586-1.54 0-2.12l4.686-4.69c.944-.95 1.504-2.24 1.504-3.71 0-2.835-2.262-5.13-5.129-5.13H9.756c-2.763 0-5.005 2.24-5.005 5v.09L7.38 7.38c.586-.58 1.536-.58 2.122 0s.586 1.54 0 2.12L5.254 13.75c-.293.29-.677.44-1.06.44s-.767-.15-1.06-.44L-.114 9.5c-.586-.58-.586-1.54 0-2.12s1.536-.58 2.122 0L4.751 10.1V10z"/></svg> Reply</div>'
            : '';

        // For RTs, show the original author; for posts/replies, show Woo
        const displayName = isRT && post.rtAuthor ? post.rtAuthor.name : 'Woo';
        const displayHandle = isRT && post.rtAuthor ? '@' + post.rtAuthor.handle : '@' + X_HANDLE;

        const imageHtml = post.image
            ? `<div class="tweet-card-image"><img src="${post.image}" alt="" loading="lazy"></div>` : '';

        const timeStr = formatRelativeTime(post.date);

        return `
            <a href="${post.link || 'https://x.com/' + X_HANDLE}" target="_blank" rel="noopener noreferrer" class="tweet-card" data-type="${post.type}">
                ${typeLabel}
                <div class="tweet-card-header">
                    <div class="tweet-card-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </div>
                    <span class="tweet-card-name">${displayName}</span>
                    <span class="tweet-card-handle">${displayHandle}</span>
                    <span class="tweet-card-dot">&middot;</span>
                    <span class="tweet-card-time">${timeStr}</span>
                </div>
                <p class="tweet-card-text">${post.text}</p>
                ${imageHtml}
            </a>
        `;
    }

    /**
     * Filters posts based on current filter
     */
    function filterPosts(posts, filter) {
        if (filter === 'all') return posts;
        if (filter === 'posts') return posts.filter(p => p.type === 'post');
        if (filter === 'reposts') return posts.filter(p => p.type === 'repost');
        if (filter === 'replies') return posts.filter(p => p.type === 'reply');
        return posts;
    }

    /**
     * Updates only the card list without re-rendering the header/tabs
     */
    function updateCardList(posts) {
        const list = document.querySelector('.tweet-cards-list');
        if (!list) return;

        const filtered = filterPosts(posts, currentFilter);

        if (filtered.length === 0) {
            list.innerHTML = `<div class="tweet-cards-empty">No ${currentFilter === 'all' ? '' : currentFilter + ' '}posts yet</div>`;
        } else {
            list.innerHTML = filtered.map(renderTweetCard).join('');
        }
    }

    /**
     * Renders the full feed — header/tabs go into x-feed-content (sticky),
     * card list goes into x-feed-container (scrollable).
     */
    function renderFeed(container, data) {
        if (!container) return;

        const contentEl = document.querySelector('.x-feed-content');

        if (!data || !data.posts || data.posts.length === 0) {
            renderFallbackCard(container);
            return;
        }

        // Count types for tab labels
        const allCount = data.posts.length;
        const postCount = data.posts.filter(p => p.type === 'post').length;
        const repostCount = data.posts.filter(p => p.type === 'repost').length;
        const replyCount = data.posts.filter(p => p.type === 'reply').length;

        // Remove any previously injected header/tabs (avoid duplication)
        contentEl.querySelectorAll('.x-feed-header, .x-feed-tabs').forEach(el => el.remove());

        const headerHtml = `
            <div class="x-feed-header">
                <div class="x-feed-header-left">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" class="x-feed-logo">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span class="x-feed-header-title">@${X_HANDLE}</span>
                </div>
                <a href="https://x.com/${X_HANDLE}" target="_blank" rel="noopener noreferrer" class="x-feed-follow-btn">Follow</a>
            </div>
            <div class="x-feed-tabs">
                <button class="x-feed-tab${currentFilter === 'all' ? ' active' : ''}" data-filter="all">All <span class="tab-count">${allCount}</span></button>
                <button class="x-feed-tab${currentFilter === 'posts' ? ' active' : ''}" data-filter="posts">Posts <span class="tab-count">${postCount}</span></button>
                <button class="x-feed-tab${currentFilter === 'reposts' ? ' active' : ''}" data-filter="reposts">Reposts <span class="tab-count">${repostCount}</span></button>
                <button class="x-feed-tab${currentFilter === 'replies' ? ' active' : ''}" data-filter="replies">Replies <span class="tab-count">${replyCount}</span></button>
            </div>
        `;

        // Insert header/tabs into x-feed-content, BEFORE x-feed-container
        const temp = document.createElement('div');
        temp.innerHTML = headerHtml;
        while (temp.firstChild) {
            contentEl.insertBefore(temp.firstChild, container);
        }

        // Render cards into the scrollable container
        const filtered = filterPosts(data.posts, currentFilter);
        const cards = filtered.length > 0
            ? filtered.map(renderTweetCard).join('')
            : `<div class="tweet-cards-empty">No ${currentFilter === 'all' ? '' : currentFilter + ' '}posts yet</div>`;

        container.innerHTML = '<div class="tweet-cards-list">' + cards + '</div>';

        // Attach tab click handlers
        contentEl.querySelectorAll('.x-feed-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const filter = tab.dataset.filter;
                if (filter === currentFilter) return;

                currentFilter = filter;

                // Update active tab
                contentEl.querySelectorAll('.x-feed-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Re-render cards only
                updateCardList(data.posts);
            });
        });
    }

    /**
     * Renders fallback profile card when feed is unavailable
     */
    function renderFallbackCard(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="x-fallback-card">
                <div class="x-fallback-header">
                    <div class="x-fallback-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </div>
                    <div class="x-fallback-info">
                        <span class="x-fallback-name">Hyeonwoo Park</span>
                        <span class="x-fallback-handle">@${X_HANDLE}</span>
                    </div>
                </div>
                <p class="x-fallback-bio">Head of Data Operations at NationGraph (Employee #1). Interested in frontier technology, AI, and early-stage investing.</p>
                <a href="https://x.com/${X_HANDLE}" target="_blank" rel="noopener noreferrer" class="x-fallback-button">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>View @${X_HANDLE} on X</span>
                </a>
            </div>
        `;
    }

    /**
     * Shows the X feed modal and loads posts from RSS feed API
     */
    function showXFeedModal() {
        if (!elements.xFeedOverlay) return;

        state.xFeedVisible = true;
        elements.xFeedOverlay.classList.add('visible');

        // Show loading state
        if (elements.xFeedContainer) {
            elements.xFeedContainer.innerHTML = `
                <div class="x-feed-loading">
                    <div class="loader-spinner" style="width:24px;height:24px;border-width:2px;"></div>
                </div>
            `;
        }

        // Fetch from RSS feed API and render cards
        fetchFeedData().then(data => {
            renderFeed(elements.xFeedContainer, data);
        });
    }
    
    // ========================================
    // Blog (Notion) Integration
    // ========================================
    let cachedBlogData = null;
    let blogFetchPromise = null;
    let currentView = 'x'; // 'x' or 'blog'

    // Demo blog posts for local dev
    const DEMO_BLOG_POSTS = [
        { id: '1', title: 'Why I Joined NationGraph as Employee #1', publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(), tags: ['career', 'startups'], body: '<p>When I first met the founders, I knew this was something special. The vision of transforming unstructured data into actionable business insights resonated deeply with me...</p><p>Three months in, we\'ve already closed our Series A led by Menlo Ventures. The pace is relentless, but the reward is building something that genuinely matters.</p>' },
        { id: '2', title: 'Lessons from Early-Stage Investing', publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(), tags: ['investing', 'AI'], body: '<p>Having spent time on both sides of the table — as an operator and an investor — I\'ve learned that the best founders share a few key traits...</p><p>Pattern recognition matters, but conviction in the face of uncertainty matters more.</p>' },
        { id: '3', title: 'The Future of Data Infrastructure', publishedAt: new Date(Date.now() - 86400000 * 21).toISOString(), tags: ['technology', 'data'], body: '<p>We\'re at an inflection point. The tools and systems that powered the last decade of data work are being fundamentally reimagined...</p>' }
    ];

    function fetchBlogData() {
        if (cachedBlogData) return Promise.resolve(cachedBlogData);
        if (blogFetchPromise) return blogFetchPromise;

        blogFetchPromise = fetch('/api/blog-posts')
            .then(res => {
                if (!res.ok) throw new Error('Blog API returned ' + res.status);
                return res.json();
            })
            .then(data => {
                // API returns array directly
                const posts = Array.isArray(data) ? data : (data.posts || []);
                cachedBlogData = posts;
                return posts;
            })
            .catch(err => {
                console.warn('Blog API unavailable, using demo posts:', err.message);
                cachedBlogData = DEMO_BLOG_POSTS;
                return DEMO_BLOG_POSTS;
            });

        return blogFetchPromise;
    }

    function formatBlogDate(dateStr) {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch { return ''; }
    }

    function renderBlogPost(post) {
        const tags = (post.tags || []).map(t => `<span class="blog-tag">${t}</span>`).join('');
        const date = formatBlogDate(post.publishedAt);
        // Truncate body for preview (strip HTML, take first 200 chars)
        const plainText = (post.body || '').replace(/<[^>]*>/g, '').trim();
        const preview = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;

        return `
            <div class="blog-card" data-post-id="${post.id}">
                <div class="blog-card-meta">
                    <span class="blog-card-date">${date}</span>
                    ${tags ? '<div class="blog-card-tags">' + tags + '</div>' : ''}
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-preview">${preview}</p>
            </div>
        `;
    }

    function renderBlogExpanded(post) {
        const tags = (post.tags || []).map(t => `<span class="blog-tag">${t}</span>`).join('');
        const date = formatBlogDate(post.publishedAt);

        return `
            <button class="blog-back-btn" id="blog-back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
            </button>
            <article class="blog-article">
                <div class="blog-article-meta">
                    <span class="blog-card-date">${date}</span>
                    ${tags ? '<div class="blog-card-tags">' + tags + '</div>' : ''}
                </div>
                <h2 class="blog-article-title">${post.title}</h2>
                <div class="blog-article-body">${post.body || ''}</div>
            </article>
        `;
    }

    function renderBlogFeed(container, posts) {
        if (!container) return;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="tweet-cards-empty">No blog posts yet</div>';
            return;
        }

        const header = `
            <div class="blog-feed-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" class="blog-feed-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span class="blog-feed-title">Woo's Blog</span>
            </div>
        `;

        const cards = posts.map(renderBlogPost).join('');
        container.innerHTML = header + '<div class="blog-cards-list">' + cards + '</div>';

        // Click handlers to expand posts
        container.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.postId;
                const post = posts.find(p => p.id === postId);
                if (post) {
                    container.innerHTML = renderBlogExpanded(post);
                    container.scrollTop = 0;
                    // Back button
                    container.querySelector('#blog-back-btn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        renderBlogFeed(container, posts);
                        container.scrollTop = 0;
                    });
                }
            });
        });
    }

    function showBlogView() {
        const xContainer = elements.xFeedContainer;
        const blogContainer = document.getElementById('blog-container');
        if (!xContainer || !blogContainer) return;

        currentView = 'blog';
        xContainer.style.display = 'none';
        blogContainer.style.display = '';

        // Update switcher buttons
        document.getElementById('view-x-btn')?.classList.remove('active');
        document.getElementById('view-blog-btn')?.classList.add('active');

        // Fetch and render if not already loaded
        if (!blogContainer.querySelector('.blog-cards-list') && !blogContainer.querySelector('.blog-article')) {
            blogContainer.innerHTML = '<div class="x-feed-loading"><div class="loader-spinner" style="width:24px;height:24px;border-width:2px;"></div></div>';
            fetchBlogData().then(posts => {
                renderBlogFeed(blogContainer, posts);
            });
        }
    }

    function showXView() {
        const xContainer = elements.xFeedContainer;
        const blogContainer = document.getElementById('blog-container');
        if (!xContainer || !blogContainer) return;

        currentView = 'x';
        xContainer.style.display = '';
        blogContainer.style.display = 'none';

        // Update switcher buttons
        document.getElementById('view-x-btn')?.classList.add('active');
        document.getElementById('view-blog-btn')?.classList.remove('active');
    }

    function initViewSwitcher() {
        const xBtn = document.getElementById('view-x-btn');
        const blogBtn = document.getElementById('view-blog-btn');

        if (xBtn) {
            xBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showXView();
            });
        }
        if (blogBtn) {
            blogBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showBlogView();
            });
        }
    }

    /**
     * Hides the X feed modal
     */
    function hideXFeedModal() {
        if (!elements.xFeedOverlay) return;
        
        state.xFeedVisible = false;
        elements.xFeedOverlay.classList.remove('visible');
    }
    
    /**
     * Initializes X feed modal event handlers
     */
    function initXFeedModal() {
        // Fix scrolling: trap wheel events inside the modal so they don't bubble
        // to the landing section (which has overflow:hidden and eats the events)
        if (elements.xFeedOverlay) {
            elements.xFeedOverlay.addEventListener('wheel', (e) => {
                // Only trap when feed is visible
                if (!state.xFeedVisible) return;

                // Find the scrollable container (feed or blog, whichever is visible)
                const feedContainer = elements.xFeedContainer;
                const blogContainer = document.getElementById('blog-container');
                const scrollable = feedContainer && feedContainer.style.display !== 'none'
                    ? feedContainer
                    : blogContainer;

                if (!scrollable) return;

                const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
                const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1 && e.deltaY > 0;

                // Prevent the page from scrolling when we're inside the modal
                if (!atTop && !atBottom) {
                    e.preventDefault();
                    scrollable.scrollTop += e.deltaY;
                }
                e.stopPropagation();
            }, { passive: false });
        }

        // Close button click
        if (elements.xFeedClose) {
            elements.xFeedClose.addEventListener('click', (e) => {
                e.stopPropagation();
                hideXFeedModal();
            });
        }
        
        // Click outside modal to close
        if (elements.xFeedOverlay) {
            elements.xFeedOverlay.addEventListener('click', (e) => {
                if (e.target === elements.xFeedOverlay) {
                    hideXFeedModal();
                }
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.xFeedVisible) {
                hideXFeedModal();
            }
        });
        
        // Click on landing section to reopen X feed (after initial transition)
        if (elements.landing) {
            elements.landing.addEventListener('click', (e) => {
                // Only trigger if transition happened, X modal is closed, and not clicking on a modal
                if (state.transitionTriggered && 
                    !state.xFeedVisible && 
                    !e.target.closest('.glass-letter') &&
                    !e.target.closest('.x-feed-modal')) {
                    showXFeedModal();
                }
            });
        }
    }

    // ========================================
    // Accessibility
    // ========================================
    function initAccessibility() {
        elements.letterContinue.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!state.splitFlapRunning) {
                    triggerTransition();
                }
            }
        });
    }

    // ========================================
    // Animate SVG Gradient Rotation
    // ========================================
    function initSvgGradientAnimation() {
        const svg = elements.emailIcon?.querySelector('.email-icon-svg');
        if (!svg) return;
        
        const gradient = svg.querySelector('#rainbow-gradient');
        if (!gradient) return;
        
        const centerX = 12;
        const centerY = 12;
        const duration = 6000; // 6 seconds per rotation (half speed)
        
        let startTime = null;
        
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const angle = (elapsed / duration) * 360 % 360;
            gradient.setAttribute('gradientTransform', `rotate(${angle} ${centerX} ${centerY})`);
            requestAnimationFrame(animate);
        }
        
        requestAnimationFrame(animate);
    }

    // ========================================
    // Fireworks Effect
    // ========================================
    const FIREWORKS_CONFIG = {
        initialBurstMin: 5,
        initialBurstMax: 7,
        subsequentBurst: 1,
        initialDelay: 0,          // No delay - start immediately
        burstInterval: 2000,      // 2000ms = even slower sustained bursts (40% reduction)
        rocketStagger: 200,       // Max stagger between rockets in a burst
        sparkStagger: 50,         // Max stagger between sparks
        maxActiveSparks: 180,     // Reduced from 300 to 180 (40% reduction)
        colors: [
            { name: 'white', value: 'rgba(255, 255, 255, 1)', rgb: '255, 255, 255' },
            { name: 'gold', value: 'rgba(255, 215, 0, 1)', rgb: '255, 215, 0' },
            { name: 'yellow', value: 'rgba(255, 255, 0, 1)', rgb: '255, 255, 0' },
            { name: 'red', value: 'rgba(255, 50, 50, 1)', rgb: '255, 50, 50' },
            { name: 'pink', value: 'rgba(255, 105, 180, 1)', rgb: '255, 105, 180' },
            { name: 'cyan', value: 'rgba(0, 255, 255, 1)', rgb: '0, 255, 255' },
            { name: 'blue', value: 'rgba(100, 200, 255, 1)', rgb: '100, 200, 255' },
            { name: 'lime', value: 'rgba(200, 255, 0, 1)', rgb: '200, 255, 0' },
            { name: 'green', value: 'rgba(0, 255, 100, 1)', rgb: '0, 255, 100' }
        ],
        sizeTiers: {
            small: { weight: 60, sparks: 9, radius: 80, lifetime: 1000, gravity: 0.3, sparkSizeMin: 2, sparkSizeMax: 3 },
            medium: { weight: 30, sparks: 18, radius: 140, lifetime: 1300, gravity: 0.4, sparkSizeMin: 3, sparkSizeMax: 4 },
            large: { weight: 10, sparks: 30, radius: 220, lifetime: 1600, gravity: 0.5, sparkSizeMin: 4, sparkSizeMax: 5 }
        },
        fireworkStyles: ['radial', 'ring', 'spiral', 'willow', 'crackle', 'crossette']
    };

    let fireworksContainer = null;
    let burstInterval = null;
    let isHovering = false;
    // Separate state for continue button fireworks
    let continueBurstInterval = null;
    let isContinueHovering = false;
    // Performance tracking
    let activeSparkCount = 0;

    // Batched animation loop — all sparks share one rAF
    const activeSparks = [];
    let sparkLoopRunning = false;

    function runSparkLoop(currentTime) {
        if (activeSparks.length === 0) {
            sparkLoopRunning = false;
            return;
        }

        for (let i = activeSparks.length - 1; i >= 0; i--) {
            const s = activeSparks[i];
            const elapsed = currentTime - s.startTime;
            const progress = Math.min(elapsed / s.lifetime, 1);

            if (progress >= 1) {
                s.el.remove();
                activeSparkCount--;
                activeSparks.splice(i, 1);
                continue;
            }

            const eased = 1 - Math.pow(1 - progress, 2);
            let cx = s.sx + (s.fx - s.sx) * eased;
            let cy = s.sy + (s.fy - s.sy) * eased;

            // Gravity
            cy += s.gravity * elapsed * elapsed * 0.001;

            // Willow drift
            if (s.isWillow && progress > 0.5) {
                cx += Math.sin(elapsed * 0.01) * 2 * (progress - 0.5);
            }

            // Micro-wiggle
            const wd = 1 - progress;
            cx += Math.sin(s.wp) * s.wa * wd * 0.6;
            cy += Math.cos(s.wp * 1.3) * s.wa * wd * 0.6;
            s.wp += 0.06;

            // Spiral
            if (s.spiralProgress !== null) {
                const sa = s.spiralProgress * Math.PI * 4 + elapsed * 0.006;
                cx += Math.cos(sa) * 6 * (1 - progress);
                cy += Math.sin(sa) * 6 * (1 - progress);
            }

            // Viewport culling
            const pad = 100;
            const offScreen = cx < -pad || cx > window.innerWidth + pad ||
                cy < -pad || cy > window.innerHeight + pad;

            if (offScreen && progress > 0.6) {
                s.el.remove();
                activeSparkCount--;
                activeSparks.splice(i, 1);
                continue;
            }

            // Crossette split
            if (s.splitDelay !== null && elapsed > s.splitDelay && !s.split) {
                s.split = true;
                if (activeSparkCount + 2 <= FIREWORKS_CONFIG.maxActiveSparks) {
                    for (let j = 0; j < 2; j++) {
                        createSpark(cx, cy, s.angle + j * Math.PI, s.config, s.color, 0);
                    }
                }
                s.el.remove();
                activeSparkCount--;
                activeSparks.splice(i, 1);
                continue;
            }

            if (!offScreen) {
                s.el.style.transform = `translate3d(${cx - s.sx}px, ${cy - s.sy}px, 0)`;
                s.el.style.opacity = 1 - progress;
            }
        }

        requestAnimationFrame(runSparkLoop);
    }

    function ensureSparkLoop() {
        if (!sparkLoopRunning) {
            sparkLoopRunning = true;
            requestAnimationFrame(runSparkLoop);
        }
    }

    function initFireworks() {
        if (fireworksContainer) return; // Prevent duplicate containers
        fireworksContainer = document.createElement('div');
        fireworksContainer.className = 'fireworks-container';
        document.body.appendChild(fireworksContainer);
    }

    function getRandomSizeTier() {
        const rand = Math.random() * 100;
        if (rand < FIREWORKS_CONFIG.sizeTiers.small.weight) return 'small';
        if (rand < FIREWORKS_CONFIG.sizeTiers.small.weight + FIREWORKS_CONFIG.sizeTiers.medium.weight) return 'medium';
        return 'large';
    }

    function getRandomColor() {
        return FIREWORKS_CONFIG.colors[Math.floor(Math.random() * FIREWORKS_CONFIG.colors.length)];
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Weighted random for distance - scales with angle and screen width
    // At 0° (straight up): max 200px
    // As angle approaches ±90° (horizontal): max distance increases with screen width
    function getRandomDistance(angle) {
        const screenWidth = window.innerWidth;
        const angleDegrees = Math.abs(angle * 180 / Math.PI); // Convert to degrees, absolute value
        
        // Base distance for straight up (0°): up to 200px
        const baseMax = 200;
        
        // For horizontal angles, scale max distance based on screen width
        // At ±90°, can reach up to 40% of screen width
        const horizontalMax = screenWidth * 0.4;
        
        // Interpolate max distance based on angle (0° = baseMax, 90° = horizontalMax)
        const angleFactor = angleDegrees / 90; // 0 to 1
        const maxDistance = baseMax + (horizontalMax - baseMax) * Math.pow(angleFactor, 1.5);
        
        // Minimum distance scales slightly with angle too
        const minDistance = 90 + (angleFactor * 50); // 90px to 140px
        
        // Probability distribution: favor medium-high distances when horizontal
        const rand = Math.random();
        
        if (angleFactor < 0.3) {
            // More vertical (0-27°): original distribution
            if (rand < 0.5) return randomRange(minDistance, minDistance + (maxDistance - minDistance) * 0.3);
            if (rand < 0.8) return randomRange(minDistance + (maxDistance - minDistance) * 0.3, minDistance + (maxDistance - minDistance) * 0.7);
            return randomRange(minDistance + (maxDistance - minDistance) * 0.7, maxDistance);
        } else {
            // More horizontal (27-90°): favor medium-high distances
            if (rand < 0.2) return randomRange(minDistance, minDistance + (maxDistance - minDistance) * 0.3);
            if (rand < 0.5) return randomRange(minDistance + (maxDistance - minDistance) * 0.3, minDistance + (maxDistance - minDistance) * 0.7);
            return randomRange(minDistance + (maxDistance - minDistance) * 0.7, maxDistance); // 50% chance for high distances
        }
    }

    function launchRocket(button, delay = 0) {
        setTimeout(() => {
            const rect = button.getBoundingClientRect();
            const launchX = rect.left + rect.width / 2;
            const launchY = rect.bottom - 10; // Near bottom of button
            
            const angle = (Math.random() * 180 - 90) * Math.PI / 180; // -90° to +90°
            const distance = getRandomDistance(angle);
            const duration = randomRange(520, 980);
            
            const rocket = document.createElement('div');
            rocket.className = 'firework-rocket';
            rocket.style.left = launchX + 'px';
            rocket.style.top = launchY + 'px';
            fireworksContainer.appendChild(rocket);
            
            // Calculate end position
            const endX = launchX + Math.sin(angle) * distance;
            const endY = launchY - Math.cos(angle) * distance;
            
            // Create wiggling path
            const wiggleAmplitude = 8;
            const wiggleFrequency = 0.02;
            let wigglePhase = 0;
            const startTime = performance.now();
            
            function animateRocket(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress >= 1) {
                    // Rocket reached apex - explode
                    explode(endX, endY);
                    rocket.remove();
                    return;
                }
                
                // Decaying wiggle
                const decay = 1 - progress;
                const wiggle = Math.sin(wigglePhase) * wiggleAmplitude * decay;
                wigglePhase += wiggleFrequency * 16;
                
                // Rotation
                const rotation = progress * 180;
                
                // Position with wiggle
                const currentX = launchX + (endX - launchX) * progress + wiggle * Math.cos(angle + Math.PI / 2);
                const currentY = launchY + (endY - launchY) * progress;
                
                rocket.style.transform = `translate(-50%, -50%) translate(${currentX - launchX}px, ${currentY - launchY}px) rotate(${rotation}deg)`;
                
                requestAnimationFrame(animateRocket);
            }
            
            requestAnimationFrame(animateRocket);
        }, delay);
    }

    function explode(x, y) {
        const tier = getRandomSizeTier();
        const config = FIREWORKS_CONFIG.sizeTiers[tier];
        const style = FIREWORKS_CONFIG.fireworkStyles[Math.floor(Math.random() * FIREWORKS_CONFIG.fireworkStyles.length)];
        
        // Flash bloom
        const flash = document.createElement('div');
        flash.className = 'firework-flash';
        flash.style.left = x + 'px';
        flash.style.top = y + 'px';
        flash.style.transform = 'translate(-50%, -50%)';
        fireworksContainer.appendChild(flash);
        setTimeout(() => flash.remove(), 150);
        
        // Create sparks based on style
        createSparks(x, y, style, config);
    }

    function createSparks(x, y, style, config) {
        const baseColor = getRandomColor();
        const sparkDelay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
        
        switch (style) {
            case 'radial':
                createRadialSparks(x, y, config, baseColor);
                break;
            case 'ring':
                createRingSparks(x, y, config, baseColor);
                break;
            case 'spiral':
                createSpiralSparks(x, y, config, baseColor);
                break;
            case 'willow':
                createWillowSparks(x, y, config, baseColor);
                break;
            case 'crackle':
                createCrackleSparks(x, y, config, baseColor);
                break;
            case 'crossette':
                createCrossetteSparks(x, y, config, baseColor);
                break;
        }
    }

    function createRadialSparks(x, y, config, baseColor) {
        for (let i = 0; i < config.sparks; i++) {
            const angle = (Math.PI * 2 * i) / config.sparks;
            const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
            createSpark(x, y, angle, config, baseColor, delay);
        }
    }

    function createRingSparks(x, y, config, baseColor) {
        const ringCount = 2;
        for (let ring = 0; ring < ringCount; ring++) {
            const ringRadius = (ring + 1) * (config.radius / ringCount);
            const sparksPerRing = Math.floor(config.sparks / ringCount);
            for (let i = 0; i < sparksPerRing; i++) {
                const angle = (Math.PI * 2 * i) / sparksPerRing;
                const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
                createSpark(x, y, angle, config, baseColor, delay, ringRadius);
            }
        }
    }

    function createSpiralSparks(x, y, config, baseColor) {
        const arms = config.sparks > 50 ? 3 : 2;
        const sparksPerArm = Math.floor(config.sparks / arms);
        for (let arm = 0; arm < arms; arm++) {
            const armAngle = (Math.PI * 2 * arm) / arms;
            for (let i = 0; i < sparksPerArm; i++) {
                const spiralProgress = i / sparksPerArm;
                const angle = armAngle + spiralProgress * Math.PI * 2;
                const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
                createSpark(x, y, angle, config, baseColor, delay, null, spiralProgress);
            }
        }
    }

    function createWillowSparks(x, y, config, baseColor) {
        for (let i = 0; i < config.sparks; i++) {
            const angle = randomRange(-Math.PI / 2, Math.PI / 2); // Mostly downward
            const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
            createSpark(x, y, angle, config, baseColor, delay, null, null, true);
        }
    }

    function createCrackleSparks(x, y, config, baseColor) {
        // Initial burst
        const initialSparks = Math.floor(config.sparks * 0.4);
        for (let i = 0; i < initialSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            createSpark(x, y, angle, config, baseColor, 0);
        }
        
        // Delayed micro-bursts
        const microBursts = 3 + Math.floor(Math.random() * 3);
        for (let burst = 0; burst < microBursts; burst++) {
            const delay = randomRange(100, 300) * (burst + 1);
            const burstX = x + randomRange(-20, 20);
            const burstY = y + randomRange(-20, 20);
            const sparksPerBurst = Math.floor((config.sparks - initialSparks) / microBursts);
            
            for (let i = 0; i < sparksPerBurst; i++) {
                const angle = Math.random() * Math.PI * 2;
                createSpark(burstX, burstY, angle, config, baseColor, delay);
            }
        }
    }

    function createCrossetteSparks(x, y, config, baseColor) {
        const splitRatio = 0.3; // 30% of sparks will split
        const normalSparks = Math.floor(config.sparks * (1 - splitRatio));
        const splitSparks = config.sparks - normalSparks;
        
        // Normal sparks
        for (let i = 0; i < normalSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
            createSpark(x, y, angle, config, baseColor, delay);
        }
        
        // Splitting sparks
        for (let i = 0; i < splitSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const delay = randomRange(0, FIREWORKS_CONFIG.sparkStagger);
            const splitDelay = randomRange(200, 400);
            createSpark(x, y, angle, config, baseColor, delay, null, null, false, splitDelay);
        }
    }

    function createSpark(startX, startY, angle, config, baseColor, delay, customRadius = null, spiralProgress = null, isWillow = false, splitDelay = null) {
        setTimeout(() => {
            if (activeSparkCount >= FIREWORKS_CONFIG.maxActiveSparks) return;

            const spark = document.createElement('div');
            spark.className = 'firework-spark';

            const color = Math.random() < 0.3 ? baseColor : getRandomColor();
            const sparkSize = randomRange(config.sparkSizeMin, config.sparkSizeMax);

            spark.style.cssText = `background:${color.value};width:${sparkSize}px;height:${sparkSize}px;left:${startX}px;top:${startY}px;transform:translate3d(-50%,-50%,0)`;

            fireworksContainer.appendChild(spark);
            activeSparkCount++;

            const radius = customRadius || config.radius;
            const velocity = randomRange(0.8, 1.2);

            activeSparks.push({
                el: spark,
                sx: startX,
                sy: startY,
                fx: startX + Math.cos(angle) * radius * velocity,
                fy: startY + Math.sin(angle) * radius * velocity,
                startTime: performance.now(),
                lifetime: config.lifetime,
                gravity: isWillow ? config.gravity * 1.5 : config.gravity,
                isWillow: isWillow,
                wp: Math.random() * Math.PI * 2,
                wa: randomRange(2, 5),
                spiralProgress: spiralProgress,
                splitDelay: splitDelay,
                split: false,
                angle: angle,
                config: config,
                color: color
            });

            ensureSparkLoop();
        }, delay);
    }

    function fireBurst(button, count = FIREWORKS_CONFIG.initialBurstMin) {
        for (let i = 0; i < count; i++) {
            const delay = Math.random() * FIREWORKS_CONFIG.rocketStagger;
            launchRocket(button, delay);
        }
    }

    function startFireworks(button) {
        
        isHovering = true;
        
        // Initial burst - random between 6-9
        const initialCount = Math.floor(Math.random() * (FIREWORKS_CONFIG.initialBurstMax - FIREWORKS_CONFIG.initialBurstMin + 1)) + FIREWORKS_CONFIG.initialBurstMin;
        fireBurst(button, initialCount);
        
        // Start sustained bursts - aggressive throttling for 40% better performance
        burstInterval = setInterval(() => {
            if (!isHovering) {
                clearInterval(burstInterval);
                return;
            }
            // Skip burst if too many active sparks (more aggressive throttle - 50% threshold)
            if (activeSparkCount < FIREWORKS_CONFIG.maxActiveSparks * 0.5) {
                fireBurst(button, FIREWORKS_CONFIG.subsequentBurst);
            }
        }, FIREWORKS_CONFIG.burstInterval);
    }

    function stopFireworks() {
        isHovering = false;
        if (burstInterval) {
            clearInterval(burstInterval);
            burstInterval = null;
        }
    }

    function startContinueFireworks(button) {
        
        isContinueHovering = true;
        
        // Initial burst - random between 1-2
        const initialCount = Math.floor(Math.random() * 2) + 1; // 1 or 2
        fireBurst(button, initialCount);
        
        // Start sustained bursts - 1 rocket per continued hover
        continueBurstInterval = setInterval(() => {
            if (!isContinueHovering) {
                clearInterval(continueBurstInterval);
                return;
            }
            fireBurst(button, 1);
        }, FIREWORKS_CONFIG.burstInterval);
    }

    function stopContinueFireworks() {
        isContinueHovering = false;
        if (continueBurstInterval) {
            clearInterval(continueBurstInterval);
            continueBurstInterval = null;
        }
    }

    // ========================================
    // Email Icon Click Handler
    // ========================================
    function initEmailIcon() {
        if (!elements.emailIcon) return;
        
        // Initialize SVG gradient animation
        initSvgGradientAnimation();
        
        // Fireworks on hover
        elements.emailIcon.addEventListener('mouseenter', () => {
            startFireworks(elements.emailIcon);
        });
        
        elements.emailIcon.addEventListener('mouseleave', () => {
            stopFireworks();
        });
        
        elements.emailIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.letterVisible && state.imageLoaded) {
                // Start the storytelling sequence with expansion animation
                showModal(true);
                
                // Step 2: Show the header
                setTimeout(() => {
                    showHeader();
                    
                    // Step 3: Start split-flap body text
                    setTimeout(() => {
                        startSplitFlapAnimation();
                    }, CONFIG.bodyStartDelay);
                    
                }, CONFIG.headerShowDelay);
            }
        });
        
        // Keyboard accessibility
        elements.emailIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                elements.emailIcon.click();
            }
        });
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        setEmailTimestamp();
        initAccessibility();
        initClickHandler();

        // Initialize fireworks once before anything that needs them
        initFireworks();

        initButtonEffects();
        initParallax();
        initXFeedModal();
        initViewSwitcher();
        initEmailIcon();
        initImageLoading();
        
        // Fire 5-7 fireworks 2 seconds after page load
        setTimeout(() => {
            if (elements.emailIcon && !elements.emailIcon.classList.contains('hidden')) {
                const initialCount = Math.floor(Math.random() * (FIREWORKS_CONFIG.initialBurstMax - FIREWORKS_CONFIG.initialBurstMin + 1)) + FIREWORKS_CONFIG.initialBurstMin;
                fireBurst(elements.emailIcon, initialCount);
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
