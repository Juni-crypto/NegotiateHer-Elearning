/*
 * NegotiateHer — course player
 * ---------------------------------------------------------------------------
 * Reads COURSE from course-data.js, drives a YouTube IFrame player, and keeps
 * per-lesson progress in localStorage. No backend, no accounts.
 *
 * Progress is per-browser by design: the course is free and ungated, so there
 * is nothing to authenticate against. Clearing site data clears progress.
 */
(function () {
    'use strict';

    // --- Tunables -----------------------------------------------------------
    var STORAGE_KEY = 'nh_progress_v1';
    var COMPLETE_RATIO = 0.9;   // counts as watched at 90% — skips outros
    var SAVE_EVERY_MS = 5000;   // throttle writes while playing
    var RESUME_FLOOR = 10;      // don't bother resuming the first 10s
    var RESUME_CEILING = 15;    // don't resume inside the last 15s

    var LESSONS = COURSE.flatLessons;

    // --- Element handles ----------------------------------------------------
    var el = {
        title: document.getElementById('course-title'),
        subtitle: document.getElementById('course-subtitle'),
        nav: document.getElementById('lesson-nav'),
        sidebar: document.getElementById('course-sidebar'),
        scrim: document.getElementById('sidebar-scrim'),
        toggleSidebar: document.getElementById('lessons-toggle'),
        overallFill: document.getElementById('overall-fill'),
        overallLabel: document.getElementById('overall-label'),
        placeholder: document.getElementById('player-placeholder'),
        endcard: document.getElementById('player-endcard'),
        endcardNext: document.getElementById('endcard-next'),
        endcardNextTitle: document.getElementById('endcard-next-title'),
        endcardReplay: document.getElementById('endcard-replay'),
        eyebrow: document.getElementById('lesson-eyebrow'),
        lessonTitle: document.getElementById('lesson-title'),
        moduleDesc: document.getElementById('lesson-module-desc'),
        prev: document.getElementById('prev-lesson'),
        next: document.getElementById('next-lesson'),
        toggleComplete: document.getElementById('toggle-complete'),
        reset: document.getElementById('reset-progress'),
        done: document.getElementById('course-done')
    };

    // --- State --------------------------------------------------------------
    var progress = loadProgress();
    var current = 0;
    var player = null;
    var apiReady = false;
    var pendingLoad = null;
    var ticker = null;
    var lastSaveAt = 0;

    // =======================================================================
    // Persistence
    // =======================================================================

    function loadProgress() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : null;
            if (parsed && typeof parsed === 'object' && parsed.lessons) return parsed;
        } catch (err) {
            // Private mode, disabled storage, or corrupt JSON — fall through to
            // a fresh in-memory object so the player still works.
        }
        return { lessons: {}, last: null };
    }

    /*
     * Merge before writing rather than overwriting outright.
     *
     * Two tabs open on the course each hold their own in-memory copy loaded at
     * page load. Without this merge, whichever tab saves last wipes out
     * whatever the other one recorded — finish three lessons in tab A, let tab
     * B tick once, and tab A's progress is gone. Opening a lesson in a new tab
     * is normal behaviour, so this needs to be safe.
     *
     * Completion is sticky (never un-done by a merge) and positions take the
     * furthest of the two, except for the lesson this tab is actively playing,
     * where our own play head is the truth.
     */
    function saveProgress() {
        try {
            var stored = null;
            try {
                stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            } catch (e) {
                stored = null;   // corrupt value — ours replaces it
            }

            if (stored && stored.lessons) {
                var activeId = LESSONS[current] && LESSONS[current].id;
                Object.keys(stored.lessons).forEach(function (id) {
                    var theirs = stored.lessons[id];
                    var ours = progress.lessons[id];
                    if (!ours) {
                        progress.lessons[id] = theirs;
                        return;
                    }
                    ours.done = ours.done || theirs.done;
                    ours.max = Math.max(ours.max || 0, theirs.max || 0);
                    if (id !== activeId) {
                        ours.pos = Math.max(ours.pos || 0, theirs.pos || 0);
                    }
                });
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (err) {
            // Storage unavailable or full. Progress stays in memory for this
            // session; nothing else in the page depends on the write landing.
        }
    }

    function entryFor(lessonId) {
        if (!progress.lessons[lessonId]) {
            progress.lessons[lessonId] = { pos: 0, max: 0, done: false };
        }
        return progress.lessons[lessonId];
    }

    function isDone(lessonId) {
        var e = progress.lessons[lessonId];
        return !!(e && e.done);
    }

    // =======================================================================
    // Rendering
    // =======================================================================

    function playableCount() {
        return LESSONS.filter(function (l) { return !!l.youtubeId; }).length;
    }

    function completedCount() {
        return LESSONS.filter(function (l) { return !!l.youtubeId && isDone(l.id); }).length;
    }

    function renderOverall() {
        var total = playableCount();
        var pct = total ? Math.round((completedCount() / total) * 100) : 0;
        el.overallFill.style.width = pct + '%';
        el.overallLabel.textContent = pct + '%';
        el.done.hidden = !(total > 0 && pct === 100);
    }

    function renderNav() {
        el.nav.innerHTML = '';

        COURSE.modules.forEach(function (mod) {
            var block = document.createElement('div');
            block.className = 'nav-module';

            var head = document.createElement('div');
            head.className = 'nav-module-head';
            head.innerHTML =
                '<span class="nav-module-number">Module ' + mod.number + '</span>' +
                '<span class="nav-module-title"></span>';
            head.querySelector('.nav-module-title').textContent = mod.title;
            block.appendChild(head);

            mod.lessons.forEach(function (lesson) {
                var index = LESSONS.findIndex(function (l) { return l.id === lesson.id; });
                var locked = !lesson.youtubeId;

                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nav-lesson';
                if (locked) btn.className += ' is-locked';
                if (isDone(lesson.id)) btn.className += ' is-done';
                if (index === current) btn.className += ' is-active';
                btn.disabled = locked;

                var icon = locked ? 'fa-regular fa-clock'
                    : isDone(lesson.id) ? 'fa-solid fa-circle-check'
                        : 'fa-regular fa-circle-play';

                btn.innerHTML =
                    '<i class="nav-lesson-icon ' + icon + '"></i>' +
                    '<span class="nav-lesson-text"></span>' +
                    '<span class="nav-lesson-duration"></span>';
                btn.querySelector('.nav-lesson-text').textContent = lesson.title;
                btn.querySelector('.nav-lesson-duration').textContent =
                    locked ? 'soon' : (lesson.minutes ? lesson.minutes + ' min' : '');

                if (!locked) {
                    btn.addEventListener('click', function () {
                        go(index, true);
                        closeSidebar();
                    });
                }

                block.appendChild(btn);
            });

            el.nav.appendChild(block);
        });
    }

    function renderLessonMeta() {
        var lesson = LESSONS[current];
        el.eyebrow.textContent = 'Module ' + lesson.moduleNumber + ' — ' + lesson.moduleTitle;
        el.lessonTitle.textContent = lesson.title;

        var mod = COURSE.modules.find(function (m) { return m.id === lesson.moduleId; });
        el.moduleDesc.textContent = mod ? mod.description : '';

        el.prev.disabled = current === 0;
        el.next.disabled = current >= LESSONS.length - 1;

        var done = isDone(lesson.id);
        el.toggleComplete.classList.toggle('is-done', done);
        el.toggleComplete.querySelector('i').className = done
            ? 'fa-solid fa-circle-check'
            : 'fa-regular fa-circle';
        el.toggleComplete.querySelector('span').textContent = done
            ? 'Completed'
            : 'Mark complete';
        el.toggleComplete.disabled = !lesson.youtubeId;
    }

    function renderAll() {
        renderNav();
        renderLessonMeta();
        renderOverall();
    }

    // =======================================================================
    // YouTube player
    // =======================================================================

    function injectApi() {
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }

    // The API calls this global when it finishes loading.
    window.onYouTubeIframeAPIReady = function () {
        apiReady = true;
        if (pendingLoad !== null) {
            var req = pendingLoad;
            pendingLoad = null;
            mountPlayer(req.videoId, req.startAt);
        }
    };

    function mountPlayer(videoId, startAt) {
        player = new YT.Player('player', {
            videoId: videoId,
            // Privacy-enhanced domain: no tracking cookie until playback starts.
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
                rel: 0,             // restrict end-screen suggestions to this channel
                playsinline: 1,     // don't force fullscreen on iOS
                start: startAt || 0
            },
            events: {
                onStateChange: onPlayerStateChange
            }
        });
    }

    function loadLessonVideo(lesson, autoplay) {
        var entry = entryFor(lesson.id);

        // Resume mid-lesson, but not at the very start or the very end.
        var duration = entry.max || 0;
        var startAt = 0;
        if (entry.pos > RESUME_FLOOR && (!duration || entry.pos < duration - RESUME_CEILING)) {
            startAt = Math.floor(entry.pos);
        }

        if (!player) {
            if (!apiReady) {
                pendingLoad = { videoId: lesson.youtubeId, startAt: startAt };
                return;
            }
            mountPlayer(lesson.youtubeId, startAt);
            return;
        }

        if (autoplay) {
            player.loadVideoById({ videoId: lesson.youtubeId, startSeconds: startAt });
        } else {
            player.cueVideoById({ videoId: lesson.youtubeId, startSeconds: startAt });
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            el.endcard.hidden = true;
            startTicker();
        } else {
            stopTicker();
            recordPosition(true);
            if (event.data === YT.PlayerState.ENDED) {
                markComplete(LESSONS[current].id, true);
                showEndcard();
            }
        }
    }

    function startTicker() {
        stopTicker();
        ticker = setInterval(function () { recordPosition(false); }, 1000);
    }

    function stopTicker() {
        if (ticker) {
            clearInterval(ticker);
            ticker = null;
        }
    }

    /* Pull the play head off the player and fold it into progress. */
    function recordPosition(force) {
        if (!player || typeof player.getCurrentTime !== 'function') return;

        var lesson = LESSONS[current];
        if (!lesson || !lesson.youtubeId) return;

        var pos = player.getCurrentTime() || 0;
        var duration = player.getDuration() || 0;
        if (!duration) return;

        var entry = entryFor(lesson.id);
        entry.pos = pos;
        entry.max = duration;
        progress.last = lesson.id;

        if (!entry.done && pos / duration >= COMPLETE_RATIO) {
            markComplete(lesson.id, false);
        }

        var now = Date.now();
        if (force || now - lastSaveAt >= SAVE_EVERY_MS) {
            lastSaveAt = now;
            saveProgress();
        }
    }

    function markComplete(lessonId, save) {
        var entry = entryFor(lessonId);
        if (entry.done) return;
        entry.done = true;
        if (save) saveProgress();
        renderNav();
        renderLessonMeta();
        renderOverall();
    }

    // =======================================================================
    // End card — covers YouTube's own end-screen grid
    // =======================================================================

    function nextPlayableIndex(from) {
        for (var i = from + 1; i < LESSONS.length; i++) {
            if (LESSONS[i].youtubeId) return i;
        }
        return -1;
    }

    function showEndcard() {
        var nextIdx = nextPlayableIndex(current);
        if (nextIdx === -1) {
            el.endcardNextTitle.textContent = 'That was the last lesson.';
            el.endcardNext.hidden = true;
        } else {
            el.endcardNextTitle.textContent = 'Up next: ' + LESSONS[nextIdx].title;
            el.endcardNext.hidden = false;
        }
        el.endcard.hidden = false;
    }

    // =======================================================================
    // Navigation
    // =======================================================================

    function go(index, autoplay) {
        if (index < 0 || index >= LESSONS.length) return;

        recordPosition(true);
        stopTicker();

        current = index;
        var lesson = LESSONS[current];

        el.endcard.hidden = true;
        progress.last = lesson.id;
        saveProgress();

        if (lesson.youtubeId) {
            el.placeholder.hidden = true;
            loadLessonVideo(lesson, autoplay);
        } else {
            el.placeholder.hidden = false;
            if (player && typeof player.stopVideo === 'function') player.stopVideo();
        }

        renderAll();

        if (history.replaceState) {
            history.replaceState(null, '', '#' + lesson.id);
        } else {
            location.hash = lesson.id;
        }
    }

    function step(delta) {
        var target = current + delta;
        while (target >= 0 && target < LESSONS.length && !LESSONS[target].youtubeId) {
            target += delta;
        }
        if (target < 0 || target >= LESSONS.length) return;
        go(target, true);
    }

    // =======================================================================
    // Sidebar (mobile)
    // =======================================================================

    function openSidebar() {
        el.sidebar.classList.add('is-open');
        el.scrim.hidden = false;
        el.toggleSidebar.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
        el.sidebar.classList.remove('is-open');
        el.scrim.hidden = true;
        el.toggleSidebar.setAttribute('aria-expanded', 'false');
    }

    // =======================================================================
    // Wiring
    // =======================================================================

    function startingIndex() {
        var hash = (location.hash || '').replace('#', '');
        if (hash) {
            var byHash = LESSONS.findIndex(function (l) { return l.id === hash; });
            if (byHash !== -1) return byHash;
        }
        if (progress.last) {
            var byLast = LESSONS.findIndex(function (l) { return l.id === progress.last; });
            if (byLast !== -1) return byLast;
        }
        var firstPlayable = LESSONS.findIndex(function (l) { return !!l.youtubeId; });
        return firstPlayable === -1 ? 0 : firstPlayable;
    }

    function init() {
        el.title.textContent = COURSE.title;
        el.subtitle.textContent = COURSE.subtitle;

        el.prev.addEventListener('click', function () { step(-1); });
        el.next.addEventListener('click', function () { step(1); });

        el.toggleComplete.addEventListener('click', function () {
            var lesson = LESSONS[current];
            var entry = entryFor(lesson.id);
            entry.done = !entry.done;
            saveProgress();
            renderAll();
        });

        el.endcardNext.addEventListener('click', function () {
            var nextIdx = nextPlayableIndex(current);
            if (nextIdx !== -1) go(nextIdx, true);
        });

        el.endcardReplay.addEventListener('click', function () {
            el.endcard.hidden = true;
            if (player && typeof player.seekTo === 'function') {
                player.seekTo(0, true);
                player.playVideo();
            }
        });

        el.reset.addEventListener('click', function () {
            if (!confirm('Reset your progress for this course? This cannot be undone.')) return;
            progress = { lessons: {}, last: null };
            saveProgress();
            renderAll();
        });

        el.toggleSidebar.addEventListener('click', function () {
            if (el.sidebar.classList.contains('is-open')) closeSidebar();
            else openSidebar();
        });
        el.scrim.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeSidebar();
        });

        // A shared lesson link (#m3l2) opened while this page is already loaded
        // is a fragment navigation — no reload, so init() never re-runs. Handle
        // it here. replaceState() does not fire hashchange, so go() can't loop.
        window.addEventListener('hashchange', function () {
            var id = (location.hash || '').replace('#', '');
            if (!id) return;
            var idx = LESSONS.findIndex(function (l) { return l.id === id; });
            if (idx !== -1 && idx !== current) go(idx, false);
        });

        // Last-chance save when the tab is hidden or closed. `pagehide` fires
        // reliably on mobile Safari where `beforeunload` does not.
        window.addEventListener('pagehide', function () { recordPosition(true); });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') recordPosition(true);
        });

        current = startingIndex();
        renderAll();

        var lesson = LESSONS[current];
        if (lesson.youtubeId) {
            injectApi();
            loadLessonVideo(lesson, false);
        } else {
            el.placeholder.hidden = false;
        }

        if (history.replaceState) history.replaceState(null, '', '#' + lesson.id);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
