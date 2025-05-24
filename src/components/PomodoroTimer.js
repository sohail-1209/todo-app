import React, { useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaRedo, FaForward, FaCog, FaSave, FaTimes, FaMinus, FaExpandAlt } from 'react-icons/fa';
import './PomodoroTimer.css';

const SESSIONS = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

const PomodoroTimer = ({ 
  focusedTodo, 
  onSessionComplete, 
  onClose, 
  initialSettings, 
  onSettingsChange 
}) => {
  const POMODORO_STORAGE_KEY = `pomodoroState_${focusedTodo ? focusedTodo.id : 'global'}`;

  const [settings, setSettings] = useState(initialSettings);

  // Load initial state from localStorage or use defaults
  const loadInitialState = () => {
    const savedState = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      // If timer was active, calculate elapsed time
      if (state.isActive && state.timestamp) {
        const timeElapsedMs = Date.now() - state.timestamp;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        let totalRemainingSeconds = (state.minutes * 60) + state.seconds - timeElapsedSeconds;

        if (totalRemainingSeconds <= 0) {
          // Timer would have finished, need to advance session (simplified here, full logic later)
          // For now, just reset to work session if it ended.
          // This part will need to integrate with session completion logic.
          state.minutes = settings.workDuration;
          state.seconds = 0;
          state.isActive = false; // Mark as not active until user starts
          state.currentSession = SESSIONS.WORK; // Default to work
          state.cycles = state.currentSession === SESSIONS.WORK ? state.cycles + 1 : state.cycles;
        } else {
          state.minutes = Math.floor(totalRemainingSeconds / 60);
          state.seconds = totalRemainingSeconds % 60;
        }
      }
      return state;
    }
    return {
      minutes: settings.workDuration,
      seconds: 0,
      currentSession: SESSIONS.WORK,
      isActive: false,
      cycles: 0,
      isMinimized: false, // Default minimized state
      // No timestamp initially if not active
    };
  };

  const [minutes, setMinutes] = useState(loadInitialState().minutes);
  const [seconds, setSeconds] = useState(loadInitialState().seconds);
  const [currentSession, setCurrentSession] = useState(loadInitialState().currentSession);
  const [isActive, setIsActive] = useState(loadInitialState().isActive);
  const [cycles, setCycles] = useState(loadInitialState().cycles);
  const [isMinimized, setIsMinimized] = useState(loadInitialState().isMinimized);

  const [showSettingsModal, setShowSettingsModal] = useState(false); 
  const [tempSettings, setTempSettings] = useState(settings); 
  const [audio] = useState(new Audio('/sounds/notification.mp3'));

  // Reset timer to a specific session type, using provided settings or current state's settings
  const resetTimer = useCallback((sessionType = SESSIONS.WORK, newSettings = settings) => {
    setIsActive(false);
    setCurrentSession(sessionType);
    if (sessionType === SESSIONS.WORK) {
      setMinutes(newSettings.workDuration);
    } else if (sessionType === SESSIONS.SHORT_BREAK) {
      setMinutes(newSettings.shortBreakDuration);
    } else if (sessionType === SESSIONS.LONG_BREAK) {
      setMinutes(newSettings.longBreakDuration);
    }
    setSeconds(0);
  }, [settings]); // Depends on current settings state for default

  // Effect to save state to localStorage
  useEffect(() => {
    const stateToSave = {
      minutes,
      seconds,
      currentSession,
      isActive,
      cycles,
      settings, // Also save current settings used by the timer
      isMinimized,
      timestamp: isActive ? Date.now() : null // Save timestamp only if active
    };
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [minutes, seconds, currentSession, isActive, cycles, settings, isMinimized, POMODORO_STORAGE_KEY]);

  // Effect to handle changes in initialSettings
  useEffect(() => {
    // Only update and potentially reset if the prop 'initialSettings' actually differs
    // from the component's current 'settings' state.
    if (JSON.stringify(initialSettings) !== JSON.stringify(settings)) {
      setSettings(initialSettings); // Update internal settings state
      // If the timer is not active, reset its display to reflect the new settings.
      if (!isActive) {
        resetTimer(currentSession, initialSettings); // Pass new settings directly to resetTimer
      }
    }
    // This effect depends on initialSettings from props, and several pieces of internal state
    // to decide if/how to react. Adding them to dependencies ensures correctness.
    // resetTimer is a useCallback, so its identity is stable unless its own dependencies change.
  }, [initialSettings, settings, isActive, currentSession, resetTimer, POMODORO_STORAGE_KEY]);

  const getSessionName = useCallback(() => {
    switch (currentSession) {
      case SESSIONS.WORK:
        return 'Work';
      case SESSIONS.SHORT_BREAK:
        return 'Short Break';
      case SESSIONS.LONG_BREAK:
        return 'Long Break';
      default:
        return 'Pomodoro';
    }
  }, [currentSession]);

  // Effect to handle the timer countdown
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer reached zero
            console.log('[PomodoroTimer.js] Session ended. Playing sound.');
            audio.play().catch(error => console.error("Error playing sound:", error));
            
            const justCompletedSession = currentSession;
            let newCycles = cycles;
            if (justCompletedSession === SESSIONS.WORK) {
              newCycles = cycles + 1;
              setCycles(newCycles);
            }

            if (onSessionComplete) onSessionComplete(justCompletedSession, focusedTodo);

            let nextSession;
            if (justCompletedSession === SESSIONS.WORK) {
              if (newCycles % settings.cyclesBeforeLongBreak === 0) {
                nextSession = SESSIONS.LONG_BREAK;
              } else {
                nextSession = SESSIONS.SHORT_BREAK;
              }
            } else { // Short or Long Break ended
              nextSession = SESSIONS.WORK;
            }
            resetTimer(nextSession);
            // setIsActive(true); // Optionally auto-start next session, for now user starts manually
          } else {
            setMinutes(prevMinutes => prevMinutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(prevSeconds => prevSeconds - 1);
        }
      }, 1000);
    } else if (isActive && minutes === 0 && seconds === 0) {
      // This case handles when timer reaches 0:00 and needs to transition
      // The logic above inside setInterval already handles this, but as a safeguard:
      setIsActive(false); // Stop the timer
      // Session completion logic is handled when minutes/seconds become 0 in interval
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, currentSession, cycles, settings, resetTimer, onSessionComplete, focusedTodo, audio]); 

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const skipSession = (skippedFromSettings = false) => {
    if (onSessionComplete) onSessionComplete(currentSession, focusedTodo, true); // Mark as skipped

    let nextSession;
    let newCycles = cycles;
    if (currentSession === SESSIONS.WORK) {
      newCycles = cycles + 1; // Increment cycle even if work session is skipped
      setCycles(newCycles);
      if (newCycles % settings.cyclesBeforeLongBreak === 0) {
        nextSession = SESSIONS.LONG_BREAK;
      } else {
        nextSession = SESSIONS.SHORT_BREAK;
      }
    } else {
        nextSession = SESSIONS.WORK;
    }
    resetTimer(nextSession, skippedFromSettings ? tempSettings : settings);
  };

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    onSettingsChange(newSettings); // Notify App.js
    setShowSettingsModal(false);
    // If timer is not active, update its display to new settings
    if (!isActive) {
      resetTimer(currentSession, newSettings);
    }
  };
  
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const cancelSettings = () => {
    setTempSettings(settings); 
    setShowSettingsModal(false);
  }

  useEffect(() => {
    const savedState = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.isActive && state.timestamp) {
        const timeElapsedMs = Date.now() - state.timestamp;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        let totalRemainingSeconds = (state.minutes * 60) + state.seconds - timeElapsedSeconds;

        if (totalRemainingSeconds <= 0) {
          // Timer finished while page was closed. Handle session completion.
          // This is a simplified version. A more robust solution would involve
          // re-running the session completion logic based on how many sessions might have passed.
          // For now, we'll just reset to the next session or initial state.
          // TODO: Implement more robust offline completion handling
          console.log("Timer expired while closed. Moving to next phase.");
          // Resetting or moving to next phase logic would go here
          // For simplicity, let's assume we just clear the saved state or reset the timer
          // This part needs careful consideration based on desired behavior
          localStorage.removeItem(POMODORO_STORAGE_KEY); 
          // Re-initialize or move to next session logic might be needed here
          // For now, let it re-initialize with default settings for the next session
        } else {
          // Restore timer to its state when it was last active
          setMinutes(Math.floor(totalRemainingSeconds / 60));
          setSeconds(totalRemainingSeconds % 60);
          setIsActive(true); // Resume the timer
          // No need to set currentSession, sessionCount, etc. here as they should be in savedState
          // if they were part of what's saved. Assuming they are part of 'state' if needed.
        }
      } else if (state.timestamp) { // Timer was paused but state was saved
        setMinutes(state.minutes);
        setSeconds(state.seconds);
        // currentSession, sessionCount etc. should also be restored if saved
      }
      // Restore other relevant state like currentSession, cycles if they are saved
      if (state.currentSession) setCurrentSession(state.currentSession);
      if (state.cycles) setCycles(state.cycles);
      // Restore settings if they are part of the saved pomodoro state
      if (state.settings) {
        setSettings(state.settings);
        // Update timer display based on restored settings if not active
        if (!state.isActive) {
          setMinutes(state.settings[state.currentSession]);
          setSeconds(0);
        }
      }
    }
  }, [POMODORO_STORAGE_KEY]); // Added POMODORO_STORAGE_KEY to dependency array

  if (isMinimized) {
    return (
      <div className="pomodoro-timer minimized">
        <div className="minimized-content">
          <span className="minimized-session">{getSessionName()}</span>
          <span className="minimized-time">{`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}</span>
          {focusedTodo && <span className="minimized-task">Task: {focusedTodo.text}</span>}
        </div>
        <button onClick={toggleMinimize} className="pomodoro-control-btn icon-btn" title="Maximize">
          <FaExpandAlt />
        </button>
      </div>
    );
  }

  if (showSettingsModal) {
    return (
      <div className="pomodoro-timer-overlay settings-active">
        <div className={`pomodoro-timer pomodoro-settings-modal`}>
          <h3>Pomodoro Settings</h3>
          <div className="setting-field">
            <label htmlFor="workDuration">Work Duration (min):</label>
            <input type="number" id="workDuration" name="workDuration" value={tempSettings.workDuration} onChange={(e) => handleSettingChange(e)} min="1" />
          </div>
          <div className="setting-field">
            <label htmlFor="shortBreakDuration">Short Break (min):</label>
            <input type="number" id="shortBreakDuration" name="shortBreakDuration" value={tempSettings.shortBreakDuration} onChange={(e) => handleSettingChange(e)} min="1" />
          </div>
          <div className="setting-field">
            <label htmlFor="longBreakDuration">Long Break (min):</label>
            <input type="number" id="longBreakDuration" name="longBreakDuration" value={tempSettings.longBreakDuration} onChange={(e) => handleSettingChange(e)} min="1" />
          </div>
          <div className="setting-field">
            <label htmlFor="cyclesBeforeLongBreak">Cycles before Long Break:</label>
            <input type="number" id="cyclesBeforeLongBreak" name="cyclesBeforeLongBreak" value={tempSettings.cyclesBeforeLongBreak} onChange={(e) => handleSettingChange(e)} min="1" />
          </div>
          <div className="settings-actions">
            <button onClick={() => handleSettingsSave(tempSettings)} className="control-btn save-settings-btn"><FaSave /> Save</button>
            <button onClick={() => cancelSettings()} className="control-btn cancel-settings-btn"><FaTimes /> Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={`pomodoro-timer-overlay ${showSettingsModal ? 'settings-open' : ''}`}>
      <div className={`pomodoro-timer ${currentSession.toLowerCase().replace('_', '')}`}>
        <div className="pomodoro-header">
          <h2>{getSessionName()}</h2>
          <div className="pomodoro-header-controls">
            <button onClick={toggleMinimize} className="pomodoro-control-btn icon-btn" title="Minimize">
              <FaMinus />
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="pomodoro-control-btn icon-btn" title="Settings">
              <FaCog />
            </button>
            <button 
              onClick={() => {
                if(onClose) onClose(); 
              }}
              className="pomodoro-close-btn"
              title="Close Timer"
            >
              &times;
            </button>
          </div>
        </div>

        {focusedTodo && (
          <div className="focused-todo-display">
            Focusing on: <strong>{focusedTodo.text}</strong>
          </div>
        )}

        <div className="timer-display">{formattedTime}</div>

        <div className="timer-controls">
          <button onClick={toggleTimer} className={`control-btn ${isActive ? 'pause-btn' : 'play-btn'}`}>
            {isActive ? <FaPause /> : <FaPlay />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={() => resetTimer(currentSession)} className="control-btn reset-btn" disabled={isActive && (minutes === settings[currentSession+"Duration"] && seconds === 0)}>
            <FaRedo /> Reset
          </button>
           <button onClick={skipSession} className="control-btn skip-btn" title="Skip to next session">
            <FaForward /> Skip
          </button>
        </div>
        <p className="cycles-info">Cycles completed: {cycles}</p>
      </div>
    </div>
  );
};

export default PomodoroTimer;