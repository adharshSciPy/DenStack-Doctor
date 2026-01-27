import React, { useState, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Tag, Plus } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import blogServiceUrl from '../blogServiceUrl';
import styles from '../styles/CreateBlog.module.css';

interface BlogData {
  _id: string;
  title: string;
  content: string;
  imageUrl: string[];
  tags: string[];
  doctorId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  blog?: BlogData;
  message?: string;
}

const CreateBlog: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  
  // Common medical tags for suggestions
  const commonTags = [
    'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Surgery',
    'Dermatology', 'Psychiatry', 'Radiology', 'Emergency Medicine',
    'Research', 'Clinical', 'Case Study', 'Technology', 'Wellness',
    'Prevention', 'Treatment', 'Diagnosis', 'Healthcare', 'Medical Tech'
  ];
  
  useEffect(() => {
    if (isEditing) {
      fetchBlog();
    }
  }, [id]);
  
  const fetchBlog = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        alert('Please login to edit blog');
        navigate('/login');
        return;
      }
      
      const response = await axios.get<ApiResponse>(
        `${blogServiceUrl}/api/v1/blog/blog/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const blogData = response.data.blog || response.data as BlogData;
      const originalImagePaths = blogData.imageUrl || [];
      
      setOriginalImages(originalImagePaths);
      setTitle(blogData.title || '');
      setContent(blogData.content || '');
      setTags(blogData.tags || []);
      setExistingImages(originalImagePaths.map(img => 
        img.startsWith('http') ? img : `${blogServiceUrl}${img}`
      ));
      
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      alert(axiosError.response?.data?.message || 'Failed to fetch blog');
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + files.length + existingImages.length;
    
    if (totalImages > 5) {
      alert('Max 5 images');
      return;
    }
    
    // Check file sizes (optional)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024); // 5MB
    if (oversizedFiles.length > 0) {
      alert('Some files exceed 5MB limit');
      return;
    }
    
    setImages([...images, ...files]);
  };
  
  const removeImage = (index: number, isExisting: boolean = false): void => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  // Tag functions
  const addTag = (tag: string): void => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };
  
  const removeTag = (tagToRemove: string): void => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (currentTag.trim()) {
        addTag(currentTag);
      }
    }
  };
  
  const handleCommonTagClick = (tag: string): void => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
    }
  };
  
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!content.trim()) {
      alert('Please enter content');
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
      
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content);
      formData.append("doctorId", doctorId);
      
      // Add tags as comma-separated string
      if (tags.length > 0) {
        formData.append("tags", tags.join(','));
      }
      
      images.forEach((image) => {
        formData.append("images", image);
      });
      
      if (isEditing) {
        const currentPaths = existingImages.map(url => 
          url.replace(`${blogServiceUrl}`, '')
        );
        
        if (currentPaths.length > 0) {
          formData.append("existingImages", JSON.stringify(currentPaths));
        }
        
        // Handle removed images
        const removedImages = originalImages.filter(original => 
          !currentPaths.includes(original)
        );
        
        if (removedImages.length > 0) {
          formData.append("removedImages", JSON.stringify(removedImages));
        }
      }
      
      const url = isEditing 
        ? `${blogServiceUrl}/api/v1/blog/edit-blog/${id}`
        : `${blogServiceUrl}/api/v1/blog/post-blog`;
      
      const method = isEditing ? 'patch' : 'post';
      
      const response = await axios({
        method,
        url,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      alert(response.data.message || (isEditing ? 'Blog updated!' : 'Blog created!'));
      navigate('/blogs');
      console.log(response);
      
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      alert(axiosError.response?.data?.message || 'Error saving blog');
      console.log(error);
      
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isEditing ? 'Edit Blog' : 'Create Blog'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title-input" className={styles.label}>
            Title *
            <span className={styles.labelHint}>Enter a clear and descriptive title</span>
          </label>
          <input
            type="text"
            id="title-input"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="e.g., Latest Advances in Cardiology"
            required
            className={styles.titleInput}
            minLength={3}
            maxLength={200}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="content-input" className={styles.label}>
            Content *
            <span className={styles.labelHint}>Write your blog content here</span>
          </label>
          <textarea
            id="content-input"
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Start writing your blog content..."
            rows={15}
            required
            className={styles.contentInput}
            minLength={10}
          />
        </div>
        
        {/* Tags Section */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Tags (Optional, max 10)
            <span className={styles.labelHint}>
              Add relevant tags to help readers find your blog. Press Enter or comma to add.
            </span>
          </label>
          
          <div className={styles.tagsInputContainer}>
            <div className={styles.tagsInputWrapper}>
              <Tag size={18} className={styles.tagIcon} />
              <input
                type="text"
                value={currentTag}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyPress}
                placeholder="Type a tag and press Enter..."
                className={styles.tagsInput}
                maxLength={30}
              />
              {currentTag.trim() && (
                <button
                  type="button"
                  onClick={() => addTag(currentTag)}
                  className={styles.addTagButton}
                  disabled={tags.includes(currentTag.trim()) || tags.length >= 10}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            {tags.length > 0 && (
              <div className={styles.selectedTags}>
                {tags.map((tag, index) => (
                  <div key={index} className={styles.tagItem}>
                    <span className={styles.tagText}>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={styles.removeTagButton}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.tagCount}>
              {tags.length} / 10 tags added
            </div>
          </div>
          
          <div className={styles.commonTags}>
            <h4 className={styles.commonTagsTitle}>Common Medical Tags:</h4>
            <div className={styles.commonTagsList}>
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleCommonTagClick(tag)}
                  className={`${styles.commonTag} ${
                    tags.includes(tag) ? styles.commonTagSelected : ''
                  }`}
                  disabled={tags.includes(tag) || tags.length >= 10}
                >
                  {tag}
                  {tags.includes(tag) && <span className={styles.addedCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Images Section */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Images (Optional, max 5)
            <span className={styles.labelHint}>Upload up to 5 images. Max 5MB each</span>
          </label>
          
          {existingImages.length > 0 && (
            <div className={styles.existingImages}>
              <h4 className={styles.sectionTitle}>Current Images:</h4>
              <div className={styles.imageList}>
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className={styles.imageItem}>
                    <img 
                      src={url} 
                      alt={`Current ${index}`}
                      className={styles.image}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/150?text=Image+Error';
                      }}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className={styles.removeButton}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.uploadArea}>
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
              disabled={images.length + existingImages.length >= 5}
            />
            <label htmlFor="file-upload" className={styles.uploadButton}>
              <Upload size={18} className={styles.uploadIcon} />
              <span className={styles.uploadText}>Add Images</span>
            </label>
            <span className={styles.imageCount}>
              {images.length + existingImages.length} / 5
            </span>
          </div>
          
          {images.length > 0 && (
            <div className={styles.newImages}>
              <h4 className={styles.sectionTitle}>New Images to Upload:</h4>
              <div className={styles.imageList}>
                {images.map((image, index) => (
                  <div key={`new-${index}`} className={styles.imageItem}>
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`New ${index}`}
                      className={styles.image}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeButton}
                      aria-label={`Remove new image ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                    <div className={styles.imageName} title={image.name}>
                      {image.name.length > 15 
                        ? `${image.name.substring(0, 15)}...` 
                        : image.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.cancelButton}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={styles.submitButton}
          >
            {saving ? (
              <>
                <span className={styles.spinner}></span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Blog' : 'Create Blog'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBlog;