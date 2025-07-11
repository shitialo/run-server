// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('ciphemic-tech');

// Create application user with read/write permissions
db.createUser({
  user: 'ciphemic_user',
  pwd: 'ciphemic_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'ciphemic-tech'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
db.courses.createIndex({ "name": 1 });
db.courses.createIndex({ "createdAt": -1 });
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.notifications.createIndex({ "user": 1 });
db.notifications.createIndex({ "createdAt": -1 });
db.verificationcodes.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

print('Database initialized successfully with user and indexes');
