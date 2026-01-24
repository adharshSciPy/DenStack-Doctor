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

interface ApiResponse {
  success: boolean;
  blogs: Blog[];
  total: number;
}

export function MyBlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [stats, setStats] = useState<BlogStats | null>(null);

  // Calculate local stats from blogs
  const calculateStats = (blogList: Blog[]) => {
    const stats: BlogStats = {
      totalBlogs: blogList.length,
      draftBlogs: blogList.filter(b => b.status === 'draft').length,
      rejectedBlogs: blogList.filter(b => b.status === 'rejected').length,
      totalLikes: blogList.reduce((sum, blog) => sum + (blog.likesCount || 0), 0),
      totalViews: blogList.reduce((sum, blog) => sum + (blog.viewCount || 0), 0),
      featuredBlogs: blogList.filter(b => b.isFeatured).length
    };
    return stats;
  };

  // Sort blogs locally
  const sortBlogs = (blogList: Blog[], sortBy: string, sortOrder: string) => {
    return [...blogList].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'likesCount':
          aValue = a.likesCount || 0;
          bValue = b.likesCount || 0;
          break;
        case 'viewCount':
          aValue = a.viewCount || 0;
          bValue = b.viewCount || 0;
          break;
        case 'commentsCount':
          aValue = a.commentsCount || 0;
          bValue = b.commentsCount || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Filter blogs locally
  const filterBlogs = (blogList: Blog[], searchTerm: string, statusFilter: string, selectedTags: string[]) => {
    let filtered = blogList;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(blog => blog.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(blog => 
        blog.title.toLowerCase().includes(searchLower) ||
        blog.content.toLowerCase().includes(searchLower) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        blog.doctorId.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(blog =>
        selectedTags.every(tag => blog.tags.includes(tag))
      );
    }
    
    return filtered;
  };

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");
      setLoading(true);
      
      // Get all blogs for the current doctor
      const response = await axios.get(
        `${blogServiceUrl}/api/v1/blog/my-blogs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        const allBlogs: Blog[] = response.data.blogs;
        const totalCount = response.data.total;
        
        // Apply local filters and sorting
        let filteredBlogs = filterBlogs(allBlogs, searchTerm, statusFilter, selectedTags);
        filteredBlogs = sortBlogs(filteredBlogs, sortBy, sortOrder);
        
        // Calculate pagination
        const itemsPerPage = 12;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);
        
        // Calculate local stats
        const localStats = calculateStats(allBlogs);
        
        // Update state
        setBlogs(paginatedBlogs);
        setTotalBlogs(filteredBlogs.length);
        setTotalPages(Math.ceil(filteredBlogs.length / itemsPerPage));
        setStats(localStats);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      alert("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, statusFilter, sortBy, sortOrder, searchTerm, selectedTags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchBlogs();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page when tags change
  };

  const handleLike = async (blogId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${blogServiceUrl}/api/v1/blog/like/${blogId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchBlogs(); // Refresh the list
    } catch (error) {
      console.error("Error liking blog:", error);
      alert("Failed to like blog");
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
          <h1 className={styles.title}>My Medical Blogs</h1>
          <p className={styles.subtitle}>
            Manage and track all your published medical insights
          </p>
        </div>

        {/* Stats Bar */}
        
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
              placeholder="Search in your blogs..."
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="createdAt">Date</option>
              <option value="likesCount">Likes</option>
              <option value="viewCount">Views</option>
              <option value="commentsCount">Comments</option>
            </select>

            <button
              onClick={() => {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                setCurrentPage(1);
              }}
              className={styles.sortButton}
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/blogs/create")}
              className={styles.createButton}
            >
              + Create New Blog
            </button>
          </div>
        </div>

        {/* Tags Filter */}
        <div className={styles.tagsContainer}>
          <span className={styles.tagsLabel}>Filter by tags:</span>
          <div className={styles.tagsList}>
            {["Research", "Clinical", "Case Study", "Education", "Technology", "Wellness"]
              .map((tag) => (
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

      

      {/* Main Blog Grid */}
      <section className={styles.blogGridSection}>
        <div className={styles.blogGrid}>
          {blogs?.map((blog) => (
            <BlogCard
              key={blog._id}
              blog={blog}
              onLike={handleLike}
              onView={() => navigate(`/blogs/${blog._id}`)}
              // onEdit={() => navigate(`/blogs/edit/${blog._id}`)}
              // showActions={true}
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
      {blogs.length === 0 && !loading && (
        <div className={styles.noResults}>
          <Filter className={styles.noResultsIcon} />
          <h3>No blogs found</h3>
          <p>Try adjusting your filters or create a new blog</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedTags([]);
              setStatusFilter("all");
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

export default MyBlogList;