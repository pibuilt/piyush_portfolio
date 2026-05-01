import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CommandId,
  commands,
  connect,
  education,
  experience,
  metrics,
  profile,
  projects,
  publicationNote,
  publications,
  skillGroups,
  certifications,
} from './data/portfolio';

type TurnStatus = 'processing' | 'done' | 'error';
type TurnStage = 'scaffolding' | 'thinking';

type Turn = {
  rawCommand: string;
  resolved: CommandId | null;
  status: TurnStatus;
  stage?: TurnStage;
  missingCommand?: string;
};

const commandLookup = new Map<string, CommandId>();

commands.forEach((command) => {
  commandLookup.set(command.id, command.id);
  commandLookup.set(command.label.replace('/', '').toLowerCase(), command.id);
  command.aliases.forEach((alias) => {
    commandLookup.set(alias.toLowerCase(), command.id);
  });
});

const processingDurationMs = 1500;
const resumeHref = `${import.meta.env.BASE_URL}Piyush_Bhuyan_Resume.pdf`;
const bootSessionKey = 'portfolio_boot_seen_v1';

function App() {
  const [query, setQuery] = useState('/');
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showCommandTab, setShowCommandTab] = useState(false);
  const [uptimeMinutes, setUptimeMinutes] = useState(0);
  const [bootStage, setBootStage] = useState(0);
  const [bootPhase, setBootPhase] = useState<'booting' | 'exiting' | 'done'>(() => {
    if (typeof window === 'undefined') {
      return 'booting';
    }

    return window.sessionStorage.getItem(bootSessionKey) === '1' ? 'done' : 'booting';
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const normalizedQuery = query.trim().replace(/^\//, '').toLowerCase();
  const isBusy = currentTurn?.status === 'processing';

  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return commands.filter((command) => {
      const haystack = [
        command.id,
        command.label,
        command.description,
        command.sample,
        ...command.aliases,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setUptimeMinutes((value) => value + 1);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bootPhase === 'done') {
      return;
    }

    const removeSkipListeners = () => {
      window.removeEventListener('keydown', skipBoot);
      window.removeEventListener('pointerdown', skipBoot);
    };

    const completeBoot = () => {
      setBootPhase('done');
      window.sessionStorage.setItem(bootSessionKey, '1');
      removeSkipListeners();
    };

    let skipCompletionTimer: number | null = null;

    function skipBoot() {
      setBootPhase((current) => {
        if (current === 'done') {
          return current;
        }

        return 'exiting';
      });

      if (skipCompletionTimer) {
        window.clearTimeout(skipCompletionTimer);
      }

      skipCompletionTimer = window.setTimeout(() => {
        completeBoot();
      }, 420);
    }

    const stageTimers = [
      window.setTimeout(() => setBootStage(1), 450),
      window.setTimeout(() => setBootStage(2), 900),
      window.setTimeout(() => setBootStage(3), 1300),
      window.setTimeout(() => setBootPhase('exiting'), 1850),
      window.setTimeout(() => completeBoot(), 2350),
    ];

    window.addEventListener('keydown', skipBoot, { once: true });
    window.addEventListener('pointerdown', skipBoot, { once: true });

    return () => {
      stageTimers.forEach((timer) => window.clearTimeout(timer));
      if (skipCompletionTimer) {
        window.clearTimeout(skipCompletionTimer);
      }
      removeSkipListeners();
    };
  }, [bootPhase]);

  useEffect(() => {
    if (!isBusy) {
      inputRef.current?.focus();
    }
  }, [isBusy]);

  const scheduleTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const triggerResumeDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = resumeHref;
    anchor.download = 'Piyush_Bhuyan_Resume.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const executeCommand = (rawValue: string) => {
    const rawTrimmed = rawValue.trim();
    const sanitized = rawTrimmed.replace(/^\//, '').toLowerCase();

    if (!sanitized || isBusy) {
      return;
    }

    const rawCommand = rawTrimmed.startsWith('/') ? rawTrimmed : `/${sanitized}`;
    const nextCommand = commandLookup.get(sanitized);

    setLastCommand(sanitized);
    setQuery('/');
    setShowCommandTab(false);

    if (!nextCommand) {
      setCurrentTurn({
        rawCommand,
        resolved: null,
        status: 'processing',
        stage: 'thinking',
        missingCommand: sanitized,
      });

      scheduleTimer(() => {
        setCurrentTurn((current) =>
          current && current.missingCommand === sanitized
            ? { ...current, status: 'error', stage: 'thinking' }
            : current,
        );
      }, 950);
      return;
    }

    setCurrentTurn({
      rawCommand,
      resolved: nextCommand,
      status: 'processing',
      stage: 'scaffolding',
    });

    scheduleTimer(() => {
      setCurrentTurn((current) =>
        current && current.resolved === nextCommand
          ? { ...current, stage: 'thinking' }
          : current,
      );
    }, processingDurationMs / 2);

    scheduleTimer(() => {
      setCurrentTurn((current) =>
        current && current.resolved === nextCommand
          ? { ...current, status: 'done', stage: 'thinking' }
          : current,
      );

      if (nextCommand === 'resume') {
        triggerResumeDownload();
      }
    }, processingDurationMs);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (suggestions.length === 0 ? 0 : (current + 1) % suggestions.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (suggestions.length > 0) {
        setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      } else if (lastCommand) {
        setQuery(`/${lastCommand}`);
      }

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = suggestions[highlightedIndex]?.label ?? query;
      executeCommand(selected);
      return;
    }

    if (event.key === 'Escape') {
      setQuery('/');
      setShowCommandTab(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`app-shell ${bootPhase !== 'done' ? 'preboot' : 'ready'}`}>
      {bootPhase !== 'done' ? <BootSequence stage={bootStage} exiting={bootPhase === 'exiting'} /> : null}

      <button
        type="button"
        className={`command-tab-toggle ${showCommandTab ? 'open' : ''}`}
        onClick={() => setShowCommandTab((current) => !current)}
      >
        quick cheatsheet
      </button>

      {showCommandTab ? (
        <aside className="command-tab-panel">
          <div className="command-tab-head">
            <span>quick cheatsheet</span>
            <button type="button" onClick={() => setShowCommandTab(false)}>
              close
            </button>
          </div>
          <div className="command-tab-list">
            {commands.map((command) => (
              <button
                key={command.id}
                type="button"
                className="command-tab-item"
                onClick={() => executeCommand(command.label)}
              >
                <span>{command.label}</span>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <main className="terminal-page">
        <section className="terminal-hero">
          <div className="terminal-status-bar" aria-label="Terminal session metadata">
            <span>shell: pwsh</span>
            <span>mode: portfolio-runtime</span>
            <span>uptime: {uptimeMinutes}m</span>
          </div>

          <div className="banner-title" aria-label="Piyush Bhuyan banner">
            PIYUSH BHUYAN
          </div>

          <nav className="meta-row" aria-label="Links">
            <a href="mailto:works.piyushb@gmail.com">email</a>
            <a href="https://github.com/pibuilt" target="_blank" rel="noreferrer">
              github
            </a>
            <a href="https://linkedin.com/in/piyush-bhuyan-216445230" target="_blank" rel="noreferrer">
              linkedin
            </a>
            <a href={resumeHref} download="Piyush_Bhuyan_Resume.pdf">
              resume
            </a>
          </nav>
        </section>

        <div className="hint-line">Type a command and press Enter. Start with /help.</div>

        <section className="transcript">
          {currentTurn ? <TurnBlock turn={currentTurn} /> : null}

          {!isBusy ? (
            <PromptInput
              inputRef={inputRef}
              query={query}
              setQuery={setQuery}
              onKeyDown={onKeyDown}
              inputFocused={inputFocused}
              setInputFocused={setInputFocused}
              suggestions={suggestions}
              highlightedIndex={highlightedIndex}
              executeCommand={executeCommand}
              normalizedQuery={normalizedQuery}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function BootSequence({ stage, exiting }: { stage: number; exiting: boolean }) {
  return (
    <div className={`boot-overlay${exiting ? ' exiting' : ''}`} role="status" aria-live="polite" aria-label="Initializing terminal">
      <div className="boot-shell">
        <div className="boot-title">portfolio runtime // boot</div>
        <div className="boot-lines">
          <BootLine ready stage={stage >= 0}>
            [ok] loading claude-style interface kernel
          </BootLine>
          <BootLine ready stage={stage >= 1}>
            [ok] calibrating phosphor grid and scanline driver
          </BootLine>
          <BootLine ready stage={stage >= 2}>
            [ok] mounting command modules and profile index
          </BootLine>
          <BootLine ready stage={stage >= 3}>
            [ok] session ready // press any key to skip future wait
          </BootLine>
        </div>
      </div>
    </div>
  );
}

function BootLine({ ready, stage, children }: { ready: boolean; stage: boolean; children: ReactNode }) {
  if (!stage) {
    return <div className="boot-line pending">...</div>;
  }

  return <div className={`boot-line${ready ? ' ready' : ''}`}>{children}</div>;
}

function TurnBlock({ turn }: { turn: Turn }) {
  return (
    <div className={`turn-block ${turn.status}`}>
      <TerminalLine prompt=">">{turn.rawCommand}</TerminalLine>

      {turn.status === 'processing' && turn.resolved ? <ProcessingOutput stage={turn.stage ?? 'scaffolding'} commandId={turn.resolved} /> : null}
      {turn.status === 'error' ? <ErrorOutput missingCommand={turn.missingCommand ?? ''} /> : null}
      {turn.status === 'done' && turn.resolved ? <CommandOutput commandId={turn.resolved} /> : null}
    </div>
  );
}

function ProcessingOutput({ stage, commandId }: { stage: TurnStage; commandId: CommandId }) {
  return (
    <div className="terminal-stack">
      <TerminalLine accent>
        <span className={`status-pill ${stage}`}>{stage === 'scaffolding' ? 'scaffolding' : 'thinking'}</span>
      </TerminalLine>
      <TerminalLine variant="meta">
        {stage === 'scaffolding'
          ? `Preparing ${commandId} response structure`
          : `Refining the best ${commandId} output`}
      </TerminalLine>
    </div>
  );
}

function ErrorOutput({ missingCommand }: { missingCommand: string }) {
  return (
    <div className="terminal-stack">
      <TerminalLine accent>
        . Thinking...
      </TerminalLine>
      <TerminalLine variant="body">
        I am sorry, but the command `{missingCommand}` is not available in this portfolio runtime.
      </TerminalLine>
      <TerminalLine variant="meta">
        Please use /help or open the commands panel to inspect the supported command set.
      </TerminalLine>
    </div>
  );
}

function CommandOutput({ commandId }: { commandId: CommandId }) {
  if (commandId === 'help') {
    return (
      <div className="terminal-stack">
        <TerminalLine variant="heading">Available commands</TerminalLine>
        {commands.map((command) => (
          <TerminalLine key={command.id} variant="list">
            <span className="command-row">
              <span className="line-label">{command.label}</span>
              <span className="line-copy">{command.description}</span>
            </span>
          </TerminalLine>
        ))}
      </div>
    );
  }

  if (commandId === 'about') {
    return (
      <div className="terminal-stack">
        <TerminalLine variant="heading">{profile.name}</TerminalLine>
        <TerminalLine variant="meta">{profile.role}</TerminalLine>
        <TerminalGap />
        <TerminalLine variant="body">{profile.intro}</TerminalLine>
        <TerminalGap />
        <InlineImpactGrid
          items={metrics.map((metric, index) => ({
            key: metric.label,
            icon: <MetricGlyph kind={index === 0 ? 'impact' : index === 1 ? 'automation' : 'scale'} />,
            value: metric.value,
            detail: metric.detail,
          }))}
        />
      </div>
    );
  }

  if (commandId === 'experience') {
    return (
      <div className="terminal-stack">
        {experience.map((entry) => (
          <div key={`${entry.company}-${entry.role}`} className="terminal-section">
            <TerminalLine variant="heading">{entry.role}</TerminalLine>
            <TerminalLine variant="meta">
              {entry.company} | {entry.location} | {entry.period}
            </TerminalLine>
            <TerminalLine variant="label">Key impacts</TerminalLine>
            <InlineImpactGrid
              items={entry.highlights.map((highlight, index) => ({
                key: `${entry.role}-${index}`,
                icon: <MetricGlyph kind={index === 0 ? 'impact' : index === 1 ? 'automation' : 'scale'} />,
                detail: highlight,
              }))}
              compact
            />
          </div>
        ))}
      </div>
    );
  }

  if (commandId === 'projects') {
    return (
      <div className="terminal-stack">
        {projects.map((project) => (
          <div key={project.name} className="terminal-section">
            <TerminalLine variant="heading">
              {project.name} ({project.year})
            </TerminalLine>
            <TerminalLine variant="meta">stack | {project.stack}</TerminalLine>
            <TerminalLine variant="body">{project.summary}</TerminalLine>
            {project.highlights.slice(0, 2).map((highlight) => (
              <TerminalLine key={highlight} variant="body">
                {highlight}
              </TerminalLine>
            ))}
            <TerminalLine variant="list">
              -{' '}
              <a className="terminal-inline-link" href={project.href} target="_blank" rel="noreferrer">
                GitHub repo
              </a>
            </TerminalLine>
          </div>
        ))}
      </div>
    );
  }

  if (commandId === 'skillset') {
    return (
      <div className="terminal-stack">
        {skillGroups.map((group) => (
          <div key={group.name} className="terminal-section compact">
            <TerminalLine variant="heading">{group.name}</TerminalLine>
            <TerminalLine variant="body">{group.items.join(', ')}</TerminalLine>
          </div>
        ))}
      </div>
    );
  }

  if (commandId === 'certifications') {
    return (
      <div className="terminal-stack">
        {certifications.map((certification) => (
          <div key={certification.name} className="terminal-section compact">
            <TerminalLine variant="heading">{certification.name}</TerminalLine>
            <TerminalLine variant="meta">
              {certification.issuer} | {certification.year}
            </TerminalLine>
          </div>
        ))}
      </div>
    );
  }

  if (commandId === 'education') {
    return (
      <div className="terminal-stack">
        <TerminalLine variant="heading">{education.degree}</TerminalLine>
        <TerminalLine variant="meta">
          {education.institution} | {education.location} | {education.period}
        </TerminalLine>
        <TerminalLine variant="list">- {education.score}</TerminalLine>
        {education.highlights.map((highlight) => (
          <TerminalLine key={highlight} variant="list">
            - {highlight}
          </TerminalLine>
        ))}
      </div>
    );
  }

  if (commandId === 'publications') {
    return (
      <div className="terminal-stack">
        {publicationNote ? (
          <>
            <TerminalLine variant="body">{publicationNote}</TerminalLine>
            <TerminalGap />
          </>
        ) : null}
        {publications.map((publication) => (
          <div key={publication.title} className="terminal-section compact">
            <TerminalLine variant="heading">{publication.title}</TerminalLine>
            <TerminalLine variant="meta">
              {publication.venue} | {publication.year}
            </TerminalLine>
            <TerminalLine variant="body">{publication.summary}</TerminalLine>
            <TerminalLine variant="list">
              -{' '}
              <a className="terminal-inline-link" href={publication.href} target="_blank" rel="noreferrer">
                DOI link
              </a>
            </TerminalLine>
          </div>
        ))}
      </div>
    );
  }

  if (commandId === 'connect') {
    return (
      <div className="terminal-stack">
        {connect.map((entry) => (
          <TerminalLine key={entry.label} variant="list">
            <span className="line-label">{entry.label}</span>
            <a className="terminal-inline-link" href={entry.href} target="_blank" rel="noreferrer">
              {entry.value}
            </a>
          </TerminalLine>
        ))}
      </div>
    );
  }

  return (
    <div className="terminal-stack">
      <TerminalLine accent>Resume download started.</TerminalLine>
      <TerminalLine variant="meta">Saved as Piyush_Bhuyan_Resume.pdf</TerminalLine>
    </div>
  );
}

function InlineImpactGrid({
  items,
  compact = false,
}: {
  items: Array<{
    key: string;
    icon: ReactNode;
    value?: string;
    detail: string;
  }>;
  compact?: boolean;
}) {
  return (
    <div className={`inline-impact-grid${compact ? ' compact' : ''}`}>
      {items.map((item) => (
        <div key={item.key} className="inline-impact-tile">
          <span className="inline-impact-icon">{item.icon}</span>
          {item.value ? <strong className="inline-impact-value">{item.value}</strong> : null}
          <p className="inline-impact-detail">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function MetricGlyph({ kind }: { kind: 'impact' | 'automation' | 'scale' }) {
  if (kind === 'impact') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 16 10.5 11.5 13.5 14.5 19 9" />
        <path d="M15 9h4v4" />
      </svg>
    );
  }

  if (kind === 'automation') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M4.9 7.5 8 9.3" />
        <path d="M16 14.7l3.1 1.8" />
        <path d="M4.9 16.5 8 14.7" />
        <path d="M16 9.3l3.1-1.8" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 19 8v8l-7 4-7-4V8z" />
      <path d="M12 4v16" />
      <path d="M5 8l7 4 7-4" />
    </svg>
  );
}

function PromptInput({
  inputRef,
  query,
  setQuery,
  onKeyDown,
  inputFocused,
  setInputFocused,
  suggestions,
  highlightedIndex,
  executeCommand,
  normalizedQuery,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputFocused: boolean;
  setInputFocused: (value: boolean) => void;
  suggestions: typeof commands;
  highlightedIndex: number;
  executeCommand: (rawValue: string) => void;
  normalizedQuery: string;
}) {
  return (
    <div className="prompt-block">
      <label className="command-input-shell" htmlFor="command-input">
        <span className="prompt-glyph">{'>'}</span>
        <input
          ref={inputRef}
          id="command-input"
          value={query.replace(/^\//, '')}
          onChange={(event) => {
            setQuery(`/${event.target.value}`);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setInputFocused(false), 120);
          }}
          placeholder=""
          spellCheck={false}
          autoComplete="off"
        />
        <span className="cursor-indicator" aria-hidden="true" />
      </label>

      {(inputFocused || normalizedQuery.length > 0) && normalizedQuery.length > 0 ? (
        <div className="suggestion-list" role="listbox" aria-label="Command suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className={`suggestion-item ${index === highlightedIndex ? 'active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => executeCommand(suggestion.label)}
            >
              <span>{suggestion.label}</span>
            </button>
          ))}
          {suggestions.length === 0 ? <div className="suggestion-empty">command not found</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function TerminalLine({
  children,
  prompt,
  variant = 'default',
  accent = false,
}: {
  children: ReactNode;
  prompt?: string;
  variant?: 'default' | 'heading' | 'meta' | 'body' | 'label' | 'list';
  accent?: boolean;
}) {
  return (
    <div className={`terminal-line ${variant}${accent ? ' accent' : ''}`}>
      {prompt ? <span className="terminal-prompt">piyush@portfolio:~ {prompt}</span> : null}
      <span>{children}</span>
    </div>
  );
}

function TerminalGap() {
  return <div className="terminal-gap" aria-hidden="true" />;
}

export default App;
