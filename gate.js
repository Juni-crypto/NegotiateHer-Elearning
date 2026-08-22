/*
 * NegotiateHer — email gate
 * ---------------------------------------------------------------------------
 * Collects a name and email before the course opens, and posts them to the
 * existing MailerLite list. Once submitted, the visitor is remembered in
 * localStorage and never sees the gate again on that browser.
 *
 * The captured name is reused later to prefill the certificate, so the learner
 * types it once rather than twice.
 */
(function () {
    'use strict';

    var ACCESS_KEY = 'nh_access_v1';
    var CERT_KEY = 'nh_cert_name_v1';   // read by quiz.js when building the certificate

    /*
     * MailerLite account and form already embedded on the landing page footer.
     * 8X3T70 is the general newsletter form. If a dedicated "free course"
     * form is created in MailerLite, change FORM_ID only — nothing else here
     * depends on it. Using a dedicated form is worth doing: it keeps course
     * signups segmentable from plain newsletter signups.
     */
    var ACCOUNT_ID = '923663';
    var FORM_ID = '8X3T70';
    var ENDPOINT = 'https://assets.mailerlite.com/jsonp/' + ACCOUNT_ID +
                   '/forms/' + FORM_ID + '/subscribe';

    function hasAccess() {
        try {
            return !!localStorage.getItem(ACCESS_KEY);
        } catch (err) {
            // Storage blocked (private mode, cookies disabled). Don't lock a
            // learner out of free content because of that — let them through.
            return true;
        }
    }

    function grantAccess(name, email) {
        try {
            localStorage.setItem(ACCESS_KEY, JSON.stringify({
                email: email, name: name, at: new Date().toISOString()
            }));
            if (name) localStorage.setItem(CERT_KEY, name);
        } catch (err) { /* nothing else depends on the write landing */ }
    }

    function validEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    }

    function build() {
        var el = document.createElement('div');
        el.className = 'gate-overlay';
        el.id = 'gate-overlay';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-labelledby', 'gate-title');
        el.innerHTML = [
            '<div class="gate-card">',
            '  <div class="gate-logo">',
            '    <img src="https://negotiateher.com/assets/img/templogo_01.png" alt="NegotiateHer">',
            '  </div>',
            '  <h2 id="gate-title">Start your free course</h2>',
            '  <p class="gate-lede">The whole course is free. Tell us where to send your',
            '     progress updates and new lessons, and you\'re straight in.</p>',
            '  <form id="gate-form" novalidate>',
            '    <div class="gate-field">',
            '      <label for="gate-name">First name</label>',
            '      <input type="text" id="gate-name" name="name" autocomplete="given-name"',
            '             maxlength="60" placeholder="Gitanjali">',
            '    </div>',
            '    <div class="gate-field">',
            '      <label for="gate-email">Email address</label>',
            '      <input type="email" id="gate-email" name="email" autocomplete="email"',
            '             maxlength="120" placeholder="you@example.com" required>',
            '    </div>',
            '    <label class="gate-consent">',
            '      <input type="checkbox" id="gate-consent" required>',
            '      <span>Yes, email me negotiation tips and course updates from',
            '        NegotiateHer. I can unsubscribe at any time.</span>',
            '    </label>',
            '    <p class="gate-error" id="gate-error" role="alert"></p>',
            '    <button type="submit" class="btn btn-primary btn-large" id="gate-submit">',
            '      Start the course <i class="fas fa-arrow-right"></i>',
            '    </button>',
            '  </form>',
            '  <p class="gate-fineprint">We only use your address for the course and',
            '     the newsletter. We never sell or share it.</p>',
            '</div>'
        ].join('\n');
        return el;
    }

    function submitToMailerLite(name, email) {
        var body = new URLSearchParams();
        body.append('fields[email]', email);
        if (name) body.append('fields[name]', name);
        body.append('ml-submit', '1');
        body.append('anticsrf', 'true');

        return fetch(ENDPOINT, {
            method: 'POST',
            body: body,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    }

    function init() {
        if (hasAccess()) return;

        var overlay = build();
        document.body.appendChild(overlay);
        document.body.classList.add('gate-locked');

        var form = document.getElementById('gate-form');
        var nameEl = document.getElementById('gate-name');
        var emailEl = document.getElementById('gate-email');
        var consentEl = document.getElementById('gate-consent');
        var errEl = document.getElementById('gate-error');
        var btn = document.getElementById('gate-submit');

        setTimeout(function () { emailEl.focus(); }, 100);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            errEl.textContent = '';
            emailEl.classList.remove('is-invalid');

            var name = nameEl.value.trim();
            var email = emailEl.value.trim();

            if (!validEmail(email)) {
                emailEl.classList.add('is-invalid');
                errEl.textContent = 'Please enter a valid email address.';
                emailEl.focus();
                return;
            }
            if (!consentEl.checked) {
                errEl.textContent = 'Please tick the box so we can email you.';
                consentEl.focus();
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Just a moment…';

            /*
             * Let the learner in regardless of what MailerLite returns.
             * This is free content: a subscription API hiccup must never be
             * the reason someone can't watch it. The address is stored locally
             * either way, so a failed send is recoverable.
             */
            function unlock() {
                grantAccess(name, email);
                document.body.classList.remove('gate-locked');
                overlay.remove();
            }

            submitToMailerLite(name, email)
                .then(unlock)
                .catch(function (err) {
                    if (window.console) console.warn('[gate] subscribe failed:', err);
                    unlock();
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
