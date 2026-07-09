const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const Y = require('yjs'); // Import Yjs

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};
const roomDocs = new Map(); // Keep track of Yjs documents for active rooms

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

        // Retrieve or initialize the room's Yjs Doc
        if (!roomDocs.has(roomId)) {
            const ydoc = new Y.Doc();
            ydoc.getText('codemirror'); // Initialize the shared text type
            roomDocs.set(roomId, ydoc);
        }
        const roomDoc = roomDocs.get(roomId);

        const clients = getAllConnectedClients(roomId);
        //notify to clients that new user has joined
        clients.forEach(({socketId})=>{ 
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            }); 
        }); 

        // Send current document state to the newly joined client
        const docState = Y.encodeStateAsUpdate(roomDoc);
        socket.emit('init-doc-state', docState);
    });

    // Handle character sync from Yjs client updates
    socket.on('code-update', ({roomId, update}) => {
        const roomDoc = roomDocs.get(roomId);
        if (roomDoc && update) {
            try {
                Y.applyUpdate(roomDoc, new Uint8Array(update), 'socket');
                // Broadcast updates to all other clients in the room
                socket.to(roomId).emit('code-update', update);
            } catch (err) {
                console.error("Error applying room update:", err);
            }
        }
    });

    // Handle cursor/selection awareness sync
    socket.on('awareness-update', ({roomId, update}) => {
        if (update) {
            socket.to(roomId).emit('awareness-update', update);
        }
    });
       
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms]; //rooms which are joined by the user
      rooms.forEach((roomId) => {
        socket.in(roomId).emit("disconnected", {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });

        // Clean up Yjs documents for empty rooms to avoid memory leak
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room && room.size <= 1) {
            roomDocs.delete(roomId);
            console.log(`Cleaned up Y.Doc for empty room: ${roomId}`);
        }
      });
      delete userSocketMap[socket.id];
      socket.leave(); //leave all the rooms
    });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});