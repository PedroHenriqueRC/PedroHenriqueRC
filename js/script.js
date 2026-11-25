/* Interações da página e modal de projetos. */

document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const navbarEl = document.getElementById("navbar");
    const menuToggleEl = document.getElementById("menu-toggle");
    const navigationEl = document.querySelector(".main-navigation");
    const navLinks = document.querySelectorAll(".nav-link");

    const cursorGlowEl = document.querySelector(".cursor-glow");
    const readingProgressBarEl = document.getElementById("reading-progress-bar");
    const backToTopEl = document.getElementById("back-to-top");
    const resumeTriggerEl = document.getElementById("resume-trigger");
    const resumeMenuEl = document.getElementById("resume-menu");

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
    const modalVisualEl = document.getElementById("modal-visual");

    let projectCards = document.querySelectorAll(".projects-section .project-card, .academic-section .project-card");
    const sections = document.querySelectorAll("main section[id]");

    // Estado do modal (fonte unica da verdade para seu ciclo de vida)
    const __modalState = {
        isOpen: false,
        isClosing: false,
        savedScrollY: 0,
        lastFocused: null,
        removeFocusTrap: null,
        closeClickHandler: null,
        overlayClickHandler: null,
    };

    // Os projetos serao carregados de assets/data/projects.json (fonte unica da verdade)
    let projects = [];

    async function carregarProjetos() {
        // Orienta sobre o uso de file://, que impede o funcionamento de fetch
        if (window.location.protocol === 'file:') {
            console.error('Carregamento de projetos falhou: o navegador foi aberto via file://. Inicie um servidor HTTP local para testar (por exemplo: python3 -m http.server) e acesse via http://localhost:8000');
            return;
        }

        try {
            // Resolve a URL em relacao ao documento atual para funcionar no GitHub Pages
            const url = new URL('assets/data/projects.json', window.location.href).href;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Falha ao carregar projects.json: ${res.status}`);
            projects = await res.json();
        } catch (err) {
            console.error('Erro ao carregar projects.json:', err);
            projects = [];
        }

        // Inicializa os comportamentos dos projetos somente se os dados forem carregados
        if (projects && projects.length) {
            try {
            inicializarModalDeProjetos();
            } catch (e) {
                console.error('Erro ao inicializar o modal de projetos:', e);
            }
        } else {
            console.warn('Nenhum projeto carregado. Os modais só funcionarão quando assets/data/projects.json estiver acessível via HTTP.');
        }
    }

    /* ---------------------- Funcoes auxiliares ---------------------- */
    function encontrarProjetoPorId(id) {
        return projects.find((p) => p.id === id);
    }

    function atualizarTempoDeTrabalho() {
        const durationEl = document.getElementById("calctempotrabalho");
        if (!durationEl) return;

        const match = durationEl.dataset.startDate?.match(/^(\d{4})-(\d{2})$/);
        if (!match) return;

        const startYear = Number(match[1]);
        const startMonth = Number(match[2]);
        if (startMonth < 1 || startMonth > 12) return;

        const dataFixaParaTeste = null; 
        const now = dataFixaParaTeste ? new Date(`${dataFixaParaTeste}T09:00:00`) : new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const startMonthIndex = startYear * 12 + startMonth - 1;
        const currentMonthIndex = currentYear * 12 + currentMonth - 1;

        if (currentMonthIndex < startMonthIndex) {
            const startLabel = new Date(startYear, startMonth - 1, 1).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric"
            });
            durationEl.textContent = `início previsto para ${startLabel}`;
            return;
        }

        const elapsedMonths = currentMonthIndex - startMonthIndex + 1;
        const years = Math.floor(elapsedMonths / 12);
        const months = elapsedMonths % 12;
        const parts = [];

        if (years > 0) parts.push(`${years} ${years === 1 ? "ano" : "anos"}`);
        if (months > 0) parts.push(`${months} ${months === 1 ? "mês" : "meses"}`);

        durationEl.textContent = parts.join(" e ");
    }

    // Limpa o fragmento da URL sem navegar nem criar uma entrada no historico
    function limparHashDoProjeto() {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        try { window.history.replaceState(null, document.title, cleanUrl); } catch (e) { /* ignorar */ }
    }

    /* ----------------- Navegacao (desktop) ---------------- */
    function inicializarNavegacao() {
        function atualizarBarraDeNavegacao() {
            if (!navbarEl) return;
            if (window.scrollY > 40) navbarEl.classList.add("scrolled");
            else navbarEl.classList.remove("scrolled");
        }

        function atualizarNavegacaoAtiva() {
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

        atualizarBarraDeNavegacao();
        atualizarNavegacaoAtiva();

        window.addEventListener("scroll", atualizarBarraDeNavegacao, { passive: true });
        window.addEventListener("scroll", atualizarNavegacaoAtiva, { passive: true });

        // Rolagem suave considerando a altura da barra de navegacao
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

    /* ---------------- Menu movel (acessivel) --------------- */
    function inicializarMenuMovel() {
        if (!menuToggleEl || !navigationEl) return;

        // Cria a sobreposicao caso ainda nao exista
        let menuOverlay = document.querySelector(".menu-overlay");
        if (!menuOverlay) {
            menuOverlay = document.createElement("div");
            menuOverlay.className = "menu-overlay";
            document.body.appendChild(menuOverlay);
        }

        function abrirMenuMovel() {
            navigationEl.classList.add("active");
            menuToggleEl.classList.add("active");
            menuToggleEl.setAttribute("aria-expanded", "true");
            menuToggleEl.setAttribute("aria-label", "Fechar menu");
            document.body.classList.add("menu-open");
            navigationEl.setAttribute("aria-hidden", "false");
            menuOverlay.classList.add("active");
            // Move o foco para o primeiro link de navegacao por acessibilidade
            const firstNav = navigationEl.querySelector('.nav-link');
            if (firstNav && typeof firstNav.focus === 'function') firstNav.focus();
        }

        function fecharMenuMovel() {
            navigationEl.classList.remove("active");
            menuToggleEl.classList.remove("active");
            menuToggleEl.setAttribute("aria-expanded", "false");
            menuToggleEl.setAttribute("aria-label", "Abrir menu");
            document.body.classList.remove("menu-open");
            navigationEl.setAttribute("aria-hidden", "true");
            menuOverlay.classList.remove("active");
            // Devolve o foco ao botao de menu
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

        navLinks.forEach((link) => link.addEventListener("click", () => fecharMenuMovel()));

        menuOverlay.addEventListener("click", fecharMenuMovel);

        // Fecha ao pressionar Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navigationEl.classList.contains("active")) fecharMenuMovel();
        });

        // Garante que o menu feche ao redimensionar a janela
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                navigationEl.classList.remove("active");
                menuToggleEl.classList.remove("active");
                menuToggleEl.setAttribute("aria-expanded", "false");
                document.body.classList.remove("menu-open");
                navigationEl.setAttribute("aria-hidden", "false");
                // Remove a sobreposicao ao alternar para o layout desktop
                if (menuOverlay && menuOverlay.classList) menuOverlay.classList.remove('active');
            }
        });
    }

    /* ---------------- Brilho do cursor (somente desktop) ------------- */
    function inicializarBrilhoDoCursor() {
        if (!cursorGlowEl || prefersReducedMotion) return;
        let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
        let rafId = null;

        function animarBrilhoDoCursor() {
            glowX += (mouseX - glowX) * 0.12;
            glowY += (mouseY - glowY) * 0.12;
            cursorGlowEl.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
            rafId = requestAnimationFrame(animarBrilhoDoCursor);
        }

        function iniciarAnimacaoDoCursor() {
            if (rafId) return;
            rafId = requestAnimationFrame(animarBrilhoDoCursor);
        }

        function pararAnimacaoDoCursor() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; iniciarAnimacaoDoCursor(); }, { passive: true });
        document.addEventListener('mouseenter', () => cursorGlowEl.classList.add('visible'));
        document.addEventListener('mouseleave', () => { cursorGlowEl.classList.remove('visible'); pararAnimacaoDoCursor(); });

        const interactiveElements = document.querySelectorAll('a, button, .project-card, .profile-card');
        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', () => cursorGlowEl.classList.add('cursor-large'));
            el.addEventListener('mouseleave', () => cursorGlowEl.classList.remove('cursor-large'));
        });
    }

    /* ---------------- Revelacao ao rolar (IntersectionObserver) --- */
    function inicializarRevelacaoAoRolar() {
        const animatedElements = document.querySelectorAll(
            ".section-header, .about-content, .profile-card, .timeline-item, .project-card, .academic-project-card, .impact-card, .skills-column, .technology-cloud, .knowledge-content, .certification-card, .contact-content"
        );

        // Usa o atributo data-reveal e a classe .revealed definidos no CSS
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

    /* ---------------- Modal de projetos (acessivel) ------------- */
    function inicializarModalDeProjetos() {
        if (!projectModalEl) return;

        const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

        // Cria um mapa dos artigos existentes com seus identificadores e valores data-project
        const hashProjectMap = {};
        document.querySelectorAll('.projects-grid article[id]').forEach((el) => {
            const id = el.getAttribute('id');
            const projectKey = el.dataset.project;
            if (id && projectKey) hashProjectMap[id] = projectKey;
        });

        // Abre o modal a partir do fragmento da URL
        function abrirModalPeloHash() {
            const projectId = hashProjectMap[window.location.hash.slice(1)];
            if (projectId) abrirModalDoProjeto(projectId);
        }

        // Mantem o foco no modal usando o seletor de elementos focaveis
        function manterFocoNoModal(container) {
            const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter(el => {
                try { return !(el.offsetWidth === 0 && el.offsetHeight === 0) || el.getAttribute('tabindex') === '0'; }
                catch (e) { return true; }
            });
            if (!focusable.length) return null;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            function tratarTeclaNoModal(e) {
                if (e.key === 'Escape') { e.preventDefault(); fecharModalDoProjeto(); return; }
                if (e.key !== 'Tab') return;
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }

            function manterFocoDentroDoModal(e) {
                if (!container.contains(e.target)) {
                    e.stopPropagation();
                    try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
                }
            }

            document.addEventListener('keydown', tratarTeclaNoModal);
            document.addEventListener('focusin', manterFocoDentroDoModal);

            return () => { document.removeEventListener('keydown', tratarTeclaNoModal); document.removeEventListener('focusin', manterFocoDentroDoModal); };
        }

        function renderizarVisualAcademico(project) {
            if (!modalVisualEl) return;
            modalVisualEl.replaceChildren();
            modalVisualEl.hidden = !project.visual;
            if (!project.visual) return;

            const visual = project.visual;
            const figure = document.createElement("figure");
            figure.className = "academic-visual-screen";
            figure.dataset.visualType = visual.type;
            figure.setAttribute("aria-label", `Painel conceitual do projeto ${project.title}`);

            const header = document.createElement("div");
            header.className = "academic-visual-header";
            const monogram = document.createElement("span");
            monogram.className = "academic-visual-monogram";
            monogram.textContent = visual.monogram;
            const heading = document.createElement("div");
            heading.className = "academic-visual-heading";
            const eyebrow = document.createElement("span");
            eyebrow.textContent = visual.eyebrow;
            const title = document.createElement("h3");
            title.textContent = visual.title;
            heading.append(eyebrow, title);
            header.append(monogram, heading);
            figure.appendChild(header);

            const navigation = document.createElement("div");
            navigation.className = "academic-visual-navigation";
            visual.navigation.forEach((item) => {
                const label = document.createElement("span");
                label.textContent = item;
                navigation.appendChild(label);
            });
            figure.appendChild(navigation);

            const cards = document.createElement("div");
            cards.className = "academic-visual-cards";
            visual.cards.forEach((item) => {
                const card = document.createElement("div");
                card.className = "academic-visual-card";
                const label = document.createElement("span");
                label.textContent = item.label;
                const value = document.createElement("strong");
                value.textContent = item.value;
                card.append(label, value);
                cards.appendChild(card);
            });
            figure.appendChild(cards);

            const flow = document.createElement("div");
            flow.className = "academic-visual-flow";
            visual.flow.forEach((item, index) => {
                const step = document.createElement("span");
                step.textContent = item;
                flow.appendChild(step);
                if (index < visual.flow.length - 1) {
                    const arrow = document.createElement("i");
                    arrow.setAttribute("aria-hidden", "true");
                    flow.appendChild(arrow);
                }
            });
            figure.appendChild(flow);

            if (visual.bars?.length) {
                const chart = document.createElement("div");
                chart.className = "academic-visual-chart";
                chart.setAttribute("aria-hidden", "true");
                visual.bars.forEach((height) => {
                    const bar = document.createElement("i");
                    bar.style.setProperty("--bar-height", `${height}%`);
                    chart.appendChild(bar);
                });
                figure.appendChild(chart);
            }

            const caption = document.createElement("figcaption");
            caption.textContent = visual.caption;
            figure.appendChild(caption);
            modalVisualEl.appendChild(figure);
        }

        // Usa __modalState como fonte do estado do modal
        function abrirModalDoProjeto(projectId) {
            if (__modalState.isOpen || __modalState.isClosing) return;
            const project = encontrarProjetoPorId(projectId);
            if (!project) { console.warn(`Projeto \"${projectId}\" não encontrado.`); return; }

            // Preenche o conteudo do modal
            if (modalCategoryEl) modalCategoryEl.textContent = project.category;
            if (modalTitleEl) modalTitleEl.textContent = project.title;
            if (modalDescriptionEl) modalDescriptionEl.textContent = project.description;
            projectModalEl.classList.toggle("is-academic", project.type === "academic");
            renderizarVisualAcademico(project.type === "academic" ? project : {});
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
            console.debug('[modal] abrirModalDoProjeto:', projectId, 'savedScrollY=', __modalState.savedScrollY, 'lastFocused=', __modalState.lastFocused && (__modalState.lastFocused.id || __modalState.lastFocused.className || __modalState.lastFocused.tagName));
            console.debug('[modal] activeElement after open:', document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName));

            // Bloqueia a rolagem da pagina
            __modalState.savedScrollY = window.scrollY || window.pageYOffset || 0;
            document.documentElement.style.setProperty('--scroll-y', `${__modalState.savedScrollY}px`);
            document.body.style.position = 'fixed';
            document.body.style.top = `-${__modalState.savedScrollY}px`;
            document.body.classList.add('modal-open');

            // Exibe o modal
            projectModalEl.classList.add('active');
            projectModalEl.setAttribute('aria-hidden', 'false');
            __modalState.isOpen = true;

            // Move o foco para o botao de fechar o modal
            try { if (modalCloseEl && typeof modalCloseEl.focus === 'function') modalCloseEl.focus({ preventScroll: true }); }
            catch (e) { if (modalCloseEl && typeof modalCloseEl.focus === 'function') modalCloseEl.focus(); }

            // Depois de focar o modal, oculta o conteudo principal das tecnologias assistivas
            const main = document.querySelector('main');
            if (main) { try { main.inert = true; } catch (e) {} main.setAttribute('aria-hidden', 'true'); }

            __modalState.removeFocusTrap = manterFocoNoModal(projectModalEl);

            // Registra os manipuladores de fechamento sem duplicacao
            if (!__modalState.closeClickHandler && modalCloseEl) {
                __modalState.closeClickHandler = (e) => { e.preventDefault(); fecharModalDoProjeto(); };
                modalCloseEl.addEventListener('click', __modalState.closeClickHandler);
                // Remove o foco ativo antes do clique para evitar ocultar um modal que ainda o contenha
                if (!__modalState.closePointerHandler) {
                    __modalState.closePointerHandler = () => {
                        try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (err) { /* ignorar */ }
                        console.debug('[modal] pointerdown: blurred activeElement before click');
                    };
                    modalCloseEl.addEventListener('pointerdown', __modalState.closePointerHandler);
                }
            }
            if (!__modalState.overlayClickHandler && modalOverlayEl) {
                __modalState.overlayClickHandler = (e) => { if (e.target === modalOverlayEl) fecharModalDoProjeto(); };
                modalOverlayEl.addEventListener('click', __modalState.overlayClickHandler);
            }
        }

        function fecharModalDoProjeto() {
            if (!__modalState.isOpen || __modalState.isClosing) return;
            __modalState.isClosing = true;

            // Remove imediatamente a restricao de foco para liberar Tab e Escape
            if (typeof __modalState.removeFocusTrap === 'function') { __modalState.removeFocusTrap(); __modalState.removeFocusTrap = null; }

            // Restaura a acessibilidade do conteudo principal antes de devolver o foco
            const main = document.querySelector('main');
            if (main) {
                try { main.inert = false; } catch (e) { /* inert pode nao ser suportado */ }
                main.setAttribute('aria-hidden', 'false');
            }

            // Restaurar o conteúdo principal antes de transferir o foco
            const opener = __modalState.lastFocused;

            // Tenta devolver o foco ao elemento que abriu o modal
            if (opener && opener.isConnected && typeof opener.focus === 'function') {
                try { opener.focus({ preventScroll: true }); } catch (e) { try { opener.focus(); } catch (e2) { /* ignorar */ } }
            } else {
                // Se o elemento de origem nao estiver disponivel, cria um elemento temporario fora da tela
                // e move o foco para ele antes de aplicar aria-hidden ao modal
                let tmp = null;
                try {
                    tmp = document.createElement('div');
                    tmp.tabIndex = -1;
                    tmp.setAttribute('aria-hidden', 'true');
                    tmp.style.position = 'absolute';
                    tmp.style.left = '-9999px';
                    tmp.style.width = '1px';
                    tmp.style.height = '1px';
                    document.body.appendChild(tmp);
                    try { tmp.focus({ preventScroll: true }); } catch (e) { try { tmp.focus(); } catch (e2) { /* ignorar */ } }
                } catch (e) {
                    /* Ignora falhas ao criar o elemento temporario de foco */
                } finally {
                    try { if (tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp); } catch (e) { /* ignorar */ }
                }
            }

            // Só ocultar o modal se o foco realmente saiu dele. Tentar um blur como último recurso.
            if (!projectModalEl.contains(document.activeElement)) {
                projectModalEl.setAttribute('aria-hidden', 'true');
            } else {
                try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) { /* ignorar */ }

                if (!projectModalEl.contains(document.activeElement)) {
                    projectModalEl.setAttribute('aria-hidden', 'true');
                } else {
                    console.error('[modal] Não foi possível transferir o foco para fora do modal.');
                    __modalState.isClosing = false;
                    return;
                }
            }

            // Calcula a duracao da transicao ou animacao e define um limite de seguranca
            const computed = window.getComputedStyle(projectModalEl);
            const duration = Math.max(parseFloat(computed.transitionDuration || '0') || 0, parseFloat(computed.animationDuration || '0') || 0) * 1000;
            const fallback = Math.max(200, Math.ceil(duration + 80));

            let finished = false;
            function finalizarFechamentoDoModal() {
                if (finished) return; finished = true;

                // Oculta o modal
                projectModalEl.classList.remove('active');
                // Restaura o posicionamento do corpo para permitir rolagem novamente
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.classList.remove('modal-open');

                // Restaura a posicao da rolagem sem animacao
                const y = __modalState.savedScrollY || 0;
                try { document.documentElement.classList.add('disable-smooth-scroll'); } catch (e) { /* ignorar */ }
                try {
                    window.scrollTo(0, y);
                } catch (e) {
                    /* ignorar */
                }
                // Remove a classe em seguida para reativar a rolagem suave
                setTimeout(() => { try { document.documentElement.classList.remove('disable-smooth-scroll'); } catch (e) { /* ignorar */ } }, 60);

                // Tenta focar novamente o elemento de origem depois de restaurar a rolagem
                if (__modalState.lastFocused && typeof __modalState.lastFocused.focus === 'function') {
                    try { __modalState.lastFocused.focus({ preventScroll: true }); } catch (err) { try { __modalState.lastFocused.focus(); } catch (err2) { /* ignorar */ } }
                }

                // Remove os manipuladores de eventos
                if (__modalState.closeClickHandler && modalCloseEl) { modalCloseEl.removeEventListener('click', __modalState.closeClickHandler); __modalState.closeClickHandler = null; }
                if (__modalState.overlayClickHandler && modalOverlayEl) { modalOverlayEl.removeEventListener('click', __modalState.overlayClickHandler); __modalState.overlayClickHandler = null; }
                if (__modalState.closePointerHandler && modalCloseEl) { modalCloseEl.removeEventListener('pointerdown', __modalState.closePointerHandler); __modalState.closePointerHandler = null; }

                // Limpa o fragmento da URL, se houver
                try { limparHashDoProjeto(); } catch (e) { /* ignorar */ }

                __modalState.isOpen = false; __modalState.isClosing = false;
            }

            let settled = false;
            const aoFinalizarTransicao = (e) => { if (e && e.target !== projectModalEl) return; if (settled) return; settled = true; projectModalEl.removeEventListener('transitionend', aoFinalizarTransicao); finalizarFechamentoDoModal(); };
            projectModalEl.addEventListener('transitionend', aoFinalizarTransicao);
            setTimeout(() => { if (!settled) aoFinalizarTransicao(); }, fallback);
        }

        // Associa a abertura do modal aos cartoes e botoes
        projectCards.forEach((card) => {
            const projectId = card.dataset.project;
            if (!projectId) return;
            card.addEventListener('click', (ev) => { if (ev.target.closest('.project-button')) return; abrirModalDoProjeto(projectId); });
            const btn = card.querySelector('.project-button');
            if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); abrirModalDoProjeto(projectId); });
        });

        // Abre o modal pelo fragmento da URL, se houver
        window.addEventListener('hashchange', abrirModalPeloHash);
        abrirModalPeloHash();
    }

    /* ---------------- Interacao com cartoes de projetos ------------- */
    function inicializarCartoesDeProjetos() {
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

    /* ---------------- Efeitos de paralaxe e titulo do destaque --------- */
    function inicializarEfeitosDoDestaque() {
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

    /* ---------------- Interacao ao passar sobre tecnologias ------------------- */
    function inicializarInteracoesDeTecnologias() {
        const items = document.querySelectorAll('.technology-cloud span');
        items.forEach((item) => {
            item.addEventListener('mouseenter', () => item.classList.add('technology-active'));
            item.addEventListener('mouseleave', () => item.classList.remove('technology-active'));
        });
    }

    /* ---------------- Acoes do curriculo ----------------------- */
    function inicializarMenuDoCurriculo() {
        if (!resumeTriggerEl || !resumeMenuEl) return;

        function fecharMenuDoCurriculo() {
            resumeMenuEl.hidden = true;
            resumeTriggerEl.setAttribute("aria-expanded", "false");
        }

        function alternarMenuDoCurriculo() {
            const isOpen = resumeMenuEl.hidden;
            resumeMenuEl.hidden = !isOpen;
            resumeTriggerEl.setAttribute("aria-expanded", String(isOpen));
        }

        resumeTriggerEl.addEventListener("click", alternarMenuDoCurriculo);
        resumeMenuEl.querySelectorAll("a").forEach((link) => link.addEventListener("click", fecharMenuDoCurriculo));
        const downloadLink = resumeMenuEl.querySelector(".resume-download");
        if (downloadLink) {
            downloadLink.addEventListener("click", async (event) => {
                event.preventDefault();
                downloadLink.setAttribute("aria-busy", "true");

                try {
                    const response = await fetch(downloadLink.href);
                    if (!response.ok) throw new Error(`Falha ao baixar o curriculo: ${response.status}`);

                    const pdfBlob = await response.blob();
                    const blobUrl = URL.createObjectURL(pdfBlob);
                    const temporaryLink = document.createElement("a");
                    temporaryLink.href = blobUrl;
                    temporaryLink.download = downloadLink.getAttribute("download") || "curriculo.pdf";
                    document.body.appendChild(temporaryLink);
                    temporaryLink.click();
                    temporaryLink.remove();
                    URL.revokeObjectURL(blobUrl);
                } catch (error) {
                    // Alternativa para visualizacoes locais ou navegadores que bloqueiam downloads Blob.
                    window.location.href = downloadLink.href;
                } finally {
                    downloadLink.removeAttribute("aria-busy");
                }
            });
        }
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".resume-action")) fecharMenuDoCurriculo();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") fecharMenuDoCurriculo();
        });
    }

    /* ---------------- Progresso de leitura e botao de topo ----- */
    function inicializarUtilitariosDeRolagem() {
        if (!readingProgressBarEl && !backToTopEl) return;

        let ticking = false;

        function atualizarUtilitariosDeRolagem() {
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = documentHeight > 0 ? Math.min(100, (window.scrollY / documentHeight) * 100) : 0;
            if (readingProgressBarEl) readingProgressBarEl.style.width = `${progress}%`;
            if (backToTopEl) backToTopEl.classList.toggle("is-visible", window.scrollY > 560);
            ticking = false;
        }

        function solicitarAtualizacaoDaRolagem() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(atualizarUtilitariosDeRolagem);
        }

        atualizarUtilitariosDeRolagem();
        window.addEventListener("scroll", solicitarAtualizacaoDaRolagem, { passive: true });
        window.addEventListener("resize", solicitarAtualizacaoDaRolagem, { passive: true });

        if (backToTopEl) {
            backToTopEl.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
            });
        }
    }

    /* ---------------- Inicializacao ----------------------- */
    atualizarTempoDeTrabalho();
    inicializarNavegacao();
    inicializarMenuMovel();
    inicializarBrilhoDoCursor();
    inicializarRevelacaoAoRolar();
    // Carrega os projetos e inicializa o modal quando os dados estiverem prontos
    carregarProjetos();
    inicializarCartoesDeProjetos();
    inicializarEfeitosDoDestaque();
    inicializarInteracoesDeTecnologias();
    inicializarUtilitariosDeRolagem();
    inicializarMenuDoCurriculo();

    // Atualiza a lista de cartoes caso o DOM tenha mudado
    projectCards = document.querySelectorAll('.projects-section .project-card, .academic-section .project-card');
});
