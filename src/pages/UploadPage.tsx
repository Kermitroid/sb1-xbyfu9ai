import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Film, Image, X, CheckCircle } from 'lucide-react';
import useVideoStore from '../stores/videoStore';
import useUserStore from '../stores/userStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useErrorHandler } from '../hooks/useErrorHandler';

const UploadPage = () => {
  const navigate = useNavigate();
  const { uploadVideo, isLoading } = useVideoStore();
  const { isAuthenticated } = useUserStore();
  const handleError = useErrorHandler();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
  });

  const [files, setFiles] = useState({
    video: null as File | null,
    thumbnail: null as File | null,
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const categories = [
    'Gaming',
    'Music',
    'Technology',
    'Education',
    'Sports',
    'Entertainment',
    'News',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find(file => file.type.startsWith('video/'));
    const imageFile = droppedFiles.find(file => file.type.startsWith('image/'));

    if (videoFile) {
      setFiles(prev => ({ ...prev, video: videoFile }));
    }
    if (imageFile) {
      setFiles(prev => ({ ...prev, thumbnail: imageFile }));
    }
  };

  const removeFile = (type: 'video' | 'thumbnail') => {
    setFiles(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!files.video) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', files.video);
      if (files.thumbnail) {
        uploadFormData.append('thumbnail', files.thumbnail);
      }
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('tags', formData.tags);

      const newVideo = await uploadVideo(uploadFormData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
      });
      setFiles({
        video: null,
        thumbnail: null,
      });

      // Redirect to the uploaded video after a delay
      setTimeout(() => {
        navigate(`/video/${newVideo.id}`);
      }, 2000);

    } catch (error: any) {
      const errorMessage = handleError(error);
      setError(errorMessage || 'Failed to upload video');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Upload Successful!</h2>
        <p className="text-gray-400 mb-6">Your video has been uploaded successfully.</p>
        <LoadingSpinner />
        <p className="text-sm text-gray-500 mt-4">Redirecting to your video...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
        <p className="text-gray-400">Share your content with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Video Upload */}
        <div className="bg-dark-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Video File</h3>
          
          {!files.video ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white mb-2">Drag and drop your video here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <label className="cursor-pointer bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  className="hidden"
                />
                Browse Files
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: MP4, MOV, AVI, WebM (Max 500MB)
              </p>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Film className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="text-white font-medium">{files.video.name}</p>
                  <p className="text-gray-400 text-sm">{formatFileSize(files.video.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile('video')}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div className="bg-dark-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Thumbnail (Optional)</h3>
          
          {!files.thumbnail ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <Image className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-white mb-2">Add a thumbnail</p>
              <label className="cursor-pointer bg-dark-100 hover:bg-dark-300 text-white px-4 py-2 rounded-lg transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                  className="hidden"
                />
                Choose Image
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, GIF (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="text-white font-medium">{files.thumbnail.name}</p>
                  <p className="text-gray-400 text-sm">{formatFileSize(files.thumbnail.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile('thumbnail')}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="bg-dark-200 rounded-xl p-6 space-y-6">
          <h3 className="text-xl font-semibold text-white">Video Details</h3>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              maxLength={100}
              className="w-full bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Enter video title..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={1000}
              className="w-full bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="Describe your video..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full bg-dark-100 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="gaming, tutorial, fun (comma separated)"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas (max 10 tags)</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !files.video || !formData.title.trim()}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Upload Video</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;
