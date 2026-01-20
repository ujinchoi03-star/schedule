import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User as UserIcon,
  School,
  GraduationCap,
  Settings,
  Save,
  Clock,
  Calendar,
  BookOpen,
  X,
  Plus,
  Star,
  Filter,
  Search,
  Bookmark,
  Edit2,
  Trash2,
} from "lucide-react";
import { universities } from "../data/universities";

/**
 * props:
 * - user
 * - onSave(updatedUser)
 * - onBack()
 */

export function MyPage({ user, onSave, onBack }) {
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'preferences'

  // Constants
  const weekDays = ["월", "화", "수", "목", "금"];
  const categories = ["글쓰기", "인문", "사회", "과학", "예체능"];

  // 학교/학과 정보
  const [universitySearch, setUniversitySearch] = useState(user.university || "");
  const [selectedUniversity, setSelectedUniversity] = useState(
    universities.find((u) => u.name === user.university) || null
  );
  const [departmentSearch, setDepartmentSearch] = useState(user.department || "");
  const [selectedDepartment, setSelectedDepartment] = useState(user.department || "");
  const [selectedGrade, setSelectedGrade] = useState(user.grade || null);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // 취향 설정
  const [preferredBreaks, setPreferredBreaks] = useState(user.preferences?.preferredBreaks ?? 1);
  const [preferredBreakDays, setPreferredBreakDays] = useState(user.preferences?.preferredBreakDays ?? []);
  const [timePreference, setTimePreference] = useState(user.preferences?.timePreference ?? "none"); // 'morning' | 'afternoon' | 'none'
  const [excludedTimeSlots, setExcludedTimeSlots] = useState(user.preferences?.excludedTimeSlots ?? []);
  const [selectedCategories, setSelectedCategories] = useState(user.preferences?.generalEducationPreferences ?? []);
  const [maxCredits, setMaxCredits] = useState(user.preferences?.maxCredits ?? 18);
  const [maxGapHours, setMaxGapHours] = useState(user.preferences?.maxGapHours ?? 3);
  const [minRating, setMinRating] = useState(user.preferences?.minRating ?? 0);

  const [showExcludedTimeForm, setShowExcludedTimeForm] = useState(false);
  const [newExcludedDay, setNewExcludedDay] = useState(0);
  const [newExcludedStartTime, setNewExcludedStartTime] = useState(9);
  const [newExcludedEndTime, setNewExcludedEndTime] = useState(10);

  // 스크랩한 팁 state
  const [scrapedTips, setScrapedTips] = useState([]);
  // 스크랩한 강의평 state
  const [scrapedReviews, setScrapedReviews] = useState([]);

  // 내가 쓴 팁 & 강의평 state
  const [myTips, setMyTips] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // 스크랩 내부 탭 state
  const [scrapSubTab, setScrapSubTab] = useState("tips"); // 'tips' | 'reviews'
  // 내 글 내부 탭 state
  const [mypostsSubTab, setMypostsSubTab] = useState("tips"); // 'tips' | 'reviews'
  // 더보기/접기 상태 관리 (Key: `{type}-{id}`)
  const [expandedScraps, setExpandedScraps] = useState({});

  // 스크랩 취소 핸들러 (팁)
  const handleUnscrapTip = async (tipId) => {
    if (!window.confirm("스크랩을 취소하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}/scrap?userId=${user.email}`, {
        method: "POST",
      });
      if (res.ok) {
        setScrapedTips((prev) => prev.filter((t) => t.id !== tipId));
      } else {
        alert("스크랩 취소 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  // 스크랩 취소 핸들러 (강의평)
  const handleUnscrapReview = async (reviewId) => {
    if (!window.confirm("스크랩을 취소하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}/scrap?userId=${user.email}`, {
        method: "POST",
      });
      if (res.ok) {
        setScrapedReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        alert("스크랩 취소 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  // 내 강의평 삭제 핸들러
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("정말로 이 강의평을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
        alert("삭제되었습니다.");
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  // 팁/리뷰 데이터 불러오기
  useEffect(() => {
    if (!user?.email) return;

    // 스크랩한 팁
    fetch(`http://localhost:8080/api/tips/scraped?userId=${user.email}`)
      .then(res => res.json())
      .then(data => setScrapedTips(Array.isArray(data) ? data : []))
      .catch(err => console.error("스크랩 팁 로드 실패", err));

    // 스크랩한 강의평
    fetch(`http://localhost:8080/api/reviews/scraped?userId=${user.email}`)
      .then(res => res.json())
      .then(data => setScrapedReviews(Array.isArray(data) ? data : []))
      .catch(err => console.error("스크랩 리뷰 로드 실패", err));

    // 내가 쓴 팁
    fetch(`http://localhost:8080/api/tips/my?userId=${user.email}`)
      .then(res => res.json())
      .then(data => setMyTips(Array.isArray(data) ? data : []))
      .catch(err => console.error("내 팁 로드 실패", err));

    // 내가 쓴 강의평
    fetch(`http://localhost:8080/api/reviews/my?userId=${user.email}`)
      .then(res => res.json())
      .then(data => setMyReviews(Array.isArray(data) ? data : []))
      .catch(err => console.error("내 리뷰 로드 실패", err));

  }, [user]);

  const toggleExpand = (type, id) => {
    setExpandedScraps(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  // 팁 수정 위한 state
  const [editingTip, setEditingTip] = useState(null); // 수정 중인 팁 객체 (null이면 수정 아님)

  // 팁 삭제 핸들러
  const handleDeleteTip = async (tipId) => {
    if (!window.confirm("정말로 이 팁을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tips/${tipId}?userId=${user.email}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("삭제되었습니다.");
        setMyTips(prev => prev.filter(t => t.id !== tipId));
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  // 팁 수정 저장 핸들러
  const handleUpdateTip = async () => {
    if (!editingTip) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tips/${editingTip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingTip,
          userId: user.email // 본인 확인용
        })
      });

      if (res.ok) {
        alert("수정되었습니다.");
        setEditingTip(null);
        // 목록 새로고침
        fetch(`http://localhost:8080/api/tips/my?userId=${user.email}`)
          .then(res => res.json())
          .then(data => setMyTips(data));
      } else {
        alert("수정 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const TIME_SLOTS = [
    { label: "09:00", value: 9 },
    { label: "10:00", value: 10 },
    { label: "11:00", value: 11 },
    { label: "12:00", value: 12 },
    { label: "13:00", value: 13 },
    { label: "14:00", value: 14 },
    { label: "15:00", value: 15 },
    { label: "16:00", value: 16 },
    { label: "17:00", value: 17 },
    { label: "18:00", value: 18 },
  ];

  const filteredUniversities = universities.filter((uni) =>
    uni.name.toLowerCase().includes(universitySearch.toLowerCase())
  );

  const filteredDepartments = selectedUniversity
    ? selectedUniversity.departments.filter((dept) =>
      dept.toLowerCase().includes(departmentSearch.toLowerCase())
    )
    : [];

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleAddExcludedTime = () => {
    // (원본 코드 흐름 유지) 0도 valid한 day라서 조건을 좀 더 안전하게 처리
    if (newExcludedStartTime >= newExcludedEndTime) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    setExcludedTimeSlots((prev) => [
      ...prev,
      { day: newExcludedDay, startTime: newExcludedStartTime, endTime: newExcludedEndTime },
    ]);
    setNewExcludedDay(0);
    setNewExcludedStartTime(9);
    setNewExcludedEndTime(10);
    setShowExcludedTimeForm(false);
  };

  const handleRemoveExcludedTime = (index) => {
    setExcludedTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      university: selectedUniversity?.name || user.university,
      department: selectedDepartment || user.department,
      grade: selectedGrade || user.grade,
      preferences: {
        preferredBreaks,
        preferredBreakDays,
        timePreference,
        excludedTimeSlots,
        generalEducationPreferences: selectedCategories,
        maxCredits,
        maxGapHours,
        minRating,
      },
    };

    // 백엔드에 저장 요청 (학교, 학과, 학년 정보)
    fetch("http://localhost:8080/api/auth/onboarding", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({
        university: updatedUser.university,
        department: updatedUser.department,
        grade: updatedUser.grade,
      }),
    })
      .then((res) => {
        if (res.ok) {
          alert("저장되었습니다!");
          onSave(updatedUser);
        } else {
          alert("저장에 실패했습니다.");
        }
      })
      .catch((err) => {
        console.error("저장 오류:", err);
        alert("서버와 통신 중 오류가 발생했습니다.");
      });
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
        {/* Tabs */}
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
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === "preferences"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            <Settings className="size-5" />
            취향 설정
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
                  {/* 학교 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
                    <button
                      type="button"
                      onClick={() => setShowUniversityModal(true)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-left flex items-center justify-between"
                    >
                      <span className={selectedUniversity ? "text-gray-900" : "text-gray-400"}>
                        {selectedUniversity?.name || "학교를 선택하세요"}
                      </span>
                      <School className="size-5 text-gray-400" />
                    </button>
                  </div>

                  {/* 학과 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedUniversity) setShowDepartmentModal(true);
                      }}
                      disabled={!selectedUniversity}
                      className={`w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg transition-colors text-left flex items-center justify-between ${selectedUniversity ? "hover:border-blue-500" : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <span className={selectedDepartment ? "text-gray-900" : "text-gray-400"}>
                        {selectedDepartment || "학과를 선택하세요"}
                      </span>
                      <GraduationCap className="size-5 text-gray-400" />
                    </button>
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
          ) : activeTab === "myposts" ? (
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
          ) : (
            <div className="space-y-8">
              {/* 공강 개수 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-5 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">선호 공강 개수</label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={preferredBreaks}
                      onChange={(e) => setPreferredBreaks(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0일</span>
                      <span>1일</span>
                      <span>2일</span>
                      <span>3일</span>
                      <span>4일</span>
                      <span>5일+</span>
                    </div>
                  </div>
                  <div className="w-20 text-center bg-blue-50 text-blue-700 py-2 rounded-lg">
                    {preferredBreaks === 5 ? "5일 이상" : `${preferredBreaks}일`}
                  </div>
                </div>
              </div>

              {/* 공강 요일 (한 줄 레이아웃 수정형) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-5 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    선호 공강 요일 (다중 선택 가능)
                  </label>
                </div>

                {/* 기존 flex-wrap -> flex-nowrap + 각 버튼 flex-1 로 한 줄 꽉 채우기 */}
                <div className="flex flex-nowrap gap-2 w-full">
                  {weekDays.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setPreferredBreakDays((prev) =>
                          prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
                        );
                      }}
                      className={`flex-1 py-4 rounded-lg border-2 transition-all text-center font-medium ${preferredBreakDays.includes(index)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간대 선호 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="size-5 text-purple-600" />
                  <label className="text-sm font-medium text-gray-700">선호 시간대</label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTimePreference("morning")}
                    className={`p-4 rounded-lg border-2 transition-all ${timePreference === "morning"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <div className="font-medium">아침형</div>
                    <div className="text-sm opacity-75 mt-1">오전 수업 선호</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimePreference("afternoon")}
                    className={`p-4 rounded-lg border-2 transition-all ${timePreference === "afternoon"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <div className="font-medium">오후형</div>
                    <div className="text-sm opacity-75 mt-1">오후 수업 선호</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimePreference("none")}
                    className={`p-4 rounded-lg border-2 transition-all ${timePreference === "none"
                      ? "border-gray-600 bg-gray-50 text-gray-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <div className="font-medium">상관없음</div>
                    <div className="text-sm opacity-75 mt-1">시간 무관</div>
                  </button>
                </div>
              </div>

              {/* 제외 시간대 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-red-600" />
                    <label className="text-sm font-medium text-gray-700">제외 시간대 (다중 선택 가능)</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExcludedTimeForm(!showExcludedTimeForm)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Plus className="size-4" />
                    추가
                  </button>
                </div>

                {/* 추가된 제외 시간대 목록 */}
                {excludedTimeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {excludedTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 rounded-lg border-2 bg-red-50 text-red-700 border-red-600 flex items-center gap-2"
                      >
                        <span>{weekDays[slot.day]}</span>
                        <span>
                          {slot.startTime}:00 - {slot.endTime}:00
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExcludedTime(index)}
                          className="text-red-700 hover:text-red-900"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 시간대 추가 폼 */}
                {showExcludedTimeForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <select
                        value={newExcludedDay}
                        onChange={(e) => setNewExcludedDay(Number(e.target.value))}
                        className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      >
                        {weekDays.map((day, index) => (
                          <option key={day} value={index}>
                            {day}
                          </option>
                        ))}
                      </select>

                      <select
                        value={newExcludedStartTime}
                        onChange={(e) => setNewExcludedStartTime(Number(e.target.value))}
                        className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-gray-500">~</span>

                      <select
                        value={newExcludedEndTime}
                        onChange={(e) => setNewExcludedEndTime(Number(e.target.value))}
                        className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddExcludedTime}
                        className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExcludedTimeForm(false)}
                        className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 교양 취향 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="size-5 text-green-600" />
                  <label className="text-sm font-medium text-gray-700">선호 교양 카테고리 (다중 선택 가능)</label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-6 py-3 rounded-lg border-2 transition-all ${selectedCategories.includes(category)
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 최대 학점 */}
              <div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">최대 수강 학점</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="9"
                      max="24"
                      value={maxCredits || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMaxCredits(value === "" ? 0 : Number(value));
                      }}
                      className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="18"
                    />
                    <span className="text-gray-500 text-sm">학점</span>
                  </div>
                </div>
              </div>

              {/* 추가 필터 옵션 */}
              <div className="border-t pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="size-5 text-orange-600" />
                  <label className="text-sm font-medium text-gray-700">고급 필터 옵션</label>
                </div>

                <div className="space-y-6">
                  {/* 최대 공강 시간 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      최대 연속 공강 시간 (우주 공강 방지)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={maxGapHours}
                          onChange={(e) => setMaxGapHours(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          {Array.from({ length: 11 }, (_, i) => (
                            <span key={i}>{i}</span>
                          ))}
                        </div>
                      </div>
                      <div className="w-24 text-center bg-orange-50 text-orange-700 py-2 rounded-lg">
                        {maxGapHours === 0 ? "제한없음" : `${maxGapHours}시간`}
                      </div>
                    </div>
                  </div>

                  {/* 최소 강의 평점 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                      <Star className="size-4 text-yellow-600" />
                      최소 강의 평점 (꿀강 필터)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          value={minRating}
                          onChange={(e) => setMinRating(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          {Array.from({ length: 6 }, (_, i) => (
                            <span key={i}>{i}</span>
                          ))}
                        </div>
                      </div>
                      <div className="w-24 text-center bg-yellow-50 text-yellow-700 py-2 rounded-lg">
                        {minRating === 0 ? "제한없음" : `${minRating}점 이상`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 뒤로가기 버튼 */}

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
