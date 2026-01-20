import React, { useState } from 'react';
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
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'tips'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const [tips, setTips] = useState(MOCK_TIPS);
  const [tipComments, setTipComments] = useState(MOCK_COMMENTS);

  const [showWriteTip, setShowWriteTip] = useState(false);
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [showCommentsForTip, setShowCommentsForTip] = useState(null);
  const [newComment, setNewComment] = useState({}); // { [tipId]: string }

  const [newTip, setNewTip] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  // 2. 현재 사용자의 학교 일정 찾기 (없으면 고려대로 대체)
  const schedule = MOCK_SCHEDULES.find((s) => s.university === user?.university) || MOCK_SCHEDULES[0];

  // 3. 팁 필터링 및 정렬
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

  // 4. 핸들러 함수들
  const handleSubmitTip = () => {
    if (!newTip.title.trim() || !newTip.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newTipObj = {
      ...newTip,
      id: `tip-${Date.now()}`,
      userName: user?.name || '익명',
      department: user?.department || '미정',
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: 0,
      likedByUser: false,
    };

    setTips([newTipObj, ...tips]);
    alert('팁이 등록되었습니다!');
    setShowWriteTip(false);
    setNewTip({ title: '', content: '', category: 'general' });
  };

  const handleLikeTip = (tipId) => {
    setTips((prev) =>
        prev.map((tip) =>
            tip.id === tipId
                ? { ...tip, likes: tip.likedByUser ? tip.likes - 1 : tip.likes + 1, likedByUser: !tip.likedByUser }
                : tip
        )
    );
  };

  const handleAddComment = (tipId) => {
    if (!newComment[tipId]?.trim()) return;

    const newCommentObj = {
      id: `C${Date.now()}`,
      tipId,
      userId: user?.id,
      userName: user?.name || '익명',
      content: newComment[tipId],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTipComments((prev) => [...prev, newCommentObj]);
    setNewComment((prev) => ({ ...prev, [tipId]: '' }));
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'registration': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'add-drop': return 'bg-green-100 text-green-700 border-green-200';
      case 'tuition': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryName = (category) => {
    const names = {
      registration: '수강신청', 'add-drop': '수강정정', tuition: '등록금',
      strategy: '전략', technical: '기술', course: '강의', general: '일반'
    };
    return names[category] || category;
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="size-5" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">수강신청 정보</h1>
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
                          {schedule.university === 'KOREA' ? '고려대학교' : schedule.university} {schedule.semester}
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
                                  <p className="text-gray-600 mb-2">{event.description}</p>
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
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">전체 카테고리</option>
                      <option value="strategy">전략</option>
                      <option value="technical">기술</option>
                      <option value="course">강의</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="latest">최신순</option>
                      <option value="likes-desc">좋아요순</option>
                    </select>
                  </div>
                </div>

                {/* 팁 작성 버튼 */}
                <button
                    onClick={() => setShowWriteTip(!showWriteTip)}
                    className="w-full mb-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="size-5" />
                  {showWriteTip ? "작성 취소" : "나만의 꿀팁 공유하기"}
                </button>

                {/* 팁 작성 폼 */}
                {showWriteTip && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-fade-in">
                      <h3 className="text-lg font-bold mb-4">꿀팁 작성</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
                            <select
                                value={newTip.category}
                                onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                            >
                              <option value="general">일반</option>
                              <option value="strategy">전략</option>
                              <option value="technical">기술</option>
                              <option value="course">강의</option>
                            </select>
                          </div>
                          <div className="col-span-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                            <input
                                type="text"
                                value={newTip.title}
                                onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                                placeholder="제목을 입력하세요"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                          <textarea
                              value={newTip.content}
                              onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                              rows={5}
                              className="w-full p-2 border rounded-lg resize-none"
                              placeholder="내용을 입력하세요"
                          />
                        </div>
                        <button onClick={handleSubmitTip} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                          등록하기
                        </button>
                      </div>
                    </div>
                )}

                {/* 팁 목록 */}
                <div className="space-y-4">
                  {filteredTips.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">검색 결과가 없습니다.</div>
                  ) : (
                      filteredTips.map((tip) => {
                        const isExpanded = expandedTipId === tip.id;
                        const isLong = tip.content.length > 200;

                        return (
                            <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                          <span className={`text-xs px-2 py-1 rounded-full border mr-2 ${
                              tip.category === 'strategy' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getCategoryName(tip.category)}
                          </span>
                                  <h3 className="inline text-lg font-bold text-gray-900">{tip.title}</h3>
                                </div>
                                <span className="text-xs text-gray-400">{tip.createdAt}</span>
                              </div>

                              <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                {isLong && !isExpanded ? `${tip.content.slice(0, 200)}...` : tip.content}
                                {isLong && (
                                    <button onClick={() => setExpandedTipId(isExpanded ? null : tip.id)} className="text-blue-600 text-sm ml-1 hover:underline">
                                      {isExpanded ? "접기" : "더보기"}
                                    </button>
                                )}
                              </p>

                              <div className="flex items-center gap-4 text-sm border-t pt-3">
                                <div className="flex items-center gap-2 text-gray-600 mr-auto">
                                  <span className="font-bold">{tip.userName}</span>
                                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tip.department}</span>
                                </div>

                                <button onClick={() => handleLikeTip(tip.id)} className={`flex items-center gap-1 ${tip.likedByUser ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                  <ThumbsUp className={`size-4 ${tip.likedByUser ? 'fill-blue-600' : ''}`} /> {tip.likes}
                                </button>

                                <button onClick={() => setShowCommentsForTip(showCommentsForTip === tip.id ? null : tip.id)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                                  <MessageSquare className="size-4" /> {tipComments.filter(c => c.tipId === tip.id).length}
                                </button>
                              </div>

                              {/* 댓글창 */}
                              {showCommentsForTip === tip.id && (
                                  <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-3 rounded-lg">
                                    <div className="space-y-2 mb-3">
                                      {tipComments.filter(c => c.tipId === tip.id).map(comment => (
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
                                          value={newComment[tip.id] || ''}
                                          onChange={(e) => setNewComment({ ...newComment, [tip.id]: e.target.value })}
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(tip.id)}
                                          className="flex-1 px-3 py-2 text-sm border rounded"
                                      />
                                      <button onClick={() => handleAddComment(tip.id)} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">
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