# <img src="./assets/RPMC-Transparent.png" alt="RpMC Logo" style="vertical-align: middle; height: 32px;"> RpMC-55 Registration Portal

A modern, lightweight web-based registration system for **Rangpur Medical College (RpMC-55)** students.  
This project handles both **directly selected students** and **migrated students**, with real-time verification via Google Apps Script.

The UI is fully responsive, animated, and designed to feel fast, clean, and official.

---

## Features

• Main registration portal for selected students  
• Dedicated flow for migrated students  
• Real-time registration status checking  
• Google Apps Script backend integration  
• Unique Ballot ID generation  
• Admin-review workflow for migrated students  
• Full-page loading screen with smooth exit  
• Micro-animations for modern UX  
• Mobile-first, responsive design  

No external JS frameworks. No build tools.

---

## Pages Overview

index.html  
Landing page with options for:
- Selected Student Registration
- Migrated Student Portal

registration.html  
Main registration page for RpMC-55 selected students.
- Verifies roll, merit position, score, blood group
- Generates unique Ballot ID
- Prevents duplicate registration
- Redirects migrated students automatically

migration.html  
Entry point for migrated students.
- Explains the migrated process
- Links to registration form and status checker

migrationform.html  
Migrated student submission form.
- Collects academic and contact details
- Submits data for admin verification
- Displays success confirmation

migrated-status.html  
Status checker for migrated applications.
- Shows APPROVED / PENDING / REJECTED
- Displays admin remarks when available

---

## Tech Stack

Frontend  
- HTML5  
- CSS3 (custom animations, no framework)  
- Vanilla JavaScript  

Backend  
- Google Apps Script (Web App endpoint)
- Google Sheets as database

Icons & Fonts  
- Font Awesome 6  
- Google Fonts (Lexend)

---

## Project Structure

```text
/
├── index.html
├── registration.html
├── migration.html
├── migrationform.html
├── migrated-status.html
├── styles.css
├── assets/
│   └── RpMC-Transparent.png
└── README.md
