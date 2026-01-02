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
        splitFlapDuration: 700,       // Total time for all body text (~0.7 seconds, 1.7x faster)
        charsPerFlip: 1,              // Characters to flip through before settling
        flipInterval: 5,              // Ms between character flips
        prismaticEnticeDelay: 5000,   // Delay before prismatic entice effect (5 seconds)
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
        
        // Start the storytelling sequence
        startStorySequence();
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

    function showModal() {
        state.letterVisible = true;
        elements.letterOverlay.classList.add('visible');
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
                lineIndex++;
                animateNextLine();
            });
        }
        
        animateNextLine();
    }

    function animateLine(element, targetText, timePerChar, onComplete) {
        element.textContent = '';
        let charIndex = 0;
        
        function animateNextChar() {
            if (charIndex >= targetText.length) {
                // Remove cursor when done
                const cursor = element.querySelector('.split-flap-cursor');
                if (cursor) cursor.remove();
                onComplete();
                return;
            }
            
            const targetChar = targetText[charIndex];
            const charSpan = document.createElement('span');
            charSpan.className = 'split-flap-char';
            
            // Remove old cursor
            const oldCursor = element.querySelector('.split-flap-cursor');
            if (oldCursor) oldCursor.remove();
            
            element.appendChild(charSpan);
            
            // Add cursor after current position
            const cursor = document.createElement('span');
            cursor.className = 'split-flap-cursor';
            element.appendChild(cursor);
            
            // If it's a space, use non-breaking space for visibility
            if (targetChar === ' ') {
                charSpan.innerHTML = '&nbsp;';
                charIndex++;
                setTimeout(animateNextChar, timePerChar * 0.3);
                return;
            }
            
            // Punctuation - show immediately
            if (/[.,!?']/.test(targetChar)) {
                charSpan.textContent = targetChar;
                charIndex++;
                setTimeout(animateNextChar, timePerChar * 0.5);
                return;
            }
            
            // Flip through random characters before settling
            let flipCount = 0;
            const maxFlips = CONFIG.charsPerFlip + Math.floor(Math.random() * 2);
            
            function flipChar() {
                if (flipCount >= maxFlips) {
                    // Settle on target character
                    charSpan.textContent = targetChar;
                    charSpan.classList.add('flipping');
                    setTimeout(() => {
                        charSpan.classList.remove('flipping');
                    }, 80);
                    
                    charIndex++;
                    setTimeout(animateNextChar, timePerChar);
                    return;
                }
                
                // Show random character
                const randomChar = FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)];
                charSpan.textContent = randomChar;
                charSpan.classList.add('flipping');
                
                setTimeout(() => {
                    charSpan.classList.remove('flipping');
                    flipCount++;
                    setTimeout(flipChar, CONFIG.flipInterval);
                }, CONFIG.flipInterval);
            }
            
            flipChar();
        }
        
        animateNextChar();
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
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:showLetter',message:'prismatic-entice added - tracking should continue',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
                    // #endregion
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

    // #region agent log
    let debugMoveCount = 0;
    let debugRafCount = 0;
    // #endregion

    function initButtonEffects() {
        const btn = elements.letterContinue;
        if (!btn) return;

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:initButtonEffects',message:'initButtonEffects called',data:{btnExists:!!btn},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        let rafId = null;
        let lastX = 0, lastY = 0;

        function onPointerMove(e) {
            lastX = e.clientX;
            lastY = e.clientY;
            
            // #region agent log
            debugMoveCount++;
            if (debugMoveCount % 50 === 0) {
                fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:onPointerMove',message:'pointer move event',data:{moveCount:debugMoveCount,rafIdNull:rafId===null,x:lastX,y:lastY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
            }
            // #endregion
            
            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    // #region agent log
                    debugRafCount++;
                    // #endregion
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
        
        // #region agent log
        if (debugRafCount % 30 === 0) {
            fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:updateEdgeGlow',message:'rect values',data:{rafCount:debugRafCount,rectTop:rect.top,rectLeft:rect.left,rectW:rect.width,rectH:rect.height,mouseX,mouseY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        }
        // #endregion
        
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
        
        // #region agent log
        if (debugRafCount % 30 === 0) {
            fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:updateEdgeGlow:result',message:'glow calculation',data:{distance,glow,edgeXPercent,edgeYPercent,px,py},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        }
        // #endregion
        
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
     * Lazily loads the Twitter widgets.js script once
     * @returns {Promise<void>} Resolves when script is ready
     */
    function loadTwitterWidgetsOnce() {
        // Already loaded
        if (state.twitterScriptLoaded && window.twttr?.widgets) {
            return Promise.resolve();
        }
        
        // Currently loading - return existing promise
        if (state.twitterScriptLoading) {
            return state.twitterScriptLoading;
        }
        
        // Start loading
        state.twitterScriptLoading = new Promise((resolve, reject) => {
            // Check if script already exists in DOM
            if (document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
                if (window.twttr?.widgets) {
                    state.twitterScriptLoaded = true;
                    resolve();
                    return;
                }
            }
            
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            
            script.onload = () => {
                state.twitterScriptLoaded = true;
                resolve();
            };
            
            script.onerror = () => {
                state.twitterScriptLoading = null;
                reject(new Error('Failed to load Twitter widgets.js'));
            };
            
            document.head.appendChild(script);
        });
        
        return state.twitterScriptLoading;
    }
    
    /**
     * Renders the X timeline into the specified container
     * @param {HTMLElement} container - The container element
     */
    function renderXTimeline(container) {
        if (!container) return;
        
        // Clear existing content to prevent duplicates
        container.innerHTML = '';
        
        // Create the Twitter timeline anchor
        const timelineAnchor = document.createElement('a');
        timelineAnchor.className = 'twitter-timeline';
        timelineAnchor.href = `https://twitter.com/${X_HANDLE}`;
        timelineAnchor.setAttribute('data-theme', 'dark');
        timelineAnchor.setAttribute('data-height', '600');
        timelineAnchor.setAttribute('data-chrome', 'noheader nofooter noborders transparent');
        timelineAnchor.textContent = `Tweets by @${X_HANDLE}`;
        
        container.appendChild(timelineAnchor);
        
        // Trigger Twitter widget rendering
        if (window.twttr?.widgets?.load) {
            window.twttr.widgets.load(container);
        }
    }
    
    /**
     * Shows the X feed modal and loads the timeline
     */
    function showXFeedModal() {
        if (!elements.xFeedOverlay) return;
        
        state.xFeedVisible = true;
        elements.xFeedOverlay.classList.add('visible');
        
        // Load Twitter script and render timeline
        loadTwitterWidgetsOnce()
            .then(() => {
                renderXTimeline(elements.xFeedContainer);
            })
            .catch((err) => {
                console.error('Failed to load X timeline:', err);
                if (elements.xFeedContainer) {
                    elements.xFeedContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Unable to load timeline. Please try again later.</p>';
                }
            });
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
    // Initialize
    // ========================================
    function init() {
        setEmailTimestamp();
        initAccessibility();
        initClickHandler();
        initButtonEffects();
        initParallax();
        initXFeedModal();
        initImageLoading();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
