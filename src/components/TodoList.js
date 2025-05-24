import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaEdit, FaTrashAlt, FaSyncAlt, FaRegClock } from 'react-icons/fa';

const TodoList = ({ 
  todos, 
  deleteTodo, 
  toggleComplete, 
  handleEdit, 
  handleOnDragEnd, 
  addSubtask, 
  toggleSubtask, 
  deleteSubtask, 
  editSubtask,
  togglePomodoroMode
}) => {
  const [subtaskText, setSubtaskText] = useState('');

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="todos">
        {(provided) => (
          <motion.ul 
            className="todo-list" 
            layout 
            {...provided.droppableProps} 
            ref={provided.innerRef}
          >
            <AnimatePresence>
              {todos.map((todo, index) => (
                <Draggable key={todo.id.toString()} draggableId={todo.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <motion.li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layoutId={todo.id.toString()} 
                      className={`${todo.completed ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''} priority-${(todo.priority || 'medium').toLowerCase()}`}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <div className="todo-content-wrapper">
                        <div className="todo-main-content">
                          <div className="todo-checkbox">
                            <input 
                              type="checkbox" 
                              checked={todo.completed} 
                              onChange={() => toggleComplete(todo.id)} 
                              id={`checkbox-${todo.id}`}
                            />
                            <label htmlFor={`checkbox-${todo.id}`} className="sr-only">Complete {todo.text}</label>
                          </div>
                          <span className="todo-text">{todo.text}</span>
                        </div>
                        {todo.dueDate && (
                          <div className={`todo-due-date ${!todo.completed && new Date(todo.dueDate) < new Date().setHours(0,0,0,0) ? 'overdue' : ''}`}>
                            {todo.dueDate ? `Due: ${new Date(todo.dueDate).toLocaleDateString()}` : 'No due date'}
                          </div>
                        )}
                        {todo.priority && (
                          <div className={`todo-priority-display priority-text-${(todo.priority || 'medium').toLowerCase()}`}>
                            Priority: {todo.priority}
                          </div>
                        )}
                        {todo.recurrence && todo.recurrence.type !== 'none' && (
                          <div className="todo-recurrence-display">
                            <FaSyncAlt size={12} style={{ marginRight: '5px' }} /> 
                            Repeats {todo.recurrence.type}
                            {todo.recurrence.interval > 1 ? ` every ${todo.recurrence.interval}` : ''}
                            {todo.recurrence.type === 'weekly' && todo.recurrence.daysOfWeek && todo.recurrence.daysOfWeek.length > 0 && todo.recurrence.daysOfWeek.length < 7 && (
                              <span> on {todo.recurrence.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</span>
                            )}
                          </div>
                        )}
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="todo-tags-container">
                            {todo.tags.map((tag, index) => (
                              <span key={index} className="todo-tag-item">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="todo-actions">
                        <button onClick={() => handleEdit(todo)} className="action-btn edit-btn" title="Edit Todo"><FaEdit /></button>
                        <button onClick={() => deleteTodo(todo.id)} className="action-btn delete-btn" title="Delete Todo"><FaTrashAlt /></button>
                        <button onClick={() => togglePomodoroMode(todo)} className="action-btn focus-btn" title="Focus on this task">
                          <FaRegClock />
                        </button>
                      </div>
                      {/* Subtasks Section */}
                      <div className="subtasks-section">
                        <AnimatePresence>
                          {todo.subtasks && todo.subtasks.map(subtask => (
                            <motion.div 
                              key={subtask.id}
                              variants={itemVariants} 
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                              className={`subtask-item ${subtask.completed ? 'completed' : ''}`}
                            >
                              <input 
                                type="checkbox" 
                                checked={subtask.completed} 
                                onChange={() => toggleSubtask(todo.id, subtask.id)} 
                                id={`subtask-checkbox-${subtask.id}`}
                              />
                              <label htmlFor={`subtask-checkbox-${subtask.id}`} className="subtask-text">{subtask.text}</label>
                              <div className="subtask-actions">
                                <button onClick={() => {
                                  const newText = prompt('Edit subtask:', subtask.text);
                                  if (newText !== null && newText.trim() !== '') {
                                    editSubtask(todo.id, subtask.id, newText);
                                  }
                                }} className="edit-subtask-btn">
                                  <FaEdit size={12} />
                                </button>
                                <button onClick={() => deleteSubtask(todo.id, subtask.id)} className="delete-subtask-btn">
                                  <FaTrashAlt size={12} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <form className="add-subtask-form" onSubmit={(e) => {
                          e.preventDefault();
                          if (subtaskText.trim() !== '') {
                            addSubtask(todo.id, subtaskText);
                            setSubtaskText(''); // Clear input after adding
                          }
                        }}>
                          <input 
                            type="text" 
                            value={subtaskText} 
                            onChange={(e) => setSubtaskText(e.target.value)} 
                            placeholder="Add a subtask..." 
                            className="subtask-input"
                          />
                          <button type="submit" className="add-subtask-btn">Add</button>
                        </form>
                      </div>
                    </motion.li>
                  )}
                </Draggable>
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </motion.ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default TodoList;
