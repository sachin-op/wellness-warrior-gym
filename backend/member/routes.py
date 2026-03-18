from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, MembershipPlan, Admission, Payment, WeightLog, WaterLog
from utils.helpers import get_expiry_date, get_ist_date
from datetime import datetime

member_bp = Blueprint("member", __name__, url_prefix="/api/member")

def get_current_member():
    try:
        return User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None
    

# ── GET /api/member/dashboard ─────────────────────────────────────────
@member_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    member = get_current_member()
    if not member: return jsonify({"error": "User not found"}), 404
    data = member.to_dict()
    if member.admission: data["admission"] = member.admission.to_dict()
    return jsonify(data), 200

# ── GET /api/member/plans ─────────────────────────────────────────────
@member_bp.route("/plans", methods=["GET"])
@jwt_required()
def get_plans():
    plans = MembershipPlan.query.filter_by(is_active=True)\
              .order_by(MembershipPlan.plan_type, MembershipPlan.duration_days).all()
    return jsonify([p.to_dict() for p in plans]), 200

# ── POST /api/member/enroll ───────────────────────────────────────────
@member_bp.route("/enroll", methods=["POST"])
@jwt_required()
def enroll():
    member = get_current_member()
    data   = request.get_json()
    if Admission.query.filter_by(member_id=member.id, is_active=True).first():
        return jsonify({"error": "Already have an active admission"}), 409
    plan = MembershipPlan.query.get(data.get("plan_id"))
    if not plan: return jsonify({"error": "Plan not found"}), 404
    now       = datetime.utcnow()
    admission = Admission(
        member_id=member.id, plan_id=plan.id, admission_date=now,
        expiry_date=get_expiry_date(now, plan.duration_days),
        fee_status="Due", is_active=True,
    )
    db.session.add(admission); db.session.commit()
    return jsonify({"message": "Enrolled successfully", "admission": admission.to_dict()}), 201

# ── GET /api/member/payments ──────────────────────────────────────────
@member_bp.route("/payments", methods=["GET"])
@jwt_required()
def payments():
    member = get_current_member()
    if not member.admission: return jsonify([]), 200
    pays = Payment.query.filter_by(admission_id=member.admission.id)\
             .order_by(Payment.payment_date.desc()).all()
    return jsonify([p.to_dict() for p in pays]), 200

# ── POST /api/member/weight-log ───────────────────────────────────────
@member_bp.route("/weight-log", methods=["POST"])
@jwt_required()
def log_weight():
    member = get_current_member()
    data   = request.get_json()
    weight = data.get("weight_kg")

    if not weight:
        return jsonify({"error": "weight_kg is required"}), 400
    weight = float(weight)
    if weight < 20 or weight > 300:
        return jsonify({"error": "Weight must be between 20 and 300 kg"}), 400

    today    = get_ist_date()
    existing = WeightLog.query.filter_by(member_id=member.id, date=today).first()
    if existing:
        # update today's entry
        existing.weight_kg = weight
        existing.note      = data.get("note", existing.note)
        db.session.commit()
        return jsonify({"message": "Weight updated", "log": existing.to_dict()}), 200

    log = WeightLog(
        member_id = member.id,
        weight_kg = weight,
        date      = today,
        note      = data.get("note"),
    )
    db.session.add(log); db.session.commit()
    return jsonify({"message": "Weight logged", "log": log.to_dict()}), 201

# ── GET /api/member/weight-history ────────────────────────────────────
@member_bp.route("/weight-history", methods=["GET"])
@jwt_required()
def weight_history():
    member  = get_current_member()
    logs    = WeightLog.query.filter_by(member_id=member.id).order_by(WeightLog.date.asc()).all()
    result  = [l.to_dict() for l in logs]

    # calculate stats
    starting_weight = logs[0].weight_kg  if logs else None
    current_weight  = logs[-1].weight_kg if logs else None
    total_change    = round(current_weight - starting_weight, 1) if logs and len(logs) > 1 else 0

    # BMI
    bmi = None; bmi_category = None
    if member.height_cm and current_weight:
        h   = member.height_cm / 100
        bmi = round(current_weight / (h * h), 1)
        if   bmi < 18.5: bmi_category = "Underweight"
        elif bmi < 25:   bmi_category = "Normal"
        elif bmi < 30:   bmi_category = "Overweight"
        else:            bmi_category = "Obese"

    return jsonify({
        "logs":             result,
        "starting_weight":  starting_weight,
        "current_weight":   current_weight,
        "total_change":     total_change,
        "goal_weight":      member.goal_weight_kg,
        "height_cm":        member.height_cm,
        "bmi":              bmi,
        "bmi_category":     bmi_category,
    }), 200

# ── PUT /api/member/health-profile ────────────────────────────────────
@member_bp.route("/health-profile", methods=["PUT"])
@jwt_required()
def update_health_profile():
    member = get_current_member()
    data   = request.get_json()
    if "height_cm"      in data: member.height_cm      = float(data["height_cm"])
    if "goal_weight_kg" in data: member.goal_weight_kg = float(data["goal_weight_kg"])
    db.session.commit()
    return jsonify({"message": "Health profile updated", "user": member.to_dict()}), 200


# ── GET /api/member/water-today ───────────────────────────────────────
@member_bp.route("/water-today", methods=["GET"])
@jwt_required()
def water_today():
    member = get_current_member()
    if not member:
        return jsonify({"error": "User not found"}), 404
    today  = get_ist_date()
    log    = WaterLog.query.filter_by(member_id=member.id, date=today).first()
    if not log:
        return jsonify({
            "glasses_count": 0,
            "goal_glasses":  8,
            "ml_consumed":   0,
            "ml_goal":       2000,
            "percentage":    0,
            "goal_achieved": False,
            "date":          today.isoformat(),
        }), 200
    return jsonify(log.to_dict()), 200


# ── POST /api/member/water-log ────────────────────────────────────────
@member_bp.route("/water-log", methods=["POST"])
@jwt_required()
def log_water():
    member = get_current_member()
    if not member:
        return jsonify({"error": "User not found"}), 404
    data   = request.get_json()
    action = data.get("action", "add")   # add / remove / set
    goal   = data.get("goal_glasses")
    today  = get_ist_date()

    log = WaterLog.query.filter_by(member_id=member.id, date=today).first()
    if not log:
        log = WaterLog(
            member_id     = member.id,
            glasses_count = 0,
            goal_glasses  = goal or 8,
            date          = today,
        )
        db.session.add(log)

    if goal:
        log.goal_glasses = int(goal)

    if action == "add":
        if log.glasses_count < 20:
            log.glasses_count += 1
    elif action == "remove":
        if log.glasses_count > 0:
            log.glasses_count -= 1
    elif action == "set":
        count = data.get("glasses_count", 0)
        log.glasses_count = max(0, min(20, int(count)))

    db.session.commit()
    return jsonify(log.to_dict()), 200


# ── GET /api/member/water-history ─────────────────────────────────────
@member_bp.route("/water-history", methods=["GET"])
@jwt_required()
def water_history():
    member = get_current_member()
    if not member:
        return jsonify({"error": "User not found"}), 404

    from datetime import timedelta
    today  = get_ist_date()
    logs   = WaterLog.query.filter_by(member_id=member.id)\
               .order_by(WaterLog.date.desc()).limit(30).all()

    # build last 7 days array (fill missing days with 0)
    week = []
    for i in range(6, -1, -1):
        d   = today - timedelta(days=i)
        log = next((l for l in logs if l.date == d), None)
        week.append({
            "date":          d.isoformat(),
            "day":           d.strftime("%a"),
            "glasses_count": log.glasses_count if log else 0,
            "goal_glasses":  log.goal_glasses  if log else 8,
            "goal_achieved": (log.glasses_count >= log.goal_glasses) if log else False,
        })

    # streak — consecutive days hitting goal (going back from yesterday)
    streak = 0
    for i in range(1, 31):
        d   = today - timedelta(days=i)
        log = next((l for l in logs if l.date == d), None)
        if log and log.glasses_count >= log.goal_glasses:
            streak += 1
        else:
            break

    # weekly average
    week_logs     = [w for w in week if w["glasses_count"] > 0]
    weekly_avg    = round(sum(w["glasses_count"] for w in week) / 7, 1)
    total_glasses = sum(l.glasses_count for l in logs)

    return jsonify({
        "week":          week,
        "streak":        streak,
        "weekly_avg":    weekly_avg,
        "total_glasses": total_glasses,
        "logs":          [l.to_dict() for l in logs],
    }), 200