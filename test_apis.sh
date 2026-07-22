#!/bin/bash
echo "Testing /auth/login..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@cybershield.com","password":"password123"}')
echo $RESPONSE
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Registering..."
    curl -s -X POST http://localhost:3001/api/auth/signup -H "Content-Type: application/json" -d '{"email":"admin@cybershield.com","password":"Password123!","username":"admin", "fullName":"Admin User", "gender":"Male", "age":30, "country":"US"}'
    
    echo "Inserting into mongo..."
    node -e "
    const mongoose = require('mongoose');
    mongoose.connect('mongodb://127.0.0.1:27017/cybershield').then(async () => {
        const User = require('./server/models/User');
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Password123!', 10);
        await User.updateOne({ email: 'admin@cybershield.com' }, { \$set: { password: hash, role: 'admin', isBanned: false } }, { upsert: true });
        console.log('MongoDB user created');
        process.exit(0);
    });
    "

    RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@cybershield.com","password":"Password123!"}')
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token after register/mongo: $TOKEN"
fi

echo -e "\nTesting /scan..."
curl -s -X POST http://localhost:3001/api/scan -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"target":"example.com","type":"quick"}'

echo -e "\nTesting /scans..."
curl -s -X GET http://localhost:3001/api/history -H "Authorization: Bearer $TOKEN"

