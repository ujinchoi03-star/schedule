import React, { useState, useEffect } from 'react';
import { TimetableGrid } from './TimetableGrid';
// 🚀 [삭제] CustomTimetablePage import 제거 (더 이상 쓰지 않음)
import {
  LogOut, Sparkles, ArrowLeft, User as UserIcon, Bookmark, BookmarkCheck, Loader2
} from 'lucide-react';
import { logout, saveUser } from '../utils/storage';
import api from '../api/axios';

// 🎨 데이터 포맷팅 함수
const formatTimetableData = (backendData) => {
  if (!backendData || !Array.isArray(backendData)) return [];

  return backendData.map((lectureList, index) => {
    const courseMap = new Map();
    const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };

    lectureList.forEach((lec) => {
      if (!courseMap.has(lec.id)) {
        courseMap.set(lec.id, { ...lec, times: [] });
      }
      if (lec.startTime >= 0 && lec.endTime > lec.startTime) {
        courseMap.get(lec.id).times.push({
          day: dayMap[lec.day] ?? -1,
          startTime: lec.startTime,
          endTime: lec.endTime
        });
      }
    });

    const uniqueCourses = Array.from(courseMap.values());
    const totalCredits = uniqueCourses.reduce((sum, lec) => sum + (lec.credit || 0), 0);
    const avgRating = uniqueCourses.length > 0
        ? (uniqueCourses.reduce((sum, lec) => sum + (lec.rating || 0), 0) / uniqueCourses.length).toFixed(1)
        : 0;

    return {
      id: `rec-${Date.now()}-${index}`,
      name: `추천 시간표 ${index + 1}`,
      totalCredits: totalCredits,
      score: avgRating,
      courses: uniqueCourses.map(lec => ({
        ...lec,
        type: lec.category && lec.category.includes('전공') ? 'major' : 'general',
      }))
    };
  });
};

export function Timetable({ user, onLogout, onBack, onGoToMyPage, generatedResults }) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [savedTimetables, setSavedTimetables] = useState(user?.savedTimetables || []);

  const [recommendedTimetables, setRecommendedTimetables] = useState(() => {
    return generatedResults ? formatTimetableData(generatedResults) : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (generatedResults) {
      setRecommendedTimetables(formatTimetableData(generatedResults));
      return;
    }

    const fetchRecommendations = async () => {
      // 🚀 'saved' 탭이 아닐 때만(=추천 탭일 때) 실행
      if (activeTab === 'saved') return;

      try {
        setIsGenerating(true);
        const requestData = {
          university: user.university || 'KOREA',
          year: 2026, semester: 1,
          minCredit: user.preferences?.minCredits || 15,
          maxCredit: user.preferences?.maxCredits || 18,
          minMajorCredit: 9, minMustHaveMajorCount: 0, minMustHaveGeneralCount: 0,
          mustHaveMajorIds: [], mustHaveGeneralIds: [], avoidKeywords: [], blockedTimes: [],
          minRating: 0, onlyMajor: false, excludeNoTime: true
        };

        const response = await api.post('/timetable/generate', requestData);
        setRecommendedTimetables(formatTimetableData(response.data));

      } catch (error) {
        console.error("추천 시간표 생성 실패:", error);
        // 에러 처리 로직 생략 (기존 유지)
      } finally {
        setIsGenerating(false);
      }
    };

    fetchRecommendations();
  }, [activeTab, user, generatedResults]);

  const handleLogout = () => { logout?.(); onLogout?.(); };

  const handleToggleSaveTimetable = (timetable) => {
    const isSaved = savedTimetables.some((t) => t.id === timetable.id);
    let newSavedTimetables;
    if (isSaved) newSavedTimetables = savedTimetables.filter((t) => t.id !== timetable.id);
    else newSavedTimetables = [...savedTimetables, timetable];
    setSavedTimetables(newSavedTimetables);
    const updatedUser = { ...user, savedTimetables: newSavedTimetables };
    saveUser?.(updatedUser);
  };

  const isTimetableSaved = (timetableId) => savedTimetables.some((t) => t.id === timetableId);

  return (
      <div className="min-h-screen bg-gray-50">
        {/* 🚀 [유지] z-50 적용된 상단 바 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer" onClick={onBack}>
                시간표 추천 시스템
              </h1>
              <p className="text-sm text-gray-600 mt-1">{user?.name}님 · {user?.university} · {user?.department}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onGoToMyPage} className="flex gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"><UserIcon className="size-4" /> 마이페이지</button>
              <button onClick={handleLogout} className="flex gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"><LogOut className="size-4" /> 로그아웃</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 🚀 [수정] 탭 버튼 그룹: '맞춤 시간표' 제거 */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('recommended')} className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'recommended' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}><Sparkles className="size-5" /> 추천 시간표</button>
            <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'saved' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}>
              <BookmarkCheck className="size-5" /> 보관한 시간표 {savedTimetables.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{savedTimetables.length}</span>}
            </button>
          </div>

          {/* 🚀 [수정] 렌더링 로직 단순화 (추천 vs 보관) */}
          {activeTab === 'saved' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedTimetables.map((timetable) => (
                    <div key={timetable.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex justify-between mb-4"><h3 className="font-bold">{timetable.name}</h3><button onClick={() => handleToggleSaveTimetable(timetable)} className="text-red-500 text-sm font-bold">삭제</button></div>
                      <TimetableGrid courses={timetable.courses} compact />
                    </div>
                ))}
                {savedTimetables.length === 0 && (
                    <div className="col-span-2 text-center py-20 text-gray-400">보관된 시간표가 없습니다.</div>
                )}
              </div>
          ) : (
              // 기본값: recommended 탭
              <div>
                {isGenerating ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
                      <Loader2 className="size-10 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">시간표를 생성하고 있습니다...</p>
                    </div>
                ) : recommendedTimetables.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600 font-bold">조건에 맞는 시간표를 찾지 못했습니다.</p>
                      <button onClick={onBack} className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold">조건 다시 설정하기</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {recommendedTimetables.map((timetable) => (
                          <div key={timetable.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-lg text-gray-900">{timetable.name} <span className="text-sm font-normal text-gray-500 ml-2">({timetable.totalCredits}학점)</span></h3>
                              <button onClick={() => handleToggleSaveTimetable(timetable)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${isTimetableSaved(timetable.id) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                                {isTimetableSaved(timetable.id) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />} {isTimetableSaved(timetable.id) ? '보관됨' : '보관'}
                              </button>
                            </div>
                            <TimetableGrid courses={timetable.courses} compact />
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}
        </div>
        {onBack && <div className="max-w-7xl mx-auto px-4 pb-8"><button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg"><ArrowLeft className="size-5" /> 뒤로가기</button></div>}
      </div>
  );
}