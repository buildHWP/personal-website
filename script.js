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
        flipInterval: 1,              // Ms between character flips (already at minimum)
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

        // Initialize fireworks for continue button
        initFireworks();
        
        // Fireworks on hover for continue button
        btn.addEventListener('mouseenter', () => {
            startContinueFireworks(btn);
        });
        
        btn.addEventListener('mouseleave', () => {
            stopContinueFireworks();
        });

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
        // Already loaded and ready
        if (state.twitterScriptLoaded && window.twttr?.widgets?.createTimeline) {
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
                if (window.twttr?.widgets?.createTimeline) {
                    state.twitterScriptLoaded = true;
                    resolve();
                    return;
                }
            }
            
            // Set up twttr ready callback
            window.twttr = window.twttr || {};
            window.twttr.ready = window.twttr.ready || function(cb) {
                if (window.twttr.widgets) {
                    cb(window.twttr);
                } else {
                    window.twttr._e = window.twttr._e || [];
                    window.twttr._e.push(cb);
                }
            };
            
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            
            script.onload = () => {
                // Wait for twttr to be fully ready
                window.twttr.ready((twttr) => {
                    state.twitterScriptLoaded = true;
                    resolve();
                });
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
     * Uses the exact embed code from Twitter Publish
     * @param {HTMLElement} container - The container element
     */
    function renderXTimeline(container) {
        if (!container) return;
        
        // Clear existing content to prevent duplicates
        container.innerHTML = '';
        
        // Create timeline anchor using exact Twitter Publish format
        const timelineAnchor = document.createElement('a');
        timelineAnchor.className = 'twitter-timeline';
        timelineAnchor.setAttribute('data-width', '720');
        timelineAnchor.setAttribute('data-height', '500');
        timelineAnchor.setAttribute('data-theme', 'dark');
        timelineAnchor.href = `https://twitter.com/${X_HANDLE}?ref_src=twsrc%5Etfw`;
        timelineAnchor.textContent = `Tweets by ${X_HANDLE}`;
        
        container.appendChild(timelineAnchor);
        
        // Trigger widget rendering
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

    function initFireworks() {
        // Create fireworks container
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
            // Performance limit: skip creating spark if too many active
            if (activeSparkCount >= FIREWORKS_CONFIG.maxActiveSparks) {
                return;
            }
            
            const spark = document.createElement('div');
            spark.className = 'firework-spark';
            
            const color = Math.random() < 0.3 ? baseColor : getRandomColor();
            // Random spark size within tier range (2-5px as per spec)
            const sparkSize = randomRange(config.sparkSizeMin, config.sparkSizeMax);
            
            spark.style.background = color.value;
            spark.style.width = sparkSize + 'px';
            spark.style.height = sparkSize + 'px';
            spark.style.left = startX + 'px';
            spark.style.top = startY + 'px';
            // Ultra-lightweight: minimal glow, no box-shadow for better performance
            spark.style.willChange = 'transform, opacity';
            spark.style.transform = 'translate3d(-50%, -50%, 0)'; // GPU acceleration
            // Use filter for lighter glow effect instead of box-shadow
            spark.style.filter = `drop-shadow(0 0 ${sparkSize * 0.8}px ${color.value})`;
            
            fireworksContainer.appendChild(spark);
            activeSparkCount++;
            
            const radius = customRadius || config.radius;
            const velocity = randomRange(0.8, 1.2);
            const finalX = startX + Math.cos(angle) * radius * velocity;
            const finalY = startY + Math.sin(angle) * radius * velocity;
            
            const startTime = performance.now();
            const lifetime = config.lifetime;
            let wigglePhase = Math.random() * Math.PI * 2;
            let wiggleAmplitude = randomRange(2, 5);
            
            function animateSpark(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / lifetime, 1);
                
                if (progress >= 1) {
                    spark.remove();
                    activeSparkCount--;
                    return;
                }
                
                // Easing: fast out, slow decay
                const eased = 1 - Math.pow(1 - progress, 2);
                
                // Position
                let currentX = startX + (finalX - startX) * eased;
                let currentY = startY + (finalY - startY) * eased;
                
                // Gravity (stronger for willow)
                const gravity = isWillow ? config.gravity * 1.5 : config.gravity;
                currentY += gravity * elapsed * elapsed * 0.001;
                
                // Willow sideways drift
                if (isWillow && progress > 0.5) {
                    currentX += Math.sin(elapsed * 0.01) * 2 * (progress - 0.5);
                }
                
                // Reduced micro-wiggle (40% less frequent updates for better performance)
                const wiggleDecay = 1 - progress;
                const wiggleX = Math.sin(wigglePhase) * wiggleAmplitude * wiggleDecay * 0.6; // 40% reduction
                const wiggleY = Math.cos(wigglePhase * 1.3) * wiggleAmplitude * wiggleDecay * 0.6; // 40% reduction
                wigglePhase += 0.06; // Slower phase update (40% reduction)
                
                currentX += wiggleX;
                currentY += wiggleY;
                
                // Spiral rotation - reduced intensity for 40% better performance
                if (spiralProgress !== null) {
                    const spiralAngle = spiralProgress * Math.PI * 4 + elapsed * 0.006; // 40% slower
                    const spiralOffsetX = Math.cos(spiralAngle) * 6 * (1 - progress); // 40% reduction
                    const spiralOffsetY = Math.sin(spiralAngle) * 6 * (1 - progress); // 40% reduction
                    currentX += spiralOffsetX;
                    currentY += spiralOffsetY;
                }
                
                // Aggressive viewport culling: skip DOM updates if spark is far off-screen
                const viewportPadding = 100; // Further reduced padding (40% reduction)
                const isOffScreen = currentX < -viewportPadding || currentX > window.innerWidth + viewportPadding ||
                    currentY < -viewportPadding || currentY > window.innerHeight + viewportPadding;
                
                if (isOffScreen && progress > 0.6) {
                    // Remove if far off-screen and mostly faded (earlier removal - 40% improvement)
                    spark.remove();
                    activeSparkCount--;
                    return;
                }
                
                // Throttle updates: only update every other frame when off-screen or fading
                const shouldUpdate = !isOffScreen || progress < 0.4;
                if (shouldUpdate) {
                    // Use translate3d for GPU acceleration
                    spark.style.transform = `translate3d(${currentX - startX}px, ${currentY - startY}px, 0)`;
                    spark.style.opacity = 1 - progress;
                } else {
                    // Skip DOM update for off-screen sparks (40% fewer updates)
                    // Still continue animation for physics calculations
                }
                
                // Crossette split - only if under spark limit (reduced to 2 splits for 40% less)
                if (splitDelay !== null && elapsed > splitDelay && !spark.dataset.split) {
                    spark.dataset.split = 'true';
                    // Create only 2 perpendicular sparks (reduced from 4) for better performance
                    if (activeSparkCount + 2 <= FIREWORKS_CONFIG.maxActiveSparks) {
                        for (let i = 0; i < 2; i++) {
                            const splitAngle = angle + (i * Math.PI);
                            createSpark(currentX, currentY, splitAngle, config, color, 0);
                        }
                    }
                    spark.remove();
                    activeSparkCount--;
                    return;
                }
                
                requestAnimationFrame(animateSpark);
            }
            
            requestAnimationFrame(animateSpark);
        }, delay);
    }

    function fireBurst(button, count = FIREWORKS_CONFIG.initialBurstMin) {
        for (let i = 0; i < count; i++) {
            const delay = Math.random() * FIREWORKS_CONFIG.rocketStagger;
            launchRocket(button, delay);
        }
    }

    function startFireworks(button) {
        if (!fireworksContainer) initFireworks();
        
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
        if (!fireworksContainer) initFireworks();
        
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
        
        // Initialize fireworks
        initFireworks();
        
        // #region agent log
        // Measure dimensions after icon is rendered
        setTimeout(() => {
            const rect = elements.emailIcon.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(elements.emailIcon);
            const svg = elements.emailIcon.querySelector('.email-icon-svg');
            const svgRect = svg ? svg.getBoundingClientRect() : null;
            
            fetch('http://127.0.0.1:7242/ingest/8cbfede0-90f6-438a-85b5-ebf8c832d699',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:initEmailIcon',message:'Email icon dimensions measurement',data:{containerWidth:rect.width,containerHeight:rect.height,containerTop:rect.top,containerLeft:rect.left,borderWidth:computedStyle.borderWidth,boxSizing:computedStyle.boxSizing,padding:computedStyle.padding,svgWidth:svgRect?.width,svgHeight:svgRect?.height,cssWidth:computedStyle.width,cssHeight:computedStyle.height},timestamp:Date.now(),sessionId:'debug-session',runId:'border-debug',hypothesisId:'A'})}).catch(()=>{});
        }, 100);
        // #endregion
        
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
        initButtonEffects();
        initParallax();
        initXFeedModal();
        initEmailIcon();
        initImageLoading();
        
        // Initialize fireworks for welcome firework
        initFireworks();
        
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
