import { useState } from "react";
import Login from "./pages/Login";
import { HomePage } from "./pages/Home";
import { MyPage } from "./pages/MyPage";
import { Timetable } from "./pages/Timetable";
import { OnboardingPage } from "./pages/Onboarding";
import { SemesterSelectionPage } from "./pages/SemesterSelectionPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { RegistrationPage } from "./pages/RegistrationPage";
// 🚀 [추가] 새로 만든 페이지 import (파일 경로가 components 폴더면 경로 수정 필요)
import { SavedTimetablesPage } from "./pages/SavedTimetablesPage";

export default function App() {
    const [user, setUser] = useState(null);
    // 🚀 화면 전환을 담당하는 핵심 변수 (currentPage는 삭제하고 이걸로 통일)
    const [page, setPage] = useState("login");

    // 생성된 시간표 데이터를 저장할 곳
    const [timetablesData, setTimetablesData] = useState([]);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        if (loggedInUser?.university && loggedInUser?.department && loggedInUser?.grade) {
            setPage("home");
        } else {
            setPage("onboarding");
        }
    };

    // 🚀 [수정] 홈 화면에서 '내가 저장한 시간표' 버튼 누르면 실행
    const handleViewSavedTimetables = () => {
        setPage('saved'); // page 상태를 'saved'로 변경해야 화면이 바뀝니다.
    };

    const handleLogout = () => {
        setUser(null);
        setPage("login");
        setTimetablesData([]);
    };

    if (page === "login") return <Login onLogin={handleLogin} />;
    if (!user) return <Login onLogin={handleLogin} />;

    if (page === "onboarding") {
        return (
            <OnboardingPage
                user={user}
                onComplete={(university, department, grade) => {
                    const updatedUser = { ...user, university, department, grade };
                    setUser(updatedUser);
                    setPage("home");
                }}
            />
        );
    }

    if (page === "home") {
        return (
            <HomePage
                user={user}
                onNavigate={(p) => {
                    if (p === "timetable") {
                        setPage("semester");
                        return;
                    }
                    setPage(p);
                }}
                onGoToMyPage={() => setPage("mypage")}
                onLogout={handleLogout}
                // 🚀 [추가] 홈 화면에 버튼 클릭 핸들러 전달
                onViewSavedTimetables={handleViewSavedTimetables}
            />
        );
    }

    // 🚀 [추가] 저장된 시간표 페이지 라우팅
    if (page === "saved") {
        return (
            <SavedTimetablesPage
                user={user}
                onBack={() => setPage("home")} // 뒤로가기 누르면 홈으로 이동
            />
        );
    }

    if (page === "semester") {
        return (
            <SemesterSelectionPage
                user={user}
                onBack={() => setPage("home")}
                onNext={(generatedData) => {
                    setTimetablesData(generatedData);
                    setPage("timetable");
                }}
            />
        );
    }

    if (page === "timetable") {
        return (
            <Timetable
                user={user}
                generatedResults={timetablesData}
                onLogout={handleLogout}
                onBack={() => setPage("semester")}
                onGoToMyPage={() => setPage("mypage")}
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
            />
        );
    }

    if (page === "reviews") return <ReviewsPage user={user} onBack={() => setPage("home")} />;
    if (page === "registration") return <RegistrationPage user={user} onBack={() => setPage("home")} />;

    return null;
}