import { useState, useEffect } from 'react';
import { mockSchedules } from '../data/mockRegistration'; // schedule은 아직 mock 유지
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  ThumbsUp,
  Plus,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Send,
  Bookmark,
} from 'lucide-react';

export function RegistrationPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [showWriteTip, setShowWriteTip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('likes-desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTipId, setExpandedTipId] = useState(null);

  // 📝 팁 작성 상태
  const [newTip, setNewTip] = useState({
    title: '',
    content: '',
    category: 'general',
    isAnonymous: false,
  });

  const [tips, setTips] = useState([]); // 빈 배열로 시작
  const [tipComments, setTipComments] = useState([]); // 전체 댓글 대신 팁별로 로딩하는 방식으로 변경 예정
  const [showCommentsForTip, setShowCommentsForTip] = useState(null);
  const [newComment, setNewComment] = useState({});

  // 현재 사용자의 학교 일정 찾기 (일정은 아직 Mock)
  const schedule = mockSchedules.find((s) => s.university === user.university);

  // ✅ 팁 목록 불러오기 (검색, 필터, 정렬 적용)
  const fetchTips = async () => {
    try {
      const queryParams = new URLSearchParams({
        university: user.university,
        category: selectedCategory,
        search: searchTerm,
        sort: sortBy,
        userId: user?.email || 'anonymous' // 🌟 조회 시에도 이메일로 '내가 좋아요 눌렀는지' 확인
      });

      const res = await fetch(`http://localhost:8080/api/tips?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch tips');
      const data = await res.json();
      setTips(data);
    } catch (error) {
      console.error("Error fetching tips:", error);
    }
  };

  // 조건이 바뀔 때마다 다시 불러오기
  useEffect(() => {
    if (activeTab === 'tips') {
      fetchTips();
    }
  }, [activeTab, selectedCategory, sortBy, searchTerm, user.university]);

  // filteredTips는 이제 서버에서 다 처리해서 오므로 tips 그대로 사용
  const filteredTips = tips;

  const handleSubmitTip = async () => {
    if (!newTip.title.trim() || !newTip.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 🌟 학과 정보 유효성 검사 (사용자 요청 반영: 등록된 학과가 있어야 함)
    if (!user.department) {
      alert('학과 정보가 없습니다. 마이페이지에서 학과를 설정해주세요.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTip,
          university: user.university,
          userId: user.email, // 🌟 사용자의 이메일(아이디)로 구분합니다.
          userName: user.name,
          department: user.department, // 이제 '미소속' 같은 임시 값이 들어가지 않고, 무조건 등록된 학과가 들어갑니다.
          isAnonymous: newTip.isAnonymous
        }),
      });

      if (!res.ok) throw new Error('Failed to create tip');

      alert('팁이 등록되었습니다!');
      setShowWriteTip(false);
      setNewTip({ title: '', content: '', category: 'general', isAnonymous: false });
      fetchTips(); // 목록 새로고침
    } catch (e) {
      console.error(e);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'registration':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'add-drop':
      case '정정기간':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'tuition':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case '모의수강신청':
      case '희망과목등록':
        return 'bg-green-100 text-green-700 border-green-200';
      case '수강포기':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'registration':
        return '수강신청';
      case 'add-drop':
        return '수강정정';
      case 'tuition':
        return '등록금';
      case 'strategy':
        return '전략';
      case 'technical':
        return '기술';
      case 'course':
        return '강의';
      case 'general':
        return '일반';
      default:
        return category;
    }
  };

  const handleLikeTip = async (tipId) => {
    try {
      // 🌟 좋아요도 이메일(아이디)로 기록합니다.
      const userId = user?.email || 'anonymous';
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}/like?userId=${userId}`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Like failed');
      const data = await res.json(); // { liked: boolean, likesCount: number }

      setTips(prev => prev.map(tip =>
        tip.id === tipId
          ? { ...tip, likedByUser: data.liked, likesCount: data.likesCount }
          : tip
      ));
    } catch (e) {
      console.error("Like error:", e);
    }
  };

  const handleScrapTip = async (tipId) => {
    try {
      const userId = user?.email || 'anonymous';
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}/scrap?userId=${userId}`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Scrap failed');
      const data = await res.json(); // { scraped: boolean }

      setTips(prev => prev.map(tip =>
        tip.id === tipId
          ? { ...tip, scrapedByUser: data.scraped }
          : tip
      ));
    } catch (e) {
      console.error("Scrap error:", e);
    }
  };

  const handleAddComment = async (tipId) => {
    if (!newComment[tipId]?.trim()) return;

    try {
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment[tipId],
          userId: user.email || 'anonymous', // 🌟 댓글도 이메일로 기록
          userName: user.name
        })
      });

      if (!res.ok) throw new Error('Comment failed');

      setNewComment((prev) => ({ ...prev, [tipId]: '' }));
      // 댓글 목록 새로고침
      fetchComments(tipId);

      // 팁 목록의 댓글 수 업데이트 (선택 사항)
      fetchTips();
    } catch (e) {
      console.error(e);
    }
  };

  // 댓글 불러오기 함수
  const fetchComments = async (tipId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}/comments`);
      const data = await res.json();
      // 전체 tipComments 배열 대신, 해당 팁의 댓글만 관리하거나 필터링해서 보여줌
      // 여기서는 간단히 전체 배열에 덮어쓰기보다, 로컬 상태 관리가 필요함.
      // 하지만 기존 구조(tipComments가 전체 배열)를 유지하려면:
      setTipComments(prev => {
        // 기존 것 중 해당 팁 댓글 다 지우고 새거 추가 (비효율적이지만 기존 구조 유지 시)
        const others = prev.filter(c => c.tipId !== tipId);
        return [...others, ...data];
      });
    } catch (e) {
      console.error(e);
    }
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
                수강신청 정보
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user.name}님 · {user.university} · {user.department}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'schedule'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            <Calendar className="size-5" />
            수강신청 일정
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'tips'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            <Sparkles className="size-5" />
            수강신청 팁
          </button>
        </div>

        {/* 수강신청 일정 탭 */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!schedule ? (
              <div className="text-center py-12">
                <Calendar className="size-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">해당 학교의 일정 정보가 없습니다.</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {schedule.university} {schedule.semester}
                  </h2>
                  <p className="text-gray-600">수강신청 및 학사 일정을 확인하세요.</p>
                </div>

                <div className="space-y-4">
                  {schedule.events.map((event) => (
                    <div
                      key={event.id}
                      className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(
                                event.category
                              )}`}
                            >
                              {getCategoryName(event.category)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2 whitespace-pre-wrap">{event.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="size-4 text-blue-600" />
                          <span>
                            {event.startDate === event.endDate
                              ? event.startDate
                              : `${event.startDate} ~ ${event.endDate}`}
                          </span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="size-4 text-purple-600" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        {event.target && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="size-4 text-green-600" />
                            <span>{event.target}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 수강신청 팁 탭 */}
        {activeTab === 'tips' && (
          <div>
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="팁 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="size-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    <option value="strategy">전략</option>
                    <option value="technical">기술</option>
                    <option value="course">강의</option>
                    <option value="general">일반</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="size-5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="likes-desc">좋아요 많은 순</option>
                    <option value="likes-asc">좋아요 적은 순</option>
                    <option value="latest">최신순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 팁 작성 버튼 */}
            <button
              onClick={() => setShowWriteTip(!showWriteTip)}
              className="w-full mb-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="size-5" />
              수강신청 팁 작성하기
            </button>

            {/* 팁 작성 폼 */}
            {showWriteTip && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">팁 작성하기</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={newTip.category}
                      onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">일반</option>
                      <option value="strategy">전략</option>
                      <option value="technical">기술</option>
                      <option value="course">강의</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input
                      type="text"
                      placeholder="팁 제목을 입력하세요"
                      value={newTip.title}
                      onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                    <textarea
                      placeholder="수강신청 팁을 공유해주세요!"
                      value={newTip.content}
                      onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={newTip.isAnonymous}
                      onChange={(e) => setNewTip({ ...newTip, isAnonymous: e.target.checked })}
                      className="size-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700 select-none">
                      익명으로 작성
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitTip}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      등록하기
                    </button>
                    <button
                      onClick={() => {
                        setShowWriteTip(false);
                        setNewTip({ title: '', content: '', category: 'general', isAnonymous: false });
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 팁 목록 */}
            <div className="space-y-4">
              {filteredTips.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                filteredTips.map((tip) => {
                  const isExpanded = expandedTipId === tip.id;
                  const shouldTruncate = tip.content.length > 200;

                  return (
                    <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${tip.category === 'strategy'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : tip.category === 'technical'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : tip.category === 'course'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                            >
                              {getCategoryName(tip.category)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{tip.title}</h3>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                        {shouldTruncate && !isExpanded ? `${tip.content.slice(0, 200)}...` : tip.content}
                      </p>

                      {shouldTruncate && (
                        <button
                          onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3"
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

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">
                            {tip.isAnonymous ? "익명" : tip.userName}
                          </span>
                          {!tip.isAnonymous && <span>{tip.department}</span>}
                          <span>{tip.createdAt}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <button
                            onClick={() => handleLikeTip(tip.id)}
                            className={`flex items-center gap-1 transition-colors ${tip.likedByUser ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                              }`}
                          >
                            <ThumbsUp className={`size-4 ${tip.likedByUser ? 'fill-blue-600' : ''}`} />
                            <span>{tip.likesCount}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (showCommentsForTip !== tip.id) {
                                setShowCommentsForTip(tip.id);
                                fetchComments(tip.id);
                              } else {
                                setShowCommentsForTip(null);
                              }
                            }}
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <MessageSquare className="size-4" />
                            <span>{tip.commentsCount}</span>
                          </button>
                          <button
                            onClick={() => handleScrapTip(tip.id)}
                            className={`flex items-center gap-1 transition-colors ${tip.scrapedByUser ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                              }`}
                          >
                            <Bookmark className={`size-4 ${tip.scrapedByUser ? 'fill-yellow-500' : ''}`} />
                            {/* <span>스크랩</span> */}
                          </button>
                        </div>
                      </div>

                      {/* 댓글 섹션 */}
                      <div className="mt-4">


                        {showCommentsForTip === tip.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-2 mb-3">
                              {tipComments.filter((comment) => comment.tipId === tip.id).length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                  아직 댓글이 없습니다.
                                </p>
                              ) : (
                                tipComments
                                  .filter((comment) => comment.tipId === tip.id)
                                  .map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                          {comment.userName}
                                        </span>
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
                                value={newComment[tip.id] || ''}
                                onChange={(e) =>
                                  setNewComment((prev) => ({ ...prev, [tip.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(tip.id);
                                }}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => handleAddComment(tip.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                              >
                                <Send className="size-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
