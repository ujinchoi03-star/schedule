import { useState } from 'react';
import { mockCourses } from '../data/mockCourses';
import { mockReviews, mockComments } from '../data/mockReviews.js';
import {
  ArrowLeft,
  Search,
  Star,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';

export function ReviewsPage({ user, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  const [newReview, setNewReview] = useState({
    rating: 5,
    semester: '',
    content: '',
    assignmentAmount: 'medium', // 'low' | 'medium' | 'high'
    teamProject: 'few', // 'none' | 'few' | 'many'
    grading: 'normal', // 'generous' | 'normal' | 'strict'
    attendance: 'direct', // 'none' | 'direct' | 'electronic' | 'assignment'
    examCount: 2, // 0 | 1 | 2 | 3
  });

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [reviews, setReviews] = useState(mockReviews);
  const [comments, setComments] = useState(mockComments);
  const [showCommentsForReview, setShowCommentsForReview] = useState(null);
  const [newComment, setNewComment] = useState({}); // { [reviewId]: string }

  // 검색된 강의 목록
  const filteredCourses = mockCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 강의 정보
  const selectedCourse = selectedCourseId
    ? mockCourses.find((c) => c.id === selectedCourseId)
    : null;

  // 선택된 강의의 리뷰들
  const courseReviews = selectedCourseId
    ? reviews.filter((r) => r.courseId === selectedCourseId)
    : [];

  // 평균 평점 계산
  const averageRating =
    courseReviews.length > 0
      ? (
          courseReviews.reduce((sum, r) => sum + r.rating, 0) /
          courseReviews.length
        ).toFixed(1)
      : '0.0';

  const handleSubmitReview = () => {
    if (!selectedCourse || !newReview.content.trim() || !newReview.semester) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    // 실제로는 서버 저장
    // 여기서는 더미로 리스트에 추가도 해줌(바로 화면 반영)
    const createdAt = new Date().toISOString().split('T')[0];

    const reviewToAdd = {
      id: `R${Date.now()}`,
      courseId: selectedCourse.id,
      userId: user?.id || 'anonymous',
      userName: user?.name || '익명',
      rating: newReview.rating,
      semester: newReview.semester,
      content: newReview.content,
      assignmentAmount: newReview.assignmentAmount,
      teamProject: newReview.teamProject,
      grading: newReview.grading,
      attendance: newReview.attendance,
      examCount: newReview.examCount,
      likes: 0,
      likedByUser: false,
      createdAt,
    };

    setReviews((prev) => [reviewToAdd, ...prev]);

    alert('강의평이 작성되었습니다!');
    setShowWriteReview(false);
    setNewReview({
      rating: 5,
      semester: '',
      content: '',
      assignmentAmount: 'medium',
      teamProject: 'few',
      grading: 'normal',
      attendance: 'direct',
      examCount: 2,
    });
  };

  const handleLikeReview = (reviewId) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id === reviewId) {
          const isLiked = review.likedByUser;
          return {
            ...review,
            likes: isLiked ? review.likes - 1 : review.likes + 1,
            likedByUser: !isLiked,
          };
        }
        return review;
      })
    );
  };

  const handleAddComment = (reviewId) => {
    if (!newComment[reviewId]?.trim()) return;

    const newCommentObj = {
      id: `C${Date.now()}`,
      reviewId,
      userId: user?.id || 'anonymous',
      userName: user?.name || '익명',
      content: newComment[reviewId],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setComments((prev) => [...prev, newCommentObj]);
    setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
  };

  const renderStars = (rating, interactive = false, onRate) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                강의평 조회
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.name}님 · {user?.university} · {user?.department}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 강의 검색 및 목록 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">강의 검색</h2>

            {/* 검색 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="강의명 또는 교수명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 강의 목록 */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
              ) : (
                filteredCourses.map((course) => {
                  const rvs = reviews.filter((r) => r.courseId === course.id);
                  const avgRating =
                    rvs.length > 0
                      ? (rvs.reduce((sum, r) => sum + r.rating, 0) / rvs.length).toFixed(1)
                      : 'N/A';

                  return (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowWriteReview(false);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedCourseId === course.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{course.name}</h3>
                          <p className="text-sm text-gray-600">
                            {course.professor} · {course.credit}학점
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            course.type === 'major'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {course.type === 'major' ? course.courseType : course.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{avgRating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageSquare className="size-4" />
                          <span>{rvs.length}개</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 오른쪽: 강의평 상세 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!selectedCourse ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="size-16 mb-4 text-gray-300" />
                <p>강의를 선택하면 강의평을 확인할 수 있습니다.</p>
              </div>
            ) : (
              <div>
                {/* 강의 정보 */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCourse.name}</h2>
                  <p className="text-gray-600 mb-4">{selectedCourse.professor} 교수님</p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {renderStars(parseFloat(averageRating))}
                      <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                    </div>
                    <span className="text-gray-500">({courseReviews.length}개의 강의평)</span>
                  </div>

                  <button
                    onClick={() => setShowWriteReview((v) => !v)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    강의평 작성하기
                  </button>
                </div>

                {/* 강의평 작성 폼 */}
                {showWriteReview && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-[600px] overflow-y-auto">
                    <h3 className="font-semibold mb-4">강의평 작성</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                        {renderStars(newReview.rating, true, (rating) =>
                          setNewReview({ ...newReview, rating })
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">수강 학기</label>
                        <select
                          value={newReview.semester}
                          onChange={(e) => setNewReview({ ...newReview, semester: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">학기 선택</option>
                          <option value="2026-1학기">2026-1학기</option>
                          <option value="2025-2학기">2025-2학기</option>
                          <option value="2025-1학기">2025-1학기</option>
                          <option value="2024-2학기">2024-2학기</option>
                          <option value="2024-1학기">2024-1학기</option>
                          <option value="2023-2학기">2023-2학기</option>
                          <option value="2023-1학기">2023-1학기</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">과제량</label>
                          <select
                            value={newReview.assignmentAmount}
                            onChange={(e) =>
                              setNewReview({ ...newReview, assignmentAmount: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="low">적음</option>
                            <option value="medium">보통</option>
                            <option value="high">많음</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">조모임</label>
                          <select
                            value={newReview.teamProject}
                            onChange={(e) => setNewReview({ ...newReview, teamProject: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="none">없음</option>
                            <option value="few">보통</option>
                            <option value="many">많음</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">성적</label>
                          <select
                            value={newReview.grading}
                            onChange={(e) => setNewReview({ ...newReview, grading: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="generous">너그러움</option>
                            <option value="normal">보통</option>
                            <option value="strict">깐깐함</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">출석</label>
                          <select
                            value={newReview.attendance}
                            onChange={(e) => setNewReview({ ...newReview, attendance: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="none">미체크</option>
                            <option value="direct">직접호명</option>
                            <option value="electronic">전자출결</option>
                            <option value="assignment">과제</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">시험 횟수</label>
                        <select
                          value={newReview.examCount}
                          onChange={(e) =>
                            setNewReview({ ...newReview, examCount: parseInt(e.target.value, 10) })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>없음</option>
                          <option value={1}>1회 (중간 또는 기말)</option>
                          <option value={2}>2회 (중간 + 기말)</option>
                          <option value={3}>3회 이상</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">강의평</label>
                        <textarea
                          placeholder="강의에 대한 솔직한 후기를 작성해주세요."
                          value={newReview.content}
                          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSubmitReview}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          작성 완료
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWriteReview(false);
                            setNewReview({
                              rating: 5,
                              semester: '',
                              content: '',
                              assignmentAmount: 'medium',
                              teamProject: 'few',
                              grading: 'normal',
                              attendance: 'direct',
                              examCount: 2,
                            });
                          }}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 강의평 목록 */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {courseReviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">아직 작성된 강의평이 없습니다.</p>
                  ) : (
                    courseReviews.map((review) => {
                      const isExpanded = expandedReviewId === review.id;
                      const shouldTruncate = review.content.length > 100;

                      return (
                        <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{review.userName}</span>
                                <span className="text-xs text-gray-500">{review.semester}</span>
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-xs text-gray-500">{review.createdAt}</span>
                          </div>

                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                            {shouldTruncate && !isExpanded
                              ? `${review.content.slice(0, 100)}...`
                              : review.content}
                          </p>

                          {shouldTruncate && (
                            <button
                              onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
                            >
                              {isExpanded ? (
                                <>
                                  접기 <ChevronUp className="size-4" />
                                </>
                              ) : (
                                <>
                                  더보기 <ChevronDown className="size-4" />
                                </>
                              )}
                            </button>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <button
                              onClick={() => handleLikeReview(review.id)}
                              className={`flex items-center gap-1 transition-colors ${
                                review.likedByUser
                                  ? 'text-blue-600'
                                  : 'text-gray-500 hover:text-blue-600'
                              }`}
                            >
                              <ThumbsUp className={`size-4 ${review.likedByUser ? 'fill-blue-600' : ''}`} />
                              <span>{review.likes}</span>
                            </button>

                            <button
                              onClick={() =>
                                setShowCommentsForReview(showCommentsForReview === review.id ? null : review.id)
                              }
                              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <MessageSquare className="size-4" />
                              <span>{comments.filter((c) => c.reviewId === review.id).length}</span>
                            </button>
                          </div>

                          {/* 댓글 섹션 */}
                          {showCommentsForReview === review.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="space-y-2 mb-3">
                                {comments.filter((comment) => comment.reviewId === review.id).length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-2">아직 댓글이 없습니다.</p>
                                ) : (
                                  comments
                                    .filter((comment) => comment.reviewId === review.id)
                                    .map((comment) => (
                                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                                          <span className="text-xs text-gray-500">{comment.createdAt}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{comment.content}</p>
                                      </div>
                                    ))
                                )}
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="댓글을 입력하세요..."
                                  value={newComment[review.id] || ''}
                                  onChange={(e) =>
                                    setNewComment((prev) => ({ ...prev, [review.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(review.id);
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => handleAddComment(review.id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                  <Send className="size-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
