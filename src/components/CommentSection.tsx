import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import styles from '../styles/CommentSection.module.css';
import axios from 'axios';
import blogServiceUrl from '../blogServiceUrl';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  doctorId: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  specialty?: string;
}

interface BlogComment {
  _id: string;
  doctorId: Doctor;
  comment: string;
  commentedAt: string;
}

interface CommentSectionProps {
  comments: BlogComment[];
  blogId: string;
  onCommentAdded: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments, 
  blogId,
  onCommentAdded 
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('');
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get current doctor ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode<DecodedToken>(token);
        setCurrentDoctorId(decoded.doctorId);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedElement = event.target as Node;
      let clickedInsideAnyMenu = false;

      Object.keys(menuRefs.current).forEach(key => {
        if (menuRefs.current[key]?.contains(clickedElement)) {
          clickedInsideAnyMenu = true;
        }
      });

      if (!clickedInsideAnyMenu && openMenu !== null) {
        setOpenMenu(null);
      }
    };

    // Add a small delay before attaching the listener to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const toggleMenu = (commentId: string) => {
    const newOpenMenu = openMenu === commentId ? null : commentId;
    setOpenMenu(newOpenMenu);
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyText.trim()) return;
    
    try {
      // Implement reply functionality
      console.log('Replying to comment:', commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) {
      alert('Comment cannot be empty');
      return;
    }
    
    try {
      const response = await axios.put(
        `${blogServiceUrl}/api/v1/blog/update-comment/${blogId}/${commentId}`,
        { comment: editText.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (response.status === 200) {
        setEditText('');
        setEditingComment(null);
        setOpenMenu(null);
        alert('Comment updated successfully');
        onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error editing comment:', error);
      alert(`Failed to edit comment: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.delete(
        `${blogServiceUrl}/api/v1/blog/delete-comment/${blogId}/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status === 200) {
        setOpenMenu(null);
        alert('Comment deleted successfully');
        onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(`Failed to delete comment: ${error.response?.data?.message || error.message}`);
    }
  };

  // Check if current user can edit/delete a comment
  const canModifyComment = (comment: BlogComment): boolean => {
    if (!currentDoctorId) {
      return false;
    }
    
    const commentDoctorId = typeof comment.doctorId === 'object' 
      ? comment.doctorId._id 
      : comment.doctorId;
    
    return commentDoctorId === currentDoctorId;
  };

  return (
    <div className={styles.container}>
      {comments.length === 0 ? (
        <div className={styles.noComments}>
          <MessageCircle className={styles.noCommentsIcon} />
          <h3>No comments yet</h3>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map(comment => (
            <div key={comment._id} className={styles.comment}>
              {/* Comment Header */}
              <div className={styles.commentHeader}>
                <div className={styles.commentAuthor}>
                  {comment.doctorId.profileImage && (
                    <img 
                      src={`${blogServiceUrl}/${comment.doctorId.profileImage}`}
                      alt={comment.doctorId.name}
                      className={styles.commentAvatar}
                    />
                  )}
                  <div className={styles.commentAuthorInfo}>
                    <span className={styles.commentAuthorName}>
                      Dr. {comment.doctorId.name}
                    </span>
                    <span className={styles.commentDate}>
                      {format(new Date(comment.commentedAt), 'MMM dd, yyyy • h:mm a')}
                    </span>
                  </div>
                </div>
                
                <div className={styles.commentActions}>
                  {/* Show menu for all comments - backend will handle permissions */}
                  <div 
                    className={styles.moreActions}
                    ref={(el) => {
                      if (el) menuRefs.current[comment._id] = el;
                    }}
                  >
                    <button 
                      className={styles.moreButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleMenu(comment._id);
                      }}
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {openMenu === comment._id && (
                      <div className={styles.moreMenu} style={{ position: 'absolute', backgroundColor: 'white', border: '1px solid black', padding: '8px', zIndex: 1000 }}>
                        <button 
                          className={styles.menuItem}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingComment(comment._id);
                            setEditText(comment.comment);
                            setOpenMenu(null);
                          }}
                          type="button"
                          style={{ display: 'block', width: '100%', padding: '8px', cursor: 'pointer' }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button 
                          className={`${styles.menuItem} ${styles.deleteItem}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(comment._id);
                          }}
                          type="button"
                          style={{ display: 'block', width: '100%', padding: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comment Content */}
              <div className={styles.commentContent}>
                {editingComment === comment._id ? (
                  <div className={styles.editForm}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={styles.editInput}
                      rows={3}
                    />
                    <div className={styles.editActions}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditSubmit(comment._id);
                        }}
                        className={styles.saveButton}
                        disabled={!editText.trim()}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingComment(null);
                          setEditText('');
                        }}
                        className={styles.cancelButton}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{comment.comment}</p>
                )}
              </div>
              
              {/* Reply Form */}
              {replyingTo === comment._id && (
                <div className={styles.replyForm}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className={styles.replyInput}
                    rows={2}
                  />
                  <div className={styles.replyActions}>
                    <button
                      onClick={() => handleReplySubmit(comment._id)}
                      className={styles.submitReplyButton}
                    >
                      Post Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className={styles.cancelReplyButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;