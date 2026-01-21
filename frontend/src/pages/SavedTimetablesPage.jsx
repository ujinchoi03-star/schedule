import React, { useState, useEffect } from "react";
import { ArrowLeft, Trash2, Calendar, Clock } from "lucide-react";
import { TimetableGrid } from "./TimetableGrid"; // 경로 확인 필요
import api from "../api/axios";

export function SavedTimetablesPage({ user, onBack }) {
    const [savedTimetables, setSavedTimetables] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🎨 백엔드 데이터를 그리드용으로 변환 (이전 로직 재사용)
    const formatSavedData = (lectures) => {
        if (!lectures) return [];
        const courseMap = new Map();
        const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };

        lectures.forEach((lec) => {
            // lecture_db_id 혹은 id를 키로 사용
            const id = lec.id || lec.lectureId;
            if (!courseMap.has(id)) {
                courseMap.set(id, { ...lec, id, times: [] });
            }

            if (lec.timeSlots && lec.timeSlots.length > 0) {
                lec.timeSlots.forEach(ts => {
                    courseMap.get(id).times.push({
                        day: dayMap[ts.day] ?? -1,
                        startTime: ts.startTime,
                        endTime: ts.endTime
                    });
                });
            } else if (lec.day) {
                courseMap.get(id).times.push({
                    day: dayMap[lec.day] ?? -1,
                    startTime: lec.startTime,
                    endTime: lec.endTime
                });
            }
        });

        return Array.from(courseMap.values()).map(lec => ({
            ...lec,
            type: lec.category?.includes('전공') ? 'major' : 'general',
        }));
    };

    // 🚀 DB에서 저장된 시간표 불러오기
    useEffect(() => {
        const fetchSavedTimetables = async () => {
            try {
                // user.id가 없으면 로컬스토리지에서라도 찾음 (안전장치)
                const userId = user?.id || localStorage.getItem('userId');
                if (!userId) return;

                const response = await api.get(`/timetable/saved/${userId}`);

                if (response.data) {
                    const formatted = response.data.map(t => ({
                        id: t.id,
                        name: t.name,
                        courses: formatSavedData(t.lectures)
                    }));
                    setSavedTimetables(formatted);
                }
            } catch (err) {
                console.error("시간표 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedTimetables();
    }, [user]);

    // 삭제 핸들러
    const handleDelete = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/api/timetable/saved/${id}`);
            setSavedTimetables(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="size-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="size-6 text-blue-600" />
                        보관함 (내가 저장한 시간표)
                    </h1>
                </div>
            </header>

            {/* 본문 */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">로딩 중...</div>
                ) : savedTimetables.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Calendar className="size-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">아직 저장된 시간표가 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-2">시간표 짜기 메뉴에서 '보관' 버튼을 눌러보세요!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {savedTimetables.map((timetable) => (
                            <div key={timetable.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* 카드 헤더 */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-lg text-gray-800">{timetable.name}</h3>
                                    <button
                                        onClick={() => handleDelete(timetable.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="삭제"
                                    >
                                        <Trash2 className="size-5" />
                                    </button>
                                </div>

                                {/* 시간표 그리드 (컴팩트 모드) */}
                                <div className="p-4">
                                    <div className="

                                     rounded-xl overflow-hidden">
                                        <TimetableGrid courses={timetable.courses} compact />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}