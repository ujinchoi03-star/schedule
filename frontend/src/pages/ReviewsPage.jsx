import { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Star,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Bookmark,
} from 'lucide-react';
import api from '../api/axios'; // 🌟 [핵심] axios 인스턴스 사용

const DAY_TRANSLATOR = {
  "Mon": "월", "Tue": "화", "Wed": "수", "Thu": "목", "Fri": "금", "Sat": "토", "Sun": "일"
};

const formatMinuteToTime = (minutes) => {
  if (minutes === undefined || minutes === null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};


export function ReviewsPage({ user, onBack }) {
  // --- 상태 관리 ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // 강의 데이터
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // 통계 데이터 맵 { [courseId]: { count, averageRating } }
  const [summaryMap, setSummaryMap] = useState({});

  // 새 리뷰 작성 폼
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
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);

  // 리뷰 및 댓글 데이터
  const [reviews, setReviews] = useState([]);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [commentsByReview, setCommentsByReview] = useState({});
  const [showCommentsForReview, setShowCommentsForReview] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [summary, setSummary] = useState({ count: 0, averageRating: 0.0 });
  const [userLikes, setUserLikes] = useState({}); // 내가 좋아요 한 리뷰 목록

  // 🌟 [수정됨] 유저 학교명 -> 백엔드 코드 매핑 (한글/영어 모두 대응)
  const uniCode = useMemo(() => {
    const u = user?.university || '';
    // 1. 한글('한양') 또는 영어('HANYANG') 포함 여부 확인
    if (u.includes('한양') || u === 'HANYANG') return 'HANYANG';
    if (u.includes('고려') || u === 'KOREA') return 'KOREA';
    return 'KOREA'; // 기본값
  }, [user?.university]);
  // 1. 강의 목록 불러오기
  useEffect(() => {
    if (!uniCode) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get('/api/lectures', {
          params: { university: uniCode }
        });
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("강의 목록 로드 실패:", e);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [uniCode]);

  // 2. 전체 강의 요약 정보(평점 등) 불러오기
  useEffect(() => {
    if (!uniCode) return;

    api.get('/api/reviews/summary/all', { params: { university: uniCode } })
        .then((res) => {
          const map = {};
          (Array.isArray(res.data) ? res.data : []).forEach((r) => {
            // 🚀 [수정] 교수님별 통계 매핑 (BaseID-교수명 조합)
            const key = `${r.lectureId}-${r.professor || ''}`;
            map[key] = {
              count: Number(r.count || 0),
              averageRating: Number(r.averageRating || 0),
            };
          });
          setSummaryMap(map);
        })
        .catch((err) => console.error("요약 정보 로드 실패:", err));
  }, [uniCode, courses.length]); // courses가 로드된 후 실행

  // 3. 강의 선택 시 해당 강의의 리뷰 & 상세 통계 불러오기
  useEffect(() => {
    if (!selectedCourseId) return;

    // 🚀 선택된 강의 정보 찾기 (교수님 이름 알기 위해)
    const currentCourse = courses.find(c => c.id === selectedCourseId);
    const professorName = currentCourse?.professor || '';
    const baseId = selectedCourseId.split('-')[0]; // ITE2031-01 -> ITE2031

    const fetchReviewsAndSummary = async () => {
      try {
        // 리뷰 목록
        const reviewsRes = await api.get('/api/reviews', {
          params: {
            lectureId: selectedCourseId,
            userId: user?.email // 🚀 [추가] 좋아요/스크랩 여부 확인용
          }
        });
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

        // 상세 통계
        const summaryRes = await api.get('/api/reviews/summary', {
          params: { lectureId: selectedCourseId }
        });

        const stats = summaryRes.data || { count: 0, averageRating: 0.0 };
        // 1️⃣ 오른쪽 상세 정보 갱신
        setSummary(stats);

        // 2️⃣ 🚀 왼쪽 목록 데이터 동기화 (BaseID-교수명 Key 사용)
        setSummaryMap(prev => ({
          ...prev,
          [`${baseId}-${professorName}`]: {
            count: Number(stats.count || 0),
            averageRating: Number(stats.averageRating || 0)
          }
        }));

        // 내 좋아요 목록 ... (생략)

        // 내 좋아요 목록
        if (user?.email) {
          const likesRes = await api.get('/api/reviews/likes', {
            params: { userId: user.email, lectureId: selectedCourseId }
          });
          const map = {};
          (Array.isArray(likesRes.data) ? likesRes.data : []).forEach(id => { map[id] = true; });
          setUserLikes(map);
        }
      } catch (e) {
        console.error("리뷰 상세 데이터 로드 실패:", e);
      }
    };

    fetchReviewsAndSummary();
  }, [selectedCourseId, user?.email]);


  // --- 필터링 및 계산 로직 ---

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    // 1단계: 검색어로 필터링 (기존 로직)
    const matched = courses.filter(
        (course) =>
            course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.professor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2단계: 🚀 [추가됨] 이름+교수님이 같으면 중복 제거 (하나만 남기기)
    const uniqueMap = new Map();
    matched.forEach((course) => {
      const key = `${course.name}-${course.professor}`; // 중복 판별 기준
      if (!uniqueMap.has(key)) uniqueMap.set(key, course);
    });
    // 맵에 남은 유일한 강의들만 배열로 반환
    return Array.from(uniqueMap.values());
  }, [courses, searchTerm]);

  const selectedCourse = selectedCourseId
      ? courses.find((c) => c.id === selectedCourseId)
      : null;

  const courseReviews = selectedCourseId ? reviews : [];

  // 우측 패널용 요약 정보 (summaryMap 우선 사용)
  const rightSummary = selectedCourseId
      ? (summaryMap[selectedCourseId] || summary)
      : { count: 0, averageRating: 0 };

  const averageRating = Number(rightSummary.averageRating || 0).toFixed(1);
  const reviewCount = Number(rightSummary.count || 0);

  // --- 핸들러 함수들 ---

  const handleSubmitReview = async () => {
    if (!selectedCourse || !newReview.content.trim() || !newReview.semester) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const payload = {
      lectureId: selectedCourse.id,
      university: uniCode,
      userId: user?.email,
      userName: user?.name,
      rating: Number(newReview.rating),
      semester: newReview.semester,
      content: newReview.content,
      assignmentAmount: newReview.assignmentAmount,
      teamProject: newReview.teamProject,
      grading: newReview.grading,
      attendance: newReview.attendance,
      examCount: Number(newReview.examCount),
      isAnonymous: isAnonymousReview,
    };

    try {
      await api.post('/api/reviews', payload);
      alert('강의평이 작성되었습니다!');

      // 목록 및 통계 갱신
      const listRes = await api.get('/api/reviews', { params: { lectureId: selectedCourse.id } });
      setReviews(listRes.data);

      const sumRes = await api.get('/api/reviews/summary', { params: { lectureId: selectedCourse.id } });
      const newSum = sumRes.data;
      setSummary(newSum);

      // 🚀 [수정] 통계 맵 업데이트 시에도 BaseID-교수명 사용
      const baseId = selectedCourse.id.split('-')[0];
      const key = `${baseId}-${selectedCourse.professor || ''}`;

      setSummaryMap(prev => ({
        ...prev,
        [key]: {
          count: Number(newSum?.count || 0),
          averageRating: Number(newSum?.averageRating || 0),
        },
      }));
      // 폼 초기화
      setShowWriteReview(false);
      setNewReview({ rating: 5, semester: '', content: '', assignmentAmount: 'medium', teamProject: 'few', grading: 'normal', attendance: 'direct', examCount: 2 });
      setIsAnonymousReview(false);
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      const res = await api.post(`/api/reviews/${reviewId}/like`, null, {
        params: { userId: user?.email }
      });
      const data = res.data;

      if (data.error) throw new Error(data.error);

      // 상태 업데이트
      setUserLikes((prev) => ({ ...prev, [reviewId]: data.liked }));
      setReviews((prev) =>
          prev.map((r) =>
              (r.id === reviewId) ? { ...r, likesCount: data.likesCount } : r
          )
      );
    } catch {
      alert('좋아요 처리 실패');
    }
  };

  const handleScrapReview = async (reviewId) => {
    try {
      // 🚀 백엔드에 스크랩 토글 요청 (userId는 현재 로그인한 유저 정보)
      const response = await api.post(`/api/reviews/${reviewId}/scrap`, null, {
        params: { userId: user.email }
      });

      const isScrapped = response.data.scrapped;

      // 🚀 중요: 현재 리뷰 목록 상태(reviews)에서 해당 리뷰의 'scrapedByUser' 상태를 즉시 변경
      setReviews(prevReviews =>
          prevReviews.map(review =>
              review.id === reviewId
                  ? { ...review, scrapedByUser: isScrapped }
                  : review
          )
      );

    } catch (error) {
      console.error("스크랩 처리 실패:", error);
      alert("스크랩 처리 중 오류가 발생했습니다.");
    }
  };
  const loadComments = async (reviewId) => {
    try {
      const res = await api.get(`/api/reviews/${reviewId}/comments`);
      setCommentsByReview((prev) => ({ ...prev, [reviewId]: res.data }));
    } catch {
      setCommentsByReview((prev) => ({ ...prev, [reviewId]: [] }));
    }
  };

  const handleAddComment = async (reviewId) => {
    const text = newComment[reviewId]?.trim();
    if (!text) return;

    try {
      const res = await api.post(`/api/reviews/${reviewId}/comments`, {
        reviewId: Number(reviewId),
        userId: user?.email,
        userName: user?.name,
        content: text,
      });

      const saved = res.data;

      setCommentsByReview((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), saved],
      }));

      // 리뷰의 댓글 수 증가
      setReviews((prev) =>
          prev.map((r) =>
              (r.id === reviewId) ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r
          )
      );
      setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
    } catch {
      alert('댓글 저장 실패');
    }
  };

  // --- 렌더링 헬퍼 함수들 ---

  const renderStars = (rating, interactive = false, onRate) => (
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

  // 통계 그래프용 데이터 계산
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

  const ProgressRow = ({ title, rows, total }) => (
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredCourses.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          {loadingCourses ? "강의 목록 로딩 중..." : "검색 결과가 없습니다."}
                        </p>
                    ) :
                    // 🚀 [수정 1] .slice(0, 100) 추가해서 최대 100개까지만 렌더링 (렉 방지)
                    filteredCourses.slice(0, 100).map((course, index) => {

                      // 🚀 [수정] 요약 정보 매칭 (BaseID - 교수명)
                      const baseId = course.id.split('-')[0];
                      const key = `${baseId}-${course.professor || ''}`;
                      const s = summaryMap[key] || { count: 0, averageRating: 0 };

                      const avgRating = s.averageRating.toFixed(1);
                      const count = s.count;

                      return (
                          <button
                              // 🚀 [수정 2] key를 index와 섞어서 중복 방지!
                              key={`${course.id}-${index}`}
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
                              <span className={`text-xs px-2 py-1 rounded-full ${course.category === '전공' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {course.category}
                        </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className={`size-4 ${count > 0 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'}`} />
                                <span className={`font-medium ${count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                            {avgRating}
                          </span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <MessageSquare className="size-4" />
                                <span>{count}개</span>
                              </div>
                            </div>
                          </button>
                      );
                    })
                }
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
                    {/* 강의 정보 헤더 */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedCourse.name}</h2>
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
                            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
                        >
                          강의평 작성하기
                        </button>
                      </div>

                      {/* 상세 통계 그래프 (리뷰 있을 때만) */}
                      {courseReviews.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            {(() => {
                              const total = courseReviews.length;
                              const aDist = calcDist(courseReviews, 'assignmentAmount');
                              const tDist = calcDist(courseReviews, 'teamProject');
                              const gDist = calcDist(courseReviews, 'grading');
                              const atDist = calcDist(courseReviews, 'attendance');
                              const eDist = calcExamDist(courseReviews);

                              const aRows = ['low', 'medium', 'high'].map((k) => ({ label: labelMap.assignmentAmount[k], count: aDist[k] || 0 }));
                              const tRows = ['none', 'few', 'many'].map((k) => ({ label: labelMap.teamProject[k], count: tDist[k] || 0 }));
                              const gRows = ['generous', 'normal', 'strict'].map((k) => ({ label: labelMap.grading[k], count: gDist[k] || 0 }));
                              const atRows = ['none', 'direct', 'electronic', 'assignment'].map((k) => ({ label: labelMap.attendance[k], count: atDist[k] || 0 }));
                              const eRows = [{ label: '없음', count: eDist[0] || 0 }, { label: '1회', count: eDist[1] || 0 }, { label: '2회', count: eDist[2] || 0 }, { label: '3+회', count: eDist[3] || 0 }];

                              return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <ProgressRow title="과제량" rows={aRows} total={total} />
                                    <ProgressRow title="조모임" rows={tRows} total={total} />
                                    <ProgressRow title="성적" rows={gRows} total={total} />
                                    <ProgressRow title="출석" rows={atRows} total={total} />
                                    <div className="md:col-span-2"><ProgressRow title="시험 횟수" rows={eRows} total={total} /></div>
                                  </div>
                              );
                            })()}
                          </div>
                      )}
                    </div>

                    {/* 작성 폼 */}
                    {showWriteReview && (
                        <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
                          <h3 className="font-bold text-lg mb-4">강의평 작성</h3>
                          <div className="space-y-4">
                            {/* 평점 */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">총점</label>
                              {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                            </div>

                            {/* 학기 & 시험 횟수 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">수강 학기</label>
                                <select
                                    value={newReview.semester}
                                    onChange={(e) => setNewReview({ ...newReview, semester: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">학기 선택</option>
                                  <option value="2026-1학기">2026-1학기</option>
                                  <option value="2025-2학기">2025-2학기</option>
                                  <option value="2025-1학기">2025-1학기</option>
                                  <option value="2024-2학기">2024-2학기</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">시험 횟수</label>
                                <select
                                    value={newReview.examCount}
                                    onChange={(e) => setNewReview({ ...newReview, examCount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="0">없음</option>
                                  <option value="1">1회</option>
                                  <option value="2">2회</option>
                                  <option value="3">3회 이상</option>
                                </select>
                              </div>
                            </div>

                            {/* 상세 항목들 (그리드) */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">과제량</label>
                                <select value={newReview.assignmentAmount} onChange={(e) => setNewReview({ ...newReview, assignmentAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                  <option value="low">적음</option>
                                  <option value="medium">보통</option>
                                  <option value="high">많음</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">조모임</label>
                                <select value={newReview.teamProject} onChange={(e) => setNewReview({ ...newReview, teamProject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                  <option value="none">없음</option>
                                  <option value="few">보통</option>
                                  <option value="many">많음</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">성적</label>
                                <select value={newReview.grading} onChange={(e) => setNewReview({ ...newReview, grading: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                  <option value="generous">너그러움</option>
                                  <option value="normal">보통</option>
                                  <option value="strict">깐깐함</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">출석</label>
                                <select value={newReview.attendance} onChange={(e) => setNewReview({ ...newReview, attendance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                  <option value="none">미체크</option>
                                  <option value="direct">직접호명</option>
                                  <option value="electronic">전자출결</option>
                                  <option value="assignment">과제</option>
                                </select>
                              </div>

                            </div>

                            {/* 텍스트 내용 */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">상세 후기</label>
                              <textarea
                                  value={newReview.content}
                                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                  placeholder="솔직한 후기를 남겨주세요."
                                  rows={4}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="anon" checked={isAnonymousReview} onChange={(e) => setIsAnonymousReview(e.target.checked)} />
                              <label htmlFor="anon" className="text-sm text-gray-700">익명으로 작성</label>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={handleSubmitReview} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">작성 완료</button>
                              <button onClick={() => setShowWriteReview(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">취소</button>
                            </div>
                          </div>
                        </div>
                    )}

                    {/* 리뷰 목록 */}
                    <div className="space-y-4">
                      {courseReviews.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">아직 등록된 강의평이 없습니다.</p>
                          </div>
                      ) : (
                          courseReviews.map((review) => {

                            const tags = review.details ? review.details.split(',').map(t => t.trim()) : [];
                            const isExpanded = expandedReviewId === review.id;
                            const isLong = review.content.length > 100;


                            return (
                                <div key={review.id} className="p-5 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors">
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                                #{tag}
                              </span>
                                    ))}
                                  </div>

                                  <div className="flex justify-between items-start mb-2"><div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900">{review.isAnonymous ? "익명" : review.userName}</span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{review.semester}</span>
                                    </div>
                                    <div className="mt-1">{renderStars(review.rating)}</div>
                                  </div>
                                    <span className="text-xs text-gray-400">{review.createdAt}</span>
                                  </div>

                                  <div className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                                    {isLong && !isExpanded ? `${review.content.slice(0, 100)}...` : review.content}
                                    {isLong && (
                                        <button onClick={() => setExpandedReviewId(isExpanded ? null : review.id)} className="text-blue-600 text-sm font-bold ml-1 hover:underline">
                                          {isExpanded ? "접기" : "더보기"}
                                        </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm border-t pt-3 mt-3">
                                    <button onClick={() => handleLikeReview(review.id)} className={`flex items-center gap-1 ${userLikes[review.id] ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600'}`}>
                                      <ThumbsUp className={`size-4 ${userLikes[review.id] ? 'fill-blue-600' : ''}`} />
                                      <span>{review.likesCount || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                          const targetId = showCommentsForReview === review.id ? null : review.id;
                                          setShowCommentsForReview(targetId);
                                          if (targetId && !commentsByReview[targetId]) loadComments(targetId);
                                        }}
                                        className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                                    >
                                      <MessageSquare className="size-4" />
                                      <span>{review.commentsCount || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleScrapReview(review.id)}
                                        className={`flex items-center gap-1 transition-colors ${review.scrapedByUser ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                                    >
                                      <Bookmark
                                          size={18}
                                          // 🚀 스크랩 상태면 노란색으로 채우기
                                          fill={review.scrapedByUser ? "#EAB308" : "none"} // text-yellow-500 hex equivalent or just string "currentColor" if relying on text color
                                          className={review.scrapedByUser ? "fill-yellow-500 text-yellow-500" : ""}
                                      />
                                    </button>
                                  </div>

                                  {/* 댓글창 */}
                                  {showCommentsForReview === review.id && (
                                      <div className="mt-3 bg-gray-50 p-3 rounded-lg animate-fade-in">
                                        <div className="space-y-2 mb-3">
                                          {(commentsByReview[review.id] || []).map(comment => (
                                              <div key={comment.id} className="bg-white p-2 rounded border border-gray-100 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="font-bold mr-2">{comment.userName}</span>
                                                  <span className="text-xs text-gray-400">{comment.createdAt}</span>
                                                </div>
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