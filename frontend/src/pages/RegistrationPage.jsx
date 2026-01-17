import { useState } from 'react';
import { mockSchedules, mockTips, mockComments } from '../data/mockRegistration';
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
} from 'lucide-react';

export function RegistrationPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'tips'
  const [showWriteTip, setShowWriteTip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('likes-desc'); // 'likes-desc' | 'likes-asc' | 'latest'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [newTip, setNewTip] = useState({
    title: '',
    content: '',
    category: 'general', // 'strategy' | 'technical' | 'course' | 'general'
  });

  const [tips, setTips] = useState(mockTips);
  const [tipComments, setTipComments] = useState(mockComments);
  const [showCommentsForTip, setShowCommentsForTip] = useState(null);
  const [newComment, setNewComment] = useState({}); // { [tipId]: string }

  // 현재 사용자의 학교 일정 찾기
  const schedule = mockSchedules.find((s) => s.university === user.university);

  // 카테고리별 필터링
  const filteredTips = tips
    .filter((tip) => {
      const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
      const matchesSearch =
        tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.userName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'likes-desc') return b.likes - a.likes;
      if (sortBy === 'likes-asc') return a.likes - b.likes;
      if (sortBy === 'latest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  const handleSubmitTip = () => {
    if (!newTip.title.trim() || !newTip.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    alert('팁이 등록되었습니다!');
    setShowWriteTip(false);

    const createdAt = new Date().toISOString().split('T')[0];
    const newTipObj = {
      ...newTip,
      id: `tip-${tips.length + 1}`,
      userName: user.name,
      department: user.department,
      createdAt,
      likes: 0,
      comments: 0,
      likedByUser: false,
    };

    setTips([...tips, newTipObj]);
    setNewTip({ title: '', content: '', category: 'general' });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'registration':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'add-drop':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'tuition':
        return 'bg-purple-100 text-purple-700 border-purple-200';
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

  const handleLikeTip = (tipId) => {
    setTips((prevTips) =>
      prevTips.map((tip) => {
        if (tip.id === tipId) {
          const isLiked = tip.likedByUser;
          return {
            ...tip,
            likes: isLiked ? tip.likes - 1 : tip.likes + 1,
            likedByUser: !isLiked,
          };
        }
        return tip;
      })
    );
  };

  const handleAddComment = (tipId) => {
    if (!newComment[tipId]?.trim()) return;

    const newCommentObj = {
      id: `C${Date.now()}`,
      tipId,
      userId: user.id,
      userName: user.name,
      content: newComment[tipId],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTipComments((prev) => [...prev, newCommentObj]);
    setNewComment((prev) => ({ ...prev, [tipId]: '' }));
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
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Calendar className="size-5" />
            수강신청 일정
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'tips'
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
                          <p className="text-gray-600 mb-2">{event.description}</p>
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
                        setNewTip({ title: '', content: '', category: 'general' });
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
                              className={`text-xs px-2 py-1 rounded-full border ${
                                tip.category === 'strategy'
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
                          <span className="font-medium">{tip.userName}</span>
                          <span>{tip.department}</span>
                          <span>{tip.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <button
                            onClick={() => handleLikeTip(tip.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              tip.likedByUser ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                            }`}
                          >
                            <ThumbsUp className={`size-4 ${tip.likedByUser ? 'fill-blue-600' : ''}`} />
                            <span>{tip.likes}</span>
                          </button>
                          <button
                            onClick={() =>
                              setShowCommentsForTip(showCommentsForTip === tip.id ? null : tip.id)
                            }
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <MessageSquare className="size-4" />
                            <span>{tipComments.filter((c) => c.tipId === tip.id).length}</span>
                          </button>
                        </div>
                      </div>

                      {/* 댓글 섹션 */}
                      <div className="mt-4">
                        <button
                          onClick={() =>
                            setShowCommentsForTip(showCommentsForTip === tip.id ? null : tip.id)
                          }
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {showCommentsForTip === tip.id ? (
                            <>
                              댓글 접기 <ChevronUp className="size-4" />
                            </>
                          ) : (
                            <>
                              댓글 보기 <ChevronDown className="size-4" />
                            </>
                          )}
                        </button>

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
    </div>
  );
}
