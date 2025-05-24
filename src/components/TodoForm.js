import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TodoForm = ({ addTodo, editingTodo, setEditingTodo }) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tagsString, setTagsString] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recurrence, setRecurrence] = useState({ type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null });
  const [reminder, setReminder] = useState({
    enabled: false,
    type: 'relative', // 'relative' or 'absolute'
    offsetValue: 1,
    offsetUnit: 'hours', // 'minutes', 'hours', 'days'
    absoluteTime: '09:00'
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (editingTodo) {
      setText(editingTodo.text || '');
      setDueDate(editingTodo.dueDate || '');
      setPriority(editingTodo.priority || 'Medium');
      setTagsString(editingTodo.tags ? editingTodo.tags.join(', ') : '');
      const initialRecurrence = editingTodo.recurrence || { type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null };
      setRecurrence(initialRecurrence);
      const initialReminder = editingTodo.reminder || { enabled: false, type: 'relative', offsetValue: 1, offsetUnit: 'hours', absoluteTime: '09:00' };
      setReminder(initialReminder);
      setShowAdvanced(
        !!(editingTodo.dueDate || 
           editingTodo.priority !== 'Medium' || 
           (editingTodo.tags && editingTodo.tags.length > 0) || 
           initialRecurrence.type !== 'none' ||
           initialReminder.enabled
          )
      );
    } else {
      setText('');
      setDueDate('');
      setPriority('Medium');
      setTagsString('');
      setRecurrence({ type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null });
      setReminder({ enabled: false, type: 'relative', offsetValue: 1, offsetUnit: 'hours', absoluteTime: '09:00' });
      setShowAdvanced(false);
    }
  }, [editingTodo]);

  const handleReminderChange = (field, value) => {
    setReminder(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // Ensure reminder object is consistent before submitting
    const finalReminder = reminder.enabled ? reminder : { enabled: false };
    addTodo(text, dueDate, priority, tagsString, recurrence, finalReminder); // Pass reminder
    if (!editingTodo) { // Only focus if not editing, as editing might close a modal
      inputRef.current.focus();
    }
    setText('');
    setDueDate('');
    setPriority('Medium');
    setTagsString('');
    setShowAdvanced(false);
    setRecurrence({ type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null });
    setReminder({ enabled: false, type: 'relative', offsetValue: 1, offsetUnit: 'hours', absoluteTime: '09:00' });
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setText('');
    setDueDate('');
    setPriority('Medium');
    setTagsString('');
    setShowAdvanced(false);
    setRecurrence({ type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null });
    setReminder({ enabled: false, type: 'relative', offsetValue: 1, offsetUnit: 'hours', absoluteTime: '09:00' });
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input 
        type="text" 
        placeholder={editingTodo ? "Update your todo" : "Add a new todo..."} 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        ref={inputRef}
      />
      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-options-btn">
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>

      {showAdvanced && (
        <AnimatePresence>
          <motion.div 
            className="advanced-fields"
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="form-group">
              <label htmlFor="due-date">Due Date:</label>
              <input 
                type="date" 
                id="due-date"
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                className="todo-input-date"
              />
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority:</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="todo-select-priority">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated):</label>
              <input 
                type="text" 
                id="tags"
                value={tagsString} 
                onChange={(e) => setTagsString(e.target.value)} 
                placeholder="e.g. work, personal"
                className="todo-input-tags"
              />
            </div>
            {/* Recurrence Options */}
            <div className="form-group recurrence-group">
              <label htmlFor="recurrence-type">Repeats:</label>
              <select 
                id="recurrence-type" 
                value={recurrence.type} 
                onChange={(e) => setRecurrence(prev => ({ ...prev, type: e.target.value, interval: 1, daysOfWeek: [], dayOfMonth: null }))}
                className="todo-select-recurrence-type"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              {recurrence.type !== 'none' && (
                <div className="recurrence-details">
                  <label htmlFor="recurrence-interval">Every:</label>
                  <input 
                    type="number" 
                    id="recurrence-interval"
                    min="1"
                    value={recurrence.interval}
                    onChange={(e) => setRecurrence(prev => ({ ...prev, interval: parseInt(e.target.value, 10) || 1 }))}
                    className="recurrence-input-interval"
                  />
                  <span>{recurrence.type === 'daily' ? 'day(s)' : recurrence.type === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                </div>
              )}

              {recurrence.type === 'weekly' && (
                <div className="recurrence-days-of-week">
                  <label>On:</label>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <label key={day} className="weekday-label">
                      <input 
                        type="checkbox" 
                        checked={recurrence.daysOfWeek.includes(index)}
                        onChange={(e) => {
                          const dayIndex = index;
                          setRecurrence(prev => ({
                            ...prev,
                            daysOfWeek: e.target.checked 
                              ? [...prev.daysOfWeek, dayIndex].sort((a,b) => a-b) 
                              : prev.daysOfWeek.filter(d => d !== dayIndex)
                          }));
                        }}
                      /> {day}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder Options */}
            <div className="form-group reminder-group">
              <label className="reminder-enable-label">
                <input 
                  type="checkbox" 
                  checked={reminder.enabled}
                  onChange={(e) => handleReminderChange('enabled', e.target.checked)}
                /> Enable Reminder
              </label>

              {reminder.enabled && (
                <AnimatePresence>
                  <motion.div 
                    className="reminder-details-form"
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="form-group">
                      <label htmlFor="reminder-type">Reminder Type:</label>
                      <select 
                        id="reminder-type" 
                        value={reminder.type} 
                        onChange={(e) => handleReminderChange('type', e.target.value)}
                        className="todo-select-reminder-type"
                      >
                        <option value="relative">Relative to Due Date</option>
                        <option value="absolute">On Due Date at Specific Time</option>
                      </select>
                    </div>

                    {reminder.type === 'relative' && (
                      <div className="relative-reminder-inputs">
                        <input 
                          type="number" 
                          min="1" 
                          value={reminder.offsetValue}
                          onChange={(e) => handleReminderChange('offsetValue', parseInt(e.target.value, 10) || 1)}
                          className="reminder-input-offset-value"
                        />
                        <select 
                          value={reminder.offsetUnit} 
                          onChange={(e) => handleReminderChange('offsetUnit', e.target.value)}
                          className="todo-select-reminder-offset-unit"
                        >
                          <option value="minutes">Minute(s) Before</option>
                          <option value="hours">Hour(s) Before</option>
                          <option value="days">Day(s) Before</option>
                        </select>
                      </div>
                    )}

                    {reminder.type === 'absolute' && (
                      <div className="absolute-reminder-inputs">
                        <label htmlFor="reminder-absolute-time">Time:</label>
                        <input 
                          type="time" 
                          id="reminder-absolute-time"
                          value={reminder.absoluteTime}
                          onChange={(e) => handleReminderChange('absoluteTime', e.target.value)}
                          className="reminder-input-absolute-time"
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <button type="submit" className="todo-button add-btn">
        {editingTodo ? 'Update Todo' : 'Add Todo'}
      </button>
      {editingTodo && (
        <button type="button" onClick={handleCancelEdit} className="cancel-edit-btn">
          Cancel
        </button>
      )}
    </form>
  );
};

export default TodoForm;
