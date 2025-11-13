const express = require('express');
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
//logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
//authentication middleware
function authMiddleware(req, res, next) {
	  const token = req.headers['authorization'];
	  if (token === 'mysecrettoken') {
	    next();
	  } else {
	    res.status(403).json({ message: 'Forbidden' });
	  }
	}

//router level middleware
const router = express.Router();

router.use((req, res, next) => {
  console.log('Admin router middleware executed');
  next();
});

router.get('/dashboard', (req, res) => {
  res.send('Admin dashboard');
});

app.use('/admin',authMiddleware, router);


let users = [];

// Create a user (POST /users)
app.post('/users', (req, res) => {
  const user = req.body;
  users.push(user);
  res.status(201).json({ message: 'User added', user });
});

// Get all users (GET /users)
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// Update a user (PUT /users/:id)
app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const updatedUser = req.body;
  users = users.map(user => (user.id === id ? updatedUser : user));
  res.status(200).json({ message: 'User updated', updatedUser });
});

// Delete a user (DELETE /users/:id)
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  users = users.filter(user => user.id !== id);
  res.status(200).json({ message: 'User deleted' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
