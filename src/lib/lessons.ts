// Beginner music-theory tips shown on each exercise's start screen.
// Written like a friendly piano teacher explaining fundamentals from scratch.
// Each exercise maps to a topic; every topic has a deep pool of tips so the
// same one rarely repeats. A tip references an illustration id (see
// lesson-illustrations.tsx).

export interface LessonTip {
  /** Short headline, e.g. "What is a chord?" */
  title: string
  /** 1–3 sentence explanation in plain language */
  body: string
  /** Illustration id rendered by <LessonIllustration /> */
  illustration: string
}

// ─── Topic tip pools ──────────────────────────────────────────────────

const NOTE_TIPS: LessonTip[] = [
  {
    title: 'The musical alphabet',
    body: 'Music uses only seven letter names: A, B, C, D, E, F, G. After G it starts over. Every white key on the piano is one of these seven letters.',
    illustration: 'alphabet',
  },
  {
    title: 'How to find C',
    body: 'Look for the groups of TWO black keys. The white key just to the left of any pair of two black keys is always C. Find C and every other note falls into place.',
    illustration: 'find-c',
  },
  {
    title: 'The pattern repeats',
    body: 'After B comes another C, just higher. The whole keyboard is the same 7-letter pattern repeating over and over, low on the left and high on the right.',
    illustration: 'octave-repeat',
  },
  {
    title: 'White keys are "natural" notes',
    body: 'The plain white keys (no sharp or flat) are called natural notes. These seven are the foundation, so master them before worrying about the black keys.',
    illustration: 'white-keys',
  },
  {
    title: 'Left is low, right is high',
    body: 'As you move right, notes sound higher and brighter. As you move left, they sound lower and deeper. The same letter can appear many times across the keyboard.',
    illustration: 'octave-repeat',
  },
  {
    title: 'Middle C, your home base',
    body: 'Middle C sits roughly in the center of the piano. Pianists use it as a landmark to orient both hands, and many beginner pieces start right here.',
    illustration: 'find-c',
  },
]

const STAFF_TIPS: LessonTip[] = [
  {
    title: 'What is a staff?',
    body: 'The staff is the set of five horizontal lines (with four spaces between them) where music is written. A note\'s vertical position tells you how high or low to play.',
    illustration: 'staff-treble',
  },
  {
    title: 'The treble clef',
    body: 'The curly treble clef (𝄞) marks higher notes, the ones usually played with your right hand. It is also called the "G clef" because it curls around the line for the note G.',
    illustration: 'staff-treble',
  },
  {
    title: 'The bass clef',
    body: 'The bass clef (𝄢) marks lower notes, the ones usually played with your left hand. It is the "F clef": its two dots sit above and below the line for the note F.',
    illustration: 'staff-bass',
  },
  {
    title: 'Treble lines: E-G-B-D-F',
    body: 'The notes ON the treble lines, bottom to top, are E, G, B, D, F. Remember them with "Every Good Boy Does Fine."',
    illustration: 'staff-treble',
  },
  {
    title: 'Treble spaces: F-A-C-E',
    body: 'The notes in the treble SPACES, bottom to top, spell the word FACE. Easy to remember, and a quick way to read notes between the lines.',
    illustration: 'staff-treble',
  },
  {
    title: 'Bass lines & spaces',
    body: 'Bass clef lines spell G-B-D-F-A ("Good Boys Do Fine Always"); the spaces spell A-C-E-G ("All Cows Eat Grass").',
    illustration: 'staff-bass',
  },
  {
    title: 'The grand staff',
    body: 'Piano music joins treble (right hand) and bass (left hand) into one "grand staff." Middle C sits on a short ledger line right between the two.',
    illustration: 'grand-staff',
  },
  {
    title: 'Ledger lines',
    body: 'When a note is too high or low for the staff, we add tiny extra lines called ledger lines. Middle C lives on its own ledger line below the treble staff.',
    illustration: 'grand-staff',
  },
]

const SHARP_FLAT_TIPS: LessonTip[] = [
  {
    title: 'The black keys',
    body: 'The black keys are the sharps and flats. They sit between certain white keys and give music its extra colors beyond the seven natural notes.',
    illustration: 'black-keys',
  },
  {
    title: 'Sharp means "up"',
    body: 'A sharp (♯) raises a note by one half step to the very next key on the RIGHT, usually a black key. So C♯ is the black key just right of C.',
    illustration: 'sharp-up',
  },
  {
    title: 'Flat means "down"',
    body: 'A flat (♭) lowers a note by one half step to the very next key on the LEFT. So D♭ is the black key just left of D.',
    illustration: 'flat-down',
  },
  {
    title: 'Two names, one key',
    body: 'The black key between C and D is both C♯ and D♭. Same sound, two names. Musicians call these "enharmonic" notes, and which name you use depends on the key.',
    illustration: 'enharmonic',
  },
  {
    title: 'The half step',
    body: 'A half step is the smallest distance in Western music: from any key to the very next key, black or white. It is the building block of every sharp and flat.',
    illustration: 'half-step',
  },
  {
    title: 'Why E-F and B-C touch',
    body: 'Notice there is no black key between E and F, or between B and C. Those white keys are already only a half step apart. It is simply how the keyboard is built.',
    illustration: 'no-black-gap',
  },
]

const KEYSIG_TIPS: LessonTip[] = [
  {
    title: 'What is a key signature?',
    body: 'The key signature is the group of sharps or flats written at the very start of each staff line. It tells you which notes stay sharp or flat for the whole piece.',
    illustration: 'staff-treble',
  },
  {
    title: 'It sets the "home key"',
    body: 'A key signature tells you the song\'s home key, the scale it is built from. No sharps or flats means C major, one sharp means G major, and so on.',
    illustration: 'staff-treble',
  },
  {
    title: 'Order of sharps',
    body: 'Sharps always appear in the same order: F, C, G, D, A, E, B. Remember "Father Charles Goes Down And Ends Battle."',
    illustration: 'staff-treble',
  },
  {
    title: 'Order of flats',
    body: 'Flats appear in the reverse order: B, E, A, D, G, C, F. Handily, the first four spell the word "BEAD."',
    illustration: 'staff-bass',
  },
  {
    title: 'A handy shortcut',
    body: 'For sharp keys, the home note is one half step above the LAST sharp. For flat keys, the home note is the SECOND-to-last flat. Both let you name the key at a glance.',
    illustration: 'staff-treble',
  },
]

const INTERVAL_TIPS: LessonTip[] = [
  {
    title: 'What is an interval?',
    body: 'An interval is simply the distance between two notes, or how far apart they are in pitch. Intervals are the building blocks of both melodies and chords.',
    illustration: 'interval-third',
  },
  {
    title: 'Count inclusively',
    body: 'To measure an interval, count both notes and everything in between. C up to E is a "third": C(1), D(2), E(3). C up to G is a "fifth."',
    illustration: 'interval-fifth',
  },
  {
    title: 'Melodic vs harmonic',
    body: 'Play the two notes one after another and it\'s a melodic interval (a melody). Play them together and it\'s a harmonic interval (harmony). Same distance, different feel.',
    illustration: 'interval-third',
  },
  {
    title: 'The octave',
    body: 'From one C to the next C is an octave, a span of eight letter-steps. The two notes sound almost identical, just higher or lower. "Some-WHERE over the rainbow" leaps an octave.',
    illustration: 'interval-octave',
  },
  {
    title: 'A step vs a skip',
    body: 'Neighboring letters like C to D make a "second," or a step. Jumping over a note like C to E makes a "third," or a skip. Songs mix steps and skips to stay interesting.',
    illustration: 'interval-step',
  },
  {
    title: 'Hear them in songs',
    body: 'Intervals have signature sounds: a perfect fifth opens "Twinkle Twinkle," a perfect fourth opens "Here Comes the Bride." Linking intervals to songs trains your ear fast.',
    illustration: 'interval-fifth',
  },
]

const CHORD_TIPS: LessonTip[] = [
  {
    title: 'What is a chord?',
    body: 'A chord is three or more notes played at the SAME time. Where a single note is one voice, a chord is a whole group singing together, and that is what creates harmony.',
    illustration: 'chord-triad',
  },
  {
    title: 'The triad',
    body: 'The most common chord is a triad: three notes stacked in thirds. They are called the root, the third, and the fifth. C-E-G is a C major triad, the friendliest chord to start with.',
    illustration: 'chord-major',
  },
  {
    title: 'Major sounds happy',
    body: 'A major chord like C-E-G sounds bright and cheerful. It has a "big" third, with four half steps from the root up to the middle note.',
    illustration: 'chord-major',
  },
  {
    title: 'Minor sounds sad',
    body: 'A minor chord like A-C-E sounds darker or more emotional. Its third is "small," with only three half steps. That one-key difference flips the whole mood.',
    illustration: 'chord-minor',
  },
  {
    title: 'Chord vs scale',
    body: 'A scale is notes played one-at-a-time in a row; a chord is notes played all-at-once in a stack. Scales are melody and motion; chords are harmony and support.',
    illustration: 'scale-vs-chord',
  },
  {
    title: 'Build a major chord',
    body: 'Here is the recipe for any major chord: start on the root, go up 4 half steps for the middle note, then 3 more for the top. C to E to G. The same recipe works on every key.',
    illustration: 'chord-major',
  },
  {
    title: 'Chords are the accompaniment',
    body: 'When you hear someone "playing chords" on piano or guitar, they\'re providing the harmony that supports a melody. Most songs are just a handful of chords repeating.',
    illustration: 'chord-triad',
  },
]

const SCALE_TIPS: LessonTip[] = [
  {
    title: 'What is a scale?',
    body: 'A scale is a ladder of notes played one at a time, in order, going up or down. It is the "musical family" that a piece of music draws its notes from.',
    illustration: 'scale-c-major',
  },
  {
    title: 'The major scale pattern',
    body: 'Every major scale follows the same step pattern: Whole, Whole, Half, Whole, Whole, Whole, Half. Start on C and use only white keys and you get C major automatically.',
    illustration: 'scale-c-major',
  },
  {
    title: 'Do-Re-Mi',
    body: 'The familiar "Do-Re-Mi-Fa-Sol-La-Ti-Do" IS a major scale. Each syllable is the next step up the ladder, ending back on "Do" one octave higher.',
    illustration: 'scale-c-major',
  },
  {
    title: 'Whole steps and half steps',
    body: 'A whole step skips a key (two half steps); a half step moves to the very next key. The unique mix of these steps is what gives each scale its character.',
    illustration: 'scale-c-major',
  },
  {
    title: 'Scale vs chord',
    body: 'Play scale notes one after another and you get melody and motion. Stack a few of those same notes together and you get a chord. A scale walks; a chord stands.',
    illustration: 'scale-vs-chord',
  },
  {
    title: 'Minor scales feel different',
    body: 'A natural minor scale uses a different step pattern, which gives it a darker, more wistful sound than major. Same idea as a major scale, but a different mood, much like minor chords.',
    illustration: 'scale-c-major',
  },
  {
    title: 'Why practice scales?',
    body: 'Scales train your fingers, teach you each key, and build the muscle memory behind nearly every melody. Almost all music is made from scale steps, so the reps pay off.',
    illustration: 'scale-c-major',
  },
  {
    title: 'It ends where it began',
    body: 'A scale starts and finishes on the same letter, one octave apart, and that final note feels like coming home. That sense of arrival is what makes a scale satisfying.',
    illustration: 'interval-octave',
  },
]

const EAR_TIPS: LessonTip[] = [
  {
    title: 'What is ear training?',
    body: 'Ear training teaches you to recognize notes, intervals, and chords just by listening, no looking required. It is how musicians play by ear and improvise.',
    illustration: 'ear-waves',
  },
  {
    title: 'Relative pitch',
    body: 'Most musicians don\'t name notes from thin air. They judge each sound RELATIVE to others. Hearing the DISTANCE between notes is the skill you\'re building here.',
    illustration: 'ear-waves',
  },
  {
    title: 'Listen, then look',
    body: 'Try to sing or hum the sound back before you guess. Connecting your voice to your ear locks the sound into memory far better than guessing visually.',
    illustration: 'ear-waves',
  },
  {
    title: 'Anchor to songs you know',
    body: 'Tie each sound to a tune you already know. An octave is "Somewhere Over the Rainbow," and a fifth is "Twinkle Twinkle." Your memory does the heavy lifting.',
    illustration: 'ear-waves',
  },
  {
    title: 'Major vs minor by ear',
    body: 'With practice you\'ll instantly feel the difference. Major sounds happy and open, while minor sounds sad or tense. Trust that emotional reaction, because it is usually right.',
    illustration: 'ear-waves',
  },
]

const RHYTHM_TIPS: LessonTip[] = [
  {
    title: 'What is the beat?',
    body: 'The beat is the steady pulse you tap your foot to. Rhythm is how notes are arranged around that pulse, some long and some short, to create a groove.',
    illustration: 'metronome',
  },
  {
    title: 'Note values',
    body: 'Notes have lengths: a whole note lasts 4 beats, a half note 2, a quarter note 1, and an eighth note half a beat. Their shape tells you how long to hold them.',
    illustration: 'note-values',
  },
  {
    title: 'Tempo & BPM',
    body: 'Tempo is the speed of the beat, measured in BPM (beats per minute). 60 BPM is one beat per second; higher numbers mean a faster song.',
    illustration: 'metronome',
  },
  {
    title: 'Count out loud',
    body: 'Counting "1, 2, 3, 4" steadily as you play keeps your timing honest. Think of the metronome as a patient practice partner and stay locked to its click.',
    illustration: 'metronome',
  },
  {
    title: 'Time signature',
    body: 'The two stacked numbers at the start, like 4/4, tell you how many beats are in each measure. A 4/4 bar has four beats and is the most common in popular music.',
    illustration: 'note-values',
  },
]

// ─── Topic registry & exercise mapping ────────────────────────────────

const TOPIC_TIPS: Record<string, LessonTip[]> = {
  notes: NOTE_TIPS,
  staff: STAFF_TIPS,
  sharpFlat: SHARP_FLAT_TIPS,
  keySig: KEYSIG_TIPS,
  intervals: INTERVAL_TIPS,
  chords: CHORD_TIPS,
  scales: SCALE_TIPS,
  ear: EAR_TIPS,
  rhythm: RHYTHM_TIPS,
}

/** Each exercise → its most relevant teaching topic */
const EXERCISE_TOPIC: Record<string, keyof typeof TOPIC_TIPS> = {
  'note-finder': 'notes',
  'keyboard-note-id': 'notes',
  'staff-reader': 'staff',
  'sharp-flat': 'sharpFlat',
  'key-signature-id': 'keySig',
  'interval-jump': 'intervals',
  'keyboard-interval-id': 'intervals',
  'ear-interval': 'intervals',
  'chord-builder': 'chords',
  'keyboard-chord-id': 'chords',
  'ear-chord': 'chords',
  'scale-builder': 'scales',
  'scale-id': 'scales',
  'ear-scale': 'scales',
  'ear-training': 'ear',
  'rhythm-training': 'rhythm',
}

/** Get the tip pool relevant to an exercise (falls back to note basics) */
export function getTipsForExercise(exerciseId: string): LessonTip[] {
  const topic = EXERCISE_TOPIC[exerciseId]
  return (topic && TOPIC_TIPS[topic]) || NOTE_TIPS
}

/** Pick a random tip for an exercise */
export function getRandomTip(exerciseId: string): LessonTip {
  const tips = getTipsForExercise(exerciseId)
  return tips[Math.floor(Math.random() * tips.length)]
}
