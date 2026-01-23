import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Reply, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
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
  profilePicture?: string;
  specialty?: string;
}

interface ReplyType {
  _id: string;
  doctorId: Doctor;
  text: string;
  createdAt: string;
  replies?: ReplyType[]; // Nested replies
  replyCount?: number;
  hasMoreReplies?: boolean;
  doctor?: Doctor;
  isEdited?: boolean;
}

interface BlogComment {
  _id: string;
  doctorId: Doctor;
  text: string;
  createdAt: string;
  replies: ReplyType[];
  parentCommentId?: string;
  isEdited?: boolean;
  replyCount?: number;
  doctor?: Doctor;
}

interface CommentSectionProps {
  comments: BlogComment[];
  blogId: string;
  onCommentAdded: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments: initialComments, 
  blogId,
  onCommentAdded 
}) => {
  const [comments, setComments] = useState<BlogComment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<{id: string, isReply: boolean} | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [loadingReplies, setLoadingReplies] = useState<{ [key: string]: boolean }>({});
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({});
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

  // Update comments when initialComments prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

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

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const toggleMenu = (commentId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newOpenMenu = openMenu === commentId ? null : commentId;
    setOpenMenu(newOpenMenu);
  };

  // API to get nested replies for a comment or reply
  const fetchNestedReplies = async (parentId: string, isReply: boolean = false) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [parentId]: true }));
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(
        `${blogServiceUrl}/api/v1/blog/nested-replies/${parentId}`,
        {
          params: { limit: 10 },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (response.data.success) {
        const updateCommentsWithNestedReplies = (
          items: any[], 
          parentId: string, 
          newReplies: ReplyType[]
        ): any[] => {
          return items.map(item => {
            if (item._id === parentId) {
              return {
                ...item,
                replies: newReplies || [],
                replyCount: response.data.pagination?.totalReplies || 0
              };
            }
            
            // Recursively search in nested replies
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: updateCommentsWithNestedReplies(item.replies, parentId, newReplies)
              };
            }
            
            return item;
          });
        };
        
        setComments(prevComments => 
          updateCommentsWithNestedReplies(prevComments, parentId, response.data.replies || [])
        );
      }
    } catch (error: any) {
      console.error('Error fetching nested replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [parentId]: false }));
    }
  };

  // Toggle replies visibility for any level
  const toggleReplies = async (parentId: string, isReply: boolean = false) => {
    const isExpanded = expandedReplies[parentId];
    
    if (!isExpanded) {
      // If replies haven't been loaded yet, fetch them
      const findItemWithReplies = (items: any[], id: string): any => {
        for (const item of items) {
          if (item._id === id) {
            return item;
          }
          if (item.replies && item.replies.length > 0) {
            const found = findItemWithReplies(item.replies, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const item = findItemWithReplies(comments, parentId);
      if (!item?.replies || item.replies.length === 0) {
        await fetchNestedReplies(parentId, isReply);
      }
    }
    
    setExpandedReplies(prev => ({
      ...prev,
      [parentId]: !isExpanded
    }));
  };

  // Handle reply submission for any level (comment or reply)
  const handleReplySubmit = async (parentId: string, isReply: boolean = false) => {
    if (!replyText.trim()) {
      alert('Reply cannot be empty');
      return;
    }
    
    if (!currentDoctorId) {
      alert('Please login to reply');
      return;
    }
    
    try {
      setSubmittingReply(parentId);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `${blogServiceUrl}/api/v1/blog/reply/${blogId}/${parentId}`,
        { 
          reply: replyText.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status === 201) {
        const newReply = response.data.reply;
        
        const updateWithNewReply = (
          items: any[], 
          parentId: string, 
          newReply: ReplyType
        ): any[] => {
          return items.map(item => {
            if (item._id === parentId) {
              const updatedReplies = [...(item.replies || []), newReply];
              return {
                ...item,
                replies: updatedReplies,
                replyCount: (item.replyCount || 0) + 1
              };
            }
            
            // Recursively search in nested replies
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: updateWithNewReply(item.replies, parentId, newReply)
              };
            }
            
            return item;
          });
        };
        
        setComments(prevComments => 
          updateWithNewReply(prevComments, parentId, newReply)
        );
        
        setReplyText('');
        setReplyingTo(null);
        setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        alert('Reply added successfully');
        
        // Also refresh parent component if needed
        onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error adding reply:', error);
      if (error.response?.status === 400) {
        alert(`Invalid request: ${error.response.data.message}`);
      } else if (error.response?.status === 404) {
        alert(`${error.response.data.message}`);
      } else {
        alert(`Failed to add reply: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) {
      alert('Comment cannot be empty');
      return;
    }
    
    try {
      const response = await axios.patch(
        `${blogServiceUrl}/api/v1/blog/edit-comment/${commentId}`,
        { text: editText.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (response.status === 200) {
        const updateCommentText = (items: any[], id: string, newText: string): any[] => {
          return items.map(item => {
            if (item._id === id) {
              return {
                ...item,
                text: newText,
                isEdited: true
              };
            }
            
            // Recursively search in nested replies
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: updateCommentText(item.replies, id, newText)
              };
            }
            
            return item;
          });
        };
        
        setComments(prevComments => 
          updateCommentText(prevComments, commentId, editText.trim())
        );
        
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
        `${blogServiceUrl}/api/v1/blog/delete-comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status === 200) {
        const removeComment = (items: any[], id: string): any[] => {
          return items.filter(item => item._id !== id).map(item => {
            // Keep searching in nested replies
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: removeComment(item.replies, id)
              };
            }
            return item;
          });
        };
        
        setComments(prevComments => removeComment(prevComments, commentId));
        setOpenMenu(null);
        alert('Comment deleted successfully');
        onCommentAdded();
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(`Failed to delete comment: ${error.response?.data?.message || error.message}`);
    }
  };

  // Check if current user is the author of a comment/reply
  const isCommentAuthor = (comment: any): boolean => {
    if (!currentDoctorId) {
      return false;
    }
    
    const commentDoctorId = typeof comment.doctorId === 'object' 
      ? comment.doctorId._id 
      : comment.doctorId;
    
    return commentDoctorId === currentDoctorId;
  };

  // Check if user can reply to this comment/reply
  const canReplyTo = (item: any): boolean => {
    if (!currentDoctorId) {
      return false;
    }
    
    const itemDoctorId = typeof item.doctorId === 'object' 
      ? item.doctorId._id 
      : item.doctorId;
    
    // User cannot reply to their own comments/replies
    return itemDoctorId !== currentDoctorId;
  };

  const handleReplyToComment = (commentId: string, isReply: boolean = false) => {
    if (!currentDoctorId) {
      alert('Please login to reply to comments');
      return;
    }
    
    // Check if user is trying to reply to their own comment
    const findItem = (items: any[], id: string): any => {
      for (const item of items) {
        if (item._id === id) return item;
        if (item.replies && item.replies.length > 0) {
          const found = findItem(item.replies, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const item = findItem(comments, commentId);
    if (item && !canReplyTo(item)) {
      alert('You cannot reply to your own comment');
      return;
    }
    
    setReplyingTo({ id: commentId, isReply });
    setReplyText('');
    setOpenMenu(null);
  };

  // Recursive function to get edit and delete buttons for nested replies
  const getAuthorActions = (item: any, isReply: boolean = false) => {
    if (isCommentAuthor(item)) {
      return (
        <>
          <button 
            className={styles.menuItem}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingComment(item._id);
              setEditText(item.text);
              setOpenMenu(null);
            }}
            type="button"
          >
            <Edit size={14} />
            Edit
          </button>
          <button 
            className={`${styles.menuItem} ${styles.deleteItem}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(item._id);
            }}
            type="button"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      );
    }
    return null;
  };

  // Recursive component for nested replies with author-only actions
  const NestedReply = ({ reply, depth = 0 }: { reply: ReplyType; depth?: number }) => {
    const [localOpenMenu, setLocalOpenMenu] = useState<string | null>(null);
    const localMenuRef = useRef<HTMLDivElement>(null);
    const showReplyButton = canReplyTo(reply);
    const isAuthor = isCommentAuthor(reply);
    
    // Close menu when clicking outside for this reply
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (localMenuRef.current && !localMenuRef.current.contains(event.target as Node)) {
          setLocalOpenMenu(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const toggleLocalMenu = (replyId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const newOpenMenu = localOpenMenu === replyId ? null : replyId;
      setLocalOpenMenu(newOpenMenu);
    };
    console.log("dsd",comments);
    
    return (
      <div className={styles.nestedReply} style={{ marginLeft: depth > 0 ? 20 : 0 }}>
        <div className={styles.replyHeader}>
          <div className={styles.replyAuthor}>
            {/* {reply.doctorId?.profilePicture && (
              <img 
                src={getProfileImageUrl(reply.doctorId.profilePicture)}
                alt={reply.doctorId.name}
                className={styles.replyAvatar}
              />
            )} */}
            <div className={styles.replyAuthorInfo}>
              <span className={styles.replyAuthorName}>
                {reply.doctor?.name || 'Doctor'}
                {isAuthor && <span className={styles.authorBadge}> (You)</span>}
              </span>
              <span className={styles.replyDate}>
                {format(new Date(reply.createdAt), 'MMM dd, yyyy • h:mm a')}
                {reply.isEdited && (
                  <span className={styles.editedBadge} title="Edited"> (edited)</span>
                )}
              </span>
            </div>
          </div>
          
          <div className={styles.replyActions}>
            {showReplyButton && (
              <button
                className={styles.replyToReplyButton}
                onClick={() => handleReplyToComment(reply._id, true)}
              >
                <Reply size={12} />
                Reply
              </button>
            )}
            
            {/* More actions menu for reply author */}
            {(isAuthor || showReplyButton) && (
              <div 
                className={styles.moreActions}
                ref={localMenuRef}
              >
                <button 
                  className={styles.moreButton}
                  onClick={(e) => toggleLocalMenu(reply._id, e)}
                  type="button"
                >
                  <MoreVertical size={14} />
                </button>
                
                {localOpenMenu === reply._id && (
                  <div className={styles.moreMenu}>
                    {/* Author-only actions */}
                    {getAuthorActions(reply, true)}
                    
                    {/* Reply option for others */}
                    {showReplyButton && (
                      <button 
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReplyToComment(reply._id, true);
                          setLocalOpenMenu(null);
                        }}
                        type="button"
                      >
                        <Reply size={14} />
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.replyContent}>
          {editingComment === reply._id ? (
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
                    handleEditSubmit(reply._id);
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
            <p>{reply.text}</p>
          )}
        </div>
        
        {/* Reply form for this reply */}
        {replyingTo?.id === reply._id && replyingTo?.isReply && (
          <div className={styles.nestedReplyForm}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={2}
            />
            <div className={styles.replyActions}>
              <button
                onClick={() => handleReplySubmit(reply._id, true)}
                disabled={!replyText.trim() || submittingReply === reply._id}
              >
                {submittingReply === reply._id ? 'Posting...' : 'Post Reply'}
              </button>
              <button 
                onClick={() => setReplyingTo(null)}
                disabled={submittingReply === reply._id}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Nested replies toggle */}
        {(reply.replyCount || 0) > 0 && (
          <div className={styles.repliesToggle}>
            <button
              className={styles.toggleRepliesButton}
              onClick={() => toggleReplies(reply._id, true)}
              disabled={loadingReplies[reply._id]}
            >
              {expandedReplies[reply._id] ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
              {loadingReplies[reply._id] ? (
                'Loading...'
              ) : (
                `${reply.replyCount} ${reply.replyCount === 1 ? 'reply' : 'replies'}`
              )}
            </button>
          </div>
        )}
        
        {/* Display nested replies */}
        {expandedReplies[reply._id] && reply.replies && reply.replies.length > 0 && (
          <div className={styles.nestedReplies}>
            {reply.replies.map((nestedReply) => (
              <NestedReply key={nestedReply._id} reply={nestedReply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {comments?.length === 0 ? (
        <div className={styles.noComments}>
          <MessageCircle className={styles.noCommentsIcon} />
          <h3>No comments yet</h3>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className={styles.commentsList}>
          {comments?.map(comment => {
            const isAuthor = isCommentAuthor(comment);
            const showReplyButton = canReplyTo(comment);
            
            return (
              <div key={comment._id} className={styles.comment}>
                {/* Comment Header */}
                <div className={styles.commentHeader}>
                  <div className={styles.commentAuthor}>
                    {/* {comment?.doctorId?.profilePicture && (
                      <img 
                        src={getProfileImageUrl(comment.doctorId.profilePicture)}
                        alt={comment.doctorId.name}
                        className={styles.commentAvatar}
                      />
                    )} */}
                    <div className={styles.commentAuthorInfo}>
                      <span className={styles.commentAuthorName}>
                        {comment?.doctor?.name || 'Doctor'}
                        {isAuthor && <span className={styles.authorBadge}> (You)</span>}
                      </span>
                      <span className={styles.commentDate}>
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy • h:mm a')}
                        {comment.isEdited && (
                          <span className={styles.editedBadge} title="Edited"> (edited)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.commentActions}>
                    {(isAuthor || showReplyButton) && (
                      <div 
                        className={styles.moreActions}
                        ref={(el) => {
                          if (el) menuRefs.current[comment._id] = el;
                        }}
                      >
                        <button 
                          className={styles.moreButton}
                          onClick={(e) => toggleMenu(comment._id, e)}
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openMenu === comment._id && (
                          <div className={styles.moreMenu}>
                            {/* Author-only actions */}
                            {isAuthor && (
                              <>
                                <button 
                                  className={styles.menuItem}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingComment(comment._id);
                                    setEditText(comment.text);
                                    setOpenMenu(null);
                                  }}
                                  type="button"
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
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                            
                            {/* Reply option for others */}
                            {showReplyButton && (
                              <button 
                                className={styles.menuItem}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleReplyToComment(comment._id, false);
                                  setOpenMenu(null);
                                }}
                                type="button"
                              >
                                <Reply size={14} />
                                Reply
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                    <p>{comment.text}</p>
                  )}
                </div>
                
                {/* Reply form for this comment */}
                {replyingTo?.id === comment._id && !replyingTo?.isReply && (
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
                        onClick={() => handleReplySubmit(comment._id, false)}
                        className={styles.submitReplyButton}
                        disabled={!replyText.trim() || submittingReply === comment._id}
                      >
                        {submittingReply === comment._id ? 'Posting...' : 'Post Reply'}
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className={styles.cancelReplyButton}
                        disabled={submittingReply === comment._id}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Replies count and toggle */}
                {(comment.replyCount || 0) > 0 && (
                  <div className={styles.repliesToggle}>
                    <button
                      className={styles.toggleRepliesButton}
                      onClick={() => toggleReplies(comment._id, false)}
                      disabled={loadingReplies[comment._id]}
                    >
                      {expandedReplies[comment._id] ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {loadingReplies[comment._id] ? (
                        'Loading replies...'
                      ) : (
                        `${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                      )}
                    </button>
                  </div>
                )}
                
                {/* Display nested replies */}
                {expandedReplies[comment._id] && comment.replies && comment.replies.length > 0 && (
                  <div className={styles.repliesContainer}>
                    {comment.replies.map(reply => (
                      <NestedReply key={reply._id} reply={reply} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;