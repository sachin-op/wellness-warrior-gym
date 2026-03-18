from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, MembershipPlan, Trainer, Admission, Enquiry, Attendance, Payment
from functools import wraps
from datetime import datetime, timedelta
import json

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity())
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper

# ── GET /api/admin/dashboard ──────────────────────────────────────────
@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    from datetime import date
    from utils.helpers import get_ist_date
    today           = get_ist_date()
    total_members   = User.query.filter_by(role="member").count()
    active_admissions = Admission.query.filter_by(is_active=True).count()
    overdue         = Admission.query.filter_by(fee_status="Overdue").count()
    pending_count   = User.query.filter_by(role="member", status="pending").count()
    today_attendance = Attendance.query.filter_by(date=today).count()
    pending_enquiries = Enquiry.query.filter_by(is_resolved=False).count()
    # revenue from payments
    from sqlalchemy import func
    total_revenue = db.session.query(func.sum(Payment.amount)).filter_by(status="Success").scalar() or 0
    return jsonify({
        "total_members":      total_members,
        "active_admissions":  active_admissions,
        "overdue_members":    overdue,
        "total_revenue":      total_revenue,
        "today_attendance":   today_attendance,
        "pending_enquiries":  pending_enquiries,
        "pending_approvals":  pending_count,
    }), 200


# ── REVENUE STATS ─────────────────────────────────────────────────────
@admin_bp.route("/revenue-stats", methods=["GET"])
@admin_required
def revenue_stats():
    from sqlalchemy import func
    from utils.helpers import get_ist_date
    today = get_ist_date()

    # total collected (all payments)
    total_collected = db.session.query(func.sum(Payment.amount))\
        .filter_by(status="Success").scalar() or 0

    # this month collected
    month_collected = db.session.query(func.sum(Payment.amount))\
        .filter(
            Payment.status == "Success",
            db.extract("month", Payment.payment_date) == today.month,
            db.extract("year",  Payment.payment_date) == today.year,
        ).scalar() or 0

    # pending collection (Due admissions)
    due_admissions = Admission.query.filter_by(fee_status="Due", is_active=True).all()
    pending_amount = sum(a.plan.price for a in due_admissions if a.plan) 

    # overdue amount
    overdue_admissions = Admission.query.filter_by(fee_status="Overdue", is_active=True).all()
    overdue_amount = sum(a.plan.price for a in overdue_admissions if a.plan)

    # plan-wise breakdown
    plans     = MembershipPlan.query.all()
    plan_data = []
    for p in plans:
        count    = Admission.query.filter_by(plan_id=p.id, is_active=True).count()
        revenue  = db.session.query(func.sum(Payment.amount))\
            .join(Admission, Payment.admission_id == Admission.id)\
            .filter(Admission.plan_id == p.id, Payment.status == "Success")\
            .scalar() or 0
        if count > 0:
            plan_data.append({
                "plan_id":       p.id,
                "plan_name":     p.name,
                "plan_type":     p.plan_type,
                "duration_label":p.duration_label,
                "is_offer":      p.is_offer,
                "offer_label":   p.offer_label,
                "member_count":  count,
                "revenue":       revenue,
            })

    # fee status breakdown
    paid_count    = Admission.query.filter_by(fee_status="Paid",    is_active=True).count()
    due_count     = Admission.query.filter_by(fee_status="Due",     is_active=True).count()
    overdue_count = Admission.query.filter_by(fee_status="Overdue", is_active=True).count()

    # offer enrollments
    offer_plans   = [p.id for p in plans if p.is_offer]
    offer_count   = Admission.query.filter(
        Admission.plan_id.in_(offer_plans), Admission.is_active == True
    ).count() if offer_plans else 0

    return jsonify({
        "total_collected":  total_collected,
        "month_collected":  month_collected,
        "pending_amount":   pending_amount,
        "overdue_amount":   overdue_amount,
        "paid_count":       paid_count,
        "due_count":        due_count,
        "overdue_count":    overdue_count,
        "offer_enrollments":offer_count,
        "plan_breakdown":   plan_data,
    }), 200


# ── MONTHLY REVENUE (last 12 months) ──────────────────────────────────
@admin_bp.route("/monthly-revenue", methods=["GET"])
@admin_required
def monthly_revenue():
    from utils.helpers import get_ist_date
    from sqlalchemy import func
    today    = get_ist_date()
    result   = []
    for i in range(11, -1, -1):
        target = today.replace(day=1) - timedelta(days=i*30)
        month  = target.month
        year   = target.year
        amount = db.session.query(func.sum(Payment.amount))\
            .filter(
                Payment.status == "Success",
                db.extract("month", Payment.payment_date) == month,
                db.extract("year",  Payment.payment_date) == year,
            ).scalar() or 0
        result.append({
            "month": target.strftime("%b %Y"),
            "amount": amount,
        })
    return jsonify(result), 200


# ── PLANS ─────────────────────────────────────────────────────────────
@admin_bp.route("/plans", methods=["GET"])
@admin_required
def get_plans():
    plans = MembershipPlan.query.order_by(MembershipPlan.plan_type, MembershipPlan.duration_days).all()
    return jsonify([p.to_dict() for p in plans]), 200

@admin_bp.route("/plans", methods=["POST"])
@admin_required
def add_plan():
    data = request.get_json()
    plan = MembershipPlan(
        name           = data["name"],
        plan_type      = data.get("plan_type", "Starter"),
        duration_days  = int(data["duration_days"]),
        duration_label = data.get("duration_label", "1 Month"),
        price          = int(data["price"]),
        original_price = int(data["original_price"]) if data.get("original_price") else None,
        features       = json.dumps(data.get("features", [])),
        is_offer       = bool(data.get("is_offer", False)),
        offer_label    = data.get("offer_label"),
        is_active      = True,
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify(plan.to_dict()), 201

@admin_bp.route("/plans/<int:plan_id>", methods=["PUT"])
@admin_required
def update_plan(plan_id):
    plan = MembershipPlan.query.get_or_404(plan_id)
    data = request.get_json()
    plan.name           = data.get("name",           plan.name)
    plan.plan_type      = data.get("plan_type",      plan.plan_type)
    plan.duration_days  = int(data.get("duration_days",  plan.duration_days))
    plan.duration_label = data.get("duration_label", plan.duration_label)
    plan.price          = int(data.get("price",          plan.price))
    plan.original_price = int(data["original_price"]) if data.get("original_price") else None
    plan.is_offer       = bool(data.get("is_offer",      plan.is_offer))
    plan.offer_label    = data.get("offer_label",    plan.offer_label)
    plan.is_active      = bool(data.get("is_active",     plan.is_active))
    if "features" in data:
        plan.features   = json.dumps(data["features"])
    db.session.commit()
    return jsonify(plan.to_dict()), 200

@admin_bp.route("/plans/<int:plan_id>", methods=["DELETE"])
@admin_required
def delete_plan(plan_id):
    plan = MembershipPlan.query.get_or_404(plan_id)
    db.session.delete(plan)
    db.session.commit()
    return jsonify({"message": "Plan deleted"}), 200

@admin_bp.route("/plans/<int:plan_id>/toggle", methods=["PUT"])
@admin_required
def toggle_plan(plan_id):
    plan = MembershipPlan.query.get_or_404(plan_id)
    plan.is_active = not plan.is_active
    db.session.commit()
    return jsonify({"message": f"Plan {'activated' if plan.is_active else 'deactivated'}", "plan": plan.to_dict()}), 200


# ── TRAINERS ──────────────────────────────────────────────────────────
@admin_bp.route("/trainers", methods=["GET"])
@admin_required
def get_trainers():
    return jsonify([t.to_dict() for t in Trainer.query.all()]), 200

@admin_bp.route("/trainers", methods=["POST"])
@admin_required
def add_trainer():
    data = request.get_json()
    t = Trainer(name=data["name"], role=data["role"], bio=data.get("bio"),
        specializations=json.dumps(data.get("specializations",[])), image_url=data.get("image_url"))
    db.session.add(t); db.session.commit()
    return jsonify(t.to_dict()), 201

@admin_bp.route("/trainers/<int:tid>", methods=["PUT"])
@admin_required
def update_trainer(tid):
    t = Trainer.query.get_or_404(tid); data = request.get_json()
    t.name=data.get("name",t.name); t.role=data.get("role",t.role)
    t.bio=data.get("bio",t.bio); t.image_url=data.get("image_url",t.image_url)
    if "specializations" in data: t.specializations=json.dumps(data["specializations"])
    db.session.commit(); return jsonify(t.to_dict()), 200

@admin_bp.route("/trainers/<int:tid>", methods=["DELETE"])
@admin_required
def delete_trainer(tid):
    t = Trainer.query.get_or_404(tid); db.session.delete(t); db.session.commit()
    return jsonify({"message": "Trainer deleted"}), 200


# ── MEMBERS ───────────────────────────────────────────────────────────
@admin_bp.route("/members", methods=["GET"])
@admin_required
def get_members():
    members = User.query.filter_by(role="member").all()
    result  = []
    for m in members:
        d = m.to_dict()
        if m.admission:
            d["admission"] = m.admission.to_dict()
            d["payments"]  = [p.to_dict() for p in m.admission.payments]
        result.append(d)
    return jsonify(result), 200

@admin_bp.route("/members/<int:mid>/mark-paid", methods=["PUT"])
@admin_required
def mark_paid(mid):
    data           = request.get_json() or {}
    admission      = Admission.query.filter_by(member_id=mid, is_active=True).first()
    if not admission:
        return jsonify({"error": "No active admission found"}), 404

    amount         = int(data.get("amount", admission.plan.price if admission.plan else 0))
    payment_method = data.get("payment_method", "Cash")
    notes          = data.get("notes", "Payment recorded")
    plan_price     = admission.plan.price if admission.plan else 0

    # add to total paid
    admission.amount_paid = (admission.amount_paid or 0) + amount

    # auto update status
    if admission.amount_paid >= plan_price:
        admission.fee_status  = "Paid"
        admission.amount_paid = plan_price  # cap at plan price
    else:
        admission.fee_status = "Partial"

    # record payment
    payment = Payment(
        admission_id   = admission.id,
        amount         = amount,
        payment_method = payment_method,
        recorded_by    = int(get_jwt_identity()),
        notes          = notes,
        status         = "Success",
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({
        "message":   f"Payment of ₹{amount} recorded. Status: {admission.fee_status}",
        "admission": admission.to_dict(),
    }), 200

@admin_bp.route("/members/<int:mid>", methods=["DELETE"])
@admin_required
def remove_member(mid):
    user = User.query.get_or_404(mid)
    db.session.delete(user); db.session.commit()
    return jsonify({"message": "Member removed"}), 200


# ── PENDING ───────────────────────────────────────────────────────────
@admin_bp.route("/pending", methods=["GET"])
@admin_required
def get_pending():
    pending = User.query.filter_by(role="member", status="pending").all()
    return jsonify([u.to_dict() for u in pending]), 200


# ── APPROVE (with plan + payment) ─────────────────────────────────────
@admin_bp.route("/approve/<int:uid>", methods=["POST"])
@admin_required
def approve_member(uid):
    user = User.query.get_or_404(uid)
    if user.status != "pending":
        return jsonify({"error": "Member is not pending"}), 400

    data           = request.get_json()
    plan_id        = data.get("plan_id")
    payment_method = data.get("payment_method", "Cash")
    amount_paid    = data.get("amount_paid")
    notes          = data.get("notes", "Initial enrollment payment")

    if not plan_id:
        return jsonify({"error": "Please select a plan for this member"}), 400

    plan = MembershipPlan.query.get(plan_id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404

    # generate registration number WW-YYYY-XXX
    year  = datetime.utcnow().year
    count = User.query.filter(User.role=="member", User.reg_number!=None).count() + 1
    reg_number = f"WW-{year}-{str(count).zfill(3)}"

    # update user
    user.status      = "active"
    user.reg_number  = reg_number
    user.approved_at = datetime.utcnow()
 
    # create admission
    from utils.helpers import get_expiry_date
    now       = datetime.utcnow()
    admission = Admission(
        member_id      = user.id,
        plan_id        = plan.id,
        admission_date = now,
        expiry_date    = get_expiry_date(now, plan.duration_days),
        fee_status     = "Paid" if (amount_paid or plan.price) >= plan.price else "Partial",
        amount_paid    = amount_paid or plan.price,
        is_active      = True,
    )
    db.session.add(admission)
    db.session.flush()

    # record payment
    payment = Payment(
        admission_id   = admission.id,
        amount         = amount_paid or plan.price,
        payment_method = payment_method,
        recorded_by    = int(get_jwt_identity()),
        notes          = notes,
        status         = "Success",
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "message":    f"Member approved! Registration: {reg_number}",
        "reg_number": reg_number,
        "user":       user.to_dict(),
        "admission":  admission.to_dict(),
    }), 200


# ── TERMINATE / REACTIVATE ────────────────────────────────────────────
@admin_bp.route("/terminate/<int:uid>", methods=["POST"])
@admin_required
def terminate_member(uid):
    user   = User.query.get_or_404(uid)
    data   = request.get_json()
    user.status           = "terminated"
    user.terminated_at    = datetime.utcnow()
    user.terminate_reason = data.get("reason", "Terminated by admin")
    db.session.commit()
    return jsonify({"message": f"{user.username} terminated", "user": user.to_dict()}), 200

@admin_bp.route("/reactivate/<int:uid>", methods=["POST"])
@admin_required
def reactivate_member(uid):
    user = User.query.get_or_404(uid)

    # if member never had reg number → send back to pending
    # so admin can approve properly with plan selection
    if not user.reg_number:
        user.status           = "pending"
        user.terminated_at    = None
        user.terminate_reason = None
        db.session.commit()
        return jsonify({
            "message": f"{user.username} moved to Pending — please approve with plan selection to generate registration number.",
            "needs_approval": True,
            "user": user.to_dict(),
        }), 200

    # member had reg number before → simple reactivate
    user.status           = "active"
    user.terminated_at    = None
    user.terminate_reason = None
    db.session.commit()
    return jsonify({
        "message": f"{user.username} reactivated. Registration number {user.reg_number} is active again.",
        "needs_approval": False,
        "user": user.to_dict(),
    }), 200


# ── ENQUIRIES ─────────────────────────────────────────────────────────
@admin_bp.route("/enquiries", methods=["GET"])
@admin_required
def get_enquiries():
    return jsonify([e.to_dict() for e in Enquiry.query.order_by(Enquiry.created_at.desc()).all()]), 200

@admin_bp.route("/enquiries/<int:eid>/resolve", methods=["PUT"])
@admin_required
def resolve_enquiry(eid):
    e = Enquiry.query.get_or_404(eid)
    e.is_resolved = True; db.session.commit()
    return jsonify({"message": "Resolved"}), 200


# ── OVERDUE ───────────────────────────────────────────────────────────
@admin_bp.route("/overdue", methods=["GET"])
@admin_required
def get_overdue():
    overdue = Admission.query.filter_by(fee_status="Overdue", is_active=True).all()
    result  = []
    for a in overdue:
        d = a.to_dict()
        d["member"] = a.member.to_dict() if a.member else None
        result.append(d)
    return jsonify(result), 200


# ── SEARCH ────────────────────────────────────────────────────────────
@admin_bp.route("/search", methods=["GET"])
@admin_required
def search():
    q       = request.args.get("q", "")
    members = User.query.filter(
        User.role == "member",
        db.or_(User.username.ilike(f"%{q}%"), User.email.ilike(f"%{q}%"))
    ).all()
    return jsonify([m.to_dict() for m in members]), 200