// ==========================================================================
// Karate-Do Registration Form Script
// Handles dynamic inputs, field validation, sports modalities, and modal preview.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('karateRegistrationForm');
    const ageInput = document.getElementById('age');
    const tutorReqBadge = document.getElementById('tutorReqBadge');
    const tutorInput = document.getElementById('tutorName');
    const prevSportYes = document.getElementById('prevSportYes');
    const prevSportNo = document.getElementById('prevSportNo');
    const prevSportsDetailsGroup = document.getElementById('prevSportsDetailsGroup');
    const prevSportsDetailsInput = document.getElementById('previousSportsDetails');
    const successModal = document.getElementById('successModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modalSummaryContent = document.getElementById('modalSummaryContent');

    // ==========================================================================
    // Light Switch (Switch de Foco) & Dark Mode Toggle Logic
    // ==========================================================================
    const lightSwitchBtn = document.getElementById('lightSwitchBtn');
    const bulbContainer = document.getElementById('bulbContainer');
    const switchStatusText = document.getElementById('switchStatusText');

    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (lightSwitchBtn) {
                lightSwitchBtn.classList.add('is-on');
                lightSwitchBtn.setAttribute('aria-checked', 'true');
            }
            if (bulbContainer) {
                bulbContainer.classList.add('is-on');
            }
            if (switchStatusText) {
                switchStatusText.textContent = 'LUZ ON (NOCHE)';
            }
            localStorage.setItem('karate_theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            if (lightSwitchBtn) {
                lightSwitchBtn.classList.remove('is-on');
                lightSwitchBtn.setAttribute('aria-checked', 'false');
            }
            if (bulbContainer) {
                bulbContainer.classList.remove('is-on');
            }
            if (switchStatusText) {
                switchStatusText.textContent = 'LUZ OFF (DÍA)';
            }
            localStorage.setItem('karate_theme', 'light');
        }
    }

    // Determine initial theme
    const savedTheme = localStorage.getItem('karate_theme');
    if (savedTheme === 'dark') {
        setTheme(true);
    } else if (savedTheme === 'light') {
        setTheme(false);
    } else {
        // Default to dark mode or system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
    }

    // Click handler for switch button & bulb container
    if (lightSwitchBtn) {
        lightSwitchBtn.addEventListener('click', () => {
            const isCurrentDark = document.body.classList.contains('dark-mode');
            setTheme(!isCurrentDark);
        });
    }

    if (bulbContainer) {
        bulbContainer.addEventListener('click', () => {
            const isCurrentDark = document.body.classList.contains('dark-mode');
            setTheme(!isCurrentDark);
        });
    }

    // 1. Dynamic Tutor Requirement based on age
    if (ageInput) {
        ageInput.addEventListener('input', () => {
            const age = parseInt(ageInput.value, 10);
            if (!isNaN(age) && age < 18) {
                tutorReqBadge.style.display = 'inline';
                tutorInput.placeholder = 'Requerido: Nombre completo del tutor legal';
            } else {
                tutorReqBadge.style.display = 'inline';
                tutorInput.placeholder = 'Opcional (o contacto de emergencia)';
            }
        });
    }

    // 2. Toggle Previous Sport Details Input
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

    // Clear error on input change
    const allInputs = form.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.form-group');
            if (group) group.classList.remove('has-error');
        });
        input.addEventListener('change', () => {
            const group = input.closest('.form-group');
            if (group) group.classList.remove('has-error');
        });
    });

    // 3. Form Submission and Validation Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Reset errors
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

        // Validate Full Name
        const fullName = document.getElementById('fullName').value.trim();
        if (!fullName || fullName.length < 3) {
            setError('fullName');
            isValid = false;
        }

        // Validate Age
        const ageVal = parseInt(document.getElementById('age').value, 10);
        if (isNaN(ageVal) || ageVal < 4 || ageVal > 99) {
            setError('age');
            isValid = false;
        }

        // Validate Birth Date
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            setError('birthDate');
            isValid = false;
        }

        // Validate Gender Radio
        const genderSelected = document.querySelector('input[name="gender"]:checked');
        if (!genderSelected) {
            setError('gender');
            isValid = false;
        }

        // Validate Tutor Name (mandatory if age < 18 or general check)
        const tutorName = tutorInput.value.trim();
        if (ageVal < 18 && !tutorName) {
            setError('tutorName');
            isValid = false;
        }

        // Validate Phone
        const phone = document.getElementById('phone').value.trim();
        const phoneRegex = /^[0-9\s\+\-\(\)]{7,15}$/;
        if (!phone || !phoneRegex.test(phone)) {
            setError('phone');
            isValid = false;
        }

        // Validate Email
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('email');
            isValid = false;
        }

        // Validate Sports Modality Checkboxes
        const modalitiesChecked = Array.from(document.querySelectorAll('input[name="sportsModality"]:checked'))
            .map(cb => cb.value);
        if (modalitiesChecked.length === 0) {
            setError('modality');
            isValid = false;
        }

        // Validate Rank / Belt Level
        const rankLevel = document.getElementById('rankLevel').value;
        if (!rankLevel) {
            setError('rankLevel');
            isValid = false;
        }

        // Validate Schedule Preference
        const schedule = document.getElementById('schedulePreference').value;
        if (!schedule) {
            setError('schedulePreference');
            isValid = false;
        }

        // Validate Previous Sports Radio
        const prevSportsRadio = document.querySelector('input[name="previousSportsRadio"]:checked');
        if (!prevSportsRadio) {
            setError('previousSportsRadio');
            isValid = false;
        }

        // Validate Terms Consent Checkbox
        const termsConsent = document.getElementById('termsConsent').checked;
        if (!termsConsent) {
            setError('termsConsent');
            isValid = false;
        }

        if (!isValid) {
            // Scroll smoothly to first error element
            const firstError = document.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Form is valid! Build summary HTML for Modal Window
        const medical = document.getElementById('medicalConditions').value.trim() || 'Sin observaciones médicas';
        const prevSportsText = prevSportsRadio.value === 'Sí' 
            ? (prevSportsDetailsInput.value.trim() || 'Sí (Sin especificar)') 
            : 'Ninguno (Primera disciplina)';

        modalSummaryContent.innerHTML = `
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-user"></i> Alumno:</span>
                <span class="summary-val">${escapeHtml(fullName)} (${ageVal} años)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-venus-mars"></i> Género:</span>
                <span class="summary-val">${genderSelected ? genderSelected.value : '-'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-user-shield"></i> Tutor/Contacto:</span>
                <span class="summary-val">${tutorName ? escapeHtml(tutorName) : 'N/A (Mayor de edad)'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-phone"></i> Teléfono:</span>
                <span class="summary-val">${escapeHtml(phone)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-envelope"></i> Email:</span>
                <span class="summary-val">${escapeHtml(email)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-medal"></i> Modalidad(es):</span>
                <span class="summary-val">${modalitiesChecked.map(m => `<b>${escapeHtml(m)}</b>`).join(', ')}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-layer-group"></i> Nivel / Grado:</span>
                <span class="summary-val">${escapeHtml(rankLevel)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-clock"></i> Horario Elegido:</span>
                <span class="summary-val">${escapeHtml(schedule)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-person-running"></i> Experiencia Previa:</span>
                <span class="summary-val">${escapeHtml(prevSportsText)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label"><i class="fa-solid fa-notes-medical"></i> Salud / Médica:</span>
                <span class="summary-val">${escapeHtml(medical)}</span>
            </div>
        `;

        // Open Modal
        successModal.classList.add('active');
    });

    // Close Modal Button
    btnCloseModal.addEventListener('click', () => {
        successModal.classList.remove('active');
        form.reset();
        prevSportsDetailsGroup.classList.add('hidden-field');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Helper functions
    function setError(elementId) {
        let el = document.getElementById(elementId);
        if (!el) {
            // Check radio or group ID
            el = document.getElementById(elementId + 'Error');
        }
        if (el) {
            const group = el.closest('.form-group');
            if (group) group.classList.add('has-error');
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
});
