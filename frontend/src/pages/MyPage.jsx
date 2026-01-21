import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User as UserIcon,
  School,
  GraduationCap,
  Save,
  Bookmark,
  Edit2,
  Trash2,
  Star,
  X,
  Search
} from "lucide-react";
import { universities } from "../data/universities";
import api from "../api/axios";

export function MyPage({ user, onSave, onBack }) {
  // 'preferences' 탭 제거 (info, scrap, myposts만 남김)
  const [activeTab, setActiveTab] = useState("info");

  // 학교/학과 정보 State
  const [universitySearch, setUniversitySearch] = useState(user.university || "");
  const [selectedUniversity, setSelectedUniversity] = useState(
    universities.find((u) => u.name === user.university) || null
  );
  const [departmentSearch, setDepartmentSearch] = useState(user.department || "");
  const [selectedDepartment, setSelectedDepartment] = useState(user.department || "");
  const [selectedGrade, setSelectedGrade] = useState(user.grade || null);

  // 모달 표시 여부
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // 스크랩 & 내 글 State
  const [scrapedTips, setScrapedTips] = useState([]);
  const [scrapedReviews, setScrapedReviews] = useState([]);
  const [myTips, setMyTips] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // 내부 탭 State
  const [scrapSubTab, setScrapSubTab] = useState("tips");
  const [mypostsSubTab, setMypostsSubTab] = useState("tips");
  const [expandedScraps, setExpandedScraps] = useState({});

  // 팁 수정 State
  const [editingTip, setEditingTip] = useState(null);

  // 데이터 불러오기
  useEffect(() => {
    if (!user?.email) return;

    const fetchData = async () => {
      try {
        const [tipsRes, reviewsRes, myTipsRes, myReviewsRes] = await Promise.all([
          api.get(`/api/tips/scraped?userId=${user.email}`),
          api.get(`/api/reviews/scraped?userId=${user.email}`),
          api.get(`/api/tips/my?userId=${user.email}`),
          api.get(`/api/reviews/my?userId=${user.email}`)
        ]);

        setScrapedTips(Array.isArray(tipsRes.data) ? tipsRes.data : []);
        setScrapedReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        setMyTips(Array.isArray(myTipsRes.data) ? myTipsRes.data : []);
        setMyReviews(Array.isArray(myReviewsRes.data) ? myReviewsRes.data : []);
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    };
    fetchData();
  }, [user]);

  // --- 핸들러 함수들 ---

  const handleUnscrapTip = async (tipId) => {
    if (!window.confirm("스크랩을 취소하시겠습니까?")) return;
    try {
      await api.post(`/api/tips/${tipId}/scrap?userId=${user.email}`);
      setScrapedTips((prev) => prev.filter((t) => t.id !== tipId));
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleUnscrapReview = async (reviewId) => {
    if (!window.confirm("스크랩을 취소하시겠습니까?")) return;
    try {
      await api.post(`/api/reviews/${reviewId}/scrap?userId=${user.email}`);
      setScrapedReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("정말로 이 강의평을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      alert("삭제되었습니다.");
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!window.confirm("정말로 이 팁을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/tips/${tipId}?userId=${user.email}`);
      setMyTips(prev => prev.filter(t => t.id !== tipId));
      alert("삭제되었습니다.");
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleUpdateTip = async () => {
    if (!editingTip) return;
    try {
      await api.put(`/api/tips/${editingTip.id}`, {
        ...editingTip,
        userId: user.email
      });
      alert("수정되었습니다.");
      setEditingTip(null);

      const res = await api.get(`/api/tips/my?userId=${user.email}`);
      setMyTips(res.data);
    } catch (e) {
      alert("수정 실패");
    }
  };

  const toggleExpand = (type, id) => {
    setExpandedScraps(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  // 필터링 로직
  const filteredUniversities = universities.filter((uni) =>
    uni.name.toLowerCase().includes(universitySearch.toLowerCase())
  );

  const filteredDepartments = selectedUniversity
    ? selectedUniversity.departments.filter((dept) =>
      dept.toLowerCase().includes(departmentSearch.toLowerCase())
    )
    : [];

  // 저장 로직 (기본 정보만 저장)
  const handleSave = async () => {
    const updatedUser = {
      ...user,
      university: selectedUniversity?.name || user.university,
      department: selectedDepartment || user.department,
      grade: selectedGrade || user.grade,
      // preferences 필드는 제거됨
    };

    try {
      await api.patch("/api/auth/onboarding", {
        university: updatedUser.university,
        department: updatedUser.department,
        grade: updatedUser.grade,
      });

      onSave(updatedUser);
      alert("저장되었습니다! 🎉");

    } catch (err) {
      console.error("저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
                <ArrowLeft className="size-6 text-gray-600" />
              </button>
              <UserIcon className="size-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
                <p className="text-sm text-gray-600">{user.name}님의 정보</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Save className="size-4" />
              저장
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs (취향 설정 제거됨) */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === "info"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            <School className="size-5" />
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab("scrap")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === "scrap"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            <Bookmark className="size-5" />
            스크랩
          </button>
          <button
            onClick={() => setActiveTab("myposts")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === "myposts"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            <Edit2 className="size-5" />
            내가 쓴 글
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {activeTab === "info" ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <School className="size-5 text-blue-600" />
                  학교 및 학과 정보
                </h3>

                <div className="space-y-4">
                  {/* 학교 선택 (읽기 전용) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
                    <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-left flex items-center justify-between cursor-not-allowed">
                      <span className="text-gray-500">
                        {user.university || "학교 정보 없음"}
                      </span>
                      <School className="size-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-1">* 학교 정보는 수정할 수 없습니다.</p>
                  </div>

                  {/* 학과 선택 (읽기 전용) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                    <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-left flex items-center justify-between cursor-not-allowed">
                      <span className="text-gray-500">
                        {user.department || "학과 정보 없음"}
                      </span>
                      <GraduationCap className="size-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-1">* 학과 정보는 수정할 수 없습니다.</p>
                  </div>

                  {/* 학년 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <select
                      value={selectedGrade || ""}
                      onChange={(e) => setSelectedGrade(e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">선택하세요</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="5">5학년 이상</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === "scrap" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bookmark className="size-5 text-yellow-500 fill-yellow-500" />
                  나의 스크랩
                </h3>

                {/* Sub Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setScrapSubTab("tips")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${scrapSubTab === "tips"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    강의 팁
                  </button>
                  <button
                    onClick={() => setScrapSubTab("reviews")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${scrapSubTab === "reviews"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    강의평
                  </button>
                </div>
              </div>

              {scrapSubTab === "tips" ? (
                scrapedTips.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    스크랩한 팁이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrapedTips.map((tip) => (
                      <div key={tip.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full border mb-2 inline-block bg-white ${tip.category === 'strategy' ? 'text-blue-700 border-blue-200' :
                              tip.category === 'technical' ? 'text-purple-700 border-purple-200' :
                                'text-gray-700 border-gray-200'
                              }`}>
                              {tip.category === 'strategy' ? '전략' :
                                tip.category === 'technical' ? '기술' :
                                  tip.category === 'course' ? '강의' : '일반'}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">{tip.title}</h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnscrapTip(tip.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="스크랩 취소"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        <p className={`text-gray-600 text-sm mb-3 ${expandedScraps[`tip-${tip.id}`] ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                          {tip.content}
                        </p>
                        {tip.content.length > 50 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand("tip", tip.id);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium mb-3"
                          >
                            {expandedScraps[`tip-${tip.id}`] ? "접기" : "더보기"}
                          </button>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{tip.userName} · {tip.department}</span>
                          <span>{tip.createdAt?.split('T')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                scrapedReviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    스크랩한 강의평이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrapedReviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{review.lectureName || "강의명 없음"}</span>
                              <span className="text-sm text-gray-600">({review.professor || "교수님"})</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">{review.semester}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{review.university}</span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`size-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnscrapReview(review.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="스크랩 취소"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        <p className={`text-gray-600 text-sm mb-3 ${expandedScraps[`review-${review.id}`] ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
                          {review.content}
                        </p>
                        {review.content.length > 50 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand("review", review.id);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium mb-3"
                          >
                            {expandedScraps[`review-${review.id}`] ? "접기" : "더보기"}
                          </button>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{review.createdAt?.split('T')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ) : (
            // activeTab === "myposts"
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Edit2 className="size-5 text-blue-600" />
                  내가 쓴 글
                </h3>

                {/* Sub Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setMypostsSubTab("tips")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mypostsSubTab === "tips"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    강의 팁
                  </button>
                  <button
                    onClick={() => setMypostsSubTab("reviews")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mypostsSubTab === "reviews"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    강의평
                  </button>
                </div>
              </div>

              {mypostsSubTab === "tips" ? (
                myTips.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    작성한 팁이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTips.map((tip) => (
                      <div key={tip.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full border mb-2 inline-block bg-white ${tip.category === 'strategy' ? 'text-blue-700 border-blue-200' :
                              tip.category === 'technical' ? 'text-purple-700 border-purple-200' :
                                'text-gray-700 border-gray-200'
                              }`}>
                              {tip.category === 'strategy' ? '전략' :
                                tip.category === 'technical' ? '기술' :
                                  tip.category === 'course' ? '강의' : '일반'}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">{tip.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingTip(tip)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="수정"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTip(tip.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tip.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex gap-3">
                            <span className="flex items-center gap-1"><Star className="size-3" /> {tip.likesCount}</span>
                          </div>
                          <span>{tip.createdAt?.split('T')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                myReviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    작성한 강의평이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">{review.lectureName || "강의명 없음"}</span>
                              <span className="text-sm text-gray-600">({review.professor || "교수님"})</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">{review.semester}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{review.university}</span>
                              {review.isAnonymous && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">익명</span>
                              )}
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`size-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        <p className={`text-gray-600 text-sm mb-3 ${expandedScraps[`myreview-${review.id}`] ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
                          {review.content}
                        </p>
                        {review.content.length > 50 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand("myreview", review.id);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium mb-3"
                          >
                            {expandedScraps[`myreview-${review.id}`] ? "접기" : "더보기"}
                          </button>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Star className="size-3" /> {review.likesCount}</span>
                          <span>{review.createdAt?.split('T')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 학교 선택 모달 */}
      {
        showUniversityModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col border-2 border-gray-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">학교 선택</h3>
                <button
                  onClick={() => {
                    setShowUniversityModal(false);
                    setUniversitySearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="relative">
                  <input
                    type="text"
                    value={universitySearch}
                    onChange={(e) => setUniversitySearch(e.target.value)}
                    placeholder="학교명을 검색하세요"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg outline-none
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                hover:border-gray-400 transition"
                    autoFocus
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredUniversities.length > 0 ? (
                  <div className="space-y-2">
                    {filteredUniversities.map((uni) => (
                      <button
                        key={uni.id}
                        onClick={() => {
                          setSelectedUniversity(uni);
                          setSelectedDepartment("");
                          setDepartmentSearch("");
                          setShowUniversityModal(false);
                          setUniversitySearch("");
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                      >
                        {uni.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* 학과 선택 모달 */}
      {
        showDepartmentModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col border-2 border-gray-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">학과 선택</h3>
                <button
                  onClick={() => {
                    setShowDepartmentModal(false);
                    setDepartmentSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="relative">
                  <input
                    type="text"
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    placeholder="학과명을 검색하세요"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg outline-none
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            hover:border-gray-400 transition"
                    autoFocus
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredDepartments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredDepartments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowDepartmentModal(false);
                          setDepartmentSearch("");
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">검색 결과가 없습니다</div>
                )}
              </div>
            </div>
          </div>
        )
      }


      {/* 팁 수정 모달 */}
      {
        editingTip && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">팁 수정하기</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={editingTip.category}
                    onChange={(e) => setEditingTip({ ...editingTip, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="general">일반</option>
                    <option value="strategy">전략</option>
                    <option value="technical">기술</option>
                    <option value="course">강의</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editingTip.title}
                    onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <textarea
                    rows={5}
                    value={editingTip.content}
                    onChange={(e) => setEditingTip({ ...editingTip, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateTip}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  수정 완료
                </button>
                <button
                  onClick={() => setEditingTip(null)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}