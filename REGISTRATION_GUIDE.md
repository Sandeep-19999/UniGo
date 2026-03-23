# UniGo Registration Guide - Troubleshooting & Tips

## ✅ Successful Registration Checklist

Before registering, ensure you have:
- [ ] Server running on `http://localhost:5001`
- [ ] Client running on `http://localhost:5173`
- [ ] MongoDB connection is active
- [ ] Both services have started without errors

---

## 📝 Registration Form Requirements

### Required Fields
1. **Full Name** - Any name (no special requirements)
2. **Role** - Select "Passenger" or "Driver"
3. **Email** - Valid email address (must be unique)
4. **Password** - At least **8 characters** (REQUIRED!)
5. **Confirm Password** - Must match password

### Password Requirements ⚠️
- **Minimum 8 characters** - This is the main requirement
- Can contain letters, numbers, special characters
- Examples of valid passwords:
  - ✅ `Password123`
  - ✅ `MySecure@Pass`
  - ✅ `12345678`
  - ❌ `test` (too short)
  - ❌ `short` (too short)

---

## 🆘 Common Registration Errors & Solutions

### Error: "Password must be at least 8 characters."
**Cause:** Password is shorter than 8 characters  
**Solution:** Enter a password with 8 or more characters
```
❌ Wrong: "pass" or "123456"
✅ Correct: "password123" or "MyPass2024"
```

### Error: "Passwords do not match."
**Cause:** Password and Confirm Password fields don't match  
**Solution:** Make sure both password fields are identical
```
Password:        MyPassword123
Confirm Password: MyPassword123  ✅ Match
```

### Error: "Email already exists."
**Cause:** This email address is already registered  
**Solution:** Use a different email address or login with existing account
```
❌ john@example.com (already taken)
✅ john.doe@example.com (new email)
```

### Error: "Admin registration not allowed."
**Cause:** You selected "Admin" role but didn't provide correct invite code  
**Solution:** Only use Admin role if you have the invite code
```
1. Select "Passenger" or "Driver" instead
   OR
2. Ask system owner for admin invite code
```

### Error: "Registration failed. Please try again."
**Cause:** Server error or connection issue  
**Solution:**
1. Check if server is running: `npm run dev -w server`
2. Check MongoDB connection in `server/.env`
3. Check if API URL is correct in `client/.env.local`

---

## 🚀 Step-by-Step Registration as Passenger

### 1. Open Registration Page
```
Go to: http://localhost:5173/auth/register
```

### 2. Fill in Your Information
```
Full Name:        Ali Ahmed
Role:             Passenger
Email:            ali@university.edu
Password:         SecurePass123
Confirm Password: SecurePass123
```

### 3. Click "Create Account"
- Wait for account creation (should be quick)
- You'll be redirected to `/home` if successful

### 4. Start Using App
- Browse available drivers
- Search for rides
- Book seats
- Rate drivers

---

## 🔍 What Happens During Registration

1. **Frontend Validation** - Form checks:
   - Name is not empty
   - Email is valid format
   - Password is 8+ characters
   - Passwords match

2. **Server Validation** - Backend checks:
   - All required fields present
   - Email is unique (not already registered)
   - Password validation (8+ chars)
   - Email format validation

3. **Database** - MongoDB:
   - Creates new user document
   - Hashes password (bcrypt)
   - Stores in Users collection

4. **JWT Token** - Creates:
   - Authentication token
   - Stored in localStorage
   - Valid for 7 days

5. **Redirect** - Routes to:
   - Passengers → `/home`
   - Drivers → `/driver/dashboard`
   - Admins → `/admin/dashboard`

---

## 🔐 Security Notes

✅ **Passwords are hashed** - Never stored as plain text  
✅ **JWT tokens** - Secure authentication  
✅ **HTTPS recommended** - For production  
✅ **Email unique** - No duplicate registrations  

---

## 📋 Registration Form Fields Explained

### Full Name
- Your actual name
- Used to display on profile
- Max 80 characters
- Cannot be empty

### Role
- **Passenger** - Book rides, rate drivers
- **Driver** - Create vehicles, post rides
- **Admin** - System management (requires invite)

### Email
- Must be unique (no duplicates)
- Used for login
- Should be valid/active
- Lowercase automatically

### Password
- **Must be 8+ characters** ⚠️
- Used only for authentication
- Hashed before storage
- Can contain: letters, numbers, symbols

### Confirm Password
- Must exactly match password
- Prevents typos
- Validated on client side

---

## ✅ After Successful Registration

Once you register as a **Passenger**, you can:

1. **Login anytime** with:
   - Email: (the email you registered with)
   - Password: (the password you created)

2. **Access Passenger Features:**
   - Browse all drivers
   - Search available rides
   - Book seats on rides
   - Track booking status
   - Rate drivers after rides

3. **View Your Profile:**
   - Edit basic information (future feature)
   - See booking history
   - View ratings received

---

## 🆘 Still Having Issues?

### Verify Server is Running
```bash
curl http://localhost:5001/api/health
# Should return: Server is healthy
```

### Check MongoDB Connection
```bash
# Verify MONGODB_URI in server/.env
# Should be a valid connection string
```

### Check API URL in Frontend
```bash
# Verify client/.env.local has:
VITE_API_URL=http://localhost:5001/api
```

### Clear Browser Cache
```
1. Open DevTools (F12)
2. Go to Application
3. Clear LocalStorage
4. Refresh page
5. Try registering again
```

### Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Screenshot and share if needed
```

---

## 📞 Support

If you continue to have issues:

1. **Check the error message** - Read it carefully
2. **Check troubleshooting section** - Likely covered above
3. **Verify all services** - Server, client, MongoDB
4. **Check environment variables** - Correct URLs and keys
5. **Restart services** - Kill and restart npm run dev

---

## 📝 Quick Checklist for Successful Registration

- [ ] Server running (`npm run dev -w server`)
- [ ] Client running (`npm run dev -w client`)
- [ ] Name entered (any text)
- [ ] Role selected (Passenger recommended)
- [ ] Email entered (must be unique)
- [ ] Password entered (**8+ characters**)
- [ ] Confirm Password matches
- [ ] All fields filled (no blanks)
- [ ] "Create account" button clicked
- [ ] Waited for submission
- [ ] Redirected to home/dashboard ✅

---

**Status:** ✅ Registration Guide Complete

For more help, see:
- **QUICK_START.md** - Setup guide
- **API_SETUP.md** - API configuration
- **README.md** - Project overview
