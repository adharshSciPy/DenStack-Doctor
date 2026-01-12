import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Save, Send, Eye, Tag, Image as ImageIcon } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from '../styles/CreateBlog.module.css';
import axios from 'axios';
import blogServiceUrl from '../blogServiceUrl';

interface BlogData {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'rejected';
  imageUrl: string[];
  doctorId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CreateBlog: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  
  // Store original image URLs for comparison
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    images: [] as File[],
    existingImages: [] as string[],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags] = useState([
    'Research', 'Clinical', 'Case Study', 'Education', 
    'Technology', 'Wellness', 'Treatment', 'Diagnosis'
  ]);
  
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image'
  ];
  
  useEffect(() => {
    if (isEditing) {
      fetchBlog();
    }
  }, [id]);
  
  const fetchBlog = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        alert('Please login to edit blog');
        navigate('/login');
        return;
      }
      
      const response = await axios.get(
        `${blogServiceUrl}/api/v1/blog/blog/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const blogData: BlogData = response.data;
      
      // Store the original image paths (without baseURL)
      const originalImagePaths = blogData.imageUrl || [];
      setOriginalImages(originalImagePaths);
      
      // Set form data with full URLs for display
      setFormData({
        title: blogData.title || '',
        content: blogData.content || '',
        tags: blogData.tags?.join(', ') || '',
        status: (blogData.status === 'draft' || blogData.status === 'published') ? blogData.status : 'draft',
        images: [],
        existingImages: originalImagePaths.map(img => 
          img.startsWith('http') ? img : `${blogServiceUrl}${img}`
        ),
      });
      
    } catch (error: any) {
      console.error('Error fetching blog:', error);
      alert(error.response?.data?.message || 'Failed to fetch blog');
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = formData.images.length + files.length + formData.existingImages.length;
    
    if (totalImages > 5) {
      alert('Cannot upload more than 5 images total');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Some files exceed 5MB limit');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };
  
  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    const currentTags = formData.tags 
      ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
      : [];
    
    if (!currentTags.includes(trimmedTag)) {
      const updatedTags = [...currentTags, trimmedTag];
      setFormData(prev => ({
        ...prev,
        tags: updatedTags.join(', ')
      }));
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags 
      ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
      : [];
    
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags.join(', ')
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      alert('Please enter blog content');
      return;
    }
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const doctorId = localStorage.getItem("doctorId");
      
      if (!token || !doctorId) {
        alert('Please login to continue');
        navigate('/login');
        return;
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("content", formData.content);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("doctorId", doctorId);
      
      // Handle tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      formDataToSend.append("tags", tagsArray.join(','));
      
      // Handle new images
      formData.images.forEach((image) => {
        formDataToSend.append("images", image);
      });
      
      // For editing, handle image changes
      if (isEditing) {
        // Get current existing images (with full URLs)
        const currentExistingUrls = formData.existingImages;
        
        // Convert them back to paths for comparison
        const currentExistingPaths = currentExistingUrls.map(url => 
          url.replace(`${blogServiceUrl}`, '')
        );
        
        // Find removed images by comparing with original
        const removedImagePaths = originalImages.filter(originalPath => 
          !currentExistingPaths.includes(originalPath)
        );
        
        if (removedImagePaths.length > 0) {
          console.log('Removed images:', removedImagePaths);
          // Send the full paths (e.g., "/uploads/blogImages/filename.jpg")
          formDataToSend.append("removedImages", JSON.stringify(removedImagePaths));
        }
        
        // Send remaining existing images (just paths)
        if (currentExistingPaths.length > 0) {
          formDataToSend.append("existingImages", JSON.stringify(currentExistingPaths));
        }
      }
      
      let url;
      let method;
      
      if (isEditing) {
        url = `${blogServiceUrl}/api/v1/blog/edit-blog/${id}`;
        method = 'patch';
      } else {
        url = `${blogServiceUrl}/api/v1/blog/post-blog`;
        method = 'post';
      }
      
      const response = await axios({
        method,
        url,
        data: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      alert(response.data.message || 'Blog saved successfully!');
      navigate(`/blogs/${response.data.blog?._id || id}`);
      
    } catch (error: any) {
      console.error('Error saving blog:', error);
      alert(error.response?.data?.message || 'Failed to save blog. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleStatusChange = (status: 'draft' | 'published') => {
    setFormData(prev => ({ ...prev, status }));
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading blog...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditing ? 'Edit Blog' : 'Create New Blog'}
        </h1>
        <p className={styles.subtitle}>
          {isEditing ? 'Update your blog post' : 'Share your medical insights and research with the community'}
        </p>
      </div>
      
      <div className={styles.mainLayout}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Blog Title *
              <span className={styles.labelHint}>Catchy and descriptive</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a compelling title..."
              className={styles.input}
              required
              minLength={5}
              maxLength={200}
            />
          </div>
          
          {/* Content Editor */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Content *
              <span className={styles.labelHint}>Write your blog content here</span>
            </label>
            <div className={styles.editorContainer}>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Start writing your blog..."
                className={styles.editor}
              />
            </div>
          </div>
          
          {/* Tags */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tags
              <span className={styles.labelHint}>Help readers find your blog</span>
            </label>
            <div className={styles.tagsContainer}>
              <div className={styles.tagsInputWrapper}>
                <Tag className={styles.tagIcon} />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add tags (press Enter or click suggestions)"
                  className={styles.tagsInput}
                />
              </div>
              
              <div className={styles.selectedTags}>
                {formData.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                  <span key={index} className={styles.selectedTag}>
                    {tag.trim()}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.trim())}
                      className={styles.removeTagButton}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className={styles.suggestedTags}>
                <span className={styles.suggestedLabel}>Suggested:</span>
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={styles.suggestedTag}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Images (Max 5)
              <span className={styles.labelHint}>Upload supporting images</span>
            </label>
            
            {/* Existing Images */}
            {formData.existingImages.length > 0 && (
              <div className={styles.existingImages}>
                <h4 className={styles.existingTitle}>
                  Existing Images {isEditing && '(Click X to remove)'}:
                </h4>
                <div className={styles.imageGrid}>
                  {formData.existingImages.map((url, index) => (
                    <div key={index} className={styles.imagePreview}>
                      <img 
                        src={url} 
                        alt={`Existing ${index}`} 
                        className={styles.image}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className={styles.removeImageButton}
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload New Images */}
            <div className={styles.uploadArea}>
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.uploadInput}
                disabled={formData.images.length + formData.existingImages.length >= 5}
              />
              <label htmlFor="image-upload" className={styles.uploadLabel}>
                <Upload className={styles.uploadIcon} />
                <div>
                  <span className={styles.uploadText}>
                    Click to upload images
                  </span>
                  <span className={styles.uploadHint}>
                    Max 5 images total • Max 5MB each • Supports JPG, PNG, WebP
                  </span>
                </div>
              </label>
              
              {/* New Uploaded Images Preview */}
              <div className={styles.uploadedImages}>
                {formData.images.map((image, index) => (
                  <div key={index} className={styles.uploadedImage}>
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Upload ${index}`} 
                      className={styles.uploadedImagePreview}
                    />
                    <div className={styles.uploadedImageInfo}>
                      <span title={image.name}>
                        {image.name.length > 20 
                          ? `${image.name.substring(0, 20)}...` 
                          : image.name}
                      </span>
                      <span>{(image.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeUploadedButton}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className={styles.imageCount}>
                <ImageIcon className={styles.countIcon} />
                <span>
                  {formData.images.length + formData.existingImages.length} / 5 images
                </span>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className={styles.actions}>
            <div className={styles.statusButtons}>
              <button
                type="button"
                onClick={() => handleStatusChange('draft')}
                className={`${styles.statusButton} ${formData.status === 'draft' ? styles.statusButtonActive : ''}`}
              >
                <Save size={16} />
                Save as Draft
              </button>
              
              <button
                type="button"
                onClick={() => handleStatusChange('published')}
                className={`${styles.statusButton} ${formData.status === 'published' ? styles.statusButtonActive : ''}`}
              >
                <Send size={16} />
                Publish Now
              </button>
            </div>
            
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className={styles.previewButton}
              >
                <Eye size={16} />
                {preview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className={styles.submitButton}
              >
                {saving ? (
                  <>
                    <div className={styles.submitSpinner}></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {formData.status === 'draft' ? (
                      <>
                        <Save size={16} />
                        {isEditing ? 'Update Draft' : 'Save as Draft'}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {isEditing ? 'Update & Publish' : 'Publish Blog'}
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        
        {/* Preview Panel */}
        {preview && (
          <div className={styles.previewPanel}>
            <h3 className={styles.previewTitle}>Preview</h3>
            <div className={styles.previewContent}>
              <h2 className={styles.previewBlogTitle}>
                {formData.title || 'Untitled Blog'}
              </h2>
              
              <div className={styles.previewMeta}>
                <span className={styles.previewStatus}>
                  Status: <strong className={`${formData.status === 'published' ? styles.publishedStatus : styles.draftStatus}`}>
                    {formData.status}
                  </strong>
                </span>
                <span className={styles.previewWordCount}>
                  Words: {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length}
                </span>
              </div>
              
              {formData.existingImages.length > 0 || formData.images.length > 0 ? (
                <div className={styles.previewImages}>
                  {formData.existingImages.slice(0, 3).map((url, index) => (
                    <img 
                      key={`existing-${index}`} 
                      src={url} 
                      alt={`Preview ${index}`} 
                      className={styles.previewImage} 
                    />
                  ))}
                  {formData.images.slice(0, 3 - formData.existingImages.length).map((image, index) => (
                    <img 
                      key={`new-${index}`} 
                      src={URL.createObjectURL(image)} 
                      alt={`Upload Preview ${index}`} 
                      className={styles.previewImage} 
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.noImagesPreview}>
                  No images uploaded
                </div>
              )}
              
              <div 
                className={styles.previewText}
                dangerouslySetInnerHTML={{ 
                  __html: formData.content || '<p class="preview-placeholder">Start writing to see preview...</p>' 
                }}
              />
              
              {formData.tags && (
                <div className={styles.previewTags}>
                  <strong>Tags:</strong>
                  <div className={styles.previewTagsList}>
                    {formData.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span key={index} className={styles.previewTag}>
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBlog;