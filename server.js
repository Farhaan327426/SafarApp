const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const Razorpay = require('razorpay');
const { applySecurity, validateTicketPayload } = require('./security');
const { logger, initObservability } = require('./observability');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'
});

const app = express();
applySecurity(app);
initObservability(app);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
    jwt.verify(token, process.env.JWT_SECRET || 'safarkashmir-secret', (err, decoded) => {
        if (err) return res.status(403).send('Invalid Token');
        req.user = decoded;
        next();
    });
};

// Payment Processing Endpoint (Razorpay Orders & Stripe Support)
app.post('/api/tickets/book', authenticate, validateTicketPayload, async (req, res) => {
    const { routeId, amount, gateway } = req.body;
    try {
        if (gateway === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: 'inr',
                metadata: { routeId: String(routeId), userId: req.user.id }
            });
            return res.json({ clientSecret: paymentIntent.client_secret });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `route_${routeId}_user_${req.user.id}`
        });
        res.json({ orderId: order.id, currency: order.currency, amount: order.amount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Real-Time Telemetry Pipeline
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, process.env.JWT_SECRET || 'safarkashmir-secret', (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    socket.on('join_corridor', (corridorId) => {
        socket.join(corridorId);
    });

    socket.on('driver_location_update', (data) => {
        if (socket.user && socket.user.role === 'DRIVER') {
            io.to(data.corridorId).emit('bus_location', {
                vehicleId: data.vehicleId,
                lat: data.lat,
                lng: data.lng,
                timestamp: Date.now()
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server active on port ${PORT}`));
