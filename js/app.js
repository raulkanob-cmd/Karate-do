// ==========================================================================
// Karate-Do Registration Form Script
// Multi-step wizard (4 pasos), validación accesible (aria-invalid / role="alert"),
// barra de progreso, confeti de celebración, resumen + envío por WhatsApp,
// theme toggle y gestión de foco del modal (patrón de diálogo ARIA).
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('karateRegistrationForm');
    const ageInput = document.getElementById('age');
    const tutorReqBadge = document.getElementById('tutorReqBadge');
    const tutorInput = document.getElementById('tutorName');
    const birthDateInput = document.getElementById('birthDate');
    const prevSportYes = document.getElementById('prevSportYes');
    const prevSportNo = document.getElementById('prevSportNo');
    const prevSportsDetailsGroup = document.getElementById('prevSportsDetailsGroup');
    const prevSportsDetailsInput = document.getElementById('previousSportsDetails');
    const successModal = document.getElementById('successModal');
    const modalCard = successModal.querySelector('.modal-card');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modalSummaryContent = document.getElementById('modalSummaryContent');
    const formAlert = document.getElementById('formAlert');
    const btnSendWhatsapp = document.getElementById('btnSendWhatsapp');

    // Wizard: pasos, progreso y navegación
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const dotButtons = Array.from(document.querySelectorAll('.progress-step'));
    const progressFill = document.getElementById('progressFill');
    const stepCounter = document.getElementById('stepCounter');
    const btnPrevStep = document.getElementById('btnPrevStep');
    const btnNextStep = document.getElementById('btnNextStep');
    const btnSubmit = document.getElementById('btnSubmit');

    // Número del dojo para el envío por WhatsApp
    const WHATSAPP_NUMBER = '5214776737908'; // +52 1 477 673 7908

    let currentStep = 1;
    let maxStepReached = 1;

    // Respeta la preferencia de "movimiento reducido" del usuario
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Guarda los textos por defecto de los mensajes de error (algunos se cambian dinámicamente)
    document.querySelectorAll('.error-msg').forEach(el => {
        el.dataset.defaultMsg = el.textContent;
    });

    // ==========================================================================
    // Light Switch (Switch de Foco) & Dark Mode Toggle Logic
    // ==========================================================================
    const lightSwitchBtn = document.getElementById('lightSwitchBtn');
    const bulbContainer = document.getElementById('bulbContainer');
    const switchStatusText = document.getElementById('switchStatusText');

    function setTheme(isDark) {
        document.body.classList.toggle('dark-mode', isDark);

        if (lightSwitchBtn) {
            lightSwitchBtn.classList.toggle('is-on', isDark);
            lightSwitchBtn.setAttribute('aria-checked', String(isDark));
        }
        if (bulbContainer) {
            bulbContainer.classList.toggle('is-on', isDark);
            bulbContainer.setAttribute('aria-pressed', String(isDark));
        }
        if (switchStatusText) {
            switchStatusText.textContent = isDark ? 'LUZ ON (NOCHE)' : 'LUZ OFF (DÍA)';
        }
        localStorage.setItem('karate_theme', isDark ? 'dark' : 'light');
    }

    const savedTheme = localStorage.getItem('karate_theme');
    if (savedTheme === 'dark') {
        setTheme(true);
    } else if (savedTheme === 'light') {
        setTheme(false);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
    }

    if (lightSwitchBtn) {
        lightSwitchBtn.addEventListener('click', () => {
            setTheme(!document.body.classList.contains('dark-mode'));
        });
    }

    if (bulbContainer) {
        bulbContainer.addEventListener('click', () => {
            setTheme(!document.body.classList.contains('dark-mode'));
        });
    }

    // ==========================================================================
    // 1. Dynamic Tutor Requirement based on age
    // ==========================================================================
    function updateTutorRequirement() {
        const age = parseInt(ageInput.value, 10);
        const isMinor = !isNaN(age) && age < 18;
        const isAdult = !isNaN(age) && age >= 18;

        if (isAdult) {
            tutorInput.required = false;
            tutorInput.removeAttribute('aria-required');
            tutorReqBadge.style.display = 'none';
            tutorInput.placeholder = 'Opcional (mayor de edad) o contacto de emergencia';
        } else {
            tutorInput.required = true;
            tutorInput.setAttribute('aria-required', 'true');
            tutorReqBadge.style.display = '';
            tutorInput.placeholder = isMinor
                ? 'Requerido: Nombre completo del tutor legal'
                : 'Obligatorio si el alumno es menor de edad';
        }
    }

    if (ageInput) {
        ageInput.addEventListener('input', updateTutorRequirement);
        ageInput.addEventListener('change', updateTutorRequirement);
        updateTutorRequirement();
    }

    // ==========================================================================
    // 2. Toggle Previous Sport Details Input
    // ==========================================================================
    if (prevSportYes && prevSportNo && prevSportsDetailsGroup) {
        prevSportYes.addEventListener('change', () => {
            if (prevSportYes.checked) {
                prevSportsDetailsGroup.classList.remove('hidden-field');
                prevSportsDetailsInput.focus();
            }
        });

        prevSportNo.addEventListener('change', () => {
            if (prevSportNo.checked) {
                prevSportsDetailsGroup.classList.add('hidden-field');
                prevSportsDetailsInput.value = '';
            }
        });
    }

    // ==========================================================================
    // 3. Error handling helpers (accessible)
    // ==========================================================================
    function getGroupControls(group) {
        return Array.from(group.querySelectorAll('input, select, textarea'));
    }

    function setError(elementId, message) {
        const control = document.getElementById(elementId);
        const group = control ? control.closest('.form-group') : null;
        const errorEl = document.getElementById(elementId + 'Error') ||
            (group ? group.querySelector('.error-msg') : null);
        const targetGroup = group || (errorEl ? errorEl.closest('.form-group') : null);

        if (!targetGroup) return;

        targetGroup.classList.add('has-error');

        if (errorEl) {
            errorEl.textContent = message || errorEl.dataset.defaultMsg || errorEl.textContent;
        }

        getGroupControls(targetGroup).forEach(c => c.setAttribute('aria-invalid', 'true'));
    }

    function clearErrorFor(input) {
        const group = input.closest('.form-group');
        if (!group) return;

        group.classList.remove('has-error');
        group.querySelectorAll('[aria-invalid="true"]').forEach(c => c.removeAttribute('aria-invalid'));
        group.querySelectorAll('.error-msg').forEach(m => {
            m.textContent = m.dataset.defaultMsg || m.textContent;
        });

        const remaining = document.querySelectorAll('.form-group.has-error').length;
        if (remaining === 0) {
            formAlert.textContent = '';
        } else {
            formAlert.textContent = remaining === 1
                ? 'Hay 1 error en el formulario. Revisa el campo indicado para continuar.'
                : `Hay ${remaining} errores en el formulario. Revisa los campos indicados para continuar.`;
        }
    }

    const allInputs = form.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', () => clearErrorFor(input));
        input.addEventListener('change', () => clearErrorFor(input));
    });

    // Anuncia el resumen de errores y lleva el foco al primer campo con problema
    function announceAndFocus(firstErrorId) {
        const errorCount = document.querySelectorAll('.form-group.has-error').length;
        formAlert.textContent = errorCount === 1
            ? 'Hay 1 error en el formulario. Revisa el campo indicado para continuar.'
            : `Hay ${errorCount} errores en el formulario. Revisa los campos indicados para continuar.`;
        focusFieldFor(firstErrorId);
    }

    function focusFieldFor(elementId) {
        const control = document.getElementById(elementId);
        const group = control ? control.closest('.form-group') : null;
        const errorEl = document.getElementById(elementId + 'Error');
        const targetGroup = group || (errorEl ? errorEl.closest('.form-group') : null);
        const target = control || (targetGroup ? targetGroup.querySelector('input, select, textarea') : null);

        if (target) {
            target.focus({ preventScroll: true });
            target.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
        }
    }

    function resetAllErrors() {
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
        form.querySelectorAll('[aria-invalid="true"]').forEach(c => c.removeAttribute('aria-invalid'));
        form.querySelectorAll('.error-msg').forEach(m => {
            m.textContent = m.dataset.defaultMsg || m.textContent;
        });
        formAlert.textContent = '';
    }

    // ==========================================================================
    // 4. Validadores (uno por campo, con el paso al que pertenecen)
    //    check() -> null = válido | '' = mensaje por defecto | texto = mensaje propio
    // ==========================================================================
    const fieldValidators = [
        { id: 'fullName', step: 1, check: () => {
            const v = document.getElementById('fullName').value.trim();
            return (v && v.length >= 3) ? null : '';
        }},
        { id: 'age', step: 1, check: () => {
            const a = parseInt(ageInput.value, 10);
            return (!isNaN(a) && a >= 4 && a <= 99) ? null : '';
        }},
        { id: 'birthDate', step: 1, check: () => {
            const v = birthDateInput.value;
            if (!v) return '';
            const birth = new Date(v + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (birth > today) return 'La fecha de nacimiento no puede ser una fecha futura.';
            return null;
        }},
        // Coherencia entre edad y fecha de nacimiento (solo si ambas son válidas)
        { id: 'age', step: 1, check: () => {
            const a = parseInt(ageInput.value, 10);
            if (isNaN(a) || a < 4 || a > 99) return null;
            const v = birthDateInput.value;
            if (!v) return null;
            const birth = new Date(v + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (birth > today) return null;
            let computed = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) computed--;
            return computed === a ? null : 'La edad no coincide con la fecha de nacimiento.';
        }},
        { id: 'gender', step: 1, check: () =>
            document.querySelector('input[name="gender"]:checked') ? null : '' },
        { id: 'tutorName', step: 2, check: () => {
            const a = parseInt(ageInput.value, 10);
            if (isNaN(a) || a >= 18) return null; // solo obligatorio para menores
            return tutorInput.value.trim() ? null : '';
        }},
        { id: 'phone', step: 2, check: () => {
            const p = document.getElementById('phone').value.trim();
            return (p && /^[0-9\s\+\-\(\)]{7,15}$/.test(p)) ? null : '';
        }},
        { id: 'email', step: 2, check: () => {
            const e = document.getElementById('email').value.trim();
            return (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) ? null : '';
        }},
        { id: 'modality', step: 3, check: () =>
            document.querySelectorAll('input[name="sportsModality"]:checked').length > 0 ? null : '' },
        { id: 'rankLevel', step: 3, check: () =>
            document.getElementById('rankLevel').value ? null : '' },
        { id: 'schedulePreference', step: 3, check: () =>
            document.getElementById('schedulePreference').value ? null : '' },
        { id: 'previousSportsRadio', step: 4, check: () =>
            document.querySelector('input[name="previousSportsRadio"]:checked') ? null : '' },
        { id: 'termsConsent', step: 4, check: () =>
            document.getElementById('termsConsent').checked ? null : '' }
    ];

    function validateStep(stepNum) {
        let firstError = null;
        fieldValidators
            .filter(v => v.step === stepNum)
            .forEach(v => {
                const msg = v.check();
                if (msg !== null) {
                    setError(v.id, msg || undefined);
                    if (!firstError) firstError = v.id;
                }
            });
        return firstError;
    }

    function validateAll() {
        let firstError = null;
        let firstStep = null;
        fieldValidators.forEach(v => {
            const msg = v.check();
            if (msg !== null) {
                setError(v.id, msg || undefined);
                if (!firstError) {
                    firstError = v.id;
                    firstStep = v.step;
                }
            }
        });
        return { firstError, firstStep };
    }

    // ==========================================================================
    // 5. Wizard: mostrar pasos y actualizar la barra de progreso
    // ==========================================================================
    function showStep(stepNum, focus = true) {
        currentStep = stepNum;
        steps.forEach(s => {
            s.hidden = Number(s.dataset.step) !== stepNum;
        });

        btnPrevStep.hidden = stepNum === 1;
        const isLast = stepNum === steps.length;
        btnNextStep.hidden = isLast;
        btnSubmit.hidden = !isLast;

        updateProgress();

        if (focus) {
            const step = steps[stepNum - 1];
            step.focus({ preventScroll: true });
            step.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
        }
    }

    function updateProgress() {
        const total = steps.length;
        const pct = ((currentStep - 1) / (total - 1)) * 100;
        progressFill.style.width = pct + '%';

        const title = steps[currentStep - 1].dataset.title || '';
        stepCounter.textContent = `Paso ${currentStep} de ${total} — ${title}`;

        dotButtons.forEach(btn => {
            const i = Number(btn.dataset.goto);
            btn.classList.toggle('is-current', i === currentStep);
            btn.classList.toggle('is-done', i < currentStep);
            if (i === currentStep) btn.setAttribute('aria-current', 'step');
            else btn.removeAttribute('aria-current');
            btn.disabled = i > maxStepReached;
        });
    }

    // Avanzar: valida el paso actual antes de continuar
    btnNextStep.addEventListener('click', () => {
        const firstError = validateStep(currentStep);
        if (firstError) {
            announceAndFocus(firstError);
            return;
        }
        maxStepReached = Math.max(maxStepReached, currentStep + 1);
        showStep(currentStep + 1);
    });

    btnPrevStep.addEventListener('click', () => {
        if (currentStep > 1) showStep(currentStep - 1);
    });

    // Clic en los puntos de la barra de progreso (header)
    document.getElementById('progressSteps').addEventListener('click', (e) => {
        const btn = e.target.closest('.progress-step');
        if (!btn || btn.disabled) return;

        const target = Number(btn.dataset.goto);
        if (target === currentStep) return;

        if (target > currentStep) {
            // Valida todos los pasos intermedios antes de saltar
            for (let s = currentStep; s < target; s++) {
                const err = validateStep(s);
                if (err) {
                    showStep(s, false);
                    announceAndFocus(err);
                    return;
                }
            }
            maxStepReached = Math.max(maxStepReached, target);
        }

        showStep(target);
    });

    // Enter dentro de un campo avanza al siguiente paso (en el último paso envía)
    form.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (!e.target.matches('input, select')) return;
        if (currentStep >= steps.length) return; // último paso: envío nativo
        e.preventDefault();
        btnNextStep.click();
    });

    // ==========================================================================
    // 6. Recolección de datos, resumen y mensaje de WhatsApp
    // ==========================================================================
    function formatDate(isoDate) {
        const d = new Date(isoDate + 'T00:00:00');
        if (isNaN(d.getTime())) return isoDate;
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function collectFormData() {
        const gender = document.querySelector('input[name="gender"]:checked');
        const modalities = Array.from(document.querySelectorAll('input[name="sportsModality"]:checked'))
            .map(cb => cb.value);
        const prevRadio = document.querySelector('input[name="previousSportsRadio"]:checked');
        const ageVal = parseInt(ageInput.value, 10);
        const birth = birthDateInput.value;

        let prevSportsText = '';
        if (prevRadio) {
            prevSportsText = prevRadio.value === 'Sí'
                ? (prevSportsDetailsInput.value.trim() || 'Sí (Sin especificar)')
                : 'Ninguno (Primera disciplina)';
        }

        return {
            fullName: document.getElementById('fullName').value.trim(),
            age: ageVal,
            birthDate: birth ? formatDate(birth) : '',
            gender: gender ? gender.value : '',
            tutor: tutorInput.value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            modalities,
            rank: document.getElementById('rankLevel').value,
            schedule: document.getElementById('schedulePreference').value,
            prevSports: prevSportsText,
            medical: document.getElementById('medicalConditions').value.trim() || 'Sin observaciones médicas'
        };
    }

    function buildSummaryHtml(d) {
        return `
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-user" aria-hidden="true"></i> Alumno:</span>
                <span class="summary-val">${escapeHtml(d.fullName)} (${escapeHtml(String(d.age))} años)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> Nacimiento:</span>
                <span class="summary-val">${escapeHtml(d.birthDate)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-venus-mars" aria-hidden="true"></i> Género:</span>
                <span class="summary-val">${escapeHtml(d.gender)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-user-shield" aria-hidden="true"></i> Tutor/Contacto:</span>
                <span class="summary-val">${d.tutor ? escapeHtml(d.tutor) : 'N/A (Mayor de edad)'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-phone" aria-hidden="true"></i> Teléfono:</span>
                <span class="summary-val">${escapeHtml(d.phone)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-envelope" aria-hidden="true"></i> Email:</span>
                <span class="summary-val">${escapeHtml(d.email)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-medal" aria-hidden="true"></i> Modalidad(es):</span>
                <span class="summary-val">${d.modalities.map(m => `<b>${escapeHtml(m)}</b>`).join(', ')}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Nivel / Grado:</span>
                <span class="summary-val">${escapeHtml(d.rank)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-clock" aria-hidden="true"></i> Horario Elegido:</span>
                <span class="summary-val">${escapeHtml(d.schedule)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-person-running" aria-hidden="true"></i> Experiencia Previa:</span>
                <span class="summary-val">${escapeHtml(d.prevSports)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-notes-medical" aria-hidden="true"></i> Salud / Médica:</span>
                <span class="summary-val">${escapeHtml(d.medical)}</span>
            </div>
        `;
    }

    // Mensaje preformateado para enviar al dojo por WhatsApp
    function buildWhatsappMessage(d) {
        const fechaEnvio = new Date().toLocaleString('es-MX', {
            dateStyle: 'short', timeStyle: 'short'
        });
        return [
            '*NUEVA INSCRIPCIÓN — KARATE DO LOMA DORADA*',
            '━━━━━━━━━━━━━━━━━━━━',
            `👤 *Alumno:* ${d.fullName} (${d.age} años)`,
            `📅 *Fecha de nacimiento:* ${d.birthDate}`,
            `⚥ *Género:* ${d.gender}`,
            `👨‍👩‍👧 *Tutor / Contacto:* ${d.tutor || 'N/A (Mayor de edad)'}`,
            `📞 *Teléfono:* ${d.phone}`,
            `✉️ *Correo:* ${d.email}`,
            `🥋 *Modalidades:* ${d.modalities.join(', ')}`,
            `🎽 *Nivel / Cinta:* ${d.rank}`,
            `🕐 *Horario:* ${d.schedule}`,
            `🏃 *Experiencia previa:* ${d.prevSports}`,
            `🩺 *Salud / Médica:* ${d.medical}`,
            '━━━━━━━━━━━━━━━━━━━━',
            `_Enviado desde el formulario web — ${fechaEnvio}_`
        ].join('\n');
    }

    function buildWhatsappUrl(d) {
        const msg = buildWhatsappMessage(d);
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    }

    // ==========================================================================
    // 7. Confeti de celebración (canvas propio, respeta movimiento reducido)
    // ==========================================================================
    function fireConfetti(originEl) {
        if (prefersReducedMotion) return;

        const existing = document.querySelector('.confetti-canvas');
        if (existing) existing.remove();

        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);

        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) { canvas.remove(); return; }

        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Origen: el botón que se pulsó (o el centro-inferior de la pantalla)
        let ox = w / 2;
        let oy = h * 0.7;
        if (originEl && typeof originEl.getBoundingClientRect === 'function') {
            const r = originEl.getBoundingClientRect();
            if (r.width) { ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
        }

        const colors = ['#E63027', '#FFD700', '#10B981', '#1259C3', '#FFFFFF', '#F59E0B', '#FF6666'];
        const particles = [];
        const COUNT = 150;

        for (let i = 0; i < COUNT; i++) {
            const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.2;
            const speed = 6 + Math.random() * 11;
            particles.push({
                x: ox + (Math.random() - 0.5) * 50,
                y: oy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                w: 6 + Math.random() * 7,
                h: 4 + Math.random() * 5,
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
                circle: Math.random() < 0.25
            });
        }

        const DURATION = 3200;
        const start = performance.now();
        let rafId = 0;

        function frame(now) {
            const elapsed = now - start;
            const alpha = Math.max(0, 1 - elapsed / DURATION);
            ctx.clearRect(0, 0, w, h);

            particles.forEach(p => {
                p.vy += 0.28;
                p.vx *= 0.99;
                p.vy *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                if (p.circle) {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                }
                ctx.restore();
            });

            if (elapsed < DURATION && document.body.contains(canvas)) {
                rafId = requestAnimationFrame(frame);
            } else {
                cancelAnimationFrame(rafId);
                if (canvas.parentNode) canvas.remove();
            }
        }

        rafId = requestAnimationFrame(frame);
    }

    // ==========================================================================
    // 8. Envío del formulario
    // ==========================================================================
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        resetAllErrors();

        const { firstError, firstStep } = validateAll();

        if (firstError) {
            // Lleva al usuario al paso donde está el primer problema
            if (firstStep !== currentStep) showStep(firstStep, false);
            announceAndFocus(firstError);
            return;
        }

        const data = collectFormData();

        // Resumen en el modal + enlace de WhatsApp preformateado
        modalSummaryContent.innerHTML = buildSummaryHtml(data);
        btnSendWhatsapp.href = buildWhatsappUrl(data);

        // 🎉 Confeti al presionar "Enviar"
        fireConfetti(btnSubmit);

        openModal();
    });

    // Enlace de WhatsApp del modal (se actualiza al enviar; por si se pulsa sin href)
    btnSendWhatsapp.addEventListener('click', () => {
        if (!btnSendWhatsapp.href || btnSendWhatsapp.getAttribute('href') === '#') {
            btnSendWhatsapp.href = buildWhatsappUrl(collectFormData());
        }
    });

    // ==========================================================================
    // 9. Modal: focus management, focus trap, Escape / backdrop close
    // ==========================================================================
    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
    }

    function openModal() {
        successModal.classList.add('active');
        document.body.classList.add('modal-open');
        modalCard.focus();
    }

    function closeModal() {
        successModal.classList.remove('active');
        document.body.classList.remove('modal-open');

        // Limpieza completa del formulario y regreso al paso 1
        form.reset();
        resetAllErrors();
        prevSportsDetailsGroup.classList.add('hidden-field');
        updateTutorRequirement();

        maxStepReached = 1;
        showStep(1, false);

        // Devuelve el foco al inicio del formulario y lleva la vista ahí
        const formSection = document.getElementById('registro');
        formSection.focus({ preventScroll: true });
        formSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }

    btnCloseModal.addEventListener('click', closeModal);

    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!successModal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
            return;
        }

        if (e.key === 'Tab') {
            const focusables = getFocusableElements(modalCard);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (!modalCard.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // ==========================================================================
    // Helper functions
    // ==========================================================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // Estado inicial del wizard
    showStep(1, false);
});
