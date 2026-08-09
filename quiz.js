/*
 * NegotiateHer — final assessment + certificate generator
 * ---------------------------------------------------------------------------
 * Reads QUIZ from quiz-data.js and CERT_LOGO from cert-logo.js.
 *
 * Every attempt draws a fresh set of questions spread across as many modules
 * as possible, and reshuffles the answer order, so two runs never look alike.
 *
 * The certificate is drawn on a <canvas> and downloaded as a PNG. No backend,
 * no library, no external request — see the note by makeCertificateId() about
 * what this certificate does and does not prove.
 */
(function () {
    'use strict';

    var PROGRESS_KEY = 'nh_progress_v1';   // written by course.js
    var CERT_KEY = 'nh_cert_name_v1';      // remembers the name between visits

    var CERT_W = 2000;
    var CERT_H = 1414;                     // A4 landscape proportions

    var el = {};
    ['stage-intro', 'stage-quiz', 'stage-result', 'stage-cert', 'intro-draw', 'intro-pass',
        'gate-warning', 'gate-detail', 'start-quiz', 'q-index', 'q-total', 'q-module', 'q-fill',
        'q-text', 'q-options', 'q-feedback', 'feedback-head', 'feedback-why', 'q-next',
        'result-icon', 'result-title', 'result-score', 'result-message', 'result-review',
        'cert-form', 'cert-name', 'cert-hint', 'make-cert', 'retry-actions', 'retry-quiz',
        'cert-canvas', 'download-cert', 'rename-cert'
    ].forEach(function (id) {
        el[id] = document.getElementById(id);
    });

    var drawn = [];      // this attempt's questions, options already shuffled
    var current = 0;
    var answers = [];    // { question, pickedIndex, correct }

    // =======================================================================
    // Helpers
    // =======================================================================

    /* Fisher-Yates. Returns a new array; never mutates the caller's. */
    function shuffle(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function readProgress() {
        try {
            var raw = localStorage.getItem(PROGRESS_KEY);
            var p = raw ? JSON.parse(raw) : null;
            return p && p.lessons ? p : { lessons: {} };
        } catch (err) {
            return { lessons: {} };
        }
    }

    function showStage(name) {
        ['stage-intro', 'stage-quiz', 'stage-result', 'stage-cert'].forEach(function (s) {
            el[s].hidden = s !== name;
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // =======================================================================
    // Drawing a question set
    // =======================================================================

    /*
     * Spread the draw across modules rather than sampling the bank flat —
     * otherwise a random 8 can land four questions deep in one module and skip
     * half the course. Take one from each module in random order, round-robin,
     * until the quota is filled.
     */
    function drawQuestions(count) {
        var byModule = {};
        QUIZ.questions.forEach(function (q) {
            (byModule[q.module] = byModule[q.module] || []).push(q);
        });

        var buckets = shuffle(Object.keys(byModule)).map(function (m) {
            return shuffle(byModule[m]);
        });

        var picked = [];
        var round = 0;
        while (picked.length < count) {
            var addedThisRound = false;
            for (var b = 0; b < buckets.length && picked.length < count; b++) {
                if (buckets[b].length > round) {
                    picked.push(buckets[b][round]);
                    addedThisRound = true;
                }
            }
            if (!addedThisRound) break;   // bank smaller than the requested draw
            round++;
        }

        // Shuffle the running order, then shuffle each question's options.
        return shuffle(picked).map(function (q) {
            var opts = shuffle(q.options.map(function (text, i) {
                return { text: text, correct: i === q.answer };
            }));
            return { src: q, options: opts };
        });
    }

    // =======================================================================
    // Quiz flow
    // =======================================================================

    function startQuiz() {
        drawn = drawQuestions(QUIZ.draw);
        current = 0;
        answers = [];
        el['q-total'].textContent = drawn.length;
        showStage('stage-quiz');
        renderQuestion();
    }

    function renderQuestion() {
        var item = drawn[current];

        el['q-index'].textContent = current + 1;
        el['q-module'].textContent = 'Module ' + item.src.module;
        el['q-fill'].style.width = ((current / drawn.length) * 100) + '%';
        el['q-text'].textContent = item.src.q;
        el['q-feedback'].hidden = true;
        el['q-next'].disabled = true;
        el['q-next'].innerHTML = (current === drawn.length - 1)
            ? 'See my result <i class="fas fa-flag-checkered"></i>'
            : 'Next <i class="fas fa-arrow-right"></i>';

        el['q-options'].innerHTML = '';
        item.options.forEach(function (opt, i) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quiz-option';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', 'false');
            btn.innerHTML = '<span class="quiz-option-marker">' +
                String.fromCharCode(65 + i) + '</span><span class="quiz-option-text"></span>';
            btn.querySelector('.quiz-option-text').textContent = opt.text;
            btn.addEventListener('click', function () { pick(i); });
            el['q-options'].appendChild(btn);
        });
    }

    function pick(index) {
        var item = drawn[current];
        var buttons = el['q-options'].querySelectorAll('.quiz-option');
        if (buttons[0].disabled) return;   // already answered

        var correct = item.options[index].correct;
        answers.push({ item: item, picked: index, correct: correct });

        buttons.forEach(function (b, i) {
            b.disabled = true;
            b.setAttribute('aria-checked', i === index ? 'true' : 'false');
            if (item.options[i].correct) {
                b.classList.add('is-correct');
                b.querySelector('.quiz-option-marker').innerHTML = '<i class="fas fa-check"></i>';
            } else if (i === index) {
                b.classList.add('is-wrong');
                b.querySelector('.quiz-option-marker').innerHTML = '<i class="fas fa-xmark"></i>';
            }
        });

        el['feedback-head'].className = 'feedback-head ' + (correct ? 'ok' : 'no');
        el['feedback-head'].innerHTML = correct
            ? '<i class="fas fa-circle-check"></i> Correct'
            : '<i class="fas fa-circle-xmark"></i> Not quite';
        el['feedback-why'].textContent = item.src.why || '';
        el['q-feedback'].hidden = false;
        el['q-next'].disabled = false;
    }

    function next() {
        current++;
        if (current >= drawn.length) showResult();
        else renderQuestion();
    }

    // =======================================================================
    // Result
    // =======================================================================

    function showResult() {
        var score = answers.filter(function (a) { return a.correct; }).length;
        var pct = Math.round((score / drawn.length) * 100);
        var passed = score / drawn.length >= QUIZ.passMark;

        el['result-icon'].innerHTML = passed
            ? '<i class="fas fa-award"></i>'
            : '<i class="fas fa-rotate-right"></i>';
        el['result-title'].textContent = passed ? 'You passed' : 'Not this time';
        el['result-score'].textContent = score + ' / ' + drawn.length + '  ·  ' + pct + '%';
        el['result-message'].textContent = passed
            ? 'Nicely done. Enter your name below and your certificate is ready to download.'
            : 'You need ' + Math.ceil(QUIZ.passMark * drawn.length) + ' of ' + drawn.length +
              ' to pass. Have another go — you\'ll get a different set of questions.';

        el['result-review'].innerHTML = '';
        answers.forEach(function (a) {
            var row = document.createElement('div');
            row.className = 'review-row';
            var right = a.item.options.find(function (o) { return o.correct; });
            row.innerHTML =
                '<i class="fas ' + (a.correct ? 'fa-circle-check ok' : 'fa-circle-xmark no') + '"></i>' +
                '<div><span class="review-q"></span>' +
                (a.correct ? '' : '<span class="review-answer"></span>') + '</div>';
            row.querySelector('.review-q').textContent = a.item.src.q;
            if (!a.correct) {
                row.querySelector('.review-answer').textContent = 'Correct answer: ' + right.text;
            }
            el['result-review'].appendChild(row);
        });

        el['cert-form'].hidden = !passed;
        el['retry-actions'].hidden = passed;

        if (passed) {
            var saved = '';
            try { saved = localStorage.getItem(CERT_KEY) || ''; } catch (e) { /* storage off */ }
            el['cert-name'].value = saved;
            validateName();
        }

        showStage('stage-result');
    }

    function validateName() {
        var v = el['cert-name'].value.trim();
        var ok = v.length >= 2 && v.length <= 60;
        el['make-cert'].disabled = !ok;
        el['cert-hint'].textContent = v.length === 0
            ? ''
            : (ok ? '' : 'Please enter between 2 and 60 characters.');
        return ok;
    }

    // =======================================================================
    // Certificate
    // =======================================================================

    /*
     * A short, stable reference derived from the name and date. It makes each
     * certificate look and feel individual, and lets someone quote a reference
     * if they ask about it.
     *
     * It is NOT a verification code and deliberately isn't presented as one.
     * The course is free and ungated, there are no accounts, and everything
     * here runs in the browser — so this certificate records that someone
     * completed the assessment on this device. It is an acknowledgement of
     * work done, not a credential that can be independently verified.
     */
    function makeCertificateId(name, dateStr) {
        var seed = name.toLowerCase().replace(/\s+/g, ' ').trim() + '|' + dateStr;
        var h = 5381;
        for (var i = 0; i < seed.length; i++) {
            h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
        }
        return 'NH-' + h.toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
    }

    function loadImage(src) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { resolve(null); };
            img.src = src;
        });
    }

    /* Canvas renders in a fallback face unless the webfont is actually loaded. */
    function ensureFonts() {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        return Promise.all([
            document.fonts.load('300 100px Poppins'),
            document.fonts.load('400 100px Poppins'),
            document.fonts.load('600 100px Poppins'),
            document.fonts.load('700 100px Poppins'),
        ]).catch(function () { /* fall back to system sans */ });
    }

    /* Shrink until it fits — long names must not overflow the frame. */
    function fitText(ctx, text, maxWidth, startPx, weight, family) {
        var size = startPx;
        do {
            ctx.font = weight + ' ' + size + 'px ' + family;
            if (ctx.measureText(text).width <= maxWidth) break;
            size -= 4;
        } while (size > 28);
        return size;
    }

    async function drawCertificate(name) {
        await ensureFonts();

        var canvas = el['cert-canvas'];
        canvas.width = CERT_W;
        canvas.height = CERT_H;
        var ctx = canvas.getContext('2d');

        var PURPLE = '#703ACF';
        var DEEP = '#5C2CAB';
        var ACCENT = '#9468E1';
        var INK = '#212529';
        var MUTED = '#6c757d';
        var FAM = 'Poppins, Helvetica, Arial, sans-serif';
        var cx = CERT_W / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, CERT_W, CERT_H);

        // Corner wash — subtle brand colour without overwhelming the page
        var wash = ctx.createLinearGradient(0, 0, CERT_W * 0.55, CERT_H * 0.5);
        wash.addColorStop(0, 'rgba(230, 217, 255, 0.85)');
        wash.addColorStop(1, 'rgba(230, 217, 255, 0)');
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, CERT_W, CERT_H);

        // Double rule frame
        ctx.strokeStyle = PURPLE;
        ctx.lineWidth = 10;
        ctx.strokeRect(46, 46, CERT_W - 92, CERT_H - 92);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(72, 72, CERT_W - 144, CERT_H - 144);

        ctx.textAlign = 'center';

        // Logo
        var logo = await loadImage(typeof CERT_LOGO !== 'undefined' ? CERT_LOGO : '');
        if (logo) {
            var lw = 430;
            var lh = lw * (logo.height / logo.width);
            ctx.drawImage(logo, cx - lw / 2, 178, lw, lh);
        } else {
            // Typographic fallback so the certificate is never unbranded
            ctx.font = '700 66px ' + FAM;
            ctx.fillStyle = INK;
            ctx.fillText('NEGOTIATE', cx - 42, 243);
            ctx.fillStyle = PURPLE;
            ctx.fillText('HER', cx + 172, 243);
        }

        ctx.font = '600 30px ' + FAM;
        ctx.fillStyle = ACCENT;
        ctx.letterSpacing = '10px';
        ctx.fillText('CERTIFICATE OF COMPLETION', cx, 452);
        ctx.letterSpacing = '0px';

        ctx.font = '300 34px ' + FAM;
        ctx.fillStyle = MUTED;
        ctx.fillText('This is to certify that', cx, 564);

        // Recipient
        var nameSize = fitText(ctx, name, CERT_W - 460, 116, '600', FAM);
        ctx.font = '600 ' + nameSize + 'px ' + FAM;
        ctx.fillStyle = DEEP;
        ctx.fillText(name, cx, 702);

        // Rule under the name, sized to the text
        var nameW = Math.min(ctx.measureText(name).width + 130, CERT_W - 400);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - nameW / 2, 754);
        ctx.lineTo(cx + nameW / 2, 754);
        ctx.stroke();

        ctx.font = '300 34px ' + FAM;
        ctx.fillStyle = MUTED;
        ctx.fillText('has successfully completed the course', cx, 832);

        var courseSize = fitText(ctx, 'Strategic Career Negotiations', CERT_W - 460, 62, '600', FAM);
        ctx.font = '600 ' + courseSize + 'px ' + FAM;
        ctx.fillStyle = INK;
        ctx.fillText('Strategic Career Negotiations', cx, 926);

        ctx.font = '300 28px ' + FAM;
        ctx.fillStyle = MUTED;
        ctx.fillText('including the final assessment', cx, 982);

        // A small mark to anchor the space above the signatures — without it
        // the lower third of the certificate reads as an accidental gap.
        ctx.fillStyle = ACCENT;
        [-1, 0, 1].forEach(function (i) {
            ctx.beginPath();
            ctx.arc(cx + i * 34, 1062, i === 0 ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // ---- Footer: signature left, date right ----
        var date = new Date();
        var dateStr = date.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        var footY = 1176;
        var colW = 460;
        var leftX = cx - 380;
        var rightX = cx + 380;

        ctx.strokeStyle = '#CED4DA';
        ctx.lineWidth = 2;
        [leftX, rightX].forEach(function (x) {
            ctx.beginPath();
            ctx.moveTo(x - colW / 2, footY);
            ctx.lineTo(x + colW / 2, footY);
            ctx.stroke();
        });

        ctx.font = '600 32px ' + FAM;
        ctx.fillStyle = INK;
        ctx.fillText('Gitanjali Ponnappa', leftX, footY + 48);
        ctx.fillText(dateStr, rightX, footY + 48);

        ctx.font = '300 25px ' + FAM;
        ctx.fillStyle = MUTED;
        ctx.fillText('Founder, NegotiateHer', leftX, footY + 90);
        ctx.fillText('Date of completion', rightX, footY + 90);

        ctx.font = '400 22px ' + FAM;
        ctx.fillStyle = '#ADB5BD';
        ctx.fillText('Certificate reference ' + makeCertificateId(name, dateStr) +
            '   ·   negotiateher.com', cx, CERT_H - 92);

        return canvas;
    }

    async function generate() {
        if (!validateName()) return;
        var name = el['cert-name'].value.trim().replace(/\s+/g, ' ');
        try { localStorage.setItem(CERT_KEY, name); } catch (e) { /* storage off */ }

        el['make-cert'].disabled = true;
        el['make-cert'].innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…';
        await drawCertificate(name);
        el['make-cert'].disabled = false;
        el['make-cert'].innerHTML = '<i class="fas fa-certificate"></i> Generate my certificate';

        showStage('stage-cert');
    }

    function download() {
        var name = (el['cert-name'].value.trim() || 'certificate').replace(/[^\w\s-]/g, '');
        var file = 'NegotiateHer Certificate - ' + name.replace(/\s+/g, ' ') + '.png';
        el['cert-canvas'].toBlob(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = file;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }, 'image/png');
    }

    // =======================================================================
    // Init
    // =======================================================================

    function checkGate() {
        var progress = readProgress();
        var total = 0, done = 0;

        // course-data.js may not be loaded on this page; fall back to counting
        // whatever the learner has actually marked complete.
        if (typeof COURSE !== 'undefined' && COURSE.flatLessons) {
            COURSE.flatLessons.forEach(function (l) {
                if (!l.youtubeId) return;
                total++;
                var e = progress.lessons[l.id];
                if (e && e.done) done++;
            });
        } else {
            Object.keys(progress.lessons).forEach(function (k) {
                if (progress.lessons[k].done) done++;
            });
        }

        if (total && done < total) {
            el['gate-detail'].textContent =
                ' You\'ve completed ' + done + ' of ' + total + ' lessons.';
            el['gate-warning'].hidden = false;
        }
    }

    // =======================================================================
    // Dev shortcuts — localhost only
    // =======================================================================

    /*
     * Gate the dev bar on where the page is being served from, not on a flag
     * someone has to remember to flip back. On elearning.negotiateher.com this
     * returns false and the bar stays hidden, so there is nothing to strip out
     * before deploying.
     */
    function isLocal() {
        var h = location.hostname;
        return h === 'localhost' || h === '127.0.0.1' || h === '::1' ||
            h === '' || location.protocol === 'file:';
    }

    /* Runs the genuine result path with a full-marks set, so what you see is
     * exactly what a real learner sees — same review list, same cert form. */
    function devJump(allCorrect) {
        drawn = drawQuestions(QUIZ.draw);
        answers = drawn.map(function (item) {
            var correctIdx = 0;
            item.options.forEach(function (o, i) { if (o.correct) correctIdx = i; });
            var wrongIdx = correctIdx === 0 ? 1 : 0;
            return {
                item: item,
                picked: allCorrect ? correctIdx : wrongIdx,
                correct: allCorrect,
            };
        });
        current = drawn.length;
        showResult();
        if (allCorrect) {
            if (!el['cert-name'].value) el['cert-name'].value = 'Gitanjali Ponnappa';
            validateName();
        }
    }

    function setupDevBar() {
        if (!isLocal()) return;
        var bar = document.getElementById('dev-bar');
        if (!bar) return;
        bar.hidden = false;
        document.getElementById('dev-skip')
            .addEventListener('click', function () { devJump(true); });
        document.getElementById('dev-fail')
            .addEventListener('click', function () { devJump(false); });
    }

    function init() {
        el['intro-draw'].textContent = Math.min(QUIZ.draw, QUIZ.questions.length);
        el['intro-pass'].textContent = Math.round(QUIZ.passMark * 100) + '%';

        checkGate();
        setupDevBar();

        el['start-quiz'].addEventListener('click', startQuiz);
        el['q-next'].addEventListener('click', next);
        el['retry-quiz'].addEventListener('click', startQuiz);
        el['make-cert'].addEventListener('click', generate);
        el['cert-name'].addEventListener('input', validateName);
        el['cert-name'].addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && validateName()) generate();
        });
        el['download-cert'].addEventListener('click', download);
        el['rename-cert'].addEventListener('click', function () {
            showStage('stage-result');
            el['cert-name'].focus();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
