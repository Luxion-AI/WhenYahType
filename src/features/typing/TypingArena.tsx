import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Timer, Flame, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Duration, DURATIONS, Mode, RunResult, RunTicket, TypingSettings } from '../../types/typing';
import { calculateStats, generateTargetText, getDailySeedNumber, getTodayUTC } from '../../lib/generator';
import { playKeyClick } from '../../lib/sound';
import { requestRunTicket, submitRunScore } from '../../lib/supabase';
import { saveLocalRun, updatePersonalBest } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { WaifuCompanion } from './WaifuCompanion';

interface TypingArenaProps {
  mode: Mode;
  duration: Duration;
  onDurationChange: (d: Duration) => void;
  onModeChange: (m: Mode) => void;
  settings: TypingSettings;
  onRunComplete: (result: RunResult) => void;
}

export const TypingArena: React.FC<TypingArenaProps> = ({
  mode,
  duration,
  onDurationChange,
  onModeChange,
  settings,
  onRunComplete,
}) => {
  const { user, isGuest, isConfigured } = useAuth();

  const [typed, setTyped] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(mode === 'daily' ? 60 : duration);
  const [ticket, setTicket] = useState<RunTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  const activeDuration = mode === 'daily' ? 60 : duration;

  // Compute seed
  const currentSeed = useMemo(() => {
    if (mode === 'daily') {
      return getTodayUTC();
    }
    return 'classic-v1';
  }, [mode]);

  const seedNumber = useMemo(() => {
    return mode === 'daily' ? getDailySeedNumber(currentSeed) : 0;
  }, [mode, currentSeed]);

  // Generate deterministic target text
  const targetText = useMemo(() => {
    return generateTargetText(3200, seedNumber);
  }, [seedNumber]);

  // Fetch ticket when configuration changes or restart
  const fetchNewTicket = useCallback(async () => {
    if (!isConfigured || !user || isGuest) {
      setTicket(null);
      return;
    }
    setTicketLoading(true);
    const newTicket = await requestRunTicket(mode, activeDuration);
    setTicket(newTicket);
    setTicketLoading(false);
  }, [isConfigured, user, isGuest, mode, activeDuration]);

  // Reset run
  const resetRun = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTyped('');
    setIsRunning(false);
    setIsFinished(false);
    setRemainingTime(activeDuration);
    startTimeRef.current = null;
    endTimeRef.current = null;
    isSubmittingRef.current = false;

    if (settings.soundEnabled) {
      playKeyClick('restart', settings.soundVolume);
    }

    fetchNewTicket();

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [activeDuration, settings.soundEnabled, settings.soundVolume, fetchNewTicket]);

  // Change duration or mode
  useEffect(() => {
    resetRun();
  }, [duration, mode, resetRun]);

  // Handle run completion
  const handleFinish = useCallback(async (finalTyped: string, startMs: number, endMs: number) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRunning(false);
    setIsFinished(true);

    const elapsedMs = Math.max(100, endMs - startMs);
    const elapsedSeconds = elapsedMs / 1000;
    const stats = calculateStats(finalTyped, targetText, elapsedSeconds);

    const isPb = updatePersonalBest(activeDuration, stats.wpm);
    if (isPb && stats.wpm > 20) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#ffd84d'],
        });
      } catch {
        // Ignore
      }
    }

    // Prepare preliminary result object
    const initialResult: RunResult = {
      duration: activeDuration,
      mode,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      phraseCount: stats.phraseCount,
      correct: stats.correct,
      errors: stats.errors,
      elapsedMs,
      isPersonalBest: isPb,
      status: ticket ? 'validating' : 'offline_saved',
      createdAt: new Date().toISOString(),
    };

    saveLocalRun(initialResult);
    onRunComplete(initialResult);

    // If we have an anti-cheat run ticket, submit for authoritative server verification
    if (ticket && ticket.ticketId) {
      try {
        const verifyRes = await submitRunScore({
          ticketId: ticket.ticketId,
          typed: finalTyped,
          elapsedMs,
        });

        if (verifyRes.ok && verifyRes.score) {
          const verifiedResult: RunResult = {
            ...initialResult,
            runId: verifyRes.runId,
            wpm: verifyRes.score.wpm,
            rawWpm: verifyRes.score.rawWpm,
            accuracy: verifyRes.score.accuracy,
            phraseCount: verifyRes.score.phraseCount,
            status: 'verified',
            unlockedAchievements: verifyRes.newAchievements,
          };
          saveLocalRun(verifiedResult);
          onRunComplete(verifiedResult);
        } else {
          const rejectedResult: RunResult = {
            ...initialResult,
            status: 'rejected',
            errorMessage: verifyRes.error || 'Server validation rejected the run.',
          };
          onRunComplete(rejectedResult);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error during validation';
        onRunComplete({
          ...initialResult,
          status: 'rejected',
          errorMessage: msg,
        });
      }
    }
  }, [activeDuration, mode, targetText, ticket, onRunComplete]);

  // Key stroke handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab shortcut restarts immediately
    if (e.key === 'Tab') {
      e.preventDefault();
      resetRun();
      return;
    }

    // Escape blurs or resets
    if (e.key === 'Escape') {
      e.preventDefault();
      resetRun();
      return;
    }

    if (isFinished) return;

    // Start timer on first valid character
    if (!isRunning && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setIsRunning(true);
      const now = Date.now();
      startTimeRef.current = now;

      // Start ticker
      timerIntervalRef.current = window.setInterval(() => {
        if (!startTimeRef.current) return;
        const currentElapsed = (Date.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, activeDuration - currentElapsed);
        setRemainingTime(Math.ceil(remaining));

        if (remaining <= 0) {
          const endNow = Date.now();
          endTimeRef.current = endNow;
          // Capture current typed text from DOM directly to avoid state race
          const latestTyped = inputRef.current?.value || '';
          handleFinish(latestTyped, startTimeRef.current, endNow);
        }
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    const value = e.target.value;
    const prevLen = typed.length;
    const newLen = value.length;

    // Play tactile sound
    if (settings.soundEnabled && newLen > prevLen) {
      const char = value[newLen - 1];
      const targetChar = targetText[newLen - 1];
      if (char === ' ') {
        playKeyClick('space', settings.soundVolume);
      } else if (char === targetChar) {
        playKeyClick('correct', settings.soundVolume);
      } else {
        playKeyClick('error', settings.soundVolume);
      }
    }

    setTyped(value);
  };

  // Keyboard focus helper
  const handleArenaClick = () => {
    inputRef.current?.focus();
  };

  // Live stats calculation
  const currentElapsed = useMemo(() => {
    if (isRunning && startTimeRef.current) {
      return Math.max(0.2, (Date.now() - startTimeRef.current) / 1000);
    }
    if (isFinished) {
      return activeDuration;
    }
    return 0.1;
  }, [isRunning, isFinished, activeDuration, remainingTime]);

  const liveStats = useMemo(() => {
    return calculateStats(typed, targetText, currentElapsed);
  }, [typed, targetText, currentElapsed]);

  // Window scroll prevention when typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        resetRun();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [resetRun]);

  // Visible characters window to optimize render performance
  const renderWindow = useMemo(() => {
    const caretIndex = typed.length;
    const startIdx = Math.max(0, caretIndex - 60);
    const endIdx = Math.min(targetText.length, caretIndex + 140);
    return {
      startIdx,
      endIdx,
      slice: targetText.slice(startIdx, endIdx),
    };
  }, [typed.length, targetText]);

  return (
    <div className="typing-arena-container">
      {/* Top Controls Bar */}
      <div className="typing-controls-bar">
        {/* Mode Selector */}
        <div className="segmented-control mode-selector">
          <button
            type="button"
            className={`seg-btn ${mode === 'classic' ? 'active' : ''}`}
            onClick={() => onModeChange('classic')}
            disabled={isRunning}
          >
            <Sparkles size={14} />
            <span>Classic</span>
          </button>
          <button
            type="button"
            className={`seg-btn ${mode === 'daily' ? 'active' : ''}`}
            onClick={() => onModeChange('daily')}
            disabled={isRunning}
          >
            <Flame size={14} className="accent-icon" />
            <span>Daily Challenge</span>
          </button>
        </div>

        {/* Duration Selector (Only shown in Classic mode) */}
        {mode === 'classic' && (
          <div className="segmented-control duration-selector">
            <Timer size={14} className="control-icon" />
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`seg-btn ${duration === d ? 'active' : ''}`}
                onClick={() => onDurationChange(d)}
                disabled={isRunning}
              >
                {d}s
              </button>
            ))}
          </div>
        )}

        {/* Security / Ticket status pill */}
        <div className="ticket-status-pill">
          {ticketLoading ? (
            <span className="pill-text dim">Generating ticket...</span>
          ) : ticket ? (
            <span className="pill-text secure">
              <ShieldCheck size={14} /> Server Ticket Ready
            </span>
          ) : (
            <span className="pill-text local">
              <AlertCircle size={14} /> Local Play Mode
            </span>
          )}
        </div>
      </div>

      {/* Live Stats HUD */}
      <div className="typing-hud">
        <div className="hud-metric main-metric">
          <div className="hud-value accent-text">{remainingTime}</div>
          <div className="hud-label">Seconds</div>
        </div>

        <div className="hud-metric">
          <div className="hud-value">{isRunning ? liveStats.wpm : '-'}</div>
          <div className="hud-label">WPM</div>
        </div>

        <div className="hud-metric">
          <div className="hud-value">{isRunning ? `${liveStats.accuracy}%` : '-'}</div>
          <div className="hud-label">Accuracy</div>
        </div>

        <div className="hud-metric">
          <div className="hud-value">{isRunning ? liveStats.phraseCount : '-'}</div>
          <div className="hud-label">When Yahs</div>
        </div>
      </div>

      {/* Waifu Cheerleader Companion */}
      <WaifuCompanion
        isRunning={isRunning}
        isFinished={isFinished}
        wpm={liveStats.wpm}
        accuracy={liveStats.accuracy}
        errors={liveStats.errors}
        phraseCount={liveStats.phraseCount}
      />

      {/* Typing Display Arena */}
      <div
        ref={containerRef}
        className={`typing-box ${settings.fontSize}`}
        onClick={handleArenaClick}
        role="region"
        aria-label="Typing test area"
      >
        <textarea
          ref={inputRef}
          className="hidden-type-input"
          value={typed}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Typing input stream"
        />

        <div className="typing-stream">
          {renderWindow.slice.split('').map((char, index) => {
            const absoluteIndex = renderWindow.startIdx + index;
            const isTyped = absoluteIndex < typed.length;
            const isCaret = absoluteIndex === typed.length;
            const isCorrect = isTyped && typed[absoluteIndex] === char;
            const isError = isTyped && typed[absoluteIndex] !== char;

            let charClass = 'char-pending';
            if (isCorrect) charClass = 'char-correct';
            if (isError) charClass = 'char-error';

            return (
              <span
                key={absoluteIndex}
                className={`type-char ${charClass} ${isCaret ? `caret-${settings.caretStyle}` : ''}`}
              >
                {char === ' ' ? ' ' : char}
              </span>
            );
          })}
        </div>

        {!isRunning && !isFinished && typed.length === 0 && (
          <div className="typing-hint-overlay">
            <span>Type <strong>When Yah</strong> to start the countdown</span>
          </div>
        )}
      </div>

      {/* Restart & Action Controls */}
      <div className="typing-bottom-actions">
        <button
          type="button"
          className="btn btn-secondary restart-btn"
          onClick={resetRun}
          title="Restart Test (Tab)"
        >
          <RotateCcw size={16} />
          <span>Restart</span>
          <kbd className="kbd-shortcut">Tab</kbd>
        </button>
      </div>
    </div>
  );
};
