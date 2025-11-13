import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Chat = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Listen for messages from server
    socket.on('chat message', (msg) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);

  const sendMessage = () => {
    if (!username || !message) return;

    const msgData = { username, message };
    socket.emit('chat message', msgData);
    setMessage('');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', fontFamily: 'Arial' }}>
      <h2>Real-Time Chat</h2>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <div
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          height: '300px',
          overflowY: 'scroll',
          marginBottom: '10px',
        }}
      >
        {chatHistory.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '80%', padding: '8px' }}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage} style={{ width: '18%', marginLeft: '2%', padding: '8px' }}>
        Send
      </button>
    </div>
  );
};

export default Chat;
