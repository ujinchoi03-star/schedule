package com.example.finger_schedule.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider {
    // 🔑 비밀키 생성 (실무에선 application.properties에 숨겨야 함)
    private val key: SecretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256)

    // 토큰 유효시간 (24시간)
    private val validityInMilliseconds: Long = 1000 * 60 * 60 * 24

    // 1. 토큰 생성 (여권 발급)
    fun createToken(email: String): String {
        val now = Date()
        val validity = Date(now.time + validityInMilliseconds)

        return Jwts.builder()
            .setSubject(email) // 토큰에 담을 정보 (아이디)
            .setIssuedAt(now) // 발급 시간
            .setExpiration(validity) // 만료 시간
            .signWith(key, SignatureAlgorithm.HS256) // 서명
            .compact()
    }

    // 2. 토큰에서 아이디(이메일) 추출
    fun getEmail(token: String): String {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
            .subject
    }

    // 3. 토큰 유효성 검사 (위조 확인)
    fun validateToken(token: String): Boolean {
        return try {
            val claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token)
            !claims.body.expiration.before(Date()) // 만료 안 됐으면 OK
        } catch (e: Exception) {
            false // 위조되거나 만료되면 false
        }
    }
}