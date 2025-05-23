import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
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
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Only video files are allowed!'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for thumbnails!'), false);
      }
    }
    cb(null, true);
  }
});

// In-memory database for the prototype
let videos = [];
let users = [];
let comments = [];

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'dist')));

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
app.post('/api/videos/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, category, tags, userId } = req.body;
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    // Create new video entry
    const newVideo = {
      id: uuidv4(),
      title: title || 'Untitled Video',
      description: description || '',
      category: category || 'Uncategorized',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      videoUrl: `/uploads/${videoFile.filename}`,
      thumbnail: thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : null,
      source: 'user',
      duration: '0:00', // Would need ffmpeg to get actual duration
      views: 0,
      likes: 0,
      dislikes: 0,
      uploadDate: new Date().toISOString(),
      userId,
      user: users.find(u => u.id === userId) || { username: 'Anonymous' }
    };

    videos.push(newVideo);
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload video', details: error.message });
  }
});

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
app.post('/api/users/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password, // In a real app, this would be hashed
    createdAt: new Date().toISOString(),
    profilePic: null
  };
  
  users.push(newUser);
  
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Comments
app.post('/api/videos/:id/comments', (req, res) => {
  const { userId, content } = req.body;
  const videoId = req.params.id;
  
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }
  
  const video = videos.find(v => v.id === videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  const user = users.find(u => u.id === userId);
  
  const newComment = {
    id: uuidv4(),
    videoId,
    userId,
    user: user ? { username: user.username, profilePic: user.profilePic } : { username: 'Anonymous' },
    content,
    createdAt: new Date().toISOString(),
    likes: 0
  };
  
  comments.push(newComment);
  res.status(201).json(newComment);
});

app.get('/api/videos/:id/comments', (req, res) => {
  const videoId = req.params.id;
  
  const videoComments = comments
    .filter(c => c.videoId === videoId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(videoComments);
});

// Catch-all GET route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));