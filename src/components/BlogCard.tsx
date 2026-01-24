import React from "react";
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import styles from "../styles/BlogCard.module.css";
import blogServiceUrl from "../blogServiceUrl";

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
  createdAt: string;
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
  doctor: Doctor;
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

interface BlogCardProps {
  blog: Blog;
  onLike: (blogId: string) => void;
  onView: () => void;
  isLiking?: boolean; // Add this prop
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onLike, onView, isLiking = false }) => {
  const getStatusIcon = () => {
    switch (blog.status) {
      case "published":
        return <CheckCircle className={styles.statusIconPublished} />;
      case "draft":
        return <Clock className={styles.statusIconDraft} />;
      case "rejected":
        return <XCircle className={styles.statusIconRejected} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (blog.status) {
      case "published":
        return blog.adminReview?.status === "approved"
          ? "Approved"
          : "Published";
      case "draft":
        return "Draft";
      case "rejected":
        return "Rejected";
      default:
        return blog.status;
    }
  };
  
  const getText = (html: string) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";

  return (
    <article className={styles.card}>
      {/* Featured Badge */}
      {blog.isFeatured && <div className={styles.featuredBadge}>Featured</div>}

      {/* Status Indicator */}
      <div
        className={`${styles.statusBadge} ${
          styles[
            `status${
              blog?.status?.charAt(0).toUpperCase() + blog?.status?.slice(1)
            }`
          ]
        }`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Image */}
      {blog.imageUrl[0] && (
        <div className={styles.imageContainer}>
          <img
            src={`${blogServiceUrl}${blog.imageUrl[0]}`}
            alt={blog.title}
            className={styles.image}
            onClick={onView}
          />
          <div className={styles.imageOverlay}>
            <button className={styles.viewButton} onClick={onView}>
              Read Article
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {/* Doctor Info */}
        <div className={styles.doctorInfo}>
          {blog.doctorId.profileImage && (
            <img
              src={blog.doctorId.profileImage}
              alt={blog.doctorId.name}
              className={styles.avatar}
            />
          )}
          <div>
            <span className={styles.doctorName}>Dr. {blog.doctor?.name}</span>
            {blog.doctorId.specialty && (
              <span className={styles.specialty}>
                {blog.doctorId.specialty}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={styles.title} onClick={onView}>
          {blog.title}
        </h3>

        {/* Excerpt */}
        <span className={styles.excerpt}>
          {getText(blog.content).substring(0, 120)}...
        </span>

        {/* Tags */}
        <div className={styles.tags}>
          {blog?.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
          {blog?.tags?.length > 3 && (
            <span className={styles.moreTags}>
              +{blog.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Metadata */}
        {/* <div className={styles.metadata}>
          <div className={styles.metaItem}>
            <Calendar className={styles.metaIcon} />
            <span>{format(new Date(blog.createdAt), "MMM dd, yyyy")}</span>
          </div>

          <div className={styles.metaItem}>
            <Eye className={styles.metaIcon} />
            <span>{blog.viewCount}</span>
          </div>

          <button
            className={`${styles.likeButton} ${
              blog.isLiked ? styles.liked : ""
            } ${isLiking ? styles.liking : ""}`}
            onClick={() => onLike(blog._id)}
            disabled={isLiking}
          >
            {isLiking ? (
              <Loader2 className={`${styles.metaIcon} ${styles.spinner}`} />
            ) : (
              <Heart className={styles.metaIcon} />
            )}
            <span>{blog.likesCount}</span>
          </button>

          <div className={styles.metaItem}>
            <MessageCircle className={styles.metaIcon} />
            <span>{blog.commentsCount}</span>
          </div>
        </div> */}

        {/* Admin Review Status (for admins) */}
        {blog.adminReview?.status && (
          <div className={styles.reviewStatus}>
            <span className={styles.reviewLabel}>Review:</span>
            <span
              className={`${styles.reviewValue} ${
                styles[
                  `review${
                    blog.adminReview.status.charAt(0).toUpperCase() +
                    blog.adminReview.status.slice(1)
                  }`
                ]
              }`}
            >
              {blog.adminReview.status}
            </span>
            {blog.adminReview.reviewedBy && (
              <span className={styles.reviewer}>
                by {blog.adminReview.reviewedBy.name}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default BlogCard;