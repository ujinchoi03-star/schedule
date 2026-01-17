from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json
import traceback

# ==========================================
# ⚙️ 설정
# ==========================================
def setup_driver():
    chrome_options = Options()
    # 실행 중인 디버깅 크롬 포트 (9222)에 연결
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# ==========================================
# 🕷️ 메인 로직
# ==========================================
def main():
    try:
        driver = setup_driver()
        print("✅ 크롬 브라우저 연결 성공!")

        try:
            driver.switch_to.default_content()
            WebDriverWait(driver, 5).until(EC.frame_to_be_available_and_switch_to_it("Main"))
            WebDriverWait(driver, 5).until(EC.frame_to_be_available_and_switch_to_it("coreMain"))
            print("🚪 [Main > coreMain] 진입 성공!")
        except:
            print("⚠️ 프레임 진입 실패 (계속 진행)")

        all_lectures = []

        targets = {
            '00': '전공', 
            '24': '학문의기초', 
            '01': '교양', 
            '30': '교직', 
            '41': '군사학', 
            '71': '평생교육사'
        }

        for div_code, div_name in targets.items():
            try:
                cour_div = Select(driver.find_element(By.ID, 'pCourDiv'))
                cour_div.select_by_value(div_code)
                print(f"\n🚀 [ {div_name} ({div_code}) ] 선택됨")
                time.sleep(1.5)
            except Exception as e:
                print(f"🚨 '{div_name}' 선택 실패: {e}")
                continue

            if div_code in ['30', '41', '71']:
                print(f"  ⚡ {div_name} -> 바로 조회")
                click_search_and_parse(driver, div_name, "전체", "전체", all_lectures)
                continue

            elif div_code == '01':
                try:
                    group_select = Select(driver.find_element(By.ID, 'pGroupCd'))
                    for i in range(0, len(group_select.options)):
                        try:
                            group_select = Select(driver.find_element(By.ID, 'pGroupCd'))
                            group_name = group_select.options[i].text
                            
                            if "선택" in group_name and len(group_name) < 5: continue

                            group_select.select_by_index(i)
                            print(f"  📘 영역: {group_name}")
                            time.sleep(1.5) 
                            loop_departments(driver, div_name, group_name, all_lectures)
                        except:
                            continue
                except:
                    pass

            else:
                try:
                    col_select = Select(driver.find_element(By.ID, 'pCol'))
                    for i in range(0, len(col_select.options)):
                        try:
                            col_select = Select(driver.find_element(By.ID, 'pCol'))
                            col_name = col_select.options[i].text
                            
                            if "선택" in col_name and len(col_name) < 5: continue

                            col_select.select_by_index(i)
                            print(f"  🏫 단과대: {col_name}")
                            time.sleep(1.5) 
                            loop_departments(driver, div_name, col_name, all_lectures)
                        except:
                            continue
                except:
                    pass

        save_to_json(all_lectures)

    except Exception:
        traceback.print_exc()

def loop_departments(driver, category, sub_category, results):
    try:
        if len(driver.find_elements(By.ID, 'pDept')) == 0:
            click_search_and_parse(driver, category, sub_category, "전체", results)
            return

        dept_select = Select(driver.find_element(By.ID, 'pDept'))
        options_len = len(dept_select.options)

        if options_len <= 1:
            click_search_and_parse(driver, category, sub_category, "전체", results)
            return

        for j in range(0, options_len):
            try:
                dept_select = Select(driver.find_element(By.ID, 'pDept'))
                dept_name = dept_select.options[j].text
                
                if ("선택" in dept_name or "전체" in dept_name) and len(dept_name) < 10: 
                    continue

                dept_select.select_by_index(j)
                time.sleep(0.5) 
                click_search_and_parse(driver, category, sub_category, dept_name, results)
            except:
                continue

    except Exception:
        click_search_and_parse(driver, category, sub_category, "전체(Fallback)", results)

def click_search_and_parse(driver, category, college, dept, results):
    try:
        driver.find_element(By.ID, 'btnSearch').click()
        time.sleep(2.0) 

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        rows = soup.select('table tbody tr')

        if not rows: return
        if len(rows) == 1 and ("없습니다" in rows[0].text or "No data" in rows[0].text):
            return

        count = 0
        for idx, row in enumerate(rows):
            try:
                cols = row.find_all('td')
                if len(cols) < 8: continue

                course_id = cols[1].text.strip()
                section = cols[2].text.strip()
                
                name_cell = cols[5]
                name = name_cell.get_text(strip=True)
                
                # -------------------------------------------------
                # 🌟 [수정] 강의 특징(MOOC, 영강, 외국어) 추출 로직
                # -------------------------------------------------
                details = []

                # 1. MOOC 라벨 체크 (HTML 태그 확인)
                if name_cell.find('span', class_='label-type', string='M'):
                    details.append("MOOC")
                    if name.endswith('M'): name = name[:-1]
                
                # 2. 영강 체크 (이름에 포함 여부)
                if "영강" in name:
                    details.append("영강")
                
                # 3. 외국어강의 체크
                if "외국어강의" in name:
                    details.append("외국어강의")

                # -------------------------------------------------

                credit_raw = cols[7].text.strip() 
                credit = 0.0
                try:
                    credit_str = credit_raw.split('(')[0].strip()
                    credit = float(credit_str)
                except:
                    credit = 0.0
                
                time_room = cols[8].get_text(separator=" ").strip()
                prof = cols[6].text.strip() if len(cols) > 6 else ""

                lecture = {
                    "id": f"{course_id}-{section}",
                    "name": name,
                    "professor": prof,
                    "credit": credit,
                    "timeRoom": time_room,
                    "category": category,
                    "college": college,
                    "department": dept,
                    "details": ",".join(details), # 예: "MOOC,영강"
                    "year": 2025,
                    "semester": 1
                }
                results.append(lecture)
                count += 1
            except:
                continue
        
        if count > 0:
            print(f"      ✅ {count}건 수집 완료 ({dept})")

    except Exception as e:
        print(f"      ❌ 검색/파싱 실패 ({dept}): {e}")

def save_to_json(data):
    filename = 'real_lectures_korea.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"\n🎉 크롤링 최종 완료! 총 {len(data)}개 강의 저장됨.")

if __name__ == "__main__":
    main()