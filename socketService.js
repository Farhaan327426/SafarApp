const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const pubClient = new Redis(REDIS_URI);
const subClient = pubClient.duplicate();

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' }
    });
    
    io.adapter(createAdapter(pubClient, subClient));
    
    io.on('connection', (socket) => {
        socket.on('join_corridor', (corridorId) => {
            socket.join(corridorId);
        });

        socket.on('driver_location', async (data) => {
            io.to(data.corridorId).emit('bus_update', data);
        });
    });
    
    return io;
}

module.exports = { initSocket };
