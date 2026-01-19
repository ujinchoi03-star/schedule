import { useState } from "react";
import { Calendar, Clock, BookOpen, Eye, EyeOff, AlertCircle } from "lucide-react";
import axios from "axios";

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  const isConfirmValid = passwordConfirm.length > 0 && password === passwordConfirm;

  const getValidationColor = (value, isValid) => {
    if (!value) return "text-gray-400";
    return isValid ? "text-blue-500" : "text-red-500";
  };

  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid && name.trim() !== "";
  const canSubmit = isSignUp ? isFormValid : (email && password);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setError(""); // 👈 에러 메시지 삭제가 핵심!
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        // [회원가입]
        await axios.post("http://localhost:8080/api/auth/signup", {
          email: email,
          password: password,
          nickname: name,
        });

        alert("회원가입 성공! 이제 로그인해주세요.");
        setIsSignUp(false);
        resetForm();
        // Login.jsx 내의 handleSubmit 함수 내부 else 블록
      } else {
        // [로그인]
        const response = await axios.post("http://localhost:8080/api/auth/login", {
          email: email,
          password: password,
        });

        // 🌟 백엔드에서 추가한 필드들을 응답에서 구조 분해 할당으로 가져옵니다.
        const { token, nickname, university, department, grade, id } = response.data;
        localStorage.setItem("accessToken", token);

        // 🌟 onLogin에 이 정보들을 모두 담아서 보냅니다.
        onLogin({
          name: nickname,
          email: email,
          university: university, // 추가
          department: department, // 추가
          grade: grade,           // 추가
          id: id                  // 추가
        });
      }
    } catch (err) {
      if (!err.response) {
        setError("서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인하세요.");
        return;
      }

      if (isSignUp) {
        // 백엔드에서 중복 시 보통 400(Bad Request)이나 500을 줍니다.
        setError("이미 존재하는 아이디입니다.");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    }
  };

  return ( //화면을 그리는 부분
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* 배경 그라데이션 설정 */}
      <div className="max-w-7xl mx-auto px-4 py-12"> {/* 화면 최대 너비 설정, 좌우 패딩 설정*/}
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]"> {/* 그리드 레이아웃 설정, lg 이상에서 2열, 열 간격 설정, 세로 중앙 정렬, 최소 높이 설정 */}
          {/* Left Side */}
          <div className="space-y-8"> {/* 세로 간격 설정 */}
            <div className="space-y-4"> {/* 제목과 설명 간격 설정 */}
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight"> {/* h1: 제목 스타일 설정-> 글자 크기: 기본 5xl, 큰 화면은 6xl, 폰트는 굵게, 줄 간격은 좁게 */}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> { } {/* 배경을 그라데이션으로 텍스트 모양으로만 보이게 클립, 글자색은 투명 즉 배경 그라데이션이 글자에 비쳐 보임 */}
                  완벽한 시간표
                </span>
                <span className="text-gray-900">를</span>
                <br /> {/* 줄바꿈 */}
                <span className="text-gray-900">만들어드립니다</span>
              </h1>
              <p className="text-xl text-gray-600"> {/* 설명 스타일 설정-> 글자 크기: xl, 글자색: 회색 계열 */}
                나만의 취향과 학습 스타일을 고려한
                <br />
                맞춤형 시간표 생성 서비스
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4"> {/* 아이콘 박스와 텍스트를 가로로 배치 */}
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="size-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    맞춤 시간표
                  </h3>
                  <p className="text-gray-600">
                    원하는 강의를 선택하면 가능한 모든 조합을 보여드립니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="size-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">취향 반영</h3>
                  <p className="text-gray-600">
                    공강일, 선호 시간대, 교양 과목 등 세부 설정이 가능합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="size-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    다양한 옵션
                  </h3>
                  <p className="text-gray-600">
                    전공, 교양, 학점 제한 등 다양한 조건을 고려합니다
                  </p>
                </div>
              </div>
            </div>

          </div>
          {/* Right Side - Form */}
          <div className="lg:pl-12"> {/* 큰 화면에서 왼쪽 패딩 설정 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md mx-auto"> {/* 흰색 배경, 테두리, 둥근 모서리, 그림자, 내부 패딩, 최대 너비 설정, 가로 중앙 정렬 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isSignUp ? "회원가입" : "로그인"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isSignUp ? "지금 바로 시작해보세요" : "원하는 시간표를 만들어보세요"}
                </p>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false); // 로그인 모드로 변경
                    resetForm();        // 폼 초기화 함수 호출
                  }}
                  className={`flex-1 py-2.5 rounded-lg transition-all font-medium ${!isSignUp
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);  // 회원가입 모드로 변경
                    resetForm();        // 폼 초기화 함수 호출
                  }}
                  className={`flex-1 py-2.5 rounded-lg transition-all font-medium ${isSignUp
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  회원가입
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && ( // 회원가입 모드일 때만 이름 입력란 보이게
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      이름
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="홍길동"
                    />
                  </div>
                )}

                {/* 아이디 입력란 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${email ? (isEmailValid ? "border-blue-200 focus:ring-blue-500" : "border-red-200 focus:ring-red-500") : "border-gray-300 focus:ring-blue-500"
                      }`}
                    placeholder="example@university.ac.kr"
                  />
                  {isSignUp && (
                    <p className={`mt-1.5 ml-1 text-xs flex items-center gap-1 transition-colors ${getValidationColor(email, isEmailValid)}`}>
                      <AlertCircle className="size-3" />
                      이메일 형식으로 작성해주세요.
                    </p>
                  )}
                </div>

                {/* 비밀번호 입력란 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none pr-12 transition-all ${password ? (isPasswordValid ? "border-blue-200 focus:ring-blue-500" : "border-red-200 focus:ring-red-500") : "border-gray-300 focus:ring-blue-500"
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className={`mt-1.5 ml-1 text-xs flex items-center gap-1 transition-colors ${getValidationColor(password, isPasswordValid)}`}>
                      <AlertCircle className="size-3" />
                      영어, 숫자를 포함하여 8자리 이상으로 만들어주세요.
                    </p>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      비밀번호 확인
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordConfirm ? "text" : "password"}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none pr-12 transition-all ${passwordConfirm
                            ? (isConfirmValid ? "border-blue-200 focus:ring-blue-500" : "border-red-200 focus:ring-red-500")
                            : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showPasswordConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>

                    {/* 비밀번호 확인 안내 문구 (회원가입 시에만) */}
                    <p className={`mt-1.5 ml-1 text-xs flex items-center gap-1 transition-colors ${getValidationColor(passwordConfirm, isConfirmValid)}`}>
                      <AlertCircle className="size-3" />
                      {passwordConfirm && !isConfirmValid ? "비밀번호가 일치하지 않습니다." : "비밀번호가 일치합니다."}
                    </p>
                  </div>
                )}

                {error && ( // 에러 메시지가 있을 때만 보이게
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit} // 조건이 맞지 않으면 버튼 비활성화
                  className={`w-full py-3 rounded-lg font-medium transition-all ${canSubmit
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed" // 비활성화 스타일
                    }`}
                >
                  {isSignUp ? "회원가입하기" : "로그인하기"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}