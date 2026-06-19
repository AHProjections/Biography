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

const STORAGE_KEY = 'biography.dynamicInterview.v1';

const OUTLINE_QUESTIONS: Question[] = [
  {
    id: 'person_snapshot',
    phase: 'outline',
    chapter: 'Orientation',
    title: 'Who is this life about?',
    prompt:
      'Before we get into stories, give me the broadest sketch. Who is this biography about, and what should a reader know at the outset?',
    followUp:
      'Include name, time period, places that matter, and the general feeling of the life.',
  },
  {
    id: 'life_chapters',
    phase: 'outline',
    chapter: 'Life map',
    title: 'Major chapters',
    prompt:
      'Walk me through the major chapters of this person’s life in order, almost like chapter titles on a timeline.',
    followUp:
      'Childhood, school, work, relationships, moves, losses, triumphs, reinventions: just the outline for now.',
  },
  {
    id: 'important_people',
    phase: 'outline',
    chapter: 'Life map',
    title: 'Important people',
    prompt:
      'Who are the people we will need to understand in order to understand this life?',
    followUp:
      'Name family, friends, partners, mentors, rivals, children, or anyone who changed the story.',
  },
  {
    id: 'places',
    phase: 'outline',
    chapter: 'Life map',
    title: 'Important places',
    prompt:
      'What places belong on the map of this life?',
    followUp:
      'Think homes, towns, schools, workplaces, landscapes, rooms, churches, hospitals, or journeys.',
  },
  {
    id: 'turning_points',
    phase: 'outline',
    chapter: 'Life map',
    title: 'Turning points',
    prompt:
      'What were the turning points: decisions, accidents, opportunities, losses, or moments after which life was different?',
    followUp:
      'A rough list is perfect. We will come back for the scenes and details next.',
  },
  {
    id: 'themes',
    phase: 'outline',
    chapter: 'Meaning',
    title: 'Core themes',
    prompt:
      'If this life has recurring themes, what are they?',
    followUp:
      'Examples might be duty, reinvention, faith, service, humor, survival, creativity, family, ambition, or forgiveness.',
  },
];

const FALLBACK_STORY_QUESTIONS: Question[] = [
  {
    id: 'story_earliest_scene',
    phase: 'stories',
    chapter: 'Origins',
    title: 'Earliest vivid scene',
    prompt:
      'Choose one early-life moment that still feels vivid. What happened, where were they, and who was there?',
    followUp: 'Give me sensory details and one small moment a reader could see.',
  },
  {
    id: 'story_defining_relationship',
    phase: 'stories',
    chapter: 'Relationships',
    title: 'Defining relationship',
    prompt:
      'Choose one important relationship from the outline. Tell me the story of how it shaped this person.',
    followUp: 'What did that person bring out in them?',
  },
  {
    id: 'story_turning_point',
    phase: 'stories',
    chapter: 'Turning point',
    title: 'One life-changing moment',
    prompt:
      'Choose the most consequential turning point. What led up to it, what happened, and what changed afterward?',
    followUp: 'What did they understand later that they could not know then?',
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
    .split(/\n|;|•|-/)
    .flatMap((line) => line.split(/\.(?=\s+[A-Z0-9])/))
    .map((line) => line.trim().replace(/^[0-9.)\s]+/, ''))
    .filter((line) => line.length > 12)
    .slice(0, 10);
}

function shortTitle(text: string) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > 44 ? `${trimmed.slice(0, 41)}...` : trimmed;
}

function inferChapter(text: string) {
  const lower = text.toLowerCase();
  if (/child|born|home|mother|father|family/.test(lower)) return 'Origins';
  if (/school|college|teacher|learn/.test(lower)) return 'Education';
  if (/work|job|career|business|service/.test(lower)) return 'Work';
  if (/married|love|friend|child|daughter|son/.test(lower)) return 'Relationships';
  if (/death|loss|move|war|illness|decision|changed/.test(lower)) return 'Turning point';
  return 'Scene';
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
    id: `story_${index}_${idea.slice(0, 20).replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    phase: 'stories',
    chapter: inferChapter(idea),
    title: shortTitle(idea),
    prompt: `Let us slow down on this part of the life: “${idea}.” What happened, and why did it matter?`,
    followUp:
      'Tell it as a scene: where it happened, who was present, what was said, and what changed afterward.',
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
  const outlineLines = OUTLINE_QUESTIONS.map((question) => {
    const answer = answers[question.id]?.text.trim();
    return answer ? `## ${question.title}\n\n${answer}` : '';
  }).filter(Boolean);

  const storyLines = storyQuestions.map((question) => {
    const answer = answers[question.id]?.text.trim();
    return answer ? `## ${question.title}\n\n${answer}` : '';
  }).filter(Boolean);

  if (outlineLines.length === 0 && storyLines.length === 0) {
    return 'The biography draft will appear here as the life map and story scenes fill in.';
  }

  return [
    '# Biography Draft',
    outlineLines.length ? '# Life Map\n\n' + outlineLines.join('\n\n') : '',
    storyLines.length ? '# Story Scenes\n\n' + storyLines.join('\n\n') : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export default function NotesAutosave() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [phase, setPhase] = useState<Phase>('outline');
  const [activeIndex, setActiveIndex] = useState(0);
  const [draftMode, setDraftMode] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const storyQuestions = useMemo(() => buildStoryQuestions(answers), [answers]);
  const questions = phase === 'outline' ? OUTLINE_QUESTIONS : storyQuestions;
  const activeQuestion = questions[Math.min(activeIndex, questions.length - 1)];
  const outlineCount = OUTLINE_QUESTIONS.filter((question) => answers[question.id]?.text.trim()).length;
  const storyCount = storyQuestions.filter((question) => answers[question.id]?.text.trim()).length;
  const progress = Math.round(
    ((outlineCount + storyCount) / (OUTLINE_QUESTIONS.length + storyQuestions.length)) * 100,
  );
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
        setStatus(`Saved ${new Date().toLocaleTimeString()}`);
      } catch {
        setStatus('Browser storage unavailable');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activeIndex, answers, phase]);

  function saveAnswer(nextText = answerText) {
    setAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: {
        text: nextText,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function setInterviewPhase(nextPhase: Phase) {
    saveAnswer();
    setPhase(nextPhase);
    setActiveIndex(0);
    setDraftMode(false);
  }

  function moveQuestion(direction: 1 | -1) {
    saveAnswer();
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return questions.length - 1;
      if (next >= questions.length) return 0;
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
          <p className="eyebrow">Dynamic biographer</p>
          <h1>Map the life, then find the scenes.</h1>
          <p className="hero-copy">
            Start with the major outline. Once the structure appears, the interview creates
            deeper story prompts from the people, places, and turning points you named.
          </p>
        </div>
        <div className="progress-orbit" aria-label={`${progress}% complete`}>
          <span>{progress}%</span>
          <small>{outlineCount}+{storyCount}</small>
        </div>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Workspace views">
        <button className={!draftMode ? 'active' : ''} type="button" onClick={() => setDraftMode(false)}>
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
                <button type="button" onClick={copyDraft}>Copy</button>
                <button type="button" onClick={downloadDraft}>Download</button>
              </div>
            </div>
            <pre className="draft-text">{draft}</pre>
          </section>
        </div>
      ) : (
        <div className="interview-layout">
          <aside className="chapter-rail" aria-label="Interview phases">
            <div className="phase-card">
              <p className="eyebrow">Phase</p>
              <button
                className={phase === 'outline' ? 'question-pill active' : 'question-pill'}
                type="button"
                onClick={() => setInterviewPhase('outline')}
              >
                1. Life Map ({outlineCount}/{OUTLINE_QUESTIONS.length})
              </button>
              <button
                className={phase === 'stories' ? 'question-pill active' : 'question-pill'}
                type="button"
                onClick={() => setInterviewPhase('stories')}
              >
                2. Story Scenes ({storyCount}/{storyQuestions.length})
              </button>
            </div>

            <div className="chapter-group">
              <div className="chapter-heading">
                <strong>{phase === 'outline' ? 'Outline questions' : 'Generated story prompts'}</strong>
                <span>{questions.length}</span>
              </div>
              <p>
                {phase === 'outline'
                  ? 'Capture the broad skeleton first.'
                  : 'These are built from the outline you provided.'}
              </p>
              {questions.map((question, index) => (
                <button
                  className={index === activeIndex ? 'question-pill active' : 'question-pill'}
                  key={question.id}
                  type="button"
                  onClick={() => selectQuestion(index)}
                >
                  {question.title}
                </button>
              ))}
            </div>
          </aside>

          <section className="interview-panel" aria-label="Current interview question">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{activeQuestion.chapter}</p>
                <h2>{activeQuestion.title}</h2>
              </div>
              <span className="save-state">{status}</span>
            </div>

            <blockquote>{activeQuestion.prompt}</blockquote>
            <p className="follow-up">{activeQuestion.followUp}</p>

            <div className="voice-console">
              <button type="button" onClick={speakPrompt}>Hear prompt</button>
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
              <button type="button" onClick={() => moveQuestion(-1)}>Previous</button>
              <button type="button" onClick={() => moveQuestion(1)}>Next question</button>
            </div>
          </section>

          <aside className="memory-board" aria-label="Organized life structure">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Structure</p>
                <h2>Life map</h2>
              </div>
            </div>
            <div className="memory-list">
              {OUTLINE_QUESTIONS.map((question) => {
                const answer = answers[question.id];
                return (
                  <article className="memory-card" key={question.id}>
                    <span>{question.chapter}</span>
                    <h3>{question.title}</h3>
                    <p>{answer?.text || 'Waiting for outline...'}</p>
                    {answer ? <small>{formatDate(answer.updatedAt)}</small> : null}
                  </article>
                );
              })}
              {phase === 'stories' ? (
                <article className="memory-card emphasis">
                  <span>Next layer</span>
                  <h3>{storyQuestions.length} story prompts generated</h3>
                  <p>
                    The app is now asking for specific scenes, conflict, dialogue,
                    sensory details, and meaning from the outline.
                  </p>
                </article>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
