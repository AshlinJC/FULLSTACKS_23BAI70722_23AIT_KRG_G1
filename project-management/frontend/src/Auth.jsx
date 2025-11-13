// frontend/src/Auth.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API || 'http://localhost:4000';

export default function Auth({ onToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(API + endpoint, form);
      const token = res.data.token;
      localStorage.setItem('token', token);
      onToken(token);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="auth-box">
  <h2>{isLogin ? 'Login' : 'Register'}</h2>
  {error && <div className="error">{error}</div>}
  {!isLogin && <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />}
  <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
  <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
  <div className="auth-actions">
    <button onClick={handleSubmit}>{isLogin ? 'Login' : 'Register'}</button>
    <button onClick={() => setIsLogin(!isLogin)}>
      {isLogin ? 'Switch to Register' : 'Switch to Login'}
    </button>
  </div>
</div>

  );
}
