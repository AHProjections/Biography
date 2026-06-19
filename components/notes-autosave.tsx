'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ChapterId =
  | 'origins'
  | 'family'
  | 'education'
  | 'work'
  | 'relationships'
  | 'turning_points'
  | 'values';

type Question = {
  id: string;
  chapter: ChapterId;
  title: string;
  prompt: string;
  followUp: string;
};

type Answer = {
  text: string;
  updatedAt: string;
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

const STORAGE_KEY = 'biography.voiceStudio.v1';

const CHAPTERS: Record<ChapterId, { label: string; tone: string }> = {
  origins: { label: 'Origins', tone: 'Place, time, early atmosphere' },
  family: { label: 'Family', tone: 'People, traditions, home life' },
  education: { label: 'Education', tone: 'Schooling, mentors, discoveries' },
  work: { label: 'Work', tone: 'Ambition, craft, contribution' },
  relationships: { label: 'Relationships', tone: 'Love, friendship, community' },
  turning_points: { label: 'Turning points', tone: 'Choice, change, resilience' },
  values: { label: 'Values', tone: 'Meaning, legacy, advice' },
};

const QUESTIONS: Question[] = [
  {
    id: 'birthplace',
    chapter: 'origins',
    title: 'The opening scene',
    prompt:
      'Let us begin with the first scene. Where and when were you born, and what kind of world did you arrive into?',
    followUp: 'What details would help someone picture that place clearly?',
  },
  {
    id: 'childhood_home',
    chapter: 'origins',
    title: 'Childhood home',
    prompt:
      'When you think of your childhood home, what do you see, hear, or smell first?',
    followUp: 'Was there a room, street, routine, or season that feels especially vivid?',
  },
  {
    id: 'family_people',
    chapter: 'family',
    title: 'The family cast',
    prompt:
      'Who were the central people in your family story, and what should a reader understand about each of them?',
    followUp: 'Try naming one trait, phrase, or small habit that captures each person.',
  },
  {
    id: 'family_lessons',
    chapter: 'family',
    title: 'Lessons at home',
    prompt:
      'What lessons, spoken or unspoken, did your family teach you about life?',
    followUp: 'Did you accept those lessons, resist them, or reinterpret them later?',
  },
  {
    id: 'school_years',
    chapter: 'education',
    title: 'Learning years',
    prompt:
      'Tell me about your school years. What kind of student were you, and what experiences shaped you?',
    followUp: 'Was there a teacher, book, subject, or embarrassment you still remember?',
  },
  {
    id: 'early_work',
    chapter: 'work',
    title: 'First work',
    prompt:
      'What was your first real work, paid or unpaid, and what did it teach you?',
    followUp: 'How did that early work influence your confidence or sense of responsibility?',
  },
  {
    id: 'career_arc',
    chapter: 'work',
    title: 'Career arc',
    prompt:
      'Looking across your working life, what were the main chapters, achievements, or changes?',
    followUp: 'Which part of your work life made you proud in a quiet but lasting way?',
  },
  {
    id: 'love_friendship',
    chapter: 'relationships',
    title: 'Love and friendship',
    prompt:
      'Who changed your life through love, friendship, partnership, or loyalty?',
    followUp: 'What moments show the nature of that bond better than a summary could?',
  },
  {
    id: 'hard_season',
    chapter: 'turning_points',
    title: 'A hard season',
    prompt:
      'Every life has difficult seasons. What was one hard period, and how did you get through it?',
    followUp: 'What did that experience reveal about you or the people around you?',
  },
  {
    id: 'major_choice',
    chapter: 'turning_points',
    title: 'A defining choice',
    prompt:
      'Tell me about a decision that changed the direction of your life.',
    followUp: 'What did you know then, and what do you understand now?',
  },
  {
    id: 'beliefs',
    chapter: 'values',
    title: 'What endured',
    prompt:
      'What values, beliefs, or principles have stayed with you through the years?',
    followUp: 'Can you share a story where those values were tested or proven?',
  },
  {
    id: 'legacy',
    chapter: 'values',
    title: 'Legacy',
    prompt:
      'If someone read your biography years from now, what would you most want them to feel or remember?',
    followUp: 'What advice or blessing would you leave for the people who come after you?',
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

function loadAnswers(): Record<string, Answer> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, Answer>) : {};
  } catch {
    return {};
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function chapterQuestions(chapter: ChapterId) {
  return QUESTIONS.filter((question) => question.chapter === chapter);
}

function buildDraft(answers: Record<string, Answer>) {
  const sections = Object.entries(CHAPTERS)
    .map(([chapterId, chapter]) => {
      const lines = chapterQuestions(chapterId as ChapterId)
        .map((question) => answers[question.id]?.text.trim())
        .filter(Boolean);

      if (lines.length === 0) return '';

      return `## ${chapter.label}\n\n${lines.join('\n\n')}`;
    })
    .filter(Boolean);

  if (sections.length === 0) {
    return 'The biography draft will appear here as the interview fills in.';
  }

  return `# Biography Draft\n\n${sections.join('\n\n')}`;
}

export default function NotesAutosave() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [draftMode, setDraftMode] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const activeQuestion = QUESTIONS[activeIndex];
  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.text.trim()).length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);
  const draft = useMemo(() => buildDraft(answers), [answers]);

  useEffect(() => {
    setAnswers(loadAnswers());
    setVoiceSupported(Boolean(getRecognition()));
  }, []);

  useEffect(() => {
    setAnswerText(answers[activeQuestion.id]?.text ?? '');
  }, [activeQuestion.id, answers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
        setStatus(`Saved ${new Date().toLocaleTimeString()}`);
      } catch {
        setStatus('Browser storage unavailable');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [answers]);

  function saveAnswer(nextText = answerText) {
    setAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: {
        text: nextText,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function moveQuestion(direction: 1 | -1) {
    saveAnswer();
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return QUESTIONS.length - 1;
      if (next >= QUESTIONS.length) return 0;
      return next;
    });
    setDraftMode(false);
  }

  function selectQuestion(index: number) {
    saveAnswer();
    setActiveIndex(index);
    setDraftMode(false);
  }

  function speakPrompt() {
    if (!('speechSynthesis' in window)) {
      setStatus('Spoken prompts are not available in this browser');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${activeQuestion.prompt} ${activeQuestion.followUp}`,
    );
    utterance.rate = 0.88;
    utterance.pitch = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = getRecognition();
    if (!recognition) {
      setStatus('Voice dictation is not available in this browser');
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
      setStatus('Paused');
    };
    recognition.onerror = () => {
      setIsListening(false);
      setStatus('Voice capture stopped');
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
      .then(() => setStatus('Draft copied'))
      .catch(() => setStatus('Copy failed'));
  }

  function downloadDraft() {
    const blob = new Blob([draft], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biography-draft.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="studio-shell">
      <header className="studio-hero">
        <div>
          <p className="eyebrow">Voice-first biographer</p>
          <h1>Tell the story in conversation.</h1>
          <p className="hero-copy">
            A guided interview organizes memories into chapters and turns them into a working draft.
          </p>
        </div>
        <div className="progress-orbit" aria-label={`${progress}% complete`}>
          <span>{progress}%</span>
          <small>{answeredCount}/{QUESTIONS.length}</small>
        </div>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Workspace views">
        <button
          className={!draftMode ? 'active' : ''}
          type="button"
          onClick={() => setDraftMode(false)}
        >
          Interview
        </button>
        <button
          className={draftMode ? 'active' : ''}
          type="button"
          onClick={() => {
            saveAnswer();
            setDraftMode(true);
          }}
        >
          Draft
        </button>
      </div>

      {draftMode ? (
        <div className="draft-layout">
          <section className="draft-panel" aria-label="Generated biography draft">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Working manuscript</p>
                <h2>Biography draft</h2>
              </div>
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
        </div>
      ) : (
        <div className="interview-layout">
          <aside className="chapter-rail" aria-label="Interview chapters">
            {Object.entries(CHAPTERS).map(([chapterId, chapter]) => {
              const questions = chapterQuestions(chapterId as ChapterId);
              const completed = questions.filter((question) => answers[question.id]?.text.trim()).length;

              return (
                <div className="chapter-group" key={chapterId}>
                  <div className="chapter-heading">
                    <strong>{chapter.label}</strong>
                    <span>{completed}/{questions.length}</span>
                  </div>
                  <p>{chapter.tone}</p>
                  {questions.map((question) => {
                    const index = QUESTIONS.findIndex((item) => item.id === question.id);
                    return (
                      <button
                        className={index === activeIndex ? 'question-pill active' : 'question-pill'}
                        key={question.id}
                        type="button"
                        onClick={() => selectQuestion(index)}
                      >
                        {question.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </aside>

          <section className="interview-panel" aria-label="Current interview question">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{CHAPTERS[activeQuestion.chapter].label}</p>
                <h2>{activeQuestion.title}</h2>
              </div>
              <span className="save-state">{status}</span>
            </div>

            <blockquote>{activeQuestion.prompt}</blockquote>
            <p className="follow-up">{activeQuestion.followUp}</p>

            <div className="voice-console">
              <button type="button" onClick={speakPrompt}>
                Hear prompt
              </button>
              <button
                className={isListening ? 'danger' : 'primary'}
                type="button"
                onClick={toggleListening}
              >
                {isListening ? 'Stop recording' : 'Record answer'}
              </button>
              <span>{voiceSupported ? 'Voice ready' : 'Type instead'}</span>
            </div>

            <textarea
              aria-label="Answer text"
              value={answerText}
              onChange={(event) => {
                setAnswerText(event.target.value);
                saveAnswer(event.target.value);
              }}
              placeholder="Speak or type the answer here..."
              rows={10}
            />

            <div className="navigation-row">
              <button type="button" onClick={() => moveQuestion(-1)}>
                Previous
              </button>
              <button type="button" onClick={() => moveQuestion(1)}>
                Next question
              </button>
            </div>
          </section>

          <aside className="memory-board" aria-label="Organized memories">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Organized material</p>
                <h2>Memory cards</h2>
              </div>
            </div>
            <div className="memory-list">
              {QUESTIONS.filter((question) => answers[question.id]?.text.trim()).length === 0 ? (
                <p className="empty-state">Answered memories will collect here by chapter.</p>
              ) : (
                QUESTIONS.filter((question) => answers[question.id]?.text.trim()).map((question) => (
                  <article className="memory-card" key={question.id}>
                    <span>{CHAPTERS[question.chapter].label}</span>
                    <h3>{question.title}</h3>
                    <p>{answers[question.id].text}</p>
                    <small>{formatDate(answers[question.id].updatedAt)}</small>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
