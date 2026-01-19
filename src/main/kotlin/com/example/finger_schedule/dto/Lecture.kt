package com.example.finger_schedule.dto

import jakarta.persistence.*

@Entity
class Lecture(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val dbId: Long? = null,
// 🚨 [추가] 학교 구분 필드 ("KOREA" or "HANYANG")
    val university: String,
    val id: String,
    val name: String,
    val professor: String,
    val credit: Double,
    @Column(name = "day_of_week")
    val day: String,         // "Mon", "Tue"

    // 🚨 [변경] 이제 '교시'가 아니라 '00:00부터 흐른 분(Minute)'을 저장합니다.
    // 예: 09:00 -> 540, 10:30 -> 630
    val startTime: Int,
    val endTime: Int,

    val rating: Double,
    val category: String,
    val details: String,
    val college: String,
    val department: String,
    val timeRoom: String
) {
    // 시간 겹침 확인 (분 단위 비교라 훨씬 정확함)
    fun isOverlapping(other: Lecture): Boolean {
        if (this.day != other.day) return false
        // (내 시작 < 쟤 끝) AND (쟤 시작 < 내 끝)
        return (this.startTime < other.endTime) && (other.startTime < this.endTime)
    }
}