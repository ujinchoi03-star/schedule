import { useState } from "react";
import Login from "./pages/Login";
import { HomePage } from "./pages/Home";
import { MyPage } from "./pages/MyPage";
import { Timetable } from "./pages/Timetable";
import { OnboardingPage } from "./pages/Onboarding";
import { PreferencesPage } from "./pages/PreferencesPage";
import { SemesterSelectionPage } from "./pages/SemesterSelectionPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { RegistrationPage } from "./pages/RegistrationPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  // ✅ 취향 수정이 '마이페이지에서 왔는지' 추적용
  const [prefsReturnTo, setPrefsReturnTo] = useState("home"); // "home" | "mypage"

  // App.jsx 내의 handleLogin 함수
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);

    // 🌟 모든 정보(학교, 학과, 학년)가 이미 백엔드에 저장되어 있는 유저라면 바로 홈으로!
    // 하나라도 비어있다면 온보딩으로 보냅니다.
    if (loggedInUser?.university && loggedInUser?.department && loggedInUser?.grade) {
      setPage("home");
    } else {
      setPage("onboarding");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  if (page === "login") return <Login onLogin={handleLogin} />;
  if (!user) return <Login onLogin={handleLogin} />;

  // ✅ 온보딩 끝나면 바로 preferences로
  if (page === "onboarding") {
    return (
      <OnboardingPage
        user={user}
        onComplete={(university, department, grade) => {
          const updatedUser = { ...user, university, department, grade };
          setUser(updatedUser);

          // 온보딩 이후: 취향 설정으로
          setPrefsReturnTo("home");
          setPage("preferences");
        }}
        onBack={() => {
          setUser(null);
          setPage("login");
        }}
      />
    );
  }

  // ✅ preferences는 "처음 설정" or "마이페이지에서 수정" 두 경우가 있음
  if (page === "preferences") {
    return (
      <PreferencesPage
        onComplete={(preferences) => {
          const updatedUser = { ...user, preferences };
          setUser(updatedUser);

          // 처음 설정이면 home, 마이페이지 수정이면 mypage로 복귀
          setPage(prefsReturnTo);
        }}
        onBack={() => setPage(prefsReturnTo)}
      />
    );
  }

  if (page === "home") {
    return (
      <HomePage
        user={user}
        // HomePage에서 onNavigate("timetable") 들어오면
        onNavigate={(p) => {
          if (p === "timetable") {
            if (!user?.preferences) {
              setPage("mypage"); // 취향 설정 탭에서 저장하게
              return;
            }
            setPage("semester"); // 취향 있으면 학기 설정으로
            return;
          }
          setPage(p);
        }}
        onGoToMyPage={() => setPage("mypage")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "mypage") {
    return (
      <MyPage
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          setPage("home");
        }}
        onBack={() => setPage("home")}
        // ✅ MyPage 안에 버튼 하나 만들고 이 핸들러 연결하면 됨
        onEditPreferences={() => {
          setPrefsReturnTo("mypage");
          setPage("preferences");
        }}
      />
    );
  }

  if (page === "semester") {
    return (
      <SemesterSelectionPage
        onComplete={(semesterInfo) => {
          const updatedUser = { ...user, semesterInfo };
          setUser(updatedUser);
          setPage("timetable");
        }}
        onBack={() => setPage("home")}
      />
    );
  }

  if (page === "timetable") {
    return (
      <Timetable
        user={user}
        onLogout={handleLogout}
        onBack={() => setPage("home")}
        onGoToMyPage={() => setPage("mypage")}
      />
    );
  }

  if (page === "reviews") {
    return <ReviewsPage user={user} onBack={() => setPage("home")} />;
  }

  if (page === "registration") {
    return <RegistrationPage user={user} onBack={() => setPage("home")} />;
  }

  return null;
}