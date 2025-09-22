# Postman Collection Guide

## ไฟล์ที่ให้มา:
1. `postman-collection.json` - Collection ที่มี Pre-request Script (สำหรับผู้ใช้ขั้นสูง)
2. `postman-simple.json` - Collection แบบง่าย (แนะนำ)

## วิธีใช้งาน (แนะนำใช้ postman-simple.json):

### Step 1: Import Collection
1. เปิด Postman
2. คลิก Import
3. เลือกไฟล์ `postman-simple.json`
4. คลิก Import

### Step 2: ตั้งค่า Environment
1. คลิกที่ Environment (มุมขวาบน)
2. สร้าง Environment ใหม่ชื่อ "Local Development"
3. เพิ่ม variable:
   - `baseUrl`: `http://localhost:7000`

### Step 3: ทดสอบ API

#### 3.1 Sign In
1. เลือก "1. Sign In"
2. คลิก Send
3. **คัดลอกค่าจาก Response Body:**
   - `csrf_token`: คัดลอกค่าจาก response body
   - `refresh_token`: คัดลอกค่าจาก response body

#### 3.2 Refresh Token
1. เลือก "2. Refresh Token (Manual Headers)"
2. **แก้ไข Headers:**
   - `X-CSRF-Token`: ใส่ค่า csrf_token ที่คัดลอกมา
   - `Cookie`: ใส่ค่า refresh_token และ csrf_token ที่คัดลอกมา
3. คลิก Send

#### 3.3 Logout
1. เลือก "3. Logout"
2. **แก้ไข Header:**
   - `Cookie`: ใส่ค่า refresh_token ที่คัดลอกมา
3. คลิก Send

## ตัวอย่างการคัดลอกค่า:

### จาก Sign In Response:
```json
{
  "user": { ... },
  "accessToken": "...",
  "accessTokenExpiresAt": "...",
  "refreshTokenExpiresAt": "...",
  "csrf_token": "9XDSV4-aKv3Wfu849d8Fr"  // ← คัดลอกค่านี้
}
```

### จาก Sign In Response Headers:
```
Set-Cookie: refresh_token=CScDFeOqNi5DAk644DQvyp3pcwmsLdVU.qwqYmPbsu5H-JkoX-s2ODN7tgZ0lE0jzFUfPMc8sMnUuHkP4-GI_4VpgyeYOauiY; Max-Age=604800; Expires=Mon, 29 Sep 2025 16:36:09 GMT; Path=/; SameSite=Lax; HttpOnly; refresh_token_csrf=9XDSV4-aKv3Wfu849d8Fr; Max-Age=604800; Expires=Mon, 29 Sep 2025 16:36:09 GMT; Path=/; SameSite=Lax
```

### สำหรับ Refresh Token Headers:
```
X-CSRF-Token: 9XDSV4-aKv3Wfu849d8Fr
Cookie: refresh_token=CScDFeOqNi5DAk644DQvyp3pcwmsLdVU.qwqYmPbsu5H-JkoX-s2ODN7tgZ0lE0jzFUfPMc8sMnUuHkP4-GI_4VpgyeYOauiY; refresh_token_csrf=9XDSV4-aKv3Wfu849d8Fr
```

## วิธีแก้ไขปัญหา:

### ปัญหา: "Invalid CSRF token"
**สาเหตุ:** CSRF token ใน header ไม่ตรงกับใน cookie

**วิธีแก้:**
1. ตรวจสอบว่า `X-CSRF-Token` header มีค่าเดียวกับ `refresh_token_csrf` ใน Cookie
2. ตรวจสอบว่าใช้ชื่อ cookie ถูกต้อง: `refresh_token_csrf` ไม่ใช่ `csrf_token`

### ปัญหา: "Invalid refresh token"
**สาเหตุ:** Refresh token ไม่ถูกต้องหรือหมดอายุ

**วิธีแก้:**
1. ลอง Sign In ใหม่เพื่อได้ refresh token ใหม่
2. ตรวจสอบว่า refresh_token ใน Cookie header ถูกต้อง

## Tips:
- ใช้ Postman Console (View → Show Postman Console) เพื่อดู debug logs
- ตรวจสอบ Cookies ใน Postman (Cookies tab) หลัง Sign In
- คัดลอกค่าให้ถูกต้องและครบถ้วน
