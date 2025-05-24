import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import PomodoroTimer from './components/PomodoroTimer';
import Login from './components/Login';
import Register from './components/Register';
import FilterBar from './components/FilterBar'; // Assuming you have a FilterBar component, e.g., in './components/FilterBar.js'
import { FaMoon } from "react-icons/fa"; 
import { BsSun } from "react-icons/bs";   
import './App.css';

// Use Render backend URL in production, localhost in development
const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : 'https://todo-app-backend-1234.onrender.com/api';

const App = () => {
  const [todos, setTodos] = useState([]); 
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); 
  const [filter, setFilter] = useState('all'); 
  const [editingTodo, setEditingTodo] = useState(null); 
  const [sortBy, setSortBy] = useState(() => { 
    const savedSortBy = localStorage.getItem('sortBy'); 
    const validSortOptions = [ 
      'createdAt-desc', 'createdAt-asc', 
      'text-asc', 'text-desc',  
      'completed-desc', 'completed-asc', 
      'dueDate-asc', 'dueDate-desc', 
      'priority-asc', 'priority-desc' 
    ]; 
    return validSortOptions.includes(savedSortBy) ? savedSortBy : 'createdAt-desc'; 
  });  
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Add system preference detection later if desired
    return savedTheme || 'light'; 
  });
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Pomodoro State
  const [isPomodoroVisible, setIsPomodoroVisible] = useState(false); 
  const [pomodoroFocusedTodo, setPomodoroFocusedTodo] = useState(null); 
  const [pomodoroSettings, setPomodoroSettings] = useState(() => { 
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      workDuration: 25 * 60, // 25 minutes
      shortBreakDuration: 5 * 60, // 5 minutes
      longBreakDuration: 15 * 60, // 15 minutes
      sessionsBeforeLongBreak: 4,
      autoStartBreaks: true,
      autoStartWork: true,
    };
  });

  // Effect to save Pomodoro settings to localStorage 
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings]);

  // When Pomodoro modal is closed, clear the focused todo
  useEffect(() => {
    if (!isPomodoroVisible) {
      setPomodoroFocusedTodo(null); 
    }
  }, [isPomodoroVisible, setPomodoroFocusedTodo]); 

  // Effect to handle initial user loading from token (if any) and API validation
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token with backend and fetch user details
      const fetchUser = async () => {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData); // Set user state
          } else {
            // Token is invalid or expired
            localStorage.removeItem('token');
            setToken('');
            setUser(null);
            // Optionally, redirect to login or show a message
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      };
      fetchUser();
    } else {
      // No token found, ensure user is null
      setUser(null);
    }
  }, []); // Run once on component mount

  // Effect to save token to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  // Fetch todos from API on mount and when token changes
  useEffect(() => {
    const fetchTodos = async () => {
      if (!token) {
        setTodos([]); // Clear todos if no token
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/todos`, { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setTodos(data);
        } else {
          console.error('Failed to fetch todos');
          setTodos([]); // Set to empty array on failure
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        setTodos([]); // Set to empty array on error
      }
    };
    fetchTodos();
  }, [token]); // Re-fetch if token changes (e.g., after login/logout)

  const handleLogin = (token, username) => {
    const userData = { 
      username,
      id: Date.now().toString() // Ensure user has an ID
    };
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear any todos from localStorage on logout
    localStorage.removeItem('todos');
  };

  const switchToRegister = () => setAuthMode('register');
  const switchToLogin = () => setAuthMode('login');

  const handleClosePomodoro = useCallback(() => {
    console.log('[App.js] handleClosePomodoro called. Setting isPomodoroVisible to false.');
    setIsPomodoroVisible(false); 
  }, [setIsPomodoroVisible]); 

  const toggleComplete = async (id) => {
    if (!token) return;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const updatedTodo = { ...todo, completed: !todo.completed };
    // No API call for toggleComplete, handled by updateTodo if needed for backend sync
    setTodos(todos.map(t => (t.id === id ? updatedTodo : t)));
  };

  // Todo CRUD handlers (API)
  const addTodo = async (text, dueDate, priority, tagsString, recurrence, reminder) => {
    if (!token) return;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
    const todoData = {
      text,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      tags,
      recurrence: recurrence || { type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null },
      reminder: reminder,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };
    const res = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(todoData)
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos([newTodo, ...todos]);
    }
  };

  const deleteTodo = async (id) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setTodos(todos => todos.filter(t => t.id !== id));
    }
  };

  // Derive actual sort criterion and order from the combined sortBy state
  const [, ] = useMemo(() => { 
    if (sortBy.includes('-')) {
      const parts = sortBy.split('-');
      return [parts[0], parts[1]]; // e.g., "createdAt-desc" -> ["createdAt", "desc"]
    }
    // Fallback for older stored values or if format is unexpected (should ideally not happen with validation above)
    return [sortBy, 'desc']; // Default to 'desc' if no order specified
  }, [sortBy]);

  // Helper functions for date comparisons
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday as first day
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  const isOverdue = (dateString, completed) => {
    if (!dateString || completed) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare with the beginning of today
    return date < today;
  };

  // Apply theme class to body and save to localStorage
  useEffect(() => {
    document.body.className = theme + '-theme'; // e.g., 'light-theme' or 'dark-theme'
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save sort preferences to localStorage 
  useEffect(() => {
    localStorage.setItem('sortBy', sortBy); // Only sortBy needs to be saved now
  }, [sortBy]); 

  // Load todos from localStorage on initial render
  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      // Ensure all loaded todos have a createdAt if they are old data
      const parsedTodos = JSON.parse(storedTodos).map(todo => ({
        ...todo,
        createdAt: todo.createdAt || new Date(0).toISOString(),
        dueDate: todo.dueDate || null, // Ensure dueDate exists
        priority: todo.priority || 'Medium', // Ensure priority exists, default to Medium
        subtasks: todo.subtasks || [], // Ensure subtasks array exists
        tags: todo.tags || [], // Ensure tags array exists
        recurrence: todo.recurrence || { type: 'none', interval: 1, daysOfWeek: [], dayOfMonth: null }, // Ensure recurrence exists
        reminder: todo.reminder || { enabled: false, type: 'relative', offsetValue: 1, offsetUnit: 'hours', absoluteTime: '09:00' }, // Ensure reminder exists
        lastReminderFiredAt: todo.lastReminderFiredAt || null // Ensure lastReminderFiredAt exists
      }));
      setTodos(parsedTodos);
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todos.length > 0 || localStorage.getItem('todos')) { 
        localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]); 

  // Generate unique tags for filter dropdown
  const uniqueTags = useMemo(() => {
    const allTags = todos.reduce((acc, todo) => { 
      if (todo.tags) {
        todo.tags.forEach(tag => {
          if (!acc.includes(tag)) {
            acc.push(tag);
          }
        });
      }
      return acc;
    }, []);
    return ['', ...Array.from(new Set(allTags)).sort()]; // Add an empty string for 'All Tags'
  }, [todos]); 

  // Apply filtering
  const filteredTodos = useMemo(() => {
    let todosToFilter = [...todos]; 

    // Filter by search term (text and tags)
    if (searchTerm) { 
      const lowerSearchTerm = searchTerm.toLowerCase(); 
      todosToFilter = todosToFilter.filter(todo => 
        todo.text.toLowerCase().includes(lowerSearchTerm) || 
        (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) 
      ); 
    }

    // Filter by selected tag
    if (selectedTagFilter) {
      todosToFilter = todosToFilter.filter(todo => todo.tags && todo.tags.includes(selectedTagFilter));
    }

    // Filter by date 
    if (dateFilter === 'today') { 
      todosToFilter = todosToFilter.filter(todo => isToday(todo.dueDate)); 
    } else if (dateFilter === 'thisWeek') { 
      todosToFilter = todosToFilter.filter(todo => isThisWeek(todo.dueDate)); 
    } else if (dateFilter === 'overdue') { 
      todosToFilter = todosToFilter.filter(todo => isOverdue(todo.dueDate, todo.completed)); 
    }

    // Filter by completion status (all, active, completed) 
    if (filter === 'active') { 
      return todosToFilter.filter(todo => !todo.completed); 
    } else if (filter === 'completed') { 
      return todosToFilter.filter(todo => todo.completed); 
    }
    return todosToFilter; // 'all' or if no other filter applied to this stage
  }, [todos, filter, searchTerm, selectedTagFilter, dateFilter]); 

  const sortedTodos = useMemo(() => {
    const [actualSortCriterion, actualSortOrder] = sortBy.split('-'); 

    return [...filteredTodos].sort((a, b) => { 
      let valA = a[actualSortCriterion]; 
      let valB = b[actualSortCriterion]; 

      // Handle specific sorting logic for different types 
      if (actualSortCriterion === 'completed') { 
        valA = a.completed ? 1 : 0; 
        valB = b.completed ? 1 : 0; 
      } else if (actualSortCriterion === 'dueDate') { 
        // Handle null or undefined dueDates by pushing them to the end or beginning based on order 
        if (!valA) return actualSortOrder === 'asc' ? 1 : -1; 
        if (!valB) return actualSortOrder === 'asc' ? -1 : 1; 
        valA = new Date(valA).getTime(); 
        valB = new Date(valB).getTime(); 
      } else if (actualSortCriterion === 'priority') { 
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }; 
        valA = priorityOrder[a.priority] || 0; 
        valB = priorityOrder[b.priority] || 0; 
      } else if (actualSortCriterion === 'createdAt') { 
        valA = new Date(a.createdAt).getTime(); 
        valB = new Date(b.createdAt).getTime(); 
      } else if (typeof valA === 'string' && typeof valB === 'string') { 
        valA = valA.toLowerCase(); 
        valB = valB.toLowerCase(); 
      }

      if (valA < valB) return actualSortOrder === 'asc' ? -1 : 1; 
      if (valA > valB) return actualSortOrder === 'asc' ? 1 : -1; 
      return 0; 
    }); 
  }, [sortBy, filteredTodos]); 

  const advanceSingleRecurrenceStep = (baseDate, recRule) => {
    let nextStepDate = new Date(baseDate);
    const stepInterval = recRule.interval || 1;

    switch (recRule.type) {
      case 'daily':
        nextStepDate.setDate(nextStepDate.getDate() + stepInterval);
        break;
      case 'weekly':
        if (recRule.daysOfWeek && recRule.daysOfWeek.length > 0) {
          // Advance by full weeks for the interval first, if interval > 1
          if (stepInterval > 1) {
            nextStepDate.setDate(nextStepDate.getDate() + (stepInterval - 1) * 7);
          }
          // Then find the next valid day of the week
          // Start searching from the day *after* the (potentially interval-advanced) baseDate
          let searchStartDate = new Date(nextStepDate);
          searchStartDate.setDate(searchStartDate.getDate() + 1); // Start search from next day

          let found = false;
          for (let i = 0; i < 7; i++) { // Check the next 7 days
            let checkDate = new Date(searchStartDate);
            checkDate.setDate(searchStartDate.getDate() + i);
            if (recRule.daysOfWeek.includes(checkDate.getDay())) {
              nextStepDate = checkDate;
              found = true;
              break;
            }
          }
          if (!found) { // If no day found in the next 7 days (e.g. interval made it jump past all valid days in current week)
             // This case needs robust handling, for now, advance by a week and pick first available day
             nextStepDate.setDate(nextStepDate.getDate() + 7); // Advance a week
             for (let i = 0; i < 7; i++) { 
                let checkDate = new Date(nextStepDate);
                checkDate.setDate(nextStepDate.getDate() + i);
                if (recRule.daysOfWeek.includes(checkDate.getDay())) {
                    nextStepDate = checkDate; break;
                }
             }
          }
        } else { // weekly without specific days, advance by 7 * interval
          nextStepDate.setDate(nextStepDate.getDate() + (7 * stepInterval));
        }
        break;
      case 'monthly':
        const originalDate = baseDate.getDate();
        nextStepDate.setMonth(nextStepDate.getMonth() + stepInterval);
        if (nextStepDate.getDate() !== originalDate) {
          nextStepDate.setDate(0); 
        }
        break;
      case 'yearly':
        const originalYearDate = baseDate.getDate();
        const originalYearMonth = baseDate.getMonth();
        nextStepDate.setFullYear(nextStepDate.getFullYear() + stepInterval);
        if (nextStepDate.getMonth() !== originalYearMonth || nextStepDate.getDate() !== originalYearDate) {
            nextStepDate.setMonth(originalYearMonth + 1, 0); 
        }
        break;
      default:
        return null; 
    }
    return nextStepDate;
  };

  const calculateNextDueDate = (currentDueDateString, recurrence) => {
    if (!recurrence || recurrence.type === 'none') {
      return null;
    }
    let lastKnownDueDate = currentDueDateString ? new Date(currentDueDateString) : new Date();
    lastKnownDueDate.setHours(0, 0, 0, 0); 

    let nextCalculatedDueDate = advanceSingleRecurrenceStep(new Date(lastKnownDueDate), recurrence);
    if (!nextCalculatedDueDate) return null; 
    return nextCalculatedDueDate.toISOString();
  };

  const updateTodo = async (id, updates) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === id) {
          const originalTodo = todo;
          const updatedTodo = { ...todo, ...updates };

          // If a recurring task is completed, calculate its next due date
          if (updates.completed && !originalTodo.completed && originalTodo.recurrence && originalTodo.recurrence.type !== 'none' && originalTodo.dueDate) {
            const nextDueDate = calculateNextDueDate(originalTodo.dueDate, originalTodo.recurrence);
            if (nextDueDate) {
              updatedTodo.dueDate = nextDueDate;
              updatedTodo.completed = false; // Reset completion for the new recurring instance
            }
          }
          return updatedTodo;
        }
        return todo;
      })
    );
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Notification Logic
  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      } else {
        console.log('Notification permission denied.');
      }
    });
  };

  const showNotification = useCallback((title, body, todoId) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/logo192.png',
      });
    } else if (notificationPermission === 'default') {
      console.log('Notification permission not yet granted. Please allow notifications.');
      requestNotificationPermission(); 
    } else {
      console.log('Cannot show notification, permission denied.');
    }
  }, [notificationPermission]);

  // Reminder Checking Logic
  const checkReminders = useCallback(() => {
    const now = new Date();
    todos.forEach(todo => {
      if (todo.completed || !todo.reminder || !todo.reminder.enabled || !todo.dueDate) {
        return;
      }
      let reminderDateTime;
      const dueDateTime = new Date(todo.dueDate);
      if (todo.reminder.type === 'relative') {
        reminderDateTime = new Date(dueDateTime);
        const offset = parseInt(todo.reminder.offsetValue, 10);
        switch (todo.reminder.offsetUnit) {
          case 'minutes': reminderDateTime.setMinutes(reminderDateTime.getMinutes() - offset); break;
          case 'hours': reminderDateTime.setHours(reminderDateTime.getHours() - offset); break;
          case 'days': reminderDateTime.setDate(reminderDateTime.getDate() - offset); break;
          default: return; 
        }
      } else if (todo.reminder.type === 'absolute') {
        reminderDateTime = new Date(dueDateTime);
        const [hours, minutes] = todo.reminder.absoluteTime.split(':').map(Number);
        reminderDateTime.setHours(hours, minutes, 0, 0); 
      } else {
        return; 
      }
      if (reminderDateTime <= now) {
        const reminderInstanceId = reminderDateTime.toISOString();
        if (todo.lastReminderFiredAt !== reminderInstanceId) {
          showNotification(`${todo.text}`, `Due: ${new Date(todo.dueDate).toLocaleString()}`, todo.id);
          setTodos(prevTodos => prevTodos.map(t => 
            t.id === todo.id ? { ...t, lastReminderFiredAt: reminderInstanceId } : t
          ));
        }
      }
    });
  }, [todos, showNotification, setTodos]); 

  useEffect(() => {
    requestNotificationPermission();
    const intervalId = setInterval(checkReminders, 60000); 
    return () => clearInterval(intervalId); 
  }, [checkReminders]); 

  // -- Pomodoro Control Functions --
  const togglePomodoroMode = (todoToFocus = null) => {
    console.log('[App.js] Toggling Pomodoro mode. Current visibility:', isPomodoroVisible, 'Todo to focus:', todoToFocus);
    setPomodoroFocusedTodo(todoToFocus); 
    setIsPomodoroVisible(prev => !prev); 
  };

  const handlePomodoroSessionComplete = (sessionType, focusedTodo, skipped = false) => {
    console.log(`Pomodoro session ${sessionType} ${skipped ? 'skipped' : 'completed'} for:`, focusedTodo?.text);
    showNotification(
      `Session ${skipped ? 'Skipped' : 'Complete'}: ${sessionType.replace(/([A-Z])/g, ' $1').trim()}`,
      focusedTodo ? `${skipped ? 'Skipped' : 'Finished'} focusing on: ${focusedTodo.text}` : "Time for the next phase!",
      focusedTodo?.id
    );
  };

  const handlePomodoroSettingsChange = (newSettings) => { 
    setPomodoroSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  // -- Subtask Functions --
  const addSubtask = (parentId, text) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === parentId) {
        const newSubtask = {
          id: Math.random().toString(36).substr(2, 9), // Generate a random ID
          text,
          completed: false
        };
        return { ...todo, subtasks: [...todo.subtasks, newSubtask] };
      }
      return todo;
    }));
  };

  const toggleSubtask = (parentId, subtaskId) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(subtask => 
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          )
        };
      }
      return todo;
    }));
  };

  const deleteSubtask = (parentId, subtaskId) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === parentId) {
        return { ...todo, subtasks: todo.subtasks.filter(subtask => subtask.id !== subtaskId) };
      }
      return todo;
    }));
  };

  const editSubtask = (parentId, subtaskId, newText) => {
    setTodos(prevTodos => prevTodos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(subtask => 
            subtask.id === subtaskId ? { ...subtask, text: newText } : subtask
          )
        };
      }
      return todo;
    }));
  };

  const remaining = useMemo(() => filteredTodos.filter(todo => !todo.completed).length, [filteredTodos]);

  const handleOnDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const items = Array.from(sortedTodos); 
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    setTodos(items.map((todo, index) => ({ ...todo, order: index })));
    // If you were sorting by 'order' or a manual sort, this is fine.
    // If sorting by other criteria, drag-and-drop might conflict with active sort.
    // Consider disabling drag-and-drop or resetting sort when manual reorder happens.
  };

  // Auth screens
  if (!user || !token) {
    return authMode === 'register' ? (
      <Register onRegister={handleLogin} switchToLogin={switchToLogin} />
    ) : (
      <Login onLogin={handleLogin} switchToRegister={switchToRegister} />
    );
  }

  return (
    <div className={`App ${theme}`}>
      <div className="app-header" style={{borderRadius: '50px', padding: '10px'}}>
        <h1>Todo App</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-profile">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.username} 
                className="profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                }}
              />
            ) : (
              <div className="profile-initial">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="user-badge">{user?.username || 'User'}</span>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? <FaMoon /> : <BsSun />}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      {isPomodoroVisible && ( 
        <PomodoroTimer
          focusedTodo={pomodoroFocusedTodo} 
          onSessionComplete={handlePomodoroSessionComplete}
          onClose={handleClosePomodoro}
          initialSettings={pomodoroSettings} 
          onSettingsChange={handlePomodoroSettingsChange} 
        />
      )}
      <div className="todo-container">
        <FilterBar 
          currentFilter={filter} 
          onFilterChange={setFilter} 
          currentSortBy={sortBy} 
          onSortByChange={setSortBy} 
          uniqueTags={uniqueTags} 
          selectedTagFilter={selectedTagFilter} 
          onTagFilterChange={setSelectedTagFilter} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          currentDateFilter={dateFilter} 
          onDateFilterChange={setDateFilter} 
        />
        <p>Remaining todos: {remaining}</p>
        <TodoForm
          addTodo={addTodo}
          editingTodo={editingTodo} 
          setEditingTodo={setEditingTodo} 
        />
        <TodoList
          todos={sortedTodos} 
          deleteTodo={deleteTodo} 
          toggleComplete={toggleComplete}
          handleEdit={updateTodo} 
          handleOnDragEnd={handleOnDragEnd}
          addSubtask={addSubtask}
          toggleSubtask={toggleSubtask}
          deleteSubtask={deleteSubtask}
          editSubtask={editSubtask}
          togglePomodoroMode={togglePomodoroMode}
        />
      </div> 
    </div>  
  
  );
};

export default App;
