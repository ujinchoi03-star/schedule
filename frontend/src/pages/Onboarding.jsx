import { useState, useMemo } from "react";
import { universities } from "../data/universities";
import { Search, Check, ArrowLeft } from "lucide-react";

export function OnboardingPage({ user, onComplete, onBack }) {
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [grade, setGrade] = useState(null);

  // 학교 검색 결과
  const filteredUniversities = useMemo(() => {
    if (!universitySearch.trim()) return universities;
    const search = universitySearch.toLowerCase().trim();
    return universities.filter((uni) => uni.name.toLowerCase().includes(search));
  }, [universitySearch]);

  // 학과 검색 결과
  const filteredDepartments = useMemo(() => {
    if (!selectedUniversity) return [];
    if (!departmentSearch.trim()) return selectedUniversity.departments;
    const search = departmentSearch.toLowerCase().trim();
    return selectedUniversity.departments.filter((dept) => dept.toLowerCase().includes(search));
  }, [selectedUniversity, departmentSearch]);

  const handleUniversitySelect = (uni) => {
    setSelectedUniversity(uni);
    setSelectedDepartment("");
    setDepartmentSearch("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUniversity && selectedDepartment && grade !== null) {
      onComplete(selectedUniversity.name, selectedDepartment, grade);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            환영합니다, {user?.name}님!
          </h2>
          <p className="text-gray-600">학교와 학과 정보를 입력해주세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8"
        >
          {/* ✅ 좌/우 박스 높이 맞추기: items-stretch + 각 컬럼을 같은 높이 컨테이너로 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* 학교 선택 */}
            <div className="flex flex-col lg:h-[520px]">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                1. 학교 검색 및 선택
              </label>

              {/* ✅ 아래 영역이 같은 높이로 맞춰지도록 flex-1 */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* 학교 검색창 */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="text"
                    value={universitySearch}
                    onChange={(e) => setUniversitySearch(e.target.value)}
                    placeholder="학교 이름을 검색하세요"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* 선택된 학교 표시 */}
                {selectedUniversity && (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-600 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 font-medium mb-1">
                        선택된 학교
                      </div>
                      <div className="font-medium text-blue-900">
                        {selectedUniversity.name}
                      </div>
                    </div>
                    <Check className="size-6 text-blue-600" />
                  </div>
                )}

                {/* ✅ 목록이 남는 공간을 전부 차지 + 내부 스크롤 */}
                <div className="flex-1 min-h-0 space-y-2 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {filteredUniversities.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredUniversities.map((uni) => (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => handleUniversitySelect(uni)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedUniversity?.id === uni.id
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{uni.name}</span>
                          {selectedUniversity?.id === uni.id && (
                            <Check className="size-5 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm opacity-75 mt-1">
                          {uni.departments.length}개 학과
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 학과 선택 */}
            <div className="flex flex-col lg:h-[520px]">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                2. 학과 검색 및 선택
              </label>

              {/* ✅ 이 영역도 flex-1로 고정 높이 안에서 채우기 */}
              <div className="flex-1 flex flex-col min-h-0">
                {!selectedUniversity ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                    먼저 학교를 선택해주세요
                  </div>
                ) : (
                  <>
                    {/* 학과 검색창 */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                      <input
                        type="text"
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        placeholder="학과 이름을 검색하세요"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>

                    {/* 선택된 학과 표시 */}
                    {selectedDepartment && (
                      <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-600 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-600 font-medium mb-1">
                            선택된 학과
                          </div>
                          <div className="font-medium text-purple-900">
                            {selectedDepartment}
                          </div>
                        </div>
                        <Check className="size-6 text-purple-600" />
                      </div>
                    )}

                    {/* ✅ 목록이 남는 공간을 전부 차지 + 내부 스크롤 */}
                    <div className="flex-1 min-h-0 space-y-2 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {filteredDepartments.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          검색 결과가 없습니다
                        </div>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => setSelectedDepartment(dept)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedDepartment === dept
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{dept}</span>
                              {selectedDepartment === dept && (
                                <Check className="size-5 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              3. 학년 선택
            </label>
            <select
              value={grade !== null ? grade : ""}
              onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">학년 선택</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
              <option value="4">4학년</option>
              <option value="5">5학년 이상</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedUniversity || !selectedDepartment || grade === null}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계로
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
