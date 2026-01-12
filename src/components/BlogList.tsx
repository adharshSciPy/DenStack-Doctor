import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Filter,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import BlogCard from "./BlogCard";
import styles from "../styles/BlogList.module.css";
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

interface BlogStats {
  totalBlogs?: number;
  publishedBlogs?: number;
  rejectedBlogs?: number;
  draftBlogs?: number;
  totalLikes?: number;
  totalViews?: number;
  pendingReview?: number;
  approvedBlogs?: number;
  featuredBlogs?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function BlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("published");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [userRole, setUserRole] = useState<string>("doctor");
  const [liking, setLiking] = useState<string | null>(null); // Track which blog is being liked

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
      };

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(",");
      }

      const response = await axios.get(
        `${blogServiceUrl}/api/v1/blog/other-blogs`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle response based on structure
      if (response.data && response.data.blogs && Array.isArray(response.data.blogs)) {
        setBlogs(response.data.blogs);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
          setTotalPages(response.data.pagination.totalPages);
        }
      } else {
        // Fallback for different response structure
        setBlogs([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalBlogs: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
        setTotalPages(1);
      }

    } catch (error: any) {
      console.error("Error fetching blogs:", error.message);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // const fetchStats = async () => {
  //   try {
  //     const response = await fetch('/api/blogs/stats');
  //     const data: BlogStats = await response.json();
  //     setStats(data);
  //   } catch (error) {
  //     console.error('Error fetching stats:', error);
  //   }
  // };

  useEffect(() => {
    fetchBlogs();
    // fetchStats();
  }, [currentPage, statusFilter, sortBy, sortOrder, selectedTags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlogs();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLike = async (blogId: string) => {
    if (liking === blogId) return; // Prevent double-click

    try {
      setLiking(blogId);
      const token = localStorage.getItem("authToken");

      // Optimistically update the UI
      const blogToUpdate = blogs.find(blog => blog._id === blogId);
      if (!blogToUpdate) return;

      const wasLiked = blogToUpdate.isLiked;
      const newLikesCount = wasLiked
        ? blogToUpdate.likesCount - 1
        : blogToUpdate.likesCount + 1;

      // Update the local state optimistically
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog._id === blogId 
            ? { 
                ...blog, 
                isLiked: !wasLiked, 
                likesCount: newLikesCount 
              } 
            : blog
        )
      );

      // Send the API request
      const response = await axios.post(
        `${blogServiceUrl}/api/v1/blog/like/${blogId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the data if needed (or just trust the optimistic update)
      if (response.status === 200) {
        // Optional: Refetch to ensure data is in sync
        // await fetchBlogs();
      }
    } catch (error) {
      console.error("Error liking blog:", error);
      
      // Revert optimistic update on error
      const blogToUpdate = blogs.find(blog => blog._id === blogId);
      if (blogToUpdate) {
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog._id === blogId 
              ? { 
                  ...blog, 
                  isLiked: blogToUpdate.isLiked, 
                  likesCount: blogToUpdate.likesCount 
                } 
              : blog
          )
        );
      }
    } finally {
      setLiking(null);
    }
  };

  const getText = (html: string) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading blogs...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Medical Blogs</h1>
          <p className={styles.subtitle}>
            Insights, research, and discussions from healthcare professionals
          </p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <TrendingUp className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>
                  {stats.totalBlogs || 0}
                </span>
                <span className={styles.statLabel}>Total Blogs</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Eye className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>
                  {stats.totalViews || 0}
                </span>
                <span className={styles.statLabel}>Total Views</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Heart className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>
                  {stats.totalLikes || 0}
                </span>
                <span className={styles.statLabel}>Total Likes</span>
              </div>
            </div>
            {userRole === "600" && stats.pendingReview && (
              <div className={styles.statItem}>
                <Clock className={styles.statIcon} />
                <div>
                  <span className={styles.statValue}>
                    {stats.pendingReview}
                  </span>
                  <span className={styles.statLabel}>Pending Review</span>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Controls Section */}
      <div className={styles.controls}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search blogs, tags, or doctors..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </div>
        </form>

        {/* Filters and Actions */}
        <div className={styles.actionsRow}>
          <div className={styles.filters}>
            {/* <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              {userRole === "admin" && (
                <option value="pending">Pending Review</option>
              )}
              {userRole === "admin" && (
                <option value="rejected">Rejected</option>
              )}
              <option value="all">All</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="createdAt">Date</option>
              <option value="likesCount">Likes</option>
              <option value="viewCount">Views</option>
              <option value="commentsCount">Comments</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className={styles.sortButton}
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button> */}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/blogs/create")}
              className={styles.createButton}
            >
              + Create Blog
            </button>
            <button
              onClick={() => navigate("/myblogs")}
              className={styles.myblog}
            >
              My Blogs
            </button>
          </div>
        </div>

        {/* Tags Filter */}
        <div className={styles.tagsContainer}>
          <span className={styles.tagsLabel}>Filter by tags:</span>
          <div className={styles.tagsList}>
            {[
              "Research",
              "Clinical",
              "Case Study",
              "Education",
              "Technology",
              "Wellness",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`${styles.tag} ${
                  selectedTags.includes(tag) ? styles.tagActive : ""
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Blogs Section */}
      {blogs.filter((b) => b.isFeatured).length > 0 && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Articles</h2>
          <div className={styles.featuredGrid}>
            {blogs
              .filter((blog) => blog.isFeatured)
              .slice(0, 2)
              .map((blog) => (
                <div key={blog._id} className={styles.featuredCard}>
                  {blog.imageUrl[0] && (
                    <img
                      src={`${blogServiceUrl}${blog.imageUrl[0]}`}
                      alt={blog.title}
                      className={styles.featuredImage}
                    />
                  )}
                  <div className={styles.featuredContent}>
                    <div className={styles.featuredBadge}>Featured</div>
                    <h3 className={styles.featuredTitle}>{blog.title}</h3>
                    <span className={styles.excerpt}>
                      {getText(blog?.content).substring(0, 120)}...
                    </span>

                    <div className={styles.featuredMeta}>
                      <span className={styles.author}>
                        Dr. {blog.doctorId.name}
                      </span>
                      <span className={styles.date}>
                        {format(new Date(blog.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Main Blog Grid */}
      <section className={styles.blogGridSection}>
        <div className={styles.blogGrid}>
          {blogs.map((blog) => (
            <BlogCard
              key={blog._id}
              blog={blog}
              onLike={() => handleLike(blog._id)}
              onView={() => navigate(`/blogs/${blog._id}`)}
              isLiking={liking === blog._id}
            />
          ))}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`${styles.pageButton} ${
                    currentPage === pageNum ? styles.pageButtonActive : ""
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* No Results */}
      {blogs.length === 0 && (
        <div className={styles.noResults}>
          <Filter className={styles.noResultsIcon} />
          <h3>No blogs found</h3>
          <p>Try adjusting your filters or create a new blog</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedTags([]);
              setStatusFilter("published");
              setCurrentPage(1);
            }}
            className={styles.clearFiltersButton}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

export default BlogList;