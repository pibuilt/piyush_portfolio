import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
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

type HiddenCommandId = 'piyush-bhuyan';
type CommandTarget = CommandId | HiddenCommandId;
type TurnStatus = 'processing' | 'done' | 'error';
type TurnStage = 'scaffolding' | 'thinking';

type Turn = {
  rawCommand: string;
  resolved: CommandTarget | null;
  status: TurnStatus;
  stage?: TurnStage;
  missingCommand?: string;
};

const commandLookup = new Map<string, CommandTarget>();

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
const defaultBannerPosition = { x: 24, y: 44 };
const hiddenBannerCommand = '/piyush bhuyan';
const hiddenBannerCommandNormalized = 'piyush bhuyan';

function App() {
  const [query, setQuery] = useState('');
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showCommandTab, setShowCommandTab] = useState(false);
  const [bannerPosition, setBannerPosition] = useState(defaultBannerPosition);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [isBannerCommanding, setIsBannerCommanding] = useState(false);
  const [isBannerHidden, setIsBannerHidden] = useState(false);
  const [secretStage, setSecretStage] = useState(0);
  const [secretPhase, setSecretPhase] = useState<'idle' | 'booting' | 'exiting'>('idle');
  const [bootStage, setBootStage] = useState(0);
  const [bootPhase, setBootPhase] = useState<'booting' | 'exiting' | 'done'>(() => {
    if (typeof window === 'undefined') {
      return 'booting';
    }

    return window.sessionStorage.getItem(bootSessionKey) === '1' ? 'done' : 'booting';
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const promptShellRef = useRef<HTMLLabelElement>(null);
  const terminalPageRef = useRef<HTMLElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const bannerDragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const timersRef = useRef<number[]>([]);

  const normalizedQuery = query.trim().replace(/^\/+/, '').toLowerCase();
  const isBusy = currentTurn?.status === 'processing';
  const isSecretThemeActive = isBannerCommanding || secretPhase !== 'idle' || isBannerHidden;

  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const getSearchTerms = (command: (typeof commands)[number]) => {
      const label = command.label.replace('/', '').toLowerCase();
      const aliases = command.aliases.map((alias) => alias.toLowerCase());
      const terms = [command.id.toLowerCase(), label, ...aliases];

      return { label, aliases, terms };
    };

    const scoreCommand = (command: (typeof commands)[number]) => {
      const { label, aliases } = getSearchTerms(command);

      if (label === normalizedQuery || command.id === normalizedQuery || aliases.includes(normalizedQuery)) {
        return 6;
      }

      if (label.startsWith(normalizedQuery) || command.id.startsWith(normalizedQuery)) {
        return 5;
      }

      if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
        return 4;
      }

      if (label.includes(normalizedQuery) || command.id.includes(normalizedQuery)) {
        return 3;
      }

      if (aliases.some((alias) => alias.includes(normalizedQuery))) {
        return 2;
      }

      return 0;
    };

    return commands
      .filter((command) => {
        const { terms } = getSearchTerms(command);
        return terms.some((term) => term.includes(normalizedQuery));
      })
      .sort((left, right) => {
        const scoreDifference = scoreCommand(right) - scoreCommand(left);
        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.label.localeCompare(right.label);
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
    // Only orchestrate staged lines while still booting. If this effect depended on bootPhase ===
    // 'exiting', cleanup would clear the delayed "done" timer and the overlay could stay (invisible
    // after exit animation but still capturing clicks) until a skip handler fired on user input.
    if (bootPhase !== 'booting') {
      return;
    }

    const removeSkipListeners = () => {
      window.removeEventListener('keydown', skipBoot);
      window.removeEventListener('pointerdown', skipBoot);
    };

    function skipBoot() {
      setBootPhase((current) => (current === 'done' ? current : 'exiting'));
    }

    const stageTimers = [
      window.setTimeout(() => setBootStage(1), 450),
      window.setTimeout(() => setBootStage(2), 900),
      window.setTimeout(() => setBootStage(3), 1300),
      window.setTimeout(() => setBootPhase('exiting'), 1850),
    ];

    window.addEventListener('keydown', skipBoot, { once: true });
    window.addEventListener('pointerdown', skipBoot, { once: true });

    return () => {
      stageTimers.forEach((timer) => window.clearTimeout(timer));
      removeSkipListeners();
    };
  }, [bootPhase]);

  useEffect(() => {
    if (bootPhase !== 'exiting') {
      return;
    }

    // Matches `boot-exit` in styles.css (~420ms) with a short buffer before unmounting.
    const bootExitMs = 460;
    const completionTimer = window.setTimeout(() => {
      setBootPhase('done');
      window.sessionStorage.setItem(bootSessionKey, '1');
    }, bootExitMs);

    return () => window.clearTimeout(completionTimer);
  }, [bootPhase]);

  useEffect(() => {
    if (!isBusy) {
      inputRef.current?.focus();
    }
  }, [isBusy]);

  useEffect(() => {
    document.body.classList.toggle('secret-mode', isSecretThemeActive);

    return () => {
      document.body.classList.remove('secret-mode');
    };
  }, [isSecretThemeActive]);

  useEffect(() => {
    if (!isDraggingBanner) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = bannerDragRef.current;
      const page = terminalPageRef.current;
      const banner = bannerRef.current;

      if (!dragState || !page || !banner || event.pointerId !== dragState.pointerId) {
        return;
      }

      const minX = 16;
      const minY = 16;
      const maxX = Math.max(minX, page.clientWidth - banner.offsetWidth - 16);
      const maxY = Math.max(minY, page.clientHeight - banner.offsetHeight - 16);
      const nextX = Math.min(
        maxX,
        Math.max(minX, dragState.startX + (event.clientX - dragState.originX)),
      );
      const nextY = Math.min(
        maxY,
        Math.max(minY, dragState.startY + (event.clientY - dragState.originY)),
      );

      setBannerPosition({ x: nextX, y: nextY });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const dragState = bannerDragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const promptShell = promptShellRef.current;
      const banner = bannerRef.current;

      bannerDragRef.current = null;
      setIsDraggingBanner(false);

      if (!promptShell || !banner) {
        return;
      }

      const promptRect = promptShell.getBoundingClientRect();
      const bannerRect = banner.getBoundingClientRect();
      const droppedInsidePrompt =
        bannerRect.right >= promptRect.left &&
        bannerRect.left <= promptRect.right &&
        bannerRect.bottom >= promptRect.top &&
        bannerRect.top <= promptRect.bottom;

      if (!droppedInsidePrompt) {
        return;
      }

      setIsBannerCommanding(true);
      setQuery(hiddenBannerCommand);
      setSecretStage(0);
      setSecretPhase('booting');

      scheduleTimer(() => setSecretStage(1), 170);
      scheduleTimer(() => setSecretStage(2), 380);
      scheduleTimer(() => setSecretStage(3), 640);
      scheduleTimer(() => setSecretPhase('exiting'), 900);
      scheduleTimer(() => {
        setIsBannerHidden(true);
        executeCommand(hiddenBannerCommand, { allowHidden: true });
        setBannerPosition(defaultBannerPosition);
        setIsBannerCommanding(false);
        setSecretPhase('idle');
      }, 1120);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [isDraggingBanner]);

  const scheduleTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const handleBannerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isBannerCommanding) {
      return;
    }

    bannerDragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: bannerPosition.x,
      startY: bannerPosition.y,
    };
    setIsDraggingBanner(true);
  };

  const resetBannerPosition = () => {
    setBannerPosition(defaultBannerPosition);
  };

  const triggerResumeDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = resumeHref;
    anchor.download = 'Piyush_Bhuyan_Resume.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const executeCommand = (rawValue: string, options?: { allowHidden?: boolean }) => {
    const rawTrimmed = rawValue.trim();
    const sanitized = rawTrimmed.replace(/^\/+/, '').toLowerCase();

    if (!sanitized || isBusy) {
      return;
    }

    const rawCommand = rawTrimmed.startsWith('/') ? rawTrimmed : `/${sanitized}`;
    const nextCommand =
      options?.allowHidden && sanitized === hiddenBannerCommandNormalized
        ? 'piyush-bhuyan'
        : commandLookup.get(sanitized);

    setLastCommand(sanitized);
    setQuery('');
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
      const exactMatch = commandLookup.get(normalizedQuery);
      const selected = exactMatch ? `/${exactMatch}` : suggestions[highlightedIndex]?.label ?? query;
      executeCommand(selected);
      return;
    }

    if (event.key === 'Escape') {
      setQuery('');
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
        menu
      </button>

      {showCommandTab ? (
        <aside className="command-tab-panel">
          <div className="command-tab-head">
            <span>menu</span>
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

      <main
        ref={terminalPageRef}
        className={`terminal-page${isDraggingBanner ? ' dragging-banner' : ''}${isBannerCommanding ? ' banner-commanding' : ''}`}
      >
        {secretPhase !== 'idle' ? <SecretSequence stage={secretStage} exiting={secretPhase === 'exiting'} /> : null}

        {!isBannerHidden ? (
          <div
            ref={bannerRef}
            className={`banner-title floating${isDraggingBanner ? ' dragging' : ''}${isBannerCommanding ? ' morphing' : ''}`}
            aria-label="Piyush Bhuyan banner"
            style={{ left: `${bannerPosition.x}px`, top: `${bannerPosition.y}px` }}
            onPointerDown={handleBannerPointerDown}
            onDoubleClick={resetBannerPosition}
          >
            PIYUSH BHUYAN
          </div>
        ) : null}

        <section className={`terminal-hero${isBannerHidden ? ' banner-hidden' : ''}`}>
          <div className="terminal-status-bar" aria-label="Terminal session metadata">
            <span>shell: pwsh</span>
            <span>mode: portfolio-runtime</span>
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
              promptShellRef={promptShellRef}
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

function SecretSequence({ stage, exiting }: { stage: number; exiting: boolean }) {
  return (
    <div className={`secret-sequence${exiting ? ' exiting' : ''}`} aria-hidden="true">
      <div className="secret-shell">
        <div className="secret-title">hidden route // engaged</div>
        <div className="boot-lines">
          <BootLine ready stage={stage >= 0}>
            [ok] banner token accepted
          </BootLine>
          <BootLine ready stage={stage >= 1}>
            [ok] resolving private profile branch
          </BootLine>
          <BootLine ready stage={stage >= 2}>
            [ok] lifting public mask
          </BootLine>
          <BootLine ready stage={stage >= 3}>
            [ok] secret command ready
          </BootLine>
        </div>
      </div>
    </div>
  );
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

function ProcessingOutput({ stage, commandId }: { stage: TurnStage; commandId: CommandTarget }) {
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

function CommandOutput({ commandId }: { commandId: CommandTarget }) {
  if (commandId === 'piyush-bhuyan') {
    return (
      <div className="terminal-stack">
        <SecretCallout />
        <TerminalLine variant="heading">/piyush bhuyan</TerminalLine>
        <TerminalLine variant="body">
          Beyond the terminal, I am basically a mix of engineering, organized chaos, and very specific obsessions.
        </TerminalLine>
        <TerminalGap />
        <TerminalLine variant="label">A few things about me</TerminalLine>
        <TerminalLine variant="list">
          - major DC fan: comics, vintage finds, hard-to-track single issues, action figures, and anything DC really
        </TerminalLine>
        <TerminalLine variant="list">
          - big fraghead: I love collecting perfumes, especially the niche and weirdly memorable kind
        </TerminalLine>
        <TerminalLine variant="list">
          - open-source LLM enthusiast: I enjoy good models, local experimentation, and not paying for credits when I do not have to
        </TerminalLine>
        <TerminalLine variant="list">
          - MUN / Toastmasters person: I like speaking, debating, hosting rooms, and organizing fast-moving chaos
        </TerminalLine>
        <TerminalGap />
        <TerminalLine variant="body">
          So yes, I build AI systems and backend workflows. But I also care a lot about taste, storytelling, and energy.
        </TerminalLine>
        <TerminalLine variant="body">
          If you found this, you were curious enough to keep digging. I respect that.
        </TerminalLine>
      </div>
    );
  }

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

function SecretCallout() {
  return (
    <div className="secret-callout" role="note" aria-label="Secret easter egg found">
      <span className="secret-callout-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M8 18h4V9a2 2 0 1 1 4 0v9h1v-6a2 2 0 1 1 4 0v6h1v-4a2 2 0 1 1 4 0v9c0 4.4-3.6 8-8 8h-6l-6-8a2 2 0 0 1 2-3Z" />
        </svg>
      </span>
      <span>You found the secret easter egg.</span>
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
  promptShellRef,
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
  promptShellRef: React.RefObject<HTMLLabelElement | null>;
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
      <label ref={promptShellRef} className="command-input-shell" htmlFor="command-input">
        <span className="prompt-glyph">{'>'}</span>
        <input
          ref={inputRef}
          id="command-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
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
