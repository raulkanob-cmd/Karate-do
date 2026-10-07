// Pruebas del formulario (jsdom): npm install && npm test
// Ejecuta: node tests/test.js
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PROJ = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(PROJ, 'js', 'app.js'), 'utf8');
const cssText = fs.readFileSync(path.join(PROJ, 'css', 'styles.css'), 'utf8');

html = html.replace(/<link[^>]*https?:\/\/[^>]*>/g, '');
html = html.replace('<script src="js/app.js"></script>', '');
const polyfill = `
  if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  Element.prototype.scrollIntoView = function(){};
  window.scrollTo = function(){};
  // Stub del contexto 2D (jsdom no dibuja, pero permite ejecutar la animación)
  HTMLCanvasElement.prototype.getContext = function () {
    return { setTransform(){}, clearRect(){}, save(){}, restore(){}, translate(){}, rotate(){},
             beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillText(){},
             fillStyle: '', globalAlpha: 1, font: '', textAlign: '', textBaseline: '' };
  };
`;
html = html.replace('</body>', `<script>${polyfill}\n${appJs}\n</script></body>`);

const vc = new VirtualConsole();
const jsdomErrors = [];
vc.on('jsdomError', (e) => {
    // Limitación conocida de jsdom: getContext() sin el paquete "canvas".
    // En el navegador real funciona; la app ya tiene guardia para ctx === null.
    if (/HTMLCanvasElement's getContext/.test(e.message)) return;
    jsdomErrors.push(e.message);
});
vc.on('error', (m) => jsdomErrors.push('console.error: ' + m));

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/', virtualConsole: vc, pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

function runAll() {
  const results = [];
  const check = (name, cond, extra = '') => results.push({ name, pass: !!cond, extra });

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const el = (id) => document.getElementById(id);

  function submit() {
    el('karateRegistrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  }
  function setVal(id, value) {
    const e = el(id);
    e.value = value;
    e.dispatchEvent(new window.Event('input', { bubbles: true }));
    e.dispatchEvent(new window.Event('change', { bubbles: true }));
  }
  function click(node) { node.click(); }
  function pressKey(target, k) {
    target.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }
  function birth10y() {
    const d = new Date(); d.setFullYear(d.getFullYear() - 10);
    return d.toISOString().slice(0, 10);
  }

  // ================= Estructura del wizard =================
  const steps = $$('.form-step');
  const topHeaderBlock = (cssText.match(/\.top-header\s*\{[^}]*\}/) || [''])[0];
  const formProgressBlock = (cssText.match(/\.form-progress\s*\{[^}]*\}/) || [''])[0];
  check('Formulario dividido en 4 pasos', steps.length === 4);
  check('Solo el paso 1 visible al cargar', !steps[0].hidden && steps[1].hidden && steps[2].hidden && steps[3].hidden);
  check('Barra de progreso sobre el contenedor del formulario', !!$('.form-wrapper > .form-progress') && !!el('progressFill'));
  check('Header sin posición sticky (CSS)', !/position:\s*sticky/.test(topHeaderBlock), topHeaderBlock.slice(0, 80));
  check('Barra de progreso sticky dentro del formulario (CSS)', /position:\s*sticky/.test(formProgressBlock));
  check('Progreso con 4 puntos navegables', $$('.progress-step').length === 4);
  check('Paso 1 marcado aria-current', $('.progress-step[data-goto="1"]').getAttribute('aria-current') === 'step');
  check('Pasos futuros deshabilitados', $$('.progress-step').filter(b => b.disabled).length === 3);
  check('Contador de paso presente y anunciado', el('stepCounter').getAttribute('aria-live') === 'polite' && /Paso 1 de 4/.test(el('stepCounter').textContent));
  check('Navegación: Anterior oculto, Siguiente visible, Enviar oculto', el('btnPrevStep').hidden && !el('btnNextStep').hidden && el('btnSubmit').hidden);
  check('Botón de envío con solo la palabra "Inscribirme"', el('btnSubmit').textContent.trim() === 'Inscribirme', el('btnSubmit').textContent.trim());
  check('Horario con solo2 opciones (principiantes y avanzado)', Array.from(el('schedulePreference').options).filter(o => o.value).length === 2);

  // ================= Accesibilidad (se mantiene) =================
  check('Skip link presente', !!$('a.skip-link[href="#registro"]'));
  check('Modal con role=dialog + aria-modal', $('.modal-card').getAttribute('role') === 'dialog' && $('.modal-card').getAttribute('aria-modal') === 'true');
  check('Botón blanco del modal (Entendido y Aceptar) eliminado', !el('btnCloseModal') && !document.querySelector('.btn-close-modal'));
  check('Botón restante del modal dice solo "Terminar y enviar"', el('btnSendWhatsapp').textContent.trim() === 'Terminar y enviar', el('btnSendWhatsapp').textContent.trim());
  check('Form alert con role=alert', el('formAlert').getAttribute('role') === 'alert');
  check('aria-describedby de errores', el('fullName').getAttribute('aria-describedby') === 'fullNameError' && el('schedulePreference').getAttribute('aria-describedby') === 'scheduleError');
  check('Iconos decorativos ocultos', $$('i').every(i => i.getAttribute('aria-hidden') === 'true'));

  // ===== Iconos SVG (skill svg-icon-generator) + referencia de modalidades =====
  const spriteIds = ['ico-kata', 'ico-kumite', 'ico-kobudo', 'ico-infantil', 'ico-rendimiento', 'ico-defensa', 'ico-help'];
  check('Sprites SVG: 6 iconos de modalidad + icono de referencia', spriteIds.every(id => !!document.getElementById(id)));
  check('Badges de modalidad con iconos SVG propios (sin Font Awesome)',
    $$('.modality-badge').length === 6 && $$('.modality-badge svg').length === 6 && $$('.modality-badge i').length === 0);
  check('Iconos SVG decorativos ocultos (aria-hidden)', $$('.modality-badge svg, .modality-help svg').every(s => s.getAttribute('aria-hidden') === 'true'));
  check('Icono de referencia accesible (aria-controls + aria-expanded)',
    !!el('modalityHelpBtn') && el('modalityHelpBtn').getAttribute('aria-controls') === 'modalityHelpPanel' && el('modalityHelpBtn').getAttribute('aria-expanded') === 'false');
  check('Panel de referencia oculto al cargar', el('modalityHelpPanel').hidden === true);
  click(el('modalityHelpBtn'));
  check('Tocar el icono abre la referencia', el('modalityHelpPanel').hidden === false && el('modalityHelpBtn').getAttribute('aria-expanded') === 'true');
  const ayudaTxt = el('modalityHelpPanel').textContent;
  check('Referencia traduce los términos en palabras simples',
    /coreograf/.test(ayudaTxt) && /combate/.test(ayudaTxt) && /armas de madera/.test(ayudaTxt) && /competir/.test(ayudaTxt));
  check('Referencia usa los mismos iconos que las tarjetas', spriteIds.slice(0, 6).every(id => !!el('modalityHelpPanel').querySelector(`use[href="#${id}"]`)));
  click(el('modalityHelpBtn'));
  check('Segundo toque cierra la referencia', el('modalityHelpPanel').hidden === true && el('modalityHelpBtn').getAttribute('aria-expanded') === 'false');

  // ================= Nuevos requisitos de UI =================
  check('Interruptor del hero eliminado', !el('lightSwitchBtn') && !el('bulbContainer') && !$('.hero-switch-fixture'));
  check('Modo día/noche como icono único en el header', !!el('themeToggle') && !!el('themeIcon') && !!$('.top-header .theme-toggle-btn'));
  check('Campo de grado (rankLevel) eliminado', !el('rankLevel') && !/rankLevel/.test(appJs));
  check('Facebook apunta al perfil del dojo', el('btnFacebook').getAttribute('href') === 'https://www.facebook.com/profile.php?id=61581570449597');
  check('Botones de contacto sin texto visible (solo icono)',
    el('btnWhatsapp').textContent.trim() === '' && el('btnFacebook').textContent.trim() === '' && el('btnEmail').textContent.trim() === '');
  check('Botones de contacto conservan aria-label con el número',
    /477 673 7908/.test(el('btnWhatsapp').getAttribute('aria-label')) &&
    !!el('btnFacebook').getAttribute('aria-label') && !!el('btnEmail').getAttribute('aria-label'));
  const mapIframe = $('.footer-map iframe');
  check('Iframe de Google Maps en el footer', !!mapIframe && /21\.1355411,-101\.7727977/.test(mapIframe.getAttribute('src')) && !!mapIframe.getAttribute('title'));
  check('Enlace al mapa original en el footer', !!$('.footer-map a[href="https://maps.app.goo.gl/w9wsZBPoF5JBn1ok6"]'));
  check('Kanji japoneses en el script (reemplazan al confeti)', /KANJI_CHARS/.test(appJs) && /空/.test(appJs) && !/fireConfetti/.test(appJs));

  // ================= Navegación entre pasos =================
  // Siguiente sin validar el paso 1
  click(el('btnNextStep'));
  check('Next bloqueado si el paso 1 tiene errores', !steps[0].hidden && /errores en el formulario/.test(el('formAlert').textContent), el('formAlert').textContent);
  check('Errores marcados con aria-invalid', el('fullName').getAttribute('aria-invalid') === 'true');
  check('Foco en el primer campo del paso con error', document.activeElement === el('fullName'), document.activeElement && document.activeElement.id);

  // Llenar el paso 1
  setVal('fullName', 'Carlos Eduardo Ramírez Pérez');
  setVal('age', '10');
  setVal('birthDate', birth10y());
  Array.from(document.querySelectorAll('input[name="gender"]'))[0].click();
  click(el('btnNextStep'));
  check('Avanza al paso 2 con datos válidos', !steps[1].hidden && steps[0].hidden);
  check('Progreso avanza (línea ~33%)', Math.round(parseFloat(el('progressFill').style.width)) === 33, el('progressFill').style.width);
  check('Paso 1 queda como completado', $('.progress-step[data-goto="1"]').classList.contains('is-done'));
  check('Paso 2 es actual (aria-current)', $('.progress-step[data-goto="2"]').getAttribute('aria-current') === 'step');
  check('Botón Anterior visible en paso 2', !el('btnPrevStep').hidden);
  check('Contador actualizado', /Paso 2 de 4/.test(el('stepCounter').textContent), el('stepCounter').textContent);

  // Enter en un campo avanza (aquí falla porque está vacío)
  pressKey(el('phone'), 'Enter');
  check('Enter en campo vacío muestra error y no avanza', !steps[1].hidden && el('phone').getAttribute('aria-invalid') === 'true');

  setVal('phone', '477 673 7908');
  setVal('email', 'alumno@ejemplo.com');
  el('tutorName').value = 'María Pérez';
  pressKey(el('email'), 'Enter');
  check('Enter con datos válidos avanza al paso 3', !steps[2].hidden && steps[1].hidden);
  check('Progreso en paso 3 (~67%)', Math.round(parseFloat(el('progressFill').style.width)) === 67, el('progressFill').style.width);

  // Punto 4 sigue bloqueado hasta validar el paso 3
  check('Punto 4 deshabilitado antes de validar el paso 3', $('.progress-step[data-goto="4"]').disabled);
  click(el('btnNextStep'));
  check('Next bloqueado en paso 3 vacío', !steps[2].hidden && el('modalityError').closest('.form-group').classList.contains('has-error'));

  Array.from(document.querySelectorAll('input[name="sportsModality"]'))[0].click();
  setVal('schedulePreference', '2:00 PM a 3:00 PM — Principiantes (niños de 6 a 11 años)');
  click(el('btnNextStep'));
  check('Avanza al paso 4', !steps[3].hidden && steps[2].hidden);
  check('Progreso completo (100%)', parseFloat(el('progressFill').style.width) === 100, el('progressFill').style.width);
  check('Punto 4 ahora habilitado', !$('.progress-step[data-goto="4"]').disabled);
  check('Siguiente oculto y Enviar visible en el último paso', el('btnNextStep').hidden && !el('btnSubmit').hidden);

  // Retroceder con Anterior y volver con el punto del progreso
  click(el('btnPrevStep'));
  check('Anterior regresa al paso 3', !steps[2].hidden && steps[3].hidden);
  click($('.progress-step[data-goto="1"]'));
  check('Clic en punto del progreso salta al paso 1 sin perder datos', !steps[0].hidden && el('fullName').value.length > 0);
  click($('.progress-step[data-goto="4"]'));
  check('Clic en punto lleva al paso 4', !steps[3].hidden);

  // ================= Envío final =================
  // Falta el consentimiento y la experiencia previa
  submit();
  check('Submit sin completar paso 4: salta a ese paso con errores', !steps[3].hidden && el('termsConsent').getAttribute('aria-invalid') === 'true');
  check('Resumen de errores anunciado', /errores en el formulario/.test(el('formAlert').textContent));

  Array.from(document.querySelectorAll('input[name="previousSportsRadio"]'))[1].click();
  el('termsConsent').click();
  submit();

  const modal = el('successModal');
  check('Envío válido: modal abierto', modal.classList.contains('active'));
  check('Kanji disparados al enviar (canvas presente, sin errores JS)', !!document.querySelector('.fx-canvas') && jsdomErrors.length === 0, jsdomErrors.join(' | '));
  check('Foco en el diálogo', document.activeElement === $('.modal-card'));

  // ================= WhatsApp =================
  const waHref = el('btnSendWhatsapp').getAttribute('href');
  check('Botón de WhatsApp apunta a wa.me con el número del dojo', /^https:\/\/wa\.me\/5214776737908\?text=/.test(waHref), waHref && waHref.slice(0, 60));
  const waText = decodeURIComponent((waHref.split('text=')[1] || '').replace(/\+/g, ' '));
  check('Mensaje con encabezado preformateado', /NUEVA INSCRIPCIÓN — KARATE DO LOMA DORADA/.test(waText));
  check('Mensaje incluye alumno', /Alumno:\* Carlos Eduardo Ramírez Pérez \(10 años\)/.test(waText));
  check('Mensaje incluye teléfono', /Teléfono:\* 477 673 7908/.test(waText));
  check('Mensaje incluye modalidad, nivel asumido y horario', /Modalidades:\* Kata/.test(waText) && /Nivel \/ Cinta:\* Principiante \(Cinta Blanca\) — alumno nuevo/.test(waText) && /Horario:\* 2:00 PM a 3:00 PM — Principiantes \(niños de 6 a 11 años\)/.test(waText));
  check('Mensaje incluye tutor, correo y salud', /Tutor \/ Contacto:\* María Pérez/.test(waText) && /alumno@ejemplo.com/.test(waText) && /Sin observaciones médicas/.test(waText));
  check('Resumen del modal muestra los datos', /Carlos Eduardo Ram/.test(el('modalSummaryContent').textContent));
  check('Resumen escapado (XSS)', !el('modalSummaryContent').innerHTML.includes('<script'));

  // Número nuevo en el botón del footer (solo icono: el número vive en href/aria-label)
  check('Footer WhatsApp con el número nuevo', el('btnWhatsapp').getAttribute('href').includes('5214776737908') && /477 673 7908/.test(el('btnWhatsapp').getAttribute('aria-label')));

  // ================= Cierre y reinicio =================
  pressKey(document.body, 'Escape');
  check('Escape cierra el modal', !modal.classList.contains('active'));
  check('Vuelve al paso 1 tras cerrar', !steps[0].hidden && steps[1].hidden && steps[2].hidden && steps[3].hidden);
  check('Progreso reiniciado a 0%', parseFloat(el('progressFill').style.width) === 0, el('progressFill').style.width);
  check('Contador reiniciado', /Paso 1 de 4/.test(el('stepCounter').textContent));
  check('Enviar oculto y Siguiente visible de nuevo', el('btnSubmit').hidden && !el('btnNextStep').hidden && el('btnPrevStep').hidden);
  check('Puntos 2-4 vuelven a estar deshabilitados', $$('.progress-step').filter(b => b.disabled).length === 3);
  check('Formulario limpio (sin has-error ni aria-invalid)', !document.querySelector('.form-group.has-error') && document.querySelectorAll('[aria-invalid]').length === 0);
  check('Foco devuelto al inicio del formulario', document.activeElement === el('registro'), document.activeElement && (document.activeElement.id || document.activeElement.className));

  // ================= Tema oscuro (icono en el header) =================
  click(el('themeToggle'));
  check('Icono de tema alterna dark-mode', document.body.classList.contains('dark-mode'));
  check('aria-pressed e icono sincronizados', el('themeToggle').getAttribute('aria-pressed') === 'true' && /fa-moon/.test(el('themeIcon').className));
  check('aria-label del tema actualizado', /Modo oscuro activado/.test(el('themeToggle').getAttribute('aria-label')));
  click(el('themeToggle'));
  check('Segundo clic vuelve al modo claro', !document.body.classList.contains('dark-mode') && /fa-sun/.test(el('themeIcon').className));

  // ============ Vuelta desde WhatsApp: la página muestra el hero ============
  // Reenviar el formulario para reabrir el modal
  setVal('fullName', 'Carlos Eduardo Ramírez Pérez');
  setVal('age', '10');
  setVal('birthDate', birth10y());
  Array.from(document.querySelectorAll('input[name="gender"]'))[0].click();
  click(el('btnNextStep'));
  setVal('phone', '477 673 7908');
  setVal('email', 'alumno@ejemplo.com');
  el('tutorName').value = 'María Pérez';
  pressKey(el('email'), 'Enter');
  Array.from(document.querySelectorAll('input[name="sportsModality"]'))[0].click();
  setVal('schedulePreference', '2:00 PM a 3:00 PM — Principiantes (niños de 6 a 11 años)');
  click(el('btnNextStep'));
  Array.from(document.querySelectorAll('input[name="previousSportsRadio"]'))[1].click();
  el('termsConsent').click();
  submit();
  check('Modal reabierto para probar la vuelta desde WhatsApp', modal.classList.contains('active'));

  // Sin haber salido hacia WhatsApp, volver a la pestaña NO debe cerrar el modal
  document.dispatchEvent(new window.Event('visibilitychange'));
  check('visibilitychange sin salir a WhatsApp no cierra el modal', modal.classList.contains('active'));

  // El usuario pulsa "Terminar y enviar" (se cancela la navegación real en jsdom)
  el('btnSendWhatsapp').addEventListener('click', (e) => e.preventDefault(), { once: true });
  el('btnSendWhatsapp').click();
  document.dispatchEvent(new window.Event('visibilitychange'));
  check('Al volver de WhatsApp: modal cerrado y wizard reiniciado (se ve el hero)',
    !modal.classList.contains('active') &&
    !steps[0].hidden && steps[1].hidden && steps[2].hidden && steps[3].hidden &&
    el('btnSubmit').hidden && !el('btnNextStep').hidden &&
    parseFloat(el('progressFill').style.width) === 0);
  check('Foco devuelto al formulario (sin robar la vista del hero)', document.activeElement === el('registro'));

  // La animación dura ~3.6s: comprobamos que se limpia y que no hubo errores JS
  setTimeout(() => {
    check('Canvas de kanji retirado al terminar la animación', !document.querySelector('.fx-canvas'));
    check('Sin errores JS durante toda la prueba', jsdomErrors.length === 0, jsdomErrors.join(' | '));

    let fail = 0;
    results.forEach(r => { if (!r.pass) fail++; console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra ? '  -> ' + r.extra : ''}`); });
    console.log(`\n${results.length - fail}/${results.length} pruebas OK`);
    process.exit(fail ? 1 : 0);
  }, 4000);
}

setTimeout(runAll, 200);
