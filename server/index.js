import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config/index.js';
import { authenticateToken, optionalAuth, generateToken } from './middleware/auth.js';
import { 
  validateRegistration, 
  validateLogin, 
  validateVideoUpload, 
  validateComment,
  handleValidationErrors 
} from './middleware/validation.js';
import { logger, requestLogger } from './utils/logger.js';
import { db } from './utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'"],
    },
  },
}));

// Compression for better performance
app.use(compression());

// CORS with proper configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000, // 15 minutes
  max: config.rateLimitMaxRequests, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(config.uploadPath);
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitizedName}`);
  }
});

// Enhanced file filter with better security
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'
  ];
  
  const allowedImageTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
  ];

  if (file.fieldname === 'video') {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(new Error('Only video files (MP4, MOV, AVI, WebM, etc.) are allowed!'), false);
    }
  } else if (file.fieldname === 'thumbnail') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for thumbnails!'), false);
    }
  } else {
    return cb(new Error('Unexpected field name!'), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage,
  limits: { 
    fileSize: config.maxFileSize,
    files: 2 // max 2 files (video + thumbnail)
  },
  fileFilter
});

// Load data from persistent storage
const dbData = db.read();
let videos = dbData.videos || [];
let users = dbData.users || [];
let comments = dbData.comments || [];

// Start auto-save
db.startAutoSave(() => ({
  users,
  videos,
  comments
}));

logger.info('Server starting up', { 
  videosCount: videos.length, 
  usersCount: users.length, 
  commentsCount: comments.length 
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Scrape videos from external sites
app.get('/api/aggregate', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const scrapedVideos = [];

    $('.video-thumb, .thumb-block, .video-box, .video-item').each((_, element) => {
      const title = $(element).attr('title') || 
                   $(element).find('img').attr('alt') || 
                   $(element).find('.title, .name, .video-title').text().trim();
                   
      const link = $(element).attr('href') || 
                  $(element).find('a').attr('href');
                  
      const thumb = $(element).find('img').attr('src') || 
                   $(element).find('img').attr('data-src') || 
                   $(element).find('.thumb img').attr('src');

      const duration = $(element).find('.duration').text().trim() || 
                       $(element).find('.time').text().trim() || 
                       "0:00";

      if (title && (link || thumb)) {
        scrapedVideos.push({
          id: uuidv4(),
          title,
          source: 'aggregated',
          sourceUrl: url,
          link: link ? new URL(link, url).href : null,
          thumbnail: thumb ? (thumb.startsWith('http') ? thumb : new URL(thumb, url).href) : null,
          duration,
          views: Math.floor(Math.random() * 10000),
          likes: Math.floor(Math.random() * 1000),
          dislikes: Math.floor(Math.random() * 100),
          uploadDate: new Date().toISOString(),
          user: { username: 'Aggregated Content' }
        });
      }
    });

    res.json({ videos: scrapedVideos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
  }
});

// Upload a new video
app.post('/api/videos/upload', 
  authenticateToken,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  validateVideoUpload,
  handleValidationErrors,
  (req, res) => {
    try {
      const { title, description, category, tags } = req.body;
      const videoFile = req.files['video'] ? req.files['video'][0] : null;
      const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (!videoFile) {
        return res.status(400).json({ error: 'Video file is required' });
      }

      const user = users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create new video entry
      const newVideo = {
        id: uuidv4(),
        title: title || 'Untitled Video',
        description: description || '',
        category: category || 'Other',
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        videoUrl: `/uploads/${videoFile.filename}`,
        thumbnail: thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null,
        source: 'user',
        duration: '0:00', // Would need ffmpeg to get actual duration
        views: 0,
        likes: 0,
        dislikes: 0,
        uploadDate: new Date().toISOString(),
        userId: req.user.id,
        user: { 
          username: user.username, 
          profilePic: user.profilePic 
        }
      };

      videos.push(newVideo);
      res.status(201).json(newVideo);
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ error: 'Failed to upload video', details: error.message });
    }
  }
);

// Get all videos (with pagination)
app.get('/api/videos', (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  
  let filteredVideos = [...videos];
  
  if (category) {
    filteredVideos = filteredVideos.filter(video => video.category === category);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredVideos = filteredVideos.filter(video => 
      video.title.toLowerCase().includes(searchLower) || 
      (video.description && video.description.toLowerCase().includes(searchLower))
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
  
  res.json({
    videos: paginatedVideos,
    totalVideos: filteredVideos.length,
    totalPages: Math.ceil(filteredVideos.length / limit),
    currentPage: parseInt(page)
  });
});

// Get video by ID
app.get('/api/videos/:id', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  // Increment view count
  video.views += 1;
  
  res.json(video);
});

// User routes
app.post('/api/users/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
    
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      profilePic: null
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/api/users/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Comments
app.post('/api/videos/:id/comments', 
  authenticateToken, 
  validateComment, 
  handleValidationErrors, 
  (req, res) => {
    try {
      const { content } = req.body;
      const videoId = req.params.id;
      
      const video = videos.find(v => v.id === videoId);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      const user = users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const newComment = {
        id: uuidv4(),
        videoId,
        userId: req.user.id,
        user: { 
          username: user.username, 
          profilePic: user.profilePic 
        },
        content: content.trim(),
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      comments.push(newComment);
      res.status(201).json(newComment);
    } catch (error) {
      console.error('Comment creation error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

app.get('/api/videos/:id/comments', (req, res) => {
  const videoId = req.params.id;
  
  const videoComments = comments
    .filter(c => c.videoId === videoId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(videoComments);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));