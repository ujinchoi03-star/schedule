package com.example.finger_schedule.domain

import jakarta.persistence.*

@Entity
class SavedTimetable(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    val name: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    val user: User,

    @ManyToMany
    @JoinTable(
        name = "saved_timetable_lectures",
        joinColumns = [JoinColumn(name = "saved_timetable_id")],
        inverseJoinColumns = [JoinColumn(name = "lecture_db_id")]
    )
    // 🚀 [수정] List 대신 MutableList를 사용하여 JPA 경고를 해결합니다.
    var lectures: MutableList<Lecture> = mutableListOf()
)