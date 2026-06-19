'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'outline' | 'stories';
type Question = {
  id: string;
  phase: Phase;
  chapter: string;
  title: string;
  prompt: string;
  followUp: string;
};
type Answer = { text: string; updatedAt: string };
type InterviewState = {
  answers: Record<string, Answer>;
  phase: Phase;
  activeIndex: number;
};
type SpeechRecognitionEventResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionEventResult;
  };
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

const STORAGE_KEY = 'biography.simpleChat.v1';

const OUTLINE_QUESTIONS: Question[] = [
  {
    id: 'person_snapshot',
    phase: 'outline',
    chapter: 'Getting started',
    title: 'Who are we writing about?',
    prompt:
      'Let us start simply. Who is this biography about, and what should I know first?',
    followUp:
      'You can include their name, where they are from, and the kind of person they are.',
  },
  {
    id: 'life_chapters',
    phase: 'outline',
    chapter: 'Big picture',
    title: 'What are the main chapters?',
    prompt:
      'If you think about their whole life, what are the big chapters from beginning to now?',
    followUp:
      'Childhood, school, work, family, moves, hard times, proud moments - just the big pieces.',
  },
  {
    id: 'important_people',
    phase: 'outline',
    chapter: 'People',
    title: 'Who mattered most?',
    prompt:
      'Who are the important people in this life story?',
    followUp:
      'Family, friends, partners, children, teachers, neighbors, or anyone who changed things.',
  },
  {
    id: 'places',
    phase: 'outline',
    chapter: 'Places',
    title: 'What places mattered?',
    prompt:
      'What places should be part of the story?',
    followUp:
      'Homes, towns, schools, workplaces, churches, kitchens, gardens, trips, or special rooms.',
  },
  {
    id: 'turning_points',
    phase: 'outline',
    chapter: 'Turning points',
    title: 'What changed everything?',
    prompt:
      'What were the moments when life changed direction?',
    followUp:
      'These can be choices, losses, moves, opportunities, illnesses, marriages, births, or surprises.',
  },
  {
    id: 'themes',
    phase: 'outline',
    chapter: 'Meaning',
    title: 'What is the heart of the story?',
    prompt:
      'When you think about this life, what themes keep coming up?',
    followUp:
      'Love, grit, faith, humor, family, service, reinvention, sacrifice, joy, or anything else.',
  },
];

const FALLBACK_STORY_QUESTIONS: Question[] = [
  {
    id: 'story_early_memory',
    phase: 'stories',
    chapter: 'A story',
    title: 'An early memory',
    prompt:
      'Tell me one early memory that would help a reader picture this person as a child.',
    followUp:
      'What happened? Who was there? What did it feel like?',
  },
  {
    id: 'story_person',
    phase: 'stories',
    chapter: 'A story',
    title: 'Someone important',
    prompt:
      'Tell me a story about one person who mattered deeply.',
    followUp:
      'What did that person bring into the life story?',
  },
  {
    id: 'story_turning_point',
    phase: 'stories',
    chapter: 'A story',
    title: 'A turning point',
    prompt:
      'Tell me the story of one moment when life changed.',
    followUp:
      'What led up to it, what happened, and what changed afterward?',
  },
];

function getRecognition() {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  return Recognition ? new Recognition() : null;
}

function loadState(): InterviewState {
  if (typeof window === 'undefined') {
    return { answers: {}, phase: 'outline', activeIndex: 0 };
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { answers: {}, phase: 'outline', activeIndex: 0 };
    const parsed = JSON.parse(saved) as Partial<InterviewState>;
    return {
      answers: parsed.answers ?? {},
      phase: parsed.phase === 'stories' ? 'stories' : 'outline',
      activeIndex: parsed.activeIndex ?? 0,
    };
  } catch {
    return { answers: {}, phase: 'outline', activeIndex: 0 };
  }
}

function splitIdeas(text: string) {
  return text
    .split(/\n|;|-/)
    .flatMap((line) => line.split(/\.(?=\s+[A-Z0-9])/))
    .map((line) => line.trim().replace(/^[0-9.)\s]+/, ''))
    .filter((line) => line.length > 12)
    .slice(0, 8);
}

function shortTitle(text: string) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > 46 ? `${trimmed.slice(0, 43)}...` : trimmed;
}

function buildStoryQuestions(answers: Record<string, Answer>): Question[] {
  const sourceText = [
    answers.life_chapters?.text,
    answers.turning_points?.text,
    answers.important_people?.text,
    answers.places?.text,
  ]
    .filter(Boolean)
    .join('\n');

  const ideas = splitIdeas(sourceText);
  if (ideas.length === 0) return FALLBACK_STORY_QUESTIONS;

  return ideas.map((idea, index) => ({
    id: `story_${index}_${idea.slice(0, 18).replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    phase: 'stories',
    chapter: 'A story',
    title: shortTitle(idea),
    prompt: `I would love to hear more about this: "${idea}." What is the story there?`,
    followUp:
      'Please tell it like a memory. Where were they, who was there, and what changed?',
  }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildDraft(answers: Record<string, Answer>, storyQuestions: Question[]) {
  const outline = OUTLINE_QUESTIONS.map((question) => {
    const answer = answers[question.id]?.text.trim();
    return answer ? `## ${question.title}\n\n${answer}` : '';
  }).filter(Boolean);

  const stories = storyQuestions.map((question) => {
    const answer = answers[question.id]?.text.trim();
    return answer ? `## ${question.title}\n\n${answer}` : '';
  }).filter(Boolean);

  if (outline.length === 0 && stories.length === 0) {
    return 'The biography will appear here after a few answers are saved.';
  }

  return [
    '# Biography Notes',
    outline.length ? '# Life Outline\n\n' + outline.join('\n\n') : '',
    stories.length ? '# Specific Stories\n\n' + stories.join('\n\n') : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export default function NotesAutosave() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [phase, setPhase] = useState<Phase>('outline');
  const [activeIndex, setActiveIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const storyQuestions = useMemo(() => buildStoryQuestions(answers), [answers]);
  const questions = phase === 'outline' ? OUTLINE_QUESTIONS : storyQuestions;
  const activeQuestion = questions[Math.min(activeIndex, questions.length - 1)];
  const outlineCount = OUTLINE_QUESTIONS.filter((question) => answers[question.id]?.text.trim()).length;
  const storyCount = storyQuestions.filter((question) => answers[question.id]?.text.trim()).length;
  const totalCount = outlineCount + storyCount;
  const draft = useMemo(() => buildDraft(answers, storyQuestions), [answers, storyQuestions]);

  useEffect(() => {
    const saved = loadState();
    setAnswers(saved.answers);
    setPhase(saved.phase);
    setActiveIndex(saved.activeIndex);
    setVoiceSupported(Boolean(getRecognition()));
  }, []);

  useEffect(() => {
    setAnswerText(answers[activeQuestion.id]?.text ?? '');
  }, [activeQuestion.id, answers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ answers, phase, activeIndex } satisfies InterviewState),
        );
        setStatus('Saved');
      } catch {
        setStatus('Not saved');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [activeIndex, answers, phase]);

  function saveAnswer(nextText = answerText) {
    const cleanText = nextText.trim();
    if (!cleanText) return;

    setAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: {
        text: cleanText,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function continueInterview() {
    saveAnswer();

    if (activeIndex < questions.length - 1) {
      setActiveIndex((current) => current + 1);
      return;
    }

    if (phase === 'outline') {
      setPhase('stories');
      setActiveIndex(0);
      return;
    }

    setMenuOpen(true);
  }

  function goBack() {
    saveAnswer();
    if (activeIndex > 0) {
      setActiveIndex((current) => current - 1);
      return;
    }
    if (phase === 'stories') {
      setPhase('outline');
      setActiveIndex(OUTLINE_QUESTIONS.length - 1);
    }
  }

  function speakPrompt() {
    if (!('speechSynthesis' in window)) {
      setStatus('Speech is not available');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${activeQuestion.prompt} ${activeQuestion.followUp}`,
    );
    utterance.rate = 0.86;
    utterance.pitch = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = getRecognition();
    if (!recognition) {
      setStatus('Please type instead');
      setVoiceSupported(false);
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening');
    };
    recognition.onend = () => {
      setIsListening(false);
      setStatus('Saved');
    };
    recognition.onerror = () => {
      setIsListening(false);
      setStatus('Please try again');
    };
    recognition.onresult = (event) => {
      let finalText = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += ` ${result[0].transcript}`;
        }
      }

      if (finalText) {
        setAnswerText((current) => {
          const next = `${current}${finalText}`.trimStart();
          saveAnswer(next);
          return next;
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function copyDraft() {
    navigator.clipboard
      .writeText(draft)
      .then(() => setStatus('Biography copied'))
      .catch(() => setStatus('Copy failed'));
  }

  function downloadDraft() {
    const blob = new Blob([draft], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biography-notes.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  const savedQuestions = [...OUTLINE_QUESTIONS, ...storyQuestions].filter(
    (question) => answers[question.id]?.text.trim(),
  );

  return (
    <section className="chat-shell">
      <header className="chat-topbar">
        <div>
          <p className="eyebrow">Grandma&apos;s biography helper</p>
          <h1>Let&apos;s talk through her story.</h1>
        </div>
        <button type="button" onClick={() => setMenuOpen(true)}>
          Menu
        </button>
      </header>

      <main className="chat-card">
        <div className="chat-progress">
          <span>{phase === 'outline' ? 'First, the big picture' : 'Now, the meaningful stories'}</span>
          <strong>{totalCount} saved</strong>
        </div>

        <div className="chat-bubble interviewer">
          <span>{activeQuestion.chapter}</span>
          <p>{activeQuestion.prompt}</p>
          <small>{activeQuestion.followUp}</small>
        </div>

        <div className="chat-actions" aria-label="Voice controls">
          <button type="button" onClick={speakPrompt}>
            Read question
          </button>
          <button
            className={isListening ? 'danger' : 'primary'}
            type="button"
            onClick={toggleListening}
          >
            {isListening ? 'Stop' : 'Start talking'}
          </button>
        </div>

        <label className="answer-label" htmlFor="answer">
          {voiceSupported ? 'What she says will appear here.' : 'Type the answer here.'}
        </label>
        <textarea
          id="answer"
          value={answerText}
          onChange={(event) => {
            setAnswerText(event.target.value);
            saveAnswer(event.target.value);
          }}
          placeholder="Her answer..."
          rows={8}
        />

        <div className="chat-footer">
          <button type="button" onClick={goBack}>
            Back
          </button>
          <span>{status}</span>
          <button className="primary" type="button" onClick={continueInterview}>
            Save and keep going
          </button>
        </div>
      </main>

      {menuOpen ? (
        <div className="drawer-backdrop" role="presentation">
          <aside className="story-drawer" aria-label="Biography menu">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">Saved so far</p>
                <h2>Biography menu</h2>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </div>

            <section>
              <h3>Recorded answers</h3>
              <div className="memory-list">
                {savedQuestions.length === 0 ? (
                  <p className="empty-state">Nothing saved yet. Answer the first question to begin.</p>
                ) : (
                  savedQuestions.map((question) => (
                    <article className="memory-card" key={question.id}>
                      <span>{question.phase === 'outline' ? 'Outline' : 'Story'}</span>
                      <h4>{question.title}</h4>
                      <p>{answers[question.id].text}</p>
                      <small>{formatDate(answers[question.id].updatedAt)}</small>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="drawer-heading compact">
                <h3>Biography draft</h3>
                <div className="button-row">
                  <button type="button" onClick={copyDraft}>
                    Copy
                  </button>
                  <button type="button" onClick={downloadDraft}>
                    Download
                  </button>
                </div>
              </div>
              <pre className="draft-text">{draft}</pre>
            </section>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
