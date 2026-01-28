import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRoutes from './api';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IP_NETWORK = process.env.IP_NETWORK;

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// CORS - Allow all origins untuk sementara (debugging)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving untuk uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Health check endpoint dengan test database
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Bloom Sisters API',
      environment: process.env.NODE_ENV,
      port: PORT,
      database: 'connected',
      nodeVersion: process.version
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      service: 'Bloom Sisters API',
      database: 'disconnected',
      error: error.message,
      port: PORT
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bloom Sisters Backend API',
    version: '1.0.0',
    health: '/health',
    debug: '/api/debug/test',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      vouchers: '/api/vouchers'
    }
  });
});

// Debug endpoint untuk testing connection
app.get('/api/debug/test', async (req, res) => {
  try {
    // Test database connection
    const dbVersion = await prisma.$queryRaw`SELECT version()`;
    
    res.json({
      success: true,
      message: 'Debug endpoint - no auth required',
      database: {
        connected: true,
        version: dbVersion
      },
      environment: {
        node_env: process.env.NODE_ENV,
        port: PORT
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Bloom Sisters Backend...');
    console.log(`📁 Environment: ${process.env.NODE_ENV}`);
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const dbVersion = await prisma.$queryRaw`SELECT version()`;
    console.log(`📊 Database: ${JSON.stringify(dbVersion)}`);
    
    app.listen(PORT, () => {
      console.log(`
✅ Bloom Sisters Backend is running!
📡 Port: ${PORT}
🌐 Health Check: ${IP_NETWORK}:${PORT}/health
🔗 API Base: ${IP_NETWORK}:${PORT}/api
🎯 Frontend: ${process.env.FRONTEND_URL}
📊 Debug Test: ${IP_NETWORK}:${PORT}/api/debug/test
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.message.includes('PrismaClientInitializationError')) {
        console.error('\n🔴 PRISMA INIT ERROR DETECTED');
        console.error('Check:');
        console.error('1. DATABASE_URL in Vercel environment variables');
        console.error('2. Run "prisma generate" locally');
        console.error('3. Check database accessibility');
      }
    }
    
    process.exit(1);
  }
};

// Start the server
startServer();