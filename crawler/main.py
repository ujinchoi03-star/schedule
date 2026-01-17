import json
import re
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# === 🛠️ 1. 한양대 시간 변환기 (그대로 유지) ===
def parse_hanyang_time(text):
    if not text: return []
    day_map = {'월': 'Mon', '화': 'Tue', '수': 'Wed', '목': 'Thu', '금': 'Fri', '토': 'Sat'}
    found_days = []
    for kr, en in day_map.items():
        if kr in text: found_days.append(en)
    
    if not found_days: return []

    times = re.findall(r"(\d{1,2}):(\d{2})", text)
    start_period = 1
    end_period = 2
    if times:
        start_hour = int(times[0][0])
        start_period = start_hour - 8 
        if start_period < 1: start_period = 1 
        end_hour = int(times[1][0])
        end_period = end_hour - 9 
        if end_period < start_period: end_period = start_period
    
    result = []
    for day in found_days:
        result.append({"day": day, "startTime": start_period, "endTime": end_period})
    return result

# === 🕷️ 2. 크롤링 시작 ===
print("🚀 100% 자동 크롤링을 시작합니다...")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
wait = WebDriverWait(driver, 10) # 10초까지 기다려줌

try:
    # 1. 사이트 접속
    driver.get("https://portal.hanyang.ac.kr/sugang/sulg.do")
    
    # 2. '수강편람' 버튼 클릭
    print("🖱️ '수강편람' 메뉴 진입...")
    try:
        menu_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[title="수강편람"]')))
        menu_btn.click()
    except:
        print("   (이미 수강편람 페이지일 수 있어 넘어갑니다)")

    # 3. '조회' 버튼 바로 클릭! (대기 없이 직진 🏎️)
    print("🖱️ '조회' 버튼 클릭! (데이터를 불러옵니다)")
    search_btn = wait.until(EC.element_to_be_clickable((By.ID, "btn_Find")))
    search_btn.click()

    # 4. 데이터 로딩 대기 (목록이 뜰 때까지 잠시 숨 고르기)
    time.sleep(3) 
    
    # === 5. 데이터 줍줍 시작 ===
    final_lectures = []
    rows = driver.find_elements(By.TAG_NAME, "tr")
    print(f"📊 화면에 뜬 {len(rows)}개의 강의를 분석합니다...")

    count = 0
    for row in rows:
        try:
            # 1. 과목명
            name_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="gwamokNm"]')
            if not name_elem: continue 
            name = name_elem[0].text.strip()

            # 2. 학점
            credit_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="hakjeom"]')
            credit = int(float(credit_elem[0].text.strip())) if credit_elem else 3

            # 3. 시간 & 교수님 (기존 코드 유지)
            time_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTimes"]')
            raw_time = time_elem[0].text.strip() if time_elem else ""
            prof_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="daepyoGangsaNm"]')
            professor = prof_elem[0].text.strip() if prof_elem else "미정"

            # 4. [NEW] 이수구분 (전공 vs 교양)
            isu_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="isuGbNm"]')
            isu_text = isu_elem[0].text.strip() if isu_elem else ""
            
            # 작성자님 로직: '전공' 글자 있으면 전공, 아니면 교양 (혹은 기타)
            category = "기타"
            if "전공" in isu_text: category = "전공"
            elif "교양" in isu_text: category = "교양"

            # 5. [NEW] 과목 상세 정보 (IC-PBL, 영어전용 등)
            detail_elem = row.find_elements(By.CSS_SELECTOR, 'td[id="suupTypeGb"]')
            details = detail_elem[0].text.strip() if detail_elem else ""

            # 6. 시간 파싱 (기존 로직 유지)
            parsed_list = parse_hanyang_time(raw_time)
            if not parsed_list:
                 parsed_list = [{"day": "Mon", "startTime": -1, "endTime": -1}]

            for p in parsed_list:
                lecture = {
                    "id": str(count + 1),
                    "name": name,
                    "professor": professor,
                    "credit": credit,
                    "rating": round(3.0 + (count % 20) * 0.1, 1),
                    "day": p['day'],
                    "startTime": p['startTime'],
                    "endTime": p['endTime'],
                    # 👇 새로 추가된 친구들!
                    "category": category, 
                    "details": details 
                }
                final_lectures.append(lecture)
                count += 1
            
            print(f"✅ 수집: {name} ({category} / {details})")

        except Exception as e:
            continue

except Exception as e:
    print(f"🚨 에러 발생: {e}")

finally:
    # 파일 저장
    with open("real_lectures_hanyang.json", "w", encoding="utf-8") as f:
        json.dump(final_lectures, f, ensure_ascii=False, indent=4)
    print(f"\n🎉 작업 끝! 총 {len(final_lectures)}개의 강의 데이터가 'real_lectures.json'에 저장됐습니다.")
    # driver.quit() # 확인 후 끄고 싶으면 주석 해제