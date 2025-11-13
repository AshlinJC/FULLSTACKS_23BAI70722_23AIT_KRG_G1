// frontend/src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Auth from './Auth';

const API = import.meta.env.VITE_API || 'http://localhost:4000';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [tasks, setTasks] = useState([]);
  const socketRef = useRef(null);
  const [timerTask, setTimerTask] = useState(null);
  const [seconds, setSeconds] = useState(0);

  // set Axios auth header when token present
  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  // Connect socket when token changes (user logs in). Clean up on logout.
  useEffect(() => {
    if (!token) return;
    const socket = io(API, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => console.log('socket connected', socket.id));
    socket.on('taskCreated', t => setTasks(prev => [...prev, t]));
    socket.on('taskUpdated', u => setTasks(prev => prev.map(t => t._id === u._id ? u : t)));
    socket.on('taskDeleted', id => setTasks(prev => prev.filter(t => t._id !== id)));
    socket.on('connect_error', err => console.error('socket error', err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    axios.get(API + '/api/tasks').then(res => setTasks(res.data)).catch(err => {
      console.error(err);
      if (err.response?.status === 401) {
        // token invalid -> logout
        handleLogout();
      }
    });
  }, [token]);

  // timer logic
  useEffect(() => {
    let interval;
    if (timerTask) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [timerTask]);

  if (!token) {
    return <Auth onToken={t => setToken(t)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTasks([]);
    if (socketRef.current) socketRef.current.disconnect();
  };

  const createTask = async () => {
    const title = prompt('Task title');
    if (!title) return;
    const res = await axios.post(API + '/api/tasks', { title, description: '' });
    // server emits event; optimistic push is optional
  };

  const moveTask = (id, status) => axios.put(API + '/api/tasks/' + id, { status });

  const startTimer = (taskId) => setTimerTask(taskId);
  const stopTimer = async (taskId) => {
    setTimerTask(null);
    const t = tasks.find(x => x._id === taskId);
    const newSeconds = (t?.timerSeconds || 0) + seconds;
    await axios.put(API + '/api/tasks/' + taskId, { timerSeconds: newSeconds });
    setSeconds(0);
  };

  const columns = ['pending', 'ongoing', 'completed'];

return (
  <>
    <header>
      <h1>Project Board</h1>
      <div>
        <button className="add-btn" onClick={createTask}>+ Add Task</button>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </header>

    <div className="container">
      <div className="board">
        {columns.map(col => (
          <div key={col} className="column">
            <h2>{col}</h2>
            {tasks.filter(t => t.status === col).map(t => (
              <div key={t._id} className="task-card">
                <div className="title">{t.title}</div>
                <div className="timer">⏱ {t.timerSeconds || 0} sec</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {columns.filter(c => c !== col).map(c => (
                    <button key={c} onClick={() => moveTask(t._id, c)}>{c}</button>
                  ))}
                  {timerTask === t._id ? (
                    <button onClick={() => stopTimer(t._id)}>Stop ({seconds}s)</button>
                  ) : (
                    <button onClick={() => startTimer(t._id)}>Start</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </>
);
}
