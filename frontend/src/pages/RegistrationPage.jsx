import React, { useState, useEffect } from 'react';
import { mockSchedules } from '../data/mockRegistration'; // 일정은 아직 Mock 데이터 사용
import api from '../api/axios'; // 🌟 [핵심] axios 인스턴스 사용
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

  const [tips, setTips] = useState([]);
  const [tipComments, setTipComments] = useState([]);
  const [showCommentsForTip, setShowCommentsForTip] = useState(null);
  const [newComment, setNewComment] = useState({});

  // 현재 사용자의 학교 일정 찾기 (일정은 Mock 유지)
  const schedule = mockSchedules.find((s) => s.university === user?.university) || mockSchedules[0];

  // ✅ 팁 목록 불러오기 (api 사용)
  const fetchTips = async () => {
    try {
      const res = await api.get('/api/tips', {
        params: {
          university: user.university,
          category: selectedCategory,
          search: searchTerm,
          sort: sortBy,
          userId: user?.email // 좋아요/스크랩 여부 확인용
        }
      });
      setTips(res.data);
    } catch (error) {
      console.error("팁 목록 로드 실패:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'tips') {
      fetchTips();
    }
  }, [activeTab, selectedCategory, sortBy, searchTerm, user.university]);

  // 팁 작성 핸들러
  const handleSubmitTip = async () => {
    if (!newTip.title.trim() || !newTip.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!user.department) {
      alert('학과 정보가 없습니다. 마이페이지에서 학과를 설정해주세요.');
      return;
    }

    try {
      await api.post('/api/tips', {
        ...newTip,
        university: user.university,
        userId: user.email,
        userName: user.name,
        department: user.department,
        isAnonymous: newTip.isAnonymous
      });

      alert('팁이 등록되었습니다!');
      setShowWriteTip(false);
      setNewTip({ title: '', content: '', category: 'general', isAnonymous: false });
      fetchTips(); // 목록 새로고침
    } catch (e) {
      console.error(e);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  // 좋아요 핸들러
  const handleLikeTip = async (tipId) => {
    try {
      const res = await api.post(`/api/tips/${tipId}/like?userId=${user.email}`);
      const { liked, likesCount } = res.data;

      setTips(prev => prev.map(tip =>
        tip.id === tipId
          ? { ...tip, likedByUser: liked, likesCount: likesCount }
          : tip
      ));
    } catch (e) {
      console.error("좋아요 실패:", e);
    }
  };

  // 스크랩 핸들러
  const handleScrapTip = async (tipId) => {
    try {
      const res = await api.post(`/api/tips/${tipId}/scrap?userId=${user.email}`);
      const { scraped } = res.data;

      setTips(prev => prev.map(tip =>
        tip.id === tipId
          ? { ...tip, scrapedByUser: scraped }
          : tip
      ));
    } catch (e) {
      console.error("스크랩 실패:", e);
    }
  };

  // 댓글 작성 핸들러
  const handleAddComment = async (tipId) => {
    if (!newComment[tipId]?.trim()) return;

    try {
      await api.post(`/api/tips/${tipId}/comments`, {
        content: newComment[tipId],
        userId: user.email,
        userName: user.name
      });

      setNewComment((prev) => ({ ...prev, [tipId]: '' }));
      fetchComments(tipId); // 댓글 새로고침
      fetchTips(); // 댓글 수 업데이트 위해 팁 목록도 갱신 (선택사항)
    } catch (e) {
      console.error("댓글 작성 실패:", e);
    }
  };

  // 댓글 불러오기
  const fetchComments = async (tipId) => {
    try {
      const res = await api.get(`/api/tips/${tipId}/comments`);
      // 기존 댓글 목록에서 해당 팁의 댓글만 교체하거나 추가하는 방식
      setTipComments(prev => {
        const others = prev.filter(c => c.tipId !== tipId);
        return [...others, ...res.data];
      });
    } catch (e) {
      console.error("댓글 로드 실패:", e);
    }
  };

  // 유틸리티 함수들
  const getCategoryColor = (category) => {
    switch (category) {
      case 'registration': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'add-drop': case '정정기간': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'tuition': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case '모의수강신청': case '희망과목등록': return 'bg-green-100 text-green-700 border-green-200';
      case '수강포기': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryName = (category) => {
    const map = {
      registration: '수강신청', 'add-drop': '수강정정', tuition: '등록금',
      strategy: '전략', technical: '기술', course: '강의', general: '일반'
    };
    return map[category] || category;
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

        {/* 탭 1: 수강신청 일정 */}
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
                    {schedule.universityName || schedule.university} {schedule.semester}
                  </h2>
                  <p className="text-gray-600">수강신청 및 학사 일정을 확인하세요.</p>
                </div>

                <div className="space-y-4">
                  {schedule.events.map((event) => (
                    <div key={event.id} className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(event.category)}`}>
                              {getCategoryName(event.category)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2 whitespace-pre-wrap">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="size-4 text-blue-600" />
                          <span>{event.startDate === event.endDate ? event.startDate : `${event.startDate} ~ ${event.endDate}`}</span>
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

        {/* 탭 2: 수강신청 팁 */}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="size-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="px-4 py-2 border border-gray-300 rounded-lg"
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
              className="w-full mb-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                    <select
                      value={newTip.category}
                      onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                    <textarea
                      placeholder="수강신청 팁을 공유해주세요!"
                      value={newTip.content}
                      onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
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
                    <label htmlFor="anonymous" className="text-sm text-gray-700 select-none">익명으로 작성</label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSubmitTip} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      등록하기
                    </button>
                    <button
                      onClick={() => {
                        setShowWriteTip(false);
                        setNewTip({ title: '', content: '', category: 'general', isAnonymous: false });
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 팁 목록 */}
            <div className="space-y-4">
              {tips.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
                  <p>등록된 팁이 없거나 검색 결과가 없습니다.</p>
                </div>
              ) : (
                tips.map((tip) => {
                  const isExpanded = expandedTipId === tip.id;
                  const shouldTruncate = tip.content.length > 200;

                  return (
                    <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full border mr-2 ${tip.category === 'strategy' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              tip.category === 'technical' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                tip.category === 'course' ? 'bg-green-100 text-green-700 border-green-200' :
                                  'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                            {getCategoryName(tip.category)}
                          </span>
                          <h3 className="inline text-lg font-bold text-gray-900">{tip.title}</h3>
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
                          {isExpanded ? <>접기 <ChevronUp className="size-4" /></> : <>더보기 <ChevronDown className="size-4" /></>}
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{tip.isAnonymous ? "익명" : tip.userName}</span>
                          {!tip.isAnonymous && <span>{tip.department}</span>}
                          <span>{tip.createdAt?.split('T')[0]}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <button onClick={() => handleLikeTip(tip.id)} className={`flex items-center gap-1 transition-colors ${tip.likedByUser ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
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
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600"
                          >
                            <MessageSquare className="size-4" />
                            <span>{tip.commentsCount}</span>
                          </button>
                          <button onClick={() => handleScrapTip(tip.id)} className={`flex items-center gap-1 transition-colors ${tip.scrapedByUser ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}>
                            <Bookmark className={`size-4 ${tip.scrapedByUser ? 'fill-yellow-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* 댓글창 */}
                      {showCommentsForTip === tip.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-3 rounded-lg">
                          <div className="space-y-2 mb-3">
                            {tipComments.filter(c => c.tipId === tip.id).length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">아직 댓글이 없습니다.</p>
                            ) : (
                              tipComments.filter(c => c.tipId === tip.id).map(comment => (
                                <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-100">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-gray-900">{comment.userName}</span>
                                    <span className="text-xs text-gray-500">{comment.createdAt?.split('T')[0]}</span>
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
                              onChange={(e) => setNewComment({ ...newComment, [tip.id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(tip.id)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => handleAddComment(tip.id)} className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700">
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
  );
}