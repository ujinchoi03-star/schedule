import React, { useState } from "react";
import { Calendar, GraduationCap, ArrowLeft, BookOpen, Award, AlertCircle, X } from "lucide-react";

/**
 * props:
 * - onComplete(selection)
 * - onBack()
 */

const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];
const semesters = ["1학기", "2학기", "여름학기", "겨울학기"];
const grades = [1, 2, 3, 4];
const majorCounts = [1, 2, 3, 4, 5, "5개 이상"];

export function SemesterSelectionPage({ onComplete, onBack }) {
  const [year, setYear] = useState(2026);
  const [semester, setSemester] = useState("1학기");
  const [grade, setGrade] = useState(1);
  const [majorCount, setMajorCount] = useState(1); // number | '5개 이상'
  const [targetCredits, setTargetCredits] = useState(15);
  const [onlyMajor, setOnlyMajor] = useState(false);
  const [excludeNoTime, setExcludeNoTime] = useState(false);
  const [avoidKeywords, setAvoidKeywords] = useState([]);
  const [minMajorCredit, setMinMajorCredit] = useState(0);
  const [newKeyword, setNewKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      year,
      semester,
      grade,
      majorCount,
      targetCredits,
      onlyMajor,
      excludeNoTime,
      avoidKeywords,
      minMajorCredit,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">학기 정보 입력</h2>
          <p className="text-gray-600">수강할 학기 정보를 선택해주세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8"
        >
          <div className="space-y-6">
            {/* 년도 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="size-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">년도</label>
              </div>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full py-3 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none transition-all"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            {/* 학기 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="size-5 text-purple-600" />
                <label className="text-sm font-medium text-gray-700">학기</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {semesters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSemester(s)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      semester === s
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                        : "border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 학년 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="size-5 text-green-600" />
                <label className="text-sm font-medium text-gray-700">학년</label>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {grades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      grade === g
                        ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    {g}학년
                  </button>
                ))}
              </div>
            </div>

            {/* 전공 과목 수 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="size-5 text-red-600" />
                <label className="text-sm font-medium text-gray-700">전공 과목 수</label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {majorCounts.map((c) => (
                  <button
                    key={String(c)}
                    type="button"
                    onClick={() => setMajorCount(c)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      majorCount === c
                        ? "border-red-600 bg-red-50 text-red-700 font-semibold"
                        : "border-gray-300 hover:border-red-300"
                    }`}
                  >
                    {typeof c === "number" ? `${c}개` : c}
                  </button>
                ))}
              </div>
            </div>

            {/* 목표 학점 */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <Award className="size-5 text-yellow-600" />
                <label className="text-sm font-medium text-gray-700">목표 학점</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="9"
                    max="24"
                    value={targetCredits || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTargetCredits(value === "" ? 0 : Number(value));
                    }}
                    className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="15"
                  />
                  <span className="text-gray-500 text-sm">학점</span>
                </div>
              </div>
            </div>

            {/* 전공만 듣기 & 온라인 강의 제외 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="onlyMajor"
                  checked={onlyMajor}
                  onChange={(e) => setOnlyMajor(e.target.checked)}
                  className="size-5"
                />
                <label
                  htmlFor="onlyMajor"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  전공 수업만 듣기
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="excludeNoTime"
                  checked={excludeNoTime}
                  onChange={(e) => setExcludeNoTime(e.target.checked)}
                  className="size-5"
                />
                <label
                  htmlFor="excludeNoTime"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  온라인 강의 제외
                </label>
              </div>
            </div>

            {/* 기피 키워드 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="size-5 text-red-600" />
                <label className="text-sm font-medium text-gray-700">
                  기피 키워드 (싫어하는 유형 제외)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="예: 영어, PBL, 팀프로젝트"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const kw = newKeyword.trim();
                      if (kw) {
                        setAvoidKeywords((prev) => [...prev, kw]);
                        setNewKeyword("");
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const kw = newKeyword.trim();
                    if (kw) {
                      setAvoidKeywords((prev) => [...prev, kw]);
                      setNewKeyword("");
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  추가
                </button>
              </div>

              {avoidKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {avoidKeywords.map((keyword, index) => (
                    <div
                      key={`${keyword}-${index}`}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-300 flex items-center gap-2 text-sm"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => setAvoidKeywords((prev) => prev.filter((_, i) => i !== index))}
                        className="text-red-700 hover:text-red-900"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최소 전공 학점 */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <BookOpen className="size-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">
                  최소 전공 학점 (필수 조건)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="21"
                    value={minMajorCredit || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMinMajorCredit(value === "" ? 0 : Number(value));
                    }}
                    className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="text-gray-500 text-sm">학점</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold"
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
