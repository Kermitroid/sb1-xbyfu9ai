import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
// import fs from 'fs'; // Removed as fsp is used for async operations
import fsp from 'fs/promises'; // For async file operations
import os from 'os';
// path is already imported above
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { body, validationResult } from 'express-validator';

// Set the path to ffprobe
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Firebase Admin SDK Initialization
const FIREBASE_STORAGE_BUCKET_URL = process.env.FIREBASE_STORAGE_BUCKET_URL;

if (!FIREBASE_STORAGE_BUCKET_URL) {
  console.error(
    'FATAL ERROR: FIREBASE_STORAGE_BUCKET_URL environment variable is not set.'
  );
  console.error(
    'Please set it to your Firebase project's storage bucket URL (e.g., gs://your-project-id.appspot.com or your-project-id.appspot.com).'
  );
  // To allow the app to potentially start for other routes or for user to see this message,
  // we will not exit here but Firebase Storage dependent operations will fail.
}

try {
  admin.initializeApp({
    // GOOGLE_APPLICATION_CREDENTIALS environment variable is used implicitly for service account
    storageBucket: FIREBASE_STORAGE_BUCKET_URL,
  });
  console.log('Firebase Admin SDK initialized successfully.');
  if (!FIREBASE_STORAGE_BUCKET_URL) {
    // This warning will appear if the app didn't exit above due to the missing env var.
    console.warn('Warning: Firebase Storage operations will likely fail as FIREBASE_STORAGE_BUCKET_URL was not properly set.');
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
  process.exit(1); // Exit if Firebase Admin fails to initialize
}

const db = admin.firestore();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Removed local file system directory creation for uploads and thumbnails

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
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
// let videos = []; // Removed for Firestore
// let users = []; // Removed for Firebase Auth
// let comments = []; // Removed for Firestore

// Removed static serving of local /uploads directory
// app.use('/uploads', express.static(uploadsDir)); 

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Middleware to verify Firebase ID tokens
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated access for certain routes if needed, or send error
    // For now, we'll assume token is required if header is attempted.
    // If you want to make it strictly required for routes it's applied to:
    return res.status(403).json({ error: 'Unauthorized: No token provided or incorrect format.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Contains uid, email, name, picture, etc.
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    // Differentiate between token specific errors and other errors if needed
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Token expired.' });
    }
    return res.status(403).json({ error: 'Unauthorized: Invalid token.' });
  }
}

// Validation rules for video upload
const videoUploadValidationRules = [
  body('title')
    .optional()
    .trim()
    .isString().withMessage('Title must be a string.')
    .isLength({ min: 1, max: 150 }).withMessage('Title must be between 1 and 150 characters.'),
  body('description')
    .optional()
    .trim()
    .isString().withMessage('Description must be a string.')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),
  body('category')
    .optional()
    .trim()
    .isString().withMessage('Category must be a string.')
    .isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters.'),
  body('tags')
    .optional()
    .isString().withMessage('Tags must be a string.')
    .custom((value, { req }) => {
        if (value && typeof value === 'string') {
            const tagsArray = value.split(',').map(tag => tag.trim());
            if (tagsArray.some(tag => tag.length > 50)) {
                throw new Error('Individual tags cannot exceed 50 characters.');
            }
            if (tagsArray.length > 10) {
                throw new Error('Cannot have more than 10 tags.');
            }
        }
        return true;
    }),
];

// Validation rules for user registration
const userRegistrationValidationRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters.')
    .isAlphanumeric().withMessage('Username must contain only letters and numbers.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
];

// Validation rules for comments
const commentValidationRules = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content cannot be empty.')
    .isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters.'),
];

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
  verifyFirebaseToken, 
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  videoUploadValidationRules, // Apply validation rules
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const uploaderId = req.user.uid; // Get uploaderId from authenticated user
      const { title, description, category, tags } = req.body; // userId no longer needed from body
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    if (!videoFile) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const videoId = uuidv4(); // Generate a unique ID for this video
    let tempFilePath = ''; // To store path for cleanup
    let videoDurationInSeconds = 0;

    try {
      // 1. Write video buffer to a temporary file for ffprobe
      tempFilePath = path.join(os.tmpdir(), `${videoId}-${videoFile.originalname}`);
      await fsp.writeFile(tempFilePath, videoFile.buffer);

      // 2. Extract duration using ffprobe
      videoDurationInSeconds = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          if (err) {
            console.error('Error probing video for duration:', err);
            resolve(0); // Default to 0 on error
            return;
          }
          resolve(metadata.format.duration || 0);
        });
      });

      // 3. Upload files to Firebase Storage (concurrently)
      const bucket = admin.storage().bucket();
      let videoUrl = null;
      let thumbnailUrl = null;

      const videoUploadPromise = (async () => {
        const videoFilePathInStorage = `videos/${videoId}/${videoFile.originalname.replace(/\s/g, '_')}`;
        const videoFileRef = bucket.file(videoFilePathInStorage);
        await videoFileRef.save(videoFile.buffer, { metadata: { contentType: videoFile.mimetype } });
        videoUrl = `https://storage.googleapis.com/${bucket.name}/${videoFilePathInStorage}`;
      })();

      const thumbnailUploadPromise = thumbnailFile ? (async () => {
        const thumbnailFilePathInStorage = `thumbnails/${videoId}/${thumbnailFile.originalname.replace(/\s/g, '_')}`;
        const thumbnailFileRef = bucket.file(thumbnailFilePathInStorage);
        await thumbnailFileRef.save(thumbnailFile.buffer, { metadata: { contentType: thumbnailFile.mimetype } });
        thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailFilePathInStorage}`;
      })() : Promise.resolve();
      
      await Promise.all([videoUploadPromise, thumbnailUploadPromise]);

      // 4. Prepare video data for Firestore
      const newVideoData = {
        title: title || 'Untitled Video',
        description: description || '',
        category: category || 'Uncategorized',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        uploaderId, // Firebase UID of the uploader
        uploadDate: new Date().toISOString(),
        views: 0,
        likes: 0,
        dislikes: 0,
        duration: videoDurationInSeconds, // Store duration in seconds
        source: 'user',
      };

      // 5. Save metadata to Firestore
      await db.collection('videos').doc(videoId).set(newVideoData);
      
      res.status(201).json({ id: videoId, ...newVideoData });

    } finally {
      // 6. Cleanup: Delete the temporary file
      if (tempFilePath) {
        try {
          await fsp.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('Error deleting temporary video file:', cleanupError);
        }
      }
    }
  } catch (error) { // Outer catch for errors not handled by the inner try/finally
    console.error('Error in video upload process:', error);
    res.status(500).json({ error: 'Failed to upload video', details: error.message });
  }
});

// Get all videos (with pagination)
app.get('/api/videos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;

    let query = db.collection('videos').orderBy('uploadDate', 'desc');
    let countQuery = db.collection('videos');

    if (category) {
      query = query.where('category', '==', category);
      countQuery = countQuery.where('category', '==', category);
    }

    // Firestore does not support native full-text search on multiple fields easily.
    // For a simple title search (prefix match), you can use >= and < trick.
    // For more complex search, a dedicated search service (e.g., Algolia, Elasticsearch) is recommended.
    // Here, we'll attempt a basic title search. Description search would require more complex handling.
    if (search) {
      const searchLower = search.toLowerCase(); // Assuming case-insensitive search is desired client-side or via more complex query
      query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff'); // Basic prefix matching for title
      // countQuery for search is tricky without knowing the exact field or doing client-side filtering post-fetch.
      // For now, totalVideos might not be perfectly accurate with search.
      // A more robust solution for search + count would involve a separate count query matching the search criteria
      // or denormalizing searchable text.
    }
    
    const totalVideosSnapshot = await countQuery.get();
    const totalVideos = totalVideosSnapshot.size;
    const totalPages = Math.ceil(totalVideos / limit);

    if (page > 1) {
      const previousPageSnapshot = await query.limit((page - 1) * limit).get();
      const lastVisible = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];
      query = query.startAfter(lastVisible);
    }
    
    query = query.limit(limit);
    const videosSnapshot = await query.get();
    const videos = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      videos,
      totalVideos,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching videos from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
  }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const videoRef = db.collection('videos').doc(videoId);
    const doc = await videoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count
    await videoRef.update({ views: admin.firestore.FieldValue.increment(1) });
    
    // Get the updated document data
    const updatedDoc = await videoRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });

  } catch (error) {
    console.error('Error fetching video from Firestore:', error);
    if (error.message.includes('not found')) { // Basic check, can be more specific
        return res.status(404).json({ error: 'Video not found' });
    }
    res.status(500).json({ error: 'Failed to fetch video', details: error.message });
  }
});

// User routes
app.post('/api/users/register', 
  userRegistrationValidationRules, // Apply validation rules
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // The old check: if (!username || !email || !password) can be removed.
    const { username, email, password } = req.body;

    try {
      const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      username: userRecord.displayName, // using displayName from userRecord as per instruction
      createdAt: new Date().toISOString(),
      profilePic: null, // Default profile picture
      // Add other default fields as necessary, e.g., bio: '', subscriptions: [], etc.
    };
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    console.log('Successfully created new user and profile in Firestore:', userRecord.uid);

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      username: userRecord.displayName,
    });
  } catch (error) {
    console.error('Error creating new user or profile:', error);
    // Firebase error codes can be used for more specific messages
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak.' });
    }
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

app.post('/api/users/login', (req, res) => {
  // const { email, password } = req.body; // Kept for clarity, but not used in this revised approach

  // Standard Firebase Authentication login (signInWithEmailAndPassword) is client-side.
  // The backend's role is to verify ID tokens sent by the client after successful login.
  res.status(501).json({ 
    message: "Login should be handled client-side using Firebase SDK. Backend verifies ID tokens on authenticated routes." 
  });
});

// GET videos by a specific user
app.get('/api/users/:userId/videos', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 1. Fetch user data
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    const userResponse = {
      uid: userDoc.id,
      username: userData.username || 'Anonymous', // Fallback if username not set
      profilePic: userData.profilePic || null,   // Fallback if profilePic not set
    };

    // 2. Construct base query for videos
    let videosQuery = db.collection('videos')
                        .where('uploaderId', '==', userId)
                        .orderBy('uploadDate', 'desc');

    // 3. Get total count for pagination
    const countSnapshot = await videosQuery.count().get();
    const totalVideos = countSnapshot.data().count;
    const totalPages = Math.ceil(totalVideos / limit);

    if (page > totalPages && totalVideos > 0) { // Allow page 1 for 0 videos
        return res.status(404).json({ error: 'Page out of bounds' });
    }
    
    // 4. Apply pagination
    if (page > 1) {
      const previousPageLimit = (page - 1) * limit;
      const previousPageSnapshot = await videosQuery.limit(previousPageLimit).get();
      if (previousPageSnapshot.docs.length > 0) {
          const lastVisible = previousPageSnapshot.docs[previousPageSnapshot.docs.length -1];
          videosQuery = videosQuery.startAfter(lastVisible);
      } else {
        // This case should ideally be caught by page > totalPages, but as a safeguard:
        return res.status(404).json({ error: 'Page out of bounds or inconsistent data' });
      }
    }
    videosQuery = videosQuery.limit(limit);

    // 5. Fetch videos
    const videosSnapshot = await videosQuery.get();
    const videos = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 6. Send response
    res.json({
      videos,
      totalVideos,
      totalPages,
      currentPage: page,
      user: userResponse,
    });

  } catch (error) {
    console.error(`Error fetching videos for user ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user videos', details: error.message });
  }
});

// Comments
app.post('/api/videos/:id/comments', 
  verifyFirebaseToken, 
  commentValidationRules, // Apply validation rules
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // The old check: if (!content) can be removed.
    const videoId = req.params.id;
    const commenterId = req.user.uid;
    const { content } = req.body;

    try {
      // Removed the commenterId check from req.body as it's now from req.user.uid

      // Check if video exists
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Fetch commenter's details for denormalization
    let commentUser = { username: 'Anonymous', profilePic: null }; // Default
    try {
        const userDoc = await db.collection('users').doc(commenterId).get();
        if (userDoc.exists) {
            commentUser.username = userDoc.data().username || 'Anonymous';
            commentUser.profilePic = userDoc.data().profilePic || null;
        } else {
            console.warn(`User profile not found for UID: ${commenterId} when creating comment.`);
        }
    } catch (dbError) {
        console.error(`Error fetching user ${commenterId} for comment:`, dbError);
        // Non-fatal: proceed with default/anonymous user for the comment, or handle as critical error if preferred
    }

    const newCommentData = {
      videoId,
      commenterId, // Firebase UID of the commenter
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      user: commentUser, // Denormalized user info
    };

    const commentRef = await db.collection('comments').add(newCommentData);
    
    res.status(201).json({ id: commentRef.id, ...newCommentData });
  } catch (error) {
    console.error('Error creating comment:', error); // More generic error message now
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
});

app.get('/api/videos/:id/comments', async (req, res) => {
  try {
    const videoId = req.params.id;

    const commentsSnapshot = await db.collection('comments')
      .where('videoId', '==', videoId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

// Video Like/Dislike Endpoints

// Helper function to get video and user interaction data
async function getVideoInteractionDetails(videoId, userId) {
  const videoRef = db.collection('videos').doc(videoId);
  const interactionRef = videoRef.collection('videoInteractions').doc(userId);

  const videoDoc = await videoRef.get();
  if (!videoDoc.exists) {
    return { videoExists: false };
  }

  const interactionDoc = await interactionRef.get();
  const userInteraction = interactionDoc.exists ? interactionDoc.data().interactionType : 'none';
  
  return {
    videoExists: true,
    videoRef,
    videoData: videoDoc.data(),
    interactionRef,
    interactionDoc,
    userInteraction,
    likes: videoDoc.data().likes || 0,
    dislikes: videoDoc.data().dislikes || 0,
  };
}

// GET current user's interaction status and like/dislike counts
app.get('/api/videos/:videoId/interactions', verifyFirebaseToken, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.uid;

  try {
    const details = await getVideoInteractionDetails(videoId, userId);

    if (!details.videoExists) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({
      userInteraction: details.userInteraction,
      likes: details.likes,
      dislikes: details.dislikes,
    });
  } catch (error) {
    console.error(`Error fetching interactions for video ${videoId}:`, error);
    res.status(500).json({ error: 'Failed to fetch video interactions' });
  }
});

// POST like a video
app.post('/api/videos/:videoId/like', verifyFirebaseToken, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.uid;

  try {
    let finalLikes, finalDislikes, finalUserInteraction;

    await db.runTransaction(async (transaction) => {
      const details = await getVideoInteractionDetails(videoId, userId); // Re-fetch inside transaction for consistency
      if (!details.videoExists) {
        throw { status: 404, message: 'Video not found' };
      }

      let { videoRef, videoData, interactionRef, userInteraction } = details;
      finalLikes = videoData.likes || 0;
      finalDislikes = videoData.dislikes || 0;

      if (userInteraction === 'like') {
        finalUserInteraction = 'liked'; // Already liked, no change
      } else if (userInteraction === 'dislike') {
        transaction.update(videoRef, {
          likes: admin.firestore.FieldValue.increment(1),
          dislikes: admin.firestore.FieldValue.increment(-1),
        });
        transaction.set(interactionRef, { interactionType: 'like', createdAt: new Date().toISOString() });
        finalLikes++;
        finalDislikes--;
        finalUserInteraction = 'liked';
      } else { // 'none'
        transaction.update(videoRef, { likes: admin.firestore.FieldValue.increment(1) });
        transaction.set(interactionRef, { interactionType: 'like', createdAt: new Date().toISOString() });
        finalLikes++;
        finalUserInteraction = 'liked';
      }
    });
    
    // Fetch the latest counts after transaction if needed, or use calculated final values
    // For simplicity, we use calculated values here. A fresh read can ensure absolute latest.
    const updatedDetails = await getVideoInteractionDetails(videoId, userId);


    res.json({ 
      likes: updatedDetails.likes, 
      dislikes: updatedDetails.dislikes, 
      userInteraction: updatedDetails.userInteraction 
    });

  } catch (error) {
    console.error(`Error liking video ${videoId}:`, error);
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// POST unlike a video
app.post('/api/videos/:videoId/unlike', verifyFirebaseToken, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.uid;

  try {
    await db.runTransaction(async (transaction) => {
      const details = await getVideoInteractionDetails(videoId, userId);
      if (!details.videoExists) {
        throw { status: 404, message: 'Video not found' };
      }
      
      let { videoRef, interactionRef, userInteraction } = details;

      if (userInteraction === 'like') {
        transaction.update(videoRef, { likes: admin.firestore.FieldValue.increment(-1) });
        transaction.delete(interactionRef);
      }
      // If not 'like', do nothing.
    });
    
    const updatedDetails = await getVideoInteractionDetails(videoId, userId);
    res.json({ 
      likes: updatedDetails.likes, 
      dislikes: updatedDetails.dislikes, 
      userInteraction: updatedDetails.userInteraction 
    });

  } catch (error) {
    console.error(`Error unliking video ${videoId}:`, error);
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to unlike video' });
  }
});

// POST dislike a video
app.post('/api/videos/:videoId/dislike', verifyFirebaseToken, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.uid;

  try {
    await db.runTransaction(async (transaction) => {
      const details = await getVideoInteractionDetails(videoId, userId);
      if (!details.videoExists) {
        throw { status: 404, message: 'Video not found' };
      }

      let { videoRef, videoData, interactionRef, userInteraction } = details;
      
      if (userInteraction === 'dislike') {
        // Already disliked, no change
      } else if (userInteraction === 'like') {
        transaction.update(videoRef, {
          dislikes: admin.firestore.FieldValue.increment(1),
          likes: admin.firestore.FieldValue.increment(-1),
        });
        transaction.set(interactionRef, { interactionType: 'dislike', createdAt: new Date().toISOString() });
      } else { // 'none'
        transaction.update(videoRef, { dislikes: admin.firestore.FieldValue.increment(1) });
        transaction.set(interactionRef, { interactionType: 'dislike', createdAt: new Date().toISOString() });
      }
    });

    const updatedDetails = await getVideoInteractionDetails(videoId, userId);
    res.json({ 
      likes: updatedDetails.likes, 
      dislikes: updatedDetails.dislikes, 
      userInteraction: updatedDetails.userInteraction 
    });

  } catch (error) {
    console.error(`Error disliking video ${videoId}:`, error);
     if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to dislike video' });
  }
});

// POST undislike a video
app.post('/api/videos/:videoId/undislike', verifyFirebaseToken, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.uid;

  try {
    await db.runTransaction(async (transaction) => {
      const details = await getVideoInteractionDetails(videoId, userId);
      if (!details.videoExists) {
        throw { status: 404, message: 'Video not found' };
      }

      let { videoRef, interactionRef, userInteraction } = details;

      if (userInteraction === 'dislike') {
        transaction.update(videoRef, { dislikes: admin.firestore.FieldValue.increment(-1) });
        transaction.delete(interactionRef);
      }
      // If not 'dislike', do nothing.
    });
    
    const updatedDetails = await getVideoInteractionDetails(videoId, userId);
    res.json({ 
      likes: updatedDetails.likes, 
      dislikes: updatedDetails.dislikes, 
      userInteraction: updatedDetails.userInteraction 
    });

  } catch (error) {
    console.error(`Error undisliking video ${videoId}:`, error);
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to undislike video' });
  }
});


// Catch-all GET route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));