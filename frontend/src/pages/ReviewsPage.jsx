import React, { useState } from 'react';
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

// ----------------------------------------------------------------------
// 🚨 [임시 데이터] 백엔드 연동 전 화면 테스트를 위해 내부에 정의했습니다.
// ----------------------------------------------------------------------
const MOCK_COURSES = [
  { id: 1, name: '자료구조', professor: '김철수', credit: 3, type: 'major', courseType: '전공필수' },
  { id: 2, name: '알고리즘', professor: '이영희', credit: 3, type: 'major', courseType: '전공선택' },
  { id: 3, name: '운영체제', professor: '박민수', credit: 3, type: 'major', courseType: '전공필수' },
  { id: 4, name: '심리학의 이해', professor: '정수진', credit: 2, type: 'general', category: '사회' },
  { id: 5, name: '대학 글쓰기', professor: '최지훈', credit: 2, type: 'general', category: '글쓰기' },
];

const MOCK_REVIEWS = [
  {
    id: 'R1',
    courseId: 1,
    userId: 'user1',
    userName: '익명1',
    semester: '2025-2학기',
    rating: 4,
    content: '교수님 설명이 정말 좋으십니다. 과제는 좀 많아요.',
    likes: 5,
    likedByUser: false,
    createdAt: '2026-01-10',
  },
  {
    id: 'R2',
    courseId: 1,
    userId: 'user2',
    userName: '익명2',
    semester: '2025-1학기',
    rating: 5,
    content: '학점 잘 주십니다. 갓철수!',
    likes: 12,
    likedByUser: true,
    createdAt: '2025-06-20',
  },
];

const MOCK_COMMENTS = [
  { id: 'C1', reviewId: 'R1', userName: '익명3', content: '과제 난이도는 어떤가요?', createdAt: '2026-01-11' },
];
// ----------------------------------------------------------------------

export function ReviewsPage({ user, onBack }) {
  // 1. 상태 관리 (누락된 State들 추가함)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [comments, setComments] = useState(MOCK_COMMENTS);

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [showCommentsForReview, setShowCommentsForReview] = useState(null);
  const [newComment, setNewComment] = useState({}); // { [reviewId]: string }

  // 새 리뷰 작성 폼 상태
  const [newReview, setNewReview] = useState({
    rating: 5,
    semester: '',
    content: '',
    assignmentAmount: 'medium',
    teamProject: 'few',
    grading: 'normal',
    attendance: 'direct',
    examCount: 2,
  });

  // 2. 데이터 필터링 로직
  const filteredCourses = MOCK_COURSES.filter(
      (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.professor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCourse = selectedCourseId
      ? MOCK_COURSES.find((c) => c.id === selectedCourseId)
      : null;

  const courseReviews = selectedCourseId
      ? reviews.filter((r) => r.courseId === selectedCourseId)
      : [];

  const averageRating =
      courseReviews.length > 0
          ? (
              courseReviews.reduce((sum, r) => sum + r.rating, 0) /
              courseReviews.length
          ).toFixed(1)
          : '0.0';

  // 3. 핸들러 함수들
  const handleSubmitReview = () => {
    if (!selectedCourse || !newReview.content.trim() || !newReview.semester) {
      alert('필수 항목(학기, 내용)을 입력해주세요.');
      return;
    }

    const reviewToAdd = {
      id: `R${Date.now()}`,
      courseId: selectedCourse.id,
      userId: user?.id || 'anonymous',
      userName: '나(익명)', // 실제로는 user.nickname 등을 사용
      rating: newReview.rating,
      semester: newReview.semester,
      content: newReview.content,
      likes: 0,
      likedByUser: false,
      createdAt: new Date().toISOString().split('T')[0],
      ...newReview // 나머지 필드들 포함
    };

    setReviews((prev) => [reviewToAdd, ...prev]);
    alert('강의평이 등록되었습니다!');
    setShowWriteReview(false);

    // 폼 초기화
    setNewReview({
      rating: 5, semester: '', content: '', assignmentAmount: 'medium',
      teamProject: 'few', grading: 'normal', attendance: 'direct', examCount: 2,
    });
  };

  const handleLikeReview = (reviewId) => {
    setReviews((prev) =>
        prev.map((r) =>
            r.id === reviewId
                ? { ...r, likes: r.likedByUser ? r.likes - 1 : r.likes + 1, likedByUser: !r.likedByUser }
                : r
        )
    );
  };

  const handleAddComment = (reviewId) => {
    if (!newComment[reviewId]?.trim()) return;

    const newCommentObj = {
      id: `C${Date.now()}`,
      reviewId,
      userName: '나(익명)',
      content: newComment[reviewId],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setComments((prev) => [...prev, newCommentObj]);
    setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
  };

  // 별점 렌더링 헬퍼
  const renderStars = (rating, interactive = false, onRate) => (
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

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  강의평 조회
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.university} · {user?.department}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* [왼쪽] 강의 검색 및 목록 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[80vh] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">강의 검색</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="강의명 또는 교수명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredCourses.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
                ) : (
                    filteredCourses.map((course) => {
                      const rvs = reviews.filter((r) => r.courseId === course.id);
                      const avg = rvs.length > 0
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
                                <p className="text-sm text-gray-600">{course.professor} · {course.credit}학점</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                  course.type === 'major' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                          {course.type === 'major' ? course.courseType : course.category}
                        </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{avg}</span>
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

            {/* [오른쪽] 강의평 상세 및 작성 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[80vh] overflow-y-auto">
              {!selectedCourse ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="size-16 mb-4 text-gray-300" />
                    <p>강의를 선택하면 강의평을 확인할 수 있습니다.</p>
                  </div>
              ) : (
                  <div>
                    {/* 선택된 강의 헤더 */}
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
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                      >
                        {showWriteReview ? "작성 취소" : "이 강의 평가하기 ✍️"}
                      </button>
                    </div>

                    {/* 작성 폼 */}
                    {showWriteReview && (
                        <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
                          <h3 className="font-bold text-lg mb-4">강의평 작성</h3>
                          <div className="space-y-4">
                            {/* 별점 */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">총점</label>
                              {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                            </div>

                            {/* 학기 선택 */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">수강 학기</label>
                              <select
                                  value={newReview.semester}
                                  onChange={(e) => setNewReview({ ...newReview, semester: e.target.value })}
                                  className="w-full p-2 border rounded-lg"
                              >
                                <option value="">선택해주세요</option>
                                <option value="2025-2학기">2025-2학기</option>
                                <option value="2025-1학기">2025-1학기</option>
                                <option value="2024-2학기">2024-2학기</option>
                              </select>
                            </div>

                            {/* 텍스트 리뷰 */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">상세 후기</label>
                              <textarea
                                  value={newReview.content}
                                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                  placeholder="과제량, 시험 난이도, 교수님 스타일 등 솔직한 후기를 남겨주세요."
                                  rows={4}
                                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>

                            <button onClick={handleSubmitReview} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                              작성 완료
                            </button>
                          </div>
                        </div>
                    )}

                    {/* 리뷰 목록 */}
                    <div className="space-y-4">
                      {courseReviews.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">아직 등록된 강의평이 없습니다.<br/>첫 번째 평가자가 되어보세요!</p>
                          </div>
                      ) : (
                          courseReviews.map((review) => {
                            const isExpanded = expandedReviewId === review.id;
                            const isLong = review.content.length > 80;

                            return (
                                <div key={review.id} className="p-5 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{review.userName}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{review.semester}</span>
                                      </div>
                                      <div className="mt-1">{renderStars(review.rating)}</div>
                                    </div>
                                    <span className="text-xs text-gray-400">{review.createdAt}</span>
                                  </div>

                                  <div className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                                    {isLong && !isExpanded ? `${review.content.slice(0, 80)}...` : review.content}
                                    {isLong && (
                                        <button
                                            onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                                            className="text-blue-600 text-sm font-bold ml-1 hover:underline"
                                        >
                                          {isExpanded ? "접기" : "더보기"}
                                        </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm border-t pt-3 mt-3">
                                    <button
                                        onClick={() => handleLikeReview(review.id)}
                                        className={`flex items-center gap-1 ${review.likedByUser ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600'}`}
                                    >
                                      <ThumbsUp className={`size-4 ${review.likedByUser ? 'fill-blue-600' : ''}`} />
                                      도움돼요 {review.likes}
                                    </button>
                                    <button
                                        onClick={() => setShowCommentsForReview(showCommentsForReview === review.id ? null : review.id)}
                                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                                    >
                                      <MessageSquare className="size-4" />
                                      댓글 {comments.filter(c => c.reviewId === review.id).length}
                                    </button>
                                  </div>

                                  {/* 댓글창 */}
                                  {showCommentsForReview === review.id && (
                                      <div className="mt-3 bg-gray-50 p-3 rounded-lg animate-fade-in">
                                        <div className="space-y-2 mb-3">
                                          {comments.filter(c => c.reviewId === review.id).map(comment => (
                                              <div key={comment.id} className="bg-white p-2 rounded border border-gray-100 text-sm">
                                                <span className="font-bold mr-2">{comment.userName}</span>
                                                <span className="text-gray-600">{comment.content}</span>
                                              </div>
                                          ))}
                                        </div>
                                        <div className="flex gap-2">
                                          <input
                                              type="text"
                                              placeholder="댓글 달기..."
                                              value={newComment[review.id] || ''}
                                              onChange={(e) => setNewComment({ ...newComment, [review.id]: e.target.value })}
                                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(review.id)}
                                              className="flex-1 px-3 py-2 text-sm border rounded"
                                          />
                                          <button onClick={() => handleAddComment(review.id)} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">
                                            <Send className="size-4"/>
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