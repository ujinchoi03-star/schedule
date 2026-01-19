import { useState } from "react";
import { Check, School, GraduationCap, User } from "lucide-react";
import api from '../api/axios'; // ✅ 우리가 만든 API 도구

// 🏫 지원하는 학교 목록 (서버 코드와 매칭)
const AVAILABLE_UNIVERSITIES = [
  { name: "고려대학교", code: "KOREA", color: "bg-red-50 text-red-700 border-red-200" },
  { name: "한양대학교", code: "HANYANG", color: "bg-blue-50 text-blue-700 border-blue-200" }
];

export function OnboardingPage({ user, onComplete }) {
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [department, setDepartment] = useState(""); // 직접 입력받음
  const [grade, setGrade] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUniversity || !department || !grade) return;

    try {
      setIsSubmitting(true);

      // ✅ [백엔드 연결] 회원 정보 업데이트 요청
      // 이 요청을 보내면 DB의 users 테이블에 학교, 학과, 학년이 저장됩니다.
      await api.patch('/auth/onboarding', {
        university: selectedUniversity.code, // "KOREA" or "HANYANG"
        department: department,              // 유저가 입력한 텍스트
        grade: grade
      });

      console.log("✅ 정보 저장 완료:", selectedUniversity.code, department);

      // 다음 단계로 이동
      onComplete(selectedUniversity.code, department, grade);

    } catch (error) {
      console.error("정보 저장 실패:", error);
      alert("정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              반가워요, {user?.name || "학생"}님! 👋
            </h2>
            <p className="text-gray-600">시간표 생성을 위해 학교 정보를 입력해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-8">

            {/* 1. 학교 선택 (버튼형) */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <School className="size-4 text-blue-600"/> 학교 선택
              </label>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_UNIVERSITIES.map((uni) => (
                    <button
                        key={uni.code}
                        type="button"
                        onClick={() => setSelectedUniversity(uni)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            selectedUniversity?.code === uni.code
                                ? `${uni.color} border-current ring-1 ring-offset-2`
                                : "border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50"
                        }`}
                    >
                      <School className="size-6 mb-1 opacity-80"/>
                      <span className="font-bold">{uni.name}</span>
                      {selectedUniversity?.code === uni.code && <Check className="size-4"/>}
                    </button>
                ))}
              </div>
            </div>

            {/* 2. 학과 입력 (직접 입력) */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <GraduationCap className="size-4 text-purple-600"/> 학과 입력
              </label>
              <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 컴퓨터학과, 경영학과"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* 3. 학년 선택 */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <User className="size-4 text-green-600"/> 학년 선택
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
                          className="hidden"
                          onChange={() => setGrade(g)}
                      />
                      {g}학년
                    </label>
                ))}
              </div>
            </div>

            <button
                type="submit"
                disabled={!selectedUniversity || !department || !grade || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? "저장 중..." : "설정 완료"}
            </button>
          </form>
        </div>
      </div>
  );
}