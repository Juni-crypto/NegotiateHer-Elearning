/*
 * NegotiateHer — certificate quiz question bank
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE to change the quiz. Nothing else needs touching.
 *
 * HOW IT WORKS
 *   Each attempt draws `draw` questions from the bank, spread across as many
 *   modules as possible, and shuffles the answer order every single time. With
 *   32 questions drawn 8 at a time, two attempts in a row look nothing alike.
 *
 * ADDING A QUESTION
 *   { id: 'q33', module: 4, q: '...', options: ['a','b','c','d'],
 *     answer: 0,          // index into options, BEFORE shuffling
 *     why: 'shown after answering' }
 *
 *   `answer` indexes the array as written here. The shuffle tracks the correct
 *   option by identity, so you never renumber anything.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PLEASE REVIEW BEFORE LAUNCH
 *   These are principle-level questions written from the module structure and
 *   from Gi's published bio. They are answerable by someone who watched the
 *   course, but they were NOT written from the video transcripts — nobody has
 *   checked them against what is actually said on screen.
 *
 *   Read them once. Anything that misstates the course, fix or delete. To make
 *   the quiz genuinely course-specific, add questions that quote the material
 *   directly — the engine handles any bank size without changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const QUIZ = {
  draw: 8,          // questions per attempt
  passMark: 0.75,   // 6 of 8 to pass

  questions: [
    // ---- Module 1 — Course Overview ---------------------------------------
    {
      id: 'q1', module: 1,
      q: 'What does this course set out to give you?',
      options: [
        'A repeatable framework you can apply to any negotiation',
        'A set of scripts to memorise word for word',
        'A list of salary figures for every industry',
        'A guarantee that you will get whatever you ask for',
      ],
      answer: 0,
      why: 'The course teaches a structure you carry into any conversation, rather than lines that only fit one situation.',
    },
    {
      id: 'q2', module: 1,
      q: 'Who is the course primarily designed for?',
      options: [
        'People in the early to mid stages of their career who have had few chances to practise negotiating',
        'Only senior executives negotiating board-level contracts',
        'Professional mediators seeking accreditation',
        'Law students preparing for exams',
      ],
      answer: 0,
      why: 'It is built for people who have not yet had many real opportunities to practise the skill.',
    },
    {
      id: 'q3', module: 1,
      q: 'The course treats negotiation as a skill rather than a personality trait. What follows from that?',
      options: [
        'It can be learned and improved with deliberate practice',
        'Only naturally confident people should attempt it',
        'It cannot be taught in a structured way',
        'Preparation makes very little difference',
      ],
      answer: 0,
      why: 'If it is a skill, it responds to practice — which is the premise the whole course rests on.',
    },

    // ---- Module 2 — Your Instructor ---------------------------------------
    {
      id: 'q4', module: 2,
      q: 'What was Gitanjali Ponnappa’s role before founding NegotiateHer?',
      options: [
        'Partner at EY, previously at Accenture',
        'Professor of economics at Harvard',
        'Head of HR at a technology start-up',
        'Corporate litigation attorney',
      ],
      answer: 0,
      why: 'Gi is an ex-EY Partner and ex-Accenture, with a career in management consulting.',
    },
    {
      id: 'q5', module: 2,
      q: 'Roughly how much real-world experience does Gi bring?',
      options: ['Over 25 years', 'About 5 years', 'About 10 years', 'Just under 2 years'],
      answer: 0,
      why: 'Over 25 years of real-world experience across management consulting.',
    },
    {
      id: 'q6', module: 2,
      q: 'Which formal negotiation training has Gi completed?',
      options: [
        'The Harvard negotiation course and the Schranner Professional Negotiator course',
        'An online crash course only',
        'No formal training — entirely self-taught',
        'A doctorate in conflict resolution',
      ],
      answer: 0,
      why: 'She has completed both the Harvard negotiation course and the Schranner Professional Negotiator programme.',
    },
    {
      id: 'q7', module: 2,
      q: 'Why did Gi found NegotiateHer?',
      options: [
        'She felt unprepared for negotiation early in her career and wanted to help others avoid that',
        'She was asked to by a former employer',
        'To sell negotiation software',
        'To publish academic research',
      ],
      answer: 0,
      why: 'She founded it to support women and people of color after feeling unprepared herself early on.',
    },

    // ---- Module 3 — The Three-Step Detective Approach ----------------------
    {
      id: 'q8', module: 3,
      q: 'Why is the approach framed around a detective?',
      options: [
        'Because good negotiation starts with gathering evidence and understanding, not with arguing',
        'Because you should conceal your real intentions',
        'Because you need to catch the other side out in a lie',
        'Because negotiation is fundamentally adversarial',
      ],
      answer: 0,
      why: 'A detective investigates before concluding. The approach asks you to understand the situation before making your case.',
    },
    {
      id: 'q9', module: 3,
      q: 'What does a detective do before drawing a conclusion?',
      options: [
        'Gathers information from several angles',
        'Commits to the first theory that occurs to them',
        'Avoids talking to anyone involved',
        'Relies purely on instinct',
      ],
      answer: 0,
      why: 'Evidence first, conclusion second — the same order the framework applies to negotiation.',
    },
    {
      id: 'q10', module: 3,
      q: 'What does the approach ask you to understand before you make your case?',
      options: [
        'Both yourself and the other party',
        'Only the other party',
        'Only your own goals',
        'Neither — preparation slows you down',
      ],
      answer: 0,
      why: 'The framework works outward from your own values to the other person, then to the conversation itself.',
    },
    {
      id: 'q11', module: 3,
      q: 'What is the practical benefit of following a structured approach?',
      options: [
        'It gives you something repeatable to fall back on regardless of the situation',
        'It guarantees the other side will agree',
        'It removes the need to prepare',
        'It works only for salary conversations',
      ],
      answer: 0,
      why: 'Structure is what makes the skill portable from one negotiation to the next.',
    },

    // ---- Module 4 — Know Your Personal Values -----------------------------
    {
      id: 'q12', module: 4,
      q: 'Why does the framework start with your own values?',
      options: [
        'They define what you are actually negotiating for',
        'They are easier to research than the other party’s',
        'Employers usually ask about them directly',
        'They determine what the other side can offer',
      ],
      answer: 0,
      why: 'Without knowing what matters to you, you cannot tell a good outcome from a bad one.',
    },
    {
      id: 'q13', module: 4,
      q: 'What is the risk of negotiating without clarity on your values?',
      options: [
        'You can win something you did not actually want',
        'You will always be offered less money',
        'The other side will refuse to talk to you',
        'There is no real risk',
      ],
      answer: 0,
      why: 'Negotiating hard for the wrong thing is still a loss, even when you get it.',
    },
    {
      id: 'q14', module: 4,
      q: 'What is the difference between a value and a position?',
      options: [
        'A value is the underlying priority; a position is the specific thing you ask for',
        'They mean the same thing',
        'A value is always financial; a position never is',
        'A position matters more than a value',
      ],
      answer: 0,
      why: 'Positions are the surface ask. Values are why the ask matters — and they usually allow more than one route.',
    },
    {
      id: 'q15', module: 4,
      q: 'How do clear values help when a negotiation becomes difficult?',
      options: [
        'They give you a reference point for which trade-offs are acceptable',
        'They let you ignore what the other side says',
        'They remove the need to compromise',
        'They make the conversation shorter',
      ],
      answer: 0,
      why: 'When you have to give something up, your values tell you what can go and what cannot.',
    },
    {
      id: 'q16', module: 4,
      q: 'Why is it worth ranking your values rather than just listing them?',
      options: [
        'Because negotiation involves trade-offs, and ranking tells you what to protect first',
        'Because employers ask for a ranked list',
        'Because only your top value is ever relevant',
        'Because a list is too long to remember',
      ],
      answer: 0,
      why: 'A flat list gives no guidance the moment you have to choose between two things you want.',
    },

    // ---- Module 5 — Know the Other Person's Personality -------------------
    {
      id: 'q17', module: 5,
      q: 'Why pay attention to the other person’s personality?',
      options: [
        'The same message lands differently depending on who is receiving it',
        'It tells you exactly what they will offer',
        'It lets you decide whether they deserve a raise',
        'It is only relevant in written negotiations',
      ],
      answer: 0,
      why: 'A well-prepared case can still fail if it is delivered in a way the other person cannot hear.',
    },
    {
      id: 'q18', module: 5,
      q: 'What should you adapt based on the other person’s style?',
      options: [
        'How you communicate your case',
        'What you believe you are worth',
        'Your core values',
        'The outcome you are willing to accept',
      ],
      answer: 0,
      why: 'Adapt the delivery, not the substance. Your worth does not change with the audience.',
    },
    {
      id: 'q19', module: 5,
      q: 'What is the risk of assuming the other side thinks the way you do?',
      options: [
        'You misread what actually motivates them',
        'You will talk for too long',
        'You will be seen as too agreeable',
        'There is no real risk',
      ],
      answer: 0,
      why: 'Projecting your own priorities onto someone else is one of the most common preparation mistakes.',
    },
    {
      id: 'q20', module: 5,
      q: 'What is a useful source of insight into how someone negotiates?',
      options: [
        'How they have behaved and made decisions in the past',
        'Their job title on its own',
        'How long they have worked at the company',
        'Their preferred meeting software',
      ],
      answer: 0,
      why: 'Past behaviour is evidence. Titles tell you very little about how a person decides.',
    },
    {
      id: 'q21', module: 5,
      q: 'Does understanding the other side mean agreeing with them?',
      options: [
        'No — understanding is information gathering, not concession',
        'Yes, understanding always implies agreement',
        'Yes, otherwise it is dishonest',
        'Only when they hold more power',
      ],
      answer: 0,
      why: 'You can understand someone’s position perfectly and still argue firmly against it.',
    },

    // ---- Module 6 — Build Empathy -----------------------------------------
    {
      id: 'q22', module: 6,
      q: 'What does empathy mean in a negotiation context?',
      options: [
        'Understanding the pressures and constraints the other side is working under',
        'Agreeing to whatever the other side proposes',
        'Feeling sorry for the other side',
        'Avoiding difficult topics to keep things pleasant',
      ],
      answer: 0,
      why: 'It is a practical tool for understanding constraints, not a softness or a concession.',
    },
    {
      id: 'q23', module: 6,
      q: 'Does showing empathy mean giving ground?',
      options: [
        'No — you can be empathetic and still hold your position',
        'Yes, they are the same thing',
        'Yes, empathy always costs you something',
        'Only if you speak first',
      ],
      answer: 0,
      why: 'Empathy and firmness are independent. The strongest negotiators do both at once.',
    },
    {
      id: 'q24', module: 6,
      q: 'How does empathy help you practically?',
      options: [
        'It lets you frame your ask as a solution to their problem',
        'It lets you skip preparation',
        'It guarantees a yes',
        'It shortens the negotiation',
      ],
      answer: 0,
      why: 'An ask that solves the other side’s problem is far easier for them to say yes to.',
    },
    {
      id: 'q25', module: 6,
      q: 'What kind of constraint might the person across the table be under?',
      options: [
        'A fixed budget, internal precedent, or their own manager’s approval',
        'None — decision-makers can always do whatever they want',
        'Only legal constraints',
        'Only their personal opinion of you',
      ],
      answer: 0,
      why: 'The person saying no is often relaying a constraint rather than expressing a preference.',
    },
    {
      id: 'q26', module: 6,
      q: 'Does empathy make you look weak in a negotiation?',
      options: [
        'No — it makes you better informed and harder to dismiss',
        'Yes, it signals you will accept less',
        'Yes, it should be avoided entirely',
        'Only when negotiating salary',
      ],
      answer: 0,
      why: 'Understanding the other side’s position makes your own case more precise, not weaker.',
    },

    // ---- Module 7 — Engage Actively ---------------------------------------
    {
      id: 'q27', module: 7,
      q: 'What does engaging actively mean?',
      options: [
        'Taking an active role in the conversation rather than waiting to be offered something',
        'Talking as much as possible',
        'Interrupting to keep control',
        'Sending your request by email to avoid the conversation',
      ],
      answer: 0,
      why: 'Waiting to be offered is the default most people fall into, and it rarely produces the best outcome.',
    },
    {
      id: 'q28', module: 7,
      q: 'Which behaviour is central to engaging actively?',
      options: [
        'Asking questions and genuinely listening to the answers',
        'Presenting your demands and then staying silent throughout',
        'Avoiding any question you cannot immediately answer',
        'Keeping the discussion strictly to written channels',
      ],
      answer: 0,
      why: 'Questions surface the constraints and priorities you need in order to shape your ask.',
    },
    {
      id: 'q29', module: 7,
      q: 'You have just made your ask. What is usually the strongest next move?',
      options: [
        'Stop talking and let the silence sit',
        'Immediately offer a lower alternative',
        'Fill the pause by justifying yourself further',
        'Apologise for asking',
      ],
      answer: 0,
      why: 'Filling your own silence is how people negotiate against themselves before the other side has even replied.',
    },
    {
      id: 'q30', module: 7,
      q: 'When should preparation for a negotiation begin?',
      options: [
        'Well before the conversation takes place',
        'In the meeting itself',
        'Only after receiving a first offer',
        'Once the outcome has been decided',
      ],
      answer: 0,
      why: 'Almost all of the leverage in a negotiation is built before anyone sits down.',
    },
    {
      id: 'q31', module: 7,
      q: 'The answer to your request is no. What is the most useful response?',
      options: [
        'Ask what would need to be true for it to become possible',
        'Accept it and never raise the subject again',
        'Repeat the same request more forcefully',
        'Threaten to resign on the spot',
      ],
      answer: 0,
      why: 'A no is often a "not under these conditions". Finding the conditions keeps the conversation alive.',
    },

    // ---- Module 8 — Thank You ---------------------------------------------
    /* Keep at least four questions here. The draw takes one question per
     * module, so a module with a single question would appear in every
     * attempt — which defeats the point of reshuffling. */
    {
      id: 'q32', module: 8,
      q: 'What is the most useful thing to do straight after finishing this course?',
      options: [
        'Practise the framework on a real, lower-stakes negotiation',
        'Wait until a major salary review comes up',
        'Re-watch every lesson before trying anything',
        'Nothing — the knowledge applies itself',
      ],
      answer: 0,
      why: 'A skill only becomes yours through use. Low-stakes practice is where the framework gets tested cheaply.',
    },
    {
      id: 'q33', module: 8,
      q: 'Having finished the course, what should you now be able to do?',
      options: [
        'Prepare for and run a negotiation using a structure you can repeat',
        'Win every negotiation you enter',
        'Recite a script for each possible scenario',
        'Avoid negotiating altogether',
      ],
      answer: 0,
      why: 'The outcome of the course is a method you can reuse, not a guarantee about any single conversation.',
    },
    {
      id: 'q34', module: 8,
      q: 'The framework is meant to be reused. What does that look like in practice?',
      options: [
        'The same approach works for salary, promotion, exits and negotiations outside work',
        'It only applies to annual pay reviews',
        'It needs rebuilding from scratch for every conversation',
        'It works once and then loses its effect',
      ],
      answer: 0,
      why: 'The structure is deliberately general — the situation changes, the method does not.',
    },
    {
      id: 'q35', module: 8,
      q: 'Across the whole course, what most reliably improves a negotiation outcome?',
      options: [
        'The preparation you do before the conversation begins',
        'Speaking more forcefully than the other side',
        'Being the last person to make an offer',
        'Waiting for the right mood in the room',
      ],
      answer: 0,
      why: 'Every module points the same way: the work that decides the outcome happens beforehand.',
    },

    // ---- Module 1 — additional ---------------------------------------------
    {
      id: 'q36', module: 1,
      q: 'The course covers understanding yourself and understanding the other party. Why both?',
      options: [
        'A negotiation is a two-sided conversation — either one alone leaves you guessing',
        'Because the course needed more content',
        'Because you should mirror the other person exactly',
        'Only the other party actually matters',
      ],
      answer: 0,
      why: 'Knowing only your own position, or only theirs, leaves half the picture missing.',
    },
    {
      id: 'q37', module: 1,
      q: 'How is the course structured for learning?',
      options: [
        'Short self-paced video lessons grouped into modules',
        'A single long live webinar',
        'Written case studies with no video',
        'A fixed weekly schedule you must keep pace with',
      ],
      answer: 0,
      why: 'Short lessons grouped by theme, taken at whatever pace suits you.',
    },
  ],
};
