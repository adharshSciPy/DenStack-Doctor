import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Edit,
  Trash2,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import CommentSection from "./CommentSection";
import styles from "../styles/BlogDetail.module.css";
import axios from "axios";
import blogServiceUrl from "../blogServiceUrl";
import { jwtDecode } from "jwt-decode";

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

interface Like {
  doctorId: string | Doctor;
  likedAt: string;
}

interface AdminReview {
  reviewedBy?: Doctor;
  status: "pending" | "approved" | "rejected" | null;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface Blog {
  _id: string;
  doctorId: Doctor;
  title: string;
  content: string;
  imageUrl: string[];
  tags: string[];
  status: "draft" | "published" | "rejected";
  likes: Like[];
  likesCount: number;
  comments: BlogComment[];
  commentsCount: number;
  viewCount: number;
  isFeatured: boolean;
  adminReview: AdminReview;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

const BlogDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const userId = localStorage.getItem("doctorId");
    const role = localStorage.getItem("userRole");

    if (userId) {
      setCurrentUserId(userId);
    }

    if (role) {
      setUserRole(role);
    }
  }, []);

  let doctorId: string | null = null;
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      doctorId = decoded.doctorId;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  const isLikedByCurrentDoctor = blog?.likes?.some(
    (like) => {
      if (typeof like.doctorId === "object") {
        return like.doctorId._id === doctorId;
      }
      return like.doctorId === doctorId;
    }
  );

  const calculateIsLiked = (blogData: Blog, userId: string): boolean => {
    if (!blogData || !blogData.likes || !userId) return false;

    return blogData.likes.some((like) => {
      if (typeof like.doctorId === "object") {
        return like.doctorId._id === userId;
      }
      return like.doctorId === userId;
    });
  };

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id, currentUserId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${blogServiceUrl}/api/v1/blog/blog/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      const blogData = response.data;
      const isLiked = calculateIsLiked(blogData, currentUserId);

      setBlog({
        ...blogData,
        isLiked,
      });
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog || liking || !token) {
      if (!token) {
        alert("Please login to like blogs");
        navigate("/login");
      }
      return;
    }

    try {
      setLiking(true);
      const wasLiked = blog.isLiked;
      const newLikesCount = wasLiked
        ? blog.likesCount - 1
        : blog.likesCount + 1;

      setBlog((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !wasLiked,
              likesCount: newLikesCount,
            }
          : null
      );

      const response = await axios.post(
        `${blogServiceUrl}/api/v1/blog/like/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchBlog();
      }
    } catch (error) {
      console.error("Error liking blog:", error);
      setBlog((prev) =>
        prev
          ? {
              ...prev,
              isLiked: blog.isLiked,
              likesCount: blog.likesCount,
            }
          : null
      );
    } finally {
      setLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !id) return;

    if (!token) {
      alert("Please login to comment");
      navigate("/login");
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await axios.post(
        `${blogServiceUrl}/api/v1/blog/comment/${id}`,
        { comment: comment.trim() },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const data = response.data;
        setBlog((prev) =>
          prev
            ? {
                ...prev,
                comments: data.comments,
                commentsCount: data.commentsCount,
              }
            : null
        );
        setComment("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteClick = () => {
    if (isAdmin && !isAuthor) {
      setShowDeleteConfirm(true);
    } else {
      if (window.confirm("Are you sure you want to delete this blog?")) {
        handleDelete();
      }
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${blogServiceUrl}/api/v1/blog/delete-blog/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: isAdmin && !isAuthor ? { reason: deleteReason } : {}
        }
      );

      if (response.status === 200) {
        alert(
          isAdmin && !isAuthor 
            ? "Blog deleted by admin" 
            : "Blog deleted successfully"
        );
        navigate("/myblogs");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const handleAdminDelete = async () => {
    if (!deleteReason.trim() && isAdmin && !isAuthor) {
      alert("Please provide a reason for deletion");
      return;
    }

    try {
      const response = await axios.delete(
        `${blogServiceUrl}/api/v1/blog/delete-blog/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { reason: deleteReason }
        }
      );

      if (response.status === 200) {
        alert("Blog deleted by admin");
        navigate("/blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteReason("");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.content.substring(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getStatusIcon = () => {
    if (!blog?.adminReview?.status) return null;

    switch (blog.adminReview.status) {
      case "approved":
        return <CheckCircle className={styles.approvedIcon} />;
      case "rejected":
        return <XCircle className={styles.rejectedIcon} />;
      case "pending":
        return <Clock className={styles.pendingIcon} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!blog?.adminReview?.status) return null;

    switch (blog.adminReview.status) {
      case "approved":
        return "Approved by admin";
      case "rejected":
        return `Rejected: ${
          blog.adminReview.rejectionReason || "No reason provided"
        }`;
      case "pending":
        return "Pending admin review";
      default:
        return blog.adminReview.status;
    }
  };

  // Permission checks
  const isAuthor = blog && currentUserId === (typeof blog.doctorId === "object" ? blog.doctorId._id : blog.doctorId);
  const isAdmin = userRole === "600" || userRole === "700";
  const isSuperAdmin = userRole === "700";

  // Edit permission logic
  const showEditOption = () => {
    // Author can always edit their own blog
    if (isAuthor) return true;
    
    // Admin can edit only in specific cases
    if (isAdmin) {
      // Admin can edit pending blogs for review
      if (blog?.adminReview?.status === "pending") return true;
      // Admin can edit rejected blogs
      if (blog?.status === "rejected") return true;
      // Super admin can edit published blogs for content moderation
      if (blog?.status === "published" && isSuperAdmin) return true;
    }
    
    return false;
  };

  const getEditButtonText = () => {
    if (isAuthor) return "Edit Blog";
    if (isAdmin && blog?.adminReview?.status === "pending") return "Review Blog";
    if (isAdmin && blog?.status === "rejected") return "Review & Edit";
    return "Edit";
  };

  // Delete permission logic
  const showDeleteOption = () => {
    // Author can delete their own unpublished blogs
    if (isAuthor) return true;
    
    // Admin can delete inappropriate content
    if (isAdmin) {
      // Admin can delete rejected blogs
      if (blog?.status === "rejected") return true;
      // Super admin can delete any blog
      if (isSuperAdmin) return true;
    }
    
    return false;
  };

  // Should show menu (edit/delete options)
  const shouldShowMenu = showEditOption() || showDeleteOption();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className={styles.notFoundContainer}>
        <h2>Blog not found</h2>
        <p>The blog you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate("/blog")}
          className={styles.backButton}
        >
          <ChevronLeft size={16} />
          Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Navigation */}
      <button onClick={() => navigate("/blog")} className={styles.backButton}>
        <ChevronLeft size={20} />
        Back to Blogs
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Deletion</h3>
            <p>You are deleting another doctor's blog. Please provide a reason:</p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion..."
              className={styles.reasonInput}
              rows={3}
              required
            />
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminDelete}
                disabled={!deleteReason.trim()}
                className={styles.confirmDeleteButton}
              >
                Delete Blog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Blog Status Badges */}
          <div className={styles.statusBadges}>
            {blog.isFeatured && (
              <span className={styles.featuredBadge}>Featured</span>
            )}

            <span className={`${styles.statusBadge} ${styles[blog.status]}`}>
              {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
            </span>

            {blog.adminReview?.status && (
              <span
                className={`${styles.reviewBadge} ${
                  styles[`review${blog.adminReview.status}`]
                }`}
              >
                {getStatusIcon()}
                {getStatusText()}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className={styles.title}>{blog.title}</h1>

          {/* Author Info */}
          <div className={styles.authorSection}>
            <div className={styles.authorInfo}>
              {blog.doctorId.profileImage && (
                <img
                  src={`${blogServiceUrl}/${blog.doctorId.profileImage}`}
                  alt={blog.doctorId.name}
                  className={styles.authorAvatar}
                />
              )}
              <div>
                <span className={styles.authorName}>
                  Dr. {blog.doctorId.name}
                </span>
                {blog.doctorId.specialty && (
                  <span className={styles.authorSpecialty}>
                    {blog.doctorId.specialty}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.headerActions}>
              <button className={styles.actionButton} onClick={handleShare}>
                <Share2 size={18} />
                Share
              </button>

              {/* <button className={styles.actionButton}>
                <Bookmark size={18} />
                Save
              </button> */}

              {shouldShowMenu && (
                <div className={styles.moreMenu}>
                  <button
                    className={styles.moreButton}
                    onClick={() => setShowMenu(!showMenu)}
                    onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {showMenu && (
                    <div className={styles.menuDropdown}>
                      {showEditOption() && (
                        <button
                          className={styles.menuItem}
                          onClick={() => navigate(`/blogs/edit/${id}`)}
                        >
                          <Edit size={16} />
                          {getEditButtonText()}
                        </button>
                      )}

                      {showDeleteOption() && (
                        <button
                          className={`${styles.menuItem} ${styles.deleteItem}`}
                          onClick={handleDeleteClick}
                        >
                          <Trash2 size={16} />
                          Delete Blog
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Blog Metadata */}
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <Calendar className={styles.metaIcon} />
              <span>{format(new Date(blog.createdAt), "MMMM dd, yyyy")}</span>
            </div>

            <div className={styles.metaItem}>
              <Eye className={styles.metaIcon} />
              <span>{blog.viewCount} views</span>
            </div>

            <button
              className={`${styles.likeButton} ${
                isLikedByCurrentDoctor ? styles.interactionButtonActive : ""
              }`}
              onClick={handleLike}
              disabled={liking || !token}
              title={!token ? "Login to like" : ""}
            >
              {liking ? (
                <div className={styles.submitSpinner} />
              ) : (
                <Heart
                  size={16}
                  className={`${styles.metaIcon} ${
                    isLikedByCurrentDoctor ? styles.likedHeart : ""
                  }`}
                />
              )}
              <span>{blog.likesCount} likes</span>
            </button>

            <button
              className={styles.commentToggle}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className={styles.metaIcon} />
              <span>{blog.commentsCount} comments</span>
            </button>
          </div>

          {/* Tags */}
          <div className={styles.tags}>
            {blog.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Content Section */}
      <main className={styles.mainContent}>
        {/* Image Gallery */}
        {blog.imageUrl.length > 0 && (
          <div className={styles.imageGallery}>
            {blog.imageUrl.map((url, index) => (
              <img
                key={index}
                src={`${blogServiceUrl}${url}`}
                alt={`Blog image ${index + 1}`}
                className={styles.blogImage}
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Blog Content */}
        <article
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Interactions Bar */}
        <div className={styles.interactionsBar}>
          <button
            className={`${styles.interactionButton} ${
              isLikedByCurrentDoctor ? styles.interactionButtonActive : ""
            }`}
            onClick={handleLike}
            disabled={liking || !token}
            title={!token ? "Login to like" : ""}
          >
            {liking ? (
              <div className={styles.submitSpinner} />
            ) : (
              <Heart
                size={20}
                className={isLikedByCurrentDoctor ? styles.likedHeart : ""}
              />
            )}
            <span>{isLikedByCurrentDoctor ? "Liked" : "Like"}</span>
          </button>

          <button
            className={styles.interactionButton}
            onClick={() => {
              setShowComments(true);
              document
                .getElementById("comments")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <MessageCircle size={20} />
            <span>Comment</span>
          </button>

          <button className={styles.interactionButton} onClick={handleShare}>
            <Share2 size={20} />
            <span>Share</span>
          </button>
        </div>

        {/* Comments Section */}
        <section id="comments" className={styles.commentsSection}>
          <div className={styles.commentsHeader}>
            <h2 className={styles.commentsTitle}>
              Comments ({blog.commentsCount})
            </h2>
            <button
              className={styles.toggleCommentsButton}
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? "Hide" : "Show"} Comments
            </button>
          </div>

          {showComments && (
            <>
              {/* Add Comment Form - only for authenticated users */}
              {token ? (
                <form
                  onSubmit={handleCommentSubmit}
                  className={styles.commentForm}
                >
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={styles.commentInput}
                    rows={3}
                    required
                  />
                  <div className={styles.commentFormActions}>
                    <button
                      type="submit"
                      disabled={submittingComment || !comment.trim()}
                      className={styles.submitCommentButton}
                    >
                      {submittingComment ? (
                        <>
                          <div className={styles.submitSpinner}></div>
                          Posting...
                        </>
                      ) : (
                        "Post Comment"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.loginPrompt}>
                  <p>Please log in to leave a comment.</p>
                  <button 
                    onClick={() => navigate("/login")}
                    className={styles.loginButton}
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* Comments List */}
              <CommentSection
                comments={blog.comments}
                blogId={blog._id}
                onCommentAdded={fetchBlog}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default BlogDetail;