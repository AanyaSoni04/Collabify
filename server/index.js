const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
    return io.sockets.adapter.rooms.get(roomId) || new Set();
}

io.on('connection', (socket) => {
    console.log(`A user connected:${socket.id}`); 
    socket.on('join', ({roomId, username})=>{
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
       });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});