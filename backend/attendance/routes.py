from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Admission, Attendance
from utils.helpers import is_within_shift_window, calculate_duration, get_ist_now, get_ist_date
from datetime import datetime
from functools import wraps

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")

def get_current_member():
    try:
        return User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity())
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── POST /api/attendance/checkin ──────────────────────────────────────
@attendance_bp.route("/checkin", methods=["POST"])
@jwt_required()
def checkin():
    member    = get_current_member()
    admission = Admission.query.filter_by(member_id=member.id, is_active=True).first()
    if not admission:
        return jsonify({"error": "No active membership found"}), 403
    if admission.fee_status == "Overdue":
        return jsonify({"error": "Fee is overdue. Please clear dues before checking in"}), 403
    if admission.expiry_date < get_ist_now().replace(tzinfo=None):
        admission.is_active = False
        db.session.commit()
        return jsonify({"error": "Membership has expired"}), 403

    data  = request.get_json() or {}
    shift = data.get("shift", "Morning")

    if not is_within_shift_window(shift):
        return jsonify({"error": f"Cannot check in outside {shift} shift hours"}), 400

    today    = get_ist_date()
    existing = Attendance.query.filter_by(member_id=member.id, date=today, status="Present").first()
    if existing:
        return jsonify({"error": "Already checked in today. Please check out first"}), 409

    record = Attendance(
        member_id    = member.id,
        admission_id = admission.id,
        shift        = shift,
        check_in_time= get_ist_now().replace(tzinfo=None),
        date         = today,
        status       = "Present",
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Checked in successfully", "attendance": record.to_dict()}), 201


# ── POST /api/attendance/checkout ─────────────────────────────────────
@attendance_bp.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    member = get_current_member()
    today  = get_ist_date()
    record = Attendance.query.filter_by(member_id=member.id, date=today, status="Present").first()
    if not record:
        return jsonify({"error": "No active check-in found for today"}), 404
    now                   = get_ist_now().replace(tzinfo=None)
    record.check_out_time = now
    record.duration_mins  = calculate_duration(record.check_in_time, now)
    record.status         = "Checked-Out"
    db.session.commit()
    return jsonify({"message": f"Checked out! You spent {record.duration_mins} minutes at the gym today.", "attendance": record.to_dict()}), 200


# ── GET /api/attendance/today ─────────────────────────────────────────
@attendance_bp.route("/today", methods=["GET"])
@jwt_required()
def today_status():
    member = get_current_member()
    record = Attendance.query.filter_by(member_id=member.id, date=get_ist_date()).first()
    if not record:
        return jsonify({"status": "Not checked in", "record": None}), 200
    return jsonify({"status": record.status, "record": record.to_dict()}), 200


# ── GET /api/attendance/history ───────────────────────────────────────
@attendance_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    member  = get_current_member()
    records = Attendance.query.filter_by(member_id=member.id)\
                .order_by(Attendance.date.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


# ── GET /api/attendance/summary ───────────────────────────────────────
@attendance_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    member_id = int(get_jwt_identity())
    today     = get_ist_date()
    records   = Attendance.query.filter(
        Attendance.member_id == member_id,
        db.extract("month", Attendance.date) == today.month,
        db.extract("year",  Attendance.date) == today.year,
    ).all()
    total_visits = len(records)
    durations    = [r.duration_mins for r in records if r.duration_mins]
    avg_duration = int(sum(durations) / len(durations)) if durations else 0
    return jsonify({"total_visits_this_month": total_visits, "avg_duration_mins": avg_duration}), 200


# ── GET /api/attendance/my-report ─────────────────────────────────────
@attendance_bp.route("/my-report", methods=["GET"])
@jwt_required()
def my_report():
    member_id = int(get_jwt_identity())
    admission = Admission.query.filter_by(member_id=member_id, is_active=True).first()
    records   = Attendance.query.filter_by(member_id=member_id)\
                  .order_by(Attendance.date.desc()).all()
    visited_dates = [r.date.isoformat() for r in records]
    total_visits  = len(records)
    total_mins    = sum(r.duration_mins for r in records if r.duration_mins)
    plan_days     = admission.plan.duration_days if admission and admission.plan else 30
    days_since    = (get_ist_date() - admission.admission_date.date()).days if admission else 0
    return jsonify({
        "total_visits":    total_visits,
        "total_mins":      total_mins,
        "plan_days":       plan_days,
        "days_since_join": days_since,
        "visited_dates":   visited_dates,
        "attendance_pct":  round((total_visits / max(days_since, 1)) * 100),
        "records":         [r.to_dict() for r in records],
    }), 200


# ── GET /api/attendance/live (admin) ──────────────────────────────────
@attendance_bp.route("/live", methods=["GET"])
@admin_required
def live():
    records = Attendance.query.filter_by(date=get_ist_date(), status="Present").all()
    return jsonify([r.to_dict() for r in records]), 200


# ── GET /api/attendance/all (admin) ───────────────────────────────────
@attendance_bp.route("/all", methods=["GET"])
@admin_required
def all_records():
    query = Attendance.query
    if request.args.get("date"):
        query = query.filter_by(date=request.args.get("date"))
    if request.args.get("shift"):
        query = query.filter_by(shift=request.args.get("shift"))
    if request.args.get("member_id"):
        query = query.filter_by(member_id=request.args.get("member_id"))
    records = query.order_by(Attendance.date.desc(), Attendance.check_in_time.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


# ── GET /api/attendance/today-visited (admin) ─────────────────────────
@attendance_bp.route("/today-visited", methods=["GET"])
@admin_required
def today_visited():
    today   = get_ist_date()
    records = Attendance.query.filter_by(date=today)\
                .order_by(Attendance.check_in_time.asc()).all()
    return jsonify({
        "date":    today.isoformat(),
        "count":   len(records),
        "records": [r.to_dict() for r in records],
    }), 200


# ── GET /api/attendance/date-wise (admin + member) ────────────────────
@attendance_bp.route("/date-wise", methods=["GET"])
@jwt_required()
def date_wise():
    user          = User.query.get(get_jwt_identity())
    selected_date = request.args.get("date", get_ist_date().isoformat())

    if user.role == "admin":
        records = Attendance.query.filter_by(date=selected_date)\
                    .order_by(Attendance.check_in_time.asc()).all()
        return jsonify({
            "date":    selected_date,
            "count":   len(records),
            "records": [r.to_dict() for r in records],
        }), 200
    else:
        record = Attendance.query.filter_by(
            member_id=user.id, date=selected_date
        ).first()
        return jsonify({
            "date":   selected_date,
            "record": record.to_dict() if record else None,
        }), 200


# ── GET /api/attendance/member-full-report/<id> (admin) ───────────────
@attendance_bp.route("/member-full-report/<int:mid>", methods=["GET"])
@admin_required
def member_full_report(mid):
    member    = User.query.get_or_404(mid)
    admission = Admission.query.filter_by(member_id=mid, is_active=True).first()
    records   = Attendance.query.filter_by(member_id=mid)\
                  .order_by(Attendance.date.desc()).all()
    visited_dates = [r.date.isoformat() for r in records]
    total_visits  = len(records)
    total_mins    = sum(r.duration_mins for r in records if r.duration_mins)
    plan_days     = admission.plan.duration_days if admission and admission.plan else 30
    days_since    = (get_ist_date() - admission.admission_date.date()).days if admission else 0
    return jsonify({
        "member":          member.to_dict(),
        "admission":       admission.to_dict() if admission else None,
        "total_visits":    total_visits,
        "total_mins":      total_mins,
        "plan_days":       plan_days,
        "days_since_join": days_since,
        "visited_dates":   visited_dates,
        "attendance_pct":  round((total_visits / max(days_since, 1)) * 100),
        "records":         [r.to_dict() for r in records],
    }), 200


# ── POST /api/attendance/admin-checkin ────────────────────────────────
@attendance_bp.route("/admin-checkin", methods=["POST"])
@admin_required
def admin_checkin():
    data      = request.get_json()
    member_id = data.get("member_id")
    shift     = data.get("shift", "Morning")
    member    = User.query.get(member_id)
    if not member:
        return jsonify({"error": "Member not found"}), 404
    admission = Admission.query.filter_by(member_id=member_id, is_active=True).first()
    if not admission:
        return jsonify({"error": "No active membership for this member"}), 403
    if admission.fee_status == "Overdue":
        return jsonify({"error": "Fee is overdue"}), 403
    today    = get_ist_date()
    existing = Attendance.query.filter_by(member_id=member_id, date=today, status="Present").first()
    if existing:
        return jsonify({"error": f"{member.username} is already checked in"}), 409
    record = Attendance(
        member_id    = member_id,
        admission_id = admission.id,
        shift        = shift,
        check_in_time= get_ist_now().replace(tzinfo=None),
        date         = today,
        status       = "Present",
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": f"{member.username} checked in successfully", "attendance": record.to_dict()}), 201


# ── POST /api/attendance/admin-checkout ───────────────────────────────
@attendance_bp.route("/admin-checkout", methods=["POST"])
@admin_required
def admin_checkout():
    data      = request.get_json()
    member_id = data.get("member_id")
    today     = get_ist_date()
    record    = Attendance.query.filter_by(member_id=member_id, date=today, status="Present").first()
    if not record:
        return jsonify({"error": "Member is not checked in today"}), 404
    now                   = get_ist_now().replace(tzinfo=None)
    record.check_out_time = now
    record.duration_mins  = calculate_duration(record.check_in_time, now)
    record.status         = "Checked-Out"
    db.session.commit()
    member = User.query.get(member_id)
    return jsonify({"message": f"{member.username} checked out. Duration: {record.duration_mins} mins", "attendance": record.to_dict()}), 200


# ── PUT /api/attendance/<id>/force-checkout (admin) ───────────────────
@attendance_bp.route("/<int:record_id>/force-checkout", methods=["PUT"])
@admin_required
def force_checkout(record_id):
    record = Attendance.query.get_or_404(record_id)
    if record.status == "Checked-Out":
        return jsonify({"error": "Already checked out"}), 400
    now                   = get_ist_now().replace(tzinfo=None)
    record.check_out_time = now
    record.duration_mins  = calculate_duration(record.check_in_time, now)
    record.status         = "Checked-Out"
    db.session.commit()
    return jsonify({"message": "Force checkout applied", "attendance": record.to_dict()}), 200


# ── GET /api/attendance/inactive (admin) ──────────────────────────────
@attendance_bp.route("/inactive", methods=["GET"])
@admin_required
def inactive():
    from datetime import timedelta
    days    = int(request.args.get("days", 7))
    cutoff  = get_ist_date() - timedelta(days=days)
    members = User.query.filter_by(role="member").all()
    result  = []
    for m in members:
        last = Attendance.query.filter_by(member_id=m.id)\
                 .order_by(Attendance.date.desc()).first()
        if not last or last.date < cutoff:
            d = m.to_dict()
            d["last_visit"] = last.date.isoformat() if last else None
            result.append(d)
    return jsonify(result), 200


# ── GET /api/attendance/shift-report (admin) ──────────────────────────
@attendance_bp.route("/shift-report", methods=["GET"])
@admin_required
def shift_report():
    today   = get_ist_date()
    morning = Attendance.query.filter_by(date=today, shift="Morning").count()
    evening = Attendance.query.filter_by(date=today, shift="Evening").count()
    full    = Attendance.query.filter_by(date=today, shift="Full Day").count()
    return jsonify({"date": today.isoformat(), "Morning": morning, "Evening": evening, "Full Day": full, "total": morning + evening + full}), 200


# ── GET /api/attendance/members-status (admin) ────────────────────────
@attendance_bp.route("/members-status", methods=["GET"])
@admin_required
def members_status():
    today   = get_ist_date()
    members = User.query.filter_by(role="member").all()
    result  = []
    for m in members:
        admission = Admission.query.filter_by(member_id=m.id, is_active=True).first()
        if not admission:
            continue
        today_record = Attendance.query.filter_by(member_id=m.id, date=today).first()
        result.append({
            "member_id":      m.id,
            "username":       m.username,
            "phone":          m.phone,
            "plan_name":      admission.plan.name if admission.plan else None,
            "fee_status":     admission.fee_status,
            "shift":          data_get_shift(admission.plan.name if admission.plan else ""),
            "today_status":   today_record.status if today_record else "Not checked in",
            "check_in_time":  today_record.check_in_time.isoformat() if today_record and today_record.check_in_time else None,
            "check_out_time": today_record.check_out_time.isoformat() if today_record and today_record.check_out_time else None,
            "duration_mins":  today_record.duration_mins if today_record else None,
            "attendance_id":  today_record.id if today_record else None,
        })
    return jsonify(result), 200


def data_get_shift(plan_name):
    if not plan_name:
        return "Morning"
    name = plan_name.lower()
    if "elite" in name:
        return "Full Day"
    return "Morning"