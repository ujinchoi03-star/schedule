import { useState, useMemo } from 'react';
import { mockCourses } from '../data/mockCourses.js';
import { generateRecommendedTimetables } from '../utils/timetableUtils';
import { TimetableGrid } from './TimetableGrid';
import { CustomTimetablePage } from './CustomTimetablePage';
import {
  LogOut,
  Sparkles,
  Calendar,
  ArrowLeft,
  User as UserIcon,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { logout, saveUser } from '../utils/storage';

export function Timetable({ user, onLogout, onBack, onGoToMyPage }) {
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'custom' | 'saved'
  const [savedTimetables, setSavedTimetables] = useState(user?.savedTimetables || []);

// useMemo 위에 변수로 빼기 (참조 통일)
const preferences = user?.preferences;
const department = user?.department;

// 추천 시간표 생성
const recommendedTimetables = useMemo(() => {
  if (!preferences || !department) return [];
  return generateRecommendedTimetables(mockCourses, preferences, department, 12);
}, [preferences, department]);

  const handleLogout = () => {
    logout?.();
    onLogout?.();
  };

  // 시간표 보관/보관 취소
  const handleToggleSaveTimetable = (timetable) => {
    const isSaved = savedTimetables.some((t) => t.id === timetable.id);

    let newSavedTimetables;
    if (isSaved) {
      newSavedTimetables = savedTimetables.filter((t) => t.id !== timetable.id);
    } else {
      newSavedTimetables = [...savedTimetables, timetable];
    }

    setSavedTimetables(newSavedTimetables);

    // User 데이터 업데이트 + 저장
    const updatedUser = { ...user, savedTimetables: newSavedTimetables };
    saveUser?.(updatedUser);
  };

  const isTimetableSaved = (timetableId) => {
    return savedTimetables.some((t) => t.id === timetableId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onBack}
              >
                시간표 추천 시스템
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.name}님 · {user?.university} · {user?.department}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onGoToMyPage}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <UserIcon className="size-4" />
                마이페이지
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="size-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'recommended'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Sparkles className="size-5" />
            추천 시간표
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Calendar className="size-5" />
            맞춤 시간표
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BookmarkCheck className="size-5" />
            보관한 시간표
            {savedTimetables.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {savedTimetables.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'recommended' ? (
          <div>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">AI 추천 시간표</h3>
                  <p className="text-sm text-blue-700">
                    설정하신 취향(공강 {user?.preferences?.preferredBreaks}일,{' '}
                    {user?.preferences?.timePreference === 'morning'
                      ? '아침형'
                      : user?.preferences?.timePreference === 'afternoon'
                      ? '오후형'
                      : '시간 무관'}
                    , 최대 {user?.preferences?.maxCredits}학점)을 바탕으로 최적의 시간표를 추천해드립니다.
                  </p>
                </div>
              </div>
            </div>

            {recommendedTimetables.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">추천 시간표를 생성할 수 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendedTimetables.map((timetable) => (
                  <div key={timetable.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{timetable.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          총 {timetable.totalCredits}학점 · 추천 점수: {timetable.score}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleSaveTimetable(timetable)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isTimetableSaved(timetable.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isTimetableSaved(timetable.id) ? (
                          <BookmarkCheck className="size-4" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                        {isTimetableSaved(timetable.id) ? '보관 취소' : '보관'}
                      </button>
                    </div>

                    <TimetableGrid courses={timetable.courses} compact />

                    <div className="mt-4 space-y-1">
                      {timetable.courses.map((course) => (
                        <div key={course.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              course.type === 'major' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                          />
                          {course.name} ({course.credit}학점)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'saved' ? (
          <div>
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <BookmarkCheck className="size-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">보관한 시간표</h3>
                  <p className="text-sm text-green-700">
                    마음에 드는 시간표를 보관하고 나중에 다시 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {savedTimetables.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Bookmark className="size-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">보관한 시간표가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">
                  추천 시간표에서 마음에 드는 시간표를 보관해보세요!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedTimetables.map((timetable) => (
                  <div key={timetable.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{timetable.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          총 {timetable.totalCredits}학점 · 추천 점수: {timetable.score}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleSaveTimetable(timetable)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 text-white hover:bg-red-600"
                      >
                        <BookmarkCheck className="size-4" />
                        삭제
                      </button>
                    </div>

                    <TimetableGrid courses={timetable.courses} compact />

                    <div className="mt-4 space-y-1">
                      {timetable.courses.map((course) => (
                        <div key={course.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              course.type === 'major' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                          />
                          {course.name} ({course.credit}학점)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CustomTimetablePage user={user} onLogout={onLogout} onBack={onBack} onGoToMyPage={onGoToMyPage} />
        )}
      </div>

      {/* 뒤로가기 버튼 */}
      {onBack && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-5" />
            뒤로가기
          </button>
        </div>
      )}
    </div>
  );
}
