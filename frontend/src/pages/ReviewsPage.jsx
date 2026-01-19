import { useMemo, useState, useEffect } from 'react';
import { mockComments } from '../data/mockReviews.js';
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
  // ✅ 강의 목록(서버에서 받아옴)
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [summaryMap, setSummaryMap] = useState({}); // { [courseId]: { count, averageRating } }

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

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [commentsByReview, setCommentsByReview] = useState({}); // { [reviewId]: [...comments] }
  const [showCommentsForReview, setShowCommentsForReview] = useState(null);
  const [newComment, setNewComment] = useState({}); // { [reviewId]: string }
  const [summary, setSummary] = useState({ count: 0, averageRating: 0.0 });
  const [userLikes, setUserLikes] = useState({}); // { [reviewId]: boolean } - 사용자가 좋아요했는지 여부

  // ✅ 유저 학교(한글) -> 강의 DB의 코드(HANYANG/KOREA)로 매핑
  const uniCode = useMemo(() => {
    const u = user?.university || '';
    if (u.includes('한양')) return 'HANYANG';
    if (u.includes('고려')) return 'KOREA';
    return null;
  }, [user?.university]);

  // ✅ 강의 목록 불러오기
  const loadCourses = async () => {
    if (!uniCode) return;
    try {
      setLoadingCourses(true);
      setCoursesError('');
      const res = await fetch(
        `http://localhost:8080/api/lectures?university=${encodeURIComponent(uniCode)}`
      );
      if (!res.ok) throw new Error('강의 목록을 불러오지 못했습니다.');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      setCourses([]);
      setCoursesError(e?.message || '강의 목록 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [uniCode]);

  useEffect(() => {
    if (!uniCode) return;

    fetch(`http://localhost:8080/api/reviews/summary/all?university=${encodeURIComponent(uniCode)}`)
      .then((res) => res.json())
      .then((rows) => {
        const map = {};
        (Array.isArray(rows) ? rows : []).forEach((r) => {
          // r.lectureId 가 course.id 와 매칭됨
          map[r.lectureId] = {
            count: Number(r.count || 0),
            averageRating: Number(r.averageRating || 0),
          };
        });
        setSummaryMap(map);
      })
      .catch(() => setSummaryMap({}));
  }, [uniCode, courses.length]);


  // ✅ 컴포넌트 마운트 시 강의 목록 불러오기
  useEffect(() => {
    if (!selectedCourseId) return;

    fetch(`http://localhost:8080/api/reviews?lectureId=${encodeURIComponent(selectedCourseId)}`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [selectedCourseId]);

  // ✅ 검색된 강의 목록 (mockCourses -> courses)
  const filteredCourses = useMemo(() => {
    if (!uniCode) return [];
    return courses.filter(
      (course) =>
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.professor?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniCode, courses, searchTerm]);

  // ✅ 선택된 강의 정보
  const selectedCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : null;

  // 선택된 강의의 리뷰들 (아직 mock 기반)
  const courseReviews = selectedCourseId ? reviews : [];

  // 평균 평점 계산

  const rightSummary = selectedCourseId
    ? (summaryMap[selectedCourseId] || summary)   // summaryMap 우선, 없으면 summary
    : { count: 0, averageRating: 0 };
  const averageRating = Number(rightSummary.averageRating || 0).toFixed(1);
  const reviewCount = Number(rightSummary.count || 0);


  const handleSubmitReview = async () => {
    if (!selectedCourse || !newReview.content.trim() || !newReview.semester) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const payload = {
      lectureId: selectedCourse.id,
      university: uniCode,            // "HANYANG" or "KOREA"
      userId: String(user?.id || 'anonymous'),
      userName: user?.name || '익명',
      rating: Number(newReview.rating),
      semester: newReview.semester,
      content: newReview.content,
      assignmentAmount: newReview.assignmentAmount,
      teamProject: newReview.teamProject,
      grading: newReview.grading,
      attendance: newReview.attendance,
      examCount: Number(newReview.examCount),
    };

    console.log('강의평 저장 요청:', payload);

    try {
      const res = await fetch('http://localhost:8080/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('서버 오류:', errorText);
        throw new Error(`저장 실패: ${res.status} - ${errorText}`);
      }

      alert('강의평이 작성되었습니다!');

      // ✅ 다시 불러오기
      const listRes = await fetch(
        `http://localhost:8080/api/reviews?lectureId=${encodeURIComponent(selectedCourse.id)}`
      );
      const list = await listRes.json();
      setReviews(Array.isArray(list) ? list : []);

      const sumRes = await fetch(
        `http://localhost:8080/api/reviews/summary?lectureId=${encodeURIComponent(selectedCourse.id)}`
      );
      const sum = await sumRes.json();
      setSummary(sum || { count: 0, averageRating: 0.0 });

      setSummaryMap((prev) => ({
        ...prev,
        [selectedCourse.id]: {
          count: Number(sum?.count || 0),
          averageRating: Number(sum?.averageRating || 0),
        },
      }));

      setShowWriteReview(false);
      setNewReview({ rating: 5, semester: '', content: '', assignmentAmount: 'medium', teamProject: 'few', grading: 'normal', attendance: 'direct', examCount: 2 });
    } catch (e) {
      alert(e?.message || '저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!selectedCourseId) return;

    fetch(`http://localhost:8080/api/reviews/summary?lectureId=${encodeURIComponent(selectedCourseId)}`)
      .then((res) => res.json())
      .then((data) => setSummary(data || { count: 0, averageRating: 0.0 }))
      .catch(() => setSummary({ count: 0, averageRating: 0.0 }));

    // ✅ 내 좋아요 목록 불러오기
    if (user?.id) {
      fetch(`http://localhost:8080/api/reviews/likes?userId=${encodeURIComponent(user.id)}&lectureId=${encodeURIComponent(selectedCourseId)}`)
        .then(res => res.json())
        .then(ids => {
          const map = {};
          (Array.isArray(ids) ? ids : []).forEach(id => { map[id] = true; });
          setUserLikes(map);
        })
        .catch(() => setUserLikes({}));
    } else {
      setUserLikes({});
    }
  }, [selectedCourseId, user?.id]);


  const handleLikeReview = async (reviewId) => {
    try {
      const numReviewId = Number(reviewId);
      const res = await fetch(
        `http://localhost:8080/api/reviews/${numReviewId}/like?userId=${encodeURIComponent(
          String(user?.id || 'anonymous')
        )}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error();

      const data = await res.json(); // { reviewId, liked: boolean, likesCount: number }

      // 좋아요 상태 업데이트
      setUserLikes((prev) => ({ ...prev, [numReviewId]: data.liked }));

      // 리뷰의 좋아요 개수 업데이트
      setReviews((prev) =>
        prev.map((r) =>
          (r?.id === numReviewId || r?.reviewId === numReviewId)
            ? { ...r, likesCount: data.likesCount }
            : r
        )
      );

    } catch {
      alert('좋아요 처리 실패');
    }
  };

  const loadComments = async (reviewId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}/comments`);
      if (!res.ok) throw new Error();
      const list = await res.json();
      setCommentsByReview((prev) => ({ ...prev, [reviewId]: Array.isArray(list) ? list : [] }));
    } catch {
      setCommentsByReview((prev) => ({ ...prev, [reviewId]: [] }));
    }
  };

  const handleAddComment = async (reviewId) => {
    const text = newComment[reviewId]?.trim();
    if (!text) return;

    const payload = {
      reviewId: Number(reviewId),
      userId: String(user?.id || 'anonymous'),
      userName: user?.name || '익명',
      content: text,
    };

    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      const saved = await res.json();

      setCommentsByReview((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), saved],
      }));
      setReviews((prev) =>
        prev.map((r) =>
          (r.id === Number(reviewId) || r.reviewId === Number(reviewId))
            ? { ...r, commentsCount: (r.commentsCount || 0) + 1 }
            : r
        )
      );
      setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
    } catch {
      alert('댓글 저장 실패');
    }
  };

  const renderStars = (rating, interactive = false, onRate) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  const labelMap = {
    assignmentAmount: { low: '적음', medium: '보통', high: '많음' },
    teamProject: { none: '없음', few: '보통', many: '많음' },
    grading: { generous: '너그러움', normal: '보통', strict: '깐깐함' },
    attendance: { none: '미체크', direct: '직접호명', electronic: '전자출결', assignment: '과제' },
  };

  const calcDist = (items, key) => {
    const dist = {};
    items.forEach((r) => {
      const v = r?.[key];
      if (!v && v !== 0) return;
      dist[v] = (dist[v] || 0) + 1;
    });
    return dist;
  };

  const calcExamDist = (items) => {
    const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
    items.forEach((r) => {
      const v = Number(r?.examCount);
      if (Number.isNaN(v)) return;
      if (v >= 3) dist[3] += 1;
      else dist[v] += 1;
    });
    return dist;
  };

  const getTop = (dist) => {
    const entries = Object.entries(dist);
    if (entries.length === 0) return { key: null, count: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { key: entries[0][0], count: entries[0][1] };
  };

  const ProgressRow = ({ title, rows, total }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{total}개 기준</p>
        </div>

        <div className="space-y-2">
          {rows.map(({ label, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-16 text-xs text-gray-600 shrink-0">{label}</div>

                <div className="flex-1">
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="w-14 text-right text-xs text-gray-600 shrink-0">
                  {pct}% ({count})
                </div>
              </div>
            );
          })}
        </div>
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
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchTerm(v);
                  if (courses.length === 0 && !loadingCourses && !coursesError) {
                    loadCourses();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 강의 목록 */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
              ) : (
                filteredCourses.map((course) => {
                  const s = summaryMap[course.id] || { count: 0, averageRating: 0 };

                  const avgRating = s.averageRating.toFixed(1);
                  const reviewCount = s.count;

                  return (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowWriteReview(false);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedCourseId === course.id
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
                          className={`text-xs px-2 py-1 rounded-full ${course.category === '전공'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                            }`}
                        >
                          {course.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Star
                              className={`size-4 ${reviewCount > 0
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-300'
                                }`}
                            />
                            <span className={`font-medium ${reviewCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                              {avgRating}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageSquare className="size-4" />
                          <span>{reviewCount}개</span>
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
                {/* 강의 정보 + 통계 패널 */}
                <div className="mb-6 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* 상단 헤더 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{selectedCourse.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedCourse.professor} 교수님</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          {renderStars(parseFloat(averageRating))}
                          <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                        </div>
                        <span className="text-gray-500">({reviewCount}개의 강의평)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowWriteReview((v) => !v)}
                      className="shrink-0 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
                    >
                      강의평 작성하기
                    </button>
                  </div>

                  {/* 통계: 리뷰가 있을 때만 */}
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    {courseReviews.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        아직 작성된 강의평이 없어 통계를 표시할 수 없어요.
                      </div>
                    ) : (
                      (() => {
                        const total = courseReviews.length;

                        const aDist = calcDist(courseReviews, 'assignmentAmount');
                        const tDist = calcDist(courseReviews, 'teamProject');
                        const gDist = calcDist(courseReviews, 'grading');
                        const atDist = calcDist(courseReviews, 'attendance');
                        const eDist = calcExamDist(courseReviews);

                        const aRows = ['low', 'medium', 'high'].map((k) => ({
                          label: labelMap.assignmentAmount[k],
                          count: aDist[k] || 0,
                        }));

                        const tRows = ['none', 'few', 'many'].map((k) => ({
                          label: labelMap.teamProject[k],
                          count: tDist[k] || 0,
                        }));

                        const gRows = ['generous', 'normal', 'strict'].map((k) => ({
                          label: labelMap.grading[k],
                          count: gDist[k] || 0,
                        }));

                        const atRows = ['none', 'direct', 'electronic', 'assignment'].map((k) => ({
                          label: labelMap.attendance[k],
                          count: atDist[k] || 0,
                        }));

                        const eRows = [
                          { label: '없음', count: eDist[0] || 0 },
                          { label: '1회', count: eDist[1] || 0 },
                          { label: '2회', count: eDist[2] || 0 },
                          { label: '3+회', count: eDist[3] || 0 },
                        ];

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <ProgressRow title="과제량" rows={aRows} total={total} />
                            <ProgressRow title="조모임" rows={tRows} total={total} />
                            <ProgressRow title="성적" rows={gRows} total={total} />
                            <ProgressRow title="출석" rows={atRows} total={total} />
                            <div className="md:col-span-2">
                              <ProgressRow title="시험 횟수" rows={eRows} total={total} />
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
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
                          <option value="2025-겨울학기">2025-겨울학기</option>
                          <option value="2025-2학기">2025-2학기</option>
                          <option value="2025-여름학기">2025-여름학기</option>
                          <option value="2025-1학기">2025-1학기</option>
                          <option value="2024-겨울학기">2024-겨울학기</option>
                          <option value="2024-2학기">2024-2학기</option>
                          <option value="2024-여름학기">2024-여름학기</option>
                          <option value="2024-1학기">2024-1학기</option>
                          <option value="2023-겨울학기">2023-겨울학기</option>
                          <option value="2023-2학기">2023-2학기</option>
                          <option value="2023-여름학기">2023-여름학기</option>
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
                              className={`flex items-center gap-1 transition-colors ${userLikes[review.id]
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-blue-600'
                                }`}
                            >
                              <ThumbsUp className={`size-4 ${userLikes[review.id] ? 'fill-blue-600' : ''}`} />
                              <span>{Number(review.likesCount || 0)}</span>
                            </button>

                            <button
                              onClick={() => {
                                const targetId = showCommentsForReview === review.id ? null : review.id;
                                setShowCommentsForReview(targetId);
                                if (targetId && !commentsByReview[targetId]) {
                                  loadComments(targetId);
                                }
                              }}
                              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <MessageSquare className="size-4" />
                              <span>{review.commentsCount || 0}</span>
                            </button>
                          </div>

                          {/* 댓글 섹션 */}
                          {showCommentsForReview === review.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="space-y-2 mb-3">
                                {(commentsByReview[review.id] || []).length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-2">아직 댓글이 없습니다.</p>
                                ) : (
                                  (commentsByReview[review.id] || [])
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