from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import database, models
from ..schemas import schemas
from ..core import security

router = APIRouter()

import random
import time
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Store OTPs in-memory: { email: { "otp": "123456", "expires_at": timestamp, "verified": bool } }
OTP_STORE = {}

def send_email_otp(recipient_email: str, otp_code: str):
    """
    Sends an email with the OTP using configured SMTP credentials (e.g. Gmail SMTP).
    Supports Gmail 16-character App Passwords with or without spaces, and both
    STARTTLS (port 587) and SSL (port 465).
    """
    recipient_email = recipient_email.strip().lower()
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    # Strip spaces in case user pasted 16-char Google App Password as 'xxxx xxxx xxxx xxxx'
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "")
    sender_email = smtp_user if smtp_user else os.getenv("SMTP_FROM", "no-reply@smartmanure.gov.in").strip()

    print(f"\n==========================================")
    print(f"[EMAIL OTP DISPATCH] To: {recipient_email}")
    print(f"OTP Code: {otp_code}")
    print(f"Valid for: 10 minutes")
    print(f"SMTP Server: {smtp_server}:{smtp_port} | User: {smtp_user or 'None (Simulated Mode)'}")
    print(f"==========================================\n")

    if smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your Smart Manure Verification Code: {otp_code}"
            msg["From"] = f"Smart Manure Portal <{sender_email}>"
            msg["To"] = recipient_email

            text_content = f"Your Smart Manure farmer registration OTP is: {otp_code}. Valid for 10 minutes."
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #16a34a, #0d9488); padding: 18px 24px; border-radius: 8px; text-align: center; color: white;">
                    <h2 style="margin: 0; font-size: 20px;">🌱 Smart Manure Monitoring</h2>
                    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">GOBARdhan Farmer Verification Code</p>
                </div>
                <div style="padding: 24px 8px; text-align: center;">
                    <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">
                        Use the one-time verification code below to verify your Gmail address and complete registration:
                    </p>
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 14px 28px; margin-bottom: 20px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #15803d;">{otp_code}</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                        This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
                    </p>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
                    Smart Manure & Crop Suitability Prediction &bull; Tamil Nadu Agricultural Portal
                </div>
            </div>
            """
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=12) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())

            print(f"[OTP Email] Successfully dispatched via Gmail SMTP to {recipient_email}")
            return True, "Email sent successfully"
        except Exception as e:
            err_msg = str(e)
            print(f"[OTP Email] SMTP delivery error: {err_msg}")
            return False, f"SMTP delivery failed: {err_msg}"
    else:
        return False, "SMTP credentials (SMTP_USER / SMTP_PASSWORD) not configured in environment. Using demo simulated OTP."

@router.post("/auth/send-otp")
def send_otp(request: schemas.SendOtpRequest, db: Session = Depends(database.get_db)):
    email = request.email.lower().strip()
    
    # Generate 6-digit random code
    code = f"{random.randint(100000, 999999)}"
    now = time.time()
    OTP_STORE[email] = {
        "otp": code,
        "expires_at": now + 600, # 10 minutes
        "verified": False
    }

    sent, msg = send_email_otp(email, code)
    
    return {
        "success": True,
        "message": f"Verification OTP sent to your Gmail ({email})" if sent else f"Verification code generated ({msg})",
        "email": email,
        "email_dispatched": sent,
        "delivery_mode": "smtp" if sent else "simulated",
        "dev_otp": code  # Provided so registration never blocks during demos or when SMTP is not configured
    }

@router.post("/auth/verify-otp")
def verify_otp(request: schemas.VerifyOtpRequest):
    email = request.email.lower().strip()
    record = OTP_STORE.get(email)
    
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested for this email. Please click 'Send OTP'.")
    
    if time.time() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    if record["otp"] != request.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter the 6-digit code received.")
    
    record["verified"] = True
    return {
        "success": True,
        "message": "Email verified successfully!"
    }

@router.post("/auth/register")
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    email = user_data.email.lower().strip()
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify OTP if provided or check if pre-verified
    if user_data.otp:
        record = OTP_STORE.get(email)
        if not record or record.get("otp") != user_data.otp.strip():
            raise HTTPException(status_code=400, detail="Invalid OTP code. Please verify your email with the OTP sent.")
        if time.time() > record["expires_at"]:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
    
    district = user_data.district or user_data.location or "General"
    role = user_data.role if user_data.role in ["farmer", "authority"] else "farmer"
    hashed_password = security.get_password_hash(user_data.password)
    
    # Generate farm_id for new farmers
    farm_id = None
    if role == "farmer":
        import uuid
        farm_id = f"TN-{district[:3].upper()}-{str(uuid.uuid4())[:4].upper()}"

    db_user = models.User(
        email=email,
        password_hash=hashed_password,
        role=role,
        district=district,
        name=user_data.name,
        phone=user_data.phone,
        farm_id=farm_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Clean up verified OTP
    if email in OTP_STORE:
        del OTP_STORE[email]

    # Automatically issue access token so the user can immediately be logged in!
    access_token = security.create_access_token(data={"sub": db_user.email, "role": db_user.role})

    return {
        "success": True,
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "role": db_user.role,
            "district": db_user.district,
            "farm_id": db_user.farm_id
        }
    }


def _authenticate(user_data: schemas.UserCreate, expected_role: str = None, db: Session = Depends(database.get_db)):
    clean_email = user_data.email.strip().lower() if user_data.email else ""
    clean_password = user_data.password.strip() if user_data.password else ""
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if not user or not security.verify_password(clean_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if expected_role and user.role != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User role is '{user.role}', but this portal requires '{expected_role}'."
        )

    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or ("Farmer" if user.role == "farmer" else "TN Agricultural Officer"),
            "role": user.role,
            "district": user.district or "Karur",
            "farm_id": user.farm_id or "TN-KAR-1001"
        }
    }

@router.post("/auth/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, db=db)

@router.post("/auth/farmer/login")
def login_farmer(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, expected_role="farmer", db=db)

@router.post("/auth/authority/login")
def login_authority(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return _authenticate(user_data, expected_role="authority", db=db)
