import fs from 'fs/promises';

const TODOS_FILE = './todos.json';

export async function getTodosForUser(username) {
  try {
    const data = await fs.readFile(TODOS_FILE, 'utf-8');
    const todos = JSON.parse(data);
    return todos.filter(todo => todo.username === username);
  } catch {
    return [];
  }
}

export async function addTodoForUser(username, todo) {
  const todos = await getAllTodos();
  const newTodo = { ...todo, username };
  todos.push(newTodo);
  await saveTodos(todos);
  return newTodo;
}

export async function updateTodoForUser(username, id, updates) {
  const todos = await getAllTodos();
  const idx = todos.findIndex(todo => todo.id === id && todo.username === username);
  if (idx === -1) throw new Error('Todo not found');
  todos[idx] = { ...todos[idx], ...updates };
  await saveTodos(todos);
  return todos[idx];
}

export async function deleteTodoForUser(username, id) {
  const todos = await getAllTodos();
  const filtered = todos.filter(todo => !(todo.id === id && todo.username === username));
  await saveTodos(filtered);
}

async function getAllTodos() {
  try {
    const data = await fs.readFile(TODOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTodos(todos) {
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
}
