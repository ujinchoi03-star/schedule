package com.example.finger_schedule.domain

import jakarta.persistence.*

@Entity
class SavedTimetable(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    val name: String, // 시간표 이름 (예: 추천 시간표 1)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    val user: User,

    // 🚀 [핵심] 강의 정보를 복사하는 게 아니라, 기존 Lecture 테이블을 참조합니다.
    @ManyToMany
    @JoinTable(
        name = "saved_timetable_lectures",
        joinColumns = [JoinColumn(name = "saved_timetable_id")],
        inverseJoinColumns = [JoinColumn(name = "lecture_db_id")]
    )
    val lectures: List<Lecture>
)