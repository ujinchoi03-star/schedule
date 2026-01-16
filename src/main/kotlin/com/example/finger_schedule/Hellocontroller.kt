package com.example.finger_schedule

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {

    @GetMapping("/hello")
    fun hello(): String {
        return "안녕! 핑프들을 위한 시간표 서비스야!"
    }
}