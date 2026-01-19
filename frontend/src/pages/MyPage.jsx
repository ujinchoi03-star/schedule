import React, { useState } from "react";
import { ArrowLeft, User as UserIcon, School, GraduationCap, Save, Check } from "lucide-react";
import api from '../api/axios'; // ✅ API 도구 import

// 🏫 지원하는 학교 목록 (코드와 이름 매핑)
const AVAILABLE_UNIVERSITIES = [
  { name: "고려대학교", code: "KOREA", color: "bg-red-50 text-red-700 border-red-200" },
  { name: "한양대학교", code: "HANYANG", color: "bg-blue-50 text-blue-700 border-blue-200" }
];

export function MyPage({ user, onSave, onBack }) {
  // 초기값 설정 (User 정보가 없으면 기본값)
  const [selectedUniversityCode, setSelectedUniversityCode] = useState(user.university || "KOREA");
  const [department, setDepartment] = useState(user.department || "");
  const [grade, setGrade] = useState(user.grade || 1);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!department.trim()) {
      alert("학과를 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);

      // 1. 백엔드에 수정 요청 (온보딩과 같은 API 사용 가능)
      await api.patch('/auth/onboarding', {
        university: selectedUniversityCode,
        department: department,
        grade: Number(grade)
      });

      // 2. 부모 컴포넌트(App.jsx)의 user 상태 업데이트
      // (화면 깜빡임 없이 즉시 반영)
      const updatedUser = {
        ...user,
        university: selectedUniversityCode,
        department: department,
        grade: Number(grade)
      };

      onSave(updatedUser); // App.jsx의 상태도 변경
      alert("정보가 성공적으로 수정되었습니다! 🎉");

    } catch (error) {
      console.error("정보 수정 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserIcon className="size-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
                  <p className="text-sm text-gray-600">{user.name}님의 정보 수정</p>
                </div>
              </div>
              {/* 뒤로가기 (저장 안 하고 나갈 때) */}
              <button
                  onClick={onBack}
                  className="text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft className="size-6" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8">

            {/* 1. 학교 선택 (버튼형) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <School className="size-5 text-blue-600"/> 학교 변경
              </label>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_UNIVERSITIES.map((uni) => (
                    <button
                        key={uni.code}
                        type="button"
                        onClick={() => setSelectedUniversityCode(uni.code)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            selectedUniversityCode === uni.code
                                ? `${uni.color} border-current ring-1 ring-offset-2`
                                : "border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50"
                        }`}
                    >
                      <span className="font-bold">{uni.name}</span>
                      {selectedUniversityCode === uni.code && <Check className="size-4"/>}
                    </button>
                ))}
              </div>
            </div>

            {/* 2. 학과 입력 (직접 입력) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <GraduationCap className="size-5 text-purple-600"/> 학과 입력
              </label>
              <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 컴퓨터학과"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* 3. 학년 선택 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <UserIcon className="size-5 text-green-600"/> 학년 선택
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((g) => (
                    <label
                        key={g}
                        className={`flex-1 cursor-pointer py-3 rounded-lg border text-center transition-all font-medium ${
                            grade === g
                                ? "bg-gray-800 text-white border-gray-800 shadow-md"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <input
                          type="radio"
                          name="grade"
                          value={g}
                          checked={grade === g}
                          onChange={() => setGrade(g)}
                          className="hidden"
                      />
                      {g}학년
                    </label>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg flex justify-center items-center gap-2"
            >
              {isSaving ? (
                  "저장 중..."
              ) : (
                  <>
                    <Save className="size-5" /> 변경사항 저장하기
                  </>
              )}
            </button>

          </div>
        </div>
      </div>
  );
}