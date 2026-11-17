/* =========================================================
   PORTFÓLIO — PEDRO HENRIQUE
   JavaScript principal
========================================================= */

/* =========================================================
   PORTFÓLIO — PEDRO HENRIQUE
   JavaScript principal (refatorado em módulos)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const navbarEl = document.getElementById("navbar");
    const menuToggleEl = document.getElementById("menu-toggle");
    const navigationEl = document.querySelector(".main-navigation");
    const navLinks = document.querySelectorAll(".nav-link");

    const cursorGlowEl = document.querySelector(".cursor-glow");
    const readingProgressBarEl = document.getElementById("reading-progress-bar");
    const backToTopEl = document.getElementById("back-to-top");

    const projectModalEl = document.getElementById("project-modal");
    const modalOverlayEl = document.getElementById("modal-overlay");
    const modalCloseEl = document.getElementById("modal-close");

    const modalCategoryEl = document.getElementById("modal-category");
    const modalTitleEl = document.getElementById("modal-title");
    const modalDescriptionEl = document.getElementById("modal-description");
    const modalChallengeEl = document.getElementById("modal-challenge");
    const modalRoleEl = document.getElementById("modal-role");
    const modalTechnologiesEl = document.getElementById("modal-technologies");
    const modalResultEl = document.getElementById("modal-result");

    let projectCards = document.querySelectorAll(".projects-section .project-card");
    const sections = document.querySelectorAll("main section[id]");

    // Modal state (single source of truth for modal lifecycle)
    const __modalState = {
        isOpen: false,
        isClosing: false,
        savedScrollY: 0,
        lastFocused: null,
        removeFocusTrap: null,
        closeClickHandler: null,
        overlayClickHandler: null,
        docKeyHandler: null
    };

    // Projects will be loaded from assets/data/projects.json (single source of truth)
    let projects = [];

    async function loadProjects() {
        // Provide clear guidance when opening via file:// which will make fetch fail
        if (window.location.protocol === 'file:') {
            console.error('Carregamento de projetos falhou: o navegador foi aberto via file://. Inicie um servidor HTTP local para testar (por exemplo: python3 -m http.server) e acesse via http://localhost:8000');
            return;
        }

        try {
            // resolve relative to the current document URL to be robust em GitHub Pages
            const url = new URL('assets/data/projects.json', window.location.href).href;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to load projects.json: ${res.status}`);
            projects = await res.json();
        } catch (err) {
            console.error('Erro ao carregar projects.json:', err);
            projects = [];
        }

        // initialize project-related behaviors that depend on the data (only if data was loaded)
        if (projects && projects.length) {
            try {
                initProjectModal();
            } catch (e) {
                console.error('Erro ao inicializar o modal de projetos:', e);
            }
        } else {
            console.warn('Nenhum projeto carregado. Os modais só funcionarão quando assets/data/projects.json estiver acessível via HTTP.');
        }
    }

    /* ---------------------- Helpers ---------------------- */
    function findProjectById(id) {
        return projects.find((p) => p.id === id);
    }

    // Clear the URL hash without causing navigation / history entry
    function clearProjectHash() {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        try { window.history.replaceState(null, document.title, cleanUrl); } catch (e) { /* ignore */ }
    }

    /* ----------------- Navigation (desktop) ---------------- */
    function initNavigation() {
        function updateNavbar() {
            if (!navbarEl) return;
            if (window.scrollY > 40) navbarEl.classList.add("scrolled");
            else navbarEl.classList.remove("scrolled");
        }

        function updateActiveNavigation() {
            let currentSection = "";
            const scrollPosition = window.scrollY + 180;
            sections.forEach((section) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute("id");
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) currentSection = sectionId;
            });

            navLinks.forEach((link) => {
                const href = link.getAttribute("href");
                link.classList.remove("active");
                if (href === `#${currentSection}`) link.classList.add("active");
            });
        }

        updateNavbar();
        updateActiveNavigation();

        window.addEventListener("scroll", updateNavbar, { passive: true });
        window.addEventListener("scroll", updateActiveNavigation, { passive: true });

        // Smooth scroll with navbar offset
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener("click", (event) => {
                const targetId = link.getAttribute("href");
                if (!targetId || targetId === "#") return;
                const target = document.querySelector(targetId);
                if (!target) return;
                event.preventDefault();
                const navbarHeight = navbarEl ? navbarEl.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: prefersReducedMotion ? "auto" : "smooth" });
            });
        });
    }

    /* ---------------- Mobile menu (accessible) --------------- */
    function initMobileMenu() {
        if (!menuToggleEl || !navigationEl) return;

        // create overlay element if not present
        let menuOverlay = document.querySelector(".menu-overlay");
        if (!menuOverlay) {
            menuOverlay = document.createElement("div");
            menuOverlay.className = "menu-overlay";
            document.body.appendChild(menuOverlay);
        }

        function openMenu() {
            navigationEl.classList.add("active");
            menuToggleEl.classList.add("active");
            menuToggleEl.setAttribute("aria-expanded", "true");
            menuToggleEl.setAttribute("aria-label", "Fechar menu");
            document.body.classList.add("menu-open");
            navigationEl.setAttribute("aria-hidden", "false");
            menuOverlay.classList.add("active");
            // move focus to first navigation link for accessibility
            const firstNav = navigationEl.querySelector('.nav-link');
            if (firstNav && typeof firstNav.focus === 'function') firstNav.focus();
        }

        function closeMenu() {
            navigationEl.classList.remove("active");
            menuToggleEl.classList.remove("active");
            menuToggleEl.setAttribute("aria-expanded", "false");
            menuToggleEl.setAttribute("aria-label", "Abrir menu");
            document.body.classList.remove("menu-open");
            navigationEl.setAttribute("aria-hidden", "true");
            menuOverlay.classList.remove("active");
            // restore focus to the toggle button
            if (menuToggleEl && typeof menuToggleEl.focus === 'function') menuToggleEl.focus();
        }

        menuToggleEl.addEventListener("click", (e) => {
            const isOpen = navigationEl.classList.toggle("active");
            menuToggleEl.classList.toggle("active", isOpen);
            menuToggleEl.setAttribute("aria-expanded", String(isOpen));
            menuToggleEl.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
            document.body.classList.toggle("menu-open", isOpen);
            navigationEl.setAttribute("aria-hidden", String(!isOpen));
            menuOverlay.classList.toggle("active", isOpen);
        });

        navLinks.forEach((link) => link.addEventListener("click", () => closeMenu()));

        menuOverlay.addEventListener("click", closeMenu);

        // close on ESC
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navigationEl.classList.contains("active")) closeMenu();
        });

        // ensure menu closes on resize
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                navigationEl.classList.remove("active");
                menuToggleEl.classList.remove("active");
                menuToggleEl.setAttribute("aria-expanded", "false");
                document.body.classList.remove("menu-open");
                navigationEl.setAttribute("aria-hidden", "false");
                // ensure overlay is removed when switching to desktop
                if (menuOverlay && menuOverlay.classList) menuOverlay.classList.remove('active');
            }
        });
    }

    /* ---------------- Cursor glow (desktop only) ------------- */
    function initCursorGlow() {
        if (!cursorGlowEl || prefersReducedMotion) return;
        let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
        let rafId = null;

        function animate() {
            glowX += (mouseX - glowX) * 0.12;
            glowY += (mouseY - glowY) * 0.12;
            cursorGlowEl.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
            rafId = requestAnimationFrame(animate);
        }

        function start() {
            if (rafId) return;
            rafId = requestAnimationFrame(animate);
        }

        function stop() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; start(); }, { passive: true });
        document.addEventListener('mouseenter', () => cursorGlowEl.classList.add('visible'));
        document.addEventListener('mouseleave', () => { cursorGlowEl.classList.remove('visible'); stop(); });

        const interactiveElements = document.querySelectorAll('a, button, .project-card, .profile-card');
        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', () => cursorGlowEl.classList.add('cursor-large'));
            el.addEventListener('mouseleave', () => cursorGlowEl.classList.remove('cursor-large'));
        });
    }

    /* ---------------- Scroll reveal (IntersectionObserver) --- */
    function initScrollReveal() {
        const animatedElements = document.querySelectorAll(
            ".section-header, .about-content, .profile-card, .timeline-item, .featured-project, .project-card, .academic-project-card, .impact-card, .skills-column, .technology-cloud, .knowledge-content, .objective-content, .certification-card, .contact-content"
        );

        // Use the data-reveal attribute and .revealed class expected by CSS
        animatedElements.forEach((el) => el.setAttribute('data-reveal', ''));

        if ("IntersectionObserver" in window && !prefersReducedMotion) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

            animatedElements.forEach((el) => observer.observe(el));
        } else {
            animatedElements.forEach((el) => el.classList.add('revealed'));
        }
    }

    /* ---------------- Project modal (accessible) ------------- */
    function initProjectModal() {
        if (!projectModalEl) return;

        const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

        // build map from existing articles with ids to their data-project values
        const hashProjectMap = {};
        document.querySelectorAll('.projects-grid article[id]').forEach((el) => {
            const id = el.getAttribute('id');
            const projectKey = el.dataset.project;
            if (id && projectKey) hashProjectMap[id] = projectKey;
        });

        // helper: open from hash
        function openModalFromHash() {
            const projectId = hashProjectMap[window.location.hash.slice(1)];
            if (projectId) openModal(projectId);
        }

        // focus trap function reuses global focusableSelector
        function trapFocusIn(container) {
            const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter(el => {
                try { return !(el.offsetWidth === 0 && el.offsetHeight === 0) || el.getAttribute('tabindex') === '0'; }
                catch (e) { return true; }
            });
            if (!focusable.length) return null;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            function handleKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
                if (e.key !== 'Tab') return;
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }

            function handleFocusIn(e) {
                if (!container.contains(e.target)) {
                    e.stopPropagation();
                    try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
                }
            }

            document.addEventListener('keydown', handleKey);
            document.addEventListener('focusin', handleFocusIn);

            return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('focusin', handleFocusIn); };
        }

        // openModal uses __modalState for all state
        function openModal(projectId) {
            if (__modalState.isOpen || __modalState.isClosing) return;
            const project = findProjectById(projectId);
            if (!project) { console.warn(`Projeto \"${projectId}\" não encontrado.`); return; }

            // fill modal
            if (modalCategoryEl) modalCategoryEl.textContent = project.category;
            if (modalTitleEl) modalTitleEl.textContent = project.title;
            if (modalDescriptionEl) modalDescriptionEl.textContent = project.description;
            if (modalChallengeEl) modalChallengeEl.textContent = project.challenge;
            if (modalRoleEl) {
                modalRoleEl.innerHTML = '';
                project.role.forEach(item => { const li = document.createElement('li'); li.textContent = item; modalRoleEl.appendChild(li); });
            }
            if (modalTechnologiesEl) {
                modalTechnologiesEl.innerHTML = '';
                project.technologies.forEach(t => { const s = document.createElement('span'); s.textContent = t; modalTechnologiesEl.appendChild(s); });
            }
            if (modalResultEl) modalResultEl.textContent = project.result;

            __modalState.lastFocused = document.activeElement;

            // lock scroll
            __modalState.savedScrollY = window.scrollY || window.pageYOffset || 0;
            document.documentElement.style.setProperty('--scroll-y', `${__modalState.savedScrollY}px`);
            document.body.style.position = 'fixed';
            document.body.style.top = `-${__modalState.savedScrollY}px`;
            document.body.classList.add('modal-open');

            // show modal
            projectModalEl.classList.add('active');
            projectModalEl.setAttribute('aria-hidden', 'false');
            __modalState.isOpen = true;

            // focus modal close
            try { if (modalCloseEl && typeof modalCloseEl.focus === 'function') modalCloseEl.focus({ preventScroll: true }); }
            catch (e) { if (modalCloseEl && typeof modalCloseEl.focus === 'function') modalCloseEl.focus(); }

            // after focus inside modal, hide main content from AT
            const main = document.querySelector('main');
            if (main) { try { main.inert = true; } catch (e) {} main.setAttribute('aria-hidden', 'true'); }

            __modalState.removeFocusTrap = trapFocusIn(projectModalEl);

            // attach close handlers idempotently
            if (!__modalState.closeClickHandler && modalCloseEl) {
                __modalState.closeClickHandler = (e) => { e.preventDefault(); closeModal(); };
                modalCloseEl.addEventListener('click', __modalState.closeClickHandler);
            }
            if (!__modalState.overlayClickHandler && modalOverlayEl) {
                __modalState.overlayClickHandler = (e) => { if (e.target === modalOverlayEl) closeModal(); };
                modalOverlayEl.addEventListener('click', __modalState.overlayClickHandler);
            }
        }

        function closeModal() {
            if (!__modalState.isOpen || __modalState.isClosing) return;
            __modalState.isClosing = true;

            // remove focus trap immediately so Tab/Escape handling stops
            if (typeof __modalState.removeFocusTrap === 'function') { __modalState.removeFocusTrap(); __modalState.removeFocusTrap = null; }

            // Restore main accessibility BEFORE moving focus back to opener
            const main = document.querySelector('main');
            if (main) {
                try { main.inert = false; } catch (e) { /* inert may be unsupported */ }
                main.setAttribute('aria-hidden', 'false');
            }

            // Restore focus to the opener without scrolling the page (preferred)
            try {
                if (__modalState.lastFocused && typeof __modalState.lastFocused.focus === 'function') {
                    __modalState.lastFocused.focus({ preventScroll: true });
                }
            } catch (err) {
                try { if (__modalState.lastFocused && typeof __modalState.lastFocused.focus === 'function') __modalState.lastFocused.focus(); } catch (e2) { /* ignore */ }
            }

            // Now hide modal for AT (safe because focus is not inside modal)
            projectModalEl.setAttribute('aria-hidden', 'true');

            // compute transition/animation duration and use a safe fallback
            const computed = window.getComputedStyle(projectModalEl);
            const duration = Math.max(parseFloat(computed.transitionDuration || '0') || 0, parseFloat(computed.animationDuration || '0') || 0) * 1000;
            const fallback = Math.max(200, Math.ceil(duration + 80));

            let finished = false;
            function finalize() {
                if (finished) return; finished = true;

                // hide visual state
                projectModalEl.classList.remove('active');

                // restore scroll position
                const y = __modalState.savedScrollY || 0;
                document.body.style.position = '';
                document.body.style.top = '';
                window.scrollTo(0, y);
                document.body.classList.remove('modal-open');

                // ensure opener has focus (best effort)
                if (__modalState.lastFocused && typeof __modalState.lastFocused.focus === 'function') {
                    try { __modalState.lastFocused.focus({ preventScroll: true }); } catch (err) { __modalState.lastFocused.focus(); }
                }

                // cleanup handlers
                if (__modalState.closeClickHandler && modalCloseEl) { modalCloseEl.removeEventListener('click', __modalState.closeClickHandler); __modalState.closeClickHandler = null; }
                if (__modalState.overlayClickHandler && modalOverlayEl) { modalOverlayEl.removeEventListener('click', __modalState.overlayClickHandler); __modalState.overlayClickHandler = null; }

                // clear hash if present (defensive)
                try { clearProjectHash(); } catch (e) { /* ignore */ }

                __modalState.isOpen = false; __modalState.isClosing = false;
            }

            let settled = false;
            const onEnd = (e) => { if (e && e.target !== projectModalEl) return; if (settled) return; settled = true; projectModalEl.removeEventListener('transitionend', onEnd); finalize(); };
            projectModalEl.addEventListener('transitionend', onEnd);
            setTimeout(() => { if (!settled) onEnd(); }, fallback);
        }

        // bind openers (cards and buttons)
        projectCards.forEach((card) => {
            const projectId = card.dataset.project;
            if (!projectId) return;
            card.addEventListener('click', (ev) => { if (ev.target.closest('.project-button')) return; openModal(projectId); });
            const btn = card.querySelector('.project-button');
            if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); openModal(projectId); });
        });

        // open from hash if present
        window.addEventListener('hashchange', openModalFromHash);
        openModalFromHash();
    }

    /* ---------------- Project cards interaction ------------- */
    function initProjectCards() {
        if (prefersReducedMotion) return;
        projectCards.forEach((card) => {
            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left; const y = event.clientY - rect.top;
                const centerX = rect.width / 2; const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -2; const rotateY = ((x - centerX) / centerX) * 2;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    /* ---------------- Hero parallax & title effects --------- */
    function initHeroEffects() {
        const hero = document.querySelector('.hero');
        const heroVisual = document.querySelector('.hero-visual');
        if (!hero || !heroVisual || prefersReducedMotion) return;
        hero.addEventListener('mousemove', (event) => {
            const rect = hero.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5; const y = (event.clientY - rect.top) / rect.height - 0.5;
            heroVisual.style.transform = `translate3d(${x * 12}px, ${y * 12}px, 0)`;
        });
        hero.addEventListener('mouseleave', () => { heroVisual.style.transform = ''; });

        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle && !prefersReducedMotion) heroTitle.classList.add('hero-title-ready');
    }

    /* ---------------- Technologies hover ------------------- */
    function initTechHover() {
        const items = document.querySelectorAll('.technology-cloud span');
        items.forEach((item) => {
            item.addEventListener('mouseenter', () => item.classList.add('technology-active'));
            item.addEventListener('mouseleave', () => item.classList.remove('technology-active'));
        });
    }

    /* ---------------- Reading progress and top button ----- */
    function initScrollUtilities() {
        if (!readingProgressBarEl && !backToTopEl) return;

        let ticking = false;

        function updateScrollUtilities() {
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = documentHeight > 0 ? Math.min(100, (window.scrollY / documentHeight) * 100) : 0;
            if (readingProgressBarEl) readingProgressBarEl.style.width = `${progress}%`;
            if (backToTopEl) backToTopEl.classList.toggle("is-visible", window.scrollY > 560);
            ticking = false;
        }

        function requestScrollUpdate() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateScrollUtilities);
        }

        updateScrollUtilities();
        window.addEventListener("scroll", requestScrollUpdate, { passive: true });
        window.addEventListener("resize", requestScrollUpdate, { passive: true });

        if (backToTopEl) {
            backToTopEl.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
            });
        }
    }

    /* ---------------- Initialization ----------------------- */
    initNavigation();
    initMobileMenu();
    initCursorGlow();
    initScrollReveal();
    // load projects (will call initProjectModal after data is ready)
    loadProjects();
    initProjectCards();
    initHeroEffects();
    initTechHover();
    initScrollUtilities();

    // refresh projectCards nodeList in case DOM changed
    projectCards = document.querySelectorAll('.projects-section .project-card');
});
