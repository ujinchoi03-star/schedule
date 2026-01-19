import { useState } from "react";
import Login from "./pages/Login";
import { HomePage } from "./pages/Home";
import { MyPage } from "./pages/MyPage";
import { Timetable } from "./pages/Timetable";
import { OnboardingPage } from "./pages/Onboarding";
import { SemesterSelectionPage } from "./pages/SemesterSelectionPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { RegistrationPage } from "./pages/RegistrationPage";

export default function App() {
    const [user, setUser] = useState(null);
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
            />
        );
    }

    if (page === "semester") {
        return (
            <SemesterSelectionPage
                user={user}
                onBack={() => setPage("home")}
                onNext={(generatedData) => {
                    // 백엔드 데이터 저장
                    setTimetablesData(generatedData);
                    setPage("timetable");
                }}
            />
        );
    }

    // 🚨 [수정 완료] 여기가 핵심입니다!
    if (page === "timetable") {
        return (
            <Timetable
                user={user}
                // 👇 기존: initialTimetables={timetablesData} (X) -> 받는 쪽에서 모름
                // 👇 수정: generatedResults={timetablesData} (O) -> Timetable.jsx와 이름 일치!
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