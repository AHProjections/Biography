'use client';

import { useEffect, useMemo, useState } from 'react';

const LIFE_STAGES = ['childhood', 'education', 'career', 'relationships', 'turning_points'] as const;
const CATEGORIES = ['milestone', 'challenge', 'achievement', 'reflection'] as const;
const STORAGE_KEY = 'biography.notes.v1';

type NoteState = {
  noteText: string;
  category: string;
  eventYear: string;
};

type InitialRow = {
  life_stage: string;
  note_text: string;
  category: string | null;
  event_year: number | null;
};

function normalizeInitialNotes(rows: InitialRow[]): Record<string, NoteState> {
  const base = LIFE_STAGES.reduce<Record<string, NoteState>>((acc, stage) => {
    acc[stage] = { noteText: '', category: 'milestone', eventYear: '' };
    return acc;
  }, {});

  rows.forEach((row) => {
    base[row.life_stage] = {
      noteText: row.note_text ?? '',
      category: row.category ?? 'milestone',
      eventYear: row.event_year ? String(row.event_year) : '',
    };
  });

  return base;
}

function loadSavedNotes() {
  if (typeof window === 'undefined') {
    return normalizeInitialNotes([]);
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, NoteState>) : normalizeInitialNotes([]);
  } catch {
    return normalizeInitialNotes([]);
  }
}

export default function NotesAutosave() {
  const [selectedStage, setSelectedStage] = useState<string>(LIFE_STAGES[0]);
  const [notesByStage, setNotesByStage] = useState<Record<string, NoteState>>(
    normalizeInitialNotes([]),
  );
  const [status, setStatus] = useState('Ready');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setNotesByStage(loadSavedNotes());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notesByStage));
        setStatus(`Saved ${new Date().toLocaleTimeString()}`);
      } catch {
        setStatus('Save failed: browser storage is unavailable');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoaded, notesByStage]);

  const current = notesByStage[selectedStage];

  const timelineItems = useMemo(
    () =>
      Object.entries(notesByStage)
        .map(([lifeStage, value]) => ({ lifeStage, ...value }))
        .filter((item) => item.noteText.trim().length > 0)
        .sort((a, b) => {
          if (!a.eventYear && !b.eventYear) return a.lifeStage.localeCompare(b.lifeStage);
          if (!a.eventYear) return 1;
          if (!b.eventYear) return -1;
          return Number(a.eventYear) - Number(b.eventYear);
        }),
    [notesByStage],
  );

  return (
    <section>
      <h2>Interview notes (autosave every 5 seconds)</h2>

      <label htmlFor="stage">Life stage</label>
      <br />
      <select id="stage" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)}>
        {LIFE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage.replace('_', ' ')}
          </option>
        ))}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
        <div>
          <label htmlFor="category">Category</label>
          <br />
          <select
            id="category"
            value={current.category}
            onChange={(event) =>
              setNotesByStage((prev) => ({
                ...prev,
                [selectedStage]: { ...prev[selectedStage], category: event.target.value },
              }))
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eventYear">Event year (optional)</label>
          <br />
          <input
            id="eventYear"
            type="number"
            min={1900}
            max={2100}
            value={current.eventYear}
            onChange={(event) =>
              setNotesByStage((prev) => ({
                ...prev,
                [selectedStage]: { ...prev[selectedStage], eventYear: event.target.value },
              }))
            }
          />
        </div>
      </div>

      <label htmlFor="notes" style={{ marginTop: '0.75rem', display: 'block' }}>
        Notes
      </label>
      <textarea
        id="notes"
        value={current.noteText}
        onChange={(event) =>
          setNotesByStage((prev) => ({
            ...prev,
            [selectedStage]: { ...prev[selectedStage], noteText: event.target.value },
          }))
        }
        rows={8}
        style={{ width: '100%', marginTop: '0.4rem' }}
      />
      <p aria-live="polite">{status}</p>

      <h3>Timeline preview</h3>
      {timelineItems.length === 0 ? (
        <p>No notes yet. Start with your first life stage note.</p>
      ) : (
        <ul>
          {timelineItems.map((item) => (
            <li key={item.lifeStage}>
              <strong>{item.eventYear || 'Year TBD'}</strong> — {item.lifeStage.replace('_', ' ')} [{item.category}] —{' '}
              {item.noteText.slice(0, 120)}
              {item.noteText.length > 120 ? '…' : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
