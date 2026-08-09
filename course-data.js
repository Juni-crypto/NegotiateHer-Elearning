/*
 * NegotiateHer — Course manifest
 * ---------------------------------------------------------------------------
 * This is the ONLY file you edit when videos change. Everything else reads it.
 *
 * HOW TO FILL THIS IN
 *   1. Upload each video to the @NegotiateHer channel as UNLISTED
 *      (YouTube Studio → drag folder in → bulk-select → Visibility: Unlisted).
 *      Do NOT use the API — the daily quota only allows ~6 uploads/day.
 *   2. Copy each video's ID from its URL:
 *        https://youtu.be/dQw4w9WgXcQ   ->   "dQw4w9WgXcQ"
 *        https://www.youtube.com/watch?v=dQw4w9WgXcQ   ->   "dQw4w9WgXcQ"
 *   3. Paste it into `youtubeId` below and set `title` + `minutes`.
 *
 * Any lesson still holding "" for youtubeId renders as "Coming soon" and is
 * skipped by the player — so you can ship this page before the migration ends
 * and fill lessons in as they upload.
 *
 * `driveId` is optional bookkeeping: it records which Drive file this lesson
 * came from, so the archive stays traceable. It is never loaded by the site.
 */

const COURSE = {
  title: 'Strategic Career Negotiations',
  subtitle: 'A step-by-step framework to navigate any negotiation — free, self-paced.',

  modules: [
    {
      id: 'm1',
      number: 1,
      title: 'Course Overview',
      description: '',
      lessons: [
        { id: 'm1l1', title: 'Course Overview (Part 1 of 5)', youtubeId: 'G4MKq0hv3O0', minutes: 2, driveId: '' },
        { id: 'm1l2', title: 'Course Overview (Part 2 of 5)', youtubeId: 'n_MWAJym70o', minutes: 1, driveId: '' },
        { id: 'm1l3', title: 'Course Overview (Part 3 of 5)', youtubeId: 'c4yQNM9LBbw', minutes: 1, driveId: '' },
        { id: 'm1l4', title: 'Course Overview (Part 4 of 5)', youtubeId: '8DxS_lWfRuI', minutes: 2, driveId: '' },
        { id: 'm1l5', title: 'Course Overview (Part 5 of 5)', youtubeId: 'sRruZb7ADE4', minutes: 1, driveId: '' },
      ],
    },
    {
      id: 'm2',
      number: 2,
      title: 'Your Instructor',
      description: '',
      lessons: [
        { id: 'm2l1', title: 'Your Instructor', youtubeId: 'qNLKTbyC-vg', minutes: 2, driveId: '' },
      ],
    },
    {
      id: 'm3',
      number: 3,
      title: 'Introducing the NegotiateHer Three-Step Detective Approach',
      description: '',
      lessons: [
        { id: 'm3l1', title: 'Introducing the NegotiateHer Three-Step Detective Approach (Part 1 of 2)', youtubeId: 'QMz9A8zrJt4', minutes: 2, driveId: '' },
        { id: 'm3l2', title: 'Introducing the NegotiateHer Three-Step Detective Approach (Part 2 of 2)', youtubeId: 'U_Z04SO-uao', minutes: 2, driveId: '' },
      ],
    },
    {
      id: 'm4',
      number: 4,
      title: 'Know Your Personal Values',
      description: '',
      lessons: [
        { id: 'm4l1', title: 'Know Your Personal Values (Part 1 of 4)', youtubeId: 'tdRCvuvtICI', minutes: 2, driveId: '' },
        { id: 'm4l2', title: 'Know Your Personal Values (Part 2 of 4)', youtubeId: 'mUi3NrfbPZA', minutes: 1, driveId: '' },
        { id: 'm4l3', title: 'Know Your Personal Values (Part 3 of 4)', youtubeId: 'od6vFzKJL5Y', minutes: 1, driveId: '' },
        { id: 'm4l4', title: 'Know Your Personal Values (Part 4 of 4)', youtubeId: 'yP76n7etcl8', minutes: 1, driveId: '' },
      ],
    },
    {
      id: 'm5',
      number: 5,
      title: 'Know the Other Person\'s Personality',
      description: '',
      lessons: [
        { id: 'm5l1', title: 'Know the Other Person\'s Personality (Part 1 of 4)', youtubeId: 'qvVkCdkFaTY', minutes: 2, driveId: '' },
        { id: 'm5l2', title: 'Know the Other Person\'s Personality (Part 2 of 4)', youtubeId: 'oRfl5CRm36Q', minutes: 2, driveId: '' },
        { id: 'm5l3', title: 'Know the Other Person\'s Personality (Part 3 of 4)', youtubeId: '1dXNsv2oKEM', minutes: 1, driveId: '' },
        { id: 'm5l4', title: 'Know the Other Person\'s Personality (Part 4 of 4)', youtubeId: 'GDderKARrNY', minutes: 1, driveId: '' },
      ],
    },
    {
      id: 'm6',
      number: 6,
      title: 'Build Empathy',
      description: '',
      lessons: [
        { id: 'm6l1', title: 'Build Empathy (Part 1 of 4)', youtubeId: 'bReU0XRMArQ', minutes: 3, driveId: '' },
        { id: 'm6l2', title: 'Build Empathy (Part 2 of 4)', youtubeId: 'e5tuom7rFFo', minutes: 3, driveId: '' },
        { id: 'm6l3', title: 'Build Empathy (Part 3 of 4)', youtubeId: '0KbU_9eRCks', minutes: 4, driveId: '' },
        { id: 'm6l4', title: 'Build Empathy (Part 4 of 4)', youtubeId: '9EecRp0NeX8', minutes: 4, driveId: '' },
      ],
    },
    {
      id: 'm7',
      number: 7,
      title: 'Engage Actively',
      description: '',
      lessons: [
        { id: 'm7l1', title: 'Engage Actively (Part 1 of 6)', youtubeId: 'K0YRQs5t9Y8', minutes: 1, driveId: '' },
        { id: 'm7l2', title: 'Engage Actively (Part 2 of 6)', youtubeId: 't8WrXm6Shw0', minutes: 3, driveId: '' },
        { id: 'm7l3', title: 'Engage Actively (Part 3 of 6)', youtubeId: '1z_fB2fHcIQ', minutes: 3, driveId: '' },
        { id: 'm7l4', title: 'Engage Actively (Part 4 of 6)', youtubeId: '', minutes: 3, driveId: '' },
        { id: 'm7l5', title: 'Engage Actively (Part 5 of 6)', youtubeId: '', minutes: 4, driveId: '' },
        { id: 'm7l6', title: 'Engage Actively (Part 6 of 6)', youtubeId: '', minutes: 2, driveId: '' },
      ],
    },
    {
      id: 'm8',
      number: 8,
      title: 'Thank You',
      description: '',
      lessons: [
        { id: 'm8l1', title: 'Thank You', youtubeId: '_YC-qEy75nI', minutes: 2, driveId: '' },
      ],
    },
  ],
};

/* Flat lesson list in course order — used for next/prev and progress totals. */
COURSE.flatLessons = COURSE.modules.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNumber: m.number, moduleTitle: m.title }))
);
