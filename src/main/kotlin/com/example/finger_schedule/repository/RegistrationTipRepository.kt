package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.RegistrationTip
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository

interface RegistrationTipRepository : JpaRepository<RegistrationTip, Long> {
    fun findByUniversity(university: String, sort: Sort): List<RegistrationTip>
    
    // 카테고리 필터링
    fun findByUniversityAndCategory(university: String, category: String, sort: Sort): List<RegistrationTip>

    // 검색 (제목 or 내용 or 작성자)
    fun findByUniversityAndTitleContainingOrContentContainingOrUserNameContaining(
        university: String, 
        title: String, 
        content: String, 
        userName: String, 
        sort: Sort
    ): List<RegistrationTip>

    fun findByUserId(userId: String, sort: Sort): List<RegistrationTip>
}
