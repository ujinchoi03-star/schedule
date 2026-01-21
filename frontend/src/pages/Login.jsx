import { useState } from "react";
import { Calendar, Clock, BookOpen, Eye, EyeOff, AlertCircle } from "lucide-react";
import api from '../api/axios';

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
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        // [회원가입] - 우리가 만든 api 인스턴스 사용
        await api.post("/api/auth/signup", {
          email: email,
          password: password,
          nickname: name,
        });

        alert("회원가입 성공! 이제 로그인해주세요.");
        setIsSignUp(false);
        resetForm();
      } else {
        // [로그인] - 우리가 만든 api 인스턴스 사용
        const response = await api.post("/api/auth/login", {
          email: email,
          password: password,
        });

        const { token, email: serverEmail, nickname, university, department, grade, id } = response.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("userId", serverEmail || email);
        localStorage.setItem("nickname", nickname);

        onLogin({
          name: nickname,
          email: serverEmail || email,
          university: university,
          department: department,
          grade: grade,
          id: id
        });
      }
    } catch (err) {
      if (!err.response) {
        setError("서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인하세요.");
        return;
      }

      if (isSignUp) {
        setError("이미 존재하는 아이디입니다.");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
            {/* Left Side */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  완벽한 시간표
                </span>
                  <span className="text-gray-900">를</span>
                  <br />
                  <span className="text-gray-900">만들어드립니다</span>
                </h1>
                <p className="text-xl text-gray-600">
                  나만의 취향과 학습 스타일을 고려한
                  <br />
                  맞춤형 시간표 생성 서비스
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
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
            <div className="lg:pl-12">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
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
                        setIsSignUp(false);
                        resetForm();
                      }}
                      className={`flex-1 py-2.5 rounded-lg transition-all font-medium ${
                          !isSignUp
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    로그인
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        resetForm();
                      }}
                      className={`flex-1 py-2.5 rounded-lg transition-all font-medium ${
                          isSignUp
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    회원가입
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${
                            email ? (isEmailValid ? "border-blue-200 focus:ring-blue-500" : "border-red-200 focus:ring-red-500") : "border-gray-300 focus:ring-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                    <div className="relative">
                      <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none pr-12 transition-all ${
                              password ? (isPasswordValid ? "border-blue-200 focus:ring-blue-500" : "border-red-200 focus:ring-red-500") : "border-gray-300 focus:ring-blue-500"
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
                              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none pr-12 transition-all ${
                                  passwordConfirm
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

                        <p className={`mt-1.5 ml-1 text-xs flex items-center gap-1 transition-colors ${getValidationColor(passwordConfirm, isConfirmValid)}`}>
                          <AlertCircle className="size-3" />
                          {passwordConfirm && !isConfirmValid ? "비밀번호가 일치하지 않습니다." : "비밀번호가 일치합니다."}
                        </p>
                      </div>
                  )}

                  {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                        {error}
                      </div>
                  )}

                  <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                          canSubmit
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
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