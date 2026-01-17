import React, { useState } from "react";
import { Clock, Calendar, BookOpen, X, ArrowLeft, Plus, Star, Filter } from "lucide-react";

/**
 * props:
 * - onComplete(preferences)
 * - onBack()
 */

const generalCategories = ["글쓰기", "인문", "사회", "과학", "예체능"];
const DAYS = ["월", "화", "수", "목", "금"];

// ✅ 30분 단위 옵션 생성 (09:00 ~ 18:00)
const TIME_SLOTS = (() => {
  const slots = [];
  const start = 9 * 60;   // 09:00
  const end = 18 * 60;    // 18:00 (포함)
  for (let t = start; t <= end; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push({ label: `${hh}:${mm}`, value: t }); // value는 "분" 단위로 저장
  }
  return slots;
})();

// ✅ 표시용: 분 -> "HH:MM"
const formatMinutes = (mins) => {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

export function PreferencesPage({ onComplete, onBack }) {
  const [preferredBreaks, setPreferredBreaks] = useState(1);
  const [preferredBreakDays, setPreferredBreakDays] = useState([]);
  const [timePreference, setTimePreference] = useState("none"); // 'morning' | 'afternoon' | 'none'
  const [excludedTimeSlots, setExcludedTimeSlots] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxCredits, setMaxCredits] = useState(18);

  // 새로 추가된 필터 옵션들
  const [maxGapHours, setMaxGapHours] = useState(3); // 최대 공강 시간
  const [minRating, setMinRating] = useState(0); // 최소 강의 평점 (0 = 제한없음)

  // 제외 시간대 추가용 state
  const [showAddExcludedTime, setShowAddExcludedTime] = useState(false);
  const [newExcludedDay, setNewExcludedDay] = useState(0);

  // ✅ 기존 9/10 “시간” 대신, “분” 단위로 변경 (09:00=540, 10:00=600)
  const [newExcludedStartTime, setNewExcludedStartTime] = useState(9 * 60);
  const [newExcludedEndTime, setNewExcludedEndTime] = useState(10 * 60);

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleBreakDayToggle = (day) => {
    setPreferredBreakDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddExcludedTimeSlot = () => {
    if (newExcludedStartTime >= newExcludedEndTime) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    setExcludedTimeSlots((prev) => [
      ...prev,
      {
        day: newExcludedDay,
        startTime: newExcludedStartTime, // ✅ 분 단위
        endTime: newExcludedEndTime,     // ✅ 분 단위
      },
    ]);
    setShowAddExcludedTime(false);

    // 초기화
    setNewExcludedDay(0);
    setNewExcludedStartTime(9 * 60);
    setNewExcludedEndTime(10 * 60);
  };

  const handleRemoveExcludedTimeSlot = (index) => {
    setExcludedTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const preferences = {
      preferredBreaks,
      preferredBreakDays,
      timePreference,
      excludedTimeSlots,
      generalEducationPreferences: selectedCategories,
      maxCredits,
      maxGapHours,
      minRating,
    };
    onComplete(preferences);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">취향 설정</h2>
          <p className="text-gray-600">선호하는 시간표 스타일을 알려주세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8"
        >
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

            {/* 공강 요일 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="size-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">
                  선호 공강 요일 (다중 선택 가능)
                </label>
              </div>
              <div className="flex flex-nowrap gap-2 w-full">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleBreakDayToggle(index)}
                    className={`flex-1 py-4 rounded-lg border-2 transition-all text-center font-medium ${
                      preferredBreakDays.includes(index)
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    timePreference === "morning"
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    timePreference === "afternoon"
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    timePreference === "none"
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
                  <label className="text-sm font-medium text-gray-700">
                    제외 시간대 (다중 선택 가능)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExcludedTime(!showAddExcludedTime)}
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
                      <span>{DAYS[slot.day]}</span>
                      <span>
                        {/* ✅ 분 단위를 HH:MM으로 표시 */}
                        {formatMinutes(slot.startTime)} - {formatMinutes(slot.endTime)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedTimeSlot(index)}
                        className="text-red-700 hover:text-red-900"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 시간대 추가 폼 */}
              {showAddExcludedTime && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={newExcludedDay}
                      onChange={(e) => setNewExcludedDay(Number(e.target.value))}
                      className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>

                    {/* ✅ 옵션만 늘리고, 크기는 동일하게 유지 + 내부 스크롤: size={6} */}
                    <select
                      value={newExcludedStartTime}
                      onChange={(e) => setNewExcludedStartTime(Number(e.target.value))}
                      className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      size={6}
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
                      size={6}
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddExcludedTimeSlot}
                      className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddExcludedTime(false)}
                      className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>

                  {/*작은 힌트 */}
                  <p className="mt-3 text-xs text-gray-500">
                    시작/종료 시간을 30분 단위로 선택할 수 있어요. 
                  </p>
                </div>
              )}
            </div>

            {/* 교양 취향 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="size-5 text-green-600" />
                <label className="text-sm font-medium text-gray-700">
                  선호 교양 카테고리 (다중 선택 가능)
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {generalCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-6 py-3 rounded-lg border-2 transition-all ${
                      selectedCategories.includes(category)
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

          <button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            완료
          </button>
        </form>

        {/* 뒤로가기 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-5" />
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
}
