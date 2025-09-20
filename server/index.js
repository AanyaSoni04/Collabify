const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    // console.log(`A user connected:${socket.id}`); 
    socket.on('join', ({roomId, username})=>{
        console.log("User joined:", username); 
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        //notify to clients that new user has joined
        clients.forEach(({socketId})=>{ 
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            }); 
        }); 
       });

           
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms]; //rooms which are joined by the user
      rooms.forEach((roomId) => {
        socket.in(roomId).emit("disconnected", {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      });
      delete userSocketMap[socket.id];
      socket.leave(); //leave all the rooms
    });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});