import { useState, useMemo } from 'react';
import { mockCourses } from '../data/mockCourses';
import { generateTimetables } from '../utils/timetableUtils';
import { TimetableGrid } from './TimetableGrid';
import { Plus, Trash2, Search, Calendar, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export function CustomTimetablePage({ user }) {
  const [groups, setGroups] = useState([
    { id: '1', name: '전공필수', courses: [], isExpanded: true },
  ]);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [generatedTimetables, setGeneratedTimetables] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  // 임시 필터 상태 (검색 버튼을 누르기 전)
  const [tempYear, setTempYear] = useState(user?.semesterInfo?.year || 2025);
  const [tempSemester, setTempSemester] = useState(user?.semesterInfo?.semester || '1학기');
  const [tempGrade, setTempGrade] = useState('all');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempFilterType, setTempFilterType] = useState('all'); // 'all' | 'major' | 'general'
  const [tempFilterCourseType, setTempFilterCourseType] = useState('all');
  const [tempSortBy, setTempSortBy] = useState('default'); // 'default' | 'rating-high' | ...

  // 적용된 필터 상태 (검색 버튼을 눌렀을 때)
  const [appliedYear, setAppliedYear] = useState(user?.semesterInfo?.year || 2025);
  const [appliedSemester, setAppliedSemester] = useState(user?.semesterInfo?.semester || '1학기');
  const [appliedGrade, setAppliedGrade] = useState('all');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedFilterType, setAppliedFilterType] = useState('all');
  const [appliedFilterCourseType, setAppliedFilterCourseType] = useState('all');
  const [appliedSortBy, setAppliedSortBy] = useState('default');

  const [isFiltered, setIsFiltered] = useState(false); // 필터가 적용되었는지 여부

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    setAppliedYear(tempYear);
    setAppliedSemester(tempSemester);
    setAppliedGrade(tempGrade);
    setAppliedSearchQuery(tempSearchQuery);
    setAppliedFilterType(tempFilterType);
    setAppliedFilterCourseType(tempFilterCourseType);
    setAppliedSortBy(tempSortBy);
    setIsFiltered(true);
  };

  // 필터 초기화
  const handleResetFilter = () => {
    const defaultYear = user?.semesterInfo?.year || 2025;
    const defaultSemester = user?.semesterInfo?.semester || '1학기';

    setTempYear(defaultYear);
    setTempSemester(defaultSemester);
    setTempGrade('all');
    setTempSearchQuery('');
    setTempFilterType('all');
    setTempFilterCourseType('all');
    setTempSortBy('default');

    setAppliedYear(defaultYear);
    setAppliedSemester(defaultSemester);
    setAppliedGrade('all');
    setAppliedSearchQuery('');
    setAppliedFilterType('all');
    setAppliedFilterCourseType('all');
    setAppliedSortBy('default');

    setIsFiltered(false);
  };

  // 필터링된 강의 목록
  const filteredCourses = useMemo(() => {
    if (!isFiltered) return mockCourses;

    let courses = mockCourses.filter((course) => {
      // 년도/학기 필터
      if (course.year !== appliedYear || course.semester !== appliedSemester) return false;

      // 학년 필터
      if (appliedGrade !== 'all' && course.grade !== appliedGrade) return false;

      // 검색어 필터
      if (
        appliedSearchQuery &&
        !course.name.toLowerCase().includes(appliedSearchQuery.toLowerCase())
      )
        return false;

      // 전공/교양 필터
      if (appliedFilterType === 'major' && course.type !== 'major') return false;
      if (appliedFilterType === 'general' && course.type !== 'general') return false;

      // 세부 과목 타입 필터
      if (appliedFilterCourseType !== 'all') {
        if (course.type === 'major' && course.courseType !== appliedFilterCourseType) return false;
        if (course.type === 'general' && course.category !== appliedFilterCourseType) return false;
      }

      return true;
    });

    // 정렬
    return courses.sort((a, b) => {
      switch (appliedSortBy) {
        case 'rating-high':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-low':
          return (a.rating || 0) - (b.rating || 0);
        case 'enrolled-high':
          return (b.enrolled || 0) - (a.enrolled || 0);
        case 'enrolled-low':
          return (a.enrolled || 0) - (b.enrolled || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [
    appliedYear,
    appliedSemester,
    appliedGrade,
    appliedSearchQuery,
    appliedFilterType,
    appliedFilterCourseType,
    appliedSortBy,
    isFiltered,
  ]);

  // 그룹 추가
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      courses: [],
      isExpanded: true,
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setShowGroupInput(false);
  };

  // 그룹 삭제
  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  // 그룹 토글
  const toggleGroup = (groupId) => {
    setGroups(
      groups.map((g) =>
        g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
      )
    );
  };

  // 그룹에 강의 추가
  const addCourseToGroup = (groupId, course) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          if (g.courses.some((c) => c.id === course.id)) return g; // 중복 방지
          return { ...g, courses: [...g.courses, course] };
        }
        return g;
      })
    );
  };

  // 그룹에서 강의 삭제
  const removeCourseFromGroup = (groupId, courseId) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return { ...g, courses: g.courses.filter((c) => c.id !== courseId) };
        }
        return g;
      })
    );
  };

  // 시간표 생성
  const handleGenerateTimetables = () => {
    const allCourses = groups.flatMap((g) => g.courses);
    if (allCourses.length === 0) {
      alert('먼저 강의를 추가해주세요.');
      return;
    }
    const timetables = generateTimetables(allCourses, 20);
    setGeneratedTimetables(timetables);
    setHasGenerated(true);
  };

  // 세부 필터 옵션
  const courseTypeOptions =
    tempFilterType === 'major'
      ? ['all', '전공필수', '전공선택']
      : tempFilterType === 'general'
      ? ['all', '핵심교양', '일반교양', '균형교양']
      : ['all'];

  const totalCourses = groups.reduce((sum, g) => sum + g.courses.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 강의 선택 영역 */}
          <div className="space-y-4">
            {/* 필터 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="size-5 text-blue-600" />
                강의 검색 및 필터
              </h3>

              <div className="space-y-4">
                {/* 년도/학기/학년 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">년도</label>
                    <select
                      value={tempYear}
                      onChange={(e) => setTempYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value={2024}>2024년</option>
                      <option value={2025}>2025년</option>
                      <option value={2026}>2026년</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">학기</label>
                    <select
                      value={tempSemester}
                      onChange={(e) => setTempSemester(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="1학기">1학기</option>
                      <option value="2학기">2학기</option>
                      <option value="여름학기">여름학기</option>
                      <option value="겨울학기">겨울학기</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">학년</label>
                    <select
                      value={tempGrade}
                      onChange={(e) =>
                        setTempGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">전체</option>
                      <option value={1}>1학년</option>
                      <option value={2}>2학년</option>
                      <option value={3}>3학년</option>
                      <option value={4}>4학년</option>
                    </select>
                  </div>
                </div>

                {/* 검색어 */}
                <div>
                  <input
                    type="text"
                    placeholder="교과목명 검색..."
                    value={tempSearchQuery}
                    onChange={(e) => setTempSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 전공/교양 필터 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">이수구분</label>
                    <select
                      value={tempFilterType}
                      onChange={(e) => {
                        setTempFilterType(e.target.value);
                        setTempFilterCourseType('all');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">전체</option>
                      <option value="major">전공</option>
                      <option value="general">교양</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">세부구분</label>
                    <select
                      value={tempFilterCourseType}
                      onChange={(e) => setTempFilterCourseType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={tempFilterType === 'all'}
                    >
                      {courseTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 'all' ? '전체' : option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 정렬 옵션 */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">정렬 기준</label>
                  <select
                    value={tempSortBy}
                    onChange={(e) => setTempSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="default">기본 순서</option>
                    <option value="rating-high">평점 높은 순</option>
                    <option value="rating-low">평점 낮은 순</option>
                    <option value="enrolled-high">수강생 많은 순</option>
                    <option value="enrolled-low">수강생 적은 순</option>
                    <option value="name">이름 순</option>
                  </select>
                </div>

                {/* 검색 버튼 */}
                <div className="flex gap-2">
                  {isFiltered && (
                    <button
                      onClick={handleResetFilter}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      초기화
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Search className="size-4" />
                    검색
                  </button>
                </div>
              </div>
            </div>

            {/* 강의 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="size-5 text-purple-600" />
                  강의 목록 ({filteredCourses.length}개)
                </h3>
                {isFiltered && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    필터 적용됨
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>해당 조건에 맞는 강의가 없습니다.</p>
                    <p className="text-sm mt-2">다른 년도/학기를 선택하거나 필터를 초기화해보세요.</p>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{course.name}</h4>
                          <p className="text-sm text-gray-600">
                            {course.professor} · {course.credit}학점
                            {course.rating && (
                              <span className="ml-2 text-yellow-600">★ {course.rating.toFixed(1)}</span>
                            )}
                            <span className="ml-2 text-gray-500">
                              수강: {course.enrolled}/{course.capacity}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            course.type === 'major'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {course.type === 'major' ? course.courseType : course.category}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {course.times?.map((t) => {
                          const days = ['월', '화', '수', '목', '금'];
                          return `${days[t.day]} ${t.startTime
                            .toString()
                            .replace('.5', ':30')
                            .replace('.0', ':00')}-${t.endTime
                            .toString()
                            .replace('.5', ':30')
                            .replace('.0', ':00')}`;
                        }).join(', ') || '시간 미정'}
                      </div>

                      {/* 그룹 선택 드롭다운 */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCourseToGroup(e.target.value, course);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">그룹에 추가...</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 그룹 및 시간표 생성 영역 */}
          <div className="space-y-4">
            {/* 그룹 관리 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="size-5 text-blue-600" />
                  강의 그룹 ({totalCourses}개 강의)
                </h3>
                <button
                  onClick={() => setShowGroupInput(!showGroupInput)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="size-4" />
                  그룹 추가
                </button>
              </div>

              {/* 그룹 추가 입력 */}
              {showGroupInput && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="그룹 이름 (예: 교양, 전공선택)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleAddGroup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              )}

              {/* 그룹 목록 */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center gap-2">
                        {group.isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                        <span className="font-medium">{group.name}</span>
                        <span className="text-xs text-gray-500">({group.courses.length})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </button>
                    </div>

                    {group.isExpanded && (
                      <div className="p-3 pt-0 space-y-2">
                        {group.courses.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-2">
                            왼쪽에서 강의를 추가하세요
                          </p>
                        ) : (
                          group.courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{course.name}</p>
                                <p className="text-xs text-gray-600">
                                  {course.professor} · {course.credit}학점
                                </p>
                              </div>
                              <button
                                onClick={() => removeCourseFromGroup(group.id, course.id)}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="size-3 text-red-600" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 시간표 생성 버튼 */}
              <button
                onClick={handleGenerateTimetables}
                disabled={totalCourses === 0}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="size-5" />
                시간표 조합 생성하기
              </button>
            </div>

            {/* 생성된 시간표 */}
            {hasGenerated && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  생성된 시간표 ({generatedTimetables.length}개)
                </h3>

                {generatedTimetables.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">시간이 겹쳐서 조합 가능한 시간표가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {generatedTimetables.map((timetable, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">시간표 {index + 1}</h4>
                          <span className="text-sm text-gray-600">
                            총 {timetable.totalCredits}학점
                          </span>
                        </div>
                        <TimetableGrid courses={timetable.courses} compact />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
