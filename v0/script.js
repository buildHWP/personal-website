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
        splitFlapDuration: 1200,      // Total time for all body text (~1.2 seconds, 3x faster)
        charsPerFlip: 1,              // Characters to flip through before settling
        flipInterval: 8,              // Ms between character flips
        prismaticEnticeDelay: 5000,   // Delay before prismatic entice effect (5 seconds)
        parallaxIntensity: 0.03
    };

    // Characters to cycle through for split-flap effect (letters only)
    const FLIP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

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
        letterContinue: document.getElementById('letter-continue')
    };

    // ========================================
    // State
    // ========================================
    let state = {
        imageLoaded: false,
        letterVisible: false,
        transitionTriggered: false,
        splitFlapRunning: false
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
                }
            }, CONFIG.prismaticEnticeDelay);
        }, 300);
    }

    // ========================================
    // Button Prismatic Effect
    // ========================================
    function initButtonEffects() {
        const btn = elements.letterContinue;
        if (!btn) return;

        btn.addEventListener('mousemove', handleButtonMouseMove);
        btn.addEventListener('mouseleave', handleButtonMouseLeave);
    }

    function handleButtonMouseMove(e) {
        const btn = this;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ox = rect.width - x;
        const oy = rect.height - y;
        
        btn.style.setProperty('--omx', `${(ox / rect.width) * 100}%`);
        btn.style.setProperty('--omy', `${(oy / rect.height) * 100}%`);
        
        const distToEdge = Math.min(x, y, rect.width - x, rect.height - y);
        const edgeIntensity = 1 - Math.min(distToEdge / 40, 1);
        const prismValue = (0.3 + edgeIntensity * 0.7).toFixed(3);
        
        btn.style.setProperty('--prism', prismValue);
    }

    function handleButtonMouseLeave() {
        this.style.setProperty('--prism', '0');
        this.style.setProperty('--omx', '50%');
        this.style.setProperty('--omy', '50%');
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
        if (state.transitionTriggered || state.splitFlapRunning) return;
        state.transitionTriggered = true;

        hideLetter();
    }

    function hideLetter() {
        elements.letterOverlay.classList.add('fade-out');
        elements.letterOverlay.classList.remove('visible');
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
        initImageLoading();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
