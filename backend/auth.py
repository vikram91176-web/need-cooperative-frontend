"""
auth.py — authentication endpoints for NEED.

WHAT: Register, login, session check and logout, all in one Blueprint.
WHY:  Keeping auth separate from routes.py means each file stays focused.
HOW:  Registered in app.py under the /api prefix, so endpoints are:
        POST /api/auth/register
        POST /api/auth/login
        GET  /api/auth/me
        POST /api/auth/logout
"""

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from models import Cooperative, User, WelfareWallet, WorkerProfile, db

auth = Blueprint("auth", __name__, url_prefix="/auth")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_from_session():
    """Return the User whose id is stored in the session, or from Authorization Bearer header, or None."""
    user_id = session.get("user_id")
    if user_id is None:
        auth_header = request.headers.get("Authorization") or ""
        if auth_header.startswith("Bearer "):
            raw = auth_header.split("Bearer ", 1)[1].strip()
            if raw.startswith("user-"):
                try:
                    user_id = int(raw.replace("user-", ""))
                except ValueError:
                    pass
            elif raw.isdigit():
                user_id = int(raw)
    if user_id is None:
        return None
    return db.session.get(User, user_id)


def _start_session(user):
    """Store the user's id and role in the server-side session."""
    session.permanent = True          # survives browser restarts
    session["user_id"] = user.id
    session["role"] = user.role


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

@auth.post("/register")
def register():
    """
    Create a new account and immediately log the user in.

    Expected JSON body:
      name, email, phone, password, role ("customer" | "worker" | "cooperative_admin"),
      address (optional)
      --- worker only ---
      skills (optional), experience_years (optional), city (optional)
      --- cooperative admin / contractor only ---
      cooperative_name (optional), registration_number (optional), city (optional)
    """
    data = request.get_json(silent=True) or {}

    # --- Validation --------------------------------------------------------
    required = ["name", "email", "phone", "password", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    role = data["role"]
    if role not in ("customer", "worker", "cooperative_admin"):
        return jsonify({"error": "Role must be 'customer', 'worker', or 'cooperative_admin'"}), 400

    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"error": "An account with that email already exists"}), 409

    if User.query.filter_by(phone=data["phone"].strip()).first():
        return jsonify({"error": "An account with that phone number already exists"}), 409

    password = data["password"]
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # --- Create user -------------------------------------------------------
    user = User(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
        phone=data["phone"].strip(),
        password_hash=generate_password_hash(password),
        role=role,
        address=data.get("address", "").strip() or None,
        accepted_terms=data.get("accepted_terms", False),
        is_verified=True,
        trust_badge="Cooperative Administrator" if role == "cooperative_admin" else "Registered Member",
    )
    db.session.add(user)
    db.session.flush()          # gives user.id before commit

    # --- Create worker profile if needed -----------------------------------
    if role == "worker":
        try:
            years = int(data.get("experience_years") or 0)
        except (TypeError, ValueError):
            years = 0

        profile = WorkerProfile(
            user_id=user.id,
            skills=data.get("skills", "").strip() or None,
            experience_years=years,
            city=data.get("city", "").strip() or None,
            primary_service=data.get("primary_service", "").strip() or None,
            verification_status="pending",
        )
        db.session.add(profile)

        db.session.add(WelfareWallet(
            worker_id=user.id,
            balance=0.0,
            total_contribution=0.0,
            insurance_contribution=0.0,
        ))

    # --- Create cooperative society if registering as contractor/cooperative_admin ---
    elif role == "cooperative_admin":
        coop_name = (data.get("cooperative_name") or f"{user.name}'s Labour Union").strip()
        reg_num = (data.get("registration_number") or f"COOP-REG-{user.id:04d}").strip()
        city = (data.get("city") or "Noida").strip()
        categories = (data.get("service_categories") or "Home Services, Electrician, Plumber").strip()

        coop = Cooperative(
            name=coop_name,
            registration_number=reg_num,
            verification_status="verified",
            city=city,
            address=data.get("address", "").strip() or city,
            service_categories=categories,
            description=f"Registered Labour Cooperative represented by {user.name}.",
            contact_email=user.email,
            contact_phone=user.phone,
            admin_user_id=user.id,
            platform_fee_percent=10.0,
            cooperative_fee_percent=5.0,
        )
        db.session.add(coop)

    db.session.commit()

    _start_session(user)
    res_data = user.to_dict()
    res_data["token"] = f"user-{user.id}"
    return jsonify(res_data), 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@auth.post("/login")
def login():
    """
    Check credentials and start a session.

    Expected JSON body: { email, password }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password"}), 401

    _start_session(user)
    res_data = user.to_dict()
    res_data["token"] = f"user-{user.id}"
    return jsonify(res_data), 200


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

@auth.get("/me")
def me():
    """
    Return the currently logged-in user, or 401 if no session.

    The frontend calls this on page load to restore the logged-in state
    without asking the user to log in again after a refresh.
    """
    user = _user_from_session()
    if user is None:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user.to_dict()), 200


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------

@auth.post("/logout")
def logout():
    """Clear the session and return 200."""
    session.clear()
    return jsonify({"message": "Logged out"}), 200
