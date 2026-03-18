from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ── POST /api/auth/register ───────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    for field in ["username", "email", "password"]:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409
    user = User(
        username = data["username"],
        email    = data["email"],
        phone    = data.get("phone"),
        role     = "member",
        status   = "pending",
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({
        "message": "Registration submitted! Please wait for admin approval.",
        "user":    user.to_dict(),
    }), 201


# ── POST /api/auth/login — Step 1 ─────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    if user.role != "admin":
        if user.status == "pending":
            return jsonify({
                "error": "Your account is pending admin approval.",
                "status": "pending"
            }), 403
        if user.status == "terminated":
            return jsonify({
                "error": f"Your account has been terminated. Reason: {user.terminate_reason or 'Contact gym owner'}",
                "status": "terminated"
            }), 403
    # admin → full token immediately
    # member → return step=2 signal, no token yet
    if user.role == "admin":
        token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token":    token,
            "user":            user.to_dict(),
            "role":            user.role,
            "agreed_to_rules": user.agreed_to_rules,
            "step":            "done",
        }), 200
    else:
        # step 1 passed — ask for reg number
        return jsonify({
            "step":     "verify_reg",
            "user_id":  user.id,
            "message":  "Password verified. Please enter your registration number.",
        }), 200


# ── POST /api/auth/verify-reg — Step 2 ───────────────────────────────
@auth_bp.route("/verify-reg", methods=["POST"])
def verify_reg():
    data       = request.get_json()
    user_id    = data.get("user_id")
    reg_number = data.get("reg_number", "").strip().upper()

    if not user_id or not reg_number:
        return jsonify({"error": "user_id and reg_number are required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Invalid session. Please login again."}), 404

    if user.status == "terminated":
        return jsonify({
            "error": f"Your account has been terminated. Reason: {user.terminate_reason or 'Contact gym owner'}",
            "status": "terminated"
        }), 403

    if not user.reg_number or user.reg_number.upper() != reg_number:
        return jsonify({
            "error": "Invalid registration number. Please contact the gym owner.",
        }), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token":    token,
        "user":            user.to_dict(),
        "role":            user.role,
        "agreed_to_rules": user.agreed_to_rules,
        "step":            "done",
    }), 200


# ── POST /api/auth/agree-rules ────────────────────────────────────────
@auth_bp.route("/agree-rules", methods=["POST"])
@jwt_required()
def agree_rules():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.agreed_to_rules = True
    db.session.commit()
    return jsonify({"message": "Rules accepted", "user": user.to_dict()}), 200


# ── PUT /api/auth/profile ─────────────────────────────────────────────
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    data = request.get_json()
    if "height_cm" in data:
        user.height_cm = float(data["height_cm"])
    if "goal_weight_kg" in data:
        user.goal_weight_kg = float(data["goal_weight_kg"])
    if "phone" in data:
        user.phone = data["phone"]
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200


# ── GET /api/auth/me ──────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200