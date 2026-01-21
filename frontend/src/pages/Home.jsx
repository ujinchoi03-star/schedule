import {
  Calendar,
  MessageSquare,
  FileText,
  BookOpen,
  User as UserIcon,
  LogOut,
  GraduationCap,
  Star,
  Clock,
  BookmarkCheck // 🚀 추가됨
} from 'lucide-react';

export function HomePage({ user, onNavigate, onGoToMyPage, onLogout, onViewSavedTimetables }) {
  const menuItems = [
    {
      id: 'timetable',
      title: '시간표 짜기',
      description: '최적의 시간표를 만들어보세요',
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      id: 'reviews',
      title: '강의평 조회',
      description: '학생들의 강의 후기를 확인해 보세요',
      icon: MessageSquare,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
    {
      id: 'registration',
      title: '수강신청 정보',
      description: '수강신청 일정과 팁을 확인해 보세요',
      icon: FileText,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
    },
  ];

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TimeTable AI
                  </h1>
                  <p className="text-sm text-gray-600">
                    {user?.university} · {user?.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                    onClick={onGoToMyPage}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserIcon className="size-4" />
                  <span className="hidden sm:inline">마이페이지</span>
                </button>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              안녕하세요,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.name}
            </span>
              님!
            </h2>
            <p className="text-lg text-gray-600 mt-8">원하시는 서비스를 선택해주세요</p>
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                  <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-transparent hover:-translate-y-1"
                  >
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    <div className="relative p-8">
                      <div
                          className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="size-8 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>

                      <p className="text-gray-600 leading-relaxed">{item.description}</p>

                      <div
                          className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
                      >
                        시작하기
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </button>
              );
            })}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="size-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">내 정보</h3>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• 학교: {user?.university}</p>
                <p>• 학과: {user?.department}</p>
                {user?.grade ? <p>• 학년: {user.grade}학년</p> : null}
                {user?.semesterInfo ? (
                    <p>
                      • 최근 학기: {user.semesterInfo.year}년 {user.semesterInfo.semester} ({user.semesterInfo.grade}
                      학년)
                    </p>
                ) : null}
              </div>
            </div>

            {/* 🚀 [수정됨] 오른쪽 박스: 조건문 없이 '내가 저장한 시간표' 버튼으로 고정 */}
            <button
                onClick={onViewSavedTimetables}
                className="group relative bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-left overflow-hidden"
            >
              {/* 배경 장식용 아이콘 */}
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 transition-transform group-hover:scale-110">
                <Calendar className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <BookmarkCheck className="size-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">내가 저장한 시간표</h3>
                </div>

                <p className="text-sm text-white/90 leading-relaxed mb-6 font-light">
                  DB에 보관된 시간표를 불러옵니다.<br/>
                  저장해둔 시간표를 확인하고 관리해보세요.
                </p>

                <div className="inline-flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  보관함 열기
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
  );
}