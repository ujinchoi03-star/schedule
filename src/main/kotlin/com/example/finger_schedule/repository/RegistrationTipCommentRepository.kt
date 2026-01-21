package com.example.finger_schedule.repository

import com.example.finger_schedule.domain.RegistrationTipComment
import org.springframework.data.jpa.repository.JpaRepository

interface RegistrationTipCommentRepository : JpaRepository<RegistrationTipComment, Long> {
    fun findByTipId(tipId: Long): List<RegistrationTipComment>
    fun countByTipId(tipId: Long): Int
    fun deleteByTipId(tipId: Long)
}
