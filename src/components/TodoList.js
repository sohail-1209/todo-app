import React from 'react';

const TodoList = ({ todos, deleteTodo }) => (
  <ul>
    {todos.map((todo) => (
      <li key={todo.id}>
        {todo.text}
        <button onClick={() => deleteTodo(todo.id)}>Delete</button>
      </li>
    ))}
  </ul>
);

export default TodoList;
